// ============================================================
// רמה 7 · rq-integral — every figure of the stage, generated
// ============================================================
//
// Itay, 2026-09-13, on אתגר question 6: "בתשובה יש שרטוט אבל אין את הקווים
// שתוחמים את האינטגרל ואני רוצה שיהיה צבע ירוק שמסמן את השטח… צריך להוסיף את
// זה לכל חישוב שטחים של אינטגרלים". So every area this stage computes is drawn
// the same way: green fill + green hatching + dashed green lines at the limits.
//
// One spec per figure: the functions, the window, the hatched regions, the
// labels, the Hebrew caption (which names only what is drawn) and CHECKS — every
// marked point must lie on its curve, and every hatched region must integrate
// to the number the solution states. The label audit (frame + overlap) runs on
// the emitted SVG. Output: content/lessons/math5/rq-extra/integral-figures.ts.
//
// Run: npx tsx scripts/_gen-rq-integral-figures.ts [--sheet <dir>]
import { writeFileSync } from 'node:fs';
import { renderPlot, PALETTE, type Fig, type Shade } from '../lib/plot-svg';

const { INDIGO, PINK, EMERALD_DEEP } = PALETTE;
const GREEN = EMERALD_DEEP;

type Check = [label: string, got: number, want: number, tol?: number];
type Spec = { id: string; fig: Fig; caption: string; checks: Check[] };

// ---------------------------------------------------------------- helpers
const zero = () => 0;
/** Simpson on |upper − lower| — the AREA a hatched region covers. */
function areaOf(s: Shade, n = 20000): number {
  const lo = s.lower ?? zero;
  const g = (x: number) => Math.abs(s.upper(x) - lo(x));
  const h = (s.to - s.from) / n;
  let acc = g(s.from) + g(s.to);
  for (let i = 1; i < n; i++) acc += (i % 2 ? 4 : 2) * g(s.from + i * h);
  return (acc * h) / 3;
}
/** A hatched region, in the stage's one style. */
const region = (from: number, to: number, upper: (x: number) => number, lower?: (x: number) => number): Shade => ({
  from, to, upper, lower, opacity: 0.12, hatch: true, bounds: true,
});
const on = (label: string, f: (x: number) => number, x: number, y: number): Check => [`${label}: (${x}, ${y}) on the curve`, f(x), y];
const t = (x: number, y: number, text: string, bold = true) => ({ x, y, text, color: GREEN, bold });
const tick = (x: number, label = String(x)) => ({ x, label });
const ytick = (y: number, label = String(y)) => ({ y, label });

// ---------------------------------------------------------------- functions
const lin21 = (x: number) => 2 * x + 1;
const sqrt1 = (x: number) => Math.sqrt(x) + 1;
const dome4 = (x: number) => 4 - x * x;
const bowl4 = (x: number) => x * x - 4;
const sq = (x: number) => x * x;
const xp2 = (x: number) => x + 2;
const l23 = (x: number) => 2 * x + 3;

const f002 = (x: number) => x * Math.sqrt(x);
const f005 = (x: number) => (4 - x) * Math.sqrt(x);
const f008 = (x: number) => 3 - 12 / (x * x);
const f102 = (x: number) => x * x + 2 / x + 1;
const f104 = (x: number) => 1 - 2 / Math.sqrt(x);
const f106 = (x: number) => -4 / (x * x);
const f108 = (x: number) => Math.sqrt(2 * x + 1);
const f109 = (x: number) => x - 3 * Math.sqrt(x);
const f110 = (x: number) => 2 / (x * x);
const f111 = (x: number) => 16 / (x * x);
const tan111 = (x: number) => -4 * x + 12;
const f112 = (x: number) => 3 * Math.sqrt(x);
const id = (x: number) => x;
const f201 = (x: number) => 4 - Math.sqrt(x);
const f202 = (x: number) => 8 / (x * x);
const f204 = (x: number) => 6 / (x * x);
const f205 = (x: number) => (x * x + 2) / (x * x);
const f206 = (x: number) => 4 / (x * x);
const f207 = (x: number) => 12 * Math.sqrt(x) - 2;
const f301 = (x: number) => Math.sqrt(4 * x - 8);
const f302 = (x: number) => (x - 4) / Math.sqrt(x);
const f303 = (x: number) => 9 / (x * x);
const g303 = (x: number) => 10 - x * x;
const f304 = (x: number) => 6 / Math.sqrt(x);
const g305 = (x: number) => 3 * x * x - x ** 3;
const bag = (x: number) => (8 * x) / (x * x + 3) ** 2;
const r3 = Math.sqrt(3);

// ---------------------------------------------------------------- specs
const SPECS: Spec[] = [];
const add = (s: Spec) => SPECS.push(s);

// ======== lesson: why a definite integral
{
  const R = region(1, 4, sqrt1);
  add({
    id: 'whyCurve',
    fig: {
      xRange: [-0.6, 5.4], yRange: [-0.7, 3.9], curves: [{ f: sqrt1, from: 0 }], shade: [R], halo: true,
      xTicks: [tick(1, 'a'), tick(4, 'b')],
      texts: [t(2.5, 1.1, 'S'), { x: 4.75, y: 3.55, text: 'y = f(x)', color: INDIGO, bold: true }],
    },
    caption:
      'האזור הירוק המקווקו הוא השטח שמתחת לגרף של $f$ ומעל ציר $x$. משמאל הוא נסגר בישר $x = a$ ומימין בישר $x = b$, שהם הקווים המקווקווים. את השטח הזה מחשב האינטגרל $\\int_a^b f(x)\\,dx$.',
    checks: [['the region is above the axis at both ends', Math.min(sqrt1(1), sqrt1(4)), 2]],
  });
}
{
  const R = region(1, 3, lin21);
  add({
    id: 'trapezoid',
    fig: {
      xRange: [-0.7, 3.9], yRange: [-0.9, 8.3], curves: [{ f: lin21 }], shade: [R], halo: true,
      xTicks: [tick(1), tick(3)],
      points: [{ x: 1, y: 3, label: '(1, 3)', color: INDIGO, dx: -38, dy: -6 }, { x: 3, y: 7, label: '(3, 7)', color: INDIGO, dx: 8, dy: 12 }],
      texts: [t(2, 2.1, 'S = 10')],
    },
    caption:
      'הגרף של $f(x) = 2x + 1$. האזור המקווקו שמתחתיו, בין הישר $x = 1$ לבין הישר $x = 3$, הוא טרפז: הבסיסים שלו הם הגבהים $3$ וגם $7$, והגובה שלו הוא $2$. שטח הטרפז הוא $10$, ובדיוק זה מה שהאינטגרל $\\int_1^3 (2x+1)\\,dx$ נותן.',
    checks: [
      on('trapezoid', lin21, 1, 3), on('trapezoid', lin21, 3, 7),
      ['trapezoid area by integral', areaOf(R), (3 + 7) * 2 / 2, 1e-7],
    ],
  });
}

