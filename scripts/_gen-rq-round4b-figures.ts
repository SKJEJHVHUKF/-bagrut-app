/* Round 4b (2026-09-13) — the owner's figure rule for רמה 6 (טרנספורמציות):
 * "every question with a concrete function shows BOTH f and the derived g, and
 * the line y = k where a line is the idea". Same shape as _gen-rq-round4-figures:
 * every number is re-derived from the real function, every figure is drawn by
 * lib/fn-figure FROM that function; a second curve (gray dashed) and a y = k
 * line (green dashed) are rendered by the SAME renderer over the SAME window and
 * spliced in, so no coordinate is ever typed by hand.
 *
 *   npx tsx scripts/_gen-rq-round4b-figures.ts                 # re-derive + audit
 *   npx tsx scripts/_gen-rq-round4b-figures.ts --png out.png   # …and a contact sheet
 *   npx tsx scripts/_gen-rq-round4b-figures.ts --apply         # …and paste the SVGs
 *                                                              #   into transformations.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fnFigure, type FnFigureSpec } from '../lib/fn-figure';

let fails = 0;
let checks = 0;
function ok(what: string, cond: boolean) {
  checks++;
  if (!cond) { fails++; console.log(`   ✗ ${what}`); }
}
function eq(what: string, got: number, want: number, tol = 1e-6) {
  checks++;
  if (!(Math.abs(got - want) <= tol)) { fails++; console.log(`   ✗ ${what}: got ${got}, want ${want}`); }
}
const D = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
/** Sign changes of f on [lo, hi], sampled at cell midpoints (see round 4). */
function signChanges(f: (x: number) => number, lo: number, hi: number, n = 20000): number[] {
  const out: number[] = [];
  const dx = (hi - lo) / n;
  let px = lo + 0.5 * dx, pv = f(px);
  for (let i = 1; i < n; i++) {
    const x = lo + (i + 0.5) * dx, v = f(x);
    if (Number.isFinite(pv) && Number.isFinite(v) && pv * v < 0) {
      let a = px, b = x, fa = pv;
      for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
      out.push((a + b) / 2);
    }
    px = x; pv = v;
  }
  return out;
}
/** How many times y = k meets f on [lo, hi] — crossings plus touchings (|f - k| local minima at 0). */
function meetings(f: (x: number) => number, k: number, lo: number, hi: number): number {
  const g = (x: number) => f(x) - k;
  let n = signChanges(g, lo, hi).length;
  // touch points: |g| dips to ~0 without a sign change
  const dx = (hi - lo) / 20000;
  for (let i = 1; i < 20000; i++) {
    const x = lo + i * dx;
    const a = Math.abs(g(x - dx)), b = Math.abs(g(x)), c = Math.abs(g(x + dx));
    // a touch: |g| dips to ~0 (a real crossing was already counted above and has a sign change)
    if (b < a && b < c && b < 1e-3 && g(x - dx) * g(x + dx) > 0) n++;
  }
  return n;
}

type Extra = { f: (x: number) => number | null; vAsymptotes?: number[]; style: 'gray' | 'green' };
type Fig = { spec: FnFigureSpec; extras?: Extra[] };
const FIGS: Record<string, Fig> = {};
const GRAY = 'stroke="rgba(51,65,85,.55)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 3"';
const GREEN = 'stroke="#059669" stroke-width="2" stroke-dasharray="5 3"';

/** Render an extra curve over the primary's window and keep only its ink
 *  (polylines + asymptote lines/labels), restyled. */
function extraInk(primary: FnFigureSpec, e: Extra): string {
  const spec: FnFigureSpec = { ...primary, f: e.f, points: [], hAsymptotes: [], vAsymptotes: e.vAsymptotes ?? [], domainFrom: undefined, domainTo: undefined };
  const { svg, errors } = fnFigure(spec);
  if (errors.length) throw new Error(`extra curve: ${errors.join(' | ')}`);
  const out: string[] = [];
  for (const m of svg.matchAll(/<(polyline|line|text)[^>]*>(?:[^<]*<\/text>)?/g)) {
    const t = m[0];
    if (t.startsWith('<polyline')) {
      out.push(t.replace(/stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/, e.style === 'gray' ? GRAY : GREEN));
    } else if (/#B45309/.test(t)) {
      out.push(t.split('#B45309').join('rgba(51,65,85,.55)'));
    }
  }
  return out.join('\n');
}
function compose(fig: Fig): { svg: string; errors: string[] } {
  const { svg, errors } = fnFigure(fig.spec);
  if (errors.length || !fig.extras?.length) return { svg, errors };
  const ink = fig.extras.map((e) => extraInk(fig.spec, e)).join('\n');
  const i = svg.indexOf('<polyline');
  return { svg: svg.slice(0, i) + ink + '\n' + svg.slice(i), errors };
}

