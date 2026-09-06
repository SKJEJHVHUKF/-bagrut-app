// Numeric re-derivation of content/lessons/math5/rq-extra/asymptotes.ts (rq-sub-asy-101…112).
// Every `got` is computed from the question's own function: roots of the denominator are found
// numerically (sign-change grid + bisection), horizontal asymptotes are f(±1e6), hole heights are
// f(a ± 1e-6), and every distractor / wrongAnswer note is re-enacted as the mistake it names.
import { check, checkSet, summary, math, E } from './_lib';

const f = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number, name = 'x') => c.evaluate({ [name]: v }) as number;
};
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
const HA = (expr: string) => (f(expr)(1e6) + f(expr)(-1e6)) / 2;
const hole = (expr: string, a: number) => (f(expr)(a + 1e-6) + f(expr)(a - 1e-6)) / 2;
const blowsUp = (expr: string, a: number) => Math.abs(f(expr)(a + 1e-7)) > 1e5 ? 1 : 0;
/** one-sided limit — for a function defined only to the right (a root in the numerator) */
const HAright = (expr: string) => f(expr)(1e6);
/** Count vertical asymptotes by scanning for spikes, NOT by counting roots of the
 *  denominator: a double root still spikes once, and a root that the numerator also
 *  kills reads as 0/0 = NaN and is skipped, so a hole is never counted as a line. */
function vaCount(expr: string, lo = -20, hi = 20, n = 200000): number {
  const g = f(expr);
  let count = 0;
  let inSpike = false;
  for (let i = 0; i <= n; i++) {
    const abs = Math.abs(g(lo + ((hi - lo) * i) / n));
    if (Number.isNaN(abs)) continue; // 0/0 — a hole, not a blow-up
    const big = !Number.isFinite(abs) || abs > 1e3;
    if (big && !inSpike) count++;
    inSpike = big;
  }
  return count;
}

// rq-sub-asy-101 — vertical asymptote of (x+4)/(2x-5), denominator coefficient 2
{
  const den = '2*x-5', num = 'x+4';
  checkSet('101 denominator roots', roots(den), [5 / 2]);
  check('101 numerator at 5/2 is not 0', f(num)(5 / 2), 13 / 2);
  check('101 blows up at 5/2', blowsUp(`(${num})/(${den})`, 5 / 2), 1);
  check('101 distractor x=5: den(5)=5', f(den)(5), 5);
  check('101 distractor x=-5/2: den=-10', f(den)(-5 / 2), -10);
  check('101 distractor y=1/2 is the horizontal', HA(`(${num})/(${den})`), 1 / 2, 1e-4);
}

// rq-sub-asy-102 — (x-1)/(x^2+4): denominator never zero → no vertical asymptote
{
  const den = 'x^2+4';
  checkSet('102 denominator has no real root', roots(den, -100, 100), []);
  check('102 min of denominator is 4 > 0', Math.min(...[-3, -1, 0, 1, 3].map(v => f(den)(v))), 4);
  check('102 distractor x=2: den=8', f(den)(2), 8);
  check('102 distractor x=-4: den=20', f(den)(-4), 20);
  check('102 distractor x=1: f(1)=0 (x-intercept)', f('(x-1)/(x^2+4)')(1), 0);
}

// rq-sub-asy-103 — horizontal asymptote of (4-3x^2)/(x^2+1): b = -3
{
  const fx = '(4-3*x^2)/(x^2+1)';
  check('103 b = f(±1e6)', HA(fx), -3, 1e-4);
  check('103 both ends agree', f(fx)(1e6) - f(fx)(-1e6), 0, 1e-6);
  check('103 wrong 4 = ratio of free terms', E('4/1'), 4);
  check('103 wrong 3 = sign lost', Math.abs(HA(fx)), 3, 1e-4);
}

// rq-sub-asy-104 — vertical asymptotes of 5/(x^2-3x-10): x = 5, x = -2
{
  const den = 'x^2-3*x-10';
  checkSet('104 denominator roots', roots(den), [5, -2]);
  check('104 factoring (x-5)(x+2) matches', f(den)(7) - E('(7-5)*(7+2)'), 0);
  check('104 numerator constant 5 never 0', 5, 5 + 0 * f(den)(1)); // constant numerator
  check('104 both blow up', blowsUp(`5/(${den})`, 5) + blowsUp(`5/(${den})`, -2), 2);
  check('104 wrong 2: den(2) = -12', f(den)(2), -12);
  check('104 wrong -5: den(-5) != 0', f(den)(-5) === 0 ? 0 : 1, 1);
}

