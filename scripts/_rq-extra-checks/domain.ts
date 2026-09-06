// Numeric re-derivation of content/lessons/math5/rq-extra/domain.ts (rq-sub-dom-101…117).
// A domain claim is encoded as membership: `defined(expr, x)` evaluates the question's own
// function with mathjs and asks whether the result is a finite real number (sqrt of a negative
// comes back Complex, division by zero comes back Infinity). Endpoints are found as roots of the
// radicand / denominator, and every distractor / wrongAnswer note is re-enacted as the mistake
// it names.
import { check, checkSet, dcheck, summary, math, E } from './_lib';

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
/** membership pattern of expr at the sample points, as a 0/1 string */
const pattern = (expr: string, xs: number[]) => xs.map(x => defined(expr, x)).join('');
/** roots() finds a sign change at a POLE too; keep only the ones where expr is really 0 */
const trueRoots = (expr: string, lo = -50, hi = 50) =>
  roots(expr, lo, hi).filter(r => Math.abs(num(expr)(r)) < 1e-6);
const EPS = 1e-3;

// rq-sub-dom-101 — (x-3)/(x^2+4): denominator never zero → defined for every x
{
  const den = 'x^2+4', fx = `(x-3)/(${den})`;
  checkSet('101 denominator has no real root', roots(den, -100, 100), []);
  check('101 min of denominator over a grid is 4', Math.min(...[-5, -2, 0, 2, 5].map(v => num(den)(v))), 4);
  check('101 defined at -4, 0, 2, 3', [-4, 0, 2, 3].reduce((s, v) => s + defined(fx, v), 0), 4);
  checkSet('101 distractor B = sqrt of 4 ignoring the sign', roots('x^2-4'), [2, -2]);
  check('101 note: den(2) = 8', num(den)(2), 8);
  checkSet('101 distractor C = 4 moved, square forgotten', roots('x+4'), [-4]);
  check('101 note: den(-4) = 20', num(den)(-4), 20);
  checkSet('101 distractor D = numerator root', roots('x-3'), [3]);
  check('101 note: f(3) = 0/13', num(fx)(3) * 13 + num(den)(3), 13);
}

// rq-sub-dom-102 — sqrt(15-5x): largest x in the domain is the endpoint 3
{
  const g = '15-5*x', fx = `sqrt(${g})`;
  const ends = roots(g);
  checkSet('102 radicand root', ends, [3]);
  check('102 endpoint included, just beyond it undefined', defined(fx, 3) + defined(fx, 3 - EPS) - defined(fx, 3 + EPS), 2);
  check('102 nothing larger: undefined at 3.5, 10', defined(fx, 3.5) + defined(fx, 10), 0);
  check('102 coefficient of x is negative (inequality flips)', Math.sign(num(g)(1) - num(g)(0)), -1);
  checkSet('102 wrong -3 = -5x >= 15 solved', roots('-5*x-15'), [-3]);
  check('102 note: g(-3) = 30', num(g)(-3), 30);
  check('102 wrong 15 = 5x <= 15 left undivided; g(15) = -60', num(g)(15), -60);
}

// rq-sub-dom-103 — (x-1)/(3x+12): the single excluded value is -4
{
  const den = '3*x+12', fx = `(x-1)/(${den})`;
  checkSet('103 denominator root', roots(den), [-4]);
  check('103 undefined only there', defined(fx, -4) + (1 - defined(fx, -12)) + (1 - defined(fx, 4)) + (1 - defined(fx, 1)), 0);
  check('103 wrong -12 = stopped at 3x = -12; den(-12) = -24', num(den)(-12), -24);
  check('103 wrong 4 = sign lost; den(4) = 24', num(den)(4), 24);
  check('103 wrong 1 = numerator zeroed; f(1) = 0, den(1) = 15', num(fx)(1) + num(den)(1), 15);
}

// rq-sub-dom-104 — which function has domain exactly x >= 3
{
  const opts = ['sqrt(x-3)', 'sqrt(3-x)', '1/sqrt(x-3)', 'sqrt(x+3)'];
  const xs = [-3, 0, 3 - EPS, 3, 3 + EPS, 10];
  const want = '000111'; // exactly x >= 3
  const fits: number[] = opts.map(o => (pattern(o, xs) === want ? 1 : 0));
  check('104 exactly one option fits', fits.reduce((a, b) => a + b, 0), 1);
  check('104 the fitting option is index 0', fits[0], 1);
  check('104 B is x <= 3 (mirror)', pattern(opts[1], xs) === '111100' ? 1 : 0, 1);
  check('104 note: B at x=4 is sqrt(-1), undefined', defined(opts[1], 4), 0);
  check('104 C excludes the endpoint (x > 3)', pattern(opts[2], xs) === '000011' ? 1 : 0, 1);
  check('104 D starts at -3', pattern(opts[3], xs) === '111111' ? 1 : 0, 1);
  check('104 note: D at x=0 is sqrt(3)', num(opts[3])(0), Math.sqrt(3));
}

