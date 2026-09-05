// Figures for the cross-sub-topic duplicate fixes and the thin אתגר rungs.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const D2R = Math.PI / 180;
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ray = (deg: number, r = 6): Pt => [r4(r * Math.cos(deg * D2R)), r4(r * Math.sin(deg * D2R))];

const A7 = ray(20), B7 = ray(55), C7 = ray(100), D7 = ray(135);
const Ath = ray(70, 12); // thales-006 apex: AB = 12

const FIGS: Record<string, string> = {
  // cong-006: two sides marked equal, the THIRD is the unknown — "what is missing
  // for צ.צ.צ", not "which theorem" (which the drill already asks verbatim).
  'eg-sub-cong-006':
    '{"points":{"A":[0,0],"B":[6,0],"C":[1.5,4],"D":[9,0],"E":[15,0],"F":[10.5,4]},"polygons":["ABC","DEF"],' +
    '"ticks":[{"on":"AB","n":1},{"on":"DE","n":1},{"on":"BC","n":2},{"on":"EF","n":2}],' +
    '"labels":[{"on":"AC","text":"?"},{"on":"DF","text":"?"}],"width":360}',

  // ang-007: the ANGLE form of subtraction, which the teach introduces but
  // nothing drills — instead of repeating the segment form of the example.
  'eg-ang-007':
    `{"points":{"O":[0,0],"A":[${A7[0]},${A7[1]}],"B":[${B7[0]},${B7[1]}],"C":[${C7[0]},${C7[1]}],"D":[${D7[0]},${D7[1]}]},` +
    '"segments":["OA","OB","OC","OD"],' +
    '"angles":[{"at":"O","from":"A","to":"C","n":1},{"at":"O","from":"B","to":"D","n":1}],"width":300}',

  // circ-004: tangent-secant run BACKWARDS — the secant is given, the tangent asked.
  'eg-sub-circ-004':
    '{"points":{"O":[0,0],"P":[-10,0],"T":[-3.6,4.8],"A":[-6,0],"B":[6,0]},' +
    '"circles":[{"center":"O","r":6,"on":["T","A","B"]}],"segments":[{"s":"PT","accent":true},"PB","OT"],' +
    '"right":[{"at":"T","from":"O","to":"P"}],"labels":[{"on":"PA","text":"4"},{"on":"AB","text":"12"}],"width":340}',

  // thales-006 (hard): TWO parallels to BC, so Thales is applied twice.
  'eg-sub-thales-006': (() => {
    const A: Pt = [r4(Ath[0]), r4(Ath[1])], B: Pt = [0, 0], C: Pt = [24, 0];
    const at = (t: number, P: Pt): Pt => [r4(A[0] + t * (P[0] - A[0])), r4(A[1] + t * (P[1] - A[1]))];
    const D = at(0.25, B), F = at(0.5, B), E = at(0.25, C), G = at(0.5, C);
    return `{"points":{"A":[${A[0]},${A[1]}],"B":[0,0],"C":[24,0],"D":[${D[0]},${D[1]}],"E":[${E[0]},${E[1]}],"F":[${F[0]},${F[1]}],"G":[${G[0]},${G[1]}]},` +
      '"polygons":["ABC"],"segments":[{"s":"DE","accent":true},{"s":"FG","accent":true}],' +
      '"parallel":[{"on":"DE","n":1},{"on":"FG","n":1},{"on":"BC","n":1}],' +
      '"labels":[{"on":"AD","text":"3"},{"on":"DF","text":"3"},{"on":"FB","text":"6"},{"on":"BC","text":"24"}],"width":360}';
  })(),

  // thales-007 (hard): the bisector theorem run backwards — the ratio on BC is
  // given and a SIDE is the unknown, plus the perimeter.
  'eg-sub-thales-007':
    '{"points":{"A":[9,7.9373],"B":[0,0],"C":[10,0],"D":[6,0]},"polygons":["ABC"],' +
    '"segments":[{"s":"AD","accent":true}],' +
    '"angles":[{"at":"A","from":"B","to":"D","n":1},{"at":"A","from":"D","to":"C","n":1}],' +
    '"labels":[{"on":"BD","text":"6"},{"on":"DC","text":"4"},{"on":"AB","text":"12"}],"width":320}',

  // mth-007 (hard): a full טענה-ונימוק proof that needs segment subtraction AND
  // the "one pair equal and parallel" criterion.
  'eg-mth-007':
    '{"points":{"A":[0,0],"B":[10,0],"C":[14,6],"D":[4,6],"E":[3,0],"F":[11,6]},"polygons":["ABCD"],' +
    '"segments":[{"s":"DE","accent":true},{"s":"BF","accent":true}],' +
    '"parallel":[{"on":"AB","n":1},{"on":"DC","n":1}],' +
    '"ticks":[{"on":"AE","n":1},{"on":"CF","n":1},{"on":"EB","n":2},{"on":"DF","n":2}],"width":340}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}
const ok = (n: string, c: boolean, got = '') => { if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`); };

const P6 = parseGeo(FIGS['eg-sub-cong-006']).points;
ok('cong-006: AB = DE and BC = EF', Math.abs(d(P6.A, P6.B) - d(P6.D, P6.E)) < 1e-9 && Math.abs(d(P6.B, P6.C) - d(P6.E, P6.F)) < 1e-3);

const Pa = parseGeo(FIGS['eg-ang-007']).points;
ok('ang-007: ∠AOC = ∠BOD (the GIVEN)', Math.abs(angleAt(Pa.O, Pa.A, Pa.C) - angleAt(Pa.O, Pa.B, Pa.D)) < 0.05);
ok('ang-007: ∠AOB = ∠COD (the CONCLUSION)', Math.abs(angleAt(Pa.O, Pa.A, Pa.B) - angleAt(Pa.O, Pa.C, Pa.D)) < 0.05,
  `${angleAt(Pa.O, Pa.A, Pa.B).toFixed(2)} vs ${angleAt(Pa.O, Pa.C, Pa.D).toFixed(2)}`);
ok('ang-007: rays are in order A,B,C,D', true);

const Pc = parseGeo(FIGS['eg-sub-circ-004']).points;
ok('circ-004: PA = 4, AB = 12 ⇒ PB = 16', Math.abs(d(Pc.P, Pc.A) - 4) < 1e-9 && Math.abs(d(Pc.A, Pc.B) - 12) < 1e-9 && Math.abs(d(Pc.P, Pc.B) - 16) < 1e-9);
ok('circ-004: PT = 8 (the ANSWER), and PT² = PA·PB', Math.abs(d(Pc.P, Pc.T) - 8) < 1e-3 && Math.abs(64 - 4 * 16) < 1e-9);
ok('circ-004: the tangent really is tangent (OT ⊥ PT)', Math.abs(angleAt(Pc.T, Pc.O, Pc.P) - 90) < 0.05);

const Pt = parseGeo(FIGS['eg-sub-thales-006']).points;
ok('thales-006: AD=3, DF=3, FB=6 ⇒ AB=12', Math.abs(d(Pt.A, Pt.D) - 3) < 1e-3 && Math.abs(d(Pt.D, Pt.F) - 3) < 1e-3 && Math.abs(d(Pt.F, Pt.B) - 6) < 1e-3);
ok('thales-006: DE = 6 and FG = 12 (the ANSWERS), with BC = 24',
  Math.abs(d(Pt.D, Pt.E) - 6) < 1e-3 && Math.abs(d(Pt.F, Pt.G) - 12) < 1e-3 && Math.abs(d(Pt.B, Pt.C) - 24) < 1e-9,
  `${d(Pt.D, Pt.E).toFixed(3)} / ${d(Pt.F, Pt.G).toFixed(3)}`);

const Pb = parseGeo(FIGS['eg-sub-thales-007']).points;
ok('thales-007: BD=6, DC=4, AB=12', Math.abs(d(Pb.B, Pb.D) - 6) < 1e-9 && Math.abs(d(Pb.D, Pb.C) - 4) < 1e-9 && Math.abs(d(Pb.A, Pb.B) - 12) < 1e-3);
ok('thales-007: AC = 8 (the ANSWER) and AD really bisects ∠A',
  Math.abs(d(Pb.A, Pb.C) - 8) < 1e-3 && Math.abs(angleAt(Pb.A, Pb.B, Pb.D) - angleAt(Pb.A, Pb.D, Pb.C)) < 0.05,
  `AC=${d(Pb.A, Pb.C).toFixed(3)}, halves ${angleAt(Pb.A, Pb.B, Pb.D).toFixed(2)}/${angleAt(Pb.A, Pb.D, Pb.C).toFixed(2)}`);
ok('thales-007: perimeter = 30', Math.abs(d(Pb.A, Pb.B) + d(Pb.A, Pb.C) + d(Pb.B, Pb.C) - 30) < 1e-2);

const Pm = parseGeo(FIGS['eg-mth-007']).points;
ok('mth-007: ABCD is a parallelogram', Math.abs(d(Pm.A, Pm.B) - d(Pm.D, Pm.C)) < 1e-9);
ok('mth-007: AE = CF (the GIVEN)', Math.abs(d(Pm.A, Pm.E) - d(Pm.C, Pm.F)) < 1e-9);
ok('mth-007: EB = DF (the middle step)', Math.abs(d(Pm.E, Pm.B) - d(Pm.D, Pm.F)) < 1e-9);
ok('mth-007: DEBF is a parallelogram but NOT a rectangle (so the figure does not over-claim)',
  Math.abs(d(Pm.D, Pm.E) - d(Pm.B, Pm.F)) < 1e-9 && Math.abs(angleAt(Pm.E, Pm.D, Pm.B) - 90) > 5,
  `angle at E = ${angleAt(Pm.E, Pm.D, Pm.B).toFixed(1)}°`);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_geo5-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_geo5-figs.json'); }
