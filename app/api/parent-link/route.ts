/**
 * /api/parent-link — the weekly parent link: get it, or replace it.
 *
 *   POST   {}                     → the caller's own link
 *   POST   {classId, studentId}   → a student's link, for the teacher of that class
 *   DELETE (either body)          → revoke: bump the version, return the NEW link
 *
 * The response is `{ url }` and nothing else — no name, no data.
 *
 * ⚠️ Both methods mint a credential, so both are mutations: same-origin through
 * requireUser(request, true). A teacher reaches only a student on the roster of
 * a class he teaches, checked here, never taken from the body on trust.
 *
 * ⚠️ ZERO AI.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser, requireClassTeacher, classRoster, jsonError, isUuid } from '@/lib/school-guard';
import {
  signParentToken,
  parentLinkUrl,
  parentLinkVersion,
  revokedParentLinkMeta,
} from '@/lib/parent-link';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function link(request: Request, revoke: boolean): Promise<Response> {
  let body: { classId?: unknown; studentId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('bad request', 400);
  }
  if (!body || typeof body !== 'object') return jsonError('bad request', 400);

  let db: SupabaseClient;
  let userId: string;
  if (body.classId === undefined && body.studentId === undefined) {
    const ctx = await requireUser(request, true);
    if (ctx instanceof Response) return ctx;
    db = ctx.db;
    userId = ctx.user.id;
  } else {
    // Either field present = the teacher path, and it needs both. Falling back
    // to "the caller's own link" here would hand a teacher HIS link labelled
    // with a student's name.
    const ctx = await requireClassTeacher(request, String(body.classId), true);
    if (ctx instanceof Response) return ctx;
    const { studentId } = body;
    if (!isUuid(studentId)) return jsonError('forbidden', 403);
    const roster = await classRoster(ctx);
    if (!roster.some((s) => s.id === studentId)) return jsonError('forbidden', 403);
    db = ctx.db;
    userId = studentId;
  }

  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error('[api/parent-link] getUserById failed:', error?.message);
    return jsonError('לא הצלחנו ליצור קישור', 500);
  }

  let version = parentLinkVersion(data.user.app_metadata);
  if (revoke) {
    const app_metadata = revokedParentLinkMeta(data.user.app_metadata);
    const { error: updateError } = await db.auth.admin.updateUserById(userId, { app_metadata });
    if (updateError) {
      console.error('[api/parent-link] revoke failed:', updateError.message);
      return jsonError('לא הצלחנו ליצור קישור חדש', 500);
    }
    version = app_metadata.parent_link_v;
  }

  return Response.json({ url: parentLinkUrl(signParentToken(userId, version)) });
}

export function POST(request: Request): Promise<Response> {
  return link(request, false);
}

export function DELETE(request: Request): Promise<Response> {
  return link(request, true);
}
