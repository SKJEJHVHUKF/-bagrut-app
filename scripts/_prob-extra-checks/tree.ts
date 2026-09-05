/**
 * tree.ts — adversarial re-derivation of the pr-tree EXTRA questions
 * (content/lessons/math5/prob-extra/tree.ts, ids pr-x-tre-101…113).
 *
 * Every `got` below is COMPUTED from the numbers in the question text — never
 * copied from the authored solution. For a tree the decisive check is not the
 * product of two branches (which reproduces whatever denominator the author
 * chose) but an ENUMERATION of the underlying equally-likely outcomes:
 * `enumerate` for "with replacement" experiments and `drawNoReplacement` for
 * every "בלי החזרה" urn. That is what catches a denominator that silently
 * assumed replacement, or a path count that forgot an ordering.
 *
 *   npx tsx scripts/_prob-extra-checks/tree.ts   → must print 0 failed
 */
import { check, checkSet, frac, atLeastOne, enumerate, drawNoReplacement, summary } from './_lib';

/** 1..n as an equally-likely stage of an experiment. */
const R = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
/** k copies of `a` then the rest `b` — a labelled urn for drawNoReplacement. */
const urn = (...parts: [string, number][]) => parts.flatMap(([label, n]) => Array.from({ length: n }, () => label));
/** MCQ options must be four DISTINCT values. */
const distinctOptions = (label: string, vals: number[]) => check(label, new Set(vals.map((v) => v.toFixed(10))).size, vals.length);

// =========================================================================
// pr-x-tre-101 (easy, mcq) — 70% learned; learned→pass 0.9, not→pass 0.4.
// P(did NOT learn AND passed)?
// The whole class as a 10×10 grid of equally likely students: 7 of every 10
// learned, and the pass branch is read off the SECOND coordinate, so the grid
// is an independent check on "0.3 · 0.4" and on which branch belongs to whom.
// =========================================================================
{
  const p = enumerate([R(10), R(10)], ([s, u]) => s > 7 && u <= 4); // not-learned (3/10) and pass (4/10)
  check('101 P(did not learn and passed) by 100-student grid', p, 0.12);
  check('101 same by the tree product', (1 - 0.7) * 0.4, p);
  // every distractor: the mistake its note names must produce THAT option
  check('101 distractor 0.4 = the bare second branch', 0.4, 0.4);
  check('101 distractor 0.28 = wrong first branch (0.7) times 0.4', 0.7 * 0.4, 0.28);
  check('101 distractor 0.63 = the other path, learned and passed', 0.7 * 0.9, 0.63);
  distinctOptions('101 four distinct option values', [0.12, 0.4, 0.28, 0.63]);
  // the four paths of the tree must sum to 1 — the author's tree is complete
  check('101 tree closes', 0.7 * 0.9 + 0.7 * 0.1 + 0.3 * 0.4 + 0.3 * 0.6, 1);
}

// =========================================================================
// pr-x-tre-102 (easy, open) — 70% close shots, 0.8 in; else far, 0.3 in.
// P(the shot goes in)? Two paths summed.
// =========================================================================
{
  const p = enumerate([R(10), R(10)], ([s, u]) => (s <= 7 ? u <= 8 : u <= 3));
  check('102 P(shot goes in) by 100-shot grid', p, 0.65);
  check('102 same by summing the two paths', 0.7 * 0.8 + 0.3 * 0.3, p);
  check('102 wrongAnswer 0.56 = the close path alone', 0.7 * 0.8, 0.56);
  check('102 wrongAnswer 1.1 = adding the two branch probabilities', 0.8 + 0.3, 1.1);
}

// =========================================================================
// pr-x-tre-103 (easy, mcq) — three independent lights, each green 0.7.
// P(all three green)? A three-level constant tree.
// =========================================================================
{
  const p = enumerate([R(10), R(10), R(10)], (o) => o.every((v) => v <= 7));
  check('103 P(three greens) by 1000-outcome enumeration', p, 0.343);
  check('103 same as 0.7^3', 0.7 ** 3, p);
  check('103 distractor 0.49 = only two lights', 0.7 ** 2, 0.49);
  check('103 distractor 2.1 = adding the three branches', 0.7 * 3, 2.1);
  distinctOptions('103 four distinct option values', [0.343, 0.49, 2.1, 0.7]);
}

