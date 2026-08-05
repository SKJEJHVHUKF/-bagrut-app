/**
 * help-ladder.ts — "למד אותי": three graded rungs of help on every question.
 *
 * The app had two: a hint, and the full worked solution. The gap between them
 * is where students actually live — "I have no idea where to start" is not the
 * same request as "show me everything", and answering the first with the second
 * ends the thinking. This module derives a real middle rung.
 *
 * NOTHING here is new authored content. Every rung is assembled from fields the
 * question and its sub-topic already carry, so all ~829 questions gain the
 * ladder at once and at zero cost:
 *
 *   1 · רמז          `question.hint`             (~598 authored hints)
 *   2 · הצעד הראשון  `solution.steps[0]`         — how to START, not how it ends
 *   3 · הסבר מלא     the whole solution + `explanation` = "why we do this"
 *
 * ⚠️ The trap that shapes rung 2: on a short question `steps[0]` IS the answer.
 * A two-step solution reveals half the work in its first line, and a one-step
 * solution reveals all of it. So rung 2 is only built from the first step when
 * the solution has enough steps left to leave real work behind; otherwise it
 * falls back to the sub-topic's authored "must remember" bullets, which orient
 * without solving. `scripts/verify-help-ladder.ts` prints exactly which
 * questions land on which, and that list is the authoring worklist.
 *
 * Pure — no storage, no React, no clock.
 */

import type { PracticeQuestion, SubTopic } from '@/content/lessons/types';

/** Steps a solution needs before its first line can be shown as a nudge. */
export const MIN_STEPS_FOR_FIRST_STEP = 3;

export type HelpTierLevel = 1 | 2 | 3;

export type HelpTierKind =
  /** The authored one-line nudge. */
  | 'hint'
  /** The opening move of the worked solution. */
  | 'first-step'
  /** The sub-topic's "must remember" bullets — used when the solution is too
   *  short for its first line to be anything other than the answer. */
  | 'key-points'
  /** Everything: steps, final answer, and why it works. */
  | 'full';

export type HelpTier = {
  level: HelpTierLevel;
  kind: HelpTierKind;
  /** Button label. */
  title: string;
  /** What this rung will give, shown BEFORE it is opened, so choosing a rung is
   *  an informed decision rather than a gamble on how much gets spoiled. */
  promise: string;
  /** Markdown + LaTeX paragraphs. Empty for the full tier, which the caller
   *  renders with its own solution layout. */
  body: string[];
  /** How many solution steps the student still has to do themselves. Only set
   *  on `first-step`, and only to say so honestly. */
  stepsLeft?: number;
};

/** Why rung 2 turned out the way it did. Reported by the gate, never shown. */
export type MiddleReason =
  /** The solution's first line is a real nudge. */
  | 'first-step'
  /** The solution is shorter than MIN_STEPS_FOR_FIRST_STEP. */
  | 'too-short'
  /** The first line already contains the final answer — showing it would spoil. */
  | 'would-leak'
  /** No first step available and no keyPoints to fall back on. */
  | 'none';

export type HelpLadder = {
  /** The rungs that exist for this question, in order. Always ends with `full`. */
  tiers: HelpTier[];
  /** True when rung 2 is a real, question-specific nudge rather than the
   *  sub-topic fallback. Reported by the gate, not shown to the student. */
  hasSpecificMiddle: boolean;
  middleReason: MiddleReason;
};

/**
 * Strip presentation so `"$x = \pm 3$"` and `"x=±3"` compare equal, then ask
 * whether the first step already contains the final answer.
 *
 * This runs inside the builder, not only in the gate: a middle rung that
 * promises "how to start" and delivers the answer is worse than no middle rung,
 * because the student deliberately chose the gentler option and got spoiled
 * anyway. Detecting it here means new content cannot introduce the defect —
 * scripts/verify-help-ladder.ts then asserts the invariant rather than hunting
 * for violations, and reports how many questions the guard caught so the
 * underlying content still shows up as a worklist.
 *
 * Deliberately crude, because it feeds a CONTAINMENT test and over-normalising
 * would manufacture false positives. Answers under 4 normalised characters
 * ("2", "0") are skipped — they occur inside ordinary working by chance.
 */
export function normaliseForLeakCheck(s: string): string {
  return s
    .replace(/\$+/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}()[\],.\s]/g, '')
    .replace(/\\/g, '')
    .toLowerCase();
}

export function leaksAnswer(firstStep: string, finalAnswer: string): boolean {
  const answer = normaliseForLeakCheck(finalAnswer ?? '');
  if (answer.length < 4) return false;
  return normaliseForLeakCheck(firstStep ?? '').includes(answer);
}

/**
 * Build the ladder for one question.
 *
 * `subTopic` is optional: a question served outside a sub-topic context (the
 * mixed quiz, the concept bank) simply loses the `key-points` fallback rather
 * than losing the ladder.
 */
export function buildHelpLadder(q: PracticeQuestion, subTopic?: SubTopic | null): HelpLadder {
  const tiers: HelpTier[] = [];

  if (q.hint && q.hint.trim()) {
    tiers.push({
      level: 1,
      kind: 'hint',
      title: 'רמז',
      promise: 'מכוון אותך לכיוון הנכון — בלי לפתור',
      body: [q.hint],
    });
  }

  const steps = q.solution?.steps ?? [];
  const keyPoints = (subTopic?.keyPoints ?? []).filter((k) => k && k.trim());

  const longEnough = steps.length >= MIN_STEPS_FOR_FIRST_STEP;
  const wouldLeak = longEnough && leaksAnswer(steps[0], q.solution?.finalAnswer ?? '');
  let middleReason: MiddleReason = 'none';

  if (longEnough && !wouldLeak) {
    middleReason = 'first-step';
    tiers.push({
      level: 2,
      kind: 'first-step',
      title: 'הצעד הראשון',
      promise: 'מראה איך מתחילים — את ההמשך אתה עושה',
      body: [steps[0]],
      stepsLeft: steps.length - 1,
    });
  } else if (keyPoints.length > 0) {
    middleReason = wouldLeak ? 'would-leak' : 'too-short';
    // The solution is too short to give away its opening without giving away
    // the answer. The sub-topic's own "must remember" list is the honest
    // middle: it names what the question is testing without doing it.
    tiers.push({
      level: 2,
      kind: 'key-points',
      title: 'מה צריך לזכור כאן',
      promise: 'הכללים של הנושא — בלי לגעת בשאלה הזאת',
      body: keyPoints.slice(0, 3),
    });
  }

  tiers.push({
    level: 3,
    kind: 'full',
    title: 'הסבר מלא',
    promise: 'כל הצעדים, התשובה, ולמה עושים את זה',
    body: [],
  });

  // Re-level so the ladder is always 1..n with no gaps — a question with no
  // authored hint must not render a ladder that starts at "2".
  const relevelled = tiers.map((t, i) => ({ ...t, level: (i + 1) as HelpTierLevel }));

  return {
    tiers: relevelled,
    hasSpecificMiddle: tiers.some((t) => t.kind === 'first-step'),
    middleReason,
  };
}

/** The rungs that can be opened BEFORE committing to an answer.
 *
 *  The full solution is excluded on purpose: handing it over before the
 *  attempt destroys the measurement the whole diagnostic layer is built on —
 *  a "correct" answer copied off the screen would raise the predicted grade
 *  and hide a weakness. It stays one press away the moment they commit. */
export function preAnswerTiers(ladder: HelpLadder): HelpTier[] {
  return ladder.tiers.filter((t) => t.kind !== 'full');
}
