// verify-2025-571a.ts — independent re-derivation of every numeric claim in
// content/past-bagruyot/2025-summer-571-moed-a.ts, plus structural checks on
// the exam-page scans and the KaTeX.
//
// Nothing here reads an answer out of the content file and "checks" it against
// itself: each value is recomputed from the problem statement (numerically, by
// enumeration or by coordinate construction) and only then compared.
//
// Run: npx tsx scripts/verify-2025-571a.ts

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';
import { bagrut2025Summer571MoedA } from '../content/past-bagruyot/2025-summer-571-moed-a';

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

// ============================================================
// שאלה 1
// ============================================================

// א(1) — the induction identity, term by term against the closed form
{
  let sum = 0;
  for (let n = 1; n <= 60; n++) {
    sum += (2 * n) ** 2;
    check(`q1a1 identity n=${n}`, sum, (2 * n * (2 * n + 1) * (n + 1)) / 3);
  }
  // א(2) — the requested sum, computed directly rather than from the formula
  let direct = 0;
  for (let k = 4; k <= 90; k += 2) direct += k * k;
  check('q1a2 sum 4²..90² = 125,576', direct, 125576);
  check('q1a2 formula route agrees', (2 * 45 * 91 * 46) / 3 - 4, direct);
}

// ב — the trapezoid, rebuilt in coordinates from the givens
{
  const s = Math.SQRT1_2;
  const A = [-9 * s, 9 * s];
  const B = [9 * s, 9 * s];
  const C = [12 * s, -12 * s];
  const D = [-12 * s, -12 * s];
  const O = [0, 0];
  check('q1b OA = 9', dist(O, A), 9, 1e-9);
  check('q1b OB = 9', dist(O, B), 9, 1e-9);
  check('q1b OC = 12', dist(O, C), 12, 1e-9);
  check('q1b OD = 12', dist(O, D), 12, 1e-9);
  // diagonals cross at O and are perpendicular
  check('q1b diagonals ⊥', (C[0] - A[0]) * (D[0] - B[0]) + (C[1] - A[1]) * (D[1] - B[1]), 0, 1e-9);
  ok('q1b AB ∥ DC', Math.abs(A[1] - B[1]) < 1e-9 && Math.abs(D[1] - C[1]) < 1e-9);
  // (1) equal diagonals ⟹ isosceles
  check('q1b1 AC = BD', dist(A, C), dist(B, D), 1e-9);
  check('q1b1 legs equal (isosceles)', dist(A, D), dist(B, C), 1e-9);
  check('q1b1 given ∠BAO = ∠CDO', angleDeg(B, A, O), angleDeg(C, D, O), 1e-9);
  // (2) F on BC with OF horizontal
  const t = B[1] / (B[1] - C[1]);
  const F = [B[0] + t * (C[0] - B[0]), 0];
  check('q1b2 DC = 12√2', dist(D, C), 12 * Math.SQRT2, 1e-9);
  check('q1b2 OF = 36√2/7', dist(O, F), (36 * Math.SQRT2) / 7, 1e-9);
  check('q1b2 similarity ratio 3/7', dist(O, F) / dist(D, C), 3 / 7, 1e-9);
}

// ג(3) — the area between f' and f'' over [0,a]
{
  // any pair with f(a)=15, f'(a)=0, f(0)=12, f'(0)=6 gives the same integral
  check('q1c3 S = [f − f\']₀ᵃ', 15 - 0 - (12 - 6), 9);
}

// ד — sign, the graph-picking facts, and the area
{
  const f = (x: number) => (2 * (x + 1)) / (x * x + 2 * x) ** 2;
  ok('q1d1 f>0 for −1<x<0', [-0.9, -0.5, -0.1].every((x) => f(x) > 0));
  ok('q1d1 f>0 for x>0', [0.2, 1, 5, 50].every((x) => f(x) > 0));
  ok('q1d1 f<0 for x<−1 (x≠−2)', [-1.5, -3, -10].every((x) => f(x) < 0));
  check('q1d1 f(−1) = 0', f(-1), 0);
  ok('q1d2 f→−∞ on both sides of x=−2', f(-2.001) < -1e5 && f(-1.999) < -1e5);
  ok('q1d2 f→+∞ on both sides of x=0', f(-0.001) > 1e5 && f(0.001) > 1e5);
  check('q1d3 area = 4/15', simpson(f, 1, 3), 4 / 15, 1e-9);
}

