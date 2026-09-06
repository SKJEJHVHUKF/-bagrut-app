// Numeric re-derivation of content/lessons/math5/rq-extra/transformations.ts (rq-sub-tr-101…113).
// Every shifted / stretched / reflected point is COMPUTED by applying the transformation to a
// concrete model function that has the stated feature; every "how many solutions" claim is a
// counted crossing (grid sign changes) or a discriminant computed from k; every distractor and
// wrongAnswer note is re-enacted as the mistake it names and must land on THAT option.
import { check, dcheck, checkSet, icheck, summary, math, E } from './_lib';
import { fnFigure } from '../../lib/fn-figure';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (x: number) => c.evaluate({ x }) as number;
};
/** number of sign changes of expr on a grid over [lo, hi]; a grid step that straddles one of
 *  `poles` is skipped (the sign flip across a vertical asymptote is not a solution). The grid
 *  carries an irrational offset so no root is hit exactly (an exact zero is neither + nor −). */
function crossings(expr: string, poles: number[] = [], lo = -30, hi = 30, n = 12000): number {
  const g = f(expr);
  let count = 0;
  let px = NaN, pv = NaN;
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n + 1e-3 * Math.SQRT2;
    const v = g(x);
    if (Number.isFinite(pv) && Number.isFinite(v) && !poles.some(p => p > px && p < x) && pv * v < 0) count++;
    px = x;
    pv = v;
  }
  return count;
}
/** true when mathjs refuses a real value (sqrt of a negative comes back Complex, not NaN) */
const notReal = (v: unknown) => typeof v !== 'number' || Number.isNaN(v);
/** roots of a*x^2 + b*x + c counted by the discriminant */
const quadCount = (a: number, b: number, c: number) => {
  const d = b * b - 4 * a * c;
  return d > 1e-12 ? 2 : Math.abs(d) <= 1e-12 ? 1 : 0;
};
/** is x0 a strict local min (+1) / max (-1) of expr, by sampling both sides */
const kind = (expr: string, x0: number, h = 0.05) => {
  const g = f(expr);
  const c = g(x0), l = g(x0 - h), r = g(x0 + h);
  return l > c && r > c ? 1 : l < c && r < c ? -1 : 0;
};

// rq-sub-tr-101 — 1/x^2 shifted right 3, up 2 → 1/(x-3)^2 + 2 (MCQ)
{
  const base = f('1/x^2');
  const g = f('1/(x-3)^2 + 2');
  // g is exactly f moved right 3 and up 2: g(t + 3) = f(t) + 2
  for (const t of [-2, -0.5, 0.7, 1, 4]) check(`tr-101 g(t+3) = f(t)+2 at t=${t}`, g(t + 3), base(t) + 2);
  check('tr-101 vertical asymptote moved to x=3', Math.abs(g(3 + 1e-6)) > 1e6 ? 1 : 0, 1);
  check('tr-101 horizontal asymptote y=2', g(1e6), 2, 1e-9);
  // distractor B: 1/(x+3)^2 + 2 is the LEFT shift: it equals f(t)+2 at x = t - 3
  const b = f('1/(x+3)^2 + 2');
  for (const t of [1, 2]) check(`tr-101 distractor B is f shifted left (t=${t})`, b(t - 3), base(t) + 2);
  // distractor C: 1/(x-3)^2 - 2 sits 4 below the correct graph everywhere
  check('tr-101 distractor C is the down-shift', f('1/(x-3)^2 - 2')(5) - g(5), -4);
  // distractor D: 1/(x^2-3) + 2 is undefined at two x values (x^2 - 3 = 0)
  checkSet('tr-101 distractor D domain holes', [Math.sqrt(3), -Math.sqrt(3)], [E('sqrt(3)'), E('-sqrt(3)')]);
  check('tr-101 distractor D has 2 excluded values', crossings('x^2-3'), 2);
}

// rq-sub-tr-102 — 2026-09-06 exam-style rewrite: f = sqrt(x-6), g = 3f.
// The ask is now g's own domain and x-intercept, so that is what is re-derived.
{
  const fx = 'sqrt(x-6)', gx = '3*sqrt(x-6)';
  check('tr-102 the expression under the root vanishes exactly at 6', f('x-6')(6), 0);
  check('tr-102 g is undefined just left of 6 (the root turns negative)', notReal(f(gx)(5.95)) ? 1 : 0, 1);
  check('tr-102 g is defined at 6 itself', f(gx)(6), 0);
  for (const t of [6, 7, 10, 22]) check(`tr-102 g(t) = 3f(t) at t=${t}`, f(gx)(t), 3 * f(fx)(t));
  check('tr-102 the x-intercept stays at 6: the stretch keeps 0 at 0', f(gx)(6), f(fx)(6));
  check('tr-102 distractor "x >= 18": g is already defined at 10', notReal(f(gx)(10)) ? 0 : 1, 1);
  check('tr-102 distractor "(6,3)": the height at 6 is 0, not 3', f(gx)(6), 0);
  check('tr-102 distractor "x >= 2": at x = 3 the root is of a negative number', notReal(f(gx)(3)) ? 1 : 0, 1);
}

