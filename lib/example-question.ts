/**
 * example-question.ts — "תן תרגיל דוגמה", answered from the bank the student
 * is already inside.
 *
 * ============================================================
 * WHY THIS IS FREE AND WHY IT WAS NOT BEING DONE
 * ============================================================
 * The app holds thousands of authored questions, and the screen the student is
 * on is showing one out of a list. A request for a worked example was going to
 * the model — which invents one — while a real, verified, level-matched
 * exercise was already in memory a few array slots away.
 *
 * `measure-quiz-gap` put a number on it: "תן תרגיל דוגמה" failed on all 574
 * quiz questions. Failing everywhere is the signature of a missing capability,
 * not of missing content.
 *
 * ============================================================
 * WHAT IS DELIBERATELY NOT INCLUDED
 * ============================================================
 * The sibling's ANSWER. An example the student can read the answer to is not
 * an exercise, it is a second worked solution — and the whole ladder in this
 * app exists to avoid handing those over early. They get the question and its
 * hint, and are asked to try it.
 *
 * The sibling is also never the question on screen. Offering somebody the
 * exercise they are already stuck on, relabelled as an example, is worse than
 * saying nothing.
 */

export type ExampleCandidate = {
  id?: string;
  question?: string;
  hint?: string;
};

/**
 * Pick a sibling to offer, or null.
 *
 * Deterministic: the FIRST usable sibling that is not the current question, so
 * the same student asking twice gets the same example rather than a shuffle
 * that makes the tutor look like it is guessing.
 */
export function pickExample(
  siblings: readonly ExampleCandidate[] | undefined,
  currentId: string | undefined,
): ExampleCandidate | null {
  if (!siblings?.length) return null;
  for (const s of siblings) {
    if (!s?.question || s.question.trim().length < 12) continue;
    if (currentId && s.id === currentId) continue;
    return s;
  }
  return null;
}

/** The message, in the tutor's voice. */
export function renderExample(ex: ExampleCandidate): string {
  const hint = ex.hint?.trim();
  return (
    'הנה תרגיל באותו סגנון, שאפשר לתרגל עליו:\n\n' +
    `**${ex.question?.trim()}**\n\n` +
    (hint ? `אם תיתקע, הכיוון הוא: ${hint}\n\n` : '') +
    'נסה אותו ותכתוב לי מה יצא לך.'
  );
}
