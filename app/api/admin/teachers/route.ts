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

  const [links, weeks, tasks] = await Promise.all([
    db.from('teacher_students').select('teacher_id, student_id').limit(5000),
    db.from('teacher_week_hours').select('teacher_id, week_start, hours, note').limit(5000),
    // The only action a tutor takes that leaves a row. Salary accrues whether
    // or not anybody does anything; this and last_sign_in_at are the two
    // signals that somebody did.
    db.from('assignments').select('teacher_id, created_at').limit(5000),
  ]);

  const taskCount = new Map<string, number>();
  for (const t of (tasks.data ?? []) as Record<string, unknown>[]) {
    const id = String(t.teacher_id);
    taskCount.set(id, (taskCount.get(id) ?? 0) + 1);
  }

  const person = (id: string) => {
    const u = byId.get(id);
    return {
      id,
      email: u?.email ?? '',
      name: (u?.user_metadata?.name as string) || '',
      lastSignInAt: u?.last_sign_in_at ?? null,
      // A student deleted from auth cascades out of teacher_students, so this
      // only shows for a row written against an id that never existed.
      missing: !u,
    };
  };

  // Every assigned student's last sign of life. Parents cancel after three
  // quiet weeks, not after a bad grade — and the tutor deliberately has no
  // email or phone number, so a student who goes silent can only be reached
  // by the owner. This is the column that makes that call happen.
  const assignedIds = [
    ...new Set(((links.data ?? []) as Record<string, unknown>[]).map((l) => String(l.student_id))),
  ];
  const pulse = new Map<string, { lastAnswerAt: number | null; syncedAt: string | null }>();
  if (assignedIds.length > 0) {
    const { data: states } = await db
      .from('learning_state')
      .select('user_id, results, updated_at')
      .in('user_id', assignedIds);
    for (const st of (states ?? []) as Record<string, unknown>[]) {
      const rows = Array.isArray(st.results) ? (st.results as { ts?: number }[]) : [];
      let last: number | null = null;
      for (const r of rows) {
        if (typeof r.ts === 'number' && (last === null || r.ts > last)) last = r.ts;
      }
      pulse.set(String(st.user_id), {
        lastAnswerAt: last,
        syncedAt: typeof st.updated_at === 'string' ? st.updated_at : null,
      });
    }
  }

  const rosterOf = new Map<string, (ReturnType<typeof person> & {
    lastAnswerAt: number | null;
    syncedAt: string | null;
  })[]>();
  for (const l of (links.data ?? []) as Record<string, unknown>[]) {
    const sid = String(l.student_id);
    const list = rosterOf.get(String(l.teacher_id)) ?? [];
    // null syncedAt = never opened the app signed in. NOT a zero — the owner's
    // screens must say the difference, same rule as the teacher's board.
    list.push({ ...person(sid), ...(pulse.get(sid) ?? { lastAnswerAt: null, syncedAt: null }) });
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

  // `?month=YYYY-MM` — on the 1st, the one day the owner actually pays, the
  // screen has already rolled over and shows ₪0 for the month he owes. For a
  // past month every week is counted; for the current one it stays "so far",
  // because a date in the future would pay for weeks nobody has worked yet.
  const monthParam = new URL(request.url).searchParams.get('month');
  const today = new Date();
  let now = today;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0, 12));
    now = lastDay < today ? lastDay : today;
  }

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
        assignmentsGiven: taskCount.get(t.id) ?? 0,
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
