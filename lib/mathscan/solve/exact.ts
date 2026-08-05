// ============================================================
// mathscan/solve/exact.ts — exact rational + surd arithmetic.
// ============================================================
//
// A bagrut answer is $x = \frac{3}{2}$ or $x = 2 \pm \sqrt{3}$ — never
// $x = 1.5$ or $x = 3.732$. CLAUDE.md states it as a rule and the graders
// enforce it. Floating point cannot express those answers, so the solver
// carries exact integers through the quadratic formula and only ever
// converts to a decimal for the "check the answer" pass.
//
// Everything here is integer arithmetic on `number`. Bagrut coefficients are
// small (|c| < 10^4 in practice), and every operation below stays inside
// Number.MAX_SAFE_INTEGER for inputs in that range; `Number.isSafeInteger`
// guards the one place (the discriminant) where a pathological input could
// leave it.

export type Frac = { n: number; d: number }; // d > 0, gcd(|n|, d) = 1

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

export function makeFrac(n: number, d: number): Frac {
  if (d === 0) throw new Error('division by zero');
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

/**
 * Float → exact fraction via continued fractions.
 *
 * mathjs hands back `0.5` for `x/2`, and a naive `Math.round(x * 1000)`
 * turns 1/3 into 333/1000. Continued fractions recover the small-denominator
 * rational a human wrote, and return null when the value genuinely isn't one
 * (√2 from a partially-evaluated expression) so the caller can bail out
 * instead of shipping a fake exact answer.
 */
export function toFrac(value: number, maxDenominator = 100000, tolerance = 1e-9): Frac | null {
  if (!Number.isFinite(value)) return null;
  if (Number.isInteger(value)) return { n: value, d: 1 };

  const sign = value < 0 ? -1 : 1;
  let x = Math.abs(value);

  let h0 = 0;
  let h1 = 1;
  let k0 = 1;
  let k1 = 0;

  for (let i = 0; i < 64; i++) {
    const a = Math.floor(x);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDenominator) break;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    if (Math.abs(h1 / k1 - Math.abs(value)) < tolerance) {
      return makeFrac(sign * h1, k1);
    }
    const frac = x - a;
    if (frac < 1e-12) break;
    x = 1 / frac;
  }
  return null;
}

/** Scale a list of fractions to integers by their common denominator.
 *  Returns null if the numbers get large enough that exactness is at risk. */
export function clearDenominators(fracs: Frac[]): number[] | null {
  let lcm = 1;
  for (const f of fracs) {
    lcm = (lcm / gcd(lcm, f.d)) * f.d;
    if (!Number.isSafeInteger(lcm) || lcm > 1e9) return null;
  }
  const out = fracs.map((f) => f.n * (lcm / f.d));
  if (out.some((v) => !Number.isSafeInteger(v))) return null;
  return out;
}

/** √n = coefficient·√radicand with the largest square factor pulled out.
 *  √18 → 3√2 · √16 → 4√1 · √17 → 1√17. */
export function simplifySqrt(n: number): { coefficient: number; radicand: number } {
  if (n < 0 || !Number.isInteger(n)) return { coefficient: 1, radicand: n };
  if (n === 0) return { coefficient: 0, radicand: 1 };
  let coefficient = 1;
  let radicand = n;
  for (let f = 2; f * f <= radicand; f++) {
    const sq = f * f;
    while (radicand % sq === 0) {
      radicand /= sq;
      coefficient *= f;
    }
  }
  return { coefficient, radicand };
}

export function isPerfectSquare(n: number): boolean {
  if (n < 0 || !Number.isInteger(n)) return false;
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

// ------------------------------------------------------------
// LaTeX formatting
// ------------------------------------------------------------

export function fracToLatex(f: Frac): string {
  if (f.d === 1) return `${f.n}`;
  const sign = f.n < 0 ? '-' : '';
  return `${sign}\\frac{${Math.abs(f.n)}}{${f.d}}`;
}

/** Mathjs-syntax form of a fraction — what goes into `answerValues` so
 *  `lib/answer-check.ts` can re-grade a student's typed answer against it. */
export function fracToValue(f: Frac): string {
  return f.d === 1 ? `${f.n}` : `(${f.n}/${f.d})`;
}

/**
 * Render `(p ± c√r) / q` in lowest terms.
 *
 * The reduction is the part that is easy to get wrong: the common factor
 * must divide p, c AND q simultaneously — reducing p/q alone while leaving
 * c untouched silently changes the value. `(2 ± 2√3)/4` reduces to
 * `(1 ± √3)/2`, never to `(1 ± 2√3)/2`.
 */
export function surdToLatex(p: number, c: number, r: number, q: number): string {
  if (r === 1) {
    // Not a surd at all — it collapsed to a plain fraction pair.
    return fracToLatex(makeFrac(p + c, q));
  }
  let g = gcd(gcd(Math.abs(p), Math.abs(c)), Math.abs(q));
  if (g === 0) g = 1;
  let np = p / g;
  let nc = c / g;
  let nq = q / g;
  if (nq < 0) {
    np = -np;
    nc = -nc;
    nq = -nq;
  }

  const radical = nc === 1 ? `\\sqrt{${r}}` : nc === -1 ? `-\\sqrt{${r}}` : `${nc}\\sqrt{${r}}`;
  const numerator = np === 0 ? radical : `${np} ${nc < 0 ? '-' : '+'} ${radical.replace(/^-/, '')}`;
  return nq === 1 ? numerator : `\\frac{${numerator}}{${nq}}`;
}

/** Same value in mathjs syntax, for `answerValues`. */
export function surdToValue(p: number, c: number, r: number, q: number): string {
  if (r === 1) return fracToValue(makeFrac(p + c, q));
  return `((${p} + ${c}*sqrt(${r}))/${q})`;
}

/**
 * Tidy mathjs's `toTex()` output.
 *
 * mathjs emits `3\cdot{ x}^{2}` where a human writes `3x^2`, and the stray
 * `\cdot` reads to a student as a typo. But removing it is only safe when
 * what FOLLOWS can be juxtaposed without changing the meaning.
 *
 * The dangerous case, and the reason this is a whitelist rather than a
 * blacklist: mathjs renders `−cos(3x)/3` as `\cos\left(3x\right)\cdot-1`,
 * and dropping that `\cdot` produces `\cos\left(3x\right)-1` — a DIFFERENT
 * expression, silently, on the screen the student copies from. So `\cdot`
 * is removed only before a letter, a brace, an opening paren or a macro;
 * never before a digit and never before a sign.
 */
export function tidyTex(tex: string): string {
  let s = tex;
  s = s.replace(/\{\s+([a-zA-Z])\}/g, '$1'); // "{ x}" → "x"
  s = s.replace(/\\cdot\s*(?=[a-zA-Z{(\\])/g, '');
  // mathjs marks IMPLICIT multiplication with `~` (a LaTeX tie). It renders
  // as a space, so `4~ x` is right but reads as a typo; the same whitelist
  // as `\cdot` applies, for the same reason.
  s = s.replace(/~\s*(?=[a-zA-Z{(\\])/g, '');
  s = s.replace(/\s{2,}/g, ' ');
  return s.trim();
}
