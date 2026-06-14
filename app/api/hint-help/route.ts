import { requireProUser, callTutor, sanitize } from '@/lib/ai-tutor';
import { buildPilotGrounding } from '@/lib/tutor-grounding';

// "I've seen all hints but still stuck" — student exhausted the 3
// gradual hints and isn't ready to give up to the full solution.
// We take the LAST hint and unpack it pedagogically — what does it
// actually tell you to do, with a small concrete sub-example if it
// helps, WITHOUT revealing the final answer.

export const maxDuration = 30;

const SYSTEM_PROMPT = `אתה מורה פרטי למתמטיקה. תלמיד ראה את כל הרמזים המודרגים אבל עדיין תקוע ולא רוצה את הפתרון המלא.

תפקידך: לפרק את הרמז האחרון לרעיון פדגוגי קטן שיעזור לו להתחיל בעצמו.

חוקים:
- 3-5 משפטים. תתחיל מ"הרמז אומר לך ש..." או דומה.
- אם מועיל — תן דוגמה זוטא (כמו: "תחשוב על זה כמו $2^3 = 8$, אותו רעיון").
- **אסור** לחשוף את התשובה הסופית או את הצעדים שאחרי הרמז.
- אסור להגיד "ברור" / "פשוט".
- בעברית פשוטה, מתמטיקה ב-$...$.
- ענה רק בטקסט.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    response: { type: 'string' },
  },
  required: ['response'],
  additionalProperties: false,
};

type HintHelpResponse = { response: string };

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
    const hints: unknown = body?.hints;
    if (!question || !Array.isArray(hints) || hints.length === 0) {
      return Response.json({ error: 'Missing question or hints' }, { status: 400 });
    }
    const cleanHints: string[] = [];
    for (const h of hints) {
      const cleaned = sanitize(h);
      if (!cleaned) {
        return Response.json({ error: 'Invalid hint' }, { status: 400 });
      }
      cleanHints.push(cleaned);
    }

    const lastHint = cleanHints[cleanHints.length - 1];
    const userPrompt = `השאלה:
${question}

הרמזים שהתלמיד כבר ראה (לפי סדר):
${cleanHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}

הרמז האחרון (שעדיין לא מספיק לתלמיד) הוא:
"${lastHint}"

תפרק לו את הרמז הזה לרעיון מעשי — מה הוא צריך לעשות בפועל. אבל אל תפתור את כל השאלה.`;

    // Ground in the verified content so the unpacked hint stays inside the
    // curriculum (and within 582 conventions) for the pilot topic.
    const grounding = buildPilotGrounding(topic);
    const system = grounding ? `${SYSTEM_PROMPT}\n\n---\n\n${grounding}` : SYSTEM_PROMPT;

    const { data } = await callTutor<HintHelpResponse>({
      apiKey,
      model: 'claude-haiku-4-5',
      maxTokens: 600,
      system,
      user: userPrompt,
      schema: RESPONSE_SCHEMA,
    });

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('hint-help error:', error);
    return Response.json(
      { error: 'שגיאה בהכנת העזרה. נסה שוב.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
