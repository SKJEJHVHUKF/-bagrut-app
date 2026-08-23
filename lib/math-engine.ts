/**
 * math-engine.ts — one façade over every way this app can do maths.
 *
 * ============================================================
 * WHY A FAÇADE WHEN A CHAIN ALREADY EXISTS
 * ============================================================
 * `lib/mathscan/solve` already registers engines and walks them in order
 * (`localEngine` then `sympyEngine`), and that machinery is good. But its
 * front door is `solveProblem(problem: ClassifiedProblem)` — it wants a
 * classified problem, not a string, and it answers in `SolveOutcome`, which
 * is shaped for the scan pipeline.
 *
 * Callers outside that pipeline — the tutor, an API route, a test — have a
 * string and a question. This file is the door for them: strings in, one
 * shape out, and no knowledge of which engine answered.
 *
 * THE POINT IS THE ORDER, NOT THE WRAPPER
 * ---------------------------------------
 *   1. mathjs, in-process        instant, offline, $0
 *   2. SymPy, in-repo function   what mathjs refuses; still $0, ~1 network hop
 *   3. requiresLLM: true         neither could; the CALLER decides to pay
 *
 * Step 3 never calls a model itself. A module that quietly reaches for an API
 * when its own logic fails is how a cost ceiling stops meaning anything — so
 * this one reports that it is out of ideas and lets the caller choose.
 *
 * ⚠️ `confidence` is not decoration. A student is shown a result as fact, so
 * a low-confidence classification must not be presented the same way as a
 * verified one. `verified` says the answer was substituted back and checked;
 * `confidence` says how sure we are the question was even read correctly.
 */

import { classifyProblem } from '@/lib/mathscan/solve/classify';
import { solveProblem } from '@/lib/mathscan/solve';
import { latexToMathjs } from '@/lib/mathscan/solve/parse';
import { checkAnswer, type AnswerSpec, type AnswerDiagnosis } from '@/lib/answer-check';
import type { ProblemKind, SolveStep } from '@/lib/mathscan/types';

export type MathAction = 'solve' | 'validate' | 'simplify' | 'steps';

export type MathEngineResult = {
  success: boolean;
  action: MathAction;
  /** The input after LaTeX and OCR quirks are normalised away. */
  normalizedExpression: string;
  /** The answer, in LaTeX. Empty when nothing was solved. */
  result: string;
  /** Individual values, for comparison rather than display. */
  values: string[];
  steps: SolveStep[];
  /** Only meaningful for `validate`; null otherwise. */
  isCorrect: boolean | null;
  /** How the student's answer was wrong, when the shape is recognisable. */
  diagnosis?: AnswerDiagnosis;
  /** Substituted back and checked — not "the engine said so". */
  isExact: boolean;
  /** 0–1. How sure we are the question was READ correctly. */
  confidence: number;
  /** Which engine answered: 'local-mathjs' | 'sympy' | 'none'. */
  engine: string;
  warnings: string[];
  /** True when no deterministic path could answer. The caller decides whether
   *  to pay for a model; this module never does. */
  requiresLLM: boolean;
};

const EMPTY = (action: MathAction, normalized: string, reason: string): MathEngineResult => ({
  success: false,
  action,
  normalizedExpression: normalized,
  result: '',
  values: [],
  steps: [],
  isCorrect: null,
  isExact: false,
  confidence: 0,
  engine: 'none',
  warnings: [reason],
  requiresLLM: true,
});

const MAX_INPUT = 500;

/** Kinds that map onto a deterministic action. Anything else — a proof, a
 *  locus, a word problem — is the model's, and saying so early avoids a
 *  pointless network hop to SymPy. */
const DETERMINISTIC: ProblemKind[] = [
  'equation', 'inequality', 'system', 'simplify', 'evaluate',
  'derivative', 'integral', 'definite-integral', 'limit',
];

