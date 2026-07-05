// ============================================================
// adaptive.ts — level-aware question selection & ordering.
//
// Every practice surface serves questions matched to the student:
//   - unitLevel (3/4/5 יחידות, from the study plan) sets the BASE band:
//       3 → easy-heavy, 4 → balanced, 5 → full ladder up to hard
//   - the per-topic self-assessed level (חלש/בינוני/חזק) shifts the band
//   - live accuracy (from lib/results.ts) escalates/de-escalates:
//       ≥80% on enough attempts → step up; <40% → step down
//
// Pure functions over the static banks — zero API cost, deterministic
// given the same inputs (ordering shuffles within difficulty bands).
// ============================================================

import type { PracticeQuestion } from '@/content/lessons/types';
import type { ProficiencyLevel, UnitLevel } from '@/lib/study-plan';
import { getUnitLevel, getTopicLevel } from '@/lib/study-plan';
import { subTopicStats, topicStats } from '@/lib/results';

export type Difficulty = 'easy' | 'mid' | 'hard';

/** The student's effective tier for a topic: 0=gentle, 1=balanced, 2=advanced. */
export type Tier = 0 | 1 | 2;

const ESCALATE_MIN_ATTEMPTS = 5;

/**
 * Compute the student's tier for (subject, topic[, subTopicId]).
 * Base from unitLevel, shifted by self-assessed topic level, then adjusted
 * by live accuracy when there's enough data.
 */
export function studentTier(
  subject: string,
  topic: string,
  subTopicId?: string,
): Tier {
  const unit: UnitLevel = getUnitLevel();
  let tier: number = unit === 3 ? 0 : unit === 4 ? 1 : 1; // 5 units starts balanced too

  const level: ProficiencyLevel | null = getTopicLevel(subject, topic);
  if (level === 'weak') tier -= 1;
  if (level === 'strong') tier += 1;

  // Live signal — the strongest voice when it exists.
  const stat = subTopicId
    ? subTopicStats(subject).find((s) => s.topic === topic && s.subTopicId === subTopicId)
    : topicStats(subject).find((s) => s.topic === topic);
  if (stat && stat.attempts >= ESCALATE_MIN_ATTEMPTS) {
    if (stat.accuracy >= 0.8) tier += 1;
    else if (stat.accuracy < 0.4) tier -= 1;
  }

  return Math.max(0, Math.min(2, tier)) as Tier;
}

/** Difficulty mix per tier — how many of each band in a batch of n. */
const TIER_MIX: Record<Tier, Record<Difficulty, number>> = {
  0: { easy: 0.6, mid: 0.3, hard: 0.1 },
  1: { easy: 0.3, mid: 0.45, hard: 0.25 },
  2: { easy: 0.1, mid: 0.4, hard: 0.5 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `n` questions from a pool, matching the tier's difficulty mix.
 * Shortfalls in one band are filled from adjacent bands, so the batch is
 * always full when the pool allows.
 */
export function pickQuestions(
  pool: PracticeQuestion[],
  n: number,
  tier: Tier,
): PracticeQuestion[] {
  const byBand: Record<Difficulty, PracticeQuestion[]> = {
    easy: shuffle(pool.filter((q) => q.difficulty === 'easy')),
    mid: shuffle(pool.filter((q) => q.difficulty === 'mid')),
    hard: shuffle(pool.filter((q) => q.difficulty === 'hard')),
  };
  const mix = TIER_MIX[tier];
  const want: Record<Difficulty, number> = {
    easy: Math.round(n * mix.easy),
    mid: Math.round(n * mix.mid),
    hard: 0,
  };
  want.hard = Math.max(0, n - want.easy - want.mid);

  const picked: PracticeQuestion[] = [];
  const take = (band: Difficulty, count: number) => {
    while (count > 0 && byBand[band].length > 0) {
      picked.push(byBand[band].pop()!);
      count--;
    }
    return count; // leftover unfilled
  };

  let leftover = 0;
  leftover += take('easy', want.easy);
  leftover += take('mid', want.mid);
  leftover += take('hard', want.hard);
  // Fill any shortfall from whatever remains, easiest-first for tier 0,
  // hardest-first for tier 2.
  const fillOrder: Difficulty[] = tier === 2 ? ['hard', 'mid', 'easy'] : tier === 0 ? ['easy', 'mid', 'hard'] : ['mid', 'easy', 'hard'];
  for (const band of fillOrder) {
    if (leftover <= 0) break;
    leftover = take(band, leftover);
  }
  return picked.slice(0, n);
}

/**
 * Order a FIXED set of questions (e.g. a sub-topic's drills) for the tier:
 * tier 0 → easy→hard (confidence first), tier 1 → easy→hard (classic ramp),
 * tier 2 → mid/hard first (skip the warm-up), easy last as quick wins.
 */
export function orderQuestions(
  questions: PracticeQuestion[],
  tier: Tier,
): PracticeQuestion[] {
  const rank: Record<Difficulty, number> = { easy: 0, mid: 1, hard: 2 };
  const sorted = [...questions].sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  if (tier < 2) return sorted;
  // Advanced: mid+hard first (in ramp order between themselves), easy at the end.
  return [...sorted.filter((q) => q.difficulty !== 'easy'), ...sorted.filter((q) => q.difficulty === 'easy')];
}

/** Human label for the tier — shown as a small transparency chip. */
export function tierLabel(tier: Tier): string {
  return tier === 0 ? 'מסלול מדורג' : tier === 1 ? 'מסלול מאוזן' : 'מסלול מתקדם';
}
