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

// ====================================================================
// Round 2 — 201…208, the bagrut question, and every ```probtree fence.
// ====================================================================
import { EXTRA, EXTRA_BAGRUT } from '../../content/lessons/math5/prob-extra/practice';

const byId = (id: string) => EXTRA.find((q) => q.id === id)!;
/** "12/17" | "0.384" | "14" → number, read from the FILE so box order is checked against what ships. */
const num = (s: string) => (s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s));
const boxes = (id: string): number[] => ((byId(id).expected as { values?: string[] }).values ?? []).map(num);

// ---- fences: re-derive every tree from its JSON, and compare the ✓ leaves to
//      a value COMPUTED above/below, never to the fence's own numbers ----
const evalP = (s: string, vars: Record<string, number>): number | null => {
  let e = s.trim();
  for (const [k, v] of Object.entries(vars)) e = e.replace(new RegExp(k, 'g'), `(${v})`);
  if (/[a-z]/i.test(e)) return null; // still symbolic
  e = e.replace(/(\d|\))\(/g, '$1*(');
  return new Function(`return ${e}`)() as number;
};
type Node = { p?: string; result?: string; pick?: boolean; children?: Node[] };
function fenceCheck(label: string, steps: string[], vars: Record<string, number>, pickTotal: number) {
  const m = steps.join('\n').match(/```probtree\n([\s\S]*?)\n```/g) ?? [];
  check(`${label} has exactly one probtree fence`, m.length, 1);
  if (m.length !== 1) return;
  const root = JSON.parse(m[0].replace(/```probtree\n|\n```/g, '')) as Node;
  let picks = 0;
  const walk = (n: Node, prod: number, path: string) => {
    if (n.children?.length) {
      const ps = n.children.map((c) => evalP(c.p ?? '', vars));
      if (ps.every((x) => x !== null)) check(`${label} branches at ${path || 'root'} sum to 1`, ps.reduce((a, b) => a! + b!, 0)!, 1);
      n.children.forEach((c, i) => walk(c, prod * (ps[i] ?? NaN), `${path}/${c.p}`));
    } else {
      const r = evalP(n.result ?? '', vars);
      if (r !== null && Number.isFinite(prod)) check(`${label} leaf ${path} = product of its path`, r, prod);
      if (n.pick) picks += prod;
    }
  };
  walk(root, 1, '');
  check(`${label} ✓ leaves sum to the value the step names`, picks, pickTotal);
}
const stepsOf = (id: string) => byId(id).solution.steps;
const fenceStep = (id: string) => stepsOf(id).find((s) => s.includes('```probtree')) ?? '';

fenceCheck('102 fence', stepsOf('pr-x-prc-102'), {}, enumerate([workers], ([w]) => w.endsWith('-no')));
fenceCheck('107 fence', stepsOf('pr-x-prc-107'), {}, pBurn);
fenceCheck('108 fence', stepsOf('pr-x-prc-108'), {}, secondRed108);
check('108 fence step says the top ✓ alone is part 1', fenceStep('pr-x-prc-108').includes('המסלול העליון לבדו') ? 1 : 0, 1);
fenceCheck('110 fence', stepsOf('pr-x-prc-110'), {}, pPass1AndNot); // picks = NUMERATOR by design
check('110 fence step says the ✓ sum is the numerator', fenceStep('pr-x-prc-110').includes('הוא המונה') ? 1 : 0, 1);
check('110 fence step names the 0.6 path as part of the denominator', fenceStep('pr-x-prc-110').includes('0.6') ? 1 : 0, 1);