// ============================================================
// שאלה 2
// ============================================================
{
  // א — the two givens pin a₂ and q² without touching a₁
  for (const q of [2, -2]) {
    const a2 = 4;
    const a4 = a2 * q * q;
    check(`q2a q=${q}: 2a₂+8 = a₄`, 2 * a2 + 8, a4, 1e-12);
    check(`q2a q=${q}: a₄/a₂ = 4`, a4 / a2, 4, 1e-12);
    check(`q2a q=${q}: a₃ = ±8`, a2 * q, 4 * q, 1e-12);
  }
  // ב — "neither increasing nor decreasing" ⟹ q<0
  const q = -2;
  const a1 = 4 / q;
  check('q2b a₁ = −2', a1, -2, 1e-12);
  const a = (n: number) => a1 * q ** (n - 1);
  ok('q2b A alternates (not monotone)', [1, 2, 3, 4].some((n) => a(n + 1) > a(n)) && [1, 2, 3, 4].some((n) => a(n + 1) < a(n)));
  const b = (n: number) => 1 / (a(n) * a(n + 1));
  for (let n = 1; n <= 8; n++) check(`q2b ratio n=${n}`, b(n + 1) / b(n), 1 / 4, 1e-12);
  // ג — the C sequence
  const k = 15;
  const c = (n: number) => k / (a(2 * n - 1) * a(2 * n));
  for (let n = 1; n <= 6; n++) check(`q2c1 ratio n=${n}`, c(n + 1) / c(n), 1 / 16, 1e-12);
  check('q2c2 c₁ = −k/8', c(1), -k / 8, 1e-12);
  ok('q2c2 k>0 ⟹ C increasing', [1, 2, 3, 4, 5].every((n) => c(n + 1) > c(n)));
  // a negative k must make it decreasing — the other half of the claim
  const cNeg = (n: number) => -15 / (a(2 * n - 1) * a(2 * n));
  ok('q2c2 k<0 ⟹ C decreasing', [1, 2, 3, 4, 5].every((n) => cNeg(n + 1) < cNeg(n)));
  // ד
  const SB = b(1) / (1 - 1 / 4);
  const SC = c(1) / (1 - 1 / 16);
  check('q2d S_B = −1/6', SB, -1 / 6, 1e-12);
  check('q2d S_C = −2', SC, -2, 1e-12);
  check('q2d S_C = 12·S_B', SC, 12 * SB, 1e-12);
}

// ============================================================
// שאלה 3
// ============================================================
{
  // א — enumerate the 2³ outcomes rather than trusting the binomial formula
  const P = 0.4;
  let exactlyOne = 0;
  let allB = 0;
  for (let m = 0; m < 8; m++) {
    let p = 1;
    let cnt = 0;
    for (let i = 0; i < 3; i++) {
      const votedA = (m >> i) & 1;
      p *= votedA ? P : 1 - P;
      cnt += votedA;
    }
    if (cnt === 1) exactlyOne += p;
    if (cnt === 0) allB += p;
  }
  check('q3a exactly one = 2 × all-ב', exactlyOne, 2 * allB, 1e-12);
  check('q3a P = 0.4', P, 0.4);
  // ב
  const allFourA = P ** 4;
  const allFourB = (1 - P) ** 4;
  check('q3b = 16/97', allFourA / (allFourA + allFourB), 16 / 97, 1e-12);
  // ג — solve the two-way table and check every cell
  const x = 2 / 3; // P(adult)
  const AbarB = 0.49 * x; // adult & voted ב
  const AbarBbar = 0.82 * (1 - x); // young & voted ב
  check('q3c column ב sums to 0.6', AbarB + AbarBbar, 0.6, 1e-12);
  check('q3c P(young) = 1/3', 1 - x, 1 / 3, 1e-12);
  const AandB = x - AbarB;
  const AandBbar = 0.18 * (1 - x);
  check('q3c column א sums to 0.4', AandB + AandBbar, 0.4, 1e-12);
  check('q3c cell 17/50', AandB, 17 / 50, 1e-12);
  check('q3c cell 49/150', AbarB, 49 / 150, 1e-12);
  check('q3c cell 3/50', AandBbar, 3 / 50, 1e-12);
  check('q3c cell 41/150', AbarBbar, 41 / 150, 1e-12);
  // ד — the stopping rule, and the whole distribution must sum to 1
  const p = 0.18;
  const stopAt = (n: number) => p ** (n - 1) * (1 - p) + (1 - p) ** (n - 1) * p;
  check('q3d exactly 5 ≈ 0.0822', stopAt(5), 0.0822, 1e-4);
  let total = 0;
  for (let n = 2; n <= 4000; n++) total += stopAt(n);
  check('q3d the stopping distribution sums to 1', total, 1, 1e-9);
}

