/** Probe: the פונקציות lesson's stages, and which of them own a 🎓 bagrut question. */
import { getLesson } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';

const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');
console.log(`sub-topics (${(L.subTopics ?? []).length}):`);
for (const st of L.subTopics ?? []) {
  const levels = buildSubTopicLevels('math5', 'פונקציות', st);
  const bag = levels.find((l) => l.kind === 'bagrut');
  const q = st.questions ?? [];
  const n = (d: string) => q.filter((x) => x.difficulty === d).length;
  console.log(
    `  ${st.id.padEnd(20)} ${String(q.length).padStart(2)}q (${n('easy')}/${n('mid')}/${n('hard')})  rungs: ${levels.map((l) => l.kind).join('→')}  🎓 ${bag?.bagrut.map((b) => b.id).join(', ') || 'NONE'}`,
  );
}
console.log(`\ntop-level bagrutQuestions: ${(L.bagrutQuestions ?? []).length}`);
for (const b of L.bagrutQuestions ?? []) console.log(`  ${b.id.padEnd(22)} subTopicId=${b.subTopicId ?? '(none)'}  parts=${(b.parts ?? []).length}`);
