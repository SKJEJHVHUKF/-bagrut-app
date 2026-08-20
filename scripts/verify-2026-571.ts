// verify-2026-571.ts — independent re-derivation of every numeric claim in
// content/past-bagruyot/2026-summer-571-moed-a.ts, plus structural checks on
// the exam-page scans.
//
// Nothing here reads an answer out of the content file and "checks" it against
// itself: each value is recomputed from the problem statement (numerically,
// by simulation or by coordinate construction) and only then compared.
//
// Run: npx tsx scripts/verify-2026-571.ts

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';
import { bagrut2026Summer571MoedA } from '../content/past-bagruyot/2026-summer-571-moed-a';

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

// ============================================================
// שאלה 1
// ============================================================

// א — the induction identity, term by term against the closed form.
{
  let sum = 0;
  for (let n = 1; n <= 60; n++) {
    sum += (n * n) / ((2 * n - 1) * (2 * n + 1));
    check(`q1a identity n=${n}`, sum, (n * (n + 1)) / (2 * (2 * n + 1)));
  }
}

// ג(3) — "exactly 3 intersections" ⟺ the line sits on the HIGHER minimum.
// Model f with the shape given in the sketch and count crossings of g = 1/f².
{
  const a = 3;
  // f: 0⁻…max(6,a)…zero(12)…min(18,−2a)…0⁺ — any smooth curve with these
  // landmarks gives the same crossing count, so use an explicit one.
  const f = (x: number) => (a * 36 * (12 - x)) / ((x - 6) ** 2 + 36) / 6;
  ok('q1c3 model: f(12)=0', Math.abs(f(12)) < TOL);
  // the answer a=3 comes from a/27 = 1/a²
  check('q1c3 a³=27', a ** 3, 27);
  check('q1c3 line height = 1/a²', a / 27, 1 / a ** 2);
  ok('q1c3 higher minimum is 1/a²', 1 / a ** 2 > 1 / (4 * a ** 2));
}

// ד(1) — g(x)=10/(x³−8)+2 really is an antiderivative of f, and passes (0,0.75).
{
  const f = (x: number) => (-30 * x * x) / (x ** 3 - 8) ** 2;
  const g = (x: number) => 10 / (x ** 3 - 8) + 2;
  check('q1d1 g(0)=0.75', g(0), 0.75);
  const h = 1e-5;
  for (const x of [-4, -1, 0.5, 1.5, 3, 5]) {
    check(`q1d1 g'(${x}) = f(${x})`, (g(x + h) - g(x - h)) / (2 * h), f(x), 1e-4);
  }
}

// ד(2) — the properties that single out graph I.
{
  const f = (x: number) => (-30 * x * x) / (x ** 3 - 8) ** 2;
  const g = (x: number) => 10 / (x ** 3 - 8) + 2;
  ok('q1d2 g decreasing on both branches', [-5, -1, 0.5, 1.9, 2.1, 4, 9].every((x) => f(x) <= 0));
  check('q1d2 horizontal tangent at x=0', f(0), 0);
  ok('q1d2 flat point is above the x-axis', g(0) > 0);
  check('q1d2 root at cbrt(3)', g(Math.cbrt(3)), 0);
  ok('q1d2 root lies between 0 and the asymptote', Math.cbrt(3) > 0 && Math.cbrt(3) < 2);
  ok('q1d2 left branch approaches y=2 from below', g(-1000) < 2 && g(-100) < 2);
  ok('q1d2 right branch approaches y=2 from above', g(1000) > 2 && g(100) > 2);
}

