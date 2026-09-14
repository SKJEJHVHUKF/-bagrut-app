// ============================================================
// רמה 8 · rq-bagrut-mixed — the practice rungs and the thinking walkthrough, drawn
// ============================================================
//
// Itay, 2026-09-14: "יש יותר מידי פונקציות בצורת המנה הזו… תכניס גם שורש… פונקציות
// של כפל מנה משהו מורכב יותר". The rewritten practice questions of רמה 8 each get a
// figure computed from their own function, with checks: every marked point lies on
// its curve, every hatched region integrates to the number the solution states.
//
// Run: npx tsx scripts/_gen-rq-bg8-practice-figures.ts [--sheet <dir>]
import { region, areaOf, on, t, tick, ytick, PALETTE, emitFigureModule, type Spec, type Check } from './_fig-spec-helpers';

const { INDIGO, PINK, INK, AMBER } = PALETTE;
const GRAY = 'rgba(51,65,85,.55)';
const specs: Spec[] = [];

/** min / max of f over a grid, skipping points outside the domain */
const scan = (f: (x: number) => number, lo: number, hi: number, n = 40000) => {
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i <= n; i++) {
    const y = f(lo + ((hi - lo) * i) / n);
    if (Number.isFinite(y)) { mn = Math.min(mn, y); mx = Math.max(mx, y); }
  }
  return { mn, mx };
};
const yes = (label: string, ok: boolean): Check => [label, ok ? 1 : 0, 1];

