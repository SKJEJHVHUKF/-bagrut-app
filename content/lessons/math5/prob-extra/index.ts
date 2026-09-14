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

import type { PracticeQuestion, StaticBagrutQuestion } from '../../types';
import { EXTRA as BASICS, EXTRA_BAGRUT as BASICS_BAG } from './basics';
import { EXTRA as TREE, EXTRA_BAGRUT as TREE_BAG } from './tree';
import { EXTRA as TABLES, EXTRA_BAGRUT as TABLES_BAG } from './tables';
import { EXTRA as BERNOULLI, EXTRA_BAGRUT as BERNOULLI_BAG } from './bernoulli';
import { EXTRA as CONDITIONAL, EXTRA_BAGRUT as CONDITIONAL_BAG } from './conditional';
import { EXTRA as PRACTICE, EXTRA_BAGRUT as PRACTICE_BAG } from './practice';
// Round 3 (2026-09-14, owner: "לפחות 20 תרגילים" on every rung, the 🎓 rung
// included). One file per stage per kind, so no two authors share a file.
import { R3 as R3_BASICS } from './r3/basics';
import { R3 as R3_TREE } from './r3/tree';
import { R3 as R3_TABLES } from './r3/tables';
import { R3 as R3_BERNOULLI } from './r3/bernoulli';
import { R3 as R3_CONDITIONAL } from './r3/conditional';
import { R3 as R3_PRACTICE } from './r3/practice';
import { R3_BAGRUT as R3_BASICS_BAG } from './r3/basics-bagrut';
import { R3_BAGRUT as R3_TREE_BAG } from './r3/tree-bagrut';
import { R3_BAGRUT as R3_TABLES_BAG } from './r3/tables-bagrut';
import { R3_BAGRUT as R3_BERNOULLI_BAG } from './r3/bernoulli-bagrut';
import { R3_BAGRUT as R3_CONDITIONAL_BAG } from './r3/conditional-bagrut';
import { R3_BAGRUT as R3_PRACTICE_BAG } from './r3/practice-bagrut';
import { PROB_ORDER } from './order';

/**
 * A question lives on the stage that TEACHES the tool it needs. Round 3's
 * authors, reading the lessons (2026-09-14), found shipped round-1/2 questions
 * that needed a tool only a later stage teaches: a table question that asks a
 * conditional ("וברמה 5 המותנית תשב בדיוק על הטבלה הזאת", says pr-tables' own
 * summary), backwards Bayes inside pr-tree, a conditional inside pr-bernoulli,
 * and a tree inside pr-basics. A student meets them before the tool.
 * They move, unchanged (same id, same text, same tutor bank), to the first stage
 * whose lessons give the student everything they use.
 */
export const PROB_REHOME: Record<string, string> = {
  // conditional / independence test → pr-conditional
  'pr-x-tre-110': 'pr-conditional', 'pr-x-tre-205': 'pr-conditional',
  'pr-x-tab-104': 'pr-conditional', 'pr-x-tab-105': 'pr-conditional', 'pr-x-tab-106': 'pr-conditional',
  'pr-x-tab-108': 'pr-conditional', 'pr-x-tab-109': 'pr-conditional', 'pr-x-tab-110': 'pr-conditional',
  'pr-x-tab-201': 'pr-conditional', 'pr-x-tab-202': 'pr-conditional', 'pr-x-tab-203': 'pr-conditional',
  'pr-x-tab-204': 'pr-conditional', 'pr-x-tab-205': 'pr-conditional', 'pr-x-tab-206': 'pr-conditional',
  'pr-x-tab-207': 'pr-conditional', 'pr-x-tab-208': 'pr-conditional',
  'pr-x-ber-205': 'pr-conditional',
  'prob-bag-x-tre-01': 'pr-conditional', 'prob-bag-x-tab-01': 'pr-conditional', 'prob-bag-x-ber-01': 'pr-conditional',
  // a tree → pr-tree ("בנו עץ הסתברויות"; prob-bag-004 draws one in part א)
  'prob-bag-x-bas-01': 'pr-tree', 'prob-bag-004': 'pr-tree',
};

/** Point every re-homed bagrut question at its new stage's 🎓 rung. */
export function withProbRehome<T extends { id: string; subTopicId?: string }>(items: T[]): T[] {
  return items.map((b) => (PROB_REHOME[b.id] ? { ...b, subTopicId: PROB_REHOME[b.id] } : b));
}

/** Extra multi-part bagrut questions, one file per stage so parallel authors
 *  never share a file; `subTopicId` on each is what makes it a stage's 🎓 rung
 *  (read it from the lesson, which applies PROB_REHOME). */
export const PROB_EXTRA_BAGRUT: StaticBagrutQuestion[] = [
  ...BASICS_BAG, ...TREE_BAG, ...TABLES_BAG, ...BERNOULLI_BAG, ...CONDITIONAL_BAG, ...PRACTICE_BAG,
  ...R3_BASICS_BAG, ...R3_TREE_BAG, ...R3_TABLES_BAG, ...R3_BERNOULLI_BAG, ...R3_CONDITIONAL_BAG, ...R3_PRACTICE_BAG,
];

const byStage: Record<string, PracticeQuestion[]> = {
  'pr-basics': [...BASICS, ...R3_BASICS],
  'pr-tree': [...TREE, ...R3_TREE],
  'pr-tables': [...TABLES, ...R3_TABLES],
  'pr-bernoulli': [...BERNOULLI, ...R3_BERNOULLI],
  'pr-conditional': [...CONDITIONAL, ...R3_CONDITIONAL],
  'pr-practice': [...PRACTICE, ...R3_PRACTICE],
};
/** Stage sub-topic id → the questions appended to that stage (after PROB_REHOME). */
export const PROB_EXTRA: Record<string, PracticeQuestion[]> = Object.fromEntries(Object.keys(byStage).map((s) => [s, []]));
for (const [stage, qs] of Object.entries(byStage)) for (const q of qs) PROB_EXTRA[PROB_REHOME[q.id] ?? stage].push(q);

const RANK = new Map(PROB_ORDER.map((id, i) => [id, i]));
/** Easiest first (./order.ts). Array sort is stable, so ids the order does not
 *  know yet keep their authoring position, after the ranked ones. */
export function withProbOrder<T extends { id: string }>(items: T[]): T[] {
  if (!RANK.size) return items;
  return [...items].sort((a, b) => (RANK.get(a.id) ?? Infinity) - (RANK.get(b.id) ?? Infinity));
}

/** Append the extras to whichever stages appear in `stages`, then order each
 *  stage easiest first. The ladder groups by `difficulty`, so this ordering is
 *  the order inside every rung.
 *  Generic so the SubTopic shape survives — a `{id, questions}[]` parameter
 *  would widen every stage and break the Lesson type at the spread site. */
export function withProbExtra<T extends { id: string; questions: PracticeQuestion[] }>(stages: T[]): T[] {
  return stages.map((s) => ({ ...s, questions: withProbOrder([...s.questions, ...(PROB_EXTRA[s.id] ?? [])]) }));
}
