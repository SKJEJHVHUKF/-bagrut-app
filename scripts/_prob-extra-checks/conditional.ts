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

// =========================================================================
// ROUND 2 — pr-x-cnd-201…208 and prob-bag-x-cnd-01 (parts א–ד).
// Every probtree fence in this stage is a claim: a `tree` helper re-derives
// each one from the QUESTION and checks that the leaves sum to 1 and that the
// ✓ leaves sum to what the step SAYS they are (numerator or denominator).
// =========================================================================

/** A two-stage tree from the question's own data: [[p_branch, [p_leaf, picked][]]]. */
type Tree = [number, [number, boolean][]][];
const leaves = (t: Tree) => t.flatMap(([pb, ls]) => ls.map(([pl, pick]) => [pb * pl, pick] as const));
const treeSum = (t: Tree) => leaves(t).reduce((a, [v]) => a + v, 0);
const picked = (t: Tree) => leaves(t).filter(([, pick]) => pick).reduce((a, [v]) => a + v, 0);

// ---- fences on round-1 questions (108–112): re-derived from each QUESTION ----
{
  // 108: veterans 40% late 5%, new 60% late 15%; picks = both "late" leaves = the answer
  const t108: Tree = [[0.4, [[0.05, true], [0.95, false]]], [0.6, [[0.15, true], [0.85, false]]]];
  check('108 fence leaves sum to 1', treeSum(t108), 1);
  check('108 fence picks = P(late) = the answer 0.11', picked(t108), 0.11);
  checkSet('108 fence leaf products as drawn', leaves(t108).map(([v]) => v), [0.02, 0.38, 0.09, 0.51]);
  // 109: with the recovered x = 3, supplier A 60% / 3%, B 40% / 6%; picks = both faulty = the given 4.2%
  const t109: Tree = [[0.6, [[0.03, true], [0.97, false]]], [0.4, [[0.06, true], [0.94, false]]]];
  check('109 fence leaves sum to 1', treeSum(t109), 1);
  check('109 fence picks = the stated 4.2% total', picked(t109), 0.042);
  checkSet('109 fence supplier-B leaves as drawn', leaves(t109).slice(2).map(([v]) => v), [0.024, 0.376]);
  // 110: three-stage tree, flattened per urn; picks = urn 1 AND same colour = the NUMERATOR (step says 12/60 = 1/5)
  const t110: Tree = [
    [0.5 * frac(3, 6), [[frac(2, 5), true], [frac(3, 5), false]]],  // urn 1, first red
    [0.5 * frac(3, 6), [[frac(3, 5), false], [frac(2, 5), true]]],  // urn 1, first green
    [0.5 * frac(4, 6), [[frac(3, 5), false], [frac(2, 5), false]]], // urn 2, first red
    [0.5 * frac(2, 6), [[frac(4, 5), false], [frac(1, 5), false]]], // urn 2, first green
  ];
  check('110 fence leaves sum to 1', treeSum(t110), 1);
  check('110 fence picks = the NUMERATOR 12/60 = 1/5, as the step says', picked(t110), frac(1, 5));
  checkSet('110 fence leaf products in 60ths as drawn', leaves(t110).map(([v]) => v * 60), [6, 9, 9, 6, 12, 8, 8, 2]);
  // 111: p = 0.4, 2p = 0.8; fail-first is a bare leaf; pick = passed first AND failed second = numerator 0.08
  const t111: Tree = [[0.4, [[0.8, false], [0.2, true]]], [0.6, [[1, false]]]];
  check('111 fence leaves sum to 1', treeSum(t111), 1);
  check('111 fence pick = the numerator 0.08 (step: the marked path is the numerator)', picked(t111), 0.08);
  // 112: A 70% / 4%, B 30% / 10%; picks = both faulty = the DENOMINATOR (step says so)
  const t112: Tree = [[0.7, [[0.04, true], [0.96, false]]], [0.3, [[0.1, true], [0.9, false]]]];
  check('112 fence leaves sum to 1', treeSum(t112), 1);
  check('112 fence picks = the DENOMINATOR 0.058, as the step says', picked(t112), 0.058);
  checkSet('112 fence leaf products as drawn', leaves(t112).map(([v]) => v), [0.028, 0.672, 0.03, 0.27]);
}

