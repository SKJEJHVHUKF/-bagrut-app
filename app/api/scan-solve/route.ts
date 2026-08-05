// ============================================================
// /api/scan-solve — the ONLY server surface the scanner has.
// ============================================================
//
// Three modes, three cost profiles, three access levels. Keeping them in one
// route means the escalation order lives in one place and can't drift:
//
//   mode=match      JSON        $0   PUBLIC       verified library + shared cache
//   mode=transcribe multipart   ¢    signed-in    vision OCR fallback
//   mode=solve      JSON        ¢    Pro for AI   library → cache → AI solve
//
// `match` is deliberately public and unauthenticated. It reads ~830
// hand-authored solutions that already ship in the bundle plus a public
// cache table — no model call, no user data, nothing to bill. Requiring a
// login for it would gate the free path behind a signup for no reason, and
// the monetization decision in CLAUDE.md already says library/cache hits are
// free for everyone.
//
// Every paid response carries `costUsd` computed from the ACTUAL usage block
// returned by the API — not from an estimate. That number is what the
// client's cost meter records, so "מה עלתה השאלה הזאת" is a measurement.

import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';
import { MATH5 } from '@/content/bagrut-context';
import { matchScannedQuestion } from '@/lib/solution-library';
import { normalizeQuestionText, fingerprint } from '@/lib/question-match';
import { findSimilarCached, getCachedSolution, putCachedSolution } from '@/lib/solution-cache';

// Vercel Hobby caps a serverless function at 60s (CLAUDE.md #3). Both model
// calls below carry a `max_tokens` that fits well inside it — a call that
// overruns returns nothing AND still bills.
export const maxDuration = 60;

const FREE_DAILY_SCANS = 15;
const PRO_DAILY_SCANS = 150;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const TRANSCRIBE_MODEL = 'claude-sonnet-4-5';
const SOLVE_MODEL = 'claude-sonnet-4-5';

// Published rates, checked 2026-08-05. The only un-measured numbers here.
const RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
};

type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
};

function costOf(model: string, usage: Usage | undefined): number {
  const rate = RATES[model];
  if (!rate || !usage) return 0;
  // Cache reads bill at 10% of input and cache WRITES at 125%. Both arrive
  // as separate fields already excluded from `input_tokens`, so they are
  // added — folding them into input would under-report a cold call.
  const read = (usage.cache_read_input_tokens ?? 0) * rate.input * 0.1;
  const write = (usage.cache_creation_input_tokens ?? 0) * rate.input * 1.25;
  return (
    (usage.input_tokens ?? 0) * rate.input +
    (usage.output_tokens ?? 0) * rate.output +
    read +
    write
  );
}

const KNOWN_TOPICS = [
  'אלגברה', 'גיאומטריה אוקלידית', 'פונקציות', 'חשבון דיפרנציאלי',
  'חשבון אינטגרלי', 'טריגונומטריה', 'פונקציה מעריכית', 'גדילה ודעיכה',
  'פונקציית ln', 'סדרות', 'הסתברות', 'גאומטריה אנליטית',
  'וקטורים במרחב', 'מספרים מרוכבים', 'סטטיסטיקה',
];

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

// ============================================================
// Prompts
// ============================================================

const TRANSCRIBE_SYSTEM = `אתה קורא צילום של שאלת בגרות במתמטיקה (עברית) ומחזיר אותה כטקסט מדויק.
- תמלל בדיוק כפי שכתוב, כולל כל הסעיפים. ביטויים מתמטיים ב-LaTeX ($...$ בשורה).
- אל תפתור. רק תמלל וסווג.
- זהה את הנושא העיקרי מתוך: ${KNOWN_TOPICS.join(' • ')}. אם לא ברור — "אלגברה".
- אם התמונה מטושטשת → {"error": "התמונה לא ברורה מספיק. נסה לצלם שוב באור טוב ובזווית ישרה."}
- אם אין בתמונה שאלת מתמטיקה → {"error": "לא זיהיתי שאלת מתמטיקה בתמונה."}`;