// rq-sub-asy-105 — horizontal asymptote of 2 - 4/(x+1): y = 2
{
  const fx = '2-4/(x+1)';
  check('105 y = f(±1e6)', HA(fx), 2, 1e-4);
  for (const v of [-3, 0.5, 4]) check(`105 combined form (2x-2)/(x+1) at x=${v}`, f(fx)(v), f('(2*x-2)/(x+1)')(v));
  check('105 note: f(999) ≈ 1.996', f(fx)(999), 1.996, 1e-6);
  check('105 distractor y=0 = fraction alone', HA('4/(x+1)'), 0, 1e-4);
  checkSet('105 distractor x=-1 is the vertical', roots('x+1'), [-1]);
}

// rq-sub-asy-106 — total asymptotes of (x^2+3)/(x^3-9x): 3 vertical + y=0 → 4
{
  const num = 'x^2+3', den = 'x^3-9*x', fx = `(${num})/(${den})`;
  const vs = roots(den);
  checkSet('106 denominator roots', vs, [0, 3, -3]);
  checkSet('106 numerator never zero', roots(num, -100, 100), []);
  check('106 all three blow up', vs.reduce((s, a) => s + blowsUp(fx, a), 0), 3);
  check('106 horizontal y=0', HA(fx), 0, 1e-4);
  check('106 total count', vs.length + 1, 4);
  check('106 wrong 3 = drop x=0 or drop y=0', vs.filter(v => Math.abs(v) > 1e-6).length + 1, 3);
  check('106 wrong 2 = only roots of x^2-9', roots('x^2-9').length, 2);
}

// rq-sub-asy-107 — which function has vertical x=2 and horizontal y=-3
{
  const opts = ['(-3*x+1)/(x-2)', '(-3*x+1)/(x+2)', '(2*x+1)/(x-3)', '(x-2)/(-3*x+1)'];
  const dens = ['x-2', 'x+2', 'x-3', '-3*x+1'];
  const fits: number[] = opts.map((o, i) => {
    const va = roots(dens[i]);
    return va.length === 1 && Math.abs(va[0] - 2) < 1e-9 && Math.abs(HA(o) + 3) < 1e-4 ? 1 : 0;
  });
  check('107 exactly one option fits', fits.reduce((a, b) => a + b, 0), 1);
  check('107 the fitting option is index 0', fits[0], 1);
  check('107 numerator at 2 = -5 (asymptote, not hole)', f('-3*x+1')(2), -5);
  checkSet('107 B vertical is x=-2', roots(dens[1]), [-2]);
  checkSet('107 C vertical is x=3', roots(dens[2]), [3]);
  check('107 C horizontal is y=2', HA(opts[2]), 2, 1e-4);
  checkSet('107 D vertical is x=1/3', roots(dens[3]), [1 / 3]);
  check('107 D horizontal is y=-1/3', HA(opts[3]), -1 / 3, 1e-4);
  // reworded as a backwards inference (the asymptotes are given, the function is not):
  // every other option must miss at least one of the two stated asymptotes.
  const misses = opts.map((o, i) => {
    const va = roots(dens[i]);
    const okVA = va.length === 1 && Math.abs(va[0] - 2) < 1e-9;
    return okVA && Math.abs(HA(o) + 3) < 1e-4 ? 0 : 1;
  });
  check('107 the recovered function misses nothing', misses[0], 0);
  check('107 each of the three others misses a stated asymptote', (misses.slice(1) as number[]).reduce((a, b) => a + b, 0), 3);
}

// rq-sub-asy-108 — horizontal asymptote of (2x-1)(x+3)/(x^2-4): b = 2
{
  const num = '(2*x-1)*(x+3)', fx = `${num}/(x^2-4)`;
  check('108 b = f(±1e6)', HA(fx), 2, 1e-4);
  check('108 leading coefficient of numerator', f(num)(1e6) / 1e12, 2, 1e-4);
  check('108 wrong 3/4 = free terms', f(num)(0) / f('x^2-4')(0), 3 / 4);
  check('108 wrong 1 = dropping the 2', HA('(x-1)*(x+3)/(x^2-4)'), 1, 1e-4);
}