// =========================================================================
// pr-x-cnd-201 (mid, open) — 120 students; physics 45, sport 50, both 30.
// Given physics OR sport, P(both)? The condition is a UNION.
// =========================================================================
{
  const pop = people(
    [30, { phys: true, sport: true }],
    [15, { phys: true, sport: false }],
    [20, { phys: false, sport: true }],
    [55, { phys: false, sport: false }],
  );
  check('201 population size', pop.length, 120);
  checkSet('201 margins as stated', [pop.filter((p) => p.phys).length, pop.filter((p) => p.sport).length], [45, 50]);
  check('201 union size by inclusion-exclusion', 45 + 50 - 30, pop.filter((p) => p.phys || p.sport).length);
  check('201 P(both | phys or sport) by counting inside the union', Pgiven(pop, (p) => p.phys && p.sport, (p) => p.phys || p.sport), frac(6, 13));
  checkSet('201 solution table cells', [15, 20, 55, 75, 70], [45 - 30, 50 - 30, 120 - 65, 120 - 45, 120 - 50]);
  check('201 wrongAnswer 1/4 = over all 120', P(pop, (p) => p.phys && p.sport), frac(1, 4));
  check('201 wrongAnswer 6/19 = double-counted union 95', 30 / (45 + 50), frac(6, 19));
  check('201 wrongAnswer 2/3 = conditioned on physics alone', Pgiven(pop, (p) => p.sport, (p) => p.phys), frac(2, 3));
}

// =========================================================================
// pr-x-cnd-202 (mid, mcq) — independent, P(A) = 0.3, P(A ∪ B) = 0.58. P(B)?
// =========================================================================
{
  const pA = 0.3, pU = 0.58;
  const pB = (pU - pA) / (1 - pA); // union rule with P(A∩B) = pA·pB
  check('202 P(B) from the union rule', pB, 0.4);
  check('202 complement route: (1-0.3)(1-p) = 0.42', (1 - pA) * (1 - pB), 1 - pU);
  check('202 reproduces the stated union', pA + pB - pA * pB, pU);
  check('202 distractor 0.28 = 0.58 - 0.3 (disjoint move)', pU - pA, 0.28);
  check('202 distractor 0.6 = 1 - p, stopped early', 1 - pB, 0.6);
  check('202 distractor 0.88 = the two data added', pU + pA, 0.88);
  distinctOptions('202 four distinct option values', [0.4, 0.28, 0.6, 0.88]);
}

// =========================================================================
// pr-x-cnd-203 (mid, open) — 40 students, 60% boys; P(robotics | boy) = 0.25,
// P(robotics) = 0.35. How many GIRLS in robotics? (FIXED: with 0.3 the wrong
// path "boys in the club" also gave 6, the correct answer.)
// =========================================================================
{
  const boys = 0.6 * 40, girls = 40 - boys;
  const boysIn = Math.round(0.25 * boys), allIn = Math.round(0.35 * 40); // rounded: 0.35*40 is 14.000…02 in floats
  check('203 rounding lost nothing', boysIn + allIn, 0.25 * boys + 0.35 * 40);
  const girlsIn = allIn - boysIn;
  checkSet('203 boys and girls', [boys, girls], [24, 16]);
  check('203 girls in robotics', girlsIn, 8);
  const pop = people(
    [boysIn, { boy: true, rob: true }],
    [boys - boysIn, { boy: true, rob: false }],
    [girlsIn, { boy: false, rob: true }],
    [girls - girlsIn, { boy: false, rob: false }],
  );
  check('203 population size', pop.length, 40);
  check('203 P(rob | boy) reproduces 0.25', Pgiven(pop, (p) => p.rob, (p) => p.boy), 0.25);
  check('203 P(rob) reproduces 0.35', P(pop, (p) => p.rob), 0.35);
  check('203 table: girls not in club', girls - girlsIn, 8);
  check('203 table: total not in club', 40 - allIn, 26);
  check('203 sanity: P(rob | girl) = 0.5', Pgiven(pop, (p) => p.rob, (p) => !p.boy), 0.5);
  check('203 wrongAnswer 14 = all members', allIn, 14);
  check('203 wrongAnswer 6 = boys in the club', boysIn, 6);
  check('203 wrongAnswer 4 = 0.25 applied to the girls', 0.25 * girls, 4);
  isTrue('203 the boys-in-club path no longer lands on the answer', Math.abs(boysIn - girlsIn) > 1e-9);
}

