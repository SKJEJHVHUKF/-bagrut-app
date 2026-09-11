/* Which מנה ושורש questions carry a figure in their solution, and which ASK for
 * a sketch or talk about the graph/derivative pair but show none. The owner,
 * 2026-09-10: "כמעט כל שאלה צריכה את זה, ואם שואלים על קשר בין גרף פונקציה
 * לנגזרת אז צריך שרטוט גם של הנגזרת וגם של הפונקציה." */
import { ROOT_QUOTIENT_STAGES, ROOT_QUOTIENT_BAGRUT } from '../content/lessons/math5/functions-root-quotient';

const WANTS_SKETCH = /סרטט|שרטט|סקיצה/;
/** ⚠️ Narrow on PURPOSE. The first version tested the solution text with
 *  /גרף.*נגזרת/, which matches any investigation that mentions both words —
 *  it flagged three questions that ask for one sketch of one function and
 *  already had it. The owner's rule is about a question that puts the two
 *  graphs side by side, so the question stem itself has to name the derivative's
 *  graph. */
const GRAPH_AND_DERIV = /גרף הנגזרת|גרף של הנגזרת|גרף \$f'/;

let total = 0, withFig = 0;
const gaps: string[] = [];

for (const st of ROOT_QUOTIENT_STAGES) {
  let stTotal = 0, stFig = 0;
  for (const q of st.questions ?? []) {
    total++; stTotal++;
    const n = q.solution?.diagrams?.length ?? 0;
    if (n > 0) { withFig++; stFig++; }
    if (n === 0 && WANTS_SKETCH.test(q.question)) gaps.push(`${st.id}\t${q.id}\tASKS FOR A SKETCH`);
    else if (n < 2 && GRAPH_AND_DERIV.test(q.question)) {
      gaps.push(`${st.id}\t${q.id}\tthe question names BOTH graphs but shows ${n}`);
    }
  }
  console.log(`${st.id.padEnd(20)} ${stFig}/${stTotal} questions carry a figure`);
}

for (const b of ROOT_QUOTIENT_BAGRUT) {
  for (const p of b.parts) {
    total++;
    const n = p.solution?.diagrams?.length ?? 0;
    if (n > 0) withFig++;
    if (n === 0 && WANTS_SKETCH.test(p.prompt)) gaps.push(`bagrut\t${b.id}/${p.label}\tASKS FOR A SKETCH`);
  }
}

console.log(`\ntotal ${withFig}/${total} (${Math.round((withFig / total) * 100)}%) carry a figure`);
console.log(`\n${gaps.length} question(s) ask for a sketch and show none:`);
for (const g of gaps) console.log('  ' + g);
