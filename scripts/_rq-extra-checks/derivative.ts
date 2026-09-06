// Numeric re-derivation of content/lessons/math5/rq-extra/derivative.ts (rq-sub-der-101…112).
// Every derivative is compared SYMBOLICALLY (dcheck); every slope / second derivative is evaluated
// from mathjs's own derivative of the question's f, never from the authored f'; every distractor
// and wrongAnswer note is re-enacted as the mistake it names and must land on THAT option.
import { check, dcheck, checkSet, summary, math, E } from './_lib';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number, name = 'x') => c.evaluate({ [name]: v }) as number;
};
const d1 = (expr: string) => math.derivative(expr, 'x');
const dAt = (expr: string, x: number) => d1(expr).evaluate({ x }) as number;
const d2At = (expr: string, x: number) => math.derivative(d1(expr), 'x').evaluate({ x }) as number;
/** real roots of expr in [lo, hi] via sign changes on a grid + bisection (simple roots only) */
function roots(expr: string, lo = -20, hi = 20, name = 'x'): number[] {
  const g = f(expr);
  const out: number[] = [];
  const push = (r: number) => { if (!out.some(o => Math.abs(o - r) < 1e-6)) out.push(r); };
  const n = 8000;
  const h = (hi - lo) / n;
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = a + h;
    let fa = g(a, name), fb = g(b, name);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;
    if (fa === 0) { push(a); continue; }
    if (fa * fb > 0) continue;
    for (let k = 0; k < 60; k++) {
      const m = (a + b) / 2, fm = g(m, name);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    push((a + b) / 2);
  }
  return out;
}
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// rq-sub-der-101 — (x^3+4x^2)/x: simplify to x^2+4x, f' = 2x+4 (MCQ)
{
  const fx = '(x^3+4*x^2)/x';
  const S = [-2.3, -1, -0.5, 0.7, 1, 2.5]; // x=0 excluded (0/0 in the unsimplified form)
  dcheck('101 f\' of (x^3+4x^2)/x is 2x+4', fx, '2*x+4', S);
  for (const v of S) check(`101 simplified form x^2+4x at x=${v}`, f(fx)(v), f('x^2+4*x')(v));
  const x0 = 2;
  const correct = dAt(fx, x0);
  const optB = dAt('x^3+4*x^2', x0) / x0;                 // numerator derived, denominator kept
  const optC = dAt('x^3+4*x^2', x0) / dAt('x', x0);       // u'/v'  (denominator' = 1)
  const optD = 1 * x0 ** 1 + 4 * x0 ** 0;                 // power not brought down: x^n -> x^(n-1)
  check('101 option B value = (3x^2+8x)/x', f('(3*x^2+8*x)/x')(x0), optB);
  check('101 option C value = 3x^2+8x', f('3*x^2+8*x')(x0), optC);
  check('101 option D value = x+4', f('x+4')(x0), optD);
  check('101 four options distinct at x=2', new Set([correct, optB, optC, optD]).size, 4);
}

// rq-sub-der-102 — slope of 4*sqrt(x) at x=4 → 1
{
  const fx = '4*sqrt(x)';
  dcheck('102 f\' = 2/sqrt(x)', fx, '2/sqrt(x)', [0.5, 1, 2.5, 4, 9]);
  check('102 f\'(4) = 1', dAt(fx, 4), 1);
  check('102 wrong 8 = f(4) (height)', f(fx)(4), 8);
  check('102 wrong 2 = 4/sqrt(4) (2 dropped from denominator)', E('4/sqrt(4)'), 2);
  check('102 wrong 1/4 = 1/(2 sqrt 4) (coefficient forgotten)', E('1/(2*sqrt(4))'), 1 / 4);
}

// rq-sub-der-103 — horizontal tangent of x^2-10x+3 → x = 5
{
  const fx = 'x^2-10*x+3';
  dcheck('103 f\' = 2x-10', fx, '2*x-10');
  checkSet('103 f\'=0 at x=5 only', roots('2*x-10'), [5]);
  check('103 f\'(5) = 0 (computed)', dAt(fx, 5), 0);
  check('103 wrong -22 = f(5) (the height)', f(fx)(5), -22);
  checkSet('103 wrong 10 = root of x-10 (power not brought down)', roots('x-10'), [10]);
}