// rq-sub-dom-105 — (x-2)/(x^2-6x): x != 0 and x != 6
{
  const den = 'x^2-6*x', fx = `(x-2)/(${den})`;
  checkSet('105 denominator roots', roots(den), [0, 6]);
  check('105 factoring x(x-6) matches', num(den)(7) - E('7*(7-6)'), 0);
  check('105 undefined at 0 and 6, defined at 2', defined(fx, 0) + defined(fx, 6) + defined(fx, 2), 1);
  checkSet('105 distractor B = divided by x, lost x=0', roots('x-6'), [6]);
  check('105 distractor C: den(-6) = 72', num(den)(-6), 72);
  check('105 distractor D: f(2) = 0/(-8)', num(fx)(2) + num(den)(2), -8);
}

// rq-sub-dom-106 — sqrt(x^2-6x+5): x <= 1 or x >= 5
{
  const g = 'x^2-6*x+5', fx = `sqrt(${g})`;
  checkSet('106 radicand roots', roots(g), [1, 5]);
  check('106 factoring (x-1)(x-5) matches', num(g)(8) - E('(8-1)*(8-5)'), 0);
  check('106 opens upward (positive x^2 coefficient)', Math.sign(num(g)(100)), 1);
  check('106 membership: outside incl. endpoints', pattern(fx, [0, 1, 1 + EPS, 3, 5 - EPS, 5, 6]) === '1100011' ? 1 : 0, 1);
  check('106 distractor B: g(3) = -4', num(g)(3), -4);
  check('106 distractor C: g(0) = 5, left branch is valid', num(g)(0), 5);
  checkSet('106 distractor D = roots with flipped signs', roots('x^2+6*x+5'), [-1, -5]);
  check('106 distractor D contains x=2: g(2) = -3', num(g)(2), -3);
}

// rq-sub-dom-107 — sqrt(x+1)/sqrt(5-x): -1 <= x < 5
{
  const fx = 'sqrt(x+1)/sqrt(5-x)';
  checkSet('107 numerator radicand root', roots('x+1'), [-1]);
  checkSet('107 denominator radicand root', roots('5-x'), [5]);
  check('107 closed at -1, open at 5', pattern(fx, [-1 - EPS, -1, 0, 5 - EPS, 5, 5 + EPS]) === '011100' ? 1 : 0, 1);
}

// rq-sub-dom-108 — sqrt(x^2-a) with domain x <= -3 or x >= 3 → a = 9
{
  const as = roots('3^2-a', -50, 50, 'a');
  checkSet('108 a from the endpoint 3', as, [9]);
  const a = as[0];
  checkSet('108 radicand roots with that a are ±3', roots(`x^2-${a}`), [3, -3]);
  check('108 domain with a=9 is outside incl. endpoints', pattern(`sqrt(x^2-${a})`, [-4, -3, -3 + EPS, 0, 3 - EPS, 3, 4]) === '1100011' ? 1 : 0, 1);
  checkSet('108 wrong 3: domain would start at sqrt(3)', roots('x^2-3'), [Math.sqrt(3), -Math.sqrt(3)]);
  checkSet('108 wrong -9: x^2+9 has no root, no endpoint', roots('x^2+9', -100, 100), []);
  check('108 wrong -9: defined everywhere', [-5, 0, 5].reduce((s, v) => s + defined('sqrt(x^2+9)', v), 0), 3);
}

// rq-sub-dom-109 — (x+3)/(x^2+a) is defined for every x exactly when a > 0
{
  const fx = (a: number) => `(x+3)/(x^2+(${a}))`;
  const grid = [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3];
  const everywhere = (a: number) => (grid.every(v => defined(fx(a), v)) ? 1 : 0);
  check('109 a=4 defined everywhere', everywhere(4), 1);
  check('109 a=1/4 defined everywhere', everywhere(0.25), 1);
  checkSet('109 a=4 denominator has no real root', roots('x^2+4', -100, 100), []);
  check('109 note: den(x)=x^2+4 is at least 4', Math.min(...grid.map(v => num('x^2+4')(v))), 4);
  check('109 distractor B (a >= 0): a=0 breaks at x=0', defined(fx(0), 0), 0);
  checkSet('109 distractor C/D (a=-4): denominator roots ±2', roots('x^2-4'), [2, -2]);
  check('109 a=-4 undefined at x=2, numerator 5', defined(fx(-4), 2) + num('x+3')(2), 5);
  check('109 every negative a on the grid breaks somewhere', [-9, -4, -1, -0.25].reduce((s, a) => s + everywhere(a), 0), 0);
}

