// eg-shapes measured lowest at ביסוס (12.0). Its mid rung is mostly one-formula
// questions — eg-shp-009 is literally "diagonals 12 and 8, find the area".
// These two make the rung ask for a chain: a property, then Pythagoras, then
// the quantity. Numbers chosen so every side comes out whole.

import { validateGeo, parseGeo, angleAt, type Pt } from '../lib/geo-figure';

const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ── kite: main diagonal AC = 14 (AE = 5, EC = 9), cross diagonal BD = 24 ──────
// ⇒ AB = AD = 13, CB = CD = 15, area = 168, perimeter = 56.
const Ak: Pt = [0, 5], Bk: Pt = [-12, 0], Ck: Pt = [0, -9], Dk: Pt = [12, 0], Ek: Pt = [0, 0];

// ── isosceles trapezoid: AB = 20, DC = 8, legs 10 ⇒ height 8, area 112, mid 14
const At: Pt = [0, 0], Bt: Pt = [20, 0], Ct: Pt = [14, 8], Dt: Pt = [6, 8];
const H1: Pt = [6, 0], H2: Pt = [14, 0];

const FIGS: Record<string, string> = {
  'eg-shp-009':
    '{"points":{"A":[0,5],"B":[-12,0],"C":[0,-9],"D":[12,0],"E":[0,0]},"polygons":["ABCD"],' +
    '"segments":["AC","BD"],"right":[{"at":"E","from":"A","to":"B"}],' +
    '"ticks":[{"on":"AB","n":1},{"on":"AD","n":1},{"on":"CB","n":2},{"on":"CD","n":2}],' +
    '"labels":[{"on":"AE","text":"5"},{"on":"EC","text":"9"},{"on":"BD","text":"24"}],"width":340}',

  'eg-shp-015':
    '{"points":{"A":[0,0],"B":[20,0],"C":[14,8],"D":[6,8],"H":[6,0],"K":[14,0]},"polygons":["ABCD"],' +
    '"segments":[{"s":"DH","accent":true},{"s":"CK","accent":true}],' +
    '"parallel":[{"on":"AB","n":1},{"on":"DC","n":1}],' +
    '"right":[{"at":"H","from":"D","to":"A"},{"at":"K","from":"B","to":"C"}],' +
    '"ticks":[{"on":"AD","n":1},{"on":"BC","n":1}],' +
    '"labels":[{"on":"AB","text":"20"},{"on":"DC","text":"8"},{"on":"AD","text":"10"}],"width":360}',
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
const near = (a: number, b: number, t = 1e-6) => Math.abs(a - b) < t;

console.log('\n— kite —');
ok('GIVEN AE = 5, EC = 9 (so AC = 14) and BD = 24', near(d(Ak, Ek), 5) && near(d(Ek, Ck), 9) && near(d(Bk, Dk), 24));
ok('the main diagonal is perpendicular to the other and BISECTS it',
  near(angleAt(Ek, Ak, Bk), 90) && near(d(Bk, Ek), d(Ek, Dk)));
ok('it really is a KITE: AB = AD and CB = CD, but AB ≠ CB',
  near(d(Ak, Bk), d(Ak, Dk)) && near(d(Ck, Bk), d(Ck, Dk)) && !near(d(Ak, Bk), d(Ck, Bk)));
ok('ANSWER sides 13 and 15', near(d(Ak, Bk), 13) && near(d(Ck, Bk), 15), `${d(Ak, Bk)} ${d(Ck, Bk)}`);
ok('ANSWER area = 14·24/2 = 168', near((14 * 24) / 2, 168));
ok('ANSWER perimeter = 2(13+15) = 56', near(2 * (d(Ak, Bk) + d(Ck, Bk)), 56));

console.log('\n— isosceles trapezoid —');
ok('AB ∥ DC and it is ISOSCELES (legs equal)', At[1] === Bt[1] && Ct[1] === Dt[1] && near(d(At, Dt), d(Bt, Ct)));
ok('GIVEN AB = 20, DC = 8, leg = 10', near(d(At, Bt), 20) && near(d(Dt, Ct), 8) && near(d(At, Dt), 10));
ok('the dropped heights are perpendicular to AB', near(angleAt(H1, Dt, At), 90) && near(angleAt(H2, Bt, Ct), 90));
ok('ANSWER the offset AH = (20-8)/2 = 6', near(d(At, H1), 6));
ok('ANSWER height = 8 = √(10² - 6²)', near(d(Dt, H1), 8) && near(Math.sqrt(100 - 36), 8));
ok('ANSWER area = (20+8)/2 · 8 = 112', near(((20 + 8) / 2) * 8, 112));
ok('ANSWER midsegment = (20+8)/2 = 14', near((20 + 8) / 2, 14));

console.log(`\n${bad} problem(s)`);
if (!bad) for (const [k, v] of Object.entries(FIGS)) console.log(`\n${k}:\n${v}`);
