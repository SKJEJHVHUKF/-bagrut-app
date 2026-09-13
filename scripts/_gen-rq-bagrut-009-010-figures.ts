/* Figures for the two סעיפי חשיבה added to the בגרות rung of רמה 6 (2026-09-11).
 *
 *   bag-009-e   fn-bag-rq-009/ה — p(x) = 1/g(x), g(x) = f(x) - 2, f(x) = 16(x-2)/x^2
 *   bag-010-b   fn-bag-rq-010/ב — f(x) = x*sqrt(4-x^2)
 *   bag-010-d   fn-bag-rq-010/ד — g(x) = |f(x) - sqrt(3)|
 *   bag-010-e   fn-bag-rq-010/ה — the same g, crossed by y = 2-sqrt(3) and y = sqrt(3)
 *
 * Every figure is drawn FROM the function by lib/fn-figure.ts, which re-derives
 * each asserted feature numerically and returns errors instead of a picture when
 * one of them is false. Nothing is typed in pixels — including the two level
 * lines of bag-010-e: each is rendered by fn-figure itself as a constant function
 * in the SAME window, and only restyled here, so a line cannot drift away from
 * the curve it is supposed to cross. The intersection points are found by
 * bisection on the real g.
 *
 *   npx tsx scripts/_gen-rq-bagrut-009-010-figures.ts          # print
 *   npx tsx scripts/_gen-rq-bagrut-009-010-figures.ts --write  # splice into the lesson
 *
 * --write replaces the body of each `<!-- fig:ID -->` template literal in the
 * lesson file (CRLF preserved), so it is idempotent and can be re-run after a
 * window, a point or a function changes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fnFigure, type FnFigureSpec } from '../lib/fn-figure';

const LESSON = 'content/lessons/math5/functions-root-quotient.ts';
const r2 = Math.SQRT2;
const r3 = Math.sqrt(3);

// ---- the functions, exactly as the two questions define them ----------------
// 009, with the a = 16 that part ג pins down. g is undefined wherever f is: a
// composite has no value where an inner denominator is zero.
const f9 = (x: number) => (16 * (x - 2)) / (x * x);
const g9 = (x: number) => (x === 0 ? null : f9(x) - 2);
const p9 = (x: number) => {
  const g = g9(x);
  return g === null || g === 0 ? null : 1 / g;
};
// 010
const f10 = (x: number) => (4 - x * x < 0 ? null : x * Math.sqrt(4 - x * x));
const g10 = (x: number) => {
  const v = f10(x);
  return v === null ? null : Math.abs(v - r3);
};

/** Where g10 meets y = k inside [from, to], by bisection — never typed by hand. */
function meets(k: number, from: number, to: number): number {
  let lo = from;
  let hi = to;
  const s = Math.sign(g10(lo)! - k);
  if (s === Math.sign(g10(hi)! - k)) throw new Error(`no crossing of y = ${k} in [${from}, ${to}]`);
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (Math.sign(g10(m)! - k) === s) lo = m;
    else hi = m;
  }
  const x = (lo + hi) / 2;
  if (Math.abs(g10(x)! - k) > 1e-6) throw new Error(`bisection missed y = ${k} near x = ${x}`);
  return x;
}

const K_SMALL = 2 - r3;
const WIN_010 = { xMin: -2.6, xMax: 2.6, yMin: -0.5, yMax: 4.4, domainFrom: -2, domainTo: 2 };
// The three meetings with y = 2-sqrt(3): one left of the small hump, the tangency
// at its top, one right of it. The tangency is a touch, not a crossing, so it is
// the hump's own maximum — taken from the derivative's zero, not from bisection.
const TOUCH = r2;
const LOW = [meets(K_SMALL, 0, 1), TOUCH, meets(K_SMALL, r3, 2)];
// ...and with y = sqrt(3): both domain edges and one crossing between them.
const HIGH = [-2, meets(r3, -0.5, 0.5), 2];

type Level = { y: number; label: string; atX: number };
type Fig = { spec: FnFigureSpec; levels?: Level[] };

