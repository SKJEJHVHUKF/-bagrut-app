import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

// Hobby plan needs an explicit ceiling. Haiku 4.5 with a tight 6-message
// context + max_tokens=800 typically finishes in 5-15s, well under 60s.
export const maxDuration = 60;

// ===== TUTOR SYSTEM PROMPT =====
// Critical formatting rules — the chat UI renders text as plain pre-wrap, so
// any markdown or LaTeX comes through as raw syntax (the user reported seeing
// $$\frac{d}{dx}$$ literal text instead of rendered math). Force plain Hebrew
// + ASCII math notation.
const SYSTEM_PROMPT = `אתה מורה פרטי לבגרות בישראל. עזור לתלמיד עם הבנת חומר, פתרון תרגילים, והכוונה לקראת הבחינה.

כללי כתיבה (חשובים מאוד — האפליקציה מציגה טקסט נקי, ללא עיבוד):
1. אסור: LaTeX. אל תכתוב $, $$, \\frac, \\cdot, \\ln, \\sqrt, \\int, \\sum וכו'.
2. אסור: Markdown. אל תשתמש ב-#, ##, **, *, _, רשימות עם - או *.
3. כתוב הכל בטקסט עברית רגיל, עם סמנים פשוטים:
   • שברים: כתוב "1/x" או "1 חלקי x", לא \\frac{1}{x}
   • חזקות: x² (אפשר להשתמש ב-², ³, ⁿ) או "x בריבוע", לא x^2
   • שורש: √x או "שורש x"
   • כפל: × או נקודה ·
   • לוגריתם טבעי: ln(x), לא \\ln(x)
   • אינטגרל: כתוב "האינטגרל של" במילים
4. כותרות וקטעים: השתמש בשורה ריקה בין פסקאות. אל תשתמש ב-## או **.
5. רשימות: פשוט מספר מ-1) 2) 3) או השתמש בפסקאות נפרדות.

סגנון:
- תשובות תמציתיות (פסקה-שתיים), לא חיבורים ארוכים.
- אם השאלה לא ברורה, בקש הבהרה.
- אם זה תרגיל מתמטי, הראה צעדים אבל בלי לעמוס.
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
    let body: { message?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
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

    // ===== 8. LOAD CONTEXT =====
    // Last N messages, newest first; reverse to chronological for Claude.
    const { data: recentMessages, error: loadError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_MESSAGE_COUNT);

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
    const { error: insertUserError } = await supabase
      .from('chat_messages')
      .insert({ role: 'user', content: message });

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

    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...context.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
      })),
      { role: 'user', content: message },
    ];

    const completion = await client.messages.create({
      // Haiku 4.5 — cheapest model. Per-message cost cap ≈ $0.0035 with
      // these limits. Chat doesn't benefit from a smarter model the way
      // quiz generation does.
      model: 'claude-haiku-4-5',
      // 800 caps the assistant reply at roughly 3-5 short paragraphs.
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    const reply = completion.content[0];
    if (reply.type !== 'text' || !reply.text.trim()) {
      throw new Error('Unexpected response shape from Claude');
    }

    // ===== 11. INSERT ASSISTANT REPLY =====
    const { error: insertAssistantError } = await supabase
      .from('chat_messages')
      .insert({
        role: 'assistant',
        content: reply.text,
        tokens_in: completion.usage.input_tokens,
        tokens_out: completion.usage.output_tokens,
      });

    if (insertAssistantError) {
      // Not fatal — user got their reply, we just couldn't persist.
      // Log and continue; the UI will show the reply but it won't be in
      // history on next page load.
      console.error('insert assistant msg error:', insertAssistantError);
    }

    return Response.json(
      {
        reply: reply.text,
        remaining: Math.max(0, MAX_DAILY_MESSAGES - (used + 1)),
      },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (error) {
    console.error('Chat error:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { error: `שגיאת צ'אט. נסה שוב. [debug: ${msg.slice(0, 200)}]` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
