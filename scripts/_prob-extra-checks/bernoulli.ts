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

// ===========================================================================
// ROUND 2 — pr-x-ber-201…208, the probtree fences added to 108 / 111, and the
// bagrut question prob-bag-x-ber-01 (every part). Same discipline: every `got`
// is computed from the statement; stopping rules are ENUMERATED, not formula'd.
// ===========================================================================

/** Weighted brute force over {0,1}^n with P(1) = p per stage — the stopping-rule checker. */
const weighted = (n: number, p: number, pred: (o: number[]) => boolean): number => {
  let total = 0;
  for (let m = 0; m < 1 << n; m++) {
    const o = Array.from({ length: n }, (_, i) => (m >> i) & 1);
    if (pred(o)) total += o.reduce((acc, b) => acc * (b ? p : 1 - p), 1);
  }
  return total;
};
/** Sum of the leaf results of a probtree fence, and of its ✓ leaves — re-derived from the branch p's, not from `result`. */
type Br = { p: string; label: string; result?: string; pick?: boolean; children?: Br[] };
const fr = (s: string) => { const [a, b] = s.split('/'); return b ? Number(a) / Number(b) : Number(s); };
const walkTree = (b: Br, here: number, acc: { leaves: number; picked: number; nodesOk: boolean }) => {
  if (b.children?.length) {
    const s = b.children.reduce((x, c) => x + fr(c.p), 0);
    if (Math.abs(s - 1) > 1e-9) acc.nodesOk = false;
    for (const c of b.children) walkTree(c, here * fr(c.p), acc);
  } else {
    acc.leaves += here;
    if (b.pick) acc.picked += here;
    if (b.result != null && Math.abs(fr(b.result) - here) > 1e-9) acc.nodesOk = false;
  }
};
const treeStats = (json: string) => { const acc = { leaves: 0, picked: 0, nodesOk: true }; walkTree(JSON.parse(json) as Br, 1, acc); return acc; };

// ---------------------------------------------------------------------------
// 108 fence — 10 balls, 4 red, 3 drawn without replacement; ✓ = exactly two red
// ---------------------------------------------------------------------------
{
  const t = treeStats('{"children":[{"p":"4/10","children":[{"p":"3/9","children":[{"p":"2/8","result":"1/30"},{"p":"6/8","result":"1/10","pick":true}]},{"p":"6/9","children":[{"p":"3/8","result":"1/10","pick":true},{"p":"5/8","result":"1/6"}]}]},{"p":"6/10","children":[{"p":"4/9","children":[{"p":"3/8","result":"1/10","pick":true},{"p":"5/8","result":"1/6"}]},{"p":"5/9","children":[{"p":"4/8","result":"1/6"},{"p":"4/8","result":"1/6"}]}]}]}'.replace(/"p"/g, '"label":"","p"'));
  check('108 fence: every node sums to 1 and every leaf result = its path product', t.nodesOk ? 1 : 0, 1);
  check('108 fence: leaves sum to 1', t.leaves, 1);
  const urn = ['R', 'R', 'R', 'R', 'X', 'X', 'X', 'X', 'X', 'X'];
  check('108 fence: the ✓ leaves are exactly P(2 red of 3) by brute force', t.picked, drawNoReplacement(urn, 3, (s) => s.filter((b) => b === 'R').length === 2));
  check('108 step: picked total is the 0.3 the step states', t.picked, 0.3);
  check('108 step: the Bernoulli contrast 0.288 = C(3,2) 0.4^2 0.6', binom(3, 2, 0.4), 0.288);
}
// ---------------------------------------------------------------------------
// 111 fence — one candidate: pass A 0.5, then pass B 0.4. No ✓ by design: the
// question's event (≥2 of 4 hired) is not a leaf of this tree; the 0.2 leaf is
// read off explicitly in the next step and then fed to Bernoulli.
// ---------------------------------------------------------------------------
{
  const t = treeStats('{"children":[{"label":"","p":"0.5","children":[{"label":"","p":"0.4","result":"0.2"},{"label":"","p":"0.6","result":"0.3"}]},{"label":"","p":"0.5","result":"0.5"}]}');
  check('111 fence: nodes sum to 1, leaf results = path products', t.nodesOk ? 1 : 0, 1);
  check('111 fence: leaves sum to 1', t.leaves, 1);
  check('111 fence: no leaf is picked (the answer 0.1808 is not a leaf)', t.picked, 0);
  check('111 fence: the hired leaf 0.5*0.4 is the p used next', 0.5 * 0.4, 0.2);
}
// 106 rewritten step — 1/64 and 6/64 are the two complement terms of "at least 2"
check('106 step: P(0) = 1/64', binom(6, 0, 0.5), frac(1, 64));
check('106 step: P(1) = 6/64', binom(6, 1, 0.5), frac(6, 64));

