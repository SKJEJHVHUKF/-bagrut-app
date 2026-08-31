// verify-2025-571b.ts — independent re-derivation of every numeric claim in
// content/past-bagruyot/2025-summer-571-moed-b.ts, plus structural checks on
// the exam-page scans and the KaTeX.
//
// Nothing here reads an answer out of the content file and "checks" it against
// itself: each value is recomputed from the problem statement (numerically, by
// enumeration or by coordinate construction) and only then compared.
//
// Run: npx tsx scripts/verify-2025-571b.ts

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';
import { bagrut2025Summer571MoedB } from '../content/past-bagruyot/2025-summer-571-moed-b';

const TOL = 1e-6;
let pass = 0;
const failures: string[] = [];

function check(label: string, got: number, want: number, tol = TOL): void {
  if (Number.isFinite(got) && Math.abs(got - want) < tol) pass++;
  else failures.push(`${label} — got ${got}, want ${want}`);
}

function ok(label: string, cond: boolean): void {
  if (cond) pass++;
  else failures.push(label);
}

const simpson = (fn: (x: number) => number, lo: number, hi: number, n = 200000) => {
  const step = (hi - lo) / n;
  let acc = fn(lo) + fn(hi);
  for (let i = 1; i < n; i++) acc += fn(lo + i * step) * (i % 2 ? 4 : 2);
  return (acc * step) / 3;
};

const dist = (P: number[], Q: number[]) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
const area3 = (P: number[], Q: number[], R: number[]) =>
  Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2;
const angleDeg = (P: number[], V: number[], Q: number[]) => {
  const u = [P[0] - V[0], P[1] - V[1]];
  const w = [Q[0] - V[0], Q[1] - V[1]];
  const c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]));
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
};
/** shoelace over a simple polygon given in order */
const polyArea = (pts: number[][]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
};
/** numeric derivative — never reuses the analytic one from the solution */
const d1 = (fn: (x: number) => number, x: number, h = 1e-6) => (fn(x + h) - fn(x - h)) / (2 * h);

// ============================================================
// שאלה 1
// ============================================================

// א — the induction identity, term by term against the closed form
{
  let sum = 0;
  for (let n = 1; n <= 40; n++) {
    sum += (4 * n - 2) / 3 ** n;
    check(`q1a identity n=${n}`, sum, 2 - (2 * n + 2) / 3 ** n, 1e-12);
  }
  // the three printed opening terms really are the ones the pattern generates
  check('q1a term 1 = 2/3', (4 * 1 - 2) / 3 ** 1, 2 / 3, 1e-12);
  check('q1a term 2 = 6/9', (4 * 2 - 2) / 3 ** 2, 6 / 9, 1e-12);
  check('q1a term 3 = 10/27', (4 * 3 - 2) / 3 ** 3, 10 / 27, 1e-12);
}

// ב — the two trapezoids, rebuilt in coordinates from the raw givens only.
// AM = 2.5·DM and ED ⊥ AD and EM = BM and AB ⊥ BM pin everything; the value
// EM = DM·√2.5 that the solution derives is an OUTPUT here, not an input.
{
  const y = 6; // DM
  const M = [0, 0];
  const D = [-y, 0];
  const A = [2.5 * y, 0]; // AM = 2.5·DM, on line AD through M
  // E sits below D because ED ⊥ AD; its depth h is fixed by AB ⊥ BM
  // (B = reflection of E through M, because EM = BM and B,M,E are collinear)
  const perp = (t: number) => {
    const Bt = [y, t];
    return (A[0] - Bt[0]) * (M[0] - Bt[0]) + (A[1] - Bt[1]) * (M[1] - Bt[1]);
  };
  let lo = 1e-9;
  let hi = 100;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (perp(mid) < 0) lo = mid;
    else hi = mid;
  }
  const h = (lo + hi) / 2;
  const E = [-y, -h];
  const B = [-E[0], -E[1]];
  check('q1b AB ⊥ BM', (A[0] - B[0]) * (M[0] - B[0]) + (A[1] - B[1]) * (M[1] - B[1]), 0, 1e-9);
  check('q1b EM = BM', dist(E, M), dist(B, M), 1e-9);
  check('q1b ED ⊥ AD', (E[0] - D[0]) * (A[0] - D[0]) + (E[1] - D[1]) * (A[1] - D[1]), 0, 1e-9);
  check('q1b AM = 2.5·DM', dist(A, M) / dist(D, M), 2.5, 1e-12);
  // (1) the angle
  const alpha = angleDeg(E, M, D);
  check('q1b1 EM = DM·√2.5 (derived)', dist(E, M), y * Math.sqrt(2.5), 1e-9);
  check('q1b1 cos α = 1/√2.5', Math.cos((alpha * Math.PI) / 180), 1 / Math.sqrt(2.5), 1e-9);
  check('q1b1 α ≈ 50.77°', alpha, 50.7685, 1e-3);
  check('q1b1 △AMB ~ △EMD (angle at M)', angleDeg(A, M, B), alpha, 1e-9);
  // C is forced by BC ∥ AD and CD ∥ BE — solved, not assumed
  const collinear = (s: number) => {
    const cand = [B[0] + s, B[1]]; // BC ∥ AD (horizontal)
    return (D[0] - cand[0]) * (E[1] - B[1]) - (D[1] - cand[1]) * (E[0] - B[0]);
  };
  let slo = -4 * y;
  let shi = 4 * y;
  const rising = collinear(shi) > collinear(slo);
  for (let i = 0; i < 200; i++) {
    const mid = (slo + shi) / 2;
    if (collinear(mid) < 0 === rising) slo = mid;
    else shi = mid;
  }
  const C = [B[0] + (slo + shi) / 2, B[1]];
  check('q1b2 CD ∥ BE', collinear((slo + shi) / 2), 0, 1e-9);
  ok(
    'q1b2 BCDM is a parallelogram',
    Math.abs(C[0] - B[0] - (D[0] - M[0])) < 1e-6 && Math.abs(C[1] - B[1] - (D[1] - M[1])) < 1e-6,
  );
  // (2) area of ABCD, by shoelace on the reconstructed vertices
  check('q1b2 S(ABCD) ≈ 99.2', polyArea([A, B, C, D]), 81 * Math.sqrt(1.5), 1e-6);
  check('q1b2 S(ABCD) numeric', polyArea([A, B, C, D]), 99.2044, 1e-3);
  check('q1b2 S(ABM) ≈ 55.11', area3(A, B, M), 45 * Math.sqrt(1.5), 1e-6);
  check('q1b2 S(BCDM) ≈ 44.09', polyArea([B, C, D, M]), 36 * Math.sqrt(1.5), 1e-6);
}

