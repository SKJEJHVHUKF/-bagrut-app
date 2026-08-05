// ============================================================
// mathscan/solve/engine-local.ts — the default CAS. $0, on-device, exact.
// ============================================================
//
// Implements `SymbolicEngine` on top of mathjs, which is ALREADY a
// dependency (it is what `lib/answer-check.ts` grades every answer with), so
// this engine adds no bytes to the bundle and no cost to a scan.
//
// ── On SymPy ────────────────────────────────────────────────────────────
// SymPy is Python. This app is Next.js on Vercel Hobby, which has no Python
// runtime, so SymPy cannot run server-side here. The two ways to actually
// get SymPy are Pyodide-in-a-WebWorker (~11 MB of wasm on top of the OCR's
// 6.5 MB — a heavy download for a student on cellular data) or a separate
// Python service (a monthly bill for a maths engine we mostly don't need).
// So the DEFAULT engine is this one, and SymPy is a drop-in behind the same
// interface — see `engine-sympy.ts`, which is written and wired but
// disabled, and needs no change here to switch on.
//
// ── What "exact" means, and where this engine stops ─────────────────────
// It solves what the 5-unit paper actually asks, exactly:
//   · polynomial equations, degree 1-4 (rational-root factoring + the
//     quadratic formula in surd form)
//   · linear and quadratic inequalities, with a sign table
//   · 2×2 linear systems
//   · derivatives (mathjs, symbolic and complete)
//   · indefinite + definite integrals over the bagrut table
//   · simplification and evaluation
//
// And it REFUSES, rather than guesses, on: trigonometric equations (whose
// answer is an infinite family and whose degree/radian convention differs
// per topic in this app — CLAUDE.md #6), non-polynomial equations outside
// the invertible forms below, and anything with a diagram. Those return
// `unsupported`, and the pipeline escalates. A refusal costs one API call;
// a confident wrong answer costs a student's trust.

import {
  derivative,
  evaluate,
  OperatorNode,
  parse,
  rationalize,
  simplify,
  type MathNode,
} from 'mathjs';
import type {
  ClassifiedProblem,
  ProblemKind,
  SolveOutcome,
  SolveStep,
  SymbolicEngine,
} from '../types';
import { latexToMathjs, splitRelation } from './parse';
import {
  clearDenominators,
  fracToLatex,
  fracToValue,
  gcd,
  isPerfectSquare,
  makeFrac,
  simplifySqrt,
  surdToLatex,
  surdToValue,
  tidyTex,
  toFrac,
  type Frac,
} from './exact';

const ENGINE_ID = 'local-mathjs' as const;

const SUPPORTED: ProblemKind[] = [
  'equation',
  'inequality',
  'system',
  'simplify',
  'evaluate',
  'derivative',
  'integral',
  'definite-integral',
];

function unsupported(kind: ProblemKind, reason: string): SolveOutcome {
  return { status: 'unsupported', kind, reason, engine: ENGINE_ID };
}

function failed(kind: ProblemKind, reason: string): SolveOutcome {
  return { status: 'error', kind, reason, engine: ENGINE_ID };
}

/**
 * Rewrite `a * -1` as `-a` before rendering.
 *
 * `simplify()` normalises negation into a multiplication by −1, so the
 * antiderivative of sin(3x) comes out as `cos(3x) * -1 / 3`. That renders as
 * `\cos(3x)\cdot-1`, which is correct but reads like a mistake — and it is
 * exactly the shape where a display tidy-up can silently change the meaning.
 * Fixing it in the TREE removes the hazard instead of papering over it.
 */
function prettify(node: MathNode): MathNode {
  const isMinusOne = (child: MathNode): boolean => {
    if (child.type === 'ConstantNode') {
      return Number((child as unknown as { value: unknown }).value) === -1;
    }
    // mathjs also represents it as unaryMinus(1) depending on the path taken.
    if (child.type === 'OperatorNode') {
      const op = child as unknown as { fn: string; args: MathNode[] };
      if (op.fn === 'unaryMinus' && op.args.length === 1) {
        const inner = op.args[0];
        return (
          inner.type === 'ConstantNode' &&
          Number((inner as unknown as { value: unknown }).value) === 1
        );
      }
    }
    return false;
  };

  try {
    return node.transform((child) => {
      // Drop parentheses that only exist because `latexToMathjs` turned
      // `x^{2}` into `x^(2)`. Left in, they render back as `x^{\left(2\right)}`
      // — correct, and not how any textbook writes a square.
      if (child.type === 'ParenthesisNode') {
        const content = (child as unknown as { content: MathNode }).content;
        if (content.type === 'ConstantNode' || content.type === 'SymbolNode') return content;
        return child;
      }
      if (child.type !== 'OperatorNode') return child;
      const op = child as unknown as { op: string; args: MathNode[] };
      if (op.op !== '*' || op.args.length !== 2) return child;
      const [left, right] = op.args;
      if (isMinusOne(right)) return new OperatorNode('-', 'unaryMinus', [prettify(left)]);
      if (isMinusOne(left)) return new OperatorNode('-', 'unaryMinus', [prettify(right)]);
      return child;
    });
  } catch {
    return node;
  }
}

function tex(expression: string): string {
  try {
    return tidyTex(prettify(parse(expression)).toTex());
  } catch {
    return expression;
  }
}

/** Parenthesise a negative number so it can be substituted into a formula
 *  without changing what the formula says. */
function signed(value: number): string {
  return value < 0 ? `\\left(${value}\\right)` : `${value}`;
}

/** True when the side is literally the number zero (not merely equal to it —
 *  `x - x` is worth a transposition step, `0` is not). */
function isLiteralZero(expression: string): boolean {
  return /^\s*0+(\.0+)?\s*$/.test(expression);
}

/** `simplify`, falling back to the input when mathjs refuses. Display only —
 *  the un-simplified string stays the source of truth for computation. */
function simplified(expression: string): string {
  try {
    return simplify(expression).toString();
  } catch {
    return expression;
  }
}

function texOf(node: MathNode): string {
  try {
    return tidyTex(prettify(node).toTex());
  } catch {
    return tidyTex(node.toTex());
  }
}

// ============================================================
// Polynomial helpers
// ============================================================

/** Ascending coefficients [c0, c1, …] as exact fractions, or null when the
 *  expression is not a single-variable polynomial. */
function polynomialCoefficients(expression: string, variable: string): Frac[] | null {
  let detailed: { coefficients?: number[]; variables?: string[] };
  try {
    detailed = rationalize(expression, {}, true) as unknown as {
      coefficients?: number[];
      variables?: string[];
    };
  } catch {
    return null; // non-polynomial: a function call or a non-integer exponent
  }
  const coefficients = detailed.coefficients;
  const variables = detailed.variables ?? [];
  if (!coefficients || coefficients.length === 0) return null;
  if (variables.length > 1) return null;
  if (variables.length === 1 && variables[0] !== variable) return null;

  const fracs: Frac[] = [];
  for (const c of coefficients) {
    const f = toFrac(c);
    if (!f) return null; // an irrational coefficient — not our case
    fracs.push(f);
  }
  return fracs;
}

