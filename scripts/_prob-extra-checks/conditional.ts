/**
 * conditional.ts — adversarial re-derivation of the pr-conditional EXTRA questions
 * (content/lessons/math5/prob-extra/conditional.ts, ids pr-x-cnd-101…113).
 *
 * Every `got` is COMPUTED from the numbers in the question text, never copied
 * from the authored solution.
 *
 * THE CHECK THAT MATTERS IN THIS STAGE IS THE DENOMINATOR. A conditional must be
 * normalised by the CONDITION's probability, and when the condition is itself a
 * compound event ("שני כדורים מאותו צבע", "לא התקבל לעבודה", "לפחות אחד") it has
 * to be BUILT before it can divide anything. A formula-vs-formula check
 * reproduces whatever denominator the author picked, so instead every counting
 * question here is rebuilt as an EXPLICIT POPULATION of individuals and both
 * directions are computed — P(A|B) and P(B|A) — because an inverted condition is
 * this stage's signature error and it is invisible to any check that only looks
 * at one direction. Urns are enumerated with drawNoReplacement, and the Bernoulli
 * question is enumerated over 5^3 equally likely outcomes (p = 0.6 = 3/5 exactly)
 * rather than trusted to the formula.
 *
 *   npx tsx scripts/_prob-extra-checks/conditional.ts   → must print 0 failed
 */
import { check, checkSet, frac, binom, atLeastOne, enumerate, drawNoReplacement, summary } from './_lib';

/** 1..n as an equally-likely stage of an experiment. */
const R = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
/** k copies of `a` then the rest `b` — a labelled urn for drawNoReplacement. */
const urn = (...parts: [string, number][]) => parts.flatMap(([label, n]) => Array.from({ length: n }, () => label));

/** An explicit population of labelled individuals. */
type Person = Record<string, boolean>;
const people = (...groups: [number, Person][]) =>
  groups.flatMap(([n, p]) => Array.from({ length: n }, () => ({ ...p })));
const P = (pop: Person[], pred: (p: Person) => boolean) => pop.filter(pred).length / pop.length;
/** P(a | b) by COUNTING inside the condition — the denominator cannot be faked. */
const Pgiven = (pop: Person[], a: (p: Person) => boolean, b: (p: Person) => boolean) => {
  const cond = pop.filter(b);
  return cond.length ? cond.filter(a).length / cond.length : NaN;
};
const isTrue = (label: string, cond: boolean) => check(label, cond ? 1 : 0, 1);
/** MCQ options must be four DISTINCT values. */
const distinctOptions = (label: string, vals: number[]) =>
  check(label, new Set(vals.map((v) => v.toFixed(10))).size, vals.length);

// =========================================================================
// pr-x-cnd-101 (easy, mcq) — club of 30, 12 are high-school students,
// 8 of those play chess. A member who IS a high-school student is picked.
// =========================================================================
{
  // the 18 non-students' chess habit is never stated and never used below
  const pop = people([8, { hs: true, chess: true }], [4, { hs: true, chess: false }], [18, { hs: false, chess: false }]);
  check('101 population size', pop.length, 30);
  check('101 P(chess | high school) by counting inside the condition', Pgiven(pop, (p) => p.chess, (p) => p.hs), frac(2, 3));
  // the condition is 12, not 30 — the three distractors are the three wrong denominators/numerators
  check('101 distractor 4/15 = the joint, divided by all 30', P(pop, (p) => p.hs && p.chess), frac(4, 15));
  check('101 distractor 2/5 = P(high school), not what was asked', P(pop, (p) => p.hs), frac(2, 5));
  check('101 distractor 1/3 = the complement INSIDE the condition', Pgiven(pop, (p) => !p.chess, (p) => p.hs), frac(1, 3));
  distinctOptions('101 four distinct option values', [frac(2, 3), frac(4, 15), frac(2, 5), frac(1, 3)]);
}

