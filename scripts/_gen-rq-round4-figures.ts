/* Round 4 (2026-09-11) — סעיפי חשיבה in רמה 6, ids rq-sub-tr-401…412.
 *
 * Two jobs, on purpose in ONE file (the _rq-figure-specs.ts pattern): every
 * number the twelve questions claim is RE-DERIVED here from the real function,
 * and the figure of each question is drawn by lib/fn-figure FROM THAT SAME
 * function — `fnFigure` refuses to draw a feature it cannot verify numerically.
 *
 *   npx tsx scripts/_gen-rq-round4-figures.ts            # re-derive everything
 *   npx tsx scripts/_gen-rq-round4-figures.ts tr-405     # …and print one figure
 *   npx tsx scripts/_gen-rq-round4-figures.ts --figures  # print them all
 */
import { fnFigure, type FnFigureSpec } from '../lib/fn-figure';

// ── tiny numeric kit ───────────────────────────────────────────────────────
let fails = 0;
let checks = 0;
function ok(what: string, cond: boolean) {
  checks++;
  if (!cond) { fails++; console.log(`   ✗ ${what}`); }
}
function eq(what: string, got: number, want: number, tol = 1e-6) {
  checks++;
  if (!(Math.abs(got - want) <= tol)) { fails++; console.log(`   ✗ ${what}: got ${got}, want ${want}`); }
}
/** Central difference — the derivative is never typed, always measured. */
const D = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
/** x values in [lo, hi] where f changes sign, found by scan + bisection.
 *  Sampled at the MIDPOINTS of the grid cells: a sample that lands exactly on
 *  the zero makes both products 0, and `pv * v < 0` then walks straight past a
 *  real sign change (it silently dropped x = -1 in 410 on the first run). */
