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
import { check, checkSet, frac, atLeastOne, enumerate, drawNoReplacement, nCr, summary } from './_lib';
import { EXTRA, EXTRA_BAGRUT } from '../../content/lessons/math5/prob-extra/tree';
import { checkProbTreeFences, pickedTotal, PROBTREE_FENCE } from '../../lib/prob-figure';

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

// =========================================================================
// ROUND 2 — pr-x-tre-201…208 and the bagrut question prob-bag-x-tre-01.
// =========================================================================

// pr-x-tre-201 (mid, open, find-parameter) — machine A 60% with 2% faulty,
// machine B the rest with rate x; 3.2% faulty overall. Find x.
{
  const total = (x: number) => 0.6 * 0.02 + 0.4 * x;
  const roots = Array.from({ length: 101 }, (_, i) => i / 100).filter((x) => Math.abs(total(x) - 0.032) < 1e-12);
  checkSet('201 the only x on the 0.00..1.00 grid giving 3.2%', roots, [0.05]);
  check('201 x = 0.05 reproduces the stated 3.2%', total(0.05), 0.032);
  check('201 machine A path = 0.012', 0.6 * 0.02, 0.012);
  check('201 wrongAnswer 0.08 = 0.032 / 0.4, machine A path not removed', 0.032 / 0.4, 0.08);
  check('201 wrongAnswer 0.032 is the given total, not x', 0.032, total(0.05));
}

// pr-x-tre-202 (mid, open, find-parameter) — 4 red + x blue WITH replacement,
// P(at least one red) = 16/25. How many blue? Scanned over integer x.
{
  const pAtLeastOneRed = (x: number) => enumerate([R(x + 4), R(x + 4)], (o) => o.some((v) => v <= 4));
  const roots = Array.from({ length: 30 }, (_, i) => i + 1).filter((x) => Math.abs(pAtLeastOneRed(x) - frac(16, 25)) < 1e-12);
  checkSet('202 the only x in 1..30 giving 16/25, enumerated', roots, [6]);
  check('202 x = 6: complement (6/10)^2 = 9/25', (6 / 10) ** 2, frac(9, 25));
  check('202 wrongAnswer 10 = total balls', 6 + 4, 10);
  check('202 wrongAnswer 2.25 = solving x/(x+4) = 9/25 without the square', 36 / 16, 2.25);
  check('202 2.25 really solves the unsquared equation', 2.25 / (2.25 + 4), frac(9, 25));
}

// pr-x-tre-203 (mid, mcq) — Q1 right 0.6 (10 pts), Q2 right 0.5 (20 pts),
// independent. P(at least 20 points)? Enumerated over a 10×10 grid.
{
  const pts = ([a, b]: number[]) => (a <= 6 ? 10 : 0) + (b <= 5 ? 20 : 0);
  const p = enumerate([R(10), R(10)], (o) => pts(o) >= 20);
  check('203 P(at least 20 points) by 100-outcome grid', p, 0.5);
  check('203 same as the two paths right-right + wrong-right', 0.6 * 0.5 + 0.4 * 0.5, p);
  check('203 distractor 0.3 = right-right only', 0.6 * 0.5, 0.3);
  check('203 distractor 0.8 = at least one right', 1 - 0.4 * 0.5, 0.8);
  check('203 distractor 0.2 = wrong-right only', 0.4 * 0.5, 0.2);
  check('203 the path right-wrong gives only 10 points', pts([1, 10]), 10);
  distinctOptions('203 four distinct option values', [0.5, 0.3, 0.8, 0.2]);
}

