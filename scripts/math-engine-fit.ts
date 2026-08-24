/**
 * math-engine-fit.ts — could the maths engine have answered THIS student, on
 * THIS question, for THIS intent — pedagogically and safely?
 *
 * ============================================================
 * THE QUESTION THIS DELIBERATELY DOES NOT ASK
 * ============================================================
 * "Did SymPy return something" is the easy measurement and the wrong one. It
 * over-counts in both directions:
 *
 *   TOO HIGH  the engine returns `x = 4` for a question whose student asked
 *             "מה השלב הבא?". A final answer handed over as a hint is not a
 *             hint — it is the end of the exercise, delivered early.
 *   TOO LOW   the engine "fails" on a question whose student asked
 *             "בדוק את התשובה שלי", which `checkAnswer` already answers in
 *             process, with a diagnosis, and always could.
 *
 * So every assessment here is (intent × what the engine actually produced),
 * and the safe outcome is the one that abstains. A turn counted as
 * convertible is a promise that a student would get a BETTER answer for free,
 * not merely a different one.
 */

import { analyzeQuestion, type QuestionAnalysis } from '../lib/analyze-question';
import type { CanonicalIntent } from '../lib/tutor-intent';

export type EngineAction = 'solve' | 'simplify' | 'validate' | 'derive_steps' | 'none';

export type LocalPath = 'local_content' | 'math_engine' | 'ask_clarification' | 'LLM';

/** Why the engine must not be used, even when it computed something. */
export type NotSafeReason =
  | ''
  | 'not_eligible'
  | 'engine_failed'
  | 'answer_not_verified'
  | 'no_usable_steps'
  | 'answer_only_no_working'
  | 'would_reveal_answer'
  | 'intent_needs_prose'
  | 'intent_already_local'
  | 'no_intent';

export type MathFit = {
  mathEngineEligible: boolean;
  mathEngineActionCandidate: EngineAction;
  mathEngineAttempted: boolean;
  mathEngineSucceeded: boolean;
  mathEngineConfidence: number;
  mathEngineHasUsableSteps: boolean;
  mathEngineCanAnswerIntent: boolean;
  proposedLocalPath: LocalPath;
  unsafeIfLocal: boolean;
  reasonNotSafeToUseMathEngine: NotSafeReason;
};

/**
 * A step a student can act on.
 *
 * `restate` is the question read back and `conclude` is the answer — neither
 * teaches a move. A "solution" made only of those two is an answer wearing
 * three lines, and offering it as working is how a student is handed the end
 * of the exercise while believing they were given a start.
 */
export function usableSteps(a: QuestionAnalysis | null): number {
  if (!a?.solution) return 0;
  return a.solution.steps.filter(
    (s) => s.kind !== 'restate' && s.kind !== 'conclude' && Boolean(s.latex),
  ).length;
}

/** Which engine action the student's words are asking for. */
export function actionFor(intent: CanonicalIntent | null, hasTypedAnswer: boolean): EngineAction {
  if (hasTypedAnswer) return 'validate';
  switch (intent) {
    case 'why_wrong':
      return 'validate';
    case 'how_to_compute':
    case 'how_to_solve':
      return 'solve';
    case 'next_step':
    case 'what_to_do_here':
    case 'why_this_step':
      return 'derive_steps';
    case 'explain':
    case 'how_it_works':
    case 'didnt_understand':
    case 'give_example':
    case 'give_table':
    case 'which_formula':
      return 'none';
    default:
      return 'none';
  }
}

/**
 * The five rules from the brief, one branch each, and every one written to
 * refuse rather than stretch.
 */
