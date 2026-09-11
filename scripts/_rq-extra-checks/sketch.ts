// Numeric re-derivation of content/lessons/math5/rq-extra/sketch.ts (rq-sub-sk-101…112).
// The stage is conceptual (branches, escape directions, reading f'), so every claim is
// re-enacted on a MODEL function that has exactly the features the question states:
// branch count = (denominator roots where the numerator does not vanish) + 1, escape
// direction = sign of f just beside the asymptote, extremum type = sign order of f'
// on both sides, "forced extremum" = the asymptote height compared with the extremum
// height. Distractor / wrongAnswer notes are re-enacted as the mistake they name.
import { check, dcheck, checkSet, summary, math } from './_lib';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number) => c.evaluate({ x: v }) as number;
};
/** real roots of expr in [lo, hi] via sign changes on a grid + bisection (simple roots) */
function roots(expr: string, lo = -20, hi = 20): number[] {
  const g = f(expr);
  const out: number[] = [];
  const push = (r: number) => { if (!out.some(o => Math.abs(o - r) < 1e-6)) out.push(r); };
  const n = 8000, h = (hi - lo) / n;
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = a + h;
    let fa = g(a), fb = g(b);
    if (fa === 0) { push(a); continue; }
    if (fa * fb > 0) continue;
    for (let k = 0; k < 60; k++) {
      const m = (a + b) / 2, fm = g(m);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    push((a + b) / 2);
  }
  return out;
}
const HA = (expr: string) => (f(expr)(1e6) + f(expr)(-1e6)) / 2;
const limitAt = (expr: string, a: number) => (f(expr)(a + 1e-6) + f(expr)(a - 1e-6)) / 2;
const blowsUp = (expr: string, a: number) => Math.abs(f(expr)(a + 1e-7)) > 1e5 ? 1 : 0;
/** vertical asymptotes of num/den = denominator roots where the numerator is non-zero */
const vAsyms = (num: string, den: string) => roots(den).filter(r => Math.abs(f(num)(r)) > 1e-9);
const holes = (num: string, den: string) => roots(den).filter(r => Math.abs(f(num)(r)) <= 1e-9);
/** number of branches = maximal intervals of the domain = vertical asymptotes + 1 */
const branches = (num: string, den: string) => vAsyms(num, den).length + 1;
/** local extremum type at r from the sign order of f' on both sides: 1 = min, -1 = max, 0 = none */
const extremumType = (fp: string, r: number) => {
  const l = f(fp)(r - 0.01), g = f(fp)(r + 0.01);
  if (l < 0 && g > 0) return 1;
  if (l > 0 && g < 0) return -1;
  return 0;
};
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// rq-sub-sk-101 — two vertical asymptotes (-1, 3) and a hole at 5: how many branches
{
  const num = 'x-5', den = '(x+1)*(x-3)*(x-5)';
  checkSet('101 vertical asymptotes are exactly -1 and 3', vAsyms(num, den), [-1, 3]);
  checkSet('101 the value 5 is a hole, not an asymptote', holes(num, den), [5]);
  check('101 the hole has a finite height (no blow-up)', blowsUp(`(${num})/(${den})`, 5), 0);
  check('101 hole height = 1/12', limitAt(`(${num})/(${den})`, 5), 1 / 12, 1e-6);
  check('101 branches = asymptotes + 1', branches(num, den), 3);
  check('101 wrong 2 = counting the asymptotes themselves', vAsyms(num, den).length, 2);
  check('101 wrong 4 = counting the hole as a splitter', roots(den).length + 1, 4);
  check('101 the middle region -1<x<3 is one interval (f finite at 1)', Number.isFinite(f(`(${num})/(${den})`)(1)) ? 1 : 0, 1);
}

// rq-sub-sk-102 — a hole at (3,5): hollow circle, the curve continues through
{
  const fx = '5*(x-3)/(x-3)';
  check('102 both sides of 3 tend to the same height 5', limitAt(fx, 3), 5, 1e-6);
  check('102 left and right limits agree (curve continues)', f(fx)(3 - 1e-6) - f(fx)(3 + 1e-6), 0, 1e-6);
  check('102 no blow-up at 3 (distractor: vertical asymptote)', blowsUp(fx, 3), 0);
  check('102 f(3) itself is undefined (distractor: full point)', Number.isNaN(f(fx)(3)) ? 1 : 0, 1);
}

// rq-sub-sk-103 — f(x) = 5/(x-4), branch left of 4 escapes DOWN
{
  const fx = '5/(x-4)';
  checkSet('103 vertical asymptote at 4', vAsyms('5', 'x-4'), [4]);
  check('103 f(3.9) = -50', f(fx)(3.9), -50, 1e-6);
  check('103 sign just left of 4 is negative', sgn(f(fx)(3.999)), -1);
  check('103 magnitude grows toward the asymptote', Math.abs(f(fx)(3.999)) > Math.abs(f(fx)(3.9)) ? 1 : 0, 1);
  check('103 distractor UP is the RIGHT branch: f(4.1) = 50', f(fx)(4.1), 50, 1e-6);
  check('103 distractor "flattens to 0": that is the horizontal asymptote, far away', HA(fx), 0, 1e-4);
}

