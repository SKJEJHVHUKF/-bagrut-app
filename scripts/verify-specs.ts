/**
 * verify-specs.ts — end-to-end test of the DETERMINISTIC GRADING path.
 * For every bagrut-question part that carries a value/set `expected` spec,
 * feed the part's OWN reference `final_answer` through the real checkAnswer()
 * and assert it grades 'correct'. This catches specs that silently degrade to
 * 'manual'/'unparseable' (e.g. natural-log answers the parser can't read) —
 * which the per-topic mathjs scripts do NOT catch (they bypass checkAnswer).
 *   npx tsx scripts/verify-specs.ts
 */
import { checkAnswer, checkAnswerParts, matchKnownMistake } from '../lib/answer-check';
import type { Lesson } from '../content/lessons/types';
import { math5ComplexNumbers } from '../content/lessons/math5/complex-numbers';
import { math5Vectors } from '../content/lessons/math5/vectors';
import { math5AnalyticGeometry } from '../content/lessons/math5/analytic-geometry';
import { math5ExpFunctions } from '../content/lessons/math5/exp-functions';
import { math5LnFunction } from '../content/lessons/math5/ln-function';
import { math5GrowthDecay } from '../content/lessons/math5/growth-decay';
import { math5Derivatives } from '../content/lessons/math5/derivatives';
import { math5Integrals } from '../content/lessons/math5/integrals';
import { math5Trigonometry } from '../content/lessons/math5/trigonometry';
import { math5Algebra } from '../content/lessons/math5/algebra';
import { math5Functions } from '../content/lessons/math5/functions';
import { math5Sequences } from '../content/lessons/math5/sequences';
import { math5Probability } from '../content/lessons/math5/probability';
import { math5EuclideanGeometry } from '../content/lessons/math5/euclidean-geometry';

const LESSONS: Array<[string, Lesson]> = [
  ['complex', math5ComplexNumbers],
  ['vectors', math5Vectors],
  ['analytic', math5AnalyticGeometry],
  ['exp', math5ExpFunctions],
  ['ln', math5LnFunction],
  ['growth', math5GrowthDecay],
  ['derivatives', math5Derivatives],
  ['integrals', math5Integrals],
  ['trigonometry', math5Trigonometry],
  ['algebra', math5Algebra],
  ['functions', math5Functions],
  ['sequences', math5Sequences],
  ['probability', math5Probability],
  ['euclidean', math5EuclideanGeometry],
];

let pass = 0;
let fail = 0;

// Feed a spec's OWN canonical value through checkAnswer and assert it grades
// 'correct' — proving a student typing the clean answer would pass, and
// catching specs that silently degrade to manual/unparseable.
function checkSpec(where: string, spec: unknown, reference: string) {
  const s = spec as { kind: string; value?: string; values?: string[] };
  if (!s || s.kind === 'manual') return;
  const input = s.kind === 'value' ? (s.value ?? '') : (s.values ?? []).join(' , ');
  const res = checkAnswer(input, spec as never);
  if (res.verdict === 'correct') {
    pass++;
  } else {
    fail++;
    console.log(
      `  ✗ ${where}: verdict=${res.verdict}  readAs=${res.readAs ?? '—'}\n      reference="${reference}"  spec=${JSON.stringify(spec)}`,
    );
  }
}

