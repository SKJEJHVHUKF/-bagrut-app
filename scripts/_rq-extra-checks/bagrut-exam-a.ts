// Numeric re-derivation of content/lessons/math5/rq-extra/bagrut-exam-a.ts
// (fn-bag-rq-008, fn-bag-rq-011, fn-bag-rq-012), bound to the LIVE content:
// every question is read from ROOT_QUOTIENT_BAGRUT by id, its stem must still
// hold the function re-derived here, and every graded `expected` is compared
// with a value COMPUTED below (derivatives symbolically, areas by quadrature and
// by the antiderivative the solution states, solution counts by two methods).
//
//   npx tsx scripts/_rq-extra-checks/bagrut-exam-a.ts
import { check, dcheck, icheck, summary, math, E } from './_lib';
import { ROOT_QUOTIENT_BAGRUT } from '../../content/lessons/math5/functions-root-quotient';

const fx = (expr: string) => {
  const c = math.parse(expr).compile();
  return (v: number) => c.evaluate({ x: v }) as number;
};
const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const grid = (lo: number, hi: number, n = 4000) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
/** strict sign changes of g on a grid (transversal crossings only) */
const crossings = (g: (x: number) => number, lo: number, hi: number) => {
  let prev = NaN, n = 0;
  for (const x of grid(lo, hi, 20000)) {
    const v = g(x);
    if (!Number.isFinite(v)) { prev = NaN; continue; }
    if (Number.isFinite(prev) && sgn(prev) * sgn(v) < 0) n++;
    prev = v;
  }
  return n;
};
/** Simpson with many panels — for integrands with a √ endpoint. */
const simpson = (g: (x: number) => number, a: number, b: number, n = 400000) => {
  const h = (b - a) / n;
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * g(a + i * h);
  return (s * h) / 3;
};

function live(id: string) {
  const q = ROOT_QUOTIENT_BAGRUT.find((x) => x.id === id);
  check(`${id} is served by ROOT_QUOTIENT_BAGRUT`, q ? 1 : 0, 1);
  const part = (label: string) => {
    const p = q?.parts.find((x) => x.label === label);
    check(`${id}/${label} exists`, p ? 1 : 0, 1);
    return p;
  };
  const value = (label: string) => {
    const e = part(label)?.expected as { kind: string; value?: string } | undefined;
    check(`${id}/${label} expected is a value`, e?.kind === 'value' ? 1 : 0, 1);
    return e?.value ? E(e.value) : NaN;
  };
  const tuple = (label: string, n: number) => {
    const p = part(label);
    const e = p?.expected as { kind: string; values?: string[] } | undefined;
    check(`${id}/${label} expected is a set with ${n} labelled boxes`, e?.kind === 'set' && e.values?.length === n && p?.answerLabels?.length === n ? 1 : 0, 1);
    return (e?.values ?? []).map(E);
  };
  const stemHas = (needle: string) => check(`${id} stem still defines ${needle}`, q?.context.includes(needle) ? 1 : 0, 1);
  const finalHas = (label: string, needle: string) =>
    check(`${id}/${label} final answer states ${needle}`, part(label)?.solution.final_answer.includes(needle) ? 1 : 0, 1);
  return { q, part, value, tuple, stemHas, finalHas };
}