// ======== lesson step: חישוב שטח — כל הפרוצדורה
{
  const R = region(-2, 2, dome4);
  add({
    id: 'areaUnder',
    fig: {
      xRange: [-3, 3], yRange: [-1.5, 5], curves: [{ f: dome4 }], shade: [R], halo: true,
      points: [{ x: -2, y: 0, label: '(-2, 0)', color: INDIGO, dx: -46, dy: -8 }, { x: 2, y: 0, label: '(2, 0)', color: INDIGO, dx: 7, dy: 16 }],
      texts: [t(0, 1.4, 'S = 32/3')],
    },
    caption:
      'השטח שבין $f(x) = 4-x^2$ לבין ציר $x$. הגבולות הם נקודות החיתוך של הגרף עם ציר $x$, וכל האזור נמצא מעל הציר, ולכן אין מה לפצל.',
    checks: [on('dome', dome4, -2, 0), on('dome', dome4, 2, 0), ['area 32/3', areaOf(R), 32 / 3, 1e-7]],
  });
}
{
  const A = region(0, 2, zero, bowl4);
  const B = region(2, 3, bowl4);
  add({
    id: 'areaSplit',
    fig: {
      xRange: [-0.8, 3.6], yRange: [-5, 6], curves: [{ f: bowl4 }], shade: [A, B], halo: true,
      xTicks: [tick(2), tick(3)],
      points: [{ x: 2, y: 0, label: '(2, 0)', color: INDIGO, dx: -44, dy: -8 }],
      texts: [t(1.05, -1.7, '16/3'), t(2.72, 1.25, '7/3')],
    },
    caption:
      'הגרף של $f(x) = x^2 - 4$ בין הישר $x = 0$ לבין הישר $x = 3$. הוא חוצה את ציר $x$ בנקודה $(2,\\; 0)$, ולכן האזור מתחלק לשניים: החלק שמתחת לציר תורם $\\dfrac{16}{3}$, והחלק שמעליו תורם $\\dfrac{7}{3}$.',
    checks: [
      on('bowl', bowl4, 2, 0),
      ['below part 16/3', areaOf(A), 16 / 3, 1e-7], ['above part 7/3', areaOf(B), 7 / 3, 1e-7],
      ['it really is below on the first piece', Math.sign(bowl4(1)), -1],
    ],
  });
}

// ======== lesson step: שטח בין שני גרפים
{
  const R = region(-1, 2, xp2, sq);
  add({
    id: 'betweenTeach',
    fig: {
      xRange: [-2.2, 3.2], yRange: [-1, 6.4], curves: [{ f: sq }, { f: xp2, color: PINK }], shade: [R], halo: true,
      xTicks: [tick(-1), tick(2)],
      points: [{ x: -1, y: 1, label: '(-1, 1)', color: INDIGO, dx: -44, dy: 4 }, { x: 2, y: 4, label: '(2, 4)', color: INDIGO, dx: 8, dy: 12 }],
      texts: [t(0.45, 1.3, 'S = 9/2'), { x: -1.9, y: 4.6, text: 'y = x²', color: INDIGO, bold: true, anchor: 'start' as const }, { x: 3.1, y: 2.2, text: 'y = x + 2', color: PINK, bold: true, anchor: 'end' as const }],
    },
    caption:
      'בכחול $y = x^2$ ובוורוד $y = x + 2$. האזור המקווקו כלוא ביניהם, מנקודת המפגש $(-1,\\; 1)$ עד נקודת המפגש $(2,\\; 4)$. הישר נמצא למעלה לכל אורך התחום, ולכן מחסרים: הישר פחות הפרבולה.',
    checks: [
      on('line', xp2, -1, 1), on('parabola', sq, -1, 1), on('line', xp2, 2, 4), on('parabola', sq, 2, 4),
      ['area 9/2', areaOf(R), 9 / 2, 1e-7], ['line above at 0', xp2(0) - sq(0), 2],
    ],
  });
}

