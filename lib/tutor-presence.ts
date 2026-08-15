/**
 * tutor-presence.ts — what the student is looking at, right now.
 *
 * ============================================================
 * THIS IS THE DIFFERENCE BETWEEN "צמוד" AND "A SMALLER CHAT BOX"
 * ============================================================
 * A tutor bubble that follows the student across pages but has no idea what is
 * on the screen is just /chat in a corner: the student still has to re-type the
 * question, and the tutor still opens with "במה אוכל לעזור?". The whole point of
 * a tutor sitting beside you is that when you say "אני תקוע" they can already
 * see the page.
 *
 * So pages publish what they are showing, and the bubble reads it.
 *
 * IMPLEMENTATION: a module-level variable plus a window CustomEvent — not a
 * React context, not a store. Reasons, in order:
 *   - The producers (a question card) and the consumer (a bubble mounted in
 *     the root layout) are on opposite sides of the tree. A context provider
 *     would have to wrap the entire app to join them.
 *   - The codebase already signals cross-component this way
 *     (`bagrut-state-synced` in lib/sync/roadmap-sync).
 *   - Focus is not render state for the producer. A page that publishes its
 *     question does not want to re-render when the bubble opens.
 *
 * Pages that publish nothing are not broken — the bubble falls back to the
 * route name, which is still better than nothing.
 *
 * ⚠️ ONE PUBLISHER PER SCREEN. There is a single slot, so two mounted
 * components that both publish will fight: the last to mount wins, and the
 * FIRST to unmount clears the focus for both. A bagrut question renders all of
 * its parts at once, which is exactly this trap — so it publishes from the
 * container (StaticBagrutExerciseView) with the whole question, never from
 * QuestionPartCard. Publish from whatever owns the screen, not from the repeated
 * child.
 */

import type { PracticeQuestion, SubTopic } from '@/content/lessons/types';
import type { AnswerDiagnosis } from '@/lib/answer-check';

const EVENT = 'tutor-focus';

export type TutorFocus = {
  /** Hebrew, human-readable: what the student is doing. "תרגול · דה-מואבר" */
  where: string;
  topic?: string;
  subTopicId?: string;
  /** The question currently on screen, verbatim. */
  questionText?: string;
  /** Filled only after a wrong answer — the strongest possible opening. */
  wrongAnswer?: string;
  /** The correct answer, when the page already revealed it. */
  correctAnswer?: string;

  // ---- the authored content behind the screen -----------------------------
  // Carried so lib/tutor-local can answer the common questions from material
  // that is already written and verified, at $0, instead of paying an API call
  // to re-derive a hint that is sitting in the question object.
  /** The question OBJECT, not just its text: hint, solution, distractorNotes. */
  question?: PracticeQuestion;
  /** The sub-topic, for its formulas and "must remember" points. */
  subTopic?: SubTopic;
  /** ORIGINAL (unshuffled) index of the option the student picked and got
   *  wrong — the key into `question.distractorNotes`, where every distractor
   *  already has an authored explanation of the misconception behind it. */
  chosenIndex?: number;
  /**
   * For a TYPED answer: the shape of the mistake, when it has one.
   *
   * The open-question counterpart of `chosenIndex`. An MCQ hands the tutor a
   * distractor with an authored note; a typed answer used to hand it nothing,
   * so "why is my answer wrong" on an open question could only ever be
   * answered by paying for a model to guess. `lib/answer-check` already
   * compares both sides — this carries the comparison through instead of
   * discarding it. Absent when the answer is wrong in no recognisable way,
   * which is the honest outcome.
   */
  answerDiagnosis?: AnswerDiagnosis;
};

let current: TutorFocus | null = null;

/**
 * Publish what this screen is showing. Call it when the question changes and
 * call it with `null` on unmount — a stale focus is worse than none, because
 * the tutor will confidently discuss a question the student already left.
 */
export function setTutorFocus(focus: TutorFocus | null) {
  current = focus;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function getTutorFocus(): TutorFocus | null {
  return current;
}

export function subscribeTutorFocus(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/**
 * The Hebrew brief sent to the tutor as this turn's context.
 *
 * Returns '' when there is nothing worth saying, so the caller can omit the
 * context entirely rather than send a heading with nothing under it.
 *
 * ⚠️ Kept short on purpose. The server hard-caps `context` at 2000 chars and
 * the student snapshot alone can reach 1800, so anything verbose here silently
 * pushes the cognitive diagnosis out of the request.
 */
export function renderFocusContext(focus: TutorFocus | null): string {
  if (!focus) return '';
  const lines = [`התלמיד נמצא עכשיו ב: ${focus.where}.`];
  if (focus.questionText) {
    lines.push(`השאלה שמוצגת לו על המסך:\n${focus.questionText.slice(0, 600)}`);
  }
  if (focus.wrongAnswer) {
    lines.push(`הוא ענה "${focus.wrongAnswer.slice(0, 80)}" וזה שגוי.`);
    if (focus.correctAnswer) lines.push(`התשובה הנכונה: "${focus.correctAnswer.slice(0, 80)}".`);
    lines.push('אל תיתן לו את הפתרון — שאל שאלה אחת שתראה לו איפה זה נשבר.');
  }
  return lines.join('\n');
}

/**
 * The opening lines the bubble offers, derived from the focus alone.
 *
 * Built from templates, so a student who opens the bubble mid-question gets a
 * one-tap way in that already refers to what is on his screen — at $0 and with
 * no possibility of describing a question that isn't there.
 */
export function focusPrompts(focus: TutorFocus | null): string[] {
  if (!focus) return [];
  if (focus.wrongAnswer) {
    return ['למה התשובה שלי שגויה?', 'תן לי רמז בלי לפתור', 'תסביר לי את השאלה הזאת מההתחלה'];
  }
  if (focus.questionText) {
    return ['אני תקוע בשאלה הזאת', 'מאיפה מתחילים?', 'תן לי רמז בלי לפתור'];
  }
  if (focus.topic) return [`תסביר לי את ${focus.topic}`, 'מה הכי חשוב לדעת פה לבגרות?'];
  return [];
}