// rq-sub-asy-109 — (2x+3)/(3x+b) with vertical x=-2: b = 6
{
  const bs = roots('3*(-2)+b', -20, 20, 'b');
  checkSet('109 b solves 3(-2)+b=0', bs, [6]);
  const b = bs[0];
  check('109 denominator vanishes at -2', E(`3*(-2)+${b}`), 0);
  check('109 numerator at -2 = -1 (asymptote, not hole)', f('2*x+3')(-2), -1);
  check('109 blows up', blowsUp(`(2*x+3)/(3*x+${b})`, -2), 1);
  checkSet('109 wrong -6 puts the asymptote at x=2', roots('3*x-6'), [2]);
  checkSet('109 wrong 2 = forgetting the 3', roots('-2+b', -20, 20, 'b'), [2]);
}

// rq-sub-asy-110 — mistakes in "VA x=3, VA x=-5, HA y=0" for (x^2-9)/(x^2+2x-15)
{
  const num = 'x^2-9', den = 'x^2+2*x-15', fx = `(${num})/(${den})`;
  checkSet('110 denominator roots', roots(den), [3, -5]);
  check('110 factoring (x+5)(x-3)', f(den)(4) - E('(4+5)*(4-3)'), 0);
  check('110 numerator at 3 = 0 → hole', f(num)(3), 0);
  check('110 numerator at -5 = 16', f(num)(-5), 16);
  check('110 x=-5 blows up', blowsUp(fx, -5), 1);
  check('110 x=3 is a finite hole (3/4)', hole(fx, 3), 3 / 4, 1e-4);
  check('110 horizontal y=1, not 0', HA(fx), 1, 1e-4);
  const claims = [f(num)(3) !== 0, f(num)(-5) !== 0, Math.abs(HA(fx)) < 1e-4];
  check('110 mistakes counted', claims.filter(ok => !ok).length, 2);
  check('110 reduced form (x+3)/(x+5) at x=1', f(fx)(1), f('(x+3)/(x+5)')(1));
}

// rq-sub-asy-111 — (x^2+kx)/(x-6): k that removes the vertical asymptote
{
  const ks = roots('6^2+6*k', -20, 20, 'k');
  checkSet('111 k solves 36+6k=0', ks, [-6]);
  const k = ks[0];
  check('111 numerator vanishes at 6', f(`x^2+(${k})*x`)(6), 0);
  check('111 no blow-up at 6', blowsUp(`(x^2+(${k})*x)/(x-6)`, 6), 0);
  check('111 hole height 6', hole(`(x^2+(${k})*x)/(x-6)`, 6), 6, 1e-4);
  check('111 wrong 6: numerator at 6 = 72', f('x^2+6*x')(6), 72);
  checkSet('111 wrong -36 = forgetting the x', roots('36+k', -50, 50, 'k'), [-36]);
}

// rq-sub-asy-112 — (x^2+5x+6)/(x^2-4): hole at (-2, -1/4), vertical x=2
{
  const num = 'x^2+5*x+6', den = 'x^2-4', fx = `(${num})/(${den})`;
  checkSet('112 denominator roots', roots(den), [2, -2]);
  check('112 factoring (x+2)(x+3)', f(num)(5) - E('(5+2)*(5+3)'), 0);
  check('112 numerator at 2 = 20', f(num)(2), 20);
  check('112 numerator at -2 = 0', f(num)(-2), 0);
  check('112 x=2 blows up', blowsUp(fx, 2), 1);
  check('112 hole height at -2 = -1/4', hole(fx, -2), -1 / 4, 1e-4);
  check('112 reduced (x+3)/(x-2) at -2', f('(x+3)/(x-2)')(-2), -1 / 4);
  check('112 distractor D: original numerator at -2 is 0', f(num)(-2), 0);
  // the reworded claim: two roots of the denominator, only one of them a line
  check('112 only one of the two roots is a real asymptote', vaCount(fx), 1);
  check('112 the other root stays finite (a hole)', Math.abs(hole(fx, -2)) < 1e3 ? 1 : 0, 1);
}

// ---------------------------------------------------------------------------
// The widening round (113–118): a root function, the reciprocal 1/f, a sketch,
// a second function built from the first, a graph that crosses its own
// horizontal asymptote, and a parameter that decides how many lines there are.
// ---------------------------------------------------------------------------