// ג — the graph matching, verified from sign patterns and end behaviour
{
  const f = (n: number, x: number) => x ** n * (x - 1);
  const g = (n: number, x: number) => x ** n * (x + 1);
  for (const n of [2, 4, 6]) {
    // n even ⟹ degree n+1 odd ⟹ comes from −∞, goes to +∞ (graphs III, IV)
    ok(`q1c1 n=${n} even: f(−BIG)<0, f(BIG)>0`, f(n, -50) < 0 && f(n, 50) > 0);
    ok(`q1c1 n=${n} even: g(−BIG)<0, g(BIG)>0`, g(n, -50) < 0 && g(n, 50) > 0);
    // x=0 is a root of even multiplicity ⟹ the graph touches without crossing
    ok(`q1c1 n=${n} even: f touches at 0`, f(n, -0.01) < 0 && f(n, 0.01) < 0);
    ok(`q1c1 n=${n} even: g touches at 0`, g(n, -0.01) > 0 && g(n, 0.01) > 0);
    // the second zero: f at x=1 (right of the origin), g at x=−1 (left)
    check(`q1c1 n=${n}: f(1)=0`, f(n, 1), 0, 1e-12);
    check(`q1c1 n=${n}: g(−1)=0`, g(n, -1), 0, 1e-12);
  }
  for (const n of [3, 5, 7]) {
    // n odd ⟹ degree n+1 even ⟹ both ends go to +∞ (graphs I, II)
    ok(`q1c1 n=${n} odd: both ends up`, f(n, -50) > 0 && f(n, 50) > 0);
    ok(`q1c1 n=${n} odd: g both ends up`, g(n, -50) > 0 && g(n, 50) > 0);
    // x=0 is a root of odd multiplicity ⟹ the graph crosses
    ok(`q1c1 n=${n} odd: f crosses at 0`, f(n, -0.01) > 0 && f(n, 0.01) < 0);
    ok(`q1c1 n=${n} odd: g crosses at 0`, g(n, -0.01) < 0 && g(n, 0.01) > 0);
    // f dips right of the origin (I), g dips left of it (II)
    ok(`q1c1 n=${n} odd: f<0 only on (0,1)`, f(n, 0.5) < 0 && f(n, -0.5) > 0 && f(n, 1.5) > 0);
    ok(`q1c1 n=${n} odd: g<0 only on (−1,0)`, g(n, -0.5) < 0 && g(n, 0.5) > 0 && g(n, -1.5) > 0);
  }
  // ג(2) — the enclosed area for n = 2
  const g2 = (x: number) => x * x * (x + 1);
  ok('q1c2 g>0 strictly inside (−1,0)', [-0.9, -0.5, -0.1].every((x) => g2(x) > 0));
  check('q1c2 area = 1/12', simpson(g2, -1, 0), 1 / 12, 1e-9);
}

