/**
 * Numeric re-derivation for pr-tables' EXTRA questions (pr-x-tab-101…110).
 *
 * A probability table is a grid of COUNTS in disguise, and the failure a
 * formula-vs-formula check cannot see is a wrong denominator. So every table
 * here is rebuilt as an explicit population of individuals (scaled to whole
 * numbers where the question states probabilities), and every published value
 * is recomputed by COUNTING that population with `enumerate` — margins,
 * intersections and conditionals alike. Each margin is also re-checked against
 * the sum of its own cells, which is what catches a table that does not close.
 *
 * `expected` is the value published in the question; `got` is never a literal.
 *
 *   npx tsx scripts/_prob-extra-checks/tables.ts
 */
import { binom, check, checkSet, enumerate, frac, summary } from './_lib';

/** One row per individual, so every outcome in `enumerate` is equally likely. */
type Person = Record<string, string>;
const population = (cells: { count: number; attrs: Person }[]): Person[] =>
  cells.flatMap(({ count, attrs }) => Array.from({ length: count }, () => attrs));

const P = (pop: Person[], pred: (p: Person) => boolean) => enumerate([pop], ([p]) => pred(p));
/** Conditional straight from the population: both numerator and denominator counted. */
const Pgiven = (pop: Person[], a: (p: Person) => boolean, b: (p: Person) => boolean) =>
  P(pop, (p) => a(p) && b(p)) / P(pop, b);

// ===========================================================================
// 101 — 90 students, grade × lodging. Young: tent 24, room 16 (40). Tent 54,
//       room 36. Asked: older students in the tent.
// ===========================================================================
{
  const tentTotal = 54, roomTotal = 36, youngTent = 24, youngRoom = 16, olderTotal = 50;
  const olderTent = tentTotal - youngTent;          // the answer, from the COLUMN
  const olderRoom = roomTotal - youngRoom;
  check('101 older-in-tent', olderTent, 30);
  // the table must close both ways, or the cell is not determined
  check('101 older row closes', olderTent + olderRoom, olderTotal);
  check('101 grand total', youngTent + youngRoom + olderTent + olderRoom, 90);
  const pop101 = population([
    { count: youngTent, attrs: { grade: 'young', bed: 'tent' } },
    { count: youngRoom, attrs: { grade: 'young', bed: 'room' } },
    { count: olderTent, attrs: { grade: 'older', bed: 'tent' } },
    { count: olderRoom, attrs: { grade: 'older', bed: 'room' } },
  ]);
  check('101 counted from population', P(pop101, (p) => p.grade === 'older' && p.bed === 'tent') * 90, 30);
  // distractors
  check('101 distractor whole older row', 90 - (youngTent + youngRoom), 50);
  check('101 distractor 50-24 (row minus foreign cell)', olderTotal - youngTent, 26);
  check('101 distractor older-in-room', olderRoom, 20);
}

// ===========================================================================
// 102 — train table (probabilities). Rows morning/evening, cols booked/not.
//       Asked: evening∧booked, evening∧not.
// ===========================================================================
{
  // scaled to 100 travellers so the cells are countable
  const pop102 = population([
    { count: 35, attrs: { when: 'morning', book: 'yes' } },
    { count: 15, attrs: { when: 'morning', book: 'no' } },
    { count: 20, attrs: { when: 'evening', book: 'yes' } },
    { count: 30, attrs: { when: 'evening', book: 'no' } },
  ]);
  const evBooked = P(pop102, (p) => p.when === 'evening' && p.book === 'yes');
  const evNot = P(pop102, (p) => p.when === 'evening' && p.book === 'no');
  checkSet('102 answers', [evBooked, evNot], [0.2, 0.3]);
  check('102 evening margin = its two cells', evBooked + evNot, P(pop102, (p) => p.when === 'evening'));
  check('102 evening margin value', P(pop102, (p) => p.when === 'evening'), 0.5);
  check('102 table closes', P(pop102, () => true), 1);
  // wrong answers
  check('102 wrong: booked margin', P(pop102, (p) => p.book === 'yes'), 0.55);
  check('102 wrong: not-booked margin', P(pop102, (p) => p.book === 'no'), 0.45);
  check('102 wrong: morning row cells', P(pop102, (p) => p.when === 'morning' && p.book === 'yes'), 0.35);
  check('102 wrong: morning not-booked', P(pop102, (p) => p.when === 'morning' && p.book === 'no'), 0.15);
}

