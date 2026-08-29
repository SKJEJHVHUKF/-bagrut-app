/**
 * _show-formulas.ts — render a topic's formula block through the REAL renderer
 * (lib/tutor-local formulaBlock), so the thing the student actually reads can be
 * looked at instead of guessed about. TEMP.
 */
import { getLesson } from '../content/lessons';
import { formulaBlock } from '../lib/tutor-local';

const topic = process.argv[2] ?? 'טריגונומטריה';
const only = process.argv[3];
const lesson = getLesson('math5', topic);
if (!lesson) throw new Error(`no lesson for ${topic}`);

for (const st of lesson.subTopics ?? []) {
  if (!st.formulas?.length) continue;
  if (only && st.id !== only) continue;
  const block = st.formulas.map(formulaBlock).join('\n\n');
  console.log(`\n=== ${st.id} · ${st.title} ===`);
  console.log(block);
  const longest = Math.max(...block.split('\n').map((l) => l.length));
  console.log(`[longest line: ${longest} chars]`);
}

export {};