// rq-sub-dom-110 — sqrt(-x^2+2x+8): integers in the domain → 7
{
  const g = '-x^2+2*x+8', fx = `sqrt(${g})`;
  checkSet('110 radicand roots', roots(g), [-2, 4]);
  check('110 factoring (x-4)(x+2) of the negated trinomial', -num(g)(9) - E('(9-4)*(9+2)'), 0);
  check('110 opens downward (negative x^2 coefficient)', Math.sign(num(g)(100)), -1);
  check('110 domain is [-2, 4] incl. endpoints', pattern(fx, [-2 - EPS, -2, 0, 4, 4 + EPS]) === '01110' ? 1 : 0, 1);
  let count = 0;
  for (let k = -20; k <= 20; k++) count += defined(fx, k);
  check('110 integer count', count, 7);
  let inner = 0;
  for (let k = -20; k <= 20; k++) inner += defined(fx, k) && num(g)(k) > 0 ? 1 : 0;
  check('110 wrong 5 = endpoints not counted', inner, 5);
  check('110 wrong 6 = length of the interval', 4 - -2, 6);
  // the drawn figure: every marked point re-derived from the parabola itself
  check('110 figure: the curve meets the axis at x = -2', num(g)(-2), 0);
  check('110 figure: the curve meets the axis at x = 4', num(g)(4), 0);
  check('110 figure: the marked vertex (1, 9) is on the curve', num(g)(1), 9);
  check('110 figure: the vertex is the maximum of the sampled window',
    Math.max(...[-4, -2, 0, 1, 2, 4, 6].map(v => num(g)(v))), 9);
}

// rq-sub-dom-111 — the domains of sqrt(x+4)/(sqrt(x)-2) and sqrt(x+4)/sqrt(x-2)
// are INCOMPARABLE: each holds a value the other rejects.
{
  const fDen = 'sqrt(x)-2', hDen = 'sqrt(x-2)';
  const fx = `sqrt(x+4)/(${fDen})`, hx = `sqrt(x+4)/(${hDen})`;
  checkSet('111 f denominator root (after squaring)', roots(fDen, 0, 20), [4]);
  checkSet('111 h denominator radicand root', roots('x-2', 0, 20), [2]);
  check('111 f domain: x >= 0 and x != 4', pattern(fx, [-1, -EPS, 0, 2, 4 - EPS, 4, 4 + EPS, 100]) === '00111011' ? 1 : 0, 1);
  check('111 h domain: x > 2 only', pattern(hx, [-1, 0, 2 - EPS, 2, 2 + EPS, 4, 100]) === '0000111' ? 1 : 0, 1);
  // the two witnesses that make neither domain a subset of the other
  check('111 x = 0 belongs to f only', defined(fx, 0) - defined(hx, 0), 1);
  check('111 x = 4 belongs to h only', defined(hx, 4) - defined(fx, 4), 1);
  check('111 note: f denominator at 0 is -2', num(fDen)(0), -2);
  check('111 note: f denominator at 4 is 0', num(fDen)(4), 0);
  check('111 note: h denominator at 4 is sqrt(2)', num(hDen)(4), Math.SQRT2);
  check('111 note: h radicand at 0 is -2', num('x-2')(0), -2);
  check('111 the domains are not equal', pattern(fx, [0, 4]) === pattern(hx, [0, 4]) ? 1 : 0, 0);
}

