// ============================================================
// /api/scan-tutor — the AI tutor attached to ONE scanned question.
// ============================================================
//
// The student photographed a question they don't understand, we showed them a
// worked solution, and now they can ask about it. This is the endpoint behind
// that conversation.
//
// ── Why it is not /api/chat ────────────────────────────────────────────
// The general tutor is Socratic by design: it withholds the answer so the
// student works. Here the answer is ALREADY on the screen — the student
// scanned the question precisely because they were stuck. Re-hiding it would
// be theatre. So this tutor explains the solution in front of them, and its
// grounding is that exact solution rather than the app's topic-grounding
// block (4,300-7,300 tokens, re-billed every turn on Haiku because it sits
// under the 4,096 cache minimum). Narrower, cheaper, and it cannot contradict
// what the student is reading.
//
// It DOES share `MATH_FORMAT_RULES` with every other agent in the app —
// three prompts drifting apart on bidi and bagrut conventions is how wrong
// notation reaches students.
//
// ── Spend controls, in order ──────────────────────────────────────────
//   origin check · bot check · IP rate limit · auth · daily cap (scan_log)
//   · a hard per-conversation turn cap derived from the submitted transcript
// The turn cap is the one that needs no database: the client sends the
// history, so the server can count the assistant turns in it and refuse.

import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';
import {
  buildScanTutorSystem,
  type TutorPromptGrounding,
} from '@/lib/mathscan/tutor-prompt';

export const maxDuration = 60;

/** Haiku 4.5. This is a conversation, so turns multiply — the cheap tier is
 *  the difference between a feature and a bill. ⚠️ Haiku 4.5 returns 400 on
 *  `output_config.effort`; do not add it here. */
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 700;

/** Per scanned question. Eight turns is a long tutoring exchange; past that
 *  the student is better served by re-scanning or opening the full chat. */
const MAX_TURNS = 8;

/**
 * Daily caps, derived from the MEASURED cost — not picked round.
 *
 * `npm run measure:tutor` (2026-08-05): ~1,900 input + ~350 output tokens on
 * turn 1, rising to ~3,100 by turn 8, i.e. **~1.35 agorot per turn**. At 12
 * turns a day a single free student can cost ~16 agorot/day, and the whole
 * Anthropic budget for this app is about $5/month — so 12 is the number that
 * keeps a handful of heavy users from consuming it alone.
 *
 * This is the first lever to turn if the bill climbs, and the first to raise
 * if usage is healthy. Re-measure before changing it.
 */
const FREE_DAILY_TUTOR = 12;
const PRO_DAILY_TUTOR = 80;

const MAX_MESSAGE_CHARS = 600;

// Published rate, checked 2026-08-05.
const RATE = { input: 1 / 1_000_000, output: 5 / 1_000_000 };

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

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------

async function tutorCallsToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  try {
    const midnight = new Date();
    midnight.setUTCHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('scan_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'tutor')
      .gte('created_at', midnight.toISOString());
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request) || looksLikeBot(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const limit = checkRateLimit(getFingerprint(request));
    if (!limit.allowed) {
      return Response.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { error: 'יש להתחבר כדי לשאול את המורה', authRequired: true },
        { status: 401 }
      );
    }

    const pro = isProUser(user);
    const dailyCap = pro ? PRO_DAILY_TUTOR : FREE_DAILY_TUTOR;
    const used = await tutorCallsToday(supabase, user.id);
    if (used >= dailyCap) {
      return Response.json(
        {
          error: pro
            ? `הגעת למכסת ${dailyCap} השאלות היומית. חזור מחר.`
            : `הגעת למכסת ${dailyCap} השאלות היומית בחשבון החינמי. שדרג ל-Pro לשאלות נוספות.`,
          quotaExceeded: true,
          proRequired: !pro,
        },
        { status: 429 }
      );
    }

    let body: {
      grounding?: TutorPromptGrounding;
      messages?: { role?: string; content?: string }[];
    };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const grounding = body.grounding;
    if (!grounding || typeof grounding.question !== 'string' || grounding.question.length < 3) {
      return Response.json({ error: 'חסרה השאלה' }, { status: 400 });
    }

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter(
        (m): m is { role: 'user' | 'assistant'; content: string } =>
          (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string'
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return Response.json({ error: 'חסרה שאלה של התלמיד' }, { status: 400 });
    }

    // The database-free spend guard: count the assistant turns the client
    // already has and refuse past the ceiling.
    const assistantTurns = messages.filter((m) => m.role === 'assistant').length;
    if (assistantTurns >= MAX_TURNS) {
      return Response.json(
        {
          error: `הגענו ל-${MAX_TURNS} תשובות על השאלה הזאת. אם עדיין משהו לא ברור — כדאי לפתוח את זה בצ׳אט המלא, שם יש הקשר רחב יותר.`,
          turnLimit: true,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const system = buildScanTutorSystem({
      question: grounding.question,
      steps: Array.isArray(grounding.steps) ? grounding.steps : [],
      finalAnswer: typeof grounding.finalAnswer === 'string' ? grounding.finalAnswer : '',
      topic: typeof grounding.topic === 'string' ? grounding.topic : null,
      unitLevel: typeof grounding.unitLevel === 'number' ? grounding.unitLevel : 5,
      source: typeof grounding.source === 'string' ? grounding.source : 'ai',
    });

    const encoder = new TextEncoder();
    const remaining = Math.max(0, dailyCap - (used + 1));

    // SSE. Streaming is the whole perceived-latency win here: the explanation
    // forms word by word instead of behind a spinner, at identical cost.
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        send('meta', { remaining, turnsLeft: MAX_TURNS - assistantTurns - 1 });

        let usageIn = 0;
        let usageOut = 0;
        try {
          const modelStream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages,
          });
          modelStream.on('text', (delta: string) => send('delta', { text: delta }));
          const final = await modelStream.finalMessage();
          usageIn = final.usage.input_tokens;
          usageOut = final.usage.output_tokens;
        } catch (error) {
          console.error('[scan-tutor] stream error:', error);
          send('error', { error: 'שגיאה בתשובת המורה. נסה שוב.' });
          controller.close();
          return;
        }

        const costUsd = usageIn * RATE.input + usageOut * RATE.output;
        // Cost is MEASURED from the usage block, then handed to the client's
        // meter — the same discipline the rest of the scanner uses.
        send('done', { costUsd, usage: { input: usageIn, output: usageOut } });

        // Awaited BEFORE close(): a serverless function that does async work
        // after the response has finished may be frozen mid-write.
        try {
          await supabase.from('scan_log').insert({ source: 'tutor' });
        } catch {
          // Table missing → no quota tracking, feature still works.
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[scan-tutor]', error);
    return Response.json({ error: 'שגיאה. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