// ── 108 — x³/(x²-1) is the odd one ────────────────────────────────────────
{
  const f = (x: number) => x ** 3 / (x * x - 1);
  for (const x of [0.5, 2, 3.3]) eq(`108 f(-x) = -f(x) at ${x}`, f(-x), -f(x), 1e-12);
  eq('108 f(2) = 8/3', f(2), 8 / 3, 1e-12);
  FIGS['tr-108'] = { spec: {
    f: (x) => (Math.abs(Math.abs(x) - 1) < 1e-9 ? null : f(x)),
    xMin: -4, xMax: 4, yMin: -6, yMax: 6, vAsymptotes: [-1, 1],
    points: [{ x: 0, y: 0, label: '(0, 0)' }, { x: 2, y: 8 / 3, label: '(2, 2.67)' }, { x: -2, y: -8 / 3, label: '(-2, -2.67)' }],
  } };
}

// ── 109 — f = 3/x above g = 1/(x-2): sign table of f - g ──────────────────
{
  const f = (x: number) => 3 / x;
  const g = (x: number) => 1 / (x - 2);
  const d = (x: number) => (x === 0 || x === 2 ? NaN : f(x) - g(x));
  for (const x of [-4, -1, -0.2]) ok(`109 f below g at x=${x}`, d(x) < 0);
  for (const x of [0.2, 1, 1.9]) ok(`109 f above g at x=${x}`, d(x) > 0);
  for (const x of [2.1, 2.5, 2.9]) ok(`109 f below g at x=${x}`, d(x) < 0);
  for (const x of [3.1, 5, 40]) ok(`109 f above g at x=${x}`, d(x) > 0);
  eq('109 they meet at x = 3', signChanges(d, 2.01, 40)[0], 3, 1e-6);
  eq('109 f(3) = g(3) = 1', f(3), g(3), 1e-12);
  eq('109 the difference is 2(x-3)/(x(x-2)) at x=5', d(5), (2 * (5 - 3)) / (5 * 3), 1e-12);
  ok('109 no meeting left of 2', signChanges(d, -40, -0.01).length === 0 && signChanges(d, 0.01, 1.99).length === 0);
  // distractor B: multiplying through by x(x-2) as if positive → 3(x-2) > x → x > 3 only
  ok('109 distractor B: naive cross-multiplication gives only x > 3', 3 * (1 - 2) > 1 === false && 3 * (5 - 2) > 5);
  ok('109 distractor B loses 0 < x < 2 where x(x-2) < 0', 1 * (1 - 2) < 0 && d(1) > 0);
  eq('109 distractor C check point f(-1)', f(-1), -3);
  eq('109 distractor C check point g(-1)', g(-1), -1 / 3, 1e-12);
  eq('109 check point f(1) = 3', f(1), 3);
  eq('109 check point g(1) = -1', g(1), -1);
  FIGS['tr-109'] = {
    spec: { f: (x) => (Math.abs(x) < 1e-9 ? null : f(x)), xMin: -5, xMax: 7, yMin: -5, yMax: 5, vAsymptotes: [0], points: [{ x: 3, y: 1, label: '(3, 1)' }] },
    extras: [{ f: (x) => (Math.abs(x - 2) < 1e-9 ? null : g(x)), vAsymptotes: [2], style: 'gray' }],
  };
}