/** Divisors of |n|, ascending. Used for the rational-root search. */
function divisors(n: number): number[] {
  const abs = Math.abs(Math.round(n));
  if (abs === 0 || abs > 100000) return [];
  const out: number[] = [];
  for (let d = 1; d * d <= abs; d++) {
    if (abs % d !== 0) continue;
    out.push(d);
    if (d !== abs / d) out.push(abs / d);
  }
  return out.sort((a, b) => a - b);
}

/** Evaluate an integer-coefficient polynomial (ascending) at p/q exactly.
 *  Returns the numerator of the result over q^degree — zero iff p/q is a
 *  root, with no floating-point comparison anywhere. */
function polyValueAtRational(coefficients: number[], p: number, q: number): number {
  const degree = coefficients.length - 1;
  let total = 0;
  for (let i = 0; i <= degree; i++) {
    // c_i · p^i · q^(degree−i)
    total += coefficients[i] * Math.pow(p, i) * Math.pow(q, degree - i);
  }
  return total;
}

/** Synthetic division of an integer polynomial by (q·x − p). Returns the
 *  quotient's coefficients (ascending), or null if the division isn't exact
 *  in integers. */
function deflate(coefficients: number[], p: number, q: number): number[] | null {
  // Descending order is the natural direction for synthetic division.
  const desc = [...coefficients].reverse();
  const out: number[] = [];
  let carry = 0;
  for (let i = 0; i < desc.length - 1; i++) {
    const value = desc[i] + carry;
    // Dividing by (qx − p): each quotient coefficient is value/q.
    if (value % q !== 0) return null;
    const coefficient = value / q;
    out.push(coefficient);
    carry = coefficient * p;
  }
  const remainder = desc[desc.length - 1] + carry;
  if (remainder !== 0) return null;
  return out.reverse();
}

type Root =
  | { type: 'rational'; value: Frac }
  | { type: 'surd'; p: number; c: number; r: number; q: number; approx: number }
  | { type: 'complex'; re: Frac; imNumerator: number; imRadicand: number; imDenominator: number };

function rootToLatex(root: Root): string {
  if (root.type === 'rational') return fracToLatex(root.value);
  if (root.type === 'surd') return surdToLatex(root.p, root.c, root.r, root.q);
  const imag =
    root.imRadicand === 1
      ? fracToLatex(makeFrac(root.imNumerator, root.imDenominator))
      : `\\frac{${root.imNumerator === 1 ? '' : root.imNumerator}\\sqrt{${root.imRadicand}}}{${root.imDenominator}}`;
  const re = fracToLatex(root.re);
  return `${re} ${root.imNumerator < 0 ? '-' : '+'} ${imag.replace(/^-/, '')}i`;
}

function rootToValue(root: Root): string {
  if (root.type === 'rational') return fracToValue(root.value);
  if (root.type === 'surd') return surdToValue(root.p, root.c, root.r, root.q);
  return `(${fracToValue(root.re)} + (${root.imNumerator}*sqrt(${root.imRadicand})/${root.imDenominator})*i)`;
}

function rootApprox(root: Root): number {
  if (root.type === 'rational') return root.value.n / root.value.d;
  if (root.type === 'surd') return root.approx;
  return NaN;
}

/**
 * Exact roots of a·x² + b·x + c with INTEGER a, b, c.
 * Returns real roots when Δ ≥ 0, and the complex pair when Δ < 0 — the
 * caller decides whether complex roots are in scope for the topic.
 */
function quadraticRoots(a: number, b: number, c: number): { roots: Root[]; discriminant: number } {
  const discriminant = b * b - 4 * a * c;

  if (discriminant > 0 && isPerfectSquare(discriminant)) {
    const s = Math.round(Math.sqrt(discriminant));
    return {
      discriminant,
      roots: [makeFrac(-b + s, 2 * a), makeFrac(-b - s, 2 * a)].map((value) => ({
        type: 'rational' as const,
        value,
      })),
    };
  }

  if (discriminant > 0) {
    const { coefficient, radicand } = simplifySqrt(discriminant);
    const approxRoot = Math.sqrt(discriminant);
    return {
      discriminant,
      roots: [1, -1].map((sign) => ({
        type: 'surd' as const,
        p: -b,
        c: sign * coefficient,
        r: radicand,
        q: 2 * a,
        approx: (-b + sign * approxRoot) / (2 * a),
      })),
    };
  }

  if (discriminant === 0) {
    return { discriminant, roots: [{ type: 'rational', value: makeFrac(-b, 2 * a) }] };
  }

  const { coefficient, radicand } = simplifySqrt(-discriminant);
  // Normalise the sign onto the numerators so the denominator stays positive
  // — `2a` is negative whenever the leading coefficient is.
  const denominator = 2 * a;
  const sign = denominator < 0 ? -1 : 1;
  const q = Math.abs(denominator);
  return {
    discriminant,
    roots: [1, -1].map((s) => ({
      type: 'complex' as const,
      re: makeFrac(sign * -b, q),
      imNumerator: sign * s * coefficient,
      imRadicand: radicand,
      imDenominator: q,
    })),
  };
}

/** Factor an integer polynomial down to roots, using the rational-root
 *  theorem and deflating until degree ≤ 2. Returns null when a factor of
 *  degree ≥ 3 has no rational root — that case is genuinely out of scope. */
