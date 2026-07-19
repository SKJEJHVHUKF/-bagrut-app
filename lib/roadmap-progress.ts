/**
 * roadmap-progress.ts — progress + unlock state for the learning roadmap.
 *
 * Own localStorage store (`bagrut-roadmap-v1`). Each sub-topic node now tracks
 * a LEVEL LADDER (see lib/roadmap-levels.ts): per-rung `cleared` + `stars`.
 *
 * Unlock model:
 *   • Within a sub-topic — rungs unlock sequentially (rung N opens when N-1 is
 *     cleared). This is the "slow climb in level" the roadmap is built around.
 *   • Between sub-topics — the next sub-topic opens once THIS one is
 *     "core-done" (its learn+easy+mid rungs cleared). Hard + bagrut rungs are
 *     optional mastery, so the hardest question never blocks progress.
 *
 * Two-way sync: reaching core-done also marks the sub-topic done in
 * lib/progress + lib/study-plan (so /my-plan and /insights reflect it), and a
 * sub-topic already finished via /practice (`isSubTopicDone`) is treated as
 * core-done — its rungs open for replay, and returning students are never
 * re-locked.
 *
 * Backward compatible: legacy records (a bare `passed` flag from the old flat
 * step-quiz) still count as core-done.
 */

import { isSubTopicDone, markSubTopicDone } from '@/lib/progress';
import { markStep } from '@/lib/study-plan';
import { CORE_LEVELS, type RoadmapLevel, type RoadmapLevelKind } from '@/lib/roadmap-levels';
import type { StepStatus } from '@/types/roadmap';

const STORAGE_KEY = 'bagrut-roadmap-v1';
const SUBJECT = 'math5';
/** Legacy flat-quiz gate (kept for backward compatibility / mixed callers). */
export const PASS_NUMERATOR = 2;
export const PASS_DENOMINATOR = 3;

type LevelRecord = {
  cleared: boolean;
  /** Best stars (1-3) ever earned on this rung. */
  stars: number;
  bestScore?: number;
  total?: number;
  clearedAt?: number;
};

type NodeRecord = {
  /** Legacy / derived flag: the node's CORE rungs are done. */
  passed?: boolean;
  bestScore?: number;
  total?: number;
  completedAt?: number;
  /** Per-rung progress, keyed by level kind. */
  levels?: Partial<Record<RoadmapLevelKind, LevelRecord>>;
};
type RoadmapStore = Record<string, NodeRecord>;

function nodeKey(topic: string, subId: string) {
  return `${topic}::${subId}`;
}
function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): RoadmapStore {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as RoadmapStore) : {};
  } catch {
    return {};
  }
}
function writeAll(store: RoadmapStore) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / disabled — ignore
  }
}

// ============================================================
// Level-record accessors
// ============================================================

function levelRec(rec: NodeRecord | undefined, kind: RoadmapLevelKind): LevelRecord | undefined {
  return rec?.levels?.[kind];
}

/** Has this specific rung been cleared? */
export function isLevelCleared(topic: string, subId: string, kind: RoadmapLevelKind): boolean {
  return !!levelRec(readAll()[nodeKey(topic, subId)], kind)?.cleared;
}

/** Stars earned on a rung (0 if untouched). */
export function levelStars(topic: string, subId: string, kind: RoadmapLevelKind): number {
  return levelRec(readAll()[nodeKey(topic, subId)], kind)?.stars ?? 0;
}

/**
 * A node is "core-done" when every CORE rung it actually has is cleared — OR a
 * legacy `passed` flag is set — OR it was already finished via /practice.
 */
function computeCoreDone(rec: NodeRecord | undefined, topic: string, subId: string, levels: RoadmapLevel[]): boolean {
  if (rec?.passed) return true;
  if (isSubTopicDone(SUBJECT, topic, subId)) return true;
  const core = levels.filter((l) => CORE_LEVELS.includes(l.kind));
  if (core.length === 0) return false;
  return core.every((l) => !!levelRec(rec, l.kind)?.cleared);
}

/** Did the student ever record ANY level progress on this node? */
function hasLevelProgress(rec: NodeRecord | undefined): boolean {
  return !!rec?.levels && Object.values(rec.levels).some((l) => l?.cleared);
}

// ============================================================
// Status derivation
// ============================================================

/**
 * Status of a single rung. Sequential unlock inside the sub-topic. A node that
 * was completed BEFORE the ladder existed (legacy `passed` / `isSubTopicDone`
 * with no per-level records) has all its rungs unlocked for replay.
 */
export function levelStatus(
  topic: string,
  subId: string,
  level: RoadmapLevel,
  levels: RoadmapLevel[],
): StepStatus {
  const rec = readAll()[nodeKey(topic, subId)];
  if (levelRec(rec, level.kind)?.cleared) return 'COMPLETED';

  const legacyComplete =
    !hasLevelProgress(rec) && (!!rec?.passed || isSubTopicDone(SUBJECT, topic, subId));
  if (legacyComplete) return 'UNLOCKED';

  if (level.index === 0) return 'UNLOCKED';
  const prev = levels[level.index - 1];
  if (prev && levelRec(rec, prev.kind)?.cleared) return 'UNLOCKED';
  return 'LOCKED';
}

export type NodeLevelSummary = {
  clearedCount: number;
  totalLevels: number;
  stars: number;
  maxStars: number;
  xp: number;
  coreDone: boolean;
  mastered: boolean;
  /** Index of the next rung to climb (== totalLevels when all cleared). */
  currentIndex: number;
  /** Node was completed before the ladder existed (offer replay, not re-lock). */
  legacyComplete: boolean;
};

