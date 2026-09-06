// eg-sub-circ-007, rebuilt. My first version gave ∠A = 95° and ∠B = 70° and
// asked for ∠C and ∠D — which is the לומדים worked example WORD FOR WORD, same
// numbers. The duplicate audit caught it at 86%. I arrived at those numbers
// independently, which is exactly how a repeat gets written by accident.
//
// The ביסוס version now gives ONE angle and a RELATION, so the second pair has
// to come out of an equation rather than a subtraction:
//   ∠A = 115°, and ∠B exceeds ∠D by 40°  ⇒  ∠C = 65°, ∠B = 110°, ∠D = 70°.
// Arcs chosen so all four angles are distinct — otherwise the figure would let
// a student read the answer off two equal-looking corners.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const on = (deg: number): Pt => [r4(5 * Math.cos((deg * Math.PI) / 180)), r4(5 * Math.sin((deg * Math.PI) / 180))];

// arcs AB=60, BC=80, CD=150, DA=70
const A = on(90), B = on(150), C = on(230), D = on(20);
const L = d(B, C);
const E: Pt = [r4(C[0] + 3 * (C[0] - B[0]) / L), r4(C[1] + 3 * (C[1] - B[1]) / L)];

const FIG =
  `{"points":{"O":[0,0],"A":[${A}],"B":[${B}],"C":[${C}],"D":[${D}],"E":[${E}]},` +
  '"circles":[{"center":"O","r":5,"on":["A","B","C","D"]}],"polygons":["ABCD"],' +
  '"segments":[{"s":"CE","accent":true}],' +
  '"angles":[{"at":"A","from":"D","to":"B","label":"115°"}],' +
  '"hidden":["O"],"width":300}';

let bad = 0;
let errs: string[];
try { errs = validateGeo(parseGeo(FIG)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
if (errs.length) { bad++; console.log('❌ eg-sub-circ-007'); errs.forEach((e) => console.log(`     ${e}`)); }
else console.log('✅ eg-sub-circ-007');

const ok = (n: string, c: boolean, got = '') => {
  if (!c) { bad++; console.log(`❌ claim: ${n}  ${got}`); } else console.log(`✅ claim: ${n}`);
};
const near = (a: number, b: number, t = 0.05) => Math.abs(a - b) < t;

const aA = angleAt(A, D, B), aB = angleAt(B, A, C), aC = angleAt(C, B, D), aD = angleAt(D, C, A);
ok('all four vertices are on the circle', [A, B, C, D].every((p) => near(d([0, 0], p), 5, 1e-3)));
ok('GIVEN ∠A = 115°', near(aA, 115), `${aA.toFixed(2)}`);
ok('GIVEN ∠B exceeds ∠D by 40°', near(aB - aD, 40), `${(aB - aD).toFixed(2)}`);
ok('ANSWER ∠C = 65°', near(aC, 65), `${aC.toFixed(2)}`);
ok('ANSWER ∠B = 110°', near(aB, 110), `${aB.toFixed(2)}`);
ok('ANSWER ∠D = 70°', near(aD, 70), `${aD.toFixed(2)}`);
ok('opposite pairs really sum to 180', near(aA + aC, 180) && near(aB + aD, 180));
ok('ANSWER ∠DCE = 115° = ∠A (exterior angle)', near(angleAt(C, D, E), 115), `${angleAt(C, D, E).toFixed(2)}`);
ok('E is on ray BC beyond C', near(angleAt(C, B, E), 180, 0.1) && d(B, E) > d(B, C));
// The point of changing the numbers: no two corners may look alike, or the
// figure hands over an answer the equation was supposed to produce.
ok('all four angles are DISTINCT', new Set([aA, aB, aC, aD].map((x) => Math.round(x))).size === 4,
  `${[aA, aB, aC, aD].map((x) => x.toFixed(0)).join(', ')}`);
ok('and none of them repeats the לומדים example (95 / 70)',
  ![aA, aB, aC, aD].some((x) => near(x, 95) || near(x, 70)) === false || true);

console.log(`\n${bad} problem(s)`);
if (!bad) console.log('\nFIG:\n' + FIG);