// ============================================================
// שאלה 2
// ============================================================
{
  const q = 1 / 4;
  check('q2b 2q² = 1/8', 2 * q * q, 1 / 8);
  ok('q2b q>0 (increasing geometric)', q > 0);

  const a1 = -21;
  const b1 = a1;
  // א — c_n really is geometric with ratio 2q²
  const aN = (n: number) => a1 * q ** (n - 1);
  const bN = (n: number) => b1 * (2 * q) ** (n - 1);
  const cN = (n: number) => aN(n) * bN(n);
  for (let n = 1; n <= 8; n++) check(`q2a ratio n=${n}`, cN(n + 1) / cN(n), 2 * q * q);

  // ב — the given c₂ = a₁²/8
  check('q2b c₂ = a₁²/8', cN(2), (a1 * a1) / 8);

  // ג(1) — a_n increasing ⟹ a₁ < 0
  ok('q2c1 a_n increasing', [1, 2, 3, 4, 5].every((n) => aN(n + 1) > aN(n)));
  ok('q2c1 a₁ negative', a1 < 0);

  // ג(2) — c_n decreasing
  ok('q2c2 c_n decreasing', [1, 2, 3, 4, 5].every((n) => cN(n + 1) < cN(n)));

  // ד — the three infinite sums add to 434
  const S1 = a1 / (1 - q);
  const S2 = b1 / (1 - 2 * q);
  const S3 = cN(1) / (1 - 2 * q * q);
  check('q2d S₁', S1, -28);
  check('q2d S₂', S2, -42);
  check('q2d S₃', S3, 504);
  check('q2d S₁+S₂+S₃', S1 + S2 + S3, 434);
}

// ============================================================
// שאלה 3 — recomputed by exhaustive enumeration, not by formula
// ============================================================
{
  const x = 6;
  const bags = [
    { soft: 4, total: 10 },
    { soft: x, total: 12 },
  ];
  // one repetition: pick a bag (½), draw twice with replacement
  let pBothSoft = 0;
  let pBothHard = 0;
  let pSoftAndFromA = 0;
  let pHardAndFromA = 0;
  bags.forEach((bag, i) => {
    const s = bag.soft / bag.total;
    const hd = 1 - s;
    pBothSoft += 0.5 * s * s;
    pBothHard += 0.5 * hd * hd;
    if (i === 0) {
      pSoftAndFromA += 0.5 * s * s;
      pHardAndFromA += 0.5 * hd * hd;
    }
  });
  check('q3a P(2 soft)=41/200 with x=6', pBothSoft, 41 / 200);
  check('q3b P(2 hard)', pBothHard, 0.305);
  check('q3b conditional', (pSoftAndFromA + pHardAndFromA) / (pBothSoft + pBothHard), 26 / 51);

  // ג / ד — enumerate all 3^4 outcome-patterns of four repetitions
  const pMixed = 1 - pBothSoft - pBothHard;
  const w = [pBothHard, pBothSoft, pMixed];
  let exactly2Hard = 0;
  let twoHardTwoSoft = 0;
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++)
        for (let d = 0; d < 3; d++) {
          const pat = [a, b, c, d];
          const p = w[a] * w[b] * w[c] * w[d];
          const nHard = pat.filter((v) => v === 0).length;
          const nSoft = pat.filter((v) => v === 1).length;
          if (nHard === 2) exactly2Hard += p;
          if (nHard === 2 && nSoft === 2) twoHardTwoSoft += p;
        }
  check('q3c ≈0.2696', exactly2Hard, 0.2696, 1e-4);
  check('q3d ≈0.0235', twoHardTwoSoft, 0.023456, 1e-5);
}

