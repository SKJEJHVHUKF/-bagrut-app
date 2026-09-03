/**
 * /api/client-error — the crash sink for app/error.tsx and app/global-error.tsx.
 *
 * One INSERT into `public.client_errors` (supabase-client-errors.sql) with the
 * service-role client, because a crashed page may belong to an anonymous
 * student and the table has no client-side policies. Also `console.error`s so
 * the Vercel function log shows it even before the table exists. ZERO AI.
 *
 * Degrades like every other optional table: no service key or no table →
 * the log line is all you get, and the response is still 204.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sameOrigin, jsonError } from '@/lib/teacher-guard';

export const dynamic = 'force-dynamic';

const MAX = { message: 500, stack: 4000, digest: 64, path: 200, ua: 200 } as const;

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null;
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return jsonError('forbidden', 403);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('bad request', 400);
  }

  const row = {
    message: str(body.message, MAX.message) ?? '(no message)',
    stack: str(body.stack, MAX.stack),
    digest: str(body.digest, MAX.digest),
    path: str(body.path, MAX.path),
    user_agent: str(body.ua, MAX.ua),
  };

  console.error('[client-error]', row.path, row.digest, row.message);

  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from('client_errors').insert(row);
    if (error) console.warn('[client-error] insert skipped:', error.message);
  }

  return new Response(null, { status: 204 });
}

export function GET(): Response {
  return jsonError('method not allowed', 405);
}