// rq-sub-asy-113 — sqrt(x+9)/(x-4): vertical x=4, horizontal y=0, domain edge -9
{
  const fx = 'sqrt(x+9)/(x-4)';
  checkSet('113 denominator root', roots('x-4', -8.9, 20), [4]);
  check('113 numerator at 4 is sqrt(13), not 0', f('sqrt(x+9)')(4), Math.sqrt(13), 1e-12);
  check('113 blows up at 4', blowsUp(fx, 4), 1);
  check('113 horizontal from the right end', HAright(fx), 0, 1e-2);
  check('113 the far value keeps shrinking', Math.abs(f(fx)(1e8)) < Math.abs(f(fx)(1e4)) ? 1 : 0, 1);
  check('113 the domain edge -9 is a value, not an asymptote', f(fx)(-9), 0);
  check('113 no blow-up at the domain edge', blowsUp(fx, -9), 0);
  check('113 wrong 1: the far value is nowhere near 1', Math.abs(HAright(fx) - 1) > 0.9 ? 1 : 0, 1);
  check('113 root beats nothing: numerator grows slower than the denominator',
    Math.abs(f('sqrt(x+9)')(1e6) / f('x-4')(1e6)) < 1e-2 ? 1 : 0, 1);
}

// rq-sub-asy-114 — f=(x-5)/(x+3) and g=1/f: still one vertical asymptote, moved
{
  const fx = '(x-5)/(x+3)', gx = '1/((x-5)/(x+3))', red = '(x+3)/(x-5)';
  checkSet('114 f: denominator root', roots('x+3'), [-3]);
  check('114 f: numerator at -3 = -8', f('x-5')(-3), -8);
  check('114 f has one vertical asymptote', vaCount(fx), 1);
  checkSet('114 the numerator of f vanishes at 5', roots('x-5'), [5]);
  for (const v of [-7, -1, 2, 8]) check(`114 g equals (x+3)/(x-5) at x=${v}`, f(gx)(v), f(red)(v), 1e-9);
  check('114 g blows up at 5', blowsUp(red, 5), 1);
  check('114 g still has exactly one vertical asymptote', vaCount(red), 1);
  check('114 g at -3 (reduced) is 0 — a hole, not a line', f(red)(-3), 0);
  check('114 g does not blow up at -3', blowsUp(red, -3), 0);
  check('114 wrong 2: two values leave the domain, only one is a line',
    roots('x+3').length + roots('x-5').length, 2);
  check('114 wrong 0: the line did not vanish, it moved', vaCount(red), 1);
}

// rq-sub-asy-115 — (3x+3)/(x-2): vertical x=2, horizontal y=3, both intercepts
{
  const fx = '(3*x+3)/(x-2)';
  checkSet('115 denominator root', roots('x-2'), [2]);
  check('115 numerator at 2 = 9', f('3*x+3')(2), 9);
  check('115 blows up at 2', blowsUp(fx, 2), 1);
  check('115 horizontal y = 3', HA(fx), 3, 1e-4);
  checkSet('115 x-intercept from the numerator', roots('3*x+3'), [-1]);
  check('115 f(-1) = 0', f(fx)(-1), 0);
  check('115 y-intercept f(0) = -1.5', f(fx)(0), -1.5);
  check('115 figure: right branch sits above y=3', f(fx)(3) > 3 && f(fx)(50) > 3 ? 1 : 0, 1);
  check('115 figure: left branch sits below y=3', f(fx)(0) < 3 && f(fx)(-50) < 3 ? 1 : 0, 1);
  check('115 wrong -1.5 is the y-intercept', f(fx)(0), -1.5);
  check('115 wrong 2 is the vertical asymptote', roots('x-2')[0], 2);
}

// rq-sub-asy-116 — g = 1/(f-1) with f=(2x-6)/(x+1): VA x=7, HA y=1, hole (-1,0)
{
  const fx = '(2*x-6)/(x+1)', gx = '1/((2*x-6)/(x+1)-1)', red = '(x+1)/(x-7)';
  for (const v of [-5, 0, 3, 9, 20]) check(`116 g equals (x+1)/(x-7) at x=${v}`, f(gx)(v), f(red)(v), 1e-9);
  checkSet('116 the new denominator vanishes at 7', roots('x-7'), [7]);
  check('116 f equals 1 exactly at x = 7', f(fx)(7), 1);
  check('116 numerator of g at 7 = 8', f('x+1')(7), 8);
  check('116 g blows up at 7', blowsUp(red, 7), 1);
  check('116 g has exactly one vertical asymptote', vaCount(red), 1);
  checkSet('116 f leaves its domain at -1', roots('x+1'), [-1]);
  check('116 reduced value at -1 is 0 — the hole', f(red)(-1), 0);
  check('116 no blow-up at -1', blowsUp(red, -1), 0);
  check('116 horizontal of g is y = 1', HA(red), 1, 1e-4);
  check('116 wrong 2: that is the horizontal of f, not of g', HA(fx), 2, 1e-4);
}