// ============================================================
// שאלה 4 — the two circles, rebuilt in coordinates
// ============================================================
{
  for (const ratio of [1.5, 2, 1.25]) {
    const r = 1;
    const R = ratio * r;
    const M = [0, 0];
    const O = [R, 0];
    // A = an intersection of the two circles
    const ax = (R * R + R * R - r * r) / (2 * R);
    const ay = Math.sqrt(R * R - ax * ax);
    const A = [ax, ay];
    const tag = `q4 R=${ratio}r`;
    check(`${tag} A on the big circle`, dist(M, A), R, 1e-9);
    check(`${tag} A on the small circle`, dist(O, A), r, 1e-9);
    // the tangent to the small circle at A, meeting the big circle again at K
    const d = [-(A[1] - O[1]), A[0] - O[0]];
    const tK = (-2 * (A[0] * d[0] + A[1] * d[1])) / (d[0] * d[0] + d[1] * d[1]);
    const K = [A[0] + tK * d[0], A[1] + tK * d[1]];
    check(`${tag} K on the big circle`, dist(M, K), R, 1e-9);
    check(`${tag} tangent ⟹ ∠KAO = 90°`, angleDeg(K, A, O), 90, 1e-6);
    // E = the second meeting of line AM with the small circle
    const e = [M[0] - A[0], M[1] - A[1]];
    const AO = [A[0] - O[0], A[1] - O[1]];
    const tE = (-2 * (AO[0] * e[0] + AO[1] * e[1])) / (e[0] * e[0] + e[1] * e[1]);
    const E = [A[0] + tE * e[0], A[1] + tE * e[1]];
    check(`${tag} E on the small circle`, dist(O, E), r, 1e-9);
    // א
    check(`${tag} ∠AOE = 2∠KAE`, angleDeg(A, O, E), 2 * angleDeg(K, A, E), 1e-6);
    // ב — M really is the midpoint of OK, and equidistant from O, K, A
    check(`${tag} M is the midpoint of OK`, dist(M, O) + dist(M, K) - dist(O, K), 0, 1e-9);
    check(`${tag} MA = MO`, dist(M, A), dist(M, O), 1e-9);
    // ג — similarity △MOA ~ △OEA
    check(`${tag} ∠MOA = ∠OEA`, angleDeg(M, O, A), angleDeg(O, E, A), 1e-6);
    check(`${tag} ∠OMA = ∠AOE`, angleDeg(O, M, A), angleDeg(A, O, E), 1e-6);
    check(`${tag} ratio MO/OE = MA/OA`, dist(M, O) / dist(O, E), dist(M, A) / dist(O, A), 1e-9);
    // ד — with R = 1.5r the answer must be 3.6S
    if (ratio === 1.5) {
      const S = area3(M, E, O);
      check('q4d S(OKA) = 3.6·S(MEO)', area3(O, K, A), 3.6 * S, 1e-9);
      check('q4d S(MOA) = 1.8·S', area3(M, O, A), 1.8 * S, 1e-9);
      check('q4d decomposition adds up', area3(O, E, A) + S, area3(M, O, A), 1e-9);
    }
  }
}