// ── 204 — y = k meets f = (x³-4x)/(x²+5) in exactly three points ──────────
{
  const f = (x: number) => (x ** 3 - 4 * x) / (x * x + 5);
  const fp = (x: number) => ((3 * x * x - 4) * (x * x + 5) - (x ** 3 - 4 * x) * 2 * x) / (x * x + 5) ** 2;
  for (const x of [-3, -0.4, 0.9, 2.5]) eq(`204 f' at x=${x}`, D(f, x), fp(x), 1e-6);
  for (const x of [-3, 0.5, 2]) eq(`204 f' numerator = x⁴+19x²-20 at x=${x}`, fp(x) * (x * x + 5) ** 2, x ** 4 + 19 * x * x - 20, 1e-9);
  for (const x of [-3, 0.5, 2]) eq(`204 = (x²-1)(x²+20) at x=${x}`, x ** 4 + 19 * x * x - 20, (x * x - 1) * (x * x + 20), 1e-9);
  const roots = signChanges(fp, -10, 10);
  ok(`204 f' changes sign exactly at ±1 (${roots.map((r) => r.toFixed(4))})`, roots.length === 2 && Math.abs(roots[0] + 1) < 1e-5 && Math.abs(roots[1] - 1) < 1e-5);
  eq('204 f(-1) = 0.5', f(-1), 0.5, 1e-12);
  eq('204 f(1) = -0.5', f(1), -0.5, 1e-12);
  ok('204 (-1, 0.5) is a maximum', f(-1.1) < 0.5 && f(-0.9) < 0.5);
  ok('204 (1, -0.5) is a minimum', f(1.1) > -0.5 && f(0.9) > -0.5);
  ok('204 x-intercepts at -2, 0, 2', signChanges(f, -10, 10).map((r) => Number(r.toFixed(6))).join() === '-2,0,2');
  ok('204 unbounded both ways', f(1e4) > 1e3 && f(-1e4) < -1e3);
  ok('204 denominator never 0', (0) ** 2 + 5 > 0);
  // the claim, by a fine-grid meeting count over a window wide enough to hold every meeting
  const LO = -60, HI = 60;
  for (const k of [-0.49, -0.3, 0, 0.3, 0.49]) eq(`204 k=${k} meets three times`, meetings(f, k, LO, HI), 3);
  for (const k of [-0.5, 0.5]) eq(`204 k=${k} meets exactly twice (touch + cross)`, meetings(f, k, LO, HI), 2);
  for (const k of [-3, -0.51, 0.51, 3]) eq(`204 k=${k} meets once`, meetings(f, k, LO, HI), 1);
  // the three-point set is EXACTLY the open interval (-0.5, 0.5): scan k
  const three: number[] = [];
  for (let k = -1.5; k <= 1.5 + 1e-9; k += 0.01) { const kk = Number(k.toFixed(2)); if (meetings(f, kk, LO, HI) === 3) three.push(kk); }
  ok(`204 the three-point k set is (-0.5, 0.5) on a 0.01 grid (${three.length} values, ${three[0]}…${three[three.length - 1]})`,
    three.length === 99 && three[0] === -0.49 && three[three.length - 1] === 0.49);
  // distractor C: the x-coordinates ±1 instead of the heights
  eq('204 distractor C: |k| = 1 meets once, not three times', meetings(f, 1, LO, HI) + meetings(f, -1, LO, HI), 2);
  FIGS['tr-204'] = {
    spec: {
      f, xMin: -5, xMax: 5, yMin: -2.2, yMax: 2.2,
      points: [
        { x: -1, y: 0.5, label: '(-1, 0.5)' }, { x: 1, y: -0.5, label: '(1, -0.5)' },
        { x: -2, y: 0, label: '(-2, 0)' }, { x: 0, y: 0, label: '(0, 0)' }, { x: 2, y: 0, label: '(2, 0)' },
      ],
    },
    extras: [{ f: () => 0.5, style: 'green' }, { f: () => -0.5, style: 'green' }],
  };
}

// ── 407F — the derivative f' = (x²-4)/x² of f = (x²+4)/x (second figure of 407) ─
{
  const f = (x: number) => (x * x + 4) / x;
  const fp = (x: number) => (x * x - 4) / (x * x);
  for (const x of [-3, -0.4, 0.9, 5]) eq(`407F f' at x=${x}`, D(f, x), fp(x), 1e-6);
  ok("407F f' < 0 exactly on (-2, 2) minus 0", fp(-1) < 0 && fp(1) < 0 && fp(-3) > 0 && fp(3) > 0);
  FIGS['tr-407F'] = { spec: {
    f: (x) => (Math.abs(x) < 1e-9 ? null : fp(x)), xMin: -6, xMax: 6, yMin: -4, yMax: 3,
    vAsymptotes: [0], hAsymptotes: [1], points: [{ x: -2, y: 0, label: '(-2, 0)' }, { x: 2, y: 0, label: '(2, 0)' }],
  } };
}