// =========================================================================
// pr-x-cnd-102 (easy, open) — 65% of buyers are adults; 40% OF THE ADULTS buy
// a non-fiction book. P(adult AND non-fiction)?
// =========================================================================
{
  const pop = people(
    [2600, { adult: true, iyun: true }], // 40% of 6500
    [3900, { adult: true, iyun: false }],
    [3500, { adult: false, iyun: false }],
  );
  check('102 population size', pop.length, 10000);
  check('102 the 40% really is conditional on the adults', Pgiven(pop, (p) => p.iyun, (p) => p.adult), 0.4);
  check('102 P(adult and non-fiction) by counting', P(pop, (p) => p.adult && p.iyun), 0.26);
  check('102 same by the product rule', 0.65 * 0.4, P(pop, (p) => p.adult && p.iyun));
  check('102 wrongAnswer 0.4 = the conditional datum left unweighted', Pgiven(pop, (p) => p.iyun, (p) => p.adult), 0.4);
  check('102 wrongAnswer 0.14 = weighted by the NON-adults', (1 - 0.65) * 0.4, 0.14);
}

// =========================================================================
// pr-x-cnd-103 (easy, mcq) — P(A)=0.6, P(B)=0.35, P(A∩B)=0.21. Independent?
// =========================================================================
{
  const pA = 0.6, pB = 0.35, pAB = 0.21;
  check('103 the product of the marginals', pA * pB, pAB);
  // the two equivalent formulations must both hold, in BOTH directions
  check('103 P(A | B) equals P(A)', pAB / pB, pA);
  check('103 P(B | A) equals P(B)', pAB / pA, pB);
  isTrue('103 verdict is "independent"', Math.abs(pA * pB - pAB) < 1e-12);
  check('103 distractor cites 0.6 + 0.35 = 0.95, a union move', pA + pB, 0.95);
  isTrue('103 non-zero intersection is NOT the test (0.21 > 0)', pAB > 0);
}

// =========================================================================
// pr-x-cnd-104 (easy, open, two boxes) — 40 runners: 24 men, 16 women;
// 18 men and 4 women finished. Both directions, in the order asked.
// =========================================================================
{
  const pop = people(
    [18, { man: true, done: true }],
    [6, { man: true, done: false }],
    [4, { man: false, done: true }],
    [12, { man: false, done: false }],
  );
  check('104 population size', pop.length, 40);
  check('104 men', pop.filter((p) => p.man).length, 24);
  check('104 finishers', pop.filter((p) => p.done).length, 22);
  const first = Pgiven(pop, (p) => p.done, (p) => p.man);   // asked first
  const second = Pgiven(pop, (p) => p.man, (p) => p.done);  // asked second
  check('104 answerLabels[0] "finished given man" = 3/4', first, frac(3, 4));
  check('104 answerLabels[1] "man given finished" = 9/11', second, frac(9, 11));
  isTrue('104 the two directions are NOT the same number', Math.abs(first - second) > 1e-9);
  checkSet('104 expected.values in the asked order', [first, second], [frac(3, 4), frac(9, 11)]);
  check('104 wrongAnswer "3/4, 3/4" — the second part is not 3/4', second, frac(9, 11));
  check('104 wrongAnswer "9/20" = the joint over all 40 runners', P(pop, (p) => p.man && p.done), frac(9, 20));
}

// =========================================================================
// pr-x-cnd-105 (mid, find-the-error) — 150 students; 60 passed computers, of
// them 45 also passed English; 90 passed English in total. The student wrote
// 45/60. THE POINT OF THE QUESTION: 45/60 must really be the INVERTED
// conditional, and the right answer must be the other denominator.
// =========================================================================
{
  const pop = people(
    [45, { comp: true, eng: true }],
    [15, { comp: true, eng: false }],
    [45, { comp: false, eng: true }],
    [45, { comp: false, eng: false }],
  );
  check('105 population size', pop.length, 150);
  check('105 passed computers', pop.filter((p) => p.comp).length, 60);
  check('105 passed English', pop.filter((p) => p.eng).length, 90);
  const asked = Pgiven(pop, (p) => p.comp, (p) => p.eng);      // condition = English
  const inverted = Pgiven(pop, (p) => p.eng, (p) => p.comp);   // condition = computers
  check('105 P(computers | English) = the correct answer', asked, 0.5);
  check("105 the student's 45/60 IS the inverted conditional", inverted, 0.75);
  isTrue('105 the two directions differ, so the error is real', Math.abs(asked - inverted) > 1e-9);
  check('105 same numerator, bigger denominator gives the smaller value', 45 / 90 < 45 / 60 ? 1 : 0, 1);
  check('105 wrongAnswer 0.3 = the joint over all 150', P(pop, (p) => p.comp && p.eng), 0.3);
  // the table drawn in the solution must be arithmetically closed
  checkSet('105 solution table margins', [45 + 15, 45 + 45, 45 + 45, 15 + 45], [60, 90, 90, 60]);
}