// ===========================================================================
// 103 — packing house, four inner cells only (0.48 / 0.12 / 0.34 / 0.06).
//       Asked: P(small fruit) — a whole column, not a cell.
// ===========================================================================
{
  const pop103 = population([
    { count: 4800, attrs: { dest: 'export', size: 'big' } },
    { count: 1200, attrs: { dest: 'export', size: 'small' } },
    { count: 3400, attrs: { dest: 'local', size: 'big' } },
    { count: 600, attrs: { dest: 'local', size: 'small' } },
  ]);
  const small = P(pop103, (p) => p.size === 'small');
  check('103 P(small)', small, 0.18);
  check('103 cells sum to 1', P(pop103, () => true), 1);
  // second, independent route: the complement of the big column
  const big = P(pop103, (p) => p.size === 'big');
  check('103 via complement', 1 - big, 0.18);
  check('103 big column (distractor)', big, 0.82);
  check('103 distractor export∧small cell', P(pop103, (p) => p.dest === 'export' && p.size === 'small'), 0.12);
  check('103 distractor local∧small cell', P(pop103, (p) => p.dest === 'local' && p.size === 'small'), 0.06);
}

// ===========================================================================
// 104 — 45% car, 60% canteen, 30% both. A student's table has exactly two
//       wrong squares. Asked: the correct margin, the correct cell, and then
//       P(no car | no canteen) off the CORRECTED table.
// ===========================================================================
{
  const pCar = 0.45, pEat = 0.60, pBoth = 0.30;
  const carNot = pCar - pBoth;            // 0.15
  const notCarEat = pEat - pBoth;         // 0.30
  const notEatMargin = 1 - pEat;          // 0.40 — the student wrote 0.45
  const notCarNotEat = (1 - pCar) - notCarEat; // 0.25 — the student wrote 0.30
  check('104 car∧not-eat cell', carNot, 0.15);
  check('104 not-car∧eat cell', notCarEat, 0.3);
  checkSet('104 answers (a)', [notEatMargin, notCarNotEat], [0.4, 0.25]);
  // the corrected table closes; the student's does not — that is what "two
  // wrong squares" means, and it is checked, not asserted
  check('104 corrected cells sum to 1', pBoth + carNot + notCarEat + notCarNotEat, 1);
  check('104 student cells sum to 1.05', 0.3 + 0.15 + 0.3 + 0.3, 1.05);
  check('104 not-eat column closes', carNot + notCarNotEat, notEatMargin);
  check('104 not-car row closes', notCarEat + notCarNotEat, 1 - pCar);
  // part (b), counted from the corrected population (per 100 employees)
  const pop104 = population([
    { count: 30, attrs: { car: 'yes', eat: 'yes' } },
    { count: 15, attrs: { car: 'yes', eat: 'no' } },
    { count: 30, attrs: { car: 'no', eat: 'yes' } },
    { count: 25, attrs: { car: 'no', eat: 'no' } },
  ]);
  const b104 = Pgiven(pop104, (p) => p.car === 'no', (p) => p.eat === 'no');
  check('104 P(no car | no canteen)', b104, 0.625);
  check('104 (b) denominator is the column margin', P(pop104, (p) => p.eat === 'no'), 0.4);
  // wrong answers
  check('104 wrong: on the student table', frac(0.3, 0.45), 2 / 3);
  check('104 wrong: margin fixed, cell not', frac(0.3, 0.4), 0.75);
  check('104 wrong: divided by everyone', frac(0.25, 1), 0.25);
}

// ===========================================================================
// 105 — 200 customers, card × promo. Independence test.
// ===========================================================================
{
  const pop105 = population([
    { count: 20, attrs: { pay: 'card', promo: 'yes' } },
    { count: 60, attrs: { pay: 'card', promo: 'no' } },
    { count: 30, attrs: { pay: 'cash', promo: 'yes' } },
    { count: 90, attrs: { pay: 'cash', promo: 'no' } },
  ]);
  const pCard = P(pop105, (p) => p.pay === 'card');
  const pPromo = P(pop105, (p) => p.promo === 'yes');
  const pJoint = P(pop105, (p) => p.pay === 'card' && p.promo === 'yes');
  check('105 P(card)', pCard, 0.4);
  check('105 P(promo)', pPromo, 0.25);
  check('105 P(card ∧ promo)', pJoint, 0.1);
  check('105 independence test', pCard * pPromo, pJoint);
  // the same verdict from the conditional side — the two must agree
  check('105 P(promo | card) equals P(promo)', Pgiven(pop105, (p) => p.promo === 'yes', (p) => p.pay === 'card'), pPromo);
  check('105 distractor: 20/80', frac(20, 80), 0.25);
  check('105 distractor: added instead of multiplied', pCard + pPromo, 0.65);
}

