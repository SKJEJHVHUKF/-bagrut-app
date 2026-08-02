// ============================================================
// Cognition catalog — types for the skill graph + misconception map.
// ============================================================
//
// This is DATA ONLY. It describes, per topic:
//   • the SKILLS a student can hold (finer than a sub-topic — 3-5 per module),
//   • the PREREQUISITE edges between them (what must be solid first),
//   • the MISCONCEPTIONS that corrupt a skill, each anchored to concrete
//     evidence: "picking option 2 of question X *is* this misconception".
//
// WHY THIS LIVES IN ITS OWN FILE TREE, NOT INSIDE content/lessons/math5/*.ts
// Those lesson files are thousands of lines of mathematically-verified content
// that other sessions edit in parallel. Keying the catalog by `questionId` in a
// separate module means the cognitive layer can be authored, re-authored and
// gated without ever touching a verified question. The cost is that a renamed
// question id silently orphans a trigger — which is exactly what
// scripts/verify-cognition.ts exists to catch.
//
// The triggers are not new pedagogy. Every MCQ distractor in the complex-numbers
// bank already ships an authored `distractorNotes` entry explaining precisely
// which wrong idea produces that option. Until now that text was rendered and
// then thrown away; the catalog gives each of those wrong ideas a stable id so
// the same click also becomes a measurement.

import type { RoadmapLevelKind } from '@/lib/roadmap-levels';

/** Namespaced and stable forever — these ids end up in derived state. */
export type SkillId = string;
export type MisconceptionId = string;

export type Skill = {
  id: SkillId;
  /** Short Hebrew name. Student-facing: it appears inside the insight sentence. */
  title: string;
  subject: string;
  topic: string;
  /** The SubTopic.id this skill is taught in — the remedy's default target. */
  subTopicId: string;
  /** Skills that must be solid before this one is learnable. Directed, acyclic. */
  prereqs: SkillId[];
  /** Typical difficulty — sets the BKT prior (see lib/cognition/trace.ts). */
  band: 'easy' | 'mid' | 'hard';
};

export type Misconception = {
  id: MisconceptionId;
  /** Short Hebrew name — "ארגומנט בלי תיקון רבע". */
  title: string;
  /** The skill this wrong idea corrupts. */
  skill: SkillId;
  /**
   * Set ONLY when the real break is upstream of `skill`. Example: mixing up
   * which angle points along which axis shows up while writing polar form, but
   * the thing that is actually missing is the argument concept. The diagnosis
   * layer reports `rootSkill` to the student when it is present.
   */
  rootSkill?: SkillId;
  /** One Hebrew sentence, written to be read by a 17-year-old. */
  insight: string;
  /** Where to send the student to repair it. */
  remedy: { subTopicId: string; level?: RoadmapLevelKind };
  /**
   * MCQ evidence. Choosing `optionIndex` on `questionId` IS this misconception.
   * `optionIndex` is the ORIGINAL index in `answers[]`, never the shuffled
   * position — QuestionRunnerCard reports the original index by design.
   * verify-cognition asserts none of these points at the CORRECT option.
   */
  triggers: { questionId: string; optionIndex: number }[];
};

export type TopicCognitionMap = {
  subject: string;
  topic: string;
  skills: Skill[];
  misconceptions: Misconception[];
  /**
   * questionId → the skills that question exercises. A question with no entry
   * falls back to every skill of its sub-topic (see lib/cognition/observe.ts),
   * which is coarse but never wrong.
   */
  questionSkills: Record<string, SkillId[]>;
};
