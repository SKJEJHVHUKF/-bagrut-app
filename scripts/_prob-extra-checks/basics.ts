/**
 * Numeric re-derivation for pr-basics' EXTRA questions (pr-x-bas-101…113).
 *
 * Every `got` is computed from the question's own data — by brute-forcing the
 * sample space wherever the sample space is small enough, which is the check
 * that catches a wrong DENOMINATOR (the mistake a formula-vs-formula check
 * cannot see). `expected` is the value published in the question's answer.
 *
 *   npx tsx scripts/_prob-extra-checks/basics.ts
 */
import { check, enumerate, atLeastOne, summary } from './_lib';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const urn = (spec: [string, number][]) => spec.flatMap(([c, n]) => Array.from({ length: n }, () => c));

// 101 — 20 numbered cards, multiple of 5
check('101 P(multiple of 5)', enumerate([range(1, 20)], ([n]) => n % 5 === 0), 1 / 5);
// distractors, each re-enacted from the mistake its note names
check('101 distractor: counted only the card 5', enumerate([range(1, 20)], ([n]) => n === 5), 1 / 20);
check('101 distractor: read "5" as the count of wanted cards', 5 / 20, 1 / 4);
check(
  '101 distractor: forgot that 20 is a multiple of 5',
  enumerate([range(1, 20)], ([n]) => n % 5 === 0 && n !== 20),
  3 / 20,
);

// 102 — 20 balls, 6 yellow, "not yellow"
const bag102 = urn([['צהוב', 6], ['לבן', 14]]);
check('102 P(not yellow)', enumerate([bag102], ([b]) => b !== 'צהוב'), 0.7);
check('102 wrongAnswer: answered P(yellow)', enumerate([bag102], ([b]) => b === 'צהוב'), 0.3);
check('102 wrongAnswer: gave the COUNT, not the probability', bag102.filter((b) => b !== 'צהוב').length, 14);

// 103 — die shows 6 AND ball is red (4 red / 6 blue)
const bag103 = urn([['אדום', 4], ['כחול', 6]]);
check('103 P(six and red)', enumerate<string | number>([range(1, 6), bag103], ([d, b]) => d === 6 && b === 'אדום'), 1 / 15);
check('103 distractor: added', 1 / 6 + 4 / 10, 17 / 30);
check('103 distractor: red as 4/6', (1 / 6) * (4 / 6), 1 / 9);
check('103 distractor: red alone, die ignored', enumerate([bag103], ([b]) => b === 'אדום'), 2 / 5);
check('103 "and" must shrink', enumerate<string | number>([range(1, 6), bag103], ([d, b]) => d === 6 && b === 'אדום') < 4 / 10 ? 1 : 0, 1);

// 104 — 12 chocolates: 5 milk, 4 bitter, 3 white — bitter OR white
const box104 = urn([['חלב', 5], ['מריר', 4], ['לבן', 3]]);
check('104 P(bitter or white)', enumerate([box104], ([c]) => c === 'מריר' || c === 'לבן'), 7 / 12);
check('104 distractor: multiplied', (4 / 12) * (3 / 12), 1 / 12);
check('104 wrongAnswer: bitter only', enumerate([box104], ([c]) => c === 'מריר'), 1 / 3);
check('104 wrongAnswer: answered milk instead', enumerate([box104], ([c]) => c === 'חלב'), 5 / 12);

// 105 — two dice, sum 5 or 10
const die = range(1, 6);
check('105 P(sum 5 or 10)', enumerate([die, die], ([a, b]) => a + b === 5 || a + b === 10), 7 / 36);
check('105 count sum=5', enumerate([die, die], ([a, b]) => a + b === 5) * 36, 4);
check('105 count sum=10', enumerate([die, die], ([a, b]) => a + b === 10) * 36, 3);
// distractor 2/11: the 11 possible SUMS treated as equally likely (they are not)
check('105 distractor: sums treated as equally likely', 2 / range(2, 12).length, 2 / 11);
const fav105 = Math.round(enumerate([die, die], ([a, b]) => a + b === 5 || a + b === 10) * 36);
check('105 favourable ordered pairs', fav105, 7);
check('105 distractor: denominator taken as 6+6', fav105 / (die.length + die.length), 7 / 12);
check('105 sum=5 alone', enumerate([die, die], ([a, b]) => a + b === 5), 1 / 9);

// 106 — 8 red, P(red) = 0.4 → how many blue, and P(not red)
const n106 = 8 / 0.4;
check('106 total balls', n106, 20);
check('106 blue balls', n106 - 8, 12);
check('106 P(not red)', enumerate([urn([['אדום', 8], ['כחול', 12]])], ([b]) => b !== 'אדום'), 0.6);

