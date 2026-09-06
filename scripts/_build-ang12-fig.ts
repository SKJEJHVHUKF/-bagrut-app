// eg-ang-012 — the zigzag between two parallels, with an unknown.
// Raising the ביסוס rung to 16.1 left אתגר only 0.2 above it. This one adds the
// auxiliary-parallel construction (the move the stage never asks for) on top of
// alternate angles, and puts the two unknowns in a single equation.
//
//   AB ∥ CD, P between them, M on AB, N on CD.
//   ∠(PM, AB) = 3x, ∠(PN, CD) = 2x + 10, ∠MPN = 110°  ⇒  x = 20, 60° and 50°.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const rad = (deg: number) => (deg * Math.PI) / 180;

const P: Pt = [5, 4];
// PM leaves P at 120° (up-left), PN at 230° (down-left): 230 − 120 = 110.
const tM = 4 / Math.sin(rad(120));
const M: Pt = [r4(P[0] + tM * Math.cos(rad(120))), 8];
const tN = 4 / Math.abs(Math.sin(rad(230)));
const N: Pt = [r4(P[0] + tN * Math.cos(rad(230))), 0];
const A: Pt = [0, 8], B: Pt = [12, 8], C: Pt = [0, 0], D: Pt = [12, 0];

const FIG =
  `{"points":{"A":[0,8],"B":[12,8],"C":[0,0],"D":[12,0],"M":[${M}],"N":[${N}],"P":[${P}]},` +
  '"segments":["AB","CD",{"s":"MP","accent":true},{"s":"PN","accent":true}],' +
  '"parallel":[{"on":"AB","n":1},{"on":"CD","n":1}],' +
  '"angles":[{"at":"M","from":"B","to":"P","label":"3x"},{"at":"N","from":"D","to":"P","label":"2x+10"},' +
  '{"at":"P","from":"M","to":"N","label":"110°"}],"width":340}';

let bad = 0;
let errs: string[];
try { errs = validateGeo(parseGeo(FIG)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
if (errs.length) { bad++; console.log('❌ eg-ang-012'); errs.forEach((e) => console.log(`     ${e}`)); }
else console.log('✅ eg-ang-012');

const ok = (n: string, c: boolean, got = '') => {
  if (!c) { bad++; console.log(`❌ claim: ${n}  ${got}`); } else console.log(`✅ claim: ${n}`);
};
const near = (a: number, b: number, t = 0.05) => Math.abs(a - b) < t;

ok('AB ∥ CD (both horizontal, different heights)', A[1] === B[1] && C[1] === D[1] && A[1] !== C[1]);
ok('M is on AB, N is on CD, P is strictly between the lines',
  M[1] === 8 && N[1] === 0 && P[1] > 0 && P[1] < 8 && M[0] > A[0] && M[0] < B[0] && N[0] > C[0] && N[0] < D[0]);
ok('GIVEN ∠MPN = 110°', near(angleAt(P, M, N), 110), `${angleAt(P, M, N).toFixed(2)}`);
ok('ANSWER ∠(PM,AB) = 3x = 60° at M', near(angleAt(M, B, P), 60), `${angleAt(M, B, P).toFixed(2)}`);
ok('ANSWER ∠(PN,CD) = 2x+10 = 50° at N', near(angleAt(N, D, P), 50), `${angleAt(N, D, P).toFixed(2)}`);
ok('the equation closes: 3x + (2x+10) = 110 at x = 20', 3 * 20 + (2 * 20 + 10) === 110);
ok('and the two angles really are 60 and 50', 3 * 20 === 60 && 2 * 20 + 10 === 50);
ok('THE REASON it works: the two angles SUM to ∠MPN',
  near(angleAt(M, B, P) + angleAt(N, D, P), angleAt(P, M, N)),
  `${(angleAt(M, B, P) + angleAt(N, D, P)).toFixed(2)} vs ${angleAt(P, M, N).toFixed(2)}`);

console.log(`\n${bad} problem(s)`);
if (!bad) console.log('\nFIG:\n' + FIG);
