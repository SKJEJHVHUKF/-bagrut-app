// The 8 remaining figures in eg-shapes: 5 `teach` sections + 3 drills.
// Every figure validated, and every claim the surrounding text makes re-derived.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---- drill-003: a point equidistant from the three SIDES -------------------
// The bisectors are deliberately NOT drawn — that is the answer.
const A3: Pt = [0, 0], B3: Pt = [12, 0], C3: Pt = [3, 8];
const a3 = d(B3, C3), b3 = d(C3, A3), c3 = d(A3, B3), s3 = a3 + b3 + c3;
const P3: Pt = [r4((a3 * A3[0] + b3 * B3[0] + c3 * C3[0]) / s3), r4((a3 * A3[1] + b3 * B3[1] + c3 * C3[1]) / s3)];
/** foot of the perpendicular from p to the line through u,v */
const foot = (p: Pt, u: Pt, v: Pt): Pt => {
  const dx = v[0] - u[0], dy = v[1] - u[1];
  const t = ((p[0] - u[0]) * dx + (p[1] - u[1]) * dy) / (dx * dx + dy * dy);
  return [r4(u[0] + t * dx), r4(u[1] + t * dy)];
};
const F1 = foot(P3, A3, B3), F2 = foot(P3, C3, A3), F3 = foot(P3, B3, C3);

