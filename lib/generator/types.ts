/**
 * generator/types.ts — the contract a question template must satisfy.
 *
 * WHY THIS EXISTS
 * ---------------
 * `lib/remediation` already diagnoses the student well. What it could not do
 * was serve them anything NEW: `buildSupply` draws from the sub-topic bank, the
 * lesson drills and the concept quiz — which is precisely the material the
 * learning path already walked them through. A "fix path" made of questions the
 * student has seen (and whose green option they may simply remember) measures
 * recall of a screen, not repair of an idea.
 *
 * A template closes that: it is a *family* of questions, parameterised, with
 * the solution DERIVED in code rather than authored per instance. One template
 * yields unlimited on-target variants at zero API cost, and — because the
 * wording, the rule line and the distractor explanations are written once —
 * every instance is as carefully worded as a hand-authored one.
 *
 * THE INVARIANT THAT MAKES IT SAFE
 * --------------------------------
 * `build` must be a PURE function of (rng, difficulty). Same seed → byte-identical
 * question. That is what lets an id like `gen:seq-ar-nth:mid:8412` be the ONLY
 * thing stored in the answer log and still re-render six weeks later in the
 * report, and it is what makes `scripts/verify-generator.ts` a real gate rather
 * than a sampling exercise.
 *
 * `build` MAY return null. Parameterisation produces degenerate instances —
 * a distractor that collides with the correct answer, a fraction that reduces
 * to 1, a sum that comes out negative where the wording assumes positive. The
 * honest response is to reject the draw and let the engine reseed, never to
 * ship a broken question. The gate asserts the rejection rate stays sane.
 */

import type { PracticeQuestion } from '@/content/lessons/types';
import type { Difficulty } from '@/lib/remediation/types';
import type { ErrorTag } from '@/lib/patterns/tags';
import type { Rng } from './rng';

/**
 * A named, curriculum-level skill that a template exercises.
 *
 * This is deliberately COARSER than a sub-topic and it crosses topics on
 * purpose: `substitution` is the same act in סדרות and in הסתברות, and the
 * report's whole claim ("your mistakes repeat *here*") depends on being able to
 * say so. The list is closed — an open string would drift into synonyms and the
 * cross-topic tally would silently split in two.
 */
export type GenSkill =
  | 'formula-choice'      // picking the right formula for the wording
  | 'index-offset'        // the n vs n-1 family
  | 'substitution'        // putting given values into a formula correctly
  | 'equation-solving'    // isolating the unknown once it is set up
  | 'complement'          // 1 - P, "לפחות אחד", negation of an event
  | 'conditional'         // P(A|B), narrowing the sample space
  | 'independence'        // with/without replacement, multiplying branches
  | 'counting'            // how many outcomes there are at all
  | 'sum-formula'         // S_n, and which of its two forms fits
  | 'convergence';        // |q| < 1 and the infinite sum

export type GenTemplate = {
  /** Stable and permanent — it is half of every generated question id. */
  id: string;
  subject: string;
  topic: string;
  /** The sub-topic this repairs. Must exist in `content/lessons`. */
  subTopicId: string;
  /** Student-facing name of the family, shown in the report. */
  title: string;
  /** What the template actually exercises, for cross-topic tallying. */
  skill: GenSkill;
  /** Difficulties this family can produce. */
  difficulties: Difficulty[];
  /**
   * Build one instance. PURE in (rng, difficulty). Return null to reject a
   * degenerate draw — the engine reseeds and tries again.
   *
   * `id` and `difficulty` on the returned object are overwritten by the engine,
   * so a template may leave them as placeholders.
   */
  build(rng: Rng, difficulty: Difficulty): PracticeQuestion | null;

  /**
   * What each wrong option MEANS, aligned with the `answers` array `build`
   * produces, with `null` at the correct index.
   *
   * This is what turns a click into evidence. `ResultEvent.chosenIndex` stores
   * the ORIGINAL option index (never the shuffled display position), so
   * `distractorTags[chosenIndex]` names the mistake with no API call, no
   * self-reporting and no guessing — which is the only way `lib/patterns` can
   * honestly claim "this mistake keeps coming back".
   *
   * A template's option ORDER is therefore part of its contract:
   * `verify-generator` asserts the array length matches, and reordering the
   * options without reordering this array would silently relabel every
   * historical answer. MCQ templates only.
   */
  distractorTags?: (ErrorTag | null)[];

  /**
   * The same, for open questions: aligned with the `wrongAnswers` array, which
   * lists typed values a student predictably arrives at. A match is recorded as
   * `answerDiagnosis: { kind: 'known-mistake' }`, and this array is what gives
   * that match a cross-topic name.
   */
  wrongAnswerTags?: ErrorTag[];
};

/** A built instance, plus the provenance the report and the gate need. */
export type GeneratedQuestion = {
  question: PracticeQuestion;
  templateId: string;
  skill: GenSkill;
  seed: number;
  difficulty: Difficulty;
};
