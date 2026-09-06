/** Smoke test for lib/fn-figure: a true figure renders, and each kind of false
 *  claim is caught. Run: npx tsx scripts/_probe-fn-figure.ts */
import { writeFileSync } from 'fs';
import { fnFigure, checkFnFigure } from '../lib/fn-figure';

const f = (x: number) => (Math.abs(x - 2) < 1e-12 ? null : (x + 3) / (x - 2));

const good = fnFigure({
  f,
  xMin: -6,
  xMax: 10,
  yMin: -6,
  yMax: 8,
  vAsymptotes: [2],
  hAsymptotes: [1],
  points: [
    { x: -3, y: 0, label: '(-3, 0)' },
    { x: 0, y: -1.5, label: '(0, -1.5)' },
  ],
});

let bad = 0;
const ok = (name: string, cond: boolean) => {
  if (!cond) { bad++; console.log(`✗ ${name}`); } else console.log(`✓ ${name}`);
};

ok('a true figure renders with no errors', good.errors.length === 0 && good.svg.includes('polyline'));
ok('both branches are drawn', (good.svg.match(/<polyline/g) ?? []).length === 2);
ok('a wrong marked point is caught', checkFnFigure({ f, xMin: -6, xMax: 10, points: [{ x: 0, y: 2 }] }).length === 1);
ok('a made-up vertical asymptote is caught', checkFnFigure({ f, xMin: -6, xMax: 10, vAsymptotes: [5] }).length > 0);
ok('a wrong horizontal asymptote is caught', checkFnFigure({ f, xMin: -6, xMax: 10, hAsymptotes: [0] }).length === 1);
ok('the real asymptotes pass', checkFnFigure({ f, xMin: -6, xMax: 10, vAsymptotes: [2], hAsymptotes: [1] }).length === 0);

const g = (x: number) => (x < 1 ? null : Math.sqrt(x - 1));
ok('a root function keeps its domain edge', checkFnFigure({ f: g, xMin: 0, xMax: 10, domainFrom: 1, points: [{ x: 5, y: 2 }] }).length === 0);
ok('a domain edge in the wrong place is caught', checkFnFigure({ f: g, xMin: 0, xMax: 10, domainFrom: 3 }).length === 1);

// Rasterise-by-eye substitute: no label may sit within 6px of another.
const labels = [...good.svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
let collide = 0;
for (let i = 0; i < labels.length; i++)
  for (let j = i + 1; j < labels.length; j++)
    if (Math.abs(labels[i][0] - labels[j][0]) < 18 && Math.abs(labels[i][1] - labels[j][1]) < 6) collide++;
ok('no two labels overlap', collide === 0);

writeFileSync('C:/Users/1000m/AppData/Local/Temp/claude/C--Users-1000m-Desktop-----------/408585a1-e777-4fe1-86b4-e9f1d0707681/scratchpad/fn-figure-sample.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" width="300" height="260"><rect width="300" height="260" fill="#F8FAFC"/>${good.svg}</svg>`);
console.log(bad ? `\n${bad} failed` : '\nfn-figure: all checks passed · sample written to the scratchpad');
process.exit(bad ? 1 : 0);
