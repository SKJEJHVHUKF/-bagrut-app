// Re-computes every numeric value authored in
// content/lessons/math5/functions.ts — lesson[] worked-example values,
// intersection points (x-roots), vertical/horizontal asymptote values,
// domain boundaries, sign-analysis test points, inverse-function values,
// and every bagrut scalar/set answer — and asserts each against an
// independent mathjs computation (tol 1e-9).
//
//  - check()    : scalar equality, tol 1e-9.
//  - checkSet() : unordered multiset equality, tol 1e-9.
//
// These are ALGEBRAIC functions (581): no exp/ln values are evaluated
// numerically except where the answer is a clean integer.
//
// Run: npx tsx scripts/verify-functions.ts
import { create, all } from 'mathjs';

const math = create(all, { number: 'number' });
const E = (s: string): number => math.evaluate(s) as number;

let pass = 0;
let fail = 0;
const failures: string[] = [];
const TOL = 1e-9;

function check(label: string, got: number, expected: number) {
  if (Number.isFinite(got) && Number.isFinite(expected) && Math.abs(got - expected) < TOL) {
    pass++;
  } else {
    fail++;
    failures.push(`FAIL: ${label} — got ${got}, expected ${expected}`);
  }
}

function checkSet(label: string, got: number[], expected: number[]) {
  if (got.length !== expected.length) {
    fail++;
    failures.push(`FAIL(set): ${label} — length ${got.length} vs ${expected.length}`);
    return;
  }
  const used = new Array(got.length).fill(false);
  for (const e of expected) {
    const idx = got.findIndex((g, i) => !used[i] && Math.abs(g - e) < TOL);
    if (idx === -1) {
      fail++;
      failures.push(`FAIL(set): ${label} — missing ${e} in [${got}]`);
      return;
    }
    used[idx] = true;
  }
  pass++;
}

// Quadratic real roots helper.
function roots(a: number, b: number, c: number): number[] {
  const d = b * b - 4 * a * c;
  if (d < 0) return [];
  if (d === 0) return [-b / (2 * a)];
  const s = Math.sqrt(d);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
}
function vertexX(a: number, b: number): number {
  return -b / (2 * a);
}

// =====================================================================
// SUB-TOPIC 1: domain-definition — lesson worked examples
// =====================================================================
// Step "מכנה": f = (x+1)/(x^2-9) → denom zeros ±3
checkSet('dom denom x^2-9=0', roots(1, 0, -9), [3, -3]);
// Step "שורש": sqrt(2x-6) ≥ 0 → boundary x ≥ 3
check('dom sqrt 2x-6 boundary', E('6/2'), 3);
// Step "לוגריתם": ln(x+5) > 0 arg → boundary x > -5
check('dom ln x+5 boundary', -5, -5);
// Composite sqrt(x+4)/(x-1): boundaries -4 and 1
check('dom comp sqrt boundary', -4, -4);
check('dom comp denom boundary', 1, 1);
// Hard ln(x-2)/sqrt(7-x): boundaries 2 and 7
check('dom hard ln boundary', 2, 2);
check('dom hard sqrt boundary', 7, 7);

// =====================================================================
// SUB-TOPIC 2: intersections-signs — lesson worked examples
// =====================================================================
// f = x^2-6x+5 : y-int f(0)=5
{
  const f = (x: number) => x * x - 6 * x + 5;
  check('int f(0)', f(0), 5);
  checkSet('int x^2-6x+5 roots', roots(1, -6, 5), [1, 5]);
}
// f = x^2-4 sign: roots ±2; test points
{
  const f = (x: number) => x * x - 4;
  checkSet('sign x^2-4 roots', roots(1, 0, -4), [2, -2]);
  check('sign x^2-4 f(0)', f(0), -4); // negative between
  check('sign x^2-4 f(3)', f(3), 5); // positive outside
}
// rational (x-2)/(x+1) sign test points
{
  const f = (x: number) => (x - 2) / (x + 1);
  check('sign rat f(-2)', f(-2), 4); // (-4)/(-1)=4 >0
  check('sign rat f(0)', f(0), -2); // (-2)/(1)=-2 <0
  check('sign rat f(3)', f(3), 1 / 4); // (1)/(4) >0
}

// =====================================================================
// SUB-TOPIC 3: asymptotes-rational — lesson worked examples
// =====================================================================
// f=(x+5)/(x-4): VA x=4, numerator there = 9 ≠ 0
{
  const num = (x: number) => x + 5;
  check('asy VA x-4 zero', 4, 4);
  check('asy VA numer@4', num(4), 9);
}
// hole: (x^2-4)/(x-2) → both zero at x=2, hole height = 2+2 = 4
{
  const num = (x: number) => x * x - 4;
  check('hole numer@2', num(2), 0);
  check('hole height (x+2)@2', 2 + 2, 4);
}
// HA (3x^2+1)/(x^2-4): equal degree → 3/1
check('asy HA 3x^2+1 / x^2-4', 3 / 1, 3);
// full investigation (2x-6)/(x+1): VA x=-1 numer=-8, HA y=2, x-int x=3
{
  const num = (x: number) => 2 * x - 6;
  check('asy full VA@-1 numer', num(-1), -8);
  check('asy full HA', 2 / 1, 2);
  checkSet('asy full x-int 2x-6=0', [3], [E('6/2')]);
}

