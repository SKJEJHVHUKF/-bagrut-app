import { requireProUser, callTutor } from '@/lib/ai-tutor';
import { createClient } from '@/lib/supabase/server';
import { serveFromPool } from '@/lib/question-pool';

// "סעיפי חשיבה והבנה" — generate ONE qualitative/verbal conceptual sub-question
// (the "unseen" style of recent bagruyot): analyse f vs f', parameter shifts
// f(x)+k, read a graph, "explain why/when". No numeric answer — the student
// answers in free Hebrew and /api/thinking/evaluate grades the reasoning.
// Pro-only. Served from the pool when warm, else generated live.
export const maxDuration = 60;

const MAX_TOPIC_LEN = 80;

const GEN_SYSTEM = `אתה מורה פרטי מומחה למתמטיקה 5 יחידות (שאלון 581/582). צור **סעיף חשיבה והבנה** אחד — שאלה מילולית/איכותית מהסוג שמופיע בבגרויות העדכניות, שבודקת הבנה מושגית ולא חישוב.

סוגי שאלות מתאימים (בחר אחד שמתאים לנושא):
- ניתוח קשר בין גרף $f$ לגרף $f'$ (איפה $f$ עולה/יורדת, סימן $f'$, נקודות קיצון ופיתול).
- השפעת פרמטר: מה קורה לגרף כשעוברים מ-$f(x)$ ל-$f(x)+k$ / $f(x+k)$ / $a\\cdot f(x)$.
- "הסבר מדוע" / "מתי" / "האם ייתכן ש..." — נימוק מילולי.
- קריאת גרף/סקיצה והסקת מסקנות על הפונקציה.
- הבנת משמעות של מושג (אסימפטוטה, תחום, רציפות, נגזרת כשיפוע).

חוקים:
- שאלה אחת בלבד, מנוסחת בעברית ברורה, מתמטיקה ב-$...$.
- זו שאלה שנפתרת בהסבר מילולי — לא בחישוב ארוך.
- \`idealAnswerPoints\`: 3-5 הנקודות שתשובה לציון מלא **חייבת** לכלול (כל נקודה משפט קצר).
- \`fullAnswer\`: תשובת מודל מלאה ומנוסחת היטב (כמו שהיית כותב בבגרות), 2-5 משפטים.
- אל תכתוב עברית בתוך $...$.`;

const GEN_SCHEMA = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    idealAnswerPoints: { type: 'array', items: { type: 'string' } },
    fullAnswer: { type: 'string' },
  },
  required: ['question', 'idealAnswerPoints', 'fullAnswer'],
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
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
    if (!topic || topic.length > MAX_TOPIC_LEN) {
      return Response.json({ error: 'נושא לא תקין' }, { status: 400 });
    }

    // Pool first (free) — thinking questions amortize like quiz/concept.
    const supabase = await createClient();
    const pooled = await serveFromPool<{
      question: string;
      idealAnswerPoints: string[];
      fullAnswer: string;
    }>(supabase, 'math5', topic, 'thinking');
    if (pooled && pooled.question) {
      return Response.json(pooled, { headers: { 'Cache-Control': 'no-store' } });
    }

    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const { data } = await callTutor<{
      question: string;
      idealAnswerPoints: string[];
      fullAnswer: string;
    }>({
      apiKey,
      model: 'claude-sonnet-4-5',
      maxTokens: 1200,
      system: GEN_SYSTEM,
      user: `נושא: ${topic}\nצור סעיף חשיבה והבנה אחד, שונה וייחודי. מזהה גיוון: ${seed}`,
      schema: GEN_SCHEMA,
    });

    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('thinking generate error:', error);
    return Response.json({ error: 'שגיאה ביצירת שאלת החשיבה. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
