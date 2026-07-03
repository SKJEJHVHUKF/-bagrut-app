import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';
import { MATH5 } from '@/content/bagrut-context';
import { allLessonKeys, getLesson } from '@/content/lessons';
import { matchQuestion } from '@/lib/solution-library';
import { normalizeQuestionText, fingerprint } from '@/lib/question-match';
import { getCachedSolution, putCachedSolution } from '@/lib/solution-cache';

// Vision + math reasoning, in TWO phases to keep API cost down:
//   1. transcribeImage() — a cheap vision pass that only reads + classifies
//      the question (no solving). ~$0.007.
//   2. match against the verified library (free) → shared cache (free) →
//      and only on a true miss, solveText() — a text-only solve (no image)
//      of the transcription, Pro-gated, result stored in the cache so the
//      next scan of the same question is free.
// Vercel Hobby caps function duration at 60s; both phases fit comfortably.
export const maxDuration = 60;

// Free users get library + cache hits for free; a modest daily cap on
// transcriptions keeps the cheap-but-not-free vision calls from being
// abused. Pro users get a much higher ceiling. Enforced via scan_log
// (degrades to "no cap" if the table is missing).
const FREE_DAILY_SCANS = 15;
const PRO_DAILY_SCANS = 150;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB — Anthropic limit is 5MB for base64, but we'll allow some headroom for transcoding
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

const KNOWN_TOPICS = [
  'אלגברה',
  'גיאומטריה אוקלידית',
  'פונקציות',
  'חשבון דיפרנציאלי',
  'חשבון אינטגרלי',
  'טריגונומטריה',
  'פונקציה מעריכית',
  'גדילה ודעיכה',
  'פונקציית ln',
  'סדרות',
  'הסתברות',
  'גאומטריה אנליטית',
  'וקטורים במרחב',
  'מספרים מרוכבים',
  'סטטיסטיקה',
];

// ============================================================
// System prompt — built once at module load from static content.
// Layers (in order):
//   1. Identity + exam structure + style guide  (bagrut-context.MATH5)
//   2. Pedagogical principles  (how to explain like a tutor)
//   3. Bagrut solution methodology  (the 6-step framework)
//   4. Topic-by-topic formula reference  (the lesson summaries)
//   5. Vision task instructions  (transcribe + classify + solve)
//   6. Output format
//
// Total: ~3,500-4,500 input tokens per call. Adds ~$0.01 over the baseline.
// ============================================================

const PEDAGOGICAL_PRINCIPLES = `## עקרונות הסבר פדגוגיים

אתה מסביר לתלמיד תיכון שלא תמיד בטוח בעצמו. ההסבר שלך חייב להרגיש כמו מורה פרטי טוב שיושב לידו:

1. **צעד = רעיון אחד.** כל \`step\` הוא מהלך מתמטי יחיד עם הסבר "למה". אסור לדחוס שני מהלכים לצעד אחד.
2. **לא לקפוץ.** אם הלכת מ-$2x^2 - 8 = 0$ ל-$x = \\pm 2$, יש בדרך \\$x^2 = 4\\$ — חובה לכתוב אותו.
3. **להסביר 'למה', לא רק 'מה'.** "מעבירים את 4 לצד שני" זה "מה". "כדי לבודד את $x^2$" זה "למה" — צרף את שניהם.
4. **לציין מתי משתמשים בכלי בגרותי מובהק.** כשמשתמשים בוייטה, בדיסקרימיננטה, בנגזרת המכפלה — לציין את שם הכלי.
5. **לציין את התחום בהתחלה כשרלוונטי.** לכל שאלה עם רדיקל / רציונלי / לוג / טריגו עם מגבלה — סעיף ראשון: "תחום הגדרה: ...".
6. **אימות בסוף כשנדרש.** רדיקל ורציונלי = חובה לבדוק את הפתרון במשוואה המקורית, גם אם הוא נראה תקין.
7. **תשובה סופית בצורה מדויקת.** $\\sqrt{2}/2$ ולא $0.707$. $\\pi/3$ ולא $1.047$. עשרוני רק כשהשאלה מבקשת.
8. **בשאלה מילולית — לחזור לשפת השאלה.** "התשובה: $x = 20$" אסור. "הרוחב הוא $20$ ס"מ" — כן.`;