// ---- 201 — 40% veteran (95% course), 60% new (70% course).
//      P(veteran | course), then exactly 2 of 3 drivers took the course. ----
const drivers = urn([['vet-c', 38], ['vet-n', 2], ['new-c', 42], ['new-n', 18]]);
check('201 population is 100', drivers.length, 100);
check('201 P(veteran) = 0.4', enumerate([drivers], ([d]) => d.startsWith('vet')), 0.4);
check('201 P(course | veteran) = 0.95', enumerate([drivers], ([d]) => d === 'vet-c') / 0.4, 0.95);
const pCourse = enumerate([drivers], ([d]) => d.endsWith('-c'));
const pVetCourse = enumerate([drivers], ([d]) => d === 'vet-c');
check('201 P(course) = column margin 0.8', pCourse, 0.8);
const vetGivenCourse = pVetCourse / pCourse;
check('201 P(veteran | course)', vetGivenCourse, 0.475);
const course1 = urn([['c', 4], ['n', 1]]);
const twoOfThree201 = enumerate([course1, course1, course1], (s) => s.filter((x) => x === 'c').length === 2);
check('201 P(exactly 2 of 3 took the course), enumerated', twoOfThree201, 0.384);
check('201 formula agrees', binom(3, 2, pCourse), twoOfThree201);
checkSet('201 boxes in order', boxes('pr-x-prc-201'), [vetGivenCourse, twoOfThree201]);
check('201 box 1 is the conditional', boxes('pr-x-prc-201')[0], vetGivenCourse);
check('201 wrongAnswer 0.38 = the cell, undivided', pVetCourse, 0.38);
check('201 wrongAnswer 0.128 = single path, no coefficient', 0.8 ** 2 * 0.2, 0.128);
check('201 table cells: new-and-not = 0.18', enumerate([drivers], ([d]) => d === 'new-n'), 0.18);

// ---- 202 — P(hit 1st) = 0.6; P(hit 2nd | hit 1st) = 0.8; P(hit 2nd | miss 1st) = p;
//      P(hit 2nd) = 0.68. Find p, then P(hit 1st | hit 2nd). ----
const p202 = (0.68 - 0.6 * 0.8) / 0.4;
check('202 p recovered from the total', p202, 0.5);
// 5 × 10 = 50 equally likely outcomes: second stage indexed 0..9, hit if below the branch's threshold
const first202 = urn([['h', 3], ['m', 2]]);
const idx10 = Array.from({ length: 10 }, (_, i) => i);
const hit2 = ([f, i]: (string | number)[]) => (f === 'h' ? (i as number) < 8 : (i as number) < 5);
const pHit2 = enumerate<string | number>([first202, idx10], hit2);
check('202 P(hit 2nd) reproduces the given 0.68', pHit2, 0.68);
const pHit1and2 = enumerate<string | number>([first202, idx10], (o) => o[0] === 'h' && hit2(o));
check('202 P(hit 1st | hit 2nd)', pHit1and2 / pHit2, 12 / 17);
checkSet('202 boxes in order', boxes('pr-x-prc-202'), [p202, pHit1and2 / pHit2]);
check('202 box 1 is p', boxes('pr-x-prc-202')[0], p202);
check('202 wrongAnswer 0.2 = 0.4p, the path', 0.4 * p202, 0.2);
check('202 wrongAnswer 0.48 = the joint path, undivided', pHit1and2, 0.48);
fenceCheck('202 fence', stepsOf('pr-x-prc-202'), { p: p202 }, pHit2);

// ---- 203 — 4 shots at 0.5; given at least one hit, P(exactly two). ----
const shot = ['h', 'm'];
const hits = (s: string[]) => s.filter((x) => x === 'h').length;
const sp4 = [shot, shot, shot, shot];
const pTwo = enumerate(sp4, (s) => hits(s) === 2);
const pAtLeast1 = enumerate(sp4, (s) => hits(s) >= 1);
check('203 P(exactly two | at least one)', pTwo / pAtLeast1, 2 / 5);
check('203 "exactly two" is inside "at least one"', enumerate(sp4, (s) => hits(s) === 2 && hits(s) >= 1), pTwo);
check('203 distractor 3/8 = unconditioned', pTwo, 3 / 8);
check('203 distractor 6/11 = divided by "at least two"', pTwo / enumerate(sp4, (s) => hits(s) >= 2), 6 / 11);
check('203 distractor 1/15 = single path over the right denominator', 0.5 ** 4 / pAtLeast1, 1 / 15);
check('203 the condition raises 3/8', pTwo / pAtLeast1 > pTwo ? 1 : 0, 1);

