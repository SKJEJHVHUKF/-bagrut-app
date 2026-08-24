/**
 * access.ts — who can see what.
 *
 * Learning is free and nothing in the learning path is locked; what is gated
 * here is Pro DEPTH (see the feature gates below).
 *
 * Admin override: the site owner always has full access. Admin emails come from
 * `NEXT_PUBLIC_ADMIN_EMAIL` (comma-separated for multiple).
 *
 * ⚠️ It has to be `NEXT_PUBLIC_`, and the reason is worth keeping. This module
 * is imported from BOTH sides. Next inlines only `NEXT_PUBLIC_*` into the
 * client bundle, so while the variable was `ADMIN_EMAIL` the set was empty in
 * every browser: `isProUser` returned false for EVERYONE — including the owner —
 * in `app/scan`, `app/insights`, `app/errors`, `app/bagruyot/archive`,
 * `CourseTracks` and `AppChrome`, while the server path let him straight in.
 * The visible symptom was a Pro account that looked free on half the app, and
 * no way to see what a paying customer actually gets — the one thing you most
 * need working before wiring a payment provider.
 *
 * Publishing the address costs nothing: it is already hard-coded in
 * app/accessibility, app/privacy and app/terms. And it grants nothing — this
 * only decides which UI to draw. Every paid route re-checks server-side against
 * the Supabase session, which an email string cannot forge.
 *
 * Pro status is currently a stub — there's no payment integration yet.
 * When that ships, we'll switch from email-equality to a Supabase column
 * check, keeping this module as the single source of truth.
 */

// Both names are read, and the old one is the FALLBACK rather than a straight
// rename, because the deploy env is edited by hand in the Vercel dashboard. A
// hard rename would take the owner's admin access away on the server too — the
// half that works today — for however long it took him to add the new variable.
// Once `NEXT_PUBLIC_ADMIN_EMAIL` is set in Vercel, `ADMIN_EMAIL` can be dropped
// from both this line and the dashboard.
const ADMIN_EMAILS = new Set(
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

export type UserLike = {
  email?: string | null;
  /** Writable ONLY with the service role / dashboard — safe to gate on. */
  app_metadata?: { pro?: boolean } & Record<string, unknown>;
  /** Writable by the user himself (`supabase.auth.updateUser({ data })`,
   *  which AppChrome does for the display name) — NEVER gate on it. */
  user_metadata?: Record<string, unknown>;
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
  // Granted by hand in the Supabase SQL editor until billing ships:
  //   update auth.users set raw_app_meta_data =
  //     coalesce(raw_app_meta_data,'{}'::jsonb) || '{"pro":true}' where email = '…';
  // A payment provider's webhook will do the same write with the service role.
  return user?.app_metadata?.pro === true;
}

// STRATEGY (2026-07): guided LEARNING is free for everyone, all topics — it's
// static content (zero marginal cost) and the daily-habit hook that grows the
// base. Pro monetizes DEPTH (advanced course, past-exam archive, simulation,
// unlimited AI), not the basic lessons. There is no topic gate of any kind:
// the paywall went in 2026-07 and the last pedagogical progress-unlock
// (`topicLockReason` / `canAccessTopic`) went on 2026-08-18 — nothing in the
// learning path is locked (owner's decision).

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
/**
 * The AI allowance, identical for every student — free and Pro alike
 * (Itay's call, 2026-08-25). Everything local stays unlimited; see
 * lib/ai-quota.ts for what does and does not spend one.
 *
 * ⚠️ Lives HERE and not in lib/ai-quota because the tutor renders it, and
 * lib/ai-quota imports the service-role Supabase client. A client component
 * importing that module drags a server-only file into the browser bundle.
 */
export const AI_DAILY_LIMIT = 10;

export const FREE_DAILY_CHAT = 10;
export const PRO_DAILY_CHAT = 200; // effectively unlimited, keeps a sane ceiling

// Daily cap on LIVE AI question generation (/api/questions misses that fall
// through to Anthropic). Static concept/lesson banks and the pre-generated
// pool don't count — only a real ~$0.04 Sonnet call does. This bounds the
// per-user cost exposure; the vast majority of quizzes now serve from static
// banks and never reach the model.
export const FREE_DAILY_AI_QUIZ = 30;
export const PRO_DAILY_AI_QUIZ = 200;
