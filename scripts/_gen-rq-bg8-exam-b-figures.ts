// ============================================================
// Figures for the בגרות rung of רמה 8 (rq-bagrut-mixed), set B
// ============================================================
//
//   fn-bag-rq-013  f(x) = sqrt((x^2 - a)/(x^2 - 4)), a = 36 once part ד fixes it
//   fn-bag-rq-014  f(x) = x^2/((x + 1)(x - a)), a = 3, and g = 1/f^2
//   fn-bag-rq-015  f(x) = sqrt(a - x), a = 17 (a = 8 in the tangency part), g(x) = 4/sqrt(x)
//
// Every figure is drawn from the real function by lib/plot-svg and carries
// checks: each marked point lies on its curve, each hatched region integrates to
// the number the solution states, and each drawn level line meets the curve where
// the caption says. Writes content/lessons/math5/rq-extra/bagrut-exam-b-figures.ts.
//
//   npx tsx scripts/_gen-rq-bg8-exam-b-figures.ts [--sheet <dir>]
import { region, areaOf, on, tick, ytick, t, PALETTE, emitFigureModule, type Spec, type Check } from './_fig-spec-helpers';

const { INDIGO, PINK, EMERALD_DEEP, AMBER } = PALETTE;
const S: Spec[] = [];
const add = (s: Spec) => S.push(s);
const r2 = Math.SQRT2;
const near = (label: string, got: number, want: number, tol = 1e-6): Check => [label, got, want, tol];
const yes = (label: string, cond: boolean): Check => [label, cond ? 1 : 0, 1];

