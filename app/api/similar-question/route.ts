import { requireProUser, callTutor, sanitize } from '@/lib/ai-tutor';

// "Give me another question like this" — student finished an exercise
// and wants to practice the same pattern with different numbers. We
// generate a fresh question matching the topic + difficulty, with a
// single hint and a full step-by-step solution.

export const maxDuration = 30;

const SYSTEM_PROMPT = `אתה כותב שאלות לבגרות מתמטיקה 5 יחידות. קיבלת שאלה מקורית, ועליך לחבר שאלה חדשה באותו דפוס בדיוק — אותו נושא, אותם כלים מתמטיים, אותו רמת קושי — אבל עם מספרים או מצב שונים, כך שהתלמיד באמת מתרגל ולא רק מעתיק.

חוקים:
- אותו דפוס פתרון מהשאלה המקורית. אם המקור דורש דיסקרימיננטה, גם החדשה. אם הוא דורש זהות פיתגורס, גם.
- בעברית בלבד. מתמטיקה עטופה ב-$...$ (inline) או $$...$$ (block).
- ניסוח קצר וברור — שאלת בגרות אמיתית, לא פסקה מילולית.
- ה-hint הוא רמז אחד שאמור להתחיל את התלמיד בלי לחשוף הכל.
- ה-solution.steps הם 3-6 צעדים, כל אחד עם משפט הסבר קצר.
- ה-final_answer בצורה מדויקת ($\\sqrt{2}/2$, לא $0.707$).

החזר רק JSON תקין.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    hint: { type: 'string' },
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
  required: ['question', 'hint', 'solution'],
  additionalProperties: false,
};

type SimilarResponse = {
  question: string;
  hint: string;
  solution: { steps: string[]; final_answer: string };
};

const ALLOWED_DIFFICULTIES = new Set(['easy', 'mid', 'hard']);

export async function POST(request: Request) {
  try {
    const auth = await requireProUser(request);
    if (!auth.ok) return auth.response;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const original = sanitize(body?.originalQuestion, 3000);
    const topic = sanitize(body?.topic, 100);
    const difficulty =
      typeof body?.difficulty === 'string' && ALLOWED_DIFFICULTIES.has(body.difficulty)
        ? (body.difficulty as 'easy' | 'mid' | 'hard')
        : 'mid';
    if (!original || !topic) {
      return Response.json(
        { error: 'Missing originalQuestion or topic' },
        { status: 400 }
      );
    }

    const userPrompt = `נושא: ${topic}
רמת קושי: ${difficulty}

השאלה המקורית (לחבר שאלה חדשה באותו דפוס בדיוק):
${original}

עכשיו תייצר שאלה חדשה בדיוק באותו דפוס, עם hint יחיד ופתרון מלא.`;

    const { data } = await callTutor<SimilarResponse>({
      apiKey,
      model: 'claude-sonnet-4-5',
      maxTokens: 1200,
      system: SYSTEM_PROMPT,
      user: userPrompt,
      schema: RESPONSE_SCHEMA,
    });

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('similar-question error:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { error: `שגיאה ביצירת שאלה דומה. נסה שוב. [debug: ${msg.slice(0, 200)}]` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