// =========================================================================
// pr-x-tre-104 (easy, open, what-if) — two independent games; the question
// states P(win both) = 0.25 when p = 0.5, and asks for p = 0.8.
// =========================================================================
{
  check('104 the premise stated in the question: p = 0.5 gives 0.25', enumerate([R(10), R(10)], (o) => o.every((v) => v <= 5)), 0.25);
  const p = enumerate([R(10), R(10)], (o) => o.every((v) => v <= 8));
  check('104 P(win both) with p = 0.8', p, 0.64);
  check('104 same as 0.8^2', 0.8 ** 2, p);
  check('104 wrongAnswer 1.6 = adding the branches', 0.8 + 0.8, 1.6);
  check('104 the new answer must exceed the stated 0.25', Math.sign(p - 0.25), 1);
}

// =========================================================================
// pr-x-tre-105 (mid, open, justify) — box: 3 milk + 5 dark, two WITHOUT
// replacement. Is P(both milk) > 1/8 ?
// Enumerating the 8·7 ordered draws is what proves the denominator 7.
// =========================================================================
{
  const box = urn(['M', 3], ['D', 5]);
  const p = drawNoReplacement(box, 2, (s) => s.every((c) => c === 'M'));
  check('105 P(both milk) without replacement, enumerated', p, frac(3, 28));
  check('105 same by the changing tree', frac(3, 8) * frac(2, 7), p);
  check('105 the verdict: it is SMALLER than 1/8', Math.sign(p - frac(1, 8)), -1);
  // the question is not trivial: the with-replacement mistake flips the verdict
  check('105 the replacement trap (9/64) would answer "yes"', Math.sign((3 / 8) ** 2 - frac(1, 8)), 1);
  // and it is not the shipped easy question in disguise (that one is 4+6 → 2/15)
  check('105 differs from prob-sub-cond-002 (2/15)', Math.sign(Math.abs(p - frac(2, 15))), 1);
}

// =========================================================================
// pr-x-tre-106 (mid, mcq, find-the-error) — 7 red + 5 blue, two without
// replacement; the student wrote 7/12 · 6/12. Where is the error?
// =========================================================================
{
  const jar = urn(['R', 7], ['B', 5]);
  const p = drawNoReplacement(jar, 2, (s) => s.every((c) => c === 'R'));
  check('106 correct P(both red) without replacement, enumerated', p, frac(7, 22));
  check('106 same by the changing tree', frac(7, 12) * frac(6, 11), p);
  check("106 the student's own value 42/144 reduces to 7/24", frac(42, 144), frac(7, 24));
  check('106 option "numerator stays 7" = 49/132', frac(7, 12) * frac(7, 11), frac(49, 132));
  distinctOptions('106 the three numeric claims in the options are distinct', [frac(7, 22), frac(49, 132), frac(7, 24)]);
  // the option says the ONLY fault is the denominator; confirm the branch after
  // a red really is 6/11 — numerator 6 right, denominator 12 wrong
  const second = drawNoReplacement(jar, 2, (s) => s[0] === 'R' && s[1] === 'R') / drawNoReplacement(jar, 2, (s) => s[0] === 'R');
  check('106 P(second red | first red) = 6/11', second, frac(6, 11));
}

// =========================================================================
// pr-x-tre-107 (mid, open) — three independent shots, hit 0.4.
// P(at least one hit)? Complement of a single path.
// =========================================================================
{
  const p = enumerate([R(5), R(5), R(5)], (o) => o.some((v) => v <= 2)); // hit = 2/5 = 0.4
  check('107 P(at least one hit) by 125-outcome enumeration', p, 0.784);
  check('107 same by the complement pattern', atLeastOne(0.4, 3), p);
  check('107 wrongAnswer 0.216 = the complement itself, all three missed', 0.6 ** 3, 0.216);
  check('107 wrongAnswer 1.2 = adding the three hit probabilities', 0.4 * 3, 1.2);
  check('107 must exceed one shot', Math.sign(p - 0.4), 1);
}

// =========================================================================
// pr-x-tre-108 (mid, mcq, what-if) — 4 red + 3 blue + 3 green. With
// replacement the question STATES P(same colour) = 0.34; what without?
// =========================================================================
{
  const jar = urn(['R', 4], ['B', 3], ['G', 3]);
  const withRepl = enumerate([R(10), R(10)], ([a, b]) => {
    const col = (v: number) => (v <= 4 ? 'R' : v <= 7 ? 'B' : 'G');
    return col(a) === col(b);
  });
  check('108 the premise stated in the question: with replacement = 0.34', withRepl, 0.34);
  const p = drawNoReplacement(jar, 2, (s) => s[0] === s[1]);
  check('108 P(same colour) WITHOUT replacement, enumerated', p, frac(4, 15));
  check('108 same by summing the three paths', frac(4, 10) * frac(3, 9) + frac(3, 10) * frac(2, 9) + frac(3, 10) * frac(2, 9), p);
  check('108 distractor 17/50 = the given with-replacement value', frac(17, 50), withRepl);
  check('108 distractor 2/15 = the red-red path alone', frac(4, 10) * frac(3, 9), frac(2, 15));
  check('108 distractor 11/15 = the complement, different colours', 1 - p, frac(11, 15));
  distinctOptions('108 four distinct option values', [frac(4, 15), frac(17, 50), frac(2, 15), frac(11, 15)]);
  check('108 without replacement must be smaller than with', Math.sign(p - withRepl), -1);
}

