// Numeric re-derivation of content/lessons/math5/rq-extra/bagrut-mixed.ts (rq-sub-bg-101…110).
// Every derivative is proved SYMBOLICALLY (dcheck), every area re-integrated by quadrature from the
// question's own function and bounds, every domain / asymptote / "which statement" / "how many
// mistakes" / נמק claim encoded as a computation, and every distractor / wrongAnswer note re-enacted
// as the mistake it names and required to land on THAT option.
import { check, dcheck, checkSet, icheck, summary, math, E } from './_lib';

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
  const fpp = math.derivative('1 - 16/x^2', 'x');
  check('102 f\'\'(4) > 0 → minimum', sgn(fpp.evaluate({ x: 4 })), 1);
  dcheck('102 f\'\' = 32/x^3 as the step says', '1 - 16/x^2', '32/x^3', [0.5, 1, 4, -1, -3]);
  // d1 (4, 0): height read off the derivative → f'(4)
  check('102 d1 f\'(4) = 0', f('1 - 16/x^2')(4), 0);
  // d2 (4, 8): 3x term dropped → (16 + 16)/4
  check('102 d2 (x^2+16)/x at 4', f('(x^2 + 16)/x')(4), 8);
  check('102 d2 note: 16 + 12 + 16 = 44', E('16 + 12 + 16'), 44);
  // d3 (-4, -5): the left-branch maximum
  check('102 d3 f(-4)', f(F)(-4), -5);
  check('102 d3 f\'\'(-4) < 0 → maximum', sgn(fpp.evaluate({ x: -4 })), -1);
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

// rq-sub-bg-108 — f = sqrt(6-2x): student's 4 claims → exactly 2 mistakes (derivative, asymptote)
{
  const F = 'sqrt(6 - 2x)';
  const rad = f('6 - 2x');
  const domainClaimOK = rad(3) >= 0 && rad(3.001) < 0 && rad(2.999) > 0; // x ≤ 3, inclusive
  check('108 domain claim x ≤ 3 is right', domainClaimOK ? 1 : 0, 1);
  check('108 boundary radicand at 3', rad(3), 0);
  dcheck('108 true derivative -1/sqrt(6-2x)', F, '-1/sqrt(6 - 2x)', [-2, 0, 1, 2, 2.9]);
  const student = f('1/(2*sqrt(6 - 2x))');
  const truth = f('-1/sqrt(6 - 2x)');
  check('108 student f\' = true f\' × (-1/2) → inner derivative missing', student(1) / truth(1), -0.5);
  const derivWrong = Math.abs(student(1) - truth(1)) > 1e-9 ? 1 : 0;
  check('108 y-intercept claim sqrt(6)', f(F)(0), E('sqrt(6)'));
  const yintWrong = Math.abs(f(F)(0) - E('sqrt(6)')) > 1e-9 ? 1 : 0;
  check('108 f(3) = 0 → defined at 3, endpoint not asymptote', f(F)(3), 0);
  const asymWrong = Number.isFinite(f(F)(3)) ? 1 : 0;
  const domainWrong = domainClaimOK ? 0 : 1;
  check('108 mistake count', derivWrong + yintWrong + asymWrong + domainWrong, 2);
  check('108 d2 note: (1/(2 sqrt(6-2x)))·(-2) at x = 1', E('1/(2*sqrt(6 - 2*1)) * (-2)'), truth(1));
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
  dcheck('110 simplified form x - 4 + 36/x', F, math.derivative('x - 4 + 36/x', 'x').toString(), [0.5, 1, 3, 6, -1]);
  dcheck('110 f\' = 1 - 36/x^2', F, '1 - 36/x^2', [0.5, 1, 2, 3, 6, -1]);
  checkSet('110 f\' = 0 ⇔ x^2 = 36', [E('sqrt(36)'), -E('sqrt(36)')], [6, -6]);
  check('110 candidate -6 outside x > 0', sgn(-E('sqrt(36)')), -1);
  check('110 f(6) = 8', f(F)(6), 8);
  dcheck('110 f\'\' = 72/x^3', '1 - 36/x^2', '72/x^3', [0.5, 1, 6, -1, -2]);
  check('110 f\'\'(6) > 0 → minimum', sgn(f('72/x^3')(6)), 1);
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

summary('bagrut-mixed');