// ---- 204 — 12 kids, 5 girls, two without replacement; given 2nd is a girl, P(1st is a girl). ----
const kids = urn([['g', 5], ['b', 7]]);
const gg = drawNoReplacement(kids, 2, (s) => s[0] === 'g' && s[1] === 'g');
const secondGirl = drawNoReplacement(kids, 2, (s) => s[1] === 'g');
check('204 P(2nd girl) = 5/12, same as the first draw', secondGirl, 5 / 12);
check('204 P(1st girl | 2nd girl)', gg / secondGirl, 4 / 11);
check('204 equals P(2nd girl | 1st girl) by symmetry', gg / drawNoReplacement(kids, 2, (s) => s[0] === 'g'), 4 / 11);
check('204 distractor 5/33 = the joint path', gg, 5 / 33);
check('204 distractor 5/11 = P(2nd girl | 1st boy)', drawNoReplacement(kids, 2, (s) => s[0] === 'b' && s[1] === 'g') / (7 / 12), 5 / 11);
fenceCheck('204 fence', stepsOf('pr-x-prc-204'), {}, gg); // picks = NUMERATOR by design
check('204 fence step says the ✓ is the numerator', fenceStep('pr-x-prc-204').includes('המונה') ? 1 : 0, 1);

// ---- 205 — 60% adults, fraction x subscribed; 40% young, 55% subscribed;
//      P(adult | subscribed) = 0.45. Find x, then at least 2 of 3 subscribed. ----
const x205 = (0.45 * 0.4 * 0.55) / (0.6 - 0.45 * 0.6);
check('205 x recovered from the conditional', x205, 0.3);
const town = urn([['a-s', 18], ['a-n', 42], ['y-s', 22], ['y-n', 18]]);
check('205 population is 100', town.length, 100);
check('205 P(subscribed | adult) reproduces x', enumerate([town], ([t]) => t === 'a-s') / 0.6, x205);
const pSub = enumerate([town], ([t]) => t.endsWith('-s'));
check('205 P(adult | subscribed) reproduces the given 0.45', enumerate([town], ([t]) => t === 'a-s') / pSub, 0.45);
check('205 P(subscribed) = column margin 0.4', pSub, 0.4);
const sub1 = urn([['s', 2], ['n', 3]]);
const atLeast2of3 = enumerate([sub1, sub1, sub1], (s) => s.filter((t) => t === 's').length >= 2);
check('205 P(at least 2 of 3 subscribed), enumerated', atLeast2of3, 0.352);
check('205 formula agrees', binomAtLeast(3, 2, pSub), atLeast2of3);
checkSet('205 boxes in order', boxes('pr-x-prc-205'), [x205, atLeast2of3]);
check('205 box 1 is x', boxes('pr-x-prc-205')[0], x205);
check('205 wrongAnswer 0.288 = exactly two only', binom(3, 2, pSub), 0.288);
check('205 wrongAnswer 0.45 is the other direction, not x', Math.abs(0.45 - x205) > 0.1 ? 1 : 0, 1);

// ---- 206 — Noa 0.8, Ido 0.4, fair coin picks the shooter, 3 shots, exactly two hits; P(Noa)? ----
const noa = urn([['h', 4], ['m', 1]]);
const ido = urn([['h', 2], ['m', 3]]);
const twoNoa = enumerate([noa, noa, noa], (s) => hits(s) === 2);
const twoIdo = enumerate([ido, ido, ido], (s) => hits(s) === 2);
check('206 Noa exactly two, enumerated', twoNoa, 0.384);
check('206 Ido exactly two, enumerated', twoIdo, 0.288);
const pTwo206 = 0.5 * twoNoa + 0.5 * twoIdo;
check('206 P(exactly two) = 0.336', pTwo206, 0.336);
check('206 P(Noa | exactly two)', (0.5 * twoNoa) / pTwo206, 4 / 7);
check('206 distractor 0.384 = forward conditional', twoNoa, 0.384);
check('206 distractor 0.192 = the joint path', 0.5 * twoNoa, 0.192);
check('206 distractor 0.5 = the prior', 0.5, 0.5);
fenceCheck('206 fence', stepsOf('pr-x-prc-206'), {}, pTwo206); // picks = DENOMINATOR by design
check('206 fence step says the ✓ sum is the denominator', fenceStep('pr-x-prc-206').includes('המכנה') ? 1 : 0, 1);

