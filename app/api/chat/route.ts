import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isGroundedTopic } from '@/lib/tutor-grounding';
import { isProUser, FREE_DAILY_CHAT, PRO_DAILY_CHAT } from '@/lib/access';
import {
  AI_DAILY_LIMIT, QUOTA_EXHAUSTED_MESSAGE, quotaEnforced, quotaShadowed,
  reserveAiCall, releaseAiCall,
} from '@/lib/ai-quota';
import { buildTutorSystem } from '@/lib/agents/prompts';
import { normalizeUnitLevel, normalizeFormNumber, MAX_CONTEXT_LEN } from '@/lib/agents/config';
import { logCost } from '@/lib/mathscan/cost';
import { recordTutorTrace } from '@/lib/tutor-trace-store';
import { findLearnedAnswer, captureAnswer, countHit } from '@/lib/tutor-answer-library';
import { isQuestion, NOT_A_QUESTION_REPLY } from '@/lib/is-question';
import { sanitizeClientTrace } from '@/lib/tutor-telemetry';
import { TUTOR_TOOLS, resolveSuggestion } from '@/lib/agents/tools';
import { readFacts, writeFacts, mergeFact, renderMemoryBlock } from '@/lib/tutor-memory';
// One copy of the injection guard, in one place. This file used to keep its
// own literal of the same regex — which is exactly how a fix in one copy
// leaves the other one broken.
import { BLACKLIST, logAgentUsage } from '@/lib/agents/guard';

// Hobby plan needs an explicit ceiling. Haiku 4.5 with a tight 6-message
// context + max_tokens=800 typically finishes in 5-15s, well under 60s.
export const maxDuration = 60;

// ===== LIMITS =====
const MAX_MESSAGE_LEN = 500;
const MIN_MESSAGE_LEN = 1;
// Daily cap is tier-based: free students get FREE_DAILY_CHAT, Pro get a
// much higher (effectively unlimited) ceiling. The cap itself is a gentle
// conversion lever — a heavy free user feels the wall and upgrades.
/**
 * Replayed history, in messages. 4 = the last 2 user/assistant pairs.
 *
 * MEASURED (scripts/measure-chat-turn.ts): dropping from 6 to 4 saves $0.00006
 * of a $0.00316 warm turn — 1.9%. It is here because it is free to do, not
 * because it is a lever; history sits AFTER the cached prefix, so it is pure
 * token cost and invalidates nothing.
 *
 * ⚠️ The floor is 4, and lowering it further would cost more than it saves.
 * This tutor is Socratic: it asks a question and waits. With 2 pairs it can
 * still see the hint it just gave and what the student did with it. With 1 it
 * would start repeating hints, and a repeated hint buys another turn — which
 * is ~50x the saving.
 */
const CONTEXT_MESSAGE_COUNT = 4;
/**
 * Per-turn cap on a history message the CLIENT supplies.
 *
 * The stored history is model replies, which the reply budget already caps at
 * 200-500 tokens. A local reply can be a whole authored solution, so without
 * this the same four-message window could double in tokens — and "the model can
 * see itself now" would have been bought with the money it was meant to save.
 * 500 characters of Hebrew is roughly 190 tokens, about what a stored reply
 * costs.
 */
const MAX_TURN_LEN = 500;

// ===== REPLY BUDGET — per turn, not one flat number =====
//
// ⚠️ READ THIS BEFORE LOWERING ANY NUMBER BELOW. IT WAS TRIED AND MEASURED.
//
// HAIKU 4.5 WRITES UNTIL IT IS STOPPED. It has no natural reply length that a
// prompt can shrink — it expands to fill whatever `max_tokens` allows and is
// then cut off mid-sentence. MEASURED on real סדרות/הסתברות turns (2026-08-27):
// the same question produced 80 output tokens at a 140 cap and 376 at a 400
// cap, both ending naturally. Two attempts to make the prompt bind instead:
//
//   TUTOR_CORE brevity rules, list ban, "פסקה אחת"    5/9 nudge turns truncated
//   + an explicit "עד 45 מילים" budget, restated as
//     the LAST block in the system prompt              7/9 nudge turns truncated
//
// The prompt DOES control the SHAPE — no greetings, no bullet lists, ends on a
// guiding question. It does not control the LENGTH.
//
// So a low cap is not a saving, it is a truncation: a cut-off answer makes the
// student ask again, costing a whole extra turn (~$0.0013) to save ~$0.0004.
// These numbers are sized NOT to bind, which took truncation from 10/18 to 3/18.
//
// The reason a flat number is wrong at all is architectural: by the time a
// message reaches this route the client has already answered every
// "אני תקוע / רמז / למה טעיתי / איזו נוסחה" from authored content
// (lib/tutor-local, then the FAQ bank). What arrives here is SELECTED FOR being
// what local content could not answer — disproportionately concept questions,
// which legitimately need length. Sizing the whole route for the nudge case
// starves exactly the traffic it gets.