// =========================================================================
// pr-x-cnd-106 (mid, count, parameter) — 8 white balls plus some black ones,
// two draws WITHOUT replacement, P(both white) = 4/15. How many black?
// The quadratic is checked for a UNIQUE ADMISSIBLE root, and the winning urn
// is then ENUMERATED — that is what proves the denominator really shrank.
// =========================================================================
{
  // x^2 - x - 210 = 0 from (8/x)(7/(x-1)) = 4/15
  const disc = Math.sqrt(1 + 4 * 210);
  checkSet('106 both roots of x^2 - x - 210', [(1 + disc) / 2, (1 - disc) / 2], [15, -14]);
  isTrue('106 the rejected root is inadmissible (negative)', (1 - disc) / 2 < 0);
  isTrue('106 the accepted root leaves a non-negative number of black balls', 15 - 8 >= 0);
  // the decisive check: enumerate the 15-ball urn without replacement
  const p15 = drawNoReplacement(urn(['w', 8], ['b', 7]), 2, (s) => s[0] === 'w' && s[1] === 'w');
  check('106 P(two white) in a 15-ball urn, enumerated', p15, frac(4, 15));
  // and no neighbouring urn size gives the same probability — the root is unique
  const p14 = drawNoReplacement(urn(['w', 8], ['b', 6]), 2, (s) => s[0] === 'w' && s[1] === 'w');
  const p16 = drawNoReplacement(urn(['w', 8], ['b', 8]), 2, (s) => s[0] === 'w' && s[1] === 'w');
  isTrue('106 x = 14 does not satisfy the condition', Math.abs(p14 - frac(4, 15)) > 1e-6);
  isTrue('106 x = 16 does not satisfy the condition', Math.abs(p16 - frac(4, 15)) > 1e-6);
  check('106 answer = black balls, not the urn size', 15 - 8, 7);
  check('106 wrongAnswer 15 = the urn size, the intermediate unknown', 15, 15);
  check('106 wrongAnswer 8 = the white balls, given in the question', 8, 8);
  // with replacement it would NOT be 4/15 — "אינו מוחזר" really changes the answer
  isTrue('106 replacement would give a different value', Math.abs((8 / 15) ** 2 - frac(4, 15)) > 1e-6);
}

// =========================================================================
// pr-x-cnd-107 (mid, justify) — survey of 200: men 36/54 (90), women 44/66 (110);
// members 80, non-members 120. Independent?
// =========================================================================
{
  const pop = people(
    [36, { man: true, member: true }],
    [54, { man: true, member: false }],
    [44, { man: false, member: true }],
    [66, { man: false, member: false }],
  );
  check('107 population size', pop.length, 200);
  checkSet('107 table margins', [36 + 54, 44 + 66, 36 + 44, 54 + 66], [90, 110, 80, 120]);
  const cell = P(pop, (p) => p.man && p.member);
  check('107 the shared cell as a probability', cell, 0.18);
  check('107 the product of the margins', P(pop, (p) => p.man) * P(pop, (p) => p.member), cell);
  // independence has to hold in BOTH directions, and it does
  check('107 P(member | man) equals P(member)', Pgiven(pop, (p) => p.member, (p) => p.man), P(pop, (p) => p.member));
  check('107 P(man | member) equals P(man)', Pgiven(pop, (p) => p.man, (p) => p.member), P(pop, (p) => p.man));
  check('107 the note\'s arithmetic: 0.45 * 0.4', 0.45 * 0.4, 0.18);
  // The distractor compares two raw CELL COUNTS instead of rates. Grounded in
  // the population rather than asserted: a literal-vs-literal check proves
  // nothing, which is the failure this whole file exists to avoid.
  isTrue(
    '107 distractor compares raw counts, and the bigger count is not the bigger rate',
    pop.filter((p) => p.man && p.member).length !== pop.filter((p) => !p.man && p.member).length,
  );
}

