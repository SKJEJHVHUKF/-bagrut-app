// Numeric re-derivation of content/lessons/math5/rq-extra/integral.ts (rq-sub-in-101…112).
// Every antiderivative is proved SYMBOLICALLY (dcheck(F, f): mathjs's derivative of the authored
// F must equal the integrand); every definite integral / area is re-integrated by quadrature from
// the question's own function and bounds; every distractor and wrongAnswer note is re-enacted as
// the mistake it names and must land on THAT option.
import { check, dcheck, checkSet, icheck, summary, math, E } from './_lib';
import { getLesson, getSubTopic } from '../../content/lessons';
import type { PracticeQuestion } from '../../content/lessons/types';

// Bind a check to the LIVE question, not to a copy of it. Every section below
// used to re-derive from its own literals, so 2026-09-13's rewrite of 102/104/
// 109/111 left 279/279 passing about questions that no longer existed.
const STAGE = getSubTopic('math5', 'פונקציות', 'rq-integral');
const live = (id: string): PracticeQuestion => {
  const q = (STAGE?.questions ?? []).find((x) => x.id === id);
  if (!q) throw new Error(`${id} is not on the rq-integral ladder`);
  return q as PracticeQuestion;
};
const expectedValue = (id: string): number => {
  const e = live(id).expected;
  if (e?.kind !== 'value') throw new Error(`${id}: expected is not a value`);
  return E(e.value);
};
const has = (id: string, literal: string) => (live(id).question.includes(literal) ? 1 : 0);

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

/** Simpson's rule that RETURNS the value — icheck only asserts one, and the
 *  parameter questions need the integral as an input to a further solve. */
function quad(expr: string, a: number, b: number, n = 40000): number {
  const c = math.parse(expr).compile();
  const h = (b - a) / n;
  let s = (c.evaluate({ x: a }) as number) + (c.evaluate({ x: b }) as number);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * (c.evaluate({ x: a + i * h }) as number);
  return (s * h) / 3;
}
/** Bisection on a scalar equation, so a parameter is RECOVERED from the stated
 *  property instead of being re-derived with the author's own algebra. */