// rq-sub-der-104 — f' = 3x^2+5 never zero → rises everywhere, no extremum (MCQ)
{
  const fp = '3*x^2+5';
  checkSet('104 f\' has no real root', roots(fp, -100, 100), []);
  check('104 min of f\' on grid is 5 (>0)', Math.min(...[-3, -1, 0, 0.5, 2, 7].map(v => f(fp)(v))), 5);
  check('104 f\'(0) = 5 (distractor B: minimum of the derivative, not of f)', f(fp)(0), 5);
  check('104 x^2 = -5/3 is negative (distractor D)', sgn(E('-5/3')), -1);
  const F = 'x^3+5*x'; // an f with this f'
  dcheck('104 f = x^3+5x has this derivative', F, fp);
  check('104 f strictly increasing on samples', [-3, -1, 0, 1, 3].every((v, i, a) => i === 0 || f(F)(v) > f(F)(a[i - 1])) ? 1 : 0, 1);
}

// rq-sub-der-105 — candidates x=2, x=5 with f'' = 3x^2-18x+24: f''(2)=0 inconclusive, f''(5)>0 minimum
{
  const fp = '(x-2)^2*(x-5)'; // a first derivative that has exactly these candidates
  const fpp = '3*x^2-18*x+24';
  checkSet('105 f\' vanishes exactly at 2 and 5', roots(fp), [2, 5]);
  dcheck('105 given f\'\' is the derivative of that f\'', fp, fpp);
  check('105 f\'\'(2) = 0 (inconclusive)', f(fpp)(2), 0);
  check('105 f\'\'(5) = 9 (> 0 → minimum)', f(fpp)(5), 9);
  check('105 sign of f\' changes - → + at 5', sgn(f(fp)(4.9)) * 10 + sgn(f(fp)(5.1)), -9);
  check('105 sign of f\' does NOT change at 2 (negative both sides)', sgn(f(fp)(1.9)) + sgn(f(fp)(2.1)), -2);
  // the original data f'' = 6x-12 could not have both candidates: f' = 3x^2-12x+C, f'(2)=0 → C=12 → f'(5)=27
  const C = -f('3*x^2-12*x')(2);
  check('105 old f\'\'=6x-12 data was inconsistent: f\'(5) != 0', Math.abs(f('3*x^2-12*x')(5) + C) > 1e-9 ? 1 : 0, 1);
}

// rq-sub-der-106 — slope of (x^2-5)^4 at x=2 → -16
{
  const fx = '(x^2-5)^4';
  dcheck('106 f\' = 8x(x^2-5)^3', fx, '8*x*(x^2-5)^3');
  check('106 f\'(2) = -16', dAt(fx, 2), -16);
  check('106 inner value at 2 is -1', f('x^2-5')(2), -1);
  check('106 wrong -4 = outer only, inner derivative forgotten', E('4*(2^2-5)^3'), -4);
  check('106 wrong 16 = sign lost', Math.abs(dAt(fx, 2)), 16);
}

// rq-sub-der-107 — slope of (x^2-3)sqrt(x+1) at x=3 → 27/2 (MCQ)
{
  const fx = '(x^2-3)*sqrt(x+1)';
  dcheck('107 product rule form', fx, '2*x*sqrt(x+1)+(x^2-3)/(2*sqrt(x+1))', [-0.5, 0.7, 1, 2.5, 3]);
  const u = f('x^2-3')(3), up = dAt('x^2-3', 3), v = f('sqrt(x+1)')(3), vp = dAt('sqrt(x+1)', 3);
  check('107 u(3) = 6', u, 6);
  check('107 u\'(3) = 6', up, 6);
  check('107 v(3) = 2', v, 2);
  check('107 v\'(3) = 1/4', vp, 1 / 4);
  check('107 f\'(3) = 27/2', dAt(fx, 3), 27 / 2);
  check('107 u\'v + uv\' = 27/2', up * v + u * vp, 27 / 2);
  check('107 distractor 3/2 = u\'·v\'', up * vp, 3 / 2);
  check('107 distractor 12 = u\'v only', up * v, 12);
  check('107 distractor 15 = v\' taken as 1/2', up * v + u * (1 / 2), 15);
  check('107 note D: 6·(1/4) = 6/4', u * vp, 6 / 4);
}

