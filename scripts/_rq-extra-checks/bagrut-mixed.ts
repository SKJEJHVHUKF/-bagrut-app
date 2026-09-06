// Numeric re-derivation of content/lessons/math5/rq-extra/bagrut-mixed.ts (rq-sub-bg-101…110).
// Every derivative is proved SYMBOLICALLY (dcheck), every area re-integrated by quadrature from the
// question's own function and bounds, every domain / asymptote / "which statement" / "how many
// mistakes" / נמק claim encoded as a computation, and every distractor / wrongAnswer note re-enacted
// as the mistake it names and required to land on THAT option.
import { check, dcheck, checkSet, icheck, summary, math, E } from './_lib';
import { RQ_EXTRA } from '../../content/lessons/math5/rq-extra';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number) => c.evaluate({ x: v }) as number;
};
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
/** number of sign changes of expr on a grid over [lo, hi] (skipping non-finite samples) */
function signChanges(expr: string, lo: number, hi: number, n = 4000): number {
  const g = f(expr);
  let prev = NaN, count = 0;
  for (let i = 0; i <= n; i++) {
    const v = g(lo + (i * (hi - lo)) / n);
    if (!Number.isFinite(v)) { prev = NaN; continue; }
    if (Number.isFinite(prev) && sgn(prev) !== sgn(v)) count++;
    prev = v;
  }
  return count;
}
/** minimum of expr on a grid over [lo, hi] */
function gridMin(expr: string, lo: number, hi: number, n = 20000): number {
  const g = f(expr);
  let m = Infinity;
  for (let i = 0; i <= n; i++) m = Math.min(m, g(lo + (i * (hi - lo)) / n));
  return m;
}
/** maximum of expr on a grid over [lo, hi] */
const gridMax = (expr: string, lo: number, hi: number, n = 20000) => -gridMin(`-(${expr})`, lo, hi, n);

// rq-sub-bg-101 — f = 4/sqrt(x-3): root in the denominator → x > 3, vertical asymptote x = 3
{
  const rad = f('x - 3');
  check('101 radicand negative just below 3', sgn(rad(2.999)), -1);
  check('101 radicand positive just above 3', sgn(rad(3.001)), 1);
  check('101 denominator at 3 is 0 (3 excluded, so strict)', E('sqrt(3 - 3)'), 0);
  check('101 numerator at 3 is 4 ≠ 0 → asymptote, not a hole', sgn(4), 1);
  check('101 d3 note: f(3.01) = 40', f('4/sqrt(x - 3)')(3.01), 40);
  check('101 d2 note: radicand at x = 1 is -2', rad(1), -2);
  check('101 f blows up toward 3+', f('4/sqrt(x - 3)')(3 + 1e-12) > 1e5 ? 1 : 0, 1);
}

// rq-sub-bg-102 — f = (x^2+3x+16)/x, given f' = 1 - 16/x^2: minimum on x > 0 is (4, 11)
{
  const F = '(x^2 + 3x + 16)/x';
  dcheck('102 given derivative matches f', F, '1 - 16/x^2', [0.5, 1, 2, 4, -1, -2.5]);
  checkSet('102 f\' = 0 ⇔ x^2 = 16', [E('sqrt(16)'), -E('sqrt(16)')], [4, -4]);
  check('102 candidate -4 is outside x > 0', sgn(-E('sqrt(16)')), -1);
  check('102 height from the ORIGINAL function f(4)', f(F)(4), 11);
  // classification by the SIGN TABLE of f', not by f''
  dcheck('102 f\' on a common denominator is (x^2-16)/x^2', F, '(x^2 - 16)/x^2', [0.5, 1, 2, 4, -1, -2.5]);
  const fp102 = f('(x^2 - 16)/x^2');
  check('102 table col x < -4: f\' > 0', sgn(fp102(-5)), 1);
  check('102 table col -4 < x < 0: f\' < 0', sgn(fp102(-2)), -1);
  check('102 table col 0 < x < 4: f\' < 0', sgn(fp102(2)), -1);
  check('102 table col x > 4: f\' > 0', sgn(fp102(5)), 1);
  check('102 sign flips - → + at 4, so (4, 11) is a MINIMUM', sgn(fp102(5)) - sgn(fp102(2)), 2);
  // d1 (4, 0): height read off the derivative → f'(4)
  check('102 d1 f\'(4) = 0', f('1 - 16/x^2')(4), 0);
  // d2 (4, 8): 3x term dropped → (16 + 16)/4
  check('102 d2 (x^2+16)/x at 4', f('(x^2 + 16)/x')(4), 8);
  check('102 d2 note: 16 + 12 + 16 = 44', E('16 + 12 + 16'), 44);
  // d3 (-4, -5): the left-branch maximum
  check('102 d3 f(-4)', f(F)(-4), -5);
  check('102 d3 sign flips + → - at -4, so (-4, -5) is the left-branch MAXIMUM', sgn(fp102(-5)) - sgn(fp102(-2)), 2);
}

// rq-sub-bg-103 — f = (x-6)/(x^2-9): y-intercept height 2/3 (0 in domain, double negative)
{
  const F = '(x - 6)/(x^2 - 9)';
  check('103 denominator at 0 is -9 ≠ 0 → 0 in domain', f('x^2 - 9')(0), -9);
  checkSet('103 excluded values ±3', math.polynomialRoot(-9, 0, 1) as number[], [3, -3]);
  check('103 f(0) = 2/3', f(F)(0), E('2/3'));
  // w1 -2/3: denominator sign lost → -6/9
  check('103 w1 -6/9', E('-6/9'), E('-2/3'));
  // w2 6: numerator zero (x-intercept) instead of f(0)
  checkSet('103 w2 root of numerator', math.polynomialRoot(-6, 1) as number[], [6]);
  // w3 -6: substituted 0 in the numerator only
  check('103 w3 numerator at 0', f('x - 6')(0), -6);
}

