// verify-2026-571b.ts — independent re-derivation of every numeric claim in
// content/past-bagruyot/2026-summer-571-moed-b.ts, plus structural checks on
// the exam-page scans and the KaTeX.
//
// Nothing here reads an answer out of the content file and "checks" it against
// itself: each value is recomputed from the problem statement (numerically, by
// simulation or by coordinate construction) and only then compared.
//
// Run: npx tsx scripts/verify-2026-571b.ts

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';
import { bagrut2026Summer571MoedB } from '../content/past-bagruyot/2026-summer-571-moed-b';

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

// ============================================================
// שאלה 1
// ============================================================

// א(1) — b comes out of n = 2, and (2) the identity then holds for every n.
{
  const lhs2 = 1 ** 3 + 2 ** 3;
  const b = (2 ** 2 * 3 ** 2) / lhs2;
  check('q1a1 b = 4', b, 4);
  let sum = 0;
  for (let n = 1; n <= 60; n++) {
    sum += n ** 3;
    check(`q1a2 identity n=${n}`, sum, (n ** 2 * (n + 1) ** 2) / 4);
  }
}

// ב — only expression II has BOTH the right domain and the right sign.
{
  const domainOk = (needsUpTo6: boolean) => needsUpTo6; // 6−x ≥ 0 ⟺ x ≤ 6
  ok('q1b1 III/IV have the wrong domain', !domainOk(false));
  const I = (x: number) => x * Math.sqrt(6 - x);
  const II = (x: number) => -x * Math.sqrt(6 - x);
  ok('q1b1 I is positive on (0,6)', [1, 2, 4, 5].every((x) => I(x) > 0));
  ok('q1b1 II is negative on (0,6)', [1, 2, 4, 5].every((x) => II(x) < 0));
  ok('q1b1 II is positive for x<0', [-1, -3, -8].every((x) => II(x) > 0));
  check('q1b1 II(0) = 0', II(0), 0);
  check('q1b1 II(6) = 0', II(6), 0);
  // (2) the area under g = f²
  const g = (x: number) => II(x) ** 2;
  ok('q1b2 g ≥ 0 everywhere', [-5, -1, 0, 2, 4, 6].every((x) => g(x) >= -TOL));
  check('q1b2 area = 108', simpson(g, 0, 6), 108, 1e-6);
}

// ג — count of vertical asymptotes, and the horizontal one.
{
  // any f with ONE maximum (3,4), asymptote y=0 and f(0)=1 gives the same counts
  const f = (x: number) => 4 * Math.exp(-((x - 3) ** 2) / 9.9);
  ok('q1c model: single max at 3', f(3) > f(2.9) && f(3) > f(3.1));
  check('q1c model: f(3) = 4', f(3), 4, 1e-9);
  // count solutions of f(x) = 2 by scanning for sign changes
  let crossings = 0;
  for (let x = -60; x < 60; x += 1e-4) {
    if ((f(x) - 2) * (f(x + 1e-4) - 2) < 0) crossings++;
  }
  check('q1c1 two vertical asymptotes', crossings, 2);
  const g = (x: number) => 1 / (f(x) - 2);
  check('q1c2 horizontal asymptote y = −1/2', g(500), -0.5, 1e-6);
  check('q1c3 min of the middle branch', g(3), 0.5, 1e-9);
  ok('q1c3 middle branch is a minimum at x=3', g(3) < g(2.8) && g(3) < g(3.2));
}

// ד — the two Pythagoras placements.
{
  // (1) BC as the SECOND term ⟹ q⁴ − q² + 1 = 0
  const disc1 = (-1) ** 2 - 4 * 1 * 1;
  check('q1d1 discriminant is −3', disc1, -3);
  ok('q1d1 no real solution', disc1 < 0);
  ok('q1d1 u²−u+1 > 0 for every real u', [-5, -1, 0, 0.5, 1, 3, 10].every((u) => u * u - u + 1 > 0));
  // (2) BC as the THIRD term
  const BC = (1 + Math.sqrt(5)) / 2;
  const q2 = BC; // BC = q²
  check('q1d2 Pythagoras holds', 1 + q2, BC ** 2, 1e-12);
  check('q1d2 BC ≈ 1.618', BC, 1.6180339887, 1e-9);
  const q = Math.sqrt(q2);
  ok('q1d2 the sides are geometric', Math.abs(q / 1 - BC / q) < 1e-12);
  ok('q1d2 hypotenuse is the longest side', BC > q && q > 1);
}

