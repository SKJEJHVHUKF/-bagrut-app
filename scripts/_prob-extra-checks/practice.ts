/**
 * Numeric re-derivation for pr-practice's EXTRA questions (pr-x-prc-101…112).
 *
 * pr-practice is the stage that has to land a student on a real שאלון 571 part,
 * so the bar here is higher than "the arithmetic adds up": every `got` is
 * COMPUTED from the question's own data, and wherever the experiment is small
 * enough the sample space is BRUTE-FORCED instead of formula-checked. That is
 * the only check that sees a wrong DENOMINATOR — the with/without-replacement
 * confusion this stage is full of — and, for 111, the only check that sees an
 * off-by-one in "which combinations qualify", because it never looks at the
 * author's list of qualifying sets at all: it scores all $3125$ outcomes.
 *
 * Weighted experiments are enumerated by giving each stage a MULTISET whose
 * items are equally likely (p = 0.6 → three 'c' and two 'w'), so `enumerate`'s
 * uniform assumption stays true and the probability still comes out of counting.
 *
 *   npx tsx scripts/_prob-extra-checks/practice.ts
 */
import { check, checkSet, enumerate, drawNoReplacement, binom, binomAtLeast, atLeastOne, nCr, summary } from './_lib';

const urn = (spec: [string, number][]) => spec.flatMap(([c, n]) => Array.from({ length: n }, () => c));
const same = <T>([a, b]: T[]) => a === b;

// ---------------------------------------------------------------- easy ---

// 101 — Dana on time 0.8, Yoav on time 0.7, independent; P(at least one late).
// 10 × 10 equally likely pairs reproduces 0.8 and 0.7 exactly.
const dana = urn([['on', 8], ['late', 2]]);
const yoav = urn([['on', 7], ['late', 3]]);
check('101 P(at least one late)', enumerate([dana, yoav], (s) => s.some((x) => x === 'late')), 0.44);
check('101 complement identity', 1 - enumerate([dana, yoav], (s) => s.every((x) => x === 'on')), 0.44);
check('101 distractor 0.56 = both on time', enumerate([dana, yoav], (s) => s.every((x) => x === 'on')), 0.56);
check('101 distractor 0.5 = 0.2 + 0.3 (double counts)', 0.2 + 0.3, 0.5);
check('101 distractor 0.06 = both late', enumerate([dana, yoav], (s) => s.every((x) => x === 'late')), 0.06);

// 102 — 70% trained; trained use gear 0.9, untrained 0.5; P(does NOT use).
// A population of 100 workers: the tree becomes a count, denominator included.
const workers = [
  ...urn([['trained-uses', 63], ['trained-no', 7], ['raw-uses', 15], ['raw-no', 15]]),
];
check('102 population is 100', workers.length, 100);
check('102 P(trained) = 0.7', enumerate([workers], ([w]) => w.startsWith('trained')), 0.7);
check('102 P(does not use)', enumerate([workers], ([w]) => w.endsWith('-no')), 0.22);
check('102 wrongAnswer 0.78 = P(uses)', enumerate([workers], ([w]) => w.endsWith('uses')), 0.78);
check('102 wrongAnswer 0.07 = trained AND not using only', 0.7 * 0.1, 0.07);

// 103 — 3 multiple-choice questions, 4 options each, guessing; P(at most 1 right).
const opts = ['A', 'B', 'C', 'D'];
const rightOf = (s: string[]) => s.filter((x) => x === 'A').length;
check('103 P(at most 1 correct)', enumerate([opts, opts, opts], (s) => rightOf(s) <= 1), 27 / 32);
check('103 = P(0) + P(1)', binom(3, 0, 0.25) + binom(3, 1, 0.25), 27 / 32);
check('103 distractor 27/64 = exactly one', enumerate([opts, opts, opts], (s) => rightOf(s) === 1), 27 / 64);
check('103 distractor 37/64 = at least one', enumerate([opts, opts, opts], (s) => rightOf(s) >= 1), 37 / 64);
check('103 distractor 9/16 = P(0) + single path for 1 (no binom coeff)', 0.75 ** 3 + 0.25 * 0.75 ** 2, 9 / 16);

