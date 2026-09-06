// Figures for four new circle questions. The circle sub-topic measured lowest
// in the whole topic at BOTH ביסוס (11.8) and אתגר (13.5), and the reason is
// visible in the content: the lesson teaches five theorems that no question
// ever asks about — cyclic quadrilateral, diameter ⇒ 90°, tangent ⊥ radius,
// tangent-chord, and two tangents from a point. These four cover four of them.
//
// Every claim below is re-derived from the coordinates, including the ANSWERS.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const onCircle = (c: Pt, r: number, deg: number): Pt =>
  [r4(c[0] + r * Math.cos((deg * Math.PI) / 180)), r4(c[1] + r * Math.sin((deg * Math.PI) / 180))];

// ── circ-007: cyclic ABCD, ∠A = 95°, ∠B = 70°, E on ray BC beyond C ──────────
// Arcs chosen so both given angles come out exactly: AB=90, BC=130, CD=60, DA=80.
const O7: Pt = [0, 0];
const A7 = onCircle(O7, 5, 90);
const B7 = onCircle(O7, 5, 180);
const C7 = onCircle(O7, 5, 310);
const D7 = onCircle(O7, 5, 10);
const uBC = (() => { const L = d(B7, C7); return [(C7[0] - B7[0]) / L, (C7[1] - B7[1]) / L]; })();
const E7: Pt = [r4(C7[0] + 3 * uBC[0]), r4(C7[1] + 3 * uBC[1])];

// ── circ-008: tangent PT, radius 8, OP = 17 ⇒ PT = 15, and P to circle = 9 ──
const O8: Pt = [0, 0];
const P8: Pt = [17, 0];
const T8: Pt = [r4(64 / 17), r4((8 * 15) / 17)];
const N8: Pt = [8, 0]; // nearest point of the circle to P

// ── circ-009: AB diameter, CH ⊥ AB, AH = 9, HB = 16 ⇒ CH = 12, AC = 15, BC = 20
const A9: Pt = [0, 0];
const B9: Pt = [25, 0];
const H9: Pt = [9, 0];
const C9: Pt = [9, 12];
const O9: Pt = [12.5, 0];

// ── circ-010: two tangents, ∠APB = 40° ⇒ ∠AOB = 140°, ∠ACB = 70° ────────────
const O10: Pt = [0, 0];
const R10 = 5;
const OP10 = R10 / Math.sin((20 * Math.PI) / 180);
const P10: Pt = [r4(OP10), 0];
const A10 = onCircle(O10, R10, 70);
const B10 = onCircle(O10, R10, -70);
const C10 = onCircle(O10, R10, 180);

