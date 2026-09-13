/* רמה 6 (rq-transformations) — one small before/after figure per situation the
 * lesson names, plus the "draw f AND g" solution figures of the stage's own
 * questions and drills (Itay, 2026-09-11: "שרטוט של כל מצב … בכל שאלה תצייר
 * גם את הפונקציה וגם את השינויים").
 *
 * Every curve is drawn by lib/fn-figure FROM the function; the second curve of
 * a figure (the dashed "before") and a level line are rendered by the same
 * renderer in the SAME window and only restyled here, so nothing is placed in
 * pixels by hand. Every number a caption or a solution claims is re-derived
 * below before the figure is built.
 *
 *   npx tsx scripts/_gen-rq-lesson-figures.ts              # derive + audit
 *   npx tsx scripts/_gen-rq-lesson-figures.ts --write      # splice into the lesson
 *   npx tsx scripts/_gen-rq-lesson-figures.ts --png out.png
 *
 * --write replaces the body of each `<!-- fig:ID -->` template literal in the
 * lesson file (CRLF preserved) — idempotent, re-runnable after a window change.
 * Helpers are COPIED from _gen-rq-round4-figures.ts / _gen-rq-bagrut-009-010-
 * figures.ts on purpose, so the three scripts stay independent.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fnFigure, type FnFigureSpec } from '../lib/fn-figure';

const LESSON = 'content/lessons/math5/functions-root-quotient.ts';

// ── tiny numeric kit ───────────────────────────────────────────────────────
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
/** Sign changes of f on [lo, hi], midpoint-sampled + bisection. */
function signChanges(f: (x: number) => number, lo: number, hi: number, n = 20000): number[] {
  const out: number[] = [];
  const dx = (hi - lo) / n;
  let px = lo + 0.5 * dx, pv = f(px);
  for (let i = 1; i < n; i++) {
    const x = lo + (i + 0.5) * dx, v = f(x);
    if (Number.isFinite(pv) && Number.isFinite(v) && pv * v < 0) {
      let a = px, b = x, fa = pv;
      for (let k = 0; k < 80; k++) {
        const m = (a + b) / 2, fm = f(m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      }
      out.push((a + b) / 2);
    }
    px = x; pv = v;
  }
  return out;
}
/** Minimum of f over a grid on [lo, hi] (for "the branch never comes below…"). */
function minOn(f: (x: number) => number, lo: number, hi: number, n = 20000): number {
  let m = Infinity;
  for (let i = 0; i <= n; i++) { const v = f(lo + ((hi - lo) * i) / n); if (Number.isFinite(v) && v < m) m = v; }
  return m;
}
function maxOn(f: (x: number) => number, lo: number, hi: number, n = 20000): number {
  return -minOn((x) => -f(x), lo, hi, n);
}

// ── composition: a primary curve, an optional dashed "before" curve, level lines ──
type Level = { y: number; label: string; atX: number };
type Fig = {
  /** The curve drawn solid (g when there is a transformation, f otherwise). */
  spec: FnFigureSpec;
  /** The original f, drawn dashed and lighter behind it — its own points and the
   *  asymptotes it does NOT share with the primary are kept. */
  before?: Pick<FnFigureSpec, 'f' | 'points' | 'vAsymptotes' | 'hAsymptotes'>;
  /** Curve names printed on the curves: x where each label sits. */
  names?: { primary?: [string, number]; before?: [string, number] };
  levels?: Level[];
};
const SOLID_TWO = '#059669';   // g when f is also shown (same convention as ABS_FOLD_FIGURE)
const DASHED = '#4F46E5';

/** The polyline point nearest to x, from a rendered svg (so the label rides the curve). */
function pointOnCurve(svg: string, spec: FnFigureSpec, atX: number): [number, number] | null {
  const px = 26 + ((atX - spec.xMin) / (spec.xMax - spec.xMin)) * (300 - 26 - 16);
  let best: [number, number] | null = null;
  for (const m of svg.matchAll(/<polyline points="([^"]+)"/g)) {
    for (const p of m[1].split(' ')) {
      const [x, y] = p.split(',').map(Number);
      if (!best || Math.abs(x - px) < Math.abs(best[0] - px)) best = [x, y];
    }
  }
  return best;
}

