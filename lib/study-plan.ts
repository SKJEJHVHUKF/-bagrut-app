/**
 * study-plan.ts — personalized study plan stored in localStorage.
 *
 * The plan describes the student's path through the bagrut:
 *   - which topics they chose to study
 *   - target proficiency for each (חלש / בינוני / חזק)
 *   - the order to study them
 *   - the bagrut exam date (for countdown)
 *   - per-topic progress (0-100%)
 *
 * Unlock rule: the FIRST topic in the plan is always open. Each later
 * topic stays locked until the previous topic reaches `UNLOCK_THRESHOLD`%
 * completion (or the user is Pro / admin — see lib/access.ts).
 *
 * Everything lives in localStorage. No server round-trip, no Supabase.
 */

const STORAGE_KEY = 'bagrut-study-plan-v1';
const UNLOCK_THRESHOLD = 80; // % completion required to unlock next topic

export type ProficiencyLevel = 'weak' | 'mid' | 'strong';

export type PlanTopic = {
  subject: string;             // e.g. "math5"
  topic: string;               // e.g. "אלגברה" — matches lesson key
  level: ProficiencyLevel;     // student's self-assessed current level
  completion: number;          // 0-100, derived from sub-step completion
  steps: {
    understand: boolean;       // student opened the lesson
    quiz: boolean;             // student finished a quiz on this topic
    practice: boolean;         // student finished a bagrut question
  };
  lastSeenAt?: number;         // ms epoch
};

export type StudyPlan = {
  /** Bagrut exam date as ISO yyyy-mm-dd. */
  bagrutDate: string;
  /** Ordered list of topics (first = current). */
  topics: PlanTopic[];
  /** When the plan was created. */
  createdAt: number;
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// ============================================================
// CRUD
// ============================================================

export function getPlan(): StudyPlan | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudyPlan;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.topics)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasPlan(): boolean {
  return getPlan() !== null;
}

export function savePlan(plan: StudyPlan): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // quota or disabled — silently ignore
  }
}

export function clearPlan(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createPlan(args: {
  bagrutDate: string;
  topics: Array<{ subject: string; topic: string; level: ProficiencyLevel }>;
}): StudyPlan {
  const plan: StudyPlan = {
    bagrutDate: args.bagrutDate,
    createdAt: Date.now(),
    topics: args.topics.map((t) => ({
      subject: t.subject,
      topic: t.topic,
      level: t.level,
      completion: 0,
      steps: { understand: false, quiz: false, practice: false },
    })),
  };
  savePlan(plan);
  return plan;
}

// ============================================================
// Step / progress updates
// ============================================================

function findTopicIndex(plan: StudyPlan, subject: string, topic: string): number {
  return plan.topics.findIndex((t) => t.subject === subject && t.topic === topic);
}

function recalcCompletion(t: PlanTopic): number {
  const done = (t.steps.understand ? 1 : 0) + (t.steps.quiz ? 1 : 0) + (t.steps.practice ? 1 : 0);
  return Math.round((done / 3) * 100);
}

export function markStep(
  subject: string,
  topic: string,
  step: 'understand' | 'quiz' | 'practice'
): StudyPlan | null {
  const plan = getPlan();
  if (!plan) return null;
  const i = findTopicIndex(plan, subject, topic);
  if (i < 0) return plan;
  plan.topics[i].steps[step] = true;
  plan.topics[i].completion = recalcCompletion(plan.topics[i]);
  plan.topics[i].lastSeenAt = Date.now();
  savePlan(plan);
  return plan;
}

// ============================================================
// Lock state — drives the paywall
// ============================================================

/**
 * Is `(subject, topic)` unlocked **by completion progress alone**?
 * (Pro/admin overrides come from lib/access.ts and are not included here.)
 */
export function isTopicUnlockedByProgress(
  plan: StudyPlan,
  subject: string,
  topic: string
): boolean {
  const i = findTopicIndex(plan, subject, topic);
  if (i < 0) return false;
  if (i === 0) return true; // first topic always open
  // every previous topic must be ≥ UNLOCK_THRESHOLD
  for (let k = 0; k < i; k++) {
    if (plan.topics[k].completion < UNLOCK_THRESHOLD) return false;
  }
  return true;
}

/** Index of the first topic that is NOT yet at threshold — the "current" topic. */
export function currentTopicIndex(plan: StudyPlan): number {
  for (let i = 0; i < plan.topics.length; i++) {
    if (plan.topics[i].completion < UNLOCK_THRESHOLD) return i;
  }
  return plan.topics.length - 1; // all done — keep the last as "current"
}

// ============================================================
// Bagrut countdown
// ============================================================

export function daysUntilBagrut(plan: StudyPlan): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(plan.bagrutDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ============================================================
// Constants
// ============================================================

export const UNLOCK_THRESHOLD_EXPORTED = UNLOCK_THRESHOLD;