// 104 — 40 students: 24 girls, 15 play basketball, 10 girls play. Independent?
const cls = urn([['girl-bb', 10], ['girl-no', 14], ['boy-bb', 5], ['boy-no', 11]]);
check('104 class size', cls.length, 40);
const pGirl = enumerate([cls], ([s]) => s.startsWith('girl'));
const pBB = enumerate([cls], ([s]) => s.endsWith('bb'));
const pBoth = enumerate([cls], ([s]) => s === 'girl-bb');
check('104 P(girl)', pGirl, 0.6);
check('104 P(basketball)', pBB, 0.375);
check('104 P(girl and basketball)', pBoth, 0.25);
check('104 product of margins', pGirl * pBB, 0.225);
check('104 NOT independent', pBoth === pGirl * pBB ? 1 : 0, 0);
check('104 distractor: P(bb | girl) = 10/24', pBoth / pGirl, 10 / 24);

// ----------------------------------------------------------------- mid ---

// 105 — 10 students, 4 play an instrument, two drawn WITHOUT replacement.
const players = urn([['p', 4], ['n', 6]]);
check('105 P(both play)', drawNoReplacement(players, 2, (s) => s.every((x) => x === 'p')), 2 / 15);
check('105 P(neither plays)', drawNoReplacement(players, 2, (s) => s.every((x) => x === 'n')), 1 / 3);
check('105 P(at least one plays)', drawNoReplacement(players, 2, (s) => s.some((x) => x === 'p')), 2 / 3);
check("105 student's error 1: replacement gives 0.16", 0.4 * 0.4, 0.16);
check("105 student's error 2: adding gives 0.8", 0.4 + 0.4, 0.8);
check('105 distractor 1/3 is the complement, not the answer', 1 - 1 / 3, 2 / 3);

// 106 — urn 3 red / 5 white. Game A: two draws WITHOUT replacement, same colour.
//       Game B: WITH replacement, same colour. Which is better?
const balls106 = urn([['r', 3], ['w', 5]]);
const gameA = drawNoReplacement(balls106, 2, same);
const gameB = enumerate([balls106, balls106], same);
check('106 game A P(same colour)', gameA, 13 / 28);
check('106 game B P(same colour)', gameB, 17 / 32);
// answerLabels ['…משחק א', '…משחק ב'] must line up with expected.values IN ORDER
// (checkSet is unordered, so the boxes are checked one at a time on purpose).
check('106 box 1 (game A) = expected.values[0]', gameA, 13 / 28);
check('106 box 2 (game B) = expected.values[1]', gameB, 17 / 32);
check('106 the boxes are not interchangeable', Math.abs(gameA - gameB) > 1e-6 ? 1 : 0, 1);
check('106 game B is the better one', gameB > gameA ? 1 : 0, 1);
check('106 wrongAnswer box1 3/28 = two reds only, game A', drawNoReplacement(balls106, 2, (s) => s.every((x) => x === 'r')), 3 / 28);
check('106 wrongAnswer box2 9/64 = two reds only, game B', enumerate([balls106, balls106], (s) => s.every((x) => x === 'r')), 9 / 64);
check('106 wrongAnswer box2 13/32 = game B with a shrinking numerator', (3 / 8) * (2 / 8) + (5 / 8) * (4 / 8), 13 / 32);

// 107 — 60% brand A (burns 0.1), 40% brand B (burns 0.35); then exactly 1 of 4.
const bulbs = urn([['A-burn', 12], ['A-ok', 108], ['B-burn', 28], ['B-ok', 52]]);
check('107 warehouse is 200 bulbs', bulbs.length, 200);
check('107 P(brand A) = 0.6', enumerate([bulbs], ([b]) => b.startsWith('A')), 0.6);
const pBurn = enumerate([bulbs], ([b]) => b.endsWith('burn'));
check('107 P(burns within a year)', pBurn, 0.2);
// exactly one of four, brute-forced over 5^4 outcomes rather than by formula
const oneBulb = urn([['burn', 1], ['ok', 4]]);
check(
  '107 P(exactly one of four burns)',
  enumerate([oneBulb, oneBulb, oneBulb, oneBulb], (s) => s.filter((x) => x === 'burn').length === 1),
  0.4096,
);
check('107 formula agrees', binom(4, 1, pBurn), 0.4096);
check('107 box 1 (one bulb burns) = expected.values[0]', pBurn, 0.2);
check('107 box 2 (exactly one of four) = expected.values[1]', binom(4, 1, pBurn), 0.4096);
check('107 wrongAnswer 0.1024 = single path, no binom coeff', pBurn * (1 - pBurn) ** 3, 0.1024);
check('107 wrongAnswer 0.45 = adding branch probabilities unweighted', 0.1 + 0.35, 0.45);

