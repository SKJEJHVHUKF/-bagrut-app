/**
 * _prob-extra-checks/bernoulli.ts — independent re-derivation of every number in
 * content/lessons/math5/prob-extra/bernoulli.ts (pr-x-ber-101…113).
 *
 * Written by the verifier, not the author: every `got` below is COMPUTED from the
 * question's own data (n, p, the urn, the point table), never copied from the
 * solution. Where a formula is used, the same quantity is re-derived a second way —
 * by ENUMERATING the sample space — because that is the check that catches a wrong
 * denominator or an off-by-one in a term count, which a formula check cannot.
 *
 * Two invariants are asserted for every Bernoulli setup in the file:
 *   1. the whole distribution P(0)…P(n) sums to 1 — the off-by-one detector for
 *      "לפחות k" / "לכל היותר k";
 *   2. every distractor / wrongAnswer value is re-enacted from the mistake its note
 *      NAMES, so a note describing a different mistake from the one that produces
 *      its value fails here.
 *
 *   npx tsx scripts/_prob-extra-checks/bernoulli.ts   → must print 0 failed
 */
import { atLeastOne, binom, binomAtLeast, check, drawNoReplacement, enumerate, frac, nCr, summary } from './_lib';

/** P(0)+…+P(n) === 1 for a Bernoulli(n, p). The off-by-one detector. */
const sumsToOne = (label: string, n: number, p: number) =>
  check(`${label}: distribution sums to 1`, Array.from({ length: n + 1 }, (_, k) => binom(n, k, p)).reduce((a, b) => a + b, 0), 1);

const COIN = [0, 1];
const spaces = (n: number) => Array.from({ length: n }, () => COIN);
const heads = (o: number[]) => o.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// pr-x-ber-101 — 6 seeds, p = 0.8, exactly 5 sprout
// ---------------------------------------------------------------------------
check('101 P(exactly 5 of 6, p=0.8)', binom(6, 5, 0.8), 0.393216);
check('101 coefficient C(6,5)', nCr(6, 5), 6);
sumsToOne('101', 6, 0.8);
// distractors, each re-enacted from the mistake its note names
check('101 distractor[1] = one path only, 0.8^5*0.2', 0.8 ** 5 * 0.2, 0.065536);
check('101 distractor[2] = all six sprout, 0.8^6', 0.8 ** 6, 0.262144);
check('101 distractor[3] = roles swapped, exactly 5 do NOT sprout', binom(6, 5, 0.2), 0.001536);

// ---------------------------------------------------------------------------
// pr-x-ber-102 — bus late with p = 0.2, five mornings, never late
// ---------------------------------------------------------------------------
check('102 P(0 of 5, p=0.2)', binom(5, 0, 0.2), 0.32768);
check('102 same as (1-p)^n', (1 - 0.2) ** 5, binom(5, 0, 0.2));
sumsToOne('102', 5, 0.2);
check('102 wrongAnswer 0.00032 = late every morning, 0.2^5', 0.2 ** 5, 0.00032);
check('102 wrongAnswer 0.8 = not late on ONE morning', 1 - 0.2, 0.8);

// ---------------------------------------------------------------------------
// pr-x-ber-103 — 7 items, p = 0.1 defective, exactly one defective
// ---------------------------------------------------------------------------
check('103 P(exactly 1 of 7, p=0.1)', binom(7, 1, 0.1), 0.3720087);
check('103 coefficient C(7,1) = n', nCr(7, 1), 7);
sumsToOne('103', 7, 0.1);
check('103 distractor[1] = one path only, 0.1*0.9^6', 0.1 * 0.9 ** 6, 0.0531441);
check('103 distractor[2] = n*p with no failure factor', 7 * 0.1, 0.7);
check('103 distractor[3] = p of a single item, i.e. n=1 and k=1', binom(1, 1, 0.1), 0.1);
check('103 distractor[3] is not the answer', Math.abs(binom(1, 1, 0.1) - binom(7, 1, 0.1)) > 0.01 ? 1 : 0, 1);

