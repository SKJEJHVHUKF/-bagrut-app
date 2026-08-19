/**
 * ai-tutor.ts — shared helpers for the 4 AI tutor endpoints
 * (explain-simpler, why-wrong, hint-help, similar-question).
 *
 * Goals:
 *  - DRY the auth + rate-limit + bot + Pro check boilerplate that
 *    otherwise duplicates ~30 lines across every route.
 *  - Wrap Anthropic.messages.create in a consistent way that surfaces
 *    parse errors and exposes token usage for cost telemetry.
 *  - Centralize the prompt-injection blacklist and input-size cap so
 *    every tutor endpoint shares the same defensive posture.
 */

import Anthropic from '@anthropic-ai/sdk';
import { BLACKLIST, guardAgentRequest, logAgentUsage, type GuardOk } from './agents/guard';

// ============================================================
// Standard guard for every Pro-tier tutor endpoint.
// ============================================================
//
// Use as the FIRST thing in a route handler, and log AFTER a successful
// model call so a failed call is not charged against the student:
//
//   const auth = await requireProUser(request);
//   if (!auth.ok) return auth.response;
//   ... callTutor(...) ...
//   await logAgentUsage(auth.supabase, auth.user.id, 'tutor');
//
// This is a thin layer over guardAgentRequest — the SAME gate /api/practice
// and /api/teach use — so the order is: origin → bot UA → IP burst limit →
// content-type → Supabase session → 20/hour per user → global daily budget →
// daily cap, all counted in `ai_generation_log`, which survives cold starts
// and is shared by every serverless instance. Then, on top: Pro.
//
// It used to run its own origin/bot/in-memory-rate-limit/session chain with
// NO durable quota at all. The in-memory limiter is per instance and resets on
// every cold start, so the six tutor endpoints (two of them on Sonnet) were
// effectively uncapped for anyone who passed the Pro check — see the
// 2026-08-19 security audit (H3).

/** Daily cap for the six tutor endpoints together, per UTC day. Applied to
 *  free and Pro alike — free users never reach it (402 first), it exists so a
 *  Pro account is bounded too. */
export const PRO_DAILY_TUTOR = 60;

type AuthOk = { ok: true; user: GuardOk['user']; supabase: GuardOk['supabase'] };
type AuthFail = { ok: false; response: Response };
export type AuthResult = AuthOk | AuthFail;

export async function requireProUser(request: Request): Promise<AuthResult> {
  const gate = await guardAgentRequest(request, {
    kind: 'tutor',
    freeDaily: PRO_DAILY_TUTOR,
    proDaily: PRO_DAILY_TUTOR,
  });
  if (!gate.ok) return gate;

  if (!gate.isPro) {
    return {
      ok: false,
      response: Response.json(
        { error: 'פיצ׳ר Pro — שדרג כדי לקבל הסבר אישי' },
        { status: 402 }
      ),
    };
  }

  return { ok: true, user: gate.user, supabase: gate.supabase };
}

export { logAgentUsage };

// ============================================================
// Anthropic SDK wrapper.
// ============================================================
//
// One call → parsed result + token usage. Surfaces JSON-parse errors
// as standard exceptions (route handler catches and returns 500).
//
// If `schema` is provided, the response is parsed as JSON conforming
// to that schema (via Anthropic's output_config). Otherwise plain
// text is returned in `data`.

export type CallTutorArgs = {
  apiKey: string;
  /** Haiku 4.5 for cheap/fast text generation. Sonnet 4.5 for richer
   *  outputs like generating a brand-new question. */
  model: 'claude-haiku-4-5' | 'claude-sonnet-4-5';
  system: string;
  user: string;
  maxTokens?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: any;
};

export type CallTutorResult<T> = {
  data: T;
  usage: { input: number; output: number };
};

export async function callTutor<T = string>(
  args: CallTutorArgs
): Promise<CallTutorResult<T>> {
  const client = new Anthropic({ apiKey: args.apiKey });
  const message = await client.messages.create({
    model: args.model,
    max_tokens: args.maxTokens ?? 500,
    system: args.system,
    messages: [{ role: 'user', content: args.user }],
    ...(args.schema
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ output_config: { format: { type: 'json_schema', schema: args.schema } } } as any)
      : {}),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = message as any;
  const usage = {
    input: msg.usage?.input_tokens ?? 0,
    output: msg.usage?.output_tokens ?? 0,
  };

  const content = msg.content?.[0];
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response shape from Claude');
  }

  if (args.schema) {
    return { data: JSON.parse(content.text) as T, usage };
  }
  return { data: content.text as T, usage };
}

// ============================================================
// Shared guards on user-supplied text input.
// ============================================================

/**
 * Rejects control characters, prompt-injection attempts and HTML tag fragments.
 *
 * ONE definition, in lib/agents/guard.ts. This used to be a second copy with a
 * flat `[\x00-\x1f]` class, which matches a newline — so every multi-line
 * payload was rejected and all four tutor endpoints returned 400. The copy in
 * guard.ts was fixed; this one was not, because nothing tied them together.
 * Re-exported rather than re-declared so the next fix cannot miss a caller.
 */
export const PROMPT_BLACKLIST = BLACKLIST;

/** Default max length for any single tutor input field. */
export const MAX_INPUT_LEN = 1500;

/** Quick check used by all tutor endpoints. Returns the trimmed
 *  string if valid, or `null` if too long / contains blacklist tokens. */
export function sanitize(input: unknown, maxLen = MAX_INPUT_LEN): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  if (PROMPT_BLACKLIST.test(trimmed)) return null;
  return trimmed;
}
