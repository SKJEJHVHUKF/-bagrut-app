/**
 * /api/teacher/assignments — the teacher hands one student a task.
 *
 *   POST   { studentId, title, topic, subTopicId?, targetCount?, dueDate? }
 *   DELETE { id }
 *
 * Reading is not here: the teacher's copy comes back inside
 * /api/teacher/overview (with each task's progress already counted), and the
 * student's copy is selected straight from his own browser under the
 * `own assignments select` RLS policy.
 *
 * ⚠️ `studentId` is checked against the teacher's roster before anything is
 * written. It arrives from the browser, so on its own it is a request to write
 * a task into an arbitrary student's app.
 */

import { requireTeacher, roster, jsonError } from '@/lib/teacher-guard';
import { roadmapTopicOrder } from '@/constants/roadmapData';

export const dynamic = 'force-dynamic';

/** Long enough for a real instruction, short enough not to be a document. */
const MAX_TITLE = 120;

/** The topics answers are actually recorded under — the curriculum, not free text. */
const ASSIGNABLE = new Set([...roadmapTopicOrder('571'), ...roadmapTopicOrder('572')]);

export async function POST(request: Request): Promise<Response> {
  const ctx = await requireTeacher(request, true);
  if (ctx instanceof Response) return ctx;

  const body = await request.json().catch(() => null);
  const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, MAX_TITLE) : '';
  const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
  const subTopicId = typeof body?.subTopicId === 'string' ? body.subTopicId.trim() : '';
  const dueDate = typeof body?.dueDate === 'string' && body.dueDate ? body.dueDate : null;
  const targetCount = Number(body?.targetCount ?? 5);

  if (!title) return jsonError('חסרה כותרת למטלה', 400);
  if (!topic) return jsonError('חסר נושא למטלה', 400);
  // The topic is matched string-for-string against ResultEvent.topic on every
  // answer the student gives, so an unrecognised one produces a task whose
  // progress counter reads 0/5 forever with nothing to explain it. The form
  // only offers real topics; this is the same rule on the server, where it
  // cannot be bypassed by anything hand-crafting a request.
  if (!ASSIGNABLE.has(topic)) return jsonError('נושא לא מוכר', 400);
  if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 100) {
    return jsonError('מספר השאלות חייב להיות בין 1 ל-100', 400);
  }
  if (dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return jsonError('תאריך יעד לא תקין', 400);
  }

  // THE check: his own student, or nothing.
  const mine = await roster(ctx);
  if (!mine.includes(studentId)) return jsonError('התלמיד הזה לא ברשימה שלך', 403);

  const { data, error } = await ctx.db
    .from('assignments')
    .insert({
      teacher_id: ctx.teacher.id,
      student_id: studentId,
      title,
      topic,
      sub_topic_id: subTopicId || null,
      target_count: targetCount,
      due_date: dueDate,
    })
    .select('id')
    .single();
  if (error) return jsonError(error.message, 400);

  return Response.json({ id: data?.id ?? null });
}

export async function DELETE(request: Request): Promise<Response> {
  const ctx = await requireTeacher(request, true);
  if (ctx instanceof Response) return ctx;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return jsonError('missing id', 400);

  // Scoped by teacher_id, so a guessed id deletes nothing that isn't his.
  const { error } = await ctx.db
    .from('assignments')
    .delete()
    .eq('id', id)
    .eq('teacher_id', ctx.teacher.id);
  if (error) return jsonError(error.message, 400);

  return Response.json({ ok: true });
}