// pr-x-tre-204 (mid, mcq) — 3 girls + 5 boys, three chosen WITHOUT
// replacement. P(at least one girl)?
{
  const grp = urn(['G', 3], ['B', 5]);
  const p = drawNoReplacement(grp, 3, (s) => s.includes('G'));
  check('204 P(at least one girl), enumerated over 8·7·6 draws', p, frac(23, 28));
  const allBoys = drawNoReplacement(grp, 3, (s) => s.every((c) => c === 'B'));
  check('204 complement, three boys = 5/28', allBoys, frac(5, 28));
  check('204 same by the changing tree', frac(5, 8) * frac(4, 7) * frac(3, 6), allBoys);
  check('204 distractor 387/512 = with replacement', 1 - (5 / 8) ** 3, frac(387, 512));
  check('204 distractor 3/8 = first pick is a girl', frac(3, 8), 0.375);
  distinctOptions('204 four distinct option values', [frac(23, 28), frac(5, 28), frac(387, 512), frac(3, 8)]);
}

// pr-x-tre-205 (hard, open, Bayes) — boys 40% list A, girls 1.5× that; a
// ballot box at random (1/2 each), one slip; known list A. P(boys' box)?
{
  const girls = 1.5 * 0.4;
  check('205 the recovered girls branch', girls, 0.6);
  const joint = 0.5 * 0.4;
  const total = 0.5 * 0.4 + 0.5 * girls;
  check('205 P(list A) — the CONDITION', total, 0.5);
  check('205 P(boys box | list A)', joint / total, 0.4);
  check('205 by a 2×10 grid of slips (box, then slip)', enumerate([R(2), R(10)], ([b, s]) => (b === 1 ? s <= 4 : s <= 6) && b === 1) / enumerate([R(2), R(10)], ([b, s]) => (b === 1 ? s <= 4 : s <= 6)), 0.4);
  check('205 wrongAnswer 0.2 = the intersection', joint, 0.2);
  check('205 the information pushes it BELOW the prior 1/2', Math.sign(joint / total - 0.5), -1);
}

// pr-x-tre-206 (hard, mcq, compare) — two shots at 0.5 vs three at 0.4;
// which gives the bigger P(at least one hit)?
{
  const two = enumerate([R(2), R(2)], (o) => o.some((v) => v === 1));
  const three = enumerate([R(5), R(5), R(5)], (o) => o.some((v) => v <= 2));
  check('206 two shots at 0.5, enumerated', two, 0.75);
  check('206 three shots at 0.4, enumerated', three, 0.784);
  check('206 direction: three shots win', Math.sign(three - two), 1);
  check('206 complements 0.25 vs 0.216 (distractor 4 quotes them)', 0.5 ** 2 - 0.6 ** 3, 0.25 - 0.216);
  check('206 distractor 2: all hits, 0.25 vs 0.064', 0.4 ** 3, 0.064);
  check('206 distractor 3: the sums 1.2 vs 1 — the two-shot sum is exactly 1, not above it', 2 * 0.5, 1);
}

// pr-x-tre-207 (hard, open, count) — answered 0.3 per call, independent.
// Least n with P(at least one answered) > 0.9 ?
{
  const p = (n: number) => 1 - 0.7 ** n;
  const n = Array.from({ length: 30 }, (_, i) => i + 1).find((k) => p(k) > 0.9)!;
  check('207 least n with 1 - 0.7^n > 0.9', n, 7);
  check('207 n = 6 falls short', Math.sign(0.9 - p(6)), 1);
  check('207 0.7^6 ≈ 0.118 as the note says', Math.round(0.7 ** 6 * 1000) / 1000, 0.118);
  check('207 0.7^7 ≈ 0.082', Math.round(0.7 ** 7 * 1000) / 1000, 0.082);
  check('207 wrongAnswer 3 = 3 · 0.3 = 0.9 (adding), and really gives only 0.657', p(3), 0.657);
  check('207 the fence leaves 0.21 / 0.147 / 0.343', 0.7 * 0.3 + 0.7 * 0.7 * 0.3 + 0.7 ** 3, 0.21 + 0.147 + 0.343);
}

