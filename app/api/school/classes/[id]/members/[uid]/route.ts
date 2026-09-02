/**
 * DELETE /api/school/classes/[id]/members/[uid] — remove a student from a class.
 *
 * The membership row goes; the student's attempts stay. His history belongs to
 * him and to whichever class he is in next, and a teacher fixing "she joined
 * י׳3 instead of י׳4" must not be able to erase a term of work by accident.
 * Teachers cannot remove themselves here — that would orphan the class.
 */

import { requireClassTeacher, jsonError, isUuid } from '@/lib/school-guard';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; uid: string }> }
): Promise<Response> {
  const { id, uid } = await params;
  const ctx = await requireClassTeacher(request, id, true);
  if (ctx instanceof Response) return ctx;
  if (!isUuid(uid)) return jsonError('bad request', 400);

  const { error } = await ctx.db
    .from('class_members')
    .delete()
    .eq('class_id', ctx.classId)
    .eq('user_id', uid)
    .eq('role', 'student');

  if (error) {
    console.error('[api/school/members] delete failed:', error.message);
    return jsonError('לא הצלחנו להסיר', 500);
  }
  return new Response(null, { status: 204 });
}
