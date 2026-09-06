// The last two thin rungs: eg-thales ביסוס and eg-congruence אתגר, both at two
// questions. Both new questions deliberately avoid shapes already used —
// eg-sub-thales-004 already does "prove DE ∥ BC then find DE", and
// eg-method.lesson[3] already does the AD = AE isosceles congruence chain.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ── thales, GENERAL form: three parallels cutting two transversals ───────────
// AB = 6, BC = 10 on the first; DE = 9 on the second ⇒ EF = 15, DF = 24.
const A: Pt = [0, 0], B: Pt = [0, -6], C: Pt = [0, -16];
const run = Math.sqrt(5) / 2; // horizontal run per unit of drop, so DE = 9 for a drop of 6
const D: Pt = [8, 0];
const E: Pt = [r4(8 + 6 * run), -6];
const F: Pt = [r4(8 + 16 * run), -16];

// ── congruence: two points equidistant from A and B, on opposite sides ───────
// PA = PB = 10, QA = QB = 17, AB = 16 ⇒ PM = 6, QM = 15, PQ = 21.
const Ac: Pt = [-8, 0], Bc: Pt = [8, 0], M: Pt = [0, 0], P: Pt = [0, 6], Q: Pt = [0, -15];

const FIGS: Record<string, string> = {
  'eg-sub-thales-009':
    `{"points":{"A":[0,0],"B":[0,-6],"C":[0,-16],"D":[8,0],"E":[${E}],"F":[${F}]},` +
    '"segments":["AC","DF","AD","BE","CF"],' +
    '"parallel":[{"on":"AD","n":1},{"on":"BE","n":1},{"on":"CF","n":1}],' +
    '"labels":[{"on":"AB","text":"6"},{"on":"BC","text":"10"},{"on":"DE","text":"9"}],"width":360}',

  'eg-sub-cong-013':
    '{"points":{"A":[-8,0],"B":[8,0],"M":[0,0],"P":[0,6],"Q":[0,-15]},' +
    '"segments":["AB","PA","PB","QA","QB",{"s":"PQ","accent":true}],' +
    '"ticks":[{"on":"PA","n":1},{"on":"PB","n":1},{"on":"QA","n":2},{"on":"QB","n":2}],' +
    '"labels":[{"on":"PA","text":"10"},{"on":"QA","text":"17"},{"on":"AB","text":"16"}],"width":300}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}
const ok = (n: string, c: boolean, got = '') => {
  if (!c) { bad++; console.log(`❌ claim: ${n}  ${got}`); } else console.log(`✅ claim: ${n}`);
};
const near = (a: number, b: number, t = 0.01) => Math.abs(a - b) < t;

console.log('\n— thales, three parallels —');
ok('the three lines AD, BE, CF really are parallel to each other',
  near((E[1] - B[1]) * (D[0] - A[0]) - (E[0] - B[0]) * (D[1] - A[1]), 0) &&
  near((F[1] - C[1]) * (D[0] - A[0]) - (F[0] - C[0]) * (D[1] - A[1]), 0));
ok('A, B, C are collinear and so are D, E, F',
  A[0] === B[0] && B[0] === C[0] && near(angleAt(E, D, F), 180, 0.1));
ok('GIVEN AB = 6, BC = 10, DE = 9', near(d(A, B), 6) && near(d(B, C), 10) && near(d(D, E), 9), `${d(D, E).toFixed(4)}`);
ok('ANSWER EF = 15', near(d(E, F), 15), `${d(E, F).toFixed(4)}`);
ok('ANSWER DF = 24', near(d(D, F), 24), `${d(D, F).toFixed(4)}`);
ok('the proportion behind it: AB/BC = DE/EF', near(6 / 10, d(D, E) / d(E, F)));

console.log('\n— congruence, equidistant points —');
ok('GIVEN PA = PB = 10', near(d(P, Ac), 10) && near(d(P, Bc), 10));
ok('GIVEN QA = QB = 17', near(d(Q, Ac), 17) && near(d(Q, Bc), 17));
ok('GIVEN AB = 16', near(d(Ac, Bc), 16));
ok('P and Q are on OPPOSITE sides of AB', P[1] * Q[1] < 0);
ok('CONCLUSION PQ ⊥ AB and M is the midpoint', near(angleAt(M, P, Ac), 90) && near(d(Ac, M), d(M, Bc)));
ok('ANSWER PM = 6 and QM = 15 (6-8-10 and 8-15-17)', near(d(P, M), 6) && near(d(Q, M), 15));
ok('ANSWER PQ = PM + QM = 21', near(d(P, Q), 21), `${d(P, Q).toFixed(4)}`);

console.log(`\n${bad} problem(s)`);
if (!bad) for (const [k, v] of Object.entries(FIGS)) console.log(`\n${k}:\n${v}`);