// pr-x-tre-208 (hard, mcq, justify) — 3 red + 2 blue, draw without
// replacement until blue. P(at least three draws)? Ron's "2/4" is wrong.
{
  const sack = urn(['R', 3], ['B', 2]);
  // enumerate ALL 5! orderings; draws = index of the first blue + 1
  const draws = (s: string[]) => s.indexOf('B') + 1;
  const dist = [1, 2, 3, 4].map((k) => drawNoReplacement(sack, 5, (s) => draws(s) === k));
  checkSet('208 the distribution of the draw count', dist, [frac(2, 5), frac(3, 10), frac(1, 5), frac(1, 10)]);
  check('208 it sums to 1', dist.reduce((a, b) => a + b, 0), 1);
  const p = drawNoReplacement(sack, 5, (s) => draws(s) >= 3);
  check('208 P(at least three draws), enumerated', p, frac(3, 10));
  check('208 same as first two red', frac(3, 5) * frac(2, 4), p);
  check('208 the four counts are NOT equally likely (max − min > 0)', Math.sign(Math.max(...dist) - Math.min(...dist)), 1);
  check('208 distractor 1/5 = exactly three draws', dist[2], frac(1, 5));
  check('208 distractor 9/25 = with replacement', (3 / 5) ** 2, frac(9, 25));
  distinctOptions('208 the four numeric claims are distinct', [frac(3, 10), frac(1, 2), frac(1, 5), frac(9, 25)]);
}

// prob-bag-x-tre-01 — sack A: 3W + 2B; sack B: xW + 6B; die 1–2 → A (1/3),
// else B (2/3); P(white) = 7/15.
{
  const A = urn(['W', 3], ['B', 2]);
  const pA = frac(2, 6), pB = 1 - pA;
  const whiteFor = (x: number) => pA * frac(3, 5) + pB * frac(x, x + 6);
  const roots = Array.from({ length: 40 }, (_, i) => i + 1).filter((x) => Math.abs(whiteFor(x) - frac(7, 15)) < 1e-12);
  checkSet('bag/א the only x in 1..40 giving 7/15', roots, [4]);
  check('bag/א sack A white path = 1/5', pA * frac(3, 5), frac(1, 5));
  check('bag/א 18x = 72 at x = 4', 18 * 4, 72);
  const B = urn(['W', 4], ['B', 6]);

  // ב — P(A | white)
  const jointA = pA * frac(3, 5);
  check('bag/ב P(A | white)', jointA / whiteFor(4), frac(3, 7));
  check('bag/ב above the prior 1/3', Math.sign(jointA / whiteFor(4) - frac(1, 3)), 1);

  // ג — two without replacement from the chosen sack, same colour
  const sameA = drawNoReplacement(A, 2, (s) => s[0] === s[1]);
  const sameB = drawNoReplacement(B, 2, (s) => s[0] === s[1]);
  check('bag/ג P(same | A), enumerated', sameA, frac(2, 5));
  check('bag/ג P(same | B), enumerated', sameB, frac(7, 15));
  const same = pA * sameA + pB * sameB;
  check('bag/ג P(same colour)', same, frac(4, 9));
  check('bag/ג the four leaves 1/10 + 1/30 + 4/45 + 2/9', frac(1, 10) + frac(1, 30) + frac(4, 45) + frac(2, 9), same);
  check('bag/ג complement 5/9', 1 - same, frac(5, 9));

  // ד — P(A | same colour)
  check('bag/ד A and same = 2/15', pA * sameA, frac(2, 15));
  check('bag/ד P(A | same)', (pA * sameA) / same, frac(3, 10));
  check('bag/ד below the prior 1/3 because same is likelier in B', Math.sign(sameB - sameA), 1);
  check('bag/ד the two posteriors close to 1', (pA * sameA) / same + (pB * sameB) / same, 1);

  // ה — three from sack B without replacement, at most one white
  const whites = (s: string[]) => s.filter((c) => c === 'W').length;
  const p = drawNoReplacement(B, 3, (s) => whites(s) <= 1);
  check('bag/ה P(at most one white), enumerated over 10·9·8 draws', p, frac(2, 3));
  check('bag/ה no white = 1/6', drawNoReplacement(B, 3, (s) => whites(s) === 0), frac(1, 6));
  check('bag/ה exactly one white = 3/6', drawNoReplacement(B, 3, (s) => whites(s) === 1), frac(1, 2));
  check('bag/ה by combinations: (C(6,3) + 4·C(6,2)) / C(10,3)', (nCr(6, 3) + 4 * nCr(6, 2)) / nCr(10, 3), p);
  check('bag/ה majority black, so above 1/2', Math.sign(p - 0.5), 1);
}

