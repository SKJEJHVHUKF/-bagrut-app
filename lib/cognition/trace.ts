/**
 * cognition/trace.ts — knowledge tracing (BKT-lite + forgetting).
 *
 * WHY BKT AND NOT A WEIGHTED ACCURACY RATIO
 * Most of this bank is 4-option MCQ, so a student who knows nothing still
 * scores ~25%. A ratio cannot tell "got it right" from "got it right by
 * elimination"; BKT models the guess explicitly and is four constants and one
 * update rule. It also yields a probability, which makes CONFIDENCE a separate,
 * honest quantity — the difference between "this student is weak at X" and "we
 * have no idea about X" is the difference between a useful diagnosis and an
 * accusation. Anything heavier (deep knowledge tracing, IRT calibration) needs
 * a population of students we do not have.
 *
 * Pure. The clock is always a parameter — nothing here calls Date.now().
 */

import type { Skill } from '@/content/cognition/types';
import type { MasteryState, Observation, SkillMastery, SkillId } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** P(answers wrong | knows it). Careless slips happen. */
export const P_SLIP = 0.1;
/** P(knowledge is acquired between one attempt and the next). */
export const P_TRANSIT = 0.15;

/** Prior P(known) before any evidence, by the skill's typical difficulty. */
export const PRIOR_BY_BAND: Record<Skill['band'], number> = {
  easy: 0.35,
  mid: 0.25,
  hard: 0.15,
};

/**
 * Half-life of retention, in days. After 21 idle days a skill's probability has
 * moved half-way back to its prior. Chosen to sit alongside the Leitner ladder
 * in lib/review.ts, whose top boxes are 16 and 35 days.
 */
export const DECAY_HALF_LIFE_DAYS = 21;

/** Recency weight for counting evidence — same half-life, so the two agree. */
function recencyWeight(ts: number, now: number): number {
  const days = Math.max(0, (now - ts) / DAY);
  return Math.pow(2, -days / DECAY_HALF_LIFE_DAYS);
}

/**
 * P(correct | doesn't know it) for one observation.
 *  • MCQ            → 1/optionCount (0.25 on the usual four).
 *  • open, graded   → 0.05. Typing a right answer by accident is near-zero.
 *  • open, self-report → 0.15. The student marks their own paper; in this topic
 *    NO open question ships an `expected` spec, so every open answer takes this
 *    branch today.
 *  • replay         → floored at 0.5. Re-answering a question already seen can
 *    be pure recall of the answer, not of the method.
 */
export function guessFor(o: Observation): number {
  let guess: number;
  if (o.kind === 'mcq') {
    const n = o.optionCount && o.optionCount > 1 ? o.optionCount : 4;
    guess = 1 / n;
  } else {
    guess = o.source === 'review' ? 0.1 : 0.15;
  }
  if (o.isReplay) guess = Math.max(guess, 0.5);
  return Math.min(guess, 0.9);
}

/** One Bayesian update + the learning step. Exported for the unit tests. */
export function bktUpdate(p: number, correct: boolean, guess: number): number {
  const slip = P_SLIP;
  const posterior = correct
    ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess)
    : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  const safe = Number.isFinite(posterior) ? Math.min(Math.max(posterior, 0), 1) : p;
  // Learning: the attempt itself is an opportunity to acquire the skill.
  return safe + (1 - safe) * P_TRANSIT;
}

/** Pull a probability back toward its prior as time passes. */
export function decay(p: number, prior: number, elapsedMs: number): number {
  const days = Math.max(0, elapsedMs / DAY);
  const keep = Math.pow(2, -days / DECAY_HALF_LIFE_DAYS);
  return prior + (p - prior) * keep;
}

/**
 * The confidence below which we refuse to classify a skill at all.
 *
 * With `confidence = 1 - e^(-effectiveN/3)` this sits between two and three
 * recent observations (n=2 → 0.49, n=3 → 0.63), which is the intended bar: two
 * answers is a coincidence, three is a pattern. Getting this wrong in the
 * permissive direction is the expensive mistake — it turns "we have not
 * measured this" into "you are weak at this", printed under the student's name.
 */
export const MIN_CONFIDENCE = 0.5;

export function classify(p: number, confidence: number): MasteryState {
  if (confidence < MIN_CONFIDENCE) return 'unknown';
  if (p < 0.5) return 'fragile';
  if (p < 0.8) return 'developing';
  return 'mastered';
}

/** Direction of travel: the last 3 observations against the 3 before them. */
function trendOf(obs: Observation[]): SkillMastery['trend'] {
  if (obs.length < 4) return 'flat';
  const recent = obs.slice(-3);
  const before = obs.slice(-6, -3);
  if (before.length === 0) return 'flat';
  const rate = (xs: Observation[]) => xs.filter((o) => o.correct).length / xs.length;
  const d = rate(recent) - rate(before);
  if (d > 0.2) return 'up';
  if (d < -0.2) return 'down';
  return 'flat';
}

/**
 * Trace one skill. Observations must be chronological.
 *
 * Two modifiers on top of plain BKT:
 *  • a correct answer AFTER the hint was revealed skips the Bayesian step and
 *    applies half the learning step — being right with help is not evidence of
 *    independent mastery, but it is not nothing either;
 *  • decay is applied BETWEEN observations as well as at the end, so a gap in
 *    the middle of the history is modelled the same as a gap at the end.
 */
export function traceSkill(
  skill: Skill,
  observations: Observation[],
  now: number,
): SkillMastery {
  const prior = PRIOR_BY_BAND[skill.band];
  let p = prior;
  let lastTs = 0;
  let effectiveN = 0;

  for (const o of observations) {
    if (lastTs > 0) p = decay(p, prior, o.ts - lastTs);

    if (o.correct && o.hintUsed) {
      p = p + (1 - p) * (P_TRANSIT / 2);
    } else {
      p = bktUpdate(p, o.correct, guessFor(o));
    }

    lastTs = o.ts;
    effectiveN += recencyWeight(o.ts, now) * (o.isReplay ? 0.5 : 1);
  }

  if (lastTs > 0) p = decay(p, prior, now - lastTs);

  const confidence = 1 - Math.exp(-effectiveN / 3);
  return {
    skillId: skill.id,
    title: skill.title,
    p: Math.min(Math.max(p, 0), 1),
    state: classify(p, confidence),
    observations: observations.length,
    effectiveN,
    confidence,
    lastTs,
    trend: trendOf(observations),
  };
}

/** Trace every skill in the catalog. Skills with no evidence still appear —
 *  at their prior, `unknown`, confidence 0 — so callers never special-case. */
export function traceAll(
  skills: Skill[],
  observations: Observation[],
  now: number,
): SkillMastery[] {
  const bySkill = new Map<SkillId, Observation[]>();
  for (const o of observations) {
    const list = bySkill.get(o.skillId);
    if (list) list.push(o);
    else bySkill.set(o.skillId, [o]);
  }
  return skills.map((s) => traceSkill(s, bySkill.get(s.id) ?? [], now));
}