const FIGS: Record<string, string> = {
  // teach step0 — isosceles: equal legs, equal base angles, and the one segment
  // that is height + median + bisector at once.
  'teach-isosceles':
    '{"points":{"A":[0,10],"B":[-4,0],"C":[4,0],"D":[0,0]},"polygons":["ABC"],"segments":[{"s":"AD","accent":true}],' +
    '"right":[{"at":"D","from":"A","to":"B"}],"ticks":[{"on":"AB","n":1},{"on":"AC","n":1},{"on":"BD","n":2},{"on":"DC","n":2}],' +
    '"angles":[{"at":"B","from":"A","to":"C","n":1},{"at":"C","from":"A","to":"B","n":1}],"width":260}',

  // teach step1 — the median to the hypotenuse equals half of it: AM = MB = CM.
  'teach-median-hyp':
    '{"points":{"C":[0,0],"A":[24,0],"B":[0,10],"M":[12,5]},"polygons":["ABC"],"segments":[{"s":"CM","accent":true}],' +
    '"right":[{"at":"C","from":"A","to":"B"}],"ticks":[{"on":"AM","n":1},{"on":"MB","n":1},{"on":"CM","n":1}],"width":320}',

  // teach step2 — the three medians meet, and the meeting point cuts each 2:1.
  'teach-centroid':
    '{"points":{"A":[0,12],"B":[-6,0],"C":[6,0],"D":[0,0],"E":[3,6],"F":[-3,6],"M":[0,4]},"polygons":["ABC"],' +
    '"segments":[{"s":"AD","accent":true},"BE","CF"],' +
    '"ticks":[{"on":"BD","n":1},{"on":"DC","n":1},{"on":"AE","n":2},{"on":"EC","n":2},{"on":"AF","n":3},{"on":"FB","n":3}],' +
    '"labels":[{"on":"AM","text":"2","accent":true},{"on":"MD","text":"1","accent":true}],"width":280}',

  // teach step3 — parallelogram: opposite sides parallel, diagonals bisect.
  'teach-parallelogram':
    '{"points":{"A":[0,0],"B":[10,0],"C":[13,6],"D":[3,6],"O":[6.5,3]},"polygons":["ABCD"],"segments":["AC","BD"],' +
    '"parallel":[{"on":"AB","n":1},{"on":"DC","n":1},{"on":"AD","n":2},{"on":"BC","n":2}],' +
    '"ticks":[{"on":"AO","n":1},{"on":"OC","n":1},{"on":"BO","n":2},{"on":"OD","n":2}],"width":320}',

  // teach step6 — same height ⇒ ratio of areas is the ratio of bases.
  'teach-area-ratio':
    '{"points":{"A":[2,6],"B":[0,0],"C":[10,0],"D":[4,0],"H":[2,0]},"polygons":["ABC"],' +
    '"segments":["AD",{"s":"AH","dashed":true,"accent":true}],"right":[{"at":"H","from":"A","to":"B"}],' +
    '"labels":[{"on":"BD","text":"4"},{"on":"DC","text":"6"},{"on":"AH","text":"h","accent":true}],"width":320}',

  // drill-003 — equal distances to the three SIDES, bisectors not drawn.
  'eg-shp-drill-003':
    `{"points":{"A":[${A3[0]},${A3[1]}],"B":[${B3[0]},${B3[1]}],"C":[${C3[0]},${C3[1]}],"P":[${P3[0]},${P3[1]}],` +
    `"X":[${F1[0]},${F1[1]}],"Y":[${F2[0]},${F2[1]}],"Z":[${F3[0]},${F3[1]}]},"polygons":["ABC"],` +
    '"segments":[{"s":"PX","dashed":true,"accent":true},{"s":"PY","dashed":true,"accent":true},{"s":"PZ","dashed":true,"accent":true}],' +
    '"right":[{"at":"X","from":"P","to":"B"},{"at":"Y","from":"P","to":"A"},{"at":"Z","from":"P","to":"B"}],' +
    '"ticks":[{"on":"PX","n":1},{"on":"PY","n":1},{"on":"PZ","n":1}],"width":300}',

  // drill-004 — a GENERIC quadrilateral with its diagonals. Deliberately not a
  // parallelogram: the question is which single datum forces one.
  'eg-shp-drill-004':
    '{"points":{"A":[0,0],"B":[12,0],"C":[9,8],"D":[2,5]},"polygons":["ABCD"],"segments":["AC","BD"],"width":280}',

  // drill-005 — the crossing angle is what the question asks about, so it is
  // marked "?" on a quadrilateral that is none of the four options.
  'eg-shp-drill-005':
    '{"points":{"A":[0,0],"B":[11,2],"C":[8,9],"D":[1,7],"E":[4.6154,5.1923]},"polygons":["ABCD"],"segments":["AC","BD"],' +
    '"angles":[{"at":"E","from":"A","to":"B","label":"?"}],"width":280}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}

const ok = (n: string, c: boolean, got = '') => { if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`); };

const I = parseGeo(FIGS['teach-isosceles']).points;
ok('isosceles: AB = AC', Math.abs(d(I.A, I.B) - d(I.A, I.C)) < 1e-9);
ok('isosceles: AD is also the median (BD = DC)', Math.abs(d(I.B, I.D) - d(I.D, I.C)) < 1e-9);
ok('isosceles: base angles equal', Math.abs(angleAt(I.B, I.A, I.C) - angleAt(I.C, I.A, I.B)) < 1e-9);

const M = parseGeo(FIGS['teach-median-hyp']).points;
ok('median-hyp: right angle at C', Math.abs(angleAt(M.C, M.A, M.B) - 90) < 1e-9);
ok('median-hyp: CM = AM = MB = half the hypotenuse',
  Math.abs(d(M.C, M.M) - 13) < 1e-9 && Math.abs(d(M.A, M.M) - 13) < 1e-9 && Math.abs(d(M.M, M.B) - 13) < 1e-9);

const G = parseGeo(FIGS['teach-centroid']).points;
ok('centroid: D, E, F are the midpoints',
  Math.abs(d(G.B, G.D) - d(G.D, G.C)) < 1e-9 && Math.abs(d(G.A, G.E) - d(G.E, G.C)) < 1e-9 && Math.abs(d(G.A, G.F) - d(G.F, G.B)) < 1e-9);
ok('centroid: AM : MD = 2 : 1', Math.abs(d(G.A, G.M) / d(G.M, G.D) - 2) < 1e-9);
ok('centroid: M really is on median BE',
  Math.abs((G.M[0] - G.B[0]) * (G.E[1] - G.B[1]) - (G.M[1] - G.B[1]) * (G.E[0] - G.B[0])) < 1e-6);

const Pg = parseGeo(FIGS['teach-parallelogram']).points;
ok('parallelogram: diagonals bisect each other',
  Math.abs(d(Pg.A, Pg.O) - d(Pg.O, Pg.C)) < 1e-9 && Math.abs(d(Pg.B, Pg.O) - d(Pg.O, Pg.D)) < 1e-9);
ok('parallelogram: it is NOT a rectangle (diagonals unequal)', Math.abs(d(Pg.A, Pg.C) - d(Pg.B, Pg.D)) > 0.5);

const Ar = parseGeo(FIGS['teach-area-ratio']).points;
ok('area-ratio: BD = 4, DC = 6', Math.abs(d(Ar.B, Ar.D) - 4) < 1e-9 && Math.abs(d(Ar.D, Ar.C) - 6) < 1e-9);
ok('area-ratio: AH really is the height (⊥ BC)', Math.abs(angleAt(Ar.H, Ar.A, Ar.B) - 90) < 1e-9);

const Dp = parseGeo(FIGS['eg-shp-drill-003']).points;
const dd = [d(Dp.P, Dp.X), d(Dp.P, Dp.Y), d(Dp.P, Dp.Z)];
ok('drill-003: P is equidistant from all THREE sides',
  Math.max(...dd) - Math.min(...dd) < Math.min(...dd) * 0.01, dd.map((n) => n.toFixed(4)).join(' / '));
ok('drill-003: no angle bisector is drawn (answer not given away)', !FIGS['eg-shp-drill-003'].includes('"AP"'));

const Q5 = parseGeo(FIGS['eg-shp-drill-005']).points;
ok('drill-005: E is on both diagonals',
  Math.abs((Q5.E[0] - Q5.A[0]) * (Q5.C[1] - Q5.A[1]) - (Q5.E[1] - Q5.A[1]) * (Q5.C[0] - Q5.A[0])) < 1e-3 &&
  Math.abs((Q5.E[0] - Q5.B[0]) * (Q5.D[1] - Q5.B[1]) - (Q5.E[1] - Q5.B[1]) * (Q5.D[0] - Q5.B[0])) < 1e-3);
ok('drill-005: the diagonals are NOT perpendicular (it is none of the options)',
  Math.abs(angleAt(Q5.E, Q5.A, Q5.B) - 90) > 5, `${angleAt(Q5.E, Q5.A, Q5.B).toFixed(1)}°`);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_shapes3-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_shapes3-figs.json'); }