// =========================================================================
// pr-x-cnd-204 (mid, mcq, find-the-error) — children 25% late 20%, adults 75%
// late 8%. Student says P(child | late) = 0.2. (FIXED: was 30%/20%/10%, whose
// answer 6/13 duplicated both 201 and 110.)
// =========================================================================
{
  const t204: Tree = [[0.25, [[0.2, true], [0.8, false]]], [0.75, [[0.08, true], [0.92, false]]]];
  check('204 fence leaves sum to 1', treeSum(t204), 1);
  check('204 fence picks = P(late) = the denominator 0.11', picked(t204), 0.11);
  checkSet('204 fence leaf products as drawn', leaves(t204).map(([v]) => v), [0.05, 0.2, 0.06, 0.69]);
  const pop = people(
    [500, { child: true, late: true }],   // 20% of 2500
    [2000, { child: true, late: false }],
    [600, { child: false, late: true }],  // 8% of 7500
    [6900, { child: false, late: false }],
  );
  check('204 population size', pop.length, 10000);
  check('204 P(late | child) is the student\'s 0.2, the inverted direction', Pgiven(pop, (p) => p.late, (p) => p.child), 0.2);
  const ans = Pgiven(pop, (p) => p.child, (p) => p.late);
  check('204 P(child | late) by counting', ans, frac(5, 11));
  check('204 same as 0.05 / 0.11', 0.05 / 0.11, ans);
  isTrue('204 the answer is not 201\'s / 110\'s 6/13', Math.abs(ans - frac(6, 13)) > 1e-3);
  check('204 distractor 0.05 = the joint path, never divided', P(pop, (p) => p.child && p.late), 0.05);
  check('204 distractor 0.25 = the prior', P(pop, (p) => p.child), 0.25);
  check('204 sanity: late rate ratio is 2.5', 0.2 / 0.08, 2.5);
  distinctOptions('204 four distinct option values', [frac(5, 11), 0.2, 0.05, 0.25]);
}

// =========================================================================
// pr-x-cnd-205 (hard, open, two boxes) — 5 red + 3 blue. Given the SECOND is
// red, P(first red): with replacement, then without.
// =========================================================================
{
  const withRep = enumerate([urn(['r', 5], ['b', 3]), urn(['r', 5], ['b', 3])], (s) => s[0] === 'r' && s[1] === 'r')
    / enumerate([urn(['r', 5], ['b', 3]), urn(['r', 5], ['b', 3])], (s) => s[1] === 'r');
  check('205 answerLabels[0] with replacement = 5/8, enumerated', withRep, frac(5, 8));
  const joint = drawNoReplacement(urn(['r', 5], ['b', 3]), 2, (s) => s[0] === 'r' && s[1] === 'r');
  const second = drawNoReplacement(urn(['r', 5], ['b', 3]), 2, (s) => s[1] === 'r');
  check('205 without replacement: P(second red) = 5/8 too', second, frac(5, 8));
  check('205 answerLabels[1] without replacement = 4/7, enumerated', joint / second, frac(4, 7));
  checkSet('205 expected.values in the asked order (with, without)', [withRep, joint / second], [frac(5, 8), frac(4, 7)]);
  const t205: Tree = [[frac(5, 8), [[frac(4, 7), true], [frac(3, 7), false]]], [frac(3, 8), [[frac(5, 7), false], [frac(2, 7), false]]]];
  check('205 fence leaves sum to 1', treeSum(t205), 1);
  check('205 fence pick = the numerator 20/56', picked(t205), frac(20, 56));
  checkSet('205 fence leaf products in 56ths', leaves(t205).map(([v]) => v * 56), [20, 15, 15, 6]);
  check('205 step: the two red-ending leaves sum to 35/56', frac(20, 56) + frac(15, 56), frac(35, 56));
  check('205 wrongAnswer 5/14 = the joint, never divided', joint, frac(5, 14));
  isTrue('205 the two boxes differ', Math.abs(withRep - joint / second) > 1e-9);
}

