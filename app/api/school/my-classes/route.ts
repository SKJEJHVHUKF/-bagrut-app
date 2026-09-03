/**
 * /api/school/my-classes — the student's own side of the class, in one call.
 *
 * Returns which classes the CALLER is a student in, and the focuses ("המורה
 * ביקש") that are aimed at him. Both come from here, on the service-role
 * client, because every school table has RLS enabled with no policies — the
 * deliberate posture that stops one student reading his classmates. This route
 * is the one narrow hole in it, and it returns only the caller's OWN data.
 *
 * ⚠️ The focuses used to be selected straight from the browser against an RLS
 * policy. That policy could never be true — see lib/focus-visibility.ts for the
 * whole story — so a task a teacher sent simply never appeared. It is resolved
 * here now, where the tables are actually readable, and it costs no extra
 * serverless invocation: /my-class already made this exact call for the class
 * name.
 *
 * ⚠️ ZERO AI, four indexed reads.
 */

import { requireUser, jsonError } from '@/lib/school-guard';
import {
  visibleFocus,
  FOCUS_MAX_AGE_DAYS,
  FOCUS_LIMIT,
  type StudentFocusRow,
} from '@/lib/focus-visibility';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const ctx = await requireUser(request, false);
  if (ctx instanceof Response) return ctx;

  const { data: memberships } = await ctx.db
    .from('class_members')
    .select('class_id, role')
    .eq('user_id', ctx.user.id);

  const rows = memberships ?? [];
  const studentIn = rows.filter((m) => m.role === 'student').map((m) => String(m.class_id));
  // A teacher opening the student screen should not see his own class listed as
  // one he "joined" — that is the console's job, and conflating them is how the
  // two sides got muddled in the first place.
  if (studentIn.length === 0) return Response.json({ classes: [], focus: [] });

  const { data: classRows } = await ctx.db
    .from('classes')
    .select('id, name')
    .in('id', studentIn)
    .eq('archived', false);

  const classes = (classRows ?? []).map((c) => ({ classId: String(c.id), name: String(c.name) }));

  // Archived class ⇒ its tasks are over too. Filtering here rather than after
  // the select also stops an archived class's old tasks from filling the limit
  // and pushing this week's out of the list.
  const liveIds = classes.map((c) => c.classId);
  if (liveIds.length === 0) return Response.json({ classes, focus: [] });

  const since = new Date(Date.now() - FOCUS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: focusRows } = await ctx.db
    .from('focus')
    .select('id, topic, sub_topic_id, rung, target_count, due_on, note, created_at')
    .in('class_id', liveIds)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(FOCUS_LIMIT);

  const focuses = (focusRows ?? []).map(
    (f): StudentFocusRow => ({
      id: String(f.id),
      topic: String(f.topic ?? ''),
      sub_topic_id: (f.sub_topic_id as string) ?? null,
      rung: (f.rung as string) ?? null,
      target_count: (f.target_count as number) ?? null,
      due_on: (f.due_on as string) ?? null,
      note: (f.note as string) ?? null,
      created_at: String(f.created_at),
    })
  );

  // The whole target list for these focuses, not just the caller's rows: "aimed
  // at nobody in particular" and "aimed at someone else" are the same thing
  // from a filtered view, and only one of them is his.
  const { data: targetRows } = focuses.length
    ? await ctx.db
        .from('focus_targets')
        .select('focus_id, student_id')
        .in(
          'focus_id',
          focuses.map((f) => f.id)
        )
    : { data: [] as Record<string, unknown>[] };

  const targets = (targetRows ?? []).map((t) => ({
    focus_id: String(t.focus_id),
    student_id: String(t.student_id),
  }));

  return Response.json({ classes, focus: visibleFocus(focuses, targets, ctx.user.id) });
}

export function POST(): Response {
  return jsonError('method not allowed', 405);
}
