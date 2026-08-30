/**
 * /api/tutor-trace — the turns that cost nothing.
 *
 * ============================================================
 * WHY THIS ROUTE EXISTS AT ALL
 * ============================================================
 * `tutor_trace` was born recording only turns that reached the model, because
 * those are the ones `/api/chat` can see. That answers "why did we pay" and
 * cannot answer "how often do we pay" — and the second is the question that
 * was actually being asked. Three `unknown_intent` rows out of five is 60% of
 * the FAILURES; whether five turns happened or forty is invisible, so "most
 * questions are answered locally" stayed a feeling instead of a number.
 *
 * A turn answered by the router, the ladder, the FAQ bank or a topic card
 * never leaves the browser. So the browser posts one small record here, and
 * the same table finally has a denominator.
 *
 * ============================================================
 * WHAT IT COSTS AND WHAT IT IS NOT
 * ============================================================
 * No Anthropic client, no import that leads to one. `billable: false` so the
 * daily AI quota is untouched — a student must never lose an allowance for a
 * turn that cost nothing, which is the whole point of the row.
 *
 * The abuse gates still apply: the session is required and the burst limiter
 * runs, because an open endpoint that writes rows is an open endpoint that
 * writes rows. Nothing here is read back to the student, so a forged row can
 * only pollute a report — bounded further by the enums the sanitizer applies.
 *
 * No user id, no conversation, no sentence a student wrote. Same table, same
 * privacy contract, described in supabase-tutor-trace.sql.
 */

import { guardAgentRequest } from '@/lib/agents/guard';
import { recordTutorTrace } from '@/lib/tutor-trace-store';

export const maxDuration = 10;

export async function POST(request: Request): Promise<Response> {
  const gate = await guardAgentRequest(request, {
    kind: 'check',
    freeDaily: 0,
    proDaily: 0,
    billable: false,
  });
  if (!gate.ok) return gate.response;

  let body: { trace?: unknown; durationMs?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Awaited here, unlike in /api/chat: there is no reply streaming that a slow
  // write could hold up, and the caller does not wait on the response anyway.
  // Still cannot throw — `recordTutorTrace` swallows everything by contract.
  await recordTutorTrace(body.trace, {
    durationMs:
      typeof body.durationMs === 'number' && Number.isFinite(body.durationMs)
        ? Math.max(0, Math.min(60_000, body.durationMs))
        : 0,
    model: 'local',
    inputTokens: 0,
    outputTokens: 0,
    cachedRead: 0,
    cachedWrite: 0,
    usedLlm: false,
  });

  // 204: there is nothing to say back, and the client is not listening.
  return new Response(null, { status: 204 });
}

export function GET(): Response {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