// rq-sub-bg-104 — f = (x^2-4)/x^2: area between graph, x-axis and x = 1 → S = 1 (graph below axis)
{
  const F = '(x^2 - 4)/x^2';
  checkSet('104 x-intercepts', math.polynomialRoot(-4, 0, 1) as number[], [2, -2]);
  check('104 f(1) = -3 → below the axis on [1, 2]', f(F)(1), -3);
  check('104 no sign change on (1, 2)', signChanges(F, 1.0001, 1.9999), 0);
  dcheck('104 F = x + 4/x integrates f', 'x + 4/x', F, [0.5, 1, 1.5, 2, 3]);
  icheck('104 ∫_1^2 f = -1', F, 1, 2, -1);
  check('104 F(2) - F(1) = 4 - 5', f('x + 4/x')(2) - f('x + 4/x')(1), -1);
  check('104 area = |integral| = 1', Math.abs(f('x + 4/x')(2) - f('x + 4/x')(1)), 1);
  // w2 3: antiderivative written x - 4/x
  check('104 w2 (x - 4/x) from 1 to 2', f('x - 4/x')(2) - f('x - 4/x')(1), 3);
  // w3 4: F at the upper bound only
  check('104 w3 F(2)', f('x + 4/x')(2), 4);
}

// rq-sub-bg-105 — f = x^2/(x-2): decreasing on 0 < x < 2 or 2 < x < 4 (split at the excluded 2)
{
  const F = 'x^2/(x - 2)';
  const FP = '(x^2 - 4x)/(x - 2)^2';
  dcheck('105 quotient-rule derivative', F, FP, [-1, 0.5, 1, 3, 5]);
  checkSet('105 f\' = 0 at 0 and 4', math.polynomialRoot(0, -4, 1) as number[], [0, 4]);
  check('105 f\'(1) < 0', sgn(f(FP)(1)), -1);
  check('105 f\'(3) < 0', sgn(f(FP)(3)), -1);
  check('105 f\'(-1) > 0', sgn(f(FP)(-1)), 1);
  check('105 f\'(5) > 0', sgn(f(FP)(5)), 1);
  check('105 denominator of f vanishes at 2', f('x - 2')(2), 0);
  check('105 numerator of f at 2 is 4 ≠ 0 → asymptote', f('x^2')(2), 4);
  check('105 (x-2)^2 positive on both sides of 2', sgn(f('(x - 2)^2')(1.9)) + sgn(f('(x - 2)^2')(2.1)), 2);
  // d2 note: numerator of f' at 1 is -3, denominator 1
  check('105 d2 note numerator at 1', f('x^2 - 4x')(1), -3);
  check('105 d2 note denominator at 1', f('(x - 2)^2')(1), 1);
}

// rq-sub-bg-106 — f = (ax+b)/(x-2): y = 3 asymptote and (0, 2) on the graph → a = 3, b = -4
{
  check('106 a = leading ratio → f(1e6) ≈ 3', f('(3x - 4)/(x - 2)')(1e6), 3, 1e-4);
  check('106 f(0) = 2 with a = 3, b = -4', f('(3x - 4)/(x - 2)')(0), 2);
  check('106 b from b/(-2) = 2', E('2 * (-2)'), -4);
  check('106 f(0) only involves b: (3*0 + b)/(0 - 2) at b = -4', E('(3*0 + (-4))/(0 - 2)'), 2);
  // w1 3, 4: denominator sign lost → b/2 = 2
  check('106 w1 b = 2*2', E('2 * 2'), 4);
  // w2 3, -1: divided instead of multiplied → b = 2/(-2)
  check('106 w2 b = 2/(-2)', E('2/(-2)'), -1);
}

// rq-sub-bg-107 — f = (x^2+3)/(x-1): no x-intercept, y-intercept (0, -3), VA x = 1, no HA
{
  const F = '(x^2 + 3)/(x - 1)';
  check('107 numerator discriminant negative', E('0^2 - 4*1*3'), -12);
  check('107 numerator never changes sign', signChanges('x^2 + 3', -50, 50), 0);
  check('107 f(0) = -3', f(F)(0), -3);
  check('107 denominator at 1 is 0', f('x - 1')(1), 0);
  check('107 numerator at 1 is 4 ≠ 0 → vertical asymptote', f('x^2 + 3')(1), 4);
  check('107 no HA: f(1e6)/1e6 ≈ 1 (grows without bound)', f(F)(1e6) / 1e6, 1, 1e-4);
  // d1 y = 1: leading-coefficient ratio applied although degrees differ
  check('107 d1 ratio of leading coefficients', E('1/1'), 1);
  // d3 (0, 3): denominator sign lost → 3/1
  check('107 d3 3/1', E('3/1'), 3);
}

// rq-sub-bg-108 — 2026-09-06 exam-style rebuild: f = sqrt(16-2x), three parts.
// Part א domain + both intercepts, part ב the derivative (inner derivative kept)
// and the sign it forces, part ג g = 1/f — where the domain EDGE of f becomes an
// ASYMPTOTE of g. Every value the three answer boxes take is re-derived here.
{
  const F = 'sqrt(16 - 2x)';
  const rad = f('16 - 2x');
  // part א — the domain is closed at 8, because the root is not in a denominator
  check('108א the radicand vanishes at 8', rad(8), 0);
  check('108א it is positive just left of 8', sgn(rad(7.999)), 1);
  check('108א and negative just right of 8, so the domain ends there', sgn(rad(8.001)), -1);
  check('108א f is defined AT 8 itself: f(8) = 0', f(F)(8), 0);
  check('108א the y-intercept height is 4', f(F)(0), 4);
  check('108א the x-intercept is where f vanishes, x = 8', f(F)(8), 0);
  // part ב — the inner derivative survives, and it is what makes f decreasing
  dcheck('108ב the derivative is -1/sqrt(16-2x)', F, '-1/sqrt(16 - 2x)', [-4, 0, 3, 7, 7.9]);
  const truth = f('-1/sqrt(16 - 2x)');
  const noInner = f('1/(2*sqrt(16 - 2x))');
  check('108ב dropping the inner derivative scales f\' by -1/2', noInner(3) / truth(3), -0.5);
  check('108ב the true derivative is negative inside the domain', sgn(truth(3)), -1);
  check('108ב so f really is decreasing: f(0) > f(7)', f(F)(0) > f(F)(7) ? 1 : 0, 1);
  // part ג — g = 1/f: the same value 8 changes role
  const G = '1/sqrt(16 - 2x)';
  check('108ג g is undefined at 8: f is 0 there', f(F)(8), 0);
  check('108ג g blows up as x approaches 8 from the left', f(G)(8 - 1e-10) > 1e4 ? 1 : 0, 1);
  check('108ג the numerator of g is 1, never zero, so it is an asymptote and not a hole', f('1')(8), 1);
  check('108ג g is still defined at 7.9, so the domain is x < 8', Number.isFinite(f(G)(7.9)) ? 1 : 0, 1);
  check('108ג f has a POINT at 8 while g has an asymptote there', Number.isFinite(f(F)(8)) && !Number.isFinite(f(G)(8)) ? 1 : 0, 1);
  // the three wrongAnswers
  check('108 wrong 16: solving 16 - 2x = 0 without dividing by 2', E('16/2'), 8);
  check('108 wrong 16 as a height: that is the radicand, not its root', rad(0), 16);
  check('108 wrong 0: that is where the y-intercept sits, and g is finite there', Number.isFinite(f(G)(0)) ? 1 : 0, 1);
}

