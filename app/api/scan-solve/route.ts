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
// Writes to the SHARED bank/cache go through the service-role client, never
// through the student's session — see lib/supabase/admin.ts for why.
import { createAdminClient } from '@/lib/supabase/admin';
import { isProUser } from '@/lib/access';
import { MATH5 } from '@/content/bagrut-context';
import { MATH_FORMAT_RULES } from '@/lib/agents/prompts';
import { matchScannedQuestion } from '@/lib/solution-library';
import { normalizeQuestionText, fingerprint } from '@/lib/question-match';
import { findSimilarCached, getCachedSolution, putCachedSolution } from '@/lib/solution-cache';
import { bumpServed, reportWrong, searchBank, upsertIntoBank } from '@/lib/mathscan/bank';
import { decideSolveQuota } from '@/lib/mathscan/quota';
import { logCost } from '@/lib/mathscan/cost';
import { findUniversityNotation } from '@/lib/tichon-notation';
import { solveWithCas, compareWithCas } from '@/lib/mathscan/verify-solution';

// Vercel Hobby caps a serverless function at 60s (CLAUDE.md #3). Both model
// calls below carry a `max_tokens` that fits well inside it — a call that
// overruns returns nothing AND still bills.
export const maxDuration = 60;

const FREE_DAILY_SCANS = 15;
const PRO_DAILY_SCANS = 150;

// The AI-solve quota lives in lib/mathscan/quota.ts, as a pure function: the
// decision cannot be reached from outside without a signed-in free account,
// so testing it in isolation is the only way it gets tested at all.

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// claude-haiku-4-5, down from claude-sonnet-4-5 on both stages: $1/$5 per
// MTok against $3/$15, so every paid scan is 3x cheaper across input, output
// and image tokens alike.
//
// ⚠️ WHAT THIS TRADES. The transcribe stage reads Hebrew maths off a PHOTO —
// often handwriting, often bad light — and that is exactly the task where a
// smaller model degrades first. The pipeline has a net under it (validate.ts
// scores the read, repair.ts fixes it, and the student can edit the
// transcription by hand), but if scan quality drops, THIS is the line that
// did it. Reverting is one word, per stage: they are separate constants
// precisely so the vision stage can go back to Sonnet without the solve stage
// following it.
//
// The cache_control on SOLVE_STREAM_SYSTEM was NOT a consideration: that
// prompt is ~720 tokens, under Sonnet 4.5's own 1,024 minimum, so it has
// never cached on either model. See the note at its call site.
const TRANSCRIBE_MODEL = 'claude-haiku-4-5';
const SOLVE_MODEL = 'claude-haiku-4-5';

// The rate card and the cost maths now come from lib/mathscan/cost.ts, which
// is where they already lived. This file used to keep its own copy of both —
// and cost.ts's own header says that copy is the reason it exists ("a
// `costOfCall` used to live here … /api/scan-solve kept a correct inline
// copy"). Two rate tables means adding a model to one and not the other, which
// is precisely what this change would have done.
// The local `Usage` type and `costOf` wrapper are gone with the rate table:
// both call sites now use `logCost`, which prices the call AND prints the
// token line this route is required to emit. `UsageLike` in cost.ts is the
// one remaining shape.

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
- **תמיד** החזר את השדה transcribedQuestion. אם אי אפשר לתמלל — החזר אותו כמחרוזת ריקה ומלא את error.
- אם התמונה מטושטשת → {"transcribedQuestion": "", "topic": "", "error": "התמונה לא ברורה מספיק. נסה לצלם שוב באור טוב ובזווית ישרה."}
- אם אין בתמונה שאלת מתמטיקה → {"transcribedQuestion": "", "topic": "", "error": "לא זיהיתי שאלת מתמטיקה בתמונה."}`;

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

/**
 * ⚠️ `required` is load-bearing here for the SAME reason it is on
 * SOLVE_SCHEMA below. Do not remove it. This schema was missing it.
 *
 * With every property optional, `{}` is a valid response — and returning
 * nothing is always the cheapest way to satisfy a schema, which is why the
 * solve schema produced exactly that on the hardest questions (measured: 9
 * output tokens, `{}`, and a student billed 4.5 agorot for an empty screen).
 *
 * The same hole was open here, on the path that a signed-in student reaches
 * only when the local read ALREADY failed — so the failure lands at the worst
 * possible moment: the fallback that was supposed to rescue the scan returns
 * `{}`, the pipeline keeps the mangled local text because an empty read
 * scores lower, and the student pays for a transcription that produced
 * nothing and then gets a solution based on scrambled text.
 *
 * `transcribedQuestion` is required and the prompt now specifies an empty
 * string plus `error` for the unreadable cases, so "I could not read it" is
 * an explicit answer rather than an absent field.
 */
const TRANSCRIBE_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    topic: { type: 'string' },
    transcribedQuestion: { type: 'string' },
  },
  required: ['transcribedQuestion'],
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
/**
 * The STREAMING solve prompt — markdown, not JSON.
 *
 * Three problems with the JSON path, all reported from a real scan of a
 * מתכונת question: it took ~55 seconds behind a blank spinner, it cost three
 * separate calls once sections were split out, and the merged step-card
 * output read as an undifferentiated wall.
 *
 * Streaming markdown fixes all three at once. The first sentence lands in
 * about two seconds instead of a minute of nothing; it is ONE call rather
 * than one per section; and a long multi-section bagrut question reads far
 * better as a flowing document with `## סעיף א` headings than as forty
 * numbered cards. It also removes the truncation cliff — a cut-off markdown
 * solution is still most of a solution, where cut-off JSON is unparseable
 * and worth nothing.
 */