// Authored predictable-mistake entries (question.wrongAnswers) ride the same
// engine, so they get the same end-to-end test — in BOTH directions:
//   1. the entry's own value must MATCH itself through matchKnownMistake
//      (proving a student typing that mistake actually gets the note), and
//   2. it must grade 'wrong' against the question's expected spec
//      (an entry equal to the correct answer would hand the note to a student
//      who answered correctly — the worst possible bug in this layer).
function checkWrongAnswers(
  where: string,
  expected: unknown,
  wrongAnswers: { value: string; note: string }[] | undefined,
  answerLabels?: string[],
) {
  if (!wrongAnswers?.length) return;
  for (const w of wrongAnswers) {
    // Mirror QuestionRunnerCard exactly (its lines 323 + 328): a question with
    // answerLabels grades its boxes IN ORDER through checkAnswerParts, and the
    // mistake lookup gets the same array. This line used to be
    //   w.value.includes(',') ? w.value : w.value
    // — a ternary whose two branches are identical, so the split it was written
    // to do never happened and every labelled question was checked here by the
    // UNORDERED checkAnswer. That both failed a legitimate swapped-order
    // distractor ("3, 6" for an answer of 6 then 3, which is exactly the
    // mistake worth catching) and would have waved through a genuinely
    // equal one.
    const asInput = answerLabels?.length ? w.value.split(',').map((s) => s.trim()) : w.value;
    const matched = matchKnownMistake(asInput, [w]);
    const vsExpected = !expected
      ? 'wrong'
      : Array.isArray(asInput)
        ? checkAnswerParts(asInput, expected as never).verdict
        : checkAnswer(asInput, expected as never).verdict;
    if (matched && vsExpected !== 'correct') {
      pass++;
    } else {
      fail++;
      console.log(
        `  ✗ ${where}: wrongAnswer "${w.value}" ${!matched ? 'does not match itself (unparseable?)' : 'GRADES CORRECT against expected'}`,
      );
    }
  }
}

// Labelled multi-box answers (answerLabels): the labels must line up one-to-one
// with a 'set' spec, the reference values must grade CORRECT box by box (the
// ORDERED check), and every authored wrong answer must carry one value per box
// — otherwise a box is graded against nothing, or a predictable mistake can
// never be matched.
function checkLabels(
  where: string,
  expected: unknown,
  labels: string[] | undefined,
  wrongAnswers: { value: string; note: string }[] | undefined,
) {
  if (!labels) return;
  const s = expected as { kind: string; values?: string[] } | undefined;
  const values = s?.kind === 'set' ? s.values : undefined;
  if (!values || values.length !== labels.length || labels.some((l) => !l.trim())) {
    fail++;
    console.log(`  ✗ ${where}: answerLabels (${labels.length}) must match a 'set' spec of the same length`);
    return;
  }
  const res = checkAnswerParts(values, expected as never);
  if (res.verdict === 'correct') {
    pass++;
  } else {
    fail++;
    console.log(`  ✗ ${where}: reference values do not grade correct box-by-box (verdict=${res.verdict})`);
  }
  for (const w of wrongAnswers ?? []) {
    const n = w.value.split(',').length;
    if (n === labels.length) {
      pass++;
    } else {
      fail++;
      console.log(`  ✗ ${where}: wrongAnswer "${w.value}" has ${n} values for ${labels.length} boxes`);
    }
  }
}

for (const [name, L] of LESSONS) {
  // Bagrut-question parts.
  for (const q of L.bagrutQuestions ?? []) {
    for (const p of q.parts) {
      checkSpec(`${name}/${q.id}/${p.label}`, p.expected, p.solution.final_answer);
      checkLabels(`${name}/${q.id}/${p.label}`, p.expected, p.answerLabels, undefined);
    }
  }
  // Sub-topic practice questions + their micro-drills (the ladder loop).
  for (const st of L.subTopics ?? []) {
    for (const question of st.questions ?? []) {
      checkSpec(`${name}/${st.id}/${question.id}`, question.expected, question.solution.finalAnswer);
      checkWrongAnswers(`${name}/${st.id}/${question.id}`, question.expected, question.wrongAnswers, question.answerLabels);
      checkLabels(`${name}/${st.id}/${question.id}`, question.expected, question.answerLabels, question.wrongAnswers);
    }
    for (const step of st.lesson ?? []) {
      if (step.drill) {
        checkSpec(`${name}/${st.id}/drill:${step.drill.id}`, step.drill.expected, step.drill.solution.finalAnswer);
        checkWrongAnswers(`${name}/${st.id}/drill:${step.drill.id}`, step.drill.expected, step.drill.wrongAnswers, step.drill.answerLabels);
        checkLabels(`${name}/${st.id}/drill:${step.drill.id}`, step.drill.expected, step.drill.answerLabels, step.drill.wrongAnswers);
      }
    }
  }
}
console.log(`\n${pass} value/set specs grade CORRECT via checkAnswer, ${fail} problems.`);
if (fail > 0) process.exit(1);

export {};