// rq-sub-dom-112 — student's domain "x <= 6" for (x+1)/sqrt(36-x^2): two mistakes
{
  const g = '36-x^2', fx = `(x+1)/sqrt(${g})`;
  check('112 true domain is -6 < x < 6', pattern(fx, [-6 - EPS, -6, -6 + EPS, 0, 6 - EPS, 6, 6 + EPS]) === '0011100' ? 1 : 0, 1);
  // the student's line 2 (x^2 <= 36) is equivalent to line 1 (36 - x^2 >= 0): no mistake there
  let mismatches = 0;
  for (let x = -10; x <= 10; x += 0.25) mismatches += (num(g)(x) >= 0) === (x * x <= 36) ? 0 : 1;
  check('112 line 2 follows from line 1', mismatches, 0);
  // mistake 1: weak sign keeps x=6 (denominator zero); mistake 2: "x <= 6" keeps x=-10
  const studentSays = (x: number) => (x <= 6 ? 1 : 0);
  const m1 = studentSays(6) - defined(fx, 6); // 1 when the student admits an undefined point
  const m2 = studentSays(-10) - defined(fx, -10);
  check('112 x=6 admitted by the student but undefined', m1, 1);
  check('112 x=-10 admitted by the student but undefined', m2, 1);
  check('112 mistakes counted', m1 + m2, 2);
  check('112 note: g(-10) = -64', num(g)(-10), -64);
  check('112 note: den(6) = sqrt(0) = 0', num(`sqrt(${g})`)(6), 0);
  // the sign table the corrected solution draws, row by row
  check('112 table: the factorisation agrees with 36 - x^2', num('(6-x)*(6+x)')(2.5) - num(g)(2.5), 0);
  check('112 table row x < -6: the product is negative', Math.sign(num('(6-x)*(6+x)')(-7)), -1);
  check('112 table row -6 < x < 6: the product is positive', Math.sign(num('(6-x)*(6+x)')(0)), 1);
  check('112 table row x > 6: the product is negative', Math.sign(num('(6-x)*(6+x)')(7)), -1);
  checkSet('112 the two column edges are the roots', roots('(6-x)*(6+x)'), [6, -6]);
}

// rq-sub-dom-113 — sqrt((x-1)/(x+3)): x < -3 or x >= 1
{
  const q = '(x-1)/(x+3)', fx = `sqrt(${q})`;
  checkSet('113 numerator root', roots('x-1'), [1]);
  checkSet('113 denominator root', roots('x+3'), [-3]);
  check('113 membership: left branch open at -3, right branch closed at 1',
    pattern(fx, [-5, -3 - EPS, -3, -3 + EPS, 0, 1 - EPS, 1, 2]) === '11000011' ? 1 : 0, 1);
  check('113 sign table row x < -3: the quotient is positive', Math.sign(num(q)(-5)), 1);
  check('113 sign table row -3 < x < 1: the quotient is negative', Math.sign(num(q)(0)), -1);
  check('113 sign table row x > 1: the quotient is positive', Math.sign(num(q)(2)), 1);
  check('113 the endpoint 1 is included because the quotient is 0 there', num(q)(1), 0);
  check('113 the endpoint -3 is excluded: the quotient is undefined there', defined(q, -3), 0);
}

// rq-sub-dom-114 — g = 1/(f - k) with f = (x+1)/(x-4): k=2 removes x=9, k=1 removes nothing
{
  const f = '(x+1)/(x-4)';
  const g = (k: number) => `1/((${f})-(${k}))`;
  checkSet('114 the inner function is undefined at the root of x - 4', roots('x-4'), [4]);
  check('114 the inner function is undefined at x = 4', defined(f, 4), 0);
  checkSet('114 k=2: f(x) = 2 holds only at x = 9', trueRoots(`(${f})-2`), [9]);
  checkSet('114 k=1: f(x) = 1 holds nowhere', trueRoots(`(${f})-1`, -500, 500), []);
  check('114 k=2: the new denominator vanishes at 9', defined(g(2), 9), 0);
  check('114 k=1: f(x) - 1 stays away from zero across a wide grid',
    Math.min(...[-300, -20, -1, 0, 3, 5, 20, 300].map(x => Math.abs(num(`(${f})-1`)(x)))) > 1e-3 ? 1 : 0, 1);
  check('114 note: f(9) = 2', num(f)(9), 2);
  check('114 note: f(1) = -2/3, so x = 1 is not excluded when k = 1', num(f)(1), -2 / 3);
  check('114 note: f(0) = -0.25', num(f)(0), -0.25);
  check('114 note: g(0) = -0.8 when k = 1', num(g(1))(0), -0.8);
  check('114 f tends to 1 far out, which is why f(x) = 1 has no solution', num(f)(1e7), 1, 1e-6);
}

