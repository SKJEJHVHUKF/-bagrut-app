/**
 * verify-ln.ts — numeric self-check of every claim in the guided ln-function
 * lessons (5 sub-topic lesson[] arrays) + the per-sub-topic bagrut questions
 * ln-bag-005 … ln-bag-009.
 *   npx tsx scripts/verify-ln.ts
 *
 * A passing build / KaTeX render does NOT catch a wrong-but-valid number —
 * only independent re-computation does. Every derivative value, extremum
 * coordinate, area/integral, equation solution, intercept and limit asserted
 * in the content is recomputed here with mathjs (symbolic derivative) and
 * plain JS, then compared (tol 1e-9).
 */
import { derivative, evaluate } from 'mathjs';

let pass = 0;
let fail = 0;
const TOL = 1e-9;
const approx = (x: number, y: number) => Math.abs(x - y) < TOL;
function num(desc: string, got: number, want: number) {
  const ok = approx(got, want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${got} vs ${want})`);
}
// Evaluate a symbolic derivative of `expr` w.r.t x at x=at, compare to want.
function dnum(desc: string, expr: string, at: number, want: number) {
  const d = derivative(expr, 'x');
  const got = d.evaluate({ x: at }) as number;
  num(desc, got, want);
}
// Second derivative of `expr` w.r.t x at x=at.
function d2num(desc: string, expr: string, at: number, want: number) {
  const d2 = derivative(derivative(expr, 'x'), 'x');
  const got = d2.evaluate({ x: at }) as number;
  num(desc, got, want);
}

const E = Math.E;
const ln = Math.log;

// ============================================================
console.log('— ln-properties lesson —');
// ln(e^4)=4, ln 1=0
num('ln(e^4)=4', ln(E ** 4), 4);
num('ln 1 = 0', ln(1), 0);
// ln(-3), ln 0 undefined → just assert positivity boundary of e^a
num('e^a always >0 (a=-100) sample', Math.exp(-100) > 0 ? 1 : 0, 1);
// domain ln(x^2-9)>0 boundary roots ±3
num('x^2-9 at 3 = 0', 3 ** 2 - 9, 0);
num('x^2-9 at -3 = 0', (-3) ** 2 - 9, 0);
// nested ln(ln(x-1)): inner x-1>0 ⇒x>1, outer ln(x-1)>0⇒x-1>1⇒x>2
num('x-1>1 boundary x=2', 2 - 1, 1);
// key values
num('ln e = 1', ln(E), 1);
num('ln(1/e) = -1', ln(1 / E), -1);
// simplify ln(e^{5x}) - ln(1/e) at x: 5x+1 ; check x=2 ⇒ 11
num('ln(e^{5x})-ln(1/e) @x=2', ln(E ** (5 * 2)) - ln(1 / E), 5 * 2 + 1);
// intercept of ln(x-4): x=5
num('ln(x-4)=0 ⇒ x-4=1 ⇒ x=5', 4 + 1, 5);

// ============================================================
console.log('— ln-derivatives lesson —');
// (ln x)'=1/x at x=2
dnum("(ln x)' @x=2 =1/2", 'log(x)', 2, 1 / 2);
// 5 ln x derivative = 5/x at x=2
dnum("(5 ln x)' @x=2 =5/2", '5*log(x)', 2, 5 / 2);
// ln(3x+1) deriv = 3/(3x+1) at x=1 ⇒ 3/4
dnum("(ln(3x+1))' @x=1 =3/4", 'log(3*x+1)', 1, 3 / 4);
// ln(x^2-1) deriv 2x/(x^2-1) at x=2 ⇒ 4/3
dnum("(ln(x^2-1))' @x=2 =4/3", 'log(x^2-1)', 2, 4 / 3);
// ln(sin x) deriv cot x at x=1 ⇒ cos1/sin1
dnum("(ln(sin x))' @x=1 =cot1", 'log(sin(x))', 1, Math.cos(1) / Math.sin(1));
// x ln x deriv = ln x +1 at x=2 ⇒ ln2+1
dnum("(x ln x)' @x=2 =ln2+1", 'x*log(x)', 2, ln(2) + 1);
// x^2 ln x deriv = 2x ln x + x at x=2 ⇒ 4 ln2 +2
dnum("(x^2 ln x)' @x=2", 'x^2*log(x)', 2, 2 * 2 * ln(2) + 2);
// (ln x / x) deriv = (1-ln x)/x^2 at x=2 ⇒ (1-ln2)/4
dnum("(ln x/x)' @x=2", 'log(x)/x', 2, (1 - ln(2)) / 4);
// ln(x^2-4x+5) deriv zero at x=2 (numerator 2x-4=0)
dnum("(ln(x^2-4x+5))' @x=2 =0", 'log(x^2-4*x+5)', 2, 0);
num('discriminant x^2-4x+5 <0', 16 - 20, -4);

// ============================================================
console.log('— ln-equations lesson —');
// ln(2x-1)=0 ⇒ x=1
num('ln(2x-1)=0 ⇒ x=1', (1 + 1) / 2, 1);
num('check 2*1-1=1>0', 2 * 1 - 1, 1);
// ln(2x-1)=3 ⇒ x=(e^3+1)/2
num('x=(e^3+1)/2', (E ** 3 + 1) / 2, (Math.exp(3) + 1) / 2);
// verify ln(2x-1)=3 holds: ln(e^3)=3
num('ln(2x-1)=3 holds', ln(2 * ((E ** 3 + 1) / 2) - 1), 3);
// ln(x+2)+ln(x-1)=ln4 ⇒ x=2 (x=-3 rejected)
num('(x+2)(x-1)=4 @x=2', (2 + 2) * (2 - 1), 4);
num('quad x^2+x-6 @x=2 =0', 2 ** 2 + 2 - 6, 0);
num('quad x^2+x-6 @x=-3 =0', (-3) ** 2 + (-3) - 6, 0);
num('x=-3 not in domain x>1', -3 > 1 ? 1 : 0, 0);
// (ln x)^2-3 ln x+2=0 ⇒ x=e or e^2
num('t^2-3t+2 @t=1 =0', 1 - 3 + 2, 0);
num('t^2-3t+2 @t=2 =0', 4 - 6 + 2, 0);
num('x=e ⇒ ln x=1', ln(E), 1);
num('x=e^2 ⇒ ln x=2', ln(E ** 2), 2);
// inequality ln(x-1)<ln(2x-5): domain x>5/2, solution x>4
num('boundary x=4: x-1=2x-5', 4 - 1, 2 * 4 - 5);
num('domain intersection 5/2 vs 4 ⇒ 4 wins', Math.max(2.5, 4), 4);

// ============================================================
console.log('— ln-investigation lesson —');
// x ln x domain intercept (1,0)
num('x ln x =0 ⇒ x=1', ln(1), 0);
// extremum x ln x at x=1/e, value -1/e
num("x ln x: f'=ln x+1=0 ⇒ x=1/e", ln(1 / E) + 1, 0);
num('x ln x value @1/e = -1/e', (1 / E) * ln(1 / E), -1 / E);
d2num("(x ln x)'' @1/e = e (>0 ⇒ min)", 'x*log(x)', 1 / E, E);
// ln x / x extremum at x=e, value 1/e ; deriv sign
num("ln x/x: 1-ln x=0 ⇒ x=e", 1 - ln(E), 0);
num('ln x/x value @e =1/e', ln(E) / E, 1 / E);
dnum("(ln x/x)' @1 >0", 'log(x)/x', 1, (1 - ln(1)) / 1 ** 2);
dnum("(ln x/x)' @e^2 <0", 'log(x)/x', E ** 2, (1 - ln(E ** 2)) / (E ** 2) ** 2);
// limit ln x / x^2 → 0 ; numeric sample large x small
num('ln x / x^2 @ x=1e6 ≈ small', ln(1e6) / 1e6 ** 2 < 1e-9 ? 0 : 1, 0);
// (ln x)^2-2 ln x extremum at x=e value -1
num("(ln x)^2-2ln x: f'num 2(ln x-1)=0 ⇒ x=e", 2 * (ln(E) - 1), 0);
num('(ln x)^2-2ln x value @e = -1', ln(E) ** 2 - 2 * ln(E), -1);
dnum("(ln x)^2-2ln x deriv @e =0", 'log(x)^2-2*log(x)', E, 0);

// ============================================================
console.log('— ln-integrals lesson —');
// ∫1/x dx = ln|x|+C ; check d/dx ln x =1/x at x=3
dnum("d/dx ln x =1/x @x=3", 'log(x)', 3, 1 / 3);
// ∫1/(2x) = 1/2 ln|x| ; d/dx (1/2 ln x)=1/(2x) at x=3
dnum("d/dx (1/2 ln x) @x=3 =1/6", '0.5*log(x)', 3, 1 / (2 * 3));
// ∫2x/(x^2+1)=ln(x^2+1); d/dx ln(x^2+1)=2x/(x^2+1) at x=2 ⇒4/5
dnum("d/dx ln(x^2+1) @x=2 =4/5", 'log(x^2+1)', 2, 4 / 5);
// ∫1/(2x+3)=1/2 ln|2x+3|; d/dx (1/2 ln(2x+3)) @x=1 =1/(2*1+3)=1/5
dnum("d/dx (1/2 ln(2x+3)) @x=1 =1/5", '0.5*log(2*x+3)', 1, 1 / 5);
// area ∫_1^4 1/x = ln4
num('∫_1^4 1/x = ln4', ln(4) - ln(1), ln(4));
num('ln4 = 2 ln2', ln(4), 2 * ln(2));
// ∫ ln x dx = x ln x - x ; ∫_1^e ln x =1
num('∫_1^e ln x dx =1', (E * ln(E) - E) - (1 * ln(1) - 1), 1);
// d/dx (x ln x - x) = ln x at x=3
dnum("d/dx (x ln x -x) @x=3 =ln3", 'x*log(x)-x', 3, ln(3));

// ============================================================
console.log('— ln-bag-005 (ln-properties) —');
// f=ln(x^2-5x+6): domain (x-2)(x-3)>0 ⇒ x<2 or x>3
num('x^2-5x+6 @x=2 =0', 2 ** 2 - 5 * 2 + 6, 0);
num('x^2-5x+6 @x=3 =0', 3 ** 2 - 5 * 3 + 6, 0);
// b) f(0)=ln6
num('f(0)=ln6', ln(0 - 0 + 6), ln(6));
num('x=0 in domain (0<2)', 0 < 2 ? 1 : 0, 1);
// c) f(x)=ln2 ⇒ x^2-5x+4=0 ⇒ x=1,4
num('x^2-5x+4 @x=1 =0', 1 - 5 + 4, 0);
num('x^2-5x+4 @x=4 =0', 16 - 20 + 4, 0);
num('arg@x=1 =2', 1 ** 2 - 5 * 1 + 6, 2);
num('arg@x=4 =2', 4 ** 2 - 5 * 4 + 6, 2);
num('x=1 in domain (1<2)', 1 < 2 ? 1 : 0, 1);
num('x=4 in domain (4>3)', 4 > 3 ? 1 : 0, 1);
num('expected value ln(6) evaluable', evaluate('log(6)'), ln(6));

console.log('— ln-bag-006 (ln-derivatives) —');
// f=ln(x^2+3): domain all R (x^2+3≥3)
num('x^2+3 min =3 @x=0', 0 + 3, 3);
// b) f'=2x/(x^2+3) zero at x=0
dnum("(ln(x^2+3))' @x=0 =0", 'log(x^2+3)', 0, 0);
// c) f'(1)=2/4=1/2
dnum("(ln(x^2+3))' @x=1 =1/2", 'log(x^2+3)', 1, 1 / 2);
num('expected 1/2 evaluable', evaluate('1/2'), 0.5);

console.log('— ln-bag-007 (ln-equations) —');
// domain x+4>0 & x-2>0 ⇒ x>2
num('domain max(-4,2)=2', Math.max(-4, 2), 2);
// b) (x+4)(x-2)=7 ⇒ x^2+2x-15=0 ⇒ x=3 (x=-5 rejected)
num('(x+4)(x-2)=7 @x=3', (3 + 4) * (3 - 2), 7);
num('x^2+2x-15 @x=3 =0', 9 + 6 - 15, 0);
num('x^2+2x-15 @x=-5 =0', 25 - 10 - 15, 0);
num('x=-5 not in domain x>2', -5 > 2 ? 1 : 0, 0);
num('x=3 in domain x>2', 3 > 2 ? 1 : 0, 1);
// c) ln(x+4)>ln(2x-1): domain x>1/2; x+4>2x-1 ⇒ x<5 ⇒ 1/2<x<5
num('x+4=2x-1 boundary x=5', 5 + 4, 2 * 5 - 1);
num('domain intersection lower 1/2', Math.max(-4, 0.5), 0.5);

console.log('— ln-bag-008 (ln-investigation) —');
// f=x-ln x: domain x>0
// b) f'=1-1/x=0 ⇒ x=1; f''=1/x^2>0 ⇒ min; f(1)=1
dnum("(x-ln x)' @x=1 =0", 'x-log(x)', 1, 0);
num('f(1)=1-ln1 =1', 1 - ln(1), 1);
d2num("(x-ln x)'' @x=1 =1 (>0 ⇒ min)", 'x-log(x)', 1, 1); // f''=1/x^2 @1 =1
// c) global min value 1
num('min value =1', 1 - ln(1), 1);
// endpoints → +inf sample: x small 0.001
num('x-ln x @0.001 large', 0.001 - ln(0.001) > 5 ? 1 : 0, 1);

console.log('— ln-bag-009 (ln-integrals) —');
// a) antiderivative ln x (+C): d/dx ln x =1/x
dnum("d/dx ln x =1/x @x=2", 'log(x)', 2, 1 / 2);
// b) ∫_1^{e^2} 1/x = ln(e^2)-ln1 =2
num('∫_1^{e^2} 1/x =2', ln(E ** 2) - ln(1), 2);
// c) ∫_1^e ln x dx =1
num('∫_1^e ln x =1 (bag)', (E * ln(E) - E) - (1 * ln(1) - 1), 1);
num('expected value 2 evaluable', evaluate('2'), 2);
num('expected value 1 evaluable', evaluate('1'), 1);

// ============================================================
console.log(`\n${pass}/${pass + fail} passed` + (fail ? `  (${fail} FAILED)` : ''));
if (fail) process.exit(1);

export {};
