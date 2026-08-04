/**
 * roadmap-mastery.ts — the PASS / STARS rules for a ladder rung. Pure, no
 * storage, no React — so it's unit-testable and runs anywhere.
 *
 * Replaces the old `computeStars` in roadmap-levels.ts, which floored at 1★ and
 * handed the learn rung a free 3★ — meaning a rung could be "cleared" with zero
 * correct answers. Here a rung is cleared only when the student actually meets a
 * pass bar, and stars reward doing it right the first time. Failing is never
 * punishing: the caller keeps the rung UNLOCKED (never re-locks) and offers a
 * retry — this module only decides pass/fail and the star count.
 */

import type { RoadmapLevelKind } from '@/lib/roadmap-levels';
import type { PracticeQuestion } from '@/content/lessons/types';

/**
 * Fraction of the rung's questions that must be answered correctly to CLEAR it.
 *  • learn — 0: the learn rung is a gateway, gated on answering its drills
 *    (see LearnLevel), not on a score.
 *  • easy / mid — 0.6: a real bar, but reachable.
 *  • hard / bagrut — 0.5: the challenge rungs are deliberately more forgiving so
 *    the single hardest question never dead-ends the climb.
 */
export const PASS_RATIO: Record<RoadmapLevelKind, number> = {
  learn: 0,
  easy: 0.6,
  mid: 0.6,
  hard: 0.5,
  ghost: 0,
  bagrut: 0.5,
};

/**
 * Rungs with no pass bar: finishing them IS the achievement, and the score
 * only decides the stars.
 *
 * `ghost` belongs here for a reason worth stating. In a Ghost Replay a wrong
 * commit opens the failure branch — the student is walked down their own
 * mistaken road until it breaks. That branch is the most valuable screen in
 * the feature. Gating the rung on a score would punish the student for
 * reaching it, which is exactly backwards.
 */
export const GATEWAY_LEVELS: RoadmapLevelKind[] = ['learn', 'ghost'];

/** Minimum number of correct answers needed to clear a rung of `total`. */
export function requiredCorrect(kind: RoadmapLevelKind, total: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total * PASS_RATIO[kind]);
}

/** Did this attempt meet the rung's pass bar? The learn rung always passes
 *  (it's gated on answering drills, not on a score). */
export function didPass(kind: RoadmapLevelKind, score: number, total: number): boolean {
  if (GATEWAY_LEVELS.includes(kind)) return true;
  if (total <= 0) return true;
  return score >= requiredCorrect(kind, total);
}

export type StarCount = 0 | 1 | 2 | 3;

/**
 * Stars for a rung attempt.
 *   0★ — not passed (below the bar).
 *   1★ — passed.
 *   2★ — passed with ≥ 80%.
 *   3★ — perfect.
 * A pass earned only via a RETRY caps at 2★, and a forced "continue anyway"
 * (after repeated fails) clears at 0★ — mastery rewards getting it right first.
 *
 * The learn rung is special: it carries no pass bar, so `score`/`total` are the
 * student's drill performance — all drills first-try-correct → 3★, some wrong →
 * 2★, no drills at all (`total` = 0) → 1★ (an honest "acknowledged").
 */
export function computeStars(
  kind: RoadmapLevelKind,
  score: number,
  total: number,
  opts: { viaRetry?: boolean; viaForce?: boolean } = {},
): StarCount {
  if (opts.viaForce) return 0;
  if (GATEWAY_LEVELS.includes(kind)) {
    if (total <= 0) return 1;
    return score >= total ? 3 : 2;
  }
  if (!didPass(kind, score, total)) return 0;
  const ratio = total > 0 ? score / total : 0;
  let stars: StarCount = 1;
  if (ratio >= 0.999) stars = 3;
  else if (ratio >= 0.8) stars = 2;
  if (opts.viaRetry && stars > 2) stars = 2;
  return stars;
}

const DIFFICULTY_RANK: Record<PracticeQuestion['difficulty'], number> = {
  easy: 0,
  mid: 1,
  hard: 2,
};

/**
 * The questions to re-serve on a retry: only the ones the student missed,
 * ordered easiest-first so the retry rebuilds confidence before the hard ones.
 */
export function retrySet(questions: PracticeQuestion[], wrongIds: Set<string>): PracticeQuestion[] {
  return questions
    .filter((q) => wrongIds.has(q.id))
    .sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]);
}