async function run(
  action: MathAction,
  input: string | string[],
  variable?: string,
  /** The ORIGINAL question, Hebrew prose included. See the classify call below —
   *  omitting it silently changes what the engine is asked to DO. */
  text?: string,
): Promise<MathEngineResult> {
  const expressions = (Array.isArray(input) ? input : [input]).map((s) => String(s ?? '').trim()).filter(Boolean);
  const normalized = expressions.map((e) => latexToMathjs(e).trim()).join(' ; ');

  if (expressions.length === 0) return EMPTY(action, '', 'no expression supplied');
  if (expressions.some((e) => e.length > MAX_INPUT)) return EMPTY(action, normalized, 'expression too long');

  // `text` carries the Hebrew instruction when there is one — classify.ts is
  // explicit that the Hebrew IS the signal for what to DO, and classifying
  // from the equation alone loses the instruction verb. `expressions` is the
  // maths already extracted from it.
  //
  // ⚠️ MEASURED: falling back to `expressions.join('\n')` is not a harmless
  // default, it CHANGES THE QUESTION. "גזור את הפונקציה $x^3 - 4x$" without
  // its Hebrew is just the expression `x^3-4x`, which classifies as `evaluate`
  // — so the engine simplified it and handed the input back as a "verified"
  // answer. The scan pipeline, which passes the full transcription, got the
  // correct `f'(x) = 3x^2 - 4` from the same engine on the same input. The
  // bug was never in the solver; it was in what we told it to solve.
  const problem = classifyProblem({ text: text?.trim() || expressions.join('\n'), expressions });
  if (!DETERMINISTIC.includes(problem.kind)) {
    return {
      ...EMPTY(action, normalized, `not a deterministic problem kind: ${problem.kind}`),
      confidence: problem.confidence,
    };
  }

  const chain = await solveProblem({
    ...problem,
    expressions,
    ...(variable ? { variables: [variable, ...problem.variables.filter((v) => v !== variable)] } : {}),
  });
  const outcome = chain.outcome;

  if (outcome.status !== 'solved') {
    return {
      ...EMPTY(action, normalized, outcome.reason),
      confidence: problem.confidence,
      // Every engine that was asked and what it said — so "why did this cost a
      // model call" is answerable from the result rather than from the logs.
      warnings: [outcome.reason, ...chain.attempts.map((a) => `${a.engine}: ${a.status}${a.reason ? ` (${a.reason})` : ''}`)],
    };
  }

  return {
    success: true,
    action,
    normalizedExpression: normalized,
    result: outcome.answerLatex,
    values: outcome.answerValues,
    steps: outcome.steps,
    isCorrect: null,
    isExact: outcome.verified,
    confidence: problem.confidence,
    engine: outcome.engine,
    warnings: outcome.verified ? [] : ['the answer was not verified by substitution'],
    requiresLLM: false,
  };
}

export const MathEngine = {
  /** Solve an equation, a system, a derivative, an integral, a limit. */
  solve(input: string | string[], opts: { variable?: string; text?: string } = {}) {
    return run('solve', input, opts.variable, opts.text);
  },

  simplify(input: string, opts: { variable?: string; text?: string } = {}) {
    return run('simplify', input, opts.variable, opts.text);
  },

  /** The worked steps, without the framing. Same work as `solve`; a separate
   *  name because the hint flow asks for steps and reads better saying so. */
  getSteps(input: string | string[], opts: { variable?: string; text?: string } = {}) {
    return run('steps', input, opts.variable, opts.text);
  },

  /**
   * Is the student's answer right?
   *
   * `spec` FIRST when the content has one. An authored `AnswerSpec` is what
   * the exercise's author decided the answer is, checked by lib/answer-check
   * in-process with no network and with a DIAGNOSIS of how a wrong answer is
   * wrong (sign flip, conjugate, partial set, swapped boxes). Re-deriving the
   * answer from the question text would be slower, less certain, and could
   * disagree with the content the student is looking at.
   *
   * Solving to compare is the fallback for input that has no authored spec —
   * a scanned question, a pasted exercise.
   */
  async validate(
    studentAnswer: string,
    against: { spec?: AnswerSpec; expression?: string | string[]; variable?: string; text?: string },
  ): Promise<MathEngineResult> {
    const typed = String(studentAnswer ?? '').trim();
    if (!typed) return EMPTY('validate', '', 'empty answer');

    if (against.spec && against.spec.kind !== 'manual') {
      const res = checkAnswer(typed, against.spec);
      if (res.verdict === 'correct' || res.verdict === 'wrong') {
        return {
          success: true,
          action: 'validate',
          normalizedExpression: res.readAs ?? latexToMathjs(typed).trim(),
          result: '',
          values: [],
          steps: [],
          isCorrect: res.verdict === 'correct',
          ...(res.diagnosis ? { diagnosis: res.diagnosis } : {}),
          isExact: true,
          confidence: 1,
          engine: 'local-mathjs',
          warnings: [],
          requiresLLM: false,
        };
      }
      // 'unparseable' — fall through and try solving instead of calling the
      // student wrong for typing something the spec's parser did not expect.
    }

    if (!against.expression) return EMPTY('validate', latexToMathjs(typed).trim(), 'no spec and no expression to check against');

    const solved = await run('validate', against.expression, against.variable, against.text);
    if (!solved.success) return { ...solved, action: 'validate' };

    const { checkAnswer: check } = await import('@/lib/answer-check');
    const spec: AnswerSpec =
      solved.values.length > 1 ? { kind: 'set', values: solved.values } : { kind: 'value', value: solved.values[0] ?? solved.result };
    const res = check(typed, spec);
    return {
      ...solved,
      action: 'validate',
      isCorrect: res.verdict === 'correct' ? true : res.verdict === 'wrong' ? false : null,
      ...(res.diagnosis ? { diagnosis: res.diagnosis } : {}),
      requiresLLM: res.verdict === 'unparseable',
      warnings: res.verdict === 'unparseable' ? [...solved.warnings, 'could not read the student answer'] : solved.warnings,
    };
  },
};