// rq-sub-bg-109 — f = sqrt(x-1), area from 1 to a equals 16/3 → a = 5
{
  dcheck('109 F = 2/3 (x-1)^(3/2) integrates sqrt(x-1)', '2/3*(x - 1)^(3/2)', 'sqrt(x - 1)', [1.5, 2, 3, 5, 10]);
  check('109 F(1) = 0', f('2/3*(x - 1)^(3/2)')(1), 0);
  // sqrt has an infinite slope at the lower bound, so Simpson needs a fine grid to reach 1e-6
  icheck('109 ∫_1^5 sqrt(x-1) = 16/3', 'sqrt(x - 1)', 1, 5, E('16/3'), 200000);
  check('109 (a-1)^(3/2) = 16/3 ÷ 2/3 = 8', E('(16/3)/(2/3)'), 8);
  check('109 a = 8^(2/3) + 1', E('8^(2/3) + 1'), 5);
  check('109 area is increasing in a → unique', sgn(f('sqrt(x - 1)')(4)), 1);
  // w1 4: stopped at a - 1
  check('109 w1 8^(2/3)', E('8^(2/3)'), 4);
  // w2 3: cube root instead of the 2/3 power
  check('109 w2 8^(1/3) + 1', E('8^(1/3) + 1'), 3);
  check('109 w2 note: 2^(3/2) ≠ 8 but 4^(3/2) = 8', E('4^(3/2)'), 8);
  check('109 w2 note: 2^(3/2) is not 8', Math.abs(E('2^(3/2)') - 8) > 1 ? 1 : 0, 1);
}

// rq-sub-bg-110 — f = (x^2-4x+36)/x: minimum (6, 8) on x > 0; lowest value 8 > 0 → graph above axis
{
  const F = '(x^2 - 4x + 36)/x';
  // the quotient-rule route: (u'v - uv')/v^2 with u = x^2-4x+36, v = x, expanded and collected
  dcheck('110 quotient rule, unexpanded', F, '((2x - 4)*x - (x^2 - 4x + 36)*1)/x^2', [0.5, 1, 3, 6, -1]);
  dcheck('110 numerator collects to x^2 - 36', F, '(x^2 - 36)/x^2', [0.5, 1, 2, 3, 6, -1]);
  dcheck('110 factored numerator (x-6)(x+6) is the same', F, '((x - 6)*(x + 6))/x^2', [0.5, 2, 6, -1, -7]);
  checkSet('110 f\' = 0 ⇔ x^2 = 36', [E('sqrt(36)'), -E('sqrt(36)')], [6, -6]);
  check('110 candidate -6 outside x > 0', sgn(-E('sqrt(36)')), -1);
  check('110 f(6) = 8', f(F)(6), 8);
  // classification by the SIGN TABLE of f', not by f'': every column of the table
  const fp = f('(x^2 - 36)/x^2');
  check('110 table col x < -6: f\' > 0', sgn(fp(-7)), 1);
  check('110 table col -6 < x < 0: f\' < 0', sgn(fp(-3)), -1);
  check('110 table col 0 < x < 6: f\' < 0', sgn(fp(3)), -1);
  check('110 table col x > 6: f\' > 0', sgn(fp(7)), 1);
  check('110 sign flips - → + at 6, so (6, 8) is a MINIMUM', sgn(fp(7)) - sgn(fp(3)), 2);
  check('110 נמק: minimum of f on x > 0 grid is 8', gridMin(F, 0.05, 100), 8, 1e-4);
  check('110 נמק: f never changes sign on x > 0', signChanges(F, 0.01, 200), 0);
  check('110 numerator discriminant negative (consistent)', E('(-4)^2 - 4*1*36'), -128);
}

// --- steps added to the shipped extras (formula lines + the 105 sign table) ---
// 101 — the **הנוסחה:**/**ההצבה:** pair now states sqrt(3-3) = 0 with a non-zero numerator
{
  check('101 formula line: the denominator AT 3 (not near it) is 0', f('sqrt(x - 3)')(3), 0);
  check('101 formula line: the numerator there is 4, so it is an asymptote and not a hole', f('0*x + 4')(3), 4);
}
// 103 — the formula line claims f(0) is numerator(0) DIVIDED BY denominator(0)
{
  check('103 formula line: f(0) = num(0)/den(0)', f('(x - 6)/(x^2 - 9)')(0), f('x - 6')(0) / f('x^2 - 9')(0));
  check('103 formula line: substituting 0 changes the denominator too', f('x^2 - 9')(0) !== f('x^2 - 9')(1) ? 1 : 0, 1);
}
// 105 — every cell of the new sign table, re-derived from the factors
{
  const NUM = 'x*(x - 4)';
  const DEN = '(x - 2)^2';
  const FP = '(x^2 - 4x)/(x - 2)^2';
  const probes: [number, number][] = [[-1, 1], [1, -1], [3, -1], [5, 1]]; // the table's four columns
  for (const [at, want] of probes) {
    check(`105 table: numerator x(x-4) sign at ${at}`, sgn(f(NUM)(at)), want);
    check(`105 table: denominator (x-2)^2 sign at ${at}`, sgn(f(DEN)(at)), 1);
    check(`105 table: f' sign at ${at}`, sgn(f(FP)(at)), want);
  }
  check('105 table: the numerator row equals the f\' row (denominator never flips)', signChanges(NUM, -5, 6), signChanges(FP, -5, 1.9) + signChanges(FP, 2.1, 6));
}
// 107 — the formula line claims 0 is substituted in the WHOLE quotient
{
  check('107 formula line: f(0) = num(0)/den(0)', f('(x^2 + 3)/(x - 1)')(0), f('x^2 + 3')(0) / f('x - 1')(0));
  check('107 formula line: the denominator at 0 is -1, not 1', f('x - 1')(0), -1);
}
// 108 — the formula line (sqrt u)' = 1/(2 sqrt u) · u' reproduces the symbolic derivative
{
  const bySpec = (x: number) => (1 / (2 * Math.sqrt(6 - 2 * x))) * -2;
  const symbolic = math.derivative('sqrt(6 - 2x)', 'x');
  for (const at of [-3, 0, 2, 2.5]) {
    check(`108 formula line reproduces the true derivative at ${at}`, bySpec(at), symbolic.evaluate({ x: at }) as number);
  }
}