/** A NUDGE on an exercise the student is looking at: one point, one question. */
const REPLY_TOKENS_NUDGE = 200;
/** A CONCEPT question with no exercise on screen — "מה זה הסתברות מותנית". */
const REPLY_TOKENS_CONCEPT = 400;
/** The two long-path exceptions TUTOR_CORE names. */
const REPLY_TOKENS_FULL = 500;

/**
 * The student has stopped working and wants it laid out. Mirrors GIVE_UP and
 * the `full` ask in lib/tutor-router — the client normally answers these from
 * authored content, so what reaches here is the case with no question object.
 */
const WANTS_FULL =
  /פתרון\s*מלא|הפתרון\s*המלא|תפתור|תפתרי|תראה\s*לי\s*את\s*הפתרון|כל\s*הצעדים|צעד\s*אחר\s*צעד|הסבר\s*מלא|אני\s*מוותר|פשוט\s*תגיד|תגיד\s*לי\s*כבר|נמאס|אין\s*לי\s*כוח/;

/**
 * How many tokens this reply may take.
 *
 * `hasQuestionOnScreen` comes from `faqMiss`, which the bubble sets ONLY when a
 * real question object was in focus and both local layers abstained. /chat and
 * the bubble-opened-away-from-a-question case never send it, and those are
 * precisely the concept-question surfaces.
 *
 * `priorAssistantTurns` counts assistant messages in the replayed window, capped
 * at CONTEXT_MESSAGE_COUNT / 2 = 2 pairs. `>= 2` means two hints have already
 * been given — the exact trigger TUTOR_CORE names for a direct, full explanation.
 */
function replyBudget(
  message: string,
  priorAssistantTurns: number,
  hasQuestionOnScreen: boolean,
): number {
  if (WANTS_FULL.test(message) || priorAssistantTurns >= 2) return REPLY_TOKENS_FULL;
  return hasQuestionOnScreen ? REPLY_TOKENS_NUDGE : REPLY_TOKENS_CONCEPT;
}

