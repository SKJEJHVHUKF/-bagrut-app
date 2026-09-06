// eg-ang-010 — a new אתגר question for the angles sub-topic, whose hard rung
// measured BELOW its mid rung and used exactly one named theorem at every level.
// This one needs alternate angles + a linear pair + an angle bisector + an
// equation, so it is harder by construction rather than by wording.
//
//   AB ∥ CD, transversal meets them at M and N. MK bisects ∠AMN.
//   Given: ∠KMN is 18° less than ∠MNC.
//   ⇒ α/2 = (180 − α) − 18 ⇒ α = 108, so ∠AMN = 108, ∠BMN = 72, ∠KMN = 54.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const rad = (deg: number) => (deg * Math.PI) / 180;

const ALPHA = 108; // ∠AMN, the value the student must find

const M: Pt = [0, 4];
const A: Pt = [-5, 4];
const B: Pt = [5, 4];

// MN leaves M at −(180 − ALPHA)° below the horizontal, i.e. down-and-right.
const th = rad(ALPHA - 180);
const t = 4 / Math.abs(Math.sin(th));
const N: Pt = [r4(M[0] + t * Math.cos(th)), 0];
const C: Pt = [-4, 0];
const D: Pt = [6, 0];

// MK bisects ∠AMN: halfway between ray MA (180°) and ray MN (180 + ALPHA)°.
const bis = rad(180 + ALPHA / 2);
const K: Pt = [r4(M[0] + 3 * Math.cos(bis)), r4(M[1] + 3 * Math.sin(bis))];

const FIG =
  `{"points":{"A":[${A[0]},${A[1]}],"B":[${B[0]},${B[1]}],"M":[${M[0]},${M[1]}],` +
  `"C":[${C[0]},${C[1]}],"D":[${D[0]},${D[1]}],"N":[${N[0]},${N[1]}],"K":[${K[0]},${K[1]}]},` +
  '"segments":["AB","CD","MN",{"s":"MK","accent":true}],' +
  '"parallel":[{"on":"AB","n":1},{"on":"CD","n":1}],' +
  '"angles":[{"at":"M","from":"A","to":"K","n":1},{"at":"M","from":"K","to":"N","n":1},' +
  '{"at":"N","from":"M","to":"C","n":2}],"width":360}';

let bad = 0;
let errs: string[];
try { errs = validateGeo(parseGeo(FIG)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
if (errs.length) { bad++; console.log('❌ eg-ang-010'); errs.forEach((e) => console.log(`     ${e}`)); }
else console.log('✅ eg-ang-010');

const ok = (n: string, c: boolean, got = '') => {
  if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`);
};
const near = (a: number, b: number) => Math.abs(a - b) < 0.05;

ok('AB ∥ CD (both horizontal)', A[1] === B[1] && C[1] === D[1] && A[1] !== C[1]);
ok('M is on AB and N is on CD', M[1] === A[1] && N[1] === C[1] && M[0] > A[0] && M[0] < B[0] && N[0] > C[0] && N[0] < D[0]);
ok(`∠AMN = ${ALPHA}° (ANSWER 1)`, near(angleAt(M, A, N), ALPHA), `got ${angleAt(M, A, N).toFixed(2)}`);
ok(`∠BMN = ${180 - ALPHA}° — linear pair with ∠AMN (ANSWER 2)`, near(angleAt(M, B, N), 180 - ALPHA), `got ${angleAt(M, B, N).toFixed(2)}`);
ok('∠MNC = ∠BMN — alternate angles (the GIVEN links through this)', near(angleAt(N, M, C), angleAt(M, B, N)));
ok('∠MND = ∠AMN — the other alternate pair', near(angleAt(N, M, D), angleAt(M, A, N)));
ok('MK really bisects ∠AMN', near(angleAt(M, A, K), angleAt(M, K, N)), `${angleAt(M, A, K).toFixed(2)} vs ${angleAt(M, K, N).toFixed(2)}`);
ok(`∠KMN = ${ALPHA / 2}° (ANSWER 3)`, near(angleAt(M, K, N), ALPHA / 2), `got ${angleAt(M, K, N).toFixed(2)}`);
ok('THE GIVEN: ∠KMN is exactly 18° less than ∠MNC', near(angleAt(N, M, C) - angleAt(M, K, N), 18),
  `diff ${(angleAt(N, M, C) - angleAt(M, K, N)).toFixed(2)}`);
ok('K is strictly inside ∠AMN (the ray is drawn where it belongs)',
  K[1] < M[1] && K[0] < M[0] && angleAt(M, A, K) < ALPHA && angleAt(M, K, N) < ALPHA);

console.log(`\n${bad} problem(s)`);
if (!bad) console.log('\nFIG:\n' + FIG);