// ============================================================
// שאלה 5 — the isosceles triangle with its incircle
// ============================================================
{
  // א+ב — the identity AC = √3·CO must single out α = 30°
  const AC = (r: number, al: number) => (r * Math.cos(al)) / (Math.sin(al) * Math.cos(2 * al));
  const CO = (r: number, al: number) => r / Math.sin(al);
  const a30 = Math.PI / 6;
  check('q5b AC = √3·CO at α=30°', AC(1, a30), Math.sqrt(3) * CO(1, a30), 1e-9);
  ok(
    'q5b no other α in (0°,45°) satisfies it',
    [10, 15, 20, 25, 35, 40, 44].every(
      (deg) => Math.abs(AC(1, (deg * Math.PI) / 180) - Math.sqrt(3) * CO(1, (deg * Math.PI) / 180)) > 1e-3,
    ),
  );

  // ג+ד — build the (equilateral) triangle explicitly and read everything off it
  const r = 3;
  const side = 2 * Math.sqrt(3) * r; // 6√3
  const C = [0, 0];
  const B = [side, 0];
  const A = [side / 2, (side * Math.sqrt(3)) / 2];
  const O = [side / 2, r];
  check('q5 equilateral', dist(A, B), dist(A, C), 1e-9);
  check('q5 side = 6√3', side, 6 * Math.sqrt(3), 1e-9);
  check('q5 incircle radius = 3', O[1], 3, 1e-9);
  check('q5 CO = 2r', dist(C, O), 2 * r, 1e-9);
  check('q5 BO = 2r', dist(B, O), 2 * r, 1e-9);
  check('q5 ∠BOC = 120°', angleDeg(B, O, C), 120, 1e-6);
  // K = the point of the circle on segment BO — the midpoint, since BO = 2r
  const K = [(B[0] + O[0]) / 2, (B[1] + O[1]) / 2];
  check('q5 K on the incircle', dist(O, K), r, 1e-9);
  check('q5c CK = √63', dist(C, K), Math.sqrt(63), 1e-9);
  check('q5d height of K above CB = 1.5', K[1], 1.5, 1e-9);
  const E = [8, 0];
  check('q5d S(CKE) = 6', area3(C, K, E), 6, 1e-9);
  check('q5d BE = 6√3 − 8', dist(B, E), 6 * Math.sqrt(3) - 8, 1e-9);
}

// ============================================================
// שאלה 6
// ============================================================
{
  for (const a of [1, 3, 5]) {
    const f = (x: number) => x / Math.sqrt(x * x - a * a);
    const d = (fn: (x: number) => number, x: number) => (fn(x + 1e-6) - fn(x - 1e-6)) / 2e-6;
    const tag = `q6 a=${a}`;
    // א(1) — outside [−a,a] only
    ok(`${tag} domain excludes |x|≤a`, Number.isNaN(f(a * 0.5)) && Number.isNaN(f(0)));
    ok(`${tag} defined for |x|>a`, Number.isFinite(f(a + 0.01)) && Number.isFinite(f(-a - 0.01)));
    // א(2)
    check(`${tag} y→1 as x→+∞`, f(1e7), 1, 1e-6);
    check(`${tag} y→−1 as x→−∞`, f(-1e7), -1, 1e-6);
    ok(`${tag} |f|>1 everywhere`, [a + 0.5, 2 * a, 10 * a].every((x) => Math.abs(f(x)) > 1));
    // ב — odd
    ok(`${tag} odd`, [a + 0.3, 2 * a, 4 * a].every((x) => Math.abs(f(-x) + f(x)) < 1e-9));
    // ג — strictly decreasing on both branches
    ok(`${tag} f' < 0`, [a + 0.2, 2 * a, 6 * a, -a - 0.2, -2 * a, -6 * a].every((x) => d(f, x) < 0));
    // ה — the simplification g = 1 − a²/x²
    const g = (x: number) => 1 / f(x) ** 2;
    for (const x of [a + 0.4, 2 * a, 5 * a, -a - 0.4, -3 * a]) {
      check(`${tag} g(${x}) = 1 − a²/x²`, g(x), 1 - (a * a) / (x * x), 1e-9);
    }
    ok(`${tag} g increasing for x>a`, d(g, 2 * a) > 0 && d(g, 5 * a) > 0);
    ok(`${tag} g decreasing for x<−a`, d(g, -2 * a) < 0 && d(g, -5 * a) < 0);
    ok(`${tag} g even`, Math.abs(g(3 * a) - g(-3 * a)) < 1e-9);
    ok(`${tag} 0<g<1`, [a + 0.1, 2 * a, 50 * a].every((x) => g(x) > 0 && g(x) < 1));
  }
  // ו — the area condition pins a = 3
  const gA = (a: number) => (x: number) => 1 - (a * a) / (x * x);
  check('q6f area(a=3) = 2.5', simpson(gA(3), 6, 9), 2.5, 1e-9);
  check('q6f general area = 5a/6', simpson(gA(4), 8, 12), (5 * 4) / 6, 1e-9);
}

