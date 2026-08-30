/**
 * emit-faq-rows.ts — the unit content the FAQ pipeline needs, from the lessons.
 *
 *   npx tsx scripts/emit-faq-rows.ts --topic הסתברות --out audit/rows-prob.json
 *
 * FREE, read-only.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * Both `merge-tutor-faq` and `generate-faq-from-logs` take a `--rows` file:
 *
 *   [{ unit, question, steps[], finalAnswer }]
 *
 * It was produced by hand during the original authoring rounds and never
 * committed, so anyone picking the pipeline up later has the two ends and not
 * the middle. This regenerates it from the lesson content, which is the only
 * place the steps actually live.
 *
 * ⚠️ It is a PROJECTION, never a source. Nothing here may edit lesson content:
 * if a step is wrong, it is wrong in content/lessons and that is where it gets
 * fixed. Regenerating from the lessons every time also means the rows cannot
 * drift from the solutions the students are reading, which a checked-in copy
 * eventually would.
 */

import { writeFileSync } from 'fs';
import { getLesson, allLessonKeys } from '../content/lessons';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => {
  const i = argv.indexOf(k);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const TOPIC = opt('--topic');
const OUT = opt('--out');

type Row = { unit: string; question: string; steps: string[]; finalAnswer: string };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const rows: Row[] = [];
for (const { subject, topic } of allLessonKeys()) {
  if (TOPIC && topic !== TOPIC) continue;
  const lesson = getLesson(subject, topic);
  if (!lesson) continue;

  // ---- sub-topic practice questions ----
  for (const st of lesson.subTopics ?? []) {
    for (const q of st.questions ?? []) {
      const o = q as unknown as Record<string, unknown>;
      const solution = (o.solution ?? {}) as Record<string, unknown>;
      const steps = list(solution.steps);
      if (!steps.length) continue; // nothing to ground an answer in
      rows.push({
        unit: text(o.id),
        question: text(o.question),
        steps,
        finalAnswer: text(solution.finalAnswer),
      });
    }
  }

  // ---- bagrut parts, keyed `${bagrutId}/${label}` exactly as the bank is ----
  for (const b of lesson.bagrutQuestions ?? []) {
    const bo = b as unknown as Record<string, unknown>;
    for (const p of (bo.parts ?? []) as Array<Record<string, unknown>>) {
      const solution = (p.solution ?? {}) as Record<string, unknown>;
      const steps = list(solution.steps);
      if (!steps.length) continue;
      rows.push({
        unit: `${text(bo.id)}/${text(p.label)}`,
        question: text(p.question) || text(bo.question),
        steps,
        finalAnswer: text(solution.finalAnswer),
      });
    }
  }
}

console.log(`\n${rows.length} unit(s)${TOPIC ? ` in ${TOPIC}` : ''} with written steps`);
const noAnswer = rows.filter((r) => !r.finalAnswer).length;
if (noAnswer) {
  console.log(`  ⚠️ ${noAnswer} have no finalAnswer. The merge gate's leak check compares`);
  console.log('     against it, so those entries cannot be screened for revealing the');
  console.log('     answer — they are still emitted, and worth knowing about.');
}

if (OUT) {
  writeFileSync(OUT, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`\nwrote ${OUT}\n`);
} else {
  console.log('\n(no --out, nothing written. Sample:)\n');
  for (const r of rows.slice(0, 2)) {
    console.log(`  ${r.unit}`);
    console.log(`    ${r.question.slice(0, 70)}`);
    for (const s of r.steps.slice(0, 3)) console.log(`      · ${s.slice(0, 66)}`);
    console.log(`    → ${r.finalAnswer}\n`);
  }
}