/** Everything but the axes/ticks of a render: curves, points, their labels, asymptotes. */
function inkOnly(svg: string): string[] {
  return svg.split('\n').filter((l) =>
    /^<polyline|^<circle/.test(l) ||
    (/^<line/.test(l) && /#B45309/.test(l)) ||
    (/^<text/.test(l) && /font-size="10\.5"/.test(l)),
  );
}

function levelLine(spec: FnFigureSpec, lv: Level): string {
  const lo = spec.domainFrom ?? -Infinity;
  const hi = spec.domainTo ?? Infinity;
  const { svg, errors } = fnFigure({ ...spec, f: (x) => (x < lo || x > hi ? null : lv.y), points: [], vAsymptotes: [], hAsymptotes: [] });
  if (errors.length) throw new Error(`level y = ${lv.y}: ${errors.join('; ')}`);
  const m = svg.match(/<polyline points="([^"]+)"/);
  if (!m) throw new Error(`level y = ${lv.y}: nothing drawn`);
  const pts = m[1].split(' ').map((p) => p.split(',').map(Number));
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[pts.length - 1];
  const at = pointOnCurve(svg, spec, lv.atX)!;
  return (
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#DB2777" stroke-width="1.8" stroke-dasharray="5 4"/>\n` +
    `<text x="${at[0]}" y="${(at[1] - 5).toFixed(1)}" font-size="10.5" fill="#DB2777" font-weight="bold" text-anchor="middle">${lv.label}</text>`
  );
}

function build(fig: Fig): string {
  const { svg, errors } = fnFigure(fig.spec);
  if (errors.length) throw new Error(errors.join('; '));
  let out = svg;
  const extra: string[] = [];
  if (fig.before) {
    const sharedV = new Set(fig.spec.vAsymptotes ?? []);
    const sharedH = new Set(fig.spec.hAsymptotes ?? []);
    const bSpec: FnFigureSpec = {
      ...fig.spec,
      f: fig.before.f,
      points: fig.before.points ?? [],
      vAsymptotes: (fig.before.vAsymptotes ?? []).filter((a) => !sharedV.has(a)),
      hAsymptotes: (fig.before.hAsymptotes ?? []).filter((a) => !sharedH.has(a)),
    };
    const b = fnFigure(bSpec);
    if (b.errors.length) throw new Error(`before: ${b.errors.join('; ')}`);
    // f dashed and thinner; g solid green — the ABS_FOLD_FIGURE convention.
    out = out.split(`stroke="${DASHED}" stroke-width="2.5"`).join(`stroke="${SOLID_TWO}" stroke-width="2.5"`)
      .split(`fill="${DASHED}"/>`).join(`fill="${SOLID_TWO}"/>`)
      .split(`stroke="${DASHED}" stroke-width="2"/>`).join(`stroke="${SOLID_TWO}" stroke-width="2"/>`);
    const ink = inkOnly(b.svg).map((l) =>
      l.startsWith('<polyline') ? l.replace('stroke-width="2.5"', 'stroke-width="2" stroke-dasharray="5 3"') : l,
    );
    extra.push(...ink);
    if (fig.names?.before) {
      const [name, x] = fig.names.before;
      const p = pointOnCurve(b.svg, bSpec, x)!;
      extra.push(`<text x="${p[0]}" y="${(p[1] - 8).toFixed(1)}" font-size="10.5" fill="${DASHED}" text-anchor="middle" font-weight="bold">${name}</text>`);
    }
  }
  if (fig.names?.primary) {
    const [name, x] = fig.names.primary;
    const p = pointOnCurve(svg, fig.spec, x)!;
    extra.push(`<text x="${p[0]}" y="${(p[1] - 8).toFixed(1)}" font-size="10.5" fill="${fig.before ? SOLID_TWO : DASHED}" text-anchor="middle" font-weight="bold">${name}</text>`);
  }
  for (const lv of fig.levels ?? []) extra.unshift(levelLine(fig.spec, lv));
  // The "before" ink goes under the primary curve. Index splice, never replace().
  const at = out.indexOf('<polyline');
  if (at < 0) throw new Error('nothing to draw');
  return out.slice(0, at) + extra.join('\n') + '\n' + out.slice(at);
}