// ============================================================ fn-bag-rq-008 — f(x) = (x² + a)/√x
{
  const L = live('fn-bag-rq-008');
  L.stemHas('f(x) = \\dfrac{x^2 + a}{\\sqrt{x}}');
  // א — domain x > 0, asymptote x = 0 with f → +∞ from the right, no axis points
  for (const a of [3, 0.5, 7]) {
    const f = fx(`(x^2 + ${a})/sqrt(x)`);
    check(`008 א a=${a}: undefined at x = -0.1 (radicand negative)`, Number.isNaN(f(-0.1)) || !Number.isFinite(f(-0.1)) ? 1 : 0, 1);
    check(`008 א a=${a}: f(1e-10) blows up`, f(1e-10) > 1e4 ? 1 : 0, 1);
    check(`008 א a=${a}: numerator at 0 equals a`, E(`0^2 + ${a}`), a);
    check(`008 א a=${a}: no x-axis point (min of numerator > 0)`, Math.min(...grid(0, 10).map((x) => x * x + a)) > 0 ? 1 : 0, 1);
  }
  L.finalHas('א', '$x > 0$');
  // ב — f'(x) = (3x² − a)/(2x√x) for every a; extremum at x = 1 ⇒ a = 3
  const pos = [0.3, 0.7, 1, 2.5, 4];
  for (const a of [3, 5]) {
    dcheck(`008 ב derivative formula, a=${a}`, `(x^2 + ${a})/sqrt(x)`, `(3x^2 - ${a})/(2x*sqrt(x))`, pos);
    dcheck(`008 ב split form x^(3/2) + a x^(-1/2), a=${a}`, `x^(3/2) + ${a}*x^(-1/2)`, `(3x^2 - ${a})/(2x*sqrt(x))`, pos);
    dcheck(`008 ב power-rule line 3/2 x^(1/2) - a/2 x^(-3/2), a=${a}`, `(x^2 + ${a})/sqrt(x)`, `3/2*x^(1/2) - ${a}/2*x^(-3/2)`, pos);
  }
  check('008 ב common denominator: 3/2 x^(1/2) = 3x²/(2x√x) at 2.5', fx('3/2*x^(1/2)')(2.5), fx('3x^2/(2x*sqrt(x))')(2.5));
  check('008 ב denominator 2x√x at x = 1 is 2', fx('2x*sqrt(x)')(1), 2);
  const a008 = 3 * 1 ** 2; // 3·1² − a = 0
  check('008 ב a from f\'(1) = 0 matches live expected', L.value('ב'), a008);
  check('008 ב that a makes f\'(1) vanish', fx(`(3x^2 - ${a008})/(2x*sqrt(x))`)(1), 0);
  // ג — a = 3: roots ±1, −1 rejected, sign − then +, min (1, 4)
  const fp = fx('(3x^2 - 3)/(2x*sqrt(x))');
  check('008 ג factorisation 3x²−3 = 3(x−1)(x+1) at x = 2.7', E('3*2.7^2 - 3'), E('3*(2.7-1)*(2.7+1)'));
  check('008 ג root −1 is outside x > 0', sgn(-1), -1);
  check('008 ג table: f\' < 0 on (0, 1)', sgn(fp(0.5)), -1);
  check('008 ג table: f\' > 0 on (1, ∞)', sgn(fp(3)), 1);
  const f8 = fx('(x^2 + 3)/sqrt(x)');
  const [x8, y8] = L.tuple('ג', 2);
  check('008 ג minimum x (box 1)', x8, 1);
  check('008 ג minimum y (box 2) = f(1)', y8, f8(1));
  L.finalHas('ג', '(1,\\; 4)');
  // ד — no horizontal asymptote: f ~ x^(3/2)
  check('008 ד f(x)/x^(3/2) → 1', f8(1e8) / 1e12, 1, 1e-6);
  check('008 ד f grows without bound', f8(1e6) > 1e8 ? 1 : 0, 1);
  // ה — the tangent through the origin: f(x0) = x0·f'(x0) ⇔ 2x0² + 6 = 3x0² − 3
  const f8p = fx('(3x^2 - 3)/(2x*sqrt(x))');
  check('008 ה f(x0) = x0 f\'(x0) times 2√x0 is 2x0² + 6 = 3x0² − 3 (at 1.7)', 2 * Math.sqrt(1.7) * (f8(1.7) - 1.7 * f8p(1.7)), E('2*1.7^2 + 6 - (3*1.7^2 - 3)'), 1e-9);
  const x0 = Math.sqrt(9);
  check('008 ה the other root −3 is outside x > 0', sgn(-x0), -1);
  const [tx, ty, tm] = L.tuple('ה', 3);
  check('008 ה box 1 = x0', tx, x0);
  check('008 ה box 2 = f(3) = 4√3', ty, f8(x0));
  check('008 ה box 3 = f\'(3) = 4√3/3', tm, f8p(x0));
  check('008 ה the tangent at 3 passes through the origin', ty - tm * tx, 0);
  check('008 ה it is the ONLY such tangent: f(x) − x f\'(x) changes sign once on x > 0', crossings((x) => f8(x) - x * f8p(x), 1e-3, 500), 1);
  check('008 ה 12/√3 = 4√3', E('12/sqrt(3)'), E('4*sqrt(3)'));
  check('008 ה 24/(6√3) = 4√3/3', E('24/(6*sqrt(3))'), E('4*sqrt(3)/3'));
  L.finalHas('ה', '\\left(3,\\; 4\\sqrt{3}\\right)');
  // ו — area 92/5 from x = 1 to 4
  const F8 = '2/5*x^(5/2) + 6*sqrt(x)';
  dcheck('008 ו antiderivative F\' = f', F8, '(x^2 + 3)/sqrt(x)', pos);
  check('008 ו 4^(5/2) = 32', E('4^(5/2)'), 32);
  check('008 ו F(4) = 124/5', fx(F8)(4), E('124/5'));
  check('008 ו F(1) = 32/5', fx(F8)(1), E('32/5'));
  check('008 ו positive on [1, 4]', Math.min(...grid(1, 4).map(f8)) > 0 ? 1 : 0, 1);
  icheck('008 ו quadrature 1..4', '(x^2 + 3)/sqrt(x)', 1, 4, fx(F8)(4) - fx(F8)(1));
  check('008 ו area matches live expected', L.value('ו'), fx(F8)(4) - fx(F8)(1));
}