// ===========================================================================
// 106 — 240 students, CS-track × competition. (a) P(not CS | competed)
//       (b) P(competed | CS)  (c) P(CS ∪ competed)
// ===========================================================================
{
  const pop106 = population([
    { count: 90, attrs: { cs: 'yes', comp: 'yes' } },
    { count: 60, attrs: { cs: 'yes', comp: 'no' } },
    { count: 30, attrs: { cs: 'no', comp: 'yes' } },
    { count: 60, attrs: { cs: 'no', comp: 'no' } },
  ]);
  const a = Pgiven(pop106, (p) => p.cs === 'no', (p) => p.comp === 'yes');
  const b = Pgiven(pop106, (p) => p.comp === 'yes', (p) => p.cs === 'yes');
  const c = P(pop106, (p) => p.cs === 'yes' || p.comp === 'yes');
  checkSet('106 answers', [a, b, c], [0.25, 0.6, 0.75]);
  // the two conditionals really do use different denominators
  check('106 (a) denominator', P(pop106, (p) => p.comp === 'yes') * 240, 120);
  check('106 (b) denominator', P(pop106, (p) => p.cs === 'yes') * 240, 150);
  // union by inclusion-exclusion must agree with the count
  check('106 union via inclusion-exclusion', frac(150, 240) + frac(120, 240) - frac(90, 240), c);
  check('106 union as three cells', frac(90 + 60 + 30, 240), c);
  // wrong answers
  check('106 wrong: 30/240', frac(30, 240), 0.125);
  check('106 wrong: 90/240', frac(90, 240), 0.375);
  check('106 wrong: 90/120', frac(90, 120), 0.75);
  check('106 wrong: 60/150', frac(60, 150), 0.4);
  check('106 wrong: margins added', frac(150, 240) + frac(120, 240), 1.125);
}

// ===========================================================================
// 107 — 45% passed A, 35% passed B, P(both)=x, P(neither)=y=2x.
//       Asked: x, y, P(at least one).
// ===========================================================================
{
  const pA = 0.45, pB = 0.35;
  // x + (pA-x) + (pB-x) + 2x = 1  →  pA + pB + x = 1
  const x = 1 - (pA + pB);
  const y = 2 * x;
  const atLeastOne = 1 - y;
  checkSet('107 answers', [x, y, atLeastOne], [0.2, 0.4, 0.6]);
  const pop107 = population([
    { count: Math.round(x * 100), attrs: { a: 'yes', b: 'yes' } },
    { count: Math.round((pA - x) * 100), attrs: { a: 'yes', b: 'no' } },
    { count: Math.round((pB - x) * 100), attrs: { a: 'no', b: 'yes' } },
    { count: Math.round(y * 100), attrs: { a: 'no', b: 'no' } },
  ]);
  check('107 population size', pop107.length, 100);
  check('107 margin A rebuilt', P(pop107, (p) => p.a === 'yes'), pA);
  check('107 margin B rebuilt', P(pop107, (p) => p.b === 'yes'), pB);
  check('107 at-least-one counted', P(pop107, (p) => p.a === 'yes' || p.b === 'yes'), 0.6);
  check('107 y really is twice x', y / x, 2);
  // wrong answers
  check('107 wrong: answered y itself', y, 0.4);
  check('107 wrong: margins added (double counts the joint cell)', pA + pB, 0.8);
}