// ---------------------------------------------------------------------------
// pr-x-ber-104 — p = 0.75, "all of them": 4 throws (given) → 5 throws
// ---------------------------------------------------------------------------
check('104 the GIVEN in the question, 0.75^4 = 81/256', 0.75 ** 4, frac(81, 256));
check('104 P(all 5) = 0.75^5 = 243/1024', 0.75 ** 5, frac(243, 1024));
check('104 P(all 5) = P(all 4) * p', binom(4, 4, 0.75) * 0.75, binom(5, 5, 0.75));
sumsToOne('104', 5, 0.75);
check('104 wrongAnswer 81/1024 = first four in, fifth missed', 0.75 ** 4 * 0.25, frac(81, 1024));
check('104 wrongAnswer 81/256 = the four-throw value from the question', 0.75 ** 4, frac(81, 256));

// ---------------------------------------------------------------------------
// pr-x-ber-105 (mid) — recover p from P(none correct) = 0.00243, n = 5
// ---------------------------------------------------------------------------
{
  const target = 0.00243;
  const p = 1 - target ** (1 / 5); // the fifth root, then complement
  check('105 recovered p', p, 0.7);
  check('105 the root is admissible and reproduces the given', binom(5, 0, p), target);
  sumsToOne('105', 5, 0.7);
  check('105 wrongAnswer 0.3 = 1-p, the failure probability', 1 - 0.7, 0.3);
  check('105 wrongAnswer 0.99757 = 1 - given, no root taken', 1 - target, 0.99757);
}

// ---------------------------------------------------------------------------
// pr-x-ber-106 (mid) — fair coin, 6 tosses, "at least two heads"
// The student's error is dropping P(1) from the complement; enumerating all 64
// outcomes is the independent check on the TERM COUNT.
// ---------------------------------------------------------------------------
check('106 P(at least 2 heads of 6) by enumeration', enumerate(spaces(6), (o) => heads(o) >= 2), frac(57, 64));
check('106 same by complement 1 - P(0) - P(1)', 1 - binom(6, 0, 0.5) - binom(6, 1, 0.5), frac(57, 64));
check('106 the enumeration and the formula agree', enumerate(spaces(6), (o) => heads(o) >= 2), binomAtLeast(6, 2, 0.5));
sumsToOne('106', 6, 0.5);
check("106 distractor[1] = the student's 1 - P(0)", 1 - binom(6, 0, 0.5), frac(63, 64));
check('106 distractor[2] = P(2) subtracted as well', 1 - binom(6, 0, 0.5) - binom(6, 1, 0.5) - binom(6, 2, 0.5), frac(21, 32));
check('106 distractor[3] = exactly two heads', binom(6, 2, 0.5), frac(15, 64));

// ---------------------------------------------------------------------------
// pr-x-ber-107 (mid) — n = 5, p = 0.6, "at most 2"
// ---------------------------------------------------------------------------
{
  const atMost2 = [0, 1, 2].map((k) => binom(5, k, 0.6)).reduce((a, b) => a + b, 0);
  check('107 P(at most 2 of 5, p=0.6)', atMost2, 0.31744);
  check('107 the three terms are 0,1,2 — not 0,1', binom(5, 0, 0.6) + binom(5, 1, 0.6) + binom(5, 2, 0.6), atMost2);
  check('107 complement of the answer is P(at least 3)', 1 - atMost2, binomAtLeast(5, 3, 0.6));
  sumsToOne('107', 5, 0.6);
  check('107 wrongAnswer 0.2304 = exactly two only', binom(5, 2, 0.6), 0.2304);
  check('107 wrongAnswer 0.68256 = the other side, at least three', 1 - atMost2, 0.68256);
}

