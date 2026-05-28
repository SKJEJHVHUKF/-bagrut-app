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
 * Free users get the FIRST topic only (unlocked by progress logic).
 * Pro/admin users get every topic.
 */
export function canAccessTopic(
  user: UserLike,
  plan: StudyPlan,
  subject: string,
  topic: string
): boolean {
  if (isProUser(user)) return true;
  return isTopicUnlockedByProgress(plan, subject, topic) && isFirstTopicInPlan(plan, subject, topic);
}

/** Is this the very first topic in the plan? */
function isFirstTopicInPlan(plan: StudyPlan, subject: string, topic: string): boolean {
  const first = plan.topics[0];
  return !!first && first.subject === subject && first.topic === topic;
}

/**
 * For a non-Pro user, every topic past index 0 is gated by Pro.
 * Pure progress-based unlock applies *within* the Pro tier (so Pro users
 * still see locks if they haven't completed earlier topics — but they
 * never get a paywall).
 */
export function topicLockReason(
  user: UserLike,
  plan: StudyPlan,
  topicIndex: number
): 'open' | 'pro-required' | 'locked-progress' {
  if (isProUser(user)) {
    if (topicIndex === 0) return 'open';
    // Pro users still gated by progress for pedagogical reasons.
    const prevDone = plan.topics
      .slice(0, topicIndex)
      .every((t) => t.completion >= 80);
    return prevDone ? 'open' : 'locked-progress';
  }
  // Free user
  return topicIndex === 0 ? 'open' : 'pro-required';
}