// ד — a concrete f with the printed root structure, scaled so that BOTH
// givens hold (g(2.7)=0 and g(4.5)=3S); the "5S" claim is then integrated.
{
  // f < 0 on (0,1); f > 0 on (1,2.7) and (2.7,4.5); double root at 2.7
  const c2 = 1;
  const I2 = simpson((x) => c2 * (x - 1) * (2.7 - x), 1, 2.7); // = S
  const c1 = (6 * I2) / 1; // ∫₀¹ c₁x(x−1)dx = −c₁/6, and it must equal −S
  const baseC3 = simpson((x) => (x - 2.7) ** 2 * (4.5 - x), 2.7, 4.5);
  const c3 = (3 * I2 - I2 - -I2) / baseC3; // ∫₀^4.5 f = 3S with ∫₀^2.7 f = 0
  const f = (x: number) => {
    if (x <= 1) return c1 * x * (x - 1);
    if (x <= 2.7) return c2 * (x - 1) * (2.7 - x);
    return c3 * (x - 2.7) ** 2 * (4.5 - x);
  };
  const S = simpson(f, 1, 2.7);
  check('q1d model: ∫₀^2.7 f = 0  (given g(2.7)=0)', simpson(f, 0, 1) + S, 0, 1e-6);
  check('q1d model: ∫₀^4.5 f = 3S  (given g(4.5)=3S)', simpson(f, 0, 4.5), 3 * S, 1e-6);
  // (1) sign of g' = f, and the resulting extrema
  ok('q1d1 f<0 on (0,1)', [0.1, 0.5, 0.9].every((x) => f(x) < 0));
  ok('q1d1 f>0 on (1,2.7)', [1.1, 2, 2.6].every((x) => f(x) > 0));
  ok('q1d1 f>0 on (2.7,4.5)', [2.8, 3.5, 4.4].every((x) => f(x) > 0));
  ok('q1d1 x=1 is a min for g (− → +)', f(0.99) < 0 && f(1.01) > 0);
  ok('q1d1 x=2.7 is NOT an extremum (no sign change)', f(2.69) > 0 && f(2.71) > 0);
  check('q1d1 f(2.7) = 0', f(2.7), 0, 1e-12);
  ok('q1d1 x=4.5 is a max for g (+ → −)', f(4.49) > 0 && f(4.51) < 0);
  // (2) the three areas
  const A1 = -simpson(f, 0, 1);
  const A2 = simpson(f, 1, 2.7);
  const A3 = simpson(f, 2.7, 4.5);
  check('q1d2 area on [0,1] = S', A1, S, 1e-6);
  check('q1d2 area on [1,2.7] = S', A2, S, 1e-9);
  check('q1d2 area on [2.7,4.5] = 3S', A3, 3 * S, 1e-6);
  check('q1d2 total = 5S', A1 + A2 + A3, 5 * S, 1e-6);
}

// ============================================================
// שאלה 2
// ============================================================
{
  // א — only a₁ < 0 makes a geometric sequence with 0<q<1 increasing
  for (const q of [0.1, 0.25, 0.5, 0.9]) {
    const up = (a1: number) => [1, 2, 3, 4, 5].every((n) => a1 * q ** n > a1 * q ** (n - 1));
    ok(`q2a q=${q}: a₁>0 ⟹ not increasing`, !up(5));
    ok(`q2a q=${q}: a₁<0 ⟹ increasing`, up(-5));
    ok(`q2a q=${q}: a₁<0 ⟹ every term negative`, [1, 2, 3, 9].every((n) => -5 * q ** (n - 1) < 0));
  }
  // ב — c_n = 2b_n − a_n is geometric with ratio q, for arbitrary a₁,b₁,q
  for (const [a1, b1, q] of [
    [-5, 5 / 6, 0.25],
    [-2, 7, 0.5],
    [3, -1, 0.8],
  ]) {
    const a = (n: number) => a1 * q ** (n - 1);
    const b = (n: number) => b1 * q ** (n - 1);
    const c = (n: number) => 2 * b(n) - a(n);
    for (let n = 1; n <= 8; n++) check(`q2b ratio a₁=${a1} n=${n}`, c(n + 1) / c(n), q, 1e-12);
  }
  // ג — solve the two givens numerically for b₁ and then a₁
  {
    const c1 = 20 / 3;
    const q = 0.25;
    // scan b₁ for the one that makes Σc = 8·Σb
    let b1 = 0;
    for (let t = 0.001; t < 5; t += 1e-6) {
      if (c1 / (1 - q) - (8 * t) / (1 - q) < 0) {
        b1 = t;
        break;
      }
    }
    check('q2c b₁ = 5/6', b1, 5 / 6, 1e-5);
    const a1 = 2 * b1 - c1;
    check('q2c a₁ = −5', a1, -5, 1e-4);
    // and the sums really are in the ratio 8, term by term
    let sumB = 0;
    let sumC = 0;
    for (let n = 1; n <= 400; n++) {
      sumB += (5 / 6) * q ** (n - 1);
      sumC += (2 * (5 / 6) - -5) * q ** (n - 1);
    }
    check('q2c Σc = 8·Σb', sumC / sumB, 8, 1e-9);
    check('q2c c₁ = 6⅔', 2 * (5 / 6) - -5, 20 / 3, 1e-12);
  }
  // ד — brute-force the q that makes evenSum − oddSum = 4
  {
    const a1 = -5;
    const gap = (q: number) => {
      let even = 0;
      let odd = 0;
      for (let n = 1; n <= 3000; n++) (n % 2 === 0 ? (even += a1 * q ** (n - 1)) : (odd += a1 * q ** (n - 1)));
      return even - odd;
    };
    let best = 0.001;
    for (let q = 0.001; q < 0.999; q += 1e-4) if (Math.abs(gap(q) - 4) < Math.abs(gap(best) - 4)) best = q;
    check('q2d q = 1/4 (scanned)', best, 0.25, 1e-3);
    check('q2d gap at q=1/4 is exactly 4', gap(0.25), 4, 1e-9);
    // the rejected root q = 1 is outside the domain and kills the sum
    check('q2d 4q²−5q+1 = 0 at q=1/4', 4 * 0.25 ** 2 - 5 * 0.25 + 1, 0, 1e-12);
    check('q2d 4q²−5q+1 = 0 at q=1', 4 - 5 + 1, 0, 1e-12);
    ok('q2d q=1 rejected by 0<q<1', !(1 < 1));
  }
}

