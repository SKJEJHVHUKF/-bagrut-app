// Figures for the escalation round: the three rung inversions and the four
// hard-questions-that-restate-a-lower-rung.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// thales-003: AB=12, AC=9, BC=14 ⇒ bisector foot at BD=8, DC=6; M,N midpoints ⇒ MN=7
const A3: Pt = [9.25, r4(Math.sqrt(144 - 9.25 ** 2))];
const M3: Pt = [r4(A3[0] / 2), r4(A3[1] / 2)];
const N3: Pt = [r4((A3[0] + 14) / 2), r4(A3[1] / 2)];

// thales-007: AB=15, AC=10, BC=12 ⇒ bisector splits 3:2 ⇒ BD=7.2
const A7: Pt = [r4(269 / 24), r4(Math.sqrt(225 - (269 / 24) ** 2))];

// mth-008: parallelogram, E and F on diagonal BD with BE = DF = 2.5
const t = 2.5 / Math.sqrt(72);
const E8: Pt = [r4(10 - 6 * t), r4(6 * t)];
const F8: Pt = [r4(4 + 6 * t), r4(6 - 6 * t)];

const FIGS: Record<string, string> = {
  // bisector AND midsegment on one triangle — two theorems, three outputs
  'eg-sub-thales-003':
    `{"points":{"A":[${A3[0]},${A3[1]}],"B":[0,0],"C":[14,0],"D":[8,0],"M":[${M3[0]},${M3[1]}],"N":[${N3[0]},${N3[1]}]},` +
    '"polygons":["ABC"],"segments":[{"s":"AD","accent":true},{"s":"MN","accent":true}],' +
    '"ticks":[{"on":"AM","n":1},{"on":"MB","n":1},{"on":"AN","n":2},{"on":"NC","n":2}],' +
    '"angles":[{"at":"A","from":"B","to":"D","n":3},{"at":"A","from":"D","to":"C","n":3}],' +
    '"labels":[{"on":"AB","text":"12"},{"on":"AC","text":"9"},{"on":"BC","text":"14"}],"width":360}',

  // bisector + AREA ratio (same height) — a different toolset from "find DC"
  'eg-sub-thales-007':
    `{"points":{"A":[${A7[0]},${A7[1]}],"B":[0,0],"C":[12,0],"D":[7.2,0]},"polygons":["ABC"],` +
    '"segments":[{"s":"AD","accent":true}],' +
    '"angles":[{"at":"A","from":"B","to":"D","n":1},{"at":"A","from":"D","to":"C","n":1}],' +
    '"labels":[{"on":"AB","text":"15"},{"on":"AC","text":"10"}],"width":320}',

  // altitude to the hypotenuse, run BACKWARDS: CH and AH given, HB and AB asked
  'eg-sub-sim-003':
    '{"points":{"A":[0,0],"B":[13,0],"H":[4,0],"C":[4,6]},"polygons":["ABC"],' +
    '"segments":[{"s":"CH","accent":true}],' +
    '"right":[{"at":"C","from":"A","to":"B"},{"at":"H","from":"C","to":"A"}],' +
    '"labels":[{"on":"AH","text":"4"},{"on":"CH","text":"6"}],"width":340}',

  // two chained congruences inside a parallelogram
  'eg-mth-008':
    `{"points":{"A":[0,0],"B":[10,0],"C":[14,6],"D":[4,6],"E":[${E8[0]},${E8[1]}],"F":[${F8[0]},${F8[1]}]},` +
    '"polygons":["ABCD",{"s":"AECF","accent":true}],"segments":["BD"],' +
    '"parallel":[{"on":"AB","n":1},{"on":"DC","n":1}],' +
    '"ticks":[{"on":"BE","n":1},{"on":"DF","n":1}],"width":340}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}
const ok = (n: string, c: boolean, got = '') => { if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`); };

const P3 = parseGeo(FIGS['eg-sub-thales-003']).points;
ok('thales-003: AB=12, AC=9, BC=14', Math.abs(d(P3.A, P3.B) - 12) < 1e-2 && Math.abs(d(P3.A, P3.C) - 9) < 1e-2 && Math.abs(d(P3.B, P3.C) - 14) < 1e-9);
ok('thales-003: AD bisects ∠A', Math.abs(angleAt(P3.A, P3.B, P3.D) - angleAt(P3.A, P3.D, P3.C)) < 0.1,
  `${angleAt(P3.A, P3.B, P3.D).toFixed(2)} vs ${angleAt(P3.A, P3.D, P3.C).toFixed(2)}`);
ok('thales-003: BD=8, DC=6 (ANSWERS)', Math.abs(d(P3.B, P3.D) - 8) < 1e-9 && Math.abs(d(P3.D, P3.C) - 6) < 1e-9);
ok('thales-003: M,N are midpoints and MN=7 (ANSWER)',
  Math.abs(d(P3.A, P3.M) - d(P3.M, P3.B)) < 1e-2 && Math.abs(d(P3.A, P3.N) - d(P3.N, P3.C)) < 1e-2 && Math.abs(d(P3.M, P3.N) - 7) < 1e-2,
  `MN=${d(P3.M, P3.N).toFixed(3)}`);

const P7 = parseGeo(FIGS['eg-sub-thales-007']).points;
ok('thales-007: AB=15, AC=10', Math.abs(d(P7.A, P7.B) - 15) < 1e-2 && Math.abs(d(P7.A, P7.C) - 10) < 1e-2);
ok('thales-007: AD bisects ∠A, and BD:DC = 3:2', Math.abs(angleAt(P7.A, P7.B, P7.D) - angleAt(P7.A, P7.D, P7.C)) < 0.1 && Math.abs(d(P7.B, P7.D) / d(P7.D, P7.C) - 1.5) < 1e-3);
ok('thales-007: areas 30 and 20 split 50 in the ratio 3:2', Math.abs(50 * 0.6 - 30) < 1e-9 && Math.abs(50 * 0.4 - 20) < 1e-9);

const Ps = parseGeo(FIGS['eg-sub-sim-003']).points;
ok('sim-003: right angle at C', Math.abs(angleAt(Ps.C, Ps.A, Ps.B) - 90) < 1e-6);
ok('sim-003: CH ⊥ AB, AH=4, CH=6', Math.abs(angleAt(Ps.H, Ps.C, Ps.A) - 90) < 1e-6 && Math.abs(d(Ps.A, Ps.H) - 4) < 1e-9 && Math.abs(d(Ps.C, Ps.H) - 6) < 1e-9);
ok('sim-003: HB=9 and AB=13 (ANSWERS), and CH² = AH·HB', Math.abs(d(Ps.H, Ps.B) - 9) < 1e-9 && Math.abs(d(Ps.A, Ps.B) - 13) < 1e-9 && Math.abs(36 - 4 * 9) < 1e-9);

const Pm = parseGeo(FIGS['eg-mth-008']).points;
ok('mth-008: ABCD is a parallelogram', Math.abs(d(Pm.A, Pm.B) - d(Pm.D, Pm.C)) < 1e-9);
ok('mth-008: E and F on BD with BE = DF (the GIVEN)',
  Math.abs(d(Pm.B, Pm.E) - d(Pm.D, Pm.F)) < 1e-3 &&
  Math.abs((Pm.E[0] - Pm.B[0]) * (Pm.D[1] - Pm.B[1]) - (Pm.E[1] - Pm.B[1]) * (Pm.D[0] - Pm.B[0])) < 1e-3);
ok('mth-008: AECF really is a parallelogram (the CONCLUSION)',
  Math.abs(d(Pm.A, Pm.E) - d(Pm.C, Pm.F)) < 1e-3 && Math.abs(d(Pm.E, Pm.C) - d(Pm.F, Pm.A)) < 1e-3);
ok('mth-008: AECF is NOT degenerate (a real quadrilateral)', d(Pm.A, Pm.C) > 1 && d(Pm.E, Pm.F) > 1);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_geo7-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_geo7-figs.json'); }
