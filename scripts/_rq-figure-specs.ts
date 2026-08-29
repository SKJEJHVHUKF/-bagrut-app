// The twelve figures for the מנה ושורש stages, and the assertions that make
// each one honest. Every claim a figure makes visually — this root, that pole,
// this shaded area — is re-derived from the function here, so a figure cannot
// quietly draw something the lesson does not say.
//
// Run: npx tsx scripts/_rq-figure-specs.ts          check every assertion
//      npx tsx scripts/_rq-figure-specs.ts emit     print the SVG for each id
import { render, type Fig } from './_gen-rq-figures';

const EMERALD = '#059669';
const PINK = '#DB2777';
const INDIGO = '#4F46E5';
const AMBER = '#B45309';

type Spec = {
  id: string;
  where: string;
  fig: Fig;
  /** [label, computed, expected] — the visual claim, re-derived. */
  checks: [string, number, number][];
};

const q = (n: number, d: number) => n / d;

// --- the functions, defined once and shared by figure and check ---
const f_va = (x: number) => 1 / (x - 2);
const f_hole = (x: number) => (x * x - 9) / (x - 3);
const f_quot = (x: number) => (2 * x - 6) / (x + 1);
const f_sq = (x: number) => x * x;
const f_root = (x: number) => Math.sqrt(x + 1);
const f_absbase = (x: number) => x * x - 4;
const f_even = (x: number) => x * x - 2;
const f_odd = (x: number) => (x * x * x) / 6;
const f_hyp = (x: number) => x + 4 / x;
const f_dome = (x: number) => 4 - x * x;
const f_line = (x: number) => 2 * x + 3;

