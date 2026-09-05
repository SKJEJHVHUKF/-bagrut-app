// ============================================================
// הסתברות — EXTRA practice questions per stage
// ============================================================
//
// The six stage sub-topics in ../probability-stages-{a,b}.ts shipped with 7–11
// practice questions each (2–5 per rung). The owner asked (2026-09-06) to build
// the whole track out, with two requirements in his own words: the questions
// must be VARIED, and each rung must be genuinely harder than the one below it
// ("ככל שעולים רמה כך גם השאלות עצמן קשות ומאתגרות יותר באמת").
//
// The second requirement was not met before this round, and it was measured
// rather than assumed: on pr-basics the hard rung averaged FEWER solution steps
// than the mid rung (4.0 vs 4.7) and its two questions were the same mechanism
// — "at least one" via the complement — as the mid question above them, with
// different numbers. On pr-tables the hard rung invoked fewer named rules than
// the easy rung. scripts/_prob-extra-check.ts now measures the gradient and
// fails when a rung is not harder than the one below it, so the promise the
// ladder makes is enforced instead of asserted.
//
// Ids: `pr-x-<stage>-1NN`, distinct from every existing scheme in the topic.
// Same house rules as the stage files; the gate enforces them per file.

import type { PracticeQuestion } from '../../types';
import { EXTRA as BASICS } from './basics';
import { EXTRA as TREE } from './tree';
import { EXTRA as TABLES } from './tables';
import { EXTRA as BERNOULLI } from './bernoulli';
import { EXTRA as CONDITIONAL } from './conditional';
import { EXTRA as PRACTICE } from './practice';

/** Stage sub-topic id → the questions appended to that stage. */
export const PROB_EXTRA: Record<string, PracticeQuestion[]> = {
  'pr-basics': BASICS,
  'pr-tree': TREE,
  'pr-tables': TABLES,
  'pr-bernoulli': BERNOULLI,
  'pr-conditional': CONDITIONAL,
  'pr-practice': PRACTICE,
};

/** Append the extras to whichever stages appear in `stages`, in rung order.
 *  Generic so the SubTopic shape survives — a `{id, questions}[]` parameter
 *  would widen every stage and break the Lesson type at the spread site. */
export function withProbExtra<T extends { id: string; questions: PracticeQuestion[] }>(stages: T[]): T[] {
  return stages.map((s) => {
    const extra = PROB_EXTRA[s.id] ?? [];
    return extra.length ? { ...s, questions: [...s.questions, ...extra] } : s;
  });
}
