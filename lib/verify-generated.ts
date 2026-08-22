/**
 * verify-generated.ts — does the model's own arithmetic actually check out?
 *
 * THE PROBLEM
 * -----------
 * `/api/practice` and `/api/questions` ship AI-generated exercises straight to
 * students after a STRUCTURAL check only ("is `final_answer` a string?"). If
 * the model's arithmetic is wrong, nothing notices — and the damage is not
 * cosmetic: `/api/check-answer` grades the student against that same wrong
 * `final_answer`, so a student who solved it correctly is told they are wrong.
 *
 * WHY NOT JUST PARSE `final_answer`
 * ---------------------------------
 * Because it is deliberately free-form prose. The practice prompt asks for
 * "התשובה הסופית בלבד... אם זה הוכחה — מסקנה", so valid answers include
 * "האי-שוויון מתקיים לכל $x>2$" and "מש\"ל". A blanket "must parse" gate would
 * reject correct output — a false-rejection machine that also costs a paid
 * regeneration every time it fires. Rejecting good work is worse than the bug.
 *
 * WHAT THIS DOES INSTEAD
 * ----------------------
 * The model emits its own mechanical self-check alongside the exercise: one or
 * more `{ expr, equals }` pairs with every substitution ALREADY APPLIED. The
 * server evaluates both sides with mathjs and compares. The model cannot fake
 * this — it does not compute the result, mathjs does. A model that says
 * "the roots are 2 and 3" and emits `2^2 - 5*2 + 6 = 0` is checkable; if its
 * arithmetic drifted, the check fails and we know before the student does.
 *
 * Checks are advisory by design: `unverifiable` (no check emitted, or a proof /
 * locus question with no numeric identity) is NOT a failure. Only a check that
 * RAN and disagreed is a failure.
 */

import { create, all, type MathNode } from 'mathjs';
import { latexToMathjs } from '@/lib/mathscan/solve/parse';

// ------------------------------------------------------------
// Sandboxed evaluator — this is a TRUST BOUNDARY
// ------------------------------------------------------------
//
// Everything evaluated here is model output arriving over the network, and it
// runs on the SERVER. Stock mathjs is not safe for that: `import` and
// `createUnit` mutate the instance, and `f(x) = ...` / `x = ...` let an
// expression define and invoke its own functions. mathjs's own security note
// is explicit about it. So we harden twice, belt and braces:
//   1. neuter the escape-hatch functions on the instance, and
//   2. allowlist node types and function names on the parsed tree, so anything
//      that is not plain arithmetic is refused BEFORE it is evaluated.
const math = create(all, { number: 'number' });

/**
 * cis θ with θ in DEGREES — the 5-unit bagrut convention, never radians and
 * never `re^{iθ}` (see MATH_FORMAT_RULES in lib/agents/prompts.ts).
 *
 * ⚠️ TWIN: lib/answer-check.ts defines this identically for the client-side
 * grader. The two must agree — if this one used radians, a מרוכבים exercise
 * would verify here and then be graded differently in the browser. Kept local
 * rather than shared because answer-check.ts is a client module and importing
 * it here would drag browser code into the server bundle.
 */
math.import(
  {
    cis: (deg: number) => {
      const r = (deg * Math.PI) / 180;
      return math.complex(Math.cos(r), Math.sin(r));
    },
  },
  { override: true }
);

/**
 * Our own handle on the parser, taken BEFORE the escape hatches below are
 * neutered — `parse` is on that list, and calling the neutered version would
 * make every expression throw.
 *
 * ⚠️ That failure mode is not theoretical and it is not loud: with a broken
 * parser, `runCheck` refuses hostile input AND correct arithmetic alike, so the
 * sandbox tests still pass while the feature is entirely dead. scripts/
 * test-verify-generated.ts asserts legitimate maths evaluates precisely so a
 * refusal can never be mistaken for security.
 */
const parseExpression = math.parse.bind(math);