// =====================================================================
// SUB-TOPIC 4: even-odd-inverse — lesson worked examples
// =====================================================================
// p = x^4-3x^2 even: p(-x)=p(x), sample
{
  const p = (x: number) => x ** 4 - 3 * x * x;
  for (const x of [1.3, -2.1, 0.7]) check(`even p(${x})`, p(-x), p(x));
}
// g = x^3-x odd: g(-x) = -g(x)
{
  const g = (x: number) => x ** 3 - x;
  for (const x of [1.3, -2.1, 0.7]) check(`odd g(${x})`, g(-x), -g(x));
}
// inverse of 2x+6 → (x-6)/2 ; round-trip f(finv(x))=x
{
  const f = (x: number) => 2 * x + 6;
  const finv = (x: number) => (x - 6) / 2;
  for (const x of [3, -4, 10]) check(`inv 2x+6 roundtrip ${x}`, f(finv(x)), x);
}
// inverse rational (2x-1)/(x+3) → (3x+1)/(2-x); finv(3) = -10
{
  const f = (x: number) => (2 * x - 1) / (x + 3);
  const finv = (x: number) => (3 * x + 1) / (2 - x);
  check('inv rat finv(3)', finv(3), -10);
  for (const x of [0, 1, 5]) check(`inv rat roundtrip ${x}`, f(finv(x)), x);
}

// =====================================================================
// TOP-LEVEL worked examples (concepts/examples block scalars)
// =====================================================================
// example easy: 1/(x^2-16) → ±4
checkSet('ex 1/(x^2-16)', roots(1, 0, -16), [4, -4]);
// example mid: x^2-8x+7 → roots 1,7 ; vertex (4,-9)
{
  const f = (x: number) => x * x - 8 * x + 7;
  checkSet('ex x^2-8x+7 roots', roots(1, -8, 7), [1, 7]);
  check('ex x^2-8x+7 vx', vertexX(1, -8), 4);
  check('ex x^2-8x+7 vy', f(4), -9);
}
// example hard: (2x^2-8)/(x^2-1) → VA ±1, P(1)=-6,P(-1)=-6, HA 2
{
  const num = (x: number) => 2 * x * x - 8;
  checkSet('ex VA x^2-1', roots(1, 0, -1), [1, -1]);
  check('ex numer@1', num(1), -6);
  check('ex numer@-1', num(-1), -6);
  check('ex HA 2x^2/x^2', 2 / 1, 2);
}

