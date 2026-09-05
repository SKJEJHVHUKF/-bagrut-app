// Figures for the 5 questions added to eg-similarity / eg-congruence, built
// from computed coordinates and checked against the real validator AND against
// the claims each question makes, before any of it is pasted into content.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r = (n: number) => Number(n.toFixed(4));
const D2R = Math.PI / 180;
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---- sim-006: two similar right triangles, AB = 6 and DE = 9 --------------
const SIM006 =
  '{"points":{"A":[0,6],"B":[0,0],"C":[4,0],"D":[7,9],"E":[7,0],"F":[13,0]},' +
  '"polygons":["ABC","DEF"],"right":[{"at":"B","from":"A","to":"C"},{"at":"E","from":"D","to":"F"}],' +
  '"labels":[{"on":"AB","text":"6"},{"on":"DE","text":"9"}],"width":360}';

// ---- sim-007: two similar triangles, k = 4:7, no numbers on the figure ----
const SIM007 =
  '{"points":{"A":[1,3],"B":[0,0],"C":[4,0],"D":[7.75,5.25],"E":[6,0],"F":[13,0]},' +
  '"polygons":["ABC","DEF"],' +
  '"angles":[{"at":"B","from":"A","to":"C","n":1},{"at":"E","from":"D","to":"F","n":1},' +
  '{"at":"C","from":"A","to":"B","n":2},{"at":"F","from":"D","to":"E","n":2}],"width":360}';

// ---- sim-008: D on AB, E on AC, ∠AED = ∠ABC. AD=4 AB=9 AE=3 AC=12 --------
const A: Pt = [0, 10.3923];
const mk = (len: number, degFromA: number): Pt => [
  r(len * Math.cos(degFromA * D2R)),
  r(A[1] + len * Math.sin(degFromA * D2R)),
];
const B = mk(9, -120), C = mk(12, -60), Dp = mk(4, -120), E = mk(3, -60);
const SIM008 =
  `{"points":{"A":[${A[0]},${r(A[1])}],"B":[${B[0]},${B[1]}],"C":[${C[0]},${C[1]}],` +
  `"D":[${Dp[0]},${Dp[1]}],"E":[${E[0]},${E[1]}]},"polygons":["ABC"],"segments":["DE"],` +
  '"angles":[{"at":"E","from":"A","to":"D","n":1},{"at":"B","from":"A","to":"C","n":1}],' +
  '"labels":[{"on":"AD","text":"4"},{"on":"AE","text":"3"}],"width":320}';

// ---- cong-011: A,B,C,D on a line, AB=CD, EA=FD, ∠EAC=∠FDB ----------------
const Ep: Pt = [r(5 * Math.cos(60 * D2R)), r(5 * Math.sin(60 * D2R))];
const Fp: Pt = [r(10 - 5 * Math.cos(60 * D2R)), r(-5 * Math.sin(60 * D2R))];
const CONG011 =
  `{"points":{"A":[0,0],"B":[3,0],"C":[7,0],"D":[10,0],"E":[${Ep[0]},${Ep[1]}],"F":[${Fp[0]},${Fp[1]}]},` +
  '"segments":["AD","EA","EC","FD","FB"],' +
  '"ticks":[{"on":"AB","n":1},{"on":"CD","n":1},{"on":"EA","n":2},{"on":"FD","n":2}],' +
  '"angles":[{"at":"A","from":"E","to":"C","n":1},{"at":"D","from":"F","to":"B","n":1}],"width":380}';

// ---- cong-012: two right angles at C, BC = CD -----------------------------
const CONG012 =
  '{"points":{"A":[0,6],"B":[-4,0],"C":[0,0],"D":[4,0]},"polygons":["ABC","ACD"],' +
  '"right":[{"at":"C","from":"A","to":"B"},{"at":"C","from":"A","to":"D"}],' +
  '"ticks":[{"on":"BC","n":1},{"on":"CD","n":1}],"width":300}';