// ============================================================ fn-bag-rq-011 — f(x) = a(x − 1)²/x⁴
{
  const L = live('fn-bag-rq-011');
  L.stemHas('f(x) = \\dfrac{a(x - 1)^2}{x^4}');
  const samp = [-2.3, -0.7, 0.4, 1.3, 2.6, 5];
  for (const a of [16, 5]) {
    const f = fx(`${a}(x - 1)^2/x^4`);
    // א
    check(`011 א a=${a}: numerator at x = 0 is a`, E(`${a}*(0 - 1)^2`), a);
    check(`011 א a=${a}: f → +∞ at 0 from both sides`, Math.min(f(-1e-4), f(1e-4)) > 1e10 ? 1 : 0, 1);
    check(`011 א a=${a}: f → 0 at both ends`, Math.max(Math.abs(f(1e5)), Math.abs(f(-1e5))) < 1e-6 ? 1 : 0, 1);
    check(`011 א a=${a}: f ≥ 0 and zero only at 1`, Math.min(...grid(-6, 6, 6001).filter((x) => Math.abs(x) > 1e-9 && Math.abs(x - 1) > 1e-6).map(f)) > 0 ? 1 : 0, 1);
    check(`011 א a=${a}: f(1) = 0`, f(1), 0);
    // ב
    dcheck(`011 ב derivative formula a=${a}`, `${a}(x - 1)^2/x^4`, `2*${a}*(x - 1)(2 - x)/x^5`, samp);
    check(`011 ב common factor identity a=${a} at 2.6`, E(`2*${a}*(2.6-1)*2.6^4 - ${a}*(2.6-1)^2*4*2.6^3`), E(`2*${a}*(2.6-1)*2.6^3*(2-2.6)`), 1e-7);
    check(`011 ב max height a=${a} is a/16`, f(2), a / 16);
  }
  const fp = fx('32(x - 1)(2 - x)/x^5');
  check('011 ב table x < 0: +', sgn(fp(-1)), 1);
  check('011 ב table 0 < x < 1: −', sgn(fp(0.5)), -1);
  check('011 ב table 1 < x < 2: +', sgn(fp(1.5)), 1);
  check('011 ב table x > 2: −', sgn(fp(3)), -1);
  const [xmin, xmax] = L.tuple('ב', 2);
  check('011 ב box 1 = x of the minimum', xmin, 1);
  check('011 ב box 2 = x of the maximum', xmax, 2);
  // ג — f(x) = 1 has exactly three solutions ⇔ the maximum a/16 equals 1
  const count1 = (a: number) => {
    const g = fx(`${a}(x - 1)^2/x^4 - 1`);
    const touch = Math.abs(g(2)) < 1e-12 ? 1 : 0; // the maximum sits ON the line (a tangency, no sign change)
    return crossings(g, -200, -1e-3) + crossings(g, 1e-3, 1) + crossings(g, 1, 200) + touch;
  };
  check('011 ג a = 16: three solutions', count1(16), 3);
  check('011 ג a = 12 (maximum below the line): two', count1(12), 2);
  check('011 ג a = 20 (maximum above the line): four', count1(20), 4);
  check('011 ג each branch left of 1 gives one solution for any a > 0 (a = 3)', crossings(fx('3(x - 1)^2/x^4 - 1'), -200, -1e-3) + crossings(fx('3(x - 1)^2/x^4 - 1'), 1e-3, 1), 2);
  const a011 = 16 * 1; // a/16 = 1
  check('011 ג a matches live expected', L.value('ג'), a011);
  for (const r of [2, E('-2 + 2*sqrt(2)'), E('-2 - 2*sqrt(2)')]) check(`011 ג check root ${r.toFixed(4)} solves 16(x−1)² = x⁴`, E(`16*(${r} - 1)^2 - (${r})^4`), 0, 1e-9);
  check('011 ג (x − 2)² = 0 is 4(x − 1) = x² rearranged (at 3.3)', E('4*(3.3 - 1) - 3.3^2'), -E('(3.3 - 2)^2'), 1e-12);
  L.finalHas('ד', '(2,\\; 1)');
  // ה — g = 1/f
  const f = fx('16(x - 1)^2/x^4');
  const g = (x: number) => 1 / f(x);
  check('011 ה f undefined at 0 (so g is too)', Number.isFinite(f(0)) ? 0 : 1, 1);
  check('011 ה g → 0 next to 0 (missing point (0, 0))', Math.max(g(-1e-4), g(1e-4)) < 1e-10 ? 1 : 0, 1);
  check('011 ה g → +∞ at 1 from both sides', Math.min(g(1 - 1e-5), g(1 + 1e-5)) > 1e8 ? 1 : 0, 1);
  check('011 ה g → +∞ at both ends', Math.min(g(1e3), g(-1e3)) > 1e4 ? 1 : 0, 1);
  const gp = (x: number) => (g(x + 1e-6) - g(x - 1e-6)) / 2e-6;
  check('011 ה g decreasing on (1, 2)', sgn(gp(1.5)), -1);
  check('011 ה g increasing on (2, ∞)', sgn(gp(3)), 1);
  check('011 ה g decreasing on x < 0', sgn(gp(-1)), -1);
  check('011 ה g increasing on (0, 1)', sgn(gp(0.5)), 1);
  const [gx, gy] = L.tuple('ה', 2);
  check('011 ה box 1 = x of g\'s minimum', gx, 2);
  check('011 ה box 2 = g(2) = 1/f(2)', gy, g(2));
  // ו — ∫ from 1 to 4 via u = 1 − 1/x
  dcheck('011 ו u\' = 1/x²', '1 - 1/x', '1/x^2', samp);
  check('011 ו f = 16·u\'·u² at 2.6', f(2.6), E('16 * (1/2.6^2) * (1 - 1/2.6)^2'));
  check('011 ו (x − 1)/x = 1 − 1/x at 2.6', E('(2.6 - 1)/2.6'), E('1 - 1/2.6'));
  const F = '16/3*(1 - 1/x)^3';
  dcheck('011 ו F\' = f', F, '16(x - 1)^2/x^4', samp);
  check('011 ו (3/4)³ = 27/64', E('(3/4)^3'), E('27/64'));
  check('011 ו F(4) = 9/4', fx(F)(4), E('9/4'));
  check('011 ו F(1) = 0', fx(F)(1), 0);
  icheck('011 ו quadrature 1..4', '16(x - 1)^2/x^4', 1, 4, fx(F)(4) - fx(F)(1));
  check('011 ו area matches live expected', L.value('ו'), fx(F)(4) - fx(F)(1));
}

