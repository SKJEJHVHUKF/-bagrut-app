import { requireProUser, callTutor, sanitize, logAgentUsage } from '@/lib/ai-tutor';
import { buildPilotGrounding } from '@/lib/tutor-grounding';

// "Why did I get this wrong?" — appears only when the verdict from
// /api/check-answer is 'wrong'. We have the student's actual answer
// in addition to the correct answer, so the response can pinpoint
// the SPECIFIC mistake (lost a minus, forgot domain check, etc.) —
// not just re-solve the problem.

export const maxDuration = 30;

const SYSTEM_PROMPT = `אתה מורה פרטי למתמטיקה. תלמיד נתן תשובה לא נכונה לשאלה. תפקידך לזהות בדיוק איפה הוא טעה.

תפקידך:
1. **הטעות**: ספציפית מה הוא עשה לא נכון (לא "אתה טעית בחישוב" — אלא "שכחת להעלות את שני האגפים בריבוע" / "פספסת את התחום $x>0$" / "ערבבת בין סינוס לקוסינוס").
2. **המהלך הנכון**: משפט אחד שאומר מה היה הצעד הנכון באותה נקודה.
3. **category**: סווג את הטעות לאחת מהקטגוריות הבאות בדיוק (מחרוזת אחת מהרשימה): "טעות סימן", "תחום הגדרה", "גזירה פנימית", "הנחת יסוד גיאומטרית", "טעות אלגברית", "טעות חשבונית", "שכחת תנאי", "אחר".

חוקים:
- שני משפטים בלבד. אל תפתור הכל מחדש.
- ספציפי, לא כללי. מצא את **הסטיה הראשונה** בדיוק.
- בעברית פשוטה, כאילו לחבר.
- מתמטיקה ב-$...$.
- אל תכתוב "כל הכבוד שניסית" או "אל תתייאש" — תהיה עניני.`;

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

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    mistake: { type: 'string' },
    correctApproach: { type: 'string' },
    category: { type: 'string', enum: ERROR_CATEGORY_ENUM },
  },
  required: ['mistake', 'correctApproach', 'category'],
  additionalProperties: false,
};

type WhyWrongResponse = { mistake: string; correctApproach: string; category: string };

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
    const correctAnswer = sanitize(body?.correctAnswer);
    const userAnswer = sanitize(body?.userAnswer, 800);
    const context = typeof body?.context === 'string' ? sanitize(body.context) : null;
    // The authored worked solution. Without it the model diagnoses the mistake
    // from the final answer alone — i.e. it re-solves the question itself and
    // then guesses where the student diverged. With it, "the first deviation"
    // is a comparison against verified steps, not a guess.
    const solution = typeof body?.solution === 'string' ? sanitize(body.solution, 4000) : null;
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';

    if (!question || !correctAnswer || !userAnswer) {
      return Response.json(
        { error: 'Missing question / correctAnswer / userAnswer' },
        { status: 400 }
      );
    }

    const userPrompt = `${context ? `הקשר השאלה:\n${context}\n\n` : ''}השאלה:
${question}

התשובה הנכונה:
${correctAnswer}
${solution ? `\nהפתרון הכתוב והמאומת (להשוואה בלבד — אל תעתיק אותו; מצא את הסטייה הראשונה של התלמיד ממנו):\n${solution}\n` : ''}
התשובה של התלמיד (לא נכונה):
${userAnswer}

זהה את הטעות הספציפית והסבר במשפט מה היה צריך לעשות באותה נקודה.`;

    // Ground the feedback in the verified content (incl. the common-mistake
    // bank) for the pilot topic, so the diagnosis names a real misconception.
    // Essentials only — נוסחאות + טעויות נפוצות. The prompt above already carries
    // this question and its solution, and NOTHING here is cached: every token is
    // billed at 1x on every press. See buildTopicExtras for what is dropped and why.
    const grounding = buildPilotGrounding(topic, { essentialsOnly: true });
    const system = grounding ? `${SYSTEM_PROMPT}\n\n---\n\n${grounding}` : SYSTEM_PROMPT;

    const { data } = await callTutor<WhyWrongResponse>({
      apiKey,
      label: 'why-wrong',
      model: 'claude-haiku-4-5',
      maxTokens: 500,
      system,
      user: userPrompt,
      schema: RESPONSE_SCHEMA,
    });
    await logAgentUsage(auth.supabase, auth.user.id, 'tutor');

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('why-wrong error:', error);
    return Response.json(
      { error: 'שגיאה בניתוח הטעות. נסה שוב.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