// rq-sub-der-108 — slope of 2/(x-1) equals -1/2 → x = 3, x = -1
{
  const fx = '2/(x-1)';
  const S = [-2.3, -1, -0.5, 0.7, 2.5, 3];
  dcheck('108 f\' = -2/(x-1)^2', fx, '-2/(x-1)^2', S);
  const sol = roots(`-2/(x-1)^2 + 1/2`).filter(r => Math.abs(r - 1) > 1e-6);
  checkSet('108 f\' = -1/2 at x = 3 and x = -1', sol, [3, -1]);
  for (const r of sol) check(`108 f'(${r}) = -1/2 (computed)`, dAt(fx, r), -1 / 2);
  check('108 both solutions differ from 1 (in domain)', sol.every(r => Math.abs(r - 1) > 1e-9) ? 1 : 0, 1);
  checkSet('108 (x-1)^2 = 4 has the same roots', roots('(x-1)^2-4'), [3, -1]);
  checkSet('108 wrong 1,-3 = sign flipped: (x+1)^2 = 4', roots('(x+1)^2-4'), [1, -3]);
}

// rq-sub-der-109 — f = x^2 + 4/x, f''(1) = 10
{
  const fx = 'x^2+4/x';
  const S = [-2.3, -1, -0.5, 0.7, 1, 2.5];
  dcheck('109 f\' = 2x - 4x^-2', fx, '2*x-4*x^(-2)', S);
  dcheck('109 f\'\' = 2 + 8x^-3', '2*x-4*x^(-2)', '2+8*x^(-3)', S);
  check('109 f\'\'(1) = 10 (computed from f)', d2At(fx, 1), 10);
  check('109 wrong -2 = f\'(1)', dAt(fx, 1), -2);
  check('109 wrong -6 = 2 - 8 (second sign lost)', E('2-8'), -6);
  check('109 note: -4·(-2) = 8', E('-4*(-2)'), 8);
}

// rq-sub-der-110 — f' = x(x-3)^2: rises for x>0, no extremum at 3, minimum at 0 (MCQ)
{
  const fp = 'x*(x-3)^2';
  checkSet('110 f\' zeros are 0 and 3', roots(fp), [0, 3]);
  check('110 f\'(-1) = -16 (note D)', f(fp)(-1), -16);
  check('110 f\'(1) = 4 (note C)', f(fp)(1), 4);
  check('110 sign - → + at 0 (minimum)', sgn(f(fp)(-0.1)) * 10 + sgn(f(fp)(0.1)), -9);
  check('110 sign + both sides of 3 (no extremum)', sgn(f(fp)(2.9)) + sgn(f(fp)(3.1)), 2);
  check('110 (x-3)^2 > 0 away from 3', Math.min(...[-1, 1, 2.9, 3.1, 5].map(v => f('(x-3)^2')(v))) > 0 ? 1 : 0, 1);
  const F = 'x^4/4-2*x^3+9*x^2/2';
  dcheck('110 f = x^4/4-2x^3+9x^2/2 has this derivative', F, fp);
  check('110 f increasing on x>0 samples', [0.5, 1, 2, 3, 4, 6].every((v, i, a) => i === 0 || f(F)(v) > f(F)(a[i - 1])) ? 1 : 0, 1);
}

// rq-sub-der-111 — (x+3)sqrt(x-1): f'=0 only at x=-1/3, outside x>=1 → no horizontal-tangent extremum (MCQ)
{
  const fx = '(x+3)*sqrt(x-1)';
  check('111 radicand negative just below 1', sgn(f('x-1')(0.999)), -1);
  check('111 radicand zero at 1', f('x-1')(1), 0);
  dcheck('111 f\' = (3x+1)/(2 sqrt(x-1))', fx, '(3*x+1)/(2*sqrt(x-1))', [1.2, 2, 3, 5, 10]);
  checkSet('111 numerator 3x+1 vanishes at -1/3', roots('3*x+1'), [-1 / 3]);
  check('111 candidate -1/3 is below 1 (rejected)', -1 / 3 < 1 ? 1 : 0, 1);
  checkSet('111 no zero of the numerator inside the domain', roots('3*x+1', 1, 100), []);
  check('111 f\' > 0 throughout the domain (samples)', Math.min(...[1.01, 1.5, 2, 4, 9].map(v => dAt(fx, v))) > 0 ? 1 : 0, 1);
  check('111 denominator 2 sqrt(x-1) is 0 at x=1 (f\' undefined, not zero)', f('2*sqrt(x-1)')(1), 0);
}