// ===========================================================================
// 108 — two production lines, counts. Which line has the better good-rate?
// ===========================================================================
{
  const pop108 = population([
    { count: 150, attrs: { line: 'A', q: 'ok' } },
    { count: 50, attrs: { line: 'A', q: 'bad' } },
    { count: 40, attrs: { line: 'B', q: 'ok' } },
    { count: 10, attrs: { line: 'B', q: 'bad' } },
  ]);
  const rA = Pgiven(pop108, (p) => p.q === 'ok', (p) => p.line === 'A');
  const rB = Pgiven(pop108, (p) => p.q === 'ok', (p) => p.line === 'B');
  check('108 rate line A', rA, 0.75);
  check('108 rate line B', rB, 0.8);
  check('108 B is the better line', rB > rA ? 1 : 0, 1);
  // complement route must reverse the same way
  check('108 defect rate A', Pgiven(pop108, (p) => p.q === 'bad', (p) => p.line === 'A'), 0.25);
  check('108 defect rate B', Pgiven(pop108, (p) => p.q === 'bad', (p) => p.line === 'B'), 0.2);
  check('108 overall good rate sits between', P(pop108, (p) => p.q === 'ok'), 0.76);
  // and the lines are NOT independent of quality, as the last step claims
  check('108 dependence: rate A differs from overall', rA === P(pop108, (p) => p.q === 'ok') ? 0 : 1, 1);
  // distractors: both cells over the grand total
  check('108 distractor 150/250', frac(150, 250), 0.6);
  check('108 distractor 40/250', frac(40, 250), 0.16);
}

// ===========================================================================
// 109 — P(A)=0.6, P(A∩B)=x, P(Ā∩B)=0.1. Find x making A,B independent, and P(B).
// ===========================================================================
{
  const pA = 0.6, notAandB = 0.1;
  // x = pA * (x + notAandB)  →  x(1 - pA) = pA * notAandB
  const x = (pA * notAandB) / (1 - pA);
  const pB = x + notAandB;
  checkSet('109 answers', [x, pB], [0.15, 0.25]);
  const pop109 = population([
    { count: Math.round(x * 10000), attrs: { a: 'yes', b: 'yes' } },
    { count: Math.round((pA - x) * 10000), attrs: { a: 'yes', b: 'no' } },
    { count: Math.round(notAandB * 10000), attrs: { a: 'no', b: 'yes' } },
    { count: Math.round((1 - pA - notAandB) * 10000), attrs: { a: 'no', b: 'no' } },
  ]);
  check('109 population size', pop109.length, 10000);
  check('109 margin A rebuilt', P(pop109, (p) => p.a === 'yes'), 0.6);
  check('109 margin B rebuilt', P(pop109, (p) => p.b === 'yes'), 0.25);
  check('109 independence holds at this x', P(pop109, (p) => p.a === 'yes' && p.b === 'yes'), 0.6 * 0.25);
  check('109 P(B|A) equals P(B)', Pgiven(pop109, (p) => p.b === 'yes', (p) => p.a === 'yes'), 0.25);
  // wrong answers: multiplied by the cell instead of the margin
  check('109 wrong: x as P(A)·0.1', pA * notAandB, 0.06);
  check('109 wrong: resulting P(B)', pA * notAandB + notAandB, 0.16);
}

// ===========================================================================
// 110 — 60% adults; 70% of adults and 20% of the young voted party A.
//       (a) P(party A)  (b) P(young | party A)
// ===========================================================================
{
  const pAdult = 0.6, aGivenAdult = 0.7, aGivenYoung = 0.2;
  const pYoung = 1 - pAdult;
  const adultA = pAdult * aGivenAdult;   // 0.42
  const youngA = pYoung * aGivenYoung;   // 0.08
  const partyA = adultA + youngA;        // 0.5
  const youngGivenA = youngA / partyA;   // 0.16
  checkSet('110 answers', [partyA, youngGivenA], [0.5, 0.16]);
  const pop110 = population([
    { count: Math.round(adultA * 10000), attrs: { age: 'adult', vote: 'A' } },
    { count: Math.round((pAdult - adultA) * 10000), attrs: { age: 'adult', vote: 'B' } },
    { count: Math.round(youngA * 10000), attrs: { age: 'young', vote: 'A' } },
    { count: Math.round((pYoung - youngA) * 10000), attrs: { age: 'young', vote: 'B' } },
  ]);
  check('110 population size', pop110.length, 10000);
  check('110 the GIVEN conditionals are reproduced', Pgiven(pop110, (p) => p.vote === 'A', (p) => p.age === 'adult'), 0.7);
  check('110 young conditional reproduced', Pgiven(pop110, (p) => p.vote === 'A', (p) => p.age === 'young'), 0.2);
  check('110 (a) counted', P(pop110, (p) => p.vote === 'A'), 0.5);
  check('110 (b) counted — denominator is the party-A column', Pgiven(pop110, (p) => p.age === 'young', (p) => p.vote === 'A'), 0.16);
  check('110 table closes', P(pop110, () => true), 1);
  // wrong answers
  check('110 wrong: percentages added', aGivenAdult + aGivenYoung, 0.9);
  check('110 wrong: the cell instead of the ratio', youngA, 0.08);
  // the distractor is the GIVEN direction; it must not coincide with the answer
  check('110 wrong: given conditional differs from the reverse one', Math.abs(aGivenYoung - youngGivenA) > 1e-9 ? 1 : 0, 1);
  check('110 wrong: given conditional counted', Pgiven(pop110, (p) => p.vote === 'A', (p) => p.age === 'young'), 0.2);
}

