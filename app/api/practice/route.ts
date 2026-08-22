import Anthropic from '@anthropic-ai/sdk';
import { guardAgentRequest, logAgentUsage } from '@/lib/agents/guard';
import { generateJSON } from '@/lib/anthropic-json';
import {
  GENERATOR_MODEL,
  GENERATOR_ESCALATION_MODEL,
  GENERATOR_ESCALATION_OPTS,
  GENERATOR_MAX_TOKENS,
} from '@/lib/agents/config';
import {
  SUBJECTS,
  buildGeneratorPrompt,
  buildExerciseSchema,
  CHECKABLE_SUBJECTS,
  type Difficulty,
} from '@/lib/generator-prompt';
import { verifyGenerated, type SelfCheck } from '@/lib/verify-generated';
import { logCost } from '@/lib/mathscan/cost';

// Vercel Hobby caps serverless functions at 60s. MEASURED per exercise
// (scripts/measure-generator.ts): ~18s on Haiku 4.5, against ~38s on the
// Sonnet 4.6 this route used to send — which sat uncomfortably close to the
// cap and truncated 1 response in 5.
export const maxDuration = 60;

// SUBJECTS, the prompt and the schema now live in lib/generator-prompt.ts —
// shared with /api/questions, scripts/generate-pool.ts and the measurement
// script, so the prompt that ships is the prompt that gets measured.

// ===== SECURITY CONSTANTS =====
const MAX_TOPIC_LENGTH = 80;
const MIN_TOPIC_LENGTH = 2;
// Blocks the actually-dangerous chars (HTML / template injection) and
// known prompt-injection phrases. Earlier version had `[ -<>...]` which
// silently created a 0x20-0x3C range that *included spaces*, breaking
// every multi-word topic like "חשבון דיפרנציאלי".
const TOPIC_BLACKLIST = /[<>{}[\]\\]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|system\s*:|assistant\s*:|user\s*:|<\s*\/?\s*(script|iframe|object|embed)/i;

/** The exercise shape the client receives. `self_check` is stripped before it
 *  leaves the server — it is quality control, not study material. */
type Exercise = {
  problem?: string;
  concept?: string;
  hints?: unknown;
  solution?: { steps?: unknown };
  final_answer?: string;
  remember?: string;
  self_check?: SelfCheck[];
};

