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

summary('pr-basics numbers');