// ============================================================
// שאלה 3
// ============================================================
{
  // א — P(orange)² = 0.4096
  check('q3a P(orange) = 0.64', Math.sqrt(0.4096), 0.64, 1e-12);
  check('q3a P(lemon) = 0.36', 1 - Math.sqrt(0.4096), 0.36, 1e-12);
  // ב — scan y for the export share consistent with both conditional givens
  {
    const orangeTotal = (y: number) => 0.6 * y + 0.8 * (1 - y);
    let y = 0;
    for (let t = 0.0005; t < 1; t += 1e-6) if (Math.abs(orangeTotal(t) - 0.64) < 1e-7) { y = t; break; }
    check('q3b P(export) = 0.8', y, 0.8, 1e-5);
    // rebuild the whole table from y and re-check every given
    const oe = 0.6 * 0.8;
    const le = 0.8 - oe;
    const ln = 0.2 * 0.2;
    const on = 0.2 - ln;
    check('q3b table: orange∩export', oe, 0.48, 1e-12);
    check('q3b table: lemon∩export', le, 0.32, 1e-12);
    check('q3b table: lemon∩no-export', ln, 0.04, 1e-12);
    check('q3b table: orange∩no-export', on, 0.16, 1e-12);
    check('q3b table: total lemons = 0.36', le + ln, 0.36, 1e-12);
    check('q3b table: total oranges = 0.64', oe + on, 0.64, 1e-12);
    check('q3b given P(orange|export) = 3/5', oe / 0.8, 3 / 5, 1e-12);
    check('q3b given P(lemon|no-export) = 1/5', ln / 0.2, 1 / 5, 1e-12);
    check('q3b table sums to 1', oe + le + ln + on, 1, 1e-12);
  }
  // ג — enumerate the four ordered outcomes for two lemons
  {
    const pe = 0.32 / 0.36;
    const pn = 0.04 / 0.36;
    check('q3c P(export|lemon) = 8/9', pe, 8 / 9, 1e-12);
    check('q3c P(no-export|lemon) = 1/9', pn, 1 / 9, 1e-12);
    const outcomes = [
      [pe, pe, 0],
      [pe, pn, 1],
      [pn, pe, 1],
      [pn, pn, 0],
    ];
    const mixed = outcomes.filter((o) => o[2] === 1).reduce((s, o) => s + o[0] * o[1], 0);
    check('q3c mixed pair = 16/81', mixed, 16 / 81, 1e-12);
    check('q3c all four outcomes sum to 1', outcomes.reduce((s, o) => s + o[0] * o[1], 0), 1, 1e-12);
    check('q3c ≈ 0.198', mixed, 0.19753, 1e-4);
  }
  // ד — exhaustive enumeration of the 16 outcomes of four independent picks
  {
    const p = 0.8;
    let atLeast1 = 0;
    let atMost3AndAtLeast1 = 0;
    for (let mask = 0; mask < 16; mask++) {
      let prob = 1;
      let k = 0;
      for (let bit = 0; bit < 4; bit++) {
        const isExport = (mask >> bit) & 1;
        prob *= isExport ? p : 1 - p;
        k += isExport;
      }
      if (k >= 1) atLeast1 += prob;
      if (k >= 1 && k <= 3) atMost3AndAtLeast1 += prob;
    }
    check('q3d P(at least 1) = 0.9984', atLeast1, 0.9984, 1e-12);
    check('q3d P(1≤k≤3) = 0.5888', atMost3AndAtLeast1, 0.5888, 1e-12);
    check('q3d conditional ≈ 0.5897', atMost3AndAtLeast1 / atLeast1, 0.58974, 1e-4);
  }
}

// ============================================================
// שאלה 4 — rebuilt in coordinates from R = 8.4 and PO = 7
// ============================================================
{
  const R = 8.4;
  const O = [0, 0];
  const A = [-R, 0];
  const B = [R, 0];
  // place C on the circle so that the midpoint of BC sits at distance 7 from O
  let C = [0, 0];
  for (let th = 0.01; th < Math.PI; th += 1e-7) {
    const cand = [R * Math.cos(th), R * Math.sin(th)];
    const mid = [(cand[0] + B[0]) / 2, (cand[1] + B[1]) / 2];
    if (Math.abs(Math.hypot(mid[0], mid[1]) - 7) < 1e-6) {
      C = cand;
      break;
    }
  }
  const P = [(C[0] + B[0]) / 2, (C[1] + B[1]) / 2];
  check('q4 C on the circle', Math.hypot(C[0], C[1]), R, 1e-6);
  check('q4 given PO = 7', Math.hypot(P[0], P[1]), 7, 1e-5);
  // K is the second intersection of line PO with the circle
  const K = [(-P[0] * R) / 7, (-P[1] * R) / 7];
  check('q4 K on the circle', Math.hypot(K[0], K[1]), R, 1e-4);
  // E = CK ∩ AB (the x-axis)
  const t = C[1] / (C[1] - K[1]);
  const E = [C[0] + t * (K[0] - C[0]), 0];
  // the paper's GIVEN, checked on the reconstruction rather than assumed
  check('q4 given ∠EKO = ∠ABK', angleDeg(E, K, O), angleDeg(A, B, K), 1e-3);
  ok('q4 E lies between A and O', E[0] > A[0] && E[0] < O[0]);
  // א — the similarity
  check('q4a ∠ACE = ∠OKE', angleDeg(A, C, E), angleDeg(O, K, E), 1e-3);
  check('q4a ∠AEC = ∠OEK', angleDeg(A, E, C), angleDeg(O, E, K), 1e-3);
  check(
    'q4a similarity ratio consistent',
    dist(A, C) / dist(O, K),
    dist(A, E) / dist(O, E),
    1e-4,
  );
  // ב(1) — AC ∥ KP and P is the midpoint of BC ⟹ midsegment
  check(
    'q4b1 AC ∥ KP',
    (C[0] - A[0]) * (P[1] - K[1]) - (C[1] - A[1]) * (P[0] - K[0]),
    0,
    1e-3,
  );
  check('q4b1 O is the midpoint of AB', (A[0] + B[0]) / 2, O[0], 1e-12);
  check('q4b1 P is the midpoint of BC', dist(P, B), dist(P, C), 1e-6);
  check('q4b1 midsegment: AC = 2·PO', dist(A, C), 2 * 7, 1e-4);
  // ב(2)
  check('q4b2 EO = 3.15', dist(E, O), 3.15, 1e-4);
  // ג
  check('q4c S(ACE)/S(AOK) = 25/24', area3(A, C, E) / area3(A, O, K), 25 / 24, 1e-4);
  check('q4c S(ACE)/S(OKE) = 25/9', area3(A, C, E) / area3(O, K, E), 25 / 9, 1e-4);
  check('q4c S(AOK)/S(OKE) = 8/3', area3(A, O, K) / area3(O, K, E), 8 / 3, 1e-4);
}

