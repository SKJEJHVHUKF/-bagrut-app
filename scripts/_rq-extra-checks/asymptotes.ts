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
}

summary('asymptotes');