// rq-sub-sk-104 — HA y=2 and y-intercept (0,-3): a sketch wholly above y=2 misses a computed point
{
  const fx = '2-5/(x^2+1)';
  check('104 model horizontal asymptote y = 2', HA(fx), 2, 1e-4);
  check('104 model passes through (0,-3)', f(fx)(0), -3);
  check('104 the computed point sits BELOW the asymptote line', sgn(f(fx)(0) - 2), -1);
  check('104 distractor "cannot be below a HA": the model lives below y = 2 everywhere', f(fx)(3) < 2 && f(fx)(-100) < 2 ? 1 : 0, 1);
  // a HA may even be crossed in the middle: g = 2 + x/(x^2+1) has HA 2 and g(0) = 2
  const gx = '2+x/(x^2+1)';
  check('104 a graph may cross its HA in the middle: g(0) = 2 with HA 2', f(gx)(0), 2);
  check('104 g HA is 2', HA(gx), 2, 1e-4);
  check('104 g is on both sides of y = 2: g(-1) < 2 < g(1)', f(gx)(-1) < 2 && f(gx)(1) > 2 ? 1 : 0, 1);
}

// rq-sub-sk-105 — f' touches the axis at 4 without a sign change: no extremum, f rising
{
  const fp = '(x-4)^2', fx = '(x-4)^3/3';
  dcheck('105 model f matches its f\'', fx, fp);
  check('105 f\'(4) = 0', f(fp)(4), 0);
  check('105 f\' positive on both sides', sgn(f(fp)(3.9)) + sgn(f(fp)(4.1)), 2);
  check('105 no extremum at 4', extremumType(fp, 4), 0);
  check('105 f keeps rising through 4', f(fx)(3.9) < f(fx)(4) && f(fx)(4) < f(fx)(4.1) ? 1 : 0, 1);
  check('105 distractor min needs -→+: not the case', extremumType(fp, 4) === 1 ? 1 : 0, 0);
  check('105 distractor max needs +→-: not the case', extremumType(fp, 4) === -1 ? 1 : 0, 0);
}

// rq-sub-sk-106 — VA x=2, HA y=1, rising everywhere: left branch from 1 up to +∞
{
  const fx = '1-1/(x-2)', fp = '1/(x-2)^2';
  dcheck('106 model f\' (always positive)', fx, fp, [-3, -1, 0, 1.5, 3, 5]);
  checkSet('106 vertical asymptote at 2', vAsyms('x-3', 'x-2'), [2]);
  check('106 horizontal asymptote y = 1', HA(fx), 1, 1e-4);
  check('106 far left the branch sits just ABOVE 1 (arrives from height 1)', sgn(f(fx)(-1e6) - 1), 1);
  check('106 f\' > 0 on the left branch', sgn(f(fp)(-5)) + sgn(f(fp)(1.9)), 2);
  check('106 near x = 2 from the left the branch escapes UP', f(fx)(1.999) > 1e2 ? 1 : 0, 1);
  check('106 rising from left to right: f(-10) < f(0) < f(1.9)', f(fx)(-10) < f(fx)(0) && f(fx)(0) < f(fx)(1.9) ? 1 : 0, 1);
  check('106 distractor "escapes down" would need f < 1 near 2: f(1.999)-1 is positive', sgn(f(fx)(1.999) - 1), 1);
}

// rq-sub-sk-107 — f' crosses at -3 (-→+), 0 (+→-), 4 (-→+): two minima
{
  const fp = '(x+3)*x*(x-4)', fx = 'x^4/4-x^3/3-6*x^2';
  dcheck('107 model f matches its f\'', fx, fp);
  checkSet('107 f\' crosses at -3, 0, 4', roots(fp), [-3, 0, 4]);
  const types = [-3, 0, 4].map(r => extremumType(fp, r));
  checkSet('107 sign orders: min, max, min', types, [1, -1, 1]);
  check('107 number of minima = 2', types.filter(t => t === 1).length, 2);
  check('107 wrong 3 = every crossing counted', types.filter(t => t !== 0).length, 3);
  check('107 wrong 1 = the maxima counted instead', types.filter(t => t === -1).length, 1);
}

// rq-sub-sk-108 — findings of (x^2-4x-12)/(x^2-4): hole (-2,2), VA 2, HA 1, (0,3), (6,0), rising
{
  const num = 'x^2-4*x-12', den = 'x^2-4', fx = `(${num})/(${den})`;
  checkSet('108 vertical asymptote only at 2', vAsyms(num, den), [2]);
  checkSet('108 hole at -2', holes(num, den), [-2]);
  check('108 hole height 2', limitAt(fx, -2), 2, 1e-6);
  check('108 horizontal asymptote y = 1', HA(fx), 1, 1e-4);
  check('108 y-intercept (0,3)', f(fx)(0), 3);
  checkSet('108 x-intercept (6,0): numerator roots inside the domain', roots(num).filter(r => Math.abs(f(den)(r)) > 1e-9), [6]);
  check('108 two branches (one vertical asymptote)', branches(num, den), 2);
  dcheck('108 reduced form (x-6)/(x-2) has f\' = 4/(x-2)^2 > 0', '(x-6)/(x-2)', '4/(x-2)^2', [-4, -2.5, 0, 1.5, 3, 7]);
  check('108 hole and (0,3) sit on the left branch: -2 < 2 and 0 < 2', (-2 < 2 && 0 < 2) ? 1 : 0, 1);
  check('108 (6,0) sits on the right branch', 6 > 2 ? 1 : 0, 1);
  check('108 left branch arrives from ABOVE 1', sgn(f(fx)(-1e6) - 1), 1);
  check('108 left branch escapes UP near 2', f(fx)(1.999) > 1e2 ? 1 : 0, 1);
  check('108 right branch comes from -∞ near 2', f(fx)(2.001) < -1e2 ? 1 : 0, 1);
  check('108 right branch settles BELOW 1', sgn(f(fx)(1e6) - 1), -1);
  check('108 left branch order: 1 < hole 2 < 3 (monotone rise)', (1 < limitAt(fx, -2) && limitAt(fx, -2) < f(fx)(0)) ? 1 : 0, 1);
}

