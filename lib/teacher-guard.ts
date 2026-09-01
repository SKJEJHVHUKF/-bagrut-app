/**
 * teacher-guard.ts — the gate every /api/teacher route passes through.
 *
 * Two rules, and the second is the one that matters:
 *   1. the caller is signed in AND carries the teacher role (app_metadata,
 *      service-role-writable only — a teacher cannot promote himself);
 *   2. a teacher only ever reaches HIS OWN students.
 *
 * Rule 2 is enforced here, in code, because these routes run on the
 * service-role client, which bypasses RLS by definition. `teacher_students`
 * and `teacher_week_hours` therefore have RLS on and no policies at all: the
 * database denies every logged-in user, and this file is the single place that
 * decides which rows a teacher gets to see. Any new /api/teacher route must
 * scope its queries with `roster()` — never with an id from the request body.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin, isTeacher } from '@/lib/access';

export type TeacherCtx = {
  db: SupabaseClient;
  /** The teacher the request is FOR — not necessarily the caller. */
  teacher: User;
  /** The owner is looking at someone else's board. The screen says so. */
  asAdmin: boolean;
};

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

/** Browsers always send Origin on a cross-site or same-site mutation, so a
 *  missing header on one is itself suspect — cookie auth is CSRF-able without
 *  this check. Same rule as /api/admin. */
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

export async function requireTeacher(
  request: Request,
  mutating: boolean
): Promise<TeacherCtx | Response> {
  if (mutating && !sameOrigin(request)) return jsonError('forbidden', 403);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError('forbidden', 403);
  const db = createAdminClient();
  if (!db) return jsonError('SUPABASE_SERVICE_ROLE_KEY is not configured', 503);

  // `?as=<teacherId>` — the owner opening a teacher's board. Gated on isAdmin
  // (the email allowlist), so a teacher cannot pass another teacher's id and
  // read his students. The screen it feeds says whose board is on display;
  // silent impersonation would be the wrong kind of convenience.
  const as = new URL(request.url).searchParams.get('as');
  if (as && as !== user.id) {
    if (!isAdmin(user)) return jsonError('forbidden', 403);
    const { data } = await db.auth.admin.getUserById(as);
    if (!data?.user || !isTeacher(data.user)) return jsonError('לא נמצא מורה כזה', 404);
    return { db, teacher: data.user, asAdmin: true };
  }

  if (!isTeacher(user)) return jsonError('forbidden', 403);
  return { db, teacher: user, asAdmin: false };
}

/** The teacher's own students. Empty means empty — never "all students". */
export async function roster(ctx: TeacherCtx): Promise<string[]> {
  const { data } = await ctx.db
    .from('teacher_students')
    .select('student_id')
    .eq('teacher_id', ctx.teacher.id);
  return (data ?? []).map((r) => String(r.student_id));
}