// 108 — box of 6 pens (2 red). WITH replacement P(both red) = 1/9 (given).
//       WITHOUT replacement: P(both red) and P(second pen is red).
const pens = urn([['r', 2], ['b', 4]]);
check('108 given: with replacement P(both red) = 1/9', enumerate([pens, pens], (s) => s.every((x) => x === 'r')), 1 / 9);
const bothRed108 = drawNoReplacement(pens, 2, (s) => s.every((x) => x === 'r'));
const secondRed108 = drawNoReplacement(pens, 2, (s) => s[1] === 'r');
check('108 P(both red, no replacement)', bothRed108, 1 / 15);
check('108 P(second pen is red)', secondRed108, 1 / 3);
check('108 second draw matches the first draw marginally', secondRed108, 2 / 6);
check('108 box 1 (both red) = expected.values[0]', bothRed108, 1 / 15);
check('108 box 2 (second is red) = expected.values[1]', secondRed108, 1 / 3);
check('108 total probability decomposition', (2 / 6) * (1 / 5) + (4 / 6) * (2 / 5), secondRed108);
check('108 wrongAnswer 2/15 = denominator drops, numerator does not', (2 / 6) * (2 / 5), 2 / 15);
check('108 wrongAnswer 1/5 = only the "first pen red" branch', 1 / 5, 0.2);
check('108 no replacement is strictly smaller than with', bothRed108 < 1 / 9 ? 1 : 0, 1);

// ---------------------------------------------------------------- hard ---

// 109 — 4 crates, P(rejected) = p, P(at least one rejected) = 0.5904. Find p,
//       then P(exactly two rejected).
const p109 = 1 - Math.pow(1 - 0.5904, 1 / 4);
check('109 p recovered from the given probability', p109, 0.2);
check('109 the given probability is reproduced', atLeastOne(p109, 4), 0.5904);
const crate = urn([['bad', 1], ['ok', 4]]); // p = 1/5, so counting is exact
check(
  '109 P(at least one rejected), enumerated',
  enumerate([crate, crate, crate, crate], (s) => s.some((x) => x === 'bad')),
  0.5904,
);
const twoBad = enumerate([crate, crate, crate, crate], (s) => s.filter((x) => x === 'bad').length === 2);
check('109 P(exactly two rejected), enumerated', twoBad, 0.1536);
check('109 formula agrees', binom(4, 2, p109), 0.1536);
check('109 box 1 (p) = expected.values[0]', p109, 0.2);
check('109 box 2 (exactly two) = expected.values[1]', twoBad, 0.1536);
check('109 wrongAnswer 0.8 = 1 - p, the complement of the parameter', 1 - p109, 0.8);
check('109 wrongAnswer 0.0256 = single path, no binom coeff', p109 ** 2 * (1 - p109) ** 2, 0.0256);
check('109 the missing coefficient is 6', nCr(4, 2), 6);

// 110 — three-stage hiring. P(pass 1) = 0.4; P(pass 2 | passed 1) = 2 × 0.4;
//       P(hired | passed both) = 0.5. Given NOT hired, P(passed test 1)?
// 5 × 5 × 2 = 50 equally likely outcomes reproduces 0.4, 0.8 and 0.5 exactly.
const s1 = urn([['pass', 2], ['fail', 3]]);
const s2 = urn([['pass', 4], ['fail', 1]]);
const s3 = urn([['hire', 1], ['no', 1]]);
const hired = (o: string[]) => o[0] === 'pass' && o[1] === 'pass' && o[2] === 'hire';
check('110 P(pass test 2 | passed test 1) = twice 0.4', 2 * 0.4, 0.8);
const pHired = enumerate([s1, s2, s3], hired);
check('110 P(hired)', pHired, 0.16);
const pNotHired = enumerate([s1, s2, s3], (o) => !hired(o));
check('110 P(not hired)', pNotHired, 0.84);
const pPass1AndNot = enumerate([s1, s2, s3], (o) => o[0] === 'pass' && !hired(o));
check('110 P(passed test 1 and not hired)', pPass1AndNot, 0.24);
check('110 P(passed test 1 | not hired)', pPass1AndNot / pNotHired, 2 / 7);
check('110 the condition lowers the prior 0.4', pPass1AndNot / pNotHired < 0.4 ? 1 : 0, 1);
check('110 wrongAnswer 0.24 = the numerator alone', pPass1AndNot, 0.24);
check('110 wrongAnswer 0.6 = dividing by P(passed 1) instead of by the condition', pPass1AndNot / 0.4, 0.6);