// =========================================================================
// pr-x-cnd-108 (mid, mcq) — 40% veteran drivers late 5%, 60% new late 15%.
// P(a random driver was late)?
// =========================================================================
{
  const pop = people(
    [200, { veteran: true, late: true }],   // 5% of 4000
    [3800, { veteran: true, late: false }],
    [900, { veteran: false, late: true }],  // 15% of 6000
    [5100, { veteran: false, late: false }],
  );
  check('108 population size', pop.length, 10000);
  check('108 the two conditional data are as stated', Pgiven(pop, (p) => p.late, (p) => p.veteran), 0.05);
  check('108 and for the new drivers', Pgiven(pop, (p) => p.late, (p) => !p.veteran), 0.15);
  const total = P(pop, (p) => p.late);
  check('108 P(late) by counting the whole population', total, 0.11);
  check('108 same by total probability', 0.4 * 0.05 + 0.6 * 0.15, total);
  isTrue('108 the answer lies between the two conditional rates', total > 0.05 && total < 0.15);
  check('108 distractor 0.2 = the two rates simply added', 0.05 + 0.15, 0.2);
  check('108 distractor 0.09 = the new drivers\' path alone', 0.6 * 0.15, 0.09);
  // THE FIXED NOTE. The option 0.06 is ONE path with the wrong weight attached —
  // swapping the weights on BOTH paths gives 0.09, which is a different option,
  // so the note that said "the weights were swapped" was describing the wrong
  // mistake. Both values are pinned here so the note can never drift back.
  check('108 distractor 0.06 = one path only, 15% hung on the veterans\' weight', 0.4 * 0.15, 0.06);
  check('108 a FULL weight swap gives 0.09, not 0.06', 0.6 * 0.05 + 0.4 * 0.15, 0.09);
  isTrue('108 so 0.06 and the full swap are different mistakes', Math.abs(0.4 * 0.15 - (0.6 * 0.05 + 0.4 * 0.15)) > 1e-9);
  distinctOptions('108 four distinct option values', [0.11, 0.2, 0.09, 0.06]);
}

// =========================================================================
// pr-x-cnd-109 (mid, find-parameter) — supplier א 60% of batteries with x%
// faulty, supplier ב 40% with 6% faulty, 4.2% faulty overall. Find x.
// =========================================================================
{
  const x = ((0.042 - 0.4 * 0.06) / 0.6) * 100;
  check('109 x recovered from the total-probability equation', x, 3);
  // rebuilt as a population, the recovered x must reproduce the stated 4.2%
  const pop = people(
    [180, { a: true, bad: true }],   // 3% of 6000
    [5820, { a: true, bad: false }],
    [240, { a: false, bad: true }],  // 6% of 4000
    [3760, { a: false, bad: false }],
  );
  check('109 population size', pop.length, 10000);
  check('109 the recovered rate inside supplier A alone', Pgiven(pop, (p) => p.bad, (p) => p.a), 0.03);
  check('109 supplier B is as stated', Pgiven(pop, (p) => p.bad, (p) => !p.a), 0.06);
  check('109 P(faulty) overall is the given 4.2%', P(pop, (p) => p.bad), 0.042);
  check('109 wrongAnswer 1.8 = stopped at the subtraction', (0.042 - 0.4 * 0.06) * 100, 1.8);
  check('109 wrongAnswer 1.5 = the weights swapped between suppliers', ((0.042 - 0.6 * 0.06) / 0.4) * 100, 1.5);
  // REGRESSION PIN: this question used to be the stage's own teach example
  // (60%/2% and 40%/5%, total 3.2%) with the 2% hidden — so its answer was
  // printed verbatim in the lesson above it. Neither number may come back.
  isTrue('109 total is not the lesson example\'s 0.032', Math.abs(0.042 - (0.6 * 0.02 + 0.4 * 0.05)) > 1e-9);
  isTrue('109 answer is not the lesson example\'s 2', Math.abs(x - 2) > 1e-9);
}

