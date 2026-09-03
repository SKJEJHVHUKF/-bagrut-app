// Figures for the EXTRA rq-sketch questions (content/lessons/math5/rq-extra/sketch.ts).
// Every visual claim is re-derived from the real function below, so the SVG
// cannot draw something the solution does not say.
//
// Run: npx tsx scripts/_rq-extra-fig-sketch.ts        check every assertion
//      npx tsx scripts/_rq-extra-fig-sketch.ts emit   print the SVG strings
import { render, type Fig } from './_gen-rq-figures';

const EMERALD = '#059669';
const PINK = '#DB2777';

type Spec = { id: string; where: string; fig: Fig; checks: [string, number, number][] };

// rq-sub-sk-108 — findings with a hole, rising branches, intercept on the right branch
const f_sk108 = (x: number) => (x * x - 4 * x - 12) / (x * x - 4);
// rq-sub-sk-110 — min at (0,3), horizontal asymptote y = 1 on the left, vertical x = 5
const f_sk110 = (x: number) => 1 + (10 * (2 * x * x - 0.2 * x + 1)) / ((5 - x) * (x * x + 1));
// rq-sub-sk-112 — a "quotient" that is a line with a hole
const f_sk112 = (x: number) => (x * x - 16) / (x - 4);

// numeric argmax of f_sk110 on [-6, -0.5]
let xMax = -2, best = -Infinity;
for (let i = 0; i <= 5500; i++) {
  const x = -6 + (5.5 * i) / 5500;
  const y = f_sk110(x);
  if (y > best) { best = y; xMax = x; }
}
const d110 = (x: number, h = 1e-6) => (f_sk110(x + h) - f_sk110(x - h)) / (2 * h);

export const SPECS: Spec[] = [
  {
    id: 'SOL_SK108',
    where: 'solution of rq-sub-sk-108 — the sketch the findings describe',
    fig: {
      xRange: [-7, 10], yRange: [-5, 7],
      curves: [{ f: f_sk108 }],
      vAsym: [{ x: 2, label: 'x = 2' }],
      hAsym: [{ y: 1, label: 'y = 1' }],
      points: [
        { x: -2, y: 2, label: '(-2,2)', hollow: true, dx: -40, dy: -8 },
        { x: 0, y: 3, label: '(0,3)', color: PINK, dx: 8, dy: 14 },
        { x: 6, y: 0, label: '(6,0)', dx: 6, dy: 14 },
      ],
      xTicks: [{ x: 6, label: '6' }],
    },
    checks: [
      ['the reduced form (x-6)/(x-2) gives the hole height 2', (-2 - 6) / (-2 - 2), 2],
      ['the y-intercept is (0,3)', f_sk108(0), 3],
      ['the x-intercept is (6,0)', f_sk108(6), 0],
      ['left of x = 2 the branch escapes UP', Math.round(f_sk108(1.9)), 41],
      ['right of x = 2 the branch comes from BELOW', Math.round(f_sk108(2.1)), -39],
      ['far right the graph tends to 1', Math.round(f_sk108(1000) * 100) / 100, 1],
      ['and the branches rise: f(-4) < f(0)', f_sk108(-4) < f_sk108(0) ? 1 : 0, 1],
      ['f(3) < f(6)', f_sk108(3) < f_sk108(6) ? 1 : 0, 1],
    ],
  },
  {
    id: 'SOL_SK110',
    where: 'solution of rq-sub-sk-110 — the maximum the asymptote forces',
    fig: {
      xRange: [-12, 9], yRange: [-4, 8],
      curves: [{ f: f_sk110 }],
      vAsym: [{ x: 5, label: 'x = 5' }],
      hAsym: [{ y: 1, label: 'y = 1' }],
      points: [
        { x: 0, y: 3, label: '(0,3)', color: PINK, dx: 6, dy: 14 },
        { x: xMax, y: f_sk110(xMax), label: '', color: EMERALD },
      ],
      texts: [{ x: xMax, y: f_sk110(xMax) + 0.7, text: 'max', color: EMERALD, bold: true }],
      xTicks: [{ x: 5, label: '5' }],
      yTicks: [{ y: 3, label: '3' }],
    },
    checks: [
      ['the minimum sits at (0,3) as given', f_sk110(0), 3],
      ['the tangent there is horizontal', Math.round(d110(0) * 1e4) / 1e4, 0],
      ['just left of it the curve is higher', f_sk110(-0.5) > 3 ? 1 : 0, 1],
      ['it climbs above the minimum', f_sk110(xMax) > 3 ? 1 : 0, 1],
      ['then falls back toward the asymptote', Math.round(f_sk110(-40) * 10) / 10, 1.4],
      ['far left it is nearly 1', Math.round(f_sk110(-4000) * 100) / 100, 1],
      ['to the right it escapes up near x = 5', f_sk110(4.9) > 50 ? 1 : 0, 1],
      ['the max is left of 0', xMax < 0 ? 1 : 0, 1],
    ],
  },
  {
    id: 'SOL_SK112',
    where: 'solution of rq-sub-sk-112 — a line with a hole, not two branches',
    fig: {
      xRange: [-6, 7], yRange: [-3, 12],
      curves: [{ f: f_sk112 }],
      points: [{ x: 4, y: 8, label: '(4,8)', hollow: true, dx: -38, dy: -6 }],
      xTicks: [{ x: 4, label: '4' }],
      yTicks: [{ y: 8, label: '8' }],
    },
    checks: [
      ['the numerator vanishes at 4 too', 16 - 16, 0],
      ['the reduced form is x + 4, so the gap sits at height 8', 4 + 4, 8],
      ['f(3.99) is about 7.99 — no blow-up', Math.round(f_sk112(3.99) * 100) / 100, 7.99],
      ['f(4.01) is about 8.01 — same from the other side', Math.round(f_sk112(4.01) * 100) / 100, 8.01],
      ['the line crosses the x-axis at -4', f_sk112(-4), 0],
    ],
  },
];

const TOL = 1e-9;
if (process.argv[2] === 'emit') {
  for (const s of SPECS) {
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
    const svg = render(s.fig);
    if (!/<polyline/.test(svg)) fails.push(`FAIL ${s.id}: no curve was drawn at all`);
  }
  console.log(`xMax of SK110 = ${xMax.toFixed(3)}, f = ${f_sk110(xMax).toFixed(3)}`);
  console.log(`FIGURE CHECKS: ${pass}/${pass + fails.length} passed over ${SPECS.length} figures.`);
  if (fails.length) { console.log('\n' + fails.join('\n')); process.exit(1); }
}