// rq-sub-der-112 — f = x + a/(x-1) with an extremum at x=4 → a = 9
{
  const as = roots('1-a/(4-1)^2', -20, 20, 'a');
  checkSet('112 f\'(4) = 0 solves to a = 9', as, [9]);
  const a = as[0];
  const fx = `x+${a}/(x-1)`;
  dcheck('112 f\' = 1 - a/(x-1)^2 (a=9)', fx, `1-${a}/(x-1)^2`, [-2.3, -1, -0.5, 0.7, 2.5, 4]);
  check('112 f\'(4) = 0 with a=9 (computed)', dAt(fx, 4), 0);
  check('112 it is a real extremum: f\'\'(4) > 0', sgn(d2At(fx, 4)), 1);
  check('112 sign - → + at 4', sgn(dAt(fx, 3.9)) * 10 + sgn(dAt(fx, 4.1)), -9);
  checkSet('112 wrong 3 = denominator not squared', roots('1-a/(4-1)', -20, 20, 'a'), [3]);
  checkSet('112 wrong -9 = sign of the derivative lost', roots('1+a/(4-1)^2', -20, 20, 'a'), [-9]);
}

// ===========================================================================
// Widening round (2026-09-06): the formula lines, the sign tables and the new
// questions rq-sub-der-201…206. Every claim below is re-derived from the
// question's own function — never from the authored algebra.
// ===========================================================================

/** roots of a numeric CALLBACK on [lo, hi] — the string version above cannot
 *  take a parameter that lives in a scope (needed to solve for b in 204). */
function rootsF(g: (v: number) => number, lo = -20, hi = 20): number[] {
  const out: number[] = [];
  const push = (r: number) => { if (!out.some(o => Math.abs(o - r) < 1e-6)) out.push(r); };
  const n = 4000;
  const h = (hi - lo) / n;
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = a + h;
    let fa = g(a);
    const fb0 = g(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb0)) continue;
    if (fa === 0) { push(a); continue; }
    if (fa * fb0 > 0) continue;
    for (let k = 0; k < 60; k++) {
      const m = (a + b) / 2, fm = g(m);
      if (fa * fm <= 0) { b = m; } else { a = m; fa = fm; }
    }
    push((a + b) / 2);
  }
  return out;
}

// The rules the new **הנוסחה:** lines name, checked as claims of their own.
{
  // 101 + 109 — the power rule, for a positive and for a negative exponent
  for (const n of [2, 1, -1, -2, -3]) {
    dcheck(`101/109 (x^${n})' = ${n}x^${n - 1}`, `x^(${n})`, `${n}*x^(${n - 1})`, [-2.3, -0.5, 0.7, 2.5]);
  }
  check('101 (x^2)\' at x = 3 is 6', dAt('x^2', 3), 6);
  check('101 (4x)\' at x = 3 is 4', dAt('4*x', 3), 4);
  // 104 — "f' > 0 on an interval means f rises there"
  check('104 f\' = 3x^2+5 is positive at 41 grid points',
    Array.from({ length: 41 }, (_, i) => -20 + i).every(v => f('3*x^2+5')(v) > 0) ? 1 : 0, 1);
  check('104 3x^2 is never negative', Math.min(...[-7, -1, 0, 0.5, 4].map(v => f('3*x^2')(v))), 0);
  // 107 + 111 — the root rule: the inner derivative is what multiplies
  dcheck('107 (sqrt(x+1))\' = 1/(2 sqrt(x+1))', 'sqrt(x+1)', '1/(2*sqrt(x+1))', [-0.5, 0.7, 3, 8]);
  check('107 the inner derivative of x+1 is 1', dAt('x+1', 3), 1);
  dcheck('111 (sqrt(x-1))\' = 1/(2 sqrt(x-1))', 'sqrt(x-1)', '1/(2*sqrt(x-1))', [1.2, 2, 5, 10]);
  check('111 the inner derivative of x-1 is 1', dAt('x-1', 5), 1);
  dcheck('111 the split form and the common-denominator form agree',
    '(x+3)*sqrt(x-1)', 'sqrt(x-1)+(x+3)/(2*sqrt(x-1))', [1.2, 2, 3, 5, 10]);
}

