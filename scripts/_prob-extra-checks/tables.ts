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
import { check, checkSet, enumerate, frac, summary } from './_lib';

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

summary('pr-tables');