// ======== rq-sub-in-006 + ghost replay gr-rq-in-006
const PTS006 = [
  { x: -1, y: 1, label: '(-1, 1)', color: INDIGO, dx: -46, dy: 4 },
  { x: 3, y: 9, label: '(3, 9)', color: INDIGO, dx: -46, dy: 2 },
];
const LABELS006 = [
  { x: -2.1, y: 6.2, text: 'y = x²', color: INDIGO, bold: true, anchor: 'start' as const },
  { x: 3.95, y: 5.6, text: 'y = 2x + 3', color: PINK, bold: true, anchor: 'end' as const },
];
const BASE006: Omit<Fig, 'shade'> = {
  xRange: [-2.2, 4], yRange: [-1.5, 10.8], curves: [{ f: sq }, { f: l23, color: PINK }], halo: true,
  xTicks: [tick(-1), tick(3)],
};
{
  const R = region(-1, 3, l23, sq);
  add({
    id: 'q006',
    fig: { ...BASE006, shade: [R], points: PTS006, texts: [t(1, 3.4, 'S = 32/3'), ...LABELS006] },
    caption:
      'בכחול $y = x^2$ ובוורוד $y = 2x + 3$. האזור המקווקו כלוא ביניהם, מנקודת המפגש $(-1,\\; 1)$ עד נקודת המפגש $(3,\\; 9)$, והישר הוא העליון לכל אורך התחום.',
    checks: [on('line', l23, -1, 1), on('parabola', sq, 3, 9), on('line', l23, 3, 9), ['area 32/3', areaOf(R), 32 / 3, 1e-7]],
  });
  add({
    id: 'ghost006Meet',
    fig: { ...BASE006, points: PTS006, texts: LABELS006 },
    caption:
      'שני הגרפים נפגשים בשתי נקודות בלבד, $(-1,\\; 1)$ וגם $(3,\\; 9)$. שם האזור שביניהם נפתח ושם הוא נסגר, ולכן אלה הגבולות.',
    checks: [on('meet', sq, -1, 1), on('meet', l23, -1, 1), on('meet', sq, 3, 9), on('meet', l23, 3, 9)],
  });
  add({
    id: 'ghost006Top',
    fig: {
      ...BASE006, texts: LABELS006,
      points: [
        { x: 0, y: 0, label: '(0, 0)', color: INDIGO, dx: 8, dy: 14 },
        { x: 0, y: 3, label: '(0, 3)', color: PINK, dx: -44, dy: -6 },
      ],
    },
    caption:
      'ההצבה $x = 0$ על הסרטוט: על הפרבולה מתקבלת הנקודה $(0,\\; 0)$, ועל הישר הנקודה $(0,\\; 3)$. הנקודה של הישר גבוהה יותר, ולכן הישר הוא העליון בכל התחום.',
    checks: [on('parabola', sq, 0, 0), on('line', l23, 0, 3)],
  });
  add({
    id: 'ghost006Check',
    fig: {
      ...BASE006, shade: [R],
      guides: [{ x1: 1, y1: 1, x2: 1, y2: 5, color: '#0F172A', dashed: true }],
      points: [{ x: 1, y: 1, color: INDIGO }, { x: 1, y: 5, color: PINK }],
      texts: [{ x: 1.2, y: 2.75, text: '4', color: '#0F172A', bold: true, anchor: 'start' as const }, ...LABELS006],
    },
    caption:
      'בדיקת הסבירות: רוחב האזור הוא $4$ יחידות, מהערך $-1$ עד הערך $3$, והפער האנכי הגדול ביותר בין הגרפים הוא $4$, בערך $x = 1$ (הקו השחור המקווקו). מלבן ברוחב $4$ ובגובה $4$ היה מכסה $16$, והאזור המקווקו קטן ממנו.',
    checks: [on('gap bottom', sq, 1, 1), on('gap top', l23, 1, 5), ['max gap at x=1', Math.max(...[-1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3].map((x) => l23(x) - sq(x))), 4], ['area below the rectangle', areaOf(R) < 16 ? 1 : 0, 1]],
  });
}

