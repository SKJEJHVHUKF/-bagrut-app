/**
 * audit-solutions.ts — dump every authored solution of ONE topic as JSON rows
 * for a scripted rewrite pass (rule line + line-by-line steps + figures), plus
 * the sub-topics' teaching text as context for the authoring agents.
 *
 * Traversal mirrors scripts/verify-rule-lines.ts, so `where` ids match the
 * gate's. Unlike audit-sequences-rules.ts it dumps EVERY solution, not only
 * the ones still missing a rule line — the pass rewrites whole solutions.
 *
 *   npx tsx scripts/audit-solutions.ts "<topic>" <outdir>
 *   → <outdir>/rows.json   (one row per solution)
 *   → <outdir>/lesson.json (per sub-topic: summary, keyPoints, formulas, lesson steps' teach)
 */
import { mkdirSync, writeFileSync } from 'fs';
import { allLessonKeys, getLesson } from '../content/lessons';

type Row = {
  where: string;
  kind: 'example' | 'drill' | 'question' | 'question-top' | 'example-top' | 'bagrut';
  subId: string;
  subTitle: string;
  /** the text the student sees before answering (question / problem / context+prompt) */
  prompt: string;
  /** bagrut only: the shared context (figure target) and this part's prompt */
  context?: string;
  partPrompt?: string;
  hint: string;
  /** bagrut only: the part's hints array (the ladder question has a single `hint`) */
  hints?: string[];
  /** mcq: the options, so the authored steps can reference them */
  answers?: string[];
  correct?: number;
  steps: string[];
  finalAnswer: string;
  explanation?: string;
  formulas: { name: string; latex: string }[];
};

const [topic, outdir] = process.argv.slice(2);
if (!topic || !outdir) { console.error('usage: audit-solutions.ts "<topic>" <outdir>'); process.exit(2); }
mkdirSync(outdir, { recursive: true });

const rows: Row[] = [];
const lessonCtx: Record<string, unknown>[] = [];

for (const { subject, topic: t } of allLessonKeys()) {
  if (t !== topic) continue;
  const L = getLesson(subject, t);
  if (!L) continue;

  const add = (r: Omit<Row, 'steps'> & { steps?: string[] }) => {
    if (!Array.isArray(r.steps) || r.steps.length === 0) return;
    rows.push({ ...r, steps: r.steps });
  };

  for (const st of L.subTopics ?? []) {
    const sheet = (st.formulas ?? []).map((f) => ({ name: f.name, latex: f.latex }));
    const meta = { subId: st.id, subTitle: st.title, formulas: sheet };
    lessonCtx.push({
      subId: st.id, title: st.title, tagline: st.tagline, summary: st.summary, keyPoints: st.keyPoints,
      formulas: st.formulas, lesson: (st.lesson ?? []).map((s) => ({ title: s.title, teach: s.teach, formula: s.formula?.latex })),
    });

    (st.lesson ?? []).forEach((step, i) => {
      const local = (step.formula ? [{ name: step.formula.name, latex: step.formula.latex }] : []).concat(sheet);
      if (step.example)
        add({
          ...meta, formulas: local, where: `${st.id}/lesson[${i}]/example`, kind: 'example', hint: '',
          prompt: step.example.problem, steps: step.example.steps, finalAnswer: step.example.answer ?? '',
        });
      if (step.drill?.solution)
        add({
          ...meta, formulas: local, where: step.drill.id ?? `${st.id}/lesson[${i}]/drill`, kind: 'drill',
          prompt: step.drill.question, hint: step.drill.hint ?? '', answers: step.drill.answers, correct: step.drill.correct,
          steps: step.drill.solution.steps, finalAnswer: step.drill.solution.finalAnswer ?? '', explanation: step.drill.solution.explanation,
        });
    });

    for (const q of st.questions ?? [])
      add({
        ...meta, where: q.id, kind: 'question', prompt: q.question, hint: q.hint ?? '', answers: q.answers, correct: q.correct,
        steps: q.solution?.steps, finalAnswer: q.solution?.finalAnswer ?? '', explanation: q.solution?.explanation,
      });
  }

  for (const q of L.questions ?? [])
    add({
      where: q.id, kind: 'question-top', subId: '', subTitle: '', formulas: [], prompt: q.question, hint: q.hint ?? '', answers: q.answers, correct: q.correct,
      steps: q.solution?.steps, finalAnswer: q.solution?.finalAnswer ?? '', explanation: q.solution?.explanation,
    });

  (L.examples ?? []).forEach((e, i) =>
    add({ where: `example[${i}]`, kind: 'example-top', subId: '', subTitle: '', formulas: [], hint: '', prompt: e.problem, steps: e.steps, finalAnswer: e.answer ?? '' }),
  );

  for (const b of L.bagrutQuestions ?? [])
    for (const p of b.parts ?? [])
      add({
        where: `${b.id}/${p.label}`, kind: 'bagrut', subId: b.subTopicId ?? '', subTitle: '', formulas: [],
        prompt: `${b.context ?? ''}\n${p.prompt}`.trim(), context: b.context ?? '', partPrompt: p.prompt,
        hint: (p.hints ?? []).join(' | '), hints: p.hints ?? [], steps: p.solution?.steps, finalAnswer: p.solution?.final_answer ?? '',
      });
}

writeFileSync(`${outdir}/rows.json`, JSON.stringify(rows, null, 1), 'utf8');
writeFileSync(`${outdir}/lesson.json`, JSON.stringify(lessonCtx, null, 1), 'utf8');
console.log(`rows: ${rows.length}`);
const bySub = new Map<string, number>();
for (const r of rows) bySub.set(r.subId || '(top-level)', (bySub.get(r.subId || '(top-level)') ?? 0) + 1);
for (const [k, n] of bySub) console.log(`  ${String(n).padStart(4)}  ${k}`);

export {};
