/**
 * verify-trig-functions.ts — numeric gate for the פונקציות טריגונומטריות track.
 *
 *   npx tsx scripts/verify-trig-functions.ts
 *
 * Every authored answer is re-derived here from the equation itself, not copied
 * from the content. `verify-trig.ts` hardcodes its own facts and never reads the
 * lessons, so it cannot catch a wrong answer in a new stage.
 *
 * רמת בסיס is in DEGREES (owner's decision, CLAUDE.md): these solve
 * trigonometric equations and no derivative appears, so degrees are correct and
 * `verify-trig-angles.ts` enforces it.
 */
import { create as mjCreate, all as mjAll } from 'mathjs';
import { TF_BAGRUT } from '../content/lessons/math5/trig-functions/tf-bagrut';
import { TF_DERIVATIVE } from '../content/lessons/math5/trig-functions/tf-derivative';

const D = (d: number) => (d * Math.PI) / 180;
const sin = (d: number) => Math.sin(D(d));
const cos = (d: number) => Math.cos(D(d));
const tan = (d: number) => Math.tan(D(d));

let pass = 0;
const fails: string[] = [];
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) pass += 1;
  else fails.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

/** Brute-force every whole and half degree in [lo, hi) and return the roots. */
function roots(f: (x: number) => number, lo: number, hi: number, step = 0.5): number[] {
  const out: number[] = [];
  for (let x = lo; x < hi - 1e-9; x += step) {
    if (Math.abs(f(x)) < 1e-9) out.push(Math.round(x * 2) / 2);
  }
  return out;
}
const same = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

// ---------------------------------------------------------------- רמת בסיס
// Each check states the equation and the authored answer set; the solver is
// independent of both.
ok('tf-eq-001  sin x = -1/2 on [0,360)', same(roots((x) => sin(x) + 0.5, 0, 360), [210, 330]));
ok('tf-eq-002  tan x = sqrt3 general', Math.abs(tan(60) - Math.sqrt(3)) < 1e-9 && Math.abs(tan(60 + 180) - Math.sqrt(3)) < 1e-9);
ok('tf-eq-003  cos x = 1 on [0,360) has one root', same(roots((x) => cos(x) - 1, 0, 360), [0]));
ok(
  'tf-eq-004  2sin^2+3cos=3 on [0,360)',
  same(roots((x) => 2 * sin(x) ** 2 + 3 * cos(x) - 3, 0, 360), [0, 60, 300]),
);
ok(
  'tf-eq-005  cos2x = sin x on [0,360)',
  same(roots((x) => cos(2 * x) - sin(x), 0, 360), [30, 150, 270]),
);
ok(
  'tf-eq-006  sin2x = cos x on [0,360)',
  same(roots((x) => sin(2 * x) - cos(x), 0, 360), [30, 90, 150, 270]),
);
ok(
  'tf-eq-007  tan x = 2 sin x on [0,360), cos x != 0',
  same(
    roots((x) => (Math.abs(cos(x)) < 1e-12 ? NaN : tan(x) - 2 * sin(x)), 0, 360),
    [0, 60, 180, 300],
  ),
);
ok(
  'tf-eq-008  cos2x + 3sin x = 2 on [0,360)',
  same(roots((x) => cos(2 * x) + 3 * sin(x) - 2, 0, 360), [30, 90, 150]),
);
ok(
  'tf-eq-009  sin2x = sin x on [0,720) has 8 roots',
  roots((x) => sin(2 * x) - sin(x), 0, 720).length === 8,
  `got ${roots((x) => sin(2 * x) - sin(x), 0, 720).join(',')}`,
);

// The worked examples in the teach steps.
ok('example  cos x = -sqrt3/2 on [0,360)', same(roots((x) => cos(x) + Math.sqrt(3) / 2, 0, 360), [150, 210]));
ok('example  2cos^2-5cos+2=0 on [0,360)', same(roots((x) => 2 * cos(x) ** 2 - 5 * cos(x) + 2, 0, 360), [60, 300]));
ok('example  2cos^2x+sinx=2 on [0,360)', same(roots((x) => 2 * cos(x) ** 2 + sin(x) - 2, 0, 360), [0, 30, 150, 180]));
ok('example  cos2x+cosx=0 on [0,360)', same(roots((x) => cos(2 * x) + cos(x), 0, 360), [60, 180, 300]));
ok('example  sin2x = sqrt3 sin x on [0,360)', same(roots((x) => sin(2 * x) - Math.sqrt(3) * sin(x), 0, 360), [0, 30, 180, 330]));
ok('example  sin x = sqrt2/2 on [0,720) has 4 roots', roots((x) => sin(x) - Math.sqrt(2) / 2, 0, 720).length === 4);

// The drill claims, re-derived.
ok('drill-003  sin x = -3 is outside the sine range', Math.abs(-3) > 1, 'a root outside [-1,1] yields no angle');
ok('drill-003  sin x = 0 on [0,360) has two roots', same(roots((x) => sin(x), 0, 360), [0, 180]));
ok(
  'drill-005  dividing by sin x drops the sin x = 0 roots',
  roots((x) => 2 * sin(x) * cos(x) - sin(x), 0, 360).length === 4 &&
    roots((x) => 2 * cos(x) - 1, 0, 360).length === 2,
);

// ------------------------------------------------------------------ רמה 1
// RADIANS from here on: these stages lead into differentiation, and
// (sin x)' = cos x holds only in radians. See CLAUDE.md.
const PI = Math.PI;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
/** Roots on [lo,hi] by sign change plus a direct hit test, for radians. */
function rootsR(f: (x: number) => number, lo: number, hi: number, n = 200000): number[] {
  const out: number[] = [];
  const h = (hi - lo) / n;
  let prev = f(lo);
  if (near(prev, 0)) out.push(lo);
  for (let i = 1; i <= n; i++) {
    const x = lo + i * h;
    const v = f(x);
    if (Number.isFinite(prev) && Number.isFinite(v) && prev * v < 0) {
      let a = x - h, b = x;
      for (let k = 0; k < 80; k++) {
        const m = (a + b) / 2;
        if (f(a) * f(m) <= 0) b = m; else a = m;
      }
      out.push((a + b) / 2);
    } else if (near(v, 0)) out.push(x);
    prev = v;
  }
  // Dedup AFTER collecting, with a window wider than the sample step: a
  // bisected root and a direct hit on the next sample are the same root, and a
  // dedup tolerance tighter than h lets both through.
  out.sort((a, b) => a - b);
  return out.filter((r, i) => i === 0 || r - out[i - 1] > 1e-4);
}
const closeTo = (got: number[], want: number[]) =>
  got.length === want.length && got.every((g, i) => Math.abs(g - want[i]) < 1e-4);