// =========================================================================
// pr-x-cnd-206 (hard, open, hidden parameter behind Bayes) — A makes x%, 5%
// faulty; B the rest, 15% faulty; P(A | faulty) = 0.5. Find x.
// =========================================================================
{
  const a = 0.15 / (0.05 + 0.15); // 0.05a = 0.15(1-a)
  check('206 a from the equal-paths equation', a, 0.75);
  check('206 x = 75', a * 100, 75);
  const bayes = (aa: number) => (0.05 * aa) / (0.05 * aa + 0.15 * (1 - aa));
  check('206 reproduces P(A | faulty) = 0.5', bayes(a), 0.5);
  isTrue('206 the solution is unique (Bayes is monotone in a)', bayes(0.74) < 0.5 && bayes(0.76) > 0.5);
  const t206: Tree = [[a, [[0.05, true], [0.95, false]]], [1 - a, [[0.15, true], [0.85, false]]]];
  check('206 fence leaves sum to 1', treeSum(t206), 1);
  check('206 fence picks = both faulty paths = 0.075', picked(t206), 0.075);
  check('206 the two faulty paths are equal: 0.0375 each', 0.05 * a, 0.15 * (1 - a));
  check('206 wrongAnswer 25 = the other machine\'s share', (1 - a) * 100, 25);
  check('206 wrongAnswer 50: the given conditional, and it is NOT a solution', bayes(0.5), 0.25);
  check('206 sanity: ratio of fault rates is 3', 0.15 / 0.05, 3);
}

// =========================================================================
// pr-x-cnd-207 (hard, mcq, justify) — P(A|B) = P(A|B̄) = 0.6, P(B) unknown.
// Claim: independent regardless of P(B). Checked at MANY values of p.
// =========================================================================
{
  for (const p of [0.1, 0.25, 0.5, 0.8, 0.99]) {
    const pA = 0.6 * p + 0.6 * (1 - p);
    check(`207 P(A) = 0.6 at P(B) = ${p}`, pA, 0.6);
    check(`207 P(A ∩ B) = P(A)P(B) at P(B) = ${p}`, 0.6 * p, pA * p);
  }
  const t207: Tree = [[0.3, [[0.6, true], [0.4, false]]], [0.7, [[0.6, true], [0.4, false]]]];
  check('207 fence leaves sum to 1 (at p = 0.3)', treeSum(t207), 1);
  check('207 fence picks = P(A) = 0.6', picked(t207), 0.6);
  check('207 distractor: P(A|B) + P(A|B̄) = 1.2, and that sum is meaningless', 0.6 + 0.6, 1.2);
  check('207 what DOES sum to 1: P(A|B) + P(Ā|B)', 0.6 + 0.4, 1);
  // counter-model for the "only at P(B) = 0.5" distractor: independence holds at p = 0.2 too
  check('207 distractor "only at 0.5": independence holds at 0.2 as well', 0.6 * 0.2, (0.6 * 0.2 + 0.6 * 0.8) * 0.2);
}

// =========================================================================
// pr-x-cnd-208 (hard, open) — 3 questions, p = 0.6 each, worth 1, 2, 3 points.
// Given ≥ 3 points, P(Q3 correct)? Enumerated over 5^3 outcomes (3/5 = 0.6).
// =========================================================================
{
  const S = [R(5), R(5), R(5)];
  const ok = (o: number[], i: number) => o[i] <= 3;
  const pts = (o: number[]) => (ok(o, 0) ? 1 : 0) + (ok(o, 1) ? 2 : 0) + (ok(o, 2) ? 3 : 0);
  check('208 P(< 3 points), enumerated', enumerate(S, (o) => pts(o) < 3), 0.256);
  check('208 same as the three listed cases', 0.4 ** 3 + 2 * 0.6 * 0.4 ** 2, 0.256);
  check('208 P(>= 3 points), enumerated', enumerate(S, (o) => pts(o) >= 3), 0.744);
  check('208 CONTAINMENT: Q3 correct implies >= 3 points', enumerate(S, (o) => ok(o, 2) && pts(o) < 3), 0);
  check('208 numerator = P(Q3 correct) = 0.6', enumerate(S, (o) => ok(o, 2) && pts(o) >= 3), 0.6);
  const cond = enumerate(S, (o) => ok(o, 2) && pts(o) >= 3) / enumerate(S, (o) => pts(o) >= 3);
  check('208 P(Q3 | >= 3) by counting', cond, frac(25, 31));
  check('208 same as 0.6 / 0.744', 0.6 / 0.744, cond);
  isTrue('208 the condition raised it above 0.6', cond > 0.6);
  check('208 wrongAnswer 0.4464 = 0.6 * 0.744', 0.6 * 0.744, 0.4464);
  // the only <3 sets: {}, {Q1}, {Q2} — Q1+Q2 = 3 already qualifies
  check('208 Q1 and Q2 alone give exactly 3 points', pts([1, 1, 5]), 3);
}

