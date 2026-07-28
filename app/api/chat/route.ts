import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isGroundedTopic } from '@/lib/tutor-grounding';
import { isProUser, FREE_DAILY_CHAT, PRO_DAILY_CHAT } from '@/lib/access';
import { buildTutorSystem } from '@/lib/agents/prompts';
import { normalizeUnitLevel, normalizeFormNumber } from '@/lib/agents/config';

// Hobby plan needs an explicit ceiling. Haiku 4.5 with a tight 6-message
// context + max_tokens=800 typically finishes in 5-15s, well under 60s.
export const maxDuration = 60;

// ===== LIMITS =====
const MAX_MESSAGE_LEN = 500;
const MIN_MESSAGE_LEN = 1;
// Daily cap is tier-based: free students get FREE_DAILY_CHAT, Pro get a
// much higher (effectively unlimited) ceiling. The cap itself is a gentle
// conversion lever — a heavy free user feels the wall and upgrades.
const CONTEXT_MESSAGE_COUNT = 6; // last 3 user/assistant pairs

// Block obvious prompt-injection / abuse markers — same lightweight check
// we run on the quiz topic input.
const BLACKLIST = /[\x00-\x1f]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|<\s*\/?\s*(script|iframe|object|embed)/i;

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
    const attemptContext =
      typeof body.context === 'string' ? body.context.trim().slice(0, 2000) : '';
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

    // ===== 7. DAILY QUOTA CHECK =====
    // Count user messages sent since UTC midnight. Replies don't count.
    const { count: todayCount, error: countError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', todayStartIso());

    if (countError) {
      console.error('quota count error:', countError);
      return Response.json({ error: 'שגיאה זמנית. נסה שוב.' }, { status: 500 });
    }

    const dailyCap = isProUser(user) ? PRO_DAILY_CHAT : FREE_DAILY_CHAT;
    const used = todayCount ?? 0;
    if (used >= dailyCap) {
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

    // ===== 10. CALL ANTHROPIC =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
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
    const system = buildTutorSystem({ unitLevel, formNumber, topic: topic || undefined });
    const sonnetAllowlist = (process.env.TUTOR_SONNET_TOPICS ?? '').trim();
    const useSonnet =
      grounded &&
      (sonnetAllowlist === '' ||
        sonnetAllowlist.split(',').map((s) => s.trim()).includes(topic));
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
    const remaining = Math.max(0, dailyCap - (used + 1));

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

        try {
          const stream = client.messages.stream({
            model,
            max_tokens: 800,
            system,
            messages: claudeMessages,
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
          const block = final.content[0];
          if (block && block.type === 'text' && block.text.trim()) {
            fullText = block.text; // authoritative
          }
          usageIn = final.usage.input_tokens;
          usageOut = final.usage.output_tokens;
        } catch (streamErr) {
          console.error('Chat stream error:', streamErr);
          send('error', { error: "שגיאת צ'אט. נסה שוב." });
          controller.close();
          return;
        }

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