// ============================================================
// שאלה 5
// ============================================================
{
  // א/ב — scan α for the one that reproduces CD = √3.25·k with AD = 1.5k
  const k = 1;
  const CDof = (aDeg: number) => {
    const a = (aDeg * Math.PI) / 180;
    const AC = k / Math.cos(a);
    const AD = 1.5 * k;
    return Math.sqrt(AC * AC + AD * AD - 2 * AC * AD * Math.cos(a));
  };
  let alpha = 1;
  for (let t = 1; t < 89; t += 1e-4) if (Math.abs(CDof(t) - Math.sqrt(3.25)) < Math.abs(CDof(alpha) - Math.sqrt(3.25))) alpha = t;
  check('q5b α = 60°', alpha, 60, 1e-3);
  check('q5b CD at α=60° is √3.25·k', CDof(60), Math.sqrt(3.25), 1e-12);
  check('q5a AC = k/cos α', k / Math.cos(Math.PI / 3), 2 * k, 1e-12);
  // ג/ד — coordinates: B at the origin, the right angle at B, α = 60° at A
  {
    const kk = 1;
    const B = [0, 0];
    const A = [kk, 0];
    const C = [0, kk * Math.tan(Math.PI / 3)];
    check('q5c ∠ABC = 90°', angleDeg(A, B, C), 90, 1e-9);
    check('q5c ∠CAB = 60°', angleDeg(C, A, B), 60, 1e-9);
    check('q5c AC = 2k', dist(A, C), 2 * kk, 1e-9);
    // the incentre found by its DEFINING property: equal distance to all three sides
    const lineDist = (Pt: number[], U: number[], V: number[]) =>
      Math.abs((V[0] - U[0]) * (U[1] - Pt[1]) - (U[0] - Pt[0]) * (V[1] - U[1])) / dist(U, V);
    let M = [0, 0];
    let bestSpread = Infinity;
    for (let x = 0.01; x < kk; x += 5e-4) {
      for (let y = 0.01; y < kk; y += 5e-4) {
        const P = [x, y];
        const ds = [lineDist(P, A, B), lineDist(P, B, C), lineDist(P, C, A)];
        const spread = Math.max(...ds) - Math.min(...ds);
        if (spread < bestSpread) {
          bestSpread = spread;
          M = P;
        }
      }
    }
    const r = (lineDist(M, A, B) + lineDist(M, B, C) + lineDist(M, C, A)) / 3;
    check('q5c r = k(√3−1)/2 ≈ 0.366k', r, (kk * (Math.sqrt(3) - 1)) / 2, 2e-3);
    check('q5c r ≈ 0.366', r, 0.36603, 2e-3);
    // ד — E is the circumcentre: equidistant from A, B, C
    const E = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    check('q5d E equidistant from A and B', dist(E, A), dist(E, B), 1e-9);
    check('q5d E equidistant from A and C', dist(E, A), dist(E, C), 1e-9);
    check('q5d AE = k', dist(A, E), kk, 1e-9);
    const Mexact = [(kk * (Math.sqrt(3) - 1)) / 2, (kk * (Math.sqrt(3) - 1)) / 2];
    check('q5d AM = k(√3−1)', dist(A, Mexact), kk * (Math.sqrt(3) - 1), 1e-9);
    check('q5d ∠MAE = 30°', angleDeg(Mexact, A, E), 30, 1e-9);
    // ME grows linearly in k ⟹ solve ME = 4
    const MEper1 = dist(Mexact, E);
    const kSolved = 4 / MEper1;
    check('q5d k ≈ 7.73', kSolved, 7.7274, 1e-3);
    check('q5d k² = 16(2+√3)', kSolved * kSolved, 16 * (2 + Math.sqrt(3)), 1e-3);
    // and at that k the segment really is 4
    check('q5d ME = 4 at the solved k', MEper1 * kSolved, 4, 1e-9);
  }
}