// ---- 207 — booth A: 4 red / 6 white, two without replacement, at least one red.
//      booth B: 3 shots at 0.3, at least one hit. Which is better? ----
const balls207 = urn([['r', 4], ['w', 6]]);
const boothA = drawNoReplacement(balls207, 2, (s) => s.some((c) => c === 'r'));
check('207 booth A P(at least one red)', boothA, 2 / 3);
const shot3 = urn([['h', 3], ['m', 7]]);
const boothB = enumerate([shot3, shot3, shot3], (s) => hits(s) >= 1);
check('207 booth B P(at least one hit)', boothB, 0.657);
check('207 formula agrees', atLeastOne(0.3, 3), boothB);
check('207 the closing claim: A beats B', boothA > boothB ? 1 : 0, 1);
check('207 the gap really is small (under 0.01)', boothA - boothB < 0.01 ? 1 : 0, 1);
checkSet('207 boxes in order', boxes('pr-x-prc-207'), [boothA, boothB]);
check('207 box 1 is booth A', boxes('pr-x-prc-207')[0], boothA);
check('207 wrongAnswer 8/15 = exactly one red', drawNoReplacement(balls207, 2, (s) => hits(s.map((c) => (c === 'r' ? 'h' : 'm'))) === 1), 8 / 15);
check('207 wrongAnswer 0.64 = complement as if replaced', 1 - enumerate([balls207, balls207], (s) => s.every((c) => c === 'w')), 0.64);
fenceCheck('207 fence', stepsOf('pr-x-prc-207'), {}, boothA);

// ---- 208 — supplier A 0.7 (late 0.1), B 0.3 (late 0.3). P(late); smallest n with P(at least one late) > 0.9. ----
const days = urn([['A-late', 7], ['A-on', 63], ['B-late', 9], ['B-on', 21]]);
check('208 population is 100', days.length, 100);
const pLate = enumerate([days], ([d]) => d.endsWith('late'));
check('208 P(late)', pLate, 0.16);
const firstN = (p: number) => { let n = 1; while (atLeastOne(p, n) <= 0.9) n++; return n; };
check('208 smallest n', firstN(pLate), 14);
check('208 n = 13 still fails', atLeastOne(pLate, 13) < 0.9 ? 1 : 0, 1);
check('208 n = 14 clears 0.9', atLeastOne(pLate, 14) > 0.9 ? 1 : 0, 1);
const bound = Math.log(0.1) / Math.log(1 - pLate);
check('208 the log boundary is 13.2…', Math.floor(bound * 10) / 10, 13.2);
checkSet('208 boxes in order', boxes('pr-x-prc-208'), [pLate, 14]);
check('208 box 2 is the day count', boxes('pr-x-prc-208')[1], 14);
check('208 wrongAnswer 0.4 = unweighted sum', 0.1 + 0.3, 0.4);
check('208 wrongAnswer 5 = the day count at p = 0.4', firstN(0.4), 5);
fenceCheck('208 fence', stepsOf('pr-x-prc-208'), {}, pLate);

// ---- prob-bag-x-prc-01 — 60% grove A (export 0.85), 40% grove B (export p), P(export) = 0.75 ----
const bag = EXTRA_BAGRUT.find((b) => b.id === 'prob-bag-x-prc-01')!;
const part = (l: string) => bag.parts.find((p) => p.label === l)!;
const pB = (0.75 - 0.6 * 0.85) / 0.4;
check('bagrut א p recovered', pB, 0.6);
const oranges = urn([['A-exp', 51], ['A-no', 9], ['B-exp', 24], ['B-no', 16]]);
check('bagrut population is 100', oranges.length, 100);
check('bagrut א P(export | B) reproduces p', enumerate([oranges], ([o]) => o === 'B-exp') / 0.4, pB);
const pExp = enumerate([oranges], ([o]) => o.endsWith('exp'));
check('bagrut א P(export) reproduces the given 0.75', pExp, 0.75);
check('bagrut א expected', num((part('א').expected as { value: string }).value), pB);
fenceCheck('bagrut א fence', part('א').solution.steps, { p: pB }, pExp);