// ---------------------------------------------------------------- 013
const q13 = (x: number) => (x * x - 36) / (x * x - 4);
const f13 = (x: number) => {
  const v = q13(x);
  return v < 0 ? NaN : Math.sqrt(v);
};
const C13 = [
  { f: f13, from: -9, to: -6 },
  { f: f13, from: -1.999, to: 1.999 },
  { f: f13, from: 6, to: 9 },
];
const BASE13 = {
  xRange: [-9, 9] as [number, number],
  curves: C13,
  vAsym: [{ x: -2 }, { x: 2, label: 'x = 2' }],
  hAsym: [{ y: 1, label: 'y = 1' }],
  halo: true,
};
// the renderer puts every vertical-asymptote label right of its line, where x = -2 lands on the y-axis letter
const T13 = [{ x: -2.3, y: 6.3, text: 'x = -2', color: AMBER, anchor: 'end' as const, bold: true }];
const checks13: Check[] = [
  on('f13', f13, -6, 0), on('f13', f13, 6, 0), on('f13', f13, 0, 3),
  near('HA y = 1 far right', f13(1e5), 1, 1e-6), near('HA y = 1 far left', f13(-1e5), 1, 1e-6),
  yes('undefined between 2 and 6', Number.isNaN(f13(4)) && Number.isNaN(f13(-3))),
  yes('outer branches stay below 1', [6.5, 8, 9, 50].every((x) => f13(x) < 1 && f13(-x) < 1)),
  yes('middle branch stays at or above 3', [-1.9, -1, -0.3, 0.4, 1.5].every((x) => f13(x) >= 3)),
];
add({
  id: 'q13d',
  fig: {
    ...BASE13, yRange: [-0.8, 6.8],
    guides: [{ x1: -9, y1: 3, x2: 9, y2: 3, color: PINK, dashed: true }],
    points: [{ x: 0, y: 3, label: '(0, 3)', color: INDIGO, dx: 32, dy: 16 }],
    texts: [...T13, { x: 7, y: 3.45, text: 'y = 3', color: PINK, bold: true }],
  },
  caption:
    'הגרף של $f$ עבור $a = 36$, והישר $y = 3$ בוורוד. הישר נוגע בענף האמצעי רק בנקודת המינימום $(0,\\; 3)$, והענפים החיצוניים נמצאים כולם מתחת לאסימפטוטה $y = 1$, ולכן אינם מגיעים אליו. הקווים הכתומים המקווקווים הם האסימפטוטות $x = -2$, $x = 2$ וגם $y = 1$.',
  checks: [...checks13, yes('y = 3 below the middle branch except at 0', [-1.5, -0.5, 0.5, 1.5].every((x) => f13(x) > 3))],
});
add({
  id: 'q13e',
  fig: {
    ...BASE13, yRange: [-0.8, 6.8],
    points: [
      { x: -6, y: 0, label: '(-6, 0)', color: INDIGO, dx: -20, dy: 16 },
      { x: 6, y: 0, label: '(6, 0)', color: INDIGO, dx: -16, dy: 16 },
      { x: 0, y: 3, label: '(0, 3)', color: INDIGO, dx: 32, dy: 4 },
    ],
    texts: T13,
  },
  caption:
    'סקיצה של $f(x) = \\sqrt{\\dfrac{x^2 - 36}{x^2 - 4}}$. הענף האמצעי יורד מהאסימפטוטה $x = -2$ אל המינימום $(0,\\; 3)$ ועולה אל האסימפטוטה $x = 2$. הענפים החיצוניים יוצאים מציר $x$ בנקודות $(-6,\\; 0)$ וגם $(6,\\; 0)$ ומתקרבים מלמטה לאסימפטוטה $y = 1$. בין $2$ לבין $6$, ובין $-6$ לבין $-2$, הפונקציה אינה מוגדרת.',
  checks: checks13,
});
{
  // h(x) = f(x - 4): the y-axis falls in the gap -2 < x <= 2 where h is undefined
  const h13 = (x: number) => f13(x - 4);
  add({
    id: 'q13f',
    fig: {
      xRange: [-8, 16], yRange: [-0.8, 6.8], halo: true,
      curves: [{ f: h13, from: -8, to: -2 }, { f: h13, from: 2.001, to: 5.999 }, { f: h13, from: 10, to: 16 }],
      vAsym: [{ x: 2, label: 'x = 2' }, { x: 6, label: 'x = 6' }],
      hAsym: [{ y: 1, label: 'y = 1' }],
      points: [
        { x: -2, y: 0, label: '(-2, 0)', color: INDIGO, dx: -22, dy: 16 },
        { x: 10, y: 0, label: '(10, 0)', color: INDIGO, dx: -18, dy: 16 },
        { x: 4, y: 3, label: '(4, 3)', color: INDIGO, dx: 30, dy: 4 },
      ],
    },
    caption:
      'הגרף של $h(x) = f(x - 4)$ עבור $a = 36$: הגרף של $f$ הוזז ארבע יחידות ימינה. הענף השמאלי מסתיים בנקודה $(-2,\\; 0)$, הענף האמצעי נמצא בין האסימפטוטות $x = 2$ וגם $x = 6$, והענף הימני יוצא מהנקודה $(10,\\; 0)$. ציר $y$ עובר ברווח שבו $h$ אינה מוגדרת, ולכן אינו פוגש את הגרף.',
    checks: [
      on('h13', h13, -2, 0), on('h13', h13, 10, 0), on('h13', h13, 4, 3),
      yes('h undefined on the y-axis and around it', [0, 1, -1.5, 2].every((x) => Number.isNaN(h13(x)))),
      yes('h defined at the gap edges', Number.isFinite(h13(-2)) && Number.isFinite(h13(2.5))),
      near('h HA', h13(1e5), 1, 1e-6),
    ],
  });
}