// 107 — after adding 5 red: 9 red / 6 blue, two draws WITH replacement, at least one red
const bag107 = urn([['אדום', 4 + 5], ['כחול', 6]]);
check('107 P(red) after adding', enumerate([bag107], ([b]) => b === 'אדום'), 0.6);
check(
  '107 P(at least one red)',
  enumerate([bag107, bag107], (s) => s.some((b) => b === 'אדום')),
  0.84,
);
check('107 distractor: old bag', atLeastOne(0.4, 2), 0.64);
check('107 distractor: both red', enumerate([bag107, bag107], (s) => s.every((b) => b === 'אדום')), 0.36);
const pRed107 = enumerate([bag107], ([b]) => b === 'אדום');
check('107 distractor: added the two draws', pRed107 + pRed107, 1.2);

// 108 — 4 red / 6 blue, two draws WITH replacement, same colour, vs 0.5
const bag108 = urn([['אדום', 4], ['כחול', 6]]);
const same108 = enumerate([bag108, bag108], ([x, y]) => x === y);
check('108 P(same colour)', same108, 0.52);
check('108 beats 0.5', same108 > 0.5 ? 1 : 0, 1);

// 109 — two free throws, P(at least one) = 0.96 → p
// (the given was 0.84 until this round: that is exactly 107's answer with 107's
//  own p = 0.6, so the hard question was the mid question read backwards with
//  the SAME two numbers. Guarded below.)
const p109 = 1 - Math.sqrt(1 - 0.96);
check('109 p', p109, 0.8);
check('109 round trip', atLeastOne(p109, 2), 0.96);
check('109 wrongAnswer: stopped at 1-p', 1 - p109, 0.2);
check('109 wrongAnswer: stopped at (1-p)^2', (1 - p109) ** 2, 0.04);
check('109 wrongAnswer: halved the given', 0.96 / 2, 0.48);
// the anti-clone guard: 109's answer must not be 107's answer, and its given
// must not be 107's answer either.
check('109 is not a restatement of 107', p109 === pRed107 || 0.96 === atLeastOne(pRed107, 2) ? 1 : 0, 0);

// 110 — wheel of 10 sectors: A = even, B = greater than 6
const wheel = range(1, 10);
const isA = (n: number) => n % 2 === 0;
const isB = (n: number) => n > 6;
check('110 P(A)', enumerate([wheel], ([n]) => isA(n)), 0.5);
check('110 P(B)', enumerate([wheel], ([n]) => isB(n)), 0.4);
check('110 P(A union B)', enumerate([wheel], ([n]) => isA(n) || isB(n)), 0.7);
check('110 P(neither)', enumerate([wheel], ([n]) => !isA(n) && !isB(n)), 0.3);
check('110 overlap is {8, 10}', wheel.filter((n) => isA(n) && isB(n)).length, 2);
// the student's sum, and the gap it opens: exactly the size of the overlap
check(
  '110 the student\'s sum double-counts the overlap',
  enumerate([wheel], ([n]) => isA(n)) + enumerate([wheel], ([n]) => isB(n)),
  0.9,
);
check(
  '110 gap = overlap',
  0.9 - enumerate([wheel], ([n]) => isA(n) || isB(n)),
  wheel.filter((n) => isA(n) && isB(n)).length / wheel.length,
);
// distractor 0.8: B misread as {7,8,9}
check('110 distractor: B misread as excluding 10', 0.5 + enumerate([wheel], ([n]) => n > 6 && n < 10), 0.8);
check('110 distractor: multiplied instead of adding', 0.5 * 0.4, 0.2);

// 111 — smallest n with P(at least one 6) > 0.5
const n111 = range(1, 20).find((n) => atLeastOne(1 / 6, n) > 0.5) ?? 0;
check('111 smallest n', n111, 4);
check('111 n=3 falls short', atLeastOne(1 / 6, 3) > 0.5 ? 1 : 0, 0);
check('111 n=2 exact', atLeastOne(1 / 6, 2), 11 / 36);
check('111 n=6 clears the bar but is not the smallest', atLeastOne(1 / 6, 6) > 0.5 && 6 > n111 ? 1 : 0, 1);
check('111 n=6 value quoted in its note', atLeastOne(1 / 6, 6), 0.6651020233196159);