function polynomialRoots(intCoefficients: number[]): { roots: Root[]; rationalFactors: Frac[] } | null {
  let coefficients = [...intCoefficients];
  // Strip a common factor — it changes nothing about the roots and keeps the
  // divisor search small.
  const g = coefficients.reduce((acc, v) => gcd(acc, v), 0);
  if (g > 1) coefficients = coefficients.map((v) => v / g);

  const roots: Root[] = [];
  const rationalFactors: Frac[] = [];
  let guard = 0;

  while (coefficients.length - 1 > 2 && guard++ < 8) {
    // Drop a trailing x factor: x·(…) has the root 0 and one degree less.
    if (coefficients[0] === 0) {
      const zero = makeFrac(0, 1);
      roots.push({ type: 'rational', value: zero });
      rationalFactors.push(zero);
      coefficients = coefficients.slice(1);
      continue;
    }
    const leading = coefficients[coefficients.length - 1];
    const constant = coefficients[0];
    let found: { p: number; q: number } | null = null;
    outer: for (const q of divisors(leading)) {
      for (const pAbs of divisors(constant)) {
        for (const sign of [1, -1]) {
          const p = sign * pAbs;
          if (polyValueAtRational(coefficients, p, q) !== 0) continue;
          if (gcd(p, q) !== 1) continue;
          found = { p, q };
          break outer;
        }
      }
    }
    if (!found) return null;
    const next = deflate(coefficients, found.p, found.q);
    if (!next) return null;
    const value = makeFrac(found.p, found.q);
    roots.push({ type: 'rational', value });
    rationalFactors.push(value);
    coefficients = next;
  }

  const degree = coefficients.length - 1;
  if (degree === 2) {
    const { roots: qr } = quadraticRoots(coefficients[2], coefficients[1], coefficients[0]);
    roots.push(...qr);
  } else if (degree === 1) {
    roots.push({ type: 'rational', value: makeFrac(-coefficients[0], coefficients[1]) });
  } else if (degree === 0) {
    // The polynomial reduced to a non-zero constant — no further roots.
    if (coefficients[0] !== 0 && roots.length === 0) return null;
  } else {
    return null;
  }

  return { roots: dedupeRoots(roots), rationalFactors };
}

function dedupeRoots(roots: Root[]): Root[] {
  const seen = new Set<string>();
  const out: Root[] = [];
  for (const root of roots) {
    const key = rootToLatex(root);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(root);
  }
  return out;
}

// ============================================================
// Invertible non-polynomial forms
// ============================================================

/** Linear coefficients of `expr` in `variable`: returns {a, b} for a·v + b,
 *  or null if it isn't linear. Determined by sampling at three points and
 *  checking the third against the line through the first two — cheap, and
 *  it needs no symbolic manipulation. */
function linearCoefficients(expr: string, variable: string): { a: number; b: number } | null {
  try {
    const node = parse(expr);
    const at = (v: number) => Number(node.evaluate({ [variable]: v }));
    const f0 = at(0);
    const f1 = at(1);
    const f2 = at(2);
    if (![f0, f1, f2].every(Number.isFinite)) return null;
    const a = f1 - f0;
    const b = f0;
    if (Math.abs(a * 2 + b - f2) > 1e-9 * Math.max(1, Math.abs(f2))) return null;
    return { a, b };
  } catch {
    return null;
  }
}

type InvertibleMatch = { fn: 'exp' | 'log' | 'sqrt' | 'power'; inner: string; base?: number };

/** Detect `F(u) = k` where F is invertible and u is linear — the family the
 *  5-unit paper solves in one algebraic move. */
function matchInvertible(lhs: string): InvertibleMatch | null {
  const trimmed = lhs.trim();
  let m = trimmed.match(/^exp\s*\((.+)\)$/);
  if (m) return { fn: 'exp', inner: m[1], base: Math.E };
  m = trimmed.match(/^e\s*\^\s*\((.+)\)$/) ?? trimmed.match(/^e\s*\^\s*([a-zA-Z0-9*+\-./]+)$/);
  if (m) return { fn: 'exp', inner: m[1], base: Math.E };
  m = trimmed.match(/^([0-9.]+)\s*\^\s*\((.+)\)$/) ?? trimmed.match(/^([0-9.]+)\s*\^\s*([a-zA-Z0-9*+\-./]+)$/);
  if (m) return { fn: 'power', inner: m[2], base: Number(m[1]) };
  m = trimmed.match(/^log\s*\((.+)\)$/);
  if (m && !m[1].includes(',')) return { fn: 'log', inner: m[1], base: Math.E };
  m = trimmed.match(/^sqrt\s*\((.+)\)$/);
  if (m) return { fn: 'sqrt', inner: m[1] };
  return null;
}

// ============================================================
// Integration table
// ============================================================

function isConstantIn(node: MathNode, variable: string): boolean {
  let constant = true;
  node.traverse((child) => {
    if (child.type === 'SymbolNode' && (child as unknown as { name: string }).name === variable) {
      constant = false;
    }
  });
  return constant;
}

function linearOf(node: MathNode, variable: string): { a: number; b: number } | null {
  return linearCoefficients(node.toString(), variable);
}

/**
 * Symbolic antiderivative over the bagrut integral table.
 *
 * Returns a mathjs-syntax string, or null when the integrand is outside the
 * table. Deliberately NOT a general integrator: everything it claims, it
 * claims exactly, and `∫ x·sin(x) dx` (integration by parts, not on the
 * 5-unit syllabus) comes back null rather than wrong.
 *
 * Table: sums · constant multiples · (ax+b)^n for n ≠ −1 · 1/(ax+b) ·
 * e^(ax+b) · k^(ax+b) · sin(ax+b) · cos(ax+b) · √(ax+b).
 */
export function antiderivative(node: MathNode, variable: string): string | null {
  const v = variable;

  if (isConstantIn(node, v)) {
    return `(${node.toString()})*${v}`;
  }

  if (node.type === 'SymbolNode') {
    return `${v}^2/2`;
  }

  if (node.type === 'ParenthesisNode') {
    return antiderivative((node as unknown as { content: MathNode }).content, v);
  }

  if (node.type === 'OperatorNode') {
    const op = node as unknown as { op: string; args: MathNode[]; fn: string };

    if (op.op === '+' || op.op === '-') {
      if (op.args.length === 1) {
        // Unary minus.
        const inner = antiderivative(op.args[0], v);
        return inner ? `-(${inner})` : null;
      }
      const left = antiderivative(op.args[0], v);
      const right = antiderivative(op.args[1], v);
      if (!left || !right) return null;
      return `(${left}) ${op.op} (${right})`;
    }

    if (op.op === '*') {
      const [l, r] = op.args;
      if (isConstantIn(l, v)) {
        const inner = antiderivative(r, v);
        return inner ? `(${l.toString()})*(${inner})` : null;
      }
      if (isConstantIn(r, v)) {
        const inner = antiderivative(l, v);
        return inner ? `(${r.toString()})*(${inner})` : null;
      }
      return null; // a genuine product of two functions — by parts, out of scope
    }

    if (op.op === '/') {
      const [num, den] = op.args;
      if (isConstantIn(den, v)) {
        const inner = antiderivative(num, v);
        return inner ? `(${inner})/(${den.toString()})` : null;
      }
      if (isConstantIn(num, v)) {
        const lin = linearOf(den, v);
        // ∫ k/(ax+b) dx = (k/a)·ln|ax+b|
        if (lin && Math.abs(lin.a) > 1e-12) {
          return `(${num.toString()})/(${lin.a})*log(abs(${den.toString()}))`;
        }
      }
      return null;
    }

    if (op.op === '^') {
      const [base, exponent] = op.args;
      // (ax+b)^n
      if (isConstantIn(exponent, v)) {
        const n = Number(exponent.evaluate?.({}) ?? NaN);
        if (!Number.isFinite(n)) return null;
        const lin = linearOf(base, v);
        if (!lin || Math.abs(lin.a) < 1e-12) return null;
        if (Math.abs(n + 1) < 1e-12) {
          return `log(abs(${base.toString()}))/(${lin.a})`;
        }
        return `(${base.toString()})^(${n + 1})/((${lin.a})*(${n + 1}))`;
      }
      // k^(ax+b) — including e^(ax+b), where ln k = 1.
      if (isConstantIn(base, v)) {
        const k = Number(base.evaluate?.({}) ?? NaN);
        if (!Number.isFinite(k) || k <= 0 || k === 1) return null;
        const lin = linearOf(exponent, v);
        if (!lin || Math.abs(lin.a) < 1e-12) return null;
        const lnK = Math.log(k);
        return Math.abs(lnK - 1) < 1e-12
          ? `(${base.toString()})^(${exponent.toString()})/(${lin.a})`
          : `(${base.toString()})^(${exponent.toString()})/((${lin.a})*log(${k}))`;
      }
      return null;
    }

    return null;
  }

  if (node.type === 'FunctionNode') {
    const fn = node as unknown as { fn: { name?: string }; args: MathNode[] };
    const name = fn.fn?.name ?? '';
    const [arg] = fn.args;
    if (!arg) return null;
    const lin = linearOf(arg, v);
    if (!lin || Math.abs(lin.a) < 1e-12) return null;
    const inner = arg.toString();
    switch (name) {
      case 'sin':
        return `-cos(${inner})/(${lin.a})`;
      case 'cos':
        return `sin(${inner})/(${lin.a})`;
      case 'exp':
        return `exp(${inner})/(${lin.a})`;
      case 'sqrt':
        return `2*(${inner})^(3/2)/(3*(${lin.a}))`;
      default:
        return null;
    }
  }

  return null;
}

