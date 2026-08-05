/**
 * remediation/store.ts — the ONE thing in this feature that is persisted.
 *
 * Weakness detection is derived from the answer log on every read, exactly like
 * lib/cognition, so a diagnosis can never drift from the evidence behind it. The
 * PATH is the deliberate exception: a student halfway through a five-question
 * repair must not have it rebuilt under them because their last answer changed
 * the ranking. So the chosen ids and the walk through them are stored, and
 * nothing else is.
 *
 * Also stored: which weaknesses have been repaired, so a closed one stops being
 * recommended for HEAL_SUPPRESSION_DAYS and so the progress board can show real
 * "you fixed these" history rather than a claim.
 *
 * localStorage only — works logged-out, costs nothing, same as every other store
 * in the app. Writes fire `bagrut-state-dirty` so lib/sync picks them up on the
 * next push, matching lib/results and lib/roadmap-progress.
 */

import type { FixPath, FixProgress, HealedRecord } from './types';

const STORAGE_KEY = 'bagrut-fix-v1';
const MAX_HISTORY = 50;
/** An untouched session this old is abandoned, not paused. */
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

type FixStore = {
  version: 1;
  active: { path: FixPath; progress: FixProgress } | null;
  /** targetId → healedAt. Read by the detector to suppress repaired weaknesses. */
  healed: Record<string, number>;
  history: HealedRecord[];
};

const EMPTY: FixStore = { version: 1, active: null, healed: {}, history: [] };

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStore(): FixStore {
  if (!isBrowser()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<FixStore>;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    return {
      version: 1,
      active: parsed.active ?? null,
      healed: parsed.healed ?? {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeStore(store: FixStore) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event('bagrut-state-dirty'));
  } catch {
    /* quota / disabled — the feature degrades to "no resume", not to broken */
  }
}

export type ActiveFix = { path: FixPath; progress: FixProgress };

/** The live session, or null. A session untouched for days is dropped. */
export function getActiveFix(now: number = Date.now()): ActiveFix | null {
  const store = readStore();
  const active = store.active;
  if (!active) return null;
  if (now - active.progress.updatedAt > STALE_AFTER_MS) {
    writeStore({ ...store, active: null });
    return null;
  }
  return active;
}

export function setActiveFix(path: FixPath, progress: FixProgress): void {
  writeStore({ ...readStore(), active: { path, progress } });
}

export function clearActiveFix(): void {
  writeStore({ ...readStore(), active: null });
}

/** targetId → healedAt, for `detectWeaknesses`. */
export function getHealedMap(): Record<string, number> {
  return readStore().healed;
}

/** Close a repaired weakness: suppress it, log it, and end the session. */
export function markHealed(record: HealedRecord): void {
  const store = readStore();
  const history = [record, ...store.history.filter((h) => h.targetId !== record.targetId)];
  writeStore({
    version: 1,
    active: null,
    healed: { ...store.healed, [record.targetId]: record.healedAt },
    history: history.slice(0, MAX_HISTORY),
  });
}

/** Repaired weaknesses, newest first — real evidence of improvement. */
export function healedHistory(limit = MAX_HISTORY): HealedRecord[] {
  return readStore().history.slice(0, limit);
}

export function healedCountSince(since: number): number {
  return readStore().history.filter((h) => h.healedAt >= since).length;
}

/** Test/debug escape hatch — never called from the UI. */
export function clearFixStore(): void {
  writeStore(EMPTY);
}
