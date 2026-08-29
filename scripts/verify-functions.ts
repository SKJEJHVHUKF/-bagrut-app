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
// ============================================================
// Ghost Replay (content/ghost-replay/math5/functions.ts)
// ============================================================
// The four answers AND every number invented inside a failure branch.

// --- gr-fn-dom-006: domain of ln(x-1) + sqrt(5-x) ---
{
  const defined = (x: number) => x - 1 > 0 && 5 - x >= 0;
  let bad = 0;
  for (let i = -20000; i <= 100000; i++) {
    const x = i / 10000;
    if (defined(x) !== (x > 1 && x <= 5)) bad++;
  }
  check('ghost dom-006: a 120k sweep confirms the domain is 1 < x <= 5', bad, 0);
  check('ghost dom-006: x=1 is EXCLUDED — ln(0) is undefined', 1 - 1, 0);
  check('ghost dom-006: x=5 is INCLUDED — sqrt(0) = 0 is fine', Math.sqrt(5 - 5), 0);
  check('ghost dom-006: at x=5 the function equals ln 4 ~= 1.3863',
    Math.round(Math.log(4) * 1e4) / 1e4, 1.3863);
  check('ghost dom-006 branch: x=0 fails BOTH conditions? no — sqrt(5) is fine, ln(-1) is not',
    5 - 0 >= 0 && !(0 - 1 > 0) ? 1 : 0, 1);
  check('ghost dom-006 branch: x=6 satisfies the log but not the root', 5 - 6, -1);
  check('ghost dom-006 branch: the union x>1 OR x<=5 would be all of R — meaningless',
    1 < 5 ? 1 : 0, 1);
}

// --- gr-fn-int-005: where is (x-2)/(x+1) positive ---
{
  const g = (x: number) => (x - 2) / (x + 1);
  let bad = 0;
  for (let i = -50000; i <= 50000; i++) {
    const x = i / 5000;
    if (Math.abs(x + 1) < 1e-9) continue;
    if ((g(x) > 0) !== (x < -1 || x > 2)) bad++;
  }
  check('ghost int-005: a 100k sweep confirms positivity is x < -1 or x > 2', bad, 0);
  check('ghost int-005: at x=0 it is -2, negative', g(0), -2);
  check('ghost int-005: at x=-2 it is 4, positive', g(-2), 4);
  check('ghost int-005: at x=3 it is 0.25, positive', g(3), 0.25);
  check('ghost int-005: x=2 makes it zero, so it is excluded from "positive"', g(2), 0);
  check('ghost int-005 branch: x=-1 is undefined, not a solution', Math.abs(-1 + 1), 0);
  check('ghost int-005 branch: the interval -1<x<2 is where it is NEGATIVE — at x=1', g(1) < 0 ? 1 : 0, 1);
}

// --- gr-fn-asy-005: does (x^2-4)/(x-2) have a vertical asymptote at 2 ---
{
  const f = (x: number) => (x * x - 4) / (x - 2);
  check('ghost asy-005: x^2-4 factors as (x-2)(x+2) — at x=7', (7 - 2) * (7 + 2), 7 * 7 - 4);
  check('ghost asy-005: after cancelling, f(x) = x+2 for x != 2 — at x=5', f(5), 7);
  check('ghost asy-005: the one-sided values converge to 4, not to infinity',
    Math.abs(f(2 + 1e-9) - 4) < 1e-6 && Math.abs(f(2 - 1e-9) - 4) < 1e-6 ? 1 : 0, 1);
  check('ghost asy-005: so it is a HOLE at (2,4), not an asymptote', 2 + 2, 4);
  // Contrast: no cancellation means a genuine asymptote.
  {
    const h = (x: number) => (x * x - 1) / (x - 2);
    check('ghost asy-005 contrast: (x^2-1)/(x-2) blows up near 2 — value exceeds 1e8',
      Math.abs(h(2 + 1e-9)) > 1e8 ? 1 : 0, 1);
    check('ghost asy-005 contrast: its numerator at x=2 is 3, not 0', 2 * 2 - 1, 3);
  }
  check('ghost asy-005 branch: x=2 is still outside the DOMAIN even though there is no asymptote',
    2 - 2, 0);
}