/**
 * Escape hatches that must never be reachable from an evaluated expression.
 *
 * This is the second of two layers and on its own it would be redundant: none
 * of these names is in ALLOWED_FUNCTIONS, so `assertSafe` already refuses them
 * before evaluation. It stays because the allowlist is a list someone will edit
 * one day, and this layer does not care what that list says.
 */
const DISABLED = [
  'import', 'createUnit', 'evaluate', 'parse', 'compile', 'simplify',
  'derivative', 'help', 'chain', 'parser', 'resolve', 'rationalize',
] as const;
math.import(
  Object.fromEntries(
    DISABLED.map((name) => [
      name,
      () => {
        throw new Error(`${name} is disabled in verify-generated`);
      },
    ])
  ),
  { override: true }
);

/** Node types that are plain arithmetic. Anything else (assignment, function
 *  definition, block, index access, object literal) is refused outright. */
const ALLOWED_NODES = new Set([
  'ConstantNode', 'SymbolNode', 'OperatorNode', 'ParenthesisNode', 'FunctionNode',
]);

/** Functions a bagrut answer can legitimately need. Deliberately closed: a name
 *  that is not here is refused rather than evaluated. */
const ALLOWED_FUNCTIONS = new Set([
  'abs', 'sqrt', 'cbrt', 'exp', 'log', 'log10', 'log2', 'ln',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh',
  'pow', 'nthRoot', 'hypot',
  'factorial', 'combinations', 'permutations',
  'min', 'max', 'round', 'floor', 'ceil', 'sign',
  'complex', 're', 'im', 'conj', 'arg', 'cis',
  'gcd', 'lcm', 'mod',
]);

/**
 * Symbols an expression may reference. Free variables are refused: a check is
 * supposed to arrive with every substitution already applied, so a leftover
 * `x` means the model emitted an identity it never actually evaluated.
 *
 * `deg` / `rad` are here because trigonometry is otherwise a false-failure
 * machine. mathjs `cos(360)` is radians and evaluates to -0.284; the bagrut
 * convention this app follows is DEGREES (it is why `cis` above is degrees).
 * Rather than silently redefine sin/cos/tan — which would then break the
 * calculus side of the syllabus, where radians are correct — the units stay
 * explicit and the generator prompt requires the model to write `cos(360 deg)`.
 * MEASURED: without this, 3 of 4 trigonometry self-checks failed as "bad math"
 * on arithmetic that was in fact correct.
 */
const ALLOWED_SYMBOLS = new Set([
  'pi', 'PI', 'e', 'i', 'tau', 'Infinity', 'true', 'false', 'deg', 'rad', 'grad',
]);

/** Throws with a specific reason if the tree is anything but closed arithmetic. */
function assertSafe(node: MathNode): void {
  node.traverse((n: MathNode) => {
    if (!ALLOWED_NODES.has(n.type)) {
      throw new Error(`node type ${n.type} is not allowed`);
    }
    if (n.type === 'FunctionNode') {
      // `fn` is a SymbolNode for a plain call; anything else is an expression
      // resolving to a function at runtime, which we never permit.
      const fn = (n as unknown as { fn?: { name?: string; type?: string } }).fn;
      if (!fn || fn.type !== 'SymbolNode' || !fn.name || !ALLOWED_FUNCTIONS.has(fn.name)) {
        throw new Error(`function ${fn?.name ?? '<computed>'} is not allowed`);
      }
    }
    if (n.type === 'SymbolNode') {
      const name = (n as unknown as { name: string }).name;
      // A SymbolNode that is the callee of a FunctionNode is already validated
      // above; those also appear here, so accept any allowed function name.
      if (!ALLOWED_SYMBOLS.has(name) && !ALLOWED_FUNCTIONS.has(name)) {
        throw new Error(`unresolved symbol "${name}" — substitutions must be applied before the check`);
      }
    }
  });
}

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