// rq-sub-asy-117 — (2x^2-x)/(x^2+1) does cross its own horizontal asymptote
{
  const fx = '(2*x^2-x)/(x^2+1)';
  check('117 horizontal y = 2', HA(fx), 2, 1e-4);
  checkSet('117 denominator has no real root', roots('x^2+1', -100, 100), []);
  check('117 therefore no vertical asymptote', vaCount(fx), 0);
  const cross = roots('(2*x^2-x)-2*(x^2+1)');
  checkSet('117 f(x)=2 has exactly one solution', cross, [-2]);
  check('117 the crossing point lies on y = 2', f(fx)(cross[0]), 2, 1e-9);
  check('117 left of the crossing the graph is above the line', f(fx)(-4) > 2 ? 1 : 0, 1);
  check('117 right of it the graph is below the line', f(fx)(0) < 2 && f(fx)(100) < 2 ? 1 : 0, 1);
  check('117 wrong "two points": the equation collapses to a linear one', cross.length, 1);
  check('117 wrong y=0 would need a bigger denominator degree', HA('(2*x^2-x)/(x^3+1)'), 0, 1e-4);
}

// rq-sub-asy-118 — (x+1)/(x^2-6x+m): exactly two lines when m<9 and m != -7
{
  const den = (m: number) => `x^2-6*x+(${m})`;
  const fm = (m: number) => `(x+1)/(${den(m)})`;
  checkSet('118 the discriminant vanishes at m = 9', roots('36-4*m', -50, 50, 'm'), [9]);
  check('118 m=8 gives two vertical asymptotes', vaCount(fm(8)), 2);
  check('118 m=0 gives two vertical asymptotes', vaCount(fm(0)), 2);
  check('118 m=9 gives one only (double root)', vaCount(fm(9)), 1);
  check('118 m=9 denominator vanishes at 3', f(den(9))(3), 0);
  check('118 m=9 numerator at 3 = 4, so that line survives', f('x+1')(3), 4);
  check('118 m=10 gives none', vaCount(fm(10)), 0);
  check('118 m=10 denominator never reaches 0',
    Math.min(...[-5, 0, 3, 6, 12].map((v) => f(den(10))(v))) > 0 ? 1 : 0, 1);
  checkSet('118 m=-7 denominator roots', roots(den(-7)), [7, -1]);
  check('118 m=-7: the numerator vanishes at -1 too', f('x+1')(-1), 0);
  check('118 m=-7 leaves one vertical asymptote only', vaCount(fm(-7)), 1);
  check('118 m=-7 hole height at -1 is -1/8', hole(fm(-7), -1), -1 / 8, 1e-4);
  checkSet('118 the cancelling value solves 1+6+m=0', roots('1+6+m', -50, 50, 'm'), [-7]);
}

// ---------------------------------------------------------------------------
// The exam-style round (Itay, 2026-09-06: "שאלות שבבגרות לא שואלים"). The asks
// of 102 / 110 / 112 / 114 / 116 / 117 were rewritten into the bagrut's own
// phrasing, and 110 / 112 / 117 gained mathematics the old ask never reached.
// Every claim the NEW wording makes is re-derived from the function itself.
// ---------------------------------------------------------------------------

// rq-sub-asy-102 — "מצאו את משוואות האסימפטוטות האנכיות (אם יש כאלה)": there are none
{
  check('102 the denominator keeps a positive minimum, so no candidate exists',
    Math.min(...[-8, -2, 0, 2, 8].map((v) => f('x^2+4')(v))), 4);
  check('102 the graph never blows up anywhere on a wide grid', vaCount('(x-1)/(x^2+4)', -50, 50), 0);
}

// rq-sub-asy-110 — the ask now adds the crossing with the x axis: (-3, 0) ONLY,
// because the shared factor x-3 takes both the line and the crossing from 3.
{
  const num = 'x^2-9', den = 'x^2+2*x-15', fx = `(${num})/(${den})`;
  checkSet('110 the numerator vanishes at 3 and -3', roots(num), [3, -3]);
  check('110 only -3 is a real crossing: f(-3) = 0', f(fx)(-3), 0);
  check('110 the denominator at -3 is -12, so the graph is defined there', f(den)(-3), -12);
  check('110 x = 3 is not on the graph at all (0/0)', Number.isNaN(f(fx)(3)) ? 1 : 0, 1);
  check('110 exactly one vertical line survives', vaCount(fx), 1);
}