// rq-sub-der-105 — the sign table now drawn in the solution, for f' = (x-2)^2(x-5)
{
  const fp = '(x-2)^2*(x-5)';
  check('105 table column x<2: f\' negative', sgn(f(fp)(0)), -1);
  check('105 table column 2<x<5: f\' negative', sgn(f(fp)(3.5)), -1);
  check('105 table column x>5: f\' positive', sgn(f(fp)(7)), 1);
  check('105 table row (x-2)^2 is positive in all three columns',
    [0, 3.5, 7].every(v => f('(x-2)^2')(v) > 0) ? 1 : 0, 1);
  check('105 table row (x-5): - , - , +',
    sgn(f('x-5')(0)) * 100 + sgn(f('x-5')(3.5)) * 10 + sgn(f('x-5')(7)), -109);
  check('105 f\' row equals the product of the two rows',
    [0, 3.5, 7].every(v => sgn(f(fp)(v)) === sgn(f('(x-2)^2')(v)) * sgn(f('x-5')(v))) ? 1 : 0, 1);
}

// rq-sub-der-108 — same answer, now derived with the quotient rule
{
  const fx = '2/(x-1)';
  const S = [-2.3, -1, -0.5, 0.7, 2.5, 3];
  dcheck('108 quotient-rule form (u\'v - uv\')/v^2 equals the true derivative', fx, '(0*(x-1)-2*1)/(x-1)^2', S);
  check('108 f\'(0) = -2 (computed)', dAt(fx, 0), -2);
  check('108 the numerator of f\' is the constant -2 at two different x',
    f('0*(x-1)-2*1')(7), f('0*(x-1)-2*1')(-3));
}

// rq-sub-der-110 — the sign table now drawn in the solution, for f' = x(x-3)^2
{
  const fp = 'x*(x-3)^2';
  check('110 table row x: - , + , +',
    sgn(f('x')(-1)) * 100 + sgn(f('x')(1.5)) * 10 + sgn(f('x')(5)), -89);
  check('110 table row (x-3)^2 is positive in all three columns',
    [-1, 1.5, 5].every(v => f('(x-3)^2')(v) > 0) ? 1 : 0, 1);
  check('110 f\' row equals the product of the two rows',
    [-1, 1.5, 5].every(v => sgn(f(fp)(v)) === sgn(f('x')(v)) * sgn(f('(x-3)^2')(v))) ? 1 : 0, 1);
}

// rq-sub-der-112 — same answer, now derived with the quotient rule on a/(x-1)
{
  const S = [-2.3, -1, -0.5, 0.7, 2.5, 4];
  dcheck('112 quotient-rule expansion of 9/(x-1)', '9/(x-1)', '(0*(x-1)-9*1)/(x-1)^2', S);
  const q = math.derivative('a/(x-1)', 'x');
  for (const a of [-3, 1, 9]) {
    for (const v of [-1, 0.7, 4]) {
      check(`112 (a/(x-1))' = -a/(x-1)^2 at a=${a}, x=${v}`,
        q.evaluate({ x: v, a }) as number, -a / (v - 1) ** 2);
    }
  }
}

// rq-sub-der-201 — horizontal tangents of x^2/(x-2): x = 0 and x = 4
{
  const fx = 'x^2/(x-2)';
  const S = [-2.3, -1, -0.5, 0.7, 1, 2.5, 4];
  dcheck('201 quotient-rule form before simplifying', fx, '(2*x*(x-2)-x^2*1)/(x-2)^2', S);
  dcheck('201 simplified f\' = x(x-4)/(x-2)^2', fx, 'x*(x-4)/(x-2)^2', S);
  const sol = roots('x*(x-4)/(x-2)^2').filter(r => Math.abs(r - 2) > 1e-6);
  checkSet('201 f\' = 0 exactly at x = 0 and x = 4', sol, [0, 4]);
  for (const r of sol) check(`201 f'(${r}) = 0 (computed from f)`, dAt(fx, r), 0);
  check('201 x = 2 zeros the denominator (outside the domain)', f('x-2')(2), 0);
  check('201 f is not defined at x = 2', Number.isFinite(f(fx)(2)) ? 1 : 0, 0);
  check('201 x = 2 is not a solution: f\' does not vanish just beside it',
    Math.abs(dAt(fx, 2.001)) > 1e-6 ? 1 : 0, 1);
  check('201 the two solutions are extrema: sign of f\' flips at 0',
    sgn(dAt(fx, -0.1)) * 10 + sgn(dAt(fx, 0.1)), 9);
  check('201 sign of f\' flips at 4', sgn(dAt(fx, 3.9)) * 10 + sgn(dAt(fx, 4.1)), -9);
}

