// ============================================================
// רמה 8 · rq-bagrut-mixed — the lesson's worked summary question, drawn
// ============================================================
//
// Itay, 2026-09-14, on the summary question's sketch part: "להוסיף כאן שרטוט
// בסעיף ה ותוסיף לתרגיל הזה עוד 2 סעיפים אחד של חשיבה ואחד של חישוב אינטגרל".
// The question is f(x) = (x+2)/√(x−2): its sketch, the horizontal lines of the
// thinking part, and the hatched area of the integral part.
//
// Run: npx tsx scripts/_gen-rq-bg8-lesson-figures.ts [--sheet <dir>]
import { region, areaOf, on, t, tick, ytick, PALETTE, emitFigureModule, type Spec } from './_fig-spec-helpers';

const { INDIGO, PINK } = PALETTE;
const f = (x: number) => (x + 2) / Math.sqrt(x - 2);
const minOn = (lo: number, hi: number, n = 20000) => {
  let m = Infinity;
  for (let i = 0; i <= n; i++) m = Math.min(m, f(lo + ((hi - lo) * i) / n));
  return m;
};

const specs: Spec[] = [];

specs.push({
  id: 'lsnSketch',
  fig: {
    xRange: [-0.8, 14], yRange: [-0.8, 10.5], halo: true,
    curves: [{ f, from: 2.2, to: 14 }],
    vAsym: [{ x: 2, label: 'x = 2' }],
    xTicks: [tick(3), tick(6)], yTicks: [ytick(4)],
    points: [
      { x: 6, y: 4, label: '(6, 4)', color: INDIGO, dx: -14, dy: 18 },
      { x: 3, y: 5, label: '(3, 5)', color: INDIGO, dx: 8, dy: -6 },
    ],
  },
  caption:
    'סקיצה של $f(x) = \\dfrac{x + 2}{\\sqrt{x - 2}}$. הקו המקווקו הוא האסימפטוטה האנכית $x = 2$, והגרף עולה לאורכה כלפי מעלה. הוא יורד עד המינימום $(6,\\; 4)$ ומשם עולה בלי גבול. הגרף אינו פוגש אף ציר.',
  checks: [
    on('f', f, 6, 4), on('f', f, 3, 5),
    ['minimum: nothing on (2.2, 14] lies below 4', minOn(2.2, 14) >= 4 - 1e-9 ? 1 : 0, 1],
    ['rises toward the asymptote: f(2.2) > f(3)', f(2.2) > f(3) ? 1 : 0, 1],
  ],
});

specs.push({
  id: 'lsnLevels',
  fig: {
    xRange: [-0.8, 19.8], yRange: [-0.8, 9.5], halo: true,
    curves: [{ f, from: 2.2, to: 19.8 }],
    vAsym: [{ x: 2 }],
    guides: [
      { x1: 2.4, y1: 5, x2: 19.8, y2: 5, color: PINK, dashed: true },
      { x1: 2.4, y1: 4, x2: 19.8, y2: 4, color: PINK, dashed: true },
      { x1: 2.4, y1: 3, x2: 19.8, y2: 3, color: PINK, dashed: true },
    ],
    texts: [
      // at x = 12 the curve sits at 4.43: between the lines y = 4 and y = 5, clear of all three labels
      { x: 12, y: 5.35, text: 'y = 5', color: PINK, anchor: 'middle', bold: true },
      { x: 12, y: 3.55, text: 'y = 4', color: PINK, anchor: 'middle', bold: true },
      { x: 12, y: 2.55, text: 'y = 3', color: PINK, anchor: 'middle', bold: true },
    ],
    xTicks: [tick(3), tick(6), tick(18)],
    points: [
      { x: 3, y: 5, color: PINK },
      { x: 18, y: 5, color: PINK },
      { x: 6, y: 4, color: PINK },
    ],
  },
  caption:
    'הגרף של $f$ ושלושה ישרים אופקיים. הישר $y = 5$ פוגש את הגרף פעמיים, כאשר $x = 3$ וגם כאשר $x = 18$. הישר $y = 4$ נוגע בגרף רק במינימום, והישר $y = 3$ אינו פוגש אותו כלל.',
  checks: [
    on('f', f, 3, 5), on('f', f, 18, 5), on('f', f, 6, 4),
    ['y = 3 misses: the graph stays at 4 and above', minOn(2.2, 41) > 3 ? 1 : 0, 1],
  ],
});

{
  const R = region(3, 6, f);
  specs.push({
    id: 'lsnArea',
    fig: {
      xRange: [-0.8, 8.5], yRange: [-0.8, 9.5], halo: true,
      curves: [{ f, from: 2.2, to: 8.5 }], shade: [R],
      vAsym: [{ x: 2 }],
      xTicks: [tick(3), tick(6)], yTicks: [ytick(4), ytick(5)],
      texts: [t(4.5, 2.1, 'S = 38/3')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f$, ציר $x$ והישרים $x = 3$ וגם $x = 6$. כולו מעל ציר $x$, ולכן השטח שווה לאינטגרל עצמו.',
    checks: [
      ['area 38/3', areaOf(R), 38 / 3, 1e-7],
      ['above the axis on [3, 6]', minOn(3, 6) > 0 ? 1 : 0, 1],
    ],
  });
}

void emitFigureModule({
  specs,
  outFile: 'content/lessons/math5/rq-extra/bagrut-mixed-lesson-figures.ts',
  exportName: 'BG8_LESSON_FIG',
  generator: 'scripts/_gen-rq-bg8-lesson-figures.ts',
  about: 'The worked summary question of רמה 8, f(x) = (x+2)/√(x−2): sketch, the lines y = k, and the hatched area.',
});