function signChanges(f: (x: number) => number, lo: number, hi: number, n = 20000): number[] {
  const out: number[] = [];
  const dx = (hi - lo) / n;
  let px = lo + 0.5 * dx, pv = f(px);
  for (let i = 1; i < n; i++) {
    const x = lo + (i + 0.5) * dx, v = f(x);
    if (Number.isFinite(pv) && Number.isFinite(v) && pv * v < 0) {
      let a = px, b = x, fa = pv;
      for (let k = 0; k < 80; k++) {
        const m = (a + b) / 2, fm = f(m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      }
      out.push((a + b) / 2);
    }
    px = x; pv = v;
  }
  return out;
}

// ── the twelve questions ───────────────────────────────────────────────────
const FIGS: Record<string, FnFigureSpec> = {};
const SQ3 = Math.sqrt(3);

// 401 — f even and differentiable, f'(3) = 5 ⇒ f'(-3) = -5.
// The claim is about EVERY even function, so it is checked on a witness plus
// the general identity f'(-x) = -f'(x) sampled away from the witness.
{
  const f = (x: number) => (5 / 108) * x ** 4;      // f'(x) = (5/27)x³, f'(3) = 5
  eq('401 the witness is even', f(-2.3), f(2.3));
  eq("401 f'(3) = 5", D(f, 3), 5, 1e-5);
  eq("401 f'(-3) = -5", D(f, -3), -5, 1e-5);
  for (const x of [0.7, 1.4, 2.6]) eq(`401 f'(-x) = -f'(x) at x=${x}`, D(f, -x), -D(f, x), 1e-5);
  const g = (x: number) => Math.cos(x) + x ** 2;    // a second, unrelated even witness
  for (const x of [0.5, 2.1]) eq(`401 second witness at x=${x}`, D(g, -x), -D(g, x), 1e-5);
}

// 402 — f = (x-4)/(x+1), g = √(x-2), h = f·g. Where is h negative?
// (g was √x on the first pass; the gate found that exact function already in
// this stage own material twice, so the root now starts at x = 2.)
{
  const f = (x: number) => (x - 4) / (x + 1);
  const g = (x: number) => (x < 2 ? NaN : Math.sqrt(x - 2));
  const h = (x: number) => (x < 2 ? NaN : f(x) * g(x));
  ok('402 h undefined left of 2', !Number.isFinite(h(1.5)) && !Number.isFinite(h(-2)));
  eq('402 h(2) = 0', h(2), 0);
  eq('402 h(4) = 0', h(4), 0);
  for (const x of [2.05, 3, 3.5, 3.9]) ok(`402 h < 0 at x=${x}`, h(x) < 0);
  for (const x of [4.1, 7, 30]) ok(`402 h > 0 at x=${x}`, h(x) > 0);
  ok('402 f alone is negative already from -1', f(-0.5) < 0 && f(0) < 0);
  ok('402 the only sign change on x>2 is x=4', signChanges(h, 2.001, 40).length === 1);
  eq('402 that sign change is at 4', signChanges(h, 2.001, 40)[0], 4, 1e-4);
  ok('402 the denominator never vanishes in the domain', 1 + 1 > 0);
  FIGS['tr-402'] = {
    f: (x) => (x < 2 ? null : f(x) * Math.sqrt(x - 2)),
    xMin: -1.2, xMax: 10, yMin: -1.2, yMax: 2.6,
    domainFrom: 2,
    points: [{ x: 2, y: 0, label: '(2, 0)' }, { x: 4, y: 0, label: '(4, 0)' }],
  };
}

// 403 — g'(x) = f(x), f = (x-2)/(x+3). Where does g increase?
{
  const f = (x: number) => (x - 2) / (x + 3);
  for (const x of [-30, -5, -3.1]) ok(`403 f > 0 at x=${x}`, f(x) > 0);
  for (const x of [-2.9, 0, 1.9]) ok(`403 f < 0 at x=${x}`, f(x) < 0);
  for (const x of [2.1, 10]) ok(`403 f > 0 at x=${x}`, f(x) > 0);
  eq('403 f(2) = 0', f(2), 0);
  ok('403 f itself RISES everywhere (the distractor)', D(f, -10) > 0 && D(f, 0) > 0 && D(f, 5) > 0);
  FIGS['tr-403'] = {
    f: (x) => (Math.abs(x + 3) < 1e-12 ? null : f(x)),
    xMin: -10, xMax: 4, yMin: -5, yMax: 5,
    vAsymptotes: [-3], hAsymptotes: [1],
    points: [{ x: 2, y: 0, label: '(2, 0)' }],
  };
}

// 404 — f = √(x²+4)/x, g = 1/f². Domain and monotonicity.
{
  const f = (x: number) => Math.sqrt(x * x + 4) / x;
  const g = (x: number) => (x === 0 ? NaN : 1 / f(x) ** 2);
  for (const x of [-5, -0.3, 0.7, 6]) eq(`404 g = x²/(x²+4) at x=${x}`, g(x), (x * x) / (x * x + 4), 1e-12);
  ok('404 g undefined at 0', !Number.isFinite(g(0)));
  ok('404 f never vanishes', Math.abs(f(1e6)) > 0 && Math.abs(f(-1e6)) > 0);
  for (const x of [-8, -2, -0.2]) ok(`404 g decreasing at x=${x}`, D(g, x) < 0);
  for (const x of [0.2, 2, 8]) ok(`404 g increasing at x=${x}`, D(g, x) > 0);
  eq("404 g'(x) = 8x/(x²+4)² at x=3", D(g, 3), (8 * 3) / (3 * 3 + 4) ** 2, 1e-7);
  eq('404 g tends to 1', g(1e5), 1, 1e-8);
  FIGS['tr-404'] = {
    f: (x) => (Math.abs(x) < 1e-9 ? null : (x * x) / (x * x + 4)),
    xMin: -9, xMax: 9, yMin: -0.25, yMax: 1.35,
    hAsymptotes: [1],
    points: [{ x: 0, y: 0, label: '(0, 0)', hole: true }],
  };
}

// 405 — f = (x+3)/(x-2), g = (x-2)/(x+1), h = f·g: asymptotes and the hole.
{
  const h = (x: number) => (x === 2 || x === -1 ? NaN : ((x + 3) / (x - 2)) * ((x - 2) / (x + 1)));
  for (const x of [-7, -0.5, 0, 5]) eq(`405 h = (x+3)/(x+1) at x=${x}`, h(x), (x + 3) / (x + 1), 1e-12);
  ok('405 h undefined at 2', !Number.isFinite(h(2)));
  eq('405 the hole sits at height 5/3', (2.000001 + 3) / (2.000001 + 1), 5 / 3, 1e-5);
  ok('405 x = 2 is NOT an asymptote', Math.abs(h(2.0001)) < 2 && Math.abs(h(1.9999)) < 2);
  ok('405 x = -1 IS an asymptote', Math.abs(h(-1.0001)) > 1e3 && Math.abs(h(-0.9999)) > 1e3);
  eq('405 h tends to 1', h(1e6), 1, 1e-5);
  FIGS['tr-405'] = {
    f: (x) => (Math.abs(x - 2) < 1e-9 || Math.abs(x + 1) < 1e-9 ? null : (x + 3) / (x + 1)),
    xMin: -9, xMax: 9, yMin: -5, yMax: 8,
    vAsymptotes: [-1], hAsymptotes: [1],
    points: [{ x: 2, y: 5 / 3, label: '(2, 1.67)', hole: true }],
  };
}

// 406 — f = (2x+2)/(x-1), g = |f - 2|: meetings with the x-axis, and the HA.
{
  const f = (x: number) => (2 * x + 2) / (x - 1);
  const g = (x: number) => (x === 1 ? NaN : Math.abs(f(x) - 2));
  for (const x of [-4, 0, 0.5, 3, 12]) eq(`406 g = 4/|x-1| at x=${x}`, g(x), 4 / Math.abs(x - 1), 1e-12);
  for (const x of [-100, -1, 0, 2, 50]) ok(`406 g > 0 at x=${x}`, g(x) > 0);
  ok('406 f(x) = 2 has no solution', signChanges((x) => f(x) - 2, -1e4, 0.999).length === 0
    && signChanges((x) => f(x) - 2, 1.001, 1e4).length === 0);
  eq('406 f(-1) = 0, the distractor root', f(-1), 0);
  eq('406 g(-1) = 2, not 0', g(-1), 2);
  eq('406 g tends to 0', g(1e6), 0, 1e-5);
  eq("406 |f|-2 vanishes at x=0 (the other distractor)", Math.abs(f(0)) - 2, 0, 1e-12);
  FIGS['tr-406'] = {
    f: (x) => (Math.abs(x - 1) < 1e-9 ? null : 4 / Math.abs(x - 1)),
    xMin: -9, xMax: 11, yMin: -0.6, yMax: 6,
    vAsymptotes: [1], hAsymptotes: [0],
    points: [{ x: -1, y: 2, label: '(-1, 2)' }],
  };
}

// 407 — f = (x²+4)/x, g = √(-2f'(x)): the domain.
{
  const f = (x: number) => (x * x + 4) / x;
  const fp = (x: number) => (x * x - 4) / (x * x);
  for (const x of [-3, -0.4, 0.9, 5]) eq(`407 f' at x=${x}`, D(f, x), fp(x), 1e-6);
  const g = (x: number) => { if (x === 0) return NaN; const u = -2 * fp(x); return u < 0 ? NaN : Math.sqrt(u); };
  for (const x of [-2, -1, -0.3, 0.3, 1, 2]) ok(`407 g defined at x=${x}`, Number.isFinite(g(x)));
  for (const x of [-4, -2.1, 0, 2.1, 4]) ok(`407 g undefined at x=${x}`, !Number.isFinite(g(x)));
  eq('407 g(2) = 0', g(2), 0);
  eq('407 g(-2) = 0', g(-2), 0);
  ok("407 f' >= 0 exactly outside [-2, 2] (the sign-flip distractor)", fp(3) > 0 && fp(-3) > 0 && fp(1) < 0);
  FIGS['tr-407'] = {
    f: (x) => { if (Math.abs(x) < 1e-9) return null; const u = -2 * fp(x); return u < 0 ? null : Math.sqrt(u); },
    xMin: -3.2, xMax: 3.2, yMin: -0.6, yMax: 9,
    vAsymptotes: [0],
    domainFrom: -2, domainTo: 2,
    points: [{ x: -2, y: 0, label: '(-2, 0)' }, { x: 2, y: 0, label: '(2, 0)' }],
  };
}

// 408 — f = a/(x-3), g' = f + 2, g has an extremum at x = 1: find a and its type.
{
  const gp = (a: number) => (x: number) => a / (x - 3) + 2;
  eq("408 a = 4 makes g'(1) = 0", gp(4)(1), 0);
  ok("408 a = -4 does not (the distractor)", Math.abs(gp(-4)(1)) > 1e-6);
  const d = gp(4);
  for (const x of [-5, 0, 0.9]) ok(`408 g' > 0 at x=${x}`, d(x) > 0);
  for (const x of [1.1, 2, 2.9]) ok(`408 g' < 0 at x=${x}`, d(x) < 0);
  ok('408 so x = 1 is a MAXIMUM of g', d(0.9) > 0 && d(1.1) < 0);
  eq('408 the only root of g\' is 1', signChanges(d, -50, 2.99)[0], 1, 1e-6);
  eq("408 g' tends to 2", d(1e6), 2, 1e-4);
  FIGS['tr-408'] = {
    f: (x) => (Math.abs(x - 3) < 1e-9 ? null : 4 / (x - 3) + 2),
    xMin: -7, xMax: 11, yMin: -7, yMax: 9,
    vAsymptotes: [3], hAsymptotes: [2],
    points: [{ x: 1, y: 0, label: '(1, 0)' }],
  };
}

// 409 — g = (x³-x²+x-1)/(x²-x) is f = (x²+1)/x with the point (1, 2) removed.
{
  const f = (x: number) => (x * x + 1) / x;
  const g = (x: number) => (x === 0 || x === 1 ? NaN : (x ** 3 - x * x + x - 1) / (x * x - x));
  for (const x of [-4, -0.5, 0.5, 3]) eq(`409 g = f at x=${x}`, g(x), f(x), 1e-9);
  ok('409 g undefined at 0 and 1', !Number.isFinite(g(0)) && !Number.isFinite(g(1)));
  eq('409 the missing point is at height 2', f(1), 2);
  eq("409 f'(-1) = 0", D(f, -1), 0, 1e-6);
  eq('409 f(-1) = -2 is a maximum', f(-1), -2);
  ok('409 it is a maximum', f(-1.2) < f(-1) && f(-0.8) < f(-1));
  // f(x) = k  ⟺  x² - kx + 1 = 0 (x ≠ 0). Count its roots, then drop x = 1.
  const countOnG = (k: number) => {
    const disc = k * k - 4;
    if (disc < 0) return 0;
    const roots = disc === 0 ? [k / 2] : [(k - Math.sqrt(disc)) / 2, (k + Math.sqrt(disc)) / 2];
    return roots.filter((r) => Math.abs(r - 1) > 1e-12 && Math.abs(r) > 1e-12).length;
  };
  eq('409 k = -2 gives exactly one', countOnG(-2), 1);
  eq('409 k = 2 gives none (the removed point)', countOnG(2), 0);
  for (const k of [-9, -2.5, 2.5, 9]) eq(`409 k = ${k} gives two`, countOnG(k), 2);
  for (const k of [-1.9, 0, 1.9]) eq(`409 k = ${k} gives none`, countOnG(k), 0);
  const onlyOne: number[] = [];
  for (let k = -12; k <= 12; k += 0.001) if (countOnG(Number(k.toFixed(3))) === 1) onlyOne.push(Number(k.toFixed(3)));
  ok(`409 exactly one solution ONLY for k = -2 (found ${JSON.stringify(onlyOne)})`,
    onlyOne.length === 1 && Math.abs(onlyOne[0] + 2) < 1e-9);
  FIGS['tr-409'] = {
    f: (x) => (Math.abs(x) < 1e-9 || Math.abs(x - 1) < 1e-9 ? null : (x ** 3 - x * x + x - 1) / (x * x - x)),
    xMin: -7, xMax: 7, yMin: -9, yMax: 9,
    vAsymptotes: [0],
    points: [{ x: 1, y: 2, label: '(1, 2)', hole: true }, { x: -1, y: -2, label: '(-1, -2)' }],
  };
}

// 410 — f = 4x/(x²+1), g = |f - 1|: how many extremum points, and the highest.
{
  const f = (x: number) => (4 * x) / (x * x + 1);
  const g = (x: number) => Math.abs(f(x) - 1);
  eq('410 f(1) = 2 is the maximum', f(1), 2);
  eq('410 f(-1) = -2 is the minimum', f(-1), -2);
  eq("410 f'(1) = 0", D(f, 1), 0, 1e-6);
  const r1 = 2 - SQ3, r2 = 2 + SQ3;
  eq('410 f = 1 at 2-√3', f(r1), 1, 1e-12);
  eq('410 f = 1 at 2+√3', f(r2), 1, 1e-12);
  // The extrema of g, FOUND (sign changes of a difference quotient), not listed:
  // the fold makes two of them corner points, where no derivative exists.
  const slope = (x: number) => (g(x + 1e-6) - g(x - 1e-6)) / 2e-6;
  const xs = signChanges(slope, -40, 40, 200000);
  ok(`410 g has exactly 4 extremum points (found ${xs.length}: ${xs.map((v) => v.toFixed(3))})`, xs.length === 4);
  eq('410 the first is x = -1', xs[0], -1, 1e-3);
  eq('410 the second is 2-√3', xs[1], r1, 1e-3);
  eq('410 the third is x = 1', xs[2], 1, 1e-3);
  eq('410 the fourth is 2+√3', xs[3], r2, 1e-3);
  eq('410 g(-1) = 3, the highest', g(-1), 3);
  eq('410 g(1) = 1', g(1), 1);
  eq('410 g at both roots is 0', g(r1) + g(r2), 0, 1e-12);
  ok('410 nothing on the graph rises above 3', xs.every((x) => g(x) <= 3 + 1e-9) && g(1e6) <= 3);
  eq('410 g tends to 1', g(1e6), 1, 1e-5);
  eq('410 without the absolute value the highest is 1 (the distractor)', f(1) - 1, 1);
  FIGS['tr-410'] = {
    f: (x) => Math.abs(f(x) - 1),
    xMin: -7, xMax: 9, yMin: -0.35, yMax: 3.7,
    hAsymptotes: [1],
    points: [
      { x: -1, y: 3, label: '(-1, 3)' },
      { x: r1, y: 0, label: '(0.27, 0)' },
      { x: 1, y: 1, label: '(1, 1)' },
      { x: r2, y: 0, label: '(3.73, 0)' },
    ],
  };
  FIGS['tr-410-f'] = {
    f: (x) => f(x),
    xMin: -7, xMax: 9, yMin: -2.7, yMax: 2.7,
    hAsymptotes: [0],
    points: [{ x: 1, y: 2, label: '(1, 2)' }, { x: -1, y: -2, label: '(-1, -2)' }],
  };
}

// 411 — f = 6x/(x²+9), g = 1/(f - c) with c > 0: one vertical asymptote ⇒ c.
{
  const f = (x: number) => (6 * x) / (x * x + 9);
  eq('411 f(3) = 1 is the maximum', f(3), 1);
  eq('411 f(-3) = -1 is the minimum', f(-3), -1);
  eq("411 f'(3) = 0", D(f, 3), 0, 1e-6);
  ok('411 f(3) is a maximum', f(2.5) < 1 && f(3.5) < 1);
  // f(x) = c  ⟺  cx² - 6x + 9c = 0 (c > 0): the number of vertical asymptotes.
  const count = (c: number) => {
    const disc = 36 - 36 * c * c;
    return disc < 0 ? 0 : disc === 0 ? 1 : 2;
  };
  eq('411 c = 0.5 gives two asymptotes', count(0.5), 2);
  eq('411 c = 1 gives exactly one', count(1), 1);
  eq('411 c = 2 gives none', count(2), 0);
  const only: number[] = [];
  for (let c = 0.001; c <= 6; c += 0.001) { const cc = Number(c.toFixed(3)); if (count(cc) === 1) only.push(cc); }
  ok(`411 exactly one asymptote ONLY for c = 1 (found ${JSON.stringify(only)})`, only.length === 1 && only[0] === 1);
  const g = (x: number) => (x === 3 ? NaN : 1 / (f(x) - 1));
  for (const x of [-6, 0, 2.9, 3.1, 10]) eq(`411 g = -(x²+9)/(x-3)² at x=${x}`, g(x), -(x * x + 9) / (x - 3) ** 2, 1e-9);
  ok('411 x = 3 is a vertical asymptote of g', g(3.0001) < -1e3 && g(2.9999) < -1e3);
  eq('411 g tends to -1', g(1e6), -1, 1e-4);
  eq('411 the f-asymptote distractor: f tends to 0', f(1e6), 0, 1e-5);
  FIGS['tr-411'] = {
    f: (x) => (Math.abs(x - 3) < 1e-9 ? null : -(x * x + 9) / (x - 3) ** 2),
    xMin: -13, xMax: 19, yMin: -7, yMax: 1,
    vAsymptotes: [3], hAsymptotes: [-1],
    points: [{ x: -3, y: -0.5, label: '(-3, -0.5)' }],
  };
  FIGS['tr-411-f'] = {
    f: (x) => f(x),
    xMin: -16, xMax: 16, yMin: -1.5, yMax: 1.5,
    hAsymptotes: [0],
    points: [{ x: 3, y: 1, label: '(3, 1)' }, { x: -3, y: -1, label: '(-3, -1)' }],
  };
}

// 412 — g'(x) = f(x) with f = x/(x²+3): concavity, inflection and extremum of g.
{
  const f = (x: number) => x / (x * x + 3);
  const fp = (x: number) => (3 - x * x) / (x * x + 3) ** 2;
  for (const x of [-4, -0.6, 0.9, 5]) eq(`412 f' at x=${x}`, D(f, x), fp(x), 1e-7);
  eq('412 f(0) = 0', f(0), 0);
  ok('412 f goes from minus to plus at 0', f(-0.4) < 0 && f(0.4) > 0);
  eq("412 f' = 0 at √3", fp(SQ3), 0, 1e-12);
  eq("412 f' = 0 at -√3", fp(-SQ3), 0, 1e-12);
  ok("412 f' changes sign at ±√3", fp(-2) < 0 && fp(0) > 0 && fp(2) < 0);
  eq('412 the maximum height of f', f(SQ3), SQ3 / 6, 1e-12);
  eq('412 the minimum height of f', f(-SQ3), -SQ3 / 6, 1e-12);
  const roots = signChanges(fp, -12, 12);
  ok(`412 f' changes sign exactly twice (${roots.map((r) => r.toFixed(4))})`, roots.length === 2);
  eq('412 the left one is -√3', roots[0], -SQ3, 1e-5);
  eq('412 the right one is √3', roots[1], SQ3, 1e-5);
  // The distractor: f'' vanishes at 0 and ±3 — those are f's OWN inflections.
  const fpp = (x: number) => D(fp, x);
  for (const x of [0, 3, -3]) eq(`412 f'' = 0 at x=${x} (distractor)`, fpp(x), 0, 1e-5);
  FIGS['tr-412'] = {
    f: (x) => f(x),
    xMin: -10, xMax: 10, yMin: -0.5, yMax: 0.5,
    hAsymptotes: [0],
    points: [
      { x: SQ3, y: SQ3 / 6, label: '(1.73, 0.29)' },
      { x: -SQ3, y: -SQ3 / 6, label: '(-1.73, -0.29)' },
      { x: 0, y: 0, label: '(0, 0)' },
    ],
  };
}

// ── render ─────────────────────────────────────────────────────────────────
/** The legibility test scripts/_probe-rq-figure-audit.ts applies to the whole
 *  track, run HERE so a colliding label is fixed by moving the plot window
 *  before the SVG is pasted into the content file (anchor-aware: `end` grows
 *  left of x, `middle` centres on it). Assertions prove the coordinates; only
 *  this catches two labels printed on top of each other. */
function auditSvg(id: string, svg: string, box: [number, number] = [300, 260]): number {
  const texts = [...svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"([^>]*)>([^<]*)</g)].map((m) => {
    const x = Number(m[1]);
    const w = m[4].length * 5.5;
    const anchor = /text-anchor="end"/.test(m[3]) ? 'end' : /text-anchor="middle"/.test(m[3]) ? 'middle' : 'start';
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { x0, x1: x0 + w, y: Number(m[2]), t: m[4] };
  });
  let bad = 0;
  for (const t of texts) {
    if (t.x0 < -6 || t.x1 > box[0] + 6 || t.y < 0 || t.y > box[1] + 2) { bad++; console.log(`   ✗ ${id}: "${t.t}" out of frame at (${t.x0.toFixed(0)}, ${t.y})`); }
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (Math.abs(a.y - b.y) < 7 && a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1) {
        bad++;
        console.log(`   ✗ ${id}: "${a.t}" at (${a.x0.toFixed(0)}, ${a.y}) ✕ "${b.t}" at (${b.x0.toFixed(0)}, ${b.y})`);
      }
    }
  }
  if (!/(<polyline|<path)/.test(svg)) { bad++; console.log(`   ✗ ${id}: nothing drawn`); }
  if ((svg.match(/</g) ?? []).length !== (svg.match(/>/g) ?? []).length) { bad++; console.log(`   ✗ ${id}: unbalanced tags`); }
  return bad;
}