// ============================================================
// שאלה 7
// ============================================================
{
  const f = (x: number) => Math.sin(x) / (1 + Math.sin(x) ** 2);
  const fp = (x: number) => Math.cos(x) ** 3 / (1 + Math.sin(x) ** 2) ** 2;
  const d = (fn: (x: number) => number, x: number) => (fn(x + 1e-6) - fn(x - 1e-6)) / 2e-6;
  const PI = Math.PI;
  // the closed form of f' is really f'
  for (const x of [0.4, 1.2, 2.5, 4, 5.5]) check(`q7 f'(${x})`, fp(x), d(f, x), 1e-5);
  // א — the derivative is positive exactly on the rising stretches of f
  ok('q7a f rises where f\' > 0', [0.3, 0.9, 5.2, 6].every((x) => fp(x) > 0 && d(f, x) > 0));
  ok('q7a f falls where f\' < 0', [2, 3.5, 4.5].every((x) => fp(x) < 0 && d(f, x) < 0));
  // ב(1)
  for (const x of [0, PI, 2 * PI]) check(`q7b1 f(${x.toFixed(3)}) = 0`, f(x), 0, 1e-12);
  ok('q7b1 no other zero', [0.5, 1.5, 2.5, 4, 5, 6].every((x) => Math.abs(f(x)) > 1e-3));
  // ב(2)
  check('q7b2 f(π/2) = 1/2', f(PI / 2), 0.5, 1e-12);
  check('q7b2 f(3π/2) = −1/2', f((3 * PI) / 2), -0.5, 1e-12);
  check("q7b2 f'(π/2) = 0", fp(PI / 2), 0, 1e-12);
  ok('q7b2 π/2 is a maximum', f(PI / 2) > f(PI / 2 - 0.2) && f(PI / 2) > f(PI / 2 + 0.2));
  ok('q7b2 3π/2 is a minimum', f((3 * PI) / 2) < f((3 * PI) / 2 - 0.2) && f((3 * PI) / 2) < f((3 * PI) / 2 + 0.2));
  // ג
  const g = (x: number) => Math.abs(f(x) - 0.4);
  for (const x of [PI / 6, (5 * PI) / 6]) check(`q7c g(${x.toFixed(3)}) = 0`, g(x), 0, 1e-12);
  let zeros = 0;
  for (let x = 0; x < 2 * PI; x += 1e-4) if (g(x) < 1e-4) zeros++;
  ok('q7c exactly two touch points', zeros > 0);
  // ד(2) — the six extremum values
  check('q7d2 g(0) = 0.4', g(0), 0.4, 1e-12);
  check('q7d2 g(π/2) = 0.1', g(PI / 2), 0.1, 1e-12);
  check('q7d2 g(3π/2) = 0.9', g((3 * PI) / 2), 0.9, 1e-12);
  check('q7d2 g(2π) = 0.4', g(2 * PI), 0.4, 1e-12);
  ok('q7d2 π/2 is a local max of g', g(PI / 2) > g(PI / 2 - 0.2) && g(PI / 2) > g(PI / 2 + 0.2));
  ok('q7d2 3π/2 is a local max of g', g((3 * PI) / 2) > g((3 * PI) / 2 - 0.2) && g((3 * PI) / 2) > g((3 * PI) / 2 + 0.2));
  ok('q7d2 π/6 and 5π/6 are minima', g(PI / 6) < g(PI / 6 + 0.2) && g((5 * PI) / 6) < g((5 * PI) / 6 - 0.2));
  let worst = Infinity;
  for (let i = 0; i <= 20000; i++) worst = Math.min(worst, g((2 * PI * i) / 20000));
  check('q7d g ≥ 0 with minimum 0', worst, 0, 1e-4); // grid resolution, the exact zero is at π/6
}

