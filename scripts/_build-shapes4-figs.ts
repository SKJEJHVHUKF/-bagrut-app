// Figures for the eg-shapes progression rewrite: 7 questions that duplicated
// their own lesson example are re-aimed, 3 אתגר questions are added, and the
// circle step gains זווית מרכזית / זווית היקפית (names only, no theorems).

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const D2R = Math.PI / 180;
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// isosceles with base angle 64° ⇒ apex 52°
const legHalf = 5;
const apexY = r4(legHalf * Math.tan(64 * D2R));

// right triangle whose median to the hypotenuse is 9 ⇒ hypotenuse 18
const RT = { c: [0, 0] as Pt, a: [16.9706, 0] as Pt, b: [0, 6] as Pt }; // 18² = 16.9706² + 6²

const FIGS: Record<string, string> = {
  // ---- teach: central vs inscribed angle, NAMES ONLY ----
  'teach-circle-angles':
    '{"points":{"O":[0,0],"A":[-4.3301,-2.5],"B":[4.3301,-2.5],"C":[0,5]},' +
    '"circles":[{"center":"O","r":5,"on":["A","B","C"]}],"segments":["OA","OB","CA","CB"],' +
    '"angles":[{"at":"O","from":"A","to":"B","n":2},{"at":"C","from":"A","to":"B","n":1}],"width":300}',

  // ---- חימום, re-aimed ----
  // base angle given, apex asked (the example asks the other direction)
  'eg-shp-001': `{"points":{"A":[0,${apexY}],"B":[-${legHalf},0],"C":[${legHalf},0]},"polygons":["ABC"],` +
    '"ticks":[{"on":"AB","n":1},{"on":"AC","n":1}],' +
    `"angles":[{"at":"B","from":"A","to":"C","label":"64°"},{"at":"C","from":"A","to":"B","label":"64°"},{"at":"A","from":"B","to":"C","label":"?"}],"width":260}`,
  // median to the hypotenuse given, hypotenuse asked
  'eg-shp-002': `{"points":{"C":[0,0],"A":[${RT.a[0]},0],"B":[0,6],"M":[${r4(RT.a[0] / 2)},3]},"polygons":["ABC"],` +
    '"segments":[{"s":"CM","accent":true}],"right":[{"at":"C","from":"A","to":"B"}],' +
    '"ticks":[{"on":"AM","n":1},{"on":"MB","n":1}],"labels":[{"on":"CM","text":"9","accent":true}],"width":300}',
  // rectangle: Pythagoras on the sides (the example asks about half a diagonal)
  'eg-shp-007':
    '{"points":{"A":[0,0],"B":[8,0],"C":[8,6],"D":[0,6]},"polygons":["ABCD"],"segments":[{"s":"AC","accent":true}],' +
    '"right":[{"at":"B","from":"A","to":"C"}],"labels":[{"on":"AB","text":"8"},{"on":"BC","text":"6"}],"width":280}',

  // ---- ביסוס, re-aimed ----
  // centroid: the 2/3 part given, the whole median asked
  'eg-shp-003':
    '{"points":{"A":[0,15],"B":[-6,0],"C":[6,0],"D":[0,0],"E":[3,7.5],"M":[0,5]},"polygons":["ABC"],' +
    '"segments":[{"s":"AD","accent":true},"BE"],"ticks":[{"on":"BD","n":1},{"on":"DC","n":1}],' +
    '"labels":[{"on":"AM","text":"10","accent":true}],"width":280}',
  // trapezoid: midsegment given, the far base asked
  // bases 9 (top) and 21 (bottom) ⇒ midsegment 15, drawn to those exact lengths
  'eg-shp-004':
    '{"points":{"A":[0,0],"B":[21,0],"C":[15,7],"D":[6,7],"E":[3,3.5],"F":[18,3.5]},"polygons":["ABCD"],' +
    '"segments":[{"s":"EF","accent":true}],"parallel":[{"on":"AB","n":1},{"on":"DC","n":1}],' +
    '"labels":[{"on":"DC","text":"9"},{"on":"EF","text":"15","accent":true},{"on":"AB","text":"?"}],"width":340}',
  // area: a median halves, then a ratio along it — two steps, not one
  'eg-shp-005':
    '{"points":{"A":[2,12],"B":[-6,0],"C":[6,0],"D":[0,0],"E":[0.5,3]},"polygons":["ABC"],' +
    '"segments":["AD",{"s":"BE","accent":true}],"ticks":[{"on":"BD","n":1},{"on":"DC","n":1}],' +
    '"labels":[{"on":"AE","text":"3"},{"on":"ED","text":"1"}],"width":300}',
  // circle: chord and its distance given, the RADIUS asked (a third direction)
  'eg-shp-011':
    '{"points":{"O":[0,0],"A":[-8,-6],"B":[8,-6],"M":[0,-6]},"circles":[{"center":"O","r":10,"on":["A","B"]}],' +
    '"segments":["AB",{"s":"OM","accent":true},{"s":"OA","accent":true}],"right":[{"at":"M","from":"O","to":"A"}],' +
    '"labels":[{"on":"AB","text":"16"},{"on":"OM","text":"6","accent":true}],"width":300}',

  // ---- אתגר, new ----
  // kite: ⊥ bisection ⇒ two Pythagoras ⇒ the long diagonal ⇒ area
  'eg-shp-012':
    '{"points":{"A":[0,6],"B":[-8,0],"C":[0,-15],"D":[8,0],"E":[0,0]},"polygons":["ABCD"],' +
    '"segments":[{"s":"AC","accent":true},"BD"],"right":[{"at":"E","from":"A","to":"B"}],' +
    '"ticks":[{"on":"AB","n":1},{"on":"AD","n":1},{"on":"CB","n":2},{"on":"CD","n":2}],' +
    '"labels":[{"on":"AB","text":"10"},{"on":"CB","text":"17"},{"on":"BD","text":"16"}],"width":300}',
  // trapezoid split by its own midsegment into two trapezoids
  'eg-shp-013':
    '{"points":{"A":[0,0],"B":[20,0],"C":[15,8],"D":[3,8],"E":[1.5,4],"F":[17.5,4]},"polygons":["ABCD"],' +
    '"segments":[{"s":"EF","accent":true}],"parallel":[{"on":"AB","n":1},{"on":"DC","n":1}],' +
    '"labels":[{"on":"AB","text":"20"},{"on":"DC","text":"12"}],"width":340}',
  // two parallel chords on OPPOSITE sides of the centre — the trap is same-side
  'eg-shp-014':
    '{"points":{"O":[0,0],"A":[-12,5],"B":[12,5],"C":[-5,-12],"D":[5,-12],"M":[0,5],"N":[0,-12]},' +
    '"circles":[{"center":"O","r":13,"on":["A","B","C","D"]}],' +
    '"segments":["AB","CD",{"s":"MN","dashed":true,"accent":true},"OA","OC"],' +
    '"right":[{"at":"M","from":"O","to":"A"},{"at":"N","from":"O","to":"C"}],' +
    '"parallel":[{"on":"AB","n":1},{"on":"CD","n":1}],' +
    '"labels":[{"on":"AB","text":"24"},{"on":"CD","text":"10"}],"width":320}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}

const ok = (n: string, c: boolean, got = '') => { if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`); };

const P1 = parseGeo(FIGS['eg-shp-001']).points;
ok('001: base angles are 64°', Math.abs(angleAt(P1.B, P1.A, P1.C) - 64) < 0.05);
ok('001: apex = 52° (the ANSWER)', Math.abs(angleAt(P1.A, P1.B, P1.C) - 52) < 0.05, `${angleAt(P1.A, P1.B, P1.C).toFixed(2)}`);

const P2 = parseGeo(FIGS['eg-shp-002']).points;
ok('002: right angle at C', Math.abs(angleAt(P2.C, P2.A, P2.B) - 90) < 1e-6);
ok('002: median CM = 9', Math.abs(d(P2.C, P2.M) - 9) < 1e-3, d(P2.C, P2.M).toFixed(4));
ok('002: hypotenuse = 18 (the ANSWER)', Math.abs(d(P2.A, P2.B) - 18) < 1e-3, d(P2.A, P2.B).toFixed(4));

const P7 = parseGeo(FIGS['eg-shp-007']).points;
ok('007: sides 8 and 6', Math.abs(d(P7.A, P7.B) - 8) < 1e-9 && Math.abs(d(P7.B, P7.C) - 6) < 1e-9);
ok('007: diagonal = 10 (the ANSWER)', Math.abs(d(P7.A, P7.C) - 10) < 1e-9);

const P3 = parseGeo(FIGS['eg-shp-003']).points;
ok('003: AM = 10', Math.abs(d(P3.A, P3.M) - 10) < 1e-9);
ok('003: AD = 15 (the ANSWER)', Math.abs(d(P3.A, P3.D) - 15) < 1e-9);
ok('003: MD = 5, and AM:MD = 2:1', Math.abs(d(P3.M, P3.D) - 5) < 1e-9);
ok('003: M lies on median BE', Math.abs((P3.M[0] - P3.B[0]) * (P3.E[1] - P3.B[1]) - (P3.M[1] - P3.B[1]) * (P3.E[0] - P3.B[0])) < 1e-6);

const P4 = parseGeo(FIGS['eg-shp-004']).points;
ok('004: short base = 9 and midsegment = 15, as labelled',
  Math.abs(d(P4.D, P4.C) - 9) < 1e-9 && Math.abs(d(P4.E, P4.F) - 15) < 1e-9,
  `${d(P4.D, P4.C).toFixed(3)} / ${d(P4.E, P4.F).toFixed(3)}`);
ok('004: long base = 21 (the ANSWER)', Math.abs(d(P4.A, P4.B) - 21) < 1e-9);
ok('004: EF joins the leg midpoints', Math.abs(d(P4.A, P4.E) - d(P4.E, P4.D)) < 1e-6 && Math.abs(d(P4.B, P4.F) - d(P4.F, P4.C)) < 1e-6);

const P5 = parseGeo(FIGS['eg-shp-005']).points;
ok('005: AD is a median (BD = DC)', Math.abs(d(P5.B, P5.D) - d(P5.D, P5.C)) < 1e-9);
ok('005: AE:ED = 3:1', Math.abs(d(P5.A, P5.E) / d(P5.E, P5.D) - 3) < 1e-6, (d(P5.A, P5.E) / d(P5.E, P5.D)).toFixed(4));

const P11 = parseGeo(FIGS['eg-shp-011']).points;
ok('011: chord 16, distance 6', Math.abs(d(P11.A, P11.B) - 16) < 1e-9 && Math.abs(d(P11.O, P11.M) - 6) < 1e-9);
ok('011: radius = 10 (the ANSWER)', Math.abs(d(P11.O, P11.A) - 10) < 1e-9);

const P12 = parseGeo(FIGS['eg-shp-012']).points;
ok('012: AB = AD = 10, CB = CD = 17', Math.abs(d(P12.A, P12.B) - 10) < 1e-9 && Math.abs(d(P12.C, P12.B) - 17) < 1e-9 && Math.abs(d(P12.A, P12.D) - 10) < 1e-9 && Math.abs(d(P12.C, P12.D) - 17) < 1e-9);
ok('012: BD = 16', Math.abs(d(P12.B, P12.D) - 16) < 1e-9);
ok('012: AC = 21 (the ANSWER)', Math.abs(d(P12.A, P12.C) - 21) < 1e-9);
ok('012: area = 168', Math.abs((21 * 16) / 2 - 168) < 1e-9);

const P13 = parseGeo(FIGS['eg-shp-013']).points;
ok('013: bases 20 and 12, height 8', Math.abs(d(P13.A, P13.B) - 20) < 1e-9 && Math.abs(d(P13.D, P13.C) - 12) < 1e-9 && Math.abs(P13.D[1] - P13.A[1] - 8) < 1e-9);
ok('013: midsegment = 16, at half height', Math.abs(d(P13.E, P13.F) - 16) < 1e-9 && Math.abs(P13.E[1] - 4) < 1e-9);
ok('013: the two areas are 56 and 72, summing to the whole 128',
  Math.abs(((12 + 16) / 2) * 4 - 56) < 1e-9 && Math.abs(((16 + 20) / 2) * 4 - 72) < 1e-9 && Math.abs(((20 + 12) / 2) * 8 - 128) < 1e-9);

const P14 = parseGeo(FIGS['eg-shp-014']).points;
ok('014: chords 24 and 10', Math.abs(d(P14.A, P14.B) - 24) < 1e-9 && Math.abs(d(P14.C, P14.D) - 10) < 1e-9);
ok('014: both on the circle r = 13', Math.abs(d(P14.O, P14.A) - 13) < 1e-9 && Math.abs(d(P14.O, P14.C) - 13) < 1e-9);
ok('014: distances 5 and 12, on OPPOSITE sides', Math.abs(d(P14.O, P14.M) - 5) < 1e-9 && Math.abs(d(P14.O, P14.N) - 12) < 1e-9 && P14.M[1] * P14.N[1] < 0);
ok('014: gap = 17 (the ANSWER); the same-side trap gives 7', Math.abs(d(P14.M, P14.N) - 17) < 1e-9);

const CA = parseGeo(FIGS['teach-circle-angles']).points;
ok('circle-angles: A, B, C all on the circle', [CA.A, CA.B, CA.C].every((p) => Math.abs(d(CA.O, p) - 5) < 1e-3));
ok('circle-angles: the central angle is twice the inscribed one (true, though not taught here)',
  Math.abs(angleAt(CA.O, CA.A, CA.B) - 2 * angleAt(CA.C, CA.A, CA.B)) < 0.1,
  `${angleAt(CA.O, CA.A, CA.B).toFixed(1)}° vs 2×${angleAt(CA.C, CA.A, CA.B).toFixed(1)}°`);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_shapes4-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_shapes4-figs.json'); }
