/**
 * /api/attempt — record ONE answered question, durably.
 *
 * Fired by lib/results.ts `recordResult` on every answer, fire-and-forget. It
 * is the only writer of `public.attempts` (supabase-attempts.sql), and that
 * table is the only progress source a teacher screen is ever allowed to read:
 * `learning_state.results` is synced up from the student's own localStorage and
 * truncates at 1,000 events, which is fine for his device sync and wrong for
 * anything anyone is held to.
 *
 * ⚠️ ZERO AI, and it must stay that way. This runs on every single answer in
 * the product — it is one INSERT and nothing else.
 *
 * ⚠️ WHO comes from the SESSION, never from the body. The row is written with
 * the caller's own client so RLS ("own attempts insert") is the authorisation
 * layer, exactly as lib/supabase/admin.ts requires for a per-user table. A
 * posted user_id would be ignored even if it were sent — attemptRow overwrites
 * it with the session's id.
 */

import { createClient } from '@/lib/supabase/server';
import { sameOrigin, jsonError } from '@/lib/teacher-guard';
import { attemptRow } from '@/lib/attempt-row';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return jsonError('forbidden', 403);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Learning works without an account (that is the whole free hook), so an
  // anonymous answer is NOT an error — there is simply nobody to attribute it
  // to. 204, and the student's local log carries it as before.
  //
  // ponytail: one no-op invocation per anonymous answer. If invocation volume
  // ever matters, gate the call client-side on a session flag — deliberately
  // NOT done here, because a heuristic that guesses wrong stops logging for
  // signed-in students silently, which is far worse than a cheap 204.
  if (!user) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('bad request', 400);
  }

  const row = attemptRow(body, user.id, Date.now());
  if (!row) return jsonError('bad request', 400);

  // A duplicate delivery (browser retry of a `keepalive` request, or a
  // double-invoked handler) collapses onto attempts_dedupe_idx instead of
  // double-counting the answer on the teacher's board.
  const { error } = await supabase
    .from('attempts')
    .upsert(row, { onConflict: 'user_id,ts', ignoreDuplicates: true });

  if (error) {
    // Loud on purpose. A silent failure here reads downstream as "the student
    // did nothing", which is the one wrong answer a teacher screen must never
    // give — so this surfaces in the logs rather than degrading to a no-op.
    console.error('[api/attempt] insert failed:', error.message);
    return jsonError('write failed', 500);
  }

  return new Response(null, { status: 204 });
}

export function GET(): Response {
  // Write-only by construction. Reading answer history belongs to the screens
  // that are scoped to a roster, not to an endpoint anyone can curl.
  return jsonError('method not allowed', 405);
}