// rq-sub-der-202 — the student added instead of subtracting in the quotient rule
{
  const fx = '(3*x+1)/x^2';
  const S = [-2.3, -1, -0.5, 0.7, 1, 2.5];
  dcheck('202 correct quotient-rule numerator uses a minus', fx, '(3*x^2-(3*x+1)*2*x)/x^4', S);
  dcheck('202 simplified correct f\' = -(3x+2)/x^3', fx, '-(3*x+2)/x^3', S);
  const student = '(3*x^2+(3*x+1)*2*x)/x^4';
  check('202 the student\'s expression is NOT the derivative (differs at x=1)',
    Math.abs(f(student)(1) - dAt(fx, 1)) > 1e-6 ? 1 : 0, 1);
  check('202 the student\'s value at x = 1 is 11', f(student)(1), 11);
  check('202 the true slope at x = 1 is -5', dAt(fx, 1), -5);
  check('202 option B is wrong: v^2 = (x^2)^2 really is x^4', f('(x^2)^2')(2), f('x^4')(2));
  check('202 option C is wrong: u\' of 3x+1 is 3, not 3x', dAt('3*x+1', 2), 3);
  check('202 option D is wrong: v\' of x^2 is 2x, which is 4 at x = 2', dAt('x^2', 2), 4);
  check('202 flipping only that one sign repairs the expression at x = 2.5',
    f('(3*x^2-(3*x+1)*2*x)/x^4')(2.5), dAt(fx, 2.5));
}

// rq-sub-der-203 — (x+4)/(x-1) has no extremum: f' = -5/(x-1)^2, never zero
{
  const fx = '(x+4)/(x-1)';
  const S = [-2.3, -1, -0.5, 0.7, 2.5, 3];
  dcheck('203 quotient-rule form before simplifying', fx, '(1*(x-1)-(x+4)*1)/(x-1)^2', S);
  dcheck('203 simplified f\' = -5/(x-1)^2', fx, '-5/(x-1)^2', S);
  checkSet('203 f\' has no zero at all', roots('-5/(x-1)^2', -50, 50).filter(r => Math.abs(r - 1) > 1e-6), []);
  check('203 f\' is negative at every sample', S.every(v => dAt(fx, v) < 0) ? 1 : 0, 1);
  check('203 the numerator of f\' is constant (same at two far-apart x)',
    f('1*(x-1)-(x+4)*1')(7), f('1*(x-1)-(x+4)*1')(-3));
  check('203 and that constant is -5', f('1*(x-1)-(x+4)*1')(7), -5);
  check('203 distractor B: x = 1 zeros the denominator of f', f('x-1')(1), 0);
  check('203 distractor C: x = -4 zeros the numerator of f', f('x+4')(-4), 0);
  check('203 but f\'(-4) is not zero', Math.abs(dAt(fx, -4)) > 1e-6 ? 1 : 0, 1);
}

// rq-sub-der-204 — (x^2+b)/(x-2) with an extremum at x = 5 → b = 5, second extremum at x = -1
{
  const dfx = math.derivative('(x^2+b)/(x-2)', 'x');
  const fpAt = (x: number, b: number) => dfx.evaluate({ x, b }) as number;
  const authored = math.parse('(x^2-4*x-b)/(x-2)^2');
  for (const b of [-3, 0, 5]) {
    for (const v of [-2.3, -1, 0.7, 4, 5]) {
      check(`204 authored f' = (x^2-4x-b)/(x-2)^2 at b=${b}, x=${v}`,
        fpAt(v, b), authored.evaluate({ x: v, b }) as number);
    }
  }
  const bs = rootsF((b) => fpAt(5, b), -20, 20);
  checkSet('204 the condition f\'(5) = 0 solves to b = 5', bs, [5]);
  const b = bs[0];
  check('204 recovered parameter equals 5', b, 5);
  check('204 f\'(5) = 0 with the recovered parameter', fpAt(5, b), 0);
  const cand = rootsF((x) => fpAt(x, b), -20, 20).filter(r => Math.abs(r - 2) > 1e-6);
  checkSet('204 f\' vanishes at 5 and at -1', cand, [5, -1]);
  check('204 f\'(-1) = 0 (computed)', fpAt(-1, b), 0);
  check('204 x = -1 is inside the domain', Math.abs(f('x-2')(-1)) > 1e-9 ? 1 : 0, 1);
  check('204 sign of f\' flips + → - at -1 (maximum)', sgn(fpAt(-1.1, b)) * 10 + sgn(fpAt(-0.9, b)), 9);
  check('204 sign of f\' flips - → + at 5 (minimum)', sgn(fpAt(4.9, b)) * 10 + sgn(fpAt(5.1, b)), -9);
  check('204 wrong answer 1: f\' does not vanish at x = 1', Math.abs(fpAt(1, b)) > 1e-9 ? 1 : 0, 1);
  check('204 wrong answer b = 25: then f\'(5) is not zero', Math.abs(fpAt(5, 25)) > 1e-9 ? 1 : 0, 1);
  check('204 wrong answer b = 2: then f\'(5) is not zero', Math.abs(fpAt(5, 2)) > 1e-9 ? 1 : 0, 1);
}