// rq-sub-bg-201 — f = x·sqrt(3-x): domain x ≤ 3, roots 0 and 3, max (2, 2); g = f^2 → area 27/4
{
  const F = 'x*sqrt(3 - x)';
  const FP = '(6 - 3x)/(2*sqrt(3 - x))';
  const G = '3x^2 - x^3';
  // domain: the radicand flips exactly at 3, and 3 itself is IN the domain (root not in a denominator)
  check('201 radicand positive just below 3', sgn(f('3 - x')(2.999)), 1);
  check('201 radicand negative just above 3', sgn(f('3 - x')(3.001)), -1);
  check('201 f(3) = 0 → the edge is a point on the graph', f(F)(3), 0);
  // intercepts, from the factored form
  checkSet('201 numerator factor x = 0 gives the origin', math.polynomialRoot(0, 1) as number[], [0]);
  check('201 f(0) = 0', f(F)(0), 0);
  // the derivative, proved symbolically (samples inside the open domain)
  dcheck('201 f\' = (6-3x)/(2 sqrt(3-x))', F, FP, [-1, 0, 1, 2, 2.5]);
  checkSet('201 f\' = 0 ⇔ 6 - 3x = 0', math.polynomialRoot(6, -3) as number[], [2]);
  check('201 f\'(2) = 0', f(FP)(2), 0);
  check('201 f(2) = 2 (height from the ORIGINAL function)', f(F)(2), 2);
  // the sign table's two rows
  check('201 table: 6 - 3x positive at 1', sgn(f('6 - 3x')(1)), 1);
  check('201 table: 6 - 3x negative at 2.5', sgn(f('6 - 3x')(2.5)), -1);
  check('201 table: 2 sqrt(3-x) positive on both sides', sgn(f('2*sqrt(3 - x)')(1)) + sgn(f('2*sqrt(3 - x)')(2.5)), 2);
  check('201 table: f\' rises then falls (one sign change on the domain)', signChanges(FP, -1, 2.99), 1);
  check('201 max VALUE on the domain is 2', gridMax(F, -1, 3), 2, 1e-4);
  // g = (f)^2 really is the polynomial the solution writes
  for (const at of [-2, 0, 1, 2, 2.9]) check(`201 g = (f)^2 = 3x^2 - x^3 at ${at}`, f(`(${F})^2`)(at), f(G)(at));
  check('201 g bounds are f\'s own roots: g(0) = 0', f(G)(0), 0);
  check('201 g(3) = 0', f(G)(3), 0);
  check('201 g stays positive between them', signChanges(G, 0.001, 2.999), 0);
  check('201 g(1.5) > 0', sgn(f(G)(1.5)), 1);
  // the area, re-integrated
  dcheck('201 G = x^3 - x^4/4 integrates g', 'x^3 - x^4/4', G, [0.5, 1, 2, 3, -1]);
  icheck('201 ∫_0^3 (3x^2 - x^3) = 27/4', G, 0, 3, E('27/4'));
  check('201 G(3) - G(0) = 27/4', f('x^3 - x^4/4')(3) - f('x^3 - x^4/4')(0), E('27/4'));
  // w1 27: first antiderivative term only
  check('201 w1 x^3 at 3', f('x^3')(3), 27);
  // w2 81/4: second antiderivative term only
  check('201 w2 x^4/4 at 3', f('x^4/4')(3), E('81/4'));
  // w3 -27/4: bounds swapped
  check('201 w3 G(0) - G(3)', f('x^3 - x^4/4')(0) - f('x^3 - x^4/4')(3), E('-27/4'));
}

// rq-sub-bg-202 — f = ax/(x^2+b) with maximum (2, 3) → a = 12, b = 4
{
  const F = '12x/(x^2 + 4)';
  const FP = '12*(4 - x^2)/(x^2 + 4)^2';
  // the derivative's numerator really is a(b - x^2) — proved on a SECOND parameter pair too
  dcheck('202 derivative shape a(b-x^2)/(x^2+b)^2, at a=5 b=9', '5x/(x^2 + 9)', '5*(9 - x^2)/(x^2 + 9)^2', [-4, -1, 0, 2, 3]);
  dcheck('202 f\' for the recovered a = 12, b = 4', F, FP, [-3, -1, 0, 1, 2, 5]);
  // b from the extremum condition b = x^2, a from the height
  check('202 b = 2^2', E('2^2'), 4);
  check('202 f\'(2) = 0 with b = 4', f(FP)(2), 0);
  check('202 a from 2a/8 = 3', E('3*8/2'), 12);
  check('202 f(2) = 3', f(F)(2), 3);
  // classification: the table's three columns
  check('202 table: f\' negative at -3', sgn(f(FP)(-3)), -1);
  check('202 table: f\' positive at 0', sgn(f(FP)(0)), 1);
  check('202 table: f\' negative at 3', sgn(f(FP)(3)), -1);
  check('202 (x^2+4)^2 positive everywhere', sgn(f('(x^2 + 4)^2')(-7)) + sgn(f('(x^2 + 4)^2')(7)), 2);
  check('202 maximum VALUE is 3', gridMax(F, -50, 50), 3, 1e-4);
  check('202 domain is every x: x^2 + 4 never 0', gridMin('x^2 + 4', -100, 100), 4, 1e-4);
  check('202 f tends to 0 far out', f(F)(1e6), 0, 1e-4);
  // w1 4, 12 (swapped): the extremum condition fails
  check('202 w1 f\'(2) ≠ 0 for a = 4, b = 12', Math.abs(f('4*(12 - x^2)/(x^2 + 12)^2')(2)) > 1e-6 ? 1 : 0, 1);
  check('202 w1 f(2) ≠ 3 for a = 4, b = 12', f('4x/(x^2 + 12)')(2), 0.5);
  // w2 24, 4: 2a = 24 not divided by 2
  check('202 w2 f(2) = 6 for a = 24', f('24x/(x^2 + 4)')(2), 6);
  // w3 12, 2: b = x instead of x^2
  check('202 w3 f\'(2) ≠ 0 for b = 2', Math.abs(f('12*(2 - x^2)/(x^2 + 2)^2')(2)) > 1e-6 ? 1 : 0, 1);
}