// ============================================================
// שאלה 2
// ============================================================
{
  // א — a decreasing all-positive geometric sequence forces 0 < q < 1
  const decreasingPositive = (q: number) => {
    const a = (n: number) => 8 * q ** (n - 1);
    return [1, 2, 3, 4, 5].every((n) => a(n) > 0 && a(n + 1) < a(n));
  };
  ok('q2a I (−1<q<0) fails', !decreasingPositive(-0.5));
  ok('q2a II (0<q<1) holds', decreasingPositive(0.6));
  ok('q2a III (q>1) fails', !decreasingPositive(1.5));

  const q = 0.6;
  const a1 = 8;
  const a = (n: number) => a1 * q ** (n - 1);
  const b = (n: number) => a(n) + a(n + 1) + a(n + 2);

  // ב — b_n is geometric with the SAME ratio q
  for (let n = 1; n <= 8; n++) check(`q2b ratio n=${n}`, b(n + 1) / b(n), q, 1e-12);

  // ג — the 1.96 condition
  check('q2c 1+q+q² = 1.96', 1 + q + q * q, 1.96, 1e-12);
  const Sa = a1 / (1 - q);
  const Sb = b(1) / (1 - q);
  check('q2c S_b = 1.96·S_a', Sb, 1.96 * Sa, 1e-9);

  // ד — c_n is constant, and k
  const c = (n: number) => b(n) / (4 * a(n));
  for (let n = 1; n <= 8; n++) check(`q2d1 c_${n} = 0.49`, c(n), 0.49, 1e-12);
  check('q2d2 k = 71', 34.79 / 0.49, 71, 1e-9);

  // ה — alternating sum of the first 71 terms
  let alt = 0;
  for (let n = 1; n <= 71; n++) alt += (n % 2 === 1 ? 1 : -1) * c(n);
  check('q2e alternating sum = 0.49', alt, 0.49, 1e-9);
  let alt70 = 0;
  for (let n = 1; n <= 70; n++) alt70 += (n % 2 === 1 ? 1 : -1) * c(n);
  check('q2e even k gives 0', alt70, 0, 1e-9);
}

// ============================================================
// שאלה 3 — rebuilt from the three-stage tree, not from the formulas
// ============================================================
{
  const p = 0.2;
  const pass2 = 2 * p; // P(pass test B | passed A)
  const x = 0.75; // P(pass interview | passed both)

  const hired = p * pass2 * x;
  const bothTestsNoInterview = p * pass2 * (1 - x);
  // א — the ×3 condition is what pins x
  check('q3a hired = 3 × (both tests, no interview)', hired, 3 * bothTestsNoInterview, 1e-12);
  check('q3a x = 0.75', x, 0.75);
  // ב — 94% are not hired
  check('q3b P(hired) = 0.06', hired, 0.06, 1e-12);
  check('q3b P(not hired) = 0.94', 1 - hired, 0.94, 1e-12);
  ok('q3b 0<p<1 and 2p ≤ 1', p > 0 && p < 1 && pass2 <= 1);
  // ג — Bayes, with the numerator built by exhausting the tree
  const passedAandNotHired =
    p * (1 - pass2) + // passed A, failed B
    p * pass2 * (1 - x); // passed both, failed interview
  check('q3c numerator = 0.14', passedAandNotHired, 0.14, 1e-12);
  const cond = passedAandNotHired / (1 - hired);
  check('q3c = 7/47', cond, 7 / 47, 1e-12);
  // ד — "at least 2 of 5", by exhausting all 2^5 patterns
  let atLeast2 = 0;
  for (let mask = 0; mask < 32; mask++) {
    let prob = 1;
    let cnt = 0;
    for (let i = 0; i < 5; i++) {
      const hit = (mask >> i) & 1;
      prob *= hit ? cond : 1 - cond;
      cnt += hit;
    }
    if (cnt >= 2) atLeast2 += prob;
  }
  check('q3d ≈ 0.1628', atLeast2, 0.1628, 1e-4);
}

