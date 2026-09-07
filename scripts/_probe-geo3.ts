// Scratch probe for the round-3 geometry corrections: rung composition per
// stage, drill coverage on the לומדים rung, and the bagrut-question inventory.
import { getSubTopic, getLesson } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';

const IDS = ['eg-similarity', 'eg-thales', 'eg-circle', 'eg-method', 'eg-mixed'];

for (const id of IDS) {
  const st = getSubTopic('math5', 'גיאומטריה אוקלידית', id) as any;
  if (!st) {
    console.log(id, 'MISSING');
    continue;
  }
  const byDiff: Record<string, number> = {};
  for (const q of st.questions ?? []) byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1;
  const lv = buildSubTopicLevels('math5', 'גיאומטריה אוקלידית', st);
  const steps = st.lesson ?? [];
  console.log(`\n=== ${id} :: ${st.title}`);
  console.log(
    `  steps=${steps.length} drills=${steps.filter((s: any) => s.drill).length}` +
      ` examples=${steps.filter((s: any) => s.example).length}` +
      ` diagrams=${steps.filter((s: any) => s.diagrams?.length).length}` +
      ` geoInTeach=${steps.filter((s: any) => String(s.teach).includes('geo')).length}`,
  );
  console.log(`  questions=${(st.questions ?? []).length}`, byDiff);
  console.log(
    '  rungs:',
    lv
      .map((l: any) => `${l.kind}(q=${l.questions.length},b=${l.bagrut.length},g=${l.ghost.length})`)
      .join(' '),
  );
}

const lesson = getLesson('math5', 'גיאומטריה אוקלידית') as any;
console.log('\n===== ALL GEOMETRY BAGRUT QUESTIONS =====');
for (const q of lesson?.bagrutQuestions ?? []) {
  const numeric = q.parts.filter((p: any) => p.answer_type !== 'text').length;
  const stepCount = q.parts.reduce((a: number, p: any) => a + p.solution.steps.length, 0);
  console.log(
    `${String(q.id).padEnd(16)} ${String(q.subTopicId).padEnd(16)} ` +
      `${String(q.difficulty).padEnd(5)} parts=${q.parts.length} numeric=${numeric} steps=${stepCount}`,
  );
}
console.log('total bagrut:', (lesson?.bagrutQuestions ?? []).length);