// ── rq-sub-bg-002 · f(x) = (2x − 6)/(x + 4) ──────────────────────────────────
{
  const f = (x: number) => (2 * x - 6) / (x + 4);
  specs.push({
    id: 'bg002',
    fig: {
      xRange: [-14, 10], yRange: [-9, 11], halo: true,
      curves: [{ f, from: -14, to: -4.3 }, { f, from: -3.6, to: 10 }],
      vAsym: [{ x: -4, label: 'x = -4' }], hAsym: [{ y: 2, label: 'y = 2' }],
      points: [
        { x: 3, y: 0, label: '(3, 0)', color: INDIGO, dx: 6, dy: 16 },
        { x: 0, y: -1.5, label: '(0, -1.5)', color: INDIGO, dx: 8, dy: 14 },
      ],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{2x - 6}{x + 4}$. הקווים המקווקווים הם האסימפטוטה האנכית $x = -4$ והאסימפטוטה האופקית $y = 2$. מסומנות נקודות החיתוך עם הצירים, $(3,\\; 0)$ וגם $(0,\\; -1.5)$.',
    checks: [
      on('f', f, 3, 0), on('f', f, 0, -1.5),
      ['denominator vanishes at -4', -4 + 4, 0],
      ['numerator at -4 is -14, so an asymptote', 2 * -4 - 6, -14],
      ['f far out tends to 2', f(1e7), 2, 1e-5],
    ],
  });
}

// ── rq-sub-bg-001 · f(x) = (x² + 15)/√(x + 3) ────────────────────────────────
{
  const f = (x: number) => (x * x + 15) / Math.sqrt(x + 3);
  specs.push({
    id: 'bg001',
    fig: {
      xRange: [-4, 8], yRange: [-2, 26], halo: true,
      curves: [{ f, from: -2.62, to: 8 }],
      vAsym: [{ x: -3 }],
      texts: [{ x: -2.8, y: 1.5, text: 'x = -3', color: AMBER, anchor: 'start', bold: true }],
      xTicks: [tick(1)], yTicks: [ytick(8)],
      points: [{ x: 1, y: 8, label: '(1, 8)', color: INDIGO, dx: -10, dy: 18 }],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{x^2 + 15}{\\sqrt{x + 3}}$. הקו המקווקו הוא האסימפטוטה האנכית $x = -3$, והגרף קיים רק מימינה. הוא יורד עד נקודת המינימום $(1,\\; 8)$ ומשם עולה.',
    checks: [
      on('f', f, 1, 8),
      yes('nothing on (-3, 8] lies below 8', scan(f, -2.999, 8).mn >= 8 - 1e-9),
      yes('rises toward the asymptote: f(-2.9) > f(-2)', f(-2.9) > f(-2)),
    ],
  });
}

// ── rq-sub-bg-005 · f(x) = √(x − 9)/x — the solution and the walkthrough ─────
{
  const f = (x: number) => Math.sqrt(x - 9) / x;
  specs.push({
    id: 'bg005',
    fig: {
      xRange: [-4, 62], yRange: [-0.04, 0.22], halo: true,
      curves: [{ f, from: 9, to: 62 }],
      xTicks: [tick(18)],
      guides: [{ x1: 11, y1: 1 / 6, x2: 25, y2: 1 / 6, color: PINK, dashed: true }],
      points: [
        { x: 18, y: 1 / 6, label: '(18, 1/6)', color: INDIGO, dx: 8, dy: -8 },
        { x: 9, y: 0, label: '(9, 0)', color: INDIGO, dx: -14, dy: 16 },
      ],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{\\sqrt{x - 9}}{x}$. הוא מתחיל בנקודת הקצה $(9,\\; 0)$, עולה עד נקודת המקסימום $\\left(18,\\; \\dfrac{1}{6}\\right)$, שבה המשיק אופקי, ויורד לאט לכיוון ציר $x$.',
    checks: [
      on('f', f, 18, 1 / 6, 1e-12), on('f', f, 9, 0),
      yes('nothing on [9, 400] lies above 1/6', scan(f, 9, 400).mx <= 1 / 6 + 1e-12),
    ],
  });
  // step 1 of the walkthrough: only the horizontal tangent, no domain edge, no height
  specs.push({
    id: 'ghost005Tangent',
    fig: {
      xRange: [-4, 62], yRange: [-0.04, 0.22],
      curves: [{ f, from: 11.5, to: 62 }],
      xTicks: [tick(18)],
      guides: [{ x1: 11, y1: 1 / 6, x2: 25, y2: 1 / 6, color: PINK, dashed: true }],
      points: [{ x: 18, y: 1 / 6, color: PINK }],
    },
    caption:
      'בנקודה שבה $x = 18$ המשיק לגרף (הקו הוורוד) אופקי: שיפועו אפס. זה כל מה שהנתון אומר, ועוד לא ידוע כמה גבוהה הנקודה.',
    checks: [
      on('f', f, 18, 1 / 6, 1e-12),
      ['the slope at 18 is 0 (central difference)', (f(18 + 1e-5) - f(18 - 1e-5)) / 2e-5, 0, 1e-8],
    ],
  });
  // step 3: a = 9 puts the domain edge at 9, and 18 lies inside the domain
  specs.push({
    id: 'ghost005Domain',
    fig: {
      xRange: [-4, 62], yRange: [-0.04, 0.22],
      curves: [{ f, from: 9, to: 62 }],
      xTicks: [tick(18)],
      guides: [{ x1: 18, y1: 0, x2: 18, y2: 1 / 6, color: INK, dashed: true }],
      points: [{ x: 9, y: 0, label: '(9, 0)', color: INDIGO, dx: -14, dy: 16 }],
    },
    caption:
      'עבור $a = 9$ תחום ההגדרה הוא $x \\ge 9$, והגרף מתחיל בנקודה $(9,\\; 0)$. הערך $18$ נמצא בתוך התחום, ולכן יש שם נקודה על הגרף.',
    checks: [on('f', f, 9, 0), yes('18 is inside x >= 9', 18 >= 9)],
  });
}

// ── rq-sub-bg-006 · g(x) = (x − 3)√x + k, k = 2 ──────────────────────────────
{
  const f = (x: number) => (x - 3) * Math.sqrt(x);
  const g = (x: number) => f(x) + 2;
  specs.push({
    id: 'bg006',
    fig: {
      xRange: [-0.8, 5.6], yRange: [-2.8, 7], halo: true,
      curves: [{ f, from: 0, to: 5.6, color: GRAY, dashed: true, width: 1.8 }, { f: g, from: 0, to: 5.6 }],
      xTicks: [tick(3)], yTicks: [ytick(2), ytick(-2)],
      points: [
        { x: 1, y: 0, label: '(1, 0)', color: INDIGO, dx: -4, dy: -10 },
        { x: 0, y: 2, color: INDIGO },
        { x: 1, y: -2, color: GRAY },
      ],
    },
    caption:
      'בכחול הגרף של $g(x) = f(x) + 2$; בקו אפור מקווקו, לשם השוואה, הגרף של $f(x) = (x - 3)\\sqrt{x}$. ההזזה כלפי מעלה בשתי יחידות מרימה את נקודת המינימום $(1,\\; -2)$ בדיוק אל ציר $x$, ולכן הגרף של $g$ נוגע בציר רק בנקודה $(1,\\; 0)$.',
    checks: [
      on('g', g, 1, 0), on('g', g, 0, 2), on('f', f, 1, -2),
      yes('g never dips below the axis on [0, 40]', scan(g, 0, 40).mn >= -1e-9),
      yes('g is 0 only at x = 1: g(0.9) > 0 and g(1.1) > 0', g(0.9) > 0 && g(1.1) > 0),
    ],
  });
}

// ── rq-sub-bg-102 · f(x) = x/(x + 1)² ────────────────────────────────────────
{
  const f = (x: number) => x / (x + 1) ** 2;
  specs.push({
    id: 'q102',
    fig: {
      xRange: [-5, 7], yRange: [-2.6, 0.7], halo: true,
      curves: [{ f, from: -5, to: -1.4 }, { f, from: -0.72, to: 7 }],
      vAsym: [{ x: -1 }],
      texts: [{ x: -1.25, y: 0.45, text: 'x = -1', color: AMBER, anchor: 'end', bold: true }],
      xTicks: [tick(1)], yTicks: [ytick(0.25, '1/4')],
      points: [{ x: 1, y: 0.25, label: '(1, 1/4)', color: INDIGO, dx: 8, dy: -8 }],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{x}{(x + 1)^2}$. הקו המקווקו הוא האסימפטוטה האנכית $x = -1$. הגרף עולה עד נקודת המקסימום $\\left(1,\\; \\dfrac{1}{4}\\right)$ ואחריה יורד לכיוון ציר $x$.',
    checks: [
      on('f', f, 1, 0.25),
      yes('nothing right of the asymptote lies above 1/4', scan(f, -0.999, 400).mx <= 0.25 + 1e-12),
      yes('the left branch is below the axis', scan(f, -400, -1.001).mx < 0),
    ],
  });
}

// ── rq-sub-bg-105 · f(x) = 2x/(x² − 1) ───────────────────────────────────────
{
  const f = (x: number) => (2 * x) / (x * x - 1);
  specs.push({
    id: 'q105',
    fig: {
      xRange: [-5, 5], yRange: [-5, 5], halo: true,
      curves: [{ f, from: -5, to: -1.08 }, { f, from: -0.9, to: 0.9 }, { f, from: 1.08, to: 5 }],
      vAsym: [{ x: -1 }, { x: 1 }],
      texts: [
        { x: -1.2, y: 4.55, text: 'x = -1', color: AMBER, anchor: 'end', bold: true },
        { x: 1.2, y: -4.6, text: 'x = 1', color: AMBER, anchor: 'start', bold: true },
      ],
      xTicks: [tick(3)],
      points: [{ x: 0, y: 0, label: '(0, 0)', color: INDIGO, dx: 8, dy: -8 }],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{2x}{x^2 - 1}$: שלושה ענפים, והקווים המקווקווים הם האסימפטוטות האנכיות $x = -1$ וגם $x = 1$. כל ענף יורד לכל אורכו, אבל הערך בנקודה $x = 3$ גבוה מהערך בנקודה $x = -3$.',
    checks: [
      on('f', f, 0, 0),
      yes('decreasing on each branch (sampled)', [-4, -2, -0.5, 0.5, 2, 4].every((x) => f(x + 1e-4) < f(x))),
      yes('f(3) > f(-3): not decreasing across the asymptotes', f(3) > f(-3)),
    ],
  });
}

// ── rq-sub-bg-107 · g(x) = 6/f(x), f(x) = x² − x − 12 ─────────────────────────
{
  const g = (x: number) => 6 / (x * x - x - 12);
  specs.push({
    id: 'q107',
    fig: {
      xRange: [-8, 9], yRange: [-3, 3], halo: true,
      curves: [{ f: g, from: -8, to: -3.25 }, { f: g, from: -2.75, to: 3.75 }, { f: g, from: 4.25, to: 9 }],
      vAsym: [{ x: -3, label: 'x = -3' }, { x: 4 }],
      texts: [{ x: 3.8, y: 2.75, text: 'x = 4', color: AMBER, anchor: 'end', bold: true }],
      points: [{ x: 0, y: -0.5, label: '(0, -1/2)', color: INDIGO, dx: 6, dy: 34 }],
    },
    caption:
      'הגרף של $g(x) = \\dfrac{6}{f(x)}$. במקומות שבהם $f$ מתאפסת, $x = -3$ וגם $x = 4$, יש לגרף של $g$ אסימפטוטות אנכיות ולא נקודות חיתוך. ציר $x$ הוא האסימפטוטה האופקית, והגרף אינו חותך אותו; החיתוך עם ציר $y$ הוא $\\left(0,\\; -\\dfrac{1}{2}\\right)$.',
    checks: [
      on('g', g, 0, -0.5),
      yes('g never vanishes (numerator 6)', scan(g, -300, 300).mn < 0 && [-5, 0, 6].every((x) => g(x) !== 0)),
      ['g far out tends to 0', g(1e6), 0, 1e-9],
    ],
  });
}

// ── rq-sub-bg-109 · f(x) = 18x/(x² + 9)², area from 0 to a = 4 ───────────────
{
  const f = (x: number) => (18 * x) / (x * x + 9) ** 2;
  const R = region(0, 4, f);
  specs.push({
    id: 'q109',
    fig: {
      xRange: [-1, 8], yRange: [-0.05, 0.3], halo: true,
      curves: [{ f, from: -1, to: 8 }], shade: [R],
      xTicks: [tick(4)], yTicks: [ytick(0.2, '0.2')],
      texts: [t(2.2, 0.06, 'S = 16/25')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f(x) = \\dfrac{18x}{(x^2 + 9)^2}$, ציר $x$ והישר $x = 4$. בתחום $0 \\le x \\le 4$ הגרף מעל ציר $x$, ולכן השטח שווה לאינטגרל עצמו.',
    checks: [
      ['area 16/25', areaOf(R), 16 / 25, 1e-7],
      yes('above the axis on (0, 4]', scan(f, 1e-6, 4).mn > 0),
    ],
  });
}

// ── rq-sub-bg-110 · f(x) = 5√(x² + 16) − 3x ──────────────────────────────────
{
  const f = (x: number) => 5 * Math.sqrt(x * x + 16) - 3 * x;
  specs.push({
    id: 'q110',
    fig: {
      xRange: [-3, 11], yRange: [-3, 38], halo: true,
      curves: [{ f, from: -3, to: 11 }],
      xTicks: [tick(3)], yTicks: [ytick(16)],
      points: [{ x: 3, y: 16, label: '(3, 16)', color: INDIGO, dx: -12, dy: 20 }],
    },
    caption:
      'הגרף של $f(x) = 5\\sqrt{x^2 + 16} - 3x$. הוא יורד עד נקודת המינימום $(3,\\; 16)$ ומשם עולה, ולכן כל הגרף נמצא בגובה $16$ ומעליו, רחוק מציר $x$.',
    checks: [
      on('f', f, 3, 16),
      yes('nothing on [-300, 300] lies below 16', scan(f, -300, 300, 600000).mn >= 16 - 1e-9),
    ],
  });
}

// ── rq-sub-bg-305 · f(x) = √(x + 8) + √(8 − x) ──────────────────────────────
{
  const f = (x: number) => Math.sqrt(x + 8) + Math.sqrt(8 - x);
  const top = 4 * Math.SQRT2;
  specs.push({
    id: 'q305Levels',
    fig: {
      xRange: [-10, 10], yRange: [-0.8, 7.2], halo: true,
      curves: [{ f, from: -8, to: 8 }],
      guides: [
        { x1: -10, y1: top, x2: 10, y2: top, color: PINK, dashed: true },
        { x1: -10, y1: 5, x2: 10, y2: 5, color: PINK, dashed: true },
        { x1: -10, y1: 4, x2: 10, y2: 4, color: PINK, dashed: true },
      ],
      texts: [
        { x: 0, y: 6.15, text: '(0, 4√2)', anchor: 'middle' },
        { x: 2, y: 4.6, text: 'y = 5', color: PINK, anchor: 'middle', bold: true },
        { x: 2, y: 3.45, text: 'y = 4', color: PINK, anchor: 'middle', bold: true },
      ],
      points: [
        { x: 0, y: top, color: PINK },
        { x: -8, y: 4, label: '(-8, 4)', color: INDIGO, dx: 6, dy: 18 },
        { x: 8, y: 4, label: '(8, 4)', color: INDIGO, dx: -38, dy: 18 },
      ],
    },
    caption:
      'הגרף של $f(x) = \\sqrt{x + 8} + \\sqrt{8 - x}$ ושלושה ישרים אופקיים. הישר $y = 4\\sqrt{2}$ נוגע בגרף רק במקסימום. הישר $y = 5$ חותך אותו פעמיים. הישר $y = 4$ פוגש את הגרף בשתי נקודות הקצה, $(-8,\\; 4)$ וגם $(8,\\; 4)$.',
    checks: [
      on('f', f, 0, top, 1e-12), on('f', f, -8, 4), on('f', f, 8, 4),
      yes('nothing on [-8, 8] lies above 4√2', scan(f, -8, 8).mx <= top + 1e-12),
      yes('nothing on [-8, 8] lies below 4', scan(f, -8, 8).mn >= 4 - 1e-12),
      yes('y = 5 is crossed twice: f(-7.9) < 5 < f(0) > 5 > f(7.9)', f(-7.9) < 5 && f(0) > 5 && f(7.9) < 5),
    ],
  });
  const R = region(-8, 8, f);
  specs.push({
    id: 'q305Area',
    fig: {
      xRange: [-10, 10], yRange: [-0.8, 7.2], halo: true,
      curves: [{ f, from: -8, to: 8 }], shade: [R],
      xTicks: [tick(-8), tick(8)],
      texts: [t(0, 2, 'S = 256/3')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f$, ציר $x$ והישרים $x = -8$ וגם $x = 8$. כל הגרף נמצא מעל הגובה $4$, ולכן השטח שווה לאינטגרל עצמו.',
    checks: [['area 256/3 (Simpson converges slowly at the root endpoints)', areaOf(R, 200000), 256 / 3, 1e-6]],
  });
}

// ── rq-sub-bg-306 · f(x) = √x + 4/x, and g(x) = 12/f(x) ──────────────────────
{
  const f = (x: number) => Math.sqrt(x) + 4 / x;
  const g = (x: number) => 12 / f(x);
  specs.push({
    id: 'q306f',
    fig: {
      xRange: [-1.5, 17], yRange: [-0.8, 9.5], halo: true,
      curves: [{ f, from: 0.43, to: 17 }],
      vAsym: [{ x: 0 }],
      points: [{ x: 4, y: 3, label: '(4, 3)', color: INDIGO, dx: -6, dy: 20 }],
    },
    caption:
      'הגרף של $f(x) = \\sqrt{x} + \\dfrac{4}{x}$. ציר $y$ הוא האסימפטוטה האנכית, והגרף קיים רק מימינו. הוא יורד עד נקודת המינימום $(4,\\; 3)$ ומשם עולה בלי גבול, ולכן אין לו אסימפטוטה אופקית.',
    checks: [
      on('f', f, 4, 3),
      yes('nothing on (0, 400] lies below 3', scan(f, 1e-4, 400, 400000).mn >= 3 - 1e-9),
    ],
  });
  specs.push({
    id: 'q306g',
    fig: {
      xRange: [-1.5, 40], yRange: [-0.6, 5], halo: true,
      curves: [{ f: g, from: 1e-4, to: 40 }],
      points: [
        { x: 4, y: 4, label: '(4, 4)', color: INDIGO, dx: 8, dy: -8 },
        { x: 0, y: 0, hollow: true, color: INDIGO },
      ],
    },
    caption:
      'הגרף של $g(x) = \\dfrac{12}{f(x)}$. המינימום של $f$ הופך למקסימום של $g$, בנקודה $(4,\\; 4)$. בשני הקצוות $f$ גדלה בלי גבול, ולכן $g$ מתקרבת לאפס: ציר $x$ הוא האסימפטוטה האופקית, וראשית הצירים אינה על הגרף (עיגול ריק).',
    checks: [
      on('g', g, 4, 4),
      yes('nothing on (0, 400] lies above 4', scan(g, 1e-4, 400, 400000).mx <= 4 + 1e-9),
      ['g near 0+ tends to 0', g(1e-10), 0, 1e-3],
    ],
  });
}

// ── rq-sub-bg-307 · f(x) = (√x − a)/(√x + a), a = 2 ──────────────────────────
{
  const f = (x: number) => (Math.sqrt(x) - 2) / (Math.sqrt(x) + 2);
  specs.push({
    id: 'q307',
    fig: {
      xRange: [-3, 40], yRange: [-1.4, 1.4], halo: true,
      curves: [{ f, from: 0, to: 40 }],
      hAsym: [{ y: 1 }],
      texts: [{ x: 39.5, y: 1.12, text: 'y = 1', color: AMBER, anchor: 'end', bold: true }],
      points: [
        { x: 0, y: -1, label: '(0, -1)', color: INDIGO, dx: 8, dy: 16 },
        { x: 4, y: 0, label: '(4, 0)', color: INDIGO, dx: 8, dy: 16 },
        { x: 16, y: 1 / 3, label: '(16, 1/3)', color: INDIGO, dx: 6, dy: 18 },
      ],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{\\sqrt{x} - 2}{\\sqrt{x} + 2}$. הוא מתחיל בנקודת הקצה $(0,\\; -1)$, עולה כל הזמן, חותך את ציר $x$ בנקודה $(4,\\; 0)$, עובר דרך הנקודה $\\left(16,\\; \\dfrac{1}{3}\\right)$, ומתקרב מלמטה לאסימפטוטה האופקית $y = 1$ בלי לגעת בה.',
    checks: [
      on('f', f, 0, -1), on('f', f, 4, 0), on('f', f, 16, 1 / 3, 1e-12),
      yes('increasing (sampled)', [0.5, 2, 5, 12, 30, 90].every((x) => f(x + 1e-3) > f(x))),
      yes('stays below 1', scan(f, 0, 1e6, 200000).mx < 1),
    ],
  });
}

// ── rq-sub-bg-308 · f(x) = x√x/(x − 3) ──────────────────────────────────────
{
  const f = (x: number) => (x * Math.sqrt(x)) / (x - 3);
  specs.push({
    id: 'q308',
    fig: {
      xRange: [-1.5, 21], yRange: [-11, 15], halo: true,
      curves: [{ f, from: 0, to: 2.84 }, { f, from: 3.15, to: 21 }],
      vAsym: [{ x: 3 }],
      guides: [{ x1: 3.4, y1: 4.5, x2: 21, y2: 4.5, color: PINK, dashed: true }],
      texts: [
        { x: 3.4, y: -10, text: 'x = 3', color: AMBER, anchor: 'start', bold: true },
        { x: 20.8, y: 3.4, text: 'y = 9/2', color: PINK, anchor: 'end', bold: true },
      ],
      points: [
        { x: 9, y: 4.5, label: '(9, 9/2)', color: INDIGO, dx: -18, dy: 20 },
        { x: 0, y: 0, label: '(0, 0)', color: INDIGO, dx: 6, dy: -8 },
      ],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{x\\sqrt{x}}{x - 3}$. הקו המקווקו האנכי הוא האסימפטוטה $x = 3$. משמאל לה הגרף יורד מנקודת הקצה $(0,\\; 0)$ כלפי מטה, ומימינה הוא יורד עד נקודת המינימום $\\left(9,\\; \\dfrac{9}{2}\\right)$ ומשם עולה. בין הגובה $0$ לגובה $\\dfrac{9}{2}$ אין אף נקודה של הגרף.',
    checks: [
      on('f', f, 9, 4.5), on('f', f, 0, 0),
      yes('right branch never below 9/2', scan(f, 3.0001, 400, 400000).mn >= 4.5 - 1e-9),
      yes('left branch never above 0', scan(f, 0, 2.9999).mx <= 1e-12),
    ],
  });
}

void emitFigureModule({
  specs,
  outFile: 'content/lessons/math5/rq-extra/bagrut-mixed-figures.ts',
  exportName: 'BG8_FIG',
  generator: 'scripts/_gen-rq-bg8-practice-figures.ts',
  about: 'רמה 8 practice rungs (rq-sub-bg-*) and the walkthrough gr-rq-bg-005: every figure computed from its own function.',
});
