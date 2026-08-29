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
 *
 * ⚠️ AND NEVER A QUESTION THAT NEEDS A DRAWING.
 *
 * Authored geometry questions carry their sketch as a fenced JSON block
 * (```geo / ```probtree — see lib/geo-figure). The exercise cards render it as
 * a real figure; the chat bubble renders markdown and KaTeX and knows nothing
 * about it. Reported by Itay with a screenshot: asking for an example returned
 *
 *   "":"AC","text":"6"}],"width":240}
 *   **''''
 *
 * — raw coordinates in the student's chat. Two faults at once: the fence was
 * never stripped, and wrapping the whole question in `**...**` for emphasis put
 * a bold marker across a code fence, so the fence never closed either.
 *
 * Stripping the fence is not enough on its own. "במשולש [סרטוט] נתון..." is an
 * exercise nobody can solve without seeing the drawing, so a sibling that needs
 * one is skipped entirely, and if every sibling needs one this returns null and
 * the turn goes to the model. A missing example is a smaller failure than an
 * unsolvable one.
 */

import { stripFigureFences } from '@/lib/geo-figure';

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
    if (NEEDS_A_DRAWING.test(s.question)) continue;
    return s;
  }
  return null;
}

/** A fenced sketch the chat cannot render — see the header. */
const NEEDS_A_DRAWING = /```(?:geo|probtree)/;

/** The message, in the tutor's voice. */
export function renderExample(ex: ExampleCandidate): string {
  // ⚠️ BELT AND BRACES. `pickExample` already skips a question that needs a
  // drawing, but this function is exported and the next caller will not know
  // that. A fence reaching a student is raw JSON on their screen.
  const question = stripFigureFences(ex.question ?? '').trim();
  const hint = stripFigureFences(ex.hint ?? '').trim();
  if (!question) return '';
  return (
    'הנה תרגיל באותו סגנון, שאפשר לתרגל עליו:\n\n' +
    // ⚠️ NO `**...**` AROUND IT. Authored questions are multi-line and carry
    // LaTeX; a bold marker spanning newlines is broken markdown, and spanning a
    // fence it swallows the rest of the message. A blockquote is emphasis that
    // cannot be broken by what is inside it.
    `> ${question.replace(/\n/g, '\n> ')}\n\n` +
    (hint ? `אם תיתקע, הכיוון הוא: ${hint}\n\n` : '') +
    'נסה אותו ותכתוב לי מה יצא לך.'
  );
}
