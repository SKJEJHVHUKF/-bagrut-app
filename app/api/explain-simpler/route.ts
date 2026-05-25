import { requireProUser, callTutor, sanitize } from '@/lib/ai-tutor';

// "Explain this solution to me in simpler words" — when the student
// has revealed the full step-by-step but still doesn't grok it.
// Output is just 3 short sentences in everyday Hebrew, no jargon.

export const maxDuration = 30;

const SYSTEM_PROMPT = `אתה מורה פרטי למתמטיקה לתלמיד תיכון. התלמיד ראה את הפתרון המלא לשאלה אבל לא ממש הבין למה.

תפקידך: הסבר במשפט אחד מה השאלה דרשה, במשפט שני איך פותרים, במשפט שלישי מה התשובה הסופית.

חוקים:
- 3 משפטים בלבד — בעברית פשוטה, כאילו אתה מסביר לחבר ולא לכיתה.
- בלי טרמינולוגיה מתמטית מתקדמת. אם חייב להשתמש בנוסחה, עטוף ב-$...$.
- בלי לחזור על הפתרון המלא — תן את הרעיון, לא את החישוב.
- בלי "כפי שאתה רואה", "ברור ש", "פשוט מאוד" — דברים שמרגישים מתנשאים.
- ענה רק בטקסט, בלי כותרות או רשימות.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    explanation: { type: 'string' },
  },
  required: ['explanation'],
  additionalProperties: false,
};

type ExplainResponse = { explanation: string };

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
    const solution = sanitize(body?.solution, 3000);
    if (!question || !solution) {
      return Response.json({ error: 'Missing question or solution' }, { status: 400 });
    }

    const userPrompt = `השאלה:
${question}

הפתרון המלא (שהתלמיד ראה אבל לא הבין):
${solution}

עכשיו תסביר במילים פשוטות בשלושה משפטים.`;

    const { data } = await callTutor<ExplainResponse>({
      apiKey,
      model: 'claude-haiku-4-5',
      maxTokens: 500,
      system: SYSTEM_PROMPT,
      user: userPrompt,
      schema: RESPONSE_SCHEMA,
    });

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('explain-simpler error:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { error: `שגיאה בהכנת ההסבר. נסה שוב. [debug: ${msg.slice(0, 200)}]` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
