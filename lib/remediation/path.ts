/**
 * remediation/path.ts — building the repair sequence, and walking it.
 *
 * PURE. Nothing here reads storage or the clock; both are parameters. The whole
 * session — which question comes next, when to re-teach, when the weakness is
 * repaired, when to stop — is a function of (path, progress), so a synthetic
 * student in scripts/test-remediation.ts exercises the same transitions the
 * browser does.
 *
 * The shape of the ladder: start ONE rung below where the student broke, spend
 * the middle at the band itself, finish one rung above. Starting at the band is
 * the obvious design and it is wrong — a student who just failed a mid question
 * needs one they can actually complete before the repair means anything.
 *
 * The failure branch is the part that makes this a repair rather than a quiz:
 *   miss 1  → the runner's normal feedback (hint, retry, worked solution)
 *   miss 2  → a re-teach card, then the EASIEST remaining question
 *   miss 3  → stop the session honestly and hand it to tomorrow's review
 * There is no fourth state and no loop: a session always terminates.
 */

import {
  rankOf,
  RANK_DIFFICULTY,
  type Difficulty,
  type FixDecision,
  type FixPath,
  type FixProgress,
  type FixStep,
  type Weakness,
} from './types';
import type { SupplyItem } from './supply';

/** Fewer than this is not a ladder — the UI says so rather than serving a stub. */
export const MIN_STEPS = 3;
export const MAX_STEPS = 5;
/** Wrong answers that end the session. */
export const MAX_MISSES = 3;
/** Wrong answers that trigger the re-teach card + an easier question. */
export const RETEACH_AFTER_MISSES = 2;
/**
 * Correct answers that close the weakness — 3 of the 5-step ladder (owner,
 * 2026-09-04). Not a streak: a miss in between does not reset it. With
 * MAX_MISSES = 3 the two verdicts are exclusive on a 5-step path.
 */
export const HEAL_CORRECT = 3;

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/**
 * How many questions we want at each rung, relative to the band the student
 * broke at. Two below (one warm-up, one held back as the post-re-teach relief),
 * two at the band, one above to prove it stuck.
 *
 * When the band is at either end of the scale the missing side's quota folds
 * into the band — a student failing `easy` questions gets four easy and one mid,
 * which is the right shape for that diagnosis.
 */
function rankQuota(band: Difficulty): number[] {
  const b = rankOf(band);
  const lower = Math.max(0, b - 1);
  const upper = Math.min(RANK_DIFFICULTY.length - 1, b + 1);
  const quota = [0, 0, 0];
  quota[lower] += 2;
  quota[b] += 2;
  quota[upper] += 1;
  return quota;
}

/**
 * Choose 3-5 questions from the supply. Returns null when the banks cannot
 * produce a real ladder — the caller must then say so plainly instead of
 * dressing two questions up as a repair path.
 */
export function buildFixPath(
  w: Weakness,
  supply: SupplyItem[],
  now: number,
): FixPath | null {
  const quota = rankQuota(w.band);
  const chosen: SupplyItem[] = [];
  const used = new Set<string>();

  const fill = (pool: SupplyItem[], limit: number) => {
    const byRank: SupplyItem[][] = [[], [], []];
    for (const item of pool) byRank[rankOf(item.difficulty)].push(item);

    const take = (rank: number, n: number) => {
      for (const item of byRank[rank]) {
        if (chosen.length >= limit || n <= 0) return;
        if (used.has(item.question.id)) continue;
        used.add(item.question.id);
        chosen.push(item);
        n -= 1;
      }
    };

    // Satisfy the quota rung by rung, easiest first.
    for (let rank = 0; rank < quota.length; rank++) take(rank, quota[rank]);

    // A thin rung spills onto whatever else this pool has, nearest-first
    // (easier before harder — an extra easy question wastes a minute, an extra
    // hard one ends the session on a miss).
    if (chosen.length < limit) {
      const b = rankOf(w.band);
      for (const rank of [b, Math.max(0, b - 1), Math.min(2, b + 1), 0, 1, 2]) {
        if (chosen.length >= limit) break;
        take(rank, limit - chosen.length);
      }
    }
  };

  /**
   * Two passes, and the order is the whole point.
   *
   * Pass 1 uses ONLY material from the weakness's own sub-topic. Pass 2 tops up
   * from the topic-level concept bank — and only while the path is still under
   * MIN_STEPS.
   *
   * The obvious single-pass version fills every rung from the best available
   * question at that difficulty, which sounds right and is not: a sub-topic with
   * no `easy` questions of its own would get a five-step ladder whose first
   * three questions are about a different sub-topic of the same topic. The gate
   * measured that happening on 17 of 174 band-paths. A SHORT, on-target repair
   * beats a long, diluted one — the feature's claim is that these questions are
   * about the thing you got wrong, and padding quietly makes that false.
   */
  fill(
    supply.filter((s) => s.origin !== 'concept-bank'),
    MAX_STEPS,
  );
  if (chosen.length < MIN_STEPS) fill(supply, MIN_STEPS);

  if (chosen.length < MIN_STEPS) return null;

  chosen.sort((a, b) => rankOf(a.difficulty) - rankOf(b.difficulty));

  const steps: FixStep[] = chosen.map((item) => ({
    questionId: item.question.id,
    origin: item.origin,
    difficulty: item.difficulty,
    diagnostic: item.diagnostic,
    seenBefore: item.seenBefore,
  }));

  return {
    version: 1,
    targetId: w.id,
    subject: w.subject,
    topic: w.topic,
    subTopicId: w.subTopicId,
    title: w.title,
    detail: w.detail,
    band: w.band,
    kind: w.kind,
    misconceptionId: w.misconceptionId,
    steps,
    createdAt: now,
  };
}