// ── the figures, each with its derivation ──────────────────────────────────
const FIGS: Record<string, Fig> = {};
const P = (x: number) => (x - 2) ** 2 - 4;          // the lesson parabola: vertex (2, -4), roots 0 and 4
const inv = (x: number) => (Math.abs(x) < 1e-9 ? null : 1 / x);

// lesson · vertical shift  g = f + 2 with f = 1/x: the horizontal asymptote rises, the vertical one stays.
{
  const g = (x: number) => (x === 0 ? NaN : 1 / x + 2);
  eq('shift-v g tends to 2', g(1e6), 2, 1e-5);
  ok('shift-v both blow up at 0', Math.abs(g(1e-6)) > 1e5 && Math.abs(1 / 1e-6) > 1e5);
  eq('shift-v g(1) = f(1) + 2', g(1), 1 + 2);
  FIGS['lsn-shift-v'] = {
    spec: { f: (x) => (inv(x) === null ? null : 1 / x + 2), xMin: -4, xMax: 4, yMin: -3, yMax: 6, vAsymptotes: [0], hAsymptotes: [2] },
    before: { f: inv, vAsymptotes: [0] },
    names: { primary: ['f(x)+2', 1.5], before: ['f(x)', 1.2] },
  };
}
// lesson · horizontal shift  g = f(x - 3) with f = 1/x: the vertical asymptote moves right by 3.
{
  const g = (x: number) => (x === 3 ? NaN : 1 / (x - 3));
  eq('shift-h g(4) = f(1)', g(4), 1);
  ok('shift-h g blows up at 3', Math.abs(g(3 + 1e-6)) > 1e5);
  ok('shift-h g finite at 0', Number.isFinite(g(0)));
  FIGS['lsn-shift-h'] = {
    spec: { f: (x) => (Math.abs(x - 3) < 1e-9 ? null : 1 / (x - 3)), xMin: -3, xMax: 6, yMin: -4, yMax: 4, vAsymptotes: [3], hAsymptotes: [0] },
    before: { f: inv, vAsymptotes: [0], hAsymptotes: [0] },
    names: { primary: ['f(x-3)', 4.6], before: ['f(x)', -0.5] },
  };
}
// lesson · reflection in the x-axis  g = -f, f = (x-2)^2 - 4.
{
  const g = (x: number) => -P(x);
  eq('reflect-x vertex of f', P(2), -4);
  eq('reflect-x vertex of g', g(2), 4);
  eq("reflect-x f'(2) = 0", D(P, 2), 0, 1e-6);
  ok('reflect-x the three graphs differ', P(1) !== g(1) && P(1) !== P(-1) && g(1) !== P(-1));
  ok('reflect-x roots stay put', P(0) === 0 && g(0) === 0 && P(4) === 0 && g(4) === 0);
  FIGS['lsn-reflect-x'] = {
    spec: { f: g, xMin: -1.5, xMax: 5.5, yMin: -6, yMax: 6, points: [{ x: 2, y: 4, label: '(2, 4)' }] },
    before: { f: P, points: [{ x: 2, y: -4, label: '(2, -4)' }] },
    names: { primary: ['-f(x)', 3.0], before: ['f(x)', 1.0] },
  };
}
// lesson · reflection in the y-axis  g = f(-x) = (x+2)^2 - 4.
{
  const g = (x: number) => P(-x);
  eq('reflect-y vertex of g', g(-2), -4);
  eq('reflect-y g(-4) = f(4) = 0', g(-4), 0);
  eq('reflect-y g(0) = f(0) = 0', g(0), 0);
  ok('reflect-y g differs from f', g(1) !== P(1) && g(-2) !== P(-2));
  FIGS['lsn-reflect-y'] = {
    spec: { f: g, xMin: -6.5, xMax: 6.5, yMin: -6, yMax: 6, points: [{ x: -2, y: -4, label: '(-2, -4)' }] },
    before: { f: P, points: [{ x: 2, y: -4, label: '(2, -4)' }] },
    names: { primary: ['f(-x)', -3.3], before: ['f(x)', 3.3] },
  };
}
// lesson · vertical stretch  g = 2f: every height doubles, the roots stay.
{
  const g = (x: number) => 2 * P(x);
  eq('stretch vertex of g', g(2), -8);
  eq('stretch g(1) = 2 f(1)', g(1), 2 * P(1));
  ok('stretch roots stay put', g(0) === 0 && g(4) === 0);
  FIGS['lsn-stretch'] = {
    spec: { f: g, xMin: -1.5, xMax: 5.5, yMin: -10, yMax: 8, points: [{ x: 2, y: -8, label: '(2, -8)' }] },
    before: { f: P, points: [{ x: 2, y: -4, label: '(2, -4)' }] },
    names: { primary: ['2f(x)', 3.1], before: ['f(x)', 1.0] },
  };
}
// lesson · vertical compression  g = f/2.
{
  const g = (x: number) => P(x) / 2;
  eq('compress vertex of g', g(2), -2);
  ok('compress roots stay put', g(0) === 0 && g(4) === 0);
  FIGS['lsn-compress'] = {
    spec: { f: g, xMin: -1.5, xMax: 5.5, yMin: -6, yMax: 6, points: [{ x: 2, y: -2, label: '(2, -2)' }] },
    before: { f: P, points: [{ x: 2, y: -4, label: '(2, -4)' }] },
    names: { primary: ['0.5f(x)', -1.3], before: ['f(x)', 1.2] },
  };
}
// lesson · worked example "f above g": f = 4/x, g = x. f - g = (4 - x^2)/x.
{
  const f = (x: number) => 4 / x;
  const g = (x: number) => x;
  const d = (x: number) => f(x) - g(x);
  const zs = signChanges(d, -6, -0.001).concat(signChanges(d, 0.001, 6));
  ok(`above: f - g changes sign at -2, 2 (found ${zs.map((v) => v.toFixed(3))})`, zs.length === 2 && Math.abs(zs[0] + 2) < 1e-5 && Math.abs(zs[1] - 2) < 1e-5);
  for (const x of [-10, -3, -2.1]) ok(`above: f > g at x=${x}`, d(x) > 0);
  for (const x of [-1.9, -1, -0.1]) ok(`above: f < g at x=${x}`, d(x) < 0);
  for (const x of [0.1, 1, 1.9]) ok(`above: f > g at x=${x}`, d(x) > 0);
  for (const x of [2.1, 3, 10]) ok(`above: f < g at x=${x}`, d(x) < 0);
  eq('above: f(-2) = -2', f(-2), -2);
  eq('above: f(2) = 2', f(2), 2);
  FIGS['lsn-above'] = {
    spec: { f: (x) => (Math.abs(x) < 1e-9 ? null : 4 / x), xMin: -6, xMax: 6, yMin: -6, yMax: 6, vAsymptotes: [0], hAsymptotes: [0], points: [{ x: -2, y: -2, label: '(-2, -2)' }, { x: 2, y: 2, label: '(2, 2)' }] },
    before: { f: g },
    names: { primary: ['f', 1.4], before: ['g', -4.6] },
  };
}

