import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';

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

const SYSTEM_PROMPT = `אתה מורה פרטי למתמטיקה 5 יחידות שמסביר שאלות בגרות לתלמיד תיכון.

תקבל תמונה של שאלת בגרות במתמטיקה. עבודתך:

1. **לתמלל** את השאלה המופיעה בתמונה במדויק, כולל סימני LaTeX (כתוב $...$ סביב ביטויים מתמטיים).
2. **לזהות** את הנושא העיקרי של השאלה מתוך הרשימה הסגורה: ${KNOWN_TOPICS.join(', ')}. אם לא מתאים לאף אחד — בחר "אלגברה" כברירת מחדל.
3. **לפתור** את השאלה צעד אחר צעד. כל צעד הוא אובייקט עם title (כותרת קצרה של 3-7 מילים) ו-content (הסבר מלא של 1-4 משפטים, עם LaTeX). 4-8 צעדים בסך הכל.
4. **לתת תשובה סופית** ברורה.

חוקים:
- כתוב בעברית בלבד. שפה ברורה, ידידותית, "כמו מורה פרטי שמסביר בכיתה".
- כל ביטוי מתמטי עטוף ב-$...$ (inline) או $$...$$ (block).
- אם התמונה לא מכילה שאלת מתמטיקה — החזר error: "התמונה לא מכילה שאלת מתמטיקה ברורה."
- אם איכות התמונה גרועה ואי-אפשר לקרוא — error: "התמונה לא ברורה מספיק. נסי לצלם שוב בתאורה טובה יותר."
- אם השאלה לא מ-5 יחידות / חורגת מהיקף הסילבוס — תפתור אותה בכל זאת, אבל ציין בצעד הראשון שזה מעבר לסילבוס.`;

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
      max_tokens: 2048,
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
              text: 'זוהי שאלת בגרות במתמטיקה. תמלל אותה, זהה את הנושא, ופתור אותה צעד-אחר-צעד.',
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
