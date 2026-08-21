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
 * ⚠️ ONE ENTRY PER PUBLISHER, AND SPECIFICITY DECIDES.
 * Publishers are keyed by id, so a drill nested inside a lesson does not fight
 * the lesson — both publish, and `FOCUS_PRIORITY` picks the more specific one.
 * This replaced a single slot where React's effect order (children before
 * parents) silently handed the win to whichever component happened to be the
 * outer one.
 *
 * ⚠️ A SCREEN SHOWING SEVERAL QUESTIONS AT ONCE PUBLISHES AT LESSON LEVEL.
 * A bagrut question renders every part together, and a comprehension check
 * renders its whole set; there is no "the question" on those screens, so
 * naming one would be a guess. They publish the container's context instead
 * (`FOCUS_PRIORITY.lesson`), which is the honest resolution — and the tutor's
 * state-I template says outright that it can see a question but not its
 * breakdown, rather than pretending.
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

/**
 * How specific a publisher's claim is. The most specific wins, regardless of
 * which component happened to mount first.
 *
 * This replaced a single slot that the last writer owned. With one slot the
 * winner was decided by React's effect order — children run before parents —
 * so a drill nested inside a lesson published the question and the lesson then
 * overwrote it with "you are in a lesson". The workaround was to make each
 * parent yield by hand, which is choreography that every new surface has to
 * remember and that the bagrut view had already got wrong.
 *
 * Ordering by specificity removes the coupling: a screen states what it knows
 * and how precisely it knows it, and never has to know what else is mounted.
 */
export const FOCUS_PRIORITY = {
  /** "the student is somewhere in this topic" — a roadmap or plan screen. */
  topic: 10,
  /** "the student is reading this sub-topic" — a lesson, a ladder. */
  lesson: 20,
  /** "this exact question is on the screen right now." */
  question: 30,
} as const;

/** Each publisher owns its own entry, so unmounting one cannot clear another. */
const registry = new Map<string, { focus: TutorFocus; priority: number }>();
let current: TutorFocus | null = null;

function recompute() {
  let best: { focus: TutorFocus; priority: number } | null = null;
  for (const entry of registry.values()) {
    if (!best || entry.priority > best.priority) best = entry;
  }
  current = best?.focus ?? null;
  // Guarded on the METHOD, not on `window`. `typeof window !== 'undefined'` is
  // true in a node harness that stubs only localStorage, and the notify then
  // throws — taking down a test of pure, browser-free logic.
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

/**
 * Publish what this screen is showing.
 *
 * @param id     stable per publisher — the same component always uses the same
 *               id, so re-publishing replaces rather than accumulates.
 * @param focus  null to withdraw. ALWAYS withdraw on unmount: a stale focus is
 *               worse than none, because the tutor will confidently discuss a
 *               question the student has already left.
 * @param priority how specific this claim is. Defaults to `question`, since a
 *               caller that does not think about it is nearly always a question
 *               card.
 */
export function publishTutorFocus(
  id: string,
  focus: TutorFocus | null,
  priority: number = FOCUS_PRIORITY.question,
) {
  if (focus) registry.set(id, { focus, priority });
  else registry.delete(id);
  recompute();
}

/**
 * Bind an id and a priority once, and get back the one-argument publisher a
 * component actually wants.
 *
 * This exists so a screen declares WHO it is exactly once, at the top of the
 * file, instead of repeating an id at every call site — where the copy that
 * gets forgotten is the one that makes two screens share an entry and clobber
 * each other, which is precisely the failure the registry was built to end.
 *
 *   const setTutorFocus = focusPublisher('question-runner');
 *   setTutorFocus({ ... });          // unchanged at every call site
 *   setTutorFocus(null);             // withdraws only THIS publisher
 */
export function focusPublisher(
  id: string,
  priority: number = FOCUS_PRIORITY.question,
) {
  return (focus: TutorFocus | null) => publishTutorFocus(id, focus, priority);
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
    return ['למה התשובה שלי שגויה?', 'באיזו נוסחה משתמשים כאן?', 'תן לי רמז בלי לפתור', 'תסביר לי את השאלה הזאת מההתחלה'];
  }
  if (focus.questionText) {
    return ['אני תקוע בשאלה הזאת', 'מאיפה מתחילים?', 'באיזו נוסחה משתמשים כאן?', 'תן לי רמז בלי לפתור'];
  }
  if (focus.topic) return [`תסביר לי את ${focus.topic}`, 'מה הכי חשוב לדעת פה לבגרות?'];
  return [];
}
