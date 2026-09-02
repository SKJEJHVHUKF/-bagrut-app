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
import { conceptBankEntries, getConceptQuestions, CONCEPT_LEVELS } from '../content/concept-quiz';
import { conceptAsQuestion } from '../lib/tutor-presence';
import { loadFaqBank } from '../content/tutor-faq';

const [topicArg, outDir, sliceArg = '15'] = process.argv.slice(2);
if (!topicArg || !outDir) {
  console.error('usage: npx tsx scripts/audit-tutor-faq.ts <topic> <outdir> [sliceSize] [--kind k,k]');
  process.exit(1);
}
const SLICE = Number(sliceArg);
/** `--kind concept` slices only the questions from one content set, so a second
 *  authoring pass does not re-issue work that is already banked. */
const KINDS = (() => {
  const i = process.argv.indexOf('--kind');
  return i >= 0 ? new Set(process.argv[i + 1].split(',')) : null;
})();

export type FaqRow = {
  unit: string;
  kind: 'question' | 'question-top' | 'bagrut' | 'concept';
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

// ---- the /quiz banks: a SEPARATE content set the first audit never walked ----
// A student on /quiz is served from content/concept-quiz, not content/lessons.
// Measured after the first authoring pass: 0/92 of those questions had a single
// FAQ entry, so every tutor question on that screen past the six built-in asks
// went to the model no matter how good the bank was. They are MCQs, so the
// "solution" the FAQ is written against is the explanation, and the distractor
// notes are the ready-made source for the why-not entries.
for (const e of conceptBankEntries()) {
  if (e.topic !== topicArg) continue;
  for (const lvl of CONCEPT_LEVELS) {
    for (const q of getConceptQuestions(e.subject, e.topic, lvl)) {
      // ⚠️ THE SAME MAPPING THE STUDENT'S TUTOR USES, not a second one.
      // These rows tell an author which step to attach `faq.step` to, and the
      // merge gate range-checks that index against them — so if this list is
      // built differently from what /quiz actually publishes, every authored
      // step reference is silently off by one, or dropped. It WAS built
      // differently: three entries here (rule, the whole why_correct block,
      // why_wrong) against the runtime's rule + one step per numbered line.
      const steps = conceptAsQuestion(q).solution.steps;
      if (!steps.length) continue;
      rows.push({
        unit: q.id,
        kind: 'concept',
        subId: `concept-l${lvl}`,
        subTitle: `בוחן מושגים · רמה ${lvl}`,
        subSummary: '',
        // The options are part of the question a student is looking at.
        prompt: `${q.question}\n\nהאפשרויות: ${q.answers.map((a, i) => `(${i + 1}) ${a}`).join('  ')}\nהנכונה: (${q.correct + 1}) ${q.answers[q.correct]}`,
        hints: q.hint ? [q.hint] : [],
        steps,
        finalAnswer: q.answers[q.correct] ?? '',
        formulas: [],
        keyPoints: q.explanation.remember ? [q.explanation.remember] : [],
        wrongAnswers: [],
        distractorNotes: (q.distractorNotes ?? []).filter((n): n is string => !!n),
      });
    }
  }
}

// `async function main`, not top-level await: these scripts compile to CJS
// where top-level await is a hard error, and `tsc --noEmit` runs under an ESM
// target and says nothing about it.
async function main() {
  mkdirSync(outDir, { recursive: true });
  // The rows file stays COMPLETE even when slicing a subset: merge-tutor-faq
  // validates every authored unit against it, and a filtered rows file would
  // reject entries for units it simply did not list.
  writeFileSync(join(outDir, `rows-${topicArg}.json`), JSON.stringify(rows, null, 1), 'utf8');

  // The header above has always PROMISED this skip; until now nothing
  // implemented it, so a re-run on a partly-banked topic handed out every
  // finished unit again — thirteen slices of done work at ~150k tokens each.
  // `--all` overrides, for a deliberate re-author.
  const bank = process.argv.includes('--all') ? null : await loadFaqBank('math5', topicArg);
  const banked = new Set(Object.keys(bank ?? {}));
  const fresh = banked.size ? rows.filter((r) => !banked.has(r.unit)) : rows;

  const selected = KINDS ? fresh.filter((r) => KINDS.has(r.kind)) : fresh;
  const slices: FaqRow[][] = [];
  for (let i = 0; i < selected.length; i += SLICE) slices.push(selected.slice(i, i + SLICE));
  slices.forEach((s, i) =>
    writeFileSync(join(outDir, `slice-${String(i + 1).padStart(2, '0')}.json`), JSON.stringify(s, null, 1), 'utf8'),
  );
  console.log(
    `${topicArg}: ${rows.length} units total` +
    (banked.size ? `, ${banked.size} already banked → ${fresh.length} units` : '') +
    (KINDS ? `, ${selected.length} of kind [${[...KINDS].join(',')}]` : '') +
    ` → ${slices.length} slices of ≤${SLICE} in ${outDir}`,
  );
}

main();