// ===========================================================================
// 105 / 108 — the markdown tables added in round 2, rebuilt from the PROMPT.
// ===========================================================================
{
  // 105: the solution's probability table is the count table over 200
  const cells105 = { cardPromo: 20, cardNo: 60, cashPromo: 30, cashNo: 90 };
  checkSet('105 table cells over 200', Object.values(cells105).map((c) => c / 200), [0.1, 0.3, 0.15, 0.45]);
  checkSet('105 table margins', [(20 + 60) / 200, (30 + 90) / 200, (20 + 30) / 200, (60 + 90) / 200], [0.4, 0.6, 0.25, 0.75]);
  check('105 ringed cell is the joint cell', cells105.cardPromo / 200, 0.1);
  // 108: the ringed cell 40 is the numerator of the winning rate
  check('108 ringed cell / its row margin is the winner', frac(40, 40 + 10), 0.8);
  check('108 table columns close', 150 + 40 + 50 + 10, 250);
}

// ===========================================================================
// 201 — 30 pupils, 18 girls; 2/3 of girls and 1/4 of boys in robotics.
//       (a) how many in the club  (b) P(boy | not in club)
// ===========================================================================
{
  const girls = 18, boys = 30 - 18;
  const gIn = (2 / 3) * girls, bIn = (1 / 4) * boys;
  check('201 girls in club is an integer', gIn, 12);
  check('201 boys in club is an integer', bIn, 3);
  const pop201 = population([
    { count: gIn, attrs: { sex: 'g', club: 'yes' } },
    { count: girls - gIn, attrs: { sex: 'g', club: 'no' } },
    { count: bIn, attrs: { sex: 'b', club: 'yes' } },
    { count: boys - bIn, attrs: { sex: 'b', club: 'no' } },
  ]);
  check('201 population size', pop201.length, 30);
  const inClub = P(pop201, (p) => p.club === 'yes') * 30;
  const bGivenNot = Pgiven(pop201, (p) => p.sex === 'b', (p) => p.club === 'no');
  checkSet('201 answers', [inClub, bGivenNot], [15, 0.6]);
  check('201 (b) denominator is the not-in-club column', P(pop201, (p) => p.club === 'no') * 30, 15);
  // table cells as published: 12/6/18, 3/9/12, 15/15/30
  checkSet('201 table row girls', [gIn, girls - gIn, girls], [12, 6, 18]);
  checkSet('201 table row boys', [bIn, boys - bIn, boys], [3, 9, 12]);
  check('201 plausibility: boys over-represented among non-members', bGivenNot > frac(boys, 30) ? 1 : 0, 1);
  // wrong answers
  check('201 wrong: 9/30', frac(9, 30), 0.3);
  check('201 wrong: 6/15', frac(6, 15), 0.4);
  check('201 wrong: 9/12 reversed', frac(9, 12), 0.75);
}

// ===========================================================================
// 202 — 150 members, age × format, one cell missing. P(≤30 | digital) then
//       P(digital | ≤30).
// ===========================================================================
{
  const missing = 75 - 15;
  check('202 missing cell', missing, 60);
  check('202 missing cell closes the column', 30 + missing, 90);
  const pop202 = population([
    { count: 45, attrs: { age: 'young', fmt: 'digital' } },
    { count: 30, attrs: { age: 'young', fmt: 'print' } },
    { count: 15, attrs: { age: 'old', fmt: 'digital' } },
    { count: missing, attrs: { age: 'old', fmt: 'print' } },
  ]);
  check('202 population size', pop202.length, 150);
  const a = Pgiven(pop202, (p) => p.age === 'young', (p) => p.fmt === 'digital');
  const b = Pgiven(pop202, (p) => p.fmt === 'digital', (p) => p.age === 'young');
  checkSet('202 answers', [a, b], [0.75, 0.6]);
  check('202 the two directions differ', a === b ? 0 : 1, 1);
  check('202 complement route: P(old | digital)', Pgiven(pop202, (p) => p.age === 'old', (p) => p.fmt === 'digital'), 0.25);
  // distractors
  check('202 distractor 45/150', frac(45, 150), 0.3);
}