// rq-sub-asy-112 — rebuilt as a second function: g = 1/(f+1), f = (x^2+5x+6)/(x^2-4)
{
  const fx = '(x^2+5*x+6)/(x^2-4)';
  const g = `1/((${fx})+1)`;
  const red = '(x-2)/(2*x+1)';
  checkSet('112 f leaves the domain at 2 and -2', roots('x^2-4'), [2, -2]);
  check('112 f reduces to (x+3)/(x-2) away from -2', f(fx)(5), f('(x+3)/(x-2)')(5));
  check('112 f+1 equals (2x+1)/(x-2)', f(`(${fx})+1`)(5), f('(2*x+1)/(x-2)')(5));
  checkSet('112 the new denominator 2x+1 vanishes at -1/2', roots('2*x+1'), [-1 / 2]);
  check('112 the numerator of g at -1/2 is -5/2', f('x-2')(-1 / 2), -5 / 2);
  check('112 g blows up at -1/2', blowsUp(g, -1 / 2), 1);
  check('112 g agrees with (x-2)/(2x+1) inside the domain', f(g)(4), f(red)(4));
  check('112 exactly one vertical line', vaCount(g), 1);
  check('112 horizontal y = 1/2', HA(g), 1 / 2, 1e-4);
  check('112 distractor: x = 2 stays finite on the reduced form (a hole)', f(red)(2), 0);
  check('112 distractor: x = -2 stays finite on the reduced form (a hole)', f(red)(-2), 4 / 3);
  check('112 distractor y = 1 is not the horizontal', Math.abs(HA(g) - 1) < 1e-4 ? 1 : 0, 0);
}

// rq-sub-asy-114 — the reworded ask wants the COUNT, so count it on both graphs
{
  const f114 = '(x-5)/(x+3)';
  const g114 = `1/(${f114})`;
  check('114 f has exactly one vertical line', vaCount(f114), 1);
  check('114 g has exactly one vertical line too', vaCount(g114), 1);
  check('114 but it moved to 5', blowsUp(g114, 5), 1);
  check('114 and -3 is a hole on g, not a line', blowsUp(g114, -3), 0);
}

// rq-sub-asy-116 — the ask now names the three objects one by one
{
  const g116 = '1/(((2*x-6)/(x+1))-1)';
  check('116 g agrees with (x+1)/(x-7) inside the domain', f(g116)(3), f('(x+1)/(x-7)')(3));
  check('116 the vertical line sits at 7', blowsUp(g116, 7), 1);
  check('116 the horizontal is y = 1', HA(g116), 1, 1e-4);
  check('116 x = -1 is a hole, not a line', blowsUp(g116, -1), 0);
}

// rq-sub-asy-117 — the ask now also wants the crossings with the x axis
{
  const fx = '(2*x^2-x)/(x^2+1)';
  checkSet('117 the numerator vanishes at 0 and 0.5', roots('2*x^2-x'), [0, 0.5]);
  check('117 the denominator at 0.5 is 1.25, so that root is a real crossing', f('x^2+1')(0.5), 1.25);
  check('117 f(0) = 0', f(fx)(0), 0);
  check('117 f(0.5) = 0', f(fx)(0.5), 0);
  check('117 the crossing with the asymptote is a different point: f(-2) = 2', f(fx)(-2), 2);
}

// ---------------------------------------------------------------------------
// Round 3 (301–305). Every parameter is SOLVED numerically from the condition
// the question states, never substituted from the authored answer; every hole
// is read as f(a ± 1e-6) and every line as a blow-up, so a hole can never pass
// as an asymptote. Each distractor is re-enacted as the mistake its note names.
//
// One subtlety, learned the hard way: bisection returns 3.999999999999999 for a
// parameter whose true value is 4, and rebuilding the function with THAT leaves
// a numerator of -3.6e-15 over an exact 0 at the cancelling point — so vaCount
// reads the hole as a second vertical line. Snap a solved parameter to 6 decimal
// places before feeding it back into an expression; the value still comes from
// the solve, and the checkSet above it is what proves the snap was legitimate.
const exact = (v: number) => Math.round(v * 1e6) / 1e6;

