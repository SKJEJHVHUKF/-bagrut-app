/**
 * tutor-answer-library.ts — pay for an answer once.
 *
 * ============================================================
 * THE LOOP
 * ============================================================
 *   1. A turn reaches the model because no local layer could answer it.
 *   2. The answer streams to the student, and `capture` screens it and stores
 *      it against (question, intent, normalised probe).
 *   3. The next student who asks the same thing — or something close enough —
 *      is served from `find`, and no model call happens at all.
 *
 * The saving compounds: every paid answer is paid for once and then becomes
 * content. The measurement of whether it works is `hits`, which is the number
 * of model calls that did not happen.
 *
 * ============================================================
 * WHY MOST ANSWERS ARE NOT SERVED AUTOMATICALLY
 * ============================================================
 * An answer to "למה מחלקים כאן ב-3" is about ONE exercise's numbers. Served on
 * a different question it is confidently, specifically wrong — the worst kind
 * of wrong, because it reads like it knows. So the tier that is served without
 * a human deciding is narrow on purpose:
 *
 *   same question + same intent   →  any intent. The grounding is identical,
 *                                    so there is nothing to transfer wrongly.
 *   same topic + similar probe    →  ONLY question-independent intents.
 *
 * That second rule is not invented here. It is the rule cross-question reuse
 * already runs on in the FAQ bank, where `concept`/`mistake`/`check` transfer
 * and the number-bound kinds do not — measured at 12.7% fires, 1.5% unsafe.
 * Everything else is captured as `pending` and waits for a person.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { CanonicalIntent } from '@/lib/tutor-intent';
import type { ClientTrace } from '@/lib/tutor-telemetry';

/**
 * Intents whose answer is true about the SUBJECT rather than about one
 * exercise's numbers. Only these are ever served across questions.
 *
 * ⚠️ `why_this_step`, `next_step`, `what_to_do_here`, `how_to_solve` and
 * `why_wrong` are deliberately absent. Each of them is answered in terms of
 * the exercise in front of the student, and the more fluent the answer the
 * more damage it does on a different one.
 */
export const TRANSFERABLE: ReadonlySet<string> = new Set<CanonicalIntent>([
  'concept',
  'how_it_works',
  'which_formula',
  'give_table',
  'give_example',
]);

/**
 * An answer that talks about the student is never stored.
 *
 * Not a privacy nicety — a correctness one. "התשובה שלך 42 קרובה" is true of
 * exactly one person, and serving it to the next student states something
 * false about their work with total confidence. The model writes these
 * naturally whenever the prompt carried the student's attempt, so the screen
 * has to run on every capture rather than on the ones that look risky.
 */
const PERSONAL = [
  'התשובה שלך',
  'שכתבת',
  'שהזנת',
  'הזנת',
  'כתבת',
  'טעית',
  'הניסיון שלך',
  'הפתרון שלך',
  'ענית',
  'סימנת',
  'בחרת',
];

/** University notation the content standard forbids. Same list as the merge gate. */
const BANNED = /[∀∃∧∨⟺∅ℝℂ■]/;

/** Below this a probe is a noise word, not a question. "אה" must key nothing. */
const MIN_PROBE = 8;

const MIN_LEN = 60;
const MAX_LEN = 1800;

export type CaptureInput = {
  trace: ClientTrace;
  answer: string;
  model: string;
  outputTokens: number;
};

/** Why an answer was not stored. Returned so the report can show the shape of what is lost. */
/**
 * ⚠️ `pending` is a DATABASE status, not a verdict this function returns any
 * more. Cross-question safety is enforced at LOOKUP time — tier 2 refuses any
 * intent outside TRANSFERABLE — so gating capture on it as well was the same
 * check twice, and the second copy was the one that emptied the library.
 * A person can still set a row to 'pending' or 'rejected' by hand.
 */
export type CaptureVerdict = 'live' | 'rejected-personal' | 'rejected-shape' | 'skipped';

export function screen(trace: ClientTrace, answer: string): CaptureVerdict {
  const a = answer.trim();
  // ⚠️ AN INTENT IS NOT REQUIRED, AND REQUIRING ONE MADE THE LIBRARY USELESS.
  //
  // The first version keyed on (question, intent) and skipped anything with no
  // intent. Then the first real day of traffic: 10 of 12 turns that reached the
  // model had NO recognised intent — which is exactly why they reached it. The
  // library was refusing to learn from precisely the turns it exists for, and
  // measured empty after a full round of questions.
  //
  // So the key is the question plus the words. A probe too short to carry
  // meaning is still skipped: "אה" would match anything on that question.
  if (!trace.questionId) return 'skipped';
  if (trace.normalizedUserMessage.trim().length < MIN_PROBE) return 'skipped';
  if (a.length < MIN_LEN || a.length > MAX_LEN) return 'rejected-shape';
  if (BANNED.test(a)) return 'rejected-shape';
  if (PERSONAL.some((p) => a.includes(p))) return 'rejected-personal';
  // `why_wrong` is ABOUT the student's attempt by definition, even when the
  // wording happens to dodge every phrase above.
  if (trace.intent === 'why_wrong') return 'rejected-personal';
  return 'live';
}

/**
 * Store one answer. Fire-and-forget, never throws, never awaited by the reply
 * path — same contract as the trace, and for the same reason: a student's
 * answer must not depend on a table existing.
 */
