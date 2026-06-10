// Progress for the ADVANCED courses ("קורס מתקדם"), persisted to
// localStorage — separate from the base-course tracker (lib/learn-progress)
// per product requirement. Tracks: gate passed/skipped, per-section
// completion, and the final-simulation pass. Also exposes a combined
// "mastery" status (none / base / advanced) for the at-a-glance map.

import { PATH_SECTIONS } from '@/content/learning-paths/types';
import { getCompletedSections } from '@/lib/learn-progress';

const STORAGE_KEY = 'bagrut-advanced-progress-v1';

type AdvancedTopicProgress = {
  /** Gate passed (by answering) or explicitly skipped. */
  gatePassed?: boolean;
  /** True when the gate was bypassed via "דלג — אני יודע את הבסיס". */
  gateSkipped?: boolean;
  /** ADVANCED_SECTIONS ids the student marked/earned as complete. */
  completedSections?: string[];
  /** The final simulation was passed — topic mastered at bagrut level. */
  simulationPassed?: boolean;
  lastSeenAt?: number;
};

type ProgressMap = Record<string, AdvancedTopicProgress>;

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

function patch(subject: string, topic: string, p: Partial<AdvancedTopicProgress>) {
  const all = readAll();
  const k = key(subject, topic);
  all[k] = { ...all[k], ...p, lastSeenAt: Date.now() };
  writeAll(all);
  return all[k];
}

export function getAdvancedProgress(subject: string, topic: string): AdvancedTopicProgress {
  return readAll()[key(subject, topic)] ?? {};
}

/** Mark the entry gate as passed. `skipped` distinguishes the bypass. */
export function markGatePassed(subject: string, topic: string, skipped = false) {
  const prev = getAdvancedProgress(subject, topic).completedSections ?? [];
  const merged = prev.includes('gate') ? prev : [...prev, 'gate'];
  return patch(subject, topic, { gatePassed: true, gateSkipped: skipped, completedSections: merged });
}

/** Set of completed advanced-section ids for this topic. */
export function getCompletedAdvancedSections(subject: string, topic: string): Set<string> {
  return new Set(getAdvancedProgress(subject, topic).completedSections ?? []);
}

/** Toggle an advanced section's completion. Returns the new set. */
export function toggleAdvancedSection(subject: string, topic: string, sectionId: string): Set<string> {
  const prev = getAdvancedProgress(subject, topic).completedSections ?? [];
  const merged = prev.includes(sectionId)
    ? prev.filter((s) => s !== sectionId)
    : [...prev, sectionId];
  patch(subject, topic, { completedSections: merged });
  return new Set(merged);
}

/** Mark a section complete (idempotent). Returns the new set. */
export function markAdvancedSectionDone(subject: string, topic: string, sectionId: string): Set<string> {
  const prev = getAdvancedProgress(subject, topic).completedSections ?? [];
  const merged = prev.includes(sectionId) ? prev : [...prev, sectionId];
  patch(subject, topic, { completedSections: merged });
  return new Set(merged);
}

/** Passing the simulation = the topic is mastered at bagrut level. */
export function markSimulationPassed(subject: string, topic: string) {
  const prev = getAdvancedProgress(subject, topic).completedSections ?? [];
  const merged = prev.includes('simulation') ? prev : [...prev, 'simulation'];
  return patch(subject, topic, { simulationPassed: true, completedSections: merged });
}

// ------------------------------------------------------------
// Combined mastery status — the at-a-glance map building block.
// ------------------------------------------------------------

export type TopicMastery = 'none' | 'base-in-progress' | 'base-done' | 'advanced-done';

/** Combined base+advanced status for a topic:
 *  none → base-in-progress → base-done → advanced-done. */
export function getTopicMastery(subject: string, topic: string): TopicMastery {
  if (getAdvancedProgress(subject, topic).simulationPassed) return 'advanced-done';
  const baseDone = getCompletedSections(subject, topic).size;
  if (baseDone >= PATH_SECTIONS.length) return 'base-done';
  if (baseDone > 0) return 'base-in-progress';
  return 'none';
}