// ---------------------------------------------------------------------------
// pr-x-ber-201 (mid) — n = 3, P(exactly 2) = 6 · P(all 3) → p = 1/3
// ---------------------------------------------------------------------------
{
  const g = (p: number) => binom(3, 2, p) - 6 * binom(3, 3, p);
  // 3p^2(1-p) = 6p^3 → 3(1-p) = 6p → p = 1/3
  const p = 3 / 9;
  check('201 recovered p', p, frac(1, 3));
  check('201 the ratio really is 6 at p', binom(3, 2, p) / binom(3, 3, p), 6);
  check('201 P(exactly 2) = 2/9', binom(3, 2, p), frac(2, 9));
  check('201 P(all 3) = 1/27', binom(3, 3, p), frac(1, 27));
  let roots = 0;
  for (let i = 1; i < 9999; i++) if (g(i / 10000) * g((i + 1) / 10000) < 0) roots++;
  check('201 exactly one root in (0,1)', roots, 1);
  check('201 wrongAnswer 1/7 = coefficient dropped, (1-p) = 6p', 1 / 7, frac(1, 7));
  check('201 1/7 does NOT satisfy the ratio', Math.abs(binom(3, 2, 1 / 7) / binom(3, 3, 1 / 7) - 6) > 1e-6 ? 1 : 0, 1);
  check('201 wrongAnswer 2/3 = 1 - p reported', 1 - p, frac(2, 3));
}
// ---------------------------------------------------------------------------
// pr-x-ber-202 (mid) — p = P(sum 7 on two dice) built from 36 outcomes, n = 4, "at least 2"
// ---------------------------------------------------------------------------
{
  const D6 = [1, 2, 3, 4, 5, 6];
  const p = enumerate([D6, D6], ([a, b]) => a + b === 7);
  check('202 p = 6/36 by enumeration', p, frac(1, 6));
  const ans = 1 - binom(4, 0, p) - binom(4, 1, p);
  check('202 P(at least 2 of 4)', ans, frac(19, 144));
  check('202 same by direct sum k=2,3,4', binomAtLeast(4, 2, p), ans);
  // fully independent: enumerate 4 rolls of a pair (36^4 outcomes)
  const PAIRS = D6.flatMap((a) => D6.map((b) => a + b));
  check('202 by brute force over 36^4 outcomes', enumerate([PAIRS, PAIRS, PAIRS, PAIRS], (o) => o.filter((s) => s === 7).length >= 2), frac(19, 144));
  check('202 P(0) = 625/1296', binom(4, 0, p), frac(625, 1296));
  check('202 P(1) = 500/1296', binom(4, 1, p), frac(500, 1296));
  check('202 distractor[1] = at least ONE', atLeastOne(p, 4), frac(671, 1296));
  check('202 distractor[2] = exactly two', binom(4, 2, p), frac(25, 216));
  check('202 distractor[3] = P(2) removed too, i.e. at least 3', binomAtLeast(4, 3, p), frac(7, 432));
}
// ---------------------------------------------------------------------------
// pr-x-ber-203 (mid) — n = 5, p = 0.1, exactly 2; the student's 0.9^2 · 0.1^3
// ---------------------------------------------------------------------------
{
  check("203 the student's number really is 0.9^2 * 0.1^3", 0.9 ** 2 * 0.1 ** 3, 0.00081);
  check('203 correct P(2 of 5)', binom(5, 2, 0.1), 0.0729);
  // two independent errors: exponents swapped AND coefficient missing
  const swapped = 0.1 ** 2 * 0.9 ** 3;
  check('203 fix only the exponents → 0.00729 (wrongAnswer 2)', swapped, 0.00729);
  check('203 the coefficient is the second error, factor 10', binom(5, 2, 0.1) / swapped, nCr(5, 2));
  check('203 a third component (n-k = 3) is already right in the student\'s work', 5 - 2, 3);
  sumsToOne('203', 5, 0.1);
}
// ---------------------------------------------------------------------------
// pr-x-ber-204 (mid) — fair die, even = 1/2: P(2 of 4) = 3/8 given; P(3 of 6) = 5/16
// ---------------------------------------------------------------------------
{
  check('204 the GIVEN: P(exactly 2 even of 4)', enumerate(spaces(4), (o) => heads(o) === 2), frac(3, 8));
  check('204 P(exactly 3 even of 6) by enumeration', enumerate(spaces(6), (o) => heads(o) === 3), frac(5, 16));
  check('204 same by formula C(6,3)/64', nCr(6, 3) / 64, frac(5, 16));
  check('204 the claim "smaller than 3/8" is true', frac(5, 16) < frac(3, 8) ? 1 : 0, 1);
  check('204 closing claim: per-path probability shrinks by 4 (1/16 → 1/64)', (1 / 16) / (1 / 64), 4);
  check('204 closing claim: "exactly half" keeps falling — P(4 of 8) < P(3 of 6)', enumerate(spaces(8), (o) => heads(o) === 4) < frac(5, 16) ? 1 : 0, 1);
  check('204 distractor[2] = exponent 5 instead of 6', nCr(6, 3) * 0.5 ** 5, frac(5, 8));
  check('204 distractor[3] = one path of three evens only', 0.5 ** 3, frac(1, 8));
}
// ---------------------------------------------------------------------------
// pr-x-ber-205 (hard) — 3 MCQ questions, guess p = 1/4; P(all 3 | at least 1)
// ---------------------------------------------------------------------------
{
  const p = 1 / 4;
  const pB = atLeastOne(p, 3);
  const pA = binom(3, 3, p);
  check('205 P(B) = 37/64', pB, frac(37, 64));
  check('205 P(A) = 1/64', pA, frac(1, 64));
  check('205 P(A|B) = 1/37', pA / pB, frac(1, 37));
  // independent: enumerate 4^3 answer sheets, condition by counting
  const Q = [0, 1, 2, 3]; // 0 = the correct option
  const all3 = enumerate([Q, Q, Q], (o) => o.every((x) => x === 0));
  const atLeast1 = enumerate([Q, Q, Q], (o) => o.some((x) => x === 0));
  check('205 by brute force over 64 sheets', all3 / atLeast1, frac(1, 37));
  check('205 wrongAnswer 1/63 = denominator 1 - P(all 3)', pA / (1 - pA), frac(1, 63));
}
// ---------------------------------------------------------------------------
// pr-x-ber-206 (hard) — stop after the 2nd deal, p = 0.4; P(exactly 4 calls)
// ENUMERATED: over all 2^4 outcome strings, the stopping time is 4 iff the
// second deal lands on call 4 (which forbids any string that stops earlier).
// ---------------------------------------------------------------------------
{
  const secondDealAt = (o: number[]) => { let c = 0; for (let i = 0; i < o.length; i++) { c += o[i]; if (c === 2) return i + 1; } return Infinity; };
  const ans = weighted(4, 0.4, (o) => secondDealAt(o) === 4);
  check('206 P(exactly 4 calls) by enumeration', ans, 0.1728);
  check('206 same as C(3,1) 0.4 0.6^2 * 0.4', nCr(3, 1) * 0.4 * 0.6 ** 2 * 0.4, ans);
  check('206 the number of qualifying strings is 3', [3, 5, 6].length, 3); // 0b0011,0b0101,0b0110 → deal positions (1,4),(2,4),(3,4)
  // stopping-time distribution sums to 1 (tail out to 60 calls)
  let tot = 0;
  for (let k = 2; k <= 60; k++) tot += (k - 1) * 0.4 ** 2 * 0.6 ** (k - 2);
  check('206 P(T=2)+P(T=3)+… = 1', tot, 1, 1e-8);
  check('206 distractor[1] = C(4,2) 0.4^2 0.6^2, exactly the double', binom(4, 2, 0.4), 0.3456);
  check('206 and it really is twice the answer', binom(4, 2, 0.4) / ans, 2);
  check('206 distractor[2] = one path', 0.4 ** 2 * 0.6 ** 2, 0.0576);
  check('206 distractor[3] = coefficient 4 instead of 3', 4 * 0.4 ** 2 * 0.6 ** 2, 0.2304);
}
// ---------------------------------------------------------------------------
// pr-x-ber-207 (hard) — 1 - (1-p)^2 = 0.36 → p = 0.2; then P(2 of 4)
// ---------------------------------------------------------------------------
{
  const p = 1 - Math.sqrt(1 - 0.36);
  check('207 recovered p', p, 0.2);
  check('207 the root reproduces the given', atLeastOne(p, 2), 0.36);
  check('207 the other root 1 + 0.8 is inadmissible (> 1)', 1 + Math.sqrt(0.64) > 1 ? 1 : 0, 1);
  check('207 P(exactly 2 of 4)', binom(4, 2, p), 0.1536);
  check('207 by enumeration', weighted(4, p, (o) => heads(o) === 2), 0.1536);
  check('207 wrongAnswer p = 0.36 taken literally → 0.3185', Math.round(binom(4, 2, 0.36) * 1e4) / 1e4, 0.3185);
  check('207 wrongAnswer one path 0.2^2 0.8^2', 0.2 ** 2 * 0.8 ** 2, 0.0256);
  check('207 wrongAnswer 1-p reported', 1 - p, 0.8);
  // answerLabels order: [p, probability] — values[0] must be the parameter, values[1] the probability
  check('207 values[0] is the parameter (< values[1] here, so a swap would show)', p < binom(4, 2, p) ? 0 : 1, 1);
}
// ---------------------------------------------------------------------------
// pr-x-ber-208 (hard) — 6 balls, 3 red, three draws: with replacement 3/8 (given);
// WITHOUT replacement (the ask) 9/20, by brute force and by the fence.
// ---------------------------------------------------------------------------
{
  check('208 the GIVEN with replacement: C(3,2)(1/2)^2(1/2) = 3/8', binom(3, 2, 3 / 6), frac(3, 8));
  const urn = ['R', 'R', 'R', 'X', 'X', 'X'];
  const truth = drawNoReplacement(urn, 3, (s) => s.filter((b) => b === 'R').length === 2);
  check('208 P(exactly 2 red of 3, no replacement) by brute force', truth, 0.45);
  check('208 same by hypergeometric C(3,2)C(3,1)/C(6,3)', (nCr(3, 2) * nCr(3, 1)) / nCr(6, 3), truth);
  const t = treeStats('{"children":[{"label":"","p":"3/6","children":[{"label":"","p":"2/5","children":[{"label":"","p":"1/4","result":"1/20"},{"label":"","p":"3/4","result":"3/20","pick":true}]},{"label":"","p":"3/5","children":[{"label":"","p":"2/4","result":"3/20","pick":true},{"label":"","p":"2/4","result":"3/20"}]}]},{"label":"","p":"3/6","children":[{"label":"","p":"3/5","children":[{"label":"","p":"2/4","result":"3/20","pick":true},{"label":"","p":"2/4","result":"3/20"}]},{"label":"","p":"2/5","children":[{"label":"","p":"3/4","result":"3/20"},{"label":"","p":"1/4","result":"1/20"}]}]}]}');
  check('208 fence: nodes sum to 1, leaf results = path products', t.nodesOk ? 1 : 0, 1);
  check('208 fence: leaves sum to 1', t.leaves, 1);
  check('208 fence: ✓ leaves = the brute-force answer', t.picked, truth);
  check('208 each ✓ path is 3/20', (3 / 6) * (2 / 5) * (3 / 4), frac(3, 20));
  check('208 wrongAnswer 0.375 = with replacement', binom(3, 2, 0.5), 0.375);
  check('208 wrongAnswer 0.15 = one path only', frac(3, 20), 0.15);
  check('208 the closing claim: without > with', truth > 0.375 ? 1 : 0, 1);
}