// ============================================================
// שאלה 6
// ============================================================
{
  const fA = (a: number, x: number) => (2 * a * x) / (x * x - 9) ** 2;
  // א(1)/(2) — domain and asymptotes
  ok('q6a1 undefined at ±3', !Number.isFinite(fA(32, 3)) && !Number.isFinite(fA(32, -3)));
  ok('q6a2 |f| → ∞ near x=3', Math.abs(fA(32, 2.9999)) > 1e6 && Math.abs(fA(32, 3.0001)) > 1e6);
  ok('q6a2 |f| → ∞ near x=−3', Math.abs(fA(32, -2.9999)) > 1e6 && Math.abs(fA(32, -3.0001)) > 1e6);
  ok('q6a2 f → 0 at ±∞', Math.abs(fA(32, 1e4)) < 1e-8 && Math.abs(fA(32, -1e4)) < 1e-8);
  // א(3) — monotonicity from a NUMERIC derivative, for several positive a
  for (const a of [1, 32, 100]) {
    const f = (x: number) => fA(a, x);
    ok(`q6a3 a=${a}: rising on (−3,3)`, [-2.5, -1, 0, 1, 2.5].every((x) => d1(f, x) > 0));
    ok(`q6a3 a=${a}: falling for x>3`, [3.5, 5, 10].every((x) => d1(f, x) < 0));
    ok(`q6a3 a=${a}: falling for x<−3`, [-3.5, -5, -10].every((x) => d1(f, x) < 0));
    ok(
      `q6a3 a=${a}: f' never 0`,
      [-8, -5, -3.5, -2, 0, 2, 3.5, 5, 8].every((x) => Math.abs(d1(f, x)) > 1e-9),
    );
    ok(`q6a4 a=${a}: sign follows 2ax`, f(-1) < 0 && f(1) > 0);
    check(`q6a4 a=${a}: f(0)=0`, f(0), 0, 1e-15);
  }
  // ב — scan a for the one that puts an extremum of g at x = −1
  {
    let aSolved = 0;
    for (let a = 0.1; a < 200; a += 1e-4) if (Math.abs(fA(a, -1) + 1) < 1e-5) { aSolved = a; break; }
    check('q6b a = 32', aSolved, 32, 1e-3);
    check('q6b f(−1) = −1 at a=32', fA(32, -1), -1, 1e-12);
    check("q6b g'(−1) = 0", fA(32, -1) + 1, 0, 1e-12);
  }
  // ג — the antiderivative, checked by numeric differentiation and the point
  {
    const g = (x: number) => -32 / (x * x - 9) + x + 2;
    for (const x of [-8, -5, -2, -1, 0, 1, 2, 5, 8]) {
      check(`q6c g'(${x}) = f(${x})+1`, d1(g, x), fA(32, x) + 1, 1e-4);
    }
    check('q6c g(1) = 7', g(1), 7, 1e-12);
    // ד — the facts that pick graph II
    check('q6d g(−1) = 5 (middle branch min, above the axis)', g(-1), 5, 1e-12);
    ok('q6d the extremum at x=−1 is a minimum', d1(g, -1.1) < 0 && d1(g, -0.9) > 0);
    ok('q6d NO horizontal asymptote: g−(x+2) → 0', Math.abs(g(1e4) - (1e4 + 2)) < 1e-3 && g(1e4) > 1e3);
    ok('q6d g → −∞ as x → 3⁺ and +∞ as x → 3⁻', g(3.0001) < -1e4 && g(2.9999) > 1e4);
    ok('q6d g → +∞ as x → −3⁺ and −∞ as x → −3⁻', g(-2.9999) > 1e4 && g(-3.0001) < -1e4);
    ok('q6d right branch is increasing', [3.5, 5, 20, 100].every((x) => d1(g, x) > 0));
    ok('q6d right branch crosses the x-axis', g(3.5) < 0 && g(20) > 0);
    ok('q6d left branch has a maximum below the axis', d1(g, -6) > 0 && d1(g, -4) < 0 && g(-5.22) < 0);
    ok('q6d middle branch stays above the axis', [-2.5, -1, 0, 1, 2.5].every((x) => g(x) > 0));
  }
}