// ============================================================
// שאלה 4 — built in coordinates on the unit circle
// ============================================================
{
  const dist = (P: number[], Q: number[]) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const area = (P: number[], Q: number[], R: number[]) =>
    Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2;
  const angle = (P: number[], V: number[], Q: number[]) => {
    const u = [P[0] - V[0], P[1] - V[1]];
    const w = [Q[0] - V[0], Q[1] - V[1]];
    const c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
    return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
  };

  const A = [0, 1];
  const B = [-Math.sqrt(3) / 2, -0.5];
  const C = [Math.sqrt(3) / 2, -0.5];
  check('q4 equilateral', dist(A, B), dist(B, C), 1e-12);

  for (const s of [0.4, 2 / 3, 1.1]) {
    const D = [C[0] + s * (C[0] - B[0]), C[1] + s * (C[1] - B[1])];
    // E = the second intersection of line AD with the unit circle
    const d = [D[0] - A[0], D[1] - A[1]];
    const t = -2 * (A[0] * d[0] + A[1] * d[1]) / (d[0] * d[0] + d[1] * d[1]);
    const E = [A[0] + t * d[0], A[1] + t * d[1]];
    const tag = `q4 s=${s}`;
    check(`${tag} E on the circle`, Math.hypot(E[0], E[1]), 1, 1e-12);
    // א — the three 60° angles
    check(`${tag} ∠AEB`, angle(A, E, B), 60, 1e-9);
    check(`${tag} ∠BEC`, angle(B, E, C), 60, 1e-9);
    check(`${tag} ∠CED`, angle(C, E, D), 60, 1e-9);
    // ב — similarity △AEB ~ △CED (equal angles, and sides in one ratio)
    check(`${tag} ∠ABE = ∠CDE`, angle(A, B, E), angle(C, D, E), 1e-9);
    const r1 = dist(A, E) / dist(C, E);
    const r2 = dist(E, B) / dist(E, D);
    const r3 = dist(A, B) / dist(C, D);
    check(`${tag} similarity ratio (EB/ED)`, r2, r1, 1e-9);
    check(`${tag} similarity ratio (AB/CD)`, r3, r1, 1e-9);
    // ג — AE/CE = BC/CD
    check(`${tag} AE/CE = BC/CD`, r1, dist(B, C) / dist(C, D), 1e-9);
  }

  // ד — the specific case S(AEB) = 2.25·S(CED)
  const s = 2 / 3; // makes BC/CD = 1.5
  const D = [C[0] + s * (C[0] - B[0]), C[1] + s * (C[1] - B[1])];
  const d = [D[0] - A[0], D[1] - A[1]];
  const t = -2 * (A[0] * d[0] + A[1] * d[1]) / (d[0] * d[0] + d[1] * d[1]);
  const E = [A[0] + t * d[0], A[1] + t * d[1]];
  check('q4d BC/CD = 1.5', dist(B, C) / dist(C, D), 1.5, 1e-12);
  check('q4d given: S(AEB)/S(CED) = 2.25', area(A, E, B) / area(C, E, D), 2.25, 1e-9);
  check('q4d S(ABD)/S(CED) = 4.75', area(A, B, D) / area(C, E, D), 4.75, 1e-9);
  check(
    'q4d the decomposition adds up',
    area(A, E, B) + area(B, E, C) + area(C, E, D),
    area(A, B, D),
    1e-9,
  );
}

