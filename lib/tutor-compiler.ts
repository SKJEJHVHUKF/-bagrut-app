/**
 * tutor-compiler.ts — one function that decides whether the tutor can answer
 * this student, right now, from material that is already written.
 *
 * ============================================================
 * THE CONTRACT
 * ============================================================
 * In: what the student asked (a canonical intent), what is on their screen,
 * and what the answer checker said. Out: a finished Hebrew message, or an
 * honest `handled: false` with the reason.
 *
 * ⚠️ NO API CALL HAPPENS IN THIS FILE, and none can. There is no client here,
 * no fetch, no import that leads to one — a test reads this file's own source
 * and fails if that changes. `requiresLLM` is a REPORT; the caller pays.
 *
 * ============================================================
 * THE RULE THAT KEEPS IT HONEST
 * ============================================================
 * Every answer is GROUNDED: it is built from this question's own hint, steps,
 * rule line, formulas, key points or distractor note, or from an authored
 * Topic Card that answers a question about the TOPIC. Nothing is composed.
 *
 * And the two kinds are never mixed. A Topic Card is a general answer, correct
 * for "מה זה בלי החזרה?" and wrong for "מה השלב הבא?" — the second is about
 * the exercise, and a general answer to it is something true about something
 * else. `cardCanAnswer` holds that line; this file holds it again.
 */

import { canonicalIntent as classifyIntent, type CanonicalIntent } from '@/lib/tutor-intent';
import { matchTopicCard, renderTopicCard, cardCanAnswer } from '@/lib/topic-cards';
import { coachMistake, type MistakeKind } from '@/lib/error-coach';
import { leaksAnswer } from '@/lib/help-ladder';
import type { AnswerDiagnosis } from '@/lib/answer-check';
import type { FallbackReason } from '@/lib/tutor-telemetry';

export type ResponseType =
  | 'hint'
  | 'next_step'
  | 'why_step'
  | 'formula'
  | 'mistake_feedback'
  | 'topic_card'
  | 'clarification';

/** Where every sentence in the message came from. Empty is a bug, not a state. */
export type GroundedSource =
  | 'solution.steps'
  | 'solution.rule'
  | 'hint'
  | 'explanation'
  | 'formulas'
  | 'keyPoints'
  | 'distractorNotes'
  | 'checkAnswer'
  | 'topic_card';

export type CompilerInput = {
  canonicalIntent?: CanonicalIntent | null;
  /** The raw message, used only when `canonicalIntent` is not supplied. */
  message?: string;
  activeQuestion?: Record<string, unknown> | null;
  /** 0-based index of the step the student is on, if the screen knows. */
  activeStep?: number | null;
  selectedAnswer?: number | null;
  checkAnswerResult?: { isCorrect: boolean; diagnosis?: AnswerDiagnosis } | null;
  topic?: string;
  subtopic?: string;
  /** Bumped when the question's content changes; a cache keys on it. */
  contentVersion?: string;
  /** subTopic.formulas / keyPoints, when the screen has them. */
  formulas?: { name?: string; latex?: string; note?: string }[];
  keyPoints?: string[];
};

export type CompilerResult = {
  handled: boolean;
  responseType: ResponseType;
  message: string;
  groundedSources: GroundedSource[];
  confidence: number;
  safeToServe: boolean;
  requiresLLM: boolean;
  fallbackReason: FallbackReason | null;
};

const text = (v: unknown): string => (typeof v === 'string' && v.trim() ? v.trim() : '');
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const unhandled = (reason: FallbackReason): CompilerResult => ({
  handled: false,
  responseType: 'clarification',
  message: '',
  groundedSources: [],
  confidence: 0,
  safeToServe: false,
  requiresLLM: true,
  fallbackReason: reason,
});

const served = (
  responseType: ResponseType,
  message: string,
  groundedSources: GroundedSource[],
  confidence: number,
): CompilerResult => ({
  handled: true,
  responseType,
  message,
  groundedSources,
  confidence,
  safeToServe: true,
  requiresLLM: false,
  fallbackReason: null,
});

/**
 * The steps a student can act on.
 *
 * The rule line is pulled out separately: solutions in this app open with a
 * step marked `**הכלל:**` that names the formula AND the trigger in the
 * question's wording. It is the one piece of a solution that explains WHY a
 * move is taken, which is exactly what `why_this_step` asks for — and without
 * it that intent has no honest local answer.
 */
function stepsOf(q: Record<string, unknown> | null | undefined) {
  const solution = (q?.solution ?? {}) as Record<string, unknown>;
  const all = list(solution.steps);
  const rule = all.find((s) => s.startsWith('**הכלל:**'));
  const moves = all.filter((s) => s !== rule);
  return { all, rule, moves, finalAnswer: text(solution.finalAnswer) };
}

