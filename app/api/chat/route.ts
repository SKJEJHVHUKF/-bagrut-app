import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isGroundedTopic, buildTutorSystemPrompt } from '@/lib/tutor-grounding';

// Hobby plan needs an explicit ceiling. Haiku 4.5 with a tight 6-message
// context + max_tokens=800 typically finishes in 5-15s, well under 60s.
export const maxDuration = 60;

// ===== TUTOR SYSTEM PROMPT (LEGACY / non-pilot topics) =====
// The chat UI renders markdown + LaTeX math via react-markdown + KaTeX —
// so writing math in LaTeX is the correct move; it'll display as proper
// fractions, integrals, etc. Hebrew prose around it stays RTL.
//
// PILOT NOTE: when the request carries topic = "מספרים מרוכבים", we replace
// this generic prompt with the grounded "private tutor" prompt from
// lib/tutor-grounding (see the API call below). All other topics keep this.
const SYSTEM_PROMPT = `אתה מורה פרטי לבגרות בישראל. עזור לתלמיד עם הבנת חומר, פתרון תרגילים, והכוונה לקראת הבחינה.

פורמט תשובה — האפליקציה מרנדרת Markdown וגם LaTeX מתמטי:
1. כל ביטוי מתמטי — כתוב ב-LaTeX:
   • ביטוי בתוך שורה: עוטפים ב-$...$  (לדוגמה: הנגזרת של $f(x) = x^2$ היא $2x$)
   • ביטוי בלוק נפרד (שורה משלו): עוטפים ב-$$...$$ (לדוגמה: $$\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}$$)
   • השתמש ב-\\frac, \\sqrt, \\ln, \\cdot, ^, _, וכו'.
2. כותרות / הדגשה: אפשר להשתמש ב-## כותרת, **בולד**, רשימות עם 1. 2. 3. או -.
3. עברית רגילה לכל הטקסט שמסביב למתמטיקה.

דוגמה לפורמט נכון:

## נגזרת של $\\ln(x)$

הנוסחה הבסיסית:
$$\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}$$

**עם שרשרת:** אם יש פונקציה מורכבת $\\ln(u)$ כאשר $u$ היא פונקציה של $x$:
$$\\frac{d}{dx}[\\ln(u)] = \\frac{u'}{u}$$

דוגמה: עבור $f(x) = \\ln(3x)$, הנגזרת היא $f'(x) = \\frac{3}{3x} = \\frac{1}{x}$.

---

סגנון:
- תשובות תמציתיות (פסקה-שתיים), לא חיבורים ארוכים.
- אם השאלה לא ברורה, בקש הבהרה.
- אם זה תרגיל מתמטי, הראה את שלבי הפתרון ב-LaTeX.
- בעברית ברורה.`;

// ===== LIMITS =====
const MAX_MESSAGE_LEN = 500;
const MIN_MESSAGE_LEN = 1;
const MAX_DAILY_MESSAGES = 20; // hard cap per user per day
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
    let body: { message?: unknown; topic?: unknown; context?: unknown; conversationId?: unknown };
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

    const used = todayCount ?? 0;
    if (used >= MAX_DAILY_MESSAGES) {
      return Response.json(
        {
          error: `הגעת למכסת ${MAX_DAILY_MESSAGES} ההודעות היומית. חזור מחר.`,
          quotaExceeded: true,
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

    const context = (recentMessages ?? []).reverse();

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
    const grounded = isGroundedTopic(topic);
    const systemPrompt = (grounded && buildTutorSystemPrompt(topic)) || SYSTEM_PROMPT;
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

    const completion = await client.messages.create({
      model,
      // 800 caps the assistant reply at roughly 3-5 short paragraphs.
      max_tokens: 800,
      // Prompt caching: the system block (persona + grounding) is static per
      // topic and re-sent every turn of a multi-turn tutoring chat — caching
      // it cuts the dominant input cost by ~90% within the 5-minute TTL.
      system: [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: claudeMessages,
    });

    const reply = completion.content[0];
    if (reply.type !== 'text' || !reply.text.trim()) {
      throw new Error('Unexpected response shape from Claude');
    }

    // ===== 11. INSERT ASSISTANT REPLY =====
    const assistantRow: Record<string, unknown> = {
      role: 'assistant',
      content: reply.text,
      tokens_in: completion.usage.input_tokens,
      tokens_out: completion.usage.output_tokens,
    };
    if (convEnabled && convId) assistantRow.conversation_id = convId;
    const { error: insertAssistantError } = await supabase
      .from('chat_messages')
      .insert(assistantRow);

    if (insertAssistantError) {
      // Not fatal — user got their reply, we just couldn't persist.
      // Log and continue; the UI will show the reply but it won't be in
      // history on next page load.
      console.error('insert assistant msg error:', insertAssistantError);
    }

    // Touch the conversation so it sorts to the top of the sidebar.
    // Best-effort — never block the reply on it.
    if (convEnabled && convId) {
      void supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId)
        .then(({ error }) => {
          if (error) console.error('conversation touch error:', error.message);
        });
    }

    return Response.json(
      {
        reply: reply.text,
        conversationId: convEnabled ? convId : null,
        remaining: Math.max(0, MAX_DAILY_MESSAGES - (used + 1)),
      },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
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