// ===========================================================================
// 203 — 150 families, dog 60, cat 45, P(cat | dog) = 0.4. (a) x  (b) P(neither)
// ===========================================================================
{
  const N = 150, dog = 60, cat = 45;
  const x = 0.4 * dog;
  check('203 x', x, 24);
  const neither = N - dog - cat + x;
  const pop203 = population([
    { count: x, attrs: { d: 'y', c: 'y' } },
    { count: dog - x, attrs: { d: 'y', c: 'n' } },
    { count: cat - x, attrs: { d: 'n', c: 'y' } },
    { count: neither, attrs: { d: 'n', c: 'n' } },
  ]);
  check('203 population size', pop203.length, N);
  check('203 GIVEN conditional reproduced', Pgiven(pop203, (p) => p.c === 'y', (p) => p.d === 'y'), 0.4);
  check('203 (b) counted', P(pop203, (p) => p.d === 'n' && p.c === 'n'), 0.46);
  check('203 (b) via complement of the union', 1 - P(pop203, (p) => p.d === 'y' || p.c === 'y'), 0.46);
  checkSet('203 table cells', [x, dog - x, cat - x, neither], [24, 36, 21, 69]);
  check('203 corner both ways', (N - cat) - (dog - x), neither);
  // wrong answers
  check('203 wrong: 0.4·45', 0.4 * cat, 18);
  check('203 wrong: neither with x=18', (N - dog - cat + 18) / N, 0.42);
  check('203 wrong: union instead of complement', frac(dog + cat - x, N), 0.54);
  check('203 wrong: joint subtracted twice', frac(N - dog - cat, N), 0.3);
}

// ===========================================================================
// 204 — 40% boys; 50% of boys, 25% of girls cycle. Independent?
// ===========================================================================
{
  const pBoy = 0.4, cGivenBoy = 0.5, cGivenGirl = 0.25;
  const boyC = pBoy * cGivenBoy, girlC = (1 - pBoy) * cGivenGirl;
  const pCycle = boyC + girlC;
  check('204 P(cycle)', pCycle, 0.35);
  check('204 joint cell', boyC, 0.2);
  check('204 product of margins', pBoy * pCycle, 0.14);
  check('204 dependent: product != cell', Math.abs(pBoy * pCycle - boyC) > 1e-9 ? 1 : 0, 1);
  checkSet('204 table', [boyC, pBoy - boyC, girlC, 1 - pBoy - girlC], [0.2, 0.2, 0.15, 0.45]);
  check('204 conditional route: P(cycle|boy) != P(cycle)', Math.abs(cGivenBoy - pCycle) > 1e-9 ? 1 : 0, 1);
  // distractors
  check('204 distractor: margin × conditional is just the cell', pBoy * cGivenBoy, boyC);
  check('204 distractor: added', pBoy + pCycle, 0.75);
}

// ===========================================================================
// 205 — three machines 0.5/0.3/0.2, defect rates 4%/5%/10%.
//       (a) P(defective)  (b) P(machine C | defective)
// ===========================================================================
{
  const m = [0.5, 0.3, 1 - 0.5 - 0.3], d = [0.04, 0.05, 0.1];
  const cells = m.map((w, i) => w * d[i]);
  const pD = cells.reduce((a, b) => a + b, 0);
  check('205 P(defective)', pD, 0.055);
  check('205 P(C | defective)', cells[2] / pD, 4 / 11);
  checkSet('205 defect cells', cells, [0.02, 0.015, 0.02]);
  checkSet('205 good cells', m.map((w, i) => w - cells[i]), [0.48, 0.285, 0.18]);
  check('205 good column', 1 - pD, 0.945);
  // counted from a population of 1000 products
  const pop205 = population([
    { count: 20, attrs: { m: 'A', q: 'bad' } }, { count: 480, attrs: { m: 'A', q: 'ok' } },
    { count: 15, attrs: { m: 'B', q: 'bad' } }, { count: 285, attrs: { m: 'B', q: 'ok' } },
    { count: 20, attrs: { m: 'C', q: 'bad' } }, { count: 180, attrs: { m: 'C', q: 'ok' } },
  ]);
  check('205 population size', pop205.length, 1000);
  check('205 GIVEN rate C reproduced', Pgiven(pop205, (p) => p.q === 'bad', (p) => p.m === 'C'), 0.1);
  check('205 (b) counted', Pgiven(pop205, (p) => p.m === 'C', (p) => p.q === 'bad'), 4 / 11);
  check('205 plausibility: C share among defectives ~ almost double', (cells[2] / pD) / m[2] > 1.5 ? 1 : 0, 1);
  // wrong answers
  check('205 wrong: rates added', d.reduce((a, b) => a + b, 0), 0.19);
  check('205 wrong: the cell', cells[2], 0.02);
}

