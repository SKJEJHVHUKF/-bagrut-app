// Figures for the four questions that repeated their own בגרות question.
// The bagrut rung is the authentic destination and is never edited — the lower
// rung is what moves.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const D2R = Math.PI / 180;
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const on = (deg: number, r: number): Pt => [r4(r * Math.cos(deg * D2R)), r4(r * Math.sin(deg * D2R))];

// circ-002: inscribed angles on the SAME side of the chord are equal (42°).
// Inscribed 42° ⇒ central 84°, so A and B sit at 270∓42.
const A2 = on(228, 5), B2 = on(312, 5), C2 = on(130, 5), D2 = on(50, 5);

// circ-005: a chord equal to the radius ⇒ △AOB equilateral ⇒ central 60°.
const A5 = on(210, 6), B5 = on(270, 6), C5 = on(60, 6);

// mix-001: chords AB and CD meet at E with AE=4, EB=9, CE=3, ED=12 (36 = 36).
const TH = 60 * D2R;
const Cm: Pt = [r4(-3 * Math.cos(TH)), r4(-3 * Math.sin(TH))];
const Dm: Pt = [r4(12 * Math.cos(TH)), r4(12 * Math.sin(TH))];
const Km = (27 - 15 * Math.cos(TH)) / (6 * Math.sin(TH)); // centre y, from concyclicity
const Om: Pt = [2.5, r4(Km)];
const Rm = r4(Math.hypot(2.5 + 4, Km));

// mix-003: tangent PT=12 and chord AB=7 ⇒ PA=9, PB=16 (144 = 9·16).
// centre (12.5, 0) and r = 3.5 are written straight into the figure below;
// only the tangent point needs solving for.
const Tx = 288 / 25, Ty = r4(Math.sqrt(144 - Tx * Tx));

const FIGS: Record<string, string> = {
  'eg-sub-circ-002':
    `{"points":{"O":[0,0],"A":[${A2[0]},${A2[1]}],"B":[${B2[0]},${B2[1]}],"C":[${C2[0]},${C2[1]}],"D":[${D2[0]},${D2[1]}]},` +
    '"circles":[{"center":"O","r":5,"on":["A","B","C","D"]}],"segments":["AB","CA","CB","DA","DB"],' +
    '"angles":[{"at":"C","from":"A","to":"B","label":"42°"},{"at":"D","from":"A","to":"B","label":"?"}],"width":320}',

  'eg-sub-circ-005':
    `{"points":{"O":[0,0],"A":[${A5[0]},${A5[1]}],"B":[${B5[0]},${B5[1]}],"C":[${C5[0]},${C5[1]}]},` +
    '"circles":[{"center":"O","r":6,"on":["A","B","C"]}],"segments":["OA","OB","AB","CA","CB"],' +
    '"ticks":[{"on":"OA","n":1},{"on":"OB","n":1},{"on":"AB","n":1}],' +
    '"angles":[{"at":"O","from":"A","to":"B","n":2},{"at":"C","from":"A","to":"B","label":"?"}],"width":300}',

  'eg-mix-001':
    `{"points":{"O":[${Om[0]},${Om[1]}],"E":[0,0],"A":[-4,0],"B":[9,0],"C":[${Cm[0]},${Cm[1]}],"D":[${Dm[0]},${Dm[1]}]},` +
    `"circles":[{"center":"O","r":${Rm},"on":["A","B","C","D"]}],"segments":["AB","CD"],` +
    '"labels":[{"on":"AE","text":"4"},{"on":"EB","text":"9"}],"hidden":["O"],"width":320}',

  'eg-mix-003':
    `{"points":{"P":[0,0],"A":[9,0],"B":[16,0],"O":[12.5,0],"T":[${r4(Tx)},${Ty}]},` +
    '"circles":[{"center":"O","r":3.5,"on":["A","B","T"]}],"segments":[{"s":"PT","accent":true},"PB","OT"],' +
    '"right":[{"at":"T","from":"O","to":"P"}],"labels":[{"on":"PT","text":"12"},{"on":"AB","text":"7"}],"hidden":["O"],"width":340}',
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try { errs = validateGeo(parseGeo(json)); } catch (e) { errs = [`bad JSON — ${(e as Error).message}`]; }
  if (errs.length) { bad++; console.log(`❌ ${k}`); errs.forEach((e) => console.log(`     ${e}`)); }
  else console.log(`✅ ${k}`);
}
const ok = (n: string, c: boolean, got = '') => { if (!c) { bad++; console.log(`❌ claim: ${n} ${got}`); } else console.log(`✅ claim: ${n}`); };

