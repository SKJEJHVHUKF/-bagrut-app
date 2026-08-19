/**
 * Service-role Supabase client — SERVER ONLY. Bypasses Row Level Security.
 *
 * Exists for exactly one job: writing to the SHARED, non-personal tables
 * (`question_bank`, `solution_cache`, `bank_reports`) from route handlers.
 * Those writes used to run as the signed-in student through policies like
 * `for update to authenticated using (true)` — which also let every student's
 * browser rewrite every row (2026-08-19 audit, H2). The policies are gone; the
 * server writes with this client instead. Reads stay on the normal client so
 * RLS keeps governing what each student can see.
 *
 * Rules:
 *   - Never import from a Client Component; never expose the key with a
 *     NEXT_PUBLIC_ prefix. It reads SUPABASE_SERVICE_ROLE_KEY, which Next
 *     only makes available on the server.
 *   - Never hand it a user id taken from the request body — take the user
 *     from the session (`supabase.auth.getUser()`), then write.
 *   - Never use it to read or write per-user tables (chat_messages,
 *     learning_state, scan_log, …). RLS is the authorisation layer there.
 *
 * Returns null when the key is not configured (local dev, or a deploy that
 * went out before the Vercel env var was added) so callers skip the write
 * instead of crashing the request — the bank just doesn't grow until it is set.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let warned = false;

export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (!warned) {
      warned = true;
      console.warn('[supabase/admin] SUPABASE_SERVICE_ROLE_KEY not set — shared-bank writes are skipped');
    }
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
