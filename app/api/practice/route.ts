import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { buildBagrutContext } from '@/content/bagrut-context';
import { generateJSON } from '@/lib/anthropic-json';

// Vercel Hobby caps serverless functions at 60s. A single deep problem
// with 3 hints + ~5 solution steps typically finishes in 15-25s on
// Sonnet 4.6 — comfortably inside the cap.
export const maxDuration = 60;

// ===== SUBJECT PROMPTS =====
// Reuse the same subject keys as /api/questions so the /practice page
// can share the SUBJECTS map. Prompts here are tuned for ONE deep
// problem instead of 5 shallow ones.
const SUBJECTS: Record<string, { name: string; buildPrompt: (topic: string) => string }> = {
  math5: {
    name: 'מתמטיקה 5 יח׳',
    buildPrompt: (t) =>
      `אתה מורה פרטי למתמטיקה ברמת 5 יחידות לבגרות בישראל. תייצר תרגיל בגרות אחד אמיתי וברמה גבוהה בנושא: ${t}. תרגיל אחד מעמיק, לא מספר תרגילים.`,
  },
  math4: {
    name: 'מתמטיקה 4 יח׳',
    buildPrompt: (t) =>
      `אתה מורה פרטי למתמטיקה ברמת 4 יחידות לבגרות בישראל. תייצר תרגיל בגרות אחד ברמה הולמת ל-4 יחידות בנושא: ${t}. תרגיל אחד מעמיק.`,
  },
  physics: {
    name: 'פיזיקה',
    buildPrompt: (t) =>
      `אתה מורה לפיזיקה 5 יחידות לבגרות. תייצר תרגיל בגרות אחד אמיתי בנושא: ${t}. תרגיל אחד מעמיק עם חישובים.`,
  },
  english: {
    name: 'אנגלית',
    buildPrompt: (t) =>
      `You are an English Bagrut teacher (5 units). Generate ONE deep practice exercise about: ${t}. One in-depth question, not a list. Question and solution in English.`,
  },
  history: {
    name: 'היסטוריה',
    buildPrompt: (t) =>
      `אתה מורה להיסטוריה לבגרות. תייצר שאלת תרגול אחת מעמיקה בנושא: ${t}. שאלה אחת שדורשת ניתוח, לא רב-ברירה.`,
  },
  bible: {
    name: 'תנ"ך',
    buildPrompt: (t) =>
      `אתה מורה לתנ"ך לבגרות. תייצר שאלת תרגול אחת מעמיקה בנושא: ${t}. שאלה שדורשת ניתוח פסוקים/מסרים.`,
  },
  chem: {
    name: 'כימיה',
    buildPrompt: (t) =>
      `אתה מורה לכימיה 5 יחידות לבגרות. תייצר תרגיל בגרות אחד בנושא: ${t}. תרגיל אחד עם חישובים/ניתוח.`,
  },
};

// ===== SECURITY CONSTANTS =====
const MAX_TOPIC_LENGTH = 80;
const MIN_TOPIC_LENGTH = 2;
// Blocks the actually-dangerous chars (HTML / template injection) and
// known prompt-injection phrases. Earlier version had `[ -<>...]` which
// silently created a 0x20-0x3C range that *included spaces*, breaking
// every multi-word topic like "חשבון דיפרנציאלי".
const TOPIC_BLACKLIST = /[<>{}[\]\\]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|system\s*:|assistant\s*:|user\s*:|<\s*\/?\s*(script|iframe|object|embed)/i;

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

// Optional difficulty enum the client can request: 'easier' | 'normal' | 'harder'
type Difficulty = 'easier' | 'normal' | 'harder';
const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easier: 'התרגיל צריך להיות ברמה קלה יחסית — מתאים לתלמיד שעוד מתחיל את הנושא.',
  normal: 'התרגיל צריך להיות ברמה ממוצעת — לב הבגרות, לא הכי קל ולא הכי קשה.',
  harder: 'התרגיל צריך להיות מאתגר — שאלה בונוס ברמת קושי גבוהה לבגרות.',
};

