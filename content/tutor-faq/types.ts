/**
 * tutor-faq/types.ts — the per-question bank of "what students ask about THIS
 * solution", served by the tutor at $0.
 *
 * WHY A BANK AND NOT A MODEL
 * --------------------------
 * lib/tutor-local answers the six recurring asks (hint, first step, why wrong,
 * full solution, formulas, key points) from authored fields. Everything else a
 * student types used to go straight to a paid model call — and most of that
 * "everything else" is not novel at all: on a given solution, students ask the
 * same eight or ten things in different words. "למה מכפילים", "למה זה כפל",
 * "מאיפה הכפל הזה", "למה לא חיברנו" are one question. So each solution carries
 * its questions, each question carries its paraphrases, and lib/tutor-faq
 * matches a typed message against them lexically. The model is the exception,
 * and every miss is logged so the next authoring pass is driven by real asks.
 *
 * AUTHORING CONTRACT (enforced by scripts/merge-tutor-faq.ts)
 * ---------------------------------------------------------
 *   - `alts` has at least 5 genuinely different phrasings — different verbs,
 *     different word order, with and without "למה/איך", teen register. The
 *     last 2 are HELD OUT by scripts/test-tutor-faq.ts as a blind recall test,
 *     so padding with near-duplicates inflates nothing and fails the gate.
 *   - `a` is the tutor speaking: Hebrew outside `$…$`, no Hebrew inside math,
 *     backslashes doubled in TS source, no maqaf glued to a math island, no
 *     em-dash separators, 1–4 sentences, and it ENDS WITH ONE NEXT MOVE.
 *   - `a` never states the final answer unless `reveals` is true; such entries
 *     are served only after the student has answered or opened the solution.
 *   - `step` is the 0-based index into `solution.steps` the question is about,
 *     when it is about one step. Step 0 is the rule line on every unit here.
 */

export type TutorFaqKind =
  /** "why do we do this step" */
  | 'why-step'
  /** "where does this number / expression come from" */
  | 'where-from'
  /** "why not the other way" — the alternative a student reaches for */
  | 'why-not'
  /** "what if the question said … instead" */
  | 'what-if'
  /** a concept behind the solution ("what does 'without replacement' change") */
  | 'concept'
  /** the common mistake on this unit, and how to see it */
  | 'mistake'
  /** "how do I check my answer" */
  | 'check'
  | 'other';

export type TutorFaq = {
  /** `${unit}#${n}` — unit is the solution's gate id (question id, or `${bagrutId}/${label}`). */
  id: string;
  kind: TutorFaqKind;
  /** 0-based index into solution.steps, when the question is about one step. */
  step?: number;
  /** The canonical student question. */
  q: string;
  /** Alternative phrasings. Indexed together with `q`. */
  alts: string[];
  /** The tutor's answer. Markdown + LaTeX. */
  a: string;
  /** The answer states the final result — serve only after the student answered / revealed. */
  reveals?: boolean;
};

/** Keyed by unit id (the gate's `where`). */
export type TutorFaqBank = Record<string, TutorFaq[]>;