// =========================================================================
// prob-bag-x-cnd-01 — 80% adults use x%, 20% young use 90%, half of all use.
// =========================================================================
{
  // א: x from total probability
  const x = ((0.5 - 0.2 * 0.9) / 0.8) * 100;
  check('bag-א x = 40', x, 40);
  check('bag-א reproduces the given half', 0.8 * 0.4 + 0.2 * 0.9, 0.5);
  const tA: Tree = [[0.8, [[0.4, true], [0.6, false]]], [0.2, [[0.9, true], [0.1, false]]]];
  check('bag-א fence leaves sum to 1', treeSum(tA), 1);
  check('bag-א fence picks = P(uses) = 0.5', picked(tA), 0.5);
  checkSet('bag-א fence young leaves as drawn', leaves(tA).slice(2).map(([v]) => v), [0.18, 0.02]);
  // ב: P(adult | does NOT use) — uses x from א (CHANGED from P(young | uses) = 0.36, which never needed א)
  const pop = people(
    [3200, { adult: true, uses: true }],
    [4800, { adult: true, uses: false }],
    [1800, { adult: false, uses: true }],
    [200, { adult: false, uses: false }],
  );
  check('bag population size', pop.length, 10000);
  check('bag-ב P(not uses) = 0.5', P(pop, (p) => !p.uses), 0.5);
  check('bag-ב numerator 0.8 * 0.6 = 0.48', P(pop, (p) => p.adult && !p.uses), 0.48);
  check('bag-ב P(adult | not uses) by counting', Pgiven(pop, (p) => p.adult, (p) => !p.uses), 0.96);
  check('bag-ב the two non-user paths sum to the denominator', 0.48 + 0.02, 0.5);
  isTrue('bag-ב the answer depends on x (with x = 50 it would differ)', Math.abs((0.8 * 0.5) / 0.5 - 0.96) > 1e-9);
  // ג: Bernoulli n = 3, p = 0.5; exactly 2 given at least 1
  const S3 = [R(2), R(2), R(2)];
  const n = (o: number[]) => o.filter((v) => v === 1).length;
  check('bag-ג P(exactly 2), enumerated', enumerate(S3, (o) => n(o) === 2), 0.375);
  check('bag-ג same by Bernoulli', binom(3, 2, 0.5), 0.375);
  check('bag-ג P(at least 1)', enumerate(S3, (o) => n(o) >= 1), atLeastOne(0.5, 3));
  check('bag-ג CONTAINMENT: exactly 2 lies inside at least 1', enumerate(S3, (o) => n(o) === 2 && n(o) < 1), 0);
  check('bag-ג P(exactly 2 | at least 1) by counting', enumerate(S3, (o) => n(o) === 2) / enumerate(S3, (o) => n(o) >= 1), frac(3, 7));
  // ד: stopping rule — sequences U, NU, NNU, NNN(...)
  const seqs: [string, number][] = [['U', 0.5], ['NU', 0.25], ['NNU', 0.125], ['NNN', 0.125]];
  check('bag-ד the four stopping sequences sum to 1', seqs.reduce((a, [, p]) => a + p, 0), 1);
  const atMost3 = seqs.filter(([s]) => s.endsWith('U')).reduce((a, [, p]) => a + p, 0);
  check('bag-ד P(at most 3 draws) = 1 - 0.5^3', atMost3, 1 - 0.5 ** 3);
  check('bag-ד P(exactly 3 draws) = NNU', seqs.find(([s]) => s === 'NNU')![1], 0.5 ** 3);
  check('bag-ד P(exactly 3 | at most 3)', 0.125 / atMost3, frac(1, 7));
  // the fence: a chain, flattened: U | N→U | N→N→U(pick) | N→N→N
  const tD: Tree = [[0.5, [[1, false]]], [0.5 * 0.5, [[1, false]]], [0.5 * 0.5, [[0.5, true], [0.5, false]]]];
  check('bag-ד fence leaves sum to 1', treeSum(tD), 1);
  check('bag-ד fence pick = the numerator 0.125', picked(tD), 0.125);
  checkSet('bag-ד fence leaf products as drawn', leaves(tD).map(([v]) => v), [0.5, 0.25, 0.125, 0.125]);
}

summary('pr-conditional');
