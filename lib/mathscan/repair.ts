/**
 * repair.ts — turning a rejected read into one tap instead of a dead end.
 *
 * ============================================================
 * THE PROBLEM THIS SOLVES
 * ============================================================
 * The pipeline is right to refuse: `solveFromTranscription` will not solve a
 * transcription the validator rejected, because answering a misread question
 * confidently is the worst thing this screen can do. A student who photographs
 * `x² − 5x + 6 = 0`, has the `²` read as `°`, and is told the answer is
 * `x = 6/5` has been actively misled.
 *
 * But a refusal on its own is still a dead end. The only thing that helps is
 * "נסח מחדש" — retyping the question — which is exactly what a student who
 * just photographed it to avoid typing will not do.
 *
 * The observation: for the failures that actually happen, WE ALREADY KNOW WHAT
 * WENT WRONG. `validate.ts` detects `x°` and says so in Hebrew. It just says it
 * as a warning instead of offering the correction. This module turns that same
 * detection into a concrete proposed text, so the student taps once instead of
 * retyping an equation.
 *
 * ============================================================
 * THE RULE
 * ============================================================
 * Only repairs that are UNAMBIGUOUS in mathematics, never a guess.
 * `x°` is not a thing — a degree sign cannot follow a variable — so reading it
 * as an exponent is a correction, not a gamble. Anything that could legitimately
 * be what it says is left alone and the student edits it manually.
 *
 * And the repaired text is a PROPOSAL, shown to the student before it is
 * solved. It never silently replaces what was read: swapping a student's
 * question for a different one and answering that is the same failure as
 * answering the misread, one step later.
 *
 * $0. Pure string work, no API, no model.
 */

export type Repair = {
  /** The corrected transcription, ready to re-run through the pipeline. */
  text: string;
  /** Hebrew, shown on the button: what we think happened. */
  label: string;
  /** Hebrew, one line: why we think so. */
  reason: string;
};

/** How many characters may change before this stops being a "correction". */
const MAX_EDIT_RATIO = 0.25;

/**
 * Propose a corrected transcription, or null when we have nothing honest to
 * offer.
 *
 * Deliberately conservative: it is better to show no button than to propose a
 * question the student never asked. Every rule below is a case where the
 * ORIGINAL text is mathematically impossible, so the change cannot be wrong in
 * the sense that matters — at worst it is still unreadable, and the student
 * edits by hand exactly as before.
 */
export function proposeRepair(normalized: string): Repair | null {
  const src = normalized ?? '';
  if (!src.trim()) return null;

  // ---- misread exponent: `x°` / `x )°` --------------------------------
  // A degree sign is only meaningful after a NUMBER (`60°`). After a variable
  // or a closing bracket it is Tesseract's rendering of a raised digit, and
  // the consequence is not cosmetic: it silently lowers the degree of the
  // polynomial, so we solve a different equation and get a confident wrong
  // answer. Squared is the overwhelmingly common case in bagrut algebra.
  if (/[a-zA-Z)\]]\s*°/.test(src)) {
    const text = src.replace(/([a-zA-Z)\]])\s*°/g, '$1^2');
    if (withinEditBudget(src, text)) {
      return {
        text,
        label: 'תקן ל-²',
        reason: 'סימן מעלות אחרי משתנה הוא כמעט תמיד חזקה שלא נקראה — סביר שזה בריבוע.',
      };
    }
  }

  // ---- misread exponent as a superscript digit glued on ---------------
  // `x2 - 5x + 6` where the 2 was raised in the original. Only when the digit
  // sits between a variable and a NON-digit, so `x2y` and coordinates like
  // `A(x1, y1)` are untouched — those are legitimate subscripted names.
  // Kept separate from the `°` rule because it is weaker evidence: we require
  // the rest of the line to already look like a polynomial equation.
  if (/=/.test(src) && /[a-zA-Z]\d(?![\d.,)])/.test(src) && !/\^/.test(src)) {
    const text = src.replace(/([a-zA-Z])(\d)(?![\d.,)])/g, '$1^$2');
    if (withinEditBudget(src, text)) {
      return {
        text,
        label: 'תקן לחזקות',
        reason: 'ספרה צמודה למשתנה אחרי משוואה היא בדרך כלל חזקה שנקראה בשורה אחת.',
      };
    }
  }

  return null;
}

/**
 * Guard against a "repair" that rewrites the question.
 *
 * A rule that fires on half the characters is not correcting a misread, it is
 * inventing a different problem — and a proposal the student accepts by reflex
 * is indistinguishable from the silent substitution this module exists to
 * avoid.
 */
function withinEditBudget(before: string, after: string): boolean {
  if (after === before) return false;
  // Edit DISTANCE, not a positional diff.
  //
  // The first version of this compared character-by-character by index, and it
  // rejected the one repair the module exists for: `x°…` → `x^2…` inserts a
  // character, so every position after the first shifts and ~100% of them
  // "differ". Measured that way the correct fix looked like a rewrite of the
  // whole question. Levenshtein scores it as 2 edits out of 15 characters,
  // which is what it actually is.
  const dist = levenshtein(before.slice(0, MAX_COMPARE), after.slice(0, MAX_COMPARE));
  return dist / Math.max(1, before.length) <= MAX_EDIT_RATIO;
}

/** Bound the O(n·m) below. Transcriptions this long are not single equations
 *  we would repair anyway. */
const MAX_COMPARE = 400;

function levenshtein(a: string, b: string): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr.slice();
  }
  return prev[b.length];
}