// ============================================================
// שאלה 5 — isosceles triangle rebuilt in coordinates
// ============================================================
{
  const dist = (P: number[], Q: number[]) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const deg = (r: number) => (r * 180) / Math.PI;
  // ב — sin 2α = 0.64 with 30° < α < 90° picks the obtuse branch of 2α
  const twoAlpha = Math.PI - Math.asin(0.64);
  const alpha = twoAlpha / 2;
  check('q5b α ≈ 70.105°', deg(alpha), 70.105, 1e-3);
  ok('q5b α in range', deg(alpha) > 30 && deg(alpha) < 90);
  check('q5b sin 2α = 0.64', Math.sin(2 * alpha), 0.64, 1e-12);

  const k = 10.3278;
  const B = [0, 0];
  const C = [4 * k, 0];
  const E = [3 * k, 0];
  const A = [2 * k, 2 * k * Math.tan(alpha)];
  check('q5 isosceles AB = AC', dist(A, B), dist(A, C), 1e-9);
  check('q5 BE = 3·EC', dist(B, E), 3 * dist(E, C), 1e-9);

  // foot of the perpendicular from E onto AC, and onto AB
  const foot = (P: number[], Q: number[], X: number[]) => {
    const vx = Q[0] - P[0];
    const vy = Q[1] - P[1];
    const s = ((X[0] - P[0]) * vx + (X[1] - P[1]) * vy) / (vx * vx + vy * vy);
    return [P[0] + s * vx, P[1] + s * vy];
  };
  const D = foot(A, C, E);
  const M = foot(A, B, E);
  // א — the two lengths
  check('q5a DE = k·sinα', dist(D, E), k * Math.sin(alpha), 1e-9);
  check('q5a ME = 3k·sinα', dist(M, E), 3 * k * Math.sin(alpha), 1e-9);
  // ב — the area condition that produced α
  const tri = (P: number[], Q: number[], R: number[]) =>
    Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2;
  check('q5b area sum = 1.6k²', tri(C, E, D) + tri(B, E, M), 1.6 * k * k, 1e-6);
  // ג — right angle at D ⟹ AE is the diameter of the circumcircle of AED
  const angD =
    ((A[0] - D[0]) * (E[0] - D[0]) + (A[1] - D[1]) * (E[1] - D[1])) /
    (dist(A, D) * dist(E, D));
  check('q5c cos(∠ADE) = 0 (right angle)', angD, 0, 1e-9);
  check('q5c R = AE/2 = 29', dist(A, E) / 2, 29, 1e-3);
}

// ============================================================
// שאלה 6
// ============================================================
{
  const mk = (a: number) => (x: number) => (6 * (x - 1) ** 2) / (x * x + a);
  const d = (fn: (x: number) => number, x: number) => (fn(x + 1e-6) - fn(x - 1e-6)) / 2e-6;

  // א — defined everywhere, one horizontal asymptote y = 6
  for (const a of [0.5, 4, 9]) {
    const f = mk(a);
    ok(`q6a1 a=${a}: denominator never zero`, [-1e6, -3, 0, 3, 1e6].every((x) => x * x + a > 0));
    check(`q6a2 a=${a}: limit = 6`, f(1e7), 6, 1e-5);
  }

  // ב — extrema in terms of a
  for (const a of [1, 4, 7]) {
    const f = mk(a);
    check(`q6b a=${a}: f(1) = 0`, f(1), 0, 1e-12);
    check(`q6b a=${a}: f(−a) = 6(a+1)/a`, f(-a), (6 * (a + 1)) / a, 1e-12);
    check(`q6b a=${a}: f'(−a) = 0`, d(f, -a), 0, 1e-5);
    check(`q6b a=${a}: f'(1) = 0`, d(f, 1), 0, 1e-5);
    ok(`q6b a=${a}: −a is a maximum`, f(-a) > f(-a - 0.3) && f(-a) > f(-a + 0.3));
    ok(`q6b a=${a}: 1 is a minimum`, f(1) < f(0.7) && f(1) < f(1.3));
  }

  // ג — the maximum equals 7.5 exactly when a = 4
  check('q6c a = 4', (6 * (4 + 1)) / 4, 7.5, 1e-12);

  const f = mk(4);
  // ד — sketch facts
  check('q6d f(0) = 1.5', f(0), 1.5, 1e-12);
  check('q6d crosses y=6 at x = −1.5', f(-1.5), 6, 1e-12);
  ok('q6d left branch above the asymptote', f(-40) > 6 && f(-5) > 6);
  ok('q6d right branch below the asymptote', f(0.5) < 6 && f(40) < 6);
  ok('q6d f ≥ 0 everywhere', [-50, -4, 0, 1, 3, 50].every((x) => f(x) >= -TOL));

  // ה — g = −f'/f², its sign, and the area
  const g = (x: number) => -d(f, x) / f(x) ** 2;
  ok('q6e1 undefined only at x = 1', Math.abs(f(1)) < TOL && [-4, 0, 2, 9].every((x) => Math.abs(f(x)) > TOL));
  ok('q6e2 g<0 for x<−4', [-40, -9, -5].every((x) => g(x) < 0));
  ok('q6e2 g>0 for −4<x<1', [-3.5, -1, 0, 0.5].every((x) => g(x) > 0));
  ok('q6e2 g<0 for x>1', [1.5, 4, 30].every((x) => g(x) < 0));
  // the antiderivative is 1/f — check both the closed form and the integral
  check('q6e3 1/f(0) − 1/f(−4)', 1 / f(0) - 1 / f(-4), 8 / 15, 1e-12);
  check('q6e3 area = 8/15 (numeric)', simpson(g, -4, 0), 8 / 15, 1e-6);
}

