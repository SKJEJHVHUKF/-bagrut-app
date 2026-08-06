/**
 * verify-vectors.ts — numeric self-check of every worked-example claim in the
 * 5 guided vectors sub-topic lessons + the fixed drills. Accuracy first.
 *   npx tsx scripts/verify-vectors.ts
 *
 * Uses independent, dependency-free 3D vector arithmetic so it can't inherit a
 * bug from the lesson authoring. A passing build/KaTeX render does NOT catch a
 * wrong-but-valid number — only re-computation does (see lessons_learned).
 */
import { create, all } from 'mathjs';
const mj = create(all);

type V = [number, number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (k: number, a: V): V => [k * a[0], k * a[1], k * a[2]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: V): number => Math.sqrt(dot(a, a));

let pass = 0;
let fail = 0;
const approx = (x: number, y: number) => Math.abs(x - y) < 1e-9;
function num(desc: string, got: number, want: number) {
  const ok = approx(got, want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${got} vs ${want})`);
}
function vec(desc: string, got: V, want: V) {
  const ok = got.every((g, i) => approx(g, want[i]));
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   ([${got}] vs [${want}])`);
}

console.log('— vec-basics —');
vec('OA', sub([2, 5, -1], [0, 0, 0]), [2, 5, -1]);
vec('AB=B-A', sub([4, 0, 5], [1, 2, 3]), [3, -2, 2]);
vec('BA=-AB', scale(-1, sub([4, 0, 5], [1, 2, 3])), [-3, 2, -2]);
num('|(2,-1,2)|', norm([2, -1, 2]), 3);
vec('2u-w', sub(scale(2, [1, 0, -2]), [3, -1, 1]), [-1, 1, -5]);
vec('midpoint', scale(0.5, add([0, 1, -2], [4, -1, 2])), [2, 0, 0]);
vec('box C=B+AD', add([3, 0, 0], [0, 2, 0]), [3, 2, 0]);
vec("box C'=C+AA'", add([3, 2, 0], [0, 0, 5]), [3, 2, 5]);

console.log('— vec-basic-005 (fixed drill) —');
vec('AB', sub([4, -2, 14], [1, 2, 2]), [3, -4, 12]);
vec('midpoint', scale(0.5, add([1, 2, 2], [4, -2, 14])), [2.5, 0, 8]);
vec('C=A+(1/4)AB', add([1, 2, 2], scale(0.25, [3, -4, 12])), [1.75, 1, 5]);
num('|AB|', norm([3, -4, 12]), 13);

console.log('— vec-dot-product —');
num('(1,2,3)·(4,-1,0)', dot([1, 2, 3], [4, -1, 0]), 2);
num('(2,-1,3)·(1,4,-2)', dot([2, -1, 3], [1, 4, -2]), -8);
num('perp test =0', dot([1, 2, -1], [2, 0, 2]), 0);
num('angle cos=1/2', dot([1, 0, 1], [0, 1, 1]) / (norm([1, 0, 1]) * norm([0, 1, 1])), 0.5);
num('k: 3k-3=0 @k=1', dot([1, 2, -1], [1, 1, 3]), 0); // k=1 substituted
num('right angle @A', dot(sub([2, 1, 2], [0, 0, 0]), sub([-1, 2, 0], [0, 0, 0])), 0);

console.log('— vec-dot-005 (fixed drill) —');
num('@A not 0', dot(sub([1, 1, 1], [3, 3, 2]), sub([3, 0, -1], [3, 3, 2])), 9);
num('@B =0 (right)', dot(sub([3, 3, 2], [1, 1, 1]), sub([3, 0, -1], [1, 1, 1])), 0);
num('|BA|=3', norm(sub([3, 3, 2], [1, 1, 1])), 3);
num('|BC|=3', norm(sub([3, 0, -1], [1, 1, 1])), 3);

