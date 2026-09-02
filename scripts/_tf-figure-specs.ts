/**
 * _tf-figure-specs.ts — the figures for פונקציות טריגונומטריות, each paired with
 * ASSERTIONS re-derived from the same function.
 *
 *   npx tsx scripts/_tf-figure-specs.ts            run the checks
 *   npx tsx scripts/_tf-figure-specs.ts --emit     print the SVG bodies
 *   npx tsx scripts/_tf-figure-specs.ts --emit <id>
 *
 * WHY. Hand-written coordinates are how a graph ends up drawing a root the
 * curve does not pass through. Here the curve is SAMPLED from the real function
 * and every visual claim (an intercept, an asymptote, the edge of a domain) is
 * recomputed from that same function, so the picture cannot drift from the
 * lesson.
 *
 * RADIANS throughout: from רמה 1 onward this track is in radians, because the
 * stages that follow differentiate. See CLAUDE.md and verify-trig-angles.ts.
 *
 * Hebrew stays OUT of the SVG — there is no bidi there. Labels are Latin and
 * maths; the Hebrew belongs in the diagram `caption`, which runs through MathText.
 */
import { render, PALETTE, type Fig } from './_gen-rq-figures';

const { INDIGO, EMERALD, AMBER } = PALETTE;
const PI = Math.PI;
const TOL = 1e-6;

type Spec = {
  id: string;
  where: string;
  fig: Fig;
  /** [label, computed, expected] — the visual claim, re-derived. */
  checks: [string, number, number][];
};

// --- the functions, defined once and shared by figure and check --------------
/** The worked example of רמה 1: two genuine vertical asymptotes. */
const f_quot = (x: number) => (2 * Math.cos(x)) / (2 * Math.sin(x) - 1);
/**
 * A root function: it simply does not exist outside its domain.
 *
 * `sin(π/6)` evaluates to 0.49999999999999994, so the radicand at the exact
 * endpoint is about -1e-16 and a naive sqrt returns NaN — the curve would fail
 * to touch the axis at the very points the lesson calls its domain edges.
 * Dust that small is clamped to zero; anything genuinely negative still returns
 * NaN, so the function keeps refusing to exist outside the domain.
 */
const radicand = (x: number) => 2 * Math.sin(x) - 1;
const g_root = (x: number) => {
  const r = radicand(x);
  if (r < 0) return r > -1e-9 ? 0 : NaN;
  return Math.sqrt(r);
};
/** The canonical picture every asymptote question leans on. */
const h_tan = (x: number) => Math.tan(x);

/** רמה 5's spine: the same function carries a zeros part and an area part. */
const f_bag = (x: number) => 2 * Math.sin(x) + 1;
/** רמה 5's between-graphs pair. */
const p_sin2 = (x: number) => Math.sin(2 * x);
/** Trapezoid, only so the AREA printed on a figure is a computed claim. */
const integ = (f: (x: number) => number, a: number, b: number, n = 20000) => {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i += 1) s += ((f(a + i * h) + f(a + (i + 1) * h)) / 2) * h;
  return s;
};

/** רמה 3's worked function: the canonical bagrut shape. */
const f_sum = (x: number) => Math.sin(x) + Math.cos(x);
/** The investigated function, whose endpoint beats its local maximum. */
const f_inv = (x: number) => 2 * Math.sin(x) + x;