// ---------------------------------------------------------------- 014
const f14 = (x: number) => (x * x) / ((x + 1) * (x - 3));
const g14 = (x: number) => (x === 0 || x === -1 || x === 3 ? NaN : 1 / f14(x) ** 2);
const checks14: Check[] = [
  on('f14', f14, -3, 0.75), on('f14', f14, 0, 0),
  near('f14 HA', f14(1e6), 1, 1e-5), near('f14 HA left', f14(-1e6), 1, 1e-5),
];
add({
  id: 'q14d',
  fig: {
    xRange: [-9, 7], yRange: [-3.2, 3.6], halo: true,
    curves: [{ f: f14, to: -1.001 }, { f: f14, from: -0.999, to: 2.999 }, { f: f14, from: 3.001 }],
    vAsym: [{ x: -1 }, { x: 3 }],
    texts: [
      { x: -1.25, y: 3.15, text: 'x = -1', color: AMBER, anchor: 'end', bold: true },
      { x: 2.8, y: 2.55, text: 'x = 3', color: AMBER, anchor: 'end', bold: true },
    ],
    hAsym: [{ y: 1, label: 'y = 1' }],
    points: [
      { x: -3, y: 0.75, label: '(-3, 3/4)', color: INDIGO, dx: -30, dy: 17 },
      { x: 0, y: 0, label: '(0, 0)', color: INDIGO, dx: 6, dy: -8 },
    ],
  },
  caption:
    'סקיצה של $f(x) = \\dfrac{x^2}{(x + 1)(x - 3)}$. משמאל הגרף יורד מתחת לאסימפטוטה $y = 1$ אל המינימום $\\left(-3,\\; \\dfrac{3}{4}\\right)$ ועולה אל האסימפטוטה $x = -1$. בין האסימפטוטות האנכיות הוא עולה מלמטה אל המקסימום $(0,\\; 0)$ ויורד חזרה, ומימין הוא יורד מלמעלה אל $y = 1$.',
  checks: [...checks14, yes('left branch dips below 1', f14(-3) < 1 && f14(-6) < 1), yes('middle branch negative', [-0.5, 1, 2.5].every((x) => f14(x) < 0))],
});
add({
  id: 'q14f',
  fig: {
    xRange: [-9, 7], yRange: [-1.1, 4.6], halo: true,
    curves: [
      { f: f14, to: -1.001, color: PINK, dashed: true, width: 1.6 },
      { f: f14, from: 3.001, color: PINK, dashed: true, width: 1.6 },
      { f: g14, to: -1.0005 }, { f: g14, from: -0.9995, to: -0.0005 }, { f: g14, from: 0.0005, to: 2.9995 }, { f: g14, from: 3.0005 },
    ],
    vAsym: [{ x: 0, label: 'x = 0' }],
    hAsym: [{ y: 1, label: 'y = 1' }],
    points: [
      { x: -3, y: 16 / 9, label: '(-3, 16/9)', color: INDIGO, dx: -34, dy: -10 },
      { x: -1, y: 0, hollow: true, color: INDIGO }, { x: 3, y: 0, hollow: true, color: INDIGO },
    ],
    xTicks: [{ x: -1, label: '-1' }, { x: 3, label: '3' }],
  },
  caption:
    'בכחול $g(x) = \\dfrac{1}{\\big(f(x)\\big)^2}$, ובוורוד מקווקו החלקים של $f$ שנכנסים לחלון. המינימום של $f$ בגובה $\\dfrac{3}{4}$ הפך למקסימום של $g$ בגובה $\\dfrac{16}{9}$, האפס של $f$ הפך לאסימפטוטה $x = 0$, ובערכים $x = -1$ וגם $x = 3$, שבהם $f$ שואפת לאינסוף, הגרף של $g$ מתקרב לציר $x$ אך הנקודות $(-1,\\; 0)$ וגם $(3,\\; 0)$ אינן על הגרף.',
  checks: [
    on('g14 max', g14, -3, 16 / 9),
    near('g14 HA', g14(1e6), 1, 1e-5),
    yes('g14 near the missing points is small', g14(-1.001) < 1e-4 && g14(2.999) < 1e-4),
    yes('right branch of g below 1, of f above 1', [3.5, 5, 7].every((x) => g14(x) < 1 && f14(x) > 1)),
    yes('left branch of g above 1 far left', [-9, -6, -4].every((x) => g14(x) > 1)),
  ],
});
{
  // a = 3: the line y = 16/9 touches g at its maximum and crosses the two branches beside x = 0
  const n1 = (3 - 6 * r2) / 7, n2 = (3 + 6 * r2) / 7;
  add({
    id: 'q14e',
    fig: {
      xRange: [-6.5, 5.5], yRange: [-0.7, 3.6], halo: true,
      curves: [{ f: g14, to: -1.0005 }, { f: g14, from: -0.9995, to: -0.0005 }, { f: g14, from: 0.0005, to: 2.9995 }, { f: g14, from: 3.0005 }],
      vAsym: [{ x: 0, label: 'x = 0' }],
      hAsym: [{ y: 1, label: 'y = 1' }],
      guides: [{ x1: -6.5, y1: 16 / 9, x2: 5.5, y2: 16 / 9, color: EMERALD_DEEP, dashed: true }],
      points: [
        { x: -3, y: 16 / 9, label: '(-3, 16/9)', color: EMERALD_DEEP, dx: -30, dy: -10 },
        { x: -1, y: 0, hollow: true, color: INDIGO }, { x: 3, y: 0, hollow: true, color: INDIGO },
      ],
      texts: [{ x: 4.2, y: 2.05, text: 'y = 16/9', color: EMERALD_DEEP, bold: true }],
    },
    caption:
      'עבור $a = 3$: הישר $y = \\dfrac{16}{9}$ (בירוק) נוגע בגרף של $g$ בנקודת המקסימום $\\left(-3,\\; \\dfrac{16}{9}\\right)$, ושם המשיק לגרף אופקי. הישר חותך גם את שני הענפים שליד האסימפטוטה $x = 0$, אבל שם הוא אינו משיק.',
    checks: [
      on('g14 max', g14, -3, 16 / 9),
      near('g14 slope at -3', (g14(-3 + 1e-6) - g14(-3 - 1e-6)) / 2e-6, 0, 1e-5),
      yes('left branch stays below the line', [-6, -4, -3.3, -2.7, -2, -1.2].every((x) => g14(x) < 16 / 9)),
      on('crosses middle left', g14, n1, 16 / 9, 1e-9), on('crosses middle right', g14, n2, 16 / 9, 1e-9),
      yes('crossings sit beside x = 0', -1 < n1 && n1 < 0 && 0 < n2 && n2 < 3),
    ],
  });
}