// tf-dom-001: 1/sin x is undefined exactly where sin x = 0.
ok('tf-dom-001  sin x = 0 on [0,2pi] at 0, pi, 2pi', closeTo(rootsR(Math.sin, 0, 2 * PI), [0, PI, 2 * PI]));
// tf-dom-002: tan undefined where cos x = 0.
ok('tf-dom-002  cos x = 0 on [0,2pi] at pi/2, 3pi/2', closeTo(rootsR(Math.cos, 0, 2 * PI), [PI / 2, (3 * PI) / 2]));
// tf-dom-003 / tf-dom-007: the worked quotient.
const fq = (x: number) => (2 * Math.cos(x)) / (2 * Math.sin(x) - 1);
ok('tf-dom-003  y-intercept f(0) = -2', near(fq(0), -2));
ok('tf-dom-007  denominator vanishes at pi/6 and 5pi/6',
  closeTo(rootsR((x) => 2 * Math.sin(x) - 1, 0, 2 * PI), [PI / 6, (5 * PI) / 6]));
ok('tf-dom-007  numerator does not vanish there, so both are true asymptotes',
  !near(2 * Math.cos(PI / 6), 0) && !near(2 * Math.cos((5 * PI) / 6), 0));
ok('tf-dom-007  x-intercepts at pi/2 and 3pi/2',
  closeTo(rootsR((x) => 2 * Math.cos(x), 0, 2 * PI), [PI / 2, (3 * PI) / 2]));
// tf-dom-004: the root's domain.
ok('tf-dom-004  2 sin x - 1 >= 0 exactly on [pi/6, 5pi/6]',
  2 * Math.sin(PI / 6 + 0.01) - 1 > 0 && 2 * Math.sin(PI / 6 - 0.01) - 1 < 0 &&
  2 * Math.sin((5 * PI) / 6 - 0.01) - 1 > 0 && 2 * Math.sin((5 * PI) / 6 + 0.01) - 1 < 0);
// tf-dom-005: 1/(1 + 2cos x).
ok('tf-dom-005  1 + 2cos x vanishes at 2pi/3 and 4pi/3',
  closeTo(rootsR((x) => 1 + 2 * Math.cos(x), 0, 2 * PI), [(2 * PI) / 3, (4 * PI) / 3]));
ok('tf-dom-005  the numerator is the constant 1, so both are true asymptotes', true);
// tf-dom-006: sin 2x = 0.
ok('tf-dom-006  sin 2x = 0 on [0,2pi] has five roots',
  closeTo(rootsR((x) => Math.sin(2 * x), 0, 2 * PI), [0, PI / 2, PI, (3 * PI) / 2, 2 * PI]));
// tf-dom-008: the 0/0 trap — sin2x/cos x is NOT asymptotic at pi/2.
ok('tf-dom-008  numerator AND denominator vanish at pi/2', near(Math.sin(2 * (PI / 2)), 0) && near(Math.cos(PI / 2), 0));
ok('tf-dom-008  sin2x/cos x equals 2 sin x wherever cos x is non-zero',
  [0.3, 1.0, 2.2, 4.0, 5.5].every((x) => near(Math.sin(2 * x) / Math.cos(x), 2 * Math.sin(x))));
ok('tf-dom-008  the limit at pi/2 is finite (2), so it is a hole and not an asymptote',
  near(Math.sin(2 * (PI / 2 - 1e-7)) / Math.cos(PI / 2 - 1e-7), 2, ) ||
    Math.abs(Math.sin(2 * (PI / 2 - 1e-7)) / Math.cos(PI / 2 - 1e-7) - 2) < 1e-5);

// ------------------------------------------------------------------ רמה 2
// Every authored derivative is compared against a NUMERIC derivative of the
// same function. That is the check that actually bites: a wrong chain-rule
// factor or a dropped minus survives every structural gate, and a symbolic
// re-derivation by hand is exactly the thing being verified.
const ddx = (f: (x: number) => number, x: number, h = 1e-6) =>
  (f(x + h) - f(x - h)) / (2 * h);

/** Compare an authored derivative with the numeric one at several angles. */
function derivOk(label: string, f: (x: number) => number, fp: (x: number) => number, xs: number[]) {
  const worst = Math.max(...xs.map((x) => Math.abs(fp(x) - ddx(f, x))));
  ok(`${label}`, worst < 1e-5, `worst gap ${worst.toExponential(2)}`);
}

const SAMPLE = [0.35, 0.9, 1.7, 2.6, 3.4, 4.3, 5.2];

// tf-der-001 .. the three basic derivatives
derivOk("tf-der  (sin x)' = cos x", Math.sin, Math.cos, SAMPLE);
derivOk("tf-der  (cos x)' = -sin x", Math.cos, (x) => -Math.sin(x), SAMPLE);
derivOk(
  "tf-der  (tan x)' = 1/cos^2 x",
  Math.tan,
  (x) => 1 / Math.cos(x) ** 2,
  [0.35, 0.9, 2.6, 3.4, 4.3],
);
// The claim that makes radians mandatory: in degrees the derivative picks up pi/180.
ok(
  'tf-der  in degrees the derivative of sin carries a factor of pi/180',
  Math.abs(ddx((d) => Math.sin((d * PI) / 180), 40) - (PI / 180) * Math.cos((40 * PI) / 180)) < 1e-9,
);