// rq-sub-tr-001 · a representative f with the horizontal asymptote y = 2, and g = f - 7.
{
  const f = (x: number) => 2 + 1 / x;
  const g = (x: number) => f(x) - 7;
  eq('001 f tends to 2', f(1e6), 2, 1e-5);
  eq('001 g tends to -5', g(1e6), -5, 1e-5);
  FIGS['q-tr-001'] = {
    spec: { f: (x) => (inv(x) === null ? null : g(x)), xMin: -4, xMax: 4, yMin: -10, yMax: 7, vAsymptotes: [0], hAsymptotes: [-5] },
    before: { f: (x) => (inv(x) === null ? null : f(x)), vAsymptotes: [0], hAsymptotes: [2] },
    names: { primary: ['g', -2.2], before: ['f', 2.2] },
  };
}
// rq-sub-tr-002 · f with the vertical asymptote x = 1, and g = f(x - 5).
{
  const f = (x: number) => 3 / (x - 1);
  const g = (x: number) => f(x - 5);
  ok('002 f blows up at 1', Math.abs(f(1 + 1e-6)) > 1e5);
  ok('002 g blows up at 6', Math.abs(g(6 + 1e-6)) > 1e5);
  ok('002 g finite at 1', Number.isFinite(g(1)));
  FIGS['q-tr-002'] = {
    spec: { f: (x) => (Math.abs(x - 6) < 1e-9 ? null : g(x)), xMin: -3, xMax: 9, yMin: -4, yMax: 4, vAsymptotes: [6], hAsymptotes: [0] },
    before: { f: (x) => (Math.abs(x - 1) < 1e-9 ? null : f(x)), vAsymptotes: [1], hAsymptotes: [0] },
    names: { primary: ['g', 8.0], before: ['f', 2.8] },
  };
}
// rq-sub-tr-004 · f with the minimum (4, -3), and g = |f|.
{
  const f = (x: number) => (x - 4) ** 2 - 3;
  const g = (x: number) => Math.abs(f(x));
  eq('004 f(4) = -3', f(4), -3);
  eq("004 f'(4) = 0", D(f, 4), 0, 1e-6);
  eq('004 g(4) = 3', g(4), 3);
  ok('004 (4, 3) is a maximum of g', g(3.9) < 3 && g(4.1) < 3);
  FIGS['q-tr-004'] = {
    spec: { f: g, xMin: 0, xMax: 8, yMin: -4.5, yMax: 8, points: [{ x: 4, y: 3, label: '(4, 3)' }] },
    before: { f, points: [{ x: 4, y: -3, label: '(4, -3)' }] },
    names: { primary: ['|f(x)|', 7], before: ['f(x)', 1.2] },
  };
}
// rq-sub-tr-005 · f = x + 25/x and g = f + 10: g touches the x-axis at the peak (-5, 0).
{
  const f = (x: number) => x + 25 / x;
  const g = (x: number) => f(x) + 10;
  eq('005 f(-5) = -10', f(-5), -10);
  eq('005 f(5) = 10', f(5), 10);
  eq("005 f'(5) = 0", D(f, 5), 0, 1e-6);
  eq('005 g(-5) = 0', g(-5), 0);
  eq('005 g(5) = 20', g(5), 20);
  ok('005 g never rises above 0 on the left', maxOn(g, -60, -0.01) <= 1e-9);
  ok('005 the right branch of g stays above 20', minOn(g, 0.01, 60) >= 20 - 1e-9);
  ok('005 g meets the x-axis exactly once', signChanges(g, -60, -0.01).length === 0 && signChanges(g, 0.01, 60).length === 0 && Math.abs(g(-5)) < 1e-12);
  FIGS['q-tr-005'] = {
    spec: { f: (x) => (inv(x) === null ? null : g(x)), xMin: -16, xMax: 16, yMin: -24, yMax: 34, vAsymptotes: [0], points: [{ x: -5, y: 0, label: '(-5, 0)' }, { x: 5, y: 20, label: '(5, 20)' }] },
    before: { f: (x) => (inv(x) === null ? null : f(x)), vAsymptotes: [0], points: [{ x: 5, y: 10, label: '(5, 10)' }, { x: -5, y: -10, label: '(-5, -10)' }] },
    names: { primary: ['g', -12], before: ['f', 12] },
  };
}
// rq-sub-tr-007 · a representative f with a maximum at height 1 and a minimum at height 7, and the line y = 4.
{
  const f = (x: number) => x + 9 / (4 * x) + 4;
  eq('007 maximum height 1 at x = -1.5', f(-1.5), 1);
  eq('007 minimum height 7 at x = 1.5', f(1.5), 7);
  eq("007 f'(-1.5) = 0", D(f, -1.5), 0, 1e-6);
  eq("007 f'(1.5) = 0", D(f, 1.5), 0, 1e-6);
  ok('007 left branch never above 1', maxOn(f, -80, -0.01) <= 1 + 1e-9);
  ok('007 right branch never below 7', minOn(f, 0.01, 80) >= 7 - 1e-9);
  ok('007 f(x) = 4 has no solution', signChanges((x) => f(x) - 4, -80, -0.01).length === 0 && signChanges((x) => f(x) - 4, 0.01, 80).length === 0);
  FIGS['q-tr-007'] = {
    spec: { f: (x) => (inv(x) === null ? null : f(x)), xMin: -6, xMax: 6, yMin: -7, yMax: 15, vAsymptotes: [0], points: [{ x: -1.5, y: 1, label: '(-1.5, 1)' }, { x: 1.5, y: 7, label: '(1.5, 7)' }] },
    levels: [{ y: 4, label: 'y = 4', atX: 4.3 }],
  };
}
// rq-tr-drill-002 · f with the maximum (2, 7), and g = -f.
{
  const f = (x: number) => 7 - (x - 2) ** 2;
  const g = (x: number) => -f(x);
  eq('d002 f(2) = 7', f(2), 7);
  eq("d002 f'(2) = 0", D(f, 2), 0, 1e-6);
  eq('d002 g(2) = -7', g(2), -7);
  ok('d002 (2, -7) is a minimum of g', g(1.9) > -7 && g(2.1) > -7);
  FIGS['q-drill-002'] = {
    spec: { f: g, xMin: -2, xMax: 6, yMin: -9, yMax: 9, points: [{ x: 2, y: -7, label: '(2, -7)' }] },
    before: { f, points: [{ x: 2, y: 7, label: '(2, 7)' }] },
    names: { primary: ['-f(x)', 5.2], before: ['f(x)', 3.6] },
  };
}
// rq-tr-drill-004 · f = 1/(x^2 - 4) is even: mirrored points at the same height.
{
  const f = (x: number) => 1 / (x * x - 4);
  eq('d004 f(3) = f(-3)', f(3), f(-3));
  eq('d004 f(3) = 0.2', f(3), 0.2);
  eq('d004 f(0) = -0.25', f(0), -0.25);
  for (const x of [0.7, 1.3, 2.5, 4]) eq(`d004 even at x=${x}`, f(-x), f(x), 1e-12);
  FIGS['q-drill-004'] = {
    spec: {
      f: (x) => (Math.abs(x * x - 4) < 1e-9 ? null : f(x)),
      xMin: -5, xMax: 5, yMin: -1.2, yMax: 1.2, vAsymptotes: [-2, 2],
      points: [{ x: 3, y: 0.2, label: '(3, 0.2)' }, { x: -3, y: 0.2, label: '(-3, 0.2)' }],
    },
  };
}
// rq-tr-drill-005 · f with a maximum at height -2 and a minimum at height 5; g = f + 2 touches the x-axis.
{
  const f = (x: number) => x + 49 / (16 * x) + 1.5;
  const g = (x: number) => f(x) + 2;
  eq('d005 maximum height -2 at x = -1.75', f(-1.75), -2);
  eq('d005 minimum height 5 at x = 1.75', f(1.75), 5);
  eq("d005 f'(1.75) = 0", D(f, 1.75), 0, 1e-6);
  eq('d005 g(-1.75) = 0', g(-1.75), 0);
  ok('d005 g meets the x-axis once', maxOn(g, -80, -0.01) <= 1e-9 && minOn(g, 0.01, 80) >= 7 - 1e-9);
  FIGS['q-drill-005'] = {
    spec: { f: (x) => (inv(x) === null ? null : g(x)), xMin: -6, xMax: 6, yMin: -8, yMax: 13, vAsymptotes: [0], points: [{ x: -1.75, y: 0, label: '(-1.75, 0)' }, { x: 1.75, y: 7, label: '(1.75, 7)' }] },
    before: { f: (x) => (inv(x) === null ? null : f(x)), vAsymptotes: [0], points: [{ x: -1.75, y: -2, label: '(-1.75, -2)' }, { x: 1.75, y: 5, label: '(1.75, 5)' }] },
    names: { primary: ['g', -4.6], before: ['f', 4.6] },
  };
}