// ---------------------------------------------------------------- 015
const f15 = (x: number) => (x > 17 ? NaN : Math.sqrt(17 - x));
const g15 = (x: number) => (x <= 0 ? NaN : 4 / Math.sqrt(x));
const f8 = (x: number) => (x > 8 ? NaN : Math.sqrt(8 - x));
add({
  id: 'q15d',
  fig: {
    xRange: [-1.6, 19], yRange: [-0.8, 6.6], halo: true,
    curves: [{ f: f15, to: 17 }, { f: g15, from: 0.2, color: PINK }],
    vAsym: [{ x: 0, label: 'x = 0' }],
    points: [
      { x: 1, y: 4, label: '(1, 4)', color: INDIGO, dx: 8, dy: -6 },
      { x: 16, y: 1, label: '(16, 1)', color: INDIGO, dx: -44, dy: -8 },
      { x: 17, y: 0, label: '(17, 0)', color: INDIGO, dx: -14, dy: 16 },
    ],
  },
  caption:
    'בכחול $f(x) = \\sqrt{17 - x}$ ובוורוד $g(x) = \\dfrac{4}{\\sqrt{x}}$. הגרפים נפגשים בנקודות $(1,\\; 4)$ וגם $(16,\\; 1)$. בין שתי הנקודות הגרף של $f$ עליון, ומחוץ להן הגרף של $g$ עליון. הגרף של $f$ מסתיים בנקודה $(17,\\; 0)$, והקו הכתום המקווקו הוא האסימפטוטה $x = 0$ של $g$.',
  checks: [
    on('f15', f15, 1, 4), on('g15', g15, 1, 4), on('f15', f15, 16, 1), on('g15', g15, 16, 1), on('f15 end', f15, 17, 0),
    yes('f above g between', [2, 5, 9, 15].every((x) => f15(x) > g15(x))),
    yes('g above f outside', [0.3, 0.8, 16.5, 17].every((x) => g15(x) > f15(x))),
  ],
});
{
  const R = region(1, 16, f15, g15);
  add({
    id: 'q15e',
    fig: {
      xRange: [-1.6, 19], yRange: [-0.8, 6.6], halo: true,
      curves: [{ f: f15, to: 17 }, { f: g15, from: 0.2, color: PINK }], shade: [R],
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(1), tick(16)],
      points: [{ x: 1, y: 4, color: INDIGO }, { x: 16, y: 1, color: INDIGO }],
      texts: [t(8.5, 2.35, 'S = 18')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f$, שהוא העליון, לבין הגרף של $g$, שהוא התחתון, מהנקודה $(1,\\; 4)$ עד הנקודה $(16,\\; 1)$. שני הגרפים נפגשים בקצות האזור, ולכן אין צורך בקווים אנכיים שיסגרו אותו.',
    checks: [['area 18', areaOf(R), 18, 1e-6], on('f15', f15, 1, 4), on('g15', g15, 16, 1)],
  });
}
add({
  id: 'q15f',
  fig: {
    xRange: [-1, 10], yRange: [-0.6, 5.2], halo: true,
    curves: [{ f: f8, to: 8 }, { f: g15, from: 0.5, color: PINK }],
    vAsym: [{ x: 0, label: 'x = 0' }],
    guides: [{ x1: 0.4, y1: 2 + 0.25 * 3.6, x2: 7.6, y2: 2 - 0.25 * 3.6, color: EMERALD_DEEP, dashed: true }],
    points: [
      { x: 4, y: 2, label: '(4, 2)', color: INDIGO, dx: 6, dy: -10 },
      { x: 8, y: 0, label: '(8, 0)', color: INDIGO, dx: -12, dy: 16 },
    ],
  },
  caption:
    'עבור $a = 8$: בכחול $f(x) = \\sqrt{8 - x}$ ובוורוד $g(x) = \\dfrac{4}{\\sqrt{x}}$. שני הגרפים נוגעים זה בזה בנקודה $(4,\\; 2)$, ובה יש להם משיק משותף בשיפוע $-\\dfrac{1}{4}$ (הקו הירוק המקווקו). בכל נקודה אחרת הגרף של $g$ מעל הגרף של $f$.',
  checks: [
    on('f8', f8, 4, 2), on('g15', g15, 4, 2), on('f8 end', f8, 8, 0),
    near('slope f8 at 4', (f8(4 + 1e-6) - f8(4 - 1e-6)) / 2e-6, -0.25, 1e-6),
    near('slope g at 4', (g15(4 + 1e-6) - g15(4 - 1e-6)) / 2e-6, -0.25, 1e-6),
    yes('g above f8 elsewhere', [0.5, 2, 3.5, 4.5, 6, 7.9].every((x) => g15(x) > f8(x))),
  ],
});

void emitFigureModule({
  specs: S,
  outFile: 'content/lessons/math5/rq-extra/bagrut-exam-b-figures.ts',
  exportName: 'EXAM_B_FIG',
  generator: 'scripts/_gen-rq-bg8-exam-b-figures.ts',
  about: 'fn-bag-rq-013 … 015 (רמה 8, בגרות set B) — every point and region checked against its function.',
});