// rq-sub-der-205 — slopes of sqrt(x^2-6x+13) at x = 1 and x = 5: equal size, opposite sign
{
  const fx = 'sqrt(x^2-6*x+13)';
  const S = [-2.3, -1, 0.7, 1, 3, 5, 8];
  dcheck('205 root-rule form before cancelling', fx, '(2*x-6)/(2*sqrt(x^2-6*x+13))', S);
  dcheck('205 simplified f\' = (x-3)/sqrt(x^2-6x+13)', fx, '(x-3)/sqrt(x^2-6*x+13)', S);
  check('205 the radicand never drops below 4 (so the domain is every x)',
    Math.min(...[-5, 0, 1, 3, 5, 10, 40].map(v => f('x^2-6*x+13')(v))), 4);
  check('205 f\'(1) = -2/sqrt(8)', dAt(fx, 1), E('-2/sqrt(8)'));
  check('205 f\'(5) = 2/sqrt(8)', dAt(fx, 5), E('2/sqrt(8)'));
  check('205 the two slopes have the same size', Math.abs(dAt(fx, 1)), Math.abs(dAt(fx, 5)));
  check('205 the slope at 5 is the larger NUMBER', dAt(fx, 5) > dAt(fx, 1) ? 1 : 0, 1);
  check('205 the two heights are equal too (symmetry about 3)', f(fx)(1), f(fx)(5));
  checkSet('205 f\' vanishes only at x = 3', roots('(x-3)/sqrt(x^2-6*x+13)'), [3]);
  check('205 x = 3 is a minimum: sign - → +', sgn(dAt(fx, 2.9)) * 10 + sgn(dAt(fx, 3.1)), -9);
  check('205 f(3) = 2 is the smallest value on the samples',
    Math.min(...[-5, 0, 1, 3, 5, 10].map(v => f(fx)(v))), 2);
}