// 112 — game A: 3 die throws, at least one result > 4 | game B: 2 draws (2 red / 3 blue), at least one red
// (game A was "4 throws, at least one 6" until this round — 671/1296 ≈ 0.518 with
//  n = 4 is spelled out inside 111's own solution AND its distractor notes, so
//  half of this question was recall. Guarded below.)
const gameA = enumerate([die, die, die], (s) => s.some((d) => d > 4));
const bag112 = urn([['אדום', 2], ['כחול', 3]]);
const gameB = enumerate([bag112, bag112], (s) => s.some((b) => b === 'אדום'));
check('112 P(win, dice game)', gameA, 19 / 27);
check('112 P(win, urn game)', gameB, 0.64);
check('112 dice game is better', gameA > gameB ? 1 : 0, 1);
// the point of the question: the better game has the SMALLER per-trial chance
check('112 per-trial chance is smaller in the better game', enumerate([die], ([d]) => d > 4) < 0.4 ? 1 : 0, 1);
check('112 wrongAnswer: the two complements', 1 - gameA, 8 / 27);
check('112 wrongAnswer: complement of the urn game', 1 - gameB, 0.36);
check('112 wrongAnswer: added the trials (dice)', 3 * enumerate([die], ([d]) => d > 4), 1);
check('112 wrongAnswer: added the trials (urn)', 2 * enumerate([bag112], ([b]) => b === 'אדום'), 0.8);
// anti-clone guard against 111, whose solution prints n = 4 and 1 - (5/6)^4
check('112 does not reuse 111\'s number', Math.abs(gameA - atLeastOne(1 / 6, n111)) > 0.01 ? 1 : 0, 1);

// 113 — P(red) = 2·P(blue), P(yellow) = 0.25 → P(red); then at most one red in two draws
const t113 = (1 - 0.25) / 3;
check('113 P(blue)', t113, 0.25);
check('113 P(red)', 2 * t113, 0.5);
// the composition that satisfies the two conditions, as a concrete urn
const bag113 = urn([['אדום', 2], ['כחול', 1], ['צהוב', 1]]);
check('113 urn matches P(red)', enumerate([bag113], ([b]) => b === 'אדום'), 0.5);
check('113 urn matches P(yellow)', enumerate([bag113], ([b]) => b === 'צהוב'), 0.25);
check(
  '113 P(at most one red)',
  enumerate([bag113, bag113], (s) => s.filter((b) => b === 'אדום').length <= 1),
  0.75,
);
// the long route the last solution step claims: none + exactly one
check(
  '113 long route agrees',
  enumerate([bag113, bag113], (s) => s.every((b) => b !== 'אדום')) +
    enumerate([bag113, bag113], (s) => s.filter((b) => b === 'אדום').length === 1),
  0.75,
);
// wrongAnswer, RE-ENACTED: swapping red and blue gives P(red) = 0.25, and then the
// SECOND part follows from that 0.25 — it is 0.9375, not the correct 0.75. The
// entry said "0.25, 0.75" until this round, i.e. a note describing a mistake that
// does not produce the value it is attached to.
const swapped113 = urn([['אדום', 1], ['כחול', 2], ['צהוב', 1]]);
check('113 wrongAnswer: swap gives P(red) = 0.25', enumerate([swapped113], ([b]) => b === 'אדום'), 0.25);
check(
  '113 wrongAnswer: the swap carries into part two',
  enumerate([swapped113, swapped113], (s) => s.filter((b) => b === 'אדום').length <= 1),
  0.9375,
);
check('113 wrongAnswer: forgot the complement in part two', 0.5 * 0.5, 0.25);

// ===========================================================================
// Round 2 — pr-x-bas-201…208 and the bagrut question prob-bag-x-bas-01
// ===========================================================================

// 201 — two bolts both fine with probability 0.81 → p(defective)
const p201 = 1 - Math.sqrt(0.81);
check('201 p', p201, 0.1);
check('201 round trip', (1 - p201) ** 2, 0.81);
check('201 wrongAnswer: stopped at 1-p', 1 - p201, 0.9);
check('201 wrongAnswer: complemented the given', 1 - 0.81, 0.19);
// the complement of "both fine" is "at least one defective", NOT p
check('201 note: 1-0.81 is P(at least one defective)', atLeastOne(p201, 2), 0.19);

