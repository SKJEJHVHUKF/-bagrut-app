import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';
import { MATH5 } from '@/content/bagrut-context';
import { allLessonKeys, getLesson } from '@/content/lessons';

// Vision + math reasoning. Sonnet 4.5 reads the photo, classifies the topic,
// transcribes the question, and writes a step-by-step solution. Vercel
// Hobby caps function duration at 60s — Sonnet typically finishes within
// 15-30s for a single math problem.
export const maxDuration = 60;

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
  'פונקציות',
  'חשבון דיפרנציאלי',
  'חשבון אינטגרלי',
  'טריגונומטריה',
  'פונקציה מעריכית',
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

const VISION_TASK_INSTRUCTIONS = `## המשימה שלך עכשיו

יוצג לך **צילום של שאלת בגרות במתמטיקה 5 יחידות**. עליך:

1. **לתמלל** את השאלה במדויק כפי שמופיעה בתמונה — כולל כל הסעיפים (א, ב, ג). הצב את הביטויים המתמטיים ב-LaTeX (\`$...$\` inline, \`$$...$$\` block). שמור על פיסוק ועברית מקורית.
2. **לזהות** את הנושא העיקרי מתוך הרשימה הסגורה: ${KNOWN_TOPICS.join(' • ')}. אם השאלה חוצה נושאים — בחר את הנושא הדומיננטי. אם השאלה לא מתאימה לאף אחד מה-13 — בחר "אלגברה" כברירת מחדל.
3. **לפתור** את השאלה צעד-אחר-צעד, לפי המתודולוגיה לעיל ולפי הסטנדרט של הנוסחאות במאגר. כתוב 4-10 צעדים. אם השאלה כוללת מספר סעיפים (א, ב, ג) — פתור את כולם, וציין בכותרת הצעד את הסעיף.
4. **לתת תשובה סופית** ברורה ומדויקת.

**הגבלות:**
- אם איכות התמונה גרועה ואי-אפשר לקרוא את השאלה — \`{"error": "התמונה לא ברורה מספיק. נסי לצלם שוב בתאורה טובה יותר ובזווית ישרה."}\`.
- אם התמונה לא מכילה שאלת מתמטיקה — \`{"error": "התמונה לא נראית כמו שאלת מתמטיקה. נסי לצלם שאלה מספר תרגול או בגרות."}\`.
- אם השאלה חורגת מסילבוס 5 יחידות (נדיר — למשל חומר אוניברסיטאי) — תפתור בכל זאת, אבל ציין בצעד הראשון: "שים לב: שאלה זו חורגת מסילבוס בגרות 5 יח׳, אבל הנה הפתרון."

**אסור:**
- לדלג צעדים.
- לתת תשובה עשרונית כשיש צורה מדויקת ($\\sqrt{2}, \\pi/4$).
- להסביר תחילת הצעד באנגלית.`;

function buildSystemPrompt(): string {
  return [
    MATH5.identity,
    MATH5.examStructure,
    MATH5.styleGuide,
    PEDAGOGICAL_PRINCIPLES,
    SOLUTION_METHODOLOGY,
    buildTopicReference(),
    VISION_TASK_INSTRUCTIONS,
    OUTPUT_FORMAT_EXAMPLE,
  ].join('\n\n');
}

const SYSTEM_PROMPT = buildSystemPrompt();

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

type SolveResponse =
  | { error: string }
  | {
      subject: 'math5';
      topic: string;
      transcribedQuestion: string;
      steps: { title: string; content: string }[];
      finalAnswer: string;
    };

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (looksLikeBot(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fingerprint = getFingerprint(request);
    const limit = checkRateLimit(fingerprint);
    if (!limit.allowed) {
      return Response.json(
        { error: 'יותר מדי בקשות. נסי שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    // Auth + Pro check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }
    if (!isProUser(user)) {
      return Response.json(
        { error: 'פיצ׳ר Pro — שדרגי כדי לפתור שאלות מצילום' },
        { status: 402 }
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

    // Encode image to base64 for the Anthropic SDK
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      // Sonnet 4.5 — best vision-capable model for math problems. Haiku
      // is faster but makes more transcription mistakes on Hebrew + LaTeX.
      model: 'claude-sonnet-4-5',
      // Bumped from 2048 → 3072. With the richer prompt the model produces
      // longer, more thorough explanations (6-10 steps for multi-part
      // bagrut questions). 3072 fits comfortably in the 60s Vercel cap.
      max_tokens: 3072,
      system: SYSTEM_PROMPT,
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
            {
              type: 'text',
              text: 'זוהי שאלת בגרות במתמטיקה. תמלל אותה, זהה את הנושא, ופתור צעד-אחר-צעד לפי המתודולוגיה ומאגר הנוסחאות שניתנו לך.',
            },
          ],
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } } } as any),
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response shape');

    const parsed = JSON.parse(content.text) as SolveResponse;

    // If the model returned an error, surface it as 200 (so the client
    // shows it as a friendly message rather than a network error toast).
    if ('error' in parsed && parsed.error) {
      return Response.json(parsed, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // Defensive defaults — ensure subject is set
    const result = parsed as Exclude<SolveResponse, { error: string }>;
    if (!result.subject) result.subject = 'math5';

    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('solve-photo error:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { error: `שגיאה בפתרון השאלה. נסי שוב. [debug: ${msg.slice(0, 200)}]` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
