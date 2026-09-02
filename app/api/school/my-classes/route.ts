/**
 * /api/school/my-classes — which classes the CALLER is in.
 *
 * Exists because `class_members` has RLS enabled with no policies at all, so a
 * student's browser cannot select from it directly — the deliberate posture
 * that stops one student reading his classmates' names. This route is the one
 * narrow hole in it, and it returns only the caller's OWN memberships.
 *
 * ⚠️ ZERO AI, two indexed reads.
 */

import { requireUser, jsonError } from '@/lib/school-guard';

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
  if (studentIn.length === 0) return Response.json({ classes: [] });

  const { data: classes } = await ctx.db
    .from('classes')
    .select('id, name')
    .in('id', studentIn)
    .eq('archived', false);

  return Response.json({
    classes: (classes ?? []).map((c) => ({ classId: String(c.id), name: String(c.name) })),
  });
}

export function POST(): Response {
  return jsonError('method not allowed', 405);
}
