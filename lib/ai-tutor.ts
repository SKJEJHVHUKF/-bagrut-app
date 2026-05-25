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
import { checkRateLimit, getFingerprint, looksLikeBot } from './rate-limit';
import { createClient } from './supabase/server';
import { isProUser, type UserLike } from './access';

// ============================================================
// Same-origin guard — request must come from our own site.
// Identical logic to /api/check-answer.
// ============================================================
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

// ============================================================
// Standard guard for every Pro-tier tutor endpoint.
// ============================================================
//
// Use as the FIRST thing in a route handler:
//
//   const auth = await requireProUser(request);
//   if (!auth.ok) return auth.response;
//   // proceed with auth.user available
//
// Layers in order — fail fast:
//   1. Origin (same-site only)
//   2. Bot fingerprint
//   3. Per-fingerprint rate limit
//   4. Authenticated user (Supabase)
//   5. Pro subscription
//
// Free students can use /api/check-answer (verdict + feedback) but
// the deeper tutor features are Pro-only since each call costs Claude
// tokens — small per call but unbounded if abused.

type AuthOk = { ok: true; user: UserLike };
type AuthFail = { ok: false; response: Response };
export type AuthResult = AuthOk | AuthFail;

export async function requireProUser(request: Request): Promise<AuthResult> {
  if (!isAllowedOrigin(request)) {
    return { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  if (looksLikeBot(request)) {
    return { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const fingerprint = getFingerprint(request);
  const limit = checkRateLimit(fingerprint);
  if (!limit.allowed) {
    return {
      ok: false,
      response: Response.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: Response.json({ error: 'יש להתחבר' }, { status: 401 }) };
  }

  if (!isProUser(user as UserLike)) {
    return {
      ok: false,
      response: Response.json(
        { error: 'פיצ׳ר Pro — שדרג כדי לקבל הסבר אישי' },
        { status: 402 }
      ),
    };
  }

  return { ok: true, user: user as UserLike };
}

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

/** Same regex as /api/check-answer — rejects control characters,
 *  prompt-injection attempts ("ignore previous instructions"), and
 *  HTML tag fragments. */
export const PROMPT_BLACKLIST =
  // eslint-disable-next-line no-control-regex
  /[\x00-\x1f]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|<\s*\/?\s*(script|iframe|object|embed)/i;

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