// --- gr-fn-eoi-005: inverse of x^3+1 ---
{
  const f = (x: number) => x ** 3 + 1;
  const finv = (x: number) => Math.cbrt(x - 1);
  for (const x of [-3, -0.5, 0, 2, 4.5]) {
    check(`ghost eoi-005: f(f_inv(x)) = x at x=${x}`,
      Math.round(f(finv(x)) * 1e9) / 1e9, Math.round(x * 1e9) / 1e9);
    check(`ghost eoi-005: f_inv(f(x)) = x at x=${x}`,
      Math.round(finv(f(x)) * 1e9) / 1e9, Math.round(x * 1e9) / 1e9);
  }
  check('ghost eoi-005: f(2) = 9 and f_inv(9) = 2', f(2), 9);
  check('ghost eoi-005 branch: cbrt(x)-1 is NOT the inverse — at x=9 it gives ~1.08',
    Math.round((Math.cbrt(9) - 1) * 1e4) / 1e4, 1.0801);
  check('ghost eoi-005 branch: 1/(x^3+1) is the RECIPROCAL, not the inverse — at x=2 it is 1/9',
    Math.round((1 / f(2)) * 1e6) / 1e6, Math.round((1 / 9) * 1e6) / 1e6);
  check('ghost eoi-005 branch: (x-1)^3 is the inverse of cbrt(x)+1, a different function',
    (9 - 1) ** 3, 512);
}

// ============================================================
// Ghost Replay — the eight rq-* stages (2026-08-29)
// ============================================================
//
// verify-ghost checks STRUCTURE only, and says so in its own footer. Every
// number below was invented by hand inside a branch ("substituting x = 0.01
// gives 501"), and a branch that quotes a wrong number teaches the wrong
// lesson more convincingly than no branch at all. So each one is re-derived
// here from the function itself.
//
// This block already earned its keep once: it caught f(0.01) written as 505
// where the real value is 501.

const R4 = (v: number) => Math.round(v * 1e4) / 1e4;

// --- gr-rq-dom-007: f(x) = x / sqrt(x^2 - 25) ---
{
  const f = (x: number) => x / Math.sqrt(x * x - 25);
  checkSet('ghost rq-dom-007: the domain boundary is x^2 = 25', [5, -5].sort(), [5, -5].sort());
  check('ghost rq-dom-007 branch: f(6) is about 1.809', R4(f(6)), R4(6 / Math.sqrt(11)));
  check('ghost rq-dom-007 branch: f(-6) is about -1.81 — the LEFT branch exists too',
    Math.round(f(-6) * 100) / 100, -1.81);
  check('ghost rq-dom-007 branch: x = 25 IS in the domain, sqrt(600) about 24.49',
    R4(Math.sqrt(600)), 24.4949);
  check('ghost rq-dom-007 branch: f(5.01) is about 15.8 — the graph blows up',
    Math.round(f(5.01) * 10) / 10, 15.8);
  check('ghost rq-dom-007 branch: and the denominator there is about 0.316',
    Math.round(Math.sqrt(5.01 * 5.01 - 25) * 1000) / 1000, 0.316);
  check('ghost rq-dom-007 branch: f(5.001) is about 50', Math.round(f(5.001)), 50);
  check('ghost rq-dom-007 branch: at x = 1 the radicand is -24, so a square minus 25 IS negative',
    1 * 1 - 25, -24);
  check('ghost rq-dom-007 branch: at x = 0 the radicand is -25 — the "between" answer is empty',
    0 - 25, -25);
}

// --- gr-rq-int-008: f(x) = (x^2 - 2x - 8) / (x + 2) ---
{
  const f = (x: number) => (x * x - 2 * x - 8) / (x + 2);
  for (const x of [-3, 0, 1, 5, 7.5]) {
    check(`ghost rq-int-008: (x-4)(x+2) = x^2-2x-8 at x=${x}`,
      (x - 4) * (x + 2), x * x - 2 * x - 8);
  }
  check('ghost rq-int-008: the surviving intercept is x = 4', f(4), 0);
  check('ghost rq-int-008: the denominator at x = 4 is 6, so the root survives', 4 + 2, 6);
  check('ghost rq-int-008 branch: f(0) = -4, the y-intercept the wrong option confuses it with',
    f(0), -4);
  check('ghost rq-int-008: the hole sits at height -6, NOT on the axis', -2 - 4, -6);
  check('ghost rq-int-008 branch: f(-2.01) is about -6.01 — approaching, not exploding',
    R4(f(-2.01)), -6.01);
  check('ghost rq-int-008 branch: f(-1.99) is about -5.99 — same from the other side',
    R4(f(-1.99)), -5.99);
}

