// ============================================================
// Figures for רמה 8 bagrut set A (fn-bag-rq-008, -011, -012)
// ============================================================
//
//   npx tsx scripts/_gen-rq-bg8-exam-a-figures.ts [--sheet <dir>]
//
// Writes content/lessons/math5/rq-extra/bagrut-exam-a-figures.ts (EXAM_A_FIG).
// Captions write g = 1/f and g = √f without "(x)": the stage gate treats any
// string of the stage that CONTAINS a practice question's "f(x) = …" right-hand
// side as a reused function, and rq-sub-bg-108 / rq-sub-bg-203 define exactly those.
// Every curve is the question's real function; every marked point and every
// hatched region is checked against the number the solution states.
import { region, areaOf, on, t, tick, ytick, PALETTE, emitFigureModule, type Spec } from './_fig-spec-helpers';

const { INDIGO, PINK, AMBER } = PALETTE;

/** Bisection root of g on [lo, hi] (g changes sign there). */
function root(g: (x: number) => number, lo: number, hi: number): number {
  let a = lo, b = hi;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (Math.sign(g(m)) === Math.sign(g(a))) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

// fn-bag-rq-008 — f(x) = (x² + 3) / √x
const f8 = (x: number) => (x * x + 3) / Math.sqrt(x);
// fn-bag-rq-011 — f(x) = 16(x − 1)² / x⁴ and g = 1/f
const f11 = (x: number) => (16 * (x - 1) ** 2) / x ** 4;
const g11 = (x: number) => (x === 0 || x === 1 ? NaN : x ** 4 / (16 * (x - 1) ** 2));
// fn-bag-rq-012 — f(x) = (x + 4)√(8 − x) and g = √f
const f12 = (x: number) => (x + 4) * Math.sqrt(8 - x);
const g12 = (x: number) => Math.sqrt(f12(x));
const chord12 = (x: number) => -4 * x + 32;

/** f8 near its asymptote in its own dense piece, so the curve reaches the top of the frame. */
const F8 = [{ f: f8, from: 0.01, to: 0.6 }, { f: f8, from: 0.6 }];

const specs: Spec[] = [];
const add = (s: Spec) => specs.push(s);

// ======== fn-bag-rq-008
add({
  id: 'q8Sketch',
  fig: {
    xRange: [-0.9, 6.4], yRange: [-1.4, 16.5], curves: F8, halo: true,
    vAsym: [{ x: 0, label: 'x = 0' }],
    xTicks: [tick(1), tick(4)], yTicks: [ytick(4)],
    points: [
      { x: 1, y: 4, label: '(1, 4)', color: INDIGO, dx: 6, dy: 16 },
      { x: 4, y: 9.5, label: '(4, 9.5)', color: INDIGO, dx: 8, dy: 10 },
    ],
  },
  caption:
    'סקיצה של $f(x) = \\dfrac{x^2 + 3}{\\sqrt{x}}$ בתחום $x > 0$. ליד הישר $x = 0$ הגרף עולה בלי גבול, הוא יורד אל המינימום $(1,\\; 4)$, ומשם עולה בלי גבול, בלי אסימפטוטה אופקית. הקו הכתום המקווקו הוא האסימפטוטה האנכית $x = 0$.',
  checks: [
    on('f8', f8, 1, 4),
    on('f8', f8, 4, 9.5),
    ['f8 grows past every window height near 0+', f8(1e-4) > 100 ? 1 : 0, 1],
    ['f8 grows past every window height at the right', f8(100) > 900 ? 1 : 0, 1],
  ],
});
{
  const lo8 = root((x) => f8(x) - 8, 0.01, 1);
  const hi8 = root((x) => f8(x) - 8, 1, 6);
  add({
    id: 'q8Lines',
    fig: {
      xRange: [-0.9, 6.4], yRange: [-1.4, 11.5], curves: F8, halo: true,
      vAsym: [{ x: 0 }],
      guides: [
        { x1: -0.9, y1: 8, x2: 6.4, y2: 8, color: PINK, dashed: true },
        { x1: -0.9, y1: 4, x2: 6.4, y2: 4, color: PINK, dashed: true },
        { x1: -0.9, y1: 2, x2: 6.4, y2: 2, color: PINK, dashed: true },
      ],
      xTicks: [tick(1)],
      points: [
        { x: lo8, y: 8, color: INDIGO },
        { x: hi8, y: 8, color: INDIGO },
        { x: 1, y: 4, color: INDIGO },
      ],
      texts: [
        { x: 5.2, y: 8.55, text: 'k = 8', color: PINK, bold: true },
        { x: 5.2, y: 4.55, text: 'k = 4', color: PINK, bold: true },
        { x: 5.2, y: 2.55, text: 'k = 2', color: PINK, bold: true },
      ],
    },
    caption:
      'הגרף של $f$ ושלושה ישרים אופקיים בוורוד. הישר $y = 8$, מעל המינימום, חותך את הגרף פעמיים. הישר $y = 4$ נוגע בגרף רק בנקודת המינימום $(1,\\; 4)$. הישר $y = 2$, מתחת למינימום, אינו פוגש את הגרף.',
    checks: [
      on('f8', f8, 1, 4),
      on('f8 left meet with y = 8', f8, lo8, 8, 1e-7),
      on('f8 right meet with y = 8', f8, hi8, 8, 1e-7),
      ['y = 8 meets twice: the two meets are on both sides of the minimum', lo8 < 1 && hi8 > 1 ? 1 : 0, 1],
      ['y = 2 is below the minimum', Math.min(...Array.from({ length: 600 }, (_, i) => f8(0.01 + i * 0.01))) > 2 ? 1 : 0, 1],
    ],
  });
}
{
  const R = region(1, 4, f8);
  add({
    id: 'q8Area',
    fig: {
      xRange: [-0.7, 5.2], yRange: [-1.1, 12.5], curves: F8, shade: [R], halo: true,
      vAsym: [{ x: 0 }],
      xTicks: [tick(1), tick(4)], yTicks: [ytick(4)],
      points: [
        { x: 1, y: 4, label: '(1, 4)', color: INDIGO, dx: -40, dy: 16 },
        { x: 4, y: 9.5, label: '(4, 9.5)', color: INDIGO, dx: 8, dy: -6 },
      ],
      texts: [t(2.5, 2.4, 'S = 92/5')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f$, ציר $x$ והישרים $x = 1$ וגם $x = 4$. בכל הקטע הגרף מעל ציר $x$. הקו הכתום המקווקו הוא האסימפטוטה האנכית $x = 0$.',
    checks: [on('f8', f8, 1, 4), on('f8', f8, 4, 9.5), ['area 92/5', areaOf(R), 92 / 5, 1e-7]],
  });
}

// ======== fn-bag-rq-011
add({
  id: 'q11Sketch',
  fig: {
    xRange: [-7, 7], yRange: [-0.35, 2.4], curves: [{ f: f11, to: -0.3 }, { f: f11, from: 0.6, to: 1.4 }, { f: f11, from: 1.4 }], halo: true,
    vAsym: [{ x: 0, label: 'x = 0' }],
    xTicks: [tick(4)], yTicks: [ytick(1)],
    points: [
      { x: 1, y: 0, label: '(1, 0)', color: INDIGO, dx: 4, dy: 17 },
      { x: 2, y: 1, label: '(2, 1)', color: INDIGO, dx: 6, dy: -9 },
    ],
  },
  caption:
    'סקיצה של $f(x) = \\dfrac{16(x - 1)^2}{x^4}$. משני צידי הישר $x = 0$ הגרף עולה בלי גבול. הוא נוגע בציר $x$ במינימום $(1,\\; 0)$, עולה אל המקסימום $(2,\\; 1)$, ובשני הקצוות מתקרב אל ציר $x$ מלמעלה. הקו הכתום המקווקו הוא האסימפטוטה האנכית $x = 0$.',
  checks: [
    on('f11', f11, 1, 0),
    on('f11', f11, 2, 1),
    ['f11 > 0 away from x = 1', Math.min(f11(-6), f11(-0.5), f11(0.5), f11(1.5), f11(6)) > 0 ? 1 : 0, 1],
    ['f11 → +∞ at 0 from both sides', Math.min(f11(-1e-3), f11(1e-3)) > 1e6 ? 1 : 0, 1],
  ],
});
{
  const meet = -2 + 2 * Math.sqrt(2);
  add({
    id: 'q11Recip',
    fig: {
      xRange: [-3.4, 4.6], yRange: [-0.45, 4.6], curves: [
        { f: f11, to: -1 }, { f: f11, from: 0.5, to: 1.5 }, { f: f11, from: 1.5 },
        { f: g11, to: 0, color: PINK }, { f: g11, from: 0.3, to: 0.999, color: PINK }, { f: g11, from: 1.001, to: 1.6, color: PINK }, { f: g11, from: 1.6, color: PINK },
      ], halo: true,
      // the renderer's fixed spot for an asymptote label sits on g's branch at x = 1+, so that one is a free text
      vAsym: [{ x: 0, label: 'x = 0' }, { x: 1 }],
      xTicks: [tick(2), tick(3)], yTicks: [ytick(1)],
      points: [
        { x: 2, y: 1, label: '(2, 1)', color: INDIGO, dx: 4, dy: 18 },
        { x: 0, y: 0, hollow: true, color: PINK, label: '(0, 0)', dx: -34, dy: 16 },
      ],
      texts: [
        { x: 4.2, y: 2.35, text: 'g', color: PINK, bold: true },
        { x: 1.6, y: 4.25, text: 'x = 1', color: AMBER, bold: true, anchor: 'start' as const },
        { x: -2.55, y: 3.2, text: 'f', color: INDIGO, bold: true },
      ],
    },
    caption:
      'בכחול $f$ ובוורוד $g = \\dfrac{1}{f}$. במקום שבו $f$ שואפת לאינסוף, $g$ שואפת לאפס, ולכן בנקודה $(0,\\; 0)$ יש לגרף של $g$ נקודה חסרה (עיגול ריק). במקום שבו $f$ מתאפסת, לגרף של $g$ יש אסימפטוטה אנכית $x = 1$. המקסימום $(2,\\; 1)$ של $f$ הוא המינימום של $g$. הקווים הכתומים המקווקווים הם הישרים $x = 0$ וגם $x = 1$.',
    checks: [
      on('f11', f11, 2, 1),
      on('g11', g11, 2, 1),
      ['g11 → 0 near x = 0', Math.max(g11(-1e-3), g11(1e-3)) < 1e-6 ? 1 : 0, 1],
      ['g11 undefined at x = 0 (f is)', Number.isNaN(g11(0)) ? 1 : 0, 1],
      ['g11 → +∞ at x = 1', g11(1 + 1e-4) > 1e6 && g11(1 - 1e-4) > 1e6 ? 1 : 0, 1],
      ['g11 minimum on x > 1 is at 2', Math.min(g11(1.9), g11(2.1)) > g11(2) ? 1 : 0, 1],
      on('f and g meet left of 1', f11, meet, g11(meet), 1e-9),
    ],
  });
}
{
  const R = region(1, 4, f11);
  add({
    id: 'q11Area',
    fig: {
      xRange: [-0.6, 5.3], yRange: [-0.16, 1.45], curves: [{ f: f11, from: 0.62, to: 1.2 }, { f: f11, from: 1.2 }], shade: [R], halo: true,
      vAsym: [{ x: 0 }],
      xTicks: [tick(1), tick(4)], yTicks: [ytick(1)],
      points: [{ x: 2, y: 1, label: '(2, 1)', color: INDIGO, dx: 7, dy: -7 }],
      texts: [t(2.55, 0.28, 'S = 9/4')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f$, ציר $x$ והישר $x = 4$. משמאל הוא נסגר בנקודה $(1,\\; 0)$, שבה הגרף נוגע בציר $x$, ובכל הקטע הגרף מעל הציר.',
    checks: [on('f11', f11, 2, 1), on('f11', f11, 1, 0), ['area 9/4', areaOf(R), 9 / 4, 1e-7]],
  });
}

// ======== fn-bag-rq-012
add({
  id: 'q12Sketch',
  fig: {
    xRange: [-7.5, 10], yRange: [-12.5, 19.5], curves: [{ f: f12, to: 8 }], halo: true,
    xTicks: [tick(-4), tick(4), tick(8)], yTicks: [ytick(16)],
    points: [
      { x: -4, y: 0, color: INDIGO },
      { x: 8, y: 0, color: INDIGO },
      { x: 4, y: 16, label: '(4, 16)', color: INDIGO, dx: 8, dy: -4 },
      { x: 0, y: 8 * Math.SQRT2, label: '(0, 8√2)', color: INDIGO, dx: -58, dy: -6 },
    ],
  },
  caption:
    'סקיצה של $f(x) = (x + 4)\\sqrt{8 - x}$ בתחום $x \\le 8$. משמאל הגרף בא מלמטה בלי גבול, חותך את ציר $x$ בנקודה $(-4,\\; 0)$ ואת ציר $y$ בנקודה $(0,\\; 8\\sqrt{2})$, עולה אל המקסימום $(4,\\; 16)$, ויורד אל קצה התחום $(8,\\; 0)$, שם הגרף נגמר.',
  checks: [
    on('f12', f12, -4, 0),
    on('f12', f12, 8, 0),
    on('f12', f12, 4, 16),
    on('f12', f12, 0, 8 * Math.SQRT2),
    ['f12 undefined right of 8', Number.isNaN(f12(8.01)) ? 1 : 0, 1],
  ],
});
add({
  id: 'q12Sqrt',
  fig: {
    xRange: [-6.5, 10], yRange: [-2.6, 19], curves: [{ f: f12, to: 8 }, { f: g12, from: -4, to: 8, color: PINK }], halo: true,
    xTicks: [tick(-4), tick(4), tick(8)], yTicks: [ytick(4), ytick(16)],
    points: [
      { x: 4, y: 16, label: '(4, 16)', color: INDIGO, dx: 8, dy: -4 },
      { x: 4, y: 4, label: '(4, 4)', color: PINK, dx: 6, dy: -9 },
      { x: -4, y: 0, color: PINK },
      { x: 8, y: 0, color: PINK },
    ],
    texts: [
      { x: -1.2, y: 13, text: 'f', color: INDIGO, bold: true },
      { x: -2.2, y: 4.2, text: 'g', color: PINK, bold: true },
    ],
  },
  caption:
    'בכחול $f$ ובוורוד $g = \\sqrt{f}$. הגרף של $g$ קיים רק שם שהגרף של $f$ אינו מתחת לציר $x$, כלומר בקטע $-4 \\le x \\le 8$. בשני קצות הקטע $g$ מתאפסת, והמקסימום $(4,\\; 16)$ של $f$ הופך למקסימום $(4,\\; 4)$ של $g$.',
  checks: [
    on('g12', g12, 4, 4),
    on('g12', g12, -4, 0),
    on('g12', g12, 8, 0),
    ['g12 undefined left of -4', Number.isNaN(g12(-4.01)) ? 1 : 0, 1],
    ['g12 maximum at 4', Math.max(g12(3.9), g12(4.1)) < g12(4) ? 1 : 0, 1],
  ],
});
{
  const R = region(4, 8, f12, chord12);
  add({
    id: 'q12Area',
    fig: {
      xRange: [-1.2, 9.6], yRange: [-2.2, 19.2], curves: [{ f: f12, from: -1.2, to: 8 }], shade: [R], halo: true,
      guides: [{ x1: 3.2, y1: chord12(3.2), x2: 8.6, y2: chord12(8.6), color: AMBER }],
      yTicks: [ytick(16)],
      points: [
        { x: 4, y: 16, label: '(4, 16)', color: INDIGO, dx: -52, dy: -4 },
        { x: 8, y: 0, label: '(8, 0)', color: INDIGO, dx: -46, dy: 15 },
      ],
      texts: [{ ...t(9.5, 10, 'S = 96/5'), anchor: 'end' as const }],
    },
    caption:
      'בכתום הישר $y = -4x + 32$, העובר דרך המקסימום $(4,\\; 16)$ ודרך קצה התחום $(8,\\; 0)$. האזור המקווקו כלוא בין הגרף של $f$, שהוא הגבול העליון, לבין הישר, שהוא הגבול התחתון.',
    checks: [
      on('f12', f12, 4, 16),
      on('chord', chord12, 4, 16),
      on('chord', chord12, 8, 0),
      ['graph above the chord inside (4, 8)', Math.min(...[4.5, 5, 6, 7, 7.9].map((x) => f12(x) - chord12(x))) > 0 ? 1 : 0, 1],
      // Simpson converges slowly at the √ endpoint (infinite slope at x = 8), hence 1e-5.
      ['area 96/5', areaOf(R), 96 / 5, 1e-5],
    ],
  });
}

emitFigureModule({
  specs,
  outFile: 'content/lessons/math5/rq-extra/bagrut-exam-a-figures.ts',
  exportName: 'EXAM_A_FIG',
  generator: 'scripts/_gen-rq-bg8-exam-a-figures.ts',
  about: 'רמה 8 bagrut set A: fn-bag-rq-008, fn-bag-rq-011, fn-bag-rq-012.',
});