export function assessMathEngine(
  analysis: QuestionAnalysis | null,
  intent: CanonicalIntent | null,
  hasTypedAnswer: boolean,
): MathFit {
  const action = actionFor(intent, hasTypedAnswer);
  const eligible = Boolean(analysis?.deterministicEligible);
  const attempted = Boolean(analysis && analysis.mathEngineAction !== 'none');
  const succeeded = Boolean(analysis?.solution);
  const steps = usableSteps(analysis);
  const verified = Boolean(analysis?.solution?.verified);
  const confidence = analysis?.confidence ?? 0;

  const base = {
    mathEngineEligible: eligible,
    mathEngineActionCandidate: action,
    mathEngineAttempted: attempted,
    mathEngineSucceeded: succeeded,
    mathEngineConfidence: confidence,
    mathEngineHasUsableSteps: steps > 0,
  };

  const no = (reason: NotSafeReason, path: LocalPath = 'LLM'): MathFit => ({
    ...base,
    mathEngineCanAnswerIntent: false,
    proposedLocalPath: path,
    unsafeIfLocal: false,
    reasonNotSafeToUseMathEngine: reason,
  });

  // ---- rule 1: "בדוק את התשובה שלי" -------------------------------
  // Already local and already better: checkAnswer runs in process, compares
  // mathematically, and returns the SHAPE of the mistake. The engine adds a
  // network hop and no diagnosis. Counting this as a MathEngine win would be
  // claiming credit for something that never needed it.
  if (action === 'validate') {
    return { ...no('intent_already_local', 'local_content') };
  }

  if (!intent) return no('no_intent');

  // ---- the intents no solver can serve ----------------------------
  // A table, an example, "explain it to me" — none of these is a computation,
  // and a solver that answered them would be answering something else.
  if (action === 'none') return no('intent_needs_prose');

  if (!eligible) return no('not_eligible');
  if (!succeeded) return no('engine_failed');

  // ---- rule 2: "פתור" ---------------------------------------------
  // A full solution may be shown only when the answer was substituted back
  // AND there is working to show. An unverified answer presented as fact is
  // the failure this whole codebase keeps measuring its way out of.
  if (action === 'solve') {
    if (!verified) return no('answer_not_verified');
    if (steps === 0) return no('answer_only_no_working');
    return {
      ...base,
      mathEngineCanAnswerIntent: true,
      proposedLocalPath: 'math_engine',
      unsafeIfLocal: false,
      reasonNotSafeToUseMathEngine: '',
    };
  }

  // ---- rules 3 and 4: "מה השלב הבא?" / "למה עושים את זה?" ----------
  // A hint must be a MOVE, not the destination. If the engine returned only a
  // final answer, showing it as the next step hands over the exercise.
  if (action === 'derive_steps') {
    if (steps === 0) return no('no_usable_steps');
    // Rule 4 is stricter than rule 3: explaining WHY a step is taken needs the
    // step to carry machine data (coefficients, a discriminant, a named
    // formula) that a template can turn into a reason. Without it the honest
    // answer is prose, and prose is the model's.
    if (intent === 'why_this_step') {
      const hasReasonable = (analysis?.solution?.steps ?? []).some(
        (s) => s.data && Object.keys(s.data).length > 0,
      );
      if (!hasReasonable) return no('intent_needs_prose');
    }
    // A single step that already equals the final answer is the answer again.
    if (steps === 1 && verified && (analysis?.solution?.answerValues.length ?? 0) > 0) {
      const only = (analysis?.solution?.steps ?? []).find(
        (s) => s.kind !== 'restate' && s.kind !== 'conclude',
      );
      const bare = (s: string) => s.replace(/\\[a-zA-Z]+|[{}\s$]/g, '');
      const leaks = (analysis?.solution?.answerValues ?? []).some(
        (v) => only?.latex && bare(only.latex).includes(bare(v)),
      );
      if (leaks) return no('would_reveal_answer');
    }
    return {
      ...base,
      mathEngineCanAnswerIntent: true,
      proposedLocalPath: 'math_engine',
      unsafeIfLocal: false,
      reasonNotSafeToUseMathEngine: '',
    };
  }

  return no('intent_needs_prose');
}

/** One analysis per QUESTION, not per turn — the same question is asked in
 *  dozens of phrasings and the engine's answer does not depend on the wording. */
const cache = new Map<string, QuestionAnalysis | null>();

export async function analysisFor(
  key: string,
  questionText: string,
): Promise<QuestionAnalysis | null> {
  if (cache.has(key)) return cache.get(key)!;
  let a: QuestionAnalysis | null = null;
  try {
    a = await analyzeQuestion({ question: questionText });
  } catch {
    a = null;
  }
  cache.set(key, a);
  return a;
}
