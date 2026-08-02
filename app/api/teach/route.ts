/**
 * POST /api/teach — "למד את הבוט".
 *
 * The student teaches; the model plays a classmate who doesn't understand.
 * Returns a typed turn, never prose:
 *   { reply, covered[], probeTargetId, understood, remaining }
 *
 * ONE call does two jobs — the in-character reply AND the rubric-coverage
 * judgement — because the model has read the explanation either way. The
 * end-of-session report is then assembled on the client from the accumulated
 * ids at zero extra cost; there is no separate "grade it" call.
 *
 * Not streamed: the payload is structured, ~2-4s on Haiku, and the moment that
 * carries the experience is the rubric checklist lighting up, not text arriving
 * token by token.
 *
 * Body: {
 *   subject:     string   ('math5')
 *   topic:       string   (Hebrew topic name — must have an authored lesson)
 *   subTopicId:  string   (slug; must be teachable — see MIN_RUBRIC_POINTS)
 *   message:     string   (the student's explanation; '' opens the session)
 *   history?:    {role, content}[]
 *   covered?:    string[] (rubric ids accumulated client-side)
 *   unitLevel?:  3 | 4 | 5
 *   formNumber?: string
 * }
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { guardAgentRequest, logAgentUsage, sanitizeText } from '@/lib/agents/guard';
import { buildTeachSystem } from '@/lib/teach/prompt';
import { buildRubric, coerceCoveredIds, MIN_RUBRIC_POINTS } from '@/lib/teach/rubric';
import {
  TeachRequestSchema,
  TeachReplySchema,
  type TeachResponse,
} from '@/lib/teach/schemas';
import {
  TEACH_MODEL,
  TEACH_MAX_TOKENS,
  TEACH_HISTORY_TURNS,
  MAX_TEACH_MESSAGE_LEN,
  MAX_TOPIC_LEN,
  FREE_DAILY_TEACH,
  PRO_DAILY_TEACH,
  normalizeUnitLevel,
  normalizeFormNumber,
} from '@/lib/agents/config';

export const maxDuration = 60;

/** Bootstraps the opening turn. The Messages API needs a user message to
 *  respond to, but on turn one the student hasn't said anything — the system
 *  prompt's `opening` block is what actually drives the first line. */
const OPENING_BOOTSTRAP = '[התלמיד פתח את הסשן ומחכה שתתחילי. פתחי בבלבול שלך.]';

export async function POST(request: Request) {
  try {
    // ===== 1. GATE =====
    const gate = await guardAgentRequest(request, {
      kind: 'teach',
      freeDaily: FREE_DAILY_TEACH,
      proDaily: PRO_DAILY_TEACH,
    });
    if (!gate.ok) return gate.response;
    const { user, supabase, remaining } = gate;

    // ===== 2. BODY =====
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = TeachRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }
    const body = parsed.data;

    // ===== 3. RUBRIC =====
    // Derived from the authored content, so an unknown topic/sub-topic fails
    // here — before a token is spent — rather than producing a plausible-
    // sounding conversation grounded in nothing.
    const subject = sanitizeText(body.subject, MAX_TOPIC_LEN) || 'math5';
    const topic = sanitizeText(body.topic, MAX_TOPIC_LEN);
    const subTopicId = sanitizeText(body.subTopicId, MAX_TOPIC_LEN);

    const rubric = buildRubric(subject, topic, subTopicId);
    if (!rubric) {
      return Response.json({ error: 'תת-הנושא לא נמצא.' }, { status: 404 });
    }
    if (rubric.points.length < MIN_RUBRIC_POINTS) {
      return Response.json(
        { error: 'עדיין אין מספיק חומר כתוב בתת-הנושא הזה כדי ללמד אותו.' },
        { status: 422 }
      );
    }

    // ===== 4. TRANSCRIPT =====
    const message = sanitizeText(body.message, MAX_TEACH_MESSAGE_LEN);
    const opening = message.length === 0;

    // NOTE: the student's explanation is deliberately NOT blacklist-rejected.
    // It is untrusted DATA, not instructions — a legitimate explanation can
    // contain almost anything, and the system prompt already tells the model to
    // treat embedded instructions as material it is reacting to. Same call the
    // grader makes about a student's solution.
    const history = (body.history ?? [])
      .slice(-TEACH_HISTORY_TURNS)
      .map((t) => ({
        role: t.role,
        content: sanitizeText(t.content, MAX_TEACH_MESSAGE_LEN),
      }))
      .filter((t) => t.content.length > 0);

    // The window can open on an assistant turn (the classmate speaks first, so
    // every transcript does), and the Messages API rejects that. Shift until
    // it's user-first — the same 400-avoidance the chat route needs.
    while (history.length && history[0].role === 'assistant') history.shift();

    const messages = [
      ...history,
      { role: 'user' as const, content: opening ? OPENING_BOOTSTRAP : message },
    ];

    // ===== 5. MODEL =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    const unitLevel = normalizeUnitLevel(body.unitLevel);
    const formNumber = normalizeFormNumber(body.formNumber);
    const covered = coerceCoveredIds(rubric, body.covered);

    const stream = client.messages.stream({
      model: TEACH_MODEL,
      max_tokens: TEACH_MAX_TOKENS,
      system: buildTeachSystem({ unitLevel, formNumber, rubric, covered, opening }),
      messages,
      // ⚠️ `format` only — Haiku 4.5 returns 400 on `output_config.effort`.
      output_config: { format: zodOutputFormat(TeachReplySchema) },
    });

    let final;
    try {
      final = await stream.finalMessage();
    } catch (parseErr) {
      console.error('[teach] response did not match the schema:', parseErr);
      return Response.json({ error: 'נועה לא הצליחה להגיב. נסה שוב.' }, { status: 502 });
    }
    const turn = final.parsed_output;

    console.log(
      `[teach] ${topic}/${subTopicId} u=${unitLevel} covered=${covered.length}/${rubric.points.length} ` +
        `in=${final.usage.input_tokens} out=${final.usage.output_tokens} stop=${final.stop_reason}`
    );

    if (!turn) {
      // Structured outputs make this near-impossible; the realistic cause is
      // stop_reason 'max_tokens' (JSON cut off) or a safety refusal.
      console.error('[teach] no parsed_output, stop_reason:', final.stop_reason);
      return Response.json({ error: 'נועה לא הצליחה להגיב. נסה שוב.' }, { status: 502 });
    }

    // ===== 6. NARROW =====
    // Structured outputs constrain the SHAPE, not the VALUES: the model can
    // return an id that isn't in the rubric. Dropping unknown ids here is what
    // stops an invented id from lighting up a checklist row the student never
    // actually earned.
    const newlyCovered = coerceCoveredIds(rubric, turn.coveredPointIds);
    const probeTargetId =
      rubric.points.some((p) => p.id === turn.probeTargetId) ? turn.probeTargetId : null;

    await logAgentUsage(supabase, user.id, 'teach');

    const payload: TeachResponse = {
      reply: turn.reply,
      covered: newlyCovered,
      probeTargetId,
      understood: !!turn.understood,
      remaining,
    };

    return Response.json(payload, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[teach] error:', error);
    return Response.json({ error: 'שגיאה בשיחה. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
