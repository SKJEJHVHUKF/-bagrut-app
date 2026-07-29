// ============================================================
// concept-level.ts — which of the three concept-quiz levels the student picked.
//
// The level is an EXPLICIT student choice, not a derived value. `studentTier`
// (lib/adaptive.ts) still computes what we'd recommend, but it only decorates
// one chip with "מומלץ לך" — it never overrides the choice, and no level is ever
// locked. That is the owner's standing decision: levels don't gate each other.
//
// Stored under its own localStorage key rather than on StudyPlan, because:
//   - `savePlan` no-ops when there is no plan, and /quiz is reachable without
//     ever going through onboarding, so the choice would silently vanish
//   - savePlan fires 'bagrut-state-dirty', which repaints AppChrome and queues a
//     Supabase sync for what is a per-screen preference
//   - a 5-unit student choosing level 1 must never rewrite `unitLevel`
// lib/progress.ts and lib/scans.ts already set the own-key precedent.
// ============================================================

import type { ConceptLevel } from '@/content/concept-quiz/types';
import { CONCEPT_LEVELS } from '@/content/concept-quiz/types';
import { studentTier } from '@/lib/adaptive';
import { topicStats } from '@/lib/results';

const STORAGE_KEY = 'bagrut-concept-level-v1';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isLevel(v: unknown): v is ConceptLevel {
  return v === 1 || v === 2 || v === 3;
}

/** Per-subject, so a 5-unit student's choice doesn't follow them into math4. */
function readAll(): Partial<Record<string, ConceptLevel>> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Partial<Record<string, ConceptLevel>> = {};
    for (const [k, v] of Object.entries(parsed)) if (isLevel(v)) out[k] = v;
    return out;
  } catch {
    return {};
  }
}

/** The level this student last chose for `subject`, or null if never chosen. */
export function getConceptLevel(subject: string): ConceptLevel | null {
  return readAll()[subject] ?? null;
}

export function setConceptLevel(subject: string, level: ConceptLevel): void {
  if (!isBrowser() || !isLevel(level)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [subject]: level }));
  } catch {
    // quota or disabled — the picker still works for this session
  }
}

/**
 * Advisory only — drives the "מומלץ לך" badge, never the selection.
 *
 * Mirrors `studentTier` (0→1, 1→2, 2→3) so there is one notion of "where this
 * student is", with ONE override: somebody with no recorded attempts on this
 * topic is recommended level 1 whatever their unit level says. A 5-unit student
 * opening a topic for the first time should start at the definitions, and
 * `studentTier` returns 1 for them because it bases on unitLevel before any
 * evidence exists.
 */
export function recommendedConceptLevel(subject: string, topic?: string): ConceptLevel {
  if (!topic) return 1;
  const seen = topicStats(subject).find((s) => s.topic === topic);
  if (!seen || seen.attempts === 0) return 1;
  const tier = studentTier(subject, topic);
  return CONCEPT_LEVELS[tier] ?? 1;
}