export async function compileTutorResponse(input: CompilerInput): Promise<CompilerResult> {
  const intent =
    input.canonicalIntent !== undefined
      ? input.canonicalIntent
      : classifyIntent(input.message ?? '').intent;

  const q = input.activeQuestion ?? null;
  const { rule, moves, finalAnswer } = stepsOf(q);
  const hint = text(q?.hint);
  const explanation = text((q?.solution as Record<string, unknown>)?.explanation) || text(q?.explanation);

  // ---- 1. a graded answer outranks everything -----------------------
  // The student typed something and it was checked. Whatever they also asked,
  // the useful thing to say is about their answer.
  if (input.checkAnswerResult && input.checkAnswerResult.isCorrect === false) {
    const note =
      typeof input.selectedAnswer === 'number'
        ? text(list(q?.distractorNotes)[input.selectedAnswer])
        : '';
    if (note) {
      return served('mistake_feedback', note, ['distractorNotes'], 0.95);
    }
    const coached = coachMistake(input.checkAnswerResult.diagnosis);
    // The neutral wording is honest but adds nothing a model could not say
    // better with the student's working. Only the DETECTED kinds are served.
    if (coached.detected) {
      return served('mistake_feedback', coached.message, ['checkAnswer'], 0.9);
    }
    return unhandled('no_local_content');
  }

  if (!intent) return unhandled(q ? 'unknown_intent' : 'missing_question_context');
  if (!q) return unhandled('missing_question_context');

  // ---- 2. the exercise intents — grounded or nothing ----------------
  //
  // These three are about THIS question. A Topic Card here would be a general
  // answer to a specific ask, so the card layer is not even consulted.
  if (intent === 'next_step' || intent === 'what_to_do_here') {
    if (moves.length === 0) {
      // No steps, but a written hint is still this question's own content and
      // is the right rung for "what do I do here".
      if (hint) return served('hint', hint, ['hint'], 0.8);
      return unhandled('no_local_content');
    }
    const at = typeof input.activeStep === 'number' ? input.activeStep : -1;
    const next = moves[at + 1] ?? moves[0];
    // ⚠️ A "next step" that contains the final answer is not a step, it is the
    // end of the exercise handed over early. Screened with the same predicate
    // the content gate uses on authored hints.
    if (finalAnswer && leaksAnswer(next, finalAnswer)) {
      return hint ? served('hint', hint, ['hint'], 0.75) : unhandled('no_local_content');
    }
    return served(
      'next_step',
      `הצעד הבא הוא זה:\n\n${next}\n\nתעשה אותו ותכתוב לי מה יצא.`,
      ['solution.steps'],
      0.85,
    );
  }

  if (intent === 'why_this_step') {
    // Only the authored rule line can answer this. It names the formula and
    // the trigger in the question's own wording, which is what "why" means
    // here. Without it the honest answer is prose, and prose is the model's.
    if (!rule) return unhandled('no_local_content');
    return served(
      'why_step',
      `${rule}\n\nזאת הסיבה שהצעד הזה נראה כך. תגיד לי איזה נתון בשאלה הפעיל את הכלל.`,
      ['solution.rule'],
      0.85,
    );
  }

  // ---- 3. which formula — from the question, then the sub-topic -----
  if (intent === 'which_formula') {
    if (rule) return served('formula', rule, ['solution.rule'], 0.9);
    const fs = (input.formulas ?? []).filter((f) => f.name || f.latex);
    if (fs.length) {
      const body = fs
        .map((f) => `- **${f.name ?? ''}** $${f.latex ?? ''}$${f.note ? ` ${f.note}` : ''}`)
        .join('\n');
      return served(
        'formula',
        `אלה הכלים של המודול הזה:\n\n${body}\n\nאיזה מהם מתאים לנתונים שבשאלה שלפניך?`,
        ['formulas'],
        0.8,
      );
    }
    return unhandled('no_local_content');
  }

  // ---- 4. the topic intents — a card, or nothing --------------------
  if (cardCanAnswer(intent)) {
    const topic = input.topic ?? '';
    const hit = topic ? await matchTopicCard(input.message ?? '', topic, intent) : null;
    if (hit) {
      return served('topic_card', renderTopicCard(hit.card), ['topic_card'], hit.score);
    }
    // A card did not match. The question's own explanation is still grounded
    // and still better than a model call, for the two intents it fits.
    if ((intent === 'explain' || intent === 'didnt_understand') && explanation) {
      return served('hint', explanation, ['explanation'], 0.7);
    }
    if (intent === 'didnt_understand' && hint) return served('hint', hint, ['hint'], 0.75);
    return unhandled('no_local_content');
  }

  // ---- 5. everything else is genuinely the model's ------------------
  // give_example and how_to_compute among them: a second example does not
  // exist in the content, and inventing one is what a model is for.
  return unhandled('unsupported_phrase');
}

export type { MistakeKind };
