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

summary('derivative');