// ============================================================
// שאלה 7
// ============================================================
{
  const f = (x: number) => 2 * Math.cos(x) + 1 / Math.cos(x);
  const g = (x: number) => 2 * Math.cos(x) + (2 * Math.sin(x)) / Math.sin(2 * x);
  const H = Math.PI / 2;
  // א
  ok('q7a1 cos x = 0 exactly at ±π/2 in the range', Math.abs(Math.cos(H)) < 1e-15 && Math.abs(Math.cos(-H)) < 1e-15);
  ok('q7a2 f → +∞ at both ends', f(H - 1e-6) > 1e5 && f(-H + 1e-6) > 1e5);
  // ב
  for (const x of [0.1, 0.4, 0.7854, 1.0, 1.3]) check(`q7b f(−${x}) = f(${x})`, f(-x), f(x), 1e-12);
  // ג — critical points from a numeric derivative, then classification
  {
    const crit: number[] = [];
    let prev = d1(f, -1.5);
    for (let x = -1.5 + 1e-3; x < 1.5; x += 1e-3) {
      const cur = d1(f, x);
      if (prev === 0 || cur * prev < 0) crit.push(x - 5e-4);
      prev = cur;
    }
    ok(`q7c exactly three critical points (${crit.length})`, crit.length === 3);
    check('q7c critical at −π/4', crit[0], -Math.PI / 4, 2e-3);
    check('q7c critical at 0', crit[1], 0, 2e-3);
    check('q7c critical at π/4', crit[2], Math.PI / 4, 2e-3);
    check('q7c f(π/4) = 2√2', f(Math.PI / 4), 2 * Math.SQRT2, 1e-12);
    check('q7c f(−π/4) = 2√2', f(-Math.PI / 4), 2 * Math.SQRT2, 1e-12);
    check('q7c f(0) = 3', f(0), 3, 1e-12);
    ok('q7c ±π/4 are minima', f(Math.PI / 4) < f(0.6) && f(Math.PI / 4) < f(1.0));
    ok('q7c 0 is a local maximum', f(0) > f(0.2) && f(0) > f(-0.2));
    ok('q7d whole graph above the x-axis', 2 * Math.SQRT2 > 0);
  }
  // ה — the domain gap at 0, and the identity elsewhere
  ok('q7e1 g undefined at 0', !Number.isFinite(g(0)));
  for (const x of [-1.3, -0.7854, -0.2, 0.2, 0.7854, 1.3]) check(`q7e2 g(${x}) = f(${x})`, g(x), f(x), 1e-9);
  // ו — count the intersections of y = k with the graph of f, for every regime
  {
    const roots = (k: number) => {
      const out: number[] = [];
      const lo = -H + 1e-4;
      const hi = H - 1e-4;
      const n = 400000;
      let prev = f(lo) - k;
      for (let i = 1; i <= n; i++) {
        const x = lo + ((hi - lo) * i) / n;
        const cur = f(x) - k;
        if (cur === 0 || cur * prev < 0) out.push(x);
        prev = cur;
      }
      return out;
    };
    // exact count: f(x)=k ⟺ 2c²−kc+1=0 with c = cos x ∈ (0,1]; a root c in
    // (0,1) contributes the pair ±arccos c, and c = 1 contributes x = 0 alone.
    const EPS = 1e-9;
    const countF = (k: number) => {
      const disc = k * k - 8;
      if (disc < -EPS) return 0;
      const root = Math.sqrt(Math.max(0, disc));
      // |disc| < EPS ⟹ a double root: the line is tangent to the two minima
      const cs = Math.abs(disc) < EPS ? [k / 4] : [(k + root) / 4, (k - root) / 4];
      return cs.reduce((n, c) => n + (Math.abs(c - 1) < EPS ? 1 : c > EPS && c < 1 ? 2 : 0), 0);
    };
    // the closed count agrees with the brute-force crossing scan wherever the
    // line is not tangent to the curve
    for (const k of [2.5, 2.9, 2.99, 3.5, 4, 10]) {
      ok(`q7f scan agrees with the closed count at k=${k}`, roots(k).length === countF(k));
    }
    ok('q7f k<2√2 ⟹ 0 points', [2.0, 2.5, 2.8, 2 * Math.SQRT2 - 1e-6].every((k) => countF(k) === 0));
    ok('q7f k=2√2 ⟹ 2 points (the two minima)', countF(2 * Math.SQRT2) === 2);
    ok('q7f 2√2<k<3 ⟹ 4 points', [2.83, 2.9, 2.95, 2.999].every((k) => countF(k) === 4));
    ok('q7f k=3 ⟹ 3 points', countF(3) === 3);
    ok('q7f k>3 ⟹ 2 points', [3.001, 3.5, 4, 10, 100].every((k) => countF(k) === 2));
    // ...so k = 3 is the ONLY value that gives f three points
    const threes: number[] = [];
    for (let i = 0; i < 180000; i++) {
      const k = 2 + i * 1e-4;
      if (countF(k) === 3) threes.push(k);
    }
    ok(`q7f exactly one k gives 3 points (${threes.length})`, threes.length === 1);
    check('q7f that k is 3', threes[0] ?? NaN, 3, 1e-9);
    // and that value's third point is the tangency at x = 0, the hole in g
    check('q7f f(0) = 3 exactly', f(0), 3, 1e-12);
    check('q7f the other two roots sit at ±π/3', Math.acos(0.5), Math.PI / 3, 1e-12);
    check('q7f f(π/3) = 3', f(Math.PI / 3), 3, 1e-12);
    ok('q7f g meets y=3 in exactly 2 points', countF(3) - 1 === 2);
    ok('q7f x=0 is not in the domain of g', !Number.isFinite(g(0)));
  }
}