// rq-sub-der-206 — sqrt(x)/(x+1): domain x >= 0, maximum (1, 0.5), tends to 0
{
  const fx = 'sqrt(x)/(x+1)';
  const S = [0.05, 0.3, 0.7, 1, 2.5, 6];
  dcheck('206 quotient-rule form before clearing the double fraction', fx,
    '((1/(2*sqrt(x)))*(x+1)-sqrt(x))/(x+1)^2', S);
  dcheck('206 cleared f\' = (1-x)/(2 sqrt(x) (x+1)^2)', fx, '(1-x)/(2*sqrt(x)*(x+1)^2)', S);
  check('206 f is not a real number just below 0', Number.isFinite(f(fx)(-0.05)) ? 1 : 0, 0);
  check('206 the denominator x+1 never vanishes on the domain',
    Math.min(...[0, 0.5, 1, 5, 50].map(v => f('x+1')(v))), 1);
  checkSet('206 f\' vanishes only at x = 1', roots('(1-x)/(2*sqrt(x)*(x+1)^2)', 0.001, 40), [1]);
  check('206 f\'(1) = 0 (computed from f)', dAt(fx, 1), 0);
  check('206 sign of f\' flips + → - at 1 (maximum)', sgn(dAt(fx, 0.9)) * 10 + sgn(dAt(fx, 1.1)), 9);
  check('206 the marked figure point (1, 0.5) is on the graph', f(fx)(1), 0.5);
  check('206 the marked figure point (0, 0) is on the graph', f(fx)(0), 0);
  check('206 f rises on the samples before the maximum',
    [0.05, 0.2, 0.5, 0.9, 1].every((v, i, a) => i === 0 || f(fx)(v) > f(fx)(a[i - 1])) ? 1 : 0, 1);
  check('206 f falls on the samples after the maximum',
    [1, 2, 5, 20, 100].every((v, i, a) => i === 0 || f(fx)(v) < f(fx)(a[i - 1])) ? 1 : 0, 1);
  check('206 f tends to 0 far out', Math.abs(f(fx)(1e6)) < 1e-2 ? 1 : 0, 1);
  check('206 the maximum value beats every sample',
    Math.max(...[0, 0.2, 0.5, 2, 5, 30].map(v => f(fx)(v))) <= f(fx)(1) ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// The exam-style round (Itay, 2026-09-06). 104 / 110 / 111 / 203 / 205 were
// re-asked in the bagrut's own phrasing — monotonic intervals, the extremum and
// its type, the domain, "נמקו" — so each object the NEW wording names is
// re-derived from mathjs's own derivative of the question's function.
// ---------------------------------------------------------------------------

// rq-sub-der-104 — now asks for the rising/falling intervals and the extremum count
{
  const fp = '3*x^2+5';
  const F = 'x^3+5*x';
  check('104 f\' stays positive on every sample, so there is no falling interval',
    Math.min(...[-40, -3, 0, 3, 40].map(v => f(fp)(v))) > 0 ? 1 : 0, 1);
  check('104 the extremum count is the number of zeros of f\'', roots(fp, -100, 100).length, 0);
  check('104 f rises across 0 as well, so 0 is not a turning point', f(F)(0.1) > f(F)(-0.1) ? 1 : 0, 1);
}

// rq-sub-der-110 — now asks for the intervals, the extremum values and their type
{
  const fp = 'x*(x-3)^2';
  const F = 'x^4/4-2*x^3+9*x^2/2';
  check('110 f falls on every sample below 0', Math.max(...[-6, -2, -0.5].map(v => f(fp)(v))) < 0 ? 1 : 0, 1);
  check('110 f rises on every sample above 0, including on both sides of 3',
    Math.min(...[0.2, 1, 2.9, 3.1, 6].map(v => f(fp)(v))) > 0 ? 1 : 0, 1);
  check('110 exactly one of the two candidates changes the sign',
    [0, 3].filter(c => sgn(f(fp)(c - 0.1)) !== sgn(f(fp)(c + 0.1))).length, 1);
  check('110 and it is a minimum: f(0) sits below both neighbours',
    f(F)(0) < Math.min(f(F)(-0.5), f(F)(0.5)) ? 1 : 0, 1);
}

// rq-sub-der-111 — now asks for the domain as well as the count
{
  const fx = '(x+3)*sqrt(x-1)';
  check('111 f is not a real number below 1', Number.isFinite(f(fx)(0.5)) ? 1 : 0, 0);
  check('111 f is defined at the edge x = 1', f(fx)(1), 0);
  check('111 no sample inside the domain has slope 0',
    [1.001, 1.5, 3, 8, 50].every(v => Math.abs(dAt(fx, v)) > 1e-6) ? 1 : 0, 1);
}

// rq-sub-der-203 — "נמקו את תשובתכם": the reason is a constant numerator
{
  const fx = '(x+4)/(x-1)';
  dcheck('203 f\' = -5/(x-1)^2', fx, '-5/(x-1)^2', [-3, -1, 0, 2, 4, 9]);
  checkSet('203 f\' has no zero to the left of the pole', roots('-5/(x-1)^2', -50, 0.9), []);
  check('203 f\' is negative on every sample', Math.max(...[-3, 0, 2, 9].map(v => dAt(fx, v))) < 0 ? 1 : 0, 1);
}

// rq-sub-der-205 — the ask now recovers the extremum BEFORE comparing the slopes
{
  const fx = 'sqrt(x^2-6*x+13)';
  check('205 completing the square: (x-3)^2+4 equals the radicand',
    Math.max(...[-4, 0, 1, 3, 5, 9].map(v => Math.abs(f('x^2-6*x+13')(v) - f('(x-3)^2+4')(v)))), 0);
  check('205 the extremum sits at (3, 2)', f(fx)(3), 2);
  check('205 the sign-table row x-3 reads -, 0, +',
    sgn(f('x-3')(1)) * 100 + f('x-3')(3) + sgn(f('x-3')(5)), -99);
  check('205 the slope row copies it, because the denominator is positive',
    [1, 5, -4, 9].every(v => sgn(dAt(fx, v)) === sgn(f('x-3')(v))) ? 1 : 0, 1);
}

summary('derivative');