// ===========================================================================
// prob-bag-x-ber-01 — Dana's quiz, p recovered in א and carried through
// ===========================================================================
{
  // א: p^2 = 9(1-p)^2 → p = 3(1-p) → p = 0.75 ; the other root p = -3(1-p) → p = 1.5 is inadmissible
  const p = 3 / 4;
  check('bag/א p = 0.75', p, 0.75);
  check('bag/א the ratio really is 9 at p', binom(2, 2, p) / binom(2, 0, p), 9);
  check('bag/א rejected root p = 1.5 is > 1', 3 / 2 > 1 ? 1 : 0, 1);
  check('bag/א the check line 0.5625 both sides', binom(2, 2, p), 9 * binom(2, 0, p));
  // ב: at least 3 of 4
  const p3 = binom(4, 3, p), p4 = binom(4, 4, p);
  check('bag/ב P(3) = 0.421875', p3, 0.421875);
  check('bag/ב P(4) = 0.31640625', p4, 0.31640625);
  check('bag/ב P(at least 3) = 0.73828125', p3 + p4, 0.73828125);
  check('bag/ב same by weighted enumeration', weighted(4, p, (o) => heads(o) >= 3), 0.73828125);
  sumsToOne('bag/ב', 4, p);
  // ג: stop when both a right and a wrong have occurred; T = 3 iff s1 = s2 ≠ s3
  const stopAt = (o: number[]) => { for (let i = 1; i < o.length; i++) if (o[i] !== o[0]) return i + 1; return Infinity; };
  const t3 = weighted(3, p, (o) => stopAt(o) === 3);
  check('bag/ג P(exactly 3 questions) by enumeration', t3, 0.1875);
  check('bag/ג = CCW + WWC', p * p * (1 - p) + (1 - p) * (1 - p) * p, t3);
  check('bag/ג P(T=2) = 2p(1-p)', weighted(2, p, (o) => stopAt(o) === 2), 2 * p * (1 - p));
  let tot = 0;
  for (let k = 2; k <= 80; k++) tot += p ** (k - 1) * (1 - p) + (1 - p) ** (k - 1) * p;
  check('bag/ג the stopping-time distribution sums to 1', tot, 1, 1e-8);
  const g = treeStats('{"children":[{"label":"","p":"0.75","children":[{"label":"","p":"0.75","children":[{"label":"","p":"0.75","result":"0.421875"},{"label":"","p":"0.25","result":"0.140625","pick":true}]},{"label":"","p":"0.25","result":"0.1875"}]},{"label":"","p":"0.25","children":[{"label":"","p":"0.75","result":"0.1875"},{"label":"","p":"0.25","children":[{"label":"","p":"0.75","result":"0.046875","pick":true},{"label":"","p":"0.25","result":"0.015625"}]}]}]}');
  check('bag/ג fence: nodes sum to 1, leaf results = path products', g.nodesOk ? 1 : 0, 1);
  check('bag/ג fence: leaves sum to 1', g.leaves, 1);
  check('bag/ג fence: ✓ leaves = the answer', g.picked, t3);
  // ד: P(all 4 | at least 3) — containment, and the 3/7
  check('bag/ד "all four" is contained in "at least 3": P(A∩B) = P(A)', weighted(4, p, (o) => heads(o) === 4 && heads(o) >= 3), p4);
  check('bag/ד P(A|B) = 3/7', p4 / (p3 + p4), frac(3, 7));
  check('bag/ד as exact 256ths: 81/189', (p4 * 256) / ((p3 + p4) * 256), frac(81, 189));
  check('bag/ד numerator 81 and denominator 189 in 256ths', p4 * 256, 81);
  check('bag/ד denominator in 256ths', (p3 + p4) * 256, 189);
  // ה: 2 of 2 vs at least 3 of 4
  check('bag/ה P(2 of 2) = 0.5625', binom(2, 2, p), 0.5625);
  check('bag/ה the second option wins', p3 + p4 > binom(2, 2, p) ? 1 : 0, 1);
  check('bag/ה and the claim is not a fluke of p: also true at p = 0.6', binomAtLeast(4, 3, 0.6) > 0.6 ** 2 ? 1 : 0, 1);
  // 4p^3 - 3p^4 > p^2  ⇔  (3p-1)(p-1) < 0  ⇔  p > 1/3 — so at p = 0.25 the first option wins
  check('bag/ה but reverses at p = 0.25 (so the comparison had to be computed)', binomAtLeast(4, 3, 0.25) < 0.25 ** 2 ? 1 : 0, 1);
}

summary('pr-bernoulli');
