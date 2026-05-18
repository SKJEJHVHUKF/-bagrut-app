import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

// Answer-checking is short input/short output. Haiku 4.5 with max_tokens=400
// runs in 2-5s and costs roughly $0.003 per check.
export const maxDuration = 60;

// Limits — the inputs come from inside our own UI so we trust the shape,
// but still cap sizes to prevent abuse via the open API.
const MAX_PROMPT_LEN = 1500;     // the question itself
const MAX_ANSWER_LEN = 800;      // user's typed answer
const MAX_CORRECT_LEN = 1000;    // the reference answer (final_answer field)
const MAX_CONTEXT_LEN = 1500;    // optional surrounding context

const BLACKLIST = /[\x00-\x1f]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|<\s*\/?\s*(script|iframe|object|embed)/i;

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

type Verdict = 'correct' | 'partial' | 'wrong';

const SYSTEM_PROMPT = `אתה בודק תשובות של תלמיד תיכון לבגרות בישראל.

תקבל:
- את ניסוח השאלה (סעיף בשאלת בגרות)
- את התשובה הנכונה (התשובה הסופית מהפתרון הרשמי)
- את התשובה של התלמיד

תפקידך:
1) להחליט אם התשובה של התלמיד נכונה / חלקית / שגויה.
2) להסביר בקצרה (משפט-שניים) **למה** — מה הוא עשה נכון או באיזה שלב טעה.
3) להוסיף טיפ קצר לעתיד, אם יש משהו ספציפי שכדאי לזכור.

חשוב מאוד:
- שני ביטויים שווים מתמטית = תשובה נכונה. לדוגמה: "$\\frac{1}{2}$" שווה ל-"0.5" שווה ל-"½".
- "$x = 2, x = 3$" שווה ל-"$x_1 = 2, x_2 = 3$" שווה ל-"2 ו-3".
- סדר פתרונות לא משנה.
- ביטוי אלגברי שונה אבל זהה אחרי פישוט = נכון. למשל "$2(x+1)$" = "$2x + 2$".
- אם התלמיד פתח טווח (-1, 5) והתשובה היא $-1 < x < 5$ — שווה.
- אם התלמיד כתב את התשובה בלי יחידות אבל זה נכון מספרית — קבל את זה כנכון, ובטיפ הזכר לכלול יחידות.

תשובה חלקית ("partial") מתאימה כאשר:
- חלק מהפתרון נכון אבל חלק חסר/שגוי.
- התלמיד הגיע לתשובה הנכונה אבל בדרך לא מקובלת (פגום, אם כתבת רק תוצאה ולא הגעת לפתרון).

ענה תמיד בעברית ברורה (גם לתשובות באנגלית).`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['correct', 'partial', 'wrong'] },
    feedback: { type: 'string' },
    tip: { type: 'string' },
  },
  required: ['verdict', 'feedback', 'tip'],
  additionalProperties: false,
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
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 415 });
    }

    // Auth — answer-checking is for logged-in students only.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    let body: { question?: unknown; correctAnswer?: unknown; userAnswer?: unknown; context?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const correctAnswer = typeof body.correctAnswer === 'string' ? body.correctAnswer.trim() : '';
    const userAnswer = typeof body.userAnswer === 'string' ? body.userAnswer.trim() : '';
    const ctxText = typeof body.context === 'string' ? body.context.trim() : '';

    if (!question || !correctAnswer || !userAnswer) {
      return Response.json({ error: 'Missing question, correctAnswer or userAnswer' }, { status: 400 });
    }
    if (question.length > MAX_PROMPT_LEN ||
        correctAnswer.length > MAX_CORRECT_LEN ||
        userAnswer.length > MAX_ANSWER_LEN ||
        ctxText.length > MAX_CONTEXT_LEN) {
      return Response.json({ error: 'Input too long' }, { status: 400 });
    }
    if (BLACKLIST.test(userAnswer) || BLACKLIST.test(question)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const userPrompt = `${ctxText ? `הקשר השאלה:\n${ctxText}\n\n` : ''}השאלה (הסעיף שהתלמיד פותר):
${question}

התשובה הנכונה (לפי הפתרון הרשמי):
${correctAnswer}

התשובה של התלמיד:
${userAnswer}

עכשיו: החזר verdict, feedback קצר, וטיפ קצר.`;

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      // Haiku 4.5 — answer checking is short input/short output, no math
      // generation. ~$0.003 per check is the cheap end of the menu.
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } } } as any),
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response shape');

    const parsed = JSON.parse(content.text) as {
      verdict: Verdict;
      feedback: string;
      tip: string;
    };

    return Response.json(parsed, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('check-answer error:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { error: `שגיאה בבדיקת התשובה. נסה שוב. [debug: ${msg.slice(0, 200)}]` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
