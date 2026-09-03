// Numeric re-derivation of content/lessons/math5/rq-extra/integral.ts (rq-sub-in-101…112).
// Every antiderivative is proved SYMBOLICALLY (dcheck(F, f): mathjs's derivative of the authored
// F must equal the integrand); every definite integral / area is re-integrated by quadrature from
// the question's own function and bounds; every distractor and wrongAnswer note is re-enacted as
// the mistake it names and must land on THAT option.
import { check, dcheck, checkSet, icheck, summary, math, E } from './_lib';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number) => c.evaluate({ x: v }) as number;
};
/** real roots of expr in [lo, hi] via sign changes on a grid + bisection (simple roots only) */
function roots(expr: string, lo = -20, hi = 20): number[] {
  const g = f(expr);
  const out: number[] = [];
  const push = (r: number) => { if (!out.some(o => Math.abs(o - r) < 1e-6)) out.push(r); };
  const n = 8000;
  const h = (hi - lo) / n;
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = a + h;
    let fa = g(a), fb = g(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;
    if (Math.abs(fa) < 1e-12) { push(a); continue; }
    if (fa * fb > 0) continue;
    for (let k = 0; k < 60; k++) {
      const m = (a + b) / 2, fm = g(m);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    push((a + b) / 2);
  }
  return out;
}
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const POS = [0.3, 0.7, 1, 2.5, 4]; // samples for root-of-x integrands (x > 0)

// rq-sub-in-101 — ∫ 6/x^4 dx (MCQ): power rule with a negative exponent → -2/x^3 + C
{
  dcheck('101 F = -2/x^3 integrates 6/x^4', '-2/x^3', '6/x^4');
  check('101 coefficient 6/(-4+1)', E('6/(-4+1)'), -2);
  // d1: sign lost → 2/x^3 (its derivative is the integrand with the sign flipped)
  dcheck('101 d1 2/x^3 is ∫(-6/x^4)', '2/x^3', '-6/x^4');
  // d2: derivative instead of integral → 6·(-4)x^-5
  dcheck('101 d2 = derivative of 6/x^4', '6/x^4', '-24/x^5');
  // d3: denominator integrated separately → 6/(x^5/5) = 30/x^5
  check('101 d3 6/(x^5/5) = 30/x^5 at x=2', E('6/(2^5/5)'), E('30/2^5'));
}

// rq-sub-in-102 — f' = 3x^2 - 4x through (1, 2): find f(3) → 12
{
  const F = 'x^3 - 2*x^2';
  dcheck('102 F\' = 3x^2 - 4x', F, '3*x^2 - 4*x');
  const C = 2 - f(F)(1);
  check('102 C from (1,2)', C, 3);
  check('102 f(3)', f(F)(3) + C, 12);
  check('102 wrong 9 = F(3) without C', f(F)(3), 9);
  check('102 wrong 15 = f\'(3)', f('3*x^2 - 4*x')(3), 15);
}

// rq-sub-in-103 — ∫ (2x+5)^-3 dx (MCQ): linear argument, negative power → -1/(4(2x+5)^2) + C
{
  dcheck('103 F integrates (2x+5)^-3', '-1/(4*(2*x+5)^2)', '1/(2*x+5)^3');
  check('103 denominator 2·(-3+1)', E('2*(-3+1)'), -4);
  // d1: forgot ÷2 → -1/(2(2x+5)^2), whose derivative is twice the integrand
  dcheck('103 d1 derivative = 2·integrand', '-1/(2*(2*x+5)^2)', '2/(2*x+5)^3');
  // d2: sign lost → +1/(4(2x+5)^2), derivative = -integrand
  dcheck('103 d2 derivative = -integrand', '1/(4*(2*x+5)^2)', '-1/(2*x+5)^3');
  // d3: derivative of the integrand: -3(2x+5)^-4 · 2
  dcheck('103 d3 = derivative of (2x+5)^-3', '1/(2*x+5)^3', '-6/(2*x+5)^4');
}

// rq-sub-in-104 — ∫_1^3 (2x - 6) dx → -4 (a definite integral may be negative)
{
  icheck('104 ∫_1^3 (2x-6)', '2*x-6', 1, 3, -4);
  const F = f('x^2 - 6*x');
  check('104 F(3) - F(1)', F(3) - F(1), -4);
  check('104 F(3)', F(3), -9);
  check('104 F(1)', F(1), -5);
  check('104 wrong 4 = |integral|', Math.abs(F(3) - F(1)), 4);
  check('104 wrong -9 = F(3) alone', F(3), -9);
  // explanation: the line is on/below the axis on the whole interval (max at x=3 is 0)
  check('104 2x-6 at x=1 is negative', sgn(f('2*x-6')(1)), -1);
  check('104 2x-6 at x=3 is 0', f('2*x-6')(3), 0);
}

// rq-sub-in-105 — ∫ 3/√x dx (MCQ): root in the denominator as power -1/2 → 6√x + C
{
  dcheck('105 F = 6√x integrates 3/√x', '6*sqrt(x)', '3/sqrt(x)', POS);
  check('105 new power -1/2 + 1', E('-1/2 + 1'), 0.5);
  check('105 3 ÷ (1/2)', E('3/(1/2)'), 6);
  // d1: forgot ÷ new power → 3√x, derivative = half the integrand
  dcheck('105 d1 derivative = integrand/2', '3*sqrt(x)', '3/(2*sqrt(x))', POS);
  // d2: root read as +1/2 → ∫3√x = 2x^{3/2}
  dcheck('105 d2 = ∫ 3√x', '2*x^(3/2)', '3*sqrt(x)', POS);
  // d3: derivative of 3/√x = -3/(2x√x)
  dcheck('105 d3 = derivative of 3/√x', '3/sqrt(x)', '-3/(2*x*sqrt(x))', POS);
}

// rq-sub-in-106 — area between -4/x^2, the x-axis, x=1, x=2 → 2 (graph entirely below)
{
  const fx = '-4/x^2';
  check('106 graph below the axis at x=1.5', sgn(f(fx)(1.5)), -1);
  check('106 graph below the axis at x=2', sgn(f(fx)(2)), -1);
  icheck('106 ∫_1^2 -4/x^2', fx, 1, 2, -2);
  dcheck('106 F = 4/x integrates -4/x^2', '4/x', fx);
  const F = f('4/x');
  check('106 F(2) - F(1)', F(2) - F(1), -2);
  check('106 area = |integral|', Math.abs(F(2) - F(1)), 2);
  // wrong 7/6: power lowered (-2 → -3): F_bad = -4x^-3/(-3) = 4/(3x^3)
  const Fbad = f('4/(3*x^3)');
  check('106 wrong 7/6 from the lowered power', Math.abs(Fbad(2) - Fbad(1)), E('7/6'));
}

// rq-sub-in-107 — ∫ x^2/√(x^3+2) dx (MCQ): missing 1/3 and the 2 of the root formula → (2/3)√(x^3+2)
{
  const S = [-1, -0.5, 0.7, 1, 2.5]; // x^3 + 2 > 0
  const fx = 'x^2/sqrt(x^3+2)';
  dcheck('107 F = (2/3)√(x^3+2) integrates x^2/√(x^3+2)', '(2/3)*sqrt(x^3+2)', fx, S);
  dcheck('107 g\' = 3x^2', 'x^3+2', '3*x^2');
  check('107 coefficient (1/3)·2', E('(1/3)*2'), E('2/3'));
  // d1: no 1/3 compensation → 2√g, derivative = 3x^2/√g (three times the integrand)
  dcheck('107 d1 derivative = 3·integrand', '2*sqrt(x^3+2)', '3*x^2/sqrt(x^3+2)', S);
  // d2: forgot the 2 of the root formula → (1/3)√g, derivative = integrand/2
  dcheck('107 d2 derivative = integrand/2', '(1/3)*sqrt(x^3+2)', 'x^2/(2*sqrt(x^3+2))', S);
  // d3: numerator integrated separately → (x^3/3)/√(x^3+2)
  check('107 d3 (∫x^2)/√g at x=1', E('(1^3/3)/sqrt(1^3+2)'), E('1^3/(3*sqrt(1^3+2))'));
}

// rq-sub-in-108 — ∫_0^4 √(2x+1) dx → 26/3 (F(0) ≠ 0)
{
  const fx = 'sqrt(2*x+1)';
  icheck('108 ∫_0^4 √(2x+1)', fx, 0, 4, E('26/3'));
  dcheck('108 F = (2x+1)^{3/2}/3 integrates √(2x+1)', '(2*x+1)^(3/2)/3', fx, [0, 0.5, 1, 2.5, 4]);
  check('108 denominator 2·(3/2)', E('2*(3/2)'), 3);
  const F = f('(2*x+1)^(3/2)/3');
  check('108 F(4)', F(4), 9);
  check('108 F(0) = 1/3, not 0', F(0), E('1/3'));
  check('108 F(4) - F(0)', F(4) - F(0), E('26/3'));
  // wrong 52/3: forgot ÷2 → (2/3)(2x+1)^{3/2}
  const Fbad = f('(2/3)*(2*x+1)^(3/2)');
  check('108 wrong 52/3 from the missing ÷2', Fbad(4) - Fbad(0), E('52/3'));
  check('108 wrong 9 = F(4) alone', F(4), 9);
}

// rq-sub-in-109 — diagnose ∫_0^4 (x^2-3x) = -8/3 taken as area: split at x=3, area 19/3 (MCQ)
{
  const fx = 'x^2 - 3*x';
  checkSet('109 roots of x^2-3x', roots(fx), [0, 3]);
  check('109 the split point 3 lies inside (0,4)', 0 < 3 && 3 < 4 ? 1 : 0, 1);
  check('109 f(1) = -2 (below)', f(fx)(1), -2);
  check('109 f(3.5) = 1.75 (above)', f(fx)(3.5), 1.75);
  check('109 student: 64/3 - 24', E('64/3 - 24'), E('-8/3'));
  icheck('109 student\'s unsplit integral', fx, 0, 4, E('-8/3'));
  icheck('109 part [0,3]', fx, 0, 3, E('-9/2'));
  icheck('109 part [3,4]', fx, 3, 4, E('11/6'));
  check('109 area 9/2 + 11/6', E('9/2 + 11/6'), E('19/3'));
  const F = f('x^3/3 - 3*x^2/2');
  check('109 F(3) - F(0)', F(3) - F(0), E('-9/2'));
  check('109 F(4) - F(3)', F(4) - F(3), E('11/6'));
  // d1: |student's integral| = 8/3; d2: only the part above = 11/6; d3: only between the roots = 9/2
  check('109 d1 = |−8/3|', Math.abs(E('64/3 - 24')), E('8/3'));
  check('109 d2 = part above only', Math.abs(F(4) - F(3)), E('11/6'));
  check('109 d3 = between the roots only', Math.abs(F(3) - F(0)), E('9/2'));
  // explanation: the student's number is 11/6 − 9/2
  check('109 explanation 11/6 - 9/2 = -8/3', E('11/6 - 9/2'), E('-8/3'));
}

// rq-sub-in-110 — f = 2/x^2, area from x=1 to x=a equals 3/2, a > 1 → a = 4
{
  const fx = '2/x^2';
  check('110 f positive on the interval (x=2)', sgn(f(fx)(2)), 1);
  dcheck('110 F = -2/x integrates 2/x^2', '-2/x', fx);
  // area(a) = F(a) - F(1) = 2 - 2/a; solve 2 - 2/a = 3/2
  const a = E('2/(2 - 3/2)');
  check('110 a from 2 - 2/a = 3/2', a, 4);
  check('110 a > 1', a > 1 ? 1 : 0, 1);
  icheck('110 ∫_1^4 2/x^2 = 3/2', fx, 1, 4, 1.5);
  // wrong 4/7: sign lost in F → F_bad = 2/x, 2/a - 2 = 3/2
  const aBad = E('2/(3/2 + 2)');
  check('110 wrong 4/7 from F = +2/x', aBad, E('4/7'));
  check('110 4/7 < 1 (rejected by a > 1)', aBad < 1 ? 1 : 0, 1);
  // wrong -4/3: upper bound only, -2/a = 3/2
  check('110 wrong -4/3 from F(a) alone', E('-2/(3/2)'), E('-4/3'));
  check('110 F(1) = -2', f('-2/x')(1), -2);
}

// rq-sub-in-111 — area between x^3 and x: three meeting points, split at 0 → 1/2
{
  checkSet('111 x^3 = x', roots('x^3 - x', -5, 5), [-1, 0, 1]);
  check('111 x^3 above x on [-1,0] (x=-1/2)', sgn(E('(-1/2)^3 - (-1/2)')), 1);
  check('111 x^3 at -1/2', E('(-1/2)^3'), -0.125);
  check('111 x above x^3 on [0,1] (x=1/2)', sgn(E('1/2 - (1/2)^3')), 1);
  icheck('111 ∫_{-1}^0 (x^3 - x)', 'x^3 - x', -1, 0, 0.25);
  icheck('111 ∫_0^1 (x - x^3)', 'x - x^3', 0, 1, 0.25);
  const F = f('x^4/4 - x^2/2');
  check('111 first part via F', F(0) - F(-1), 0.25);
  check('111 second part via F', -(F(1) - F(0)), 0.25);
  check('111 total', 0.25 + 0.25, 0.5);
  // wrong 0: one integral over [-1,1]; wrong 1/4: one part only
  icheck('111 wrong 0 = unsplit integral', 'x^3 - x', -1, 1, 0);
  check('111 wrong 1/4 = one part', F(0) - F(-1), 0.25);
}

// rq-sub-in-112 — area between 3√x and x (MCQ): meet at 0 and 9 (by squaring), root above → 27/2
{
  checkSet('112 9x = x^2', roots('x^2 - 9*x', -5, 20), [0, 9]);
  check('112 x=0 satisfies 3√x = x', E('3*sqrt(0) - 0'), 0);
  check('112 x=9 satisfies 3√x = x', E('3*sqrt(9) - 9'), 0);
  check('112 root above the line at x=1', sgn(E('3*sqrt(1) - 1')), 1);
  const N = 400000; // √x has an infinite slope at 0: Simpson needs a fine grid to reach 1e-6
  icheck('112 ∫_0^9 (3√x - x)', '3*sqrt(x) - x', 0, 9, 13.5, N);
  dcheck('112 F = 2x^{3/2} - x^2/2', '2*x^(3/2) - x^2/2', '3*sqrt(x) - x', POS);
  const F = f('2*x^(3/2) - x^2/2');
  check('112 F(9) = 54 - 81/2', F(9), E('27/2'));
  check('112 F(0) = 0', F(0), 0);
  // d1: order reversed; d2: ∫3√x alone; d3: sum instead of difference
  icheck('112 d1 = ∫_0^9 (x - 3√x)', 'x - 3*sqrt(x)', 0, 9, -13.5, N);
  icheck('112 d2 = ∫_0^9 3√x', '3*sqrt(x)', 0, 9, 54, N);
  icheck('112 d3 = ∫_0^9 (3√x + x)', '3*sqrt(x) + x', 0, 9, E('189/2'), N);
}

summary('integral');
