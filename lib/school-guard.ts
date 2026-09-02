/**
 * school-guard.ts — the gate every /api/school route passes through.
 *
 * Same shape and the same reasoning as lib/teacher-guard.ts, and separate from
 * it on purpose: a private tutor and a class teacher are different roles over
 * different data, and one guard that tried to be both would end up with an `if`
 * deciding whose students you can see. That `if` is the whole security model.
 *
 * Two rules:
 *   1. the caller is signed in;
 *   2. a teacher only ever reaches a class he is a MEMBER of, with role
 *      'teacher' — checked against class_members on every request, never
 *      inferred from an id in the body.
 *
 * Rule 2 is enforced here, in code, because these routes run on the service-role
 * client, which bypasses RLS by definition. `classes`, `class_members` and
 * `focus_targets` therefore have RLS on and no policies at all: the database
 * denies every logged-in user, and this file is the single place that decides
 * which class a teacher gets to see. Any new /api/school route must scope its
 * queries with `requireClassTeacher` — never with a class id taken on trust.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type ClassCtx = {
  db: SupabaseClient;
  user: User;
  classId: string;
};

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

/** Browsers always send Origin on a mutation, so a missing header on one is
 *  itself suspect — cookie auth is CSRF-able without this check. Same rule as
 *  /api/teacher and /api/admin. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** Signed in, with a service-role client. The base every route starts from. */
export async function requireUser(
  request: Request,
  mutating: boolean
): Promise<{ db: SupabaseClient; user: User } | Response> {
  if (mutating && !sameOrigin(request)) return jsonError('forbidden', 403);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError('forbidden', 403);

  // ⚠️ AUTHORISATION FIRST, RESOURCES SECOND — the service client is created
  // only after the caller is known, so a deploy missing the key fails closed
  // rather than at a later line that has already trusted something.
  const db = createAdminClient();
  if (!db) return jsonError('SUPABASE_SERVICE_ROLE_KEY is not configured', 503);

  return { db, user };
}

/**
 * The caller teaches this class. Anything else is a 403 — including being a
 * STUDENT in it, which is the check that stops a class member reading his
 * classmates' answer history.
 */
export async function requireClassTeacher(
  request: Request,
  classId: string,
  mutating: boolean
): Promise<ClassCtx | Response> {
  const base = await requireUser(request, mutating);
  if (base instanceof Response) return base;

  if (!isUuid(classId)) return jsonError('forbidden', 403);

  const { data } = await base.db
    .from('class_members')
    .select('role')
    .eq('class_id', classId)
    .eq('user_id', base.user.id)
    .maybeSingle();

  // 403 and not 404, deliberately: "no such class" and "not your class" must
  // read identically from outside, or the endpoint becomes a way to discover
  // which class ids exist.
  if (!data || data.role !== 'teacher') return jsonError('forbidden', 403);

  return { db: base.db, user: base.user, classId };
}

/** The class's students, with the display names class_members already holds.
 *  Empty means empty — never "everyone". */
export async function classRoster(
  ctx: ClassCtx
): Promise<{ id: string; name: string }[]> {
  const { data } = await ctx.db
    .from('class_members')
    .select('user_id, name')
    .eq('class_id', ctx.classId)
    .eq('role', 'student');

  return (data ?? []).map((r) => ({
    id: String(r.user_id),
    name: String(r.name || 'תלמיד'),
  }));
}

/** Cheap shape check before a uuid reaches a query. Postgres would reject a
 *  malformed one anyway, but with a 500 and a logged error rather than a 403. */
export function isUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}