// The solve prompt is built once at module load and marked for prompt
// caching, so its ~1.5k tokens are billed once per 5-minute window instead
// of on every solve. It is deliberately LEANER than /api/solve-photo's:
// this route is reached only after the local CAS has already refused, so the
// questions arriving here are the hard ones, and a formula dump helps them
// less than a tight instruction does.
const SOLVE_SYSTEM = [
  MATH5.identity,
  MATH5.styleGuide,
  `## המשימה

תקבל שאלת בגרות במתמטיקה שכבר תומללה. פתור אותה צעד-אחר-צעד.

**כללי הכתיבה (מחייבים):**
1. **צעד = רעיון אחד.** אסור לדחוס שני מהלכים לצעד אחד.
2. **בלי דילוגים.** מ-$2x^2-8=0$ ל-$x=\\pm2$ יש בדרך $x^2=4$ — כתוב אותו.
3. **עברית לעולם לא בתוך $...$** — הנוסחאות ב-LaTeX, ההסבר בעברית מחוץ להן.
4. **"למה" ולא רק "מה".** "מעבירים אגף" זה מה; "כדי לבודד את $x$" זה למה.
5. **תחום הגדרה ראשון** כשיש שורש, מכנה, לוג או טנגנס.
6. **אימות בסוף** לרדיקל ולרציונלי — הצבה במשוואה המקורית.
7. **תשובה מדויקת:** $\\frac{\\sqrt2}{2}$, לא $0.707$.
8. **מרוכבים ב-cis ובמעלות**, לא $e^{i\\theta}$ ולא רדיאנים.

גם אם השאלה קשה, ארוכה או חלקית — **תמיד החזר צעדים ותשובה סופית**. אם חלק מהנתונים חסר או לא ברור, אמור זאת במפורש בתוך צעד וכתוב את הפתרון עבור מה שכן נתון. אין אפשרות להחזיר תשובה ריקה.`,
].join('\n\n');

const TRANSCRIBE_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    topic: { type: 'string' },
    transcribedQuestion: { type: 'string' },
  },
  additionalProperties: false,
};

/**
 * ⚠️ `required` is the load-bearing part of this schema. Do not remove it.
 *
 * The previous version listed `error`, `topic`, `steps` and `finalAnswer` as
 * properties with NO `required` array. `{}` therefore satisfies it — and on a
 * hard multi-section bagrut question that is exactly what the model returned:
 * MEASURED, 9 output tokens, `{}`, 2 seconds. The student waited 35 seconds,
 * was billed 4.5 agorot, and got "עוד לא פתרנו את השאלה הזאת".
 *
 * Structured outputs enforce STRUCTURE, not effort. An all-optional schema
 * tells the model that returning nothing is a valid answer, and on the
 * questions that are hardest to solve that is the cheapest path available.
 * With `steps` and `finalAnswer` required, the same question and the same
 * prompt produced a full 6-step solution.
 *
 * `minItems` must be 0 or 1 — the API rejects any other value
 * ("For 'array' type, 'minItems' values other than 0 or 1 are not supported").
 */
const SOLVE_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, content: { type: 'string' } },
        required: ['title', 'content'],
        additionalProperties: false,
      },
    },
    finalAnswer: { type: 'string' },
  },
  required: ['steps', 'finalAnswer'],
  additionalProperties: false,
};

// ============================================================
// Helpers
// ============================================================

type SolutionPayload = {
  source: 'library' | 'cache' | 'ai';
  topic: string;
  transcribedQuestion: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  costUsd: number;
};

async function scansToday(
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
      .gte('created_at', midnight.toISOString());
    if (error) return 0;
    return count ?? 0;
  } catch {
    // Table missing → no cap rather than no feature. Same degradation rule
    // the rest of the app uses for optional Supabase tables.
    return 0;
  }
}

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: { 'Cache-Control': 'no-store', ...(init?.headers ?? {}) },
  });
}

// ============================================================
// POST
// ============================================================

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request) || looksLikeBot(request)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const limit = checkRateLimit(getFingerprint(request));
    if (!limit.allowed) {
      return json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    return contentType.includes('multipart/form-data')
      ? await handleTranscribe(request)
      : await handleJson(request);
  } catch (error) {
    console.error('[scan-solve]', error);
    return json({ error: 'שגיאה בעיבוד השאלה. נסה שוב.' }, { status: 500 });
  }
}

// ------------------------------------------------------------
// mode=match | mode=solve  (JSON)
// ------------------------------------------------------------