/** Aggregate a node's ladder progress for the map + the ladder header. */
export function nodeLevelSummary(topic: string, subId: string, levels: RoadmapLevel[]): NodeLevelSummary {
  const rec = readAll()[nodeKey(topic, subId)];
  let clearedCount = 0;
  let stars = 0;
  let xp = 0;
  let currentIndex = levels.length;
  levels.forEach((l, i) => {
    const lr = levelRec(rec, l.kind);
    if (lr?.cleared) {
      clearedCount++;
      stars += lr.stars ?? 0;
      xp += l.xp;
    } else if (i < currentIndex) {
      currentIndex = i;
    }
  });
  const coreDone = computeCoreDone(rec, topic, subId, levels);
  const mastered = levels.length > 0 && clearedCount === levels.length;
  const legacyComplete = !hasLevelProgress(rec) && (!!rec?.passed || isSubTopicDone(SUBJECT, topic, subId));
  return {
    clearedCount,
    totalLevels: levels.length,
    stars,
    maxStars: levels.length * 3,
    xp,
    coreDone,
    mastered,
    currentIndex,
    legacyComplete,
  };
}

// ============================================================
// Mutation
// ============================================================

export type ClearResult = {
  firstClear: boolean;
  xpGained: number;
  stars: number;
  coreDone: boolean;
  /** True only on the transition INTO core-done (for celebration). */
  justCoreDone: boolean;
  mastered: boolean;
  justMastered: boolean;
};

/**
 * Record a cleared rung. Keeps the best stars, awards XP on first clear, and —
 * when the core rungs are all cleared — marks the whole sub-topic done and
 * syncs to the existing progress stores (so the next sub-topic unlocks).
 */
export function markLevelCleared(
  topic: string,
  subId: string,
  level: RoadmapLevel,
  levels: RoadmapLevel[],
  stars: number,
  score: number,
  total: number,
): ClearResult {
  const store = readAll();
  const key = nodeKey(topic, subId);
  const rec: NodeRecord = store[key] ?? {};
  const prevLevels = rec.levels ?? {};
  const prev = prevLevels[level.kind];

  const wasCoreDone = computeCoreDone(rec, topic, subId, levels);
  const prevCleared = levels.filter((l) => !!prevLevels[l.kind]?.cleared).length;
  const wasMastered = levels.length > 0 && prevCleared === levels.length;

  const firstClear = !prev?.cleared;
  const bestStars = Math.max(stars, prev?.stars ?? 0);

  const nextLevels: NodeRecord['levels'] = {
    ...prevLevels,
    [level.kind]: {
      cleared: true,
      stars: bestStars,
      bestScore: Math.max(score, prev?.bestScore ?? 0),
      total,
      clearedAt: prev?.clearedAt ?? Date.now(),
    },
  };

  const merged: NodeRecord = { ...rec, levels: nextLevels };
  const coreDone = computeCoreDone(merged, topic, subId, levels);
  const nowCleared = levels.filter((l) => !!nextLevels[l.kind]?.cleared).length;
  const mastered = levels.length > 0 && nowCleared === levels.length;

  if (coreDone && !merged.passed) {
    merged.passed = true;
    merged.completedAt = merged.completedAt ?? Date.now();
  }

  store[key] = merged;
  writeAll(store);

  // Sync to the legacy stores the first time we reach core-done.
  if (coreDone && !wasCoreDone) {
    markSubTopicDone(SUBJECT, topic, subId);
    markStep(SUBJECT, topic, 'practice');
  }

  return {
    firstClear,
    xpGained: firstClear ? level.xp : 0,
    stars: bestStars,
    coreDone,
    justCoreDone: coreDone && !wasCoreDone,
    mastered,
    justMastered: mastered && !wasMastered,
  };
}

// ============================================================
// Node-level helpers (used by the map) — unchanged public API
// ============================================================

/** Whether a given score passes the legacy gate (≥ 2 of 3). */
export function isPassingScore(score: number, total: number): boolean {
  if (total <= 0) return false;
  return score / total >= PASS_NUMERATOR / PASS_DENOMINATOR;
}

/**
 * Is this node complete (its next sibling should be unlocked)? True on legacy
 * `passed`, on a prior /practice completion, or once the core rungs are done —
 * `markLevelCleared` sets `passed` at that moment, so this stays cheap.
 */
export function isNodePassed(topic: string, subId: string): boolean {
  const rec = readAll()[nodeKey(topic, subId)];
  if (rec?.passed) return true;
  return isSubTopicDone(SUBJECT, topic, subId);
}

/**
 * Derive a node's status on the map. `prevSubId` is the previous node in the
 * SAME topic (null if it's the topic's first node → always unlocked).
 */
export function nodeStatus(topic: string, subId: string, prevSubId: string | null): StepStatus {
  if (isNodePassed(topic, subId)) return 'COMPLETED';
  if (prevSubId === null) return 'UNLOCKED';
  if (isNodePassed(topic, prevSubId)) return 'UNLOCKED';
  return 'LOCKED';
}

/** How many of the given nodes are completed. */
export function countCompleted(nodes: { topic: string; subId: string }[]): number {
  return nodes.filter((n) => isNodePassed(n.topic, n.subId)).length;
}

/** Completion percent (0-100) for a set of nodes. */
export function progressPct(nodes: { topic: string; subId: string }[]): number {
  if (nodes.length === 0) return 0;
  return Math.round((countCompleted(nodes) / nodes.length) * 100);
}