// rq-sub-asy-301 — (x^2+x-6)/(x^2-5x+6): line at 3, hole (2, -5), crossing (-3, 0)
{
  const num = 'x^2+x-6', den = 'x^2-5*x+6', fx = `(${num})/(${den})`;
  checkSet('301 denominator roots', roots(den), [2, 3]);
  checkSet('301 numerator roots', roots(num), [-3, 2]);
  check('301 only one of the two denominator roots is a line', vaCount(fx), 1);
  check('301 numerator at 3 = 6, so that root survives', f(num)(3), 6);
  check('301 x = 3 blows up', blowsUp(fx, 3), 1);
  check('301 numerator at 2 = 0 — both sides vanish', f(num)(2), 0);
  check('301 x = 2 does not blow up', blowsUp(fx, 2), 0);
  check('301 x = 2 is 0/0 on the original form', Number.isNaN(f(fx)(2)) ? 1 : 0, 1);
  check('301 the hole height at 2 is -5', hole(fx, 2), -5, 1e-4);
  check('301 the reduced form agrees away from 2', f(fx)(7), f('(x+3)/(x-3)')(7), 1e-9);
  check('301 f(-3) = 0, a real crossing', f(fx)(-3), 0);
  check('301 the denominator at -3 is 30, so the graph is defined there', f(den)(-3), 30);
  check('301 distractor "hole height 5": the sign came from the denominator -1', Math.abs(hole(fx, 2)), 5, 1e-4);
  check('301 distractor "(2, 0) is a crossing": the graph has no value at 2', Number.isNaN(f(fx)(2)) ? 1 : 0, 1);
}

// rq-sub-asy-302 — recover (ax+b)/(x+c) from VA x=4, HA y=-2 and the point (2, 1)
{
  const cs = roots('4+c', -20, 20, 'c');
  checkSet('302 c solves 4 + c = 0', cs, [-4]);
  const c = exact(cs[0]);
  // a is fixed by the horizontal asymptote: the far value of (a x + 2)/(x + c) must be -2
  const as = roots(`(a*1e6+2)/(1e6+(${c}))+2`, -20, 20, 'a');
  check('302 a solves "far value = -2"', as[0], -2, 1e-4);
  const bs = roots(`(-2*2+b)/(2+(${c}))-1`, -20, 20, 'b');
  checkSet('302 b solves the point equation at x = 2', bs, [2]);
  const fx = `(-2*x+${exact(bs[0])})/(x+(${c}))`;
  checkSet('302 the recovered function has its only vertical line at 4', roots(`x+(${c})`), [4]);
  check('302 it blows up there', blowsUp(fx, 4), 1);
  check('302 its numerator at 4 is -6, so it is a line and not a hole', f(`-2*x+${exact(bs[0])}`)(4), -6);
  check('302 its horizontal asymptote is -2', HA(fx), -2, 1e-4);
  check('302 it really passes through (2, 1)', f(fx)(2), 1, 1e-12);
  checkSet('302 wrong "a = 2": the point then forces b = -6', roots(`(2*2+b)/(2+(${c}))-1`, -20, 20, 'b'), [-6]);
  checkSet('302 wrong "swapped point": x=1, y=2 forces b = -4', roots(`(-2*1+b)/(1+(${c}))-2`, -20, 20, 'b'), [-4]);
}

// rq-sub-asy-303 — (x^2+ax-21)/(x^2-x-6) with a hole at x = 3
{
  const den = 'x^2-x-6';
  checkSet('303 denominator roots', roots(den), [3, -2]);
  const as = roots('3^2+3*a-21', -20, 20, 'a');
  checkSet('303 a solves "numerator vanishes at 3"', as, [4]);
  const a = exact(as[0]);
  const num = `x^2+(${a})*x-21`, fx = `(${num})/(${den})`;
  checkSet('303 with that a the numerator vanishes at 3 and -7', roots(num), [3, -7]);
  check('303 x = 3 does not blow up', blowsUp(fx, 3), 0);
  check('303 the hole height at 3 is 2', hole(fx, 3), 2, 1e-4);
  check('303 the reduced form agrees away from 3', f(fx)(10), f('(x+7)/(x+2)')(10), 1e-9);
  check('303 numerator at -2 = -25, so that root survives', f(num)(-2), -25);
  check('303 x = -2 blows up', blowsUp(fx, -2), 1);
  check('303 exactly one vertical line', vaCount(fx), 1);
  check('303 horizontal asymptote y = 1', HA(fx), 1, 1e-4);
  check('303 wrong a = -4 leaves the numerator at 3 equal to -24', f('x^2-4*x-21')(3), -24);
  check('303 wrong a = -4 keeps the line at 3', blowsUp('(x^2-4*x-21)/(x^2-x-6)', 3), 1);
  check('303 wrong 3.5 = ratio of the free terms', E('-21/-6'), 3.5);
}