async function handleJson(request: Request) {
  let body: { mode?: string; question?: string; topic?: string; section?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const mode = body.mode === 'solve' ? 'solve' : 'match';
  const question = (body.question ?? '').trim();
  if (question.length < 6) {
    return json({ error: 'הטקסט קצר מדי' }, { status: 400 });
  }
  if (question.length > 4000) {
    return json({ error: 'הטקסט ארוך מדי' }, { status: 413 });
  }

  const topicHint = typeof body.topic === 'string' ? body.topic : undefined;
  const hash = fingerprint(normalizeQuestionText(question));

  // ---- 1. verified library (free, no auth, no network beyond this call) ----
  //
  // `matchScannedQuestion`, not `matchQuestion`: the incoming text came off a
  // photograph. The clean-string matcher scored 0/24 on realistic OCR noise
  // over real bagrut questions; this one finds 90.2% of them with zero wrong
  // matches (`npm run bench:match`).
  const libraryHit = matchScannedQuestion(question, topicHint);
  if (libraryHit) {
    return json({
      source: 'library',
      topic: libraryHit.solution.topic,
      // Show the STORED wording, not the OCR's. On a fuzzy match these differ,
      // and the stored text is both correct and what the solution refers to —
      // it is also how a student spots a wrong match instantly.
      transcribedQuestion: libraryHit.score >= 0.999 ? question : libraryHit.solution.transcribedQuestion,
      steps: libraryHit.solution.steps,
      finalAnswer: libraryHit.solution.finalAnswer,
      matchScore: libraryHit.score,
      costUsd: 0,
    } satisfies SolutionPayload & { matchScore: number });
  }

  // ---- 2. shared cache ----
  // Needs a Supabase client, which needs the request's cookies; an anonymous
  // visitor simply gets no rows back under RLS, which is a clean miss.
  const supabase = await createClient();
  // Exact hash first (free, indexed), then the same OCR-tolerant matcher —
  // without it two students photographing the same page never share a
  // solution, and the cache that is supposed to drive cost DOWN as usage
  // rises would essentially never hit.
  const cached = (await getCachedSolution(supabase, hash)) ?? (await findSimilarCached(supabase, question, topicHint));
  if (cached) {
    return json({
      source: 'cache',
      topic: cached.topic || topicHint || '',
      transcribedQuestion: cached.transcribedQuestion || question,
      steps: cached.steps,
      finalAnswer: cached.finalAnswer,
      costUsd: 0,
    } satisfies SolutionPayload);
  }

  if (mode === 'match') {
    // A miss is the expected outcome, not an error — 200 with no steps keeps
    // the client's free path branch-free.
    return json({ source: 'miss', steps: [], finalAnswer: '', costUsd: 0 });
  }

  // ---- 3. AI solve (auth + Pro) ----
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: 'יש להתחבר כדי לקבל פתרון חדש', authRequired: true }, { status: 401 });
  }
  const pro = isProUser(user);
  if (!pro) {
    return json(
      {
        error: 'זו שאלה חדשה שעדיין לא במאגר — פתרון AI חדש הוא פיצ׳ר Pro.',
        proRequired: true,
        transcribedQuestion: question,
        topic: topicHint ?? '',
      },
      { status: 402 }
    );
  }

  const cap = PRO_DAILY_SCANS;
  if ((await scansToday(supabase, user.id)) >= cap) {
    return json(
      { error: `הגעת למכסת ${cap} הפתרונות היומית. חזור מחר.`, quotaExceeded: true },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'Server configuration error' }, { status: 500 });

  const client = new Anthropic({ apiKey });

  // Solve ONE section at a time when the question has them.
  //
  // MEASURED on the real מתכונת question that failed: solving all three
  // sections in one call produced 2,686 output tokens in **55 seconds** —
  // 92% of the Vercel Hobby 60s ceiling, where an overrun returns nothing
  // and still bills. Per-section requests are ~a third of that each, they
  // are separate invocations so each gets its own budget, and the student
  // sees section א while ב is still being written.
  const section = typeof body.section === 'string' ? body.section.slice(0, 2) : null;
  const sectionInstruction = section
    ? `\n\n**פתור אך ורק את סעיף ${section}.** התייחס לשאר השאלה כהקשר בלבד. אל תפתור סעיפים אחרים.`
    : '';

  const message = await client.messages.create({
    model: SOLVE_MODEL,
    // 3,500 covers a single section comfortably (measured ~900-1,100) and a
    // whole short question, while keeping generation inside the time budget.
    max_tokens: 3500,
    system: [
      {
        type: 'text' as const,
        text: SOLVE_SYSTEM,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `נושא (זיהוי ראשוני): ${topicHint ?? 'לא ידוע'}\n\nהשאלה:\n${question}${sectionInstruction}`,
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ output_config: { format: { type: 'json_schema', schema: SOLVE_SCHEMA } } } as any),
  });

  const costUsd = costOf(SOLVE_MODEL, message.usage as Usage);
  const content = message.content[0];
  if (content.type !== 'text') {
    return json({ error: 'תשובה לא צפויה מהמודל', costUsd }, { status: 502 });
  }

  let parsed: { topic?: string; steps?: { title: string; content: string }[]; finalAnswer?: string };
  try {
    parsed = JSON.parse(content.text);
  } catch {
    // Truncation is the likely cause, and it is worth naming: the generic
    // "try again" sends the student back to pay for the same failure.
    const truncated = message.stop_reason === 'max_tokens';
    return json(
      {
        error: truncated
          ? 'הפתרון ארוך מהצפוי ונקטע. נסה לצלם סעיף אחד בכל פעם.'
          : 'תשובה לא תקינה מהמודל',
        costUsd,
      },
      { status: 502 }
    );
  }
  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    // With `required` on the schema this should be unreachable; it stays as a
    // guard because it is exactly the failure that shipped once already.
    return json(
      { error: 'המודל לא החזיר פתרון לשאלה הזאת. נסה לצלם סעיף אחד בכל פעם.', costUsd },
      { status: 502 }
    );
  }

  const topic = parsed.topic || topicHint || '';
  // Warm the shared cache so the next student who scans this exact question
  // pays nothing. This is the mechanism that makes cost fall as usage rises.
  void putCachedSolution(supabase, hash, {
    topic,
    transcribedQuestion: question,
    steps: parsed.steps,
    finalAnswer: parsed.finalAnswer ?? '',
  });
  void supabase
    .from('scan_log')
    .insert({ source: 'ai' })
    .then(({ error }) => {
      if (error) console.error('[scan_log]', error.message);
    });

  return json({
    source: 'ai',
    topic,
    transcribedQuestion: question,
    steps: parsed.steps,
    finalAnswer: parsed.finalAnswer ?? '',
    costUsd,
    usage: message.usage,
  } satisfies SolutionPayload & { usage: unknown });
}

