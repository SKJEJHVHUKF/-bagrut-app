/**
 * level-run-resume.ts — the unfinished play of a practice rung, persisted.
 *
 * Owner, 2026-09-14: "תלמיד באמצע לתרגל ... ברמת אתגר בשאלה 5 והוא יוצא ... שיוכל
 * לחזור בדיוק מאיפה שהוא עצר". The runner's round (question position, answers,
 * running score) lived only in React state, so leaving the page restarted the
 * rung at question 1. One snapshot per rung, dropped when the round is graded.
 *
 * Own localStorage key; local to the device (not in the server sync set).
 */

import type { AnswerSnapshot } from '@/components/roadmap/QuestionRunnerCard';
import type { PracticeQuestion } from '@/content/lessons/types';
import { safeSetJSON } from '@/lib/storage';

const STORAGE_KEY = 'bagrut-level-run-v1';

export type LevelRun = {
  /** Question ids of the current round, in the order shown. */
  poolIds: string[];
  pos: number;
  roundCorrect: number;
  roundWrong: string[];
  baseCorrect: number;
  isRetry: boolean;
  answers: Record<string, AnswerSnapshot>;
  savedAt: number;
};

type Store = Record<string, LevelRun>;

const runKey = (topic: string, subId: string, kind: string) => `${topic}::${subId}::${kind}`;

function readAll(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

export function saveLevelRun(topic: string, subId: string, kind: string, run: LevelRun) {
  const store = readAll();
  store[runKey(topic, subId, kind)] = run;
  safeSetJSON(STORAGE_KEY, store);
}

export function clearLevelRun(topic: string, subId: string, kind: string) {
  const store = readAll();
  const key = runKey(topic, subId, kind);
  if (!(key in store)) return;
  delete store[key];
  safeSetJSON(STORAGE_KEY, store);
}

/**
 * The saved run for a rung, with its questions resolved — or null when there is
 * none, or when the rung's content changed since (an id no longer exists), in
 * which case a restart is the only honest option.
 */
export function loadLevelRun(
  topic: string,
  subId: string,
  kind: string,
  questions: PracticeQuestion[],
): (LevelRun & { pool: PracticeQuestion[] }) | null {
  const run = readAll()[runKey(topic, subId, kind)];
  if (!run || !Array.isArray(run.poolIds) || run.poolIds.length === 0) return null;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const pool = run.poolIds.map((id) => byId.get(id));
  if (pool.some((q) => !q) || run.pos < 0 || run.pos >= pool.length) return null;
  return { ...run, pool: pool as PracticeQuestion[] };
}

/** The most recently touched unfinished run anywhere — the "continue" target. */
export function latestLevelRun(): { topic: string; subId: string; kind: string; pos: number } | null {
  let best: { key: string; run: LevelRun } | null = null;
  for (const [key, run] of Object.entries(readAll())) {
    if (!best || run.savedAt > best.run.savedAt) best = { key, run };
  }
  if (!best) return null;
  const [topic, subId, kind] = best.key.split('::');
  return topic && subId && kind ? { topic, subId, kind, pos: best.run.pos } : null;
}
