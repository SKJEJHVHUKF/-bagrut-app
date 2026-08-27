/**
 * generator/rng.ts — deterministic randomness, and exact rational arithmetic.
 *
 * Two hard requirements drive this file, and both come from the same place:
 * a generated question must be REPRODUCIBLE FROM ITS ID ALONE.
 *
 *   • The answer log stores `gen:<templateId>:<difficulty>:<seed>` and nothing
 *     else. Six weeks later the report has to re-render the exact question the
 *     student got wrong. `Math.random()` makes that impossible, so the seed is
 *     the only source of entropy and it is carried in the id.
 *
 *   • Probability answers must be EXACT. `3/7` is a legal final answer;
 *     `0.42857142857142855` is not — it is wrong on screen, wrong against
 *     `checkAnswer`, and wrong in a way no student can act on. So the
 *     probability templates compute in `Frac`, never in floats.
 */

/** A seeded stream. Same seed → same sequence, forever. */
export type Rng = {
  /** Integer in [lo, hi], inclusive. */
  int(lo: number, hi: number): number;
  /** One element of `xs`. */
  pick<T>(xs: readonly T[]): T;
  /** `n` distinct elements of `xs`, in stream order. */
  sample<T>(xs: readonly T[], n: number): T[];
  /** True with probability `p`. */
  chance(p: number): boolean;
};

/** 32-bit string hash (FNV-1a). Stable across runs and platforms. */
function hashSeed(seed: string | number): number {
  const s = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and good enough for choosing integers. */
export function makeRng(seed: string | number): Rng {
  let a = hashSeed(seed);
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Warm-up. mulberry32's FIRST output is strongly correlated with its seed, so
  // adjacent seeds pick the same first parameter and a template's variety
  // collapses — `verify-generator` caught exactly that on the binomial family
  // (19 distinct questions from 59 seeds). Four discarded draws decorrelates it.
  for (let i = 0; i < 4; i++) next();

  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    int,
    pick: (xs) => xs[int(0, xs.length - 1)],
    sample: (xs, n) => {
      const pool = [...xs];
      const out: typeof pool = [];
      for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(int(0, pool.length - 1), 1)[0]);
      return out;
    },
    chance: (p) => next() < p,
  };
}

// ---------------------------------------------------------------------------
// Exact rationals
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** A reduced fraction. Denominator is always positive. */
export class Frac {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (d === 0) throw new Error('Frac: zero denominator');
    const s = d < 0 ? -1 : 1;
    const g = gcd(n, d);
    this.n = (s * n) / g;
    this.d = (s * d) / g;
  }

  static of(n: number, d = 1) {
    return new Frac(n, d);
  }

  add(o: Frac) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Frac) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o: Frac) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o: Frac) { return new Frac(this.n * o.d, this.d * o.n); }
  pow(k: number): Frac {
    let out = new Frac(1);
    for (let i = 0; i < k; i++) out = out.mul(this);
    return out;
  }
  /** 1 - this. The complement, written the way probability uses it most. */
  comp() { return new Frac(1).sub(this); }

  get value() { return this.n / this.d; }
  eq(o: Frac) { return this.n === o.n && this.d === o.d; }
  get isInt() { return this.d === 1; }

  /** LaTeX, WITHOUT the surrounding `$`. Integers render bare, not as `\dfrac`. */
  tex(): string {
    if (this.d === 1) return String(this.n);
    return this.n < 0
      ? `-\\dfrac{${-this.n}}{${this.d}}`
      : `\\dfrac{${this.n}}{${this.d}}`;
  }

  /** A mathjs-evaluable string for `AnswerSpec` — never a rounded decimal. */
  expr(): string {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }

  /** Rounded decimal, for the "≈" that follows an exact fraction in prose. */
  approx(places = 3): string {
    return this.value.toFixed(places).replace(/\.?0+$/, '');
  }
}

/** n! — small n only; every use here is bounded by the syllabus. */
export function fact(n: number): number {
  let out = 1;
  for (let i = 2; i <= n; i++) out *= i;
  return out;
}

/** Binomial coefficient, computed multiplicatively so it stays exact. */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let out = 1;
  for (let i = 1; i <= k; i++) out = (out * (n - k + i)) / i;
  return Math.round(out);
}
