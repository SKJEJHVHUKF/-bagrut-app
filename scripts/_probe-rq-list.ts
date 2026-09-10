/* List every rung of every מנה ושורש stage with its question ids + prompts,
 * so a correction that names "שאלה 5 מתוך 11 ברמת אתגר" can be resolved to an id. */
import { ROOT_QUOTIENT_STAGES } from '../content/lessons/math5/functions-root-quotient';
import { buildSubTopicLevels } from '../lib/roadmap-levels';

const only = process.argv[2];
for (const st of ROOT_QUOTIENT_STAGES) {
  if (only && st.id !== only) continue;
  console.log(`\n===== ${st.id} — ${st.title}`);
  for (const lv of buildSubTopicLevels('math5', 'פונקציות', st)) {
    if (lv.questions.length === 0 && lv.bagrut.length === 0) {
      console.log(`  [${lv.kind}] ${lv.title}`);
      continue;
    }
    console.log(`  [${lv.kind}] ${lv.title} — ${lv.questions.length || lv.bagrut.length}`);
    lv.questions.forEach((q, i) => {
      console.log(`    #${i + 1} ${q.id} (${q.kind})  ${q.question.replace(/\n/g, ' ')}`);
    });
    lv.bagrut.forEach((b, i) => {
      console.log(`    #${i + 1} ${b.id} :: ${b.context.replace(/\n/g, ' ')}`);
      b.parts.forEach((p) => console.log(`        ${p.label}) ${p.prompt.replace(/\n/g, ' ')}`));
    });
  }
}