// ============================================================ fn-bag-rq-012 — f(x) = (x + a)√(8 − x)
{
  const L = live('fn-bag-rq-012');
  L.stemHas('f(x) = (x + a)\\sqrt{8 - x}');
  const left = [-6, -2.5, -1, 0.5, 3, 6.5, 7.5];
  for (const a of [4, 7]) {
    const f = fx(`(x + ${a})*sqrt(8 - x)`);
    // א
    check(`012 א a=${a}: undefined right of 8`, Number.isFinite(f(8.01)) ? 0 : 1, 1);
    check(`012 א a=${a}: f(8) = 0`, f(8), 0);
    check(`012 א a=${a}: f(−a) = 0`, f(-a), 0);
    // ב
    dcheck(`012 ב derivative formula a=${a}`, `(x + ${a})*sqrt(8 - x)`, `(16 - ${a} - 3x)/(2*sqrt(8 - x))`, left);
    dcheck(`012 ב product-rule line a=${a}`, `(x + ${a})*sqrt(8 - x)`, `sqrt(8 - x) - (x + ${a})/(2*sqrt(8 - x))`, left);
    check(`012 ב numerator identity a=${a} at 2.5`, E(`2*(8 - 2.5) - (2.5 + ${a})`), E(`16 - ${a} - 3*2.5`));
    check(`012 ב f'(7) = (−5 − a)/2 for a=${a}`, fx(`(16 - ${a} - 3x)/(2*sqrt(8 - x))`)(7), (-5 - a) / 2);
  }
  const a012 = 9 - 5; // (−5 − a)/2 = −4.5 ⇒ −5 − a = −9
  check('012 ב a matches live expected', L.value('ב'), a012);
  // ג — a = 4: maximum (4, 16) and the endpoint minimum (8, 0)
  const f = fx('(x + 4)*sqrt(8 - x)');
  const fp = fx('(12 - 3x)/(2*sqrt(8 - x))');
  check('012 ג root of 12 − 3x', 12 / 3, 4);
  check('012 ג f\' > 0 left of 4', sgn(fp(0)), 1);
  check('012 ג f\' < 0 on (4, 8)', sgn(fp(6)), -1);
  check('012 ג table cell 12 − 3x at x = 8 is negative', sgn(12 - 3 * 8), -1);
  check('012 ג derivative undefined at 8', Number.isFinite(fp(8)) ? 0 : 1, 1);
  check('012 ג endpoint is a minimum: f decreases into it', f(7.99) > f(8) && f(7.9) > f(7.99) ? 1 : 0, 1);
  const [mx, my, ex, ey] = L.tuple('ג', 4);
  check('012 ג box 1 = x of the maximum', mx, 4);
  check('012 ג box 2 = f(4)', my, f(4));
  check('012 ג box 3 = x of the endpoint', ex, 8);
  check('012 ג box 4 = f(8)', ey, f(8));
  L.finalHas('ג', '(8,\\; 0)');
  // ד — the line through (4, 16) and (8, 0), and no other common point
  const slope = (f(8) - f(4)) / (8 - 4);
  const icpt = f(8) - slope * 8;
  const [ls, li] = L.tuple('ד', 2);
  check('012 ד box 1 = slope', ls, slope);
  check('012 ד box 2 = intercept', li, icpt);
  const line = (x: number) => slope * x + icpt;
  check('012 ד −4x + 32 = 4(8 − x) at 2.5', line(2.5), 4 * (8 - 2.5));
  check('012 ד squaring x + 4 = 4√(8 − x) gives x² + 24x − 112 (at 1.5)', E('(1.5 + 4)^2 - 16*(8 - 1.5)'), E('1.5^2 + 24*1.5 - 112'), 1e-12);
  check('012 ד (x − 4)(x + 28) = x² + 24x − 112 (at 1.5)', E('(1.5 - 4)*(1.5 + 28)'), E('1.5^2 + 24*1.5 - 112'), 1e-12);
  check('012 ד −28 is rejected: x + 4 < 0 there', sgn(-28 + 4), -1);
  check('012 ד −28 does not solve the unsquared equation', Math.abs(f(-28) - line(-28)) > 1 ? 1 : 0, 1);
  check('012 ד exactly one crossing of f − line left of 8 (at x = 4)', crossings((x) => f(x) - line(x), -300, 7.999), 1);
  check('012 ד and the endpoint is the second common point', f(8) - line(8), 0);
  L.finalHas('ד', '$y = -4x + 32$');
  // ה — region between the graph and that line
  check('012 ה at 7: graph 11, line 4', f(7) - 11 + (line(7) - 4), 0);
  check('012 ה graph above the line inside (4, 8)', Math.min(...grid(4.001, 7.999).map((x) => f(x) - line(x))) > 0 ? 1 : 0, 1);
  check('012 ה split x + 4 = 12 − (8 − x) at 2.5', f(2.5), E('12*(8 - 2.5)^(1/2) - (8 - 2.5)^(3/2)'));
  const F = '-8*(8 - x)^(3/2) + 2/5*(8 - x)^(5/2)';
  dcheck('012 ה F\' = f', F, '(x + 4)*sqrt(8 - x)', left);
  dcheck('012 ה first piece: (−8(8−x)^(3/2))\' = 12(8−x)^(1/2)', '-8*(8 - x)^(3/2)', '12*(8 - x)^(1/2)', left);
  dcheck('012 ה second piece: (−2/5(8−x)^(5/2))\' = (8−x)^(3/2)', '-2/5*(8 - x)^(5/2)', '(8 - x)^(3/2)', left);
  check('012 ה 12 / (−3/2) = −8', E('12/(-3/2)'), -8);
  check('012 ה F(8) = 0', fx(F)(8), 0);
  check('012 ה F(4) = −256/5', fx(F)(4), E('-256/5'));
  const underGraph = fx(F)(8) - fx(F)(4);
  check('012 ה ∫ f from 4 to 8 by quadrature', simpson(f, 4, 8), underGraph, 1e-6);
  check('012 ה triangle under the line = ∫ line', simpson(line, 4, 8), (4 * 16) / 2, 1e-9);
  check('012 ה area matches live expected', L.value('ה'), underGraph - (4 * 16) / 2);
  // ו — y-intercept and the left end
  check('012 ו f(0) = 8√2', f(0), 8 * Math.SQRT2);
  check('012 ו 4√8 = 8√2', E('4*sqrt(8)'), E('8*sqrt(2)'));
  check('012 ו f → −∞ at the left', f(-1e6) < -1e8 ? 1 : 0, 1);
  L.finalHas('ו', '8\\sqrt{2}');
  // ז — g = √f on the closed domain where f ≥ 0
  check('012 ז f < 0 just left of −4', sgn(f(-4.001)), -1);
  check('012 ז f ≥ 0 on [−4, 8]', Math.min(...grid(-4, 8, 12000).map(f)) >= -1e-12 ? 1 : 0, 1);
  const g = (x: number) => Math.sqrt(f(x));
  check('012 ז g(−4) = 0', g(-4), 0);
  check('012 ז g(8) = 0', g(8), 0);
  check('012 ז g peaks at 4', grid(-4, 8, 12000).reduce((best, x) => (g(x) > g(best) ? x : best), -4), 4, 1e-9);
  const [gx, gy] = L.tuple('ז', 2);
  check('012 ז box 1 = x of g\'s maximum', gx, 4);
  check('012 ז box 2 = √f(4)', gy, g(4));
  L.finalHas('ז', '-4 \\le x \\le 8');
}

summary('bagrut-exam-a');