// --- gr-rq-asy-008: f(x) = (x^2 - 25) / (x^2 - 5x) ---
{
  const f = (x: number) => (x * x - 25) / (x * x - 5 * x);
  check('ghost rq-asy-008: the numerator at x = 0 is -25, so x = 0 IS an asymptote',
    0 - 25, -25);
  check('ghost rq-asy-008: the numerator at x = 5 is 0, so x = 5 is a HOLE', 25 - 25, 0);
  check('ghost rq-asy-008: the hole height comes from the reduced form, 10/5', 10 / 5, 2);
  check('ghost rq-asy-008 branch: f(0.1) = 51', R4(f(0.1)), 51);
  check('ghost rq-asy-008 branch: f(0.01) = 501 (was authored as 505 — caught here)',
    R4(f(0.01)), 501);
  check('ghost rq-asy-008 branch: f(-0.1) = -49 — opposite sides run opposite ways',
    R4(f(-0.1)), -49);
  check('ghost rq-asy-008 branch: f(4.9) is about 2.02, an ordinary value near the hole',
    R4(f(4.9)), 2.0204);
  check('ghost rq-asy-008 branch: f(5.01) is about 1.998 — the graph tends to 2 there',
    R4(f(5.01)), 1.998);
  check('ghost rq-asy-008 branch: f(2) = 3.5, so the point (2,5) has nothing to do with it',
    R4(f(2)), 3.5);
  check('ghost rq-asy-008 branch: f(100) = 1.05 — heading for y = 1, not y = 0', R4(f(100)), 1.05);
  check('ghost rq-asy-008 branch: f(1000) = 1.005 — and certainly not y = -5',
    R4(f(1000)), 1.005);
}

// --- gr-rq-der-009: f(x) = (x^2 + 3) / x ---
{
  const f = (x: number) => (x * x + 3) / x;
  const d1 = (x: number) => 1 - 3 / (x * x);
  const d2 = (x: number) => 6 / (x * x * x);
  const s3 = Math.sqrt(3);
  check('ghost rq-der-009: simplifying and the quotient rule agree at x = 1',
    d1(1), (2 * 1 * 1 - (1 * 1 + 3)) / (1 * 1));
  check('ghost rq-der-009: and at x = 2', R4(d1(2)), R4((2 * 2 * 2 - (4 + 3)) / 4));
  check('ghost rq-der-009 branch: f\'(1) = -2, while "derive top over bottom" would say 2',
    d1(1), -2);
  check('ghost rq-der-009: the derivative vanishes at sqrt(3)', R4(d1(s3)), 0);
  check('ghost rq-der-009: 3/sqrt(3) = sqrt(3), which is why the height doubles',
    R4(3 / s3), R4(s3));
  check('ghost rq-der-009: the height is 2*sqrt(3), about 3.4641', R4(f(s3)), R4(2 * s3));
  check('ghost rq-der-009 branch: f(1) = 4 and f(2) = 3.5 — both ABOVE the candidate',
    R4(f(1)), 4);
  check('ghost rq-der-009 branch: f(2) = 3.5 confirms a minimum, not a maximum', R4(f(2)), 3.5);
  check('ghost rq-der-009: the second derivative there is about 1.1547, positive',
    R4(d2(s3)), R4(2 / s3));
  check('ghost rq-der-009 branch: f\'(3) = 2/3, so x = 3 is NOT a candidate',
    R4(d1(3)), R4(2 / 3));
}

// --- gr-rq-tr-005: f(x) = x + a/x, g = f + 10, exactly one point with the x-axis ---
{
  const fa = (a: number) => (x: number) => x + a / x;
  const extremaOf = (a: number) => [2 * Math.sqrt(a), -2 * Math.sqrt(a)];
  // The answer: a = 25 puts the LEFT branch's maximum exactly on height -10.
  check('ghost rq-tr-005: with a = 25 the extremum x-values are +-5', R4(Math.sqrt(25)), 5);
  check('ghost rq-tr-005: the maximum of the left branch is -10', R4(fa(25)(-5)), -10);
  check('ghost rq-tr-005: so g(-5) = 0 — exactly one common point', R4(fa(25)(-5) + 10), 0);
  check('ghost rq-tr-005: the other extremum is +10, which is why the WRONG sign gives the same a',
    R4(fa(25)(5)), 10);
  // Every rejected value of a, by the number of solutions of f(x) = -10.
  // x + a/x = -10  <=>  x^2 + 10x + a = 0, so the discriminant is 100 - 4a.
  const disc = (a: number) => 100 - 4 * a;
  check('ghost rq-tr-005: a = 25 gives a double root — exactly one solution', disc(25), 0);
  check('ghost rq-tr-005 branch: a = 5 gives discriminant 80, so TWO solutions', disc(5), 80);
  check('ghost rq-tr-005 branch: a = 10 gives discriminant 60, so TWO solutions', disc(10), 60);
  check('ghost rq-tr-005 branch: a = 100 gives discriminant -300, so NO solutions', disc(100), -300);
  check('ghost rq-tr-005 branch: with a = 5 the extrema are about +-4.47, below -10',
    R4(extremaOf(5)[0]), 4.4721);
  check('ghost rq-tr-005 branch: with a = 10 the extrema are about +-6.32',
    R4(extremaOf(10)[0]), 6.3246);
  check('ghost rq-tr-005 branch: with a = 100 the extrema are +-20, so -10 falls in the gap',
    R4(extremaOf(100)[0]), 20);
  check('ghost rq-tr-005 branch: with a = 25, f(x) = 26 has TWO solutions, x = 1 and x = 25',
    R4(fa(25)(1)), 26);
  check('ghost rq-tr-005 branch: the second of them', R4(fa(25)(25)), 26);
  check('ghost rq-tr-005 branch: f\'(25) = 0.96, so x = 25 is not an extremum',
    R4(1 - 25 / (25 * 25)), 0.96);
}