const SOLUTION_METHODOLOGY = `## מתודולוגיית פתרון בגרות (6 שלבים אוניברסליים)

כל שאלה — כמעט בלי יוצא מהכלל — נפתרת לפי הסדר הזה:

1. **הקשר.** מהי השאלה? מה הנתון? מה צריך למצוא? (לרוב לא כותבים את זה כצעד, אלא תופסים זאת מהשאלה).
2. **תחום הגדרה.** מתי הביטוי מוגדר? כתוב ראשון אם רלוונטי. **דוגמאות:** $\\sqrt{g} \\Rightarrow g \\ge 0$, $\\ln g \\Rightarrow g > 0$, מכנה $\\Rightarrow \\ne 0$, $\\tan x \\Rightarrow \\cos x \\ne 0$.
3. **בחירת כלי / נוסחה.** איזו נוסחה מתאימה? (גזירה? וייטה? פיתגורס?). תהיה ספציפי — "נשתמש בנוסחת השורשים" ולא "נחשב".
4. **הצבה / חישוב.** הצב נתונים, פתח סוגריים, פשט. **צעד אחד = רעיון אחד.**
5. **אימות.** אם רדיקל/רציונלי — הצב במשוואה המקורית. אם בעיה מילולית — האם התשובה הגיונית? (גיל שלילי? מהירות 1000 קמ"ש?).
6. **תשובה סופית.** בצורה מדויקת, בשפת השאלה אם מילולית, עם יחידות אם נדרש.`;

function buildTopicReference(): string {
  // Layer 4 — topic-by-topic formula summaries (the canonical reference
  // every lesson page also shows the student). Same source of truth.
  const summaries = allLessonKeys()
    .filter((k) => k.subject === 'math5')
    .map(({ topic }) => {
      const lesson = getLesson('math5', topic);
      const bullets = lesson?.summary ?? [];
      if (bullets.length === 0) return null;
      return `### ${topic}\n${bullets.map((b) => `- ${b}`).join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `## מאגר נוסחאות לפי נושא — סטנדרט הסיכומים של האפליקציה

זה אותו תוכן שהתלמיד רואה בעמוד הסיכום של כל נושא. **הסתמך עליו** כשאתה פותר. אל תמציא נוסחאות שאינן כאן. אם יש סתירה בין הזיכרון שלך לבין מה שכאן — מה שכאן גובר.

${summaries}`;
}

const OUTPUT_FORMAT_EXAMPLE = `## פורמט הפלט

החזר JSON תקין בלבד, במבנה:
\`\`\`
{
  "subject": "math5",
  "topic": "<אחד מ-13 הנושאים מהרשימה>",
  "transcribedQuestion": "<השאלה המלאה כפי שמופיעה בתמונה, כולל סעיפים, ב-LaTeX>",
  "steps": [
    { "title": "<3-7 מילים>", "content": "<1-3 משפטים עם LaTeX>" }
  ],
  "finalAnswer": "<תשובה סופית מדויקת>"
}
\`\`\`

**אם התמונה לא ניתנת לפתרון** (לא שאלת מתמטיקה / מטושטשת / שאלה לא מובנת) — החזר במקום זה:
\`\`\`
{ "error": "<הסבר קצר בעברית למה לא הצלחת>" }
\`\`\`

### דוגמת פלט תקינה (לשאלה: "פתור $x^2 - 5x + 6 = 0$"):
\`\`\`
{
  "subject": "math5",
  "topic": "אלגברה",
  "transcribedQuestion": "פתור את המשוואה $x^2 - 5x + 6 = 0$.",
  "steps": [
    { "title": "מזהים סוג השאלה", "content": "זו משוואה ריבועית בצורה $ax^2 + bx + c = 0$ עם $a = 1, b = -5, c = 6$." },
    { "title": "מנסים פירוק לגורמים", "content": "מחפשים שני מספרים שמכפלתם $c = 6$ וסכומם $-b = 5$. הזוג $2, 3$ מקיים: $2 \\\\cdot 3 = 6$ ו-$2 + 3 = 5$." },
    { "title": "כותבים בצורת מכפלה", "content": "המשוואה הופכת ל-$(x - 2)(x - 3) = 0$." },
    { "title": "פותרים", "content": "מכפלה $= 0$ כאשר אחד הגורמים מתאפס: $x - 2 = 0$ או $x - 3 = 0$, ולכן $x = 2$ או $x = 3$." }
  ],
  "finalAnswer": "$x_1 = 2$, $x_2 = 3$"
}
\`\`\``;

const TEXT_SOLVE_INSTRUCTIONS = `## המשימה שלך עכשיו

תקבל **טקסט של שאלת בגרות במתמטיקה 5 יחידות** (כבר תומללה מצילום). עליך:

1. **לפתור** את השאלה צעד-אחר-צעד, לפי המתודולוגיה לעיל ולפי הסטנדרט של הנוסחאות במאגר. כתוב 4-10 צעדים. אם השאלה כוללת מספר סעיפים (א, ב, ג) — פתור את כולם, וציין בכותרת הצעד את הסעיף.
2. **לזהות** את הנושא העיקרי מתוך הרשימה הסגורה: ${KNOWN_TOPICS.join(' • ')}. אם השאלה חוצה נושאים — בחר את הנושא הדומיננטי. אם השאלה לא מתאימה לאף אחד — בחר "אלגברה" כברירת מחדל.
3. **להחזיר** את השאלה כפי שקיבלת אותה בשדה \`transcribedQuestion\` (בלי לשנות).
4. **לתת תשובה סופית** ברורה ומדויקת.

**הגבלות:**
- אם הטקסט לא נראה כמו שאלת מתמטיקה — \`{"error": "לא זיהיתי שאלת מתמטיקה. נסי לצלם שוב."}\`.
- אם השאלה חורגת מסילבוס 5 יחידות — תפתור בכל זאת, וציין בצעד הראשון: "שים לב: שאלה זו חורגת מסילבוס בגרות 5 יח׳, אבל הנה הפתרון."

**אסור:** לדלג צעדים · תשובה עשרונית כשיש צורה מדויקת ($\\sqrt{2}, \\pi/4$) · לפתוח צעד באנגלית.`;

// Solve prompt (text input). Built once at module load; marked for prompt
// caching in the API call so the recurring ~4k tokens are billed ~once per
// 5-min window instead of every request.
const SOLVE_SYSTEM_PROMPT = [
  MATH5.identity,
  MATH5.examStructure,
  MATH5.styleGuide,
  PEDAGOGICAL_PRINCIPLES,
  SOLUTION_METHODOLOGY,
  buildTopicReference(),
  TEXT_SOLVE_INSTRUCTIONS,
  OUTPUT_FORMAT_EXAMPLE,
].join('\n\n');

// Transcription prompt (vision input) — deliberately tiny so the cheap
// read-only pass stays cheap. It ONLY transcribes + classifies; no solving.
const TRANSCRIBE_SYSTEM_PROMPT = `אתה קורא צילום של שאלת בגרות במתמטיקה 5 יחידות (עברית) ומחזיר אותה כטקסט מדויק.
- תמלל את השאלה בדיוק כפי שהיא, כולל כל הסעיפים (א, ב, ג). ביטויים מתמטיים ב-LaTeX ($...$ בשורה, $$...$$ בבלוק). שמור על העברית והפיסוק המקוריים.
- זהה את הנושא העיקרי מתוך: ${KNOWN_TOPICS.join(' • ')}. אם לא ברור — "אלגברה".
- אל תפתור. רק תמלל וסווג.
- אם התמונה מטושטשת/לא קריאה → {"error": "התמונה לא ברורה מספיק. נסי לצלם שוב בתאורה טובה ובזווית ישרה."}.
- אם אין בתמונה שאלת מתמטיקה → {"error": "התמונה לא נראית כמו שאלת מתמטיקה."}.`;

const TRANSCRIBE_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    topic: { type: 'string' },
    transcribedQuestion: { type: 'string' },
  },
  additionalProperties: false,
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    subject: { type: 'string' },
    topic: { type: 'string' },
    transcribedQuestion: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['title', 'content'],
        additionalProperties: false,
      },
    },
    finalAnswer: { type: 'string' },
  },
  additionalProperties: false,
};