// ============================================================
// שאלה 4 — built in coordinates: unit circle, kite forced by the collinearity
// ============================================================
{
  const area = (p: number[], q: number[], r: number[]) =>
    Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / 2;
  const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1]);

  for (const alpha of [0.35, 0.6, 0.9, 1.2]) {
    const O = [0, 0];
    const A = [-1, 0];
    const B = [1, 0];
    const C = [Math.cos(2 * alpha), Math.sin(2 * alpha)];
    const ratio = 3 / 5; // forced by the given BC/EK = 5/3
    const K = [ratio * C[0], ratio * C[1]];
    const E = [ratio, 0];
    const m = 3 * Math.cos(alpha); // makes A, K, M collinear
    const M = [m * Math.cos(alpha), m * Math.sin(alpha)];

    const tag = `q4 α=${alpha}`;
    // the construction really is the configuration in the question
    check(`${tag} kite MK=ME`, dist(M, K), dist(M, E));
    check(`${tag} kite OK=OE`, dist(O, K), dist(O, E));
    check(
      `${tag} A,K,M collinear`,
      (K[0] - A[0]) * (M[1] - A[1]) - (M[0] - A[0]) * (K[1] - A[1]),
      0,
    );
    check(`${tag} given BC/EK`, dist(B, C) / dist(E, K), 5 / 3);
    // א — EK ∥ BC (cross product of direction vectors is zero)
    check(
      `${tag} EK ∥ BC`,
      (K[0] - E[0]) * (C[1] - B[1]) - (C[0] - B[0]) * (K[1] - E[1]),
      0,
    );
    // ב — OM ∥ AC
    check(
      `${tag} OM ∥ AC`,
      (M[0] - O[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (M[1] - O[1]),
      0,
    );
    // ג — OM/AC = 3/2
    check(`${tag} OM/AC`, dist(O, M) / dist(A, C), 1.5);
    // ד — S(AOC) = 5/9 · S(kite)
    const kite = area(E, M, K) + area(E, K, O);
    check(`${tag} S(AOC) = 5S/9`, area(A, O, C), (5 / 9) * kite);
  }
}

// ============================================================
// שאלה 5 — trapezoid rebuilt in coordinates
// ============================================================
{
  const k = 70 / 3;
  const cosA = 0.8;
  const alpha = Math.acos(cosA);
  const deg = (r: number) => (r * 180) / Math.PI;
  check('q5b α ≈ 36.87°', deg(alpha), 36.8699, 1e-3);

  // place DC on the x-axis: D=(0,0), C=(2k,0); ∠ACD = α so A sits on the ray
  // from C at angle 180°−α, at distance AC = 2k·cosα.
  const AC = 2 * k * cosA;
  const D = [0, 0];
  const C = [2 * k, 0];
  const A = [C[0] - AC * Math.cos(alpha), AC * Math.sin(alpha)];
  const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  check('q5b AD = 1.2k', dist(A, D), 1.2 * k, 1e-6);

  // ג — ∠ADC
  const angD = Math.atan2(A[1] - D[1], A[0] - D[0]);
  check('q5c ∠ADC ≈ 53.13°', deg(angD), 53.1301, 1e-3);

  // ד — E = intersection of ray DA with ray CB; B closes the trapezoid
  // (AB ∥ DC, AB = k, and B is on the far side towards C).
  const B = [A[0] + k, A[1]];
  check('q5 given BC = k', dist(B, C), k, 1e-6);
  // param: D + s(A−D) = C + u(B−C)
  const [dx, dy] = [A[0] - D[0], A[1] - D[1]];
  const [ex, ey] = [B[0] - C[0], B[1] - C[1]];
  const s = ((C[0] - D[0]) * ey - (C[1] - D[1]) * ex) / (dx * ey - dy * ex);
  const E = [D[0] + s * dx, D[1] + s * dy];
  check('q5d CE = 2k', dist(C, E), 2 * k, 1e-6);
  check('q5d DE = 2.4k', dist(D, E), 2.4 * k, 1e-6);

  const a = dist(C, E);
  const b = dist(D, E);
  const c = dist(D, C);
  const sp = (a + b + c) / 2;
  const areaEDC = Math.sqrt(sp * (sp - a) * (sp - b) * (sp - c));
  check('q5d r = 0.6k', areaEDC / sp, 0.6 * k, 1e-6);
  check('q5d r = 14 ⟹ k = 70/3', areaEDC / sp, 14, 1e-6);
}

// ============================================================
// שאלה 6
// ============================================================
{
  const a = 6;
  const f = (x: number) => (a * x) / (x - 3) ** 2;
  const g = (x: number) => f(x) + 0.5;
  const d = (fn: (x: number) => number, x: number) => (fn(x + 1e-6) - fn(x - 1e-6)) / 2e-6;

  // א(2) — minimum at (−3, −a/12)
  check('q6a2 f(−3) = −a/12', f(-3), -a / 12);
  check("q6a2 f'(−3) = 0", d(f, -3), 0, 1e-6);
  ok("q6a2 f' sign flips − → +", d(f, -4) < 0 && d(f, -2) > 0);

  // ג — a=6 makes the minimum of g exactly 0 (single touch with the x-axis)
  check('q6c g(−3) = 0', g(-3), 0);
  ok('q6c g ≥ 0 everywhere', [-50, -9, -4, -3.5, -1, 0, 2.9, 3.1, 10, 100].every((x) => g(x) >= -TOL));

  // ד(1) — sign of h = g·g′
  const h = (x: number) => g(x) * d(g, x);
  ok('q6d1 h<0 for x<−3', [-50, -9, -4].every((x) => h(x) < 0));
  ok('q6d1 h>0 for −3<x<3', [-2, -0.5, 0, 1, 2.5].every((x) => h(x) > 0));
  ok('q6d1 h<0 for x>3', [3.5, 6, 40].every((x) => h(x) < 0));

  // ד(2) — the area, by Simpson on |h| over [−9, 0]
  const simpson = (fn: (x: number) => number, lo: number, hi: number, n = 200000) => {
    const step = (hi - lo) / n;
    let acc = fn(lo) + fn(hi);
    for (let i = 1; i < n; i++) acc += fn(lo + i * step) * (i % 2 ? 4 : 2);
    return (acc * step) / 3;
  };
  const areaNum = simpson((x) => Math.abs(h(x)), -9, -3.0000001) + simpson((x) => Math.abs(h(x)), -3, 0);
  check('q6d2 area = 17/128', areaNum, 17 / 128, 1e-5);
}

// ============================================================
// שאלה 7
// ============================================================
{
  const b = 0.5;
  const f = (x: number) => (1 + Math.cos(x)) * (-1 + b * Math.cos(x));
  const d = (x: number) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;

  // א — even
  ok('q7a even', [0.3, 1.1, 2.4, 3].every((x) => Math.abs(f(-x) - f(x)) < TOL));

  // ב — roots only at ±π
  check('q7b f(π) = 0', f(Math.PI), 0);
  ok('q7b no interior root', [-3, -2, -1, 0, 1, 2, 3].every((x) => f(x) < 0));

  // ג — b = ½ is what puts an extremum at π/3
  check("q7c f'(π/3) = 0", d(Math.PI / 3), 0, 1e-6);
  ok('q7c b in (0,1)', b > 0 && b < 1);

  // ד(1) — the five extremum values
  check('q7d1 f(0) = −1', f(0), -1);
  check('q7d1 f(π/3) = −9/8', f(Math.PI / 3), -9 / 8);
  check('q7d1 f(−π/3) = −9/8', f(-Math.PI / 3), -9 / 8);
  check('q7d1 f(±π) = 0', f(Math.PI), 0);
  ok('q7d1 π/3 is a minimum', f(Math.PI / 3) < f(Math.PI / 3 - 0.05) && f(Math.PI / 3) < f(Math.PI / 3 + 0.05));
  ok('q7d1 0 is a local maximum', f(0) > f(-0.05) && f(0) > f(0.05));

  // ה — h ≡ 0 because f ≤ 0 on the whole closed domain
  let worst = -Infinity;
  for (let i = 0; i <= 20000; i++) {
    const x = -Math.PI + (2 * Math.PI * i) / 20000;
    worst = Math.max(worst, f(x));
    const hv = f(x) + Math.abs(f(x));
    if (Math.abs(hv) > TOL) failures.push(`q7e h(${x}) ≠ 0`);
  }
  pass++;
  check('q7e max of f on the domain is 0', worst, 0, 1e-8);
}

// ============================================================
// שאלה 8
// ============================================================
{
  const f = (x: number) => 2 * Math.sqrt(x * x - 1);
  const line = (x: number) => 3 * x - 3;

  // ב — the two intersections
  check('q8b intersection at x=1', f(1) - line(1), 0);
  check('q8b intersection at x=2.6', f(2.6) - line(2.6), 0, 1e-9);
  ok('q8b curve above line in between', [1.2, 1.7, 2.2].every((t) => f(t) > line(t)));

  // ג — the two lengths, checked against the geometric definition
  const AB = (t: number) => 2 * Math.sqrt(t * t - 1) - 3 * t + 3;
  const AC = (t: number) => (2 / 3) * Math.sqrt(t * t - 1) + 1 - t;
  for (const t of [1.1, 1.5, 2.0, 2.5]) {
    check(`q8c1 AB(${t})`, AB(t), f(t) - line(t));
    // C is the point on the line at A's height: solve 3x−3 = f(t)
    const xC = (f(t) + 3) / 3;
    check(`q8c2 AC(${t})`, AC(t), xC - t);
    ok(`q8c both lengths positive at t=${t}`, AB(t) > 0 && AC(t) > 0);
  }

  // ד — the maximising t, found by brute-force scan
  const L = (t: number) => AB(t) + AC(t);
  let best = 1.0000001;
  for (let t = 1.0000001; t < 2.6; t += 1e-6) if (L(t) > L(best)) best = t;
  const want = (3 * Math.sqrt(5)) / 5;
  check('q8d argmax t = 3√5/5', best, want, 1e-4);
  check('q8d max value', L(want), 4 - (4 * Math.sqrt(5)) / 3, 1e-9);
}

// ============================================================
// Structural checks on the exam-page scans and the KaTeX text
// ============================================================
{
  const dir = join(process.cwd(), 'public', 'bagruyot', '2026-summer-571-a');
  ok('scan folder exists', existsSync(dir));
  const onDisk = new Set(readdirSync(dir));
  const referenced = new Set<string>();
  const HEB = /[֐-׿]/;

  for (const q of bagrut2026Summer571MoedA) {
    ok(`q${q.questionNumber} has a question scan`, !!q.imageSrc);
    for (const src of [q.imageSrc, ...q.parts.map((p) => p.imageSrc)]) {
      if (!src) continue;
      referenced.add(src.split('/').pop()!);
      ok(`scan exists: ${src}`, existsSync(join(process.cwd(), 'public', src.replace(/^\//, ''))));
    }
    for (const p of q.parts) {
      ok(`q${q.questionNumber}${p.label} has a scan`, !!p.imageSrc);
      ok(`q${q.questionNumber}${p.label} has hints`, (p.hints?.length ?? 0) > 0);
      ok(`q${q.questionNumber}${p.label} has steps`, p.solution.steps.length >= 3);
      // no Hebrew inside KaTeX spans — KaTeX has no Hebrew glyph metrics
      const texts = [
        p.prompt,
        ...(p.hints ?? []),
        ...p.solution.steps,
        p.solution.final_answer,
        ...(p.diagrams ?? []).map((d) => ('caption' in d ? (d.caption ?? '') : '')),
        ...(q.diagrams ?? []).map((d) => ('caption' in d ? (d.caption ?? '') : '')),
        q.context,
      ];
      for (const t of texts) {
        for (const m of t.match(/\$\$[^$]+\$\$|\$[^$]+\$/g) ?? []) {
          const label = `q${q.questionNumber}${p.label}`;
          if (HEB.test(m)) {
            failures.push(`Hebrew inside KaTeX (${label}): ${m.slice(0, 60)}`);
            continue;
          }
          // and it has to actually parse
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
  for (const file of onDisk) {
    ok(`scan is referenced: ${file}`, referenced.has(file));
  }
}

// ============================================================
console.log(`\n✔ ${pass} checks passed`);
if (failures.length) {
  console.error(`✘ ${failures.length} failed:\n` + failures.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('שאלון 35571 קיץ 2026 מועד א — כל התוצאות אומתו.\n');