export async function captureAnswer(input: CaptureInput): Promise<CaptureVerdict> {
  try {
    const verdict = screen(input.trace, input.answer);
    if (verdict === 'skipped') return verdict;
    const db = createAdminClient();
    if (!db) return 'skipped';
    await db.from('tutor_answer').insert({
      topic: input.trace.topic,
      question_id: input.trace.questionId,
      intent: input.trace.intent,
      normalized_message: input.trace.normalizedUserMessage,
      answer: input.answer.trim(),
      model: input.model.slice(0, 40),
      output_tokens: input.outputTokens,
      status: verdict.startsWith('rejected') ? 'rejected' : verdict,
    });
    return verdict;
  } catch {
    return 'skipped';
  }
}

// ------------------------------------------------------------
// Finding one again
// ------------------------------------------------------------

/** Content words of a normalised probe. Two chars or fewer carry nothing in Hebrew. */
const words = (s: string) => new Set(s.split(/\s+/).filter((w) => w.length > 2));

/**
 * Overlap as a fraction of the SHORTER probe.
 *
 * Dividing by the union would punish a student who asks the same thing at
 * greater length — "מה זה מותנה" against "מה זה בעצם הסתברות מותנית" scores
 * 0.4 by union and 1.0 here, and the second student wants the same answer.
 */
export function similarity(a: string, b: string): number {
  const A = words(a);
  const B = words(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

/** How close a different phrasing has to be before the stored answer is served. */
export const SIMILARITY_THRESHOLD = 0.7;

/**
 * The bar on the SAME question when the intent cannot vouch for the match.
 *
 * Higher than the cross-question bar, which reads backwards until you see why:
 * across questions the intent has already done the filtering, and only a
 * subject-level answer is eligible at all. Here nothing has filtered anything —
 * the two probes are all there is — so the words have to carry the whole
 * decision on their own.
 */
export const SAME_QUESTION_THRESHOLD = 0.75;

export type LearnedAnswer = { id: number; answer: string; via: 'same-question' | 'same-topic' };

/**
 * The answer to serve instead of calling the model, or null.
 *
 * Returns null on every failure — a missing table, a dead network, a bad key.
 * The cost of a false null is one model call the student was going to pay for
 * anyway; the cost of a false positive is a wrong answer, so the asymmetry
 * decides every judgement call in here.
 */
export async function findLearnedAnswer(trace: ClientTrace): Promise<LearnedAnswer | null> {
  try {
    if (!trace.intent) return null;
    const db = createAdminClient();
    if (!db) return null;

    // ---- tier 1: the same question ----
    //
    // Two ways in, and the second is the one that carries the traffic.
    //
    //   same intent      served straight away. The student is looking at the
    //                    identical exercise and asking the identical KIND of
    //                    thing; their choice of words does not change the
    //                    right answer.
    //   no intent, or a  the words have to match instead, at a HIGHER bar than
    //   different one    the cross-question one. Most turns that reach the
    //                    model have no recognised intent — that is why they
    //                    reached it — so without this branch the library never
    //                    learns from the turns it exists for.
    if (trace.questionId) {
      const { data } = await db
        .from('tutor_answer')
        .select('id, answer, intent, normalized_message')
        .eq('status', 'live')
        .eq('question_id', trace.questionId)
        .order('hits', { ascending: false })
        .limit(20);
      const rows = (data ?? []) as Array<{ id: number; answer: string; intent: string; normalized_message: string }>;

      if (trace.intent) {
        const sameIntent = rows.find((r) => r.intent === trace.intent);
        if (sameIntent) return { id: sameIntent.id, answer: sameIntent.answer, via: 'same-question' };
      }

      let best: { id: number; answer: string; score: number } | null = null;
      for (const r of rows) {
        const score = similarity(trace.normalizedUserMessage, r.normalized_message ?? '');
        if (score >= SAME_QUESTION_THRESHOLD && (!best || score > best.score))
          best = { id: r.id, answer: r.answer, score };
      }
      if (best) return { id: best.id, answer: best.answer, via: 'same-question' };
    }

    // ---- tier 2: the same topic, a close phrasing, and only if it travels ----
    if (!TRANSFERABLE.has(trace.intent) || !trace.topic || !trace.normalizedUserMessage) return null;
    const { data } = await db
      .from('tutor_answer')
      .select('id, answer, normalized_message')
      .eq('status', 'live')
      .eq('topic', trace.topic)
      .eq('intent', trace.intent)
      .limit(50);
    if (!data?.length) return null;

    let best: { id: number; answer: string; score: number } | null = null;
    for (const row of data as Array<{ id: number; answer: string; normalized_message: string }>) {
      const score = similarity(trace.normalizedUserMessage, row.normalized_message ?? '');
      if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score))
        best = { id: row.id, answer: row.answer, score };
    }
    return best ? { id: best.id, answer: best.answer, via: 'same-topic' } : null;
  } catch {
    return null;
  }
}

/** One more model call that did not happen. Never awaited, never fatal. */
export async function countHit(id: number): Promise<void> {
  try {
    const db = createAdminClient();
    if (!db) return;
    await db.rpc('increment_tutor_answer_hit', { row_id: id });
  } catch {
    /* the student already has their answer; a lost counter is not worth a failure */
  }
}