// rq-sub-bg-203 — g = sqrt((x-4)/(x+2)): domain x < -2 or x ≥ 4, root (4, 0), ONE horizontal asymptote y = 1
{
  const Q = '(x - 4)/(x + 2)';
  // the sign table of the quotient, column by column
  check('203 table: numerator negative at -3', sgn(f('x - 4')(-3)), -1);
  check('203 table: denominator negative at -3', sgn(f('x + 2')(-3)), -1);
  check('203 table: quotient positive at -3', sgn(f(Q)(-3)), 1);
  check('203 table: quotient negative at 0', sgn(f(Q)(0)), -1);
  check('203 table: quotient positive at 5', sgn(f(Q)(5)), 1);
  check('203 quotient never flips on the left branch', signChanges(Q, -60, -2.01), 0);
  check('203 quotient never flips on the right branch', signChanges(Q, 4.01, 60), 0);
  // domain edges: 4 is IN (radicand 0, root not in a denominator), -2 is OUT (denominator 0)
  check('203 radicand at 4 is 0 → 4 belongs to the domain', f(Q)(4), 0);
  check('203 g(4) = 0 → the x-intercept', f(`sqrt(${Q})`)(4), 0);
  check('203 denominator at -2 is 0 → excluded', f('x + 2')(-2), 0);
  check('203 numerator at -2 is -6 ≠ 0 → asymptote, not a hole', f('x - 4')(-2), -6);
  check('203 radicand negative at 3.99 → just left of 4 is outside', sgn(f(Q)(3.99)), -1);
  check('203 radicand positive at -2.01 → just left of -2 is inside', sgn(f(Q)(-2.01)), 1);
  // ONE horizontal asymptote: both ends of the domain give the same limit
  const right = f(`sqrt(${Q})`)(1e6);
  const left = f(`sqrt(${Q})`)(-1e6);
  check('203 g → 1 as x → +infinity', right, 1, 1e-5);
  check('203 g → 1 as x → -infinity', left, 1, 1e-5);
  check('203 the two limits coincide → exactly one horizontal asymptote', new Set([right.toFixed(4), left.toFixed(4)]).size, 1);
  // vertical asymptote at -2, approached from the LEFT only
  check('203 g blows up just left of -2', f(`sqrt(${Q})`)(-2 - 1e-8) > 1e3 ? 1 : 0, 1);
  check('203 nothing between -2 and 4: the radicand stays negative all the way', gridMax(Q, -1.99, 3.99) < 0 ? 1 : 0, 1);
  // the right branch climbs toward the asymptote from below, never reaching it
  check('203 right branch rises: g(5) < g(20)', f(`sqrt(${Q})`)(5) < f(`sqrt(${Q})`)(20) ? 1 : 0, 1);
  check('203 right branch stays under 1', gridMax(`sqrt(${Q})`, 4, 500) < 1 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// 2026-09-06, exam-style round. bg-101 and bg-107 kept their mathematics and lost
// the "איזו טענה נכונה" framing, so each option is now a full set of findings —
// and each of the four sets has to be reachable only by the mistake its note names.
// ---------------------------------------------------------------------------

// rq-sub-bg-101 — the four options are (domain, asymptote) pairs
{
  const fx = '4/sqrt(x - 3)';
  check('101 opt A: the domain is open at 3 — f is not finite there', Number.isFinite(f(fx)(3)) ? 0 : 1, 1);
  check('101 opt A: and f is finite just above 3', Number.isFinite(f(fx)(3.5)) ? 1 : 0, 1);
  check('101 opt B "x >= 3": at 3 itself the denominator is 0', E('sqrt(3 - 3)'), 0);
  check('101 opt C "x != 3": at x = 1 the radicand is negative, so those values are out too', sgn(f('x - 3')(1)), -1);
  check('101 opt D "no asymptote": f(3.0001) is already enormous', f(fx)(3.0001) > 300 ? 1 : 0, 1);
  check('101 the values keep growing toward 3, which is what an asymptote means', f(fx)(3.0001) > f(fx)(3.01) ? 1 : 0, 1);
}

// rq-sub-bg-107 — the four options are full finding sets for (x^2+3)/(x-1)
{
  const F = '(x^2 + 3)/(x - 1)';
  check('107 opt A: no x-intercept — the numerator never vanishes', signChanges('x^2 + 3', -100, 100), 0);
  check('107 opt A: the y-intercept height is -3', f(F)(0), -3);
  check('107 opt A: the denominator vanishes at 1 while the numerator is 4', f('x^2 + 3')(1), 4);
  check('107 opt B "y = 1": f keeps growing instead of flattening', f(F)(1e6) > 1e5 ? 1 : 0, 1);
  check('107 opt B: and it grows like x, not toward a constant', f(F)(1e6) / 1e6, 1, 1e-4);
  check('107 opt C "(0,3)": the denominator at 0 is -1, so the sign flips', f('x - 1')(0), -1);
  check('107 opt D "(-3,0)": substituting -3 does not give 0', f(F)(-3), E('12/(-4)'));
  check('107 opt D: x^2 = -3 has no real solution — the numerator stays positive', sgn(f('x^2 + 3')(-3)), 1);
}

// ---------------------------------------------------------------------------
// 2026-09-06, round 3 (rq-sub-bg-300…304). Nothing below re-applies the algebra
// the solutions use: every derivative is proved SYMBOLICALLY against mathjs, the
// parameter of 303 is recovered by solving f'(6) = 0 numerically (and snapped to
// six decimals before it is fed back, so a 1e-15 residue cannot masquerade as a
// second root), each extremum is confirmed against a grid extremum of the
// function itself, and every distractor is re-enacted as the mistake its note
// names and required to land on THAT option.
// ---------------------------------------------------------------------------

// rq-sub-bg-300 — f = (x^2+5)/(x-1): tangent at x = 3 is y = -x/2 + 17/2, meeting the x-axis at 17
{
  const F = '(x^2 + 5)/(x - 1)';
  const FP = '(x^2 - 2x - 5)/(x - 1)^2';
  dcheck('300 quotient-rule derivative', F, FP, [-2, 0, 2, 3, 5]);
  check('300 the point of tangency is on the graph: f(3)', f(F)(3), 7);
  check('300 3 is inside the domain: the denominator there is 2', f('x - 1')(3), 2);
  const m = f(FP)(3);
  const y0 = f(F)(3);
  check('300 the slope is f\'(3)', m, E('-1/2'));
  // the line built from the two computed numbers, and the x where it meets y = 0
  const line = (x: number) => y0 + m * (x - 3);
  check('300 the line passes through the point of tangency', line(3), y0);
  check('300 its y-intercept is 17/2', line(0), E('17/2'));
  check('300 it meets the x-axis at 3 - y0/m', 3 - y0 / m, 17);
  check('300 and the line is 0 there', line(17), 0, 1e-9);
  // TANGENT, not a secant: the gap is second order in h (a wrong slope leaves a first-order gap)
  const h = 1e-3;
  check('300 |f - line| at 3+h is second order', Math.abs(f(F)(3 + h) - line(3 + h)) < 1e-5 ? 1 : 0, 1);
  check('300 a slope 1% off would leave a first-order gap', Math.abs(f(F)(3 + h) - (y0 + m * 1.01 * h)) > 1e-6 ? 1 : 0, 1);
  // d1 y = 6x - 11: derivative of a quotient taken as the quotient of the derivatives
  const mBad1 = f('(2x)/1')(3);
  check('300 d1 the bogus slope u\'/v\' at 3 is 6', mBad1, 6);
  check('300 d1 that line is y = 6x - 11', y0 + mBad1 * (0 - 3), -11);
  check('300 d1 and it meets the x-axis at 11/6', 3 - y0 / mBad1, E('11/6'));
  // d2 y = -x/2 + 1: the height read off the derivative instead of the function
  check('300 d2 the height wrongly taken from f\'(3)', m, E('-1/2'));
  check('300 d2 that line has y-intercept 1', m + m * (0 - 3), 1);
  check('300 d2 and it meets the x-axis at 2', 3 - m / m, 2);
  // d3 y = -x/2 + 11/2: (x + 3) substituted for (x - 3)
  check('300 d3 the sign-flipped line has y-intercept 11/2', y0 + m * (0 + 3), E('11/2'));
  check('300 d3 and it meets the x-axis at 11', -(y0 + m * 3) / m, 11);
}

// rq-sub-bg-301 — f = sqrt(x)/(x+4): maximum (4, 1/4), found after clearing the inner fraction
{
  const F = 'sqrt(x)/(x + 4)';
  const FP = '(4 - x)/(2*sqrt(x)*(x + 4)^2)';
  dcheck('301 derivative after the 2*sqrt(x) expansion', F, FP, [0.25, 1, 4, 9, 16]);
  check('301 the domain needs x >= 0: the radicand at -1 is negative', sgn(f('x')(-1)), -1);
  check('301 the denominator never vanishes on it: x + 4 at 0 is 4', f('x + 4')(0), 4);
  checkSet('301 the numerator of f\' vanishes at 4', math.polynomialRoot(4, -1) as number[], [4]);
  check('301 f\'(4) = 0', f(FP)(4), 0);
  check('301 the height comes from the ORIGINAL function: f(4)', f(F)(4), E('1/4'));
  check('301 f\' positive left of 4', sgn(f(FP)(1)), 1);
  check('301 f\' negative right of 4', sgn(f(FP)(9)), -1);
  check('301 so 1/4 really is the largest value on the domain', gridMax(F, 1e-6, 400), E('1/4'), 1e-5);
  // d1 (4, 1/2): the +4 dropped when substituting in the denominator
  check('301 d1 sqrt(4)/4', f('sqrt(x)/x')(4), E('1/2'));
  check('301 d1 note: the denominator at 4 is 8, not 4', f('x + 4')(4), 8);
  // d2 (4, 2): the height read off the numerator alone
  check('301 d2 sqrt(4)', f('sqrt(x)')(4), 2);
  // d3 "no extremum": u'v + uv' instead of u'v - uv' leaves the numerator 3x + 4
  const wrongNum = (x: number) => ((1 / (2 * Math.sqrt(x))) * (x + 4) + Math.sqrt(x)) * 2 * Math.sqrt(x);
  for (const at of [1, 4, 9]) check(`301 d3 the plus-sign numerator is 3x + 4 at ${at}`, wrongNum(at), f('3x + 4')(at));
  checkSet('301 d3 3x + 4 vanishes at -4/3', math.polynomialRoot(4, 3) as number[], [E('-4/3')]);
  check('301 d3 and -4/3 is outside x >= 0', sgn(E('-4/3')), -1);
}

// rq-sub-bg-302 — f = sqrt(x^2-6x+8): domain x <= 2 or x >= 4, intercepts (2,0), (4,0), (0, 2sqrt2),
// and the only zero of f' sits in the gap 2 < x < 4 that the domain threw away
{
  const RAD = 'x^2 - 6x + 8';
  const F = 'sqrt(x^2 - 6x + 8)';
  const FP = '(x - 3)/sqrt(x^2 - 6x + 8)';
  checkSet('302 the radicand vanishes at 2 and 4', math.polynomialRoot(8, -6, 1) as number[], [2, 4]);
  // the three columns of the sign table, each read off the factors
  check('302 table: (x-2) negative at 0', sgn(f('x - 2')(0)), -1);
  check('302 table: (x-4) negative at 0', sgn(f('x - 4')(0)), -1);
  check('302 table: the product is positive at 0', sgn(f(RAD)(0)), 1);
  check('302 table: the product is negative at 3', sgn(f(RAD)(3)), -1);
  check('302 table: the product is positive at 5', sgn(f(RAD)(5)), 1);
  check('302 the radicand never flips inside the left piece', signChanges(RAD, -60, 1.999), 0);
  check('302 nor inside the right piece', signChanges(RAD, 4.001, 60), 0);
  // the closed ends: both belong to the domain, because the root is not in a denominator
  check('302 f(2) = 0', f(F)(2), 0);
  check('302 f(4) = 0', f(F)(4), 0);
  check('302 f is undefined at 3', Number.isFinite(f(F)(3)) ? 1 : 0, 0);
  check('302 the y-intercept is sqrt(8)', f(F)(0), E('2*sqrt(2)'));
  check('302 and 0 lies in the left piece', f(RAD)(0) >= 0 ? 1 : 0, 1);
  // the derivative, and the candidate it produces
  dcheck('302 f\' = (x-3)/sqrt(x^2-6x+8)', F, FP, [-2, 0, 1, 5, 8]);
  checkSet('302 the numerator of f\' vanishes at 3', math.polynomialRoot(-3, 1) as number[], [3]);
  check('302 but the radicand at that candidate is -1', f(RAD)(3), -1);
  check('302 so the candidate is outside the domain', f(RAD)(3) < 0 ? 1 : 0, 1);
  // …and nowhere IN the domain does the derivative vanish: |x - 3| >= 1 on both pieces
  check('302 |x - 3| stays at least 1 on the left piece', gridMin('abs(x - 3)', -60, 2), 1, 1e-4);
  check('302 and at least 1 on the right piece', gridMin('abs(x - 3)', 4, 60), 1, 1e-4);
  check('302 f\' is strictly negative throughout the left piece', signChanges(FP, -60, 1.999), 0);
  check('302 and strictly positive throughout the right piece', signChanges(FP, 4.001, 60), 0);
  // d2 (option C) "2 <= x <= 4": that is exactly where the product is negative
  check('302 d2 the wrong interval is where the radicand is negative', gridMax(RAD, 2.001, 3.999) < 0 ? 1 : 0, 1);
  check('302 d2 and 0 falls outside it, which is why that option loses the y-intercept', 0 >= 2 ? 1 : 0, 0);
  // d3 (0, 8): the radicand reported instead of its root
  check('302 d3 the radicand at 0 is 8', f(RAD)(0), 8);
  check('302 d3 while its root is 2sqrt2, about 2.83', E('2*sqrt(2)'), 2.8284271247, 1e-9);
}

// rq-sub-bg-303 — f = (x^2+a)/(x-2) with an extremum at x = 6. a is RECOVERED here by solving
// f'(6) = 0 numerically (the derivative is symbolic in BOTH x and a), snapped to six decimals,
// and only then fed back — the whole rest of the question hangs off that one number.
{
  const dfdx = math.derivative('(x^2 + a)/(x - 2)', 'x');
  const slopeAt6 = (aVal: number) => dfdx.evaluate({ x: 6, a: aVal }) as number;
  const h0 = slopeAt6(0);
  const h1 = slopeAt6(1);
  const aStar = Number((-h0 / (h1 - h0)).toFixed(6)); // f'(6) is linear in a
  check('303 a recovered from f\'(6) = 0', aStar, 12);
  check('303 and that a really zeroes the derivative at 6', slopeAt6(aStar), 0, 1e-9);
  check('303 a different a does not', Math.abs(slopeAt6(aStar + 1)) > 1e-6 ? 1 : 0, 1);

  const F = `(x^2 + ${aStar})/(x - 2)`;
  const FP = `(x^2 - 4x - ${aStar})/(x - 2)^2`;
  dcheck('303 f\' = (x^2 - 4x - 12)/(x - 2)^2', F, FP, [-3, -1, 0, 1, 3, 7]);
  checkSet('303 the numerator factors to (x-6)(x+2)', math.polynomialRoot(-aStar, -4, 1) as number[], [6, -2]);
  check('303 f(6) = 12', f(F)(6), 12);
  check('303 f(-2) = -4', f(F)(-2), -4);
  check('303 the vertical asymptote: the denominator vanishes at 2', f('x - 2')(2), 0);
  check('303 while the numerator there is 16, so it is not a hole', f(`x^2 + ${aStar}`)(2), 16);
  // the four columns of the sign table
  check('303 table: f\' positive at -3', sgn(f(FP)(-3)), 1);
  check('303 table: f\' negative at 0', sgn(f(FP)(0)), -1);
  check('303 table: f\' negative at 3', sgn(f(FP)(3)), -1);
  check('303 table: f\' positive at 7', sgn(f(FP)(7)), 1);
  check('303 table: (x-2)^2 never flips', sgn(f('(x - 2)^2')(1)) + sgn(f('(x - 2)^2')(3)), 2);
  // the classification, taken from the function and not from the table
  check('303 -4 is the LARGEST value the left branch reaches', gridMax(F, -400, 1.999), -4, 1e-3);
  check('303 12 is the SMALLEST value the right branch reaches', gridMin(F, 2.001, 400), 12, 1e-3);
  // …which is exactly the claim about y = m
  for (const m of [-3.9, 0, 5, 11.9]) {
    check(`303 y = ${m} misses the left branch`, gridMax(F, -400, 1.999) < m ? 1 : 0, 1);
    check(`303 y = ${m} misses the right branch`, gridMin(F, 2.001, 400) > m ? 1 : 0, 1);
    check(`303 f - ${m} never changes sign on the left branch`, signChanges(`(${F}) - (${m})`, -400, 1.999), 0);
    check(`303 f - ${m} never changes sign on the right branch`, signChanges(`(${F}) - (${m})`, 2.001, 400), 0);
  }
  check('303 the endpoint m = -4 IS attained', f(F)(-2), -4);
  check('303 the endpoint m = 12 IS attained', f(F)(6), 12);
  check('303 and m = 13 is attained too', signChanges(`(${F}) - 13`, 2.001, 400), 2);
  // w1 a = -12: the sign slip leaves x^2 - 4x + 12, whose discriminant is negative
  check('303 w1 discriminant of x^2 - 4x + 12', E('(-4)^2 - 4*1*12'), -32);
  check('303 w1 so that a gives no extremum at all', signChanges('(x^2 - 4x + 12)/(x - 2)^2', -400, 1.999), 0);
  // w2 the two points swapped: the max height is BELOW the min height here
  check('303 w2 the maximum sits lower than the minimum', f(F)(-2) < f(F)(6) ? 1 : 0, 1);
  check('303 w2 yet f\' goes + then - around -2', sgn(f(FP)(-2.5)) - sgn(f(FP)(-1.5)), 2);
  check('303 w2 and - then + around 6', sgn(f(FP)(6.5)) - sgn(f(FP)(5.5)), 2);
  // w3 the min's x-coordinate typed as its height
  check('303 w3 f(6) is 12, not 6', f(F)(6) === 6 ? 1 : 0, 0);
}

// rq-sub-bg-304 — f = (x^2+9)/(x^2-9): two vertical asymptotes, y = 1, no x-intercept, max (0, -1)
{
  const F = '(x^2 + 9)/(x^2 - 9)';
  const FP = '(-36x)/(x^2 - 9)^2';
  checkSet('304 the denominator vanishes at 3 and -3', math.polynomialRoot(-9, 0, 1) as number[], [3, -3]);
  check('304 the numerator there is 18, so both are asymptotes', f('x^2 + 9')(3), 18);
  check('304 f blows up just left of 3', Math.abs(f(F)(3 - 1e-8)) > 1e6 ? 1 : 0, 1);
  check('304 f blows up just right of -3', Math.abs(f(F)(-3 + 1e-8)) > 1e6 ? 1 : 0, 1);
  check('304 the horizontal asymptote: f far out tends to 1', f(F)(1e6), 1, 1e-6);
  check('304 and to 1 in the other direction too', f(F)(-1e6), 1, 1e-6);
  check('304 no x-intercept: the numerator never gets below 9', gridMin('x^2 + 9', -300, 300), 9, 1e-4);
  check('304 no x-intercept: the numerator never changes sign', signChanges('x^2 + 9', -300, 300), 0);
  check('304 the y-intercept is f(0) = -1', f(F)(0), -1);
  check('304 and it really is numerator(0) over denominator(0)', f(F)(0), f('x^2 + 9')(0) / f('x^2 - 9')(0));
  dcheck('304 f\' = -36x/(x^2-9)^2 after the 2x factor comes out', F, FP, [-5, -2, -1, 1, 2, 5]);
  checkSet('304 the numerator of f\' vanishes only at 0', math.polynomialRoot(0, -36) as number[], [0]);
  check('304 f\'(0) = 0', f(FP)(0), 0);
  check('304 (x^2-9)^2 is positive on both sides of 0', sgn(f('(x^2 - 9)^2')(-1)) + sgn(f('(x^2 - 9)^2')(1)), 2);
  // the four columns of the sign table
  check('304 table: f\' positive at -5', sgn(f(FP)(-5)), 1);
  check('304 table: f\' positive at -1', sgn(f(FP)(-1)), 1);
  check('304 table: f\' negative at 1', sgn(f(FP)(1)), -1);
  check('304 table: f\' negative at 5', sgn(f(FP)(5)), -1);
  // the maximum, confirmed against the function itself on the middle branch
  check('304 -1 is the largest value of the middle branch', gridMax(F, -2.999, 2.999), -1, 1e-4);
  check('304 the middle branch stays below the axis', gridMax(F, -2.999, 2.999) < 0 ? 1 : 0, 1);
  check('304 the outer branches stay above y = 1', gridMin(F, 3.001, 400) > 1 ? 1 : 0, 1);
  check('304 and the left outer branch too', gridMin(F, -400, -3.001) > 1 ? 1 : 0, 1);
  check('304 the right branch descends toward the asymptote: f(4) > f(10)', f(F)(4) > f(F)(10) ? 1 : 0, 1);
  // w1 the vertical asymptote taken as 9 (the square, not its root)
  check('304 w1 the denominator at 9 is 72, not 0', f('x^2 - 9')(9), 72);
  check('304 w1 f(9) is perfectly finite', Number.isFinite(f(F)(9)) ? 1 : 0, 1);
  // w2 y = 0 taken as the horizontal asymptote
  check('304 w2 f far out is 1, not 0', Math.abs(f(F)(1e6) - 0) > 0.9 ? 1 : 0, 1);
  check('304 w2 the ratio of the leading coefficients is 1/1', E('1/1'), 1);
  // w3 the height read off the numerator alone
  check('304 w3 the numerator at 0 is 9', f('x^2 + 9')(0), 9);
  check('304 w3 while the denominator at 0 is -9', f('x^2 - 9')(0), -9);
}

// Everything above re-derives the mathematics without looking at the file. This last
// block closes the loop the other way: it reads the AUTHORED answer boxes back out of
// bagrut-mixed.ts and requires them to equal the re-derived numbers, so a typo in a
// graded value cannot pass while the independent derivation quietly agrees with itself.
{
  const byId = new Map(RQ_EXTRA['rq-bagrut-mixed'].map((q) => [q.id, q]));
  const boxes = (id: string) => ((byId.get(id)?.expected as { values?: string[] } | undefined)?.values ?? []).map((v) => E(v));

  const F303 = '(x^2 + 12)/(x - 2)';
  const b303 = boxes('rq-sub-bg-303');
  check('303 authored: three graded boxes', b303.length, 3);
  check('303 authored box a equals the recovered parameter', b303[0], 12);
  check('303 authored box "max height" equals f(-2)', b303[1], f(F303)(-2));
  check('303 authored box "min height" equals f(6)', b303[2], f(F303)(6));

  const F304 = '(x^2 + 9)/(x^2 - 9)';
  const b304 = boxes('rq-sub-bg-304');
  check('304 authored: three graded boxes', b304.length, 3);
  check('304 authored box "vertical asymptote" equals the positive root of the denominator', b304[0], Math.max(...(math.polynomialRoot(-9, 0, 1) as number[])));
  check('304 authored box "horizontal asymptote" equals the limit far out', b304[1], f(F304)(1e6), 1e-5);
  check('304 authored box "extremum height" equals f(0)', b304[2], f(F304)(0));

  for (const id of ['rq-sub-bg-300', 'rq-sub-bg-301', 'rq-sub-bg-302']) {
    check(`${id} authored: four options`, byId.get(id)?.answers?.length ?? 0, 4);
    check(`${id} authored: the correct option is index 0`, byId.get(id)?.correct ?? -1, 0);
  }
}

summary('bagrut-mixed');
