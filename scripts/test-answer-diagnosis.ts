/**
 * test-answer-diagnosis.ts — naming the mistake in a typed answer.
 *
 *   npx tsx scripts/test-answer-diagnosis.ts
 *
 * An MCQ hands the tutor a distractor with an authored note explaining the
 * wrong idea behind it. A typed answer used to hand it nothing, so "why is my
 * answer wrong" on an open question could only be answered by paying a model to
 * guess. `checkAnswer` already parses both sides — `diagnosis` carries the
 * comparison through instead of discarding it.
 *
 * The property that matters most here is ABSTENTION. A wrong-but-unremarkable
 * answer must produce NO diagnosis: telling a student "you flipped the sign"
 * when they did something else entirely is worse than saying nothing, because
 * they will go looking for a sign error that isn't there.
 *
 * The containment checks are directional and that direction is the whole
 * meaning — "found 1 of 2 roots" and "found both plus an extra" are opposite
 * mistakes with opposite repairs.
 */

import { checkAnswer, checkAnswerParts, matchKnownMistake, type AnswerSpec } from '../lib/answer-check';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
}
function section(t: string) {
  console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 56 - t.length))}`);
}

const val = (value: string): AnswerSpec => ({ kind: 'value', value });
const set = (...values: string[]): AnswerSpec => ({ kind: 'set', values });
const d = (input: string, spec: AnswerSpec) => checkAnswer(input, spec).diagnosis;

section('the shapes that name themselves');

assert(d('-3', val('3'))?.kind === 'sign-flip', 'a negated value is a sign flip');
assert(d('3', val('-3'))?.kind === 'sign-flip', 'and it works in the other direction');
assert(d('2-3i', val('2+3i'))?.kind === 'conjugate', 'a flipped imaginary part is the conjugate');

const partial = d('2', set('2', '3'));
assert(partial?.kind === 'partial-set', 'one root of two is a partial set');
assert(
  partial?.kind === 'partial-set' && partial.found === 1 && partial.total === 2,
  'and it carries the counts needed to say "1 מתוך 2"',
);

const extra = d('2,3,5', set('2', '3'));
assert(extra?.kind === 'extra-root', 'all the roots plus one more is an extra root');
assert(extra?.kind === 'extra-root' && extra.extra === 1, 'and it counts the surplus');

section('abstention — the property that protects the student');

assert(d('7', val('3')) === undefined, 'a plainly wrong value gets no invented diagnosis');
assert(d('5', set('2', '3')) === undefined, 'a root that is not one of the answers is not "partial"');
assert(
  d('2,5', set('2', '3')) === undefined,
  'one right and one wrong is neither partial nor extra — it is just wrong',
);
assert(d('1,4,9', set('2', '3')) === undefined, 'three wrong values are not an "extra root"');
assert(d('3', val('3')) === undefined, 'a correct answer carries no diagnosis at all');
assert(d('שלוש', val('3')) === undefined, 'an unreadable answer is not diagnosed, it is unparseable');
assert(checkAnswer('שלוש', val('3')).verdict === 'unparseable', 'and it says so');
assert(d('anything', { kind: 'manual' }) === undefined, 'a manual spec is never diagnosed');

section('ordering — conjugate before sign-flip');

// For a purely imaginary value the two coincide. "You flipped the sign of the
// imaginary part" is the more useful reading in a topic where the conjugate is
// an operation the student was probably reaching for.
assert(d('-2i', val('2i'))?.kind === 'conjugate', 'a purely imaginary flip reads as the conjugate');
// A real value has no imaginary part to conjugate, so it must stay a sign flip.
assert(d('-4', val('4'))?.kind === 'sign-flip', 'a real value cannot be a "conjugate"');

section('the counts are real, not decorative');

const twoOfFour = d('2,3', set('2', '3', '5', '7'));
assert(
  twoOfFour?.kind === 'partial-set' && twoOfFour.found === 2 && twoOfFour.total === 4,
  'found 2 of 4 is reported as 2 of 4',
);
const twoExtra = d('2,3,5,7', set('2', '3'));
assert(twoExtra?.kind === 'extra-root' && twoExtra.extra === 2, 'two surplus roots are counted as two');

section('labelled boxes (answerLabels) — graded in ORDER, box by box');

// "מצא את a₁ ואת d" with a₁=5, d=3: the unordered set check would accept the
// swap; with named boxes the swap is exactly the mistake to expose.
const tuple = set('5', '3');
assert(checkAnswerParts(['5', '3'], tuple).verdict === 'correct', 'right values in the right boxes are correct');
assert(checkAnswerParts(['5', '3'], tuple).readAs === '5, 3', 'and are read back in box order');
const swapped = checkAnswerParts(['3', '5'], tuple);
assert(swapped.verdict === 'wrong', 'the same values in the other boxes are wrong');
assert(swapped.diagnosis?.kind === 'swapped', 'and the diagnosis names the swap');
assert(checkAnswer('3, 5', tuple).verdict === 'correct', '(the plain set check would have let it through)');
const oneOff = checkAnswerParts(['5', '4'], tuple);
assert(oneOff.verdict === 'wrong' && oneOff.diagnosis === undefined, 'one wrong box is wrong, with no invented diagnosis');
assert(
  oneOff.parts?.[0] === 'correct' && oneOff.parts?.[1] === 'wrong',
  'and the per-box verdicts say WHICH box missed',
);
assert(checkAnswerParts(['5', ''], tuple).verdict === 'unparseable', 'an empty box is unparseable, not wrong');
assert(checkAnswerParts(['5', 'שלוש'], tuple).verdict === 'unparseable', 'so is an unreadable box');
assert(checkAnswerParts(['5'], tuple).verdict === 'manual', 'a box count that does not match the spec is an authoring error, never a fail');
assert(checkAnswerParts(['5', '3'], val('5')).verdict === 'manual', 'labels against a single-value spec likewise');
assert(checkAnswerParts(['1/3', '8/9'], set('1/3', '8/9')).verdict === 'correct', 'fractions grade box by box too');

const wrongs = [{ value: '8, 3', note: 'counted d from a₁ instead of a₃' }];
assert(matchKnownMistake(['8', '3'], wrongs) === wrongs[0].note, 'a known mistake is matched box by box');
assert(matchKnownMistake(['3', '8'], wrongs) === null, 'and NOT as an unordered set');
assert(matchKnownMistake(['', ''], wrongs) === null, 'empty boxes match nothing');

console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exitCode = failures === 0 ? 0 : 1;