const FIGS: Record<string, string> = {
  'eg-sub-circ-007':
    `{"points":{"O":[0,0],"A":[${A7}],"B":[${B7}],"C":[${C7}],"D":[${D7}],"E":[${E7}]},` +
    `"circles":[{"center":"O","r":5,"on":["A","B","C","D"]}],"polygons":["ABCD"],` +
    '"segments":[{"s":"CE","accent":true}],' +
    '"angles":[{"at":"A","from":"D","to":"B","label":"95°"},{"at":"B","from":"A","to":"C","label":"70°"}],' +
    '"hidden":["O"],"width":300}',

  'eg-sub-circ-008':
    `{"points":{"O":[0,0],"P":[17,0],"T":[${T8}],"N":[8,0]},` +
    '"circles":[{"center":"O","r":8,"on":["T","N"]}],' +
    '"segments":["OT","OP",{"s":"PT","accent":true}],' +
    '"right":[{"at":"T","from":"O","to":"P"}],' +
    '"labels":[{"on":"OT","text":"8"},{"on":"OP","text":"17"}],"width":330}',

  'eg-sub-circ-009':
    `{"points":{"A":[0,0],"B":[25,0],"H":[9,0],"C":[9,12],"O":[12.5,0]},` +
    '"circles":[{"center":"O","r":12.5,"on":["A","B","C"]}],"polygons":["ABC"],' +
    '"segments":[{"s":"CH","accent":true}],' +
    '"right":[{"at":"H","from":"C","to":"A"}],' +
    '"labels":[{"on":"AH","text":"9"},{"on":"HB","text":"16"}],"hidden":["O"],"width":340}',

  'eg-sub-circ-010':
    `{"points":{"O":[0,0],"P":[${P10}],"A":[${A10}],"B":[${B10}],"C":[${C10}]},` +
    `"circles":[{"center":"O","r":5,"on":["A","B","C"]}],` +
    '"segments":["PA","PB","OA","OB","AC","BC"],' +
    '"right":[{"at":"A","from":"O","to":"P"},{"at":"B","from":"P","to":"O"}],' +
    '"angles":[{"at":"P","from":"A","to":"B","label":"40°"}],"width":340}',
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
const near = (a: number, b: number, tol = 0.05) => Math.abs(a - b) < tol;

console.log('\n— circ-007, cyclic quadrilateral —');
ok('all four vertices are on the circle', [A7, B7, C7, D7].every((p) => near(d(O7, p), 5, 1e-3)));
ok('GIVEN ∠A = 95°', near(angleAt(A7, D7, B7), 95), `${angleAt(A7, D7, B7).toFixed(2)}`);
ok('GIVEN ∠B = 70°', near(angleAt(B7, A7, C7), 70), `${angleAt(B7, A7, C7).toFixed(2)}`);
ok('ANSWER ∠C = 85° (opposite to A)', near(angleAt(C7, B7, D7), 85), `${angleAt(C7, B7, D7).toFixed(2)}`);
ok('ANSWER ∠D = 110° (opposite to B)', near(angleAt(D7, C7, A7), 110), `${angleAt(D7, C7, A7).toFixed(2)}`);
ok('ANSWER ∠DCE = 95° = ∠A (exterior angle)', near(angleAt(C7, D7, E7), 95), `${angleAt(C7, D7, E7).toFixed(2)}`);
ok('E really is on ray BC beyond C', near(angleAt(C7, B7, E7), 180, 0.1) && d(B7, E7) > d(B7, C7));

console.log('\n— circ-008, tangent ⊥ radius —');
ok('T is on the circle, N is on the circle', near(d(O8, T8), 8, 1e-3) && near(d(O8, N8), 8, 1e-9));
ok('GIVEN OP = 17, radius = 8', near(d(O8, P8), 17, 1e-9));
ok('the tangent is perpendicular to the radius', near(angleAt(T8, O8, P8), 90, 1e-3));
ok('ANSWER PT = 15', near(d(P8, T8), 15, 1e-3), `${d(P8, T8).toFixed(4)}`);
ok('ANSWER P to the nearest point of the circle = 9', near(d(P8, N8), 9, 1e-9));
ok('N lies between O and P on the segment', N8[1] === 0 && N8[0] > O8[0] && N8[0] < P8[0]);

console.log('\n— circ-009, diameter ⇒ 90° —');
ok('A, B, C are on the circle and AB is a DIAMETER', [A9, B9, C9].every((p) => near(d(O9, p), 12.5, 1e-3)) && near(d(A9, B9), 25, 1e-9));
ok('GIVEN AH = 9, HB = 16, and CH ⊥ AB', near(d(A9, H9), 9) && near(d(H9, B9), 16) && near(angleAt(H9, C9, A9), 90, 1e-6));
ok('ANSWER ∠ACB = 90° (inscribed on the diameter)', near(angleAt(C9, A9, B9), 90, 1e-6), `${angleAt(C9, A9, B9).toFixed(3)}`);
ok('ANSWER CH = 12 = √(9·16)', near(d(C9, H9), 12, 1e-9) && near(Math.sqrt(9 * 16), 12, 1e-9));
ok('ANSWER radius = 12.5', near(d(O9, A9), 12.5, 1e-9));
ok('ANSWER AC = 15 and BC = 20', near(d(A9, C9), 15, 1e-3) && near(d(B9, C9), 20, 1e-3), `${d(A9, C9).toFixed(3)} ${d(B9, C9).toFixed(3)}`);

console.log('\n— circ-010, two tangents —');
ok('A, B, C are on the circle', [A10, B10, C10].every((p) => near(d(O10, p), 5, 1e-3)));
ok('PA and PB really are tangents (⊥ to the radius)', near(angleAt(A10, O10, P10), 90, 0.01) && near(angleAt(B10, O10, P10), 90, 0.01));
ok('GIVEN ∠APB = 40°', near(angleAt(P10, A10, B10), 40), `${angleAt(P10, A10, B10).toFixed(2)}`);
ok('ANSWER PA = PB (the thing to prove)', near(d(P10, A10), d(P10, B10), 1e-3));
ok('ANSWER ∠AOB = 140°', near(angleAt(O10, A10, B10), 140), `${angleAt(O10, A10, B10).toFixed(2)}`);
ok('ANSWER ∠ACB = 70°, C on the major arc', near(angleAt(C10, A10, B10), 70), `${angleAt(C10, A10, B10).toFixed(2)}`);

console.log(`\n${bad} problem(s)`);
if (!bad) for (const [k, v] of Object.entries(FIGS)) console.log(`\n${k}:\n${v}`);