const FIGS: Record<string, Fig> = {
  // 009/ה — the trap made visible: x = 4 is the only vertical asymptote, and at
  // x = 0 the graph runs into a MISSING POINT at the origin, not to infinity.
  'bag-009-e': {
    spec: {
      f: p9,
      xMin: -8,
      xMax: 12,
      yMin: -3,
      yMax: 0.7,
      vAsymptotes: [4],
      hAsymptotes: [-0.5],
      points: [{ x: 0, y: 0, label: '(0, 0)', hole: true }],
    },
  },

  // 010/ב — the sketch part: both extrema, both domain edges, the origin.
  // Ordered so the alternating label placement puts each label on the empty
  // side: peak above, trough below, left edge above, right edge below.
  'bag-010-b': {
    spec: {
      f: f10,
      xMin: -2.6,
      xMax: 2.6,
      yMin: -2.9,
      yMax: 2.9,
      domainFrom: -2,
      domainTo: 2,
      points: [
        { x: r2, y: 2, label: '(√2, 2)' },
        { x: -r2, y: -2, label: '(-√2, -2)' },
        { x: -2, y: 0, label: '(-2, 0)' },
        { x: 2, y: 0, label: '(2, 0)' },
        { x: 0, y: 0, label: '(0, 0)' },
      ],
    },
  },

  // 010/ד — g = |f - √3|: everything below the height √3 is reflected upwards,
  // so the trough becomes the highest point and the two zeros become minima.
  'bag-010-d': {
    spec: {
      f: g10,
      ...WIN_010,
      points: [
        { x: -r2, y: 2 + r3, label: '(-√2, 2+√3)' },
        { x: 1, y: 0, label: '(1, 0)' },
        { x: r2, y: 2 - r3, label: '(√2, 2-√3)' },
        { x: r3, y: 0, label: '(√3, 0)' },
        { x: -2, y: r3, label: '(-2, √3)' },
        { x: 2, y: r3, label: '(2, √3)' },
      ],
    },
  },

  // 010/ה — the same graph with the only two heights that give three meetings.
  // The dots are the meetings themselves; labels would crowd them off the frame,
  // so the heights are named on the lines instead.
  'bag-010-e': {
    spec: {
      f: g10,
      ...WIN_010,
      points: [
        ...LOW.map((x) => ({ x, y: K_SMALL })),
        ...HIGH.map((x) => ({ x, y: r3 })),
      ],
    },
    levels: [
      { y: K_SMALL, label: 'y = 2-√3', atX: -1.2 },
      { y: r3, label: 'y = √3', atX: 0.9 },
    ],
  },
};

/** A horizontal line drawn by fn-figure itself, in the same window, then restyled. */
function levelLine(spec: FnFigureSpec, lv: Level): string {
  // The line is cut to the DOMAIN: it matters only where the curve exists, and
  // spanning the whole frame ran it through the axis letter at the right edge.
  // The cut lives in the function itself — a constant that ignored the domain is
  // defined past the edge, which is exactly what checkFnFigure refuses to draw.
  const lo = spec.domainFrom ?? -Infinity;
  const hi = spec.domainTo ?? Infinity;
  const { svg, errors } = fnFigure({
    ...spec,
    f: (x) => (x < lo || x > hi ? null : lv.y),
    points: [],
    vAsymptotes: [],
    hAsymptotes: [],
  });
  if (errors.length) throw new Error(`level y = ${lv.y}: ${errors.join('; ')}`);
  const m = svg.match(/<polyline points="([^"]+)"/);
  if (!m) throw new Error(`level y = ${lv.y}: fn-figure drew no line`);
  const pts = m[1].split(' ').map((p) => p.split(',').map(Number));
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[pts.length - 1];
  const i = Math.round(((lv.atX - spec.xMin) / (spec.xMax - spec.xMin)) * (pts.length - 1));
  const [lx, ly] = pts[Math.min(Math.max(i, 0), pts.length - 1)];
  return (
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#059669" stroke-width="1.6" stroke-dasharray="5 4"/>\n` +
    `<text x="${lx}" y="${(ly - 5).toFixed(1)}" font-size="10.5" fill="#059669" font-weight="bold" text-anchor="middle">${lv.label}</text>`
  );
}

function build(fig: Fig): string {
  const { svg, errors } = fnFigure(fig.spec);
  if (errors.length) throw new Error(errors.join('; '));
  if (!fig.levels) return svg;
  const lines = fig.levels.map((lv) => levelLine(fig.spec, lv)).join('\n');
  // Insert BEFORE the curve so the curve is drawn on top of the dashed lines.
  // Index splice, never String.replace: a `$` in a payload rewrites the file.
  const at = svg.indexOf('<polyline');
  if (at < 0) throw new Error('nothing to draw');
  return svg.slice(0, at) + lines + '\n' + svg.slice(at);
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

const built = Object.fromEntries(Object.entries(FIGS).map(([id, fig]) => [id, build(fig)]));

if (process.argv.includes('--write')) {
  let src = readFileSync(LESSON, 'utf8');
  for (const [id, svg] of Object.entries(built)) src = spliceIn(src, id, svg);
  writeFileSync(LESSON, src);
  console.log(`wrote ${Object.keys(built).length} figures into ${LESSON}`);
} else {
  for (const [id, svg] of Object.entries(built)) {
    console.log(`===== ${id} (${svg.split('\n').filter(Boolean).length} elements, ${svg.length} chars)`);
  }
  console.log('meetings with y = 2-√3:', LOW.map((x) => x.toFixed(4)).join(', '));
  console.log('meetings with y = √3:  ', HIGH.map((x) => x.toFixed(4)).join(', '));
}
