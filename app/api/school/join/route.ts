/**
 * /api/school/join — a student joins a class with the code the teacher read out.
 *
 * This is the entire student-identity story, and it is deliberately thin: no
 * school email, no ID number, no invitation to chase. The only personal field
 * that ends up stored is a display name, which the teacher needs in order to
 * know who is who and which the student already set on his own account.
 *
 * ⚠️ ZERO AI, one insert.
 */

import { requireUser, jsonError } from '@/lib/school-guard';
import { normalizeJoinCode, isValidJoinCode } from '@/lib/join-code';

export const dynamic = 'force-dynamic';

const MAX_NAME = 40;

export async function POST(request: Request): Promise<Response> {
  const ctx = await requireUser(request, true);
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('bad request', 400);
  }

  const raw = String(body.code ?? '');
  if (!isValidJoinCode(raw)) return jsonError('הקוד לא תקין — שישה תווים', 400);
  const code = normalizeJoinCode(raw);

  const { data: klass } = await ctx.db
    .from('classes')
    .select('id, name, archived')
    .eq('join_code', code)
    .maybeSingle();

  // One message for "no such code" and for "that class is closed". A different
  // error per case would turn this endpoint into a way to enumerate live codes,
  // and a student who typed it wrong needs the same next step either way.
  if (!klass || klass.archived) return jsonError('לא נמצאה כיתה עם הקוד הזה', 404);

  const { data: existing } = await ctx.db
    .from('class_members')
    .select('role')
    .eq('class_id', klass.id)
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  // Already in: succeed rather than error. A student who taps join twice, or
  // who was added and forgot, should land in the class — not be told off.
  if (existing) {
    return Response.json({ classId: String(klass.id), name: String(klass.name), joined: false });
  }

  const name =
    String((ctx.user.user_metadata?.name as string) || '').trim().slice(0, MAX_NAME) || 'תלמיד';

  const { error } = await ctx.db.from('class_members').insert({
    class_id: klass.id,
    user_id: ctx.user.id,
    role: 'student',
    name,
  });

  if (error) {
    console.error('[api/school/join] insert failed:', error.message);
    return jsonError('לא הצלחנו לצרף אותך לכיתה', 500);
  }

  return Response.json({ classId: String(klass.id), name: String(klass.name), joined: true });
}

export function GET(): Response {
  // Deliberately not a GET: a join link that works by being clicked can be
  // forwarded, and a code in a URL ends up in history and referrers.
  return jsonError('method not allowed', 405);
}
