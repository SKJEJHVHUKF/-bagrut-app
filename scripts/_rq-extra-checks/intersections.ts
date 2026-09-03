// Numeric re-derivation of content/lessons/math5/rq-extra/intersections.ts (rq-sub-int-101…112).
// An intercept claim is encoded as computation: x-intercepts are the real roots of the numerator
// (or radicand) that the question's own function is DEFINED at (mathjs gives Complex for a
// negative radicand, Infinity for a zero denominator); a y-intercept is f(0) when f is defined
// there. Every distractor / wrongAnswer note is re-enacted as the mistake it names.
import { check, checkSet, summary, math, E } from './_lib';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number, name = 'x') => c.evaluate({ [name]: v }) as unknown;
};
const num = (expr: string) => (v: number, name = 'x') => f(expr)(v, name) as number;
/** 1 when f(x) is a finite real number, 0 otherwise */
const defined = (expr: string, x: number) => {
  const r = f(expr)(x);
  return typeof r === 'number' && Number.isFinite(r) ? 1 : 0;
};
/** real roots of expr in [lo, hi] via sign changes on a grid + bisection (simple roots only) */
function roots(expr: string, lo = -20, hi = 20, name = 'x'): number[] {
  const g = num(expr);
  const out: number[] = [];
  const push = (r: number) => { if (!out.some(o => Math.abs(o - r) < 1e-6)) out.push(r); };
  const n = 8000;
  const h = (hi - lo) / n;
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = a + h;
    let fa = g(a, name), fb = g(b, name);
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
/** x-intercepts = roots of `zero` at which the full function is defined */
// (roots are bisection approximations; round to 1e-6 so a radicand endpoint is tested AT the endpoint)
const xInts = (fx: string, zero: string, lo = -20, hi = 20) =>
  roots(zero, lo, hi).map(r => Math.round(r * 1e6) / 1e6).filter(r => defined(fx, r));
const GRID = [-7, -5, -2.5, -1, 0.5, 1.5, 2.5, 4, 6, 9];

// rq-sub-int-101 — (x-7)/x: 0 is outside the domain → no y-intercept
{
  const fx = '(x-7)/x';
  check('101 f undefined at 0', defined(fx, 0), 0);
  checkSet('101 denominator vanishes exactly at 0', roots('x'), [0]);
  check('101 distractor B = numerator alone at 0', num('x-7')(0), -7);
  checkSet('101 distractor C = the x-intercept (7,0)', xInts(fx, 'x-7'), [7]);
  check('101 note: f(7) = 0', num(fx)(7), 0);
}

// rq-sub-int-102 — (x^2+4)/(x-1): numerator never vanishes → no x-intercept
{
  const P = 'x^2+4', fx = `(${P})/(x-1)`;
  checkSet('102 numerator has no real root', roots(P, -100, 100), []);
  check('102 numerator minimum over grid is 4', Math.min(...GRID.concat(0).map(v => num(P)(v))), 4);
  checkSet('102 distractor B = x^2 = 4 (sign lost)', roots('x^2-4'), [2, -2]);
  check('102 note: P(2) = 8', num(P)(2), 8);
  checkSet('102 distractor C = denominator zeroed', roots('x-1'), [1]);
  check('102 f undefined at 1', defined(fx, 1), 0);
  check('102 distractor D = f(0) = -4', num(fx)(0), -4);
}

// rq-sub-int-103 — (2x+5)/(x-3) meets the x-axis at (k,0): k = -5/2
{
  const fx = '(2*x+5)/(x-3)';
  const k = xInts(fx, '2*x+5');
  checkSet('103 k = -5/2', k, [E('-5/2')]);
  check('103 f(k) = 0', num(fx)(k[0]), 0);
  check('103 denominator at k = -11/2', num('x-3')(k[0]), E('-11/2'));
  checkSet('103 wrong 5/2 = sign lost (2x = 5)', roots('2*x-5'), [E('5/2')]);
  checkSet('103 wrong 3 = denominator zeroed', roots('x-3'), [3]);
  check('103 wrong -5/3 = f(0)', num(fx)(0), E('-5/3'));
}

// rq-sub-int-104 — (x-1)(x+6)/(x^2+2): two x-intercepts, denominator always positive
{
  const P = '(x-1)*(x+6)', Q = 'x^2+2', fx = `(${P})/(${Q})`;
  const xs = xInts(fx, P);
  check('104 count = 2', xs.length, 2);
  checkSet('104 the points are x = 1 and x = -6', xs, [1, -6]);
  checkSet('104 denominator has no real root', roots(Q, -100, 100), []);
  check('104 denominator minimum over grid is 2', Math.min(...GRID.concat(0).map(v => num(Q)(v))), 2);
  check('104 wrong 3 = count + a y-intercept that exists: f(0) = -3', num(fx)(0), -3);
}

// rq-sub-int-105 — (x-a)/(x+4) with f(0) = 2 → a = -8
{
  const fx = (a: number) => num(`(x-${a})/(x+4)`);
  const a = roots('(0-a)/(0+4) - 2', -20, 20, 'a');
  checkSet('105 a = -8', a, [-8]);
  check('105 check f(0) = 2 with a = -8', fx(a[0])(0), 2);
  check('105 wrong 8: f(0) = -2', fx(8)(0), -2);
  checkSet('105 wrong -2 = denominator not multiplied (-a = 2)', roots('-a-2', -20, 20, 'a'), [-2]);
  check('105 wrong 2 = the height taken as the parameter: f(0) = -1/2', fx(2)(0), E('-1/2'));
}

// rq-sub-int-106 — (2x+8)/(x-4): the student found the x-intercept; y-intercept is (0,-2)
{
  const fx = '(2*x+8)/(x-4)';
  check('106 f defined at 0', defined(fx, 0), 1);
  check('106 f(0) = 8/(-4) = -2', num(fx)(0), -2);
  checkSet('106 student\'s x = -4 is the x-intercept', xInts(fx, '2*x+8'), [-4]);
  check('106 note: f(-4) = 0', num(fx)(-4), 0);
  checkSet('106 distractor D = denominator zeroed', roots('x-4'), [4]);
  check('106 f undefined at 4', defined(fx, 4), 0);
}

// rq-sub-int-107 — sqrt(x^2-6x+5): x-intercepts at both endpoints of a split domain
{
  const g = 'x^2-6*x+5', fx = `sqrt(${g})`;
  checkSet('107 x = 1 or x = 5', xInts(fx, g), [1, 5]);
  check('107 f(1) = f(5) = 0', num(fx)(1) + num(fx)(5), 0);
  check('107 domain: defined just outside (1,5), undefined just inside (pattern 1001)', parseInt([0.999, 1.001, 4.999, 5.001].map(v => defined(fx, v)).join(''), 2), 0b1001);
  check('107 note: g(-1) = 12', num(g)(-1), 12);
  check('107 wrong sqrt(5) = f(0)', num(fx)(0), E('sqrt(5)'));
}

// rq-sub-int-108 — 5/sqrt(x-3): domain x>3 excludes 0, constant numerator never vanishes
{
  const fx = '5/sqrt(x-3)';
  check('108 f undefined at 0', defined(fx, 0), 0);
  check('108 f undefined at 3 (root in the denominator)', defined(fx, 3), 0);
  check('108 f defined just right of 3', defined(fx, 3.001), 1);
  check('108 f never zero: min over 3 < x ≤ 30 is positive', Math.min(...[3.01, 4, 5, 10, 30].map(v => num(fx)(v))) > 0 ? 1 : 0, 1);
  check('108 distractor C = root ignored: 5/(0-3)', E('5/(0-3)'), E('-5/3'));
  check('108 note: f(5) = 5/sqrt(2)', num(fx)(5), E('5/sqrt(2)'));
}

// rq-sub-int-109 — sqrt(x+12)/(x+2): y-intercept (0, sqrt(3))
{
  const fx = 'sqrt(x+12)/(x+2)';
  check('109 f defined at 0', defined(fx, 0), 1);
  check('109 f(0) = sqrt(3)', num(fx)(0), E('sqrt(3)'));
  check('109 sqrt(12)/2 simplifies to sqrt(3)', E('sqrt(12)/2'), E('sqrt(3)'));
  check('109 distractor B = division forgotten: sqrt(12) = 2sqrt(3)', E('sqrt(12)'), E('2*sqrt(3)'));
  check('109 distractor C = root dropped: 12/2', E('12/2'), 6);
  check('109 domain edge: undefined at -12.001, defined at -12', defined(fx, -12.001) + defined(fx, -12), 1);
}

// rq-sub-int-110 — (x^2-36)/sqrt(x-6): every candidate rejected → 0 intercepts
{
  const fx = '(x^2-36)/sqrt(x-6)';
  check('110 no y-intercept: f undefined at 0', defined(fx, 0), 0);
  checkSet('110 numerator zeros are 6 and -6', roots('x^2-36'), [6, -6]);
  check('110 both rejected: f undefined at 6 and at -6', defined(fx, 6) + defined(fx, -6), 0);
  check('110 surviving x-intercepts = 0', xInts(fx, 'x^2-36').length, 0);
  check('110 the domain is not empty: defined at 7', defined(fx, 7), 1);
  check('110 domain edge: defined just right of 6', defined(fx, 6.001), 1);
}

// rq-sub-int-111 — (x+a)/(x+b) through (3,0) and (0,-1): a = -3, b = 3
{
  const fx = (a: number, b: number) => num(`(x+${a})/(x+${b})`);
  const a = roots('3+a', -20, 20, 'a')[0];
  const b = -a; // from a/b = -1 ⇒ b = -a
  check('111 a = -3', a, -3);
  check('111 b = 3', b, 3);
  check('111 f(3) = 0', fx(a, b)(3), 0);
  check('111 f(0) = -1', fx(a, b)(0), -1);
  check('111 domain: f undefined at -3, defined at 0 and 3', defined(`(x+${a})/(x+${b})`, -3) + defined(`(x+${a})/(x+${b})`, 0) + defined(`(x+${a})/(x+${b})`, 3), 2);
  check('111 wrong (3,3): numerator at 3 is 6', num('x+3')(3), 6);
  check('111 wrong (-3,-3): f(0) = 1', fx(-3, -3)(0), 1);
  check('111 wrong (3,-3): f(0) = -1 still holds', fx(3, -3)(0), -1);
  checkSet('111 wrong (3,-3): but the x-intercept moves to -3', xInts('(x+3)/(x-3)', 'x+3'), [-3]);
}

// rq-sub-int-112 — (x-2)/(x^2-4): x = 2 is a hole, y-intercept (0, 1/2)
{
  const fx = '(x-2)/(x^2-4)';
  checkSet('112 numerator zero is 2', roots('x-2'), [2]);
  checkSet('112 denominator zeros are 2 and -2', roots('x^2-4'), [2, -2]);
  check('112 f undefined at 2 (hole)', defined(fx, 2), 0);
  check('112 surviving x-intercepts = 0', xInts(fx, 'x-2').length, 0);
  check('112 f(0) = 1/2', num(fx)(0), E('1/2'));
  check('112 -2/-4 is positive', E('(-2)/(-4)'), E('1/2'));
  check('112 f never zero on the domain: min |f| over grid > 0', Math.min(...GRID.map(v => Math.abs(num(fx)(v)))) > 0 ? 1 : 0, 1);
}

summary('intersections');