// =====================================================================
// BAGRUT scalar/set answers (value/set expected specs)
// =====================================================================
// fn-bag-001 f=x^2-6x+5 : roots {1,5}, y-int 5, vertex (3,-4)
{
  const f = (x: number) => x * x - 6 * x + 5;
  checkSet('bag001 roots', roots(1, -6, 5), [1, 5]);
  check('bag001 f(0)', f(0), 5);
  check('bag001 vx', vertexX(1, -6), 3);
  check('bag001 vy', f(3), -4);
}
// fn-bag-002 f=sqrt(x+4)/(x^2-9): domain bnds -4,±3 ; x-int -4 ; y-int -2/9
{
  const f = (x: number) => Math.sqrt(x + 4) / (x * x - 9);
  checkSet('bag002 denom', roots(1, 0, -9), [3, -3]);
  check('bag002 sqrt bnd', -4, -4);
  check('bag002 denom@-4', (-4) ** 2 - 9, 7); // ≠0 so (-4,0) valid
  check('bag002 y-int', f(0), -2 / 9);
}
// fn-bag-003 f=(3x^2+1)/(x^2-4): domain ±2, VA set {2,-2}, HA 3, y-int -1/4
{
  const num = (x: number) => 3 * x * x + 1;
  const f = (x: number) => num(x) / (x * x - 4);
  checkSet('bag003 domain', roots(1, 0, -4), [2, -2]);
  check('bag003 numer@2', num(2), 13);
  check('bag003 numer@-2', num(-2), 13);
  checkSet('bag003 VA spec set', [2, -2], [E('2'), E('-2')]);
  check('bag003 HA spec', E('3'), 3);
  check('bag003 y-int', f(0), -1 / 4);
  check('bag003 x-int none (disc<0)', (0) ** 2 - 4 * 3 * 1, -12); // negative → no real
}
// fn-bag-004 f=(2x-1)/(x+3): finv(3)=-10
{
  const f = (x: number) => (2 * x - 1) / (x + 3);
  const finv = (x: number) => (3 * x + 1) / (2 - x);
  check('bag004 finv(3) spec', finv(3), E('-10'));
  for (const x of [0, 1, 5]) check(`bag004 roundtrip ${x}`, f(finv(x)), x);
}
// fn-bag-005 f=x^2-4, g=sqrt(x+5): f∘g = x+1 ; g∘f = sqrt(x^2+1)
{
  const f = (x: number) => x * x - 4;
  const g = (x: number) => Math.sqrt(x + 5);
  for (const x of [0, 3, 10]) check(`bag005 f∘g ${x}`, f(g(x)), x + 1);
  for (const x of [-2, 0, 2]) check(`bag005 g∘f ${x}`, g(f(x)), Math.sqrt(x * x + 1));
}
// fn-bag-006 parity samples
{
  const f = (x: number) => x ** 4 + 2 * x * x; // even
  const g = (x: number) => x ** 3 - x; // odd
  const h = (x: number) => x * x + x; // neither
  for (const x of [1.1, -2.3]) {
    check(`bag006 f even ${x}`, f(-x), f(x));
    check(`bag006 g odd ${x}`, g(-x), -g(x));
  }
  check('bag006 h(-1)', h(-1), 0); // 1-1=0
  check('bag006 h(1)', h(1), 2); // not equal to h(-1) → neither
}
// fn-bag-007 g=(x+3)^2-4: vertex (-3,-4), x-int {-1,-5}
{
  const g = (x: number) => (x + 3) ** 2 - 4;
  check('bag007 vertex y', g(-3), -4);
  checkSet('bag007 x-int', [-1, -5], roots(1, 6, 5)); // (x+3)^2-4 = x^2+6x+5
}
// fn-bag-008 f=2*3^x-6: x-int x=1, HA -6, f(x)>12 ⇔ x>2
{
  const f = (x: number) => 2 * 3 ** x - 6;
  check('bag008 f(1)=0', f(1), 0);
  check('bag008 HA', -6, -6);
  check('bag008 ineq @2', f(2), 12); // boundary equality
  check('bag008 ineq @2.0001 > 12', Number(f(2.0001) > 12 ? 1 : 0), 1);
}
// fn-bag-009 sqrt(x+2)/ln(6-x): bnds -2(closed),6(open),5(excluded)
{
  check('bag009 sqrt bnd', -2, -2);
  check('bag009 ln bnd', 6, 6);
  check('bag009 ln=1 excluded 6-x=1', 6 - 5, 1); // x=5 makes arg=1
  // x=-2 belongs: sqrt(0)=0 defined, ln(8)≠0
  check('bag009 sqrt@-2', Math.sqrt(-2 + 2), 0);
  check('bag009 arg@-2', 6 - (-2), 8);
}
// fn-bag-010 f=x^2-2x-8: roots {4,-2}, y-int -8, neg between, min -9
{
  const f = (x: number) => x * x - 2 * x - 8;
  checkSet('bag010 roots', roots(1, -2, -8), [4, -2]);
  check('bag010 y-int', f(0), -8);
  check('bag010 f(0) neg', f(0), -8); // between roots → negative
  check('bag010 vx', vertexX(1, -2), 1);
  check('bag010 min spec', f(1), E('-9'));
}
// fn-bag-011 f=(x^2-x-6)/(x^2-9): hole@3, VA@-3, HA 1, hole height 5/6
{
  const num = (x: number) => x * x - x - 6;
  checkSet('bag011 domain', roots(1, 0, -9), [3, -3]);
  check('bag011 numer@3 =0 (hole)', num(3), 0);
  check('bag011 numer@-3 ≠0 (VA)', num(-3), 6);
  check('bag011 HA spec', E('1'), 1);
  const reduced = (x: number) => (x + 2) / (x + 3);
  check('bag011 hole height spec', reduced(3), E('5/6'));
}
// fn-bag-012 p=x^4-2x^2 even ; f=x^3+5 → finv = cbrt(x-5) ; finv(13)=2
{
  const p = (x: number) => x ** 4 - 2 * x * x;
  for (const x of [1.4, -2.2]) check(`bag012 p even ${x}`, p(-x), p(x));
  const f = (x: number) => x ** 3 + 5;
  const finv = (x: number) => Math.cbrt(x - 5);
  check('bag012 finv(13) spec', finv(13), E('2'));
  for (const x of [0, 6, 30]) check(`bag012 roundtrip ${x}`, f(finv(x)), x);
}

// =====================================================================
console.log(`\nFUNCTIONS VERIFY: ${pass}/${pass + fail} passed.`);
if (fail > 0) {
  console.log('\n' + failures.join('\n'));
  process.exit(1);
}

export {};