export async function POST(request: Request) {
  try {
    // ===== 1. ORIGIN =====
    if (!isAllowedOrigin(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ===== 2. BOT =====
    if (looksLikeBot(request)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ===== 3. RATE LIMIT =====
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

    // ===== 4. CONTENT TYPE =====
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 415 });
    }

    // ===== 5. AUTH — practice is a Pro-ish feature, require login =====
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    // ===== 6. BODY =====
    let body: { subject?: unknown; topic?: unknown; difficulty?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const difficultyRaw = typeof body.difficulty === 'string' ? body.difficulty.trim() : 'normal';
    const difficulty: Difficulty = (['easier', 'normal', 'harder'] as Difficulty[]).includes(
      difficultyRaw as Difficulty
    )
      ? (difficultyRaw as Difficulty)
      : 'normal';

    if (!subject || !topic) {
      return Response.json({ error: 'Missing subject or topic' }, { status: 400 });
    }
    if (!SUBJECTS[subject]) {
      return Response.json({ error: 'Invalid subject' }, { status: 400 });
    }
    if (topic.length < MIN_TOPIC_LENGTH || topic.length > MAX_TOPIC_LENGTH) {
      return Response.json(
        { error: `Topic length must be between ${MIN_TOPIC_LENGTH} and ${MAX_TOPIC_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (TOPIC_BLACKLIST.test(topic)) {
      return Response.json({ error: 'Invalid topic' }, { status: 400 });
    }

    // ===== 7. KEY =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // ===== 8. PROMPT =====
    const subjectInfo = SUBJECTS[subject];
    const variationSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const tutorInstruction = `

מטרה: ליצור תרגיל בגרות אחד מעמיק עם מערכת רמזים והסבר צעד-אחר-צעד.

${DIFFICULTY_HINT[difficulty]}

📐 פורמט מתמטיקה — הממשק מרנדר LaTeX + Markdown:
- מתמטיקה: $...$ inline, $$...$$ block.
- השתמש ב-\\frac, \\sqrt, \\ln, \\sin, \\cos, \\int, \\sum, ^, _.

מבנה התשובה:
- problem: ניסוח התרגיל. שאלה אחת ברורה, אמיתית, ברמת בגרות. עם LaTeX אם רלוונטי.
- concept: מה התרגיל בודק? איזה כלל/נוסחה/עיקרון? משפט אחד.
- hints: בדיוק 3 רמזים פרוגרסיביים, מהקצר והעדין לכי מפורש:
  1) רמז 1: כיוון כללי — לאיזה כלי / נוסחה לפנות. בלי לחשוף את הפתרון.
  2) רמז 2: צעד ראשון קונקרטי — מה לעשות קודם. מתחיל להראות דרך.
  3) רמז 3: כמעט פתרון — מציג את המבנה של הפתרון, רק לא מסכם את התשובה הסופית.
- solution.steps: 3 עד 6 צעדים מסודרים שמובילים מהשאלה לתשובה הסופית.
  כל צעד עומד בפני עצמו — משפט אחד, מקסימום שניים. עם LaTeX לכל החישוב.
  הצעד האחרון חייב לכלול את התשובה הסופית בצורה ברורה.
- final_answer: התשובה הסופית בלבד, מנוסחת בקצרה. אם זה ערך מספרי — הערך. אם זה אי-שוויון — האי-שוויון. אם זה הוכחה — מסקנה.
- remember: טיפ זכירה אחד קצר. דרך לזכור את העיקרון הזה לבגרות.

שפה: עברית ברורה (אנגלית רק אם המקצוע אנגלית).

🎯 קריטי: רק תרגיל אחד! לא חמישה. לא רב-ברירה.

מזהה גיוון: ${variationSeed} (השתמש בו כדי לוודא שאתה לא חוזר על תרגילים זהים בין סבבים).`;

    // Note: previously prepended ~800 tokens of bagrut context here. That
    // grew per-call cost without proportional quality gain — removed.
    const fullPrompt = subjectInfo.buildPrompt(topic) + tutorInstruction;

    // ===== 9. SCHEMA =====
    const exerciseSchema = {
      type: 'object',
      properties: {
        problem: { type: 'string' },
        concept: { type: 'string' },
        hints: {
          type: 'array',
          items: { type: 'string' },
        },
        solution: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['steps'],
          additionalProperties: false,
        },
        final_answer: { type: 'string' },
        remember: { type: 'string' },
      },
      required: ['problem', 'concept', 'hints', 'solution', 'final_answer', 'remember'],
      additionalProperties: false,
    };

    // ===== 10. CALL ANTHROPIC =====
    // Sonnet 4.6 with structured output occasionally returns truncated
    // JSON for Hebrew content. generateJSON retries once on parse error.
    // max_tokens=2000 leaves comfortable headroom over the previous 1500.
    const client = new Anthropic({ apiKey });
    const { data: parsed } = await generateJSON<{
      problem?: unknown;
      hints?: unknown;
      solution?: { steps?: unknown };
    }>(
      client,
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ output_config: { format: { type: 'json_schema', schema: exerciseSchema } } } as any),
      },
      'practice'
    );

    // Sanity checks on the shape we promised the client
    if (!parsed.problem || !Array.isArray(parsed.hints) || !Array.isArray(parsed.solution?.steps)) {
      throw new Error('Invalid response structure');
    }

    return Response.json(parsed, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    // Log full details for ourselves; show a clean message to the student.
    console.error('Practice error:', error);
    return Response.json(
      { error: 'שגיאה ביצירת התרגיל. נסה שוב בעוד רגע.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
