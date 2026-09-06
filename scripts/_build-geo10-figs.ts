// Rewriting eg-sub-sim-003 and eg-sub-thales-003 from MCQ to open questions
// silently orphaned five misconception triggers — a trigger fires on a chosen
// DISTRACTOR, so it needs an MCQ. Three of those misconceptions were left with
// no home at all, i.e. the app lost the ability to diagnose them. These two new
// warm-up MCQs give them one back, with the distractors placed deliberately.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// sim-009: altitude to the hypotenuse, FORWARD. AH = 3, HB = 12 ⇒ CH = 6.
const Asim: Pt = [0, 0], Bsim: Pt = [15, 0], Hsim: Pt = [3, 0], Csim: Pt = [3, 6];

// thales-008: angle bisector. AB = 8, AC = 4, BD = 6 ⇒ DC = 3.
const Bt: Pt = [0, 0], Ct: Pt = [9, 0];
const ax = (64 - 16 + 81) / 18;
const At: Pt = [r4(ax), r4(Math.sqrt(64 - ax * ax))];
const Dt: Pt = [6, 0];

const FIGS: Record<string, string> = {
  'eg-sub-sim-009':
    `{"points":{"A":[${Asim[0]},${Asim[1]}],"B":[${Bsim[0]},${Bsim[1]}],"H":[${Hsim[0]},${Hsim[1]}],"C":[${Csim[0]},${Csim[1]}]},` +
    '"polygons":["ABC"],"segments":[{"s":"CH","accent":true}],' +
    '"right":[{"at":"C","from":"A","to":"B"},{"at":"H","from":"C","to":"A"}],' +
    '"labels":[{"on":"AH","text":"3"},{"on":"HB","text":"12"}],"width":340}',

  'eg-sub-thales-008':
    `{"points":{"A":[${At[0]},${At[1]}],"B":[${Bt[0]},${Bt[1]}],"C":[${Ct[0]},${Ct[1]}],"D":[${Dt[0]},${Dt[1]}]},` +
    '"polygons":["ABC"],"segments":[{"s":"AD","accent":true}],' +
    '"angles":[{"at":"A","from":"B","to":"D","n":1},{"at":"A","from":"D","to":"C","n":1}],' +
    '"labels":[{"on":"AB","text":"8"},{"on":"AC","text":"4"},{"on":"BD","text":"6"}],"width":340}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}
const ok = (n: string, c: boolean, got = '') => {
  if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`);
};

ok('sim-009: right angle at C, CH ⊥ AB', Math.abs(angleAt(Csim, Asim, Bsim) - 90) < 1e-6 && Math.abs(angleAt(Hsim, Csim, Asim) - 90) < 1e-6);
ok('sim-009: the GIVENS AH = 3, HB = 12', Math.abs(d(Asim, Hsim) - 3) < 1e-9 && Math.abs(d(Hsim, Bsim) - 12) < 1e-9);
ok('sim-009: CH = 6 = √(3·12) (ANSWER)', Math.abs(d(Csim, Hsim) - 6) < 1e-9 && Math.abs(6 - Math.sqrt(3 * 12)) < 1e-9);
ok('sim-009: distractors are WRONG — 7.5 (arith. mean), 36 (no √), 15 (that is AB)',
  Math.abs((3 + 12) / 2 - 7.5) < 1e-9 && Math.abs(3 * 12 - 36) < 1e-9 && Math.abs(d(Asim, Bsim) - 15) < 1e-9 &&
  ![7.5, 36, 15].some((v) => Math.abs(v - 6) < 1e-9));

ok('thales-008: the GIVENS AB = 8, AC = 4, BD = 6',
  Math.abs(d(At, Bt) - 8) < 1e-3 && Math.abs(d(At, Ct) - 4) < 1e-3 && Math.abs(d(Bt, Dt) - 6) < 1e-9,
  `${d(At, Bt).toFixed(3)} ${d(At, Ct).toFixed(3)}`);
ok('thales-008: AD really bisects ∠A', Math.abs(angleAt(At, Bt, Dt) - angleAt(At, Dt, Ct)) < 0.05,
  `${angleAt(At, Bt, Dt).toFixed(2)} vs ${angleAt(At, Dt, Ct).toFixed(2)}`);
ok('thales-008: DC = 3 (ANSWER), and BD/DC = AB/AC', Math.abs(d(Dt, Ct) - 3) < 1e-9 && Math.abs(6 / 3 - 8 / 4) < 1e-9);
ok('thales-008: distractors are WRONG — 6 (= BD, "bisector is a median"), 4 (= AC copied), 12 (ratio inverted)',
  ![6, 4, 12].some((v) => Math.abs(v - 3) < 1e-9) && Math.abs(6 * (4 / 8) - 3) < 1e-9 && Math.abs(6 * (8 / 4) - 12) < 1e-9);
ok('thales-008: D is strictly between B and C', Dt[0] > Bt[0] && Dt[0] < Ct[0]);

console.log(`\n${bad} problem(s)`);
if (!bad) for (const [k, v] of Object.entries(FIGS)) console.log(`\n${k}:\n${v}`);
