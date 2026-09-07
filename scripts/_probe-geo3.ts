// Scratch probe for the round-3 geometry corrections: rung composition per
// stage, drill coverage on the לומדים rung, and the bagrut-question inventory.
//
// The point of running the REAL buildSubTopicLevels rather than counting
// questions in the source: the 📖 לומדים rung is built from `step.drill`, so a
// stage can hold ten worked examples and still offer the student nothing to
// answer — which is exactly what the owner reported in דמיון and תאלס.
import { getSubTopic, getLesson } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import type { StaticBagrutQuestion, SubTopic } from '../content/lessons/types';

const TOPIC = 'גיאומטריה אוקלידית';
const IDS = ['eg-similarity', 'eg-thales', 'eg-circle', 'eg-method', 'eg-mixed'];

for (const id of IDS) {
  const st: SubTopic | null = getSubTopic('math5', TOPIC, id);
  if (!st) {
    console.log(id, 'MISSING');
    continue;
  }
  const byDiff: Record<string, number> = {};
  for (const q of st.questions ?? []) byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1;
  const steps = st.lesson ?? [];
  const levels = buildSubTopicLevels('math5', TOPIC, st);
  console.log(`\n=== ${id} :: ${st.title}`);
  console.log(
    `  steps=${steps.length} drills=${steps.filter((s) => s.drill).length}` +
      ` examples=${steps.filter((s) => s.example).length}` +
      ` diagrams=${steps.filter((s) => s.diagrams?.length).length}` +
      ` geoInTeach=${steps.filter((s) => s.teach.includes('```geo')).length}`,
  );
  console.log(`  questions=${(st.questions ?? []).length}`, byDiff);
  console.log(
    '  rungs:',
    levels
      .map((l) => `${l.kind}(q=${l.questions.length},b=${l.bagrut.length},g=${l.ghost.length})`)
      .join(' '),
  );
}

const bank: StaticBagrutQuestion[] = getLesson('math5', TOPIC)?.bagrutQuestions ?? [];
console.log('\n===== ALL GEOMETRY BAGRUT QUESTIONS =====');
for (const q of bank) {
  const numeric = q.parts.filter((p) => p.answer_type !== 'text').length;
  const stepCount = q.parts.reduce((a, p) => a + p.solution.steps.length, 0);
  console.log(
    `${String(q.id).padEnd(16)} ${String(q.subTopicId).padEnd(16)} ` +
      `${String(q.difficulty).padEnd(5)} parts=${q.parts.length} numeric=${numeric} steps=${stepCount}`,
  );
}
console.log('total bagrut:', bank.length);