// rq-sub-asy-304 — g = 1/(f-2) with f = (3x^2-6x-3)/(x^2-4): two lines, two holes
{
  const fx = '(3*x^2-6*x-3)/(x^2-4)';
  const gx = `1/((${fx})-2)`;
  const red = '(x^2-4)/(x^2-6*x+5)';
  for (const v of [-5, 0, 3, 7, 12]) check(`304 g equals (x^2-4)/(x^2-6x+5) at x=${v}`, f(gx)(v), f(red)(v), 1e-9);
  checkSet('304 f leaves its domain at 2 and -2', roots('x^2-4'), [2, -2]);
  const cross = roots(`(3*x^2-6*x-3)-2*(x^2-4)`);
  checkSet('304 f(x) = 2 has exactly the two solutions 1 and 5', cross, [1, 5]);
  check('304 f really equals 2 at the first of them', f(fx)(cross[0]), 2, 1e-9);
  check('304 f really equals 2 at the second', f(fx)(cross[1]), 2, 1e-9);
  check('304 numerator of g at 1 = -3', f('x^2-4')(1), -3);
  check('304 numerator of g at 5 = 21', f('x^2-4')(5), 21);
  check('304 g has exactly two vertical lines', vaCount(red), 2);
  check('304 horizontal asymptote of g is y = 1', HA(red), 1, 1e-4);
  check('304 x = 2 stays finite on g — a hole', f(red)(2), 0);
  check('304 x = -2 stays finite on g — a hole', f(red)(-2), 0);
  check('304 no blow-up at 2', blowsUp(red, 2), 0);
  check('304 no blow-up at -2', blowsUp(red, -2), 0);
  checkSet('304 the numerator of g vanishes exactly at the two missing values', roots('x^2-4'), [2, -2]);
  check('304 distractor y = 3 is the horizontal of f, not of g', HA(fx), 3, 1e-4);
  check('304 distractor "no holes": f itself has no value at 2, so g inherits the gap', Number.isFinite(f(fx)(2)) ? 0 : 1, 1);
  check('304 distractor "no holes": f has no value at -2 either', Number.isFinite(f(fx)(-2)) ? 0 : 1, 1);
}

// rq-sub-asy-305 — (2x+k)/(x-4) through (6, 12): k = 12, then the whole sketch
{
  const ks = roots('(2*6+k)/(6-4)-12', -50, 50, 'k');
  checkSet('305 k solves the point equation', ks, [12]);
  const k = exact(ks[0]);
  const num = `2*x+${k}`, fx = `(${num})/(x-4)`;
  check('305 the recovered function passes through (6, 12)', f(fx)(6), 12, 1e-12);
  checkSet('305 denominator root', roots('x-4'), [4]);
  check('305 numerator at 4 = 20, so it is a line', f(num)(4), 20);
  check('305 it blows up at 4', blowsUp(fx, 4), 1);
  check('305 exactly one vertical line', vaCount(fx), 1);
  check('305 horizontal asymptote y = 2', HA(fx), 2, 1e-4);
  checkSet('305 x-intercept from the numerator', roots(num), [-6]);
  check('305 f(-6) = 0', f(fx)(-6), 0);
  check('305 y-intercept f(0) = -3', f(fx)(0), -3);
  check('305 figure: the right branch sits above y = 2', f(fx)(5) > 2 && f(fx)(50) > 2 ? 1 : 0, 1);
  check('305 figure: the left branch sits below y = 2', f(fx)(0) < 2 && f(fx)(-50) < 2 ? 1 : 0, 1);
  checkSet('305 wrong k = -12 moves the x-intercept to 6', roots('2*x-12'), [6]);
  check('305 wrong k = -12 makes f(0) = 3', f('(2*x-12)/(x-4)')(0), 3);
  check('305 wrong "y-intercept 3": the sign was dropped', Math.abs(f(fx)(0)), 3);
}

summary('asymptotes');
