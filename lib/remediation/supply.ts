/**
 * remediation/supply.ts — where the repair questions come from.
 *
 * Zero API cost by construction: every question a fix path can serve already
 * exists, hand-authored and mathematically verified, in one of three banks.
 *
 *   1 · the sub-topic's own practice bank   (5-8 per sub-topic, easy/mid/hard,
 *       each with an authored `hint`, stepped `solution` and per-distractor
 *       notes — the richest supply, and always on-target)
 *   2 · the lesson micro-drills              (`SubTopicLessonStep.drill`, short
 *       and easy; formative content that the ladder never scores, so it is
 *       almost always unseen)
 *   3 · the topic's concept-quiz bank        (240 questions across 3 levels)
 *
 * Tier 3 is deliberately LAST and this is the reason: a concept question is
 * indexed by topic, not sub-topic, so it may be adjacent to the weakness rather
 * than on it — and it converts to a single-step solution (see lib/concept-adapt),
 * while after a mistake the stepped solution is most of the value. It exists so
 * that a sub-topic with a thin bank still yields a real ladder instead of a
 * two-question stub.
 *
 * Nothing here is stored. A `FixStep` persists an id plus its origin, and this
 * module turns that back into the question — so renaming content orphans a step
 * loudly (resolve returns null) instead of silently serving the wrong question.
 */

import { buildTriggerIndex, getCognitionMap } from '@/content/cognition';
import { getSubTopic } from '@/content/lessons';
import type { PracticeQuestion } from '@/content/lessons/types';
import { conceptPracticeQuestions, findConceptQuestion } from '@/lib/concept-adapt';
import { rankOf, type Difficulty, type FixPath, type FixStep, type FixStepOrigin, type Weakness } from './types';

export type SupplyItem = {
  question: PracticeQuestion;
  origin: FixStepOrigin;
  difficulty: Difficulty;
  /** Carries an authored trigger for the target misconception — answering it
   *  tests the repaired idea directly rather than by proxy. */
  diagnostic: boolean;
  seenBefore: boolean;
};

/** Preference order between the banks. Lower wins. */
const TIER: Record<FixStepOrigin, number> = {
  'subtopic-bank': 0,
  'lesson-drill': 1,
  'concept-bank': 2,
};

export type SupplyOptions = {
  /** Question ids the student has already answered (any source). */
  answeredIds?: Set<string>;
  /**
   * Questions to push to the very back — normally the one they just failed.
   * Re-serving it immediately tests whether they remember which option was
   * green, not whether the idea is repaired. It stays in the pool because on a
   * thin sub-topic it may be the only supply left.
   */
  deprioritise?: Set<string>;
};

/**
 * Every question that could legitimately appear in this weakness's fix path,
 * ordered: easiest first, best bank first, diagnostic before generic, unseen
 * before seen. Fully deterministic — the same weakness always yields the same
 * pool, which is what makes the gate and the synthetic-student tests meaningful.
 */
export function buildSupply(w: Weakness, opts: SupplyOptions = {}): SupplyItem[] {
  const answered = opts.answeredIds ?? new Set<string>();
  const deprioritise = opts.deprioritise ?? new Set<string>();
  const st = getSubTopic(w.subject, w.topic, w.subTopicId);
  const items: SupplyItem[] = [];
  const taken = new Set<string>();

  // Which question ids are direct evidence for THIS misconception.
  let diagnosticIds = new Set<string>();
  if (w.misconceptionId) {
    const map = getCognitionMap(w.subject, w.topic);
    if (map) {
      const triggers = buildTriggerIndex(map);
      const ids = new Set<string>();
      for (const [questionId, byOption] of triggers) {
        for (const mcId of byOption.values()) {
          if (mcId === w.misconceptionId) ids.add(questionId);
        }
      }
      diagnosticIds = ids;
    }
  }

  const add = (q: PracticeQuestion, origin: FixStepOrigin) => {
    if (taken.has(q.id)) return;
    taken.add(q.id);
    items.push({
      question: q,
      origin,
      difficulty: q.difficulty,
      diagnostic: diagnosticIds.has(q.id),
      seenBefore: answered.has(q.id),
    });
  };

  if (st) {
    for (const q of st.questions ?? []) add(q, 'subtopic-bank');
    for (const step of st.lesson ?? []) if (step.drill) add(step.drill, 'lesson-drill');
  }
  for (const q of conceptPracticeQuestions(w.subject, w.topic)) add(q, 'concept-bank');

  return items.sort((a, b) => {
    const aBack = deprioritise.has(a.question.id) ? 1 : 0;
    const bBack = deprioritise.has(b.question.id) ? 1 : 0;
    return (
      aBack - bBack ||
      rankOf(a.difficulty) - rankOf(b.difficulty) ||
      TIER[a.origin] - TIER[b.origin] ||
      Number(b.diagnostic) - Number(a.diagnostic) ||
      Number(a.seenBefore) - Number(b.seenBefore) ||
      a.question.id.localeCompare(b.question.id)
    );
  });
}

/**
 * Turn a stored step back into its question. Returns null when the content has
 * been renamed since the path was built — the runner treats that as "this step
 * no longer exists" and moves on, which is the only honest option.
 */
export function resolveFixQuestion(path: FixPath, step: FixStep): PracticeQuestion | null {
  if (step.origin === 'concept-bank') {
    return findConceptQuestion(path.subject, path.topic, step.questionId);
  }
  const st = getSubTopic(path.subject, path.topic, path.subTopicId);
  if (!st) return null;
  if (step.origin === 'subtopic-bank') {
    return (st.questions ?? []).find((q) => q.id === step.questionId) ?? null;
  }
  for (const lessonStep of st.lesson ?? []) {
    if (lessonStep.drill?.id === step.questionId) return lessonStep.drill;
  }
  return null;
}