// =========================================================================
// pr-x-cnd-110 (hard, reverse) — urn 1: 3 red + 3 green; urn 2: 4 red + 2 green.
// Pick an urn (1/2 each), draw TWO without replacement. Given the two balls are
// the same colour, which urn? THE CONDITION IS A COMPOUND EVENT and must be
// built with total probability before it can be a denominator.
// =========================================================================
{
  const same = (s: string[]) => s[0] === s[1];
  const u1 = drawNoReplacement(urn(['r', 3], ['g', 3]), 2, same);
  const u2 = drawNoReplacement(urn(['r', 4], ['g', 2]), 2, same);
  check('110 P(same colour | urn 1), enumerated', u1, frac(2, 5));
  check('110 P(same colour | urn 2), enumerated', u2, frac(7, 15));
  const pSame = 0.5 * u1 + 0.5 * u2;
  check('110 P(same colour) by total probability', pSame, frac(13, 30));
  const back1 = (0.5 * u1) / pSame;
  const back2 = (0.5 * u2) / pSame;
  check('110 P(urn 1 | same colour)', back1, frac(6, 13));
  check('110 P(urn 2 | same colour)', back2, frac(7, 13));
  check('110 the two posteriors sum to 1', back1 + back2, 1);
  // INDEPENDENT ROUTE: both urns hold 6 balls, so each contributes exactly
  // 6*5 = 30 equally likely ordered draws. 60 equally likely (urn, pair)
  // outcomes, counted directly — no formula, no chosen denominator.
  const ordered = (balls: string[]) =>
    balls.flatMap((a, i) => balls.filter((_, j) => j !== i).map((b) => [a, b] as [string, string]));
  const pairs1 = ordered(urn(['r', 3], ['g', 3]));
  const pairs2 = ordered(urn(['r', 4], ['g', 2]));
  check('110 each urn yields 30 ordered pairs, so all 60 are equally likely', pairs1.length, pairs2.length);
  const hits1 = pairs1.filter(same).length;
  const hits2 = pairs2.filter(same).length;
  checkSet('110 same-colour ordered pairs per urn', [hits1, hits2], [12, 14]);
  check('110 P(urn 1 | same colour) by raw counting', hits1 / (hits1 + hits2), frac(6, 13));
  // the three wrong answers
  check('110 wrongAnswer 1/5 = the joint path, never divided', 0.5 * u1, frac(1, 5));
  check('110 wrongAnswer 2/5 = P(same colour | urn 1), the inverted direction', u1, frac(2, 5));
  check('110 wrongAnswer 1/2 = the prior, before the evidence', 0.5, 0.5);
  isTrue('110 the evidence really does move the prior', Math.abs(back1 - 0.5) > 1e-9);
}

// =========================================================================
// pr-x-cnd-111 (hard, find-parameter + reverse) — two-stage hiring. P(pass
// test 1) = p, P(pass test 2 | passed 1) = 2p, 32% are accepted. Find p, then
// P(passed test 1 | NOT accepted) — a condition that is a complement made of
// two different failure routes.
// =========================================================================
{
  // 2p^2 = 0.32
  const roots = [Math.sqrt(0.16), -Math.sqrt(0.16)];
  checkSet('111 both roots of 2p^2 = 0.32', roots, [0.4, -0.4]);
  const p = roots[0];
  isTrue('111 the rejected root is inadmissible (negative)', roots[1] < 0);
  isTrue('111 the accepted root keeps 2p a legal probability', 2 * p <= 1 && 2 * p > 0);
  check('111 p recovered', p, 0.4);
  check('111 it reproduces the stated 32% accepted', p * 2 * p, 0.32);
  // explicit population of 10000 candidates
  const pop = people(
    [3200, { first: true, hired: true }],   // 0.4 * 0.8
    [800, { first: true, hired: false }],   // 0.4 * 0.2 — passed test 1, failed test 2
    [6000, { first: false, hired: false }], // failed test 1, never sat test 2
  );
  check('111 population size', pop.length, 10000);
  check('111 P(pass test 1) in the population', P(pop, (q) => q.first), 0.4);
  check('111 P(pass test 2 | passed test 1)', Pgiven(pop, (q) => q.hired, (q) => q.first), 0.8);
  check('111 P(hired)', P(pop, (q) => q.hired), 0.32);
  check('111 P(not hired) — the condition', P(pop, (q) => !q.hired), 0.68);
  const back = Pgiven(pop, (q) => q.first, (q) => !q.hired);
  check('111 P(passed test 1 | not hired) by counting', back, frac(2, 17));
  check('111 same as 0.08 / 0.68', 0.08 / 0.68, back);
  isTrue('111 most of the rejected failed test 1, so the answer is small', back < 0.2);
  check('111 wrongAnswer 0.08 = the numerator, never divided', P(pop, (q) => q.first && !q.hired), 0.08);
  check('111 wrongAnswer 0.2 = P(fail test 2 | passed test 1), the other direction', 1 - 2 * p, 0.2);
  check('111 wrongAnswer 0.8 = 2p, the conditional, not p itself', 2 * p, 0.8);
}