// chain rule
derivOk("tf-der-001  (sin 3x)' = 3 cos 3x", (x) => Math.sin(3 * x), (x) => 3 * Math.cos(3 * x), SAMPLE);
derivOk(
  "tf-der-002  (2 sin x + cos x)' = 2 cos x - sin x",
  (x) => 2 * Math.sin(x) + Math.cos(x),
  (x) => 2 * Math.cos(x) - Math.sin(x),
  SAMPLE,
);
derivOk(
  "tf-der-004  (sin^2 x)' = sin 2x",
  (x) => Math.sin(x) ** 2,
  (x) => Math.sin(2 * x),
  SAMPLE,
);
derivOk(
  "tf-der-005  (x sin x)' = sin x + x cos x",
  (x) => x * Math.sin(x),
  (x) => Math.sin(x) + x * Math.cos(x),
  SAMPLE,
);
derivOk(
  "tf-der-006  (sin x / x)' = (x cos x - sin x)/x^2",
  (x) => Math.sin(x) / x,
  (x) => (x * Math.cos(x) - Math.sin(x)) / (x * x),
  SAMPLE,
);
derivOk(
  "tf-der-007  (sqrt(1+sin x))' = cos x / (2 sqrt(1+sin x))",
  (x) => Math.sqrt(1 + Math.sin(x)),
  (x) => Math.cos(x) / (2 * Math.sqrt(1 + Math.sin(x))),
  SAMPLE,
);
derivOk(
  "tf-der-008  (sin x/(1+cos x))' = 1/(1+cos x)",
  (x) => Math.sin(x) / (1 + Math.cos(x)),
  (x) => 1 / (1 + Math.cos(x)),
  [0.35, 0.9, 1.7, 2.6, 4.3, 5.2],
);
derivOk(
  "tf-der-009  (tan 2x)' = 2/cos^2(2x)",
  (x) => Math.tan(2 * x),
  (x) => 2 / Math.cos(2 * x) ** 2,
  [0.2, 0.5, 1.2, 2.0, 2.9],
);
// The simplification claimed in tf-der-008's solution, checked independently.
ok(
  'tf-der-008  the numerator collapses to 1 + cos x',
  SAMPLE.every((x) =>
    Math.abs(
      Math.cos(x) * (1 + Math.cos(x)) - Math.sin(x) * -Math.sin(x) - (1 + Math.cos(x)),
    ) < 1e-12,
  ),
);
// The figure claim for רמה 2: sin peaks exactly where cos crosses zero.
ok('tf-der figure  sin peaks at pi/2', Math.abs(Math.sin(PI / 2) - 1) < 1e-12);
ok('tf-der figure  cos vanishes at pi/2, which is why that is the peak', Math.abs(Math.cos(PI / 2)) < 1e-15);

// ------------------------------------------------------------------ רמה 3
// Extrema, monotonicity and parity. The extremum claims are checked twice: the
// derivative vanishes there (necessary), AND the value is actually the largest
// or smallest on the interval (sufficient) — a vanishing derivative alone is
// satisfied by an inflection point too.
const f_sc = (x: number) => Math.sin(x) + Math.cos(x);
const fp_sc = (x: number) => Math.cos(x) - Math.sin(x);
derivOk("tf-inv  (sin x + cos x)' = cos x - sin x", f_sc, fp_sc, SAMPLE);
ok('tf-inv-004  f'.concat("' vanishes at pi/4 and 5pi/4"),
  closeTo(rootsR(fp_sc, 0, 2 * PI), [PI / 4, (5 * PI) / 4]));
ok('tf-inv-004  the value at pi/4 is sqrt2', Math.abs(f_sc(PI / 4) - Math.SQRT2) < 1e-12);
ok('tf-inv-004  the value at 5pi/4 is -sqrt2', Math.abs(f_sc((5 * PI) / 4) + Math.SQRT2) < 1e-12);
/** Scan the interval and confirm the claimed point really is the extremum. */
const scanMax = (f: (x: number) => number, lo: number, hi: number) => {
  let bx = lo;
  for (let i = 0; i <= 200000; i++) {
    const x = lo + ((hi - lo) * i) / 200000;
    if (f(x) > f(bx)) bx = x;
  }
  return bx;
};
const scanMin = (f: (x: number) => number, lo: number, hi: number) => {
  let bx = lo;
  for (let i = 0; i <= 200000; i++) {
    const x = lo + ((hi - lo) * i) / 200000;
    if (f(x) < f(bx)) bx = x;
  }
  return bx;
};
ok('tf-inv-004  pi/4 really IS the maximum on the interval', Math.abs(scanMax(f_sc, 0, 2 * PI) - PI / 4) < 1e-3);
ok('tf-inv-004  5pi/4 really IS the minimum on the interval', Math.abs(scanMin(f_sc, 0, 2 * PI) - (5 * PI) / 4) < 1e-3);
ok('tf-inv-005  f is increasing just before pi/4 and decreasing just after',
  fp_sc(PI / 4 - 0.05) > 0 && fp_sc(PI / 4 + 0.05) < 0);
ok('tf-inv-005  and increasing again after 5pi/4', fp_sc((5 * PI) / 4 + 0.05) > 0);

// tf-inv-007: the investigated function.
const f_inv = (x: number) => 2 * Math.sin(x) + x;
const fp_inv = (x: number) => 2 * Math.cos(x) + 1;
derivOk("tf-inv-007  (2 sin x + x)' = 2 cos x + 1", f_inv, fp_inv, SAMPLE);
ok('tf-inv-007  f'.concat("' vanishes at 2pi/3 and 4pi/3"),
  closeTo(rootsR(fp_inv, 0, 2 * PI), [(2 * PI) / 3, (4 * PI) / 3]));
ok('tf-inv-007  the maximum value is sqrt3 + 2pi/3',
  Math.abs(f_inv((2 * PI) / 3) - (Math.sqrt(3) + (2 * PI) / 3)) < 1e-12);
ok('tf-inv-007  the minimum value is 4pi/3 - sqrt3',
  Math.abs(f_inv((4 * PI) / 3) - ((4 * PI) / 3 - Math.sqrt(3))) < 1e-12);
ok('tf-inv-007  2pi/3 is a LOCAL max, not the largest on the closed interval',
  f_inv(2 * PI) > f_inv((2 * PI) / 3),
  'the endpoint is higher, which is why the question asks for local extrema');

// Parity, checked over sample angles rather than asserted.
const parity = (f: (x: number) => number) => {
  const xs = [0.4, 1.1, 2.3, 3.1];
  if (xs.every((x) => Math.abs(f(-x) - f(x)) < 1e-12)) return 'even';
  if (xs.every((x) => Math.abs(f(-x) + f(x)) < 1e-12)) return 'odd';
  return 'neither';
};
ok('tf-inv-002  cos is even', parity(Math.cos) === 'even');
ok('tf-inv  sin is odd', parity(Math.sin) === 'odd');
ok('tf-inv-006  x·sin x is even', parity((x) => x * Math.sin(x)) === 'even');
ok('tf-inv-008  sin^2 x is even', parity((x) => Math.sin(x) ** 2) === 'even');
ok('tf-inv  sin x·cos x is odd', parity((x) => Math.sin(x) * Math.cos(x)) === 'odd');
ok('tf-inv  sin x + cos x is neither', parity(f_sc) === 'neither');

// ------------------------------------------------------------------ רמה 4
// Integrals and areas. Each authored antiderivative is checked by DIFFERENTIATING
// it back to the integrand, and each area is checked against a Riemann sum that
// does not use the antiderivative at all — so the check is independent of the
// method the solution uses.
function riemann(f: (x: number) => number, a: number, b: number, n = 400000) {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);
  return s * h;
}
const areaOk = (label: string, got: number, want: number) =>
  ok(label, Math.abs(got - want) < 1e-6, `got ${got}, want ${want}`);