// ===========================================================================
// 206 — adults x; 25% of adults, 75% of kids buy popcorn; 55% overall.
//       (a) x  (b) P(kid | no popcorn)
// ===========================================================================
{
  const pA = 0.25, pK = 0.75, total = 0.55;
  // pA·x + pK·(1-x) = total
  const x = (pK - total) / (pK - pA);
  check('206 x', x, 0.4);
  check('206 x differs from the bagrut part א', Math.abs(x - 0.6) > 1e-9 ? 1 : 0, 1);
  const cells = { aP: pA * x, aN: (1 - pA) * x, kP: pK * (1 - x), kN: (1 - pK) * (1 - x) };
  checkSet('206 table', Object.values(cells), [0.1, 0.3, 0.45, 0.15]);
  check('206 popcorn column reproduces the given total', cells.aP + cells.kP, total);
  const b = cells.kN / (cells.aN + cells.kN);
  check('206 (b)', b, 1 / 3);
  check('206 plausibility: kids under-represented among non-buyers', b < 1 - x ? 1 : 0, 1);
  // wrong answers
  check('206 wrong: the cell', cells.kN, 0.15);
  check('206 wrong: divided by the kids row', cells.kN / (1 - x), 0.25);
}

// ===========================================================================
// 207 — 100 members, symmetric 30/20/20/30. Both conditionals equal 0.6,
//       yet not independent.
// ===========================================================================
{
  const pop207 = population([
    { count: 30, attrs: { gym: 'y', pool: 'y' } },
    { count: 20, attrs: { gym: 'y', pool: 'n' } },
    { count: 20, attrs: { gym: 'n', pool: 'y' } },
    { count: 30, attrs: { gym: 'n', pool: 'n' } },
  ]);
  const gGivenP = Pgiven(pop207, (p) => p.gym === 'y', (p) => p.pool === 'y');
  const pGivenG = Pgiven(pop207, (p) => p.pool === 'y', (p) => p.gym === 'y');
  check('207 P(gym|pool)', gGivenP, 0.6);
  check('207 the student is right that they are equal', gGivenP, pGivenG);
  const pG = P(pop207, (p) => p.gym === 'y'), pP = P(pop207, (p) => p.pool === 'y');
  check('207 product of margins', pG * pP, 0.25);
  check('207 joint cell', P(pop207, (p) => p.gym === 'y' && p.pool === 'y'), 0.3);
  check('207 dependent', Math.abs(pG * pP - 0.3) > 1e-9 ? 1 : 0, 1);
  check('207 closing claim: P(gym | no pool)', Pgiven(pop207, (p) => p.gym === 'y', (p) => p.pool === 'n'), 0.4);
  // distractor: margin × conditional
  check('207 distractor 0.5·0.6', pG * gGivenP, 0.3);
}

