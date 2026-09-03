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

summary('sketch');
