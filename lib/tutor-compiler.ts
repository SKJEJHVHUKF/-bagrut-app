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

import { canonicalIntent as classifyIntent, stepIntroducing, explanationFor, type CanonicalIntent } from '@/lib/tutor-intent';
import { matchTopicCard, renderTopicCard, cardCanAnswer } from '@/lib/topic-cards';
import { coachMistake, type MistakeKind } from '@/lib/error-coach';
import { leaksAnswer } from '@/lib/help-ladder';
import { pickExample, renderExample } from '@/lib/example-question';
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
  | 'topic_card'
  /** Another authored question from the same list, offered to practise on. */
  | 'sibling-question';

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
  /**
   * Other questions from the same list, for "תן תרגיל דוגמה". Id, text and
   * hint only — never the answers; see lib/example-question.
   */
  siblings?: Array<{ id?: string; question?: string; hint?: string }>;
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

/**
 * Below this a rule matched but is not sure enough to answer with. Same line
 * `decideFallbackReason` uses for `low_confidence`; they must not drift apart.
 */
export const MIN_CONFIDENCE = 0.75;

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
  const q = input.activeQuestion ?? null;

  // ⚠️ The question's own words are passed to the classifier, and that is what
  // makes the wider phrase rules safe. Without them any maths noun vetoes;
  // with them only a noun THIS question does not mention does. "מה עושים עם
  // ההסתברות הזאת" on a probability question names nothing foreign; the same
  // sentence about vectors does.
  const ownWords = q
    ? `${String(q.question ?? '')} ${list((q.solution as Record<string, unknown>)?.steps).join(' ')} ${input.topic ?? ''}`
    : (input.topic ?? '');
  // ⚠️ THE RULE'S OWN CONFIDENCE IS A GATE, NOT DECORATION.
  //
  // It was carried around and ignored until the catch-all "למה" rule was added.
  // That rule exists because "למה" opens 4,877 of the phrasings nothing
  // recognised — but it matches "למה אתה כל כך איטי" as readily as "למה
  // מציבים כאן", and serving this question's explanation for the first one is
  // a confident answer to something nobody asked.
  //
  // So it sits at 0.7 and anything below MIN_CONFIDENCE is LABELLED but never
  // SERVED: the trace gets an accurate name for the shape, the answer library
  // knows what it is, and the student still gets the model. 0.75 is not a new
  // number — `decideFallbackReason` already treats that line as the border
  // between `low_confidence` and a real answer, and the two disagreeing was
  // itself the bug.
  const classified =
    input.canonicalIntent !== undefined
      ? { intent: input.canonicalIntent, confidence: 1 }
      : classifyIntent(input.message ?? '', ownWords || undefined);
  const intent = classified.confidence >= MIN_CONFIDENCE ? classified.intent : null;
  const { rule, moves, finalAnswer } = stepsOf(q);
  const hint = text(q?.hint);
  // Reads BOTH content shapes — a lesson's explanation string and a /quiz
  // question's four-field object. See explanationFor: the object form was
  // invisible to every reader here, which is why fifteen phrasings failed on
  // all 574 quiz questions at once.
  const explanation = explanationFor(q, intent);

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

  // ---- 2. topic cards need only the TOPIC ---------------------------
  //
  // ⚠️ THIS RUNS BEFORE THE `!q` GUARD, and it must.
  //
  // A concept question is about the subject, not about an exercise: "מה זה
  // בלי החזרה" is answerable while reading a lesson, with nothing on screen to
  // ground in. The first version demanded an active question first, which
  // blocked exactly the screen where cards are most useful — a student on
  // /roadmap/<lesson>, where SubTopicLadder publishes a focus with `where` and
  // no question object at all.
  //
  // Reported from a real session: the tutor still called the model on that
  // page, and the reason was this ordering rather than anything about the
  // cards. The census could not see it because it sampled QUESTIONS, and this
  // screen has none.
  if (cardCanAnswer(intent)) {
    const topic = input.topic ?? '';
    const hit = topic ? await matchTopicCard(input.message ?? '', topic, intent) : null;
    if (hit) {
      return served('topic_card', renderTopicCard(hit.card), ['topic_card'], hit.score);
    }
    // No card. The question's own explanation is still grounded and still
    // better than a model call — when there IS a question.
    // ⚠️ `how_it_works` BELONGS HERE. `concept` DOES NOT, AND THE TEST SUITE
    // CAUGHT ME ADDING IT.
    //
    // "איך זה עובד" points at the thing on the screen, so this question's
    // written explanation is the right answer. "מה זה בכלל נגזרת" points at a
    // subject of the student's own choosing — `concept` is the one intent
    // allowed to name its own — and answering THAT with this question's
    // explanation is a fluent answer to something nobody asked. There is an
    // assertion for it ("a concept question with no card stays with the
    // model") and it went red the moment I widened the condition.
    //
    // The cost is real: "מה הכוונה אינדקס" on /quiz goes back to the model
    // until a Topic Card exists for it. That is the honest outcome.
    if (
      q &&
      (intent === 'explain' || intent === 'didnt_understand' || intent === 'how_it_works') &&
      explanation
    ) {
      return served('hint', explanation, ['explanation'], 0.7);
    }
    if (q && intent === 'didnt_understand' && hint) return served('hint', hint, ['hint'], 0.75);
    return unhandled(q ? 'no_local_content' : 'missing_question_context');
  }

  if (!q) return unhandled('missing_question_context');

  // ---- 2. the exercise intents — grounded or nothing ----------------
  //
  // These three are about THIS question. A Topic Card here would be a general
  // answer to a specific ask, so the card layer is not even consulted.
  // ---- "מאיפה ה-19?" — the step that introduces it ------------------
  //
  // The single most common question shape in this app (5,323 phrasings in the
  // bank) and it has a written answer sitting in the solution: whichever step
  // first produces the number. Digits only, and the step that accounts for the
  // most of them — see stepIntroducing.
  if (intent === 'where_from') {
    const from = stepIntroducing(moves, input.message);
    if (from) {
      return served(
        'why_step',
        `זה מגיע מהצעד הזה:

${from}`,
        ['solution.steps'],
        0.85,
      );
    }
    // The number asked about is not in any step — often because the student
    // typed a number of their own. Saying nothing is the honest outcome.
    return unhandled('no_local_content');
  }

  // ---- "איך יודעים שזה נכון?" ---------------------------------------
  //
  // The last step is where a written solution closes its argument. Only when
  // there is more than one step: on a single-step solution the "last" step is
  // the whole answer, and handing that over is not a verification method.
  if (intent === 'check') {
    // No steps at all (/quiz): `explanation.remember` is the written "what to
    // hold on to", which is the closest honest answer to "how do I know".
    if (moves.length === 0) {
      const remember = explanationFor(q, 'check');
      if (remember) return served('why_step', remember, ['explanation'], 0.75);
      return unhandled('no_local_content');
    }
    if (moves.length > 1) {
      const last = moves[moves.length - 1];
      if (!(finalAnswer && leaksAnswer(last, finalAnswer))) {
        return served('why_step', `ככה בודקים:

${last}`, ['solution.steps'], 0.8);
      }
    }
    return unhandled('no_local_content');
  }

  // ---- "למה לא הפוך?" / "מה אם היו ארבעה?" --------------------------
  //
  // ⚠️ DELIBERATELY UNANSWERED. Both are about a road the solution did not
  // take, and nothing in the question object describes roads not taken. The
  // FAQ bank has entries written for exactly these — it answers them before
  // this layer is reached — and when it has none, the model is the truthful
  // outcome. Serving the explanation here would answer a different question
  // fluently, which is the failure this whole file exists to avoid.
  // ---- "מה המלכודת פה?" / "איפה טועים?" ------------------------------
  //
  // `why_wrong` is handled at the top ONLY when a graded attempt exists. Asked
  // cold — which is how "מה המלכודת" and "איפה טועים בדרך כלל" arrive — it fell
  // through to the model, while `explanation.why_wrong` on every /quiz question
  // is written to answer precisely that.
  if (intent === 'why_wrong') {
    const trap = explanationFor(q, 'why_wrong');
    if (trap) return served('mistake_feedback', trap, ['explanation'], 0.8);
    return unhandled('no_local_content');
  }

  // ---- "למה לא הפוך?" ------------------------------------------------
  //
  // Still ungrounded on a question with a written solution: nothing there
  // describes a road not taken. But a /quiz question's `why_wrong` is exactly
  // "why the other options fail", which IS that road.
  if (intent === 'why_not') {
    const why = explanationFor(q, 'why_not');
    if (why) return served('why_step', why, ['explanation'], 0.75);
    return unhandled('no_local_content');
  }

  if (intent === 'what_if') return unhandled('no_local_content');

  if (intent === 'next_step' || intent === 'what_to_do_here' || intent === 'how_to_solve') {
    if (moves.length === 0) {
      // No steps at all (/quiz). The hint is the right rung when it exists; the
      // written explanation is the honest second choice for "how do I go about
      // this", and it is authored, not invented.
      if (!hint && explanation) return served('hint', explanation, ['explanation'], 0.75);
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
    if (!rule) {
      // No authored rule line. A /quiz question never has one — it has no
      // solution at all — but it does carry `explanation.why_correct`, which
      // is a written answer to "why is it done this way" and is not prose we
      // invented.
      if (explanation) return served('why_step', explanation, ['explanation'], 0.8);
      return unhandled('no_local_content');
    }
    return served(
      'why_step',
      `${rule}\n\nזאת הסיבה שהצעד הזה נראה כך. תגיד לי איזה נתון בשאלה הפעיל את הכלל.`,
      ['solution.rule'],
      0.85,
    );
  }

  // ---- "תן תרגיל דוגמה" — a real sibling, not an invented one -------
  //
  // The screen is showing one question out of a list; the rest are authored,
  // verified and level-matched. Paying a model to invent an example while a
  // real one sits in memory is the least defensible call left in the app.
  //
  // The sibling's ANSWER never travels — `siblings` carries id, text and hint
  // and nothing else. An example whose answer comes with it is a second worked
  // solution, which is what the ladder exists to prevent.
  if (intent === 'give_example') {
    const ex = pickExample(input.siblings, typeof q?.id === 'string' ? q.id : undefined);
    if (ex) return served('hint', renderExample(ex), ['sibling-question'], 0.85);
    return unhandled('no_local_content');
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

  // ---- everything else is genuinely the model's ---------------------
  // give_example and how_to_compute among them: a second example does not
  // exist in the content, and inventing one is what a model is for.
  return unhandled('unsupported_phrase');
}

export type { MistakeKind };