function solveFor(g: (t: number) => number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  let fa = g(a);
  for (let k = 0; k < 200; k++) {
    const m = (a + b) / 2;
    const fm = g(m);
    if (fa * fm <= 0) b = m;
    else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

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

// rq-sub-in-102 — f' = 2x - 2/x^2 through (1, 4): find f(2) → 6   (rewritten 2026-09-13)
{
  check('102 the live question is this one', has('rq-sub-in-102', "f'(x) = 2x - \\dfrac{2}{x^2}"), 1);
  const F = 'x^2 + 2/x';
  dcheck('102 F\' = 2x - 2/x^2', F, '2*x - 2/x^2', [0.7, 1, 1.9, 3.2]);
  const C = 4 - f(F)(1);
  check('102 C from (1,4)', C, 1);
  check('102 f(2) equals the live expected', f(F)(2) + C, expectedValue('rq-sub-in-102'));
  check('102 f(2) = 6', f(F)(2) + C, 6);
  check('102 wrong 5 = F(2) without C', f(F)(2), 5);
  check('102 wrong 7/2 = f\'(2)', f('2*x - 2/x^2')(2), 3.5);
  const Fs = 'x^2 - 2/x'; // the sign slip on the negative power
  check('102 wrong 8 = sign slip, then its own C', f(Fs)(2) + (4 - f(Fs)(1)), 8);
  check('102 explanation: (1,4) is the minimum because f\'(1) = 0', f('2*x - 2/x^2')(1), 0);
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

// rq-sub-in-104 — ∫_1^4 (1 - 2/√x) dx → -1 (a definite integral may be negative)   (rewritten 2026-09-13)
{
  check('104 the live question is this one', has('rq-sub-in-104', '1 - \\dfrac{2}{\\sqrt{x}}'), 1);
  icheck('104 ∫_1^4 (1 - 2/√x)', '1 - 2/sqrt(x)', 1, 4, -1);
  dcheck('104 F = x - 4√x integrates it', 'x - 4*sqrt(x)', '1 - 2/sqrt(x)', POS);
  const F = f('x - 4*sqrt(x)');
  check('104 F(4) - F(1) equals the live expected', F(4) - F(1), expectedValue('rq-sub-in-104'));
  check('104 F(4)', F(4), -4);
  check('104 F(1)', F(1), -3);
  check('104 wrong 1 = |integral|', Math.abs(F(4) - F(1)), 1);
  check('104 wrong -4 = F(4) alone', F(4), -4);
  const Fw = f('x - sqrt(x)'); // divided by 1/2 as if multiplying by it
  check('104 wrong 2 = ×½ instead of ×2', Fw(4) - Fw(1), 2);
  // explanation: on [1,4] √x ≤ 2, so 2/√x ≥ 1 and the integrand is never positive
  check('104 integrand at x=1 is -1', f('1 - 2/sqrt(x)')(1), -1);
  check('104 integrand at x=4 is 0', f('1 - 2/sqrt(x)')(4), 0);
  check('104 never positive on [1,4]', Math.max(...[1, 1.5, 2, 2.5, 3, 3.5, 4].map(f('1 - 2/sqrt(x)'))) <= 1e-12 ? 1 : 0, 1);
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

// rq-sub-in-109 — area of x - 3√x over [4,16]: split at 9 → 11/2 + 27/2 = 19 (MCQ)   (rewritten 2026-09-13)
{
  check('109 the live question is this one', has('rq-sub-in-109', 'x - 3\\sqrt{x}'), 1);
  const fx = 'x - 3*sqrt(x)';
  checkSet('109 roots of x - 3√x in (0.5, 20)', roots(fx, 0.5, 20), [9]);
  check('109 f(4) = -2 (below)', f(fx)(4), -2);
  check('109 f(16) = 4 (above)', f(fx)(16), 4);
  dcheck('109 F = x^2/2 - 2x^(3/2) integrates it', 'x^2/2 - 2*x^(3/2)', fx, POS);
  const F = f('x^2/2 - 2*x^(3/2)');
  check('109 F(4) = -8', F(4), -8);
  check('109 F(9) = -27/2', F(9), E('-27/2'));
  check('109 F(16) = 0', F(16), 0);
  icheck('109 part [4,9]', fx, 4, 9, E('-11/2'));
  icheck('109 part [9,16]', fx, 9, 16, E('27/2'));
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

// rq-sub-in-111 — f = 16/x^2: tangent at x=2, its x-intercept, and the area it cuts off   (rewritten 2026-09-13)
{
  check('111 the live question is this one', has('rq-sub-in-111', '\\dfrac{16}{x^2}'), 1);
  const fx = f('16/x^2');
  dcheck("111 f' = -32/x^3", '16/x^2', '-32/x^3', POS);
  const slope = E('-32/2^3');
  const tan = (x: number) => fx(2) + slope * (x - 2);
  const root = 2 - fx(2) / slope;
  const e = live('rq-sub-in-111').expected;
  const vals = e?.kind === 'set' ? e.values.map(E) : [];
  check('111 box 1 = slope -4', vals[0], slope);
  check('111 box 2 = tangent root 3', vals[1], root);
  check('111 tangent is y = -4x + 12', tan(0), 12);
  // the region: under the curve from 2 to 4, minus the triangle under the tangent from 2 to 3
  const under = quad('16/x^2', 2, 4);
  const triangle = (root - 2) * fx(2) / 2;
  check('111 area under the curve [2,4] = 4', under, 4, 1e-6);
  check('111 triangle = 2', triangle, 2);
  check('111 box 3 = 4 - 2', vals[2], under - triangle, 1e-6);
  check('111 convex: the tangent stays under the curve on (2,4]', [2.2, 2.6, 3, 3.5, 4].every((x) => fx(x) > tan(x)) ? 1 : 0, 1);
  check('111 so the region is bounded below by max(tangent, 0)', quad('16/x^2', 2, 4) - quad('max(-4*x + 12, 0)', 2, 4), 2, 1e-6);
  check('111 wrong 4 = no triangle removed', under, 4, 1e-6);
  check('111 wrong 6 = triangle added', under + triangle, 6, 1e-6);
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

// rq-sub-in-201 — area closed by f = 4 - √x and the two axes → 64/3
{
  const fx = '4 - sqrt(x)';
  check('201 the y-intercept f(0)', f(fx)(0), 4);
  checkSet('201 the x-intercept of 4 - √x', roots(fx, 0, 40), [16]);
  check('201 f is positive inside the interval (x=9)', sgn(f(fx)(9)), 1);
  dcheck('201 F = 4x - (2/3)x^{3/2} integrates 4 - √x', '4*x - (2/3)*x^(3/2)', fx, POS);
  icheck('201 ∫_0^16 (4 - √x)', fx, 0, 16, E('64/3'), 400000);
  const F = f('4*x - (2/3)*x^(3/2)');
  check('201 F(16) - F(0)', F(16) - F(0), E('64/3'));
  check('201 F(16) = 64 - 128/3', F(16), E('64 - 128/3'));
  // wrong 32/3: upper bound taken as 4 (the root was not squared)
  check('201 wrong 32/3 from the un-squared bound', quad(fx, 0, 4), E('32/3'), 1e-5);
  // wrong 128/3: only the root integrated, the constant term dropped
  check('201 wrong 128/3 = ∫_0^16 √x', quad('sqrt(x)', 0, 16), E('128/3'), 1e-5);
  // the figure marks (0, 4) and (16, 0)
  check('201 figure point (0, 4)', f(fx)(0), 4);
  check('201 figure point (16, 0)', f(fx)(16), 0);
}

// rq-sub-in-202 — the bounds arrive as HEIGHTS (y = 8, y = 2) → x = 1, x = 2, area 4
{
  const fx = '8/x^2';
  checkSet('202 f(x) = 8 gives x = 1', roots('8/x^2 - 8', 0.05, 20), [1]);
  checkSet('202 f(x) = 2 gives x = 2', roots('8/x^2 - 2', 0.05, 20), [2]);
  check('202 f positive on the interval (x=1.5)', sgn(f(fx)(1.5)), 1);
  dcheck('202 F = -8/x integrates 8/x^2', '-8/x', fx);
  icheck('202 ∫_1^2 8/x^2', fx, 1, 2, 4);
  const F = f('-8/x');
  check('202 F(2) - F(1)', F(2) - F(1), 4);
  // d1: subtracted in the wrong order → -4
  check('202 d1 = F(1) - F(2)', F(1) - F(2), -4);
  // d2: the y-values used as the bounds → ∫_2^8
  check('202 d2 = ∫_2^8 8/x^2', quad(fx, 2, 8), 3, 1e-6);
  // d3: power lowered (-2 → -3): F_bad = -8/(3x^3)
  const Fbad = f('-8/(3*x^3)');
  check('202 d3 7/3 from the lowered power', Fbad(2) - Fbad(1), E('7/3'));
}

// rq-sub-in-203 — f' = 3/√x - 2x through (4, 1): find f(9) → -58
{
  const G = '6*sqrt(x) - x^2';
  dcheck('203 (6√x - x^2)\' = 3/√x - 2x', G, '3/sqrt(x) - 2*x', POS);
  const C = 1 - f(G)(4);
  check('203 C from the point (4, 1)', C, 5);
  check('203 f(4) = 1 with that C', f(G)(4) + C, 1);
  check('203 f(9)', f(G)(9) + C, -58);
  check('203 wrong -63 = f(9) without C', f(G)(9), -63);
  check('203 wrong -17 = f\'(9)', f('3/sqrt(x) - 2*x')(9), -17);
}

// rq-sub-in-204 — BOTH bounds carry the parameter: area(a) = 5, a > 0 → a = 4/5
{
  const fx = '6/x^2';
  dcheck('204 F = -6/x integrates 6/x^2', '-6/x', fx);
  const area = (t: number) => quad(fx, t, 3 * t, 4000);
  const a = solveFor((t) => area(t) - 5, 0.05, 6);
  check('204 a recovered from area(a) = 5', a, 0.8, 1e-7);
  check('204 a = 4/5', a, E('4/5'), 1e-7);
  check('204 a > 0', a > 0 ? 1 : 0, 1);
  icheck('204 ∫_{4/5}^{12/5} 6/x^2 = 5', fx, 0.8, 2.4, 5);
  const F = f('-6/x');
  check('204 F(3a) - F(a) at a = 4/5', F(2.4) - F(0.8), 5);
  // wrong 5/4: the equation 4/a = 5 inverted
  check('204 wrong 5/4 is not a solution', area(1.25), 3.2, 1e-6);
  // wrong 6/7: the upper bound read as 3 instead of 3a
  const aBad = solveFor((t) => quad(fx, t, 3, 4000) - 5, 0.2, 2.9);
  check('204 wrong 6/7 from the upper bound read as 3', aBad, E('6/7'), 1e-6);
}

// rq-sub-in-205 — area between (x^2+2)/x^2 and its horizontal asymptote y = 1 → 1
{
  const fx = '(x^2+2)/x^2';
  check('205 f tends to 1 far out', f(fx)(1e6), 1, 1e-10);
  check('205 f(1) = 3 (figure point)', f(fx)(1), 3);
  check('205 f(2) = 1.5 (figure point)', f(fx)(2), 1.5);
  check('205 f stays above the asymptote (x=1.5)', sgn(f(fx)(1.5) - 1), 1);
  check('205 the split 1 + 2/x^2 agrees at x=3', f(fx)(3), f('1 + 2/x^2')(3));
  dcheck('205 F = -2/x integrates the difference 2/x^2', '-2/x', '2/x^2');
  icheck('205 ∫_1^2 (f - 1)', '(x^2+2)/x^2 - 1', 1, 2, 1);
  const F = f('-2/x');
  check('205 F(2) - F(1)', F(2) - F(1), 1);
  // wrong 2: f itself integrated, the asymptote ignored as the lower edge
  check('205 wrong 2 = ∫_1^2 f', quad(fx, 1, 2), 2, 1e-6);
  // wrong -1: sign lost in the antiderivative → +2/x
  const Fbad = f('2/x');
  check('205 wrong -1 from F = +2/x', Fbad(2) - Fbad(1), -1);
}

// rq-sub-in-206 — the LONGER strip is the smaller one: S1 = 2, S2 = 1
{
  const fx = '4/x^2';
  icheck('206 S1 = ∫_1^2 4/x^2', fx, 1, 2, 2);
  icheck('206 S2 = ∫_2^4 4/x^2', fx, 2, 4, 1);
  check('206 S1 is twice S2', quad(fx, 1, 2) / quad(fx, 2, 4), 2, 1e-6);
  check('206 the second interval is the longer one', (4 - 2) / (2 - 1), 2);
  dcheck('206 F = -4/x integrates 4/x^2', '-4/x', fx);
  const F = f('-4/x');
  check('206 F(2) - F(1)', F(2) - F(1), 2);
  check('206 F(4) - F(2)', F(4) - F(2), 1);
  // decreasing, which is why the longer strip is the thinner one
  check('206 f(1) = 4 (figure point)', f(fx)(1), 4);
  check('206 f(2) = 1 (figure point)', f(fx)(2), 1);
  check('206 f(4) = 0.25 (figure point)', f(fx)(4), 0.25);
  check('206 f decreasing on x > 0', sgn(f(fx)(1) - f(fx)(2)) + sgn(f(fx)(2) - f(fx)(4)), 2);
  // d3: power lowered (-2 → -3): F_bad = -4/(3x^3) → 7/6 and 7/48
  const Fbad = f('-4/(3*x^3)');
  check('206 d3 first strip 7/6', Fbad(2) - Fbad(1), E('7/6'));
  check('206 d3 second strip 7/48', Fbad(4) - Fbad(2), E('7/48'));
}

// rq-sub-in-207 — f' = 6/√x and the area over [1,4] is 50: recover C → -2
{
  dcheck('207 (12√x - 2)\' = 6/√x', '12*sqrt(x) - 2', '6/sqrt(x)', POS);
  const areaOf = (c: number) => quad(`12*sqrt(x) + (${c})`, 1, 4, 4000);
  const C = solveFor((c) => areaOf(c) - 50, -30, 30);
  check('207 C recovered from area = 50', C, -2, 1e-7);
  icheck('207 ∫_1^4 (12√x - 2) = 50', '12*sqrt(x) - 2', 1, 4, 50);
  check('207 f(1) = 10 > 0 (figure point)', f('12*sqrt(x) - 2')(1), 10);
  check('207 f(4) = 22 > 0 (figure point)', f('12*sqrt(x) - 2')(4), 22);
  check('207 f positive across the interval', sgn(f('12*sqrt(x) - 2')(1)), 1);
  const G = f('8*x^(3/2)');
  check('207 the constant-free part contributes 56', G(4) - G(1), 56);
  check('207 the constant contributes 3C', areaOf(0) - areaOf(-1), 3, 1e-6);
  // wrong -6: the constant counted once instead of over the whole interval
  check('207 wrong -6 solves 56 + C = 50', 50 - (G(4) - G(1)), -6);
  // wrong -3.5: only the upper bound substituted, 64 + 4C = 50
  check('207 wrong -3.5 solves 64 + 4C = 50', (50 - G(4)) / 4, -3.5);
  check('207 G(4) = 64', G(4), 64);
}

// rq-sub-in-112 — the rows the rewritten solution shows
{
  // 112's domain remark and the difference it integrates
  check('112 3√x has no real value left of 0', Number.isFinite(f('3*sqrt(x)')(-1) as number) ? 0 : 1, 1);
  check('112 3√x is real at the domain edge', Number.isFinite(f('3*sqrt(x)')(0)) ? 1 : 0, 1);
  check('112 difference at x = 4 is positive', sgn(E('3*sqrt(4) - 4')), 1);
  check('112 figure point (2.25, 2.25)', E('3*sqrt(2.25) - 2.25'), 2.25);
  check('112 figure point (9, 0)', E('3*sqrt(9) - 9'), 0);
}

// ---------------------------------------------------------------------------
// 2026-09-06, exam-style round. in-106 and in-109 kept their mathematics and lost
// their quiz framing; in-206 came back as a three-part question, so the third
// part — the limit recovered from a required area — is re-derived here too.
// ---------------------------------------------------------------------------

// rq-sub-in-106 — the added line: x = 0 is an asymptote, and it is OUTSIDE [1,2]
{
  const fx = '-4/x^2';
  check('106 the denominator vanishes only at 0', f('x^2')(0), 0);
  check('106 and 0 is outside the interval [1,2]', 0 < 1 ? 1 : 0, 1);
  check('106 so f is finite across the whole interval — at the left end', Number.isFinite(f(fx)(1)) ? 1 : 0, 1);
  check('106 and at the right end', Number.isFinite(f(fx)(2)) ? 1 : 0, 1);
  check('106 just beside 0 it does blow up, which is why the asymptote is worth naming', Math.abs(f(fx)(1e-4)) > 1e6 ? 1 : 0, 1);
}

// rq-sub-in-109 — the four options are four AREA values; each must be reachable
// only by the mistake its note names
{
  const F = f('x^2/2 - 2*x^(3/2)');
  const opts = live('rq-sub-in-109').answers ?? [];
  const num = (s: string) => E(s.replace(/\$|יחידות שטח/g, '').replace(/\\dfrac\{(\d+)\}\{(\d+)\}/, '($1)/($2)').trim());
  check('109 option 0 (correct) = |[4,9]| + |[9,16]| = 19', num(opts[0]), Math.abs(F(9) - F(4)) + Math.abs(F(16) - F(9)));
  check('109 option 1 = one unsplit integral', num(opts[1]), F(16) - F(4));
  check('109 option 2 = the part above the axis only', num(opts[2]), F(16) - F(9));
  check('109 option 3 = the part below the axis only', num(opts[3]), Math.abs(F(9) - F(4)));
  check('109 the four options are four different numbers', new Set(opts.map(num)).size, 4);
  check('109 correct index is 0', live('rq-sub-in-109').correct ?? -1, 0);
}

// rq-sub-in-206 part ג — the upper limit recovered from a required area of 0.5
{
  const fx = '4/x^2';
  const F = f('-4/x');
  const t = 8;
  icheck('206ג ∫_4^8 4/x^2 is exactly 0.5', fx, 4, t, 0.5);
  check('206ג F(t) - F(4) at t = 8 gives 0.5', F(t) - F(4), 0.5, 1e-12);
  check('206ג t = 8 satisfies the required t > 4', t > 4 ? 1 : 0, 1);
  check('206ג the equation 1 - 4/t = 0.5 has 4/t = 0.5', 4 / t, 0.5, 1e-12);
  // solving F(4) - F(t) = 0.5 instead (limits swapped) gives 8/3, which is below 4
  const tSwapped = solveFor((v) => F(4) - F(v) - 0.5, 0.1, 3.9);
  check('206ג swapped limits give 8/3', tSwapped, E('8/3'), 1e-6);
  check('206ג and 8/3 is NOT above 4, so it is refused', E('8/3') > 4 ? 1 : 0, 0);
  check('206ג the area grows with t, so the solution is unique', quad(fx, 4, 9) > quad(fx, 4, 8) ? 1 : 0, 1);
  check('206ג the area beyond 4 never reaches 1, so 0.5 is attainable', F(1e6) - F(4) < 1 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// 2026-09-06, round 3 (ids 3NN). Five questions that climb the archive's own
// area ladder. Nothing below re-applies the authored algebra: every area is
// re-integrated by quadrature from the question's function and bounds, every
// antiderivative is proved symbolically, every parameter is recovered by
// bisection on the stated property, and every distractor is re-enacted as the
// mistake its note names.
// ---------------------------------------------------------------------------

// rq-sub-in-301 — √(4x-8): the LEFT bound is the edge of the domain → area 32/3
{
  const fx = 'sqrt(4*x-8)';
  const F = '(4*x-8)^(3/2)/6';
  const S = [2.1, 2.5, 3, 4.5, 6]; // the root is real only from 2 up
  // the domain edge and the x-intercept are the same value, and it is 2
  checkSet('301 4x-8 vanishes at the domain edge', roots('4*x-8', -5, 10), [2]);
  check('301 f(2) = 0, so the graph meets the axis there', f(fx)(2), 0);
  check('301 f is not real left of 2', Number.isFinite(f(fx)(1.5) as number) ? 0 : 1, 1);
  check('301 f is above the axis inside the interval', sgn(f(fx)(4)), 1);
  // the antiderivative, proved by differentiating it symbolically
  dcheck('301 F = (4x-8)^{3/2}/6 integrates √(4x-8)', F, fx, S);
  check('301 the denominator is 4·(3/2)', E('4*(3/2)'), 6);
  icheck('301 ∫_2^6 √(4x-8)', fx, 2, 6, E('32/3'), 200000);
  check('301 F(6) - F(2)', f(F)(6) - f(F)(2), E('32/3'));
  check('301 F(6) = 16^{3/2}/6', f(F)(6), E('64/6'));
  // d1 128/3: the inner coefficient 4 never divided → F = (2/3)(4x-8)^{3/2}
  const d1 = f('(2/3)*(4*x-8)^(3/2)');
  check('301 d1 128/3 from the missing ÷4', d1(6) - d1(2), E('128/3'));
  // d2 32: divided by the OLD power 1/2 instead of the new 3/2 → denominator 4·(1/2)
  const d2 = f('(4*x-8)^(3/2)/(4*(1/2))');
  check('301 d2 32 from dividing by the old power', d2(6) - d2(2), 32);
  // d3 16: divided by the inner coefficient only → denominator 4
  const d3 = f('(4*x-8)^(3/2)/4');
  check('301 d3 16 from the missing ÷(3/2)', d3(6) - d3(2), 16);
  check('301 the four options are four different numbers', new Set([E('32/3'), E('128/3'), 32, 16]).size, 4);
}

// rq-sub-in-302 — (x-4)/√x straddles the axis inside [1,9]: split at 4 → area 8
{
  const fx = '(x-4)/sqrt(x)';
  const F = '(2/3)*x^(3/2) - 8*sqrt(x)';
  const S = [0.4, 1, 2, 4, 6.5, 9];
  checkSet('302 the crossing inside the interval', roots(fx, 0.05, 20), [4]);
  check('302 f(1) = -3 (below the axis)', f(fx)(1), -3);
  check('302 f(9) = 5/3 (above the axis)', f(fx)(9), E('5/3'));
  check('302 the crossing lies strictly inside (1,9)', 1 < 4 && 4 < 9 ? 1 : 0, 1);
  // the split into two powers is an identity, not a rewrite the author asserts
  check('302 (x-4)/√x = x^{1/2} - 4x^{-1/2} at x = 6.25', f(fx)(6.25), f('x^(1/2) - 4*x^(-1/2)')(6.25));
  dcheck('302 F = (2/3)x^{3/2} - 8√x integrates (x-4)/√x', F, fx, S);
  // f is increasing on x > 0, which is why 4 is the ONLY crossing
  check('302 f is increasing: f(1) < f(4)', f(fx)(1) < f(fx)(4) ? 1 : 0, 1);
  check('302 f is increasing: f(4) < f(9)', f(fx)(4) < f(fx)(9) ? 1 : 0, 1);
  icheck('302 ∫_1^4 is negative', fx, 1, 4, E('-10/3'));
  icheck('302 ∫_4^9 is positive', fx, 4, 9, E('14/3'));
  const Fv = f(F);
  check('302 F(1)', Fv(1), E('-22/3'));
  check('302 F(4)', Fv(4), E('-32/3'));
  check('302 F(9)', Fv(9), -6);
  check('302 area = |first| + |second|', Math.abs(Fv(4) - Fv(1)) + Math.abs(Fv(9) - Fv(4)), 8);
  // wrong 4/3: one unsplit integral; wrong 14/3: only the part above the axis
  icheck('302 wrong 4/3 = the unsplit integral', fx, 1, 9, E('4/3'));
  check('302 wrong 14/3 = the upper part alone', Fv(9) - Fv(4), E('14/3'));
  check('302 the cancellation is 14/3 - 10/3', E('14/3 - 10/3'), Fv(9) - Fv(1), 1e-9);
}

// rq-sub-in-303 — 9/x^2 against 10 - x^2: bounds come out of f = g → area 16/3
{
  const diff = '10 - x^2 - 9/x^2'; // g - f
  const F = '10*x - x^3/3 + 9/x';
  checkSet('303 the graphs meet at 1 and 3 (x > 0)', roots(diff, 0.05, 8), [1, 3]);
  check('303 they really meet at x = 1', f('9/x^2')(1) - f('10 - x^2')(1), 0);
  check('303 they really meet at x = 3', f('9/x^2')(3) - f('10 - x^2')(3), 0);
  // the substitution t = x^2 turns the quartic into t^2 - 10t + 9
  // the substitution's own quadratic, solved numerically (x plays the role of t)
  checkSet('303 t^2 - 10t + 9 = 0 gives t = 1 and t = 9', roots('x^2 - 10*x + 9', -5, 20), [1, 9]);
  check('303 and √9 is the right-hand bound', Math.sqrt(9), 3);
  // who is on top: the parabola, by 3.75 at the midpoint
  check('303 g(2) - f(2) is positive', sgn(f(diff)(2)), 1);
  check('303 f(2) = 9/4 against g(2) = 6', f('9/x^2')(2), E('9/4'));
  check('303 g(2) = 6', f('10 - x^2')(2), 6);
  dcheck('303 F = 10x - x^3/3 + 9/x integrates the difference', F, diff, [0.5, 1, 1.7, 2.4, 3, 4]);
  icheck('303 ∫_1^3 (g - f)', diff, 1, 3, E('16/3'));
  check('303 F(3) - F(1)', f(F)(3) - f(F)(1), E('16/3'));
  check('303 F(3) = 24', f(F)(3), 24);
  check('303 F(1) = 56/3', f(F)(1), E('56/3'));
  // d1 -16/3: subtracted in the wrong order; d2 34/3: the parabola alone;
  // d3 52/3: the two integrals added instead of subtracted
  icheck('303 d1 = ∫_1^3 (f - g)', '9/x^2 - (10 - x^2)', 1, 3, E('-16/3'));
  icheck('303 d2 = ∫_1^3 (10 - x^2)', '10 - x^2', 1, 3, E('34/3'));
  icheck('303 d3 = ∫_1^3 (10 - x^2 + 9/x^2)', '10 - x^2 + 9/x^2', 1, 3, E('52/3'));
  check('303 the four options are four different numbers', new Set([E('16/3'), E('-16/3'), E('34/3'), E('52/3')]).size, 4);
}

// rq-sub-in-304 — a/√x: a recovered from a stated area, then used twice
{
  // א. the parameter is RECOVERED from the property, by bisection on the area
  const areaOf = (A: number) => quad(`${A}/sqrt(x)`, 1, 9, 40000);
  const a = solveFor((A) => areaOf(A) - 24, 0.2, 40);
  check('304 a recovered from area over [1,9] = 24', a, 6, 1e-6);
  dcheck('304 F = 2a√x integrates a/√x at a = 6', '12*sqrt(x)', '6/sqrt(x)', POS);
  icheck('304 and ∫_1^9 6/√x really is 24', '6/sqrt(x)', 1, 9, 24);
  check('304 F(9) - F(1) = 6a - 2a at a = 6', f('12*sqrt(x)')(9) - f('12*sqrt(x)')(1), 24);
  // ב. the meeting point with y = 3
  checkSet('304 6/√x = 3 at x = 4', roots('6/sqrt(x) - 3', 0.05, 30), [4]);
  check('304 f(4) = 3', f('6/sqrt(x)')(4), 3);
  // ג. on [4,9] the LINE is the upper edge, and the area between them is 3
  check('304 f is below the line at x = 9', sgn(3 - f('6/sqrt(x)')(9)), 1);
  check('304 f is decreasing: f(4) > f(9)', f('6/sqrt(x)')(4) > f('6/sqrt(x)')(9) ? 1 : 0, 1);
  dcheck('304 G = 3x - 12√x integrates 3 - 6/√x', '3*x - 12*sqrt(x)', '3 - 6/sqrt(x)', POS);
  icheck('304 ∫_4^9 (3 - 6/√x)', '3 - 6/sqrt(x)', 4, 9, 3);
  check('304 G(9) - G(4)', f('3*x - 12*sqrt(x)')(9) - f('3*x - 12*sqrt(x)')(4), 3);
  // wrong 12 in box א: the ÷(1/2) forgotten, so the area read as 2a
  const aBad = solveFor((A) => quad(`${A}/sqrt(x)`, 1, 9, 4000) / 2 - 24, 0.2, 60);
  check('304 wrong a = 12 when the area is halved by the missing ×2', aBad, 12, 1e-5);
  check('304 and a = 12 does NOT give an area of 24', areaOf(12), 48, 1e-5);
  // wrong 2 in box ב: √x = 2 not squared
  check('304 x = 2 does not satisfy 6/√x = 3', f('6/sqrt(x)')(2) === 3 ? 1 : 0, 0);
  // wrong 12 in box ג: measured to the x-axis instead of to the line
  icheck('304 wrong 12 = ∫_4^9 f itself', '6/sqrt(x)', 4, 9, 12);
}

// rq-sub-in-305 — g = (x√(3-x))^2: the sketch decides the bounds → area 27/4
{
  const fx = 'x*sqrt(3-x)';
  const G = '3*x^2 - x^3';
  const A = 'x^3 - x^4/4';
  // the domain is the ROOT's, and the square really is 3x^2 - x^3
  check('305 f is not real right of 3', Number.isFinite(f(fx)(4) as number) ? 0 : 1, 1);
  check('305 f is real at the domain edge', Number.isFinite(f(fx)(3)) ? 1 : 0, 1);
  for (const v of [-1, 0.5, 2, 2.9]) {
    check(`305 g = (f)^2 at x = ${v}`, f(G)(v), Math.pow(f(fx)(v) as number, 2));
  }
  // 0 is a TOUCH (double root), 3 is a crossing — this is what the sketch shows
  check('305 g(0) = 0', f(G)(0), 0);
  check('305 g(3) = 0', f(G)(3), 0);
  check('305 g > 0 just left of the origin', sgn(f(G)(-0.1)), 1);
  check('305 g > 0 just right of the origin', sgn(f(G)(0.1)), 1);
  checkSet('305 the only crossing right of the origin', roots(G, 0.5, 5), [3]);
  // left of the origin the graph climbs away and never comes back
  check('305 g(-1) is well above the axis', f(G)(-1), 4);
  check('305 g(-3) is higher still', f(G)(-3) > f(G)(-1) ? 1 : 0, 1);
  // the sign table's three representative values, from the real derivative
  dcheck('305 g\' = 6x - 3x^2', G, '6*x - 3*x^2');
  check('305 g\' < 0 at x = -1', sgn(f('6*x - 3*x^2')(-1)), -1);
  check('305 g\' > 0 at x = 1', sgn(f('6*x - 3*x^2')(1)), 1);
  check('305 g\' < 0 at x = 2.5', sgn(f('6*x - 3*x^2')(2.5)), -1);
  // the maximum, found numerically rather than from the author's algebra
  let xMax = 0;
  for (let i = 0; i <= 30000; i++) {
    const x = (3 * i) / 30000;
    if (f(G)(x) > f(G)(xMax)) xMax = x;
  }
  check('305 the maximum sits at x = 2', xMax, 2, 1e-3);
  check('305 and its height is 4', f(G)(2), 4);
  // the area itself
  dcheck('305 A = x^3 - x^4/4 integrates 3x^2 - x^3', A, G);
  icheck('305 ∫_0^3 (3x^2 - x^3)', G, 0, 3, E('27/4'));
  check('305 A(3) - A(0)', f(A)(3) - f(A)(0), E('27/4'));
  check('305 A(3) = 27 - 81/4', f(A)(3), E('27 - 81/4'));
  // wrong 54: the region assumed symmetric about the y-axis
  icheck('305 wrong 54 = ∫_{-3}^{3}', G, -3, 3, 54);
  // wrong 81/2: the integral of a product taken as the product of the integrals
  check('305 wrong 81/2 = (∫x^2)·(∫(3-x))', quad('x^2', 0, 3) * quad('3-x', 0, 3), E('81/2'), 1e-6);
  check('305 the three values are three different numbers', new Set([E('27/4'), 54, E('81/2')]).size, 3);
}

// ---------------------------------------------------------------------------
// 2026-09-13, Itay's round on רמה 7: "הפונקציות באינטגרלים יהיו טיפה יותר
// מסובכות" and "רמת בגרות יותר גבוהה עם פונקציה יותר מסובכת". The main-file
// questions 001/002/003/005/008 and the bagrut question fn-bag-rq-007 were
// rewritten on quotient/root integrands; each is re-derived here from the LIVE
// content and every distractor re-enacted as the mistake its note names.
// ---------------------------------------------------------------------------

// rq-sub-in-001 — ∫(3x² − 6/x³) dx (MCQ) → x³ + 3/x² + C
{
  check('001 the live question is this one', has('rq-sub-in-001', '3x^2 - \\dfrac{6}{x^3}'), 1);
  dcheck('001 F = x^3 + 3/x^2', 'x^3 + 3/x^2', '3*x^2 - 6/x^3', POS);
  dcheck('001 d1 the derivative option is (3x² − 6/x³)\'', '3*x^2 - 6/x^3', '6*x + 18/x^4', POS);
  dcheck('001 d2 the sign slip integrates 3x² + 6/x³', 'x^3 - 3/x^2', '3*x^2 + 6/x^3', POS);
  check('001 coefficient -6/(-3+1)', E('-6/(-3+1)'), 3);
}

// rq-sub-in-002 — ∫_1^4 x√x dx → 62/5
{
  check('002 the live question is this one', has('rq-sub-in-002', 'x\\sqrt{x}'), 1);
  icheck('002 ∫_1^4 x√x', 'x*sqrt(x)', 1, 4, E('62/5'));
  dcheck('002 F = (2/5)x^(5/2)', '(2/5)*x^(5/2)', 'x*sqrt(x)', POS);
  check('002 equals the live expected', expectedValue('rq-sub-in-002'), E('62/5'));
  check('002 wrong 7 = integrand substituted', E('4*sqrt(4) - 1*sqrt(1)'), 7);
  check('002 wrong 64/5 = F(4) alone', E('(2/5)*4^(5/2)'), E('64/5'));
  check('002 wrong 62/3 = divided by the old power 3/2', E('(2/3)*(4^(5/2) - 1)'), E('62/3'));
}

// rq-sub-in-003 — ∫ 2x/(x²+4)³ dx (MCQ) → −1/(2(x²+4)²) + C
{
  check('003 the live question is this one', has('rq-sub-in-003', '\\dfrac{2x}{(x^2 + 4)^3}'), 1);
  const S = [-1.7, -0.4, 0.6, 1.3, 2.9];
  dcheck('003 F = -1/(2(x²+4)²)', '-1/(2*(x^2+4)^2)', '2*x/(x^2+4)^3', S);
  dcheck('003 d1 sign slip integrates the negative', '1/(2*(x^2+4)^2)', '-2*x/(x^2+4)^3', S);
  dcheck('003 d2 power went down to -4', '-1/(4*(x^2+4)^4)', '2*x/(x^2+4)^5', S);
  // d3: numerator integrated apart → −x²/(2(x²+4)²), whose derivative is NOT the integrand
  const d3 = math.derivative('-x^2/(2*(x^2+4)^2)', 'x');
  check('003 d3 is not an antiderivative (x = 1)', Math.abs((d3.evaluate({ x: 1 }) as number) - E('2/5^3')) > 1e-3 ? 1 : 0, 1);
}

// rq-sub-in-005 — area between (4 − x)√x and the x-axis → 128/15
{
  check('005 the live question is this one', has('rq-sub-in-005', '(4 - x)\\sqrt{x}'), 1);
  checkSet('005 roots in [0, 6]', [0, ...roots('(4-x)*sqrt(x)', 0.01, 6)], [0, 4]);
  dcheck('005 F = (8/3)x^(3/2) - (2/5)x^(5/2)', '(8/3)*x^(3/2) - (2/5)*x^(5/2)', '(4-x)*sqrt(x)', POS);
  const F = f('(8/3)*x^(3/2) - (2/5)*x^(5/2)');
  check('005 F(4) - F(0) equals the live expected', F(4) - F(0), expectedValue('rq-sub-in-005'));
  check('005 above the axis inside (0,4)', sgn(f('(4-x)*sqrt(x)')(2)), 1);
  check('005 below the axis right of 4 (no closed region there)', sgn(f('(4-x)*sqrt(x)')(5)), -1);
  check('005 wrong 128/3 = product of the two integrals', quad('sqrt(x)', 0, 4) * quad('4-x', 0, 4), E('128/3'), 1e-4);
  check('005 wrong 64/3 = first term only', E('(8/3)*8'), E('64/3'));
}

// rq-sub-in-008 — area of 3 − 12/x² over [1,4]: parts 3 + 3 = 6, signed integral 0 (MCQ)
{
  check('008 the live question is this one', has('rq-sub-in-008', '3 - \\dfrac{12}{x^2}'), 1);
  const fx = '3 - 12/x^2';
  checkSet('008 roots in [0.5, 5]', roots(fx, 0.5, 5), [2]);
  const F = f('3*x + 12/x');
  dcheck('008 F = 3x + 12/x', '3*x + 12/x', fx, POS);
  check('008 F(1), F(2), F(4)', F(1) * 100 + F(2) * 10 + F(4), 15 * 100 + 12 * 10 + 15);
  check('008 area equals the live expected', Math.abs(F(2) - F(1)) + Math.abs(F(4) - F(2)), expectedValue('rq-sub-in-008'));
  check('008 option 0 unsplit integral', F(4) - F(1), 0);
  check('008 option one part', F(4) - F(2), 3);
  const Fw = f('3*x - 12/x');
  check('008 option 18 = the sign slip', Math.abs(Fw(2) - Fw(1)) + Math.abs(Fw(4) - Fw(2)), 18);
}

// fn-bag-rq-007 — f(x) = 8x/(x²+3)², parts א–ה
{
  const bag = getLesson('math5', 'פונקציות')?.bagrutQuestions?.find((b) => b.id === 'fn-bag-rq-007');
  check('bag the live context is this function', bag?.context.includes('\\dfrac{8x}{(x^2 + 3)^2}') ? 1 : 0, 1);
  const fx = '8*x/(x^2+3)^2';
  const S = [-2.5, -0.6, 0.3, 1.4, 3.1];
  check('bag א the denominator never vanishes (min of x²+3 is 3)', E('0^2 + 3'), 3);
  check('bag א horizontal asymptote y = 0', Math.abs(f(fx)(1e5)) < 1e-8 ? 1 : 0, 1);
  dcheck("bag ב f' = 24(1−x²)/(x²+3)³", fx, '24*(1-x^2)/(x^2+3)^3', S);
  const partB = bag?.parts.find((p) => p.label === 'ב')?.expected;
  const xs = partB?.kind === 'set' ? partB.values.map(E) : [];
  check('bag ב box 1 (max) = 1', xs[0], 1);
  check('bag ב box 2 (min) = -1', xs[1], -1);
  check("bag ב f' changes + → − at 1 (max)", sgn(f('24*(1-x^2)/(x^2+3)^3')(0.9)) - sgn(f('24*(1-x^2)/(x^2+3)^3')(1.1)), 2);
  check('bag ב f(1) = 1/2', f(fx)(1), 0.5);
  check('bag ג odd: f(-x) = -f(x)', f(fx)(-1.7) + f(fx)(1.7), 0);
  dcheck('bag ד F = -4/(x²+3)', '-4/(x^2+3)', fx, S);
  const partD = bag?.parts.find((p) => p.label === 'ד')?.expected;
  check('bag ד area [0,3] equals the live expected', quad(fx, 0, 3), partD?.kind === 'value' ? E(partD.value) : NaN, 1e-9);
  check('bag ד f > 0 on (0,3]', Math.min(...[0.01, 1, 2, 3].map(f(fx))) > 0 ? 1 : 0, 1);
  const partE = bag?.parts.find((p) => p.label === 'ה')?.expected;
  const k = partE?.kind === 'value' ? E(partE.value) : NaN;
  check('bag ה k solves 2(4/3 − 4/(k²+3)) = 4/3', 2 * (4 / 3 - 4 / (k * k + 3)), 4 / 3, 1e-12);
  check('bag ה the area over [−k, k] is 4/3 by quadrature', quad(`abs(${fx})`, -k, k), 4 / 3, 1e-6);
  check('bag ה one integral over [−k, k] is 0 — the trap', quad(fx, -k, k), 0, 1e-9);
}

// lesson — the why-step trapezoid and the new inner-derivative quotient example
{
  icheck('lesson ∫_1^3 (2x+1) = trapezoid (3+7)·2/2', '2*x+1', 1, 3, (3 + 7) * 2 / 2);
  icheck('drill-008 ∫_1^4 (√x + 1) is the area it names', 'sqrt(x)+1', 1, 4, E('14/3 + 3'));
  dcheck('lesson ∫2x/(x²+1)² = −1/(x²+1)', '-1/(x^2+1)', '2*x/(x^2+1)^2', [-1.3, 0.2, 1.1, 2.4]);
}

summary('integral');