const arg = process.argv[2];
for (const [id, spec] of Object.entries(FIGS)) {
  const { svg, errors } = fnFigure(spec);
  checks++;
  if (errors.length) { fails++; console.log(`   ✗ ${id} figure: ${errors.join(' | ')}`); continue; }
  checks++;
  if (auditSvg(id, svg)) fails++;
  if (arg === '--figures' || arg === id) {
    console.log(`===== ${id}`);
    console.log(svg);
  }
}
async function contactSheet(out: string) {
  const sharp = (await import('sharp')).default;
  const COLS = 4, CW = 600, CH = 520;
  const ids = Object.keys(FIGS);
  const tiles = await Promise.all(
    ids.map(async (id, i) => ({
      input: await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" width="${CW}" height="${CH}"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="6" y="14" font-size="11" fill="#DB2777">${id}</text>${fnFigure(FIGS[id]).svg}</svg>`,
        ),
      ).png().toBuffer(),
      left: (i % COLS) * CW,
      top: Math.floor(i / COLS) * CH,
    })),
  );
  await sharp({
    create: { width: COLS * CW, height: Math.ceil(ids.length / COLS) * CH, channels: 3, background: '#FFFFFF' },
  }).composite(tiles).png().toFile(out);
  console.log(`contact sheet -> ${out}`);
}

const done = () => {
  console.log(`
${checks - fails}/${checks} checks passed${fails ? ` - ${fails} FAILED` : ''}`);
  process.exit(fails ? 1 : 0);
};
// `--png <file>` rasterises the batch onto one sheet: a passing audit still says
// nothing about a curve squashed flat or a frame with nothing in it.
if (arg === '--png') void contactSheet(process.argv[3] ?? 'round4-figures.png').then(done);
else done();