// rq-sub-dom-115 — sqrt(x+c)/sqrt(d-x) with domain -4 <= x < 7 → c = 4, d = 7
{
  // each parameter is recovered from ITS OWN endpoint: the closed one zeroes the
  // numerator radicand, the open one zeroes the denominator radicand.
  const cs = roots('(-4)+c', -50, 50, 'c');
  const ds = roots('d-7', -50, 50, 'd');
  checkSet('115 c from the closed left endpoint', cs, [4]);
  checkSet('115 d from the open right endpoint', ds, [7]);
  const fx = `sqrt(x+${cs[0]})/sqrt(${ds[0]}-x)`;
  check('115 the recovered function has exactly the stated domain',
    pattern(fx, [-5, -4 - EPS, -4, 0, 7 - EPS, 7, 8]) === '0011100' ? 1 : 0, 1);
  check('115 the left endpoint is included: f(-4) = 0', num(fx)(-4), 0);
  check('115 the right endpoint is excluded: the denominator is sqrt(0)', num('sqrt(7-x)')(7), 0);
  check('115 wrong c = -4 would start the domain at 4',
    pattern('sqrt(x-4)/sqrt(7-x)', [-4, 0, 3.9, 4, 5]) === '00011' ? 1 : 0, 1);
  check('115 wrong d = -7 leaves the function defined nowhere',
    [-10, -5, 0, 6].reduce((s, v) => s + defined('sqrt(x+4)/sqrt(-7-x)', v), 0), 0);
}

// rq-sub-dom-116 — g = sqrt(a * f'(x)) with f = x/(x^2+1) and a < 0 → x <= -1 or x >= 1
{
  const f = 'x/(x^2+1)';
  const fp = '(1-x^2)/(x^2+1)^2';
  dcheck("116 the authored f' is the symbolic derivative of f", f, fp);
  checkSet('116 the derivative vanishes at -1 and 1', roots(fp, -20, 20), [-1, 1]);
  check('116 the derivative is positive between them', Math.sign(num(fp)(0)), 1);
  check('116 the derivative is negative outside them',
    Math.sign(num(fp)(2)) + Math.sign(num(fp)(-2)), -2);
  check('116 the derivative denominator is positive everywhere',
    Math.min(...[-5, -1, 0, 1, 5].map(v => num('(x^2+1)^2')(v))), 1);
  const g = (a: number) => `sqrt((${a})*(${fp}))`;
  const probe = [-3, -1, -1 + EPS, 0, 1 - EPS, 1, 3];
  check('116 a = -3: the domain is the two outer branches',
    pattern(g(-3), probe) === '1100011' ? 1 : 0, 1);
  check('116 a = -0.5: the same domain, so it does not depend on the size of a',
    pattern(g(-0.5), probe) === '1100011' ? 1 : 0, 1);
  check('116 both endpoints give sqrt(0) = 0', num(g(-3))(1) + num(g(-3))(-1), 0);
  check('116 a POSITIVE parameter would give the opposite interval',
    pattern(`sqrt(2*(${fp}))`, [-3, -1, 0, 1, 3]) === '01110' ? 1 : 0, 1);
  check('116 figure: the marked point (-1, 0) is on the derivative curve', num(fp)(-1), 0);
  check('116 figure: the marked point (1, 0) is on the derivative curve', num(fp)(1), 0);
}

// rq-sub-dom-117 — (x-1)/sqrt(x^2-6x+k) is defined for every x exactly when k > 9
{
  const rad = (k: number) => `x^2-6*x+(${k})`;
  const fx = (k: number) => `(x-1)/sqrt(${rad(k)})`;
  const grid: number[] = [];
  for (let x = -10; x <= 16; x += 0.25) grid.push(x);
  const everywhere = (k: number) => (grid.every(v => defined(fx(k), v)) ? 1 : 0);
  check('117 k = 10 is defined everywhere', everywhere(10), 1);
  check('117 k = 9.5 is defined everywhere', everywhere(9.5), 1);
  check('117 the minimum of the radicand equals k - 9',
    Math.min(...grid.map(v => num(rad(12))(v))) - (12 - 9), 0);
  check('117 that minimum is attained at x = 3', num(rad(12))(3) - (12 - 9), 0);
  check('117 k = 9 breaks exactly at x = 3', defined(fx(9), 3), 0);
  check('117 k = 9 note: the radicand vanishes there', num(rad(9))(3), 0);
  checkSet('117 k = 5 note: the radicand has roots 1 and 5', roots(rad(5)), [1, 5]);
  check('117 k = 5 note: the radicand at x = 3 is -4', num(rad(5))(3), -4);
  check('117 k = 0 note: the radicand at x = 3 is -9', num(rad(0))(3), -9);
  check('117 no k of 9 or below survives the grid',
    [0, 5, 8, 9].reduce((s, k) => s + everywhere(k), 0), 0);
}

summary('domain');