// 111 — quiz of 5 questions, question k is worth k points, P(correct) = 0.6.
//       P(total >= 13)?
// INDEPENDENT re-enumeration: score all 5^5 = 3125 equally likely outcomes of
// five draws from a 5-item multiset (three 'c', two 'w'). Nothing here consults
// the author's claim about WHICH sets of answers qualify — the predicate is the
// raw score threshold, so a wrong list of qualifying sets cannot survive.
const answer = urn([['c', 3], ['w', 2]]); // P(correct) = 3/5 = 0.6
const q5 = [answer, answer, answer, answer, answer];
const score111 = (o: string[]) => o.reduce((t, x, i) => t + (x === 'c' ? i + 1 : 0), 0);
check('111 the quiz is worth 15 points', score111(['c', 'c', 'c', 'c', 'c']), 15);
check('111 P(at least 13 points)', enumerate(q5, (o) => score111(o) >= 13), 0.18144);
check('111 the author-style sum agrees', 0.6 ** 5 + 2 * (0.6 ** 4 * 0.4), 0.18144);
// and the decomposition claim itself: exactly three answer-patterns qualify
check(
  '111 exactly 3 of the 32 answer patterns reach 13',
  enumerate([['c', 'w'], ['c', 'w'], ['c', 'w'], ['c', 'w'], ['c', 'w']], (o) => score111(o) >= 13) * 32,
  3,
);
check('111 missing question 3 alone falls short', score111(['c', 'c', 'w', 'c', 'c']) >= 13 ? 1 : 0, 0);
check('111 missing question 2 alone is exactly 13', score111(['c', 'w', 'c', 'c', 'c']), 13);
check('111 distractor 0.33696 = Bernoulli "at least 4 correct"', binomAtLeast(5, 4, 0.6), 0.33696);
check('111 distractor 0.1296 = at least 14 points', enumerate(q5, (o) => score111(o) >= 14), 0.1296);
check('111 distractor 0.07776 = all five correct', enumerate(q5, (o) => o.every((x) => x === 'c')), 0.07776);

// 112 — urn A: 3 red + 3 white. urn B: 2 red + x white, and P(two reds from B,
//       without replacement) = 1/15. Pick an urn at random, draw two without
//       replacement; given they match, P(urn A)?
const xSolutions = Array.from({ length: 30 }, (_, i) => i + 1).filter(
  (x) => Math.abs((2 / (x + 2)) * (1 / (x + 1)) - 1 / 15) < 1e-12,
);
checkSet('112 x recovered from the given probability', xSolutions, [4]);
const urnA = urn([['r', 3], ['w', 3]]);
const urnB = urn([['r', 2], ['w', 4]]);
check('112 urn B honours the given 1/15', drawNoReplacement(urnB, 2, (s) => s.every((c) => c === 'r')), 1 / 15);
const sameA = drawNoReplacement(urnA, 2, same);
const sameB = drawNoReplacement(urnB, 2, same);
check('112 P(same colour | urn A)', sameA, 2 / 5);
check('112 P(same colour | urn B)', sameB, 7 / 15);
check('112 P(same colour)', 0.5 * sameA + 0.5 * sameB, 13 / 30);
check('112 P(urn A | same colour)', (0.5 * sameA) / (0.5 * sameA + 0.5 * sameB), 6 / 13);
// A second, fully uniform enumeration: both urns hold 6 balls, so choosing an
// urn and then an ordered pair gives 2 × 30 = 60 equally likely outcomes. This
// re-derives the Bayes denominator by counting, not by the formula above.
const ordered = (bag: string[]) => {
  const out: [string, string][] = [];
  for (let i = 0; i < bag.length; i++) for (let j = 0; j < bag.length; j++) if (i !== j) out.push([bag[i], bag[j]]);
  return out;
};
const space112 = [
  ...ordered(urnA).map(([a, b]) => ['A', a, b]),
  ...ordered(urnB).map(([a, b]) => ['B', a, b]),
];
check('112 uniform space has 60 outcomes', space112.length, 60);
const matched = space112.filter(([, a, b]) => a === b);
check('112 P(same colour), counted', matched.length / space112.length, 13 / 30);
check('112 P(urn A | same colour), counted', matched.filter(([u]) => u === 'A').length / matched.length, 6 / 13);
check('112 urn B matches more often, so urn A takes under half', 6 / 13 < 0.5 ? 1 : 0, 1);
check('112 wrongAnswer 2/5 = the forward conditional', sameA, 2 / 5);
check('112 wrongAnswer 1/5 = the joint path, undivided', 0.5 * sameA, 1 / 5);

summary('pr-practice');