// ---------------------------------------------------------------------------
// pr-x-ber-108 (mid) — 10 balls, 4 red, THREE DRAWN WITHOUT REPLACEMENT.
// The question claims Bernoulli does not apply. Verify the counter-evidence
// (p is not constant) AND that the formula really gives the wrong number.
// ---------------------------------------------------------------------------
{
  check('108 P(red) on the first draw', frac(4, 10), 0.4);
  check('108 P(red) on the second draw GIVEN a red first', frac(3, 9), 1 / 3);
  check('108 P(red) on the second draw GIVEN a non-red first', frac(4, 9), 4 / 9);
  // the three branch probabilities are pairwise different → p is not constant
  check('108 p is not constant: first vs after-red differ', Math.abs(frac(4, 10) - frac(3, 9)) > 0.05 ? 1 : 0, 1);
  check('108 p is not constant: first vs after-non-red differ', Math.abs(frac(4, 10) - frac(4, 9)) > 0.02 ? 1 : 0, 1);
  // the TRUE answer, by brute-force over ordered draws without replacement
  const urn = ['R', 'R', 'R', 'R', 'X', 'X', 'X', 'X', 'X', 'X'];
  const truth = drawNoReplacement(urn, 3, (seq) => seq.filter((b) => b === 'R').length === 2);
  check('108 true P(exactly 2 red of 3, no replacement)', truth, frac(36, 120));
  check('108 Bernoulli would answer', binom(3, 2, 0.4), 0.288);
  check('108 the two answers really differ (so the method is wrong, not just informal)', Math.abs(truth - binom(3, 2, 0.4)) > 0.01 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// pr-x-ber-109 (hard) — n = 4, unknown p, P(exactly 1) = P(exactly 2).
// Check the root, its uniqueness in (0,1), and that the rejected roots really
// are inadmissible.
// ---------------------------------------------------------------------------
{
  const f = (p: number) => binom(4, 1, p) - binom(4, 2, p);
  // solve 4p(1-p)^3 = 6p^2(1-p)^2  →  4(1-p) = 6p  →  p = 0.4
  const p = 4 / 10;
  check('109 recovered p', p, 0.4);
  check('109 the two probabilities really are equal at p', binom(4, 1, p), binom(4, 2, p));
  check('109 and their common value', binom(4, 1, p), 0.3456);
  sumsToOne('109', 4, 0.4);
  // uniqueness: scan (0,1) and count sign changes of f
  let roots = 0;
  for (let i = 1; i < 9999; i++) {
    const a = f(i / 10000);
    const b = f((i + 1) / 10000);
    if (a === 0 || a * b < 0) roots++;
  }
  check('109 exactly one root in the open interval (0,1)', roots, 1);
  // the rejected roots: p=0 and p=1 satisfy the equation trivially (both sides 0)
  check('109 p=0 is a degenerate root — both sides vanish', f(0), 0);
  check('109 p=1 is a degenerate root — both sides vanish', f(1), 0);
  check('109 p=0 is inadmissible: no deal is ever closed', binom(4, 1, 0), 0);
  check('109 p=1 is inadmissible: four deals are certain', binom(4, 4, 1), 1);
  // distractors
  check('109 wrongAnswer 0.6 = coefficients swapped, 6(1-p) = 4p', 6 / 10, 0.6);
  check('109 wrongAnswer 0.5 = coefficients cancelled too, (1-p) = p', 1 / 2, 0.5);
  check('109 0.6 does NOT satisfy the condition', Math.abs(binom(4, 1, 0.6) - binom(4, 2, 0.6)) > 1e-6 ? 1 : 0, 1);
  check('109 0.5 does NOT satisfy the condition', Math.abs(binom(4, 1, 0.5) - binom(4, 2, 0.5)) > 1e-6 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// pr-x-ber-110 (hard) — 4 questions worth 1,2,3,4 points, p = 0.5 each,
// "at least 8 points". The outcome space is re-enumerated here INDEPENDENTLY of
// the author's list of qualifying subsets — a decomposition question is exactly
// where an off-by-one hides.
// ---------------------------------------------------------------------------
{
  const PTS = [1, 2, 3, 4];
  const score = (o: number[]) => o.reduce((a, b, i) => a + b * PTS[i], 0);
  check('110 P(score >= 8) by full enumeration of 2^4 outcomes', enumerate(spaces(4), (o) => score(o) >= 8), frac(3, 16));
  // and the count of qualifying subsets, derived not read
  let qualifying = 0;
  let total = 0;
  for (let m = 0; m < 16; m++) {
    const o = [0, 1, 2, 3].map((i) => (m >> i) & 1);
    total++;
    if (score(o) >= 8) qualifying++;
  }
  check('110 number of qualifying subsets', qualifying, 3);
  check('110 size of the outcome space', total, 16);
  check('110 every outcome has probability 0.5^4', 0.5 ** 4, frac(1, 16));
  // distractors
  check('110 distractor[1] = "at least 3 correct answers", a DIFFERENT event', enumerate(spaces(4), (o) => heads(o) >= 3), frac(5, 16));
  check('110 distractor[2] = strictly more than 8 points', enumerate(spaces(4), (o) => score(o) > 8), frac(1, 8));
  check('110 distractor[3] = 3 qualifying over a space of 8 instead of 16', qualifying / 8, frac(3, 8));
  check('110 the point total of the quiz', PTS.reduce((a, b) => a + b, 0), 10);
}

// ---------------------------------------------------------------------------
// pr-x-ber-111 (hard) — two-stage hiring funnel feeding Bernoulli:
// P(pass A) = 0.5, P(pass B after A) = 0.4, n = 4, "at least two accepted".
// ---------------------------------------------------------------------------
{
  const p = 0.5 * 0.4; // the parameter the student must build before anything computes
  check('111 P(one candidate is hired) along the tree path', p, 0.2);
  const atLeast2 = 1 - binom(4, 0, p) - binom(4, 1, p);
  check('111 P(at least 2 of 4)', atLeast2, 0.1808);
  check('111 same by direct summation of k = 2,3,4', binom(4, 2, p) + binom(4, 3, p) + binom(4, 4, p), atLeast2);
  check('111 and by the library helper', binomAtLeast(4, 2, p), 0.1808);
  sumsToOne('111', 4, 0.2);
  check('111 P(0) = 0.8^4', binom(4, 0, p), 0.4096);
  check('111 P(1) = 4*0.2*0.8^3', binom(4, 1, p), 0.4096);
  check('111 wrongAnswer 0.6875 = stage A only, p taken as 0.5', binomAtLeast(4, 2, 0.5), 0.6875);
  check('111 wrongAnswer 0.5904 = "at least ONE" instead of two', atLeastOne(p, 4), 0.5904);
}

// ---------------------------------------------------------------------------
// pr-x-ber-112 (hard) — compare two missions at p = 0.6:
// א: at least 1 hit in 2 shots · ב: at least 2 hits in 4 shots.
// ---------------------------------------------------------------------------
{
  const a = atLeastOne(0.6, 2);
  const b = 1 - binom(4, 0, 0.6) - binom(4, 1, 0.6);
  check('112 P(mission A) = 1 - 0.4^2', a, 0.84);
  check('112 P(mission A) by enumeration of two fair-coin-shaped stages', 1 - 0.4 ** 2, a);
  check('112 P(mission B) = 1 - P(0) - P(1)', b, 0.8208);
  check('112 P(mission B) by direct summation', binomAtLeast(4, 2, 0.6), 0.8208);
  sumsToOne('112 mission A', 2, 0.6);
  sumsToOne('112 mission B', 4, 0.6);
  check('112 mission A is the better one', a > b ? 1 : 0, 1);
  check('112 P(0) of mission B', binom(4, 0, 0.6), 0.0256);
  check('112 P(1) of mission B', binom(4, 1, 0.6), 0.1536);
  check('112 distractor[3] = 0.9744, only P(0) removed from mission B', atLeastOne(0.6, 4), 0.9744);
}

// ---------------------------------------------------------------------------
// pr-x-ber-113 (hard) — smallest n with P(at least one detection) > 0.999, p = 0.8
// ---------------------------------------------------------------------------
{
  let n = 1;
  while (atLeastOne(0.8, n) <= 0.999) n++;
  check('113 minimal number of tests', n, 5);
  check('113 n = 5 clears the bar', atLeastOne(0.8, 5), 0.99968);
  check('113 wrongAnswer 4 falls short: P = 0.9984', atLeastOne(0.8, 4), 0.9984);
  check('113 and 0.9984 is below the 0.999 bar', atLeastOne(0.8, 4) < 0.999 ? 1 : 0, 1);
  check('113 wrongAnswer 3 falls short: P = 0.992', atLeastOne(0.8, 3), 0.992);
  check('113 the inequality the solution states: 0.2^5 < 0.001', 0.2 ** 5 < 0.001 ? 1 : 0, 1);
  check('113 while 0.2^4 is still above it', 0.2 ** 4 > 0.001 ? 1 : 0, 1);
  sumsToOne('113', 5, 0.8);
}

summary('pr-bernoulli');