// ======== practice questions
{
  const R = region(1, 4, f002);
  add({
    id: 'q002',
    fig: {
      xRange: [-0.6, 4.7], yRange: [-1, 9.3], curves: [{ f: f002, from: 0 }], shade: [R], halo: true,
      xTicks: [tick(1), tick(4)], yTicks: [ytick(8)],
      points: [{ x: 1, y: 1, label: '(1, 1)', color: INDIGO, dx: -40, dy: -4 }, { x: 4, y: 8, label: '(4, 8)', color: INDIGO, dx: -44, dy: -2 }],
      texts: [t(2.9, 1.6, 'S = 62/5')],
    },
    caption:
      'הגרף של $y = x\\sqrt{x}$. האזור המקווקו נמצא בין הגרף לבין ציר $x$, מהישר $x = 1$ עד הישר $x = 4$, וכולו מעל הציר, ולכן האינטגרל המסוים שווה כאן לשטח שלו.',
    checks: [on('x√x', f002, 1, 1), on('x√x', f002, 4, 8), ['area 62/5', areaOf(R), 62 / 5, 1e-7]],
  });
}
{
  const R = region(0, 4, f005);
  add({
    id: 'q005',
    fig: {
      xRange: [-0.7, 5.3], yRange: [-2.4, 4.1], curves: [{ f: f005, from: 0 }], shade: [R], halo: true,
      yTicks: [ytick(3)],
      points: [{ x: 0, y: 0, color: INDIGO }, { x: 4, y: 0, label: '(4, 0)', color: INDIGO, dx: 6, dy: 14 }],
      texts: [t(2, 1.05, 'S = 128/15')],
    },
    caption:
      'הגרף של $f(x) = (4 - x)\\sqrt{x}$ יוצא מהראשית, עולה, ויורד חזרה אל ציר $x$ בנקודה $(4,\\; 0)$. האזור המקווקו כלוא בין הגרף לבין הציר, וכולו מעל הציר. מימין לערך $4$ הגרף יורד מתחת לציר ואינו חוזר, ולכן שם לא נסגר אזור.',
    checks: [on('f005', f005, 4, 0), ['area 128/15', areaOf(R), 128 / 15, 1e-5], ['below the axis right of 4', Math.sign(f005(5)), -1]],
  });
}
{
  const A = region(1, 2, zero, f008);
  const B = region(2, 4, f008);
  add({
    id: 'q008',
    fig: {
      xRange: [-1.3, 4.7], yRange: [-10.2, 4.2], curves: [{ f: f008 }], shade: [A, B], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [{ x: 1, label: '1', above: true }, tick(2), tick(4)], yTicks: [ytick(-9)],
      points: [{ x: 1, y: -9, color: INDIGO }, { x: 2, y: 0, color: INDIGO }],
      texts: [t(1.3, -1.6, '3'), t(3.3, 0.75, '3')],
    },
    caption:
      'הגרף של $f(x) = 3 - \\dfrac{12}{x^2}$ בין הישר $x = 1$ לבין הישר $x = 4$. הוא חוצה את ציר $x$ בערך $2$: משמאל האזור מתחת לציר, ומימין הוא מעליו. לשני החלקים אותו שטח, $3$, ולכן אינטגרל אחד בלי פיצול מתאפס, והשטח האמיתי הוא $6$.',
    checks: [
      on('f008', f008, 1, -9), on('f008', f008, 2, 0),
      ['below part 3', areaOf(A), 3, 1e-7], ['above part 3', areaOf(B), 3, 1e-7],
      ['signed integral 0', areaOf({ from: 2, to: 4, upper: f008 }) - areaOf({ from: 1, to: 2, upper: f008 }), 0, 1e-7],
    ],
  });
}
{
  add({
    id: 'q102',
    fig: {
      xRange: [-2.7, 3.1], yRange: [-3.2, 10.5], curves: [{ f: f102 }], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(1), tick(2)],
      points: [
        { x: -1, y: 0, label: '(-1, 0)', color: INDIGO, dx: -46, dy: 14 },
        { x: 1, y: 4, label: '(1, 4)', color: INDIGO, dx: 6, dy: 15 },
        { x: 2, y: 6, label: '(2, 6)', color: INDIGO, dx: -42, dy: -6 },
      ],
    },
    caption:
      'הגרף של $f(x) = x^2 + \\dfrac{2}{x} + 1$. מסומנים: האסימפטוטה האנכית $x = 0$; החיתוך עם ציר $x$ בנקודה $(-1,\\; 0)$; הנקודה הנתונה $(1,\\; 4)$, שהיא גם נקודת מינימום; הנקודה המבוקשת $(2,\\; 6)$.',
    checks: [on('f102', f102, -1, 0), on('f102', f102, 1, 4), on('f102', f102, 2, 6), ["f'(1) = 0 → minimum", 2 * 1 - 2 / 1, 0]],
  });
}
{
  const R = region(1, 4, zero, f104);
  add({
    id: 'q104',
    fig: {
      xRange: [-0.5, 5.4], yRange: [-3.3, 1.1], curves: [{ f: f104, from: 0.12 }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [{ x: 1, label: '1', above: true }, tick(4)], yTicks: [ytick(-1)],
      points: [{ x: 1, y: -1, color: INDIGO }, { x: 4, y: 0, label: '(4, 0)', color: INDIGO, dx: 6, dy: -8 }],
    },
    caption:
      'הגרף של $y = 1 - \\dfrac{2}{\\sqrt{x}}$. בין הישר $x = 1$ לבין הישר $x = 4$ הגרף כולו מתחת לציר $x$, ורק בקצה, בנקודה $(4,\\; 0)$, הוא נוגע בו. לכן האינטגרל המסוים על האזור המקווקו יוצא שלילי.',
    checks: [on('f104', f104, 1, -1), on('f104', f104, 4, 0), ['|integral| 1', areaOf(R), 1, 1e-7]],
  });
}
{
  const R = region(1, 2, zero, f106);
  add({
    id: 'q106',
    fig: {
      xRange: [-0.7, 3.3], yRange: [-5.6, 1.1], curves: [{ f: f106 }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [{ x: 1, label: '1', above: true }, { x: 2, label: '2', above: true }], yTicks: [ytick(-4), ytick(-1)],
      points: [{ x: 1, y: -4, color: INDIGO }, { x: 2, y: -1, color: INDIGO }],
      texts: [t(1.5, -0.8, 'S = 2')],
    },
    caption:
      'הגרף של $f(x) = -\\dfrac{4}{x^2}$ נמצא כולו מתחת לציר $x$. האזור המקווקו כלוא בינו לבין הציר, מהישר $x = 1$ עד הישר $x = 2$, ולכן האינטגרל שלילי והשטח הוא הערך המוחלט שלו.',
    checks: [on('f106', f106, 1, -4), on('f106', f106, 2, -1), ['area 2', areaOf(R), 2, 1e-7]],
  });
}
{
  const R = region(0, 4, f108);
  add({
    id: 'q108',
    fig: {
      xRange: [-1, 4.9], yRange: [-0.7, 3.7], curves: [{ f: f108, from: -0.5 }], shade: [R], halo: true,
      xTicks: [tick(4)], yTicks: [ytick(1), ytick(3)],
      points: [{ x: 4, y: 3, label: '(4, 3)', color: INDIGO, dx: -44, dy: -6 }],
      texts: [t(2, 1, 'S = 26/3')],
    },
    caption:
      'הגרף של $y = \\sqrt{2x + 1}$. האזור המקווקו נמצא בינו לבין ציר $x$, מציר $y$ עד הישר $x = 4$, וכולו מעל הציר. בציר $y$ הגובה הוא $1$ ולא אפס, ולכן גם הגבול התחתון תורם להצבה.',
    checks: [on('f108', f108, 0, 1), on('f108', f108, 4, 3), ['area 26/3', areaOf(R), 26 / 3, 1e-7]],
  });
}
{
  const A = region(4, 9, zero, f109);
  const B = region(9, 16, f109);
  add({
    id: 'q109',
    fig: {
      xRange: [-1, 17.3], yRange: [-3.1, 5.2], curves: [{ f: f109, from: 0 }], shade: [A, B], halo: true,
      xTicks: [{ x: 4, label: '4', above: true }, tick(9), tick(16)], yTicks: [ytick(4)],
      points: [{ x: 9, y: 0, color: INDIGO }, { x: 16, y: 4, color: INDIGO }, { x: 4, y: -2, color: INDIGO }],
      texts: [t(6.6, -0.75, '11/2'), t(13.4, 1.25, '27/2')],
    },
    caption:
      'הגרף של $f(x) = x - 3\\sqrt{x}$ בין הישר $x = 4$ לבין הישר $x = 16$. הוא חוצה את ציר $x$ בערך $9$: משמאל האזור מתחת לציר ותורם $\\dfrac{11}{2}$, ומימין הוא מעל הציר ותורם $\\dfrac{27}{2}$.',
    checks: [on('f109', f109, 9, 0), on('f109', f109, 16, 4), on('f109', f109, 4, -2), ['below 11/2', areaOf(A), 11 / 2, 1e-7], ['above 27/2', areaOf(B), 27 / 2, 1e-7]],
  });
}
{
  const R = region(1, 4, f110);
  add({
    id: 'q110',
    fig: {
      xRange: [-0.6, 4.9], yRange: [-0.5, 3.1], curves: [{ f: f110 }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(1), tick(4)], yTicks: [ytick(2)],
      points: [{ x: 1, y: 2, color: INDIGO }],
      texts: [t(1.75, 0.3, 'S = 3/2')],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{2}{x^2}$ עבור $a = 4$. האזור המקווקו כלוא בין הגרף לבין ציר $x$, מהישר $x = 1$ עד הישר $x = 4$, והשטח שלו הוא $\\dfrac{3}{2}$, כנתון.',
    checks: [on('f110', f110, 1, 2), ['area 3/2', areaOf(R), 3 / 2, 1e-7]],
  });
}
{
  const R = region(2, 4, f111, (x) => Math.max(0, tan111(x)));
  add({
    id: 'q111',
    fig: {
      xRange: [-0.6, 4.9], yRange: [-0.9, 9.4], curves: [{ f: f111 }, { f: tan111, from: 0.6, to: 3.35, color: PINK }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(2), tick(3), tick(4)], yTicks: [ytick(4)],
      points: [{ x: 2, y: 4, label: '(2, 4)', color: INDIGO, dx: 8, dy: -6 }, { x: 3, y: 0, color: PINK }],
      texts: [t(3.35, 0.45, 'S = 2')],
    },
    caption:
      'בכחול הגרף של $f(x) = \\dfrac{16}{x^2}$, ובוורוד המשיק בנקודה $(2,\\; 4)$, שחותך את ציר $x$ בערך $3$. האזור המקווקו חסום מלמעלה בגרף, משמאל למטה במשיק, מלמטה בציר $x$ ומימין בישר $x = 4$.',
    checks: [
      on('f111', f111, 2, 4), on('tangent', tan111, 2, 4), on('tangent', tan111, 3, 0),
      ['area 2', areaOf(R), 2, 1e-7],
      ['tangent below the curve', Math.min(...[2.3, 2.7, 3].map((x) => f111(x) - tan111(x))) > 0 ? 1 : 0, 1],
    ],
  });
}
{
  const R = region(0, 9, f112, id);
  add({
    id: 'q112',
    fig: {
      xRange: [-0.9, 10.3], yRange: [-1, 11], curves: [{ f: f112, from: 0 }, { f: id, color: PINK }], shade: [R], halo: true,
      xTicks: [tick(9)], yTicks: [ytick(9)],
      points: [{ x: 9, y: 9, label: '(9, 9)', color: INDIGO, dx: -46, dy: -6 }],
      texts: [t(3.4, 4.3, 'S = 27/2'), { x: 1.2, y: 6.4, text: 'y = 3√x', color: INDIGO, bold: true }, { x: 8.7, y: 5.6, text: 'y = x', color: PINK, bold: true }],
    },
    caption:
      'בכחול $y = 3\\sqrt{x}$ ובוורוד $y = x$. הם נפגשים בראשית ובנקודה $(9,\\; 9)$, והאזור המקווקו כלוא ביניהם. בכל התחום השורש הוא העליון, ולכן מאנטגרלים שורש פחות ישר.',
    checks: [on('root', f112, 9, 9), ['area 27/2', areaOf(R), 27 / 2, 1e-5]],
  });
}
{
  const R = region(0, 16, f201);
  add({
    id: 'q201',
    fig: {
      xRange: [-1.3, 17.6], yRange: [-1.1, 4.9], curves: [{ f: f201, from: 0 }], shade: [R], halo: true,
      xTicks: [tick(16)], yTicks: [ytick(4)],
      points: [{ x: 0, y: 4, color: INDIGO }, { x: 16, y: 0, color: INDIGO }],
      texts: [t(4.4, 1.2, 'S = 64/3')],
    },
    caption:
      'הגרף יורד מהנקודה $(0,\\; 4)$ עד לחיתוך עם ציר $x$ בנקודה $(16,\\; 0)$. האזור המקווקו כלוא בין הגרף לבין שני הצירים.',
    checks: [on('f201', f201, 0, 4), on('f201', f201, 16, 0), ['area 64/3', areaOf(R), 64 / 3, 1e-5]],
  });
}
{
  const R = region(1, 2, f202);
  add({
    id: 'q202',
    fig: {
      xRange: [-0.5, 3.3], yRange: [-0.9, 9.6], curves: [{ f: f202 }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      guides: [{ x1: 0, y1: 8, x2: 3.2, y2: 8, color: PINK, dashed: true }, { x1: 0, y1: 2, x2: 3.2, y2: 2, color: PINK, dashed: true }],
      xTicks: [tick(1), tick(2)], yTicks: [ytick(2), ytick(8)],
      points: [{ x: 1, y: 8, label: '(1, 8)', color: INDIGO, dx: 8, dy: -6 }, { x: 2, y: 2, label: '(2, 2)', color: INDIGO, dx: 8, dy: -7 }],
      texts: [t(1.45, 0.9, 'S = 4')],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{8}{x^2}$, ובוורוד מקווקו הישרים $y = 8$ וגם $y = 2$. הם פוגשים את הגרף בנקודות $(1,\\; 8)$ וגם $(2,\\; 2)$, ומהן יורדים האנכים לציר $x$, שהם הגבולות של האזור המקווקו.',
    checks: [on('f202', f202, 1, 8), on('f202', f202, 2, 2), ['area 4', areaOf(R), 4, 1e-7]],
  });
}
{
  const R = region(0.8, 2.4, f204);
  add({
    id: 'q204',
    fig: {
      xRange: [-0.5, 3.4], yRange: [-0.9, 10.6], curves: [{ f: f204 }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(0.8, '4/5'), tick(2.4, '12/5')],
      texts: [t(1.45, 1.05, 'S = 5')],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{6}{x^2}$ עבור $a = \\dfrac{4}{5}$. האזור המקווקו כלוא בין הגרף לבין ציר $x$, מהישר $x = \\dfrac{4}{5}$ עד הישר $x = \\dfrac{12}{5}$, והשטח שלו הוא $5$, כנתון.',
    checks: [['area 5', areaOf(R), 5, 1e-7], ['upper limit is 3a', 3 * 0.8, 2.4, 1e-12]],
  });
}
{
  const R = region(1, 2, f205, () => 1);
  add({
    id: 'q205',
    fig: {
      xRange: [-1.1, 4.7], yRange: [-0.5, 4.6], curves: [{ f: f205 }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }], hAsym: [{ y: 1, label: 'y = 1' }],
      xTicks: [tick(1), tick(2)], yTicks: [ytick(3)],
      points: [{ x: 1, y: 3, label: '(1, 3)', color: INDIGO, dx: 8, dy: -4 }, { x: 2, y: 1.5, label: '(2, 1.5)', color: INDIGO, dx: 8, dy: -8 }],
      texts: [t(1.42, 1.3, 'S = 1')],
    },
    caption:
      'הגרף יורד אל האסימפטוטה האופקית $y = 1$ ואינו חוצה אותה. האזור המקווקו כלוא בין הגרף לבין האסימפטוטה, והקווים הירוקים המקווקווים הם הישרים $x = 1$ וגם $x = 2$ שתוחמים אותו.',
    checks: [on('f205', f205, 1, 3), on('f205', f205, 2, 1.5), ['area 1', areaOf(R), 1, 1e-7], ['never below y=1', Math.min(...[1, 2, 5, 50].map(f205)) > 1 ? 1 : 0, 1]],
  });
}
{
  const S1 = region(1, 2, f206);
  const S2 = region(2, 4, f206);
  const S3 = region(4, 8, f206);
  add({
    id: 'q206',
    fig: {
      xRange: [-0.6, 8.8], yRange: [-0.7, 4.6], curves: [{ f: f206 }], shade: [S1, S2, S3], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(1), tick(2), tick(4), tick(8)], yTicks: [ytick(4)],
      points: [{ x: 1, y: 4, color: INDIGO }],
      texts: [t(1.5, 0.75, '2'), t(3, 0.16, '1'), t(6, 0.42, '0.5')],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{4}{x^2}$ ושלוש רצועות מקווקוות מתחתיו, והמספר ליד כל רצועה הוא השטח שלה. הרצועה שבין $1$ לבין $2$ היא $S_1$, זו שבין $2$ לבין $4$ היא $S_2$, והרצועה שבין $4$ לבין $t = 8$ שייכת לסעיף ג. הרצועה הקצרה, הקרובה לאסימפטוטה, גבוהה בהרבה, ולכן השטח שלה גדול יותר.',
    checks: [['S1 2', areaOf(S1), 2, 1e-7], ['S2 1', areaOf(S2), 1, 1e-7], ['part ג 0.5', areaOf(S3), 0.5, 1e-7]],
  });
}
{
  const R = region(1, 4, f207);
  add({
    id: 'q207',
    fig: {
      xRange: [-0.6, 4.9], yRange: [-3.2, 24.5], curves: [{ f: f207, from: 0 }], shade: [R], halo: true,
      xTicks: [tick(1), tick(4)], yTicks: [ytick(10), ytick(22)],
      points: [{ x: 1, y: 10, color: INDIGO }, { x: 4, y: 22, color: INDIGO }],
      texts: [t(2.5, 6, 'S = 50')],
    },
    caption:
      'הגרף של $f(x) = 12\\sqrt{x} - 2$. בין הישר $x = 1$ לבין הישר $x = 4$ הוא כולו מעל ציר $x$, ולכן האינטגרל על האזור המקווקו הוא השטח עצמו, $50$, כנתון.',
    checks: [on('f207', f207, 1, 10), on('f207', f207, 4, 22), ['area 50', areaOf(R), 50, 1e-7]],
  });
}
{
  const R = region(2, 6, f301);
  add({
    id: 'q301',
    fig: {
      xRange: [-0.5, 7.1], yRange: [-0.9, 5.1], curves: [{ f: f301, from: 2 }], shade: [R], halo: true,
      xTicks: [tick(2), tick(6)], yTicks: [ytick(4)],
      points: [{ x: 2, y: 0, color: INDIGO }, { x: 6, y: 4, label: '(6, 4)', color: INDIGO, dx: -44, dy: -6 }],
      texts: [t(4.6, 1.15, 'S = 32/3')],
    },
    caption:
      'הגרף של $f(x) = \\sqrt{4x - 8}$ מתחיל בקצה התחום, בנקודה $(2,\\; 0)$ שעל ציר $x$. האזור המקווקו כלוא בין הגרף, ציר $x$ והישר $x = 6$.',
    checks: [on('f301', f301, 2, 0), on('f301', f301, 6, 4), ['area 32/3', areaOf(R), 32 / 3, 1e-5]],
  });
}
{
  const A = region(1, 4, zero, f302);
  const B = region(4, 9, f302);
  add({
    id: 'q302',
    fig: {
      xRange: [-0.7, 10.1], yRange: [-4.1, 2.7], curves: [{ f: f302 }], shade: [A, B], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [{ x: 1, label: '1', above: true }, tick(4), tick(9)], yTicks: [ytick(-3)],
      points: [{ x: 4, y: 0, color: INDIGO }, { x: 1, y: -3, color: INDIGO }],
      texts: [t(2.6, -0.8, '10/3'), t(7.3, 0.55, '14/3')],
    },
    caption:
      'הגרף של $f(x) = \\dfrac{x - 4}{\\sqrt{x}}$ בין הישר $x = 1$ לבין הישר $x = 9$. הוא חוצה את ציר $x$ בערך $4$: משמאל האזור מתחת לציר ותורם $\\dfrac{10}{3}$, ומימין הוא מעל הציר ותורם $\\dfrac{14}{3}$.',
    checks: [on('f302', f302, 4, 0), on('f302', f302, 1, -3), ['below 10/3', areaOf(A), 10 / 3, 1e-7], ['above 14/3', areaOf(B), 14 / 3, 1e-7]],
  });
}
{
  const R = region(1, 3, g303, f303);
  add({
    id: 'q303',
    fig: {
      xRange: [-0.5, 3.7], yRange: [-0.9, 11.2], curves: [{ f: f303 }, { f: g303, color: PINK }], shade: [R], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(1), tick(3)],
      points: [{ x: 1, y: 9, label: '(1, 9)', color: INDIGO, dx: 8, dy: -4 }, { x: 3, y: 1, label: '(3, 1)', color: INDIGO, dx: 8, dy: -6 }],
      texts: [t(2, 4, 'S = 16/3')],
    },
    caption:
      'בכחול $f(x) = \\dfrac{9}{x^2}$ ובוורוד $g(x) = 10 - x^2$. הם נפגשים בנקודות $(1,\\; 9)$ וגם $(3,\\; 1)$, ובין שתיהן הפרבולה היא העליונה. האזור המקווקו הוא השטח המבוקש.',
    checks: [on('f303', f303, 1, 9), on('g303', g303, 3, 1), on('f303', f303, 3, 1), ['area 16/3', areaOf(R), 16 / 3, 1e-7]],
  });
}
{
  const A = region(1, 9, f304);
  add({
    id: 'q304a',
    fig: {
      xRange: [-0.7, 10.1], yRange: [-0.8, 7.2], curves: [{ f: f304 }], shade: [A], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      xTicks: [tick(1), tick(9)], yTicks: [ytick(6), ytick(2)],
      points: [{ x: 1, y: 6, color: INDIGO }, { x: 9, y: 2, color: INDIGO }],
      texts: [t(3.6, 1.1, 'S = 24')],
    },
    caption:
      'סעיף א: הגרף של $f(x) = \\dfrac{6}{\\sqrt{x}}$, כלומר עבור $a = 6$. האזור המקווקו כלוא בין הגרף לבין ציר $x$, מהישר $x = 1$ עד הישר $x = 9$, והשטח שלו הוא $24$, כנתון.',
    checks: [on('f304', f304, 1, 6), on('f304', f304, 9, 2), ['part א 24', areaOf(A), 24, 1e-7]],
  });
}
{
  const C = region(4, 9, () => 3, f304);
  add({
    id: 'q304c',
    fig: {
      xRange: [-0.7, 10.1], yRange: [-0.6, 6.6], curves: [{ f: f304 }], shade: [C], halo: true,
      vAsym: [{ x: 0, label: 'x = 0' }],
      guides: [{ x1: 0, y1: 3, x2: 10.1, y2: 3, color: PINK, dashed: true }],
      xTicks: [tick(4), tick(9)], yTicks: [ytick(3)],
      points: [{ x: 4, y: 3, label: '(4, 3)', color: INDIGO, dx: -12, dy: -10 }, { x: 9, y: 2, label: '(9, 2)', color: INDIGO, dx: -14, dy: 18 }],
      texts: [t(7.2, 2.62, 'S = 3')],
    },
    caption:
      'סעיף ג: בוורוד מקווקו הישר $y = 3$, שפוגש את הגרף בנקודה $(4,\\; 3)$. האזור המקווקו כלוא בין הישר, שהוא הגבול העליון, לבין הגרף, שהוא הגבול התחתון, עד הישר $x = 9$.',
    checks: [on('f304', f304, 4, 3), ['part ג 3', areaOf(C), 3, 1e-7], ['line above the curve right of 4', Math.min(...[4.5, 6, 9].map((x) => 3 - f304(x))) > 0 ? 1 : 0, 1]],
  });
}
{
  const R = region(0, 3, g305);
  add({
    id: 'q305',
    fig: {
      xRange: [-1.5, 3.7], yRange: [-1.2, 5.3], curves: [{ f: g305, to: 3 }], shade: [R], halo: true,
      xTicks: [tick(2), tick(3)], yTicks: [ytick(4)],
      points: [{ x: 0, y: 0, color: INDIGO }, { x: 2, y: 4, label: '(2, 4)', color: INDIGO, dx: 8, dy: -6 }, { x: 3, y: 0, color: INDIGO }],
      texts: [t(1.75, 1.45, 'S = 27/4')],
    },
    caption:
      'הגרף של $g(x) = 3x^2 - x^3$ בתחום $x \\le 3$: הוא נוגע בציר בראשית, עולה אל המקסימום $(2,\\; 4)$, וחותך את הציר בערך $3$, שם מסתיים התחום. משמאל לראשית הוא מתרומם ואינו חוזר אל הציר, ולכן האזור הסגור הוא רק החלק המקווקו.',
    checks: [on('g305', g305, 2, 4), on('g305', g305, 3, 0), ['area 27/4', areaOf(R), 27 / 4, 1e-7]],
  });
}

// ======== bagrut fn-bag-rq-007 — f(x) = 8x / (x² + 3)²
{
  add({
    id: 'bagSketch',
    fig: {
      xRange: [-6.2, 6.2], yRange: [-0.78, 0.78], curves: [{ f: bag }], halo: true,
      xTicks: [tick(-1), tick(1)],
      points: [
        { x: 1, y: 0.5, label: '(1, 0.5)', color: INDIGO, dx: 8, dy: -6 },
        { x: -1, y: -0.5, label: '(-1, -0.5)', color: INDIGO, dx: -64, dy: 14 },
        { x: 0, y: 0, color: INDIGO },
      ],
    },
    caption:
      'סקיצה של $f(x) = \\dfrac{8x}{(x^2+3)^2}$. הגרף עובר בראשית, המקסימום הוא $(1,\\; 0.5)$ והמינימום הוא $(-1,\\; -0.5)$, ובשני הקצוות הוא מתקרב אל ציר $x$, שהוא האסימפטוטה האופקית $y = 0$. הגרף סימטרי סביב הראשית, כי הפונקציה אי-זוגית.',
    checks: [on('bag', bag, 1, 0.5), on('bag', bag, -1, -0.5), on('bag', bag, 0, 0), ['odd', bag(-2.5) + bag(2.5), 0]],
  });
}
{
  const R = region(0, 3, bag);
  add({
    id: 'bagArea',
    fig: {
      xRange: [-1.2, 4.6], yRange: [-0.12, 0.62], curves: [{ f: bag }], shade: [R], halo: true,
      xTicks: [tick(1), tick(3)], yTicks: [ytick(0.5)],
      points: [{ x: 1, y: 0.5, label: '(1, 0.5)', color: INDIGO, dx: 8, dy: -6 }],
      texts: [t(1.35, 0.13, 'S = 1')],
    },
    caption:
      'האזור המקווקו כלוא בין הגרף של $f$, ציר $x$ והישר $x = 3$. משמאל הוא נסגר בראשית, שבה הגרף פוגש את ציר $x$, וכולו מעל הציר.',
    checks: [['area 1', areaOf(R), 1, 1e-7], ['positive on (0,3]', Math.min(...[0.1, 1, 2, 3].map(bag)) > 0 ? 1 : 0, 1]],
  });
}
{
  const L = region(-r3, 0, zero, bag);
  const Rr = region(0, r3, bag);
  add({
    id: 'bagSym',
    fig: {
      xRange: [-3.6, 3.6], yRange: [-0.62, 0.62], curves: [{ f: bag }], shade: [L, Rr], halo: true,
      xTicks: [{ x: -r3, label: '-√3', above: true }, tick(r3, '√3')],
      points: [{ x: 1, y: 0.5, color: INDIGO }, { x: -1, y: -0.5, color: INDIGO }],
      texts: [t(-0.95, -0.14, '2/3'), t(0.95, 0.1, '2/3')],
    },
    caption:
      'שני האזורים המקווקווים, בין הישר $x = -\\sqrt{3}$ לבין הישר $x = \\sqrt{3}$. השמאלי מתחת לציר והימני מעליו, ולכל אחד מהם שטח $\\dfrac{2}{3}$. אינטגרל אחד על כל הקטע היה מתאפס, ולכן מחשבים צד אחד ומכפילים בשתיים.',
    checks: [['left 2/3', areaOf(L), 2 / 3, 1e-7], ['right 2/3', areaOf(Rr), 2 / 3, 1e-7]],
  });
}

// ---------------------------------------------------------------- run
let fails = 0;
const out: Record<string, { svg: string; caption: string }> = {};
for (const s of SPECS) {
  for (const [label, got, want, tol] of s.checks) {
    if (!(Number.isFinite(got) && Math.abs(got - want) <= (tol ?? 1e-9))) {
      fails++;
      console.log(`✗ ${s.id}: ${label} — got ${got}, want ${want}`);
    }
  }
  // Hebrew stays out of the SVG: there is no bidi inside it.
  const svg = renderPlot(s.fig);
  if (/[֐-׿]/.test(svg)) { fails++; console.log(`✗ ${s.id}: Hebrew inside the SVG`); }
  // label audit — same model as scripts/_probe-rq-figure-audit.ts
  const texts = [...svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"([^>]*)>([^<]*)</g)].map((m) => {
    const x = Number(m[1]);
    const w = m[4].length * 5.5;
    const anchor = /text-anchor="end"/.test(m[3]) ? 'end' : /text-anchor="middle"/.test(m[3]) ? 'middle' : 'start';
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { x0, x1: x0 + w, y: Number(m[2]), t: m[4] };
  });
  for (const tx of texts) {
    if (tx.x0 < -6 || tx.x1 > (s.fig.w ?? 300) + 6 || tx.y < 8 || tx.y > (s.fig.h ?? 260) + 2) {
      fails++;
      console.log(`✗ ${s.id}: label "${tx.t}" outside the frame at (${tx.x0.toFixed(0)}, ${tx.y})`);
    }
  }
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (Math.abs(a.y - b.y) < 9 && a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1) {
        fails++;
        console.log(`✗ ${s.id}: "${a.t}" overlaps "${b.t}"`);
      }
    }
  out[s.id] = { svg, caption: s.caption };
}
const nChecks = SPECS.reduce((n, s) => n + s.checks.length, 0);
console.log(`${SPECS.length} figures · ${nChecks} checks · ${fails} failure(s)`);
if (fails) process.exit(1);

const body =
  `// GENERATED by scripts/_gen-rq-integral-figures.ts — do not edit by hand.\n` +
  `// Every figure of רמה 7 (rq-integral): drawn from the real functions, every\n` +
  `// hatched region integrated and compared with the solution's own answer.\n` +
  `import type { DiagramSpec } from '../../types';\n\n` +
  `const fig = (svg: string, caption: string): DiagramSpec => ({ type: 'custom', svg, viewBox: '0 0 300 260', caption });\n\n` +
  `export const IN_FIG = {\n` +
  Object.entries(out)
    .map(([k, v]) => `  ${k}: fig(\n    \`${v.svg}\`,\n    ${JSON.stringify(v.caption)},\n  ),`)
    .join('\n') +
  `\n} satisfies Record<string, DiagramSpec>;\n`;
writeFileSync('content/lessons/math5/rq-extra/integral-figures.ts', body, 'utf8');
console.log('wrote content/lessons/math5/rq-extra/integral-figures.ts');

// contact sheet — assertions prove coordinates, only looking proves legibility
const sheetAt = process.argv.indexOf('--sheet');
if (sheetAt > 0) void sheet(process.argv[sheetAt + 1]);
async function sheet(dir: string) {
  const { default: sharp } = await import('sharp');
  const COLS = 4, CW = 600, CH = 520;
  const ids = Object.keys(out);
  const tiles = await Promise.all(
    ids.map(async (k, i) => ({
      input: await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" width="${CW}" height="${CH}"><rect width="100%" height="100%" fill="#FDFDFB"/><text x="4" y="12" font-size="10" fill="#DB2777">${k}</text>${out[k].svg}</svg>`)).png().toBuffer(),
      left: (i % COLS) * CW,
      top: Math.floor(i / COLS) * CH,
    })),
  );
  const rows = Math.ceil(ids.length / COLS);
  await sharp({ create: { width: COLS * CW, height: rows * CH, channels: 3, background: '#CBD5E1' } })
    .composite(tiles).png().toFile(`${dir}/rq-integral-sheet.png`);
  console.log(`sheet → ${dir}/rq-integral-sheet.png`);
}