/**
 * One mechanical assertion about the exercise, emitted by the model with all
 * substitutions already applied.
 *
 * Example — exercise "פתור $x^2-5x+6=0$", answer $x=2$ or $x=3$:
 *   { claim: 'הצבת x=2 במשוואה', expr: '2^2 - 5*2 + 6', equals: '0' }
 *   { claim: 'הצבת x=3 במשוואה', expr: '3^2 - 5*3 + 6', equals: '0' }
 */
export type SelfCheck = {
  /** Hebrew, for the server log and for `npm run verify:generated`. Never shown
   *  to a student — a failing check means we withhold the exercise, not that we
   *  explain our plumbing to a 17-year-old. */
  claim: string;
  /** mathjs-evaluable. No free variables. */
  expr: string;
  /** mathjs-evaluable expected value. */
  equals: string;
};

export type CheckOutcome =
  /** Ran and agreed. */
  | { status: 'verified'; claim: string }
  /** Could not be run — no check emitted, or not closed arithmetic. NOT a
   *  failure: proofs and loci have no numeric identity to assert. */
  | { status: 'unverifiable'; claim: string; reason: string }
  /** Ran and DISAGREED. The model's arithmetic is wrong. */
  | { status: 'failed'; claim: string; expected: string; got: string };

export type VerifyReport = {
  outcomes: CheckOutcome[];
  verified: number;
  unverifiable: number;
  failed: number;
  /** True when at least one check ran and none disagreed. The gate the routes
   *  use: an exercise with zero runnable checks is allowed through (it may
   *  genuinely be a proof), one with a FAILED check is not. */
  ok: boolean;
};

// ------------------------------------------------------------
// Comparison
// ------------------------------------------------------------

/**
 * Relative tolerance, so a check on a value of ~1e6 is not held to an absolute
 * 1e-7. lib/answer-check.ts uses the same 1e-7 scale for student answers.
 *
 * Deliberately LOOSE, because the two error directions are not symmetric here:
 * a false rejection withholds a correct exercise and buys a paid regeneration,
 * while the thing we are hunting — hallucinated arithmetic — is essentially
 * never wrong by one part in 10⁷. It is wrong by a sign, a factor, or a whole
 * root. Tightening this would trade the failure we care about for one we do not.
 *
 * ponytail: relative tolerance means an off-by-one is absorbed once values pass
 * ~1e7 (tolerance there is ~1). Fine for a syllabus whose answers are almost all
 * under 1e6; if a combinatorics topic ever needs exact integer identities at
 * that scale, add an `exact: true` flag to SelfCheck rather than tightening TOL
 * globally and inviting false rejections everywhere else.
 */
const TOL = 1e-7;

type Numeric = { re: number; im: number };

/** Narrows a mathjs result to a real/complex pair, or null if it is a matrix,
 *  unit, string, or anything else a final answer should never be. */
function toNumeric(value: unknown): Numeric | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { re: value, im: 0 } : null;
  }
  if (value && typeof value === 'object' && 're' in value && 'im' in value) {
    const { re, im } = value as Numeric;
    if (typeof re === 'number' && typeof im === 'number' && Number.isFinite(re) && Number.isFinite(im)) {
      return { re, im };
    }
  }
  return null;
}

function evaluateClosed(source: string): Numeric {
  // The model writes LaTeX everywhere else in the payload, so tolerate it here
  // rather than making the schema's one non-LaTeX field a footgun.
  const cleaned = latexToMathjs(source);
  const node = parseExpression(cleaned);
  assertSafe(node);
  const numeric = toNumeric(node.evaluate());
  if (!numeric) throw new Error('result is not a real or complex number');
  return numeric;
}

/**
 * How precise did the model CLAIM to be?
 *
 * A model asked for the value of `(14²+156-10²)/(2·14·√156)` naturally writes
 * `equals: "0.7206"` — a correctly rounded four-decimal answer. Held to a 1e-7
 * relative tolerance that reads as "bad math", and MEASURED, that was the single
 * largest source of false failures in scripts/measure-generator.ts.
 *
 * So a bare decimal literal is honoured at the precision it states and no
 * further: "0.7206" accepts anything that rounds to it, while "0" or "sqrt(2)"
 * claim exactness and stay on the tight relative tolerance. That keeps
 * substitute-into-the-equation checks strict — which is where a real
 * hallucination shows up — without punishing a model for rounding a decimal it
 * was never asked to give in full.
 *
 * Returns null when the literal states no precision.
 */