// ── second curves for existing one-curve figures ──────────────────────────
// 105 — f = √(x+2) → g = f(x-5) - 3
{
  const f = (x: number) => (x < -2 ? null : Math.sqrt(x + 2));
  const g = (x: number) => (x < 3 ? null : Math.sqrt(x - 3) - 3);
  eq('105 g(3) = -3', g(3) as number, -3);
  eq('105 g(12) = 0', g(12) as number, 0);
  eq('105 g is f shifted at x=7', g(7) as number, (f(2) as number) - 3, 1e-12);
  FIGS['tr-105'] = {
    spec: { f: g, xMin: -4, xMax: 16, yMin: -4.5, yMax: 4.5, domainFrom: 3, points: [{ x: 3, y: -3, label: '(3, -3)' }, { x: 12, y: 0, label: '(12, 0)' }] },
    extras: [{ f, style: 'gray' }],
  };
}
// 203 — f = √(x-1) → reflect in the y-axis → shift right 5: g = √(4-x)
{
  const f = (x: number) => (x < 1 ? null : Math.sqrt(x - 1));
  const g = (x: number) => (x > 4 ? null : Math.sqrt(4 - x));
  eq('203 g(4) = 0', g(4) as number, 0);
  eq('203 g(0) = 2', g(0) as number, 2);
  eq('203 g(x) = f(-(x-5)) at x=-3', g(-3) as number, f(8) as number, 1e-12);
  ok('203 g decreases', (g(0) as number) > (g(3) as number));
  FIGS['tr-203'] = {
    spec: { f: g, xMin: -6, xMax: 8, yMin: -1.5, yMax: 3.5, domainTo: 4, points: [{ x: 4, y: 0, label: '(4, 0)' }, { x: 0, y: 2, label: '(0, 2)' }] },
    extras: [{ f, style: 'gray' }],
  };
}
// 211 — h = (2x-7)/(x-3); f = -h(x+5) = (-2x-3)/(x+2)
{
  const h = (x: number) => (2 * x - 7) / (x - 3);
  const f = (x: number) => (-2 * x - 3) / (x + 2);
  for (const x of [-6, -1, 0, 4]) eq(`211 f = -h(x+5) at x=${x}`, f(x), -h(x + 5), 1e-12);
  eq('211 f(-1.5) = 0', f(-1.5), 0);
  eq('211 f(0) = -1.5', f(0), -1.5);
  eq('211 f tends to -2', f(1e6), -2, 1e-5);
  FIGS['tr-211'] = {
    spec: { f: (x) => (Math.abs(x + 2) < 1e-9 ? null : f(x)), xMin: -9, xMax: 9, yMin: -8, yMax: 6, vAsymptotes: [-2], hAsymptotes: [-2], points: [{ x: -1.5, y: 0, label: '(-1.5, 0)' }, { x: 0, y: -1.5, label: '(0, -1.5)' }] },
    extras: [{ f: (x) => (Math.abs(x - 3) < 1e-9 ? null : h(x)), vAsymptotes: [3], style: 'gray' }],
  };
}
// 212 — f = √(x+3), shifted down 2, then g = 1/(f - 2)
{
  const s = (x: number) => (x < -3 ? null : Math.sqrt(x + 3) - 2);
  const g = (x: number) => { const v = s(x); return v === null || Math.abs(v) < 1e-9 ? null : 1 / v; };
  eq('212 the shifted root vanishes at 1', s(1) as number, 0);
  eq('212 g(-3) = -0.5', g(-3) as number, -0.5);
  eq('212 g(6) = 1', g(6) as number, 1);
  ok('212 g blows up at 1', Math.abs(g(1.0001) as number) > 1e3 && Math.abs(g(0.9999) as number) > 1e3);
  eq('212 g tends to 0', g(1e8) as number, 0, 1e-3);
  FIGS['tr-212'] = {
    spec: { f: g, xMin: -5, xMax: 12, yMin: -4, yMax: 4, domainFrom: -3, vAsymptotes: [1], hAsymptotes: [0], points: [{ x: 6, y: 1, label: '(6, 1)' }, { x: -3, y: -0.5, label: '(-3, -0.5)' }] },
    extras: [{ f: s, style: 'gray' }],
  };
}
// 313 — f = (x²-9)/(x²+3) → g = |f|  (same spec as the check in _rq-extra-checks)
{
  const f = (x: number) => (x * x - 9) / (x * x + 3);
  const g = (x: number) => Math.abs(f(x));
  eq('313 g(0) = 3', g(0), 3);
  eq('313 g(±3) = 0', g(3) + g(-3), 0);
  eq('313 f(0) = -3, the depth before the fold', f(0), -3);
  FIGS['tr-313'] = {
    spec: { f: g, xMin: -9, xMax: 9, yMin: -3.6, yMax: 3.6, hAsymptotes: [1], points: [{ x: 0, y: 3, label: '(0, 3)' }, { x: 3, y: 0, label: '(3, 0)' }, { x: -3, y: 0 }] },
    extras: [{ f, style: 'gray' }],
  };
}
// 113 — f = x²-2x-3 → g = |f|, and the line y = 4
{
  const f = (x: number) => x * x - 2 * x - 3;
  const g = (x: number) => Math.abs(f(x));
  const r1 = 1 - Math.sqrt(8), r2 = 1 + Math.sqrt(8);
  eq('113 g(1) = 4 (the peak of the fold)', g(1), 4);
  eq('113 g = 4 at 1-√8', g(r1), 4, 1e-12);
  eq('113 g = 4 at 1+√8', g(r2), 4, 1e-12);
  eq('113 y = 4 meets g exactly three times', meetings(g, 4, -20, 20), 3);
  eq('113 …but f only twice (the distractor)', meetings(f, 4, -20, 20), 2);
  FIGS['tr-113'] = {
    spec: {
      f: g, xMin: -5, xMax: 7, yMin: -5, yMax: 9,
      points: [
        { x: -1, y: 0, label: '(-1, 0)' }, { x: 3, y: 0, label: '(3, 0)' }, { x: 0, y: 3 },
        { x: 1, y: 4, label: '(1, 4)' }, { x: r1, y: 4, label: '(-1.83, 4)' }, { x: r2, y: 4, label: '(3.83, 4)' },
      ],
    },
    extras: [{ f, style: 'gray' }, { f: () => 4, style: 'green' }],
  };
}
// 404 — f = √(x²+4)/x → g = 1/f² = x²/(x²+4)
{
  const f = (x: number) => Math.sqrt(x * x + 4) / x;
  const g = (x: number) => (x * x) / (x * x + 4);
  for (const x of [-3, 0.5, 2]) eq(`404 g = 1/f² at x=${x}`, g(x), 1 / f(x) ** 2, 1e-12);
  ok('404 f tends to ±1', Math.abs(f(1e6) - 1) < 1e-6 && Math.abs(f(-1e6) + 1) < 1e-6);
  FIGS['tr-404'] = {
    spec: { f: (x) => (Math.abs(x) < 1e-9 ? null : g(x)), xMin: -9, xMax: 9, yMin: -1.8, yMax: 1.8, hAsymptotes: [1], points: [{ x: 0, y: 0, label: '(0, 0)', hole: true }] },
    extras: [{ f: (x) => (Math.abs(x) < 1e-9 ? null : f(x)), style: 'gray' }],
  };
}
// 406 — f = (2x+2)/(x-1) → g = |f - 2| = 4/|x-1|
{
  const f = (x: number) => (2 * x + 2) / (x - 1);
  const g = (x: number) => Math.abs(f(x) - 2);
  for (const x of [-4, 0, 3]) eq(`406 g = 4/|x-1| at x=${x}`, g(x), 4 / Math.abs(x - 1), 1e-12);
  eq('406 f(-1) = 0, g(-1) = 2', f(-1) + g(-1), 2);
  FIGS['tr-406'] = {
    spec: { f: (x) => (Math.abs(x - 1) < 1e-9 ? null : g(x)), xMin: -5, xMax: 7, yMin: -4, yMax: 8, vAsymptotes: [1], hAsymptotes: [0], points: [{ x: -1, y: 2, label: '(-1, 2)' }] },
    extras: [{ f: (x) => (Math.abs(x - 1) < 1e-9 ? null : f(x)), style: 'gray' }],
  };
}
// 408 — f = 4/(x-3) → g' = f + 2
{
  const f = (x: number) => 4 / (x - 3);
  const gp = (x: number) => f(x) + 2;
  eq("408 g'(1) = 0", gp(1), 0);
  ok('408 maximum at 1', gp(0.9) > 0 && gp(1.1) < 0);
  FIGS['tr-408'] = {
    spec: { f: (x) => (Math.abs(x - 3) < 1e-9 ? null : gp(x)), xMin: -7, xMax: 11, yMin: -7, yMax: 9, vAsymptotes: [3], hAsymptotes: [2], points: [{ x: 1, y: 0, label: '(1, 0)' }] },
    extras: [{ f: (x) => (Math.abs(x - 3) < 1e-9 ? null : f(x)), style: 'gray' }],
  };
}
// 409 — g = (x³-x²+x-1)/(x²-x) = (x²+1)/x minus (1, 2); lines y = -2 (one point) and y = 2 (none)
{
  const g = (x: number) => (x === 0 || x === 1 ? NaN : (x ** 3 - x * x + x - 1) / (x * x - x));
  const r = (x: number) => (x * x + 1) / x;
  const gm = (x: number) => (Math.abs(x) < 1e-9 || Math.abs(x - 1) < 1e-9 ? null : r(x));
  for (const x of [-3, 0.5, 4]) eq(`409 g = (x²+1)/x at x=${x}`, g(x), r(x), 1e-12);
  eq('409 y = -2 touches once (the maximum)', meetings(r, -2, -60, -0.01) + meetings(r, -2, 0.01, 60), 1);
  eq('409 y = 2 touches r once, at the removed point', meetings(r, 2, 0.01, 60), 1);
  eq('409 …which is x = 1, the hole', signChanges((x) => r(x) - 2 - 1e-9, 0.01, 60).length, 0);
  FIGS['tr-409'] = {
    spec: { f: gm, xMin: -7, xMax: 7, yMin: -9, yMax: 9, vAsymptotes: [0], points: [{ x: 1, y: 2, label: '(1, 2)', hole: true }, { x: -1, y: -2, label: '(-1, -2)' }] },
    extras: [{ f: () => -2, style: 'green' }, { f: () => 2, style: 'green' }],
  };
}
// 405 — f = (x+3)/(x-2), g = (x-2)/(x+1), h = f·g = (x+3)/(x+1) minus (2, 5/3)
{
  const f = (x: number) => (x + 3) / (x - 2);
  const g = (x: number) => (x - 2) / (x + 1);
  const h = (x: number) => (x + 3) / (x + 1);
  for (const x of [-5, 0, 4]) eq(`405 f·g = h at x=${x}`, f(x) * g(x), h(x), 1e-12);
  eq('405 hole height 5/3', h(2), 5 / 3, 1e-12);
  FIGS['tr-405'] = {
    spec: { f: (x) => (Math.abs(x - 2) < 1e-9 || Math.abs(x + 1) < 1e-9 ? null : h(x)), xMin: -9, xMax: 9, yMin: -5, yMax: 8, vAsymptotes: [-1], hAsymptotes: [1], points: [{ x: 2, y: 5 / 3, label: '(2, 1.67)', hole: true }] },
    extras: [
      { f: (x) => (Math.abs(x - 2) < 1e-9 ? null : f(x)), vAsymptotes: [2], style: 'gray' },
      { f: (x) => (Math.abs(x + 1) < 1e-9 ? null : g(x)), style: 'gray' },
    ],
  };
}
// 402 — f = (x-4)/(x+1), g = √(x-2), h = f·g
{
  const f = (x: number) => (x - 4) / (x + 1);
  const g = (x: number) => (x < 2 ? null : Math.sqrt(x - 2));
  const h = (x: number) => (x < 2 ? null : f(x) * Math.sqrt(x - 2));
  eq('402 h(2) = 0', h(2) as number, 0);
  eq('402 h(4) = 0', h(4) as number, 0);
  ok('402 h < 0 between', (h(3) as number) < 0);
  FIGS['tr-402'] = {
    spec: { f: h, xMin: -1.2, xMax: 10, yMin: -1.2, yMax: 2.6, domainFrom: 2, points: [{ x: 2, y: 0, label: '(2, 0)' }, { x: 4, y: 0, label: '(4, 0)' }] },
    extras: [{ f: (x) => (Math.abs(x + 1) < 1e-9 ? null : f(x)), style: 'gray' }, { f: g, style: 'gray' }],
  };
}

