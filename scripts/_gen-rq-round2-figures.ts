/* Figures added in the second מנה ושורש correction round (2026-09-10).
 * The owner: "אם שואלים על קשר בין גרף פונקציה לנגזרת אז צריך שרטוט גם של
 * הנגזרת וגם של הפונקציה" — so a question that already showed f' now shows f
 * beside it. Coordinates are COMPUTED from the real function, never typed.
 *
 *   npx tsx scripts/_gen-rq-round2-figures.ts <id>
 */
import { render, type Fig } from './_gen-rq-figures';

const FIGS: Record<string, Fig> = {
  // rq-sk-drill-004 — the drill already carries f' (a line falling 5 → 2 while
  // staying above the axis). This is the FUNCTION whose derivative that is:
  // f'(x) = 5 - x  ⇒  f(x) = 5x - x²/2, taken with f(0) = 0.
  'sk-drill-004-f': {
    xRange: [-1, 4],
    yRange: [-1, 13],
    curves: [{ f: (x) => 5 * x - (x * x) / 2 }],
    points: [
      { x: 0, y: 0, label: '(0, 0)', color: '#4F46E5', dx: 6, dy: 14 },
      { x: 3, y: 10.5, label: '(3, 10.5)', color: '#4F46E5', dx: -10, dy: -10 },
    ],
    xTicks: [
      { x: -1, label: '-1' },
      { x: 1, label: '1' },
      { x: 2, label: '2' },
      { x: 3, label: '3' },
      { x: 4, label: '4' },
    ],
    yTicks: [
      { y: 2, label: '2' },
      { y: 5, label: '5' },
      { y: 8, label: '8' },
      { y: 10.5, label: '10.5' },
    ],
  },

  // rq-der teach "מה קורה כשגם הנגזרת השנייה מתאפסת" — the x³ example the owner
  // asked for: horizontal tangent at 0, but the derivative never changes sign.
  'der-inflection-x3': {
    xRange: [-2, 2],
    yRange: [-6, 6],
    curves: [
      { f: (x) => x * x * x },
      { f: () => 0, color: '#059669', dashed: true, width: 1.6 },
    ],
    points: [{ x: 0, y: 0, label: '(0, 0)', color: '#4F46E5', dx: 8, dy: 16 }],
    xTicks: [
      { x: -2, label: '-2' },
      { x: -1, label: '-1' },
      { x: 1, label: '1' },
      { x: 2, label: '2' },
    ],
    yTicks: [
      { y: -4, label: '-4' },
      { y: 4, label: '4' },
    ],
    texts: [{ x: 1.05, y: 0.9, text: 'y = 0', color: '#059669', anchor: 'start' }],
  },
  // rq-sub-bg-201 — f(x) = x·√(3-x): domain x ≤ 3, zeros at 0 and 3, maximum (2, 2)
  'bg-201': {
    xRange: [-1, 3.6],
    yRange: [-2.4, 3],
    curves: [{ f: (x) => x * Math.sqrt(3 - x), from: -1, to: 3 }],
    points: [
      { x: 0, y: 0, label: '(0, 0)', color: '#4F46E5', dx: -30, dy: 16 },
      { x: 3, y: 0, label: '(3, 0)', color: '#4F46E5', dx: 4, dy: 16 },
      { x: 2, y: 2, label: '(2, 2)', color: '#059669', dx: 6, dy: -8 },
    ],
    xTicks: [{ x: -1, label: '-1' }, { x: 1, label: '1' }, { x: 2, label: '2' }, { x: 3, label: '3' }],
    yTicks: [{ y: -2, label: '-2' }, { y: 2, label: '2' }],
  },

  // rq-sub-bg-304 — f(x) = (x²+9)/(x²-9): x = ±3 vertical, y = 1 horizontal,
  // maximum at (0, -1), and the graph never meets the x-axis
  'bg-304': {
    xRange: [-9, 9],
    yRange: [-7, 7],
    curves: [{ f: (x) => (x * x + 9) / (x * x - 9) }],
    vAsym: [{ x: -3, label: 'x = -3' }, { x: 3, label: 'x = 3' }],
    hAsym: [{ y: 1, label: 'y = 1' }],
    points: [{ x: 0, y: -1, label: '(0, -1)', color: '#059669', dx: 6, dy: 16 }],
    xTicks: [{ x: -6, label: '-6' }, { x: -3, label: '-3' }, { x: 3, label: '3' }, { x: 6, label: '6' }],
    yTicks: [{ y: -4, label: '-4' }, { y: 1, label: '1' }, { y: 4, label: '4' }],
  },

  // rq-sub-sk-102 — how a hole is MARKED: a hollow circle on an otherwise
  // ordinary curve. y = x + 2 passes through (3, 5).
  'sk-102-hole': {
    xRange: [0, 6],
    yRange: [0, 9],
    curves: [{ f: (x) => x + 2 }],
    points: [{ x: 3, y: 5, label: '(3, 5)', hollow: true, color: '#DB2777', dx: 8, dy: -8 }],
    xTicks: [{ x: 1, label: '1' }, { x: 3, label: '3' }, { x: 5, label: '5' }],
    yTicks: [{ y: 2, label: '2' }, { y: 5, label: '5' }, { y: 8, label: '8' }],
  },

  // rq-sub-sk-304 — f(x) = x/√(x-4): domain x > 4, vertical asymptote x = 4,
  // a single minimum at (8, 4)
  'sk-304': {
    xRange: [3.4, 20],
    yRange: [0, 13],
    curves: [{ f: (x) => x / Math.sqrt(x - 4), from: 4.08, to: 20 }],
    vAsym: [{ x: 4, label: 'x = 4' }],
    points: [{ x: 8, y: 4, label: '(8, 4)', color: '#059669', dx: 8, dy: -8 }],
    xTicks: [{ x: 4, label: '4' }, { x: 8, label: '8' }, { x: 12, label: '12' }, { x: 16, label: '16' }],
    yTicks: [{ y: 4, label: '4' }, { y: 8, label: '8' }, { y: 12, label: '12' }],
  },

  // rq-sub-sk-006 — the question describes the FUNCTION's branch and asks about
  // its derivative, so the derivative gets its own picture beside it: positive
  // before x = 1, zero at 1, negative after.
  'sk-006-deriv': {
    xRange: [-4.5, 4],
    yRange: [-6, 6],
    curves: [{ f: (x) => -2 * (x - 1), color: '#B45309' }],
    points: [{ x: 1, y: 0, label: '(1, 0)', color: '#B45309', dx: 8, dy: -8 }],
    xTicks: [{ x: -4, label: '-4' }, { x: -2, label: '-2' }, { x: 1, label: '1' }, { x: 3, label: '3' }],
    yTicks: [{ y: -4, label: '-4' }, { y: 4, label: '4' }],
    texts: [
      { x: -2.4, y: 5.2, text: "f' > 0", color: '#059669' },
      { x: 2.9, y: -5.2, text: "f' < 0", color: '#DB2777' },
    ],
  },
  // fn-bag-rq-005/ד — f(x) = 2x/(x-3): x = 3 vertical, y = 2 horizontal, and the
  // origin is its only meeting point with either axis
  'bag-005-f': {
    xRange: [-6, 12],
    yRange: [-5, 9],
    curves: [{ f: (x) => (2 * x) / (x - 3) }],
    vAsym: [{ x: 3, label: 'x = 3' }],
    hAsym: [{ y: 2, label: 'y = 2' }],
    points: [{ x: 0, y: 0, label: '(0, 0)', color: '#4F46E5', dx: -34, dy: 14 }],
    xTicks: [{ x: -3, label: '-3' }, { x: 3, label: '3' }, { x: 6, label: '6' }, { x: 9, label: '9' }],
    yTicks: [{ y: -2, label: '-2' }, { y: 2, label: '2' }, { y: 6, label: '6' }],
  },

  // fn-bag-rq-005/ה — the same graph shifted four down: g(x) = f(x) - 4, so the
  // horizontal asymptote drops to y = -2 and the x-intercept moves to (6, 0)
  'bag-005-g': {
    xRange: [-6, 12],
    yRange: [-9, 5],
    curves: [{ f: (x) => (2 * x) / (x - 3) - 4 }],
    vAsym: [{ x: 3, label: 'x = 3' }],
    hAsym: [{ y: -2, label: 'y = -2' }],
    points: [{ x: 6, y: 0, label: '(6, 0)', color: '#059669', dx: 6, dy: 16 }],
    xTicks: [{ x: -3, label: '-3' }, { x: 3, label: '3' }, { x: 6, label: '6' }, { x: 9, label: '9' }],
    yTicks: [{ y: -6, label: '-6' }, { y: -2, label: '-2' }, { y: 2, label: '2' }],
  },
  // --- the graph/derivative pairs. Each question DESCRIBES f' and asks about f,
  // so both get drawn: the owner's rule is that such a question needs the two.

  // rq-sub-sk-109 — f'(x) = 2 - x (already drawn); this is f(x) = 2x - x²/2
  'sk-109-f': {
    xRange: [-1, 5],
    yRange: [-3.4, 3],
    curves: [{ f: (x) => 2 * x - (x * x) / 2 }],
    points: [{ x: 2, y: 2, label: '(2, 2)', color: '#059669', dx: 6, dy: -8 }],
    xTicks: [{ x: -1, label: '-1' }, { x: 1, label: '1' }, { x: 2, label: '2' }, { x: 4, label: '4' }],
    yTicks: [{ y: -2, label: '-2' }, { y: 2, label: '2' }],
  },

  // rq-sub-sk-105 — f'(x) = (x-4)²: touches the axis at 4 without crossing
  'sk-105-deriv': {
    xRange: [1, 7],
    yRange: [-1.5, 10],
    curves: [{ f: (x) => (x - 4) * (x - 4), color: '#B45309' }],
    points: [{ x: 4, y: 0, label: '(4, 0)', color: '#B45309', dx: 8, dy: 16 }],
    xTicks: [{ x: 2, label: '2' }, { x: 4, label: '4' }, { x: 6, label: '6' }],
    yTicks: [{ y: 4, label: '4' }, { y: 8, label: '8' }],
  },
  // …and f(x) = (x-4)³/3, whose derivative that is: rising throughout, flat for
  // one instant at x = 4
  'sk-105-f': {
    xRange: [1, 7],
    yRange: [-10, 10],
    curves: [{ f: (x) => Math.pow(x - 4, 3) / 3 }],
    points: [{ x: 4, y: 0, label: '(4, 0)', color: '#059669', dx: 8, dy: -8 }],
    xTicks: [{ x: 2, label: '2' }, { x: 4, label: '4' }, { x: 6, label: '6' }],
    yTicks: [{ y: -6, label: '-6' }, { y: 6, label: '6' }],
  },

  // rq-sub-sk-107 — f'(x) = 0.1·(x+3)·x·(x-4): crosses at -3 (- to +), at 0
  // (+ to -) and at 4 (- to +)
  'sk-107-deriv': {
    xRange: [-5, 6],
    yRange: [-10, 11],
    curves: [{ f: (x) => 0.1 * (x + 3) * x * (x - 4), color: '#B45309' }],
    points: [
      { x: -3, y: 0, label: '-3', color: '#B45309', dx: -4, dy: 16 },
      { x: 0, y: 0, label: '0', color: '#B45309', dx: 6, dy: 16 },
      { x: 4, y: 0, label: '4', color: '#B45309', dx: 4, dy: 16 },
    ],
    xTicks: [{ x: -4, label: '-4' }, { x: 2, label: '2' }, { x: 5, label: '5' }],
    yTicks: [{ y: -6, label: '-6' }, { y: 6, label: '6' }],
  },
  // …and a function whose derivative that is: 0.025x⁴ - x³/30 - 0.6x²
  'sk-107-f': {
    xRange: [-5, 6],
    yRange: [-7, 6],
    curves: [{ f: (x) => 0.025 * Math.pow(x, 4) - Math.pow(x, 3) / 30 - 0.6 * x * x }],
    // Hebrew never goes inside an SVG (no bidi there) — the words live in the
    // caption, and the marks carry coordinates only.
    points: [
      { x: -3, y: -2.475, label: '(-3, -2.5)', color: '#059669', dx: -58, dy: 18 },
      { x: 0, y: 0, label: '(0, 0)', color: '#4F46E5', dx: -14, dy: -8 },
      { x: 4, y: -5.3333, label: '(4, -5.3)', color: '#059669', dx: 6, dy: 18 },
    ],
    xTicks: [{ x: -4, label: '-4' }, { x: -3, label: '-3' }, { x: 4, label: '4' }, { x: 5, label: '5' }],
    yTicks: [{ y: -4, label: '-4' }, { y: 4, label: '4' }],
  },
};

const id = process.argv[2];
for (const [k, fig] of Object.entries(FIGS)) {
  if (id && k !== id) continue;
  console.log(`===== ${k}`);
  console.log(render(fig));
}
