/**
 * POST /api/chat/grade — the structured bagrut-examiner agent.
 *
 * Returns a typed verdict, never prose:
 *   { score, isCorrect, summary, errors[{ step, errorType, description }], feedback }
 *
 * HOW THE JSON IS GUARANTEED
 * The Zod schema is handed to Anthropic as a STRUCTURED OUTPUT
 * (`output_config.format` + `zodOutputFormat`), so the model is constrained to
 * emit exactly that shape and the SDK hands back a typed `parsed_output`.
 * There is no JSON.parse, no brace-repair, and no "the model returned prose"
 * retry — retries are the expensive failure mode, and this removes them.
 *
 * That is also why the model is Sonnet 5 rather than the Sonnet 4.6 used
 * elsewhere in the app: 4.6 does not support structured outputs. Same list
 * price, currently cheaper (introductory), and it removes a whole error class.
 *
 * Streamed (not `messages.parse`) purely for the 60s Vercel Hobby ceiling —
 * a non-streaming call with thinking + 3000 max_tokens can brush against the
 * SDK's HTTP timeout. We ignore the deltas and read `finalMessage()`.
 *
 * Body: {
 *   solution:   string        (3..4000 chars, required — the student's work)
 *   question?:  string        (the problem being solved; strongly recommended)
 *   unitLevel?: 3 | 4 | 5     (default 5)
 *   formNumber?: string       (default '572'; '581'/'582' auto-map to 571/572)
 *   topic?:     string        (unlocks verified-content grounding)
 * }
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { guardAgentRequest, logAgentUsage, sanitizeText, BLACKLIST } from '@/lib/agents/guard';
import { buildGraderSystem } from '@/lib/agents/prompts';
import {
  GradeRequestSchema,
  GradeSchema,
  toErrorType,
  type GradeResponse,
} from '@/lib/agents/schemas';
import {
  GRADER_MODEL,
  GRADER_MAX_TOKENS,
  FREE_DAILY_GRADE,
  PRO_DAILY_GRADE,
  MIN_MESSAGE_LEN,
  MAX_SOLUTION_LEN,
  MAX_QUESTION_LEN,
  MAX_TOPIC_LEN,
  graderEffort,
  graderThinking,
  normalizeUnitLevel,
  normalizeFormNumber,
} from '@/lib/agents/config';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // ===== 1. GATE =====
    const gate = await guardAgentRequest(request, {
      kind: 'grade',
      freeDaily: FREE_DAILY_GRADE,
      proDaily: PRO_DAILY_GRADE,
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

    const parsed = GradeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }
    const body = parsed.data;

    // ===== 3. PRE-CALL VALIDATION =====
    const solution = sanitizeText(body.solution, MAX_SOLUTION_LEN);
    if (solution.length < MIN_MESSAGE_LEN) {
      return Response.json({ error: 'אין פתרון לבדוק.' }, { status: 400 });
    }

    const question = sanitizeText(body.question, MAX_QUESTION_LEN);
    const unitLevel = normalizeUnitLevel(body.unitLevel);
    const formNumber = normalizeFormNumber(body.formNumber);
    const topic = sanitizeText(body.topic, MAX_TOPIC_LEN);

    // NOTE: we do NOT blacklist-reject the solution itself. A student's work is
    // untrusted DATA, not instructions — rejecting it on a keyword would fail
    // legitimate answers (a probability question can genuinely contain the word
    // "ignore"). The grader's system prompt is told explicitly to treat
    // embedded instructions as material under examination. The blacklist stays
    // on the short `question` field, which is closer to free-form user input.
    if (question && BLACKLIST.test(question)) {
      return Response.json({ error: 'שאלה לא חוקית' }, { status: 400 });
    }

    // ===== 4. MODEL =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    const userContent = [
      question ? `## השאלה\n${question}` : '## השאלה\n(לא נמסרה — הסק אותה מהפתרון)',
      `## הפתרון של התלמיד\n${solution}`,
      `הערך את הפתרון והחזר את הממצאים במבנה הנדרש.`,
    ].join('\n\n');

    // The SDK validates the parsed JSON against the Zod schema and THROWS on a
    // mismatch, so this await is the one place a schema/model disagreement can
    // surface. Catch it here and answer 502 rather than leaking a 500 stack.
    const stream = client.messages.stream({
      model: GRADER_MODEL,
      max_tokens: GRADER_MAX_TOKENS,
      system: buildGraderSystem({ unitLevel, formNumber, topic: topic || undefined }),
      messages: [{ role: 'user', content: userContent }],
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted — a silent
      // default change from 4.6 that spends tokens. Always explicit.
      thinking: graderThinking(),
      output_config: {
        effort: graderEffort(),
        format: zodOutputFormat(GradeSchema),
      },
    });

    let final;
    try {
      final = await stream.finalMessage();
    } catch (parseErr) {
      console.error('[grade] response did not match the schema:', parseErr);
      return Response.json(
        { error: 'לא הצלחתי לנתח את הפתרון. נסה שוב.' },
        { status: 502 }
      );
    }
    const grade = final.parsed_output;

    console.log(
      `[grade] u=${unitLevel} form=${formNumber} topic=${topic || '-'} ` +
        `in=${final.usage.input_tokens} out=${final.usage.output_tokens} ` +
        `cache_read=${final.usage.cache_read_input_tokens ?? 0} stop=${final.stop_reason}`
    );

    if (!grade) {
      // Structured outputs make this near-impossible; the realistic cause is
      // stop_reason 'max_tokens' (JSON cut off) or a safety refusal.
      console.error('[grade] no parsed_output, stop_reason:', final.stop_reason);
      return Response.json(
        { error: 'לא הצלחתי לנתח את הפתרון. נסה לקצר אותו ולשלוח שוב.' },
        { status: 502 }
      );
    }

    // ===== 5. DEFENSIVE CLAMP =====
    // Numeric bounds are stripped from the wire schema by the API (structured
    // outputs don't enforce min/max), so the 0-100 range is a prompt promise,
    // not a guarantee. Clamp rather than trust.
    const score = Math.max(0, Math.min(100, Math.round(grade.score)));

    await logAgentUsage(supabase, user.id, 'grade');

    const payload: GradeResponse = {
      ...grade,
      score,
      // Narrow every category onto the closed set the מחברת טעויות understands.
      errors: (grade.errors ?? []).map((e) => ({
        ...e,
        errorType: toErrorType(e.errorType),
      })),
      unitLevel,
      formNumber,
      remaining,
    };

    return Response.json(payload, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[grade] error:', error);
    return Response.json({ error: 'שגיאה בבדיקת הפתרון. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