// ── example figures for the three abstract questions (the base stage's
//    "דוגמה לפונקציה כזו" pattern, tr-001/002/004) ────────────────────────
// 104 — f odd with f(2) = -7: f(x) = -14/x
{
  const f = (x: number) => -14 / x;
  eq('104 f(2) = -7', f(2), -7);
  eq('104 f(-2) = 7', f(-2), 7);
  for (const x of [0.5, 3]) eq(`104 odd at ${x}`, f(-x), -f(x), 1e-12);
  FIGS['tr-104'] = { spec: { f: (x) => (Math.abs(x) < 1e-9 ? null : f(x)), xMin: -6, xMax: 6, yMin: -12, yMax: 12, vAsymptotes: [0], hAsymptotes: [0], points: [{ x: 2, y: -7, label: '(2, -7)' }, { x: -2, y: 7, label: '(-2, 7)' }] } };
}
// 107 — f with a maximum at (2, -1): f(x) = -(x-2)² - 1; g = f(x+3) + 4
{
  const f = (x: number) => -((x - 2) ** 2) - 1;
  const g = (x: number) => f(x + 3) + 4;
  eq('107 f(2) = -1', f(2), -1);
  ok('107 (2, -1) is a maximum of f', f(1.9) < -1 && f(2.1) < -1);
  eq('107 g(-1) = 3', g(-1), 3);
  ok('107 (-1, 3) is a maximum of g', g(-1.1) < 3 && g(-0.9) < 3);
  eq("107 g' vanishes at -1", D(g, -1), 0, 1e-6);
  FIGS['tr-107'] = { spec: { f: g, xMin: -6, xMax: 6, yMin: -6, yMax: 5, points: [{ x: -1, y: 3, label: '(-1, 3)' }] }, extras: [{ f, style: 'gray' }] };
}
// 401 — f even with f'(3) = 5: f(x) = 5x²/6
{
  const f = (x: number) => (5 * x * x) / 6;
  eq("401 f'(3) = 5", D(f, 3), 5, 1e-6);
  eq("401 f'(-3) = -5", D(f, -3), -5, 1e-6);
  eq('401 f(3) = f(-3) = 7.5', f(3), f(-3));
  FIGS['tr-401'] = { spec: { f, xMin: -5, xMax: 5, yMin: -2, yMax: 14, points: [{ x: 3, y: 7.5, label: '(3, 7.5)' }, { x: -3, y: 7.5, label: '(-3, 7.5)' }] } };
}

