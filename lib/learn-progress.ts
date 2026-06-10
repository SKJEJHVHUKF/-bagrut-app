// Per-section progress for the "לימוד מ-0" learning paths, persisted to
// localStorage. Tracks WHICH of the eight pedagogical sections the student
// has completed for each topic, so the path header can show a progress bar
// and checkmarks. Device-local and low-stakes — same philosophy as
// lib/progress.ts (clearing browser state just resets the badges).

const STORAGE_KEY = 'bagrut-learn-progress-v1';

type PathProgress = {
  /** Section ids (see PATH_SECTIONS) the student has marked complete. */
  completedSections?: string[];
  lastSeenAt?: number;
};

type ProgressMap = Record<string, PathProgress>;

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

/** Set of section ids the student has completed for this topic. */
export function getCompletedSections(subject: string, topic: string): Set<string> {
  const ids = readAll()[key(subject, topic)]?.completedSections ?? [];
  return new Set(ids);
}

/** Mark a section complete (idempotent). Returns the new completed set. */
export function markSectionDone(subject: string, topic: string, sectionId: string): Set<string> {
  const all = readAll();
  const k = key(subject, topic);
  const prev = all[k]?.completedSections ?? [];
  const merged = prev.includes(sectionId) ? prev : [...prev, sectionId];
  all[k] = { ...all[k], completedSections: merged, lastSeenAt: Date.now() };
  writeAll(all);
  return new Set(merged);
}

/** Toggle a section's completion. Returns the new completed set. */
export function toggleSection(subject: string, topic: string, sectionId: string): Set<string> {
  const all = readAll();
  const k = key(subject, topic);
  const prev = all[k]?.completedSections ?? [];
  const merged = prev.includes(sectionId)
    ? prev.filter((s) => s !== sectionId)
    : [...prev, sectionId];
  all[k] = { ...all[k], completedSections: merged, lastSeenAt: Date.now() };
  writeAll(all);
  return new Set(merged);
}