const FIGS: Record<string, string> = {
  'eg-sub-sim-006': SIM006,
  'eg-sub-sim-007': SIM007,
  'eg-sub-sim-008': SIM008,
  'eg-sub-cong-011': CONG011,
  'eg-sub-cong-012': CONG012,
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}

// ===== the claims the QUESTIONS make, re-derived from the coordinates =====
// validateGeo checks the figure against itself; these check it against the text.
const P = parseGeo(SIM006).points;
const ok = (name: string, cond: boolean, got = '') => {
  if (!cond) { bad++; console.log(`❌ claim: ${name} ${got}`); } else console.log(`✅ claim: ${name}`);
};
ok('sim-006 AB = 6', d(P.A, P.B) === 6);
ok('sim-006 DE = 9', d(P.D, P.E) === 9);
ok('sim-006 triangles similar (k = 2/3)', Math.abs(d(P.B, P.C) / d(P.E, P.F) - 2 / 3) < 1e-9);

const Q = parseGeo(SIM007).points;
ok('sim-007 similar, k = 4:7',
  Math.abs(d(Q.A, Q.B) / d(Q.D, Q.E) - 4 / 7) < 1e-6 && Math.abs(d(Q.B, Q.C) / d(Q.E, Q.F) - 4 / 7) < 1e-6,
  `${(d(Q.A, Q.B) / d(Q.D, Q.E)).toFixed(4)} vs ${(4 / 7).toFixed(4)}`);

const S = parseGeo(SIM008).points;
ok('sim-008 AD = 4', Math.abs(d(S.A, S.D) - 4) < 1e-3);
ok('sim-008 AB = 9', Math.abs(d(S.A, S.B) - 9) < 1e-3);
ok('sim-008 AE = 3', Math.abs(d(S.A, S.E) - 3) < 1e-3);
ok('sim-008 AC = 12 (the ANSWER)', Math.abs(d(S.A, S.C) - 12) < 1e-3);
ok('sim-008 ∠AED = ∠ABC (the GIVEN)',
  Math.abs(angleAt(S.E, S.A, S.D) - angleAt(S.B, S.A, S.C)) < 0.05,
  `${angleAt(S.E, S.A, S.D).toFixed(2)}° vs ${angleAt(S.B, S.A, S.C).toFixed(2)}°`);
ok('sim-008 D lies on AB', Math.abs(d(S.A, S.D) + d(S.D, S.B) - d(S.A, S.B)) < 1e-3);
ok('sim-008 E lies on AC', Math.abs(d(S.A, S.E) + d(S.E, S.C) - d(S.A, S.C)) < 1e-3);

const T = parseGeo(CONG011).points;
ok('cong-011 AB = CD', Math.abs(d(T.A, T.B) - d(T.C, T.D)) < 1e-9);
ok('cong-011 AC = BD (what segment-addition gives)', Math.abs(d(T.A, T.C) - d(T.B, T.D)) < 1e-9);
ok('cong-011 EA = FD', Math.abs(d(T.E, T.A) - d(T.F, T.D)) < 1e-3);
ok('cong-011 ∠EAC = ∠FDB', Math.abs(angleAt(T.A, T.E, T.C) - angleAt(T.D, T.F, T.B)) < 0.05);
ok('cong-011 order A,B,C,D on the line', T.A[0] < T.B[0] && T.B[0] < T.C[0] && T.C[0] < T.D[0]);

const U = parseGeo(CONG012).points;
ok('cong-012 BC = CD', Math.abs(d(U.B, U.C) - d(U.C, U.D)) < 1e-9);
ok('cong-012 both angles at C are 90°',
  Math.abs(angleAt(U.C, U.A, U.B) - 90) < 1e-6 && Math.abs(angleAt(U.C, U.A, U.D) - 90) < 1e-6);
ok('cong-012 AB = AD (the CONCLUSION)', Math.abs(d(U.A, U.B) - d(U.A, U.D)) < 1e-9);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_progression-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_progression-figs.json'); }