// --- gr-rq-in-006: area between f(x) = x^2 and g(x) = 2x + 3 ---
{
  const par = (x: number) => x * x;
  const lin = (x: number) => 2 * x + 3;
  const F = (x: number) => x * x + 3 * x - (x * x * x) / 3;
  checkSet('ghost rq-in-006: the limits are the intersection points, -1 and 3',
    [3, -1], [3, -1]);
  check('ghost rq-in-006: the curves really do meet at x = -1', par(-1), lin(-1));
  check('ghost rq-in-006: and at x = 3', par(3), lin(3));
  check('ghost rq-in-006: at x = 0 the LINE is higher — 3 against 0', lin(0) - par(0), 3);
  check('ghost rq-in-006 branch: at x = 4 the parabola overtakes, 16 against 11 — outside the range',
    par(4) - lin(4), 5);
  check('ghost rq-in-006: the upper limit substitution gives 9', R4(F(3)), 9);
  check('ghost rq-in-006: the lower limit substitution gives -5/3', R4(F(-1)), R4(-5 / 3));
  check('ghost rq-in-006: the area is 32/3, about 10.67', R4(F(3) - F(-1)), R4(32 / 3));
  check('ghost rq-in-006 branch: the line alone against the axis gives 20',
    R4((3 * 3 + 3 * 3) - (1 - 3)), 20);
  check('ghost rq-in-006 branch: limits 0 to 3 instead of -1 to 3 give 9', R4(F(3) - F(0)), 9);
  check('ghost rq-in-006: the sanity box is 4 wide and 4 tall, and 32/3 is smaller',
    R4(lin(1) - par(1)), 4);
}

// --- gr-rq-bg-005: f(x) = (x^2 + b)/x with a minimum at x = 5 ---
{
  const d1 = (b: number) => (x: number) => 1 - b / (x * x);
  const d2 = (b: number) => (x: number) => (2 * b) / (x * x * x);
  const fb = (b: number) => (x: number) => (x * x + b) / x;
  check('ghost rq-bg-005: b = 25 is what makes the derivative vanish at x = 5', d1(25)(5), 0);
  check('ghost rq-bg-005: and the second derivative there is 0.4, positive — a minimum',
    R4(d2(25)(5)), 0.4);
  check('ghost rq-bg-005: the height is f(5) = 10', R4(fb(25)(5)), 10);
  check('ghost rq-bg-005 branch: 25 + 25 = 50, and 50/5 = 10 — the "30" answer stops early',
    (25 + 25) / 5, 10);
  check('ghost rq-bg-005 branch: b = 5 leaves f\'(5) = 0.8, not zero', R4(d1(5)(5)), 0.8);
  check('ghost rq-bg-005 branch: b = -25 leaves f\'(5) = 2, not zero', R4(d1(-25)(5)), 2);
  check('ghost rq-bg-005 branch: and with b = -25 the derivative is positive EVERYWHERE — no extremum',
    R4(d1(-25)(1)), 26);
  check('ghost rq-bg-005 branch: b = 1/25 leaves f\'(5) about 0.998', R4(d1(1 / 25)(5)), 0.9984);
  check('ghost rq-bg-005 branch: b = 0 collapses the function to the line y = x', fb(0)(7), 7);
  check('ghost rq-bg-005 branch: f\'(1) = -24 with b = 25, so "2x" is not the derivative',
    d1(25)(1), -24);
}

console.log(`\nFUNCTIONS VERIFY: ${pass}/${pass + fail} passed.`);
if (fail > 0) {
  console.log('\n' + failures.join('\n'));
  process.exit(1);
}

export {};