// rq-sub-tr-103 — 2026-09-06 exam-style rewrite: f = 2x/(x-3), g = f(-x).
// The reflection is the same; the ask is now g's two asymptote equations.
{
  const fx = '2*x/(x-3)', gx = '2*x/(x+3)';
  for (const t of [-5, -1, 0.5, 2, 7]) check(`tr-103 g(t) = f(-t) at t=${t}`, f(gx)(t), f(fx)(-t));
  check('tr-103 the vertical asymptote of g sits at -3', Math.abs(f(gx)(-3 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-103 the numerator there is -6, not zero, so it is an asymptote', f('2*x')(-3), -6);
  check('tr-103 the horizontal asymptote of g is y = 2', f(gx)(1e7), 2, 1e-6);
  check('tr-103 and f had the SAME horizontal asymptote', f(fx)(1e7), 2, 1e-6);
  check('tr-103 distractor "x = 3": g is finite there', Number.isFinite(f(gx)(3)) ? 1 : 0, 1);
  check('tr-103 distractor "y = -2": the far value is +2', Math.abs(f(gx)(1e7) + 2) > 3 ? 1 : 0, 1);
  check('tr-103 distractor "y = 0": the far value is not near 0', Math.abs(f(gx)(1e7)) > 1 ? 1 : 0, 1);
}

// rq-sub-tr-104 — odd, f(2) = -7 → f(-2) = 7 (open)
{
  const odd = f('-7/2 * x'); // an odd function with f(2) = -7
  check('tr-104 model is odd', odd(-3) + odd(3), 0);
  check('tr-104 model f(2) = -7', odd(2), -7);
  check('tr-104 f(-2) = -f(2) = 7', -odd(2), E('7'));
  check('tr-104 model f(-2) directly', odd(-2), 7);
  // wrong -7: the even identity f(-2) = f(2)
  const even = f('-7/4 * x^2');
  check('tr-104 wrong -7 is what an even function gives', even(-2), -7);
}

// rq-sub-tr-105 — endpoint of sqrt(x+2) after right 5, down 3 → (3, -3) (open, two boxes)
{
  const base = f('sqrt(x+2)');
  const x0 = E('-2'); // x + 2 = 0
  check('tr-105 radicand vanishes at x0', x0 + 2, 0);
  check('tr-105 f(x0) = 0', base(x0), 0);
  check('tr-105 f undefined just left of x0', notReal(base(x0 - 1e-6)) ? 1 : 0, 1);
  const gx = x0 + 5, gy = 0 - 3;
  checkSet('tr-105 shifted endpoint (3, -3)', [gx, gy], [E('3'), E('-3')]);
  const g = f('sqrt(x-3) - 3');
  check('tr-105 g(x) = f(x-5) - 3 (x=7)', g(7), base(2) - 3);
  check('tr-105 g(3) = -3', g(3), -3);
  check('tr-105 g undefined just left of 3', notReal(g(3 - 1e-6)) ? 1 : 0, 1);
  checkSet('tr-105 wrong (-7,-3): shifted left', [x0 - 5, gy], [-7, -3]);
  checkSet('tr-105 wrong (3,3): shifted up', [gx, 0 + 3], [3, 3]);
  checkSet('tr-105 wrong (5,-3): shifted from the origin', [0 + 5, 0 - 3], [5, -3]);
}

// rq-sub-tr-106 — 2026-09-06 exam-style rewrite: f = 4x/(x-1), g = f(x+2) - 3.
// Same two shifts, now on a named function, and the two values the old "student"
// got wrong are two of the four options.
{
  const fx = '4*x/(x-1)';
  const gx = '4*(x+2)/((x+2)-1) - 3'; // g(x) = f(x+2) - 3, written out
  check('tr-106 f blows up at 1', Math.abs(f(fx)(1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-106 the numerator of f at 1 is 4, not zero', f('4*x')(1), 4);
  check('tr-106 f has horizontal asymptote y = 4', f(fx)(1e7), 4, 1e-6);
  for (const t of [-4, -2, 0, 3, 6]) check(`tr-106 g(t) = f(t+2) - 3 at t=${t}`, f(gx)(t), f(fx)(t + 2) - 3);
  check('tr-106 g blows up at -1, so the vertical asymptote moved LEFT by 2', Math.abs(f(gx)(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-106 g has horizontal asymptote y = 1', f(gx)(1e7), 1, 1e-6);
  check('tr-106 distractor "x = 3": g is finite there', Number.isFinite(f(gx)(3)) ? 1 : 0, 1);
  check('tr-106 distractor "y = 7" is the vertical shift with its sign flipped', f(fx)(1e7) + 3, 7, 1e-6);
  check('tr-106 distractor "x = 1, y = 4" is f itself, before the shifts', f(fx)(1e7), 4, 1e-6);
}

// rq-sub-tr-107 — max (2,-1), g = f(x+3) + 4 → max (-1, 3) (open, two boxes)
{
  const fm = '-(x-2)^2 - 1'; // model with max at (2, -1)
  check('tr-107 model max at (2,-1)', f(fm)(2), -1);
  check('tr-107 model kind max', kind(fm, 2), -1);
  const g = `-((x+3)-2)^2 - 1 + 4`;
  checkSet('tr-107 g extremum (-1, 3)', [2 - 3, f(g)(2 - 3)], [E('-1'), E('3')]);
  check('tr-107 g has a max at x=-1', kind(g, -1), -1);
  check('tr-107 -1 + 4 = 3', -1 + 4, 3);
  // wrongs
  check('tr-107 wrong (5,3): f(x-3)+4 peaks at 5', kind('-((x-3)-2)^2 - 1 + 4', 5), -1);
  check('tr-107 wrong (5,3) height', f('-((x-3)-2)^2 - 1 + 4')(5), 3);
  check('tr-107 wrong (-1,-5): f(x+3)-4 at -1', f('-((x+3)-2)^2 - 1 - 4')(-1), -5);
  check('tr-107 wrong (5,-5): f(x-3)-4 at 5', f('-((x-3)-2)^2 - 1 - 4')(5), -5);
}

// rq-sub-tr-108 — the odd one among four rational functions (MCQ)
{
  const S = [-2.5, -2, 0.5, 1.7, 3];
  const oddness = (expr: string) => Math.max(...S.map(x => Math.abs(f(expr)(-x) + f(expr)(x))));
  const evenness = (expr: string) => Math.max(...S.map(x => Math.abs(f(expr)(-x) - f(expr)(x))));
  check('tr-108 x^3/(x^2-1) is odd', oddness('x^3/(x^2-1)'), 0);
  check('tr-108 x^3/(x^2-1) is not even', evenness('x^3/(x^2-1)') > 0.1 ? 1 : 0, 1);
  check('tr-108 (x^3+1)/x^2 not odd', oddness('(x^3+1)/x^2') > 0.1 ? 1 : 0, 1);
  check('tr-108 (x^3+1)/x^2 not even', evenness('(x^3+1)/x^2') > 0.1 ? 1 : 0, 1);
  check('tr-108 note B: f(-x) = (-x^3+1)/x^2', f('(x^3+1)/x^2')(-2), f('(-x^3+1)/x^2')(2));
  check('tr-108 x/(x-1) not odd', oddness('x/(x-1)') > 0.1 ? 1 : 0, 1);
  check('tr-108 x/(x-1) not even', evenness('x/(x-1)') > 0.1 ? 1 : 0, 1);
  check('tr-108 note C: f(-x) = x/(x+1)', f('x/(x-1)')(-2), f('x/(x+1)')(2));
  check('tr-108 x^2/(x^2-1) is even', evenness('x^2/(x^2-1)'), 0);
  check('tr-108 x^2/(x^2-1) is not odd', oddness('x^2/(x^2-1)') > 0.1 ? 1 : 0, 1);
}

// rq-sub-tr-109 — min height 3, g = c + f touches the x-axis once → c = -3 (open)
{
  const fm = '(x-1)^2 + 3'; // model: unique min of height 3, rises without bound
  const minVal = Math.min(...Array.from({ length: 4001 }, (_, i) => f(fm)(-20 + i * 0.01)));
  check('tr-109 model minimum value 3', minVal, 3);
  // g(x) = (x-1)^2 + 3 + c = 0 ⇔ (x-1)^2 = -(3 + c): solutions counted by the discriminant
  const count = (c: number) => quadCount(1, -2, 1 + 3 + c);
  check('tr-109 c = -3 gives exactly one common point', count(-3), 1);
  check('tr-109 c from -c = minVal', -minVal, E('-3'));
  check('tr-109 c = -4 gives two (line above the min)', count(-4), 2);
  check('tr-109 c = -2 gives none (line below the min)', count(-2), 0);
  // wrongs
  check('tr-109 wrong c = 3: min height 6, no common point', f(`${fm} + 3`)(1), 6);
  check('tr-109 wrong c = 3 count', count(3), 0);
  check('tr-109 wrong c = 0 count', count(0), 0);
}

// rq-sub-tr-110 — (3x-5)/(x-2) = 3 has no solution (open)
{
  const fx = '(3*x-5)/(x-2)';
  check('tr-110 horizontal asymptote 3/1', f(fx)(1e7), E('3/1'), 1e-6);
  check('tr-110 crossings of f = 3', crossings(`${fx} - 3`, [2]), E('0'));
  // 3x - 5 - 3(x - 2) is the constant 1 → the x cancels and -5 = -6 is a contradiction
  for (const x of [-4, 0, 7]) check(`tr-110 3x-5 - 3(x-2) = 1 at x=${x}`, f('3*x-5 - 3*(x-2)')(x), 1);
  check('tr-110 -5 vs -6 contradiction', E('-5') - E('-6') === 0 ? 1 : 0, 0);
  // a height that is not the asymptote is reached exactly once (single rational branch pair)
  check('tr-110 f = 4 has one solution (contrast)', crossings(`${fx} - 4`, [2]), 1);
  check('tr-110 f = 2 has one solution (contrast)', crossings(`${fx} - 2`, [2]), 1);
}

// rq-sub-tr-111 — 2026-09-06 exam-style rewrite: f = 9x/(x^2+9). Prove odd, then
// find BOTH extrema and their types — the archive's own pair of asks.
{
  const fx = '9*x/(x^2+9)', fp = '(81-9*x^2)/(x^2+9)^2';
  check('tr-111 the denominator never vanishes, so f is defined everywhere', crossings('x^2+9'), 0);
  for (const t of [0.4, 1.7, 5, 12]) check(`tr-111 odd: f(-t) + f(t) = 0 at t=${t}`, f(fx)(-t) + f(fx)(t), 0, 1e-12);
  dcheck('tr-111 the quotient rule gives f\' = (81 - 9x^2)/(x^2+9)^2', fx, fp);
  check('tr-111 the denominator of f\' is positive, so only the numerator decides', f('(x^2+9)^2')(0) > 0 ? 1 : 0, 1);
  checkSet('tr-111 the numerator of f\' vanishes exactly at 3 and -3', [3, -3].filter((r) => Math.abs(f('81-9*x^2')(r)) < 1e-12), [3, -3]);
  check('tr-111 the height at 3 is 27/18 = 1.5', f(fx)(3), E('27/18'));
  check('tr-111 and at -3 it is the opposite, -1.5', f(fx)(-3), E('-27/18'));
  check('tr-111 sign order at 3 is + then -, so it is a MAXIMUM', kind(fx, 3), -1);
  check('tr-111 sign order at -3 is - then +, so it is a MINIMUM', kind(fx, -3), 1);
  check('tr-111 wrong "27": that is the numerator alone, without the denominator', f('9*x')(3), 27);
  check('tr-111 wrong swap: at 3 the function is ABOVE its neighbours', f(fx)(3) > f(fx)(2.5) && f(fx)(3) > f(fx)(3.5) ? 1 : 0, 1);
  check('tr-111 wrong "(1.5, 3)": f(1.5) is not 3', Math.abs(f(fx)(1.5) - 3) > 1 ? 1 : 0, 1);
}

// rq-sub-tr-112 — x^2/(x-1): f(x) = k has exactly one solution ⇔ k ∈ {0, 4} (open)
{
  const fx = 'x^2/(x-1)';
  dcheck('tr-112 f\'', fx, '(x^2-2*x)/(x-1)^2', [-2.3, -1, -0.5, 0.7, 1.5, 2.5, 4]);
  dcheck('tr-112 quotient-rule form', fx, '(2*x*(x-1) - x^2*1)/(x-1)^2', [-2.3, -1, -0.5, 0.7, 1.5, 2.5, 4]);
  const crit = math.polynomialRoot(0, -2, 1) as number[]; // x^2 - 2x = 0
  checkSet('tr-112 critical x', crit, [0, 2]);
  const heights = crit.map(x => f(fx)(x));
  checkSet('tr-112 extremum heights', heights, [E('0/(-1)'), E('4/1')]);
  const dAt = (x: number) => math.derivative(fx, 'x').evaluate({ x }) as number;
  check('tr-112 f\' > 0 for x<0', dAt(-1) > 0 ? 1 : 0, 1);
  check('tr-112 f\' < 0 on (0,1)', dAt(0.5) < 0 ? 1 : 0, 1);
  check('tr-112 f\' < 0 on (1,2)', dAt(1.5) < 0 ? 1 : 0, 1);
  check('tr-112 f\' > 0 for x>2', dAt(3) > 0 ? 1 : 0, 1);
  check('tr-112 (0,0) is a max', kind(fx, 0), -1);
  check('tr-112 (2,4) is a min', kind(fx, 2), 1);
  // left branch → -∞ on both ends, right branch → +∞ on both ends
  check('tr-112 left branch unbounded below (x→-∞)', f(fx)(-1e6) < -1e5 ? 1 : 0, 1);
  check('tr-112 left branch unbounded below (x→1⁻)', f(fx)(1 - 1e-7) < -1e5 ? 1 : 0, 1);
  check('tr-112 right branch unbounded above (x→1⁺)', f(fx)(1 + 1e-7) > 1e5 ? 1 : 0, 1);
  check('tr-112 right branch unbounded above (x→∞)', f(fx)(1e6) > 1e5 ? 1 : 0, 1);
  // f(x) = k ⇔ x^2 - kx + k = 0 (x = 1 is never a root: 1 - k + k = 1); count by discriminant
  const count = (k: number) => quadCount(1, -k, k);
  const ones = math.polynomialRoot(0, -4, 1) as number[]; // k^2 - 4k = 0 ⇔ disc = 0
  checkSet('tr-112 exactly-one k values', ones, [E('0'), E('4')]);
  check('tr-112 k=0 → 1 solution', count(0), 1);
  check('tr-112 k=4 → 1 solution', count(4), 1);
  check('tr-112 k=-1 → 2 (below 0)', count(-1), 2);
  check('tr-112 k=2 → 0 (between 0 and 4)', count(2), 0);
  check('tr-112 k=5 → 2 (above 4)', count(5), 2);
  check('tr-112 grid: f = -1 crosses twice', crossings(`${fx} + 1`, [1]), 2);
  check('tr-112 grid: f = 2 never crosses', crossings(`${fx} - 2`, [1]), 0);
  check('tr-112 grid: f = 5 crosses twice', crossings(`${fx} - 5`, [1]), 2);
  check('tr-112 grid: f = 0 is a touch, not a crossing', crossings(fx, [1]), 0);
  check('tr-112 grid: f = 4 is a touch, not a crossing', crossings(`${fx} - 4`, [1]), 0);
  // wrongs
  checkSet('tr-112 wrong "0, 2" are the x values, not heights', crit, [0, 2]);
  check('tr-112 wrong "4" alone: y=0 also touches once', count(0), 1);
}

// rq-sub-tr-113 — |x^2-2x-3| = 4 has 3 solutions (MCQ)
{
  const fx = 'x^2-2*x-3';
  const xv = E('-(-2)/(2*1)');
  check('tr-113 vertex x = 1', xv, 1);
  check('tr-113 vertex height -4', f(fx)(xv), E('1-2-3'));
  check('tr-113 vertex is a min', kind(fx, 1), 1);
  // f = 4 → x^2 - 2x - 7 = 0
  check('tr-113 f=4 discriminant 32', E('(-2)^2 - 4*1*(-7)'), 32);
  check('tr-113 f=4 has 2 solutions', quadCount(1, -2, -7), 2);
  check('tr-113 grid f=4 crossings', crossings(`${fx} - 4`), 2);
  // f = -4 → x^2 - 2x + 1 = 0 → (x-1)^2 = 0
  check('tr-113 f=-4 discriminant 0', E('(-2)^2 - 4*1*1'), 0);
  check('tr-113 f=-4 has 1 solution', quadCount(1, -2, 1), 1);
  check('tr-113 (x-1)^2 form matches', f('(x-1)^2')(2.3), f(`${fx} + 4`)(2.3));
  check('tr-113 total 2 + 1 = 3', quadCount(1, -2, -7) + quadCount(1, -2, 1), E('3'));
  // |f| = 4: two crossings plus a touch at x=1 (|f|(1) = 4, |f| < 4 on both sides)
  const g = f(`abs(${fx})`);
  check('tr-113 |f|(1) = 4', g(1), 4);
  check('tr-113 |f| touches y=4 at x=1 from below', g(0.9) < 4 && g(1.1) < 4 ? 1 : 0, 1);
  check('tr-113 |f| - 4 crossings', crossings(`abs(${fx}) - 4`), 2);
  check('tr-113 distractor "one": counts only the touch', 1, quadCount(1, -2, 1));
  check('tr-113 distractor "four": treats f=-4 as two', 2 + 2, 4);
}

// rq-sub-tr-201 — f = 6/(x-2)+1 moved 3 left and 4 down → g = 6/(x+1)-3, crosses the x-axis at (1,0)
{
  const fx = '6/(x-2)+1';
  const gx = '6/(x+1)-3';
  // g IS f shifted: g(t) = f(t + 3) - 4 for every t off the poles
  for (const t of [-4, -2.5, 0, 2, 5]) check(`tr-201 g(t) = f(t+3)-4 at t=${t}`, f(gx)(t), f(fx)(t + 3) - 4);
  check('tr-201 f VA at 2', Math.abs(f(fx)(2 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-201 f HA 1', f(fx)(1e7), 1, 1e-5);
  check('tr-201 g VA at -1', Math.abs(f(gx)(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-201 VA moved 2 - 3', 2 - 3, E('-1'));
  check('tr-201 g HA -3', f(gx)(1e7), E('1-4'), 1e-5);
  // the x-intercept: exactly one, at x = 1
  check('tr-201 g crosses the x-axis once', crossings(gx, [-1]), 1);
  check('tr-201 g(1) = 0', f(gx)(1), 0);
  check('tr-201 root from 6/(x+1) = 3', E('6/3 - 1'), 1);
  // f's own x-intercept (-4, 0) lands on g at (-7, -4) — the same shift, checked on a point
  check('tr-201 f(-4) = 0', f(fx)(-4), 0);
  check('tr-201 g(-7) = -4', f(gx)(-4 - 3), E('0-4'));
  // distractor B: shifting RIGHT 3 gives 6/(x-5)-3, whose root is 7
  check('tr-201 distractor B root at 7', f('6/(x-5)-3')(7), 0);
  check('tr-201 distractor B has one crossing', crossings('6/(x-5)-3', [5]), 1);
  // distractor C: x = -1 is the pole, not a point of the graph
  check('tr-201 g undefined at -1', Number.isFinite(f(gx)(-1)) ? 1 : 0, 0);
  // distractor D: the graph does cross y = 0 even though the HA is y = -3
  check('tr-201 g(0) is above the x-axis', f(gx)(0) > 0 ? 1 : 0, 1);
  check('tr-201 g(3) is below the x-axis', f(gx)(3) < 0 ? 1 : 0, 1);
}

// rq-sub-tr-202 — 5/x: (up 2, then ×3) vs (×3, then up 2). The reversed order has HA y = 2
{
  const base = '5/x';
  const orderGiven = '3*(5/x + 2)'; // up 2 first → the shift is multiplied
  const orderSwapped = '3*(5/x) + 2'; // ×3 first → the shift is not multiplied
  check('tr-202 f HA 0', f(base)(1e7), 0, 1e-6);
  check('tr-202 given order HA', f(orderGiven)(1e8), E('3*2'), 1e-6);
  check('tr-202 swapped order HA', f(orderSwapped)(1e8), E('2'), 1e-6);
  check('tr-202 the two orders differ by 4 (x=1)', f(orderGiven)(1) - f(orderSwapped)(1), E('6-2'));
  check('tr-202 the two orders differ by 4 (x=-2.5)', f(orderGiven)(-2.5) - f(orderSwapped)(-2.5), 4);
  check('tr-202 swapped order equals 15/x + 2', f(orderSwapped)(3), f('15/x + 2')(3));
  check('tr-202 both keep the VA at 0', Math.abs(f(orderSwapped)(1e-9)) > 1e6 ? 1 : 0, 1);
  check('tr-202 wrong 6 is the given order', f(orderGiven)(1e8), 6, 1e-6);
  check('tr-202 wrong 0 is f itself', f(base)(1e8), 0, 1e-6);
  // 2026-09-06 exam-style rewrite: g = 3f(x) + 2 is now the GIVEN function, and
  // the ask is its two asymptotes plus the x-intercept the shift creates.
  const gx = '15/x + 2';
  check('tr-202 g equals 3f + 2 everywhere', f(gx)(4), 3 * f(base)(4) + 2);
  check('tr-202 g blows up at 0, so the vertical asymptote is x = 0', Math.abs(f(gx)(1e-9)) > 1e6 ? 1 : 0, 1);
  check('tr-202 g tends to 2, so the horizontal asymptote is y = 2', f(gx)(1e8), 2, 1e-6);
  check('tr-202 the x-intercept: g(-7.5) = 0', f(gx)(-7.5), 0, 1e-12);
  check('tr-202 f itself had no x-intercept: 5/x is never 0', crossings(base, [0]), 0);
  check('tr-202 wrong -2.5 is the intercept of the OTHER order', f(orderGiven)(-2.5), 0, 1e-12);
  check('tr-202 wrong +7.5: there g is positive, not zero', f(gx)(7.5) > 0 ? 1 : 0, 1);
}

// rq-sub-tr-203 — sqrt(x-1) reflected in the y-axis then moved 5 right → sqrt(4-x), endpoint (4,0)
{
  const base = 'sqrt(x-1)';
  const gx = 'sqrt(4-x)';
  check('tr-203 f endpoint at x=1', f(base)(1), 0);
  check('tr-203 f undefined left of 1', notReal(f(base)(1 - 1e-6)) ? 1 : 0, 1);
  // g(x) = f(-(x-5)) pointwise
  for (const t of [-6, -2, 0, 3, 3.9]) check(`tr-203 g(t) = f(-(t-5)) at t=${t}`, f(gx)(t), f(base)(-(t - 5)));
  // the reflected graph f(-x) = sqrt(-x-1) ends at x = -1 and lives to its left
  check('tr-203 reflected endpoint height', f('sqrt(-x-1)')(-1), 0);
  check('tr-203 reflected graph undefined right of -1', notReal(f('sqrt(-x-1)')(-1 + 1e-6)) ? 1 : 0, 1);
  check('tr-203 reflected graph defined left of -1', f('sqrt(-x-1)')(-2), E('sqrt(1)'));
  check('tr-203 endpoint x = -1 + 5', -1 + 5, E('4'));
  checkSet('tr-203 endpoint (4, 0)', [4, f(gx)(4)], [E('4'), E('0')]);
  check('tr-203 g undefined right of 4', notReal(f(gx)(4 + 1e-6)) ? 1 : 0, 1);
  check('tr-203 g(0) = 2', f(gx)(0), E('sqrt(4)'));
  check('tr-203 g is decreasing', f(gx)(0) > f(gx)(3) ? 1 : 0, 1);
  // wrongs
  check('tr-203 wrong (6,0): no reflection, endpoint of sqrt(x-6)', f('sqrt(x-6)')(6), 0);
  check('tr-203 wrong (6,0) came from 1 + 5', 1 + 5, 6);
  check('tr-203 wrong (-6,0): shifted left instead', -1 - 5, E('-6'));
  check('tr-203 wrong (4,2): height 2 belongs to x = 0', f(gx)(0), 2);
}

// rq-sub-tr-204 — 4/x^2 on [1,4]: area 3; +1 gives 6 and ×2 gives 6 — equal
{
  const fx = '4/x^2';
  icheck('tr-204 area of f on [1,4]', fx, 1, 4, E('4*(1/1 - 1/4)'));
  icheck('tr-204 area of g = f + 1', `${fx} + 1`, 1, 4, E('3 + 1*3'));
  icheck('tr-204 area of h = 2f', `2*(${fx})`, 1, 4, E('2*3'));
  check('tr-204 the interval is 3 wide', 4 - 1, E('3'));
  check('tr-204 the added rectangle is 1*3', 1 * (4 - 1), E('3'));
  check('tr-204 both areas are equal', E('3 + 1*3') - E('2*3'), 0);
  check('tr-204 distractor B: 3 + 2 = 5 for h', 3 + 2, 5);
  check('tr-204 distractor B difference 6 - 5', 6 - 5, 1);
  check('tr-204 distractor C: 3 + 1 = 4 for g', 3 + 1, 4);
  check('tr-204 distractor C difference 6 - 4', 6 - 4, 2);
  check('tr-204 f is undefined at 0', Number.isFinite(f(fx)(0)) ? 1 : 0, 0);
}

// rq-sub-tr-211 — h = (2x-7)/(x-3) came from f moved 5 right then reflected in the x-axis
{
  const h = '(2*x-7)/(x-3)';
  const A = '(-2*x-3)/(x+2)'; // the answer
  const B = '(2*x+3)/(x+2)'; // forgot the reflection
  const C = '(-2*x+17)/(x-8)'; // undid the shift in the wrong direction
  const D = '(-2*x-3)/(x-3)'; // substituted in the numerator only
  const S = [-5, -1, 0, 1, 4, 6, 10];
  for (const t of S) check(`tr-211 -A(t-5) = h(t) at t=${t}`, -f(A)(t - 5), f(h)(t));
  check('tr-211 A VA at -2', Math.abs(f(A)(-2 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-211 A VA + 5 = h VA', -2 + 5, E('3'));
  check('tr-211 h VA at 3', Math.abs(f(h)(3 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-211 A HA -2', f(A)(1e7), E('-2/1'), 1e-5);
  check('tr-211 reflection turns -2 into 2', -1 * f(A)(1e7), E('2'), 1e-5);
  check('tr-211 h HA 2', f(h)(1e7), 2, 1e-5);
  check('tr-211 A root at -1.5', f(A)(E('-3/2')), 0);
  check('tr-211 h root at 3.5', f(h)(E('7/2')), 0);
  check('tr-211 the roots differ by the shift', E('7/2') - E('-3/2'), 5);
  // each distractor is the mistake its note names
  for (const t of [-1, 0, 4, 6]) check(`tr-211 distractor B = h WITHOUT the reflection (t=${t})`, f(B)(t - 5), f(h)(t));
  for (const t of [-1, 0, 4, 6]) check(`tr-211 distractor C = -h(t-5) (t=${t})`, f(C)(t), -f(h)(t - 5));
  for (const t of [-1, 0, 4, 6]) check(`tr-211 distractor D substitutes in the numerator only (t=${t})`, f(D)(t), f('-(2*(x+5)-7)/(x-3)')(t));
  check('tr-211 distractor C VA at 8', Math.abs(f(C)(8 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-211 distractor D VA still at 3', Math.abs(f(D)(3 + 1e-7)) > 1e6 ? 1 : 0, 1);
}

// rq-sub-tr-212 — g = 1/(sqrt(x+3) - 2): VA x = 1, HA y = 0, endpoint (-3, -0.5)
{
  const gx = '1/(sqrt(x+3)-2)';
  const den = 'sqrt(x+3)-2';
  check('tr-212 domain edge: undefined left of -3', notReal(f(gx)(-3 - 1e-6)) ? 1 : 0, 1);
  check('tr-212 defined at -3', Number.isFinite(f(gx)(-3)) ? 1 : 0, 1);
  check('tr-212 endpoint height -0.5', f(gx)(-3), E('1/(0-2)'));
  // the denominator vanishes at x = 1 and nowhere else in the domain
  check('tr-212 denominator zero at 1', f(den)(1), 0);
  check('tr-212 x = 1 from squaring both sides', E('2^2 - 3'), 1);
  check('tr-212 denominator crossings on the domain', crossings(den, [], -3, 40, 20000), 1);
  check('tr-212 VA: g blows up from the left', f(gx)(1 - 1e-6) < -1e5 ? 1 : 0, 1);
  check('tr-212 VA: g blows up from the right', f(gx)(1 + 1e-6) > 1e5 ? 1 : 0, 1);
  check('tr-212 HA 0 far out', f(gx)(1e8), 0, 1e-3);
  check('tr-212 g never reaches 0', crossings(gx, [1], -3, 60, 20000), 0);
  // the sign table: negative on [-3, 1), positive after
  check('tr-212 sign left of the VA', f(gx)(0) < 0 ? 1 : 0, 1);
  check('tr-212 sign right of the VA', f(gx)(3) > 0 ? 1 : 0, 1);
  check('tr-212 helper point (6, 1)', f(gx)(6), E('1/(3-2)'));
  // wrongs
  check('tr-212 wrong VA -3: denominator there is -2, not 0', f(den)(-3), -2);
  check('tr-212 wrong VA 4: denominator there is not 0', Math.abs(f(den)(4)) > 0.1 ? 1 : 0, 1);
  check('tr-212 wrong HA 2: g(1e8) is not 2', Math.abs(f(gx)(1e8) - 2) > 1 ? 1 : 0, 1);
}

// rq-sub-tr-213 — 8/x^2 stretched by k then moved 6 down; the two roots are 4 apart → k = 3
{
  const g = (k: number) => f(`${8 * k}/x^2 - 6`);
  const root = (k: number) => Math.sqrt((8 * k) / 6); // 8k/x^2 = 6
  check('tr-213 root formula solves g = 0 (k=3)', g(3)(root(3)), 0, 1e-9);
  check('tr-213 root formula solves g = 0 (k=7)', g(7)(root(7)), 0, 1e-9);
  check('tr-213 distance is twice the root', 2 * root(3), E('4'));
  check('tr-213 k from 2*sqrt(8k/6) = 4', E('(2^2)*6/8'), 3);
  check('tr-213 k=3 roots at ±2', root(3), E('2'));
  check('tr-213 g(2) = 0 with k=3', g(3)(2), 0);
  check('tr-213 g(-2) = 0 with k=3', g(3)(-2), 0);
  check('tr-213 exactly two crossings', crossings('24/x^2 - 6', [0]), 2);
  check('tr-213 HA -6', g(3)(1e8), E('0-6'), 1e-9);
  check('tr-213 f HA 0 before the shift', f('24/x^2')(1e8), 0, 1e-9);
  check('tr-213 VA stays at 0', Math.abs(g(3)(1e-9)) > 1e6 ? 1 : 0, 1);
  check('tr-213 g is even (roots symmetric)', g(3)(2.7) - g(3)(-2.7), 0);
  // wrongs
  check('tr-213 wrong k=12 puts the roots at ±4', root(12), E('4'));
  check('tr-213 wrong k=12 gives distance 8', 2 * root(12), 8);
  check('tr-213 wrong HA 6: g(1e8) is not 6', Math.abs(g(3)(1e8) - 6) > 1 ? 1 : 0, 1);
  check('tr-213 wrong HA 0: g(1e8) is not 0', Math.abs(g(3)(1e8)) > 1 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// Round 3 (2026-09-06) — ids rq-sub-tr-3NN. Two mid questions and three hard
// ones that climb: one shifted quotient read end to end, a chain that recovers
// a transformation from two stated features and consumes it, and a full |f|
// investigation. Every number below is COMPUTED from the question's own data —
// pointwise identities for the transformations, mathjs derivatives for the
// extrema, grid crossings for the counts — never re-applied from the algebra
// the solution writes.
// ---------------------------------------------------------------------------

// rq-sub-tr-301 — f = (5x+2)/(x+3) moved 2 LEFT and 4 DOWN → g = (x-8)/(x+5)
{
  const fx = '(5*x+2)/(x+3)';
  const gx = '(x-8)/(x+5)';
  for (const t of [-8, -3.5, 0, 2, 7]) check(`tr-301 g(t) = f(t+2) - 4 at t=${t}`, f(gx)(t), f(fx)(t + 2) - 4);
  check('tr-301 the combined fraction equals the un-combined one', f(gx)(6), f('(5*(x+2)+2)/((x+2)+3) - 4')(6));
  check('tr-301 f blows up at -3', Math.abs(f(fx)(-3 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-301 g blows up at -5, two units to the LEFT', Math.abs(f(gx)(-5 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-301 -3 - 2 = -5', -3 - 2, E('-5'));
  check('tr-301 the numerator at -5 is -13, not zero', f('x-8')(-5), -13);
  check('tr-301 f tends to 5', f(fx)(1e7), 5, 1e-5);
  check('tr-301 g tends to 5 - 4 = 1', f(gx)(1e7), E('5-4'), 1e-5);
  check('tr-301 g(8) = 0', f(gx)(8), 0);
  check('tr-301 g crosses the x-axis exactly once', crossings(gx, [-5]), 1);
  check('tr-301 g(0) = -1.6', f(gx)(0), E('-8/5'));
  // wrong 1: the shift taken to the RIGHT — f(x-2) - 4 = (x-12)/(x+1)
  const right = '(x-12)/(x+1)';
  for (const t of [-4, 0, 3, 9]) check(`tr-301 wrong branch = f(t-2)-4 at t=${t}`, f(right)(t), f(fx)(t - 2) - 4);
  check('tr-301 wrong branch VA at -1', Math.abs(f(right)(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-301 wrong branch root at 12', f(right)(12), 0);
  check('tr-301 wrong branch y-intercept -12', f(right)(0), -12);
  // wrong 2: the drop never reached the horizontal asymptote
  check('tr-301 wrong HA 5 is f itself, before the drop', f(fx)(1e7), 5, 1e-5);
  // wrong 3: sign slip on the root
  check('tr-301 wrong root -8: the numerator there is -16, not 0', f('x-8')(-8), -16);
  check('tr-301 g(-8) is not 0 either', Math.abs(f(gx)(-8)) > 1 ? 1 : 0, 1);
}

// rq-sub-tr-302 — f = (2x+8)/(x+1) reflected in the x-axis and THEN moved 5 up
{
  const fx = '(2*x+8)/(x+1)';
  const A = '(3*x-3)/(x+1)'; // -f + 5 — the given order
  const B = '(-7*x-13)/(x+1)'; // -(f + 5) — the reversed order
  const C = '(-2*x-3)/(x+1)'; // the 5 added inside the numerator only
  const D = '(7*x-13)/(x-1)'; // reflected in the y-axis by mistake
  for (const t of [-4, -2, 0, 3, 8]) check(`tr-302 A(t) = -f(t) + 5 at t=${t}`, f(A)(t), -f(fx)(t) + 5);
  check('tr-302 f blows up at -1', Math.abs(f(fx)(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-302 A blows up at -1 too: the x-axis reflection does not move it', Math.abs(f(A)(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-302 the numerator of A at -1 is -6, not zero', f('3*x-3')(-1), -6);
  check('tr-302 f tends to 2', f(fx)(1e7), 2, 1e-5);
  check('tr-302 A tends to -2 + 5 = 3', f(A)(1e7), E('-2+5'), 1e-5);
  check('tr-302 A(1) = 0', f(A)(1), 0);
  check('tr-302 A(0) = -3', f(A)(0), -3);
  for (const t of [-4, 0, 3]) check(`tr-302 B(t) = -(f(t) + 5) at t=${t}`, f(B)(t), -(f(fx)(t) + 5));
  check('tr-302 B tends to -7 — the reversed order multiplies the shift too', f(B)(1e7), -7, 1e-5);
  for (const t of [-4, 0, 3]) check(`tr-302 C(t) adds the 5 inside the numerator at t=${t}`, f(C)(t), f('(-(2*x+8)+5)/(x+1)')(t));
  check('tr-302 C tends to -2: the shift never reached the fraction', f(C)(1e7), -2, 1e-5);
  for (const t of [-4, 0, 3]) check(`tr-302 D(t) = f(-t) + 5 at t=${t}`, f(D)(t), f(fx)(-t) + 5);
  check('tr-302 D blows up at 1: the y-axis reflection DID move the asymptote', Math.abs(f(D)(1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-302 D tends to 7', f(D)(1e7), 7, 1e-5);
  check('tr-302 the four options really are four different functions', new Set([A, B, C, D].map((e) => f(e)(4).toFixed(6))).size, 4);
}

// rq-sub-tr-311 — f = 12/(x-1) moved 2 right and 3 down → g = (21-3x)/(x-3),
// positive only between its vertical asymptote and its root
{
  const fx = '12/(x-1)';
  const gx = '(21-3*x)/(x-3)';
  for (const t of [-5, 0, 2, 5, 11]) check(`tr-311 g(t) = f(t-2) - 3 at t=${t}`, f(gx)(t), f(fx)(t - 2) - 3);
  check('tr-311 the combined fraction equals the un-combined one', f(gx)(8), f('12/(x-3)-3')(8));
  check('tr-311 g blows up at 3', Math.abs(f(gx)(3 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-311 1 + 2 = 3: the vertical asymptote moved right', 1 + 2, E('3'));
  check('tr-311 the numerator at 3 is 12, not zero', f('21-3*x')(3), 12);
  check('tr-311 f tends to 0', f(fx)(1e7), 0, 1e-5);
  check('tr-311 g tends to 0 - 3 = -3', f(gx)(1e7), E('0-3'), 1e-5);
  check('tr-311 g(7) = 0', f(gx)(7), 0);
  check('tr-311 g crosses the x-axis exactly once', crossings(gx, [3]), 1);
  check('tr-311 g(0) = -7', f(gx)(0), E('21/(-3)'));
  // the sign table, one sample per column plus the two open ends
  check('tr-311 negative left of 3', f(gx)(1) < 0 ? 1 : 0, 1);
  check('tr-311 positive between 3 and 7', f(gx)(5) > 0 ? 1 : 0, 1);
  check('tr-311 negative right of 7', f(gx)(9) < 0 ? 1 : 0, 1);
  check('tr-311 positive at both open ends of that interval', f(gx)(3.01) > 0 && f(gx)(6.99) > 0 ? 1 : 0, 1);
  check('tr-311 g is undefined at 3, so the interval is open there', Number.isFinite(f(gx)(3)) ? 1 : 0, 0);
  // wrong 1: shifted LEFT — f(x+2) - 3 = (9-3x)/(x+1)
  const left = '(9-3*x)/(x+1)';
  for (const t of [-4, 0, 4]) check(`tr-311 wrong branch = f(t+2)-3 at t=${t}`, f(left)(t), f(fx)(t + 2) - 3);
  check('tr-311 wrong branch VA at -1', Math.abs(f(left)(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-311 wrong branch root at 3', f(left)(3), 0);
  check('tr-311 wrong branch y-intercept 9', f(left)(0), 9);
  // wrong 2 and 3
  check('tr-311 wrong HA 0 is f itself, before the drop', f(fx)(1e7), 0, 1e-5);
  check('tr-311 wrong y-intercept +7: the denominator at 0 is -3', f('x-3')(0), -3);
}

// rq-sub-tr-312 — f = (x^2+16)/x. The single shift is RECOVERED from the moved
// asymptote and the moved minimum, then consumed to find the new maximum.
{
  const fx = '(x^2+16)/x';
  const gx = '(x^2-16*x+71)/(x-5)';
  dcheck("tr-312 the quotient rule gives f' = (x^2-16)/x^2", fx, '(x^2-16)/x^2');
  dcheck('tr-312 and the un-collected form agrees', fx, '(2*x*x-(x^2+16))/x^2');
  checkSet("tr-312 f' vanishes exactly at 4 and -4", [4, -4].filter((r) => Math.abs(f('x^2-16')(r)) < 1e-12), [4, -4]);
  check('tr-312 f(4) = 8, the given minimum height', f(fx)(4), E('32/4'));
  check('tr-312 and 4 really is a minimum', kind(fx, 4), 1);
  check('tr-312 f(-4) = -8', f(fx)(-4), E('32/(-4)'));
  check('tr-312 and -4 really is a maximum', kind(fx, -4), -1);
  check('tr-312 f blows up at 0', Math.abs(f(fx)(1e-9)) > 1e6 ? 1 : 0, 1);
  // the two stated features each give one component of the shift
  check('tr-312 horizontal size from the asymptote: 5 - 0', 5 - 0, E('5'));
  check('tr-312 the same size from the minimum: 9 - 4', 9 - 4, E('5'));
  check('tr-312 vertical size from the height: 8 - 2', 8 - 2, E('6'));
  // g IS f moved 5 right and 6 down
  for (const t of [-3, 1, 3, 7, 12]) check(`tr-312 g(t) = f(t-5) - 6 at t=${t}`, f(gx)(t), f(fx)(t - 5) - 6);
  check('tr-312 the combined fraction equals the un-combined one', f(gx)(2), f('((x-5)^2+16)/(x-5) - 6')(2));
  check('tr-312 g(9) = 2, the stated new minimum', f(gx)(9), 2);
  check('tr-312 and 9 is a minimum of g', kind(gx, 9), 1);
  check('tr-312 g blows up at 5', Math.abs(f(gx)(5 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-312 the maximum of g sits at -4 + 5', -4 + 5, E('1'));
  check('tr-312 its height is -8 - 6', -8 - 6, E('-14'));
  check('tr-312 g(1) = -14', f(gx)(1), -14);
  check('tr-312 and 1 is a maximum of g', kind(gx, 1), -1);
  // wrongs
  check('tr-312 wrong (-4,-8) is the maximum BEFORE the shift', f(fx)(-4), -8);
  check('tr-312 wrong height -2 came from adding 6 instead of subtracting', -8 + 6, -2);
  check('tr-312 g(1) is nowhere near -2', Math.abs(f(gx)(1) + 2) > 1 ? 1 : 0, 1);
  const wrongShift = '((x-9)^2+16)/(x-9) - 2';
  check('tr-312 wrong sizes 9 and 2 put the asymptote at 9', Math.abs(f(wrongShift)(9 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-312 and that minimum height is 6, not 2', f(wrongShift)(13), E('8-2'));
}

// rq-sub-tr-313 — f = (x^2-9)/(x^2+3) and g = |f|: the fold turns the minimum
// (0,-3) into the maximum (0,3) and the two roots into minima
const TR313_G = 'abs((x^2-9)/(x^2+3))';
{
  const fx = '(x^2-9)/(x^2+3)';
  const gx = TR313_G;
  check('tr-313 the denominator never vanishes', crossings('x^2+3'), 0);
  checkSet('tr-313 f vanishes exactly at 3 and -3', [3, -3].filter((r) => Math.abs(f('x^2-9')(r)) < 1e-12), [3, -3]);
  check('tr-313 f(0) = -3', f(fx)(0), E('-9/3'));
  dcheck("tr-313 the quotient rule gives f' = 24x/(x^2+3)^2", fx, '24*x/(x^2+3)^2');
  dcheck('tr-313 and the un-collected form agrees', fx, '(2*x*(x^2+3)-(x^2-9)*2*x)/(x^2+3)^2');
  check("tr-313 f' changes sign exactly once", crossings('24*x'), 1);
  check('tr-313 (0,-3) is a minimum of f', kind(fx, 0), 1);
  check('tr-313 f is negative between its roots', f(fx)(1) < 0 ? 1 : 0, 1);
  check('tr-313 and positive outside them', f(fx)(4) > 0 && f(fx)(-4) > 0 ? 1 : 0, 1);
  // the fold
  check('tr-313 g(0) = 3: the depth -3 became the height 3', f(gx)(0), 3);
  check('tr-313 and (0,3) is a MAXIMUM of g', kind(gx, 0), -1);
  check('tr-313 g(3) = 0', f(gx)(3), 0);
  check('tr-313 (3,0) is a minimum of g', kind(gx, 3), 1);
  check('tr-313 g(-3) = 0', f(gx)(-3), 0);
  check('tr-313 (-3,0) is a minimum of g', kind(gx, -3), 1);
  check('tr-313 g is even, so the two minima are symmetric', f(gx)(2.7) - f(gx)(-2.7), 0);
  check('tr-313 g falls from the peak to the right root', f(gx)(1) > f(gx)(2) ? 1 : 0, 1);
  check('tr-313 and rises again beyond it', f(gx)(4) < f(gx)(5) ? 1 : 0, 1);
  check('tr-313 g never touches the x-axis anywhere else', crossings(gx), 0);
  check('tr-313 both graphs tend to 1', f(gx)(1e7), 1, 1e-6);
  check('tr-313 f tends to the same height', f(fx)(1e7), 1, 1e-6);
  check('tr-313 the outer branches stay below 1', f(gx)(1e4) < 1 ? 1 : 0, 1);
  // wrongs
  check('tr-313 wrong height -3 is f(0), before the fold', f(fx)(0), -3);
  check('tr-313 wrong height 9 is the numerator alone at 0', Math.abs(f('x^2-9')(0)), 9);
  check('tr-313 the real height divides by the denominator too', E('9/3'), 3);
  check('tr-313 wrong "both minima at 3": g(-3) is 0 as well', f(gx)(-3), 0);
}

// rq-sub-tr-313's figure — DRAWN by lib/fn-figure from |f| itself, which
// re-derives the horizontal asymptote and each marked point before it will
// render anything.  Emit the SVG with:
//   npx tsx scripts/_rq-extra-checks/transformations.ts emit
{
  const spec = {
    f: (x: number) => Math.abs(x * x - 9) / (x * x + 3),
    xMin: -9,
    xMax: 9,
    // Only two labels: fn-figure alternates a label above / below the point, and
    // the "above" one is printed straight through the rising branch. The left
    // minimum keeps its dot and is named in the caption instead.
    points: [
      { x: 0, y: 3, label: '(0, 3)' },
      { x: 3, y: 0, label: '(3, 0)' },
      { x: -3, y: 0 },
    ],
    hAsymptotes: [1],
  };
  const { svg, errors } = fnFigure(spec);
  if (errors.length) console.log(errors.map((e) => `  ${e}`).join('\n'));
  check('tr-313 fig: lib/fn-figure accepts every feature the caption asserts', errors.length, 0);
  check('tr-313 fig: a curve was actually drawn', /<polyline/.test(svg) ? 1 : 0, 1);
  check('tr-313 fig: the drawn function is the same |f| checked above', spec.f(2.4), f(TR313_G)(2.4));
  // …and one thing no numeric assertion sees: two labels printed on top of each
  // other. Boxes are estimated from the font size (0.6em per character) and the
  // text-anchor, and no two of them may intersect.
  const boxes = [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"([^>]*)>([^<]*)<\/text>/g)].map((m) => {
    const [x, y, fs] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const anchor = /text-anchor="(\w+)"/.exec(m[4])?.[1] ?? 'start';
    const w = m[5].length * fs * 0.6;
    const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { left, right: left + w, top: y - fs, bottom: y + fs * 0.25, t: m[5] };
  });
  const clashes = boxes.flatMap((a, i) =>
    boxes.slice(i + 1).filter((b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom).map((b) => `${a.t} / ${b.t}`),
  );
  if (clashes.length) console.log(`  overlapping labels: ${clashes.join(', ')}`);
  check('tr-313 fig: no two labels are printed on top of each other', clashes.length, 0);
  check('tr-313 fig: every label the caption names was drawn', boxes.filter((b) => /^\(|^y =/.test(b.t)).length, 3);
  if (process.argv.includes('emit')) console.log(svg);
}

summary('transformations');
