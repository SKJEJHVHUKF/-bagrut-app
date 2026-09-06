// eg-mth-006 gains a numeric part, so its figure must now be TO SCALE:
// AB = 6, AE = 4, BE = 5 are labelled, and every other length in the picture
// follows from them. Placed by construction rather than by eye.

import { validateGeo, parseGeo, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// △ABE from its three sides: AB = 6 on the x-axis, AE = 4, BE = 5.
const A: Pt = [0, 0];
const B: Pt = [6, 0];
const ex = (16 - 25 + 36) / 12; // x² - (x-6)² = AE² - BE²  ⇒  x = 2.25
const E: Pt = [r4(ex), r4(Math.sqrt(16 - ex * ex))];
// E is the midpoint of AD and (to be proved) of BC, so both are reflections.
const D: Pt = [r4(2 * E[0] - A[0]), r4(2 * E[1] - A[1])];
const C: Pt = [r4(2 * E[0] - B[0]), r4(2 * E[1] - B[1])];

const FIG =
  `{"points":{"A":[${A[0]},${A[1]}],"B":[${B[0]},${B[1]}],"C":[${C[0]},${C[1]}],"D":[${D[0]},${D[1]}],"E":[${E[0]},${E[1]}]},` +
  '"segments":["AB","CD","AD","BC"],' +
  '"parallel":[{"on":"AB","n":1},{"on":"CD","n":1}],' +
  '"ticks":[{"on":"AE","n":1},{"on":"ED","n":1}],' +
  '"labels":[{"on":"AB","text":"6"},{"on":"AE","text":"4"},{"on":"BE","text":"5"}],"width":340}';

// The solution's figure: the two triangles accented, with the equal angles.
const FIG_SOL =
  `{"points":{"A":[${A[0]},${A[1]}],"B":[${B[0]},${B[1]}],"C":[${C[0]},${C[1]}],"D":[${D[0]},${D[1]}],"E":[${E[0]},${E[1]}]},` +
  '"polygons":[{"s":"ABE","accent":true},{"s":"DCE","accent":true}],' +
  '"segments":["AB","CD","AD","BC"],' +
  '"ticks":[{"on":"AE","n":1},{"on":"ED","n":1}],' +
  '"angles":[{"at":"A","from":"B","to":"E","n":1},{"at":"D","from":"C","to":"E","n":1},' +
  '{"at":"E","from":"A","to":"B","n":2},{"at":"E","from":"D","to":"C","n":2}],"width":340}';

let bad = 0;
for (const [k, json] of Object.entries({ 'eg-mth-006': FIG, 'eg-mth-006-sol': FIG_SOL })) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}

const ok = (n: string, c: boolean, got = '') => {
  if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`);
};
ok('the three GIVENS: AB=6, AE=4, BE=5',
  Math.abs(d(A, B) - 6) < 1e-3 && Math.abs(d(A, E) - 4) < 1e-3 && Math.abs(d(B, E) - 5) < 1e-3,
  `${d(A, B).toFixed(3)} ${d(A, E).toFixed(3)} ${d(B, E).toFixed(3)}`);
ok('E is the midpoint of AD (given)', Math.abs(d(A, E) - d(E, D)) < 1e-3);
ok('AB ∥ CD (given)', Math.abs((B[1] - A[1]) * (D[0] - C[0]) - (B[0] - A[0]) * (D[1] - C[1])) < 1e-3);
ok('part א: E is the midpoint of BC (CONCLUSION)', Math.abs(d(B, E) - d(E, C)) < 1e-3);
ok('part ב: ABDC is a parallelogram — AB = DC and AB ∥ DC (CONCLUSION)',
  Math.abs(d(A, B) - d(D, C)) < 1e-3 && Math.abs(d(B, D) - d(C, A)) < 1e-3);
ok('part ג: perimeter of △DCE = 6 + 5 + 4 = 15 (ANSWER)',
  Math.abs(d(D, C) + d(C, E) + d(E, D) - 15) < 1e-3,
  `${(d(D, C) + d(C, E) + d(E, D)).toFixed(3)}`);
ok('ABDC is not degenerate', d(A, D) > 1 && d(B, C) > 1 && Math.abs(E[1]) > 1);

console.log(`\n${bad} problem(s)`);
if (!bad) { console.log('\nFIG:\n' + FIG + '\n\nFIG_SOL:\n' + FIG_SOL); }
