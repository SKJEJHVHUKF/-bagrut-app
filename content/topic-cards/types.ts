/**
 * topic-cards/types.ts — the short, authored answer to a question about the
 * TOPIC rather than about the exercise.
 *
 * ============================================================
 * THE ONE DISTINCTION THIS WHOLE FEATURE RESTS ON
 * ============================================================
 * "מה זה בלי החזרה?" is a question about probability. "מה השלב הבא?" is a
 * question about the exercise on the screen. They look alike in a chat box and
 * they are not alike at all:
 *
 *   TOPIC question     a general answer is CORRECT. The student wants the idea,
 *                      and the idea does not depend on their numbers.
 *   EXERCISE question  a general answer is WRONG, however true it is. The
 *                      student wants this step, in this question, and being
 *                      handed a definition instead is the failure the
 *                      cross-question reuse measurement spent weeks avoiding.
 *
 * A Topic Card may only ever answer the first kind. Nothing in this file may
 * be served for `next_step`, `why_this_step` or `what_to_do_here` — those are
 * grounded in the question's own content or they are the model's.
 *
 * ============================================================
 * WHY EVERY FIELD IS REQUIRED
 * ============================================================
 * A card with only an explanation is a dictionary entry, and a dictionary is
 * not a tutor. The five content fields together are one small lesson: what it
 * is, the rule, a number to hold on to, the trap, and a question back — the
 * same shape the local templates already use, because a student should not be
 * able to tell which layer answered them.
 */

export type TopicCard = {
  /** Stable, kebab, prefixed by topic: `prob-with-replacement`. */
  id: string;
  /** Canonical Hebrew topic key, byte-for-byte as content/bagrut-curriculum
   *  spells it. Validated by the gate — a drifted string resolves to nothing. */
  topic: string;
  /** English kebab sub-topic slug, or '' when the card spans the topic. */
  subtopic: string;

  /**
   * The phrasings a student uses to ask for THIS card.
   *
   * ⚠️ Each alias must carry a word no other card in the topic carries. Two
   * cards whose aliases overlap will fight over the same message and the
   * matcher will pick by score, which is how a student asking about
   * independence gets the card on disjoint events.
   */
  aliases: string[];

  /** 2–4 sentences. Plain Hebrew, no LaTeX island opening a paragraph. */
  shortExplanation: string;
  /** The rule or formula, stated as the exam states it. */
  formulaOrRule: string;
  /** One tiny worked instance with real numbers. Not the student's numbers. */
  microExample: string;
  /** The mistake this idea actually produces, written as a misconception. */
  commonMistake: string;
  /** One question back. A card that ends in a full stop ends the conversation. */
  followUpQuestion: string;

  /** Bumped when the text changes, so a cache keyed on it invalidates. */
  version: number;
  /** Only approved cards are ever served. An unapproved card can sit in the
   *  file while it is being written without reaching a student. */
  approved: boolean;
};

export type TopicCardBank = Record<string, TopicCard[]>;
