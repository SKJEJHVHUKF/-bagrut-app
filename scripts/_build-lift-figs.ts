// Three more figures for the difficulty lift:
//   eg-shp-016  אתגר — right trapezoid, TWO equations (Pythagoras + area) in
//               two unknowns. Needed because raising ביסוס to 18.8 pushed it
//               above the old אתגר rung at 17.6.
//   eg-ang-011  ביסוס — every angles question used exactly ONE named theorem at
//               every rung; this one needs alternate angles AND the triangle sum.
//   eg-sub-sim-010 אתגר — similarity measured FEWER theorems at אתגר than at
//               ביסוס. This runs area-ratio backwards: areas given, lengths out.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const r4 = (n: number) => Number(n.toFixed(4));
const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ── right trapezoid: AD ⊥ bases, AD = 12, BC = 15, area 126 ⇒ AB = 15, DC = 6
const At: Pt = [0, 0], Bt: Pt = [15, 0], Ct: Pt = [6, 12], Dt: Pt = [0, 12], Kt: Pt = [6, 0];

// ── triangle with ∠A = 50°, and a line through C parallel to AB ──────────────
const Aa: Pt = [0, 0], Ba: Pt = [10, 0];
const Ca: Pt = [r4(10 * Math.cos((50 * Math.PI) / 180)), r4(10 * Math.sin((50 * Math.PI) / 180))];
const L1: Pt = [r4(Ca[0] - 4), Ca[1]];
const L2: Pt = [r4(Ca[0] + 4), Ca[1]];

// ── DE ∥ BC with k = 3/5: AB = 15 ⇒ AD = 9, BC = 20 ⇒ DE = 12 ───────────────
const As: Pt = [0, 12], Bs: Pt = [-9, 0], Cs: Pt = [11, 0];
const Ds: Pt = [r4(As[0] + 0.6 * (Bs[0] - As[0])), r4(As[1] + 0.6 * (Bs[1] - As[1]))];
const Es: Pt = [r4(As[0] + 0.6 * (Cs[0] - As[0])), r4(As[1] + 0.6 * (Cs[1] - As[1]))];

const FIGS: Record<string, string> = {
  'eg-shp-016':
    '{"points":{"A":[0,0],"B":[15,0],"C":[6,12],"D":[0,12],"K":[6,0]},"polygons":["ABCD"],' +
    '"segments":[{"s":"CK","accent":true}],' +
    '"parallel":[{"on":"AB","n":1},{"on":"DC","n":1}],' +
    '"right":[{"at":"A","from":"B","to":"D"},{"at":"D","from":"A","to":"C"},{"at":"K","from":"C","to":"B"}],' +
    '"labels":[{"on":"AD","text":"12"},{"on":"BC","text":"15"}],"width":330}',

  'eg-ang-011':
    `{"points":{"A":[0,0],"B":[10,0],"C":[${Ca}],"L":[${L1}],"M":[${L2}]},"polygons":["ABC"],` +
    '"segments":["LM"],"parallel":[{"on":"AB","n":1},{"on":"LM","n":1}],' +
    '"angles":[{"at":"A","from":"B","to":"C","label":"50°"},{"at":"C","from":"M","to":"B","label":"65°"}],"width":340}',

  'eg-sub-sim-010':
    `{"points":{"A":[${As}],"B":[${Bs}],"C":[${Cs}],"D":[${Ds}],"E":[${Es}]},"polygons":["ABC"],` +
    '"segments":[{"s":"DE","accent":true}],' +
    '"parallel":[{"on":"DE","n":1},{"on":"BC","n":1}],' +
    '"labels":[{"on":"AB","text":"15"},{"on":"BC","text":"20"}],"width":340}',
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
const near = (a: number, b: number, t = 0.02) => Math.abs(a - b) < t;

console.log('\n— right trapezoid —');
ok('AB ∥ DC, and AD is perpendicular to both', At[1] === Bt[1] && Ct[1] === Dt[1] && Dt[0] === At[0]);
ok('GIVEN AD = 12 and BC = 15', near(d(At, Dt), 12) && near(d(Bt, Ct), 15), `${d(Bt, Ct).toFixed(3)}`);
ok('GIVEN area = 126', near(((d(At, Bt) + d(Dt, Ct)) / 2) * 12, 126), `${(((d(At, Bt) + d(Dt, Ct)) / 2) * 12).toFixed(2)}`);
ok('ANSWER AB = 15 and DC = 6', near(d(At, Bt), 15) && near(d(Dt, Ct), 6));
ok('the two equations really are AB−DC = 9 and AB+DC = 21', near(d(At, Bt) - d(Dt, Ct), 9) && near(d(At, Bt) + d(Dt, Ct), 21));
ok('KB = 9 comes out of Pythagoras on 12 and 15', near(d(Kt, Bt), 9) && near(Math.sqrt(225 - 144), 9));
ok('ANSWER perimeter = 15+15+6+12 = 48', near(d(At, Bt) + d(Bt, Ct) + d(Ct, Dt) + d(Dt, At), 48));

console.log('\n— angles: parallel line through C —');
ok('GIVEN ∠A = 50°', near(angleAt(Aa, Ba, Ca), 50), `${angleAt(Aa, Ba, Ca).toFixed(2)}`);
ok('LM really is parallel to AB', L1[1] === L2[1] && Aa[1] === Ba[1]);
ok('GIVEN the angle between the parallel line and CB is 65°', near(angleAt(Ca, L2, Ba), 65), `${angleAt(Ca, L2, Ba).toFixed(2)}`);
ok('ANSWER ∠B = 65° — it is the ALTERNATE angle, hence equal', near(angleAt(Ba, Aa, Ca), 65), `${angleAt(Ba, Aa, Ca).toFixed(2)}`);
ok('ANSWER ∠ACB = 65° from the triangle sum', near(angleAt(Ca, Aa, Ba), 65), `${angleAt(Ca, Aa, Ba).toFixed(2)}`);
ok('the three angles sum to 180', near(angleAt(Aa, Ba, Ca) + angleAt(Ba, Aa, Ca) + angleAt(Ca, Aa, Ba), 180));

console.log('\n— similarity: areas given, lengths out —');
ok('DE ∥ BC', Ds[1] === Es[1] && Bs[1] === Cs[1]);
ok('GIVEN AB = 15 and BC = 20', near(d(As, Bs), 15) && near(d(Bs, Cs), 20));
ok('D is on AB and E is on AC', near(d(As, Ds) + d(Ds, Bs), d(As, Bs)) && near(d(As, Es) + d(Es, Cs), d(As, Cs)));
ok('ANSWER k = 3/5, so AD = 9 and DB = 6', near(d(As, Ds), 9) && near(d(Ds, Bs), 6), `${d(As, Ds).toFixed(3)} ${d(Ds, Bs).toFixed(3)}`);
ok('ANSWER DE = 12 = (3/5)·20', near(d(Ds, Es), 12), `${d(Ds, Es).toFixed(3)}`);
ok('the AREAS behind it: 18 and 32 give total 50 and k² = 18/50 = 9/25', near(18 / 50, 9 / 25) && near(Math.sqrt(9 / 25), 0.6));

console.log(`\n${bad} problem(s)`);
if (!bad) for (const [k, v] of Object.entries(FIGS)) console.log(`\n${k}:\n${v}`);