// ── render + audit (anchor-aware, as in round 4) ───────────────────────────
function auditSvg(id: string, svg: string, box: [number, number] = [300, 260]): number {
  const texts = [...svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"([^>]*)>([^<]*)</g)].map((m) => {
    const x = Number(m[1]);
    const w = m[4].length * 5.5;
    const anchor = /text-anchor="end"/.test(m[3]) ? 'end' : /text-anchor="middle"/.test(m[3]) ? 'middle' : 'start';
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { x0, x1: x0 + w, y: Number(m[2]), t: m[4] };
  });
  let bad = 0;
  for (const t of texts) {
    if (t.x0 < -6 || t.x1 > box[0] + 6 || t.y < 0 || t.y > box[1] + 2) { bad++; console.log(`   ✗ ${id}: "${t.t}" out of frame at (${t.x0.toFixed(0)}, ${t.y})`); }
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (Math.abs(a.y - b.y) < 7 && a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1) {
        bad++;
        console.log(`   ✗ ${id}: "${a.t}" at (${a.x0.toFixed(0)}, ${a.y}) ✕ "${b.t}" at (${b.x0.toFixed(0)}, ${b.y})`);
      }
    }
  }
  if (!/(<polyline|<path)/.test(svg)) { bad++; console.log(`   ✗ ${id}: nothing drawn`); }
  if ((svg.match(/</g) ?? []).length !== (svg.match(/>/g) ?? []).length) { bad++; console.log(`   ✗ ${id}: unbalanced tags`); }
  return bad;
}

