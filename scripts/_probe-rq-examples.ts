/** Worked examples in the lesson steps are answers a student reads too, so
 *  Itay's "בכל תשובה יהיה מוסבר באיזו נוסחה בדיוק השתמשו" covers them. Which of
 *  them name a formula? */
import { getLesson } from '../content/lessons';

const ST = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

let tot = 0;
const miss: string[] = [];
for (const id of ST) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  (st.lesson ?? []).forEach((step, i) => {
    const ex = (step as { example?: { problem?: string; steps?: string[] } }).example;
    if (!ex) return;
    tot++;
    const t = [ex.problem ?? '', ...(ex.steps ?? [])].join('\n');
    if (!/\*\*הנוסחה:\*\*/.test(t)) miss.push(`${id} lesson[${i}]`);
  });
}
console.log(`worked examples: ${tot} · without a formula line: ${miss.length}`);
for (const m of miss) console.log(`   ${m}`);
