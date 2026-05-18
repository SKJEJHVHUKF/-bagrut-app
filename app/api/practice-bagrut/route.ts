import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { serveFromPool } from '@/lib/question-pool';
import { buildBagrutContext } from '@/content/bagrut-context';
import { generateJSON } from '@/lib/anthropic-json';

// Vercel Hobby caps serverless functions at 60s. A full bagrut question
// with 3-4 parts (each with 3 hints + solution steps) is heavier than the
// quick-exercise route — bumped to max_tokens 2500 to fit a realistic
// 3-part question, still comfortably inside ~40s with Sonnet 4.6.
export const maxDuration = 60;

// Subject names + prompt openers — mirror /api/practice but tuned for one
// full multi-part bagrut question instead of a single short exercise.
const SUBJECTS: Record<string, { name: string; opener: (topic: string) => string }> = {
  math5: {
    name: 'מתמטיקה 5 יח׳',
    opener: (t) =>
      `אתה מורה פרטי למתמטיקה ברמת 5 יחידות לבגרות בישראל. צור שאלת בגרות אמיתית, מעמיקה, בנושא: ${t}. שאלה אחת עם 3 עד 4 סעיפים מתפתחים (סעיף א נותן את הבסיס, סעיף ב מתקדם, וכו׳).`,
  },
  math4: {
    name: 'מתמטיקה 4 יח׳',
    opener: (t) =>
      `אתה מורה פרטי למתמטיקה ברמת 4 יחידות לבגרות. צור שאלת בגרות אמיתית בנושא: ${t}. שאלה עם 3 עד 4 סעיפים מתפתחים.`,
  },
  physics: {
    name: 'פיזיקה',
    opener: (t) =>
      `אתה מורה לפיזיקה 5 יחידות לבגרות. צור שאלת בגרות בנושא: ${t}. 3-4 סעיפים עם חישובים.`,
  },
  english: {
    name: 'אנגלית',
    opener: (t) =>
      `You are an English Bagrut teacher. Create one bagrut-style question about: ${t}, with 3-4 progressive sub-parts. Question and solutions in English.`,
  },
  history: {
    name: 'היסטוריה',
    opener: (t) =>
      `אתה מורה להיסטוריה לבגרות. צור שאלה מנתחת בנושא: ${t} עם 3-4 סעיפים שדורשים ניתוח (לא רב-ברירה).`,
  },
  bible: {
    name: 'תנ"ך',
    opener: (t) =>
      `אתה מורה לתנ"ך לבגרות. צור שאלה מעמיקה בנושא: ${t} עם 3-4 סעיפים שדורשים ניתוח פסוקים.`,
  },
  chem: {
    name: 'כימיה',
    opener: (t) =>
      `אתה מורה לכימיה 5 יחידות לבגרות. צור שאלת בגרות בנושא: ${t} עם 3-4 סעיפים עם חישובים.`,
  },
};

// ===== Security constants — mirror /api/practice =====
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