// rq-sub-sk-109 — f' is a falling line crossing at 2: f rises, then falls, max at 2
{
  const fp = '2-x', fx = '2*x-x^2/2';
  dcheck('109 model f matches its f\'', fx, fp);
  check('109 the line falls (slope -1)', f(fp)(1) - f(fp)(0), -1);
  checkSet('109 crosses the axis at 2', roots(fp), [2]);
  check('109 left of 2 the line is ABOVE the axis (f rises)', sgn(f(fp)(1)), 1);
  check('109 right of 2 the line is BELOW the axis (f falls)', sgn(f(fp)(3)), -1);
  check('109 + → - is a maximum', extremumType(fp, 2), -1);
  check('109 distractor "f falls everywhere": f(0) < f(2)', f(fx)(0) < f(fx)(2) ? 1 : 0, 1);
  check('109 distractor "f crosses the axis at 2": it is f\'(2) that is 0, f(2) = 2', f(fx)(2), 2);
}

// rq-sub-sk-110 — VA x=5, HA y=1, min (0,3): the left branch must carry a MAXIMUM left of 0
{
  const fx = '1+10*(2*x^2-0.2*x+1)/((5-x)*(x^2+1))';
  const g = f(fx);
  const d = (x: number, h = 1e-6) => (g(x + h) - g(x - h)) / (2 * h);
  check('110 model passes through (0,3)', g(0), 3, 1e-9);
  check('110 horizontal tangent at 0', d(0), 0, 1e-6);
  check('110 (0,3) is a minimum: higher on both sides', g(-0.3) > 3 && g(0.3) > 3 ? 1 : 0, 1);
  check('110 vertical asymptote at 5', blowsUp(fx, 5), 1);
  check('110 horizontal asymptote y = 1', HA(fx), 1, 1e-3);
  check('110 the asymptote height is BELOW the minimum height (1 < 3)', sgn(g(0) - HA(fx)), 1);
  // the forced maximum: argmax on the left of 0
  let xMax = -1, best = -Infinity;
  for (let i = 0; i <= 6000; i++) { const x = -6 + (5.5 * i) / 6000; if (g(x) > best) { best = g(x); xMax = x; } }
  check('110 the maximum lies LEFT of 0', xMax < 0 ? 1 : 0, 1);
  check('110 f\' goes + → - there (maximum)', sgn(d(xMax - 0.1)) - sgn(d(xMax + 0.1)), 2);
  check('110 it is above the minimum height', best > 3 ? 1 : 0, 1);
  check('110 further left the graph is back below that max and falling toward 1', g(-40) < best && g(-40) > 1 && g(-400) < g(-40) ? 1 : 0, 1);
  check('110 the right side is free: it escapes UP near 5 with no turn', g(4.99) > 1e3 && d(2) > 0 && d(4) > 0 ? 1 : 0, 1);
}

// rq-sub-sk-111 — a student's sketch: corner at a min, rising to a LOWER asymptote, crossing a VA
{
  // (2) an extremum has a horizontal tangent → smooth, never a corner
  const model = '2+(x-5)^2';
  const corner = f(math.derivative(model, 'x').toString())(5);
  check('111 step (2): f\'(5) = 0 at the minimum, a smooth turn', corner, 0);
  // (3) rising from height 2 and settling at height -1 is impossible: 2 - (-1) > 0
  const gap = 2 - (-1);
  check('111 step (3): minimum height minus asymptote height is 3 > 0', gap, 3);
  // (4) a vertical asymptote cannot be crossed: f is undefined / blows up at 3
  const va = blowsUp('2+1/(x-3)', 3);
  check('111 step (4): the model blows up at x = 3', va, 1);
  const wrong = (corner === 0 ? 1 : 0) + (gap > 0 ? 1 : 0) + va;
  check('111 three wrong steps', wrong, 3);
  check('111 wrong 4 would need step (1) wrong too: dashed asymptotes are the rule (0 errors there)', wrong - 3, 0);
}

