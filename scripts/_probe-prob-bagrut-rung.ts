/** Probe: does each הסתברות stage's 🎓 rung actually carry a bagrut question?
 *  Reads the ladder the STUDENT gets (buildSubTopicLevels), not the content file. */
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { getLesson } from '../content/lessons';

const lesson = getLesson('math5', 'הסתברות');
if (!lesson) throw new Error('no probability lesson');

let bad = 0;
for (const st of lesson.subTopics ?? []) {
  const levels = buildSubTopicLevels('math5', 'הסתברות', st);
  const rung = levels.find((l) => l.kind === 'bagrut');
  const ids = rung?.bagrut.map((b) => b.id) ?? [];
  const rungs = levels.map((l) => l.kind).join(' → ');
  if (!ids.length) bad++;
  console.log(`${ids.length ? 'OK ' : 'XX '} ${st.id.padEnd(16)} ${rungs}  |  ${ids.join(', ') || 'NO BAGRUT QUESTION'}`);
}
console.log(bad ? `\n${bad} stage(s) with an empty bagrut rung` : '\nevery stage reaches a bagrut question');
process.exit(bad ? 1 : 0);
