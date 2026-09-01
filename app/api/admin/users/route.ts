/**
 * /api/admin/users — the owner's user-management API.
 *
 * GET    → list every account (id, email, name, created, last sign-in, pro)
 * POST   → create an account            { email, password, name? }
 * PATCH  → account flags, one key at a time (only what the body names):
 *          { id, pro } | { id, teacher } | { id, hourlyRate } | { id, weeklyHours }
 * DELETE → delete an account            { id }
 *
 * Every method requires a signed-in session that passes isAdmin() — the same
 * email allowlist the whole app gates on. Mutations additionally require a
 * same-origin request (cookie auth is CSRF-able without it). All work runs on
 * the service-role client; 503 when the key isn't configured.
 *
 * PATCH exists because until billing ships, Pro is granted by hand — this
 * replaces the raw-SQL snippet documented in lib/access.ts. It writes
 * app_metadata (service-role only), never user_metadata (user-writable).
 *
 * DELETE is safe to cascade: every per-user table references auth.users(id)
 * with ON DELETE CASCADE, so the account's rows go with it.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin, isTeacher, teacherRate, teacherWeeklyHours, teacherSince } from '@/lib/access';
import { israelDay } from '@/lib/teacher-pay';

export const dynamic = 'force-dynamic';

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

// Browsers always send Origin on cross-site and same-site POST/PATCH/DELETE,
// so a missing header on a mutation is itself suspect — reject it.
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

type AdminCtx = { admin: SupabaseClient; selfId: string };

async function requireAdmin(request: Request, mutating: boolean): Promise<AdminCtx | Response> {
  if (mutating && !sameOrigin(request)) return jsonError('forbidden', 403);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return jsonError('forbidden', 403);
  const admin = createAdminClient();
  if (!admin) return jsonError('SUPABASE_SERVICE_ROLE_KEY is not configured', 503);
  return { admin, selfId: user.id };
}

function toRow(u: User) {
  return {
    id: u.id,
    email: u.email ?? '',
    name: typeof u.user_metadata?.name === 'string' ? u.user_metadata.name : '',
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    confirmed: !!u.email_confirmed_at,
    pro: u.app_metadata?.pro === true,
    teacher: isTeacher(u),
    hourlyRate: teacherRate(u),
    weeklyHours: teacherWeeklyHours(u),
    teacherSince: teacherSince(u),
  };
}

export async function GET(request: Request) {
  const ctx = await requireAdmin(request, false);
  if (ctx instanceof Response) return ctx;

  const all: User[] = [];
  // ponytail: paged to 10k accounts max — revisit if the app ever gets there.
  let page: number | null = 1;
  while (page && page <= 10) {
    const { data, error } = await ctx.admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return jsonError(error.message, 500);
    all.push(...data.users);
    page = data.nextPage;
  }

  const users = all
    .map(toRow)
    // Most recently signed-in first; never-signed-in ('' sorts below any ISO date) last.
    .sort((a, b) => (b.lastSignInAt ?? '').localeCompare(a.lastSignInAt ?? ''));

  return Response.json({ users, selfId: ctx.selfId });
}

export async function POST(request: Request) {
  const ctx = await requireAdmin(request, true);
  if (ctx instanceof Response) return ctx;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return jsonError('אימייל לא תקין', 400);
  if (password.length < 6) return jsonError('סיסמה קצרה מדי — לפחות 6 תווים', 400);

  const { data, error } = await ctx.admin.auth.admin.createUser({
    email,
    password,
    // Admin-created accounts skip the confirmation mail — the owner hands the
    // password over directly and the account must work immediately.
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });
  if (error) return jsonError(error.message, 400);
  return Response.json({ user: data.user ? toRow(data.user) : null });
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin(request, true);
  if (ctx instanceof Response) return ctx;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return jsonError('missing id', 400);

  // app_metadata is shallow-merged by GoTrue, so a patch touches only the keys
  // it names. ⚠️ Only keys PRESENT in the body are written: `pro: body.pro ===
  // true` on its own would revoke Pro every time the teacher terms are saved.
  const patch: Record<string, unknown> = {};

  if (body && 'pro' in body) patch.pro = body.pro === true;

  if (body && 'teacher' in body) {
    const teacher = body.teacher === true;
    patch.teacher = teacher;
    if (teacher) {
      // Stamp the hire date once, on the first grant — lib/teacher-pay refuses
      // to accrue weeks before it, and `created_at` would be wrong for a
      // student later promoted to teacher.
      const { data } = await ctx.admin.auth.admin.getUserById(id);
      if (!teacherSince(data?.user ?? null)) patch.teacherSince = israelDay(new Date());
    }
  }

  for (const key of ['hourlyRate', 'weeklyHours'] as const) {
    if (!body || !(key in body)) continue;
    const value = Number(body[key]);
    // The ceilings are sanity rails, not policy: no one is paid ₪10,000/hour
    // and no week holds 168 hours of teaching.
    const max = key === 'hourlyRate' ? 10000 : 168;
    if (!Number.isFinite(value) || value < 0 || value > max) {
      return jsonError(key === 'hourlyRate' ? 'תעריף לא תקין' : 'שעות שבועיות לא תקינות', 400);
    }
    patch[key] = value;
  }

  if (Object.keys(patch).length === 0) return jsonError('אין מה לעדכן', 400);

  const { error } = await ctx.admin.auth.admin.updateUserById(id, { app_metadata: patch });
  if (error) return jsonError(error.message, 400);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await requireAdmin(request, true);
  if (ctx instanceof Response) return ctx;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return jsonError('missing id', 400);
  if (id === ctx.selfId) return jsonError('אי אפשר למחוק את חשבון המנהל שאתה מחובר אליו', 400);

  const { error } = await ctx.admin.auth.admin.deleteUser(id);
  if (error) return jsonError(error.message, 400);
  return Response.json({ ok: true });
}
