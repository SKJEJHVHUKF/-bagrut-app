/**
 * audit-rule-lines.ts — dump every solution of a TOPIC that still needs a
 * "**הכלל:**" opening step, as JSON for the authoring pass.
 *
 * Traversal mirrors scripts/verify-rule-lines.ts exactly, so `where` ids match
 * the gate's, which is what lets apply-rule-lines.ts find each solution again.
 *
 *   npx tsx scripts/audit-rule-lines.ts <topic> <outfile> [--sub prefix,prefix]
 *
 * Was hardcoded to סדרות; parameterised 2026-08-31 for חשבון דיפרנציאלי, with
 * 10 topics still to roll out after it.
 */
import { writeFileSync } from 'fs';
import { allLessonKeys, getLesson } from '../content/lessons';

const RULE = '**הכלל:**';

type Row = {
  where: string;
  kind: string;
  subId: string;
  subTitle: string;
  prompt: string;
  hint: string;
  steps: string[];
  finalAnswer: string;
  formulas: { name: string; latex: string }[];
};

const TOPIC = process.argv[2];
if (!TOPIC || TOPIC.startsWith('--')) {
  console.error('usage: npx tsx scripts/audit-rule-lines.ts <topic> <outfile> [--sub prefix,prefix]');
  process.exit(1);
}
/** Restrict to sub-topics whose id starts with one of these — a topic is not
 *  always rolled out all at once. Rows with no sub-topic are kept only when
 *  no filter is given. */
const SUBS = (() => {
  const i = process.argv.indexOf('--sub');
  return i >= 0 ? process.argv[i + 1].split(',') : null;
})();
const wantedSub = (id: string) => !SUBS || SUBS.some((p) => id.startsWith(p));

const rows: Row[] = [];

for (const { subject, topic } of allLessonKeys()) {
  if (topic !== TOPIC) continue;
  const L = getLesson(subject, topic);
  if (!L) continue;

  const add = (r: Partial<Row> & { where: string; kind: string; steps?: string[] }) => {
    if (!Array.isArray(r.steps) || r.steps.length === 0) return;
    if ((r.steps[0] ?? '').trim().startsWith(RULE)) return; // already done
    if (!wantedSub(r.subId ?? '')) return;
    rows.push({
      where: r.where,
      kind: r.kind,
      subId: r.subId ?? '',
      subTitle: r.subTitle ?? '',
      prompt: r.prompt ?? '',
      hint: r.hint ?? '',
      steps: r.steps,
      finalAnswer: r.finalAnswer ?? '',
      formulas: r.formulas ?? [],
    });
  };

  for (const st of L.subTopics ?? []) {
    const sheet = (st.formulas ?? []).map((f) => ({ name: f.name, latex: f.latex }));
    const meta = { subId: st.id, subTitle: st.title, formulas: sheet };

    (st.lesson ?? []).forEach((step, i) => {
      const local = (step.formula ? [{ name: step.formula.name, latex: step.formula.latex }] : []).concat(sheet);
      if (step.example)
        add({
          ...meta, formulas: local,
          where: `${st.id}/lesson[${i}]/example`, kind: 'example',
          prompt: step.example.problem, steps: step.example.steps, finalAnswer: step.example.answer ?? '',
        });
      if (step.drill?.solution)
        add({
          ...meta, formulas: local,
          where: step.drill.id ?? `${st.id}/lesson[${i}]/drill`, kind: 'drill',
          prompt: step.drill.question, hint: step.drill.hint ?? '',
          steps: step.drill.solution.steps, finalAnswer: step.drill.solution.finalAnswer ?? '',
        });
    });

    for (const q of st.questions ?? [])
      add({
        ...meta, where: q.id, kind: 'question',
        prompt: q.question, hint: (q as { hint?: string }).hint ?? '',
        steps: q.solution?.steps, finalAnswer: q.solution?.finalAnswer ?? '',
      });
  }

  for (const q of L.questions ?? [])
    add({
      where: q.id, kind: 'question-top',
      prompt: q.question, hint: (q as { hint?: string }).hint ?? '',
      steps: q.solution?.steps, finalAnswer: q.solution?.finalAnswer ?? '',
    });

  (L.examples ?? []).forEach((e, i) =>
    add({ where: `example[${i}]`, kind: 'example-top', prompt: e.problem, steps: e.steps, finalAnswer: e.answer ?? '' }),
  );

  for (const b of L.bagrutQuestions ?? [])
    for (const p of b.parts ?? [])
      add({
        where: `${b.id}/${p.label}`, kind: 'bagrut',
        prompt: `${b.context ?? ''}\n${p.prompt}`.trim(),
        hint: (p.hints ?? []).join(' | '),
        steps: p.solution?.steps, finalAnswer: p.solution?.final_answer ?? '',
      });
}

const out = process.argv[3] ?? `${TOPIC}-rules-rows.json`;
writeFileSync(out, JSON.stringify(rows, null, 1), 'utf8');
console.log(`rows needing a rule line: ${rows.length}`);
const byKind = new Map<string, number>();
const bySub = new Map<string, number>();
for (const r of rows) {
  byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1);
  bySub.set(r.subId || '(top-level)', (bySub.get(r.subId || '(top-level)') ?? 0) + 1);
}
console.log('by kind:', [...byKind].map(([k, n]) => `${k}=${n}`).join(' '));
for (const [k, n] of [...bySub].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`);

export {};
