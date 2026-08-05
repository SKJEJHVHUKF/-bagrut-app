// ============================================================
// mathscan/quota.ts — who may commission a NEW AI solution, and how often.
// ============================================================
//
// This is deliberately a pure function taking plain numbers, not a branch
// inside the route handler. The decision it makes cannot be reached from
// outside without a signed-in free account, and creating accounts to test it
// is not an option — so if it is not testable in isolation it is not testable
// at all, and "the quota works" stays an assumption. `npm run test:bank`
// exercises every case below.
//
// ── Why a quota instead of a Pro wall ──────────────────────────────────────
// AI solving used to require Pro. `isProUser` is true only for the owner's
// email (there is no billing yet), so in practice NOBODY but the owner could
// commission a solution — and since every solution is what fills the shared
// question bank, "every student who scans feeds the library" could never
// happen. The wall did not protect the budget so much as guarantee the bank
// stayed empty.
//
// ── The honest accounting ─────────────────────────────────────────────────
// A free solve is not purely a cost. It is written into `question_bank`, so
// it answers every later student who photographs that page for nothing. At a
// measured 6-16 agorot for a hard multi-section solve, 3/day is roughly
// 20-50 agorot per ACTIVE student per day. Against a ~$5/month budget that is
// a few tens of student-days if nothing ever repeats — and in bagrut and
// מתכונת questions, things repeat constantly, which is the entire bet.
//
// Watch `freeRatio` in summarizeCost(). If it is not climbing after a few
// weeks of real use, the bet is not paying off and FREE_DAILY_SOLVE is the
// first number to turn down.

/** New AI solutions a free, signed-in student may commission per day. */
export const FREE_DAILY_SOLVE = 3;

/** Pro is a much higher ceiling, not an unlimited one — an unbounded account
 *  is one runaway client away from the whole month's budget. */
export const PRO_DAILY_SOLVE = 150;

export type QuotaDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; status: 429; message: string; proRequired: boolean };

/**
 * @param usedToday  AI solves already commissioned today by this user.
 *   MUST be counted with `source='ai'` only. Counting every scan would let
 *   free library and bank hits — the paths that cost nothing and that the
 *   whole design steers students toward — consume the paid quota, so a
 *   student who used the app well would be punished for it.
 */
export function decideSolveQuota(args: { pro: boolean; usedToday: number }): QuotaDecision {
  const cap = args.pro ? PRO_DAILY_SOLVE : FREE_DAILY_SOLVE;
  const used = Math.max(0, args.usedToday);
  if (used < cap) return { allowed: true, remaining: cap - used };

  // Wording matters more than it looks. This is the one moment a student who
  // is using the app correctly gets told "no", and it must read as a limit on
  // NEW solutions — not as the app being broken and not as a paywall on
  // everything. The free paths stay open and the message says so, because a
  // student who believes they are locked out closes the tab.
  return {
    allowed: false,
    status: 429,
    proRequired: !args.pro,
    message: args.pro
      ? `הגעת למכסת ${cap} הפתרונות היומית. חזור מחר.`
      : `הגעת ל-${cap} הפתרונות החדשים שלך להיום. שאלות שכבר במאגר נשארות חינם וללא הגבלה — נסה לחפש את השאלה, וייתכן שהיא כבר שם.`,
  };
}
