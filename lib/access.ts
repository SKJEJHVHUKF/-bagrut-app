/**
 * access.ts — who can see what.
 *
 * Free students get the FIRST topic in their plan only. Subsequent topics
 * are locked behind a Pro paywall.
 *
 * Admin override: the site owner always has full access. Admin emails come
 * from `ADMIN_EMAIL` (server-side env var, comma-separated for multiple).
 * Reading from env keeps the address out of the client JS bundle — `isAdmin`
 * therefore returns false on the client and admin status must be derived
 * server-side (e.g. in server components / route handlers).
 *
 * Pro status is currently a stub — there's no payment integration yet.
 * When that ships, we'll switch from email-equality to a Supabase column
 * check, keeping this module as the single source of truth.
 */

import type { StudyPlan } from './study-plan';
import { isTopicUnlockedByProgress } from './study-plan';

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAIL ?? '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

export type UserLike = {
  email?: string | null;
  user_metadata?: { pro?: boolean } & Record<string, unknown>;
} | null;

/** Is the user the site owner / admin? */
export function isAdmin(user: UserLike): boolean {
  const email = user?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.has(email);
}

/** Does the user have an active Pro subscription? */
export function isProUser(user: UserLike): boolean {
  // Stub: until billing is wired up, only admins are treated as Pro.
  if (isAdmin(user)) return true;
  // Future: read from user_metadata.pro or a `pro_subscriptions` table.
  return !!user?.user_metadata?.pro;
}

/**
 * Can this user access this topic in their plan?
 *
 * STRATEGY (2026-07): guided LEARNING is free for everyone, all topics —
 * it's static content (zero marginal cost) and the daily-habit hook that
 * grows the base. Pro monetizes DEPTH (advanced course, past-exam archive,
 * simulation, unlimited AI), not the basic lessons. The only remaining
 * gate here is the pedagogical progress-unlock, applied equally to all.
 */
export function canAccessTopic(
  user: UserLike,
  plan: StudyPlan,
  subject: string,
  topic: string
): boolean {
  return isTopicUnlockedByProgress(plan, subject, topic);
}

/**
 * Why a topic card is locked. No longer a paywall — learning is free.
 * A later topic is only 'locked-progress' until earlier topics reach the
 * completion threshold (a gentle pedagogical ramp, same for free & Pro).
 */
export function topicLockReason(
  user: UserLike,
  plan: StudyPlan,
  topicIndex: number
): 'open' | 'locked-progress' {
  if (topicIndex === 0) return 'open';
  const prevDone = plan.topics.slice(0, topicIndex).every((t) => t.completion >= 80);
  return prevDone ? 'open' : 'locked-progress';
}

// ============================================================
// Feature gates — the single source of truth for what's Pro.
// ============================================================
//
// FREE (the hook — habit + word of mouth, zero/low cost): all guided
// lessons + drills, quick quiz, insights + grade prediction, formulas,
// scan library/cache matches, capped daily chat.
//
// PRO (the value ladder — depth + high-intent + AI marginal cost):

export type ProFeature =
  | 'advanced-course' // the bagrut-level mastery course (the premium anchor)
  | 'archive' // past-exam archive with hints + full solutions
  | 'simulation' // full timed exam simulation
  | 'ai-tutor' // inline why-wrong / explain-simpler / hint-help / similar
  | 'unlimited-chat' // chat beyond the free daily cap
  | 'ai-scan' // NEW AI photo-solve (library/cache matches stay free)
  | 'analytics'; // mistake notebook, weekly report, deep breakdown

/** Is this feature Pro-only? (All listed features are, today.) */
export function isFeaturePro(feature: ProFeature): boolean {
  const PRO: Record<ProFeature, boolean> = {
    'advanced-course': true,
    archive: true,
    simulation: true,
    'ai-tutor': true,
    'unlimited-chat': true,
    'ai-scan': true,
    analytics: true,
  };
  return PRO[feature];
}

/** Can this user use a given Pro feature? */
export function canUseFeature(user: UserLike, feature: ProFeature): boolean {
  return !isFeaturePro(feature) || isProUser(user);
}

/** Free daily chat cap; Pro is unlimited. */
export const FREE_DAILY_CHAT = 10;
export const PRO_DAILY_CHAT = 200; // effectively unlimited, keeps a sane ceiling