// rq-sub-sk-112 — (x^2-16)/(x-4) is the line y = x+4 with a hole at (4,8)
{
  const num = 'x^2-16', den = 'x-4', fx = `(${num})/(${den})`;
  check('112 numerator vanishes at 4 too', f(num)(4), 0);
  checkSet('112 no vertical asymptote at all', vAsyms(num, den), []);
  checkSet('112 hole at 4', holes(num, den), [4]);
  check('112 no blow-up at 4 (distractor: two branches)', blowsUp(fx, 4), 0);
  dcheck('112 reduced form is x + 4 (compared as functions)', fx, '1', [-3, -1, 0, 2, 3, 6]);
  check('112 f equals x + 4 away from 4', f(fx)(2) - (2 + 4), 0, 1e-9);
  check('112 hole height 8 (distractor (4,0) puts it on the axis)', limitAt(fx, 4), 8, 1e-6);
  check('112 f(3.99) ≈ 7.99', f(fx)(3.99), 7.99, 1e-6);
  check('112 f(4) is undefined (distractor: no marking)', Number.isNaN(f(fx)(4)) ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// 2026-09-06 round — the figures now drawn by lib/fn-figure, and the two new
// hard questions. Every claim the SVG or the caption makes is re-derived here
// from the same function the figure was generated from.
// ---------------------------------------------------------------------------

// rq-sub-sk-104 figure — the model 2 - 5/(x^2+1): HA y = 2, and it lives BELOW it
{
  const fx = '2-5/(x^2+1)';
  check('104 fig: horizontal asymptote y = 2', HA(fx), 2, 1e-4);
  check('104 fig: the marked point is (0,-3)', f(fx)(0), -3);
  check('104 fig: the point sits below the dashed line', sgn(f(fx)(0) - 2), -1);
  let above = 0;
  for (let i = 0; i <= 400; i++) { const x = -6 + (12 * i) / 400; if (f(fx)(x) >= 2) above++; }
  check('104 fig: no sample of the drawn window reaches the line y = 2', above, 0);
  check('104 fig: at the window edge it is already close to 2', f(fx)(6), 2 - 5 / 37, 1e-9);
}

// rq-sub-sk-109 figure — the GIVEN derivative line f'(x) = 2 - x
{
  const fp = '2-x';
  checkSet('109 fig: the line meets the axis at 2 only', roots(fp), [2]);
  check('109 fig: at the left edge of the window it is above the axis', sgn(f(fp)(-2)), 1);
  check('109 fig: at the right edge it is below the axis', sgn(f(fp)(6)), -1);
  check('109 fig: the marked point is on the axis', f(fp)(2), 0);
}

// rq-sub-sk-111 figure — the CORRECT right branch: VA 3, min (5,2), a maximum, then y = -1
{
  const fx = '(-x^3+40*x^2-301*x+646)/(x-3)^3';
  const g = f(fx);
  const d = (x: number, h = 1e-6) => (g(x + h) - g(x - h)) / (2 * h);
  check('111 fig: passes through the given minimum (5,2)', g(5), 2, 1e-9);
  check('111 fig: horizontal tangent there', d(5), 0, 1e-5);
  check('111 fig: it is a minimum — higher on both sides', g(4) > 2 && g(6) > 2 ? 1 : 0, 1);
  check('111 fig: vertical asymptote at 3', blowsUp(fx, 3), 1);
  check('111 fig: the branch arrives from +infinity there', sgn(g(3.001)), 1);
  check('111 fig: horizontal asymptote y = -1', HA(fx), -1, 1e-2);
  // the maximum step (3) denies: argmax to the RIGHT of the minimum
  let xMax = 5, best = -Infinity;
  for (let i = 0; i <= 6000; i++) { const x = 5 + (25 * i) / 6000; if (g(x) > best) { best = g(x); xMax = x; } }
  check('111 fig: a maximum exists right of the minimum', xMax > 5 && xMax < 30 ? 1 : 0, 1);
  check('111 fig: f\' goes + → - there', sgn(d(xMax - 0.2)) - sgn(d(xMax + 0.2)), 2);
  check('111 fig: after it the graph falls toward the asymptote', g(20) > g(40) && g(40) > -1 ? 1 : 0, 1);
  check('111 fig: rising straight from height 2 to height -1 is impossible (2 > -1)', sgn(2 - -1), 1);
}

// rq-sub-sk-201 — f(x) = ax/(x^2+4): the max height 3 forces a = 12
{
  const fa = (a: number) => `${a}*x/(x^2+4)`;
  const fp12 = '12*(4-x^2)/(x^2+4)^2';
  dcheck('201 the quotient rule gives f\' = a(4-x^2)/(x^2+4)^2 (a = 12)', fa(12), fp12);
  checkSet('201 the denominator never vanishes, so there is no vertical asymptote', roots('x^2+4'), []);
  check('201 horizontal asymptote y = 0', HA(fa(12)), 0, 1e-4);
  checkSet('201 f\' vanishes at 2 and at -2', roots(fp12), [-2, 2]);
  check('201 sign order at 2 is + → -, a maximum', extremumType(fp12, 2), -1);
  check('201 sign order at -2 is - → +, a minimum', extremumType(fp12, -2), 1);
  // the parameter recovered independently: solve height(a) = 3 for a by bisection on a
  const height = (a: number) => f(fa(a))(2);
  let lo = 0, hi = 100;
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (height(m) < 3) lo = m; else hi = m; }
  check('201 the value of a that makes the maximum height 3 is 12', (lo + hi) / 2, 12, 1e-9);
  check('201 with a = 12 the maximum is (2,3)', f(fa(12))(2), 3, 1e-9);
  check('201 and the minimum is (-2,-3)', f(fa(12))(-2), -3, 1e-9);
  // the whole graph really tops out at 3 — no higher value anywhere
  let top = -Infinity;
  for (let i = 0; i <= 20000; i++) { const x = -200 + (400 * i) / 20000; top = Math.max(top, f(fa(12))(x)); }
  check('201 no point of the graph rises above 3', top, 3, 1e-3);
  check('201 wrong 3 = the height copied into the parameter: a = 3 gives height 0.75', f(fa(3))(2), 0.75, 1e-9);
  check('201 wrong 6 = the denominator taken as 4 instead of 8: a = 6 gives height 1.5', f(fa(6))(2), 1.5, 1e-9);
  check('201 wrong -2 = the other extremum, whose height is -3', f(fa(12))(-2), -3, 1e-9);
}

// rq-sub-sk-202 — f(x) = x*sqrt(12-x): one extremum, the maximum (8,16)
{
  const fx = 'x*sqrt(12-x)', fp = '(24-3*x)/(2*sqrt(12-x))';
  dcheck('202 product + root rule give f\' = (24-3x)/(2 sqrt(12-x))', fx, fp, [-4, -1, 0, 3, 7, 8, 11]);
  checkSet('202 the domain condition 12 - x >= 0 breaks at 12', roots('12-x'), [12]);
  check('202 just past 12 the expression under the root is negative, so there is no graph', sgn(f('12-x')(12.05)), -1);
  checkSet('202 the numerator of f\' vanishes only at 8', roots('24-3*x'), [8]);
  check('202 the denominator of f\' is positive throughout the domain', sgn(f('2*sqrt(12-x)')(8)), 1);
  check('202 8 is inside the domain', 8 < 12 ? 1 : 0, 1);
  check('202 sign order at 8 is + → -, a maximum', extremumType(fp, 8), -1);
  check('202 the height there is 16', f(fx)(8), 16, 1e-9);
  // no second extremum anywhere in the domain: f' keeps its sign on each side
  let flips = 0, prev = sgn(f(fp)(-40));
  for (let i = 0; i <= 4000; i++) { const x = -40 + (51.9 * i) / 4000; const s = sgn(f(fp)(x)); if (s !== 0 && s !== prev) { flips++; prev = s; } }
  check('202 f\' changes sign exactly once in the whole domain', flips, 1);
  checkSet('202 the graph meets the x axis at 0 and at 12', roots('x*(12-x)'), [0, 12]);
  check('202 wrong (12,0) = the domain edge: f\' does not vanish there', f('24-3*x')(12), -12);
  check('202 wrong 24 = the inner derivative lost: (24-x) vanishes at 24, outside the domain', 24 > 12 ? 1 : 0, 1);
  check('202 wrong (8,2) = only the root substituted, without the factor x', f('sqrt(12-x)')(8), 2);
}

// ---------------------------------------------------------------------------
// 2026-09-06, exam-style round — sk-103/104/106/112 kept their mathematics and
// changed their ASK, so what is re-derived here is what the NEW ask returns:
// the two asymptote equations, the range of a branch, the missing point AND the
// intercept. Every `got` is computed from the question's own function.
// ---------------------------------------------------------------------------

// rq-sub-sk-103 — 5/(x-4): the two asymptotes, then the signs the sketch needs
{
  const fx = '5/(x-4)';
  checkSet('103 ask a: the vertical asymptote is exactly x = 4', vAsyms('5', 'x-4'), [4]);
  check('103 ask a: the numerator does not vanish there, so it is an asymptote and not a hole', f('5')(4), 5);
  check('103 ask b: the horizontal asymptote is y = 0', HA(fx), 0, 1e-4);
  check('103 ask b: far out the value is already tiny', Math.abs(f(fx)(1e6)) < 1e-5 ? 1 : 0, 1);
  check('103 sketch: left of 4 the branch runs down', sgn(f(fx)(3.999)), -1);
  check('103 sketch: right of 4 it runs up', sgn(f(fx)(4.001)), 1);
  check('103 sketch: the y-intercept is -1.25', f(fx)(0), -1.25, 1e-9);
  check('103 wrong "-4": the denominator at -4 is -8, not zero', f('x-4')(-4), -8);
  check('103 wrong "y = 5": the numerator is not the asymptote height', Math.abs(HA(fx) - 5) > 4 ? 1 : 0, 1);
  check('103 wrong "0, 4": swapping them would need f to blow up at 0', Number.isFinite(f(fx)(0)) ? 1 : 0, 1);
}

// rq-sub-sk-104 — "סקיצה אפשרית": HA y = 2 with the computed point (0,-3) below it
{
  const m1 = '2-5/(x^2+1)', m2 = '2-5/(x^4+1)';
  check('104 model 1 has HA y = 2', HA(m1), 2, 1e-4);
  check('104 model 1 passes through (0,-3)', f(m1)(0), -3);
  check('104 the computed point sits BELOW the asymptote', sgn(f(m1)(0) - 2), -1);
  check('104 model 2 has the same two findings — HA', HA(m2), 2, 1e-4);
  check('104 model 2 passes through (0,-3) as well', f(m2)(0), -3);
  check('104 so the sketch is not unique: the two models differ at x = 2', Math.abs(f(m1)(2) - f(m2)(2)) > 0.5 ? 1 : 0, 1);
  check('104 both climb back toward 2 on the right', sgn(2 - f(m1)(50)), 1);
  check('104 a horizontal asymptote is no floor: the graph is below it at 0 and near it far out', f(m1)(0) < 2 && Math.abs(f(m1)(1e4) - 2) < 1e-6 ? 1 : 0, 1);
}

// rq-sub-sk-106 — VA 2, HA 1, rising: the LEFT branch takes exactly the values y > 1
{
  const fx = '1-1/(x-2)';
  check('106 range: every value on the left branch exceeds 1 — at x = -10', sgn(f(fx)(-10) - 1), 1);
  check('106 range: and at x = 1.9, close to the asymptote', sgn(f(fx)(1.9) - 1), 1);
  check('106 the bound 1 is approached but not reached far left', Math.abs(f(fx)(-1e6) - 1) < 1e-5 ? 1 : 0, 1);
  check('106 f never equals 1 on the branch: 1 - 1/(x-2) = 1 has no solution', roots('1/(x-2)', -50, 1.99).length, 0);
  check('106 unbounded above: f(1.999) is huge', f(fx)(1.999) > 900 ? 1 : 0, 1);
  check('106 wrong "1 < y < 2": the branch passes 2 already at x = 1.9', f(fx)(1.9) > 2 ? 1 : 0, 1);
  check('106 wrong "y < 1": that is the RIGHT branch — f(3) is below 1', sgn(f(fx)(3) - 1), -1);
}

// rq-sub-sk-112 — the missing point AND the x-intercept of (x^2-16)/(x-4)
{
  const num = 'x^2-16', den = 'x-4', fx = `(${num})/(${den})`;
  check('112 the missing point sits at height 8, from the reduced form', limitAt(fx, 8 - 4), 8, 1e-6);
  check('112 f itself has no value at 4', Number.isNaN(f(fx)(4)) ? 1 : 0, 1);
  checkSet('112 the graph meets the x axis where the reduced form vanishes: x = -4', roots(fx, -20, 3.9), [-4]);
  check('112 and -4 is inside the domain: the denominator there is -8', f(den)(-4), -8);
  check('112 the intercept height is 0', f(fx)(-4), 0, 1e-9);
  check('112 wrong "(4,0)": the reduced form at 4 gives 8, not 0', f('x+4')(4), 8);
  check('112 wrong "no intercept": f(-4) is exactly 0', Math.abs(f(fx)(-4)) < 1e-12 ? 1 : 0, 1);
  check('112 wrong "no missing point": 4 does zero the original denominator', f(den)(4), 0);
}

// ---------------------------------------------------------------------------
// 2026-09-06, round 3 — sk-301…305. Each of these questions works on a REAL
// function, so nothing here is re-enacted on a model: every `got` is computed
// from the question's own expression, every figure claim (asymptote, marked
// point, hole, domain edge) is re-derived, and every distractor is replayed as
// the mistake its note names.
// ---------------------------------------------------------------------------

// rq-sub-sk-301 — (x^2-9)/(x^2-4x+3): hole (3,3), VA x = 1, HA y = 1
{
  const num = 'x^2-9', den = 'x^2-4*x+3', fx = `(${num})/(${den})`;
  checkSet('301 the denominator vanishes at 1 and at 3', roots(den), [1, 3]);
  check('301 the numerator at 1 is -8, so nothing cancels there', f(num)(1), -8);
  check('301 the numerator at 3 vanishes too, so the factor cancels', f(num)(3), 0);
  checkSet('301 only x = 1 is a vertical asymptote', vAsyms(num, den), [1]);
  checkSet('301 x = 3 is a hole', holes(num, den), [3]);
  check('301 no blow-up at the hole', blowsUp(fx, 3), 0);
  check('301 the hole height is 3', limitAt(fx, 3), 3, 1e-6);
  check('301 the reduced form (x+3)/(x-1) agrees away from the hole', f(fx)(7) - f('(x+3)/(x-1)')(7), 0, 1e-9);
  check('301 and at a second point', f(fx)(-4) - f('(x+3)/(x-1)')(-4), 0, 1e-9);
  check('301 horizontal asymptote y = 1 (equal degrees)', HA(fx), 1, 1e-4);
  check('301 x-intercept: f(-3) = 0', f(fx)(-3), 0, 1e-12);
  check('301 and -3 is inside the domain: the denominator there is 24', f(den)(-3), 24);
  check('301 y-intercept (0,-3)', f(fx)(0), -3);
  check('301 two branches (one vertical asymptote)', branches(num, den), 2);
  check('301 fig: the hole lies right of the asymptote', sgn(holes(num, den)[0] - vAsyms(num, den)[0]), 1);
  check('301 fig: both intercepts lie left of it', sgn(-3 - vAsyms(num, den)[0]) + sgn(0 - vAsyms(num, den)[0]), -2);
  check('301 fig: the left branch stays below y = 1', sgn(f(fx)(-8) - 1) + sgn(f(fx)(-1e6) - 1), -2);
  check('301 fig: the right branch stays above y = 1', sgn(f(fx)(4) - 1) + sgn(f(fx)(1e6) - 1), 2);
  check('301 wrong "3,1,1": the hole height is not 1', Math.abs(limitAt(fx, 3) - 1) > 1 ? 1 : 0, 1);
  check('301 wrong "1,0,3": the horizontal asymptote is not 0', Math.abs(HA(fx)) > 0.9 ? 1 : 0, 1);
  check('301 wrong "1,1,0": the hole height is not 0', Math.abs(limitAt(fx, 3)) > 1 ? 1 : 0, 1);
}

// rq-sub-sk-302 — sqrt(x+5)/(x-1): domain x >= -5 and x != 1, intercept (-5,0)
{
  const fx = 'sqrt(x+5)/(x-1)';
  const g = f(fx);
  check('302 the radicand vanishes at -5', f('x+5')(-5), 0);
  check('302 just left of -5 the radicand is negative, so there is no graph', sgn(f('x+5')(-5.05)), -1);
  check('302 the root sits in the NUMERATOR, so -5 itself is allowed: f(-5) = 0', g(-5), 0);
  check('302 and the denominator there is -6, not zero', f('x-1')(-5), -6);
  check('302 the denominator vanishes at 1', f('x-1')(1), 0);
  check('302 the numerator at 1 is sqrt(6), not zero, so x = 1 is an asymptote', f('sqrt(x+5)')(1), Math.sqrt(6), 1e-12);
  check('302 and the graph does blow up there', blowsUp(fx, 1), 1);
  check('302 horizontal asymptote y = 0: far right the value is tiny', Math.abs(g(1e8)) < 1e-3 ? 1 : 0, 1);
  check('302 and it keeps shrinking', (Math.abs(g(1e10)) < Math.abs(g(1e8))) ? 1 : 0, 1);
  check('302 f(95) = 10/94, as the solution substitutes', g(95), 10 / 94, 1e-12);
  check('302 fig: the marked point (4,1)', g(4), 1, 1e-12);
  check('302 fig: between -5 and 1 the graph is below the axis', sgn(g(-1)), -1);
  check('302 fig: right of 1 it is above the axis', sgn(g(2)), 1);
  check('302 fig: the domain edge -5 is the leftmost drawn point', sgn(f('x+5')(-5 - 1e-6)), -1);
  check('302 wrong "x > -5": f(-5) exists and is finite', Number.isFinite(g(-5)) ? 1 : 0, 1);
  check('302 wrong "no denominator condition": f(1) is not finite', Number.isFinite(g(1)) ? 1 : 0, 0);
  check('302 wrong "no x-intercept": f(-5) is exactly 0', Math.abs(g(-5)) < 1e-12 ? 1 : 0, 1);
}

// rq-sub-sk-303 — (x-3)/(x-2)^2: maximum (4,0.25), VA x = 2, HA y = 0
{
  const fx = '(x-3)/(x-2)^2', fp = '(4-x)/(x-2)^3';
  dcheck("303 the quotient rule gives f' = (4-x)/(x-2)^3", fx, fp, [-3, -1, 0, 1, 3, 5, 8]);
  checkSet('303 vertical asymptote at 2 only', vAsyms('x-3', '(x-2)^2'), [2]);
  check('303 the numerator at 2 is -1, so it is an asymptote and not a hole', f('x-3')(2), -1);
  check('303 horizontal asymptote y = 0', HA(fx), 0, 1e-4);
  checkSet("303 f' vanishes only at 4", roots('4-x'), [4]);
  check('303 the value 2 is no candidate: f is not finite there', Number.isFinite(f(fx)(2)) ? 1 : 0, 0);
  check("303 sign table, x < 2: f' negative", sgn(f(fp)(0)), -1);
  check("303 sign table, 2 < x < 4: f' positive", sgn(f(fp)(3)), 1);
  check("303 sign table, x > 4: f' negative", sgn(f(fp)(5)), -1);
  check('303 so the sign order at 4 is + -> -, a maximum', extremumType(fp, 4), -1);
  check('303 the height of the maximum is 0.25', f(fx)(4), 0.25, 1e-12);
  check('303 x-intercept at 3', f(fx)(3), 0, 1e-12);
  check('303 y-intercept -0.75', f(fx)(0), -0.75, 1e-12);
  let top = -Infinity;
  for (let i = 0; i <= 20000; i++) { const x = 2.001 + (200 * i) / 20000; top = Math.max(top, f(fx)(x)); }
  check('303 no point of the right branch rises above 0.25', top, 0.25, 1e-4);
  check('303 fig: the left branch falls throughout', (f(fx)(-3) > f(fx)(0) && f(fx)(0) > f(fx)(1.9)) ? 1 : 0, 1);
  check('303 fig: the left branch plunges near 2', f(fx)(1.999) < -1e5 ? 1 : 0, 1);
  check('303 wrong "(4,0.5)": the denominator taken without the square', 1 / (4 - 2), 0.5);
  check('303 wrong "minimum": f is LOWER on both sides of 4, not higher', (f(fx)(3.5) < f(fx)(4) && f(fx)(5) < f(fx)(4)) ? 1 : 0, 1);
  check('303 wrong "two extrema": f is undefined at 2', Number.isFinite(f(fx)(2)) ? 1 : 0, 0);
}

// rq-sub-sk-304 — x/sqrt(x-4): domain x > 4, VA x = 4, one minimum (8,4)
{
  const fx = 'x/sqrt(x-4)', fp = '(x-8)/(2*(x-4)*sqrt(x-4))';
  dcheck("304 the quotient + root rules give f' = (x-8)/(2(x-4)sqrt(x-4))", fx, fp, [4.5, 5, 6, 8, 9, 12, 20]);
  check('304 at 4 the radicand is 0, so the denominator vanishes: the domain is open', f('x-4')(4), 0);
  check('304 just left of 4 the radicand is negative, so there is no graph', sgn(f('x-4')(3.95)), -1);
  check('304 x = 4 is a vertical asymptote', f(fx)(4 + 1e-12) > 1e5 ? 1 : 0, 1);
  checkSet("304 the numerator of f' vanishes only at 8", roots('x-8'), [8]);
  check('304 8 is inside the domain', sgn(f('x-4')(8)), 1);
  check("304 the denominator of f' is positive throughout the domain", sgn(f('2*(x-4)*sqrt(x-4)')(8)) + sgn(f('2*(x-4)*sqrt(x-4)')(4.5)), 2);
  check('304 sign order at 8 is - -> +, a minimum', extremumType(fp, 8), 1);
  check('304 the height there is 4', f(fx)(8), 4, 1e-12);
  let flips = 0, prev = sgn(f(fp)(4.001));
  for (let i = 0; i <= 4000; i++) { const x = 4.001 + (400 * i) / 4000; const s = sgn(f(fp)(x)); if (s !== 0 && s !== prev) { flips++; prev = s; } }
  check("304 f' changes sign exactly once in the whole domain", flips, 1);
  check('304 fig: the marked point (20,5)', f(fx)(20), 5, 1e-12);
  check('304 fig: f(5) = 5 as well, so the dip really is a dip', f(fx)(5), 5, 1e-12);
  check('304 fig: one branch only — nothing is drawn left of 4', sgn(f('x-4')(0)), -1);
  check('304 f(104) = 10.4, as the solution substitutes', f(fx)(104), 10.4, 1e-9);
  check('304 no horizontal asymptote: f keeps growing', (f(fx)(104) < f(fx)(2504) && f(fx)(2504) > 50) ? 1 : 0, 1);
  check("304 wrong \"4,0\": f' does not vanish at the domain edge — its numerator there is -4", f('x-8')(4), -4);
  check('304 wrong "8,2": that is the denominator alone, sqrt(8-4)', f('sqrt(x-4)')(8), 2);
  check('304 wrong "8,16": multiplying instead of dividing gives 8 times 2', 8 * f('sqrt(x-4)')(8), 16);
}

// rq-sub-sk-305 — f = a/(x^2+4), g = 1/(f-1): a = 8, VAs +-2, HA y = -1
{
  const fa = (a: number) => `${a}/(x^2+4)`;
  let lo = 0, hi = 100;
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (f(fa(m))(2) < 1) lo = m; else hi = m; }
  check('305 the a that puts a vertical asymptote of g at x = 2 is 8', (lo + hi) / 2, 8, 1e-9);
  check('305 with a = 8 the stated condition really holds: f(2) = 1', f(fa(8))(2), 1, 1e-12);
  const gx = '1/(8/(x^2+4)-1)', gs = '(x^2+4)/(4-x^2)';
  for (const t of [-6, -3, -1, 0, 1, 3, 6]) check(`305 the simplified g agrees with 1/(f-1) at x = ${t}`, f(gx)(t) - f(gs)(t), 0, 1e-9);
  checkSet('305 g has vertical asymptotes at -2 and at 2', vAsyms('x^2+4', '4-x^2'), [-2, 2]);
  checkSet('305 the numerator of g never vanishes: no x-intercept and no hole', roots('x^2+4'), []);
  checkSet('305 and no hole where the denominator vanishes', holes('x^2+4', '4-x^2'), []);
  check('305 horizontal asymptote of g is y = -1', HA(gs), -1, 1e-4);
  check('305 while f itself tends to 0 — the mistake the third note names', HA(fa(8)), 0, 1e-4);
  check('305 g(0) = 1', f(gs)(0), 1, 1e-12);
  check('305 (0,1) is a minimum of the middle branch: higher on both sides', (f(gs)(-1) > 1 && f(gs)(1) > 1) ? 1 : 0, 1);
  check('305 the middle branch escapes UP near 2', f(gs)(1.999) > 1e2 ? 1 : 0, 1);
  check('305 the outer branch comes from -infinity just right of 2', f(gs)(2.001) < -1e2 ? 1 : 0, 1);
  check('305 g(6) = -1.25, as the solution substitutes', f(gs)(6), -1.25, 1e-12);
  check('305 fig: the outer branches rise toward -1 from below', (f(gs)(6) < f(gs)(20) && f(gs)(20) < -1) ? 1 : 0, 1);
  check('305 fig: the picture is symmetric — g(-6) = g(6)', f(gs)(-6) - f(gs)(6), 0, 1e-12);
  check('305 wrong "a = 4": then f(2) is 0.5 and x = 2 is no asymptote of g', f(fa(4))(2), 0.5, 1e-12);
  checkSet('305 wrong "one asymptote": 4 - x^2 = 0 has two roots', roots('4-x^2'), [-2, 2]);
  check('305 wrong "y = 0": g is nowhere near 0 far out', Math.abs(HA(gs)) > 0.9 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// fn-bag-rq-005 / ה — the part added 2026-09-10: g(x) = 2x/(x-3) + k crosses the
// x-axis at 6 ⇒ k = -4; the horizontal asymptote drops to y = -2, the vertical
// one stays at x = 3, and g is f moved four units down. Lives in the stage file,
// so nothing else re-derives it.
// ---------------------------------------------------------------------------
{
  const fx = '2*x/(x-3)';
  // k is RECOVERED from the stated intercept, not copied from the author
  const k = -f(fx)(6);
  check('bag-005-ה k = -f(6) = -4', k, -4);
  const gx = `${fx} + (${k})`;
  check('bag-005-ה with that k, g really vanishes at 6', f(gx)(6), 0);
  check('bag-005-ה the horizontal asymptote of f is y = 2', HA(fx), 2, 1e-4);
  check('bag-005-ה the horizontal asymptote of g is y = -2', HA(gx), -2, 1e-4);
  checkSet('bag-005-ה the vertical asymptote stays at x = 3', vAsyms('2*x', 'x-3'), [3]);
  check('bag-005-ה g blows up at 3 just like f', blowsUp(gx, 3), 1);
  check('bag-005-ה g is f moved exactly four units down, everywhere',
    Math.max(...[-7, -1, 0, 2.5, 3.5, 6, 11].map((v) => Math.abs(f(gx)(v) - (f(fx)(v) - 4)))), 0, 1e-9);
  checkSet('bag-005-ה 6 is the ONLY x-intercept of g', roots('2*x - 4*(x-3)', -40, 40), [6]);
}

summary('sketch');