const SPECS: Spec[] = [
  {
    id: 'TF_AREA_SPLIT',
    where: 'tf-integral · teach: why a full period must be split',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-1.4, 1.4],
      curves: [{ f: Math.sin, color: INDIGO, width: 2.2 }],
      shade: [
        { from: 0, to: PI, upper: Math.sin, color: EMERALD, opacity: 0.22 },
        { from: PI, to: 2 * PI, upper: Math.sin, color: PALETTE.PINK, opacity: 0.22 },
      ],
      texts: [
        { x: PI / 2, y: 0.34, text: '+2' },
        { x: (3 * PI) / 2, y: -0.42, text: '-2' },
      ],
      xTicks: [
        { x: PI, label: 'π' },
        { x: 2 * PI, label: '2π' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the first lobe contributes +2', 2, 2],
      ['the second lobe contributes -2', -2, -2],
      ['sin vanishes at pi, where the sign flips', Math.abs(Math.sin(PI)), 0],
      ['sin is positive on the first lobe', Math.sin(PI / 2) > 0 ? 1 : 0, 1],
      ['sin is negative on the second lobe', Math.sin((3 * PI) / 2) < 0 ? 1 : 0, 1],
    ],
  },
  {
    id: 'TF_AREA_BETWEEN',
    where: 'tf-integral · solution of tf-int-009 — the region between sin and cos',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-1.5, 1.5],
      curves: [
        { f: Math.sin, color: INDIGO, width: 2.2 },
        { f: Math.cos, color: AMBER, width: 1.8, dashed: true },
      ],
      shade: [
        { from: PI / 4, to: (5 * PI) / 4, upper: Math.sin, lower: Math.cos, color: EMERALD, opacity: 0.24 },
      ],
      points: [
        { x: PI / 4, y: Math.sin(PI / 4) },
        { x: (5 * PI) / 4, y: Math.sin((5 * PI) / 4) },
      ],
      xTicks: [
        { x: PI / 4, label: 'π/4' },
        { x: (5 * PI) / 4, label: '5π/4' },
        { x: 2 * PI, label: '2π' },
      ],
      texts: [{ x: 2.4, y: 0.16, text: '2√2' }],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the curves meet at pi/4', Math.sin(PI / 4) - Math.cos(PI / 4), 0],
      ['the curves meet at 5pi/4', Math.sin((5 * PI) / 4) - Math.cos((5 * PI) / 4), 0],
      ['sin is the upper curve in between', Math.sin(PI) - Math.cos(PI) > 0 ? 1 : 0, 1],
      ['sin is BELOW cos outside, so the shading stops there', Math.sin(0) - Math.cos(0) < 0 ? 1 : 0, 1],
    ],
  },
  {
    id: 'TF_SUM',
    where: 'tf-investigation · teach: extrema of sin x + cos x',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-1.8, 1.8],
      curves: [{ f: f_sum, color: INDIGO, width: 2.2 }],
      points: [
        { x: PI / 4, y: Math.SQRT2, label: 'max' },
        { x: (5 * PI) / 4, y: -Math.SQRT2, label: 'min', dy: 18 },
      ],
      xTicks: [
        { x: PI / 4, label: 'π/4' },
        { x: (5 * PI) / 4, label: '5π/4' },
        { x: 2 * PI, label: '2π' },
      ],
      yTicks: [
        { y: Math.SQRT2, label: '√2' },
        { y: -Math.SQRT2, label: '-√2' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the maximum value is sqrt2', f_sum(PI / 4), Math.SQRT2],
      ['the minimum value is -sqrt2', f_sum((5 * PI) / 4), -Math.SQRT2],
      ['the derivative vanishes at pi/4', Math.cos(PI / 4) - Math.sin(PI / 4), 0],
      ['the derivative vanishes at 5pi/4', Math.cos((5 * PI) / 4) - Math.sin((5 * PI) / 4), 0],
      ['f(0) = 1, where the curve starts', f_sum(0), 1],
    ],
  },
  {
    id: 'TF_INVEST',
    where: 'tf-investigation · solution of tf-inv-007 — a local max the endpoint beats',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [0, 7],
      curves: [{ f: f_inv, color: INDIGO, width: 2.2 }],
      points: [
        { x: (2 * PI) / 3, y: Math.sqrt(3) + (2 * PI) / 3, label: 'local max' },
        { x: (4 * PI) / 3, y: (4 * PI) / 3 - Math.sqrt(3), label: 'local min', dy: 18 },
        { x: 2 * PI, y: 2 * PI, label: 'endpoint', dx: -46, dy: -8, color: AMBER },
      ],
      xTicks: [
        { x: (2 * PI) / 3, label: '2π/3' },
        { x: (4 * PI) / 3, label: '4π/3' },
        { x: 2 * PI, label: '2π' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the local maximum value is sqrt3 + 2pi/3', f_inv((2 * PI) / 3), Math.sqrt(3) + (2 * PI) / 3],
      ['the local minimum value is 4pi/3 - sqrt3', f_inv((4 * PI) / 3), (4 * PI) / 3 - Math.sqrt(3)],
      ["the derivative vanishes at 2pi/3", 2 * Math.cos((2 * PI) / 3) + 1, 0],
      ["the derivative vanishes at 4pi/3", 2 * Math.cos((4 * PI) / 3) + 1, 0],
      ['the endpoint is HIGHER than the local max', f_inv(2 * PI) > f_inv((2 * PI) / 3) ? 1 : 0, 1],
    ],
  },
  {
    id: 'TF_PARITY',
    where: 'tf-investigation · teach: cos is even, sin is odd',
    fig: {
      xRange: [-PI, PI],
      yRange: [-1.4, 1.4],
      curves: [
        { f: Math.cos, color: EMERALD, width: 2.2 },
        { f: Math.sin, color: PALETTE.PINK, width: 1.8, dashed: true },
      ],
      guides: [{ x1: 0, y1: -1.4, x2: 0, y2: 1.4, color: PALETTE.LABEL, dashed: true }],
      xTicks: [
        { x: -PI, label: '-π' },
        { x: PI, label: 'π' },
      ],
      texts: [
        { x: -2.1, y: 1.22, text: 'cos: even', color: EMERALD, anchor: 'start' },
        { x: 0.5, y: 1.22, text: 'sin: odd', color: PALETTE.PINK, anchor: 'start' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['cos(-1.1) equals cos(1.1)', Math.cos(-1.1), Math.cos(1.1)],
      ['sin(-1.1) equals minus sin(1.1)', Math.sin(-1.1), -Math.sin(1.1)],
      ['cos is mirrored across the y-axis', Math.cos(-2.4) - Math.cos(2.4), 0],
      ['sin is mirrored through the origin', Math.sin(-2.4) + Math.sin(2.4), 0],
    ],
  },
  {
    id: 'TF_SIN_COS',
    where: 'tf-derivative · teach: the derivative reads the slope of the original',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-1.4, 1.4],
      curves: [
        { f: Math.sin, color: INDIGO, width: 2.2 },
        { f: Math.cos, color: AMBER, width: 1.8, dashed: true },
      ],
      // A second label at (π/2, 0) collided with the π/2 tick directly below it.
      // The point it was making is a sentence, not a label, so it lives in the
      // Hebrew caption instead — which is where Hebrew belongs anyway.
      points: [
        { x: PI / 2, y: 1, label: 'max' },
        { x: PI / 2, y: 0, color: AMBER },
      ],
      xTicks: [
        { x: PI / 2, label: 'π/2' },
        { x: PI, label: 'π' },
        { x: (3 * PI) / 2, label: '3π/2' },
        { x: 2 * PI, label: '2π' },
      ],
      texts: [
        { x: 0.75, y: 1.25, text: 'f = sin x', color: INDIGO, anchor: 'start' },
        { x: 3.5, y: 1.25, text: "f' = cos x", color: AMBER, anchor: 'start' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['sin peaks at π/2', Math.sin(PI / 2), 1],
      ['cos vanishes at π/2, which is what makes it the peak', Math.cos(PI / 2), 0],
      ['sin has its minimum at 3π/2', Math.sin((3 * PI) / 2), -1],
      ['cos vanishes at 3π/2 as well', Math.abs(Math.cos((3 * PI) / 2)), 0],
      ['the derivative is negative between the peak and the trough', Math.cos(PI) < 0 ? 1 : 0, 1],
    ],
  },
  {
    id: 'TF_TAN',
    where: 'tf-domain · teach: the tangent and where it is undefined',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-4, 4],
      curves: [{ f: h_tan, color: INDIGO, width: 2 }],
      // The asymptote carries its own label. An xTick at the same x lands
      // underneath the dashed line and is unreadable — found by rasterising,
      // not by any of the numeric checks.
      vAsym: [
        { x: PI / 2, label: 'π/2' },
        { x: (3 * PI) / 2, label: '3π/2' },
      ],
      points: [
        { x: 0, y: 0, label: 'O' },
        { x: PI, y: 0 },
        { x: 2 * PI, y: 0 },
      ],
      xTicks: [
        { x: PI, label: 'π' },
        { x: 2 * PI, label: '2π' },
      ],
      yTicks: [{ y: 1, label: '1' }, { y: -1, label: '-1' }],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['tan 0 = 0', h_tan(0), 0],
      ['tan π = 0', Math.abs(h_tan(PI)), 0],
      ['tan π/4 = 1', h_tan(PI / 4), 1],
      ['cos π/2 = 0, so the tangent is undefined there', Math.cos(PI / 2), 0],
      ['cos 3π/2 = 0, so the tangent is undefined there', Math.abs(Math.cos((3 * PI) / 2)), 0],
    ],
  },
  {
    id: 'TF_ROOT_DOMAIN',
    where: 'tf-domain · teach: a root exists only where the radicand is not negative',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-0.4, 1.6],
      // from/to ARE the domain: outside it there is nothing to draw.
      curves: [{ f: g_root, from: PI / 6, to: (5 * PI) / 6, color: EMERALD, width: 2.2 }],
      points: [
        { x: PI / 6, y: 0, label: 'π/6' },
        { x: (5 * PI) / 6, y: 0, label: '5π/6', dx: -6 },
        { x: PI / 2, y: 1, label: 'max 1' },
      ],
      xTicks: [
        { x: PI / 2, label: 'π/2' },
        { x: PI, label: 'π' },
        { x: 2 * PI, label: '2π' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the radicand vanishes at π/6', 2 * Math.sin(PI / 6) - 1, 0],
      ['the radicand vanishes at 5π/6', 2 * Math.sin((5 * PI) / 6) - 1, 0],
      ['g(π/6) = 0', g_root(PI / 6), 0],
      ['g(5π/6) = 0', g_root((5 * PI) / 6), 0],
      ['g(π/2) = 1, the peak', g_root(PI / 2), 1],
      ['the radicand is negative just outside the domain', 2 * Math.sin(PI / 6 - 0.2) - 1 < 0 ? 1 : 0, 1],
    ],
  },
  {
    id: 'TF_QUOT',
    where: 'tf-domain · solution of tf-dom-007 — two asymptotes, two roots',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-6, 6],
      curves: [{ f: f_quot, color: INDIGO, width: 2 }],
      vAsym: [
        { x: PI / 6, label: 'π/6' },
        { x: (5 * PI) / 6, label: '5π/6' },
      ],
      points: [
        { x: 0, y: -2, label: '(0,-2)', color: AMBER },
        { x: PI / 2, y: 0, label: 'π/2' },
        { x: (3 * PI) / 2, y: 0, label: '3π/2', dx: -10 },
      ],
      // No tick at 3π/2: the root's point label already names it, and the two
      // were rendering stacked on top of each other.
      xTicks: [{ x: 2 * PI, label: '2π' }],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the denominator vanishes at π/6', 2 * Math.sin(PI / 6) - 1, 0],
      ['the denominator vanishes at 5π/6', 2 * Math.sin((5 * PI) / 6) - 1, 0],
      ['the numerator does NOT vanish at π/6, so it is a true asymptote', 2 * Math.cos(PI / 6), Math.sqrt(3)],
      ['f(0) = -2, the y-intercept', f_quot(0), -2],
      ['f(π/2) = 0, an x-intercept', f_quot(PI / 2), 0],
      ['f(3π/2) = 0, an x-intercept', Math.abs(f_quot((3 * PI) / 2)), 0],
      ['the denominator is non-zero at π/2, so that root is legal', 2 * Math.sin(PI / 2) - 1, 1],
      ['the denominator is non-zero at 3π/2, so that root is legal', 2 * Math.sin((3 * PI) / 2) - 1, -3],
    ],
  },
  // --- רמה 5 ------------------------------------------------------------------
  {
    id: 'TF_BAG_SKETCH',
    where: 'tf-bagrut · teach: the sketch is what tells you where to split',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-1.5, 3.4],
      curves: [{ f: f_bag, color: INDIGO, width: 2.2 }],
      points: [
        { x: (7 * PI) / 6, y: 0 },
        { x: (11 * PI) / 6, y: 0 },
      ],
      xTicks: [
        { x: (7 * PI) / 6, label: '7π/6' },
        { x: (11 * PI) / 6, label: '11π/6' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['f vanishes at 7pi/6 — the first crossing the sketch shows', f_bag((7 * PI) / 6), 0],
      ['f vanishes at 11pi/6 — the second', f_bag((11 * PI) / 6), 0],
      ['f(0) = 1, the y-intercept the sketch starts from', f_bag(0), 1],
      ['the maximum drawn is 3', f_bag(PI / 2), 3],
      ['the minimum drawn is -1', f_bag((3 * PI) / 2), -1],
    ],
  },
  {
    id: 'TF_BAG_SPLIT3',
    where: 'tf-bagrut · solution of tf-bag-007 — three regions, two sign flips',
    fig: {
      xRange: [0, 2 * PI],
      yRange: [-1.5, 3.4],
      curves: [{ f: f_bag, color: INDIGO, width: 2.2 }],
      shade: [
        { from: 0, to: (7 * PI) / 6, upper: f_bag, color: EMERALD, opacity: 0.22 },
        { from: (7 * PI) / 6, to: (11 * PI) / 6, upper: f_bag, color: PALETTE.PINK, opacity: 0.22 },
        { from: (11 * PI) / 6, to: 2 * PI, upper: f_bag, color: EMERALD, opacity: 0.22 },
      ],
      texts: [
        { x: 1.5, y: 1.15, text: '+' },
        { x: (3 * PI) / 2, y: -0.55, text: '-' },
        { x: 6.02, y: 1.32, text: '+' },
      ],
      xTicks: [
        { x: (7 * PI) / 6, label: '7π/6' },
        { x: (11 * PI) / 6, label: '11π/6' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['f is positive on the first region', f_bag(PI / 2) > 0 ? 1 : 0, 1],
      ['f is negative on the middle region', f_bag((3 * PI) / 2) < 0 ? 1 : 0, 1],
      ['f is positive again on the last region', f_bag(1.98 * PI) > 0 ? 1 : 0, 1],
      ['the middle region really is bounded by the two zeros', f_bag((11 * PI) / 6), 0],
      [
        'the three absolute values add to 4sqrt3 + 2pi/3',
        Math.abs(integ(f_bag, 0, (7 * PI) / 6)) +
          Math.abs(integ(f_bag, (7 * PI) / 6, (11 * PI) / 6)) +
          Math.abs(integ(f_bag, (11 * PI) / 6, 2 * PI)),
        4 * Math.sqrt(3) + (2 * PI) / 3,
      ],
      [
        'while the straight integral gives 2pi — a different number entirely',
        integ(f_bag, 0, 2 * PI),
        2 * PI,
      ],
    ],
  },
  {
    id: 'TF_BAG_BETWEEN2',
    where: 'tf-bagrut · solution of tf-bag-009 — who is on top changes at pi/3',
    fig: {
      xRange: [0, PI],
      yRange: [-1.25, 1.35],
      curves: [
        { f: p_sin2, color: INDIGO, width: 2.2 },
        { f: Math.sin, color: AMBER, width: 1.8, dashed: true },
      ],
      shade: [
        { from: 0, to: PI / 3, upper: p_sin2, lower: Math.sin, color: EMERALD, opacity: 0.24 },
        { from: PI / 3, to: PI, upper: Math.sin, lower: p_sin2, color: EMERALD, opacity: 0.24 },
      ],
      points: [{ x: PI / 3, y: Math.sin(PI / 3) }],
      texts: [
        { x: 0.55, y: 1.18, text: '1/4' },
        { x: 2.05, y: 0.12, text: '9/4' },
      ],
      xTicks: [
        { x: PI / 3, label: 'π/3' },
        { x: PI, label: 'π' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    checks: [
      ['the graphs meet at pi/3', p_sin2(PI / 3) - Math.sin(PI / 3), 0],
      ['and again at pi', Math.abs(p_sin2(PI) - Math.sin(PI)), 0],
      ['sin2x is on top before pi/3', p_sin2(PI / 6) - Math.sin(PI / 6) > 0 ? 1 : 0, 1],
      ['sin x is on top after pi/3', Math.sin(PI / 2) - p_sin2(PI / 2) > 0 ? 1 : 0, 1],
      ['the small region is 1/4, as labelled', integ((x) => p_sin2(x) - Math.sin(x), 0, PI / 3), 0.25],
      ['the large region is 9/4, as labelled', integ((x) => Math.sin(x) - p_sin2(x), PI / 3, PI), 2.25],
    ],
  },
];

/** id -> Fig, for the rasteriser. */
export const TF_FIGURES: Record<string, Fig> = Object.fromEntries(
  SPECS.map((s) => [s.id, s.fig]),
);

if (process.argv.includes('--emit')) {
  const only = process.argv[process.argv.indexOf('--emit') + 1];
  for (const s of SPECS) {
    if (only && !only.startsWith('--') && s.id !== only) continue;
    console.log(`\n// ===== ${s.id} — ${s.where}`);
    console.log(`const ${s.id}_FIGURE = \`${render(s.fig)}\`;`);
  }
} else {
  let pass = 0;
  const fails: string[] = [];
  for (const s of SPECS) {
    for (const [label, got, exp] of s.checks) {
      if (Number.isFinite(got) && Math.abs(got - exp) < TOL) pass += 1;
      else fails.push(`FAIL ${s.id}: ${label} — got ${got}, expected ${exp}`);
    }
    const svg = render(s.fig);
    if (!/<polyline/.test(svg)) fails.push(`FAIL ${s.id}: no curve was drawn at all`);
    const nums = [...svg.matchAll(/-?\d+\.?\d*/g)].map(Number);
    if (nums.some((n) => !Number.isFinite(n))) fails.push(`FAIL ${s.id}: NaN in the emitted SVG`);
    if (/[֐-ת]/.test(svg)) fails.push(`FAIL ${s.id}: Hebrew inside the SVG — there is no bidi there`);
  }
  console.log(`TF FIGURE CHECKS: ${pass}/${pass + fails.length} passed over ${SPECS.length} figures.`);
  if (fails.length) {
    console.log('\n' + fails.join('\n'));
    process.exit(1);
  }
}

export {};