// ------------------------------------------------------------
// mode=transcribe  (multipart)
// ------------------------------------------------------------

async function handleTranscribe(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: 'יש להתחבר כדי להשתמש בזיהוי המתקדם', authRequired: true }, { status: 401 });
  }
  const pro = isProUser(user);
  const cap = pro ? PRO_DAILY_SCANS : FREE_DAILY_SCANS;
  if ((await scansToday(supabase, user.id)) >= cap) {
    return json(
      {
        error: pro
          ? `הגעת למכסת ${cap} הצילומים היומית. חזור מחר.`
          : `הגעת למכסת ${cap} הצילומים היומית בחשבון החינמי. שדרג ל-Pro לצילומים נוספים.`,
        quotaExceeded: true,
      },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('image');
  if (!(file instanceof File)) return json({ error: 'Missing image' }, { status: 400 });
  if (file.size === 0) return json({ error: 'הקובץ ריק' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) {
    return json({ error: 'התמונה גדולה מדי' }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return json({ error: 'פורמט לא נתמך' }, { status: 415 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'Server configuration error' }, { status: 500 });

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: TRANSCRIBE_MODEL,
    max_tokens: 900,
    system: TRANSCRIBE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64,
            },
          },
          { type: 'text', text: 'תמלל את השאלה וזהה את הנושא. אל תפתור.' },
        ],
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ output_config: { format: { type: 'json_schema', schema: TRANSCRIBE_SCHEMA } } } as any),
  });

  const costUsd = costOf(TRANSCRIBE_MODEL, message.usage as Usage);
  void supabase
    .from('scan_log')
    .insert({ source: 'transcribe' })
    .then(({ error }) => {
      if (error) console.error('[scan_log]', error.message);
    });

  const content = message.content[0];
  if (content.type !== 'text') {
    return json({ error: 'תשובה לא צפויה מהמודל', costUsd }, { status: 502 });
  }
  try {
    const parsed = JSON.parse(content.text) as { error?: string; topic?: string; transcribedQuestion?: string };
    return json({ ...parsed, costUsd, usage: message.usage });
  } catch {
    return json({ error: 'תשובה לא תקינה מהמודל', costUsd }, { status: 502 });
  }
}

export async function GET() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