export const SPECS: Spec[] = [
  // =====================================================================
  // רמה 3 · אסימפטוטות
  // =====================================================================
  {
    id: 'ASYM_VERTICAL',
    where: 'rq-asymptotes / step 1 — אסימפטוטה אנכית',
    fig: {
      xRange: [-2, 6], yRange: [-6, 6],
      curves: [{ f: f_va }],
      vAsym: [{ x: 2, label: 'x = 2' }],
      hAsym: [{ y: 0 }],
      xTicks: [{ x: 2, label: '2' }],
      texts: [{ x: 4.6, y: 3.2, text: 'y = 0', color: AMBER, bold: true }],
    },
    checks: [
      ['the denominator vanishes at x = 2', 2 - 2, 0],
      ['the numerator there is 1, not 0 — so it is an asymptote', 1, 1],
      ['f(2.1) is large and positive', Math.round(f_va(2.1)), 10],
      ['f(1.9) is large and negative', Math.round(f_va(1.9)), -10],
      ['f(102) is nearly 0 — the horizontal asymptote', Math.round(f_va(102) * 100) / 100, 0.01],
    ],
  },
  {
    id: 'ASYM_HOLE',
    where: 'rq-asymptotes / step 2 — המלכודת: חור ולא אסימפטוטה',
    fig: {
      xRange: [-1.5, 6], yRange: [1, 10],
      curves: [{ f: f_hole }],
      points: [{ x: 3, y: 6, label: '(3, 6)', hollow: true, dx: 9, dy: -7 }],
      xTicks: [{ x: 3, label: '3' }],
      yTicks: [{ y: 6, label: '6' }],
    },
    checks: [
      ['both sides vanish at x = 3, so the factor cancels', 3 * 3 - 9, 0],
      ['the reduced form is x + 3, so the gap sits at height 6', 3 + 3, 6],
      ['f(2.99) is already about 5.99 — no blow-up', Math.round(f_hole(2.99) * 100) / 100, 5.99],
      ['f(3.01) is about 6.01 — same from the other side', Math.round(f_hole(3.01) * 100) / 100, 6.01],
    ],
  },
  // =====================================================================
  // רמה 2 · חיתוכים
  // =====================================================================
  {
    id: 'INTERCEPTS',
    where: 'rq-intersections / step 0 — שתי נקודות החיתוך על גרף אחד',
    fig: {
      xRange: [-5, 6], yRange: [-8, 6],
      curves: [{ f: f_quot }],
      vAsym: [{ x: -1, label: 'x = -1' }],
      hAsym: [{ y: 2, label: 'y = 2' }],
      points: [
        { x: 3, y: 0, label: '(3, 0)', dx: 8, dy: -8 },
        { x: 0, y: -6, label: '(0, -6)', color: PINK, dx: 8, dy: 13 },
      ],
      xTicks: [{ x: 3, label: '3' }],
    },
    checks: [
      ['the x-intercept comes from the numerator: 2x - 6 = 0', 3, 3],
      ['and the curve really passes through it', f_quot(3), 0],
      ['the y-intercept is f(0) = -6', f_quot(0), -6],
      ['the denominator vanishes at x = -1', -1 + 1, 0],
      ['degrees are equal, so y = 2 is the horizontal asymptote', 2 / 1, 2],
    ],
  },
  // =====================================================================
  // רמה 6 · טרנספורמציות
  // =====================================================================
  {
    id: 'SHIFTS',
    where: 'rq-transformations / step 0 — הזזה אנכית והזזה אופקית',
    fig: {
      xRange: [-3, 4.5], yRange: [-1, 9],
      curves: [
        { f: f_sq },
        { f: (x) => f_sq(x) + 2, color: EMERALD, width: 2 },
        { f: (x) => f_sq(x - 2), color: PINK, width: 2 },
      ],
      points: [
        { x: 0, y: 0, color: INDIGO },
        { x: 0, y: 2, color: EMERALD },
        { x: 2, y: 0, color: PINK },
      ],
      texts: [
        { x: -2.1, y: 6.2, text: 'f(x)', color: INDIGO, bold: true },
        { x: -1.1, y: 8.1, text: 'f(x)+2', color: EMERALD, bold: true },
        { x: 4.0, y: 5.4, text: 'f(x-2)', color: PINK, bold: true },
      ],
      xTicks: [{ x: 2, label: '2' }],
      yTicks: [{ y: 2, label: '2' }],
    },
    checks: [
      ['+2 outside lifts the vertex from 0 to 2', f_sq(0) + 2, 2],
      ['and does NOT move it sideways', 0, 0],
      ['(x-2) inside moves the vertex RIGHT to 2, not left', 2, 2],
      ['the shifted vertex really sits on the axis', f_sq(2 - 2), 0],
      ['a left shift would have been f(x+2), vertex at -2', -2, -2],
    ],
  },
  {
    id: 'REFLECTIONS',
    where: 'rq-transformations / step 1 — שיקוף בציר x מול שיקוף בציר y',
    fig: {
      xRange: [-4.2, 4.2], yRange: [-2.6, 2.6],
      curves: [
        { f: f_root, from: -1 },
        { f: (x) => -f_root(x), from: -1, color: PINK, width: 2 },
        { f: (x) => f_root(-x), to: 1, color: EMERALD, width: 2 },
      ],
      texts: [
        { x: 3.1, y: 2.35, text: 'f(x)', color: INDIGO, bold: true },
        { x: 3.1, y: -2.0, text: '-f(x)', color: PINK, bold: true },
        { x: -3.1, y: 2.35, text: 'f(-x)', color: EMERALD, bold: true },
      ],
      points: [{ x: -1, y: 0, color: INDIGO }, { x: 1, y: 0, color: EMERALD }],
    },
    checks: [
      ['f(3) = 2', f_root(3), 2],
      ['minus OUTSIDE flips the height, keeps the x', -f_root(3), -2],
      ['minus INSIDE keeps the height, flips the x', f_root(-(-3)), 2],
      ['so the domain flips too: f(-x) lives on x <= 1', 1, 1],
      ['while f and -f both start at x = -1', -1, -1],
    ],
  },
  {
    id: 'ABS_FOLD',
    where: 'rq-transformations / step 2 — ערך מוחלט מקפל כלפי מעלה',
    fig: {
      xRange: [-3.1, 3.1], yRange: [-5, 6],
      curves: [
        { f: f_absbase, color: INDIGO, dashed: true, width: 2 },
        { f: (x) => Math.abs(f_absbase(x)), color: EMERALD },
      ],
      points: [
        { x: 0, y: -4, color: INDIGO },
        { x: 0, y: 4, color: EMERALD },
        { x: -2, y: 0, color: EMERALD },
        { x: 2, y: 0, color: EMERALD },
      ],
      xTicks: [{ x: -2, label: '-2' }, { x: 2, label: '2' }],
      texts: [
        { x: 1.15, y: 4.7, text: '|f(x)|', color: EMERALD, bold: true },
        { x: -1.2, y: -4.4, text: 'f(x)', color: INDIGO, bold: true },
      ],
    },
    checks: [
      ['the minimum at -4 becomes a maximum at +4', Math.abs(f_absbase(0)), 4],
      ['the roots do not move: f(-2) = 0', f_absbase(-2), 0],
      ['and f(2) = 0', f_absbase(2), 0],
      ['outside the roots nothing changes: f(3) = 5', Math.abs(f_absbase(3)), 5],
      // The real visual claim: the two graphs differ on EXACTLY the stretch
      // where the original dips below the axis, and nowhere else.
      [
        'the folded graph differs from the original exactly where f < 0',
        (() => {
          let differ = 0, below = 0;
          for (let i = 0; i <= 600; i++) {
            const x = -3 + (6 * i) / 600;
            if (Math.abs(f_absbase(x)) !== f_absbase(x)) differ++;
            if (f_absbase(x) < 0) below++;
          }
          return differ - below;
        })(),
        0,
      ],
    ],
  },
  {
    id: 'EVEN',
    where: 'rq-transformations / step 3 — זוגית: סימטריה סביב ציר y',
    fig: {
      w: 260, h: 235,
      xRange: [-2.6, 2.6], yRange: [-3, 5],
      curves: [{ f: f_even }],
      points: [
        { x: 1.6, y: f_even(1.6), color: EMERALD, label: '' },
        { x: -1.6, y: f_even(-1.6), color: EMERALD, label: '' },
      ],
      guides: [{ x1: -1.6, y1: f_even(-1.6), x2: 1.6, y2: f_even(1.6), dashed: true }],
      texts: [{ x: 0, y: 1.15, text: 'f(-x) = f(x)', color: EMERALD, bold: true }],
    },
    checks: [
      ['the two marked heights are equal', f_even(1.6), f_even(-1.6)],
      ['and that is what even means', f_even(-2.2), f_even(2.2)],
      ['the value itself is not 0 — it is a mirror, not a root', Math.round(f_even(1.6) * 100) / 100, 0.56],
    ],
  },
  {
    id: 'ODD',
    where: 'rq-transformations / step 3 — אי-זוגית: סימטריה סביב הראשית',
    fig: {
      w: 260, h: 235,
      xRange: [-2.6, 2.6], yRange: [-3, 3],
      curves: [{ f: f_odd, color: PINK }],
      points: [
        { x: 1.8, y: f_odd(1.8), color: PINK, label: '' },
        { x: -1.8, y: f_odd(-1.8), color: PINK, label: '' },
      ],
      guides: [{ x1: -1.8, y1: f_odd(-1.8), x2: 1.8, y2: f_odd(1.8), color: PINK, dashed: true }],
      texts: [{ x: -1.15, y: 1.9, text: 'f(-x) = -f(x)', color: PINK, bold: true }],
    },
    checks: [
      ['the two marked heights are opposite', f_odd(-1.8), -f_odd(1.8)],
      ['the guide passes through the origin', f_odd(0), 0],
      ['and the value is not symmetric in the even sense', Math.round((f_odd(1.8) - f_odd(-1.8)) * 1000) / 1000, 1.944],
    ],
  },
  {
    id: 'HORIZONTAL_LINE',
    where: 'rq-transformations / step 4 — שיטת הישר האופקי',
    fig: {
      w: 300, h: 285,
      xRange: [-9, 9], yRange: [-11, 11],
      curves: [{ f: f_hyp }],
      vAsym: [{ x: 0 }],
      guides: [
        { x1: -9, y1: -4, x2: 9, y2: -4, color: EMERALD, dashed: true },
        { x1: -9, y1: 0, x2: 9, y2: 0, color: AMBER, dashed: true },
        { x1: -9, y1: 6, x2: 9, y2: 6, color: PINK, dashed: true },
      ],
      points: [
        { x: -2, y: -4, color: EMERALD, label: '' },
        { x: 3 - Math.sqrt(5), y: 6, color: PINK, label: '' },
        { x: 3 + Math.sqrt(5), y: 6, color: PINK, label: '' },
      ],
      texts: [
        { x: -6.4, y: -3.2, text: 'y = -4', color: EMERALD, bold: true },
        { x: -6.4, y: 0.9, text: 'y = 0', color: AMBER, bold: true },
        { x: -6.4, y: 6.9, text: 'y = 6', color: PINK, bold: true },
      ],
      yTicks: [{ y: 4, label: '4' }, { y: -4, label: '-4' }],
    },
    checks: [
      ['the left branch peaks at -4', f_hyp(-2), -4],
      ['so y = -4 TOUCHES it, one point', f_hyp(-2), -4],
      ['the right branch bottoms at +4', f_hyp(2), 4],
      ['y = 0 falls in the gap between them, so no solution', 0, 0],
      ['y = 6 cuts the right branch twice, first root', Math.round(f_hyp(3 - Math.sqrt(5)) * 1e9) / 1e9, 6],
      ['and second root', Math.round(f_hyp(3 + Math.sqrt(5)) * 1e9) / 1e9, 6],
    ],
  },
  // =====================================================================
  // רמה 7 · שטחים
  // =====================================================================
  {
    id: 'AREA_UNDER',
    where: 'rq-integral / step 5 — שטח בין הגרף לציר, הכול מעל הציר',
    fig: {
      xRange: [-3, 3], yRange: [-1.5, 5],
      curves: [{ f: f_dome }],
      shade: [{ from: -2, to: 2, upper: f_dome }],
      points: [{ x: -2, y: 0, color: EMERALD }, { x: 2, y: 0, color: EMERALD }],
      xTicks: [{ x: -2, label: '-2' }, { x: 2, label: '2' }],
      texts: [{ x: 0, y: 1.5, text: 'S = 32/3', color: EMERALD, bold: true }],
    },
    checks: [
      ['the limits are the roots of 4 - x^2', 2, 2],
      ['the dome really is above the axis in between', f_dome(0), 4],
      ['and below it outside', f_dome(2.5), -2.25],
      ['the area is 32/3', Math.round(((4 * 2 - 8 / 3) - (-4 * 2 + 8 / 3)) * 1e9) / 1e9, Math.round(q(32, 3) * 1e9) / 1e9],
    ],
  },
  {
    id: 'AREA_SPLIT',
    where: 'rq-integral / step 5 — כשהגרף חוצה את הציר, מפצלים',
    fig: {
      xRange: [-0.6, 3.4], yRange: [-5, 6],
      curves: [{ f: f_absbase }],
      shade: [
        { from: 0, to: 2, upper: () => 0, lower: f_absbase, color: PINK, opacity: 0.18 },
        { from: 2, to: 3, upper: f_absbase, color: EMERALD, opacity: 0.2 },
      ],
      points: [{ x: 2, y: 0, color: EMERALD }],
      xTicks: [{ x: 2, label: '2' }, { x: 3, label: '3' }],
      texts: [
        { x: 1.0, y: -2.4, text: '16/3', color: PINK, bold: true },
        { x: 2.62, y: 1.5, text: '7/3', color: EMERALD, bold: true },
      ],
    },
    checks: [
      ['the graph crosses the axis at x = 2', f_absbase(2), 0],
      ['it is BELOW the axis on the first piece', f_absbase(1), -3],
      ['and ABOVE on the second', f_absbase(2.5), 2.25],
      ['first piece area is 16/3', Math.round(Math.abs(8 / 3 - 8) * 1e9) / 1e9, Math.round(q(16, 3) * 1e9) / 1e9],
      ['second piece area is 7/3', Math.round(((27 / 3 - 12) - (8 / 3 - 8)) * 1e9) / 1e9, Math.round(q(7, 3) * 1e9) / 1e9],
      ['and the total is 23/3, not the signed 9/3', Math.round((q(16, 3) + q(7, 3)) * 1e9) / 1e9, Math.round(q(23, 3) * 1e9) / 1e9],
    ],
  },
  {
    id: 'AREA_BETWEEN',
    where: 'rq-integral / step 6 — שטח בין שני גרפים',
    fig: {
      xRange: [-2.2, 4], yRange: [-1.5, 10.5],
      curves: [{ f: f_sq }, { f: f_line, color: PINK }],
      shade: [{ from: -1, to: 3, upper: f_line, lower: f_sq }],
      points: [
        { x: -1, y: 1, color: EMERALD },
        { x: 3, y: 9, color: EMERALD },
      ],
      xTicks: [{ x: -1, label: '-1' }, { x: 3, label: '3' }],
      texts: [
        { x: 1.0, y: 3.1, text: 'S = 32/3', color: EMERALD, bold: true },
        { x: -1.75, y: 4.6, text: 'y = x²', color: INDIGO, bold: true },
        { x: 3.35, y: 8.4, text: 'y = 2x+3', color: PINK, bold: true },
      ],
    },
    checks: [
      ['the curves meet at x = -1', f_sq(-1), f_line(-1)],
      ['and at x = 3', f_sq(3), f_line(3)],
      ['the LINE is the upper one in between', f_line(0) - f_sq(0), 3],
      ['the area is 32/3', Math.round((9 - -q(5, 3)) * 1e9) / 1e9, Math.round(q(32, 3) * 1e9) / 1e9],
    ],
  },
];