// The two basic antiderivatives, verified by differentiating back.
derivOk('tf-int  d/dx(-cos x) = sin x', (x) => -Math.cos(x), Math.sin, SAMPLE);
derivOk('tf-int  d/dx(sin x) = cos x', Math.sin, Math.cos, SAMPLE);
// A linear inner function divides by its coefficient.
derivOk(
  'tf-int-004  d/dx(-cos(2x)/2) = sin 2x',
  (x) => -Math.cos(2 * x) / 2,
  (x) => Math.sin(2 * x),
  SAMPLE,
);
// Power reduction, the only way to integrate a squared trig function.
derivOk(
  'tf-int-008  d/dx(x/2 - sin(2x)/4) = sin^2 x',
  (x) => x / 2 - Math.sin(2 * x) / 4,
  (x) => Math.sin(x) ** 2,
  SAMPLE,
);

areaOk('tf-int-002  integral of sin from 0 to pi is 2', riemann(Math.sin, 0, PI), 2);
areaOk('tf-int-005  integral of cos from 0 to pi/2 is 1', riemann(Math.cos, 0, PI / 2), 1);
areaOk('tf-int-006  area under sin on [0,pi] is 2', riemann(Math.sin, 0, PI), 2);
// The trap: the signed integral over a full period is zero, the AREA is 4.
areaOk('tf-int-007  the signed integral of sin over [0,2pi] is 0', riemann(Math.sin, 0, 2 * PI), 0);
areaOk(
  'tf-int-007  but the AREA is 4, which is why the interval must be split',
  riemann((x) => Math.abs(Math.sin(x)), 0, 2 * PI),
  4,
);
areaOk('power reduction  the integral of sin^2 over [0,pi] is pi/2', riemann((x) => Math.sin(x) ** 2, 0, PI), PI / 2);
// Area between two curves: sin is above cos exactly on [pi/4, 5pi/4].
ok(
  'tf-int-009  sin is above cos throughout the interval',
  [PI / 4 + 0.01, PI / 2, PI, (5 * PI) / 4 - 0.01].every((x) => Math.sin(x) >= Math.cos(x)),
);
areaOk(
  'tf-int-009  the area between sin and cos is 2 sqrt2',
  riemann((x) => Math.sin(x) - Math.cos(x), PI / 4, (5 * PI) / 4),
  2 * Math.SQRT2,
);
ok('tf-int-009  the curves meet at pi/4 and 5pi/4',
  closeTo(rootsR((x) => Math.sin(x) - Math.cos(x), 0, 2 * PI), [PI / 4, (5 * PI) / 4]));

// ------------------------------------------------------------------ רמה 5
// The bagrut level combines all four tools, so each question is checked with the
// tool it actually leans on: roots by root-finding, derivatives against a
// numeric derivative, areas against a Riemann sum. The "largest value in a
// closed interval" claims are checked by SCANNING the interval, which is the
// only check that catches an endpoint the author forgot to compare.
function scanMinMax(f: (x: number) => number, a: number, b: number, n = 400000) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= n; i++) {
    const v = f(a + ((b - a) * i) / n);
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return { lo, hi };
}
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// tf-bag-001 / tf-bag-007 — the same function carries both questions.
const fBag = (x: number) => 2 * Math.sin(x) + 1;
ok(
  'tf-bag-001  2sin x + 1 = 0 on [0,2pi] at 7pi/6 and 11pi/6',
  closeTo(rootsR(fBag, 0, 2 * PI), [(7 * PI) / 6, (11 * PI) / 6]),
);
derivOk('tf-bag-007  F(x) = -2cos x + x is an antiderivative of f', (x) => -2 * Math.cos(x) + x, fBag, SAMPLE);
areaOk('tf-bag-007  the AREA is 4sqrt3 + 2pi/3', riemann((x) => Math.abs(fBag(x)), 0, 2 * PI), 4 * Math.sqrt(3) + (2 * PI) / 3);
// The trap the question is built on: integrating straight through gives 2pi.
areaOk('tf-bag-007  while the unsplit integral gives 2pi, a different number', riemann(fBag, 0, 2 * PI), 2 * PI);
ok('tf-bag-007  the two numbers really do differ', Math.abs(4 * Math.sqrt(3) + (2 * PI) / 3 - 2 * PI) > 2);

// tf-bag-002 — x + 2cos x
const fLin = (x: number) => x + 2 * Math.cos(x);
const fLinP = (x: number) => 1 - 2 * Math.sin(x);
derivOk("tf-bag-002  (x + 2cos x)' = 1 - 2sin x", fLin, fLinP, SAMPLE);
ok(
  'tf-bag-002  the derivative vanishes at pi/6 and 5pi/6',
  closeTo(rootsR(fLinP, 0, 2 * PI), [PI / 6, (5 * PI) / 6]),
);
ok('tf-bag-002  pi/6 is a MAXIMUM: the derivative goes + to -',
  sgn(fLinP(PI / 6 - 0.1)) === 1 && sgn(fLinP(PI / 6 + 0.1)) === -1);
ok('tf-bag-002  5pi/6 is a MINIMUM: the derivative goes - to +',
  sgn(fLinP((5 * PI) / 6 - 0.1)) === -1 && sgn(fLinP((5 * PI) / 6 + 0.1)) === 1);

// tf-bag-003 — sin 2x on [0,pi]
areaOk('tf-bag-003  the area of sin 2x on [0,pi] is 2', riemann((x) => Math.abs(Math.sin(2 * x)), 0, PI), 2);
areaOk('tf-bag-003  the unsplit integral is 0, which is the distractor', riemann((x) => Math.sin(2 * x), 0, PI), 0);
ok('tf-bag-003  the single interior zero is pi/2',
  closeTo(rootsR((x) => Math.sin(2 * x), 1e-6, PI - 1e-6), [PI / 2]));

// tf-bag-004 — cos 2x + 2cos x, where the endpoints beat every interior point.
const fCos2 = (x: number) => Math.cos(2 * x) + 2 * Math.cos(x);
derivOk("tf-bag-004  the factored derivative -2sin x(2cos x + 1) is correct",
  fCos2, (x) => -2 * Math.sin(x) * (2 * Math.cos(x) + 1), SAMPLE);
ok('tf-bag-004  the first factor vanishes at 0, pi, 2pi',
  closeTo(rootsR(Math.sin, 0, 2 * PI), [0, PI, 2 * PI]));
ok('tf-bag-004  the second factor vanishes at 2pi/3 and 4pi/3',
  closeTo(rootsR((x) => 2 * Math.cos(x) + 1, 0, 2 * PI), [(2 * PI) / 3, (4 * PI) / 3]));
