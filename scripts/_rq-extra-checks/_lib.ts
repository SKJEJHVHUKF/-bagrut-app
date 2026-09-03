// Shared helpers for the per-stage numeric re-derivation files in this folder.
// Same three assertions scripts/verify-derivatives.ts uses, so a verifier can
// prove an answer, a derivative (SYMBOLICALLY, via mathjs, not at one point)
// or a root set without re-inventing the harness.
//
//   check(label, got, expected)            exact scalar, tolerance 1e-9
//   dcheck(label, fExpr, fPrimeExpr)       authored f' vs mathjs derivative of f,
//                                          sampled at several x (pass your own
//                                          samples when the domain excludes some)
//   checkSet(label, got[], expected[])     unordered multiset equality
//   icheck(label, fExpr, a, b, expected)   ∫_a^b f dx by numeric quadrature
//   summary(name)                          print + set exitCode; returns counts
//
// A check whose two sides are the same literal (`check('…', -3, -3)`) proves
// nothing — every `got` must be COMPUTED from the question's data.
import { create, all } from 'mathjs';

export const math = create(all, { number: 'number' });
export const E = (s: string): number => math.evaluate(s) as number;

let pass = 0;
let fail = 0;
const failures: string[] = [];
const TOL = 1e-9;

export function check(label: string, got: number, expected: number, tol = TOL) {
  if (Number.isFinite(got) && Number.isFinite(expected) && Math.abs(got - expected) < tol) {
    pass++;
  } else {
    fail++;
    failures.push(`FAIL: ${label} — got ${got}, expected ${expected}`);
  }
}

export function checkSet(label: string, got: number[], expected: number[], tol = TOL) {
  if (got.length !== expected.length) {
    fail++;
    failures.push(`FAIL: ${label} — length ${got.length} vs ${expected.length} [${got.join(', ')}]`);
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

export function dcheck(
  label: string,
  fExpr: string,
  fPrimeExpr: string,
  samples = [-2.3, -1, -0.5, 0.7, 1, 2.5],
  v = 'x',
) {
  const symbolic = math.derivative(fExpr, v);
  const authored = math.parse(fPrimeExpr);
  for (const val of samples) {
    const scope: Record<string, number> = { [v]: val };
    const a = symbolic.evaluate(scope) as number;
    const b = authored.evaluate(scope) as number;
    if (!(Math.abs(a - b) < 1e-7)) {
      fail++;
      failures.push(`FAIL: ${label} at ${v}=${val} — symbolic ${a}, authored ${b}`);
      return;
    }
  }
  pass++;
}

/** Definite integral by Simpson's rule (n even). Tolerance is loose on purpose:
 *  it proves an area, not an antiderivative — use dcheck(F', f) for that. */
export function icheck(label: string, fExpr: string, a: number, b: number, expected: number, n = 2000) {
  const f = math.parse(fExpr).compile();
  const h = (b - a) / n;
  let s = f.evaluate({ x: a }) + f.evaluate({ x: b });
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f.evaluate({ x: a + i * h });
  check(label, (s * h) / 3, expected, 1e-6);
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
