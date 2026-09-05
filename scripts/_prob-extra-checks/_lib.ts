// Shared helpers for the per-stage numeric re-derivation files in this folder.
//
//   check(label, got, expected)        scalar, tolerance 1e-9
//   checkSet(label, got[], expected[]) unordered multiset equality
//   frac(n, d)                         exact rational as a number, for readability
//   binom(n, k, p)                     one Bernoulli term  C(n,k) p^k (1-p)^(n-k)
//   binomAtLeast(n, k, p)              P(X >= k)
//   atLeastOne(p, n)                   1 - (1-p)^n, the complement pattern
//   nCr(n, k)                          exact integer combinations
//   enumerate(spaces, pred)            brute-force a small sample space and return
//                                      the probability of `pred` — an INDEPENDENT
//                                      check on a formula-based answer, and the one
//                                      that catches a wrong denominator
//   summary(name)                      print + set exitCode; returns counts
//
// A check whose two sides are the same literal proves nothing — every `got`
// must be COMPUTED from the question's own data.

let pass = 0;
let fail = 0;
const failures: string[] = [];
const TOL = 1e-9;

export function check(label: string, got: number, expected: number, tol = TOL) {
  if (Number.isFinite(got) && Number.isFinite(expected) && Math.abs(got - expected) < tol) pass++;
  else {
    fail++;
    failures.push(`FAIL: ${label} — got ${got}, expected ${expected}`);
  }
}

export function checkSet(label: string, got: number[], expected: number[], tol = TOL) {
  if (got.length !== expected.length) {
    fail++;
    failures.push(`FAIL: ${label} — length ${got.length} vs ${expected.length}`);
    return;
  }
  const used = new Array(got.length).fill(false);
  for (const e of expected) {
    const i = got.findIndex((g, idx) => !used[idx] && Math.abs(g - e) < tol);
    if (i === -1) {
      fail++;
      failures.push(`FAIL: ${label} — missing ${e} in [${got.join(', ')}]`);
      return;
    }
    used[i] = true;
  }
  pass++;
}

export const frac = (n: number, d: number) => n / d;

export function nCr(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export const binom = (n: number, k: number, p: number) => nCr(n, k) * p ** k * (1 - p) ** (n - k);

export const binomAtLeast = (n: number, k: number, p: number) =>
  Array.from({ length: n - k + 1 }, (_, i) => binom(n, k + i, p)).reduce((a, b) => a + b, 0);

export const atLeastOne = (p: number, n: number) => 1 - (1 - p) ** n;

/**
 * Brute-force a small sample space. `spaces` is one array per stage of the
 * experiment (e.g. [[1..6], [1..6]] for two dice); `pred` receives one outcome.
 * Every outcome is equally likely, which is exactly the assumption a wrong
 * denominator violates — so this catches what a formula check cannot.
 */
export function enumerate<T>(
  spaces: readonly (readonly T[])[],
  pred: (outcome: T[]) => boolean,
): number {
  let total = 0;
  let hits = 0;
  const walk = (i: number, acc: T[]) => {
    if (i === spaces.length) {
      total++;
      if (pred(acc)) hits++;
      return;
    }
    for (const v of spaces[i]) walk(i + 1, [...acc, v as T]);
  };
  walk(0, []);
  return hits / total;
}

/** Draws WITHOUT replacement from a labelled urn, as an ordered sequence. */
export function drawNoReplacement(urn: string[], k: number, pred: (seq: string[]) => boolean): number {
  let total = 0;
  let hits = 0;
  const walk = (left: string[], acc: string[]) => {
    if (acc.length === k) {
      total++;
      if (pred(acc)) hits++;
      return;
    }
    for (let i = 0; i < left.length; i++) walk([...left.slice(0, i), ...left.slice(i + 1)], [...acc, left[i]]);
  };
  walk(urn, []);
  return hits / total;
}

export function summary(name: string): { pass: number; fail: number } {
  for (const f of failures) console.log(`  ${f}`);
  console.log(`${name}: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
  const out = { pass, fail };
  pass = 0;
  fail = 0;
  failures.length = 0;
  return out;
}