const P2 = parseGeo(FIGS['eg-sub-circ-002']).points;
ok('circ-002: ∠ACB = 42° as labelled', Math.abs(angleAt(P2.C, P2.A, P2.B) - 42) < 0.1, `${angleAt(P2.C, P2.A, P2.B).toFixed(2)}`);
ok('circ-002: ∠ADB = 42° too (the ANSWER — same arc, same side)', Math.abs(angleAt(P2.D, P2.A, P2.B) - 42) < 0.1, `${angleAt(P2.D, P2.A, P2.B).toFixed(2)}`);
ok('circ-002: AB is NOT a diameter (so it cannot be the eg-bag-003 question)', Math.abs(d(P2.A, P2.B) - 10) > 0.5, `AB=${d(P2.A, P2.B).toFixed(2)} vs 2r=10`);

const P5 = parseGeo(FIGS['eg-sub-circ-005']).points;
ok('circ-005: the chord equals the radius', Math.abs(d(P5.A, P5.B) - 6) < 1e-3 && Math.abs(d(P5.O, P5.A) - 6) < 1e-3);
ok('circ-005: ∠AOB = 60° ⇒ △AOB equilateral', Math.abs(angleAt(P5.O, P5.A, P5.B) - 60) < 0.05, `${angleAt(P5.O, P5.A, P5.B).toFixed(2)}`);
ok('circ-005: inscribed ∠ACB = 30° (the ANSWER)', Math.abs(angleAt(P5.C, P5.A, P5.B) - 30) < 0.1, `${angleAt(P5.C, P5.A, P5.B).toFixed(2)}`);
ok('circ-005: AB is NOT a diameter (unlike eg-bag-009)', Math.abs(d(P5.A, P5.B) - 12) > 1);

const Pm = parseGeo(FIGS['eg-mix-001']).points;
ok('mix-001: AE=4, EB=9, CE=3, ED=12', Math.abs(d(Pm.A, Pm.E) - 4) < 1e-3 && Math.abs(d(Pm.E, Pm.B) - 9) < 1e-3 && Math.abs(d(Pm.C, Pm.E) - 3) < 1e-3 && Math.abs(d(Pm.E, Pm.D) - 12) < 1e-3);
ok('mix-001: CD = 15 (the GIVEN) and CE·ED = AE·EB = 36', Math.abs(d(Pm.C, Pm.D) - 15) < 1e-3 && Math.abs(3 * 12 - 4 * 9) < 1e-9);
ok('mix-001: all four points really are on one circle', [Pm.A, Pm.B, Pm.C, Pm.D].every((p) => Math.abs(d(Pm.O, p) - Rm) < 0.01));

const P3 = parseGeo(FIGS['eg-mix-003']).points;
ok('mix-003: PT = 12, AB = 7, PA = 9 (the ANSWER), PB = 16',
  Math.abs(d(P3.P, P3.T) - 12) < 1e-2 && Math.abs(d(P3.A, P3.B) - 7) < 1e-9 && Math.abs(d(P3.P, P3.A) - 9) < 1e-9 && Math.abs(d(P3.P, P3.B) - 16) < 1e-9);
ok('mix-003: PT² = PA·PB', Math.abs(144 - 9 * 16) < 1e-9);
ok('mix-003: the tangent is tangent (OT ⊥ PT)', Math.abs(angleAt(P3.T, P3.O, P3.P) - 90) < 0.1, `${angleAt(P3.T, P3.O, P3.P).toFixed(2)}`);

console.log(`\n${bad} problem(s)`);
if (!bad) { writeFileSync('scripts/_geo6-figs.json', JSON.stringify(FIGS, null, 2)); console.log('wrote scripts/_geo6-figs.json'); }