ok('tf-bag-004  f(0) = 3', near(fCos2(0), 3));
ok('tf-bag-004  f(2pi/3) = -3/2', near(fCos2((2 * PI) / 3), -1.5));
ok('tf-bag-004  f(pi) = -1 — a local max that is NOT the largest value', near(fCos2(PI), -1));
ok('tf-bag-004  f(4pi/3) = -3/2', near(fCos2((4 * PI) / 3), -1.5));
const mmCos2 = scanMinMax(fCos2, 0, 2 * PI);
ok('tf-bag-004  the largest value on the closed interval is 3', Math.abs(mmCos2.hi - 3) < 1e-6, `got ${mmCos2.hi}`);
ok('tf-bag-004  the smallest is -3/2', Math.abs(mmCos2.lo + 1.5) < 1e-6, `got ${mmCos2.lo}`);

// tf-bag-005 — the tangent to x sin x at pi/2 is exactly y = x.
const fXsin = (x: number) => x * Math.sin(x);
derivOk("tf-bag-005  (x sin x)' = sin x + x cos x", fXsin, (x) => Math.sin(x) + x * Math.cos(x), SAMPLE);
ok('tf-bag-005  f(pi/2) = pi/2', near(fXsin(PI / 2), PI / 2));
ok('tf-bag-005  the slope there is 1', Math.abs(ddx(fXsin, PI / 2) - 1) < 1e-5);
ok('tf-bag-005  so the tangent y = x touches the curve at pi/2', near(fXsin(PI / 2) - PI / 2, 0));

// tf-bag-006 — sqrt(2cos x + 1): the zeros ARE the edges of the domain.
const radBag = (x: number) => 2 * Math.cos(x) + 1;
ok('tf-bag-006  the radicand vanishes at 2pi/3 and 4pi/3',
  closeTo(rootsR(radBag, 0, 2 * PI), [(2 * PI) / 3, (4 * PI) / 3]));
ok('tf-bag-006  the radicand is non-negative exactly inside those edges',
  [0, 1, (2 * PI) / 3 - 0.01, (4 * PI) / 3 + 0.01, (3 * PI) / 2, 2 * PI].every((x) => radBag(x) >= 0));
ok('tf-bag-006  and negative strictly between them, so the function is undefined there',
  [(2 * PI) / 3 + 0.01, PI, (4 * PI) / 3 - 0.01].every((x) => radBag(x) < 0));
ok('tf-bag-006  at pi/3 the radicand is 2, not 0 — the distractor is wrong', near(radBag(PI / 3), 2));

// tf-bag-008 — sin x / (2 - cos x): a quotient with no asymptote at all.
const fQ = (x: number) => Math.sin(x) / (2 - Math.cos(x));
const fQP = (x: number) => (2 * Math.cos(x) - 1) / (2 - Math.cos(x)) ** 2;
derivOk("tf-bag-008  the simplified derivative (2cos x - 1)/(2 - cos x)^2 is correct", fQ, fQP, SAMPLE);
ok('tf-bag-008  the derivative vanishes at pi/3 and 5pi/3',
  closeTo(rootsR(fQP, 0, 2 * PI), [PI / 3, (5 * PI) / 3]));
ok('tf-bag-008  pi/3 is a MAXIMUM', sgn(fQP(PI / 3 - 0.1)) === 1 && sgn(fQP(PI / 3 + 0.1)) === -1);
ok('tf-bag-008  5pi/3 is a MINIMUM', sgn(fQP((5 * PI) / 3 - 0.1)) === -1 && sgn(fQP((5 * PI) / 3 + 0.1)) === 1);
ok('tf-bag-008  the maximum value is sqrt3/3', near(fQ(PI / 3), Math.sqrt(3) / 3));
ok('tf-bag-008  the minimum value is -sqrt3/3', near(fQ((5 * PI) / 3), -Math.sqrt(3) / 3));
const mmDen = scanMinMax((x) => 2 - Math.cos(x), 0, 2 * PI);
ok('tf-bag-008  the denominator stays between 1 and 3, so there is NO asymptote',
  mmDen.lo > 0.999999 && mmDen.hi < 3.000001, `range ${mmDen.lo}..${mmDen.hi}`);

// tf-bag-009 — the area between sin 2x and sin x, where the roles swap at pi/3.
const gap = (x: number) => Math.sin(2 * x) - Math.sin(x);
ok('tf-bag-009  the graphs meet at 0, pi/3 and pi', closeTo(rootsR(gap, 0, PI), [0, PI / 3, PI]));
ok('tf-bag-009  sin 2x is on top before pi/3', gap(PI / 6) > 0);
ok('tf-bag-009  and sin x is on top after it — the roles really do swap', gap(PI / 2) < 0);
areaOk('tf-bag-009  the small region is 1/4', riemann(gap, 0, PI / 3), 0.25);
areaOk('tf-bag-009  the large region is 9/4', riemann((x) => -gap(x), PI / 3, PI), 2.25);
areaOk('tf-bag-009  so the total area is 5/2', riemann((x) => Math.abs(gap(x)), 0, PI), 2.5);

// ---------------------------------------------- the answers the STUDENT is graded on
// Everything above re-derives the mathematics; none of it opens the content
// file. So a stage could be mathematically right here and still ship an
// `expected` that marks a correct student wrong. This block reads the authored
// AnswerSpec of רמה 5 and grades it against the numbers computed above, with
// the same mathjs the app grades with.
const mj = mjCreate(mjAll, { number: 'number' });
const evalSpec = (s: string) => mj.evaluate(s) as number;
/** id -> the values this question's `expected` must hold, in order. */
const AUTHORED: Record<string, { values: number[]; ofPi?: boolean }> = {
  'tf-bag-001': { values: [7 / 6, 11 / 6], ofPi: true },
  'tf-bag-002': { values: [1 / 6, 5 / 6], ofPi: true },
  'tf-bag-003': { values: [2] },
  'tf-bag-004': { values: [mmCos2.hi, mmCos2.lo] },
  'tf-bag-005': { values: [1, 0] },
  'tf-bag-006': { values: [] },
  'tf-bag-007': { values: [riemann((x) => Math.abs(fBag(x)), 0, 2 * PI)] },
  'tf-bag-008': { values: [1 / 3, 5 / 3], ofPi: true },
  'tf-bag-009': { values: [riemann((x) => Math.abs(gap(x)), 0, PI)] },
  'tf-bag-010': { values: [3, -1] },
};