type Solution = {
  subject: 'math5';
  topic: string;
  transcribedQuestion: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
};

type Transcription =
  | { error: string }
  | { topic: string; transcribedQuestion: string };

// Phase 1 — cheap vision pass: transcribe + classify only, no solving.
async function transcribeImage(
  client: Anthropic,
  base64: string,
  mime: string,
): Promise<Transcription> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5', // Hebrew+LaTeX transcription needs Sonnet's vision
    max_tokens: 900,
    system: TRANSCRIBE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mime as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
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
  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected transcription shape');
  return JSON.parse(content.text) as Transcription;
}

// Phase 2 (miss only) — text solve of the transcription. No image; the big
// system prompt is prompt-cached so its ~4k tokens amortize across solves.
async function solveText(
  client: Anthropic,
  topic: string,
  transcribedQuestion: string,
): Promise<Solution | { error: string }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 3072,
    system: [
      {
        type: 'text' as const,
        text: SOLVE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `נושא (זיהוי ראשוני): ${topic}\n\nהשאלה לתמלול ולפתרון:\n${transcribedQuestion}`,
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } } } as any),
  });
  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected solve shape');
  const parsed = JSON.parse(content.text) as Solution | { error: string };
  if (!('error' in parsed) && !parsed.subject) parsed.subject = 'math5';
  return parsed;
}

