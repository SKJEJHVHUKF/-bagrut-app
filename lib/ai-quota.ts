/**
 * ai-quota.ts — the daily AI allowance. Server only.
 *
 * ============================================================
 * WHAT A CREDIT IS
 * ============================================================
 * One credit = one model call that produced an answer. Nothing else spends
 * one: not a hint, not the next step, not a formula, not a check, not "why was
 * I wrong", not a written solution, not a Topic Card, not the FAQ bank, and
 * not an answer served from the library. All of those are free and unlimited,
 * because none of them costs anything to run.
 *
 * A credit is also NOT spent by a call that failed. A timeout, a 529, an
 * abort, a blocked request, an empty reply — the student got no answer, so
 * there is nothing to charge for.
 *
 * ============================================================
 * WHY IT RESERVES FIRST
 * ============================================================
 * "Charge only on success" and "two parallel requests must not both pass" are
 * in tension: a counter that moves only after success lets two requests on the
 * last credit both read 9 and both proceed. So the credit is taken first and
 * given back on failure. Observed from outside, a failed call ends on the
 * number it started on — the rule holds — and the race is closed by a
 * conditional UPDATE inside Postgres rather than by hope.
 *
 * ⚠️ ONE WINDOW REMAINS, AND IT IS NOT HIDDEN. If the function crashes or is
 * killed between the reserve and the release, one credit stays spent until the
 * Israeli midnight. That is at most one per crashed invocation, out of ten, and
 * closing it properly means per-call rows with expiry — more machinery than a
 * ten-a-day allowance is worth. If crashes ever show up in the logs, that is
 * the upgrade.
 *
 * Every function here fails OPEN on an infrastructure error: a missing table
 * or a dead network must not stop a student from being taught. The cost of
 * failing open is an uncounted call; the cost of failing closed is a paying
 * student who cannot use what they paid for.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { AI_DAILY_LIMIT } from '@/lib/access';

export { AI_DAILY_LIMIT };

export type QuotaState = { used: number; cap: number; remaining: number };

/**
 * Is the new quota model deciding for this user, or only shadowing?
 *
 * ⚠️ SERVER-SIDE ONLY, and deliberately not the localStorage flag the tutor
 * compiler uses. A student must not be able to change their own allowance by
 * typing in a console, so this reads an env var and the admin list and nothing
 * the browser can touch.
 *
 * Off (the default): the counters still move — the reserve and the release run
 * for real for the admin account — but the OLD gate decides whether a request
 * is blocked. That is how the mechanism gets measured before it can lock
 * anybody out.
 */
export function quotaEnforced(email: string | null | undefined): boolean {
  if (process.env.AI_QUOTA_V2 === 'on') return true;
  if (!email) return false;
  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase()) && process.env.AI_QUOTA_V2 === 'admin';
}

/**
 * Is this account never blocked, whatever the counters say?
 *
 * ⚠️ IT STILL COUNTS. Exempt means "not stopped", not "not measured" — the
 * reserve and the release run exactly as they do for a student, so the admin
 * dashboard keeps showing what this account actually spent. An owner who
 * cannot see their own usage is the one person who most needs to.
 *
 * The list is the same server-side admin allowlist as everywhere else, read
 * from the environment. A student cannot put themselves on it, and there is
 * deliberately no client-side switch: `AI_QUOTA_V2=on` turns the limit on for
 * everyone, and this is the one carve-out.
 */
export function quotaExempt(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

/** Should the counters move at all for this user, even when the old gate still decides? */
export function quotaShadowed(email: string | null | undefined): boolean {
  if (process.env.AI_QUOTA_V2 === 'on') return true;
  if (!email) return false;
  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

/**
 * Take one credit, or report that there are none.
 *
 * Returns `allowed: true` when the credit is taken and the call may proceed.
 * On any infrastructure failure it returns `allowed: true` with `degraded`,
 * because a broken counter must not become a broken tutor.
 */
export async function reserveAiCall(
  userId: string,
  cap: number = AI_DAILY_LIMIT,
): Promise<QuotaState & { allowed: boolean; degraded?: true }> {
  const db = createAdminClient();
  if (!db) return { allowed: true, used: 0, cap, remaining: cap, degraded: true };
  try {
    const { data, error } = await db.rpc('reserve_ai_call', { p_user: userId, p_limit: cap });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      console.error(`[ai-quota] reserve failed (${error?.code ?? '?'}: ${error?.message ?? 'no row'}) — not counting`);
      return { allowed: true, used: 0, cap, remaining: cap, degraded: true };
    }
    const used = Number(row.used ?? 0);
    return { allowed: row.allowed === true, used, cap, remaining: Math.max(0, cap - used) };
  } catch {
    return { allowed: true, used: 0, cap, remaining: cap, degraded: true };
  }
}

/** Give the credit back. Safe to call twice; the RPC floors at zero. */
export async function releaseAiCall(userId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  try {
    await db.rpc('release_ai_call', { p_user: userId });
  } catch {
    /* the student already knows the call failed; a stuck counter resets at midnight */
  }
}

/** What the UI shows. Never throws, and reads zero rather than lying. */
export async function readAiQuota(userId: string, cap: number = AI_DAILY_LIMIT): Promise<QuotaState> {
  const db = createAdminClient();
  if (!db) return { used: 0, cap, remaining: cap };
  try {
    const { data } = await db.rpc('read_ai_usage', { p_user: userId, p_limit: cap });
    const row = Array.isArray(data) ? data[0] : data;
    const used = Number(row?.used ?? 0);
    return { used, cap, remaining: Math.max(0, cap - used) };
  } catch {
    return { used: 0, cap, remaining: cap };
  }
}

/**
 * What the student is told when the allowance is gone.
 *
 * ⚠️ The second sentence is the important one. Running out of AI turns is not
 * running out of tutor: hints, the written solution, formulas, answer checking
 * and the whole local ladder keep working and cost nothing. A message that
 * only says "you have run out" would make a student close the app.
 */
export const QUOTA_EXHAUSTED_MESSAGE =
  'נגמרו השאלות החופשיות למורה AI להיום. עדיין אפשר להשתמש ברמזים, פתרונות, נוסחאות ובדיקת תשובות ללא הגבלה.';
