// Numeric re-derivation of content/lessons/math5/rq-extra/domain.ts (rq-sub-dom-101…117, 301…313).
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

// rq-sub-dom-104 — 1/sqrt(x-3): the root IS the whole denominator → x > 3, endpoint OUT
{
  const fx = '1/sqrt(x-3)';
  const xs = [-3, 0, 3 - EPS, 3, 3 + EPS, 10];
  checkSet('104 the radicand vanishes at 3', roots('x-3'), [3]);
  check('104 membership: open at 3, defined immediately to its right', pattern(fx, xs) === '000011' ? 1 : 0, 1);
  // the endpoint is lost to a ZERO DENOMINATOR, not to a negative radicand
  check('104 at the endpoint the radicand is 0, not negative', num('x-3')(3), 0);
  check('104 and the denominator there is 0, so f is undefined', num('sqrt(x-3)')(3) + defined(fx, 3), 0);
  // distractor A (x >= 3) differs from the answer at exactly one point, the endpoint
  check('104 distractor A: the weak sign adds exactly one point to the answer',
    xs.filter(v => (v >= 3 ? 1 : 0) !== defined(fx, v)).length, 1);
  // distractor B (x <= 3) is the mirror: the radicand would have to be 3 - x
  check('104 distractor B: mirror — undefined at 0, defined at 4', defined(fx, 0) + defined(fx, 4), 1);
  check('104 note: f(4) = 1', num(fx)(4), 1);
  // distractor C (x >= -3) belongs to the radicand x + 3
  check('104 distractor C: -3 is not in the domain of this f', defined(fx, -3), 0);
  check('104 note: the radicand at 0 is -3', num('x-3')(0), -3);
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

// rq-sub-dom-111 — domains of sqrt(x+4)/(sqrt(x)-2) and sqrt(x+4)/sqrt(x-2);
// the integers that belong to f ALONE are 0, 1, 2 (the asked list).
{
  const fDen = 'sqrt(x)-2', hDen = 'sqrt(x-2)';
  const fx = `sqrt(x+4)/(${fDen})`, hx = `sqrt(x+4)/(${hDen})`;
  checkSet('111 f denominator root (after squaring)', roots(fDen, 0, 20), [4]);
  checkSet('111 h denominator radicand root', roots('x-2', 0, 20), [2]);
  check('111 f domain: x >= 0 and x != 4', pattern(fx, [-1, -EPS, 0, 2, 4 - EPS, 4, 4 + EPS, 100]) === '00111011' ? 1 : 0, 1);
  check('111 h domain: x > 2 only', pattern(hx, [-1, 0, 2 - EPS, 2, 2 + EPS, 4, 100]) === '0000111' ? 1 : 0, 1);
  // THE ANSWER, enumerated rather than restated: integers in f's domain and not in h's
  const only: number[] = [];
  for (let n = -20; n <= 20; n++) if (defined(fx, n) === 1 && defined(hx, n) === 0) only.push(n);
  checkSet('111 integers in f only = 0, 1, 2', only, [0, 1, 2]);
  check('111 the list is finite and its largest member is 2', Math.max(...only), 2);
  // wrongAnswer "0, 1" — drops 2, which h rejects because ITS inequality is strict
  check('111 x = 2 is in f but not in h', defined(fx, 2) - defined(hx, 2), 1);
  check('111 note: h denominator at 2 is sqrt(0) = 0', num(hDen)(2), 0);
  // wrongAnswer "0, 1, 2, 4" — 4 is the OPPOSITE direction: in h, not in f
  check('111 x = 4 is in h but not in f', defined(hx, 4) - defined(fx, 4), 1);
  check('111 note: f denominator at 4 is 0', num(fDen)(4), 0);
  check('111 note: h denominator at 4 is sqrt(2)', num(hDen)(4), Math.SQRT2);
  // wrongAnswer "0, 1, 2, 3" — 3 belongs to BOTH domains, so it is not on the list
  check('111 x = 3 belongs to both domains', defined(fx, 3) + defined(hx, 3), 2);
  check('111 note: f denominator at 3 is sqrt(3) - 2, not zero', num(fDen)(3), Math.sqrt(3) - 2);
  check('111 note: f denominator at 0 is -2 (the root may vanish there, it is only part of the denominator)', num(fDen)(0), -2);
  check('111 note: h radicand at 0 is -2', num('x-2')(0), -2);
}

// rq-sub-dom-112 — (x+1)/sqrt(36-x^2): the student's "x <= 6" admits x = -10; the
// true domain is -6 < x < 6, and g = 1/f loses exactly one more value, x = -1.
{
  const g = '36-x^2', fx = `(x+1)/sqrt(${g})`, gx = `1/((x+1)/sqrt(${g}))`;
  check('112 true domain is -6 < x < 6', pattern(fx, [-6 - EPS, -6, -6 + EPS, 0, 6 - EPS, 6, 6 + EPS]) === '0011100' ? 1 : 0, 1);
  // MOVE 1 — the disproof the question asks for: the student's rule admits an undefined point
  const studentSays = (x: number) => (x <= 6 ? 1 : 0);
  check('112 x=-10 admitted by the student but undefined', studentSays(-10) - defined(fx, -10), 1);
  check('112 note: g(-10) = -64, a negative radicand', num(g)(-10), -64);
  check('112 the student rule and the true domain disagree on a whole ray, not one point',
    [-20, -15, -10, -8, -7].filter(v => studentSays(v) !== defined(fx, v)).length, 5);
  // the student's line "x^2 <= 36" itself follows from "36 - x^2 >= 0": the loss is the sqrt step
  let mismatches = 0;
  for (let x = -10; x <= 10; x += 0.25) mismatches += (num(g)(x) >= 0) === (x * x <= 36) ? 0 : 1;
  check('112 x^2 <= 36 is equivalent to 36 - x^2 >= 0', mismatches, 0);
  check('112 note: den(6) = sqrt(0) = 0, so the endpoints go too', num(`sqrt(${g})`)(6), 0);
  // MOVE 3 — 1/f: the only value f loses is where f itself vanishes, inside the domain
  checkSet('112 f vanishes exactly at x = -1 inside the domain', trueRoots(fx, -5.99, 5.99), [-1]);
  check('112 f is defined at -1 and equals 0 there', num(fx)(-1) + (1 - defined(fx, -1)), 0);
  check('112 g = 1/f is undefined exactly there', defined(gx, -1), 0);
  check('112 -1 is an isolated NEW exclusion: g is defined on both sides of it',
    defined(gx, -1.01) + defined(gx, -0.99), 2);
  check('112 wrongAnswer 6 was already out of f domain', defined(fx, 6), 0);
  check('112 wrongAnswer -6 was already out of f domain', defined(fx, -6), 0);
  check('112 wrongAnswer 1: f(1) = 2/sqrt(35), not zero', num(fx)(1), 2 / Math.sqrt(35));
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
  // the two domains the reworded question asks for, side by side on one grid
  check('114 k=2: g is undefined at 9 and defined on both sides of it',
    defined(g(2), 9) + (1 - defined(g(2), 8.9)) + (1 - defined(g(2), 9.1)), 0);
  check('114 k=1: the same three points are all in the domain',
    defined(g(1), 9) + defined(g(1), 8.9) + defined(g(1), 9.1), 3);
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

// ─── round 3 ───────────────────────────────────────────────────────────────

// rq-sub-dom-301 — sqrt((x^2-9)/(x-2)): -3 <= x < 2 or x >= 3, smallest integer -3
{
  const q = '(x^2-9)/(x-2)', fx = `sqrt(${q})`;
  checkSet('301 numerator roots', roots('x^2-9'), [3, -3]);
  checkSet('301 denominator root', roots('x-2'), [2]);
  check('301 the factorisation (x-3)(x+3) agrees with the numerator', num('x^2-9')(7) - E('(7-3)*(7+3)'), 0);
  // the four sign-table columns, each read off the function itself
  check('301 table row x < -3: the quotient is negative', Math.sign(num(q)(-5)), -1);
  check('301 table row -3 < x < 2: the quotient is positive', Math.sign(num(q)(0)), 1);
  check('301 table row 2 < x < 3: the quotient is negative', Math.sign(num(q)(2.5)), -1);
  check('301 table row x > 3: the quotient is positive', Math.sign(num(q)(4)), 1);
  check('301 membership: closed at -3, open at 2, closed at 3',
    pattern(fx, [-4, -3 - EPS, -3, 0, 2 - EPS, 2, 2.5, 3 - EPS, 3, 4]) === '0011100011' ? 1 : 0, 1);
  check('301 both closed endpoints give sqrt(0) = 0', num(fx)(-3) + num(fx)(3), 0);
  check('301 the open endpoint is a zero denominator, not a negative quotient', num('x-2')(2), 0);
  // THE ANSWER, enumerated: the smallest integer the function accepts
  const ints: number[] = [];
  for (let n = -40; n <= 40; n++) if (defined(fx, n) === 1) ints.push(n);
  check('301 smallest integer in the domain', Math.min(...ints), -3);
  checkSet('301 the integers below 3 that survive are exactly -3..1', ints.filter(n => n < 3), [-3, -2, -1, 0, 1]);
  // wrongAnswer -2 = endpoint taken as open; wrongAnswer 3 = only the right branch kept
  check('301 wrong -2: -3 really is in the domain', defined(fx, -3), 1);
  check('301 wrong 3: the note value q(0) = 4.5', num(q)(0), 4.5);
  check('301 wrong 2: the quotient is undefined there', defined(q, 2), 0);
}

// rq-sub-dom-302 — sqrt(x+3)/(x^2+2x+m): m=-8 → x >= -3, x != 2; m=-3 → x > -3, x != 1
{
  const den = (m: number) => `x^2+2*x+(${m})`;
  const fx = (m: number) => `sqrt(x+3)/(${den(m)})`;
  checkSet('302 radicand root fixes the left edge at -3', roots('x+3'), [-3]);
  checkSet('302 m = -8: denominator roots', roots(den(-8)), [-4, 2]);
  checkSet('302 m = -3: denominator roots', roots(den(-3)), [-3, 1]);
  check('302 m = -8: the factorisation (x+4)(x-2) agrees', num(den(-8))(5) - E('(5+4)*(5-2)'), 0);
  check('302 m = -3: the factorisation (x+3)(x-1) agrees', num(den(-3))(5) - E('(5+3)*(5-1)'), 0);
  // -4 is NOT an exclusion: it fails the root's own condition first
  check('302 m = -8: -4 is outside the radicand condition anyway', defined('sqrt(x+3)', -4), 0);
  check('302 m = -8: membership around the edge and around 2',
    pattern(fx(-8), [-4, -3 - EPS, -3, 0, 2 - EPS, 2, 2 + EPS, 10]) === '00111011' ? 1 : 0, 1);
  // m = -3 is the case where the CLOSED edge itself turns open
  check('302 m = -3: the denominator vanishes at the edge', num(den(-3))(-3), 0);
  check('302 m = -3: membership — the edge is gone, 1 is gone',
    pattern(fx(-3), [-4, -3, -3 + EPS, 0, 1 - EPS, 1, 1 + EPS, 10]) === '00111011' ? 1 : 0, 1);
  check('302 the two cases differ exactly at the edge and at their excluded points',
    [-3, 1, 2].filter(v => defined(fx(-8), v) !== defined(fx(-3), v)).length, 3);
  // distractor B: x >= -4 would admit a negative radicand
  check('302 distractor B: x = -3.5 has radicand -0.5', num('x+3')(-3.5), -0.5);
  check('302 distractor B: f is undefined there for both m', defined(fx(-8), -3.5) + defined(fx(-3), -3.5), 0);
  // distractor C: roots read off the factors without flipping the sign
  check('302 distractor C: den(4) = 16 when m = -8', num(den(-8))(4), 16);
  check('302 distractor C: den(3) = 12 when m = -3', num(den(-3))(3), 12);
  check('302 note: den(-2) = -3 when m = -3, so -2 stays in', num(den(-3))(-2), -3);
}

// rq-sub-dom-311 — f = sqrt((x+5)/(3-x)), g = 1/(f-1): f loses only x = -1 on the way to g
{
  const q = '(x+5)/(3-x)', fx = `sqrt(${q})`, gx = `1/(sqrt(${q})-1)`;
  checkSet('311 numerator root', roots('x+5'), [-5]);
  checkSet('311 denominator root', roots('3-x'), [3]);
  check('311 table row x < -5: the quotient is negative', Math.sign(num(q)(-6)), -1);
  check('311 table row -5 < x < 3: the quotient is positive', Math.sign(num(q)(0)), 1);
  check('311 table row x > 3: the quotient is negative', Math.sign(num(q)(4)), -1);
  check('311 f domain: closed at -5, open at 3',
    pattern(fx, [-6, -5 - EPS, -5, 0, 3 - EPS, 3, 4]) === '0011100' ? 1 : 0, 1);
  // THE ANSWER: solved numerically as a root of f(x) - 1, not by re-applying the algebra
  checkSet('311 f(x) = 1 holds exactly at x = -1', trueRoots(`sqrt(${q})-1`, -4.99, 2.99), [-1]);
  check('311 f(-1) = 1', num(fx)(-1), 1);
  check('311 g is undefined exactly there', defined(gx, -1), 0);
  check('311 and defined on both sides of it', defined(gx, -1.01) + defined(gx, -0.99), 2);
  // it is the ONLY point f keeps and g drops, over a fine sweep of the interval
  // (k/500 keeps the grid exact, so it really lands on -1 rather than near it)
  let dropped = 0;
  for (let k = 0; k < 4000; k++) {
    const x = -5 + k / 500;
    if (defined(fx, x) === 1 && defined(gx, x) === 0) dropped++;
  }
  check('311 exactly one sampled point is in f and not in g', dropped, 1);
  // wrongAnswers, each re-enacted
  check('311 wrong 3: already out of f domain', defined(fx, 3), 0);
  check('311 wrong -5: f(-5) = 0, so the new denominator is -1 there', num(`sqrt(${q})-1`)(-5), -1);
  check('311 wrong 1: the radicand there is 3', num(q)(1), 3);
  check('311 wrong 1: f(1) = sqrt(3), not 1', num(fx)(1), Math.sqrt(3));
  check('311 note: f(0) = sqrt(5/3), so g is defined at 0', num(fx)(0), Math.sqrt(5 / 3));
}

// rq-sub-dom-312 — f = (x^2+3)/(x-1), g = 1/f': domain x != 1, -1, 3; max at -1, min at 3
{
  const f = '(x^2+3)/(x-1)';
  const fp = '((x-3)*(x+1))/(x-1)^2';
  // samples avoid x = 1, where both sides are infinite and the difference is NaN
  dcheck("312 the authored f' is the symbolic derivative of f", f, fp, [-3, -2.3, -0.5, 0.7, 2.5, 4]);
  check('312 the expanded numerator x^2-2x-3 matches the factored form',
    num('x^2-2*x-3')(7) - E('(7-3)*(7+1)'), 0);
  checkSet("312 f' vanishes at -1 and 3", roots(fp, -20, 20), [-1, 3]);
  check("312 f' is undefined at x = 1, so g inherits that exclusion", defined(fp, 1), 0);
  const g = `1/(${fp})`;
  check('312 g is undefined at the two zeros of the derivative',
    [-1, 3].reduce((s, v) => s + defined(g, v), 0), 0);
  check('312 g is defined immediately beside all three excluded values',
    [1, -1, 3].reduce((s, v) => s + defined(g, v - EPS) + defined(g, v + EPS), 0), 6);
  // the sign table, column by column, and the extremum types it implies
  check("312 f' > 0 left of -1", Math.sign(num(fp)(-2)), 1);
  check("312 f' < 0 between -1 and 1", Math.sign(num(fp)(0)), -1);
  check("312 f' < 0 between 1 and 3", Math.sign(num(fp)(2)), -1);
  check("312 f' > 0 right of 3", Math.sign(num(fp)(4)), 1);
  check('312 the denominator of the derivative is positive wherever it is defined',
    Math.min(...[-5, -1, 0, 2, 3, 5].map(v => num('(x-1)^2')(v))), 1);
  // maximum at -1 / minimum at 3, proved by comparing f itself with its neighbours
  check('312 x = -1 is a local maximum of f',
    (num(f)(-1) > num(f)(-1.1) && num(f)(-1) > num(f)(-0.9)) ? 1 : 0, 1);
  check('312 x = 3 is a local minimum of f',
    (num(f)(3) < num(f)(2.9) && num(f)(3) < num(f)(3.1)) ? 1 : 0, 1);
  check('312 f(-1) = -2', num(f)(-1), -2);
  check('312 f(3) = 6', num(f)(3), 6);
  // wrongAnswer "3, -1" (types swapped) — the note's number
  check("312 note: f'(-2) = 5/9", num(fp)(-2), 5 / 9);
  // wrongAnswer "1, 3" / "-1, 1" — x = 1 is a pole, not an extremum
  check('312 f itself is undefined at x = 1', defined(f, 1), 0);
  check('312 f grows without bound beside x = 1, so it is no extremum',
    (Math.abs(num(f)(1 + 1e-4)) > 1e3 && Math.abs(num(f)(1 - 1e-4)) > 1e3) ? 1 : 0, 1);
}

// rq-sub-dom-313 — f = (x+a)/(x-6), g = sqrt(f) meets the x-axis at (-2, 0) → a = 2;
// domain of g is x <= -2 or x > 6, and h = 1/g opens the closed endpoint.
{
  // a is RECOVERED from the given point, not restated: solve (-2) + a = 0 for a
  const as = roots('(-2)+a', -50, 50, 'a');
  checkSet('313 a from the given intersection point', as, [2]);
  const a = as[0];
  const q = `(x+${a})/(x-6)`, gx = `sqrt(${q})`;
  // h = 1/g is defined exactly where g is defined AND non-zero. Asked of mathjs
  // directly, 1/sqrt(...) answers 0 at the pole (1/sqrt(Infinity)) and would
  // silently claim x = 6 belongs to h, so membership is composed here instead.
  const hIn = (x: number) => (defined(gx, x) === 1 && Math.abs(num(gx)(x)) > 1e-12 ? 1 : 0);
  check('313 the recovered g really vanishes at the given point', num(gx)(-2), 0);
  // a sqrt never changes sign, so the zero is found on the radicand, not on g
  checkSet('313 g meets the x-axis nowhere else', trueRoots(q, -40, 5.99), [-2]);
  check('313 table row x < -2: the quotient is positive', Math.sign(num(q)(-3)), 1);
  check('313 table row -2 < x < 6: the quotient is negative', Math.sign(num(q)(0)), -1);
  check('313 table row x > 6: the quotient is positive', Math.sign(num(q)(7)), 1);
  check('313 g domain: closed at -2, open at 6',
    pattern(gx, [-10, -2 - EPS, -2, -2 + EPS, 0, 6 - EPS, 6, 6 + EPS, 20]) === '111000011' ? 1 : 0, 1);
  // h = 1/g loses exactly the closed endpoint, and nothing else
  check('313 h is undefined at -2 but g is defined there', defined(gx, -2) - hIn(-2), 1);
  check('313 h domain: the endpoint is the only difference',
    [-10, -2 - EPS, -2, -2 + EPS, 0, 6 - EPS, 6, 6 + EPS, 20].map(hIn).join('') === '110000011' ? 1 : 0, 1);
  let diff = 0;
  for (let k = 0; k <= 6000; k++) {
    const x = -30 + k / 100;
    if (defined(gx, x) !== hIn(x)) diff++;
  }
  check('313 exactly one sampled point separates the two domains', diff, 1);
  check('313 note: g(-3) = 1/3', num(gx)(-3), 1 / 3);
  // wrongAnswers: each a would move the intersection somewhere else
  checkSet('313 wrong a = -2 would put the intersection at x = 2', trueRoots('(x-2)/(x-6)', -40, 5.99), [2]);
  checkSet('313 wrong a = 6 would put it at x = -6', trueRoots('(x+6)/(x-6)', -40, 5.99), [-6]);
  checkSet('313 wrong a = 0 would put it at the origin', trueRoots('(x-0)/(x-6)', -40, 5.99), [0]);
  check('313 none of those three passes through the given point',
    [-2, 6, 0].reduce((s, w) => s + (Math.abs(num(`sqrt((x+(${w}))/(x-6))`)(-2)) < 1e-9 ? 1 : 0), 0), 0);
}

summary('domain');