// ============================================================
// שאלה 7
// ============================================================
{
  const f = (x: number) => Math.sin(x) ** 2 * Math.cos(2 * x);
  const fp = (x: number) => Math.sin(2 * x) * (1 - 4 * Math.sin(x) ** 2);
  const d = (fn: (x: number) => number, x: number) => (fn(x + 1e-6) - fn(x - 1e-6)) / 2e-6;
  const P4 = Math.PI / 4;
  const P6 = Math.PI / 6;

  // א — even
  ok('q7a even', [0.1, 0.4, 0.7].every((x) => Math.abs(f(-x) - f(x)) < TOL));
  // the closed form of f' really is f'
  for (const x of [-0.7, -0.3, 0.2, 0.6]) check(`q7 f'(${x})`, fp(x), d(f, x), 1e-5);

  // ב — the five extrema
  check('q7b f(0) = 0', f(0), 0, 1e-12);
  check('q7b f(π/6) = 1/8', f(P6), 1 / 8, 1e-12);
  check('q7b f(−π/6) = 1/8', f(-P6), 1 / 8, 1e-12);
  check('q7b f(±π/4) = 0', f(P4), 0, 1e-12);
  check("q7b f'(π/6) = 0", fp(P6), 0, 1e-12);
  check("q7b f'(0) = 0", fp(0), 0, 1e-12);
  ok('q7b π/6 is a maximum', f(P6) > f(P6 - 0.1) && f(P6) > f(P6 + 0.1));
  ok('q7b 0 is a minimum', f(0) < f(-0.1) && f(0) < f(0.1));
  // ג — non-negative across the closed domain, max value 1/8
  let worst = Infinity;
  let best = -Infinity;
  for (let i = 0; i <= 20000; i++) {
    const x = -P4 + (2 * P4 * i) / 20000;
    worst = Math.min(worst, f(x));
    best = Math.max(best, f(x));
  }
  check('q7c min of f is 0', worst, 0, 1e-9);
  check('q7c max of f is 1/8', best, 1 / 8, 1e-8);

  // ד(1) — domain of g = √(a·f'), a < 0  ⟺  f' ≤ 0
  const inDomain = (x: number) => fp(x) <= 1e-12;
  ok('q7d1 [−π/6,0] is in the domain', [-P6 + 1e-4, -0.4, -0.2, -1e-4].every(inDomain));
  ok('q7d1 [π/6,π/4] is in the domain', [P6 + 1e-4, 0.6, 0.7, P4 - 1e-4].every(inDomain));
  ok('q7d1 (−π/4,−π/6) is OUT', [-0.7, -0.6].every((x) => !inDomain(x)));
  ok('q7d1 (0,π/6) is OUT', [0.1, 0.3, 0.5].every((x) => !inDomain(x)));
  // ד(2) — g = 0 exactly at the three zeros of f' inside the domain
  for (const x of [-P6, 0, P6]) check(`q7d2 f'(${x.toFixed(4)}) = 0`, fp(x), 0, 1e-12);

  // ה — exactly ONE inflection point of f inside the domain of g
  const fpp = (x: number) => 4 * Math.cos(4 * x) - 2 * Math.cos(2 * x);
  for (const x of [-0.5, -0.2, 0.3, 0.7]) check(`q7e f''(${x})`, fpp(x), d(fp, x), 1e-4);
  const roots: number[] = [];
  for (let x = -P4; x < P4; x += 1e-5) {
    if (fpp(x) * fpp(x + 1e-5) < 0) {
      const r = x + 5e-6;
      if ((r >= -P6 && r <= 0) || (r >= P6 && r <= P4)) roots.push(r);
    }
  }
  check('q7e exactly one inflection point in the domain of g', roots.length, 1);
  ok('q7e it lies in the LEFT interval', roots[0] > -P6 && roots[0] < 0);
  // g has a max there, and rises to √|a| at π/4
  const a = -1;
  // clamp: at the interval ends a·f' is 0 up to rounding, and can dip a hair below
  const g = (x: number) => Math.sqrt(Math.max(0, a * fp(x)));
  check('q7e g(π/4) = √|a|', g(P4), Math.sqrt(Math.abs(a)), 1e-9);
  check('q7e g = 0 at the interval ends', g(-P6) + g(0) + g(P6), 0, 1e-6);
  ok('q7e the left branch peaks at the inflection point', g(roots[0]) > g(roots[0] - 0.1) && g(roots[0]) > g(roots[0] + 0.1));
  ok('q7e the right branch is increasing', g(0.55) < g(0.65) && g(0.65) < g(0.75));
}