// ===========================================================================
// 208 — 40 pupils; add x girls, all in drama, until sex ⟂ club. Then P(boy|club).
// ===========================================================================
{
  // (4+x)(40+x) = (16+x)^2  →  linear after the x² cancels
  const x = (256 - 160) / (44 - 32);
  check('208 x', x, 8);
  check('208 x is a non-negative integer', Number.isInteger(x) && x >= 0 ? 1 : 0, 1);
  const cells = { bIn: 12, bOut: 12, gIn: 4 + x, gOut: 12 };
  const N = 40 + x;
  check('208 every cell a non-negative integer', Object.values(cells).every((c) => Number.isInteger(c) && c >= 0) ? 1 : 0, 1);
  check('208 total', Object.values(cells).reduce((a, b) => a + b, 0), N);
  const pop208 = population([
    { count: cells.bIn, attrs: { s: 'b', c: 'y' } },
    { count: cells.bOut, attrs: { s: 'b', c: 'n' } },
    { count: cells.gIn, attrs: { s: 'g', c: 'y' } },
    { count: cells.gOut, attrs: { s: 'g', c: 'n' } },
  ]);
  check('208 population size', pop208.length, 48);
  const pGirl = P(pop208, (p) => p.s === 'g'), pClub = P(pop208, (p) => p.c === 'y');
  check('208 independence holds after joining', P(pop208, (p) => p.s === 'g' && p.c === 'y'), pGirl * pClub);
  check('208 club rate among girls now equals boys', Pgiven(pop208, (p) => p.c === 'y', (p) => p.s === 'g'), 0.5);
  check('208 (b) P(boy | club)', Pgiven(pop208, (p) => p.s === 'b', (p) => p.c === 'y'), 0.5);
  checkSet('208 new table margins', [pGirl * 48, pClub * 48], [24, 24]);
  // before joining: dependent
  check('208 before: club rate boys', frac(12, 24), 0.5);
  check('208 before: club rate girls', frac(4, 16), 0.25);
  // wrong answers
  check('208 wrong: totals left at 40 and 16', (16 * 16 - 160) / (40 - 16), 4);
  check('208 wrong: 12/48', frac(12, 48), 0.25);
  check('208 wrong: 12/16 old table', frac(12, 16), 0.75);
}

// ===========================================================================
// prob-bag-x-tab-01 — veterans x; 55% of veterans, 30% of newcomers vote A;
//       45% overall.
// ===========================================================================
{
  const aV = 0.55, aN = 0.30, total = 0.45;
  // א
  const x = (total - aN) / (aV - aN);
  check('bag א x', x, 0.6);
  const cells = { vA: aV * x, vB: (1 - aV) * x, nA: aN * (1 - x), nB: (1 - aN) * (1 - x) };
  checkSet('bag א table', Object.values(cells), [0.33, 0.27, 0.12, 0.28]);
  check('bag א column A reproduces the given total', cells.vA + cells.nA, total);
  check('bag א table closes', Object.values(cells).reduce((a, b) => a + b, 0), 1);
  // ב
  const pB = cells.vB + cells.nB;
  check('bag ב P(B) margin', pB, 0.55);
  check('bag ב P(new | B)', cells.nB / pB, 28 / 55);
  check('bag ב plausibility: newcomers over-represented among B voters', cells.nB / pB > 1 - x ? 1 : 0, 1);
  // ג — exactly one of two independent draws is "new ∧ A"
  const p = cells.nA;
  check('bag ג p', p, 0.12);
  check('bag ג exactly one', 2 * p * (1 - p), 0.2112);
  check('bag ג via binom', binom(2, 1, p), 0.2112);
  // two independent draws WITH replacement from 100 voters, counted
  const voters = population([{ count: 12, attrs: { na: 'y' } }, { count: 88, attrs: { na: 'n' } }]);
  check('bag ג enumerated over two draws', enumerate([voters, voters], ([a, b]) => (a.na === 'y') !== (b.na === 'y')), 0.2112);
  // ד — both same candidate, given; P(both A | same)
  const pA = cells.vA + cells.nA;
  const bothA = pA * pA, bothB = pB * pB;
  check('bag ד both A', bothA, 0.2025);
  check('bag ד both B', bothB, 0.3025);
  check('bag ד P(both A | same)', bothA / (bothA + bothB), 81 / 202);
  check('bag ד closing claim: below 0.45', bothA / (bothA + bothB) < pA ? 1 : 0, 1);
  // ה — 60% impossible: y = 1.2, and the feasible band is [min, max] of the two rates
  const y = (0.60 - aN) / (aV - aN);
  check('bag ה y', y, 1.2);
  check('bag ה y is not a probability', y > 1 ? 1 : 0, 1);
  const band = [Math.min(aV, aN), Math.max(aV, aN)];
  checkSet('bag ה feasibility band', band, [0.3, 0.55]);
  check('bag ה 0.60 is outside the band', 0.6 > band[1] ? 1 : 0, 1);
  check('bag ה all-veterans extreme gives only 0.55', aV * 1 + aN * 0, 0.55);
}

summary('pr-tables');
