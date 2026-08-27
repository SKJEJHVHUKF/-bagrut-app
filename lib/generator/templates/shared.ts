/**
 * generator/templates/shared.ts — the two constructors every template family uses.
 *
 * These lived in duplicate inside `sequences.ts` and `probability.ts`. A third
 * copy would have been the point where they drift, and the MCQ guard below is
 * exactly the thing that must not: it is the only check standing between a
 * parameter collision and a question that ships two identical options — or, in
 * the worst case, two correct ones.
 */

import type { PracticeQuestion } from '@/content/lessons/types';

/**
 * Assemble an MCQ, REJECTING the draw when the options are not four distinct
 * strings.
 *
 * This guard is the whole reason `GenTemplate.build` is allowed to return null.
 * Parameter collisions are not rare: for `d = 1` a "multiplied by n instead of
 * n-1" distractor sits one away from the answer and for some draws lands
 * exactly on another distractor. Silently de-duplicating the list would ship a
 * question with a visible repeat; keeping it would ship two right answers.
 */
export function mcq(
  q: Omit<PracticeQuestion, 'id' | 'difficulty' | 'kind'> & { answers: string[]; correct: number },
): PracticeQuestion | null {
  if (q.answers.length !== 4) return null;
  if (new Set(q.answers).size !== q.answers.length) return null;
  if (q.correct < 0 || q.correct > 3) return null;
  return { id: '', difficulty: 'mid', kind: 'mcq', ...q };
}

/** The open-question counterpart. `id`/`difficulty` are set by the engine. */
export function open(
  q: Omit<PracticeQuestion, 'id' | 'difficulty' | 'kind'>,
): PracticeQuestion | null {
  return { id: '', difficulty: 'mid', kind: 'open', ...q };
}
