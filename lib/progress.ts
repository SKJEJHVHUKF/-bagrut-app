// Client-side learning progress, persisted to localStorage.
//
// We deliberately avoid a server-side table for this — the data is per-device
// and low-stakes ("which lessons did I open?"). If a user clears their browser
// state they lose the badges, which is fine.

const STORAGE_KEY = 'bagrut-progress-v1';

type TopicProgress = {
  viewedAt?: number;             // ms epoch when the lesson page first loaded
  exercisesCompleted?: number;   // bumped each time the student reveals the final answer
  lastSeenAt?: number;           // most recent visit to either lesson or exercise
  /** Sub-topic ids the student has completed (finished the focused practice). */
  completedSubTopics?: string[];
};

type ProgressMap = Record<string, TopicProgress>;

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function key(subject: string, topic: string) {
  return `${subject}:${topic}`;
}

function readAll(): ProgressMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ProgressMap) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota exceeded or storage disabled — silently ignore
  }
}

export function getProgress(subject: string, topic: string): TopicProgress {
  return readAll()[key(subject, topic)] ?? {};
}

export function getAllProgress(): ProgressMap {
  return readAll();
}

export function markLessonViewed(subject: string, topic: string) {
  const all = readAll();
  const k = key(subject, topic);
  const now = Date.now();
  all[k] = {
    ...all[k],
    viewedAt: all[k]?.viewedAt ?? now,
    lastSeenAt: now,
  };
  writeAll(all);
}

export function markExerciseDone(subject: string, topic: string) {
  const all = readAll();
  const k = key(subject, topic);
  const now = Date.now();
  all[k] = {
    ...all[k],
    exercisesCompleted: (all[k]?.exercisesCompleted ?? 0) + 1,
    lastSeenAt: now,
  };
  writeAll(all);
}

// ============================================================
// Sub-topic completion tracking (the course progress feature).
// ============================================================

/** Mark a sub-topic as completed by the student (finished the focused
 *  practice). Idempotent — calling twice keeps the same list. */
export function markSubTopicDone(subject: string, topic: string, subId: string) {
  const all = readAll();
  const k = key(subject, topic);
  const now = Date.now();
  const prev = all[k]?.completedSubTopics ?? [];
  const merged = prev.includes(subId) ? prev : [...prev, subId];
  all[k] = {
    ...all[k],
    completedSubTopics: merged,
    lastSeenAt: now,
  };
  writeAll(all);
}

/** Set of sub-topic ids that the student has completed for this topic. */
export function getCompletedSubTopics(subject: string, topic: string): Set<string> {
  const ids = readAll()[key(subject, topic)]?.completedSubTopics ?? [];
  return new Set(ids);
}

/** True iff this specific sub-topic has been completed. */
export function isSubTopicDone(subject: string, topic: string, subId: string): boolean {
  return getCompletedSubTopics(subject, topic).has(subId);
}
