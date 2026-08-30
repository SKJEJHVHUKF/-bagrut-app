/**
 * tutor-trace-store.ts — write one row per tutor turn that reached the model.
 *
 * ⚠️ FIRE AND FORGET, AND THAT IS A DECISION.
 *
 * Nothing here may cost a student their answer. The table may not exist yet
 * (the SQL is run by hand), the service key may be unset on a deploy that went
 * out before the env var, the network may be having a moment — and in every
 * one of those cases the right outcome is a missing diagnostic row, not a
 * failed reply. So this never throws and is never awaited by the response
 * path.
 *
 * ⚠️ BUT IT DOES NOT SWALLOW SILENTLY.
 *
 * `logAgentUsage` awaited its insert and ignored the RESULT, and supabase-js
 * returns errors rather than throwing — so a missing table left quotas dead in
 * production for weeks with nothing anywhere saying so. The error is read here
 * and printed once, because a diagnostic that is quietly not being written is
 * worse than no diagnostic at all: it makes an empty report look like good
 * news.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeClientTrace } from '@/lib/tutor-telemetry';

export type ServerStamp = {
  durationMs: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedRead: number;
  cachedWrite: number;
  /**
   * Did this turn cost a model call?
   *
   * ⚠️ WITHOUT THIS THE TABLE HAS NO DENOMINATOR. It began as a record of
   * turns that reached the model, and that answers "why did we pay" but never
   * "how often do we pay" — three unknown_intent rows out of five is 60% of
   * the FAILURES and says nothing about whether five turns happened or forty.
   * "Most questions are answered locally" was a feeling for exactly this
   * reason. Defaults to true so the model path reads as it always did.
   */
  usedLlm?: boolean;
};

let warned = false;

export async function recordTutorTrace(raw: unknown, stamp: ServerStamp): Promise<void> {
  // ⚠️ THE WHOLE BODY IS INSIDE THE TRY, INCLUDING THE SETUP.
  //
  // The caller does `void recordTutorTrace(...)` with no `.catch`, and an
  // unhandled rejection is a process-level fault in Node 15+ — so a throw here
  // would not merely lose a diagnostic row, it would take down a warm lambda
  // after the student's answer had already streamed. `createAdminClient` can
  // throw on a malformed URL, which is precisely the kind of environment
  // mistake this table exists to survive. "Never throws" has to be true, not
  // documented.
  try {
    // The client's account of itself is a claim. Everything below `sanitize`
    // is clamped to the enums, capped in length and coerced to the right type;
    // the stamp is the server's own measurement and is the only part trusted.
    const t = sanitizeClientTrace(raw);
    const db = createAdminClient();
    if (!db) return;

    const { error } = await db.from('tutor_trace').insert({
      screen: t.screen,
      topic: t.topic,
      subtopic: t.subtopic,
      question_id: t.questionId,
      normalized_message: t.normalizedUserMessage,
      intent: t.intent,
      confidence: t.confidence,
      local_router_matched: t.localRouterMatched,
      local_ladder_matched: t.localLadderMatched,
      faq_matched: t.faqMatched,
      cross_question_reuse_matched: t.crossQuestionReuseMatched,
      math_engine_used: t.mathEngineUsed,
      compiler_flag_on: (raw as { compilerFlagOn?: boolean } | null)?.compilerFlagOn === true,
      fallback_reason: t.fallbackReason,
      used_llm: stamp.usedLlm !== false,
      duration_ms: Math.max(0, Math.round(stamp.durationMs)),
      model: stamp.model.slice(0, 40),
      input_tokens: stamp.inputTokens,
      output_tokens: stamp.outputTokens,
      cached_read: stamp.cachedRead,
      cached_write: stamp.cachedWrite,
    });
    if (error && !warned) {
      warned = true;
      console.error(
        `[tutor_trace] insert failed (${error.code ?? '?'}: ${error.message}) — ` +
          'the tutor still works, but no diagnostics are being collected until ' +
          'supabase-tutor-trace.sql is applied. An empty report is NOT evidence ' +
          'that every turn was answered locally.',
      );
    }
  } catch {
    /* a bad env var, a dead network, anything at all: the reply already
       streamed, and that is the only thing that was ever at stake here */
  }
}