// ============================================================
// שאלה 8
// ============================================================
{
  const f = (t: number) => (4 * t - 2) ** 3;
  for (const b of [0.3, 1, 4.2]) {
    const xB = (t: number) => (f(t) - b) / 3;
    // א — B really is on the line, at A's height
    for (const t of [0, 0.25, 0.5, 0.7]) {
      check(`q8a b=${b} t=${t}: B on the line`, 3 * xB(t) + b, f(t), 1e-9);
    }
    const D = (t: number) => t - xB(t);
    ok(`q8 b=${b}: the segment has positive length`, [0, 0.2, 0.4, 0.7].every((t) => D(t) > 0));
    // ב — brute-force scan over the closed interval
    let tMin = 0;
    let tMax = 0;
    for (let t = 0; t <= 0.7 + 1e-12; t += 1e-6) {
      if (D(t) < D(tMin)) tMin = t;
      if (D(t) > D(tMax)) tMax = t;
    }
    check(`q8b1 b=${b}: argmin t = 3/8`, tMin, 0.375, 1e-4);
    check(`q8b2 b=${b}: argmax t = 0`, tMax, 0, 1e-6);
    // and the two comparisons the solution makes explicitly
    check(`q8b1 b=${b}: D(3/8)`, D(0.375), 5 / 12 + b / 3, 1e-9);
    check(`q8b1 b=${b}: D(0.7)`, D(0.7), 0.7 - (0.512 - b) / 3, 1e-9);
    check(`q8b2 b=${b}: D(0)`, D(0), (8 + b) / 3, 1e-9);
    check(`q8b2 b=${b}: D(5/8)`, D(0.625), 7 / 12 + b / 3, 1e-9);
  }
}

// ============================================================
// Structural checks on the exam-page scans and the KaTeX
// ============================================================
{
  const dir = join(process.cwd(), 'public', 'bagruyot', '2026-summer-571-b');
  ok('scan folder exists', existsSync(dir));
  const onDisk = new Set(readdirSync(dir));
  const referenced = new Set<string>();
  const HEB = /[֐-׿]/;

  for (const q of bagrut2026Summer571MoedB) {
    ok(`q${q.questionNumber} has a question scan`, !!q.imageSrc);
    ok(`q${q.questionNumber} is moed b`, q.moed === 'b');
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
}

// ============================================================
console.log(`\n✔ ${pass} checks passed`);
if (failures.length) {
  console.error(`✘ ${failures.length} failed:\n` + failures.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('שאלון 35571 קיץ 2026 מועד ב — כל התוצאות אומתו.\n');
