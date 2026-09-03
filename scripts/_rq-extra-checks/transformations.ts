// Numeric re-derivation of content/lessons/math5/rq-extra/transformations.ts (rq-sub-tr-101…113).
// Every shifted / stretched / reflected point is COMPUTED by applying the transformation to a
// concrete model function that has the stated feature; every "how many solutions" claim is a
// counted crossing (grid sign changes) or a discriminant computed from k; every distractor and
// wrongAnswer note is re-enacted as the mistake it names and must land on THAT option.
import { check, dcheck, checkSet, summary, math, E } from './_lib';

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

// rq-sub-tr-102 — min (1,-4), g = 3f → min (1,-12) (MCQ)
{
  const fm = '(x-1)^2 - 4'; // model with minimum at (1, -4)
  check('tr-102 model f(1) = -4', f(fm)(1), -4);
  check('tr-102 model has a min at x=1', kind(fm, 1), 1);
  const g = `3*(${fm})`;
  check('tr-102 g(1) = 3*(-4) = -12', f(g)(1), E('3*(-4)'));
  check('tr-102 x of the extremum unchanged (g still min at x=1)', kind(g, 1), 1);
  check('tr-102 g(3) is not an extremum (distractor B x=3)', kind(g, 3), 0);
  check('tr-102 distractor C = f(x) - 3 at x=1', f(`${fm} - 3`)(1), -7);
  check('tr-102 distractor D = -3f(1) = 12', f(`-3*(${fm})`)(1), 12);
  check('tr-102 distractor D would be a max', kind(`-3*(${fm})`, 1), -1);
}

// rq-sub-tr-103 — min (4,-2), g = f(-x) → min (-4,-2) (MCQ)
{
  const fm = '(x-4)^2 - 2'; // model with minimum at (4, -2)
  check('tr-103 model min at (4,-2)', f(fm)(4), -2);
  check('tr-103 model kind at 4 is min', kind(fm, 4), 1);
  const g = fm.replace(/x/g, '(-x)'); // f(-x)
  check('tr-103 g(-4) = f(4) = -2', f(g)(-4), f(fm)(4));
  check('tr-103 g has a MIN at x=-4', kind(g, -4), 1);
  check('tr-103 g(4) is not an extremum', kind(g, 4), 0);
  // distractor B: -f(x) → (4, 2) and a max
  check('tr-103 distractor B height -f(4) = 2', f(`-(${fm})`)(4), 2);
  check('tr-103 distractor B type max', kind(`-(${fm})`, 4), -1);
  // distractor D: -f(-x) puts the point at (-4, 2)
  check('tr-103 distractor D height -f(-4) = 2', f(`-(${g})`)(-4), 2);
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

// rq-sub-tr-106 — VA x=1, HA y=4; g = f(x+2) - 3 → VA x=-1, HA y=1 (critique MCQ)
{
  const fm = '4 + 1/(x-1)'; // model: VA x=1, HA y=4
  check('tr-106 model VA at 1', Math.abs(f(fm)(1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-106 model HA 4', f(fm)(1e7), 4, 1e-6);
  const g = f(`4 + 1/((x+2)-1) - 3`);
  check('tr-106 g VA at x=-1', Math.abs(g(-1 + 1e-7)) > 1e6 ? 1 : 0, 1);
  check('tr-106 VA = 1 - 2', 1 - 2, E('-1'));
  check('tr-106 g HA = 1', g(1e7), 1, 1e-6);
  check('tr-106 HA = 4 - 3', 4 - 3, E('1'));
  // student's VA x=3 is wrong: g is finite there
  check('tr-106 g(3) finite (no asymptote at 3)', Number.isFinite(g(3)) ? 1 : 0, 1);
  check('tr-106 student VA came from 1 + 2', 1 + 2, 3);
  // distractor C: 4 + 3 = 7 is the sign-flipped vertical shift
  check('tr-106 distractor C 4 + 3 = 7', 4 + 3, 7);
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

// rq-sub-tr-111 — odd with max (3,5) → min (-3,-5) (MCQ)
{
  // odd model a x^3 + b x with f(3) = 5, f'(3) = 0: 27a + 3b = 5, 27a + b = 0
  const b = E('5/2'), a = E('-5/54');
  const fm = `${a}*x^3 + ${b}*x`;
  check('tr-111 model f(3) = 5', f(fm)(3), 5);
  check('tr-111 model max at 3', kind(fm, 3), -1);
  check('tr-111 model f\'(3) = 0', math.derivative(fm, 'x').evaluate({ x: 3 }) as number, 0);
  check('tr-111 model is odd', f(fm)(-1.7) + f(fm)(1.7), 0);
  check('tr-111 f(-3) = -f(3) = -5', f(fm)(-3), -f(fm)(3));
  check('tr-111 f(-3) value', f(fm)(-3), E('-5'));
  check('tr-111 (-3,-5) is a MIN', kind(fm, -3), 1);
  // distractor D note: x^3 - 3x has its max left of the origin and its min right of it
  checkSet('tr-111 note: x^3-3x extrema x', [-1, 1].map(x => math.derivative('x^3-3*x', 'x').evaluate({ x }) as number), [0, 0]);
  check('tr-111 note: x^3-3x max at x=-1', kind('x^3-3*x', -1), -1);
  check('tr-111 note: x^3-3x min at x=1', kind('x^3-3*x', 1), 1);
  // distractor B: even symmetry would give (-3, 5)
  check('tr-111 distractor B: even model f(-3) = 5', f('5 - (x^2-9)^2')(-3), 5);
  // distractor C: -f(x) gives (3, -5)
  check('tr-111 distractor C: -f(3) = -5', -f(fm)(3), -5);
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

summary('transformations');
