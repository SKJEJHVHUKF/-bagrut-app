// Numeric re-derivation of content/lessons/math5/rq-extra/domain.ts (rq-sub-dom-101…112).
// A domain claim is encoded as membership: `defined(expr, x)` evaluates the question's own
// function with mathjs and asks whether the result is a finite real number (sqrt of a negative
// comes back Complex, division by zero comes back Infinity). Endpoints are found as roots of the
// radicand / denominator, and every distractor / wrongAnswer note is re-enacted as the mistake
// it names.
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
/** membership pattern of expr at the sample points, as a 0/1 string */
const pattern = (expr: string, xs: number[]) => xs.map(x => defined(expr, x)).join('');
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
}

// rq-sub-dom-111 — sqrt(x+4)/(sqrt(x)-2): x >= 0 and x != 4
{
  const den = 'sqrt(x)-2', fx = `sqrt(x+4)/(${den})`;
  checkSet('111 denominator root (after squaring)', roots(den, 0, 20), [4]);
  check('111 membership: 0 in, 4 out, negatives out', pattern(fx, [-1, -EPS, 0, 2, 4 - EPS, 4, 4 + EPS, 100]) === '00111011' ? 1 : 0, 1);
  check('111 distractor B: den(0) = -2, so x=0 is allowed', num(den)(0), -2);
  check('111 distractor C: x=-1 passes the numerator test but not the denominator root', num('x+4')(-1) > 0 ? 1 : 0, 1);
  check('111 distractor C: x=-1 undefined', defined(fx, -1), 0);
  check('111 distractor D: den(2) = sqrt(2)-2 is not 0', num(den)(2), Math.SQRT2 - 2);
  check('111 den(4) = 0', num(den)(4), 0);
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
}

summary('domain');
