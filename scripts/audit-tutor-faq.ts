/**
 * audit-tutor-faq.ts — dump every solution of a topic as JSON rows for the
 * FAQ authoring pass, sliced for parallel agents.
 *
 *   npx tsx scripts/audit-tutor-faq.ts <topic> <outdir> [sliceSize=15]
 *
 * Traversal mirrors scripts/verify-rule-lines.ts, so unit ids match the gate's
 * and `partAsQuestion` (`${bagrutId}/${label}`). Units that already have FAQ
 * entries in the merged bank are skipped, so re-runs only hand out new work.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { allLessonKeys, getLesson } from '../content/lessons';

const [topicArg, outDir, sliceArg = '15'] = process.argv.slice(2);
if (!topicArg || !outDir) {
  console.error('usage: npx tsx scripts/audit-tutor-faq.ts <topic> <outdir> [sliceSize]');
  process.exit(1);
}
const SLICE = Number(sliceArg);

export type FaqRow = {
  unit: string;
  kind: 'question' | 'question-top' | 'bagrut';
  subId: string;
  subTitle: string;
  subSummary: string;
  prompt: string;
  hints: string[];
  steps: string[];
  finalAnswer: string;
  formulas: { name: string; latex: string; note?: string }[];
  keyPoints: string[];
  wrongAnswers: { value: string; note: string }[];
  distractorNotes: string[];
};

const rows: FaqRow[] = [];
for (const { subject, topic } of allLessonKeys()) {
  if (topic !== topicArg) continue;
  const L = getLesson(subject, topic);
  if (!L) continue;
  for (const st of L.subTopics ?? []) {
    const meta = {
      subId: st.id,
      subTitle: st.title,
      subSummary: st.summary ?? '',
      formulas: (st.formulas ?? []).map((f) => ({ name: f.name, latex: f.latex, ...(f.note ? { note: f.note } : {}) })),
      keyPoints: st.keyPoints ?? [],
    };
    for (const q of st.questions ?? []) {
      if (!q.solution?.steps?.length) continue;
      rows.push({
        ...meta,
        unit: q.id,
        kind: 'question',
        prompt: q.question,
        hints: q.hint ? [q.hint] : [],
        steps: q.solution.steps,
        finalAnswer: q.solution.finalAnswer ?? '',
        wrongAnswers: q.wrongAnswers ?? [],
        distractorNotes: (q.distractorNotes ?? []).filter((n): n is string => !!n),
      });
    }
  }
  for (const q of L.questions ?? []) {
    if (!q.solution?.steps?.length) continue;
    rows.push({
      unit: q.id, kind: 'question-top', subId: '', subTitle: '', subSummary: '', formulas: [], keyPoints: [],
      prompt: q.question, hints: q.hint ? [q.hint] : [], steps: q.solution.steps,
      finalAnswer: q.solution.finalAnswer ?? '', wrongAnswers: q.wrongAnswers ?? [],
      distractorNotes: (q.distractorNotes ?? []).filter((n): n is string => !!n),
    });
  }
  for (const b of L.bagrutQuestions ?? []) {
    const st = b.subTopicId ? (L.subTopics ?? []).find((s) => s.id === b.subTopicId) : undefined;
    for (const p of b.parts ?? []) {
      if (!p.solution?.steps?.length) continue;
      rows.push({
        unit: `${b.id}/${p.label}`,
        kind: 'bagrut',
        subId: st?.id ?? '',
        subTitle: st?.title ?? '',
        subSummary: st?.summary ?? '',
        formulas: (st?.formulas ?? []).map((f) => ({ name: f.name, latex: f.latex })),
        keyPoints: st?.keyPoints ?? [],
        prompt: `${b.context ?? ''}\n\n${p.label}. ${p.prompt}`.trim(),
        hints: p.hints ?? [],
        steps: p.solution.steps,
        finalAnswer: p.solution.final_answer ?? '',
        wrongAnswers: [],
        distractorNotes: [],
      });
    }
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `rows-${topicArg}.json`), JSON.stringify(rows, null, 1), 'utf8');
const slices: FaqRow[][] = [];
for (let i = 0; i < rows.length; i += SLICE) slices.push(rows.slice(i, i + SLICE));
slices.forEach((s, i) => writeFileSync(join(outDir, `slice-${String(i + 1).padStart(2, '0')}.json`), JSON.stringify(s, null, 1), 'utf8'));
console.log(`${topicArg}: ${rows.length} units → ${slices.length} slices of ≤${SLICE} in ${outDir}`);
