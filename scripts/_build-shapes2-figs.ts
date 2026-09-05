// Figures for the דלתון + תכונות המעגל additions to eg-shapes (שלב 2).
// Validated against validateGeo AND against what each question claims.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const FIGS: Record<string, string> = {
  // teach: a kite. AB = AD = √32, CB = CD = √80 — deliberately NOT a rhombus.
  // AC is the main diagonal (axis of symmetry), it bisects BD at E and is ⊥ to it.
  'teach-kite':
    '{"points":{"A":[0,8],"B":[-4,4],"C":[0,-4],"D":[4,4],"E":[0,4]},"polygons":["ABCD"],' +
    '"segments":[{"s":"AC","accent":true},"BD"],"right":[{"at":"E","from":"A","to":"B"}],' +
    '"ticks":[{"on":"AB","n":1},{"on":"AD","n":1},{"on":"CB","n":2},{"on":"CD","n":2},' +
    '{"on":"BE","n":3},{"on":"ED","n":3}],"width":280}',

  // teach: the parts of a circle — radius, diameter, chord.
  'teach-circle-parts':
    '{"points":{"O":[0,0],"A":[-5,0],"B":[5,0],"C":[-1.7101,4.6985],"D":[4.0958,2.8679]},' +
    '"circles":[{"center":"O","r":5,"on":["A","B","C","D"]}],"segments":["AB",{"s":"OD","accent":true},"CD"],' +
    '"labels":[{"on":"OD","text":"r","accent":true}],"width":300}',

  // teach: the perpendicular from the centre bisects the chord.
  'teach-chord-perp':
    '{"points":{"O":[0,0],"C":[-4,3],"D":[4,3],"M":[0,3]},"circles":[{"center":"O","r":5,"on":["C","D"]}],' +
    '"segments":["CD",{"s":"OM","accent":true},"OC","OD"],"right":[{"at":"M","from":"O","to":"C"}],' +
    '"ticks":[{"on":"CM","n":1},{"on":"MD","n":1}],"width":280}',

  // q: which is always true of a kite's diagonals
  'eg-shp-008':
    '{"points":{"A":[0,8],"B":[-4,4],"C":[0,-4],"D":[4,4]},"polygons":["ABCD"],"segments":["AC","BD"],' +
    '"ticks":[{"on":"AB","n":1},{"on":"AD","n":1},{"on":"CB","n":2},{"on":"CD","n":2}],"width":260}',

  // q: kite area from diagonals 12 and 8
  'eg-shp-009':
    '{"points":{"A":[0,8],"B":[-4,4],"C":[0,-4],"D":[4,4]},"polygons":["ABCD"],"segments":["AC","BD"],' +
    '"labels":[{"on":"AC","text":"12"},{"on":"BD","text":"8"}],"width":260}',

  // q: two radii ⇒ isosceles triangle
  'eg-shp-010':
    '{"points":{"O":[0,0],"A":[-4.3301,2.5],"B":[4.3301,2.5]},"circles":[{"center":"O","r":5,"on":["A","B"]}],' +
    '"segments":["OA","OB","AB"],"ticks":[{"on":"OA","n":1},{"on":"OB","n":1}],"width":280}',

  // q: r = 5, distance from centre to chord = 3 → chord = 8
  'eg-shp-011':
    '{"points":{"O":[0,0],"C":[-4,3],"D":[4,3],"M":[0,3]},"circles":[{"center":"O","r":5,"on":["C","D"]}],' +
    '"segments":["CD",{"s":"OM","accent":true},"OC"],"right":[{"at":"M","from":"O","to":"C"}],' +
    '"labels":[{"on":"OM","text":"3"},{"on":"OC","text":"5"}],"width":280}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}

const ok = (name: string, cond: boolean, got = '') => {
  if (!cond) { bad++; console.log(`❌ claim: ${name} ${got}`); } else console.log(`✅ claim: ${name}`);
};

// ---- the kite really is a kite, and really is NOT a rhombus ----
for (const key of ['teach-kite', 'eg-shp-008', 'eg-shp-009']) {
  const P = parseGeo(FIGS[key]).points;
  ok(`${key}: AB = AD`, Math.abs(d(P.A, P.B) - d(P.A, P.D)) < 1e-9);
  ok(`${key}: CB = CD`, Math.abs(d(P.C, P.B) - d(P.C, P.D)) < 1e-9);
  ok(`${key}: NOT a rhombus (AB ≠ CB)`, Math.abs(d(P.A, P.B) - d(P.C, P.B)) > 0.5,
    `${d(P.A, P.B).toFixed(3)} vs ${d(P.C, P.B).toFixed(3)}`);
  ok(`${key}: AC ⊥ BD`, Math.abs(angleAt([0, 4], P.A, P.B) - 90) < 1e-6);
  ok(`${key}: AC bisects BD`, Math.abs(d(P.B, [0, 4]) - d([0, 4], P.D)) < 1e-9);
}
const K = parseGeo(FIGS['eg-shp-009']).points;
ok('eg-shp-009: AC = 12', Math.abs(d(K.A, K.C) - 12) < 1e-9);
ok('eg-shp-009: BD = 8', Math.abs(d(K.B, K.D) - 8) < 1e-9);
ok('eg-shp-009: area = 48 (the ANSWER)', Math.abs((12 * 8) / 2 - 48) < 1e-9);

// ---- circle parts ----
const C1 = parseGeo(FIGS['teach-circle-parts']).points;
ok('circle-parts: AB is a diameter (passes through O, = 2r)', Math.abs(d(C1.A, C1.B) - 10) < 1e-3 && Math.abs(C1.A[1]) < 1e-9 && Math.abs(C1.B[1]) < 1e-9);
ok('circle-parts: OD is a radius', Math.abs(d(C1.O, C1.D) - 5) < 1e-3);

const C2 = parseGeo(FIGS['teach-chord-perp']).points;
ok('chord-perp: OM ⊥ CD', Math.abs(angleAt(C2.M, C2.O, C2.C) - 90) < 1e-9);
ok('chord-perp: M is the midpoint of CD', Math.abs(d(C2.C, C2.M) - d(C2.M, C2.D)) < 1e-9);

const T = parseGeo(FIGS['eg-shp-010']).points;
ok('eg-shp-010: OA = OB = r (isosceles — the ANSWER)',
  Math.abs(d(T.O, T.A) - 5) < 1e-3 && Math.abs(d(T.O, T.B) - 5) < 1e-3);

const Q = parseGeo(FIGS['eg-shp-011']).points;
ok('eg-shp-011: r = 5', Math.abs(d(Q.O, Q.C) - 5) < 1e-9);
ok('eg-shp-011: distance centre→chord = 3', Math.abs(d(Q.O, Q.M) - 3) < 1e-9);
ok('eg-shp-011: chord CD = 8 (the ANSWER)', Math.abs(d(Q.C, Q.D) - 8) < 1e-9);
ok('eg-shp-011: 3-4-5 closes', Math.abs(Math.sqrt(25 - 9) - 4) < 1e-9);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_shapes2-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_shapes2-figs.json'); }