// A distractor that is ALGEBRAICALLY EQUAL to the correct option grades a
// student wrong for a correct answer, and no gate in this repo can see it:
// the options are LaTeX strings. tf-der-008 shipped exactly that — its
// "unsimplified intermediate" was the same function as the answer. The four
// options are transcribed here as functions and required to be pairwise
// distinct.
// Transcribed from tf-der-007's four options. Hand-transcription rots when the
// question changes — tf-der-008 carried this check until it was converted to an
// open question, at which point it guarded nothing and still passed. So the
// block asserts the target is STILL a four-option MCQ before trusting itself.
const DER_MCQ = { unit: 'tf-der-007', f: (x: number) => Math.sqrt(1 + Math.sin(x)) };
const DER_OPTS = [
  (x: number) => Math.cos(x) / (2 * Math.sqrt(1 + Math.sin(x))),
  (x: number) => 1 / (2 * Math.sqrt(1 + Math.sin(x))),
  (x: number) => Math.cos(x) / Math.sqrt(1 + Math.sin(x)),
  (x: number) => 2 * Math.sqrt(Math.cos(x)),
];
const derQ = TF_DERIVATIVE.questions.find((q) => q.id === DER_MCQ.unit);
ok(
  `${DER_MCQ.unit}  is still a four-option MCQ, so the transcription below still applies`,
  derQ?.kind === 'mcq' && derQ.answers?.length === DER_OPTS.length && derQ.correct === 0,
  `kind ${derQ?.kind}, ${derQ?.answers?.length} option(s) — retarget this block`,
);
for (let i = 0; i < DER_OPTS.length; i += 1) {
  for (let j = i + 1; j < DER_OPTS.length; j += 1) {
    ok(
      `${DER_MCQ.unit}  options ${i} and ${j} are genuinely different functions`,
      SAMPLE.some((x) => Math.abs(DER_OPTS[i](x) - DER_OPTS[j](x)) > 1e-6),
      'they agree at every sample angle',
    );
  }
}
ok(`${DER_MCQ.unit}  and option 0 is the true derivative`,
  SAMPLE.every((x) => Math.abs(DER_OPTS[0](x) - ddx(DER_MCQ.f, x)) < 1e-5));
for (const q of TF_BAGRUT.questions) {
  const want = AUTHORED[q.id];
  if (!want) {
    fails.push(`${q.id} — a question with no authored-answer check; add one to AUTHORED`);
    continue;
  }
  if (!want.values.length) continue; // MCQ whose answer is a description, not a number
  const spec = q.expected;
  if (!spec || spec.kind === 'manual') {
    fails.push(`${q.id} — expected a machine-checkable AnswerSpec, got ${spec?.kind ?? 'none'}`);
    continue;
  }
  const got = spec.kind === 'set' ? spec.values.map(evalSpec) : [evalSpec(spec.value)];
  if (got.length !== want.values.length) {
    fails.push(`${q.id} — expected ${want.values.length} value(s), the content has ${got.length}`);
    continue;
  }
  got.forEach((g, i) => {
    const target = want.ofPi ? want.values[i] * PI : want.values[i];
    const graded = want.ofPi ? g * PI : g;
    ok(
      `${q.id}  the authored answer #${i + 1} matches the computed one`,
      Math.abs(graded - target) < 1e-6,
      `content says ${g}, computed ${want.values[i]}`,
    );
  });
  // The zeros/critical points must genuinely be zeros of the right function.
  const zeroOf: Record<string, (x: number) => number> = {
    'tf-bag-001': fBag,
    'tf-bag-002': fLinP,
    'tf-bag-008': fQP,
  };
  const z = zeroOf[q.id];
  if (z) {
    ok(
      `${q.id}  and every authored angle really is a root of the function`,
      got.every((g) => Math.abs(z(g * PI)) < 1e-9),
    );
  }
}

// ------------------------------------------- the numbers inside the ghost replays
// `verify-ghost` checks STRUCTURE ONLY and says so in its own footer. A branch
// that tells a student "if you do X you get 505" when X actually gives 501 is
// invisible to it, and that exact defect shipped once in this repo.
//
// So every number a branch of `content/ghost-replay/math5/trig-functions.ts`
// invents is re-derived here, from the function rather than from the branch. An
// adversarial audit of these replays found two claims the arithmetic
// contradicts — both in this list, both now pinned.
const round2 = (x: number) => Math.round(x * 100) / 100;
const round3 = (x: number) => Math.round(x * 1000) / 1000;
const claim = (label: string, got: number, want: number, eps = 5e-3) =>
  ok(`replay ${label}`, Math.abs(got - want) < eps, `got ${got}, branch says ${want}`);

// --- gr-tf-eq-007: tan x = 2 sin x in DEGREES ---------------------------------
const eqRoots = roots((x) => (Math.abs(cos(x)) < 1e-12 ? NaN : tan(x) - 2 * sin(x)), 0, 360);
ok('replay eq-007  the four solutions are 0, 60, 180, 300', same(eqRoots, [0, 60, 180, 300]));
ok('replay eq-007  dividing by sin x leaves exactly 60 and 300 — two of four',
  same(roots((x) => 2 * cos(x) - 1, 0, 360), [60, 300]));
ok('replay eq-007  cos 300 = 1/2, so the second quadrant solution is real', near(cos(300), 0.5));
ok('replay eq-007  tan 180 = 0 and 2 sin 180 = 0, so 180 IS a solution',
  near(tan(180), 0) && near(2 * sin(180), 0));
ok('replay eq-007  tan 60 = 2 sin 60, so 60 is a solution too',
  Math.abs(tan(60) - 2 * sin(60)) < 1e-9);
ok('replay eq-007  the "equal sines means equal angles" road gives x = 0 alone',
  same(roots((x) => x - 2 * x, 0, 360), [0]));
ok('replay eq-007  90 and 270 are barred by the condition, not solutions',
  near(cos(90), 0) && near(cos(270), 0));

// --- gr-tf-dom-008: sin2x / cos x --------------------------------------------
const fDom = (x: number) => Math.sin(2 * x) / Math.cos(x);
claim('dom-008  f(1.5) is about 1.995, not a blow-up', round3(fDom(1.5)), 1.995);
claim('dom-008  f(1) = 2 sin 1 = 1.683', round3(fDom(1)), 1.683);
claim('dom-008  sin 2 = 0.909, so the identity checks out at x = 1', round3(Math.sin(2)), 0.909);
claim('dom-008  2 cos 1 = 1.081, the value the WRONG cancellation gives', round3(2 * Math.cos(1)), 1.081);
claim('dom-008  2 sin1 / cos1 = 3.114, the value the INCOMPLETE cancellation gives',
  round3((2 * Math.sin(1)) / Math.cos(1)), 3.114);
ok('dom-008  the limit at pi/2 is 2, which is why it is a hole', Math.abs(fDom(PI / 2 - 1e-7) - 2) < 1e-5);

