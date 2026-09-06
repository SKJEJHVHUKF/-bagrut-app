/** A `$$…$$` block renders as a centred display only when it is ALONE on its
 *  line (MathText.promoteDisplayMath); anything else ships as literal dollars.
 *  Checks every הסתברות solution after the reformat. */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const L = getLesson('math5', 'הסתברות');
if (!L) throw new Error('no lesson');
const bad: string[] = [];

function check(id: string, steps: string[]) {
  for (const s of steps) {
    for (const line of s.split('\n')) {
      const t = line.trim();
      const n = (t.match(/\$\$/g) ?? []).length;
      if (n === 0) continue;
      if (n % 2 !== 0) bad.push(`${id} :: odd $$ :: ${t.slice(0, 60)}`);
      else if (n !== 2 || !t.startsWith('$$') || !t.endsWith('$$')) bad.push(`${id} :: $$ not alone :: ${t.slice(0, 60)}`);
    }
  }
}

for (const st of L.subTopics ?? []) for (const q of (st.questions ?? []) as PracticeQuestion[]) check(q.id, q.solution?.steps ?? []);
for (const b of L.bagrutQuestions ?? []) for (const p of b.parts ?? []) check(`${b.id}/${p.label}`, p.solution?.steps ?? []);

console.log(bad.length ? bad.join('\n') : 'every $$ block sits alone on its line');
process.exit(bad.length ? 1 : 0);
