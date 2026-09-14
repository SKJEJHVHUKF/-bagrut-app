/**
 * level-run-resume.ts — the unfinished play of a rung, persisted and synced.
 *
 * Owner, 2026-09-14: "תלמיד באמצע לתרגל ... ברמת אתגר בשאלה 5 והוא יוצא ... שיוכל
 * לחזור בדיוק מאיפה שהוא עצר" — and, the same day, across devices for a signed-in
 * student, and mid-question (a wrong try, an opened hint). A rung's round lived
 * only in React state, so leaving the page restarted it.
 *
 * One entry per rung. `data` is whatever the rung needs to rebuild its screen
 * (RoadmapLevelRunner and BagrutLevel each own their shape); an entry WITHOUT
 * `data` is a tombstone — the round was graded — so a device still holding the
 * old round cannot resurrect it through sync. lib/sync/roadmap-sync merges
 * entries by `savedAt` (newest wins) into `learning_state.runs`.
 */

import { safeSetJSON } from '@/lib/storage';

export const RUNS_KEY = 'bagrut-level-run-v1';

export type RunEntry = { savedAt: number; data?: unknown };
export type RunStore = Record<string, RunEntry>;

/** Tombstones only need to outlive the other device's next sync. */
const TOMBSTONE_TTL_MS = 30 * 86_400_000;
/** A round untouched this long is not "where I stopped" any more. */
const RUN_TTL_MS = 120 * 86_400_000;

const runKey = (topic: string, subId: string, kind: string) => `${topic}::${subId}::${kind}`;

export function readRuns(): RunStore {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RUNS_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as RunStore) : {};
  } catch {
    return {};
  }
}

/** Newest entry per rung wins; stale entries and old tombstones are dropped. */
export function mergeRuns(a: RunStore, b: RunStore, now = Date.now()): RunStore {
  const out: RunStore = {};
  for (const [key, e] of [...Object.entries(a ?? {}), ...Object.entries(b ?? {})]) {
    if (!e || typeof e.savedAt !== 'number') continue;
    if (!out[key] || e.savedAt > out[key].savedAt) out[key] = e;
  }
  for (const [key, e] of Object.entries(out)) {
    const age = now - e.savedAt;
    if (age > (e.data === undefined ? TOMBSTONE_TTL_MS : RUN_TTL_MS)) delete out[key];
  }
  return out;
}

/** The `savedAt` each rung was last read or written at on THIS page — how a
 *  sync can tell that another device moved the round on since. */
const seen = new Map<string, number>();

function write(key: string, entry: RunEntry) {
  const store = mergeRuns(readRuns(), {});
  store[key] = entry;
  seen.set(key, entry.savedAt);
  if (safeSetJSON(RUNS_KEY, store)) window.dispatchEvent(new Event('bagrut-state-dirty'));
}

/** JSON with sorted keys and no undefined fields. Postgres `jsonb` reorders
 *  keys, so a round that came back through sync must still compare equal to
 *  the same round re-reported by the screen. */
export function canonical(v: unknown): string {
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.keys(val).sort().map((k) => [k, (val as Record<string, unknown>)[k]]))
      : val,
  );
}

/**
 * Persist a rung's round. A write identical to what is stored is skipped — on
 * purpose, not as an optimisation: re-saving a restored round with a fresh
 * `savedAt` would make a stale device's copy beat the newer one on sync.
 */
export function saveRun(topic: string, subId: string, kind: string, data: unknown) {
  const key = runKey(topic, subId, kind);
  const prev = readRuns()[key];
  if (prev?.data !== undefined && canonical(prev.data) === canonical(data)) return;
  write(key, { savedAt: Date.now(), data });
}

/** The round was graded — leave a tombstone so no device resumes it. */
export function clearRun(topic: string, subId: string, kind: string) {
  const key = runKey(topic, subId, kind);
  if (readRuns()[key]?.data === undefined) return;
  write(key, { savedAt: Date.now() });
}

/** The stored round for a rung (null when none or graded). */
export function loadRun(topic: string, subId: string, kind: string): unknown | null {
  const key = runKey(topic, subId, kind);
  const e = readRuns()[key];
  if (e) seen.set(key, e.savedAt);
  return e?.data ?? null;
}

/**
 * After a sync: did another device change this rung since this page last looked?
 * `undefined` = no change; `null` = it was graded there; otherwise the new data.
 */
export function loadRunIfNewer(topic: string, subId: string, kind: string): unknown | null | undefined {
  const key = runKey(topic, subId, kind);
  const e = readRuns()[key];
  if (!e || e.savedAt <= (seen.get(key) ?? 0)) return undefined;
  seen.set(key, e.savedAt);
  return e.data ?? null;
}

/** The most recently touched unfinished round anywhere — the "continue" target. */
export function latestRun(): { topic: string; subId: string; kind: string; pos?: number } | null {
  let best: [string, RunEntry] | null = null;
  for (const entry of Object.entries(readRuns())) {
    if (entry[1]?.data === undefined) continue;
    if (!best || entry[1].savedAt > best[1].savedAt) best = entry;
  }
  if (!best) return null;
  const [topic, subId, kind] = best[0].split('::');
  const pos = (best[1].data as { pos?: unknown }).pos;
  return topic && subId && kind ? { topic, subId, kind, ...(typeof pos === 'number' ? { pos } : {}) } : null;
}