console.log('— vec-cross-product —');
vec('i×j', cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
vec('(1,2,1)×(2,0,-1)', cross([1, 2, 1], [2, 0, -1]), [-2, 3, -4]);
num('perp to a', dot([1, 2, 1], [-2, 3, -4]), 0);
num('perp to b', dot([2, 0, -1], [-2, 3, -4]), 0);
num('parallelogram area', norm(cross([1, 0, 0], [0, 2, 0])), 2);
vec('AB×AC', cross(sub([0, 1, 0], [1, 0, 0]), sub([0, 0, 1], [1, 0, 0])), [1, 1, 1]);
num('triangle S=√3/2', 0.5 * norm(cross([-1, 1, 0], [-1, 0, 1])), Math.sqrt(3) / 2);
vec('collinear ×=0', cross([1, 2, 3], [-1, -2, -3]), [0, 0, 0]);

console.log('— vec-line-plane (system method) —');
// normal of plane through A(1,0,1),B(2,1,0),C(0,1,2): n=(1,0,1)
num('n·AB=0', dot([1, 0, 1], sub([2, 1, 0], [1, 0, 1])), 0);
num('n·AC=0', dot([1, 0, 1], sub([0, 1, 2], [1, 0, 1])), 0);
num('plane x+z=2 @A', 1 + 1, 2);
num('plane x+z=2 @B', 2 + 0, 2);
num('plane x+z=2 @C', 0 + 2, 2);
// intersection of X=(1,0,2)+t(2,-1,3) with x+y+z=5
{
  const t = 0.5;
  const p = add([1, 0, 2], scale(t, [2, -1, 3]));
  num('intersection t=1/2', 3 + 4 * t, 5);
  vec('intersection point', p, [2, -0.5, 3.5]);
  num('point on plane', p[0] + p[1] + p[2], 5);
}

console.log('— vec-lp-003 (fixed drill, system) —');
// A(1,1,0),B(2,0,1),C(0,2,2): n=(1,1,0)
num('n·AB=0', dot([1, 1, 0], sub([2, 0, 1], [1, 1, 0])), 0);
num('n·AC=0', dot([1, 1, 0], sub([0, 2, 2], [1, 1, 0])), 0);
num('plane x+y=2 @A', 1 + 1, 2);
num('plane x+y=2 @B', 2 + 0, 2);
num('plane x+y=2 @C', 0 + 2, 2);

console.log('— vec-distances-angles —');
// d(P(2,1,-1), 2x-y+2z=4)
num('|n|=3', norm([2, -1, 2]), 3);
num('point-plane d=1', Math.abs(2 * 2 - 1 * 1 + 2 * -1 - 4) / norm([2, -1, 2]), 1);
// angle between planes x+y=3, y+z=1 → 60°
num('plane angle cos=1/2', Math.abs(dot([1, 1, 0], [0, 1, 1])) / (norm([1, 1, 0]) * norm([0, 1, 1])), 0.5);
// angle line (1,0,0) to plane x+y=4 → sin=1/√2 (45°)
num('line-plane sin=1/√2', Math.abs(dot([1, 0, 0], [1, 1, 0])) / (norm([1, 0, 0]) * norm([1, 1, 0])), 1 / Math.sqrt(2));
// distance P(2,3,1) to line Q=0 dir (1,1,1) → √2
num('point-line d=√2', norm(cross([2, 3, 1], [1, 1, 1])) / norm([1, 1, 1]), Math.sqrt(2));

console.log('— capstone vec-bag-001 —');
// A(2,0,0),B(0,3,0),C(0,0,6): n=AB×AC=(18,12,6); plane 3x+2y+z=6
vec('AB×AC', cross(sub([0, 3, 0], [2, 0, 0]), sub([0, 0, 6], [2, 0, 0])), [18, 12, 6]);
num('d(O,plane)=6/√14', Math.abs(-6) / norm([3, 2, 1]), 6 / Math.sqrt(14));
num('area=3√14', 0.5 * norm([18, 12, 6]), 3 * Math.sqrt(14));

console.log('— vec-bag-002 basics —');
vec('AB', sub([6, 4, 12], [2, 1, 0]), [4, 3, 12]);
num('|AB|=13', norm([4, 3, 12]), 13);
vec('midpoint', scale(0.5, add([2, 1, 0], [6, 4, 12])), [4, 2.5, 6]);
vec('C=2B-A', sub(scale(2, [6, 4, 12]), [2, 1, 0]), [10, 7, 24]);
vec('B is midpoint of AC', scale(0.5, add([2, 1, 0], [10, 7, 24])), [6, 4, 12]);

console.log('— vec-bag-003 dot —');
num('u·v=1', dot([1, 0, 1], [1, 1, 0]), 1);
num('cos=1/2', dot([1, 0, 1], [1, 1, 0]) / (norm([1, 0, 1]) * norm([1, 1, 0])), 0.5);
num('t=2 ⟂ u', dot([2, 1, -2], [1, 0, 1]), 0); // w=(t,1,-2), t=2

console.log('— vec-bag-004 cross —');
vec('AB×AC', cross(sub([0, 2, 0], [1, 0, 0]), sub([0, 0, 2], [1, 0, 0])), [4, 2, 2]);
num('|AB×AC|=2√6', norm([4, 2, 2]), 2 * Math.sqrt(6));
num('area=√6', 0.5 * norm([4, 2, 2]), Math.sqrt(6));

console.log('— vec-bag-005 line-plane (system) —');
num('n·AB=0', dot([1, -1, 1], sub([2, 1, 0], [1, 0, 0])), 0);
num('n·AC=0', dot([1, -1, 1], sub([1, 1, 1], [1, 0, 0])), 0);
num('plane x-y+z=1 @A', 1 - 0 + 0, 1);
num('plane x-y+z=1 @B', 2 - 1 + 0, 1);
num('plane x-y+z=1 @C', 1 - 1 + 1, 1);
{
  const t = 1 / 3;
  num('line∩plane: 3t=1', t - -t + t, 1);
}

console.log('— vec-bag-006 distances —');
num('d(P,π)=2/3', Math.abs(2 * 3 - 2 * 1 + 4 - 6) / norm([2, -2, 1]), 2 / 3);
num('line⟂plane sinθ=1', Math.abs(dot([2, -2, 1], [2, -2, 1])) / (norm([2, -2, 1]) * norm([2, -2, 1])), 1);
num('d(O,π)=2', Math.abs(-6) / norm([2, -2, 1]), 2);

// ============================================================
// mathjs re-derivation of EVERY newly-added drill & question in the two
// sub-topics vec-line-plane & vec-distances-angles. Uses mathjs — a
// DIFFERENT engine than the hand-rolled helpers above — so a bug in one
// implementation can't hide in the other. Each check recomputes the numeric
// answer / MCQ correct option from scratch. (Purely-conceptual MCQs — with no
// numeric claim to recompute — are noted inline and skipped.)
// ============================================================
const mSub = (a: V, b: V): V => mj.subtract(a, b) as unknown as V;
const mAdd = (a: V, b: V): V => mj.add(a, b) as unknown as V;
const mScale = (k: number, a: V): V => mj.multiply(k, a) as unknown as V;
const mDot = (a: V, b: V): number => mj.dot(a, b) as unknown as number;
const mCross = (a: V, b: V): V => mj.cross(a, b) as unknown as V;
const mNorm = (a: V): number => mj.norm(a) as unknown as number;
const mAcosDeg = (x: number): number => ((mj.acos(x) as unknown as number) * 180) / Math.PI;
const mAsinDeg = (x: number): number => ((mj.asin(x) as unknown as number) * 180) / Math.PI;

console.log('— [mathjs] NEW vec-line-plane drills —');
// drill-003: normal of 2x+y=6 is (2,1,0) — re-derive: (2,1,0) ⟂ two in-plane dirs
num('lp-drill-003 n⟂(0,0,1)', mDot([2, 1, 0], [0, 0, 1]), 0);
num('lp-drill-003 n⟂(1,-2,0)', mDot([2, 1, 0], [1, -2, 0]), 0);
// drill-004: n·AB=0, n·AC=0 (AB=(1,1,0),AC=(0,1,1)) → n=(1,-1,1)
num('lp-drill-004 n·AB', mDot([1, -1, 1], [1, 1, 0]), 0);
num('lp-drill-004 n·AC', mDot([1, -1, 1], [0, 1, 1]), 0);
// drill-005: plane n=(1,2,1) through P(1,1,1) → d=4
num('lp-drill-005 d=n·P', mDot([1, 2, 1], [1, 1, 1]), 4);
// drill-006: line ⟂ plane x+4y-2z=7 → dir=(1,4,-2); re-derive ⟂ two in-plane dirs
num('lp-drill-006 n⟂(4,-1,0)', mDot([1, 4, -2], [4, -1, 0]), 0);
num('lp-drill-006 n⟂(2,0,1)', mDot([1, 4, -2], [2, 0, 1]), 0);
// drill-007: X=(1,1,1)+t(1,0,2) ∩ x+z=8 → t=2, point (3,1,5)
{
  const t = (8 - (1 + 1)) / (1 + 2); // (1+t)+(1+2t)=2+3t=8
  num('lp-drill-007 t=2', t, 2);
  const p = mAdd([1, 1, 1], mScale(t, [1, 0, 2]));
  vec('lp-drill-007 point', p, [3, 1, 5]);
  num('lp-drill-007 on x+z=8', p[0] + p[2], 8);
}

console.log('— [mathjs] NEW vec-line-plane questions —');
// lp-006: AB = B-A = (2,1,3)
vec('lp-006 AB', mSub([3, 1, 5], [1, 0, 2]), [2, 1, 3]);
// lp-007: (1,1,0) on x+2y-z=3
num('lp-007 on plane', 1 + 2 * 1 - 0, 3);
// lp-008: (5,2,1) on X=(1,0,3)+t(2,1,-1) → t=2
{
  const t = (5 - 1) / 2;
  num('lp-008 t=2', t, 2);
  vec('lp-008 point', mAdd([1, 0, 3], mScale(t, [2, 1, -1])), [5, 2, 1]);
}
// lp-009: plane through A(2,0,0),B(0,1,0),C(0,0,2) → n=(1,2,1), plane x+2y+z=2
{
  const A: V = [2, 0, 0];
  const B: V = [0, 1, 0];
  const C: V = [0, 0, 2];
  const n: V = [1, 2, 1];
  num('lp-009 n·AB', mDot(n, mSub(B, A)), 0);
  num('lp-009 n·AC', mDot(n, mSub(C, A)), 0);
  num('lp-009 d @A', mDot(n, A), 2);
  num('lp-009 @B', mDot(n, B), 2);
  num('lp-009 @C', mDot(n, C), 2);
}
// lp-010: line ⟂ plane x-3y+2z=7 → dir=(1,-3,2); re-derive ⟂ two in-plane dirs
num('lp-010 n⟂(3,1,0)', mDot([1, -3, 2], [3, 1, 0]), 0);
num('lp-010 n⟂(2,0,-1)', mDot([1, -3, 2], [2, 0, -1]), 0);
// lp-011: plane ⊃ AC=(6,18,0), ∥ SD=(6,8,-12) → n=(18,-6,5), through origin (Q2ד, מועד א)
{
  const n: V = [18, -6, 5];
  num('lp-011 n·AC', mDot(n, [6, 18, 0]), 0);
  num('lp-011 n·SD', mDot(n, [6, 8, -12]), 0);
}
// lp-012: SB=(0,10,0)+t(0,10,-12) ∩ 18x-6y+5z=0 → t=-1/2, K=(0,5,6) (Q2ה1, מועד א)
{
  const t = -60 / 120; // -6(10+10t)+5(-12t) = -60-120t = 0
  num('lp-012 t=-1/2', t, -0.5);
  const K = mAdd([0, 10, 0], mScale(t, [0, 10, -12]));
  vec('lp-012 K', K, [0, 5, 6]);
  num('lp-012 K on plane', mDot([18, -6, 5], K), 0);
}

console.log('— [mathjs] NEW vec-distances-angles drills —');
// drill-001: d(P(1,0,0), 2x+2y+z=8) = 2
num('da-drill-001 d=2', Math.abs(mDot([2, 2, 1], [1, 0, 0]) - 8) / mNorm([2, 2, 1]), 2);
// drill-002 (use normals) & drill-003 (sin vs cos): conceptual — no numeric claim.
// drill-004: d(P(1,2,0), line through O dir (1,0,0)) = 2
num('da-drill-004 d=2', mNorm(mCross([1, 2, 0], [1, 0, 0])) / mNorm([1, 0, 0]), 2);

console.log('— [mathjs] NEW vec-distances-angles questions —');
// da-006: d(O, x+2y+2z=6) = 2
num('da-006 d=2', Math.abs(mDot([1, 2, 2], [0, 0, 0]) - 6) / mNorm([1, 2, 2]), 2);
// da-007: conceptual (sin) — no numeric claim.
// da-008: angle between planes n1=(1,1,0),n2=(1,-1,0) → 90°
num(
  'da-008 θ=90',
  mAcosDeg(Math.abs(mDot([1, 1, 0], [1, -1, 0])) / (mNorm([1, 1, 0]) * mNorm([1, -1, 0]))),
  90,
);
// da-009: parallel planes x+2y+2z=3 & =12 → d=3
num('da-009 d=3', Math.abs(12 - 3) / mNorm([1, 2, 2]), 3);
// da-010: line (0,1,0) to plane y+z=4, n=(0,1,1) → sinθ=1/√2 → 45°
num(
  'da-010 θ=45',
  mAsinDeg(Math.abs(mDot([0, 1, 0], [0, 1, 1])) / (mNorm([0, 1, 0]) * mNorm([0, 1, 1]))),
  45,
);
// da-011: d(N(3,2.25,13.5), 3x+4y-36=0) = 18/5 = 3.6 (Q2ד1, מועד ב)
num('da-011 d=3.6', Math.abs(mDot([3, 4, 0], [3, 2.25, 13.5]) - 36) / mNorm([3, 4, 0]), 3.6);
// da-012: d(P(1,0,0), line through O dir (0,1,1)) = 1
num('da-012 d=1', mNorm(mCross([1, 0, 0], [0, 1, 1])) / mNorm([0, 1, 1]), 1);

// ============================================================
// Ghost Replay (content/ghost-replay/math5/vectors.ts)
// ============================================================
// Not just the five answers — every number INVENTED inside a failure branch
// too. That prose is where wrong numbers hide, because nothing else checks it
// (see lessons_learned, 2026-08-05).

// --- gr-vec-basic-012: SM and SC in a pyramid over a parallelogram ---
// Symbolic identity, checked numerically over pseudo-random u, v, w.
{
  let good = 0;
  for (let i = 0; i < 200; i++) {
    const u: V = [(i % 7) - 3, ((i * 3) % 5) - 2, ((i * 5) % 9) - 4];
    const v: V = [((i * 2) % 8) - 3, (i % 6) - 2, ((i * 7) % 5) - 1];
    const w: V = [((i * 4) % 5) - 1, ((i * 9) % 7) - 3, (i % 4) - 2];
    const A: V = [0, 0, 0];
    const B = mAdd(A, u), D = mAdd(A, v), S = mAdd(A, w);
    const C = mAdd(mAdd(A, u), v);                 // parallelogram base
    const M = mScale(0.5, mAdd(A, C));             // diagonals bisect each other
    const SM = mSub(M, S), SC = mSub(C, S), SA = mSub(A, S);
    const ok =
      mNorm(mSub(SM, mSub(mAdd(mScale(0.5, u), mScale(0.5, v)), w))) < 1e-9 &&
      mNorm(mSub(SC, mSub(mAdd(u, v), w))) < 1e-9 &&
      mNorm(mSub(mScale(0.5, mAdd(SA, SC)), SM)) < 1e-9 &&
      mNorm(mSub(mSub(M, A), mScale(0.5, mAdd(u, v)))) < 1e-9 &&
      mNorm(mSub(M, mScale(0.5, mAdd(B, D)))) < 1e-9;   // M is midpoint of BD too
    if (ok) good++;
  }
  num('ghost basic-012: 200 random (u,v,w) satisfy SM, SC, the identity, AM and both diagonals', good, 200);
}

// --- gr-vec-dot-011: right angle at A ---
{
  const A: V = [1, 0, 2], B: V = [3, 2, 0];
  const AC = (t: number): V => mSub([t, 1, 1], A);
  vec('ghost dot-011: AB = (2,2,-2)', mSub(B, A), [2, 2, -2]);
  num('ghost dot-011: AB.AC = 2t+2 at t=3.5', mDot(mSub(B, A), AC(3.5)), 9);
  num('ghost dot-011: t=-1 gives 0', mDot(mSub(B, A), AC(-1)), 0);
  vec('ghost dot-011: AC at t=-1 is (-2,1,-1)', AC(-1), [-2, 1, -1]);
  num('ghost dot-011 branch: t=1 (sign slip) leaves 4, not 0', mDot(mSub(B, A), AC(1)), 4);
  num('ghost dot-011 branch: t=0 (C used as AC) leaves 2, not 0', mDot(mSub(B, A), AC(0)), 2);
  num('ghost dot-011 branch: t=3 leaves 8, not 0', mDot(mSub(B, A), AC(3)), 8);
  num('ghost dot-011 branch: CA reversed still roots at t=-1 — branch says so', mDot(mSub(B, A), mSub(A, AC(-1) as V)) === 0 ? 0 : mDot(mSub(B, A), mScale(-1, AC(-1))), 0);
  num('ghost dot-011 branch: |AB| = 2sqrt3 and |AC| = sqrt6, so NOT isosceles', mNorm(mSub(B, A)) - 2 * Math.sqrt(3), 0);
  num('ghost dot-011 branch: |AC| at t=-1 is sqrt6', mNorm(AC(-1)), Math.sqrt(6));
}

// --- gr-vec-cross-011: parallelogram vertex + area ---
{
  const A: V = [2, 1, 0], B: V = [5, 1, 0], D: V = [2, 4, 3];
  const AB = mSub(B, A), AD = mSub(D, A);
  vec('ghost cross-011: C = B + AD = (5,4,3)', mAdd(B, AD), [5, 4, 3]);
  vec('ghost cross-011: cross = (0,-9,9)', mCross(AB, AD), [0, -9, 9]);
  num('ghost cross-011: area = 9sqrt2', mNorm(mCross(AB, AD)), 9 * Math.SQRT2);
  num('ghost cross-011: AB.AD = 0 — it is secretly a RECTANGLE', mDot(AB, AD), 0);
  num('ghost cross-011: |AB|*|AD| coincides with the area here', mNorm(AB) * mNorm(AD), 9 * Math.SQRT2);
  num('ghost cross-011: on a NON-rectangle the shortcut overshoots (13.08 vs 12.73)',
    Math.round((mNorm([3, 0, 0]) * mNorm([1, 3, 3]) - mNorm(mCross([3, 0, 0], [1, 3, 3]))) * 1e6) > 0 ? 1 : 0, 1);
  vec('ghost cross-011 branch: A+B+D = (9,6,3)', mAdd(mAdd(A, B), D), [9, 6, 3]);
  vec('ghost cross-011 branch: B + DA = (5,-2,-3)', mAdd(B, mSub(A, D)), [5, -2, -3]);
  vec('ghost cross-011 branch: D + DA = A = (2,1,0)', mAdd(D, mSub(A, D)), [2, 1, 0]);
  num('ghost cross-011 branch: (0,9,9) is a WRONG vector with the SAME magnitude', mNorm([0, 9, 9]), 9 * Math.SQRT2);
  num('ghost cross-011 branch: half the cross is the triangle', mNorm(mCross(AB, AD)) / 2, 4.5 * Math.SQRT2);
  num('ghost cross-011 branch: sum-of-lengths is not area, |AB|=3', mNorm(AB), 3);
  num('ghost cross-011: |AD| = 3sqrt2', mNorm(AD), 3 * Math.SQRT2);
}

// --- gr-vec-lp-011: plane containing AC, parallel to SD ---
{
  const AC: V = [6, 18, 0], SD: V = [6, 8, -12], n: V = [18, -6, 5];
  num('ghost lp-011: n.AC = 0', mDot(n, AC), 0);
  num('ghost lp-011: n.SD = 0', mDot(n, SD), 0);
  num('ghost lp-011: C(6,18,0) satisfies 18x-6y+5z=0', mDot(n, [6, 18, 0]), 0);
  num('ghost lp-011: A(0,0,0) gives d=0', mDot(n, [0, 0, 0]), 0);
  num('ghost lp-011 branch: (-18,6,5).SD = -120', mDot([-18, 6, 5], SD), -120);
  num('ghost lp-011 branch: (1,3,0).SD = 30', mDot([1, 3, 0], SD), 30);
  num('ghost lp-011 branch: (3,4,-6).AC = 90', mDot([3, 4, -6], AC), 90);
  num('ghost lp-011 branch: 18-6+5 = 17, the traceable "plug something in" slip', 18 - 6 + 5, 17);
  vec('ghost lp-011: AC reduces to (1,3,0)', mScale(1 / 6, AC), [1, 3, 0]);
  vec('ghost lp-011: SD reduces to (3,4,-6)', mScale(1 / 2, SD), [3, 4, -6]);
}

// --- gr-vec-da-005: distance from a point to a line ---
{
  const QP: V = [1, 2, 3], v: V = [1, 1, 0];
  vec('ghost da-005: cross = (-3,3,-1)', mCross(QP, v), [-3, 3, -1]);
  num('ghost da-005: |cross| = sqrt19', mNorm(mCross(QP, v)), Math.sqrt(19));
  num('ghost da-005: d = sqrt38/2', mNorm(mCross(QP, v)) / mNorm(v), Math.sqrt(38) / 2);
  num('ghost da-005: d ~= 3.0822', mNorm(mCross(QP, v)) / mNorm(v), 3.0822070014844885);
  num('ghost da-005: |QP| = sqrt14 ~= 3.7417', mNorm(QP), 3.7416573867739413);
  num('ghost da-005: the projection along the line is 3/sqrt2 ~= 2.1213', mDot(QP, v) / mNorm(v), 2.1213203435596424);
  num('ghost da-005: projection^2 + d^2 = |QP|^2 = 14',
    (mDot(QP, v) / mNorm(v)) ** 2 + (mNorm(mCross(QP, v)) / mNorm(v)) ** 2, 14);
  num('ghost da-005 branch: (-3,-3,-1) is WRONG with the SAME magnitude', mNorm([-3, -3, -1]), Math.sqrt(19));
  num('ghost da-005 branch: component-wise (1,2,0) has magnitude sqrt5', mNorm([1, 2, 0]), Math.sqrt(5));
  num('ghost da-005 branch: QP.v = 3 is the SCALAR product', mDot(QP, v), 3);
  num('ghost da-005 branch: sqrt19/2 ~= 2.1794 (divided by 2, not sqrt2)', Math.sqrt(19) / 2, 2.179449471770337);
  num('ghost da-005 branch: sqrt19 ~= 4.3589 EXCEEDS |QP| — the sanity check kills it',
    Math.sqrt(19) > mNorm(QP) ? 1 : 0, 1);
  num('ghost da-005 branch: sqrt19 - sqrt2 ~= 2.9448, plausible but from a wrong operation',
    Math.sqrt(19) - Math.SQRT2, 2.944685381167579);
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);

export {};