// =========================================================================
// pr-x-cnd-112 (hard, compare + reverse) — machine א 70% of items, 4% faulty;
// machine ב 30%, 10% faulty. Given a faulty item, which machine is likelier?
// =========================================================================
{
  const pop = people(
    [280, { a: true, bad: true }],   // 4% of 7000
    [6720, { a: true, bad: false }],
    [300, { a: false, bad: true }],  // 10% of 3000
    [2700, { a: false, bad: false }],
  );
  check('112 population size', pop.length, 10000);
  check('112 machine A path', 0.7 * 0.04, 0.028);
  check('112 machine B path', 0.3 * 0.1, 0.03);
  check('112 P(faulty) by counting', P(pop, (q) => q.bad), 0.058);
  const pa = Pgiven(pop, (q) => q.a, (q) => q.bad);
  const pb = Pgiven(pop, (q) => !q.a, (q) => q.bad);
  check('112 P(machine A | faulty)', pa, frac(14, 29));
  check('112 P(machine B | faulty)', pb, frac(15, 29));
  check('112 the two posteriors sum to 1', pa + pb, 1);
  isTrue('112 machine B is the larger one — the stated verdict', pb > pa);
  isTrue('112 the intuitive answer is wrong: A produces more items', P(pop, (q) => q.a) > 0.5);
  isTrue('112 yet its faulty path is the smaller one', 0.7 * 0.04 < 0.3 * 0.1);
  check('112 distractor 5/7 = the rates compared without the volumes', 0.1 / (0.04 + 0.1), frac(5, 7));
  check('112 and its partner 2/7', 0.04 / (0.04 + 0.1), frac(2, 7));
  isTrue('112 distractor "equal, 1/2 each" is not what counting gives', Math.abs(pa - 0.5) > 1e-9);
}

// =========================================================================
// pr-x-cnd-113 (hard, Bernoulli under a condition) — each lemon is for export
// with p = 0.6, independently; 3 lemons. Given AT LEAST ONE is for export,
// P(AT MOST ONE is for export)? The decomposition is the question: the two
// events overlap in exactly one case. Enumerated over 5^3 equally likely
// outcomes, with "export" = a value of 3 or less, so p = 3/5 = 0.6 exactly.
// =========================================================================
{
  const S = [R(5), R(5), R(5)];
  const nExport = (o: number[]) => o.filter((v) => v <= 3).length;
  const atLeast1 = (o: number[]) => nExport(o) >= 1;
  const atMost1 = (o: number[]) => nExport(o) <= 1;

  check('113 P(exactly one), enumerated', enumerate(S, (o) => nExport(o) === 1), 0.288);
  check('113 same by the Bernoulli term', binom(3, 1, 0.6), 0.288);
  check('113 P(at least one), enumerated', enumerate(S, atLeast1), 0.936);
  check('113 same by the complement', atLeastOne(0.6, 3), 0.936);
  check('113 P(at most one), enumerated', enumerate(S, atMost1), 0.352);
  // THE DECOMPOSITION CLAIM: "at most one" AND "at least one" is exactly "one".
  check(
    '113 the intersection of the two events IS "exactly one"',
    enumerate(S, (o) => atMost1(o) && atLeast1(o)),
    enumerate(S, (o) => nExport(o) === 1),
  );
  // the conditional, by raw counting of the 125 outcomes
  const cond = enumerate(S, (o) => atMost1(o) && atLeast1(o)) / enumerate(S, atLeast1);
  check('113 P(at most one | at least one) by counting', cond, frac(4, 13));
  check('113 same as 0.288 / 0.936', 0.288 / 0.936, cond);
  isTrue('113 the condition raised the probability of the surviving case', cond > 0.288);
  check('113 distractor 0.376 = the wrong numerator (0.352) over the right denominator', 0.352 / 0.936, 0.376, 1e-3);
  check('113 distractor 0.352 = P(at most one), never divided', enumerate(S, atMost1), 0.352);
  check('113 distractor 0.288 = the numerator, never divided', binom(3, 1, 0.6), 0.288);
  distinctOptions('113 four distinct option values', [frac(4, 13), 0.352 / 0.936, 0.352, 0.288]);
}

summary('pr-conditional');
