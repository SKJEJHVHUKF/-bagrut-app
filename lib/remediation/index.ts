/**
 * remediation/index.ts — the browser-facing API of the fix loop.
 *
 * Everything below is a thin wrapper that reads the existing stores and calls
 * the pure functions. The split is the same one lib/cognition uses and for the
 * same reason: the logic is testable with a fixed clock and a synthetic answer
 * log, and the browser layer has nothing in it worth testing.
 *
 * Typical call sequence from the UI:
 *
 *   getTopWeakness('math5')            → is there anything to fix?
 *   startFix(targetId)                 → build or resume the path
 *   decideNext(path, progress)         → render a question / re-teach / summary
 *   submitFixAnswer(questionId, ok)    → advance; auto-closes on repair
 */

import { getMistakes } from '@/lib/mistakes';
import { getResults, type ResultEvent } from '@/lib/results';
import {
  detectWeaknesses,
  findMisconception,
  topWeakness as pureTopWeakness,
  type DetectInput,
} from './detect';
import { buildFixPath, recordFixAnswer, startProgress, summarise } from './path';
import { buildSupply } from './supply';
import {
  clearActiveFix,
  getActiveFix,
  getHealedMap,
  markHealed,
  setActiveFix,
  type ActiveFix,
} from './store';
import type { Weakness } from './types';

export * from './types';
export {
  detectWeaknesses,
  findWeakness,
  findMisconception,
  subTopicTargetId,
  misconceptionTargetId,
  MIN_ATTEMPTS,
  MAX_ACCURACY,
  MIN_CONFIDENCE,
  HEAL_SUPPRESSION_DAYS,
} from './detect';
export {
  buildFixPath,
  decideNext,
  dismissReteach,
  recordFixAnswer,
  startProgress,
  summarise,
  HEAL_STREAK,
  MIN_ANSWERED_TO_HEAL,
  MAX_MISSES,
  MAX_STEPS,
  MIN_STEPS,
  RETEACH_AFTER_MISSES,
} from './path';
export { buildSupply, resolveFixQuestion, type SupplyItem } from './supply';
export {
  clearActiveFix,
  getActiveFix,
  getHealedMap,
  healedCountSince,
  healedHistory,
  markHealed,
  setActiveFix,
  type ActiveFix,
} from './store';

/** Every question id the student has already answered, from the raw log. */
export function answeredIds(events: ResultEvent[]): Set<string> {
  const out = new Set<string>();
  for (const e of events) if (e.questionId) out.add(e.questionId);
  return out;
}

function detectInput(subject: string, now: number): DetectInput {
  return {
    subject,
    events: getResults(subject),
    mistakes: getMistakes(subject),
    now,
    healed: getHealedMap(),
  };
}

/** Ranked weaknesses for this subject. Empty when the evidence is too thin. */
export function getWeaknesses(subject: string, now: number = Date.now()): Weakness[] {
  return detectWeaknesses(detectInput(subject, now));
}

/** The single most worthwhile repair right now, or null. */
export function getTopWeakness(subject: string, now: number = Date.now()): Weakness | null {
  return pureTopWeakness(detectInput(subject, now));
}

export type StartFixResult =
  | { ok: true; fix: ActiveFix; resumed: boolean }
  | { ok: false; reason: 'unknown-target' | 'no-supply' };

/**
 * Resume the live session for `targetId`, or build a new one.
 *
 * Building can genuinely fail: a sub-topic with a thin bank and no concept bank
 * may not yield MIN_STEPS questions. That returns `no-supply` so the page can
 * say so, rather than presenting a two-question stub as a repair path.
 */
export function startFix(
  targetId: string,
  subject: string,
  now: number = Date.now(),
  /** The question that triggered this — pushed to the back of the supply. */
  triggeredBy?: string,
): StartFixResult {
  const existing = getActiveFix(now);
  if (existing && existing.path.targetId === targetId && existing.progress.status === 'active') {
    return { ok: true, fix: existing, resumed: true };
  }

  const input = detectInput(subject, now);
  const weakness = detectWeaknesses(input).find((w) => w.id === targetId);
  if (!weakness) return { ok: false, reason: 'unknown-target' };

  const supply = buildSupply(weakness, {
    answeredIds: answeredIds(input.events),
    deprioritise: triggeredBy ? new Set([triggeredBy]) : undefined,
  });
  const path = buildFixPath(weakness, supply, now);
  if (!path) return { ok: false, reason: 'no-supply' };

  const progress = startProgress(targetId, now);
  setActiveFix(path, progress);
  return { ok: true, fix: { path, progress }, resumed: false };
}

/**
 * Record one answer inside the live session and persist the new state. Closing
 * the weakness is handled here so no caller can forget it — a repair that is
 * not written down is a repair the student gets asked to do again tomorrow.
 */
export function submitFixAnswer(
  questionId: string,
  correct: boolean,
  now: number = Date.now(),
): ActiveFix | null {
  const active = getActiveFix(now);
  if (!active) return null;

  const progress = recordFixAnswer(active.path, active.progress, questionId, correct, now);
  const next: ActiveFix = { path: active.path, progress };

  if (progress.status === 'healed') {
    const s = summarise(progress);
    markHealed({
      targetId: active.path.targetId,
      title: active.path.title,
      subject: active.path.subject,
      topic: active.path.topic,
      healedAt: now,
      answered: s.answered,
    });
    // markHealed clears the active slot; the caller still renders from `next`.
    return next;
  }

  setActiveFix(active.path, progress);
  return next;
}

/** Persist "the student read the re-teach card". */
export function consumeReteach(now: number = Date.now()): ActiveFix | null {
  const active = getActiveFix(now);
  if (!active) return null;
  const progress = { ...active.progress, reteachShown: true, updatedAt: now };
  setActiveFix(active.path, progress);
  return { path: active.path, progress };
}

/** Abandon the live session without recording a repair. */
export function abandonFix(): void {
  clearActiveFix();
}

/** Resolve the question a step points at (null when content was renamed). */
export { resolveFixQuestion as resolveStepQuestion } from './supply';

/**
 * The catalog text behind a misconception target, for the re-teach card. Null
 * for coarse targets — those re-teach from the question's own solution instead.
 */
export function misconceptionInsight(misconceptionId: string | undefined): string | null {
  if (!misconceptionId) return null;
  return findMisconception(misconceptionId)?.mc.insight ?? null;
}