// ---------------------------------------------------------------------------
// Walking
// ---------------------------------------------------------------------------

export function startProgress(targetId: string, now: number): FixProgress {
  return {
    targetId,
    answered: [],
    misses: 0,
    reteachShown: false,
    reliefPending: false,
    startedAt: now,
    updatedAt: now,
    status: 'active',
  };
}

function remainingSteps(path: FixPath, progress: FixProgress): FixStep[] {
  const done = new Set(progress.answered.map((a) => a.questionId));
  return path.steps.filter((s) => !done.has(s.questionId));
}

/**
 * What to render now.
 *
 * The next question is SELECTED, not walked in order: the ladder escalates one
 * rung per correct answer from a rung below the band, and collapses to the
 * easiest remaining question straight after a re-teach. A fixed cursor would
 * hand a student who just failed twice the hardest question in the path.
 */
export function decideNext(path: FixPath, progress: FixProgress): FixDecision {
  if (progress.status === 'healed') return { kind: 'healed' };
  if (progress.status === 'paused') {
    return { kind: 'paused', reason: progress.pauseReason ?? 'too-many-misses' };
  }

  const remaining = remainingSteps(path, progress);
  if (remaining.length === 0) return { kind: 'paused', reason: 'out-of-supply' };

  const position = progress.answered.length + 1;
  const total = path.steps.length;

  let step: FixStep;
  if (progress.reliefPending) {
    step = remaining.reduce((a, b) => (rankOf(a.difficulty) <= rankOf(b.difficulty) ? a : b));
    if (!progress.reteachShown) return { kind: 'reteach', step, position, total };
  } else {
    const targetRank = Math.min(
      RANK_DIFFICULTY.length - 1,
      Math.max(0, rankOf(path.band) - 1 + progress.answered.filter((a) => a.correct).length),
    );
    step =
      remaining.find((s) => rankOf(s.difficulty) >= targetRank) ??
      remaining.reduce((a, b) => (rankOf(a.difficulty) >= rankOf(b.difficulty) ? a : b));
  }

  return { kind: 'question', step, position, total };
}

/** The student read the re-teach card. The relief question is still pending. */
export function dismissReteach(progress: FixProgress, now: number): FixProgress {
  if (!progress.reliefPending || progress.reteachShown) return progress;
  return { ...progress, reteachShown: true, updatedAt: now };
}

/**
 * Record one answered question and recompute the session state.
 *
 * Healing = HEAL_CORRECT correct answers in the session, whatever the order.
 * The selector still escalates one rung per correct answer, so the third
 * correct answer is at or above the band whenever the path has such a rung.
 */
export function recordFixAnswer(
  path: FixPath,
  progress: FixProgress,
  questionId: string,
  correct: boolean,
  now: number,
): FixProgress {
  if (progress.status !== 'active') return progress;
  if (progress.answered.some((a) => a.questionId === questionId)) return progress;

  const step = path.steps.find((s) => s.questionId === questionId);
  const rank = step ? rankOf(step.difficulty) : rankOf(path.band);

  const next: FixProgress = {
    ...progress,
    answered: [...progress.answered, { questionId, correct, rank, ts: now }],
    updatedAt: now,
    // A question was served, so whatever relief was pending has been spent.
    reliefPending: false,
  };

  if (correct) {
    if (next.answered.filter((a) => a.correct).length >= HEAL_CORRECT) {
      next.status = 'healed';
      return next;
    }
  } else {
    next.misses = progress.misses + 1;
    if (next.misses >= MAX_MISSES) {
      next.status = 'paused';
      next.pauseReason = 'too-many-misses';
      return next;
    }
    if (next.misses >= RETEACH_AFTER_MISSES && !next.reteachShown) {
      next.reliefPending = true;
    }
  }

  if (remainingSteps(path, next).length === 0) {
    next.status = 'paused';
    next.pauseReason = 'out-of-supply';
  }
  return next;
}

export type FixSummary = {
  answered: number;
  correct: number;
  misses: number;
  healed: boolean;
  status: FixProgress['status'];
};

export function summarise(progress: FixProgress): FixSummary {
  return {
    answered: progress.answered.length,
    correct: progress.answered.filter((a) => a.correct).length,
    misses: progress.misses,
    healed: progress.status === 'healed',
    status: progress.status,
  };
}