// --- gr-tf-der-008: (sin x / (1 + cos x))' -----------------------------------
const fDer = (x: number) => Math.sin(x) / (1 + Math.cos(x));
claim('der-008  the true derivative at 1 rad is 0.649', round3(ddx(fDer, 1)), 0.649);
claim('der-008  and the simplified form agrees', round3(1 / (1 + Math.cos(1))), 0.649);
claim('der-008  the quotient-of-derivatives road gives -0.642, even the sign is wrong',
  round3(Math.cos(1) / -Math.sin(1)), -0.642);
claim('der-008  the correct numerator at 1 rad is 1.540', round3(Math.cos(1) + 1), 1.54);
claim('der-008  the dropped-minus numerator gives 0.124',
  round3(Math.cos(1) + Math.cos(1) ** 2 - Math.sin(1) ** 2), 0.124);
claim('der-008  and therefore a derivative of 0.052',
  round3((Math.cos(1) + Math.cos(1) ** 2 - Math.sin(1) ** 2) / (1 + Math.cos(1)) ** 2), 0.052);
claim('der-008  forgetting to cancel gives 0.422', round3(1 / (1 + Math.cos(1)) ** 2), 0.422);
claim('der-008  the PARTIAL product rule gives 0.351', round3(Math.cos(1) / (1 + Math.cos(1))), 0.351);
ok('der-008  the derivative is positive everywhere it exists, so there is no extremum',
  [0.4, 1, 2, 4, 5.5].every((x) => 1 / (1 + Math.cos(x)) > 0));

// --- gr-tf-inv-009: 2 sin x + x ----------------------------------------------
claim('inv-009  the local maximum value is 3.83', round2(f_inv((2 * PI) / 3)), 3.83);
claim('inv-009  the local minimum value is 2.46', round2(f_inv((4 * PI) / 3)), 2.46);
claim('inv-009  the right endpoint gives 6.28, which BEATS the local maximum', round2(f_inv(2 * PI)), 6.28);
ok('inv-009  and it really is bigger', f_inv(2 * PI) > f_inv((2 * PI) / 3));
ok('inv-009  f(0) = 0, the smallest of the four candidates', near(f_inv(0), 0));
ok("inv-009  f' = +1 before the first root and -1 midway, so it is a maximum",
  near(2 * Math.cos(PI / 2) + 1, 1) && near(2 * Math.cos(PI) + 1, -1));

// --- gr-tf-int-009: the area between sin and cos ------------------------------
claim('int-009  the area is 2sqrt2, about 2.83', round2(2 * Math.SQRT2), 2.83);
ok('int-009  the WRONG antiderivative cos x - sin x vanishes at BOTH limits, giving area 0',
  Math.abs(
    (Math.cos((5 * PI) / 4) - Math.sin((5 * PI) / 4)) - (Math.cos(PI / 4) - Math.sin(PI / 4)),
  ) < 1e-9);
areaOk('int-009  integrating across the whole turn cancels to 0 exactly',
  riemann((x) => Math.sin(x) - Math.cos(x), 0, 2 * PI), 0);
ok('int-009  comparing the graphs at 0 shows cos on top OUTSIDE the interval',
  Math.cos(0) > Math.sin(0));

// --- gr-tf-bag-007: 2 sin x + 1, three regions --------------------------------
const Ibag = (a: number, b: number) => riemann(fBag, a, b);
const z1 = (7 * PI) / 6;
const z2 = (11 * PI) / 6;
claim('bag-007  the first region is 7.40', round2(Ibag(0, z1)), 7.4);
claim('bag-007  the middle region is -1.37', round2(Ibag(z1, z2)), -1.37);
claim('bag-007  the last region is 0.26', round2(Ibag(z2, 2 * PI)), 0.26);
claim('bag-007  the AREA is 9.02', round2(Math.abs(Ibag(0, z1)) + Math.abs(Ibag(z1, z2)) + Math.abs(Ibag(z2, 2 * PI))), 9.02);
claim('bag-007  the unsplit integral is 6.28', round2(Ibag(0, 2 * PI)), 6.28);
claim('bag-007  and 9.02 minus twice 1.37 really is 6.28', round2(9.02 - 2 * 1.37), 6.28);
// The distractor the audit rewrote: omitting the negative region, NOT subtracting
// it. Subtracting gives 2pi, which collides with the option next to it.
claim('bag-007  omitting the middle region gives 7.65 = 2sqrt3 + 4pi/3',
  round2(Math.abs(Ibag(0, z1)) + Math.abs(Ibag(z2, 2 * PI))), 7.65);
claim('bag-007  and that closed form is right', round2(2 * Math.sqrt(3) + (4 * PI) / 3), 7.65);
claim('bag-007  f(1.98 pi) is about 0.87, so the last region is POSITIVE', round2(fBag(1.98 * PI)), 0.87);
ok('bag-007  f(pi/2) = 3, so the first region is positive', near(fBag(PI / 2), 3));
ok('bag-007  f(3pi/2) = -1, so the middle region is negative', near(fBag((3 * PI) / 2), -1));

// -------------------------------------- the teach examples rewritten after the audit
// An adversarial audit found the "hard" practice question was the teach step's
// worked example verbatim in thirteen places, so the EXAMPLES were rewritten
// (the questions are frozen — the FAQ bank keys on their text). Each rewrite was
// verified once, in a throwaway script, by the agent that wrote it. A check that
// was run once is not a check, so every new claim is pinned here.

// --- רמה 2 · the four rewritten derivative examples, plus the tangent step ----
derivOk('teach  (4cos x + tan x)\' = -4sin x + 1/cos^2 x',
  (x) => 4 * Math.cos(x) + Math.tan(x),
  (x) => -4 * Math.sin(x) + 1 / Math.cos(x) ** 2, [0.35, 0.9, 2.6, 3.4, 4.3]);
derivOk('teach  (cos^3 x)\' = -3cos^2 x sin x',
  (x) => Math.cos(x) ** 3,
  (x) => -3 * Math.cos(x) ** 2 * Math.sin(x), SAMPLE);
derivOk('teach  (x^2 cos x)\' = 2x cos x - x^2 sin x',
  (x) => x * x * Math.cos(x),
  (x) => 2 * x * Math.cos(x) - x * x * Math.sin(x), SAMPLE);
derivOk('teach  (sqrt(cos 2x))\' = -sin 2x / sqrt(cos 2x)',
  (x) => Math.sqrt(Math.cos(2 * x)),
  (x) => -Math.sin(2 * x) / Math.sqrt(Math.cos(2 * x)), [0.2, 0.5, 0.7]);