// Block obvious prompt-injection / abuse markers — same lightweight check
// we run on the quiz topic input.

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function todayStartIso(): string {
  // Use UTC midnight as the daily reset boundary. Predictable across
  // server regions; user sees "20 a day, resets at midnight UTC".
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
  // Wall clock for the trace. Taken at the very top so it measures what the
  // student waited for, not just the model call.
  const startedAt = Date.now();
  try {
    // ===== 1. ORIGIN VALIDATION =====
    if (!isAllowedOrigin(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ===== 2. BOT DETECTION =====
    if (looksLikeBot(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ===== 3. EDGE RATE LIMITING (IP/UA fingerprint) =====
    const fingerprint = getFingerprint(request);
    const limit = checkRateLimit(fingerprint);
    if (!limit.allowed) {
      const msg =
        limit.reason === 'minute'
          ? 'יותר מדי בקשות. נסה שוב בעוד דקה.'
          : limit.reason === 'hour'
          ? 'הגעת למכסת השעה. נסה שוב בעוד שעה.'
          : 'המערכת עמוסה כרגע. נסה שוב בעוד דקה.';
      return Response.json(
        { error: msg },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    // ===== 4. CONTENT-TYPE =====
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 415 });
    }

    // ===== 5. AUTH =====
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    // ===== 6. PARSE & VALIDATE BODY =====
    let body: {
      message?: unknown;
      topic?: unknown;
      context?: unknown;
      conversationId?: unknown;
      unitLevel?: unknown;
      formNumber?: unknown;
      /** Unit id when the client's local tutor + FAQ bank both abstained. */
      faqMiss?: unknown;
      /** The turns the client has on screen, INCLUDING the local ones this
       *  route never stored. Validated at the boundary like everything else
       *  the client sends — see section 8b. */
      recent?: unknown;
      /** Diagnostics from the client: why the local layers declined. Validated
       *  in lib/tutor-telemetry before any of it is stored. */
      trace?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    // Optional conversation id — scopes this turn to one saved conversation.
    // Absent on a fresh chat's first message (we create the conversation).
    const bodyConversationId =
      typeof body.conversationId === 'string' && body.conversationId.length > 0
        ? body.conversationId
        : null;
    // Optional pilot context: `topic` enables the grounded "private tutor"
    // behaviour (complex numbers only), and `context` is a snapshot of the
    // question/attempt the student is on — lets the tutor diagnose first.
    const topic = typeof body.topic === 'string' ? body.topic.trim().slice(0, 80) : '';
    // One constant, shared with the bubble that builds this string — a cap
    // written as a literal here drifted from the client's once already.
    const attemptContext =
      typeof body.context === 'string' ? body.context.trim().slice(0, MAX_CONTEXT_LEN) : '';
    // Level + שאלון drive how deep the tutor goes. Absent (older client, cached
    // JS) → the normalizers fall back to 5 units / 572, i.e. today's behaviour.
    const unitLevel = normalizeUnitLevel(body.unitLevel);
    const formNumber = normalizeFormNumber(body.formNumber);
    if (message.length < MIN_MESSAGE_LEN) {
      return Response.json({ error: 'הודעה ריקה' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return Response.json(
        { error: `הודעה ארוכה מדי (מקסימום ${MAX_MESSAGE_LEN} תווים)` },
        { status: 400 }
      );
    }
    if (BLACKLIST.test(message)) {
      return Response.json({ error: 'הודעה לא חוקית' }, { status: 400 });
    }
    // The client tried the authored tutor and the per-question FAQ bank and
    // both abstained. Logged with the unit id so `grep '[faq-miss]'` in the
    // Vercel logs is literally the list of what to author next — the bank
    // grows from what students actually ask, not from what we guess.
    // Also the "a real question is on screen" signal for replyBudget below: the
    // bubble sets it only when a question OBJECT was in focus and both local
    // layers abstained, which is exactly the nudge case.
    const faqMiss =
      typeof body.faqMiss === 'string' && body.faqMiss.length > 0 && body.faqMiss.length <= 80
        ? body.faqMiss
        : null;
    if (faqMiss) {
      console.log(`[faq-miss] topic=${topic} unit=${faqMiss.replace(/\s/g, '_')} msg=${JSON.stringify(message.slice(0, 160))}`);
    }

    // ===== 7. DAILY QUOTA CHECK =====
    // Count billed turns since UTC midnight from the append-only usage log
    // (kind 'chat'), NOT from chat_messages: a student may delete his own
    // conversations, and chat_messages cascades with them — so counting
    // messages let anyone reset the quota by deleting the conversation every
    // ten turns. ai_generation_log has no delete policy (2026-08-19 audit, M1).
    const { count: todayCount, error: countError } = await supabase
      .from('ai_generation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kind', 'chat')
      .gte('created_at', todayStartIso());

    // Repo convention for a missing/erroring accounting table: degrade to "no
    // durable cap" and say so loudly, rather than take the whole chat down.
    // The in-memory burst limiter above still applies. (It used to 500 here,
    // but that was when the count came from chat_messages, a table the chat
    // cannot function without anyway.)
    if (countError) {
      console.error('[chat] quota count failed — ai_generation_log missing? capping disabled:', countError.message);
    }

    // ⚠️ TWO QUOTAS EXIST DURING THE ROLLOUT, AND ONLY ONE DECIDES.
    //
    // The old one counts rows in ai_generation_log and charges BEFORE the model
    // is called, so a failed call costs a credit and two parallel requests both
    // pass. The new one reserves in Postgres and gives the credit back when the
    // call produces nothing. While `quotaEnforced` is false the old gate is
    // still the one that blocks — the new counters move in the background so
    // the mechanism can be watched before it is allowed to lock anyone out.
    const enforceV2 = quotaEnforced(user.email);
    const shadowV2 = quotaShadowed(user.email);
    const dailyCap = enforceV2 ? AI_DAILY_LIMIT : isProUser(user) ? PRO_DAILY_CHAT : FREE_DAILY_CHAT;
    const used = countError ? 0 : (todayCount ?? 0);
    if (!enforceV2 && used >= dailyCap) {
      return Response.json(
        {
          error: isProUser(user)
            ? `הגעת למכסת ${dailyCap} ההודעות היומית. חזור מחר.`
            : `הגעת למכסת ${dailyCap} ההודעות היומית בחשבון החינמי. שדרג ל-Pro לצ׳אט ללא הגבלה.`,
          quotaExceeded: true,
          proRequired: !isProUser(user),
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // ===== 7.5 RESOLVE CONVERSATION =====
    // Each chat is a named conversation. On a fresh chat (no id) we create
    // one, titled from the topic or the first message. If the conversations
    // table doesn't exist yet (SQL not run), we degrade to the legacy flat
    // stream: convEnabled=false → messages carry no conversation_id and the
    // context load is unscoped, exactly as before.
    let convId: string | null = bodyConversationId;
    let convEnabled = true;
    if (!convId) {
      const title = (topic || message).slice(0, 40).trim() || 'שיחה חדשה';
      try {
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({ title, topic: topic || null })
          .select('id')
          .single();
        if (convErr || !conv) convEnabled = false;
        else convId = conv.id as string;
      } catch {
        convEnabled = false;
      }
    }

    // ===== 8. LOAD CONTEXT =====
    // Last N messages of THIS conversation, newest first; reverse for Claude.
    let ctxQuery = supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_MESSAGE_COUNT);
    if (convEnabled && convId) ctxQuery = ctxQuery.eq('conversation_id', convId);
    const { data: recentMessages, error: loadError } = await ctxQuery;

    if (loadError) {
      console.error('load context error:', loadError);
      return Response.json({ error: 'שגיאה זמנית. נסה שוב.' }, { status: 500 });
    }

    // Newest-first → chronological. The Messages API requires the first
    // message it receives to be `user`; our fixed 6-row window can begin with
    // an `assistant` row (e.g. after an earlier assistant-insert failure, or
    // when the window boundary lands mid-exchange). Drop any leading
    // assistant messages so the array we build is always user-first — else
    // the call 400s and the student just sees "שגיאת צ'אט".
    const context = (recentMessages ?? []).reverse();
    while (context.length && context[0].role === 'assistant') context.shift();

    // ===== 8b. THE TURNS THE MODEL HAS NEVER BEEN ABLE TO SEE =====
    //
    // ⚠️ `chat_messages` HOLDS ONLY TURNS THAT REACHED THIS ROUTE. Roughly three
    // quarters of what this tutor says is answered locally from authored
    // content and never touches the API, so it is never written here — and the
    // model has been answering with three quarters of the conversation missing.
    //
    // Reported by Itay, with a screenshot:
    //
    //   student   10
    //   tutor     נכון! 10 היא התשובה. 🎯      ← graded locally, never stored
    //   student   בטוח?
    //   tutor     לא, טעות. חשב שוב: ...        ← the model, which saw neither
    //
    // The model was not contradicting itself. It could not see itself. Same
    // cause as the tutor re-offering a hint the student already has.
    //
    // ⚠️ AND IT COSTS NOTHING EXTRA, WHICH IS THE POINT. These REPLACE rows in
    // the same CONTEXT_MESSAGE_COUNT window rather than being added to it, and
    // each is capped, so the history the model reads is the same size and
    // carries the turns that actually happened.
    const clientTurns: unknown[] = Array.isArray(body.recent) ? body.recent : [];
    const recent = clientTurns
      .slice(-CONTEXT_MESSAGE_COUNT)
      .filter(
        (m): m is { role: string; content: string } =>
          !!m &&
          typeof m === 'object' &&
          ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant') &&
          typeof (m as { content?: unknown }).content === 'string',
      )
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.trim().slice(0, MAX_TURN_LEN) }))
      // The trust boundary: this is client-supplied text entering the prompt,
      // exactly like `attemptContext`, and it gets exactly the same guard.
      .filter((m) => m.content.length > 0 && !BLACKLIST.test(m.content));

    // Only when the client actually knows more than the table does. A window
    // that is shorter than the stored one is a client that just opened.
    if (recent.length > context.length) {
      context.length = 0;
      context.push(...recent);
      while (context.length && context[0].role === 'assistant') context.shift();
    }

    // ===== 9. INSERT USER MESSAGE FIRST =====
    // We persist the user turn BEFORE the Claude call so a Claude failure
    // doesn't leave history with an assistant reply that has no preceding
    // user prompt. If Claude fails after this, the user's message is
    // still in their history and the UI can show "(no reply)".
    const userRow: Record<string, unknown> = { role: 'user', content: message };
    if (convEnabled && convId) userRow.conversation_id = convId;
    const { error: insertUserError } = await supabase
      .from('chat_messages')
      .insert(userRow);

    if (insertUserError) {
      console.error('insert user msg error:', insertUserError);
      return Response.json({ error: 'שגיאה בשמירת ההודעה.' }, { status: 500 });
    }
    // ===== 9b. HAVE WE ALREADY PAID FOR THIS ANSWER? =====
    //
    // Before the quota is charged, not after. The daily cap exists to bound
    // what a student can COST, and an answer served from the library costs
    // nothing — charging for it would ration a free thing. So a hit skips
    // `logAgentUsage` entirely and the student's allowance is untouched.
    //
    // The lookup runs here rather than earlier because everything above has
    // to happen either way: the message is in history, the conversation
    // exists, and the reply will stream through the same events. The only
    // difference a hit makes is that no model is called.
    const clientTrace = sanitizeClientTrace(body.trace);
    // ===== 9b-i. IS THERE A QUESTION HERE AT ALL? =====
    //
    // ⚠️ SERVER-SIDE, AND THAT IS THE ARCHITECTURE, NOT A CONVENIENCE.
    //
    // The evidence it needs is a 214 KB lexicon built from every word this app
    // has written — fine here, unacceptable in a browser bundle. Shipping a
    // smaller client-side copy would mean a worse lexicon, and a worse lexicon
    // means telling a student their real question is not a question. The round
    // trip still happens and costs nothing; the model call is the entire cost
    // and it is what this prevents.
    //
    // Measured on the twelve rows that cost $0.06: "ייעיעעיעי", "י", "אוקקי"
    // and a keyboard mash are blocked, and all thirty real messages tested —
    // including "אינדקס", "19", "x=3" and one-word maths terms — pass.
    const asked = isQuestion(message, attemptContext || undefined);
    if (!asked.isQuestion) {
      void recordTutorTrace(
        { ...clientTrace, fallbackReason: 'no_fallback' },
        {
          durationMs: Date.now() - startedAt,
          model: 'gate:not-a-question',
          inputTokens: 0, outputTokens: 0, cachedRead: 0, cachedWrite: 0,
          usedLlm: false,
        },
      );
      // ⚠️ AN SSE STREAM, NOT JSON. The client reads `event:`/`data:` lines and
      // would see a JSON body as an empty stream — a silent blank reply, which
      // is worse than the model call this saves. Same three events a real turn
      // sends, so nothing on the client has to know this path exists.
      // ⚠️ THE REPLY GOES INTO HISTORY TOO.
      //
      // The student's message was already persisted a few lines up. Returning
      // without persisting the answer leaves an orphan question in the thread —
      // on reload they see what they asked and nothing back, which reads as the
      // tutor having failed rather than having answered.
      const gateRow: Record<string, unknown> = {
        role: 'assistant',
        content: NOT_A_QUESTION_REPLY,
        tokens_in: 0,
        tokens_out: 0,
      };
      if (convEnabled && convId) gateRow.conversation_id = convId;
      const { error: gateInsertError } = await supabase.from('chat_messages').insert(gateRow);
      if (gateInsertError) console.error('insert gate reply error:', gateInsertError.message);

      const enc = new TextEncoder();
      const frame = (event: string, data: unknown) =>
        enc.encode(`event: ${event}
data: ${JSON.stringify(data)}

`);
      return new Response(
        new ReadableStream({
          start(c) {
            // ⚠️ NOT `remaining` — that const is declared 130 lines below and
            // this closure runs immediately, which is a ReferenceError at
            // runtime. TypeScript does not flag a temporal-dead-zone use
            // inside a callback, because it cannot know when the callback
            // runs. Nothing was spent here, so the honest number is what the
            // student had on the way in.
            c.enqueue(frame('meta', { conversationId: convEnabled ? convId : null, remaining: Math.max(0, dailyCap - used) }));
            c.enqueue(frame('delta', { text: NOT_A_QUESTION_REPLY }));
            c.enqueue(frame('done', { reply: NOT_A_QUESTION_REPLY }));
            c.close();
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' } },
      );
    }

    const learned = await findLearnedAnswer(clientTrace);

    // ===== 9c. TAKE ONE AI CREDIT =====
    //
    // Here, and nowhere earlier: at this line the local layers have all
    // declined AND the library has nothing, so a model call is certain. A hint,
    // a formula, a written solution or a library hit never reaches this code
    // and therefore never costs a credit — which is the rule, expressed as
    // control flow rather than as a condition somebody has to remember.
    //
    // Given back below on every path where no answer is produced.
    let creditTaken = false;
    let v2Remaining: number | null = null;
    if (!learned && (enforceV2 || shadowV2)) {
      const q = await reserveAiCall(user.id, AI_DAILY_LIMIT);
      creditTaken = q.allowed && q.degraded !== true;
      v2Remaining = q.remaining;
      if (!q.allowed && enforceV2) {
        return Response.json(
          { error: QUOTA_EXHAUSTED_MESSAGE, quotaExceeded: true, localHelpStillFree: true, remaining: 0 },
          { status: 429 },
        );
      }
    }

    if (!learned) {
      // The turn is now committed to history, so it is charged to the quota —
      // same moment as before (the user row), just in the table nobody can empty.
      await logAgentUsage(supabase, user.id, 'chat');
    }

    // ===== 10. CALL ANTHROPIC =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Reserved a credit for a call that will never happen.
      if (creditTaken) await releaseAiCall(user.id);
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    // ===== Grounded "private tutor" — every topic with an authored lesson =====
    // Grounded topics get the tutor-bar system prompt anchored in the verified
    // content, and step up to Sonnet — diagnosis and rephrasing need more
    // depth than Haiku. Ungrounded topics keep the cheap Haiku path.
    //
    // Cost valve: set TUTOR_SONNET_TOPICS (comma-separated topic names) to
    // restrict Sonnet to an allowlist; grounded topics outside it still get
    // the grounded prompt, just on Haiku.
    // The system prompt now comes from lib/agents/prompts — the same Socratic
    // core the /api/chat/tutor agent uses — so the two can't drift apart. It
    // arrives as ordered blocks (stable core + grounding → cached; the
    // level/שאלון line → not cached), which is what lets every student share
    // one cache entry instead of one per level.
    const grounded = isGroundedTopic(topic);

    // Cross-conversation memory. Read before the prompt is built, awaited
    // because it IS part of the prompt — but it degrades to [] on any failure
    // (missing column, RLS, network), so a database problem costs the tutor a
    // remembered fact and never the reply.
    const facts = await readFacts(supabase, user.id);
    const system = buildTutorSystem({
      unitLevel,
      formNumber,
      topic: topic || undefined,
      memory: renderMemoryBlock(facts),
      // The student's own question and its authored solution ride in
      // `attemptContext`. When they are there, the six generic worked examples
      // are a second copy of what the model already has — and the most
      // expensive block in the prompt. See PromptContext.hasQuestion.
      hasQuestion: Boolean(attemptContext),
    });
    // ===== MODEL: Haiku by default, Sonnet only for topics listed in env =====
    //
    // This used to read the other way round — an EMPTY `TUTOR_SONNET_TOPICS`
    // meant "Sonnet for every grounded topic", i.e. for all 13 math lessons,
    // and nobody had set the variable. MEASURED from chat_messages on
    // 2026-08-22 (~1,500 fresh input tokens, ~120 output, 4,759-token cached
    // prefix for הסתברות), per conversation:
    //
    //                      turn 1 (cache write)   each later turn   5 turns
    //   claude-sonnet-4-6        $0.024               $0.0077        $0.055
    //   claude-haiku-4-5         $0.008               $0.0026        $0.018
    //
    // That $0.055 is the "short chat that cost $0.06". Most conversations are
    // 1-3 turns, so the prefix WRITE dominates — and on Sonnet it is 3x.
    //
    // Why Haiku is now safe where it was not: the local tutor answers the six
    // common asks from authored content before this route is reached, and the
    // focus context carries the verified solution steps, so the model guides
    // along a written path instead of re-solving. Sonnet stays one env edit
    // away, per topic, for anything that measurably needs it.
    const sonnetAllowlist = (process.env.TUTOR_SONNET_TOPICS ?? '').trim();
    const useSonnet =
      grounded &&
      sonnetAllowlist !== '' &&
      sonnetAllowlist.split(',').map((s) => s.trim()).includes(topic);
    const model = useSonnet ? 'claude-sonnet-4-6' : 'claude-haiku-4-5';

    // Inject the question/attempt snapshot (if any) into THIS turn only, so
    // the tutor can diagnose what the student is actually working on. We
    // store the raw message in history; the context note is call-only.
    const lastUserContent =
      attemptContext && !BLACKLIST.test(attemptContext)
        ? `[הקשר — התלמיד עובד על:]\n${attemptContext}\n\n${message}`
        : message;

    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...context.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
      })),
      { role: 'user', content: lastUserContent },
    ];

    // ===== 11. STREAM THE REPLY (SSE) =====
    // Streaming is the biggest perceived-latency win — the hint forms word by
    // word instead of behind a spinner. Same tokens, same cost. The assistant
    // persist runs INSIDE the stream body and is AWAITED before close(), so
    // the serverless function stays alive until the DB write completes (the
    // Vercel-serverless trap is doing async work AFTER the response finishes —
    // we don't; we do it before controller.close()).
    const encoder = new TextEncoder();
    const remaining = v2Remaining ?? Math.max(0, dailyCap - (used + 1));
    // Counted off the window that was actually replayed to the model, not off
    // the conversation as a whole — two hints ago is what TUTOR_CORE reacts to.
    const maxTokens = replyBudget(
      message,
      context.filter((m) => m.role === 'assistant').length,
      !!faqMiss,
    );

    const sseStream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        // First frame: conversation id + remaining, so the client can adopt
        // the new conversation and update the counter before any token lands.
        send('meta', { conversationId: convEnabled ? convId : null, remaining });

        let fullText = '';
        let usageIn = 0;
        let usageOut = 0;

        // ===== the answer we already paid for =====
        //
        // Sent as ONE delta rather than typed out character by character. The
        // streaming effect exists to hide the model's latency, and there is no
        // latency to hide — faking it would spend real milliseconds to look
        // slower. Everything after this block is identical to a model turn:
        // the same persist, the same `done` event, the same client code.
        if (learned) {
          fullText = learned.answer;
          send('delta', { text: fullText });
          void countHit(learned.id);
          void recordTutorTrace(
            { ...clientTrace, fallbackReason: 'no_fallback' },
            {
              durationMs: Date.now() - startedAt,
              model: `library:${learned.via}`,
              inputTokens: 0,
              outputTokens: 0,
              cachedRead: 0,
              cachedWrite: 0,
              // ⚠️ THE WHOLE POINT OF THIS BRANCH IS THAT NOTHING WAS PAID.
              //
              // Omitted at first, and the stamp defaults to true — so every
              // library hit was recorded as a model call. Two consequences,
              // both silent: the local rate read LOWER than it was, and
              // report:worklist listed the saved turns as work still to do,
              // labelled "BUG — the trace arrived malformed" because
              // `no_fallback` on a paid row can only mean that.
              //
              // Caught in the first production hit, at 20:41:54, reading
              // `llm=true model=library:same-question in=0`. Zero input tokens
              // and a model called `library` cannot both be a paid call.
              usedLlm: false,
            },
          );
        }

        try {
          // The model is called only when the library had nothing. Everything
          // below — tools, memory, the trace, the capture — belongs to a turn
          // that was actually paid for.
          if (!learned) {
            const stream = client.messages.stream({
              model,
              // Per-turn, not flat — see replyBudget() at the top of this file.
              // 200 nudge / 400 concept / 500 full. Billing is per token
              // GENERATED, so the high branches cost nothing on the turns that
              // do not use them, and the low branch stops a one-line nudge from
              // being budgeted like a full derivation.
              max_tokens: maxTokens,
              // ⚠️ NOT THE DEFAULT 1.0, AND THE REASON IS HEBREW, NOT VARIETY.
              //
              // claude-haiku-4-5 fabricates Hebrew verb forms when it samples
              // freely. Real replies from the live tutor, all of them words
              // that do not exist:
              //
              //   "בטעות הנתת 14 חלקי משהו"      (הזנת)
              //   "אתה חישבת ... והקבלן לך 2.3"   (והתקבל)
              //   "אם המחשבון שלך בוגדר"          (מוגדר)
              //   "בואנו נבנה זאת מחדש"           (בוא נבנה את זה)
              //
              // Hebrew morphology is where a small model's sampling noise
              // shows first: the binyan is almost right and the word is not a
              // word. A/B'd at 0.2 against the default on the same six turns —
              // visibly fewer invented forms, same Socratic behaviour.
              //
              // 0.3 rather than 0: this tutor is told never to repeat an
              // explanation in other words, and greedy decoding is exactly how
              // a model repeats itself.
              temperature: 0.3,
              system,
              messages: claudeMessages,
              // The tutor may suggest an in-app action and may remember a fact.
              // Neither executes anything here: `suggest_action` becomes a button
              // the student chooses to press, and that is why there is no
              // tool_result round-trip and no agent loop — the turn ends when the
              // text ends. ⚠️ Tools serialise ahead of `system` in the cached
              // prefix; editing lib/agents/tools.ts invalidates every tutor cache
              // entry once (see the note there).
              tools: TUTOR_TOOLS,
              // Cost valve: effort:'low' only on the Sonnet path. ⚠️ Haiku 4.5
              // (ungrounded) 400s on effort ("This model does not support the
              // effort parameter"), so gate on useSonnet. Haiku is cheap anyway.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(useSonnet ? ({ output_config: { effort: 'low' } } as any) : {}),
            });

            stream.on('text', (delta: string) => {
              fullText += delta;
              send('delta', { text: delta });
            });

            const final = await stream.finalMessage();

            // ⚠️ This used to read content[0] and assume it was the text block.
            // With tools in play the model can put a tool_use block first, and
            // that assumption silently discarded the authoritative text — so join
            // every text block instead of trusting a position.
            const authoritative = final.content
              .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
              .map((b) => b.text)
              .join('');
            if (authoritative.trim()) fullText = authoritative;

            usageIn = final.usage.input_tokens;
            usageOut = final.usage.output_tokens;
            // Cache-aware cost line for Vercel's logs. `input_tokens` alone hides
            // the prefix: a cached turn and a turn that just WROTE the 4,800-token
            // prefix report the same ~1,500 — and on Sonnet that write is ~$0.018.
            logCost('chat', model, final.usage);
            // The diagnostic row. NOT awaited: the reply has already streamed to
            // the student, and a slow or missing table must not hold the request
            // open. `trace` is whatever the client sent and is validated inside.
            const u = final.usage as unknown as Record<string, number | undefined>;
            void recordTutorTrace(body.trace, {
              durationMs: Date.now() - startedAt,
              model,
              inputTokens: usageIn,
              outputTokens: usageOut,
              cachedRead: u.cache_read_input_tokens ?? 0,
              cachedWrite: u.cache_creation_input_tokens ?? 0,
            });
            // ===== pay for this answer once =====
            //
            // Screened and stored so the next student asking the same thing on
            // the same question is served from the table and no model is
            // called. `screen` decides between 'live' and 'pending': an answer
            // about this exercise's numbers is never served automatically, and
            // one that mentions the student's own attempt is not stored at all.
            //
            // Not awaited, for the same reason as the trace — the reply has
            // already streamed, and a missing table must not hold it open.
            void captureAnswer({
              trace: clientTrace,
              answer: fullText,
              model,
              outputTokens: usageOut,
            });
            if (final.stop_reason === 'max_tokens') {
              console.warn(
                `[truncated] chat reply hit max_tokens (out=${usageOut} cap=${maxTokens}) — the student ` +
                  'got a cut-off answer and will likely ask again, which costs more than the cap saves. ' +
                  // Every branch says "raise it" on purpose. The caps are sized
                  // NOT to bind (measured 3/18), so a hit here means this shape
                  // of turn is genuinely longer than the sample it was
                  // calibrated on — not that the student should have got less.
                  `raise ${maxTokens === REPLY_TOKENS_NUDGE ? 'REPLY_TOKENS_NUDGE' : maxTokens === REPLY_TOKENS_CONCEPT ? 'REPLY_TOKENS_CONCEPT' : 'REPLY_TOKENS_FULL'}.`
              );
            }

            // ===== tool calls: suggestion + memory =====
            // Both are best-effort and deliberately AFTER the text is settled.
            // Nothing here may throw past its own guard: a malformed tool input
            // must not cost the student the answer that already streamed.
            for (const b of final.content) {
              if (b.type !== 'tool_use') continue;

              if (b.name === 'suggest_action') {
                // resolveSuggestion drops anything it cannot map to a real route.
                const action = resolveSuggestion(b.input, 'math5', topic);
                if (action) send('action', action);
                continue;
              }

              if (b.name === 'remember') {
                const fact = (b.input as { fact?: unknown })?.fact;
                if (typeof fact !== 'string' || !fact.trim()) continue;
                // Reject anything the student could have injected into his own
                // profile: the fact is model-authored, but the model was reading
                // the student's message when it wrote it.
                if (BLACKLIST.test(fact)) continue;
                const merged = mergeFact(facts, fact, Date.now());
                if (await writeFacts(supabase, user.id, merged)) {
                  // The client shows what was saved — memory the student can't
                  // see isn't memory, it's a file on him.
                  send('memory', { facts: merged });
                }
              }
            }
          }
        } catch (streamErr) {
          console.error('Chat stream error:', streamErr);
          // ⚠️ THE STUDENT GOT NO ANSWER, SO THE CREDIT GOES BACK.
          //
          // A timeout, a 529, an abort mid-stream — the whole reason the credit
          // is reserved rather than charged is so this line can exist. Awaited:
          // the response is already lost, and letting the function close before
          // the counter is restored would charge for the failure after all.
          if (creditTaken) await releaseAiCall(user.id);
          send('error', { error: "שגיאת צ'אט. נסה שוב." });
          controller.close();
          return;
        }

        // An empty reply is a failed call wearing a success's clothes: the
        // stream ended, nothing threw, and the student has nothing to read.
        if (!fullText.trim() && creditTaken) await releaseAiCall(user.id);

        // ===== persist assistant reply — AWAITED before close() =====
        if (fullText.trim()) {
          const assistantRow: Record<string, unknown> = {
            role: 'assistant',
            content: fullText,
            tokens_in: usageIn,
            tokens_out: usageOut,
          };
          if (convEnabled && convId) assistantRow.conversation_id = convId;
          const { error: insertAssistantError } = await supabase
            .from('chat_messages')
            .insert(assistantRow);
          if (insertAssistantError) {
            console.error('insert assistant msg error:', insertAssistantError);
          }
          // Touch the conversation so it sorts to the top of the sidebar.
          if (convEnabled && convId) {
            const { error: touchErr } = await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
            if (touchErr) console.error('conversation touch error:', touchErr.message);
          }
        }

        send('done', { reply: fullText });
        controller.close();
      },
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json(
      { error: "שגיאת צ'אט. נסה שוב." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