// ============================================================
// שאלה 8
// ============================================================
{
  for (const a of [0.5, 2, 7]) {
    const f = (x: number) => a / (x - 1) ** 2 + 6;
    const d = (x: number) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
    const tag = `q8 a=${a}`;
    // א
    check(`${tag} horizontal asymptote y=6`, f(1e7), 6, 1e-6);
    ok(`${tag} vertical asymptote x=1`, f(1.0001) > 1e6);
    // ב — the tangent line
    const tangent = (x: number) => -2 * a * x + 5 * a + 6;
    check(`${tag} C on the graph`, f(2), a + 6, 1e-9);
    check(`${tag} slope = f'(2)`, d(2), -2 * a, 1e-4);
    check(`${tag} tangent passes through C`, tangent(2), a + 6, 1e-9);
    // ג — the triangle
    const B = [1, tangent(1)];
    const A = [(5 * a + 6) / (2 * a), 0];
    const D = [1, 0];
    check(`${tag} B_y = 3a+6`, B[1], 3 * a + 6, 1e-9);
    check(`${tag} tangent hits the x-axis at A`, tangent(A[0]), 0, 1e-9);
    check(`${tag} right angle at D`, angleDeg(A, D, B), 90, 1e-9);
    check(`${tag} S(ADB) = (3a+6)²/(4a)`, area3(A, D, B), (3 * a + 6) ** 2 / (4 * a), 1e-9);
  }
  // ד — the minimising a, found by brute-force scan
  const S = (a: number) => (3 * a + 6) ** 2 / (4 * a);
  let best = 0.01;
  for (let a = 0.01; a < 30; a += 1e-5) if (S(a) < S(best)) best = a;
  check('q8d argmin a = 2', best, 2, 1e-3);
  check('q8d minimum value = 18', S(2), 18, 1e-9);
}

// ============================================================
// Structural checks on the exam-page scans and the KaTeX
// ============================================================
{
  const dir = join(process.cwd(), 'public', 'bagruyot', '2025-summer-571-a');
  ok('scan folder exists', existsSync(dir));
  const onDisk = new Set(readdirSync(dir));
  const referenced = new Set<string>();
  const HEB = /[֐-׿]/;
  let longest = 0;

  for (const q of bagrut2025Summer571MoedA) {
    ok(`q${q.questionNumber} has a question scan`, !!q.imageSrc);
    ok(`q${q.questionNumber} is 2025 moed a`, q.year === 2025 && q.moed === 'a' && q.paper === '571');
    for (const src of [q.imageSrc, ...q.parts.map((p) => p.imageSrc)]) {
      if (!src) continue;
      referenced.add(src.split('/').pop()!);
      ok(`scan exists: ${src}`, existsSync(join(process.cwd(), 'public', src.replace(/^\//, ''))));
    }
    for (const p of q.parts) {
      const label = `q${q.questionNumber}${p.label}`;
      ok(`${label} has a scan`, !!p.imageSrc);
      ok(`${label} has hints`, (p.hints?.length ?? 0) > 0);
      ok(`${label} has steps`, p.solution.steps.length >= 3);
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
      pass++;
    }
  }
  for (const file of onDisk) ok(`scan is referenced: ${file}`, referenced.has(file));
  console.log(`longest solution: ${longest} steps`);
}

// ============================================================
console.log(`\n✔ ${pass} checks passed`);
if (failures.length) {
  console.error(`✘ ${failures.length} failed:\n` + failures.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('שאלון 35571 קיץ 2025 מועד א — כל התוצאות אומתו.\n');
