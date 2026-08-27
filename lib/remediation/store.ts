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
import { safeSetJSON } from '@/lib/storage';

const STORAGE_KEY = 'bagrut-fix-v1';
const MAX_HISTORY = 50;
/** An untouched session this old is abandoned, not paused. */
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

type FixStore = {
  version: 1;
  active: { path: FixPath; progress: FixProgress } | null;
  /** targetId → healedAt. Read by the detector to suppress repaired weaknesses. */
  healed: Record<string, number>;
  /**
   * targetId → how many times this weakness has been repaired.
   *
   * `history` cannot answer this: it keeps one record per target so the board
   * shows current state, so a weakness repaired three times looks exactly like
   * one repaired once. That difference is the whole point — a weakness that
   * keeps coming back is a different problem from one that was fixed, and until
   * this counter existed the app threw the distinction away every time it
   * repaired something.
   */
  healCount: Record<string, number>;
  history: HealedRecord[];
};

const EMPTY: FixStore = { version: 1, active: null, healed: {}, healCount: {}, history: [] };

function mapValues<T, U>(o: Record<string, T>, f: (v: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]));
}

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
      // Absent for anyone who repaired something before this field existed.
      // Seeding from `healed` rather than `{}` keeps their history true: those
      // repairs happened, and starting them at zero would report a relapse as a
      // first-time weakness.
      healCount: parsed.healCount ?? mapValues(parsed.healed ?? {}, () => 1),
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeStore(store: FixStore) {
  if (!isBrowser()) return;
  if (!safeSetJSON(STORAGE_KEY, store)) return;
  window.dispatchEvent(new Event('bagrut-state-dirty'));
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

/** targetId → number of times repaired. Two or more means it came back. */
export function getHealCountMap(): Record<string, number> {
  return readStore().healCount;
}

/** Close a repaired weakness: suppress it, log it, count it, and end the session. */
export function markHealed(record: HealedRecord): void {
  const store = readStore();
  const history = [record, ...store.history.filter((h) => h.targetId !== record.targetId)];
  writeStore({
    version: 1,
    active: null,
    healed: { ...store.healed, [record.targetId]: record.healedAt },
    healCount: {
      ...store.healCount,
      [record.targetId]: (store.healCount[record.targetId] ?? 0) + 1,
    },
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
