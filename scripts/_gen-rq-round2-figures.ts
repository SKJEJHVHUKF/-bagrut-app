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
};

const id = process.argv[2];
for (const [k, fig] of Object.entries(FIGS)) {
  if (id && k !== id) continue;
  console.log(`===== ${k}`);
  console.log(render(fig));
}