const arg = process.argv[2];
const SVGS: Record<string, string> = {};
for (const [id, fig] of Object.entries(FIGS)) {
  const { svg, errors } = compose(fig);
  checks++;
  if (errors.length) { fails++; console.log(`   ✗ ${id} figure: ${errors.join(' | ')}`); continue; }
  checks++;
  if (auditSvg(id, svg)) fails++;
  SVGS[id] = svg;
  if (arg === '--figures' || arg === id) { console.log(`===== ${id}`); console.log(svg); }
}

async function contactSheet(out: string) {
  const sharp = (await import('sharp')).default;
  const COLS = 4, CW = 600, CH = 520;
  const ids = Object.keys(SVGS);
  const tiles = await Promise.all(
    ids.map(async (id, i) => ({
      input: await sharp(Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" width="${CW}" height="${CH}"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="6" y="14" font-size="11" fill="#DB2777">${id}</text>${SVGS[id]}</svg>`,
      )).png().toBuffer(),
      left: (i % COLS) * CW,
      top: Math.floor(i / COLS) * CH,
    })),
  );
  await sharp({ create: { width: COLS * CW, height: Math.ceil(ids.length / COLS) * CH, channels: 3, background: '#FFFFFF' } }).composite(tiles).png().toFile(out);
  console.log(`contact sheet -> ${out}`);
}

/** Paste every SVG into transformations.ts: the k-th `svg: \`…\`` of the block
 *  whose id line matches. The scan for the block end is BOUNDED by the next
 *  question's opening line, never by a bare newline. Slicing only — no
 *  String.replace, so a `$` in the SVG cannot expand. */