// ── legibility audit (anchor-aware), copied from _gen-rq-round4-figures.ts ──
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

const built: Record<string, string> = {};
for (const [id, fig] of Object.entries(FIGS)) {
  try {
    const svg = build(fig);
    checks++;
    if (auditSvg(id, svg)) fails++;
    built[id] = svg;
  } catch (e) {
    checks++; fails++;
    console.log(`   ✗ ${id}: ${(e as Error).message}`);
  }
}

function spliceIn(src: string, id: string, svg: string): string {
  const open = `<!-- fig:${id} -->`;
  const i = src.indexOf(open);
  if (i < 0) throw new Error(`marker ${open} not found in ${LESSON}`);
  if (src.indexOf(open, i + 1) >= 0) throw new Error(`marker ${open} appears more than once`);
  const j = src.indexOf('`', i);
  if (j < 0) throw new Error(`unterminated svg literal for ${id}`);
  return src.slice(0, i) + (open + svg).replace(/\r?\n/g, '\r\n') + src.slice(j);
}

async function contactSheet(out: string) {
  const sharp = (await import('sharp')).default;
  const COLS = 4, CW = 600, CH = 520;
  const ids = Object.keys(built);
  const tiles = await Promise.all(
    ids.map(async (id, i) => ({
      input: await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" width="${CW}" height="${CH}"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="6" y="14" font-size="11" fill="#DB2777">${id}</text>${built[id]}</svg>`,
        ),
      ).png().toBuffer(),
      left: (i % COLS) * CW,
      top: Math.floor(i / COLS) * CH,
    })),
  );
  await sharp({ create: { width: COLS * CW, height: Math.ceil(ids.length / COLS) * CH, channels: 3, background: '#FFFFFF' } })
    .composite(tiles).png().toFile(out);
  console.log(`contact sheet -> ${out}`);
}

const arg = process.argv[2];
const done = () => {
  console.log(`\n${checks - fails}/${checks} checks passed${fails ? ` - ${fails} FAILED` : ''}`);
  process.exit(fails ? 1 : 0);
};
if (fails) done();
else if (arg === '--write') {
  let src = readFileSync(LESSON, 'utf8');
  for (const [id, svg] of Object.entries(built)) src = spliceIn(src, id, svg);
  writeFileSync(LESSON, src);
  console.log(`wrote ${Object.keys(built).length} figures into ${LESSON}`);
  done();
} else if (arg === '--png') void contactSheet(process.argv[3] ?? 'lesson-figures.png').then(done);
else if (arg && built[arg]) { console.log(built[arg]); done(); }
else done();
