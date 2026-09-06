/** Find LEAP steps: a step that announces a result without showing how it was
 *  reached. Itay, 2026-09-06, on an antiderivative step: "זה ממש לא מפורט מספיק
 *  בהסבר, אני כתלמיד לא יודע איך הגעת לדבר הזה."
 *
 *  A step is a leap when it produces a named result (a קדומה, a נגזרת, a solved
 *  parameter, a substituted value) and contains none of the words that describe
 *  the operation that produced it. Run: npx tsx scripts/_probe-rq-leaps.ts [--ids] */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const ST = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

/** The step CLAIMS a derived object. */
const CLAIMS = [
  /פונקציה קדומה|הפונקציה הקדומה|הקדומה היא|F\(x\) ?=/,
  /הנגזרת היא|נגזרת הפונקציה היא|f'\(x\) ?=/,
  /ומכאן \$?[a-z]\$? ?=|מקבלים ש?\$?[a-z]\$? ?=/,
];
/** …and the step SHOWS the operation. */
const SHOWS =
  /מעלים|מחלקים|כופלים|מצמצמים|מציבים|פותחים|מעבירים|לפי הנוסחה|החזקה החדשה|נגזרת פנימית|כלל המנה|נגזרת מנה|גוזרים|מפרקים|פותרים|מכנה משותף|בהצלבה|לפי הכלל/;

type Row = { id: string; step: string };
const rows: Row[] = [];
let total = 0;

function scan(id: string, steps: string[]) {
  steps.forEach((s) => {
    total++;
    const plain = s.replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/```[\s\S]*?```/g, ' ');
    // A **הנוסחה:** step states the rule and a **ההצבה:** step substitutes into
    // it — between them they ARE the shown move, so neither is a leap.
    if (/^\*\*(?:הנוסחה|ההצבה|הכלל):\*\*/.test(s.trim())) return;
    if (!CLAIMS.some((re) => re.test(plain))) return;
    if (SHOWS.test(plain)) return;
    rows.push({ id, step: s.replace(/\s+/g, ' ').slice(0, 110) });
  });
}

for (const id of ST) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  for (const step of st.lesson ?? []) {
    const ex = (step as { example?: { steps?: string[] } }).example;
    if (ex?.steps) scan(`${id}/example`, ex.steps);
    const d = (step as { drill?: { id: string; solution?: { steps?: string[] } } }).drill;
    if (d?.solution?.steps) scan(d.id, d.solution.steps);
  }
  for (const q of (st.questions ?? []) as PracticeQuestion[]) scan(q.id, q.solution?.steps ?? []);
  for (const b of (L.bagrutQuestions ?? []).filter((x) => x.subTopicId === id)) {
    for (const p of b.parts ?? []) scan(`${b.id}/${p.label}`, p.solution?.steps ?? []);
  }
}

console.log(`${total} steps scanned · ${rows.length} announce a result without showing the move`);
if (process.argv.includes('--ids')) for (const r of rows) console.log(`   ${r.id.padEnd(22)} ${r.step}`);
else for (const r of rows.slice(0, 12)) console.log(`   ${r.id.padEnd(22)} ${r.step}`);