export async function POST(request: Request) {
  try {
    // ===== 1-5. origin · bot · burst · content-type · auth =====
    // Plus the durable per-user hourly/daily quotas and the GLOBAL daily budget
    // brake. The hand-rolled block this replaced stopped at the in-memory
    // limiter, which is per-lambda-instance and resets on every cold start — so
    // this billable Sonnet route had no cap that survived a deploy.
    const guard = await guardAgentRequest(request, {
      kind: 'practice',
      freeDaily: 5,
      proDaily: 30,
    });
    if (!guard.ok) return guard.response;
    const { supabase, user } = guard;

    // ===== 6. BODY =====
    let body: { subject?: unknown; topic?: unknown; difficulty?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const difficultyRaw = typeof body.difficulty === 'string' ? body.difficulty.trim() : 'normal';
    const difficulty: Difficulty = (['easier', 'normal', 'harder'] as Difficulty[]).includes(
      difficultyRaw as Difficulty
    )
      ? (difficultyRaw as Difficulty)
      : 'normal';

    if (!subject || !topic) {
      return Response.json({ error: 'Missing subject or topic' }, { status: 400 });
    }
    if (!SUBJECTS[subject]) {
      return Response.json({ error: 'Invalid subject' }, { status: 400 });
    }
    if (topic.length < MIN_TOPIC_LENGTH || topic.length > MAX_TOPIC_LENGTH) {
      return Response.json(
        { error: `Topic length must be between ${MIN_TOPIC_LENGTH} and ${MAX_TOPIC_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (TOPIC_BLACKLIST.test(topic)) {
      return Response.json({ error: 'Invalid topic' }, { status: 400 });
    }

    // ===== 7. KEY =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // ===== 8. PROMPT + SCHEMA =====
    // Both come from lib/generator-prompt.ts. The seed is passed IN rather than
    // generated there, so the measurement script can replay the exact same
    // prompt across models — a builder that calls Date.now() internally cannot
    // be benchmarked.
    const variationSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const fullPrompt = buildGeneratorPrompt({ subject, topic, difficulty, seed: variationSeed });
    const exerciseSchema = buildExerciseSchema(subject);

    // ===== 9. GENERATE =====
    // ⚠️ generateJSON does NOT retry, despite what its file header says — see
    // the note on the function itself. A parse failure here is one billed call
    // and then an error to the student.
    const client = new Anthropic({ apiKey });
    const generate = async (model: string, extra: Record<string, unknown> = {}) => {
      const { data, modelTokens } = await generateJSON<Exercise>(
        client,
        {
          model,
          max_tokens: GENERATOR_MAX_TOKENS,
          messages: [{ role: 'user', content: fullPrompt }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ output_config: { format: { type: 'json_schema', schema: exerciseSchema } } } as any),
          ...extra,
        } as Parameters<typeof generateJSON>[1],
        'practice'
      );
      // Billed the moment the call returns — log before validating the shape,
      // or a malformed response would be a free retry.
      logCost('practice', model, { input_tokens: modelTokens.input, output_tokens: modelTokens.output });
      await logAgentUsage(supabase, user.id, 'practice');
      return data;
    };

    const structurallyOk = (e: Exercise) =>
      !!e.problem && Array.isArray(e.hints) && Array.isArray(e.solution?.steps);

    let parsed = await generate(GENERATOR_MODEL);
    if (!structurallyOk(parsed)) throw new Error('Invalid response structure');

    // ===== 10. VERIFY, AND ESCALATE IF THE MATHS IS WRONG =====
    // This is what makes the cheap tier safe. MEASURED (measure-generator.ts):
    // Haiku 4.5 gets ~88% of its own self-checks right against ~94% for Sonnet
    // 5, and one exercise in five carries at least one bad check — for EVERY
    // model tested, including the Sonnet 4.6 this route used to run unchecked.
    // Catching it costs one escalated call on ~20% of requests, which is still
    // far cheaper than generating every exercise on a big model.
    let report = verifyGenerated(parsed.self_check);
    let verified = report.ok;

    if (!verified && CHECKABLE_SUBJECTS.has(subject)) {
      console.warn(
        `[practice] ${GENERATOR_MODEL} failed self-check on "${topic}" — ` +
          report.outcomes
            .filter((o) => o.status === 'failed')
            .map((o) => `${o.claim}: expected ${o.expected}, got ${o.got}`)
            .join(' | ')
      );
      try {
        const escalated = await generate(GENERATOR_ESCALATION_MODEL, GENERATOR_ESCALATION_OPTS);
        if (structurallyOk(escalated)) {
          const escalatedReport = verifyGenerated(escalated.self_check);
          // Take the escalation only if it is actually better. A second wrong
          // answer is not an improvement worth showing.
          if (escalatedReport.failed <= report.failed) {
            parsed = escalated;
            report = escalatedReport;
            verified = escalatedReport.ok;
          }
        }
      } catch (error) {
        // An escalation that errors must not cost the student their exercise —
        // fall through with the first attempt, flagged as unverified.
        console.error('[practice] escalation failed:', (error as Error).message);
      }
    }

    // Fields are listed rather than spread-minus-one. `self_check` is quality
    // control, not study material — it hands over the answer before the first
    // hint — and an allowlist means the NEXT internal field added to the schema
    // does not leak to students by default either.
    return Response.json(
      {
        problem: parsed.problem,
        concept: parsed.concept,
        hints: parsed.hints,
        solution: parsed.solution,
        final_answer: parsed.final_answer,
        remember: parsed.remember,
        // Honest to the client: false means the exercise shipped with a known
        // arithmetic disagreement, after a stronger model failed to fix it.
        // ~4% of requests at the measured rates.
        verified,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    // Log full details for ourselves; show a clean message to the student.
    console.error('Practice error:', error);
    return Response.json(
      { error: 'שגיאה ביצירת התרגיל. נסה שוב בעוד רגע.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
