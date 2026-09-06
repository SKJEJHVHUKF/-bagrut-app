// Numeric re-derivation of content/lessons/math5/rq-extra/intersections.ts (rq-sub-int-101…112).
// An intercept claim is encoded as computation: x-intercepts are the real roots of the numerator
// (or radicand) that the question's own function is DEFINED at (mathjs gives Complex for a
// negative radicand, Infinity for a zero denominator); a y-intercept is f(0) when f is defined
// there. Every distractor / wrongAnswer note is re-enacted as the mistake it names.
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
  // "(אם יש כאלה)" is the honest hedge: the x-axis really is missed everywhere
  check('102 f is never 0 anywhere on its domain', xInts(fx, P, -200, 200).length, 0);
  check('102 but the graph does exist: f is defined on both sides of the pole',
    defined(fx, 0.999) + defined(fx, 1.001), 2);
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

// rq-sub-int-106 — (2x+8)/(x-4): BOTH intercepts asked — (-4,0) on the x-axis, (0,-2) on the y-axis
{
  const fx = '(2*x+8)/(x-4)';
  check('106 f defined at 0', defined(fx, 0), 1);
  check('106 f(0) = 8/(-4) = -2', num(fx)(0), -2);
  checkSet('106 the x-intercept is x = -4', xInts(fx, '2*x+8'), [-4]);
  check('106 note: f(-4) = 0', num(fx)(-4), 0);
  checkSet('106 distractor B/C = denominator zeroed', roots('x-4'), [4]);
  check('106 f undefined at 4', defined(fx, 4), 0);
  // the two intercepts are two DIFFERENT numbers: option B reuses -4 as a height
  check('106 distractor B: the height at x = 0 is not -4', num(fx)(0) - (-4), 2);
  // option D swaps the components: (0,-2) sits on the y-axis, so f(0) is not 0
  check('106 distractor D: the x-intercept is not at x = 0', num(fx)(0) === 0 ? 1 : 0, 0);
  check('106 and (-4,0) is not on the y-axis: the x-intercept is at -4, not 0',
    xInts(fx, '2*x+8')[0] === 0 ? 1 : 0, 0);
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
  // "אין חיתוך עם אף אחד מהצירים", proved on both axes separately
  check('108 no x-intercept: the constant numerator 5 has no root', roots('0*x+5', -100, 100).length, 0);
  check('108 no y-intercept: 0 and the endpoint 3 are both outside the domain',
    defined(fx, 0) + defined(fx, 3), 0);
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

// rq-sub-int-112 — (x-2)/(x^2-4): the claim "(2,0) is on the graph" is false (a hole),
// and the graded answer is the y-intercept's height, 0.5.
{
  const fx = '(x-2)/(x^2-4)';
  checkSet('112 numerator zero is 2', roots('x-2'), [2]);
  checkSet('112 denominator zeros are 2 and -2', roots('x^2-4'), [2, -2]);
  check('112 f undefined at 2 (hole)', defined(fx, 2), 0);
  // the disproof: the SAME value kills numerator and denominator together
  check('112 numerator and denominator both vanish at 2',
    Math.abs(num('x-2')(2)) + Math.abs(num('x^2-4')(2)), 0);
  check('112 surviving x-intercepts = 0', xInts(fx, 'x-2').length, 0);
  check('112 the graph exists on both sides of 2, so it is a hole and not a point',
    defined(fx, 1.999) + defined(fx, 2.001), 2);
  // the graded value: 0.5 IS f(0), recomputed
  check('112 f(0) = 1/2', num(fx)(0), E('1/2'));
  check('112 the graded 0.5 is f(0), not a restated literal', num(fx)(0) - 0.5, 0);
  check('112 -2/-4 is positive', E('(-2)/(-4)'), E('1/2'));
  // wrongAnswers re-enacted
  check('112 wrong -0.5: both parts are negative at 0, so the quotient is positive',
    Math.sign(num('x-2')(0)) * Math.sign(num('x^2-4')(0)), 1);
  check('112 wrong -2: the numerator alone at 0, before dividing by -4', num('x-2')(0), -2);
  check('112 wrong 2: that is the rejected x-candidate, and f(0) is not 2', num(fx)(0) === 2 ? 1 : 0, 0);
  check('112 f never zero on the domain: min |f| over grid > 0', Math.min(...GRID.map(v => Math.abs(num(fx)(v)))) > 0 ? 1 : 0, 1);
}

// rq-sub-int-113 — (x^2+ax-15)/(x+5) whose only x-intercept is (3,0): a = 2, f(0) = -3
{
  // a is recovered from the numerator vanishing at x = 3, not from the author's algebra
  const a = roots('3^2 + a*3 - 15', -20, 20, 'a');
  checkSet('113 a = 2', a, [2]);
  const P = `x^2+${a[0]}*x-15`, fx = `(${P})/(x+5)`;
  check('113 the numerator really vanishes at x = 3', num(P)(3), 0);
  checkSet('113 the numerator has two zeros, 3 and -5', roots(P), [3, -5]);
  check('113 f is undefined at -5, so that zero is not a point', defined(fx, -5), 0);
  checkSet('113 exactly one surviving x-intercept, at 3', xInts(fx, P), [3]);
  check('113 f(0) = -3', num(fx)(0), -3);
  check('113 the factorisation (x+5)(x-3) agrees with the numerator', Math.max(...GRID.map(v => Math.abs(num(P)(v) - num('(x+5)*(x-3)')(v)))), 0);
  check('113 wrong -15 = the numerator at 0, before dividing', num(P)(0), -15);
  check('113 wrong a = -2 leaves the numerator at 3 equal to -12', num('x^2-2*x-15')(3), -12);
}

// rq-sub-int-114 — (x^2-6x+k)/(x-1) with exactly one x-intercept: k = 9 or k = 5
{
  const fk = (k: number) => `(x^2-6*x+${k})/(x-1)`;
  /** the surviving x-intercepts for a given k, from the quadratic formula + the domain */
  const survivors = (k: number): number[] => {
    const D = 36 - 4 * k;
    if (D < 0) return [];
    const rs = [...new Set([(6 - Math.sqrt(D)) / 2, (6 + Math.sqrt(D)) / 2])];
    return rs.filter(r => defined(fk(k), r));
  };
  check('114 k = 9 leaves exactly one intercept', survivors(9).length, 1);
  checkSet('114 and it is x = 3', survivors(9), [3]);
  check('114 f(3) = 0 when k = 9', num(fk(9))(3), 0);
  check('114 k = 5 leaves exactly one intercept', survivors(5).length, 1);
  checkSet('114 and it is x = 5, because 1 is not in the domain', survivors(5), [5]);
  check('114 f is undefined at 1 when k = 5 (the cancelled zero)', defined(fk(5), 1), 0);
  check('114 the numerator of k = 5 does vanish at 1', num('x^2-6*x+5')(1), 0);
  check('114 a nearby k gives two intercepts', survivors(4).length, 2);
  check('114 k above 9 gives none', survivors(10).length, 0);
  check('114 the discriminant vanishes only at k = 9', roots('36-4*k', -50, 50, 'k')[0], 9);
  // the exhaustive claim: scan k and collect every value with exactly one intercept
  const ones: number[] = [];
  for (let i = -800; i <= 800; i++) {
    const k = i / 20;
    if (survivors(k).length === 1) ones.push(k);
  }
  checkSet('114 over -40 <= k <= 40 only 9 and 5 give one intercept', ones, [9, 5]);
}

// rq-sub-int-115 — x^2/(x-2) meets its own derivative exactly once, at (0,0)
{
  const fx = 'x^2/(x-2)', fp = '(x^2-4*x)/(x-2)^2';
  dcheck('115 the authored derivative is the derivative of f', fx, fp, [-3, -1, 0, 1, 3, 5]);
  const diff = `${fx} - (${fp})`;
  checkSet('115 f = f\' has one solution left of the pole', roots(diff, -10, 1.9), [0]);
  checkSet('115 and none to its right', roots(diff, 2.1, 12), []);
  check('115 f(0) = 0', num(fx)(0), 0);
  check('115 f\'(0) = 0', num(fp)(0), 0);
  check('115 the difference changes sign only at 0: negative at -1', num(diff)(-1) < 0 ? 1 : 0, 1);
  check('115 and positive at 1', num(diff)(1) > 0 ? 1 : 0, 1);
  checkSet('115 the quadratic factor x^2-3x+4 has no real root', roots('x^2-3*x+4', -100, 100), []);
  check('115 its discriminant is -7', E('(-3)^2 - 4*1*4'), -7);
  check('115 f is undefined at 2', defined(fx, 2), 0);
}

// rq-sub-int-116 — (x+1)(x-4)/(x-2): zeros at -1 and 4, pole at 2, sign pattern - + - +
{
  const P = '(x+1)*(x-4)', fx = `(${P})/(x-2)`;
  checkSet('116 the x-intercepts are -1 and 4', xInts(fx, P), [-1, 4]);
  check('116 f(0) = 2', num(fx)(0), 2);
  check('116 f is undefined at 2', defined(fx, 2), 0);
  check('116 x = 2 is an asymptote, not a hole: |f| blows up on both sides', Math.min(Math.abs(num(fx)(1.999)), Math.abs(num(fx)(2.001))) > 1000 ? 1 : 0, 1);
  // the sign row of the table, read as one binary word: - + - + over the four ranges
  const word = [-5, 0, 3, 6].map(v => (num(fx)(v) > 0 ? '1' : '0')).join('');
  check('116 the sign table row is - + - +', parseInt(word, 2), 0b0101);
  check('116 positive across the whole range -1 < x < 2', Math.min(...[-0.9, -0.5, 0.5, 1.2, 1.9].map(v => num(fx)(v))) > 0 ? 1 : 0, 1);
  check('116 positive across the whole range x > 4', Math.min(...[4.1, 5, 8, 20].map(v => num(fx)(v))) > 0 ? 1 : 0, 1);
  check('116 negative across the whole range x < -1', Math.max(...[-1.1, -2, -5, -20].map(v => num(fx)(v))) < 0 ? 1 : 0, 1);
  check('116 negative across the whole range 2 < x < 4', Math.max(...[2.1, 2.5, 3, 3.9].map(v => num(fx)(v))) < 0 ? 1 : 0, 1);
}

summary('intersections');