// 202 — 30 pupils: 18 French, 10 Arabic, 6 both → at least one language
const cls202 = urn([['both', 6], ['fr', 12], ['ar', 4], ['none', 8]]);
check('202 class size', cls202.length, 30);
check('202 French count', cls202.filter((s) => s === 'fr' || s === 'both').length, 18);
check('202 Arabic count', cls202.filter((s) => s === 'ar' || s === 'both').length, 10);
const atLeast202 = enumerate([cls202], ([s]) => s !== 'none');
check('202 P(at least one language)', atLeast202, 11 / 15);
check('202 beats 0.7', atLeast202 > 0.7 ? 1 : 0, 1);
check('202 wrongAnswer: added without removing overlap', (18 + 10) / 30, 14 / 15);
check('202 wrongAnswer: the complement', enumerate([cls202], ([s]) => s === 'none'), 4 / 15);
check('202 wrongAnswer: both languages only', enumerate([cls202], ([s]) => s === 'both'), 1 / 5);
check('202 solution: 1 - 8/30', 1 - 8 / 30, 22 / 30);

// 203 — 24 balls, P(white) = 3/8, P(green) = 1/6 → black count, P(white or black)
const white203 = (3 / 8) * 24;
const green203 = (1 / 6) * 24;
check('203 white balls', white203, 9);
check('203 green balls', green203, 4);
check('203 black balls', 24 - white203 - green203, 11);
const bag203 = urn([['לבן', 9], ['שחור', 11], ['ירוק', 4]]);
check('203 P(white or black)', enumerate([bag203], ([b]) => b !== 'ירוק'), 5 / 6);
check('203 solution: complement of green', 1 - 1 / 6, 5 / 6);
check('203 wrongAnswer: all non-white', 24 - white203, 15);
check('203 wrongAnswer: black only', enumerate([bag203], ([b]) => b === 'שחור'), 11 / 24);

// 204 — Dana 0.6, Yossi 0.5 → exactly one = 0.5 (given); Yossi improves to 0.8
const exactlyOne = (a: number, b: number) => a * (1 - b) + (1 - a) * b;
check('204 the given before-training value', exactlyOne(0.6, 0.5), 0.5);
const after204 = exactlyOne(0.6, 0.8);
check('204 P(exactly one) after training', after204, 0.44);
check('204 distractor: old value', exactlyOne(0.6, 0.5), 0.5);
check('204 distractor: both hit', 0.6 * 0.8, 0.48);
check('204 distractor: at least one', atLeastOne(1, 1) - 0.4 * 0.2, 0.92);
check('204 all options distinct', new Set([after204, 0.5, 0.48, 0.92]).size, 4);
// the closing step's claim: after training "both hit" is the most common outcome
check('204 both-hit now beats exactly-one', 0.6 * 0.8 > after204 ? 1 : 0, 1);
// anti-clone guard against the bagrut part ב (0.7 / 0.6, exactly one = 0.46)
check('204 is not the bagrut tree in disguise', after204 === exactlyOne(0.7, 0.6) ? 1 : 0, 0);

// 205 — p and 2p, both correct = 0.18 → p; exactly one
const p205 = Math.sqrt(0.18 / 2);
check('205 p', p205, 0.3);
check('205 second question', 2 * p205, 0.6);
check('205 round trip', p205 * 2 * p205, 0.18);
check('205 P(exactly one)', exactlyOne(p205, 2 * p205), 0.54);
check('205 partition sums to 1', 0.18 + 0.54 + 0.7 * 0.4, 1);
check('205 wrongAnswer: gave 2p', 2 * p205, 0.6);
check('205 wrongAnswer: at least one', atLeastOne(1, 1) - 0.7 * 0.4, 0.72);
check('205 note: 0.72 - 0.18 = 0.54', 0.72 - 0.18, 0.54);

