import { requireProUser, callTutor, sanitize, logAgentUsage } from '@/lib/ai-tutor';
import { buildPilotGrounding } from '@/lib/tutor-grounding';

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
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
    const solution = sanitize(body?.solution, 3000);
    if (!question || !solution) {
      return Response.json({ error: 'Missing question or solution' }, { status: 400 });
    }

    const userPrompt = `השאלה:
${question}

הפתרון המלא (שהתלמיד ראה אבל לא הבין):
${solution}

עכשיו תסביר במילים פשוטות בשלושה משפטים.`;

    // Ground the plain-language gloss in the verified content for the pilot
    // topic so the simpler explanation can't drift from the curriculum.
    // Essentials only — נוסחאות + טעויות נפוצות. The prompt above already carries
    // this question and its solution, and NOTHING here is cached: every token is
    // billed at 1x on every press. See buildTopicExtras for what is dropped and why.
    const grounding = buildPilotGrounding(topic, { essentialsOnly: true });
    const system = grounding ? `${SYSTEM_PROMPT}\n\n---\n\n${grounding}` : SYSTEM_PROMPT;

    const { data } = await callTutor<ExplainResponse>({
      apiKey,
      label: 'explain-simpler',
      model: 'claude-haiku-4-5',
      maxTokens: 500,
      system,
      user: userPrompt,
      schema: RESPONSE_SCHEMA,
    });
    // Charge the durable daily quota only after the model call succeeded.
    await logAgentUsage(auth.supabase, auth.user.id, 'tutor');

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('explain-simpler error:', error);
    return Response.json(
      { error: 'שגיאה בהכנת ההסבר. נסה שוב.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
