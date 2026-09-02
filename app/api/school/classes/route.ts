/**
 * /api/school/classes — the teacher's classes, and opening a new one.
 *
 * GET  → every class this user teaches, with its roster size and join code.
 * POST → open a class. The teacher becomes its first member, with role
 *        'teacher', in the same request.
 *
 * ⚠️ ZERO AI. Everything here is Postgres plus arithmetic; a teacher screen
 * that cost money per view would not be opened daily, and daily is the only
 * frequency at which this product is worth anything.
 */

import { requireUser, jsonError } from '@/lib/school-guard';
import { generateJoinCode, formatJoinCode } from '@/lib/join-code';

export const dynamic = 'force-dynamic';

const MAX_NAME = 40;
const MAX_SCHOOL = 80;
/** Codes are 32^6 ≈ 1.07 billion, so a collision is a lottery win rather than
 *  an expectation — but the unique index is the thing that decides, not the
 *  odds, so a clash retries instead of failing the teacher's first action. */
const CODE_ATTEMPTS = 5;

export async function GET(request: Request): Promise<Response> {
  const ctx = await requireUser(request, false);
  if (ctx instanceof Response) return ctx;

  const { data: memberships } = await ctx.db
    .from('class_members')
    .select('class_id')
    .eq('user_id', ctx.user.id)
    .eq('role', 'teacher');

  const ids = (memberships ?? []).map((m) => String(m.class_id));
  if (ids.length === 0) return Response.json({ classes: [] });

  const [{ data: classes }, { data: members }] = await Promise.all([
    ctx.db
      .from('classes')
      .select('id, name, school, units, school_year, join_code, archived, created_at')
      .in('id', ids)
      .order('created_at', { ascending: false }),
    ctx.db.from('class_members').select('class_id, role').in('class_id', ids),
  ]);

  const studentCount = new Map<string, number>();
  for (const m of members ?? []) {
    if (m.role !== 'student') continue;
    const k = String(m.class_id);
    studentCount.set(k, (studentCount.get(k) ?? 0) + 1);
  }

  return Response.json({
    classes: (classes ?? []).map((c) => ({
      id: String(c.id),
      name: String(c.name),
      school: (c.school as string) ?? null,
      units: (c.units as number) ?? null,
      schoolYear: String(c.school_year),
      // Formatted here so every screen shows the one spelling a teacher reads
      // aloud; lib/join-code.normalize folds it back on the way in.
      joinCode: c.join_code ? formatJoinCode(String(c.join_code)) : null,
      archived: !!c.archived,
      studentCount: studentCount.get(String(c.id)) ?? 0,
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const ctx = await requireUser(request, true);
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('bad request', 400);
  }

  const name = String(body.name ?? '').trim().slice(0, MAX_NAME);
  if (!name) return jsonError('צריך שם לכיתה', 400);

  const school = String(body.school ?? '').trim().slice(0, MAX_SCHOOL) || null;
  const schoolYear = String(body.schoolYear ?? '').trim().slice(0, 12) || 'תשפ״ז';
  const unitsRaw = Number(body.units);
  const units = [3, 4, 5].includes(unitsRaw) ? unitsRaw : null;

  // ponytail: any signed-in user may open a class. Deliberate for the pilot —
  // a maths teacher signs up and is running in a minute, with no role to be
  // granted by hand first. It grants nothing: the creator sees only the
  // students who choose to join HIS class. When a school signs, this becomes a
  // check against a verified school role.
  let created: { id: string; join_code: string } | null = null;
  let lastError = '';
  for (let i = 0; i < CODE_ATTEMPTS && !created; i++) {
    const code = generateJoinCode();
    const { data, error } = await ctx.db
      .from('classes')
      .insert({
        name,
        school,
        units,
        school_year: schoolYear,
        join_code: code,
        created_by: ctx.user.id,
      })
      .select('id, join_code')
      .single();

    if (data) created = { id: String(data.id), join_code: String(data.join_code) };
    // 23505 = unique_violation. Anything else is a real failure, not a clash.
    else if (error && error.code !== '23505') {
      lastError = error.message;
      break;
    }
  }

  if (!created) {
    console.error('[api/school/classes] create failed:', lastError || 'join code collision');
    return jsonError('לא הצלחנו לפתוח את הכיתה', 500);
  }

  // The teacher joins his own class. Two writes rather than one transaction:
  // if this second one fails the class exists with no teacher, which is
  // invisible (the GET above lists by membership) and recoverable, whereas a
  // failed rollback would leave a burnt join code.
  const teacherName =
    String((ctx.user.user_metadata?.name as string) || '').trim().slice(0, MAX_NAME) || 'המורה';

  const { error: memberError } = await ctx.db.from('class_members').insert({
    class_id: created.id,
    user_id: ctx.user.id,
    role: 'teacher',
    name: teacherName,
  });

  if (memberError) {
    console.error('[api/school/classes] teacher membership failed:', memberError.message);
    return jsonError('הכיתה נפתחה אבל לא הצלחנו לשייך אותך אליה', 500);
  }

  return Response.json({
    id: created.id,
    name,
    joinCode: formatJoinCode(created.join_code),
    studentCount: 0,
  });
}