// Count today's scans for the daily cap. Degrades to 0 (no cap) if the
// scan_log table doesn't exist yet.
async function scansToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
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
    return 0;
  }
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (looksLikeBot(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fp = getFingerprint(request);
    const limit = checkRateLimit(fp);
    if (!limit.allowed) {
      return Response.json(
        { error: 'יותר מדי בקשות. נסי שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    // Auth (required). NOTE: Pro is NOT checked here — library/cache hits are
    // free for everyone. The Pro gate is applied only before an AI solve.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }
    const pro = isProUser(user);

    // Daily scan cap (per user). Keeps the cheap-but-not-free vision pass
    // from being abused. Free < Pro.
    const dailyCap = pro ? PRO_DAILY_SCANS : FREE_DAILY_SCANS;
    const usedToday = await scansToday(supabase, user.id);
    if (usedToday >= dailyCap) {
      return Response.json(
        {
          error: pro
            ? `הגעת למכסת ${dailyCap} הצילומים היומית. חזרי מחר.`
            : `הגעת למכסת ${dailyCap} הצילומים היומית בחשבון החינמי. שדרגי ל-Pro לצילומים נוספים.`,
          quotaExceeded: true,
        },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json({ error: 'Expected multipart/form-data' }, { status: 415 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('image');
    if (!(file instanceof File)) {
      return Response.json({ error: 'Missing image' }, { status: 400 });
    }
    if (file.size === 0) {
      return Response.json({ error: 'הקובץ ריק' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return Response.json(
        { error: `התמונה גדולה מדי (מקסימום ${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)} MB)` },
        { status: 413 }
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return Response.json(
        { error: 'פורמט לא נתמך. השתמשי ב-JPG, PNG, WebP או GIF.' },
        { status: 415 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const client = new Anthropic({ apiKey });

    // ===== PHASE 1: transcribe (cheap vision) =====
    const transcription = await transcribeImage(client, base64, file.type);
    if ('error' in transcription && transcription.error) {
      return Response.json(transcription, { headers: { 'Cache-Control': 'no-store' } });
    }
    const { topic, transcribedQuestion } = transcription as {
      topic: string;
      transcribedQuestion: string;
    };
    const hash = fingerprint(normalizeQuestionText(transcribedQuestion));

    const logScan = (source: string) =>
      void supabase.from('scan_log').insert({ source }).then(({ error }) => {
        if (error) console.error('[scan_log] insert failed:', error.message);
      });
    const respond = (result: Solution, source: 'library' | 'cache' | 'ai') => {
      logScan(source);
      return Response.json(
        { ...result, source },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    };

    // ===== PHASE 2a: verified library (free, everyone) =====
    const libHit = matchQuestion(transcribedQuestion, topic);
    if (libHit) {
      const s = libHit.solution;
      return respond(
        {
          subject: 'math5',
          topic: s.topic,
          // Prefer the STUDENT's transcription for display continuity, but
          // the steps/answer are the verified library ones.
          transcribedQuestion,
          steps: s.steps,
          finalAnswer: s.finalAnswer,
        },
        'library'
      );
    }

    // ===== PHASE 2b: shared cache (free) =====
    const cached = await getCachedSolution(supabase, hash);
    if (cached) {
      return respond(
        {
          subject: 'math5',
          topic: cached.topic || topic,
          transcribedQuestion: cached.transcribedQuestion || transcribedQuestion,
          steps: cached.steps,
          finalAnswer: cached.finalAnswer,
        },
        'cache'
      );
    }

    // ===== PHASE 2c: AI solve (Pro only) =====
    if (!pro) {
      return Response.json(
        {
          error:
            'זו שאלה חדשה שעדיין לא במאגר — פתרון AI חדש הוא פיצ׳ר Pro. שדרגי כדי לקבל פתרון מלא.',
          proRequired: true,
          transcribedQuestion,
          topic,
        },
        { status: 402 }
      );
    }

    const solved = await solveText(client, topic, transcribedQuestion);
    if ('error' in solved && solved.error) {
      return Response.json(solved, { headers: { 'Cache-Control': 'no-store' } });
    }
    const result = solved as Solution;

    // Warm the shared cache so the next scan of this question is free.
    void putCachedSolution(supabase, hash, {
      topic: result.topic,
      transcribedQuestion: result.transcribedQuestion || transcribedQuestion,
      steps: result.steps,
      finalAnswer: result.finalAnswer,
    });

    return respond(result, 'ai');
  } catch (error) {
    console.error('solve-photo error:', error);
    return Response.json(
      { error: 'שגיאה בפתרון השאלה. נסי שוב.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