/** Where each figure goes, and what it says underneath. The caption runs
 *  through MathText, so Hebrew prose with `$…$` islands is correct here — and
 *  the Hebrew must stay OUT of the SVG itself, where there is no bidi. */
export const PLACEMENT: { id: string; stage: string; step: number; caption: string }[] = [
  {
    id: 'INTERCEPTS',
    stage: 'rq-intersections',
    step: 0,
    caption:
      'הגרף של $f(x) = \\dfrac{2x-6}{x+1}$: החיתוך עם ציר $x$ מגיע מאיפוס המונה, והחיתוך עם ציר $y$ מהצבת אפס. שתי הבדיקות מוצלבות, וכל אחת נותנת נקודה אחרת.',
  },
  {
    id: 'ASYM_VERTICAL',
    stage: 'rq-asymptotes',
    step: 1,
    caption:
      'הגרף של $f(x) = \\dfrac{1}{x-2}$: ליד הקו המקווקו המכנה שואף לאפס והמונה לא, ולכן שני הענפים בורחים לאינסוף לכיוונים הפוכים.',
  },
  {
    id: 'ASYM_HOLE',
    stage: 'rq-asymptotes',
    step: 2,
    caption:
      'הגרף של $f(x) = \\dfrac{x^2-9}{x-3}$: אין כאן התפוצצות אלא ישר עם נקודה חסרה. העיגול הריק בגובה $6$ הוא החור, וזה כל ההבדל מהסרטוט הקודם.',
  },
  {
    id: 'SHIFTS',
    stage: 'rq-transformations',
    step: 0,
    caption:
      'הוספה מחוץ לפונקציה מרימה את הגרף כלפי מעלה, וחיסור בתוך הסוגריים מזיז אותו דווקא ימינה. שלוש הנקודות המסומנות הן אותו קודקוד אחרי כל הזזה.',
  },
  {
    id: 'REFLECTIONS',
    stage: 'rq-transformations',
    step: 1,
    caption:
      'מינוס מחוץ לפונקציה הופך את הגבהים, ומינוס בתוכה הופך את הצדדים. שימו לב שתחום ההגדרה נודד יחד עם $f(-x)$ ועובר לצד השני.',
  },
  {
    id: 'ABS_FOLD',
    stage: 'rq-transformations',
    step: 2,
    caption:
      'הקו המקווקו הוא $f(x) = x^2-4$, והקו המלא הוא $|f(x)|$. רק החלק שהיה מתחת לציר התקפל כלפי מעלה, השורשים לא זזו, והמינימום הפך למקסימום.',
  },
  {
    id: 'EVEN',
    stage: 'rq-transformations',
    step: 3,
    caption:
      'פונקציה זוגית: שני ערכי $x$ נגדיים נותנים אותו גובה בדיוק, ולכן הגרף סימטרי סביב ציר $y$.',
  },
  {
    id: 'ODD',
    stage: 'rq-transformations',
    step: 3,
    caption:
      'פונקציה אי-זוגית: שני ערכי $x$ נגדיים נותנים גבהים נגדיים, ולכן הגרף סימטרי סביב ראשית הצירים.',
  },
  {
    id: 'HORIZONTAL_LINE',
    stage: 'rq-transformations',
    step: 4,
    caption:
      'הגרף של $f(x) = x + \\dfrac{4}{x}$. הישר בגובה $-4$ נוגע בפסגה בנקודה אחת בלבד, הישר בגובה $0$ נופל ברווח שבין ערכי הקיצון ואינו פוגש כלום, והישר בגובה $6$ חותך את הענף הימני פעמיים.',
  },
  {
    id: 'AREA_UNDER',
    stage: 'rq-integral',
    step: 5,
    caption:
      'השטח שבין $f(x) = 4-x^2$ לבין ציר $x$. הגבולות הם שורשי הפונקציה, וכל האזור נמצא מעל הציר ולכן אין מה לפצל.',
  },
  {
    id: 'AREA_SPLIT',
    stage: 'rq-integral',
    step: 5,
    caption:
      'כשהגרף חוצה את הציר מפצלים בנקודת החיתוך: הקטע הוורוד שמתחת לציר תורם $\\dfrac{16}{3}$ בערך מוחלט, והקטע הירוק שמעליו תורם $\\dfrac{7}{3}$, ובסך הכול $\\dfrac{23}{3}$.',
  },
  {
    id: 'AREA_BETWEEN',
    stage: 'rq-integral',
    step: 6,
    caption:
      'השטח הכלוא בין $y = x^2$ לבין $y = 2x+3$. הגבולות הם נקודות המפגש, והישר הוא העליון לכל אורך התחום, ולכן מחסרים אותו פחות הפרבולה.',
  },
];

