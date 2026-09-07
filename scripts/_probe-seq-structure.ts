/** Where the סדרות content lives, stage by stage: which file, how many
 *  questions per rung, and whether the stage has a 🎓 bagrut question. */
import { getLesson } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import type { PracticeQuestion } from '../content/lessons/types';

const L = getLesson('math5', 'סדרות');
if (!L) throw new Error('no lesson');

for (const st of L.subTopics ?? []) {
  const qs = (st.questions ?? []) as PracticeQuestion[];
  const n = (d: string) => qs.filter((q) => q.difficulty === d).length;
  const levels = buildSubTopicLevels('math5', 'סדרות', st);
  const bag = levels.find((l) => l.kind === 'bagrut');
  const ids = qs.map((q) => q.id.replace(/\d+$/, '')).filter((v, i, a) => a.indexOf(v) === i);
  console.log(
    `${st.id.padEnd(18)} ${String(qs.length).padStart(3)}q (${n('easy')}/${n('mid')}/${n('hard')})  ids: ${ids.join(', ').padEnd(28)} 🎓 ${bag?.bagrut.length ?? 0}`,
  );
}
console.log(`\ntop-level questions: ${(L.questions ?? []).length} · bagrut: ${(L.bagrutQuestions ?? []).length}`);