// =========================================================================
// THE FIGURES — every ```probtree fence in the stage, read from the content
// file itself: (a) the validator finds nothing, (b) the ✓ leaves sum to what
// the QUESTION's marked event is — the answer, the complement, or a
// conditional's denominator — as re-derived above, never read off the fence.
// =========================================================================
{
  const stepsOf = (id: string) => EXTRA.find((q) => q.id === id)?.solution?.steps?.join('\n') ?? '';
  const bagSteps = (label: string) => EXTRA_BAGRUT[0].parts.find((p) => p.label === label)?.solution?.steps?.join('\n') ?? '';
  const expectPick: [string, string, number | null][] = [
    ['pr-x-tre-101', 'not-learned and passed', 0.3 * 0.4],
    ['pr-x-tre-102', 'shot goes in', 0.7 * 0.8 + 0.3 * 0.3],
    ['pr-x-tre-103', 'three greens', 0.7 ** 3],
    ['pr-x-tre-104', 'win both at 0.8', 0.8 ** 2],
    ['pr-x-tre-105', 'milk-milk', frac(3, 8) * frac(2, 7)],
    ['pr-x-tre-106', 'red-red corrected', frac(7, 12) * frac(6, 11)],
    ['pr-x-tre-107', 'the COMPLEMENT, no hit', 0.6 ** 3],
    ['pr-x-tre-108', 'same colour without replacement', frac(4, 15)],
    ['pr-x-tre-109', 'two fences, both complements: 1/9 + 1/15', frac(1, 9) + frac(1, 15)],
    ['pr-x-tre-110', "the conditional's DENOMINATOR P(same type)", frac(13, 30)],
    ['pr-x-tre-111', 'late, on the repaired tree', 0.245],
    ['pr-x-tre-112', 'at most one empty', frac(5, 7)],
    ['pr-x-tre-113', 'symbolic (x on a branch)', null],
    ['pr-x-tre-201', 'symbolic (x on a branch)', null],
    ['pr-x-tre-202', 'symbolic (x on a branch)', null],
    ['pr-x-tre-203', 'at least 20 points', 0.5],
    ['pr-x-tre-204', 'the COMPLEMENT, three boys', frac(5, 28)],
    ['pr-x-tre-205', "the conditional's DENOMINATOR P(list A)", 0.5],
    ['pr-x-tre-206', 'two fences, both complements: 0.25 + 0.216', 0.25 + 0.216],
    ['pr-x-tre-207', 'no ✓ (n is the unknown)', null],
    ['pr-x-tre-208', 'at least three draws', frac(3, 10)],
  ];
  let fences = 0;
  for (const [id, what, want] of expectPick) {
    const text = stepsOf(id);
    fences += (text.match(PROBTREE_FENCE) ?? []).length;
    check(`${id} fence: validator finds nothing`, checkProbTreeFences(text).length, 0);
    const got = pickedTotal(text);
    check(`${id} fence: ✓ leaves = ${what}`, got === null ? -1 : got, want === null ? -1 : want);
  }
  const bagPick: [string, number | null][] = [['א', null], ['ב', null], ['ג', frac(4, 9)], ['ד', null], ['ה', frac(2, 3)]];
  for (const [label, want] of bagPick) {
    const text = bagSteps(label);
    fences += (text.match(PROBTREE_FENCE) ?? []).length;
    check(`bag/${label} fence: validator finds nothing`, checkProbTreeFences(text).length, 0);
    const got = pickedTotal(text);
    check(`bag/${label} fence: ✓ leaves`, got === null ? -1 : got, want === null ? -1 : want);
  }
  check('the stage carries 26 probtree fences (14 round-1, 9 round-2, 3 bagrut)', fences, 26);
}

summary('pr-tree');
