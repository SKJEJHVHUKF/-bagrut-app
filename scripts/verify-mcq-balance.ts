/**
 * verify-mcq-balance.ts — guards the Phase-0 "option א is always correct" fix.
 *
 * Authoring convention (lib/shuffle.ts): the correct MCQ option is written
 * FIRST (`correct: 0`) for readability, and the UI scatters it deterministically
 * with `seededOrder(n, id)` at render time. So the RAW content is ~90% index 0 —
 * that is fine ONLY as long as the render-time shuffle actually spreads the
 * correct answer across slots. This script proves that by replaying the REAL
 * seeds (question ids) through `seededOrder` and asserting:
 *   1. structural validity — 2-5 distinct, non-empty options, `correct` in range;
 *   2. after shuffling, no display slot holds more than 40% of correct answers
 *      (a broken/removed shuffle, or non-varying ids, would skew this and fail).
 *
 *   npx tsx scripts/verify-mcq-balance.ts
 */
import type { Lesson, PracticeQuestion } from '../content/lessons/types';
import { seededOrder } from '../lib/shuffle';
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

const errors: string[] = [];
const rawCorrect: Record<number, number> = {};
const shuffledSlot: Record<number, number> = {};
let mcqCount = 0;

function checkMCQ(where: string, q: PracticeQuestion) {
  if (q.kind !== 'mcq') return;
  mcqCount++;
  const opts = q.answers;
  if (!Array.isArray(opts) || opts.length < 2 || opts.length > 5) {
    errors.push(`${where} ${q.id}: MCQ must have 2-5 options (has ${opts?.length ?? 0})`);
    return;
  }
  const trimmed = opts.map((o) => (o ?? '').trim());
  if (trimmed.some((o) => o.length === 0)) errors.push(`${where} ${q.id}: has an empty option`);
  if (new Set(trimmed).size !== trimmed.length) errors.push(`${where} ${q.id}: has duplicate options`);
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= opts.length) {
    errors.push(`${where} ${q.id}: correct index ${q.correct} out of range`);
    return;
  }
  rawCorrect[q.correct] = (rawCorrect[q.correct] ?? 0) + 1;
  // Where the correct answer LANDS after the real render-time shuffle.
  const order = seededOrder(opts.length, q.id);
  const slot = order.indexOf(q.correct);
  shuffledSlot[slot] = (shuffledSlot[slot] ?? 0) + 1;
}

for (const [, L] of LESSONS) {
  for (const q of L.questions ?? []) checkMCQ('quiz-bank', q);
  for (const st of L.subTopics ?? []) {
    for (const q of st.questions ?? []) checkMCQ(`sub:${st.id}`, q);
    for (const step of st.lesson ?? []) if (step.drill) checkMCQ(`drill:${st.id}`, step.drill);
  }
}

function dist(label: string, counts: Record<number, number>) {
  const slots = Object.keys(counts).map(Number).sort((a, b) => a - b);
  console.log(`\n${label}:`);
  for (const s of slots) {
    const pct = ((counts[s] / mcqCount) * 100).toFixed(1);
    console.log(`  slot ${s}: ${counts[s]}  (${pct}%)`);
  }
}

console.log(`Checked ${mcqCount} MCQs across ${LESSONS.length} topics.`);
dist('RAW authored `correct` index (expected: heavily slot 0 by convention)', rawCorrect);
dist('AFTER seededOrder shuffle (must be well spread — no slot > 40%)', shuffledSlot);

// The invariant that matters: post-shuffle, the correct answer is spread out.
const MAX_SHARE = 0.4;
for (const [slotStr, count] of Object.entries(shuffledSlot)) {
  const share = count / mcqCount;
  if (share > MAX_SHARE) {
    errors.push(
      `Post-shuffle slot ${slotStr} holds ${(share * 100).toFixed(1)}% of correct answers ` +
        `(> ${MAX_SHARE * 100}%) — the render-time shuffle is not spreading answers.`,
    );
  }
}

if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} problem(s):`);
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('\n✅ MCQ balance OK — every MCQ is well-formed and shuffles evenly.');
