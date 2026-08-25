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
 *
 * ⚠️ …UNTIL THE STUDENT TOUCHES ONE PART. Then it is no longer a guess: the
 * part they typed into, asked a hint on, or checked IS the question. That
 * card publishes itself at question level with the full authored object
 * (`partAsQuestion` below), and among equal priorities the most recently
 * published entry wins — so the tutor follows the student's hands from סעיף א
 * to סעיף ב without the container having to know. MEASURED before this: every
 * one of the 120 bagrut parts in סדרות + הסתברות sat in state I, and every ask
 * on them fell through to a paid API call despite hints, a rule line and a
 * worked solution being authored for all of them.
 */

import type { BagrutQuestionPart, PracticeQuestion, SubTopic } from '@/content/lessons/types';
import type { AnswerDiagnosis } from '@/lib/answer-check';
import { stripFigureFences } from '@/lib/geo-figure';

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
  /**
   * Other questions from the same list, for "תן תרגיל דוגמה".
   *
   * ⚠️ ONLY id, question and hint — never the answers or the explanation. The
   * tutor offers a sibling to TRY; a sibling whose answer travels with it is a
   * second solution handed over, which is what the whole ladder exists to
   * avoid. Lesson screens already have `subTopic.questions`; /quiz has no
   * sub-topic at all, which is why this field exists.
   */
  siblings?: Array<{ id?: string; question?: string; hint?: string }>;
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
    // `>=`, not `>`: among EQUAL priorities the most recently published entry
    // wins (publish re-inserts at the end of the Map). Two question cards on
    // one screen — the parts of a bagrut question — must resolve to the one
    // the student touched last, not to whichever mounted first.
    if (!best || entry.priority >= best.priority) best = entry;
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
  if (focus) {
    // Delete first so a re-publish moves to the END of the Map — that is what
    // makes "most recently published wins" true in `recompute`.
    registry.delete(id);
    registry.set(id, { focus, priority });
  } else {
    registry.delete(id);
  }
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

/**
 * A bagrut PART, seen as a question the local tutor can hold.
 *
 * `BagrutQuestionPart` and `PracticeQuestion` carry the same material under
 * different names (`final_answer` / `finalAnswer`, `hints[]` / `hint`) because
 * the part shape was frozen to match an API response years before the local
 * tutor existed. Rather than teach lib/tutor-local and lib/help-ladder a second
 * shape — every template and every gate would need a twin — this maps a part
 * onto the shape they already understand. Nothing is invented: every field
 * below is authored content, moved.
 *
 * `hintsShown` — the card reveals hints one at a time, so the hint the tutor
 * should offer is the NEXT unseen one. Once all are seen, `hint` is undefined
 * and the help ladder steps past it to the rule line (`**הכלל:**` is
 * `steps[0]` on 100% of סדרות/הסתברות parts, and the rule-line gate guarantees
 * it never leaks the answer) — so "I saw every hint and I'm still stuck" gets
 * the authored first step, not a paid call.
 *
 * `explanation` — parts have none. The rule line minus its marker IS the
 * explanation of why these steps ("the formula — and why it applies here"),
 * so it fills that slot rather than leaving "explain this to me" on the
 * template's generic fallback.
 */
export function partAsQuestion(
  part: BagrutQuestionPart,
  args: {
    questionId: string;
    difficulty?: PracticeQuestion['difficulty'];
    hintsShown?: number;
  },
): PracticeQuestion {
  const shown = Math.max(0, args.hintsShown ?? 0);
  const rule = part.solution.steps.find((s) => s.startsWith('**הכלל:**'));
  return {
    // Same `<questionId>/<label>` id the rule-line gate reports under, so a
    // failure in either tool names the same place.
    id: `${args.questionId}/${part.label}`,
    difficulty: args.difficulty ?? 'mid',
    kind: 'open',
    question: part.prompt,
    hint: part.hints[shown]?.trim() || undefined,
    expected: part.expected,
    answerLabels: part.answerLabels,
    solution: {
      steps: part.solution.steps,
      finalAnswer: part.solution.final_answer,
      explanation: rule ? rule.replace(/^\*\*הכלל:\*\*\s*/, '').trim() : '',
    },
  };
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
 * ⚠️ Kept short on purpose. The server hard-caps `context` at 4000 chars
 * (MAX_CONTEXT_LEN) and the student snapshot alone can reach 1800, so anything
 * verbose here silently pushes the cognitive diagnosis out of the request. The
 * authored-solution block below is capped at 1200 for the same reason: focus
 * (~800) + solution (≤1200) + snapshot (≤1800) must fit.
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

  // The authored solution, for the MODEL's eyes only. A free-form ask reaches
  // the model precisely when the local tutor abstained — the hard cases — and
  // until now the model re-solved the question from scratch there, which can
  // disagree with the verified steps in front of the student. With the steps
  // in hand it guides along the written path instead. ~1,200 chars is ~500
  // Haiku input tokens: under $0.001 per turn for the accuracy it buys.
  const steps = focus.question?.solution.steps ?? [];
  if (steps.length > 0) {
    // Figure fences (a JSON sketch) would eat most of the budget — the model gets a marker instead.
    const body = steps.map((s, i) => `${i + 1}. ${stripFigureFences(s)}`).join('\n').slice(0, 1200);
    lines.push(
      'הפתרון הכתוב והמאומת — בשבילך בלבד, לא לתלמיד. הנחה לפיו ואל תסטה ממנו. ' +
        'אל תחשוף צעד שהתלמיד עוד לא הגיע אליו, ואל תצטט את התשובה הסופית:\n' +
        body,
    );
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