const SOLVE_STREAM_SYSTEM = [
  MATH5.identity,
  MATH5.styleGuide,
  // ⚠️ THE ONE AGENT THAT WAS MISSING THESE. lib/agents/prompts.ts exports
  // MATH_FORMAT_RULES with the note "so every agent that emits Hebrew+KaTeX
  // shares ONE copy of these rules" — and this solver, the one whose output a
  // stuck student reads most closely, was built from `identity + styleGuide`
  // alone. `styleGuide` is about how a bagrut QUESTION is phrased; it says
  // nothing about notation.
  //
  // The cost was visible in production on 2026-08-26: a scanned solution
  // rendered "$x \in \mathbb{R}$" and "$x \in \mathbb{R} \setminus \{0\}$" to
  // a 5-unit student. `npm run check:notation` cannot catch that — it scans
  // content/, and this text is generated at request time.
  MATH_FORMAT_RULES,
  `## המשימה

תקבל שאלת בגרות במתמטיקה שתלמיד צילם ולא הצליח לפתור. כתוב פתרון מלא ומוסבר.

**מבנה (מחייב):**
- אם לשאלה יש סעיפים — כותרת \`## סעיף א\` לכל סעיף, לפי הסדר. אל תדלג על סעיף.
- בתוך סעיף: פסקאות קצרות. כל מהלך מתמטי בשורה נפרדת בתוך \`$$...$$\`.
- בסוף כל סעיף שורה אחת: \`**התשובה:** ...\`

**כללי כתיבה (מחייבים):**
1. **צעד = רעיון אחד.** אל תדחוס שני מהלכים למשפט אחד.
2. **בלי דילוגים.** מ-$2x^2-8=0$ ל-$x=\\pm2$ יש בדרך $x^2=4$ — כתוב אותו.
3. **עברית לעולם לא בתוך $...$.** הנוסחאות ב-LaTeX, ההסבר בעברית מחוץ להן. זה קריטי — עברית בתוך נוסחה מוצגת הפוכה.
4. **"למה" לפני "מה".** לא "מעבירים אגף" אלא "כדי לבודד את $x$ נעביר אגף".
5. **תחום הגדרה ראשון** כשיש שורש, מכנה, לוג או טנגנס.
6. **תשובה מדויקת:** $\\frac{\\sqrt2}{2}$, לא $0.707$.
7. **מרוכבים ב-cis ובמעלות**, לא $e^{i\\theta}$ ולא רדיאנים.

**קצר וברור עדיף על ארוך ומלומד.** התלמיד תקוע — הוא צריך להבין, לא להתרשם.
אם חסר נתון או שרטוט — אמור זאת במשפט אחד והמשך עם מה שכן נתון. אל תסרב לפתור.`,
].join('\n\n');

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
  userId: string,
  /** Count only one kind of entry. The solve quota must not be consumed by
   *  transcriptions, which are a different (much cheaper) operation. */
  source?: string
): Promise<number> {
  try {
    const midnight = new Date();
    midnight.setUTCHours(0, 0, 0, 0);
    let query = supabase
      .from('scan_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', midnight.toISOString());
    if (source) query = query.eq('source', source);
    const { count, error } = await query;
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
  let body: { mode?: string; question?: string; topic?: string; bankId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Pro wall (owner, 2026-08-20): the scan feature is Pro-only — every path,
  // including the free library/bank/cache reads. This reverses the earlier
  // "small free quota grows the bank" decision (kept below for history): back
  // then isProUser was effectively owner-only, so a wall dead-ended the bank.
  // Pro can now actually be granted (admin panel, 2d1a8a7), so the wall is
  // real product tiering rather than a dead end.
  {
    const gate = await createClient();
    const {
      data: { user: gateUser },
    } = await gate.auth.getUser();
    if (!gateUser) {
      return json({ error: 'יש להתחבר כדי להשתמש בסריקה', authRequired: true }, { status: 401 });
    }
    if (!isProUser(gateUser)) {
      return json({ error: 'סריקת שאלה זמינה למנויי Pro בלבד', proRequired: true }, { status: 403 });
    }
  }

  // A student reporting a wrong solution. Auth-required and free — an
  // anonymous report is unattributable and would make the only human signal
  // the bank has trivially spammable.
  //
  // One vote per student per row: the report is first recorded in
  // `bank_reports` (PK bank_id+user_id, service role only), and only a NEW
  // vote demotes the row. Three reports used to retire a row from search, and
  // nothing stopped one account from sending all three (audit H2).
  if (body.mode === 'report') {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'יש להתחבר' }, { status: 401 });
    if (typeof body.bankId !== 'string' || body.bankId.length < 10) {
      return json({ error: 'Missing bankId' }, { status: 400 });
    }
    const admin = createAdminClient();
    if (admin) {
      const { error: duplicate } = await admin
        .from('bank_reports')
        .insert({ bank_id: body.bankId, user_id: user.id });
      if (!duplicate) await reportWrong(admin, body.bankId);
    }
    return json({ ok: true });
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

  // ---- 1b. the growing bank ----
  //
  // Between the hand-authored corpus and the exact-hash cache. Every AI solve
  // lands here, so a question a previous student photographed is answered for
  // nothing — this is the stage that makes cost fall as usage rises.
  const supabaseForBank = await createClient();
  const bankHit = await searchBank(supabaseForBank, question, topicHint);
  if (bankHit) {
    // Counter bump = a write → service role (the student can no longer update
    // bank rows). Best-effort, as before.
    const admin = createAdminClient();
    if (admin) void bumpServed(admin, bankHit.id);
    return json({
      source: 'bank',
      topic: bankHit.topic ?? topicHint ?? '',
      transcribedQuestion: bankHit.canonicalText,
      // `markdown`, NOT a one-element steps[]. What is stored is a whole
      // document with `## סעיף א` headings, and the step renderer would put
      // it inside a single numbered card with a blank title — the exact
      // layout the owner called מסורבל on a real scan. The client renders
      // markdown as one flowing card, same as a fresh streamed solve.
      markdown: bankHit.solutionMarkdown,
      steps: [],
      finalAnswer: '',
      matchScore: bankHit.score,
      qualityTier: bankHit.qualityTier,
      bankId: bankHit.id,
      costUsd: 0,
    });
  }

  // ---- 2. shared cache ----
  // Needs a Supabase client, which needs the request's cookies; an anonymous
  // visitor simply gets no rows back under RLS, which is a clean miss.
  const supabase = await createClient();
  // Exact hash first (free, indexed), then the same OCR-tolerant matcher —
  // without it two students photographing the same page never share a
  // solution, and the cache that is supposed to drive cost DOWN as usage
  // rises would essentially never hit.
  const cached = (await getCachedSolution(supabase, hash, question)) ?? (await findSimilarCached(supabase, question, topicHint));
  if (cached) {
    // A streamed solve is stored here as ONE title-less step holding the whole
    // markdown document (the cache's schema predates markdown solutions).
    // Handing that back as steps[] renders it inside a numbered card with a
    // blank heading; unwrapping it back to markdown renders it as the flowing
    // document it is.
    const wrapped =
      cached.steps.length === 1 && !cached.steps[0].title.trim() ? cached.steps[0].content : null;
    return json({
      source: 'cache',
      topic: cached.topic || topicHint || '',
      transcribedQuestion: cached.transcribedQuestion || question,
      ...(wrapped ? { markdown: wrapped, steps: [] } : { steps: cached.steps }),
      finalAnswer: cached.finalAnswer,
      costUsd: 0,
    });
  }

  if (mode === 'match') {
    // A miss is the expected outcome, not an error — 200 with no steps keeps
    // the client's free path branch-free.
    return json({ source: 'miss', steps: [], finalAnswer: '', costUsd: 0 });
  }

  // ---- 3. AI solve (auth + daily quota) ----
  //
  // A small free quota rather than a Pro wall, decided by the owner. The wall
  // made the bank impossible: `isProUser` is true only for the admin email
  // (there is no billing yet), so nobody but the owner could ever contribute,
  // and "every student who scans feeds the library" would never happen.
  //
  // Each solve permanently adds a question, so a free solve is not a cost —
  // it is the purchase of an asset that answers every later student for
  // nothing. Watch `freeRatio` in summarizeCost() and lower FREE_DAILY_SOLVE
  // if the bill climbs before the bank starts absorbing repeats.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: 'יש להתחבר כדי לקבל פתרון חדש', authRequired: true }, { status: 401 });
  }
  // `'ai'` is load-bearing: the quota counts only solves that were BILLED.
  // Counting every scan would let free library and bank hits eat the paid
  // quota, punishing exactly the usage the whole design steers toward.
  const quota = decideSolveQuota({
    pro: isProUser(user),
    usedToday: await scansToday(supabase, user.id, 'ai'),
  });
  if (!quota.allowed) {
    return json(
      { error: quota.message, quotaExceeded: true, proRequired: quota.proRequired },
      { status: quota.status }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'Server configuration error' }, { status: 500 });

  const client = new Anthropic({ apiKey });

  // ---- ONE streaming call, markdown out ----
  //
  // Replaces both the single JSON call (55s behind a blank spinner on a real
  // מתכונת question) and the per-section split that fixed the server's time
  // budget by tripling the student's wait and the bill. Streaming gives the
  // first sentence in ~2s, costs one call, and degrades gracefully: a
  // truncated markdown solution is still most of a solution.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}
data: ${JSON.stringify(data)}

`));
      };
      let markdown = '';
      let usageIn = 0;
      let usageOut = 0;
      let cacheRead = 0;
      let cacheWrite = 0;

      // Fire the free CAS chain NOW, in parallel with the model. The question
      // text is already known and the engines are free (local mathjs, then
      // self-hosted SymPy), so a second, independent solution costs no money
      // and — because the model stream runs for seconds — no wall-clock
      // either. Only the COMPARISON needs the model's markdown, and that
      // happens once the stream has settled, far below.
      //
      // `solveWithCas` never rejects, so this floating promise cannot produce
      // an unhandled rejection while the stream is running.
      const casPromise = solveWithCas(question);

      try {
        const modelStream = client.messages.stream({
          model: SOLVE_MODEL,
          max_tokens: 4000,
          system: [
            {
              type: 'text' as const,
              text: SOLVE_STREAM_SYSTEM,
              // ⚠️ DEAD MARKER, kept deliberately. SOLVE_STREAM_SYSTEM is
              // ~720 tokens (scripts/estimate-scan-prefix.ts), and the minimum
              // cacheable prefix is 1,024 on Sonnet 4.5 and 4,096 on Haiku
              // 4.5. It has therefore never cached on either model — no error,
              // no charge, no saving. Left in place because it costs nothing
              // and starts working the moment this prompt grows past the
              // minimum; documented so nobody counts a saving that isn't real.
              cache_control: { type: 'ephemeral' as const },
            },
          ],
          messages: [
            {
              role: 'user',
              content: `נושא (זיהוי ראשוני): ${topicHint ?? 'לא ידוע'}

השאלה:
${question}`,
            },
          ],
        });
        modelStream.on('text', (delta: string) => {
          markdown += delta;
          send('delta', { text: delta });
        });
        const final = await modelStream.finalMessage();
        usageIn = final.usage.input_tokens;
        usageOut = final.usage.output_tokens;
        cacheRead = final.usage.cache_read_input_tokens ?? 0;
        cacheWrite = final.usage.cache_creation_input_tokens ?? 0;
        if (final.stop_reason === 'max_tokens') {
          send('warn', { message: 'הפתרון ארוך במיוחד ונקטע בסופו.' });
        }
      } catch (error) {
        console.error('[scan-solve] stream error:', error);
        send('error', { error: 'שגיאה בפתרון. נסה שוב.' });
        controller.close();
        return;
      }

      // `expectCache: false` — SOLVE_STREAM_SYSTEM is ~720 tokens, under even
      // Sonnet 4.5's 1,024 minimum, so the cache_control marker on it has
      // never formed an entry on either model. Warning about it every call
      // would be noise; the marker is documented as dead at its call site.
      const costUsd = logCost(
        'scan-solve',
        SOLVE_MODEL,
        {
          input_tokens: usageIn,
          output_tokens: usageOut,
          cache_read_input_tokens: cacheRead,
          cache_creation_input_tokens: cacheWrite,
        },
        { expectCache: false }
      );
      send('done', { costUsd, topic: topicHint ?? '' });

      // Awaited BEFORE close(): a serverless function may be frozen the
      // instant the response finishes, losing anything still in flight.
      if (markdown.trim().length > 40) {
        try {
          // Shared tables → service role. The student's client has no write
          // access to the bank or the cache any more (and must not: with it,
          // every student could rewrite every other student's solutions).
          // The CAS has been running since before the model started. Compare
          // now that the markdown exists.
          // University notation reaching a תיכון student. The build-time gate
          // cannot see this text — it is generated per request — so the check
          // runs here, on the real output, and is the only thing that will
          // ever tell us the prompt rules stopped working.
          const badNotation = findUniversityNotation(markdown);
          if (badNotation.length) {
            console.warn(
              `[notation] scan solution contains university notation: ${badNotation.join(' ')} — ` +
                'MATH_FORMAT_RULES is in SOLVE_STREAM_SYSTEM; if this keeps firing the rule needs strengthening. Not banked.'
            );
          }

          const verdict = compareWithCas(await casPromise, markdown);
          if (verdict.status === 'contradicted') {
            // TWO INDEPENDENT SOLVERS DISAGREE ON THE FINAL ANSWER, and the
            // symbolic one verified itself by substitution. The model is very
            // likely wrong. It is NOT banked: a wrong solution in the shared
            // bank is served free and confidently to every later student who
            // photographs the same question, which is worse than the ~$0.009
            // of solving it again.
            console.warn(
              `[scan-verify] CONTRADICTED by ${verdict.engine} — cas=${verdict.casAnswer} ai=${verdict.aiAnswer} · not banked`
            );
          } else if (verdict.status === 'verified') {
            console.log(`[scan-verify] verified by ${verdict.engine} (${verdict.casAnswer})`);
          }

          const admin = createAdminClient();
          if (admin && verdict.status !== 'contradicted' && badNotation.length === 0) {
            // The bank is the durable store: it deduplicates by fuzzy match, so
            // a question a previous student photographed MERGES instead of
            // adding a second near-identical row. That matters more than it
            // sounds — near-identical rows are exactly what the matcher's
            // margin rule refuses to choose between, so an un-deduplicated
            // bank would degrade retrieval as it grew.
            await upsertIntoBank(admin, {
              question,
              solutionMarkdown: markdown,
              topic: topicHint,
              // The flag `upsertIntoBank` has always accepted and no call site
              // ever passed, which is why nothing in this database has ever
              // reached the 'verified' tier. A row verified here skips the
              // "wait for N students to scan the same question" corroboration
              // path entirely and is trustworthy from the first scan.
              casVerified: verdict.status === 'verified',
            });
            // The exact-hash cache is kept alongside it: free, indexed, and it
            // short-circuits a literal re-submission of the same text without
            // touching the bank at all.
            await putCachedSolution(admin, hash, {
              topic: topicHint ?? '',
              transcribedQuestion: question,
              steps: [{ title: '', content: markdown }],
              finalAnswer: '',
            });
          }
          // scan_log is per-user (RLS own rows) — stays on the student's client.
          await supabase.from('scan_log').insert({ source: 'ai' });
        } catch {
          // Storage and logging must never take the solution down with them.
        }
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
}

// ------------------------------------------------------------
// mode=transcribe  (multipart)
// ------------------------------------------------------------

/**
 * Mathpix v3/text — https://docs.mathpix.com/reference/authentication
 *
 * Two headers (`app_id`, `app_key`), one multipart file, and a JSON body of
 * options. We ask for `text`, which returns prose with the maths inline as
 * `\( … \)` / `\[ … \]`; those are rewritten to the `$…$` the whole app uses.
 *
 * ⚠️ NO KEY IS NOT AN ERROR. It returns 503, the client engine throws, and the
 * chain falls through to Claude vision. A scanner that stops working because
 * an optional key is unset would be a worse product than one without Mathpix
 * at all, so this path is a soft degrade by design.
 */
async function mathpixTranscribe(
  file: File,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const appId = process.env.MATHPIX_APP_ID;
  const appKey = process.env.MATHPIX_APP_KEY;
  if (!appId || !appKey) {
    return json({ error: 'Mathpix is not configured' }, { status: 503 });
  }

  const upstream = new FormData();
  upstream.append('file', file, 'question.jpg');
  upstream.append(
    'options_json',
    JSON.stringify({
      // `text` gives prose + inline maths, which is what a bagrut question is.
      // `latex_styled` alone would drop the Hebrew around the formulas.
      formats: ['text'],
      // Ask for the delimiters we already use, so no rewriting is needed for
      // the common case.
      math_inline_delimiters: ['$', '$'],
      math_display_delimiters: ['$$', '$$'],
      // The app is Hebrew-first; without this Mathpix can decide the page is
      // Latin and drop the prose.
      rm_spaces: true,
    })
  );

  let data: Record<string, unknown>;
  try {
    const res = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: { app_id: appId, app_key: appKey },
      body: upstream,
      signal: AbortSignal.timeout(20_000),
    });
    data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      console.error('[mathpix] http', res.status, JSON.stringify(data).slice(0, 300));
      return json({ error: 'זיהוי הנוסחאות נכשל' }, { status: 502 });
    }
  } catch (error) {
    console.error('[mathpix] request failed:', error);
    return json({ error: 'זיהוי הנוסחאות לא זמין כרגע' }, { status: 502 });
  }

  // Mathpix reports its own errors inside a 200.
  if (typeof data.error === 'string' && data.error) {
    console.warn('[mathpix] api error:', data.error);
    return json({ error: 'לא זוהה טקסט מתמטי בתמונה' }, { status: 200 });
  }

  const text = typeof data.text === 'string' ? data.text : '';
  // `confidence` is 0..1 and is the reason this engine is worth preferring:
  // it is a MEASURED figure, where the Claude vision engine has to invent one.
  const confidence = typeof data.confidence === 'number' ? data.confidence : null;

  // Flat per-request price. Logged like every other paid call so the scanner's
  // cost trace stays a measurement rather than a story.
  const costUsd = 0.002;
  console.log(
    `[cost] scan-mathpix mathpix-v3-text chars=${text.length} confidence=${confidence ?? 'n/a'} usd=${costUsd.toFixed(5)}`
  );

  void supabase.from('scan_log').insert({ source: 'transcribe' }).then(({ error }) => {
    if (error) console.error('[scan_log] mathpix insert failed:', error.message);
  });

  return json({ transcribedQuestion: text, confidence, costUsd });
}

async function handleTranscribe(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: 'יש להתחבר כדי להשתמש בזיהוי המתקדם', authRequired: true }, { status: 401 });
  }
  // Pro wall (owner, 2026-08-20) — see the note in handleJson.
  if (!isProUser(user)) {
    return json({ error: 'סריקת שאלה זמינה למנויי Pro בלבד', proRequired: true }, { status: 403 });
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

  // Mathpix branch. Purpose-built maths OCR, tried before Claude vision
  // because it returns formulas as LaTeX instead of as characters that
  // resemble a formula — see lib/mathscan/ocr/mathpix-engine.ts.
  if (formData.get('engine') === 'mathpix') {
    return await mathpixTranscribe(file, supabase);
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

  // `expectCache: false` — the input here is mostly the photo, which is unique
  // to this scan. There is nothing reusable to cache, so the silent-miss
  // warning would fire every single time and train everyone to ignore it.
  const costUsd = logCost('scan-transcribe', TRANSCRIBE_MODEL, message.usage, { expectCache: false });
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
    // Belt as well as braces. The schema now requires `transcribedQuestion`,
    // but a schema is a request to the model, not a guarantee from it — and
    // this is the one call the student reaches only after the free read has
    // already failed. Returning 200 with nothing in it would leave them
    // billed, unhelped, and with no message explaining either.
    if (!parsed.error && !parsed.transcribedQuestion?.trim()) {
      return json(
        { error: 'הזיהוי בענן לא הצליח לקרוא את השאלה. נסה לצלם שוב באור טוב ובזווית ישרה.', costUsd },
        { status: 502 }
      );
    }
    return json({ ...parsed, costUsd, usage: message.usage });
  } catch {
    return json({ error: 'תשובה לא תקינה מהמודל', costUsd }, { status: 502 });
  }
}

export async function GET() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