// =========================================================================
// pr-x-tre-109 (hard, mcq, compare) — 4 red + 2 blue, two draws; which method
// gives the BIGGER P(at least one red)?
// The intuitive rule ("without replacement is smaller") is WRONG here, so both
// numbers and the DIRECTION are re-derived by enumeration.
// =========================================================================
{
  const sack = urn(['R', 4], ['B', 2]);
  const withRepl = enumerate([R(6), R(6)], (o) => o.some((v) => v <= 4)); // red = 4 of 6
  const noRepl = drawNoReplacement(sack, 2, (s) => s.includes('R'));
  check('109 P(at least one red) WITH replacement, enumerated', withRepl, frac(8, 9));
  check('109 same by the complement of one path', 1 - (frac(2, 6) * frac(2, 6)), withRepl);
  check('109 P(at least one red) WITHOUT replacement, enumerated', noRepl, frac(14, 15));
  check('109 same by the complement of one path', 1 - frac(2, 6) * frac(1, 5), noRepl);
  check('109 the direction: WITHOUT replacement is the bigger one', Math.sign(noRepl - withRepl), 1);
  // why it reverses: the complement is a same-colour pair, and THAT one shrinks
  check('109 complement without replacement (two blues) = 1/15', drawNoReplacement(sack, 2, (s) => s.every((c) => c === 'B')), frac(1, 15));
  check('109 complement with replacement (two blues) = 1/9', enumerate([R(6), R(6)], (o) => o.every((v) => v > 4)), frac(1, 9));
  // distractor 1 quotes the rule for "two reds"; confirm the rule really holds there
  check('109 for TWO REDS the usual direction does hold (4/9 → 2/5)', Math.sign(drawNoReplacement(sack, 2, (s) => s.every((c) => c === 'R')) - (frac(4, 6) ** 2)), -1);
  check('109 distractor 17/18 = numerator drops, denominator stays 6', 1 - frac(2, 6) * frac(1, 6), frac(17, 18));
  distinctOptions('109 the three numeric claims in the options are distinct', [frac(14, 15), frac(8, 9), frac(17, 18)]);
  // and the fourth option ("the two are equal") is refuted by the gap itself
  check('109 the two methods are NOT equal', Math.sign(Math.abs(noRepl - withRepl)), 1);
}

// =========================================================================
// pr-x-tre-110 (hard, open, Bayes) — sack A: 2 hard + 4 soft; sack B: 3 + 3.
// A sack is chosen at random, two drawn WITHOUT replacement, and the pair is
// known to be of the same type. P(it came from sack A)?
// The conditional must be normalised by P(same type), not by the intersection.
// =========================================================================
{
  const A = urn(['H', 2], ['S', 4]);
  const B = urn(['H', 3], ['S', 3]);
  const same = (s: string[]) => s[0] === s[1];
  const pA = drawNoReplacement(A, 2, same);
  const pB = drawNoReplacement(B, 2, same);
  check('110 P(same type | sack A), enumerated', pA, frac(7, 15));
  check('110 P(same type | sack B), enumerated', pB, frac(2, 5));
  const joint = 0.5 * pA;
  const total = 0.5 * pA + 0.5 * pB;
  check('110 P(A and same type)', joint, frac(7, 30));
  check('110 P(same type) — the CONDITION, the right denominator', total, frac(13, 30));
  check('110 P(A | same type)', joint / total, frac(7, 13));
  check('110 wrongAnswer 7/30 = the intersection, undivided', joint, frac(7, 30));
  check('110 wrongAnswer 1/2 = the prior, before the information', 0.5, frac(1, 2));
  check('110 the information must push it ABOVE the prior 1/2', Math.sign(joint / total - 0.5), 1);
  check('110 the two posteriors close to 1', joint / total + (0.5 * pB) / total, 1);
}

