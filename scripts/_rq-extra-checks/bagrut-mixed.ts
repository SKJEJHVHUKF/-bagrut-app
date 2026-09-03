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

summary('bagrut-mixed');
