/**
 * /api/school/focus — point students at something that already exists.
 *
 * GET  → the catalogue the picker is built from (topics → sub-topics → the
 *        rungs each one actually has content for).
 * POST → write one focus, optionally aimed at named students.
 *
 * THE PRODUCT DECISION THIS ROUTE ENFORCES: the teacher never authors content.
 * Every field below is a pointer into material the app already serves, chosen
 * from closed lists, and the only free text is an optional 200-character note.
 * There is no question editor here and there is not going to be one.
 *
 * ⚠️ ZERO AI.
 */

import { requireClassTeacher, jsonError, isUuid } from '@/lib/school-guard';
import { focusCatalogue, validateFocus } from '@/lib/focus-target';

export const dynamic = 'force-dynamic';

const MAX_NOTE = 200;
/** A focus aimed at more students than a class holds is a bug in the caller,
 *  not a big class. */
const MAX_TARGETS = 60;

export async function GET(): Promise<Response> {
  // The catalogue is public content — the same lessons any visitor can open —
  // so this needs no class scope. It is a pure read over modules already
  // loaded in the server process.
  return Response.json({ catalogue: focusCatalogue() });
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('bad request', 400);
  }

  const classId = String(body.classId ?? '');
  const ctx = await requireClassTeacher(request, classId, true);
  if (ctx instanceof Response) return ctx;

  // ⚠️ Validated against the real content catalogue, not just for shape. A
  // focus naming a topic that does not exist does not fail — it produces a task
  // that can never reach 100%, and the STUDENT is the one who then looks like
  // he did not do it. See lib/focus-target.
  const check = validateFocus(body);
  if (!check.ok) return jsonError(check.reason, 400);
  const { topic, subTopicId, rung } = check.target;

  const rawTarget = Number(body.targetCount);
  const targetCount =
    Number.isInteger(rawTarget) && rawTarget >= 1 && rawTarget <= 100 ? rawTarget : null;

  const dueOn =
    typeof body.dueOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueOn) ? body.dueOn : null;

  const note = String(body.note ?? '').trim().slice(0, MAX_NOTE) || null;

  // Empty means the WHOLE CLASS, which is the common case and costs no rows.
  const rawStudents = Array.isArray(body.studentIds) ? body.studentIds : [];
  const studentIds = [...new Set(rawStudents.filter(isUuid))].slice(0, MAX_TARGETS);
  if (rawStudents.length > 0 && studentIds.length === 0) {
    return jsonError('רשימת התלמידים לא תקינה', 400);
  }

  // Every named student must actually be in this class. Without this check a
  // teacher could aim a focus at any user id in the system, and that student
  // would see a task from a class he is not in.
  if (studentIds.length > 0) {
    const { data: members } = await ctx.db
      .from('class_members')
      .select('user_id')
      .eq('class_id', ctx.classId)
      .eq('role', 'student')
      .in('user_id', studentIds);

    const inClass = new Set((members ?? []).map((m) => String(m.user_id)));
    const stranger = studentIds.find((id) => !inClass.has(id));
    if (stranger) return jsonError('אחד התלמידים לא בכיתה הזו', 400);
  }

  const { data: created, error } = await ctx.db
    .from('focus')
    .insert({
      class_id: ctx.classId,
      created_by: ctx.user.id,
      topic,
      sub_topic_id: subTopicId,
      rung,
      target_count: targetCount,
      due_on: dueOn,
      note,
    })
    .select('id, created_at')
    .single();

  if (error || !created) {
    console.error('[api/school/focus] insert failed:', error?.message);
    return jsonError('לא הצלחנו לשמור את המיקוד', 500);
  }

  if (studentIds.length > 0) {
    const { error: targetError } = await ctx.db
      .from('focus_targets')
      .insert(studentIds.map((student_id) => ({ focus_id: created.id, student_id })));

    if (targetError) {
      // A focus whose targets failed to write would silently become a
      // whole-class task — the opposite of what the teacher asked for, and
      // aimed at thirty people instead of four. Undo it rather than leave that.
      await ctx.db.from('focus').delete().eq('id', created.id);
      console.error('[api/school/focus] targets failed:', targetError.message);
      return jsonError('לא הצלחנו לשמור את המיקוד', 500);
    }
  }

  return Response.json({
    id: String(created.id),
    topic,
    subTopicId,
    rung,
    targetCount,
    dueOn,
    note,
    targetedCount: studentIds.length || null,
  });
}