type Difficulty = 'easier' | 'normal' | 'harder';
const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easier: 'השאלה צריכה להיות ברמה קלה יחסית — סעיפים נגישים לתלמיד בתחילת הלימוד.',
  normal: 'השאלה צריכה להיות ברמת בגרות סטנדרטית — לב הבגרות.',
  harder: 'השאלה צריכה להיות מאתגרת — שאלת בונוס ברמת קושי גבוהה.',
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

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 415 });
    }

    // Auth: full-bagrut generation is heavier than quick-practice, login required.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }

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

    // ===== POOL CHECK — try the pre-generated question pool first =====
    // If we have a row matching this subject/topic, serve it for free
    // (no Anthropic call). Falls back to live generation when the pool
    // is empty for that topic.
    const pooled = await serveFromPool(supabase, subject, topic, 'bagrut');
    if (pooled) {
      return Response.json(pooled, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const subjectInfo = SUBJECTS[subject];
    const variationSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const tutorInstruction = `

${DIFFICULTY_HINT[difficulty]}

📐 פורמט מתמטיקה — הממשק מרנדר LaTeX + Markdown:
- מתמטיקה: $...$ inline, $$...$$ block.
- השתמש ב-\\frac, \\sqrt, \\ln, \\sin, \\cos, \\int, \\sum, ^, _.

מבנה התשובה:
- context: הנתונים המשותפים לכל הסעיפים. הקדמה קצרה שמציגה את המצב/הפונקציה/המשולש/וכו׳. אם השאלה לא דורשת הקדמה, החזר מחרוזת ריקה.
- topic_tag: תיוג קצר של תת-הנושא (לדוגמה "פונקציה ריבועית" או "אינטגרל מסוים").
- parts: מערך של 3 עד 4 סעיפים. כל סעיף:
  - label: תווית הסעיף — "א" / "ב" / "ג" / "ד" (בעברית, או "a"/"b"/"c" באנגלית).
  - prompt: ניסוח הסעיף עצמו. ברור, ממוקד, ברמת בגרות.
  - answer_type: "number" אם התשובה ערך מספרי / "expression" אם זה ביטוי אלגברי או מתחם / "text" אם זה ניתוח מילולי.
  - hints: בדיוק 3 רמזים מהקל למפורט:
    1) רמז 1: לאיזה כלי לפנות, בלי לחשוף את הפתרון.
    2) רמז 2: הצעד הראשון הקונקרטי.
    3) רמז 3: כמעט פתרון — מבנה ההוכחה, רק לא התשובה.
  - solution.steps: 3 עד 6 צעדים מסודרים מסעיף לתשובה. כל צעד משפט אחד (מקס׳ שניים), עם LaTeX לחישוב.
  - solution.final_answer: התשובה הסופית בלבד, קצרה ומודגשת.

🎯 דרישות קריטיות:
- הסעיפים חייבים להיות מתפתחים: סעיף א מהווה בסיס לסעיף ב וכו׳.
- אל תייצר רב-ברירה. שאלות פתוחות בלבד.
- שפה: עברית (אנגלית רק אם המקצוע אנגלית).

מזהה גיוון: ${variationSeed}.`;

    const bagrutContext = buildBagrutContext(subject, topic);
    const fullPrompt = bagrutContext + '\n\n' + subjectInfo.opener(topic) + tutorInstruction;

    const partSchema = {
      type: 'object',
      properties: {
        label: { type: 'string' },
        prompt: { type: 'string' },
        answer_type: { type: 'string', enum: ['number', 'expression', 'text'] },
        hints: {
          type: 'array',
          items: { type: 'string' },
        },
        solution: {
          type: 'object',
          properties: {
            steps: { type: 'array', items: { type: 'string' } },
            final_answer: { type: 'string' },
          },
          required: ['steps', 'final_answer'],
          additionalProperties: false,
        },
      },
      required: ['label', 'prompt', 'answer_type', 'hints', 'solution'],
      additionalProperties: false,
    };

    const questionSchema = {
      type: 'object',
      properties: {
        context: { type: 'string' },
        topic_tag: { type: 'string' },
        parts: {
          type: 'array',
          items: partSchema,
        },
      },
      required: ['context', 'topic_tag', 'parts'],
      additionalProperties: false,
    };

    // Sonnet 4.6 — bagrut quality requires it. generateJSON wraps the
    // call with a one-shot retry on JSON parse errors (the known Hebrew
    // structured-output glitch).
    const client = new Anthropic({ apiKey });
    const { data: parsed } = await generateJSON<{
      context?: unknown;
      parts?: unknown[];
    }>(
      client,
      {
        // 2000 max_tokens (was 2500). Reduces a single attempt to ~25-35s,
        // leaving room for one retry inside Vercel's 60s function cap if
        // the first attempt produced malformed JSON.
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ output_config: { format: { type: 'json_schema', schema: questionSchema } } } as any),
      },
      'practice-bagrut'
    );

    if (
      typeof parsed.context !== 'string' ||
      !Array.isArray(parsed.parts) ||
      parsed.parts.length < 2
    ) {
      throw new Error('Invalid response structure');
    }

    return Response.json(parsed, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Practice-bagrut error:', error);
    return Response.json(
      { error: 'שגיאה ביצירת השאלה. נסה שוב בעוד רגע.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