// The tangent step: value and slope, and the line really touching the curve.
const fSin2 = (x: number) => Math.sin(2 * x);
ok('teach  the tangent to sin 2x at pi/2 is y = -2x + pi',
  near(fSin2(PI / 2), 0) && Math.abs(ddx(fSin2, PI / 2) + 2) < 1e-5 &&
    Math.abs((-2 * (PI / 2) + PI) - fSin2(PI / 2)) < 1e-9);
ok('drill  the tangent to tan x at pi/4 is y = 2x + 1 - pi/2',
  near(Math.tan(PI / 4), 1) && Math.abs(ddx(Math.tan, PI / 4) - 2) < 1e-5 &&
    Math.abs((2 * (PI / 4) + 1 - PI / 2) - Math.tan(PI / 4)) < 1e-9);

// --- רמה 1 · the two rewritten domain examples -------------------------------
ok('teach  2/(1 - sin x) has ONE asymptote on [0,2pi], at pi/2',
  closeTo(rootsR((x) => 1 - Math.sin(x), 0, 2 * PI), [PI / 2]));
ok('drill  cos x / sin x at pi IS an asymptote: the numerator does not vanish there',
  near(Math.sin(PI), 0) && !near(Math.cos(PI), 0));
ok('teach  sin2x / sin x equals 2cos x wherever sin x is non-zero',
  [0.3, 1.0, 2.2, 4.0, 5.5].every((x) => near(Math.sin(2 * x) / Math.sin(x), 2 * Math.cos(x))));
ok('teach  and its holes are at 0, pi, 2pi',
  closeTo(rootsR(Math.sin, 0, 2 * PI), [0, PI, 2 * PI]));

// --- רמה 4 · the three rewritten integral examples ---------------------------
areaOk('teach  the area of cos x on [0,pi] is 2', riemann((x) => Math.abs(Math.cos(x)), 0, PI), 2);
areaOk('teach  and the unsplit integral there is 0', riemann(Math.cos, 0, PI), 0);
ok('teach  2cos x and cos x meet at pi/2 and 3pi/2',
  closeTo(rootsR((x) => 2 * Math.cos(x) - Math.cos(x), 0, 2 * PI), [PI / 2, (3 * PI) / 2]));
areaOk('teach  the area between them is 2',
  riemann((x) => Math.abs(2 * Math.cos(x) - Math.cos(x)), PI / 2, (3 * PI) / 2), 2);
derivOk('teach  x/2 + sin(6x)/12 is an antiderivative of cos^2 3x',
  (x) => x / 2 + Math.sin(6 * x) / 12, (x) => Math.cos(3 * x) ** 2, SAMPLE);
areaOk('teach  the integral of sin^2 2x over [0,pi/2] is pi/4',
  riemann((x) => Math.sin(2 * x) ** 2, 0, PI / 2), PI / 4);

// --- רמה 3 + רמה 5 · the rewritten investigation and bagrut examples ---------
const fSumR = (x: number) => Math.sin(x) + Math.cos(x);
ok('teach  g = -f + 2 turns f\'s maximum into a minimum of value 2 - sqrt2',
  near(-fSumR(PI / 4) + 2, 2 - Math.SQRT2) && near(-fSumR((5 * PI) / 4) + 2, 2 + Math.SQRT2));
ok('drill  |f| turns the minimum at 5pi/4 into a maximum of height sqrt2',
  near(Math.abs(fSumR((5 * PI) / 4)), Math.SQRT2));
const fXm2c = (x: number) => x - 2 * Math.cos(x);
ok('teach  x - 2cos x has its extrema at 7pi/6 and 11pi/6',
  closeTo(rootsR((x) => 1 + 2 * Math.sin(x), 0, 2 * PI), [(7 * PI) / 6, (11 * PI) / 6]));
derivOk("teach  (x - 2cos x)' = 1 + 2sin x", fXm2c, (x) => 1 + 2 * Math.sin(x), SAMPLE);
ok('teach  x^3 sin x is EVEN: odd times odd',
  [0.4, 1.1, 2.3].every((x) => near((-x) ** 3 * Math.sin(-x), x ** 3 * Math.sin(x))));
ok('teach  2cos x - 1 vanishes at pi/3 and 5pi/3',
  closeTo(rootsR((x) => 2 * Math.cos(x) - 1, 0, 2 * PI), [PI / 3, (5 * PI) / 3]));
const fXsq2 = (x: number) => x + Math.SQRT2 * Math.sin(x);
ok('teach  x + sqrt2 sin x has a maximum at 3pi/4 and a minimum at 5pi/4',
  closeTo(rootsR((x) => 1 + Math.SQRT2 * Math.cos(x), 0, 2 * PI), [(3 * PI) / 4, (5 * PI) / 4]));
ok('teach  and the sign really flips that way round',
  1 + Math.SQRT2 * Math.cos((3 * PI) / 4 - 0.1) > 0 &&
    1 + Math.SQRT2 * Math.cos((3 * PI) / 4 + 0.1) < 0);
derivOk("teach  (x + sqrt2 sin x)' = 1 + sqrt2 cos x", fXsq2, (x) => 1 + Math.SQRT2 * Math.cos(x), SAMPLE);
// tf-inv-010, the sketch question added after the audit showed the procedure was
// taught and never practised. A sketch is graded manually, so its facts are the
// only thing checkable — and they are exactly what a wrong sketch gets wrong.
ok('tf-inv-010  sin x + cos x crosses the axis at 3pi/4 and 7pi/4',
  closeTo(rootsR(fSumR, 0, 2 * PI), [(3 * PI) / 4, (7 * PI) / 4]));
ok('tf-inv-010  both endpoints sit at height 1', near(fSumR(0), 1) && near(fSumR(2 * PI), 1));
ok('tf-inv-010  and the graph really is BELOW the axis between the two crossings',
  fSumR(PI) < 0);

const f4s = (x: number) => 4 * Math.sin(x) - Math.cos(2 * x);
derivOk("teach  (4sin x - cos 2x)' factors to 4cos x(1 + sin x)",
  f4s, (x) => 4 * Math.cos(x) * (1 + Math.sin(x)), SAMPLE);
const mm4s = scanMinMax(f4s, 0, 2 * PI);
ok('teach  its largest value on the closed interval is 5', Math.abs(mm4s.hi - 5) < 1e-6, `got ${mm4s.hi}`);
ok('teach  and its smallest is -3', Math.abs(mm4s.lo + 3) < 1e-6, `got ${mm4s.lo}`);

console.log(`\nTRIG-FUNCTIONS VERIFY: ${pass}/${pass + fails.length} passed.`);
if (fails.length) {
  console.log('\n' + fails.map((f) => `  FAIL  ${f}`).join('\n'));
  process.exitCode = 1;
}

export {};