// =========================================================================
// pr-x-tre-111 (hard, mcq, find-the-error) — bus 0.55, and the student wrote
// walk 0.55; from the bus, late 0.2 and not-late 0.9. How many errors, and
// what is the correct P(late)?
// The error COUNT is computed from the node sums, not asserted.
// =========================================================================
{
  const nodes: [string, number[]][] = [
    ['root: bus + walk', [0.55, 0.55]],
    ['bus: late + not late', [0.2, 0.9]],
  ];
  const broken = nodes.filter(([, br]) => Math.abs(br.reduce((a, b) => a + b, 0) - 1) > 1e-9).length;
  check('111 number of nodes whose branches do not sum to 1', broken, 2);
  const pWalk = 1 - 0.55;
  check('111 the repaired walk branch', pWalk, 0.45);
  const p = 0.55 * 0.2 + pWalk * 0.3;
  check('111 correct P(late) after repairing the tree', p, 0.245);
  check('111 distractor 0.255 = the first branches swapped', 0.45 * 0.2 + 0.55 * 0.3, 0.255);
  check("111 distractor 0.275 = computed on the student's illegal tree", 0.55 * 0.2 + 0.55 * 0.3, 0.275);
  distinctOptions('111 the three distinct P claims in the options', [0.245, 0.255, 0.275]);
  // the two options sharing 0.245 differ in the error COUNT, so that count has
  // to be the discriminating fact — and it is 2, computed above, not 1
  check('111 the option claiming a single error is refuted by the node sums', Math.sign(broken - 1), 1);
}

// =========================================================================
// pr-x-tre-112 (hard, open) — 5 good + 3 empty batteries, THREE drawn without
// replacement. P(at most one empty)? The event must be decomposed first.
// =========================================================================
{
  const box = urn(['G', 5], ['E', 3]);
  const empties = (s: string[]) => s.filter((c) => c === 'E').length;
  const p = drawNoReplacement(box, 3, (s) => empties(s) <= 1);
  check('112 P(at most one empty), enumerated over 8·7·6 ordered draws', p, frac(5, 7));
  const none = drawNoReplacement(box, 3, (s) => empties(s) === 0);
  const one = drawNoReplacement(box, 3, (s) => empties(s) === 1);
  check('112 case A, no empty', none, frac(5, 28));
  check('112 case B, exactly one empty', one, frac(15, 28));
  check('112 the decomposition is exhaustive', none + one, p);
  check('112 each of the four paths is 60/336', frac(5, 8) * frac(4, 7) * frac(3, 6), frac(60, 336));
  check('112 wrongAnswer 15/28 = "exactly one" only, case A forgotten', one, frac(15, 28));
  const oneOrder = drawNoReplacement(box, 3, (s) => s[0] === 'E' && empties(s) === 1);
  check('112 a single ordering of "exactly one" is 5/28', oneOrder, frac(5, 28));
  check('112 wrongAnswer 5/14 = case A plus ONE ordering of case B', none + oneOrder, frac(5, 14));
  check('112 majority of the box is good, so the answer exceeds 1/2', Math.sign(p - 0.5), 1);
}

// =========================================================================
// pr-x-tre-113 (hard, open, find-parameter) — sack A: 4 soft + 6 hard;
// sack B: x soft + 5 hard. A sack at random, two drawn without replacement,
// and P(both soft) = 8/45. Find x.
// Solved by SCANNING x, not by trusting the quadratic — that also proves the
// solution is unique among admissible ball counts.
// =========================================================================
{
  const target = frac(8, 45);
  const totalFor = (x: number) => {
    const A = drawNoReplacement(urn(['S', 4], ['H', 6]), 2, (s) => s.every((c) => c === 'S'));
    const B = x >= 2 ? frac(x, x + 5) * frac(x - 1, x + 4) : 0;
    return 0.5 * A + 0.5 * B;
  };
  const roots = Array.from({ length: 40 }, (_, i) => i + 1).filter((x) => Math.abs(totalFor(x) - target) < 1e-12);
  checkSet('113 the only admissible x in 1..40', roots, [5]);
  check('113 x = 5 reproduces the stated 8/45', totalFor(5), target);
  check('113 sack A contributes 1/15', 0.5 * frac(4, 10) * frac(3, 9), frac(1, 15));
  check('113 sack B with x = 5 contributes 1/9', 0.5 * drawNoReplacement(urn(['S', 5], ['H', 5]), 2, (s) => s.every((c) => c === 'S')), frac(1, 9));
  check('113 the quadratic 7x^2 - 27x - 40 vanishes at x = 5', 7 * 5 ** 2 - 27 * 5 - 40, 0);
  check('113 wrongAnswer -8/7 is the rejected second root', 7 * (-8 / 7) ** 2 - 27 * (-8 / 7) - 40, 0);
  check('113 wrongAnswer 10 = the TOTAL in sack B, not x', 5 + 5, 10);
}

summary('pr-tree');