const FILE = 'content/lessons/math5/rq-extra/transformations.ts';
// figure id → [question id, which diagram (0-based)]
const SLOT: Record<string, [string, number]> = {
  'tr-108': ['rq-sub-tr-108', 0], 'tr-109': ['rq-sub-tr-109', 0], 'tr-204': ['rq-sub-tr-204', 0], 'tr-407F': ['rq-sub-tr-407', 1],
  'tr-105': ['rq-sub-tr-105', 0], 'tr-203': ['rq-sub-tr-203', 0], 'tr-211': ['rq-sub-tr-211', 0], 'tr-212': ['rq-sub-tr-212', 0],
  'tr-313': ['rq-sub-tr-313', 0], 'tr-113': ['rq-sub-tr-113', 0], 'tr-404': ['rq-sub-tr-404', 0], 'tr-406': ['rq-sub-tr-406', 0],
  'tr-408': ['rq-sub-tr-408', 0], 'tr-409': ['rq-sub-tr-409', 0], 'tr-405': ['rq-sub-tr-405', 0], 'tr-402': ['rq-sub-tr-402', 0],
  'tr-104': ['rq-sub-tr-104', 0], 'tr-107': ['rq-sub-tr-107', 0], 'tr-401': ['rq-sub-tr-401', 0],
};
// questions that have no diagrams block yet get one inserted before finalAnswer
const NEW_CAPTION: Record<string, string> = {
  'rq-sub-tr-104': 'דוגמה לפונקציה אי-זוגית כזו: $f(x) = -\\\\dfrac{14}{x}$. מסומנים: הנקודה הנתונה $(2,\\\\; -7)$ והנקודה $(-2,\\\\; 7)$, הסימטרית לה ביחס לראשית הצירים; האסימפטוטות $x = 0$ וגם $y = 0$.',
  'rq-sub-tr-107': 'דוגמה לפונקציה כזו: בקו אפור מקווקו $f(x) = -(x - 2)^2 - 1$, שהמקסימום שלה הוא $(2,\\\\; -1)$; בכחול הגרף של $g(x) = f(x + 3) + 4$. מסומנת נקודת המקסימום של $g$, $(-1,\\\\; 3)$: שלוש יחידות שמאלה וארבע למעלה.',
  'rq-sub-tr-401': 'דוגמה לפונקציה זוגית כזו: $f(x) = \\\\dfrac{5}{6}x^2$. מסומנות הנקודות $(3,\\\\; 7.5)$ וגם $(-3,\\\\; 7.5)$, הסימטריות ביחס לציר $y$: המשיק בימנית עולה בשיפוע $5$, והמשיק בשמאלית יורד בשיפוע $-5$.',
};
function apply() {
  let t = readFileSync(FILE, 'utf8');
  const EOL = t.includes('\r\n') ? '\r\n' : '\n';
  let n = 0;
  for (const [fid, [qid, k]] of Object.entries(SLOT)) {
    const svg = SVGS[fid];
    if (!svg) throw new Error(`${fid}: no svg (figure failed)`);
    const body = svg.split('\n').join(EOL);
    const start = t.indexOf(`id: '${qid}'`);
    if (start < 0) throw new Error(`${qid}: id not found`);
    let end = t.indexOf(`${EOL}  {${EOL}`, start + 10);
    if (end < 0) end = t.indexOf(`${EOL}];`, start);
    if (end < 0) throw new Error(`${qid}: block end not found`);
    const block = t.slice(start, end);
    if (NEW_CAPTION[qid]) {
      if (block.includes('diagrams:')) throw new Error(`${qid}: already has diagrams`);
      const fa = block.indexOf(`${EOL}      finalAnswer:`);
      if (fa < 0) throw new Error(`${qid}: finalAnswer not found`);
      const ins = [
        '', '      diagrams: [', '        {', "          type: 'custom',", '          svg: `' + body + '`,',
        "          viewBox: '0 0 300 260',", '          caption:', `            '${NEW_CAPTION[qid]}',`, '        },', '      ],',
      ].join(EOL);
      t = t.slice(0, start + fa) + ins + t.slice(start + fa);
      n++;
      continue;
    }
    let idx = -1;
    for (let i = 0; i <= k; i++) { idx = block.indexOf('svg: ', idx + 1); if (idx < 0) throw new Error(`${qid}: svg slot ${k} not found`); }
    let a: number, b: number;
    const named = /^svg: ([A-Z0-9_]+),/.exec(block.slice(idx));
    if (named) {
      // `svg: TR105_FIGURE,` → replace the body of `const TR105_FIGURE = \`…\`;`
      const decl = t.indexOf(`const ${named[1]} = \``);
      if (decl < 0) throw new Error(`${qid}: ${named[1]} declaration not found`);
      a = decl + `const ${named[1]} = \``.length;
      b = t.indexOf('`;', a);
      if (b < 0 || b > start) throw new Error(`${qid}: ${named[1]} end not found`);
    } else {
      if (!block.startsWith('svg: `', idx)) throw new Error(`${qid}: unexpected svg slot shape`);
      a = start + idx + 'svg: `'.length;
      b = t.indexOf('`,', a);
      if (b < 0 || b > end) throw new Error(`${qid}: svg end not found`);
    }
    t = t.slice(0, a) + body + t.slice(b);
    n++;
  }
  writeFileSync(FILE, t);
  console.log(`applied ${n} figures -> ${FILE}`);
}

const done = () => {
  console.log(`\n${checks - fails}/${checks} checks passed${fails ? ` - ${fails} FAILED` : ''}`);
  process.exit(fails ? 1 : 0);
};
if (arg === '--png') void contactSheet(process.argv[3] ?? 'round4b-figures.png').then(done);
else if (arg === '--apply') { if (fails) { console.log('not applying: checks failed'); done(); } else { apply(); done(); } }
else done();