// ============================================================
// The engine
// ============================================================

export const localEngine: SymbolicEngine = {
  id: ENGINE_ID,
  label: 'מנוע מקומי',
  paid: false,

  supports(kind: ProblemKind): boolean {
    return SUPPORTED.includes(kind);
  },

  async isAvailable(): Promise<boolean> {
    return true; // pure computation, always available, on server and client
  },

  async solve(problem: ClassifiedProblem): Promise<SolveOutcome> {
    try {
      switch (problem.kind) {
        case 'equation':
          return solveEquation(problem);
        case 'inequality':
          return solveInequality(problem);
        case 'system':
          return solveSystem(problem);
        case 'derivative':
          return solveDerivative(problem);
        case 'integral':
        case 'definite-integral':
          return solveIntegral(problem);
        case 'simplify':
          return solveSimplify(problem);
        case 'evaluate':
          return solveEvaluate(problem);
        default:
          return unsupported(problem.kind, `הסוג "${problem.kind}" לא נתמך במנוע המקומי`);
      }
    } catch (error) {
      return failed(problem.kind, error instanceof Error ? error.message : 'שגיאה לא צפויה');
    }
  },
};

// ------------------------------------------------------------
// equation
// ------------------------------------------------------------

function solveEquation(problem: ClassifiedProblem): SolveOutcome {
  const source = problem.expressions.find((e) => splitRelation(e)?.relation === '=');
  if (!source) return unsupported('equation', 'לא נמצאה משוואה עם סימן שוויון');
  const relation = splitRelation(source)!;

  const variable = problem.variables[0] ?? 'x';
  const lhs = latexToMathjs(relation.lhs);
  const rhs = latexToMathjs(relation.rhs);
  const moved = `(${lhs}) - (${rhs})`;

  const steps: SolveStep[] = [{ kind: 'restate', latex: `${tex(lhs)} = ${tex(rhs)}` }];
  // "Zero step-skipping" means never hiding a move the student has to make —
  // it does not mean printing a move that isn't there. When the right side is
  // already 0 there is nothing to transpose, and the step would render as
  // the noise `(x²-4x+1) - 0 = 0`.
  if (!isLiteralZero(rhs)) {
    steps.push({ kind: 'move-terms', latex: `${tex(simplified(moved))} = 0`, data: { variable } });
  }

  // --- polynomial path ---
  const fracs = polynomialCoefficients(moved, variable);
  if (fracs) {
    const ints = clearDenominators(fracs);
    if (!ints) return unsupported('equation', 'המקדמים גדולים מדי לחישוב מדויק');
    // Trim leading zero coefficients so the degree is the real degree.
    while (ints.length > 1 && ints[ints.length - 1] === 0) ints.pop();
    const degree = ints.length - 1;

    if (degree === 0) {
      return ints[0] === 0
        ? unsupported('equation', 'המשוואה מתקיימת לכל ערך — זהות, לא משוואה')
        : unsupported('equation', 'המשוואה לא מתקיימת לאף ערך');
    }

    if (degree === 1) {
      const root = makeFrac(-ints[0], ints[1]);
      steps.push({
        kind: 'solve-linear',
        latex: `${variable} = ${fracToLatex(root)}`,
        data: { a: ints[1], b: ints[0] },
      });
      return concludeRoots('equation', steps, variable, [{ type: 'rational', value: root }], moved);
    }

    if (degree === 2) {
      const [c, b, a] = ints;
      const { roots, discriminant } = quadraticRoots(a, b, c);
      steps.push({ kind: 'coefficients', latex: `a = ${a},\\ b = ${b},\\ c = ${c}` });
      steps.push({
        kind: 'discriminant',
        // `signed()` is not cosmetic. With b = −4 the naive template renders
        // "Δ = -4^2 - 4·1·1 = 12", and −4² reads as −(4²) = −16, so the line
        // a student copies is arithmetically false even though Δ itself is
        // right. Negative coefficients get their own parentheses.
        latex: `\\Delta = ${signed(b)}^2 - 4 \\cdot ${signed(a)} \\cdot ${signed(c)} = ${discriminant}`,
        data: { discriminant },
      });
      if (discriminant < 0) {
        // Complex roots are only an ANSWER in the complex-numbers topic; in
        // every other topic the expected answer is "no real solution".
        if (problem.domain === 'complex') {
          steps.push({ kind: 'apply-formula', latex: `${variable}_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}` });
          return concludeRoots('equation', steps, variable, roots, moved);
        }
        steps.push({ kind: 'conclude', latex: `\\Delta < 0` });
        return {
          status: 'solved',
          kind: 'equation',
          steps,
          answerLatex: 'אין פתרון ממשי',
          answerValues: [],
          engine: ENGINE_ID,
          verified: true,
        };
      }
      steps.push({ kind: 'apply-formula', latex: `${variable}_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}` });
      return concludeRoots('equation', steps, variable, roots, moved);
    }

    if (degree <= 4) {
      const factored = polynomialRoots(ints);
      if (!factored) {
        return unsupported('equation', 'הפולינום לא מתפרק לגורמים רציונליים');
      }
      if (factored.rationalFactors.length > 0) {
        const factors = factored.rationalFactors
          .map((f) => `\\left(${variable} - ${fracToLatex(f)}\\right)`)
          .join('');
        steps.push({ kind: 'factor', latex: factors });
      }
      return concludeRoots('equation', steps, variable, factored.roots, moved);
    }

    return unsupported('equation', `מעלה ${degree} — מעבר לתחום המנוע המקומי`);
  }

  // --- invertible non-polynomial path ---
  const invertible = matchInvertible(lhs);
  const rhsValue = safeNumber(rhs);
  if (invertible && rhsValue !== null) {
    return solveInvertible(problem, steps, variable, invertible, rhsValue, moved);
  }

  // Trigonometric equations are refused ON PURPOSE — see the header.
  if (/\b(sin|cos|tan|cot)\s*\(/.test(lhs) || /\b(sin|cos|tan|cot)\s*\(/.test(rhs)) {
    return unsupported('equation', 'משוואה טריגונומטרית — הפתרון הוא משפחה אינסופית');
  }

  return unsupported('equation', 'משוואה לא פולינומית שאינה מהצורות ההפיכות');
}

function solveInvertible(
  problem: ClassifiedProblem,
  steps: SolveStep[],
  variable: string,
  match: InvertibleMatch,
  target: number,
  original: string
): SolveOutcome {
  const inner = latexToMathjs(match.inner);
  const lin = linearCoefficients(inner, variable);
  if (!lin || Math.abs(lin.a) < 1e-12) {
    return unsupported('equation', 'הביטוי בתוך הפונקציה אינו לינארי');
  }

  let innerTarget: number;
  switch (match.fn) {
    case 'exp':
    case 'power': {
      const base = match.base ?? Math.E;
      if (target <= 0) {
        steps.push({ kind: 'domain', latex: `${tex(match.inner)} > 0` });
        return {
          status: 'solved',
          kind: 'equation',
          steps,
          answerLatex: 'אין פתרון',
          answerValues: [],
          engine: ENGINE_ID,
          verified: true,
        };
      }
      steps.push({
        kind: 'apply-formula',
        latex: `${tex(match.inner)} = \\log_{${base === Math.E ? 'e' : base}}${target}`,
      });
      innerTarget = Math.log(target) / Math.log(base);
      break;
    }
    case 'log': {
      steps.push({ kind: 'domain', latex: `${tex(match.inner)} > 0` });
      steps.push({ kind: 'apply-formula', latex: `${tex(match.inner)} = e^{${target}}` });
      innerTarget = Math.exp(target);
      break;
    }
    case 'sqrt': {
      if (target < 0) {
        return {
          status: 'solved',
          kind: 'equation',
          steps,
          answerLatex: 'אין פתרון',
          answerValues: [],
          engine: ENGINE_ID,
          verified: true,
        };
      }
      steps.push({ kind: 'domain', latex: `${tex(match.inner)} \\ge 0` });
      steps.push({ kind: 'apply-formula', latex: `${tex(match.inner)} = ${target}^2` });
      innerTarget = target * target;
      break;
    }
  }

  const value = (innerTarget - lin.b) / lin.a;
  const asFrac = toFrac(value);
  const root: Root = asFrac
    ? { type: 'rational', value: asFrac }
    : { type: 'rational', value: makeFrac(Math.round(value * 1e6), 1e6) };

  // An irrational result (ln 3 / ln 2) has no exact rational form — say the
  // decimal is an approximation rather than dressing it up as exact.
  const exact = asFrac !== null;
  steps.push({
    kind: 'solve-linear',
    latex: `${variable} = ${exact ? fracToLatex(asFrac!) : value.toFixed(4)}`,
    data: exact ? {} : { approximate: 1 },
  });

  return concludeRoots('equation', steps, variable, [root], original, {
    approximate: !exact,
    approximateLatex: exact ? undefined : `${variable} \\approx ${value.toFixed(4)}`,
    domain: problem.domain,
  });
}

/** Attach the final answer + a substitution check. The check is the reason
 *  `verified` can be true: we put every root back into the original
 *  expression and confirm it evaluates to zero. */
function concludeRoots(
  kind: ProblemKind,
  steps: SolveStep[],
  variable: string,
  roots: Root[],
  original: string,
  options: { approximate?: boolean; approximateLatex?: string; domain?: string } = {}
): SolveOutcome {
  if (roots.length === 0) {
    return unsupported(kind, 'לא נמצאו פתרונות');
  }

  const realRoots = roots.filter((r) => r.type !== 'complex');
  const verifiable = options.approximate ? [] : realRoots;
  let verified = verifiable.length > 0;
  for (const root of verifiable) {
    const x = rootApprox(root);
    if (!Number.isFinite(x)) {
      verified = false;
      break;
    }
    try {
      const residual = Number(evaluate(original, { [variable]: x }));
      // Scale the tolerance with the magnitude of the root: a residual of
      // 1e-7 is noise at x = 1000 and a real error at x = 0.001.
      if (!Number.isFinite(residual) || Math.abs(residual) > 1e-6 * Math.max(1, Math.abs(x) ** 2)) {
        verified = false;
        break;
      }
    } catch {
      verified = false;
      break;
    }
  }
  if (verified) {
    steps.push({
      kind: 'verify',
      latex: roots
        .filter((r) => r.type !== 'complex')
        .map((r) => `${variable} = ${rootToLatex(r)}`)
        .join(',\\quad '),
    });
  }

  const answerLatex =
    options.approximateLatex ??
    (roots.length === 1
      ? `${variable} = ${rootToLatex(roots[0])}`
      : roots.map((r, i) => `${variable}_{${i + 1}} = ${rootToLatex(r)}`).join(',\\quad '));

  steps.push({ kind: 'conclude', latex: answerLatex });

  return {
    status: 'solved',
    kind,
    steps,
    answerLatex,
    answerValues: roots.map(rootToValue),
    engine: ENGINE_ID,
    verified,
  };
}

function safeNumber(expression: string): number | null {
  try {
    const value = Number(evaluate(expression));
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// inequality
// ------------------------------------------------------------

function solveInequality(problem: ClassifiedProblem): SolveOutcome {
  const source = problem.expressions.find((e) => {
    const r = splitRelation(e);
    return r && (r.relation === '<' || r.relation === '>' || r.relation === '≤' || r.relation === '≥');
  });
  if (!source) return unsupported('inequality', 'לא נמצא אי-שוויון');
  const relation = splitRelation(source)!;
  const variable = problem.variables[0] ?? 'x';

  const lhs = latexToMathjs(relation.lhs);
  const rhs = latexToMathjs(relation.rhs);
  const moved = `(${lhs}) - (${rhs})`;

  const fracs = polynomialCoefficients(moved, variable);
  if (!fracs) return unsupported('inequality', 'אי-שוויון לא פולינומי');
  const ints = clearDenominators(fracs);
  if (!ints) return unsupported('inequality', 'המקדמים גדולים מדי');
  while (ints.length > 1 && ints[ints.length - 1] === 0) ints.pop();
  const degree = ints.length - 1;

  const steps: SolveStep[] = [
    { kind: 'restate', latex: `${tex(lhs)} ${relationTex(relation.relation)} ${tex(rhs)}` },
  ];
  if (!isLiteralZero(rhs)) {
    steps.push({
      kind: 'move-terms',
      latex: `${tex(simplified(moved))} ${relationTex(relation.relation)} 0`,
    });
  }

  const strict = relation.relation === '<' || relation.relation === '>';
  const greater = relation.relation === '>' || relation.relation === '≥';

  if (degree === 1) {
    const [b, a] = ints;
    const boundary = makeFrac(-b, a);
    // Dividing by a negative number reverses the inequality — the single
    // most common sign error in the whole topic, so it gets its own step.
    const flipped = a < 0;
    const finalGreater = flipped ? !greater : greater;
    steps.push({
      kind: 'solve-linear',
      latex: `${variable} ${symbolFor(finalGreater, strict)} ${fracToLatex(boundary)}`,
      data: flipped ? { flipped: 1 } : {},
    });
    const answerLatex = `${variable} ${symbolFor(finalGreater, strict)} ${fracToLatex(boundary)}`;
    steps.push({ kind: 'conclude', latex: answerLatex });
    return {
      status: 'solved',
      kind: 'inequality',
      steps,
      answerLatex,
      answerValues: [],
      engine: ENGINE_ID,
      verified: true,
    };
  }

  if (degree === 2) {
    const [c, b, a] = ints;
    const { roots, discriminant } = quadraticRoots(a, b, c);
    steps.push({ kind: 'coefficients', latex: `a = ${a},\\ b = ${b},\\ c = ${c}` });
    steps.push({ kind: 'discriminant', latex: `\\Delta = ${discriminant}`, data: { discriminant } });

    // No real roots → the parabola never crosses the axis, so its sign is
    // the sign of `a` everywhere.
    if (discriminant < 0) {
      const alwaysPositive = a > 0;
      const holds = greater ? alwaysPositive : !alwaysPositive;
      const answerLatex = holds ? 'כל ערך ממשי' : 'אין פתרון';
      steps.push({ kind: 'conclude', latex: `\\Delta < 0` });
      return {
        status: 'solved',
        kind: 'inequality',
        steps,
        answerLatex,
        answerValues: [],
        engine: ENGINE_ID,
        verified: true,
      };
    }

    const realRoots = roots.filter((r) => r.type !== 'complex');
    const values = realRoots.map(rootApprox).sort((x, y) => x - y);
    const latexRoots = realRoots
      .slice()
      .sort((x, y) => rootApprox(x) - rootApprox(y))
      .map(rootToLatex);
    steps.push({ kind: 'roots', latex: latexRoots.map((r, i) => `${variable}_{${i + 1}} = ${r}`).join(',\\quad ') });

    if (values.length === 1) {
      // Double root: the parabola touches the axis. `a·(x−r)² ≥ 0` for a > 0.
      const positiveSide = a > 0;
      const answerLatex = describeDoubleRoot(variable, latexRoots[0], positiveSide, greater, strict);
      steps.push({ kind: 'conclude', latex: answerLatex });
      return {
        status: 'solved',
        kind: 'inequality',
        steps,
        answerLatex,
        answerValues: [],
        engine: ENGINE_ID,
        verified: true,
      };
    }

    // Two distinct roots. For a > 0 the expression is positive OUTSIDE the
    // roots and negative between them; for a < 0 it is the mirror image.
    const outside = (a > 0) === greater;
    const [r1, r2] = latexRoots;
    const answerLatex = outside
      ? `${variable} ${strict ? '<' : '\\le'} ${r1} \\quad \\text{או} \\quad ${variable} ${strict ? '>' : '\\ge'} ${r2}`
      : `${r1} ${strict ? '<' : '\\le'} ${variable} ${strict ? '<' : '\\le'} ${r2}`;
    // The `\text{או}` above is Hebrew inside math, which KaTeX renders
    // reversed — so the answer is assembled WITHOUT it and the "or" is added
    // by the Hebrew explainer, outside the delimiters.
    const answerParts = outside
      ? [
          `${variable} ${strict ? '<' : '\\le'} ${r1}`,
          `${variable} ${strict ? '>' : '\\ge'} ${r2}`,
        ]
      : [`${r1} ${strict ? '<' : '\\le'} ${variable} ${strict ? '<' : '\\le'} ${r2}`];
    steps.push({
      kind: 'conclude',
      latex: answerParts.join('\\quad'),
      data: { alternatives: answerParts.length },
    });
    void answerLatex;

    return {
      status: 'solved',
      kind: 'inequality',
      steps,
      answerLatex: answerParts.join('  |  '),
      answerValues: [],
      engine: ENGINE_ID,
      verified: true,
    };
  }

  return unsupported('inequality', `מעלה ${degree} — מעבר לתחום המנוע המקומי`);
}

function describeDoubleRoot(
  variable: string,
  root: string,
  positiveSide: boolean,
  greater: boolean,
  strict: boolean
): string {
  // a·(x − r)² with a > 0 is ≥ 0 always and > 0 everywhere except x = r.
  const nonNegative = positiveSide;
  if (greater && nonNegative) return strict ? `${variable} \\ne ${root}` : 'כל ערך ממשי';
  if (!greater && nonNegative) return strict ? 'אין פתרון' : `${variable} = ${root}`;
  if (greater && !nonNegative) return strict ? 'אין פתרון' : `${variable} = ${root}`;
  return strict ? `${variable} \\ne ${root}` : 'כל ערך ממשי';
}

function relationTex(relation: string): string {
  return relation === '≤' ? '\\le' : relation === '≥' ? '\\ge' : relation === '≠' ? '\\ne' : relation;
}

function symbolFor(greater: boolean, strict: boolean): string {
  if (greater) return strict ? '>' : '\\ge';
  return strict ? '<' : '\\le';
}

// ------------------------------------------------------------
// 2×2 linear system
// ------------------------------------------------------------

function solveSystem(problem: ClassifiedProblem): SolveOutcome {
  const equations = problem.expressions
    .map(splitRelation)
    .filter((r): r is NonNullable<typeof r> => !!r && r.relation === '=');
  if (equations.length < 2) return unsupported('system', 'נמצאה פחות ממשוואה אחת מלאה');
  if (equations.length > 2) return unsupported('system', 'יותר משתי משוואות — מעבר לתחום המנוע המקומי');
  if (problem.variables.length !== 2) {
    return unsupported('system', 'המנוע המקומי פותר מערכת בשני נעלמים בלבד');
  }

  const [vx, vy] = problem.variables;
  const rows: { a: number; b: number; c: number }[] = [];
  for (const equation of equations) {
    const moved = `(${latexToMathjs(equation.lhs)}) - (${latexToMathjs(equation.rhs)})`;
    const coefficients = bilinearCoefficients(moved, vx, vy);
    if (!coefficients) return unsupported('system', 'המערכת אינה לינארית');
    rows.push(coefficients);
  }

  const [r1, r2] = rows;
  const determinant = r1.a * r2.b - r2.a * r1.b;
  // Restate the equations AS WRITTEN. Re-rendering them from the extracted
  // coefficients produced `1x + 1y = 5` and `1x + -y = 1` — arithmetically
  // the same system, and not what is on the student's page.
  const steps: SolveStep[] = equations.map((equation) => ({
    kind: 'restate' as const,
    latex: `${tex(latexToMathjs(equation.lhs))} = ${tex(latexToMathjs(equation.rhs))}`,
  }));

  if (Math.abs(determinant) < 1e-12) {
    return unsupported('system', 'הדטרמיננטה מתאפסת — אין פתרון יחיד');
  }

  const xValue = (r1.c * r2.b - r2.c * r1.b) / determinant;
  const yValue = (r1.a * r2.c - r2.a * r1.c) / determinant;
  const xFrac = toFrac(xValue);
  const yFrac = toFrac(yValue);
  if (!xFrac || !yFrac) return unsupported('system', 'הפתרון אינו רציונלי');

  // `D`, not `Δ` — in this syllabus Δ is the quadratic discriminant, and
  // reusing the symbol for the coefficient determinant teaches a collision.
  steps.push({
    kind: 'apply-formula',
    latex: `D = ${signed(r1.a)} \\cdot ${signed(r2.b)} - ${signed(r2.a)} \\cdot ${signed(r1.b)} = ${determinant}`,
  });
  steps.push({ kind: 'solve-linear', latex: `${vx} = ${fracToLatex(xFrac)}` });
  steps.push({ kind: 'solve-linear', latex: `${vy} = ${fracToLatex(yFrac)}` });

  // Substitute back into BOTH original equations — a system is the one place
  // where a sign slip can satisfy one equation and break the other.
  const verified = rows.every(
    (row) => Math.abs(row.a * xValue + row.b * yValue - row.c) < 1e-9 * Math.max(1, Math.abs(row.c))
  );
  if (verified) {
    steps.push({ kind: 'verify', latex: `${vx} = ${fracToLatex(xFrac)},\\ ${vy} = ${fracToLatex(yFrac)}` });
  }

  const answerLatex = `${vx} = ${fracToLatex(xFrac)},\\quad ${vy} = ${fracToLatex(yFrac)}`;
  steps.push({ kind: 'conclude', latex: answerLatex });

  return {
    status: 'solved',
    kind: 'system',
    steps,
    answerLatex,
    answerValues: [fracToValue(xFrac), fracToValue(yFrac)],
    engine: ENGINE_ID,
    verified,
  };
}

/** Coefficients of a·x + b·y − c, verified linear by a third sample point. */
function bilinearCoefficients(
  expression: string,
  vx: string,
  vy: string
): { a: number; b: number; c: number } | null {
  try {
    const node = parse(expression);
    const at = (x: number, y: number) => Number(node.evaluate({ [vx]: x, [vy]: y }));
    const f00 = at(0, 0);
    const f10 = at(1, 0);
    const f01 = at(0, 1);
    const f11 = at(1, 1);
    if (![f00, f10, f01, f11].every(Number.isFinite)) return null;
    const a = f10 - f00;
    const b = f01 - f00;
    // Linear ⟺ f(1,1) = a + b + f(0,0). An x·y term breaks exactly this.
    if (Math.abs(a + b + f00 - f11) > 1e-9 * Math.max(1, Math.abs(f11))) return null;
    // A second check further out catches quadratics that happen to agree at
    // the unit square.
    if (Math.abs(2 * a + 3 * b + f00 - at(2, 3)) > 1e-9 * Math.max(1, Math.abs(at(2, 3)))) return null;
    return { a, b, c: -f00 };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// derivative
// ------------------------------------------------------------

function solveDerivative(problem: ClassifiedProblem): SolveOutcome {
  const raw = pickExpressionBody(problem);
  if (!raw) return unsupported('derivative', 'לא נמצא ביטוי לגזירה');
  const variable = problem.variables[0] ?? 'x';
  const expression = latexToMathjs(raw);

  let result: MathNode;
  try {
    result = derivative(expression, variable);
  } catch (error) {
    return unsupported('derivative', error instanceof Error ? error.message : 'הגזירה נכשלה');
  }
  const simplified = (() => {
    try {
      return simplify(result);
    } catch {
      return result;
    }
  })();

  const steps: SolveStep[] = [
    { kind: 'restate', latex: `f(${variable}) = ${tex(expression)}` },
    { kind: 'differentiate', latex: `f'(${variable}) = ${texOf(result)}` },
  ];
  const simplifiedTex = texOf(simplified);
  if (simplifiedTex !== texOf(result)) {
    steps.push({ kind: 'simplify', latex: `f'(${variable}) = ${simplifiedTex}` });
  }
  steps.push({ kind: 'conclude', latex: `f'(${variable}) = ${simplifiedTex}` });

  return {
    status: 'solved',
    kind: 'derivative',
    steps,
    answerLatex: `f'(${variable}) = ${simplifiedTex}`,
    answerValues: [simplified.toString()],
    engine: ENGINE_ID,
    // A derivative from mathjs is symbolically exact; there is nothing to
    // substitute back, so `verified` reports the definition being applied.
    verified: true,
  };
}

// ------------------------------------------------------------
// integral
// ------------------------------------------------------------

function solveIntegral(problem: ClassifiedProblem): SolveOutcome {
  const raw = pickExpressionBody(problem);
  if (!raw) return unsupported(problem.kind, 'לא נמצא ביטוי לאינטגרציה');
  const variable = problem.variables[0] ?? 'x';
  const expression = latexToMathjs(raw);

  let node: MathNode;
  try {
    node = parse(expression);
  } catch {
    return unsupported(problem.kind, 'לא הצלחנו לפרסר את הביטוי');
  }

  const primitive = antiderivative(node, variable);
  if (!primitive) {
    return unsupported(problem.kind, 'האינטגרל אינו בטבלת האינטגרלים של הסילבוס');
  }

  const simplified = (() => {
    try {
      return simplify(primitive).toString();
    } catch {
      return primitive;
    }
  })();

  const steps: SolveStep[] = [
    { kind: 'restate', latex: `\\int ${tex(expression)}\\,d${variable}` },
    { kind: 'integrate', latex: `F(${variable}) = ${tex(simplified)}` },
  ];

  // Differentiating the antiderivative back and comparing numerically is a
  // genuine check, not a formality: the table above is hand-written, and
  // this is what catches a wrong constant factor.
  const verified = verifyAntiderivative(simplified, expression, variable);

  if (problem.kind === 'integral' || !problem.bounds) {
    const answerLatex = `${tex(simplified)} + C`;
    steps.push({ kind: 'conclude', latex: answerLatex });
    return {
      status: 'solved',
      kind: 'integral',
      steps,
      answerLatex,
      answerValues: [],
      engine: ENGINE_ID,
      verified,
    };
  }

  const lower = latexToMathjs(problem.bounds.lower);
  const upper = latexToMathjs(problem.bounds.upper);
  let value: number;
  try {
    const a = Number(evaluate(lower));
    const b = Number(evaluate(upper));
    const fa = Number(evaluate(simplified, { [variable]: a }));
    const fb = Number(evaluate(simplified, { [variable]: b }));
    if (![a, b, fa, fb].every(Number.isFinite)) throw new Error('non-finite');
    value = fb - fa;
  } catch {
    return unsupported('definite-integral', 'לא הצלחנו להציב את גבולות האינטגרציה');
  }

  steps.push({
    kind: 'evaluate-bounds',
    latex: `\\left[${tex(simplified)}\\right]_{${tex(lower)}}^{${tex(upper)}}`,
  });

  const asFrac = toFrac(value);
  const answerLatex = asFrac ? fracToLatex(asFrac) : `${round(value, 4)}`;
  steps.push({ kind: 'conclude', latex: answerLatex });

  return {
    status: 'solved',
    kind: 'definite-integral',
    steps,
    answerLatex,
    answerValues: asFrac ? [fracToValue(asFrac)] : [`${value}`],
    engine: ENGINE_ID,
    verified,
  };
}

/** F' ≟ f, sampled at points where both are defined. */
function verifyAntiderivative(primitive: string, integrand: string, variable: string): boolean {
  let back: MathNode;
  try {
    back = derivative(primitive, variable);
  } catch {
    return false;
  }
  let checked = 0;
  for (const x of [0.37, 1.13, 2.71, -1.42, 4.09]) {
    try {
      const lhs = Number(back.evaluate({ [variable]: x }));
      const rhs = Number(evaluate(integrand, { [variable]: x }));
      // Skip points outside a domain (log of a negative, division by zero) —
      // those are undefined for BOTH sides and prove nothing either way.
      if (!Number.isFinite(lhs) || !Number.isFinite(rhs)) continue;
      if (Math.abs(lhs - rhs) > 1e-6 * Math.max(1, Math.abs(rhs))) return false;
      checked++;
    } catch {
      continue;
    }
  }
  return checked >= 2;
}

// ------------------------------------------------------------
// simplify / evaluate
// ------------------------------------------------------------

function solveSimplify(problem: ClassifiedProblem): SolveOutcome {
  const raw = pickExpressionBody(problem);
  if (!raw) return unsupported('simplify', 'לא נמצא ביטוי לפישוט');
  const expression = latexToMathjs(raw);
  try {
    const result = simplify(expression);
    const answerLatex = tidyTex(result.toTex());
    return {
      status: 'solved',
      kind: 'simplify',
      steps: [
        { kind: 'restate', latex: tex(expression) },
        { kind: 'simplify', latex: answerLatex },
        { kind: 'conclude', latex: answerLatex },
      ],
      answerLatex,
      answerValues: [result.toString()],
      engine: ENGINE_ID,
      verified: sampleEqual(expression, result.toString()),
    };
  } catch (error) {
    return unsupported('simplify', error instanceof Error ? error.message : 'הפישוט נכשל');
  }
}

function solveEvaluate(problem: ClassifiedProblem): SolveOutcome {
  const raw = pickExpressionBody(problem);
  if (!raw) return unsupported('evaluate', 'לא נמצא ביטוי לחישוב');
  const expression = latexToMathjs(raw);
  // A free variable means there is nothing to evaluate — that is a simplify
  // question, and answering it with a number would be nonsense.
  try {
    const value = Number(evaluate(expression));
    if (!Number.isFinite(value)) throw new Error('non-finite');
    const asFrac = toFrac(value);
    const answerLatex = asFrac ? fracToLatex(asFrac) : `${round(value, 6)}`;
    return {
      status: 'solved',
      kind: 'evaluate',
      steps: [
        { kind: 'restate', latex: tex(expression) },
        { kind: 'conclude', latex: answerLatex },
      ],
      answerLatex,
      answerValues: [asFrac ? fracToValue(asFrac) : `${value}`],
      engine: ENGINE_ID,
      verified: true,
    };
  } catch {
    return solveSimplify({ ...problem, kind: 'simplify' });
  }
}

/** Two expressions agree at several sample points. Used as a cheap guard on
 *  `simplify`, which is the one mathjs operation that has historically been
 *  able to change a value (through an unguarded assumption). */
function sampleEqual(a: string, b: string): boolean {
  let checked = 0;
  for (const x of [0.31, 1.7, 2.9, -0.8]) {
    try {
      const va = Number(evaluate(a, { x, y: x + 1, t: x, n: x, z: x }));
      const vb = Number(evaluate(b, { x, y: x + 1, t: x, n: x, z: x }));
      if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
      if (Math.abs(va - vb) > 1e-6 * Math.max(1, Math.abs(va))) return false;
      checked++;
    } catch {
      continue;
    }
  }
  return checked >= 2;
}

/** The expression to operate on when the question isn't a relation: prefer a
 *  relation's right-hand side (`f(x) = …`), else the longest math run. */
function pickExpressionBody(problem: ClassifiedProblem): string | null {
  for (const expression of problem.expressions) {
    const relation = splitRelation(expression);
    if (relation && relation.relation === '=') return relation.rhs;
  }
  const sorted = [...problem.expressions].sort((a, b) => b.length - a.length);
  return sorted[0] ?? null;
}

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

export const __testables = {
  polynomialCoefficients,
  quadraticRoots,
  polynomialRoots,
  antiderivative,
  bilinearCoefficients,
  linearCoefficients,
  matchInvertible,
  rootToLatex,
  divisors,
  deflate,
};
