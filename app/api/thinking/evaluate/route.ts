import { requireProUser, callTutor, sanitize } from '@/lib/ai-tutor';

// Evaluate a student's free-text (Hebrew) answer to a "סעיף חשיבה והבנה"
// question. Judges LOGICAL COMPLETENESS against the ideal answer points,
// gives constructive feedback, and shows a full-score model answer.
// Pro-only.
export const maxDuration = 60;

const EVAL_SYSTEM = `אתה בוחן מורה למתמטיקה 5 יחידות. תלמיד ענה בטקסט חופשי (עברית) על סעיף חשיבה והבנה. תפקידך להעריך את **שלמות ההיגיון** של ההסבר שלו — לא את הניסוח.

תקבל: את השאלה, את נקודות-המפתח שתשובה מלאה חייבת לכלול, ואת תשובת התלמיד.

עליך להחזיר:
- \`score\`: 0-100 — עד כמה ההסבר שלם ונכון לוגית (כמה מנקודות-המפתח כוסו נכון).
- \`coveredPoints\`: הנקודות שהתלמיד כיסה נכון (נסח קצר, בעברית).
- \`missingPoints\`: הנקודות החשובות שחסרות או שגויות בתשובתו.
- \`feedback\`: 2-3 משפטים בונים ומעודדים — מה היה טוב ומה להוסיף. בעברית פשוטה, כמו לחבר.
- \`modelAnswer\`: איך לנסח תשובה לציון מלא (2-4 משפטים).

חוקים:
- הוגן ומעודד, לא מתנשא. תלמיד שכיוון נכון אבל קצר — תן לו קרדיט והראה איך להרחיב.
- אל תוריד נקודות על ניסוח או כתיב, רק על היגיון/מושגים חסרים.
- מתמטיקה ב-$...$, בלי עברית בתוך $...$.`;

const EVAL_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    coveredPoints: { type: 'array', items: { type: 'string' } },
    missingPoints: { type: 'array', items: { type: 'string' } },
    feedback: { type: 'string' },
    modelAnswer: { type: 'string' },
  },
  required: ['score', 'coveredPoints', 'missingPoints', 'feedback', 'modelAnswer'],
  additionalProperties: false,
};

export async function POST(request: Request) {
  try {
    const auth = await requireProUser(request);
    if (!auth.ok) return auth.response;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const question = sanitize(body?.question);
    const answer = sanitize(body?.answer, 2000);
    const idealPoints = Array.isArray(body?.idealAnswerPoints)
      ? (body.idealAnswerPoints as unknown[])
          .filter((p): p is string => typeof p === 'string')
          .slice(0, 8)
      : [];

    if (!question || !answer) {
      return Response.json({ error: 'חסרה שאלה או תשובה' }, { status: 400 });
    }

    const userPrompt = `השאלה:
${question}

נקודות-המפתח לתשובה מלאה:
${idealPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') || '(לא סופקו — הערך לפי שיקול דעתך)'}

תשובת התלמיד:
${answer}

הערך את שלמות ההסבר והחזר את השדות המבוקשים.`;

    const { data } = await callTutor<{
      score: number;
      coveredPoints: string[];
      missingPoints: string[];
      feedback: string;
      modelAnswer: string;
    }>({
      apiKey,
      model: 'claude-sonnet-4-5',
      maxTokens: 900,
      system: EVAL_SYSTEM,
      user: userPrompt,
      schema: EVAL_SCHEMA,
    });

    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('thinking evaluate error:', error);
    return Response.json({ error: 'שגיאה בהערכת התשובה. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