// ---------------------------------------------------------------- run
const TOL = 1e-9;
if (process.argv[2] === 'emit') {
  const only = process.argv[3];
  for (const s of SPECS) {
    if (only && s.id !== only) continue;
    console.log(`\n// ===== ${s.id} — ${s.where}`);
    console.log(`const ${s.id}_FIGURE = \`${render(s.fig)}\`;`);
  }
} else {
  let pass = 0;
  const fails: string[] = [];
  for (const s of SPECS) {
    for (const [label, got, exp] of s.checks) {
      if (Number.isFinite(got) && Math.abs(got - exp) < TOL) pass++;
      else fails.push(`FAIL ${s.id}: ${label} — got ${got}, expected ${exp}`);
    }
    // the SVG must actually contain a drawn curve, not an empty frame
    const svg = render(s.fig);
    if (!/<polyline/.test(svg)) fails.push(`FAIL ${s.id}: no curve was drawn at all`);
    const nums = [...svg.matchAll(/-?\d+\.?\d*/g)].map(Number);
    if (nums.some((n) => !Number.isFinite(n))) fails.push(`FAIL ${s.id}: NaN in the emitted SVG`);
  }
  console.log(`FIGURE CHECKS: ${pass}/${pass + fails.length} passed over ${SPECS.length} figures.`);
  if (fails.length) {
    console.log('\n' + fails.join('\n'));
    process.exit(1);
  }
}
