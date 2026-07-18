/**
 * roadmap-progress.ts — progress + unlock state for the learning roadmap.
 *
 * Own localStorage store (`bagrut-roadmap-v1`) tracking whether each node's
 * step-quiz was PASSED (2 of 3). Unlock rule: sequential WITHIN a topic (the
 * 6 topics are all open); a node unlocks when the previous node in its topic
 * is completed — OR the student already finished it via /practice.
 *
 * Two-way sync with the existing stores: passing a node also marks it done in
 * lib/progress + lib/study-plan (so /my-plan and /insights reflect it), and a
 * node is treated as completed if the existing `isSubTopicDone` is already
 * true (so returning students are never re-locked).
 */

import { isSubTopicDone, markSubTopicDone } from '@/lib/progress';
import { markStep } from '@/lib/study-plan';
import type { StepStatus } from '@/types/roadmap';

const STORAGE_KEY = 'bagrut-roadmap-v1';
const SUBJECT = 'math5';
/** Pass the step quiz with at least 2 of 3 correct. */
export const PASS_NUMERATOR = 2;
export const PASS_DENOMINATOR = 3;

type NodeRecord = {
  passed: boolean;
  bestScore?: number;
  total?: number;
  completedAt?: number;
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

/** Did the student pass this node's step quiz — OR already finish it in /practice? */
export function isNodePassed(topic: string, subId: string): boolean {
  const rec = readAll()[nodeKey(topic, subId)];
  if (rec?.passed) return true;
  // Generous: prior /practice completion counts as done (no re-locking).
  return isSubTopicDone(SUBJECT, topic, subId);
}

/** Whether a given score passes the gate (≥ 2 of 3). */
export function isPassingScore(score: number, total: number): boolean {
  if (total <= 0) return false;
  return score / total >= PASS_NUMERATOR / PASS_DENOMINATOR;
}

/**
 * Record a step-quiz result. If it passes the gate, mark the node completed
 * and sync to the existing progress stores.
 */
export function markNodePassed(topic: string, subId: string, score: number, total: number): boolean {
  const passed = isPassingScore(score, total);
  const store = readAll();
  const key = nodeKey(topic, subId);
  const prev = store[key];
  store[key] = {
    passed: passed || !!prev?.passed,
    bestScore: Math.max(score, prev?.bestScore ?? 0),
    total,
    completedAt: prev?.completedAt ?? (passed ? Date.now() : undefined),
  };
  writeAll(store);

  if (passed) {
    // One-way sync so /practice, /my-plan and /insights reflect the roadmap.
    markSubTopicDone(SUBJECT, topic, subId);
    markStep(SUBJECT, topic, 'practice');
  }
  return passed;
}

/**
 * Derive a node's status. `prevSubId` is the previous node in the SAME topic
 * (null if it's the topic's first node → always unlocked).
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
