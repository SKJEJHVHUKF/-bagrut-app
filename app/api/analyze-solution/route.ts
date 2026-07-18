import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';
import { MATH5 } from '@/content/bagrut-context';
import { allLessonKeys, getLesson } from '@/content/lessons';

// "Photo & Feedback" — the student photographs their OWN handwritten solution
// and gets a step-by-step audit that pinpoints the FIRST mistake (like the
// why-wrong tutor, but from an image + multi-step). One Sonnet vision call:
//   read handwriting → audit each step → find first deviation → diagnose →
//   correct continuation → encouraging Hebrew.
// Pro-only (no library/cache path — a handwritten solution is unique).
export const maxDuration = 60;

const FREE_DAILY_SCANS = 0; // audit is Pro-only
const PRO_DAILY_SCANS = 150;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const ERROR_CATEGORY_ENUM = [
  'טעות סימן',
  'תחום הגדרה',
  'גזירה פנימית',
  'הנחת יסוד גיאומטרית',
  'טעות אלגברית',
  'טעות חשבונית',
  'שכחת תנאי',
  'אחר',
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

// Topic-by-topic formula reference — the same canonical summaries the student
// sees, so the audit judges against the bagrut method, not a random one.
function buildTopicReference(): string {
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
  return `## מאגר נוסחאות לפי נושא — הסטנדרט של האפליקציה\n\nהסתמך עליו כשאתה שופט את הפתרון. אם יש סתירה בין הזיכרון שלך למה שכאן — מה שכאן גובר.\n\n${summaries}`;
}

const AUDIT_INSTRUCTIONS = `## המשימה שלך

תקבל צילום של פתרון **בכתב-יד** של תלמיד לשאלת מתמטיקה 5 יחידות (אולי גם את נוסח השאלה). עליך לבדוק את הפתרון שלו — לא לפתור מאפס.

עשה זאת כך:
1. **תמלל** את הפתרון בכתב-היד ל-\`transcription\` (עברית + LaTeX ב-$...$). אם קשה לקרוא חלק — כתוב את מה שסביר.
2. **עבור צעד-אחר-צעד.** לכל צעד שזיהית החזר אובייקט ב-\`steps\`: \`{ text, ok, issue? }\` — \`ok=true\` אם הצעד נכון מתמטית, אחרת \`ok=false\` ו-\`issue\` = מה בדיוק שגוי בו.
3. **אתר את הסטיה הראשונה.** \`firstErrorStep\` = מספר הצעד הראשון השגוי (החל מ-1). אם הכל נכון → \`0\`.
4. **\`diagnosis\`** = משפט-שניים שמסבירים בדיוק את הטעות ("בצעד 3 טעית בסימן כשפתחת את הסוגריים: $-(x-2)$ הוא $-x+2$ ולא $-x-2$"). ריק אם הפתרון נכון.
5. **\`category\`** = סווג את הטעות לאחת בדיוק: ${ERROR_CATEGORY_ENUM.join(' · ')}. אם נכון → "אחר".
6. **\`correctContinuation\`** = הצעד הנכון שהיה צריך לעשות בנקודת הטעות (ריק אם נכון).
7. **\`encouragement\`** = משפט קצר, חם ומעודד בעברית (לא מתנשא).
8. **\`isCorrect\`** = האם הפתרון כולו נכון.

חוקים: ספציפי ולא כללי · מצא את הטעות **הראשונה** (טעויות מאוחרות יותר לרוב נובעות ממנה) · אם הפתרון נכון — אמור זאת בבירור ושבח · מתמטיקה תמיד ב-$...$ · אל תמציא טעות שאינה קיימת.

אם התמונה מטושטשת/לא קריאה או אינה פתרון מתמטי → החזר \`{ "error": "<הסבר קצר בעברית>" }\`.`;

const AUDIT_SYSTEM_PROMPT = [
  MATH5.identity,
  MATH5.styleGuide,
  buildTopicReference(),
  AUDIT_INSTRUCTIONS,
].join('\n\n');

const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    transcription: { type: 'string' },
    topic: { type: 'string' },
    isCorrect: { type: 'boolean' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          ok: { type: 'boolean' },
          issue: { type: 'string' },
        },
        required: ['text', 'ok'],
        additionalProperties: false,
      },
    },
    firstErrorStep: { type: 'integer' },
    diagnosis: { type: 'string' },
    category: { type: 'string', enum: ERROR_CATEGORY_ENUM },
    correctContinuation: { type: 'string' },
    encouragement: { type: 'string' },
  },
  additionalProperties: false,
};

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
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    // Pro-only — a handwriting audit is a fresh AI vision call every time.
    if (!isProUser(user)) {
      return Response.json(
        {
          error: 'ניתוח פתרון מצילום הוא פיצ׳ר Pro. שדרג כדי שהמורה יבדוק לך את הפתרון ויאתר איפה טעית.',
          proRequired: true,
        },
        { status: 402 }
      );
    }

    const usedToday = await scansToday(supabase, user.id);
    if (usedToday >= PRO_DAILY_SCANS) {
      return Response.json(
        { error: `הגעת למכסת ${PRO_DAILY_SCANS} הצילומים היומית. חזור מחר.`, quotaExceeded: true },
        { status: 429 }
      );
    }

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
    const questionText =
      typeof formData.get('question') === 'string' ? (formData.get('question') as string).slice(0, 1500) : '';
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
        { error: 'פורמט לא נתמך. השתמש ב-JPG, PNG, WebP או GIF.' },
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

    const userText = questionText
      ? `נוסח השאלה (להקשר):\n${questionText}\n\nבתמונה: הפתרון של התלמיד בכתב-יד. בדוק אותו לפי ההנחיות.`
      : 'בתמונה: הפתרון של התלמיד בכתב-יד. בדוק אותו לפי ההנחיות.';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5', // Hebrew + handwriting + LaTeX needs Sonnet vision
      max_tokens: 2500,
      system: [
        {
          type: 'text' as const,
          text: AUDIT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
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
            { type: 'text', text: userText },
          ],
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ output_config: { format: { type: 'json_schema', schema: AUDIT_SCHEMA } } } as any),
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected audit shape');
    const parsed = JSON.parse(content.text);

    void supabase.from('scan_log').insert({ source: 'audit' }).then(({ error }) => {
      if (error) console.error('[scan_log] audit insert failed:', error.message);
    });

    return Response.json(parsed, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('analyze-solution error:', error);
    return Response.json({ error: 'שגיאה בניתוח הפתרון. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
