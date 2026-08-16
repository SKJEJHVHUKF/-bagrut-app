/**
 * review-resolve.ts — the two review helpers that need the CONTENT corpus.
 *
 * Split out of lib/review.ts so that module stays a pure localStorage store
 * with no runtime imports. That matters because lib/results.ts now calls
 * `seedFromMiss` on every miss (so the retention loop can't be forgotten by a
 * caller), and lib/results.ts is imported by almost every page — if `review.ts`
 * still pulled in `@/content/lessons`, every one of those pages would ship the
 * whole lesson corpus.
 *
 * Import this module only from the two screens that actually resolve a stored
 * pointer back to a question.
 */

import { getSubTopic } from '@/content/lessons';
import { findConceptQuestion } from '@/lib/concept-adapt';
import { getMistakes } from '@/lib/mistakes';
import { seedFromMiss, dropItems, readAllItems, type ReviewItem } from '@/lib/review';
import type { PracticeQuestion } from '@/content/lessons/types';

const BACKFILL_FLAG = 'bagrut-review-backfilled-v1';

/** Resolve a stored pointer back to the authored question (sub-topic practice
 *  bank, then its lesson drills, then the topic's concept-quiz bank). Returns
 *  null if the content was renamed.
 *
 *  The concept-bank fallback exists because a fix path (lib/remediation) may
 *  serve a topic-level concept question under a sub-topic's id when that
 *  sub-topic's own bank is thin. It also covers items seeded with no
 *  sub-topic at all (a /quiz miss), where `getSubTopic` returns undefined and
 *  the question id is the only thing to go on. Without it such an item would
 *  be permanently due, silently occupying a slot in a capped queue. */
export function resolveQuestion(item: ReviewItem): PracticeQuestion | null {
  const st = item.subTopicId ? getSubTopic(item.subject, item.topic, item.subTopicId) : undefined;
  if (st) {
    const inBank = (st.questions ?? []).find((q) => q.id === item.questionId);
    if (inBank) return inBank;
    for (const step of st.lesson ?? []) {
      if (step.drill?.id === item.questionId) return step.drill;
    }
  }
  return findConceptQuestion(item.subject, item.topic, item.questionId);
}

/** Evict pointers that resolve to nothing, so the due badge can't count cards
 *  the review screen will never show.
 *
 *  Needed because every miss now seeds a card (lib/results.ts), including a
 *  bagrut PART whose id — `${question.id}-${part.label}` — exists in no bank by
 *  design. Also cleans up after any content rename. Runs on the review screen,
 *  which resolves everything anyway. */
export function pruneUnresolvable(): void {
  const dead = readAllItems()
    .filter((it) => resolveQuestion(it) === null)
    .map((it) => it.questionId);
  dropItems(dead);
}

/** One-time backfill: seed the review queue from the existing mistake notebook
 *  so a returning student's queue isn't empty on the day this ships. */
export function backfillFromMistakes(now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(BACKFILL_FLAG)) return;
  try {
    for (const m of getMistakes('math5')) {
      seedFromMiss(
        { subject: m.subject, topic: m.topic, subTopicId: m.subTopicId, questionId: m.questionId },
        now,
      );
    }
    window.localStorage.setItem(BACKFILL_FLAG, '1');
  } catch {
    /* ignore */
  }
}