function statedPrecision(source: string): number | null {
  const m = /^\s*[+-]?\d+\.(\d+)\s*$/.exec(source);
  return m ? 0.5 * Math.pow(10, -m[1].length) : null;
}

function close(a: Numeric, b: Numeric, equalsSource: string): boolean {
  const scale = Math.max(1, Math.hypot(a.re, a.im), Math.hypot(b.re, b.im));
  const floatNoise = TOL * scale;
  const stated = statedPrecision(equalsSource);
  // Never go BELOW the float-noise floor: a model writing "0.30000000000000004"
  // states 17 decimals it does not really have.
  const tolerance = stated === null ? floatNoise : Math.max(stated, floatNoise);
  return Math.hypot(a.re - b.re, a.im - b.im) <= tolerance;
}

function render(n: Numeric): string {
  if (Math.abs(n.im) <= TOL) return String(Number(n.re.toPrecision(12)));
  return `${Number(n.re.toPrecision(12))}${n.im < 0 ? '-' : '+'}${Number(Math.abs(n.im).toPrecision(12))}i`;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

/** Run one self-check. Never throws — a malformed check is `unverifiable`,
 *  which is exactly what it is. */
export function runCheck(check: SelfCheck): CheckOutcome {
  const claim = check?.claim?.trim() || '(ללא תיאור)';
  if (!check?.expr?.trim() || !check?.equals?.trim()) {
    return { status: 'unverifiable', claim, reason: 'expr or equals is empty' };
  }
  let left: Numeric;
  let right: Numeric;
  try {
    left = evaluateClosed(check.expr);
  } catch (error) {
    return { status: 'unverifiable', claim, reason: `expr: ${(error as Error).message}` };
  }
  try {
    right = evaluateClosed(check.equals);
  } catch (error) {
    return { status: 'unverifiable', claim, reason: `equals: ${(error as Error).message}` };
  }
  return close(left, right, check.equals)
    ? { status: 'verified', claim }
    : { status: 'failed', claim, expected: render(right), got: render(left) };
}

/**
 * Run every self-check on a generated exercise.
 *
 * `ok` is false ONLY when a check ran and disagreed. An exercise that emitted
 * no runnable check is allowed through — see the module header for why
 * withholding those would cost more than it saves.
 */
export function verifyGenerated(checks: readonly SelfCheck[] | undefined | null): VerifyReport {
  const outcomes = (checks ?? []).map(runCheck);
  const count = (s: CheckOutcome['status']) => outcomes.filter((o) => o.status === s).length;
  const failed = count('failed');
  return {
    outcomes,
    verified: count('verified'),
    unverifiable: count('unverifiable'),
    failed,
    ok: failed === 0,
  };
}

/** The JSON-schema fragment the generator routes bolt onto their own schema, so
 *  the shape the model is asked for and the shape parsed here cannot drift. */
export const SELF_CHECK_SCHEMA = {
  type: 'array',
  description:
    'Mechanical self-checks a computer algebra system will run against your own answer. ' +
    'Apply every substitution yourself and leave NO free variables. Emit an empty array ' +
    'only when the exercise has no numeric identity to assert (a proof, or a geometric locus).',
  items: {
    type: 'object',
    properties: {
      claim: { type: 'string', description: 'What is being checked, in Hebrew. e.g. "הצבת x=2 במשוואה"' },
      expr: { type: 'string', description: 'Expression to evaluate, substitutions applied. e.g. "2^2 - 5*2 + 6"' },
      equals: { type: 'string', description: 'Expected value. e.g. "0"' },
    },
    required: ['claim', 'expr', 'equals'],
    additionalProperties: false,
  },
} as const;
