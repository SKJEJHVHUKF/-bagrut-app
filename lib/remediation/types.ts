/**
 * remediation/types.ts — the contract for the auto-correction loop.
 *
 * The product gap this closes: today a wrong answer produces an explanation and
 * a review card for tomorrow. Nothing brings the student the SEQUENCE that
 * repairs the specific thing that broke, now. A `FixPath` is that sequence.
 *
 * Two design rules the rest of the module exists to honour:
 *
 * 1. ONE weakness type, TWO resolutions. When a topic has a
 *    `content/cognition` catalog the weakness is a named misconception
 *    (`kind: 'misconception'`); everywhere else it is a sub-topic plus the
 *    student's dominant error category (`kind: 'subtopic'`). Both produce the
 *    same `Weakness` shape, so every consumer — detector, supply, path, UI,
 *    gate — is written once and sharpens automatically as catalogs are added.
 *
 * 2. The PATH is stored, everything else is derived. lib/cognition proved that
 *    deriving state from the answer log removes a whole class of drift bugs, and
 *    that is kept here for weakness detection. The exception is the path itself:
 *    a student walking a 5-question sequence must not have it re-shuffled under
 *    them because their last answer changed the ranking. So the chosen question
 *    ids and the progress through them are persisted (lib/remediation/store);
 *    the diagnosis, the supply and every decision remain pure functions.
 */

import type { ErrorCategory } from '@/lib/mistakes';

export type Difficulty = 'easy' | 'mid' | 'hard';

/** easy < mid < hard, as a number, so "one rung below" is arithmetic. */
export const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, mid: 1, hard: 2 };
export const RANK_DIFFICULTY: Difficulty[] = ['easy', 'mid', 'hard'];

export function rankOf(d: Difficulty): number {
  return DIFFICULTY_RANK[d];
}

export type WeaknessKind = 'misconception' | 'subtopic';

/**
 * One thing worth repairing, ranked against all the others.
 *
 * `id` is URL-safe and stable: `mc:<misconceptionId>` or `st:<subTopicId>`.
 * Sub-topic ids are unique across the whole curriculum (that is what makes
 * `/roadmap/[lessonId]` resolvable without a topic), so the id alone is enough
 * to rebuild subject/topic — see `resolveWeaknessId` in ./detect.
 */
export type Weakness = {
  id: string;
  kind: WeaknessKind;
  subject: string;
  topic: string;
  /** Where the repair happens. For a misconception this is `remedy.subTopicId`. */
  subTopicId: string;
  /** Student-facing name of what is being fixed. */
  title: string;
  /** One Hebrew sentence naming the evidence. Never a guess dressed as a fact. */
  detail: string;
  /** The difficulty the student broke at — the path is centred on it. */
  band: Difficulty;
  /** How sure we are this is real (0..1). Below MIN_CONFIDENCE we say nothing. */
  confidence: number;
  /** Ranking score. Only meaningful relative to other weaknesses. */
  score: number;
  /** Times the student got this wrong. */
  hits: number;
  /** Times they were in a position to. `hits/opportunities` is the honest rate. */
  opportunities: number;
  lastTs: number;
  /**
   * This weakness was repaired before and the evidence since says it is back.
   *
   * A chronic weakness is not a bigger version of a normal one — it is a
   * different finding. The ordinary repair path has already been run on it and
   * did not hold, so it outranks a first-time weakness of equal size and the
   * report names it separately.
   */
  chronic?: boolean;
  /** How many times it has been repaired. Only set when `chronic`. */
  relapses?: number;
  /** Present only for `kind: 'misconception'`. */
  misconceptionId?: string;
  /** Present only for `kind: 'subtopic'`, when the notebook has enough signal. */
  category?: ErrorCategory;
};

/**
 * Where a fix-path question came from. Recorded so the gate can prove supply.
 *
 * `generated` is the one origin whose questions the student has provably never
 * seen: it is built on demand by `lib/generator` from a parameterised template,
 * and its id carries the seed that rebuilds it. The other three all draw from
 * material the learning path already walked them through — which is exactly the
 * problem `generated` exists to fix, so it outranks them in `supply.ts`.
 */
export type FixStepOrigin = 'generated' | 'subtopic-bank' | 'lesson-drill' | 'concept-bank';

export type FixStep = {
  questionId: string;
  origin: FixStepOrigin;
  difficulty: Difficulty;
  /** The question carries an authored trigger for the target misconception —
   *  answering it is a direct test of the thing being repaired, not a proxy. */
  diagnostic: boolean;
  /** The student has answered this question before (weaker, but still supply). */
  seenBefore: boolean;
};

/** The built sequence. Immutable once created; progress lives beside it. */
export type FixPath = {
  version: 1;
  targetId: string;
  subject: string;
  topic: string;
  subTopicId: string;
  title: string;
  detail: string;
  band: Difficulty;
  kind: WeaknessKind;
  misconceptionId?: string;
  /** 3-5 steps, ordered easiest → hardest. The runner does NOT walk them in
   *  order — `decideNext` selects from the remaining ones by state. */
  steps: FixStep[];
  createdAt: number;
};

export type FixStatus = 'active' | 'healed' | 'paused';
export type PauseReason = 'too-many-misses' | 'out-of-supply';

export type FixAnswer = {
  questionId: string;
  correct: boolean;
  rank: number;
  ts: number;
};

/** Everything that changes while the student walks the path. */
export type FixProgress = {
  targetId: string;
  answered: FixAnswer[];
  misses: number;
  /** The re-teach card has already been shown once this session. */
  reteachShown: boolean;
  /** The next question should be the EASIEST remaining, not the next rung. */
  reliefPending: boolean;
  startedAt: number;
  updatedAt: number;
  status: FixStatus;
  pauseReason?: PauseReason;
};

/** What the runner should render right now. */
export type FixDecision =
  | { kind: 'question'; step: FixStep; position: number; total: number }
  | { kind: 'reteach'; step: FixStep; position: number; total: number }
  | { kind: 'healed' }
  | { kind: 'paused'; reason: PauseReason };

/** A repaired weakness, kept so it stops being recommended for a while. */
export type HealedRecord = {
  targetId: string;
  title: string;
  subject: string;
  topic: string;
  healedAt: number;
  /** Questions answered in the session that closed it. */
  answered: number;
};