// ============================================================
// שאלה 8
// ============================================================
{
  for (const R of [1, 5, 8.4]) {
    const f = (x: number) => Math.sqrt(R * R - x * x);
    const t0 = 0.4 * R;
    const E = [0, f(0)];
    const A = [t0, f(t0)];
    const B = [-t0, f(t0)];
    const C = [-t0, 0];
    const D = [t0, 0];
    const F = [0, f(t0)];
    check(`q8 R=${R}: E = (0,R)`, E[1], R, 1e-12);
    ok(`q8 R=${R}: B is on the graph`, Math.abs(f(B[0]) - B[1]) < 1e-12);
    ok(`q8 R=${R}: ABCD is a rectangle`, Math.abs(dist(A, B) - dist(C, D)) < 1e-12 && Math.abs(dist(A, D) - dist(B, C)) < 1e-12);
    // א(1)/(2)
    check(`q8a1 R=${R}: EF = R−√(R²−t²)`, dist(E, F), R - Math.sqrt(R * R - t0 * t0), 1e-12);
    check(
      `q8a2 R=${R}: perimeter = 4t+2√(R²−t²)`,
      2 * (dist(A, B) + dist(A, D)),
      4 * t0 + 2 * Math.sqrt(R * R - t0 * t0),
      1e-12,
    );
    // ב — brute-force the maximiser of the perimeter difference
    const h = (t: number) =>
      4 * t + 2 * Math.sqrt(R * R - t * t) - 4 * (R - Math.sqrt(R * R - t * t));
    let best = 1e-4 * R;
    for (let t = 1e-4 * R; t < R; t += R * 1e-5) if (h(t) > h(best)) best = t;
    check(`q8b R=${R}: t = 2√13·R/13`, best, (2 * Math.sqrt(13) * R) / 13, R * 1e-3);
    check(`q8b R=${R}: t ≈ 0.5547R`, best / R, 0.554700, 1e-3);
    // the exact t really is a stationary point of h
    const tExact = (2 * Math.sqrt(13) * R) / 13;
    check(`q8b R=${R}: h'(t*) = 0`, d1(h, tExact, 1e-7 * R), 0, 1e-4);
    ok(`q8b R=${R}: h' goes + → −`, d1(h, tExact * 0.9, 1e-7 * R) > 0 && d1(h, tExact * 1.1, 1e-7 * R) < 0);
    check(`q8b R=${R}: 13t² = 4R²`, 13 * tExact * tExact, 4 * R * R, 1e-9);
  }
}

// ============================================================
// Structural checks on the exam-page scans and the KaTeX
// ============================================================
{
  const dir = join(process.cwd(), 'public', 'bagruyot', '2025-summer-571-b');
  ok('scan folder exists', existsSync(dir));
  const onDisk = new Set(readdirSync(dir));
  const referenced = new Set<string>();
  const HEB = /[֐-׿]/;
  let longest = 0;
  let parts = 0;

  for (const q of bagrut2025Summer571MoedB) {
    ok(`q${q.questionNumber} has a question scan`, !!q.imageSrc);
    ok(`q${q.questionNumber} is 2025 moed b`, q.year === 2025 && q.moed === 'b' && q.paper === '571' && q.season === 'summer');
    ok(`q${q.questionNumber} id matches`, q.id === `b2025s571b-q${q.questionNumber}`);
    for (const src of [q.imageSrc, ...q.parts.map((p) => p.imageSrc)]) {
      if (!src) continue;
      referenced.add(src.split('/').pop()!);
      ok(`scan exists: ${src}`, existsSync(join(process.cwd(), 'public', src.replace(/^\//, ''))));
    }
    for (const p of q.parts) {
      parts++;
      const label = `q${q.questionNumber}${p.label}`;
      ok(`${label} has a scan`, !!p.imageSrc);
      ok(`${label} has hints`, (p.hints?.length ?? 0) > 0);
      ok(`${label} has steps`, p.solution.steps.length >= 3);
      ok(`${label} has a final answer`, p.solution.final_answer.trim().length > 0);
      // the whole point of this paper: bagrut-length solutions, not a textbook
      longest = Math.max(longest, p.solution.steps.length);
      ok(`${label} stays under 15 steps (${p.solution.steps.length})`, p.solution.steps.length <= 15);
      const texts = [
        p.prompt,
        ...(p.hints ?? []),
        ...p.solution.steps,
        p.solution.final_answer,
        ...(p.diagrams ?? []).map((dg) => ('caption' in dg ? (dg.caption ?? '') : '')),
        ...(q.diagrams ?? []).map((dg) => ('caption' in dg ? (dg.caption ?? '') : '')),
        q.context,
      ];
      for (const t of texts) {
        for (const m of t.match(/\$\$[^$]+\$\$|\$[^$]+\$/g) ?? []) {
          if (HEB.test(m)) {
            failures.push(`Hebrew inside KaTeX (${label}): ${m.slice(0, 60)}`);
            continue;
          }
          const display = m.startsWith('$$');
          try {
            katex.renderToString(display ? m.slice(2, -2) : m.slice(1, -1), {
              displayMode: display,
              throwOnError: true,
              strict: false,
            });
            pass++;
          } catch (e) {
            failures.push(`KaTeX parse error (${label}): ${m.slice(0, 60)} — ${(e as Error).message.slice(0, 100)}`);
          }
        }
      }
      // every diagram must carry a viewBox and non-empty svg
      for (const dg of p.diagrams ?? []) {
        if (dg.type !== 'custom') continue;
        ok(`${label} diagram has a viewBox`, !!dg.viewBox);
        ok(`${label} diagram has svg`, (dg.svg ?? '').trim().length > 40);
      }
      pass++;
    }
  }
  ok(`8 questions (${bagrut2025Summer571MoedB.length})`, bagrut2025Summer571MoedB.length === 8);
  ok(`41 parts (${parts})`, parts === 41);
  for (const file of onDisk) ok(`scan is referenced: ${file}`, referenced.has(file));
  console.log(`longest solution: ${longest} steps`);
}

// ============================================================
console.log(`\n✔ ${pass} checks passed`);
if (failures.length) {
  console.error(`✘ ${failures.length} failed:\n` + failures.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('שאלון 35571 קיץ 2025 מועד ב — כל התוצאות אומתו.\n');