// 206 — three brothers each arrives 0.8 → at least one absent
const arr = [0.2, 0.8] as const; // [absent, present] weights; enumerate over labels
const bro = ['absent', 'absent', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present'];
const atLeastAbsent206 = enumerate([bro, bro, bro], (s) => s.some((b) => b === 'absent'));
check('206 P(at least one absent)', atLeastAbsent206, 0.488);
check('206 formula agrees', 1 - arr[1] ** 3, 0.488);
check('206 exactly one absent', enumerate([bro, bro, bro], (s) => s.filter((b) => b === 'absent').length === 1), 0.384);
check('206 exactly two absent', enumerate([bro, bro, bro], (s) => s.filter((b) => b === 'absent').length === 2), 0.096);
check('206 all absent', enumerate([bro, bro, bro], (s) => s.every((b) => b === 'absent')), 0.008);
check('206 long route sums', 0.384 + 0.096 + 0.008, 0.488);
check('206 distractor: the student\'s sum', 3 * 0.2, 0.6);
check('206 distractor: multiplied', 0.2 ** 3, 0.008);
check('206 distractor: 1 - 0.6', 1 - 0.6, 0.4);
check('206 note: four brothers', 4 * 0.2, 0.8);
check('206 note: five brothers', 5 * 0.2, 1);
check('206 note: all arrive', 0.8 ** 3, 0.512);

// 207 — two dice: sum even vs product even
const sumEven = enumerate([die, die], ([a, b]) => (a + b) % 2 === 0);
const prodEven = enumerate([die, die], ([a, b]) => (a * b) % 2 === 0);
check('207 P(sum even)', sumEven, 1 / 2);
check('207 P(product even)', prodEven, 3 / 4);
check('207 product wins', prodEven > sumEven ? 1 : 0, 1);
check('207 count sum even', sumEven * 36, 18);
check('207 count product even', prodEven * 36, 27);
check('207 wrongAnswer: both odd', enumerate([die, die], ([a, b]) => a % 2 === 1 && b % 2 === 1), 1 / 4);

// 208 — 0.8, 0.6, x; all three = 0.24 → x; at least 4 points with weights 1,2,3
const x208 = 0.24 / (0.8 * 0.6);
check('208 x', x208, 0.5);
const q208 = [0.8, 0.6, x208];
const pts = [1, 2, 3];
const tf = [true, false];
let atLeast4 = 0;
let exactlyTwoTo4 = 0;
for (const a of tf) for (const b of tf) for (const c of tf) {
  const ok = [a, b, c];
  const pr = ok.reduce((acc, v, i) => acc * (v ? q208[i] : 1 - q208[i]), 1);
  const score = ok.reduce((acc, v, i) => acc + (v ? pts[i] : 0), 0);
  if (score >= 4) atLeast4 += pr;
  if (score >= 4 && ok.filter(Boolean).length === 2) exactlyTwoTo4 += pr;
}
check('208 P(at least 4 points)', atLeast4, 0.46);
check('208 only {1,3}', 0.8 * 0.4 * x208, 0.16);
check('208 only {2,3}', 0.2 * 0.6 * x208, 0.06);
check('208 {1,2} scores 3, excluded', pts[0] + pts[1] < 4 ? 1 : 0, 1);
check('208 wrongAnswer: forgot all three', exactlyTwoTo4, 0.22);
check('208 wrongAnswer: complement', 1 - atLeast4, 0.54);

// bagrut prob-bag-x-bas-01 — x·0.6 = 0.42; exactly one; at least one; same count; smallest n
const xB = 0.42 / 0.6;
check('bag א x', xB, 0.7);
check('bag א round trip', xB * 0.6, 0.42);
// tree leaves, re-derived from the question
const leaves = { cc: xB * 0.6, cw: xB * 0.4, wc: 0.3 * 0.6, ww: 0.3 * 0.4 };
check('bag ב leaf נכון/נכון', leaves.cc, 0.42);
check('bag ב leaf נכון/טעות (pick)', leaves.cw, 0.28);
check('bag ב leaf טעות/נכון (pick)', leaves.wc, 0.18);
check('bag ב leaf טעות/טעות', leaves.ww, 0.12);
check('bag ב leaves sum to 1', leaves.cc + leaves.cw + leaves.wc + leaves.ww, 1);
check('bag ב P(exactly one)', leaves.cw + leaves.wc, 0.46);
check('bag ג P(at least one)', 1 - leaves.ww, 0.88);
check('bag ג agrees with ב', leaves.cc + leaves.cw + leaves.wc, 0.88);
check('bag ד P(same count)', leaves.ww ** 2 + 0.46 ** 2 + leaves.cc ** 2, 0.4024);
check('bag ד partition', leaves.ww + 0.46 + leaves.cc, 1);
const noPrize = 1 - leaves.cc;
check('bag ה P(no prize)', noPrize, 0.58);
const nB = range(1, 20).find((n) => atLeastOne(leaves.cc, n) > 0.9) ?? 0;
check('bag ה smallest n', nB, 5);
check('bag ה n=4 falls short', noPrize ** 4 < 0.1 ? 1 : 0, 0);
check('bag ה 0.58^4 ≈ 0.113', Math.round(noPrize ** 4 * 1000) / 1000, 0.113);
check('bag ה 0.58^5 ≈ 0.066', Math.round(noPrize ** 5 * 1000) / 1000, 0.066);
check('bag ה 1 - 0.066 ≈ 0.934', Math.round((1 - noPrize ** 5) * 1000) / 1000, 0.934);

summary('pr-basics numbers');
