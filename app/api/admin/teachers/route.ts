/**
 * /api/admin/teachers — the owner's side of the private-teacher system.
 *
 *   GET    → every teacher: terms, roster, and hand-edited weeks
 *   POST   { teacherId, studentId }                    → put a student on a roster
 *   DELETE { teacherId, studentId }                    → take him off
 *   PATCH  { teacherId, weekStart, hours|null, note? } → correct one week's hours
 *            (hours: null deletes the correction and restores the standing figure)
 *
 * The role itself and the pay TERMS (hourlyRate, weeklyHours) are not set here
 * — they live in app_metadata and are written by PATCH /api/admin/users, next
 * to the Pro flag, because they are properties of the account.
 *
 * Admin only, same email allowlist as the rest of /api/admin.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin, isTeacher, teacherRate, teacherWeeklyHours, teacherSince } from '@/lib/access';
import { buildPay } from '@/lib/teacher-pay';

export const dynamic = 'force-dynamic';

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

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

// ponytail: third local copy of the admin gate (users/ and activity/ have their
// own). Worth hoisting into lib/ on the fourth, not before — a shared guard
// today means editing two working routes for no behaviour change.
async function requireAdmin(request: Request, mutating: boolean): Promise<SupabaseClient | Response> {
  if (mutating && !sameOrigin(request)) return jsonError('forbidden', 403);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return jsonError('forbidden', 403);
  const db = createAdminClient();
  if (!db) return jsonError('SUPABASE_SERVICE_ROLE_KEY is not configured', 503);
  return db;
}

async function allUsers(db: SupabaseClient): Promise<User[]> {
  const all: User[] = [];
  // ponytail: paged to 10k accounts, same ceiling as /api/admin/users.
  let page: number | null = 1;
  while (page && page <= 10) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    all.push(...data.users);
    page = data.nextPage;
  }
  return all;
}

export async function GET(request: Request): Promise<Response> {
  const db = await requireAdmin(request, false);
  if (db instanceof Response) return db;

  const users = await allUsers(db);
  const byId = new Map(users.map((u) => [u.id, u]));
  const teachers = users.filter((u) => isTeacher(u));

  const [links, weeks] = await Promise.all([
    db.from('teacher_students').select('teacher_id, student_id').limit(5000),
    db.from('teacher_week_hours').select('teacher_id, week_start, hours, note').limit(5000),
  ]);

  const person = (id: string) => {
    const u = byId.get(id);
    return {
      id,
      email: u?.email ?? '',
      name: (u?.user_metadata?.name as string) || '',
      // A student deleted from auth cascades out of teacher_students, so this
      // only shows for a row written against an id that never existed.
      missing: !u,
    };
  };

  const rosterOf = new Map<string, ReturnType<typeof person>[]>();
  for (const l of (links.data ?? []) as Record<string, unknown>[]) {
    const list = rosterOf.get(String(l.teacher_id)) ?? [];
    list.push(person(String(l.student_id)));
    rosterOf.set(String(l.teacher_id), list);
  }

  const weeksOf = new Map<string, { weekStart: string; hours: number; note: string | null }[]>();
  for (const w of (weeks.data ?? []) as Record<string, unknown>[]) {
    const list = weeksOf.get(String(w.teacher_id)) ?? [];
    list.push({
      weekStart: String(w.week_start),
      hours: Number(w.hours ?? 0),
      note: (w.note as string) ?? null,
    });
    weeksOf.set(String(w.teacher_id), list);
  }

  const now = new Date();

  return Response.json({
    teachers: teachers.map((t) => {
      const weeks = (weeksOf.get(t.id) ?? []).sort((a, b) =>
        b.weekStart.localeCompare(a.weekStart)
      );
      return {
        ...person(t.id),
        hourlyRate: teacherRate(t),
        weeklyHours: teacherWeeklyHours(t),
        since: teacherSince(t),
        students: rosterOf.get(t.id) ?? [],
        weeks,
        // The same computation the teacher sees on his own dashboard, from the
        // same module — the payroll screen and his screen cannot disagree.
        pay: buildPay({
          now,
          rate: teacherRate(t),
          weeklyHours: teacherWeeklyHours(t),
          since: teacherSince(t),
          overrides: weeks,
        }),
      };
    }),
    // Everyone who is not a teacher — the pool the roster picker draws from.
    candidates: users
      .filter((u) => !isTeacher(u))
      .map((u) => person(u.id))
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'he')),
  });
}

export async function POST(request: Request): Promise<Response> {
  const db = await requireAdmin(request, true);
  if (db instanceof Response) return db;

  const body = await request.json().catch(() => null);
  const teacherId = typeof body?.teacherId === 'string' ? body.teacherId : '';
  const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
  if (!teacherId || !studentId) return jsonError('missing ids', 400);
  if (teacherId === studentId) return jsonError('מורה לא יכול להיות תלמיד של עצמו', 400);

  const { error } = await db
    .from('teacher_students')
    .upsert({ teacher_id: teacherId, student_id: studentId }, { onConflict: 'teacher_id,student_id' });
  if (error) return jsonError(error.message, 400);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request): Promise<Response> {
  const db = await requireAdmin(request, true);
  if (db instanceof Response) return db;

  const body = await request.json().catch(() => null);
  const teacherId = typeof body?.teacherId === 'string' ? body.teacherId : '';
  const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
  if (!teacherId || !studentId) return jsonError('missing ids', 400);

  const { error } = await db
    .from('teacher_students')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId);
  if (error) return jsonError(error.message, 400);
  return Response.json({ ok: true });
}

export async function PATCH(request: Request): Promise<Response> {
  const db = await requireAdmin(request, true);
  if (db instanceof Response) return db;

  const body = await request.json().catch(() => null);
  const teacherId = typeof body?.teacherId === 'string' ? body.teacherId : '';
  const weekStart = typeof body?.weekStart === 'string' ? body.weekStart : '';
  if (!teacherId) return jsonError('missing teacherId', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return jsonError('שבוע לא תקין', 400);
  // Sunday, or the override lands on a week nothing reads.
  if (new Date(`${weekStart}T00:00:00Z`).getUTCDay() !== 0) {
    return jsonError('תחילת שבוע חייבת להיות יום ראשון', 400);
  }

  // null = "forget the correction", which is not the same as zero hours.
  if (body?.hours === null) {
    const { error } = await db
      .from('teacher_week_hours')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('week_start', weekStart);
    if (error) return jsonError(error.message, 400);
    return Response.json({ ok: true, cleared: true });
  }

  const hours = Number(body?.hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
    return jsonError('שעות חייבות להיות בין 0 ל-168', 400);
  }
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 200) : null;

  const { error } = await db.from('teacher_week_hours').upsert(
    { teacher_id: teacherId, week_start: weekStart, hours, note, updated_at: new Date().toISOString() },
    { onConflict: 'teacher_id,week_start' }
  );
  if (error) return jsonError(error.message, 400);
  return Response.json({ ok: true });
}