const pBno = enumerate([oranges], ([o]) => o === 'B-no');
const pNo = enumerate([oranges], ([o]) => o.endsWith('-no'));
check('bagrut ב P(not export) = 0.25', pNo, 0.25);
check('bagrut ב P(B | not export)', pBno / pNo, 0.64);
check('bagrut ב the two not-export paths sum to the condition', pBno + enumerate([oranges], ([o]) => o === 'A-no'), pNo);
check('bagrut ב expected', num((part('ב').expected as { value: string }).value), pBno / pNo);
check('bagrut ב the condition raises 0.4', pBno / pNo > 0.4 ? 1 : 0, 1);

const exp1 = urn([['e', 3], ['n', 1]]);
const sp3 = [exp1, exp1, exp1];
const exports = (s: string[]) => s.filter((x) => x === 'e').length;
const atMost1 = enumerate(sp3, (s) => exports(s) <= 1);
check('bagrut ג P(at most one export), enumerated', atMost1, 5 / 32);
check('bagrut ג formula agrees', binom(3, 0, pExp) + binom(3, 1, pExp), atMost1);
check('bagrut ג expected', num((part('ג').expected as { value: string }).value), atMost1);

// ד — three oranges drawn from the NON-EXPORT ones, so the per-draw probability
// is part ב's conditional 0.64 and the part cannot be solved without it.
const pBgivenNo = pBno / pNo;
check('bagrut ד inherits part ב exactly', pBgivenNo, 0.64);
const noExp = urn([['b', 16], ['a', 9]]); // 16/25 = 0.64, 9/25 = 0.36
const sp3no = [noExp, noExp, noExp];
const fromB = (s: string[]) => s.filter((x) => x === 'b').length;
const exactly2B = enumerate(sp3no, (s) => fromB(s) === 2);
const atLeast1A = enumerate(sp3no, (s) => fromB(s) <= 2);
check('bagrut ד numerator, enumerated', exactly2B, 3 * pBgivenNo ** 2 * (1 - pBgivenNo));
check('bagrut ד numerator value', exactly2B, 0.442368);
check('bagrut ד denominator by complement', atLeast1A, 1 - pBgivenNo ** 3);
check('bagrut ד denominator value', atLeast1A, 0.737856);
check('bagrut ד "exactly 2 from B" ⊂ "at least 1 from A"', enumerate(sp3no, (s) => fromB(s) === 2 && fromB(s) <= 2), exactly2B);
check('bagrut ד P(exactly two from B | at least one from A)', exactly2B / atLeast1A, 256 / 427);
check('bagrut ד expected', num((part('ד').expected as { value: string }).value), exactly2B / atLeast1A);
// The chain is load-bearing: a different part ב would give a different part ד.
check('bagrut ד moves when ב moves', 3 * 0.6 ** 2 * 0.4 / (1 - 0.6 ** 3) !== 256 / 427 ? 1 : 0, 1);

// ה — 30% of grove A large, 24% of all large. Independent?
const bigA = 0.6 * 0.3;
const bigB = 0.24 - bigA;
check('bagrut ה A-and-large 0.18', bigA, 0.18);
check('bagrut ה B-and-large 0.06', bigB, 0.06);
check('bagrut ה product of margins 0.096', 0.4 * 0.24, 0.096);
check('bagrut ה NOT independent', Math.abs(bigB - 0.4 * 0.24) > 1e-9 ? 1 : 0, 1);
check('bagrut ה P(large | B) = 0.15', bigB / 0.4, 0.15);
check('bagrut ה table row B: 0.06 + 0.34 = 0.4', bigB + 0.34, 0.4);
check('bagrut ה table row A: 0.18 + 0.42 = 0.6', bigA + 0.42, 0.6);
check('bagrut ה table column large: 0.18 + 0.06 = 0.24', bigA + bigB, 0.24);
check('bagrut ה table column not-large: 0.42 + 0.34 = 0.76', 0.42 + 0.34, 0.76);
const tableStep = part('ה').solution.steps.find((s) => s.includes('|---|')) ?? '';
check('bagrut ה the ringed cell is 0.06', tableStep.includes('((0.06))') ? 1 : 0, 1);

summary('pr-practice');
