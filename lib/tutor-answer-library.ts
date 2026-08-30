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
import { buildFaqIndex, buildCorpusIdf, matchFaq } from '@/lib/tutor-faq';
import { expandPhrasing, foreignNumber } from '@/lib/phrasing-variants';
import type { TutorFaq } from '@/content/tutor-faq/types';
import type { CanonicalIntent } from '@/lib/tutor-intent';
import type { ClientTrace } from '@/lib/tutor-telemetry';

/**
 * Intents whose answer is true about the SUBJECT rather than about one
 * exercise's numbers. Only these are ever served across questions.
 *
 * ⚠️ `why_this_step`, `next_step`, `what_to_do_here`, `how_to_solve`,
 * `why_wrong`, `where_from`, `why_not` and `what_if` are deliberately absent.
 * The last three are the sharpest cases in the set: "מאיפה ה-60" is a question
 * about one exercise's arithmetic, and an answer to it served on another
 * exercise names a number that is not on the screen. Each of them is answered in terms of
 * the exercise in front of the student, and the more fluent the answer the
 * more damage it does on a different one.
 */
export const TRANSFERABLE: ReadonlySet<string> = new Set<CanonicalIntent>([
  'concept',
  'how_it_works',
  'which_formula',
  'give_table',
  'give_example',
  // "איך יודעים שזה נכון" — a method, not a number. The FAQ bank's own
  // transfer rule has always carried `check` for the same reason.
  'check',
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
 * ⚠️ KEPT ONLY FOR THE SAME-QUESTION TIER, WHERE BOTH SIDES ARE ABOUT ONE
 * EXERCISE. Across questions it was doing the work the FAQ matcher does far
 * better, and measurably: on nine realistic re-wordings of stored questions it
 * found 3, and the matcher with generated phrasings found 13 of 14 with none
 * wrong. Raw word overlap knows nothing about Hebrew — not the ה/ב/ל clitics,
 * not final letters, not that מחלקים and לחלק are one verb.
 */
export function similarity(a: string, b: string): number {
  const A = words(a);
  const B = words(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

export const SIMILARITY_THRESHOLD = 0.7;

/**
 * The matcher's bar for serving a stored answer to a different phrasing.
 *
 * 0.5, and swept rather than chosen: at 0.45, 0.5 and 0.55 the same 13 of 14
 * were right with none wrong, and at 0.62 one more true match was lost. The
 * safety here is carried by `foreignNumber`, not by the threshold, which is why
 * it can sit low enough to actually fire.
 */
export const LIBRARY_THRESHOLD = 0.5;

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

    // ---- tier 2: the same topic, said differently ---------------------
    //
    // ⚠️ THE REAL MATCHER, NOT WORD OVERLAP, AND PHRASINGS WE GENERATE.
    //
    // A stored row holds ONE wording — whatever the first student typed. The
    // next student says the same thing another way and word overlap misses it,
    // so the model is paid again for an answer already owned. Measured on nine
    // re-wordings: overlap found 3.
    //
    // Two changes, both free. `matchFaq` is the machinery the FAQ bank runs on
    // (clitics, final letters, synonyms, IDF), and `expandPhrasing` gives every
    // row the sibling verb forms a human author would have written by hand —
    // deterministic morphology, no model, no per-row cost. Together: 13 of 14,
    // none wrong.
    if (!TRANSFERABLE.has(trace.intent) || !trace.topic || !trace.normalizedUserMessage) return null;
    const { data } = await db
      .from('tutor_answer')
      .select('id, answer, normalized_message')
      .eq('status', 'live')
      .eq('topic', trace.topic)
      .eq('intent', trace.intent)
      .limit(80);
    const rows = (data ?? []) as Array<{ id: number; answer: string; normalized_message: string }>;
    if (!rows.length) return null;

    const entries: TutorFaq[] = rows
      .filter((r) => r.normalized_message?.trim())
      .map((r) => ({
        id: String(r.id),
        kind: 'concept',
        q: r.normalized_message,
        alts: expandPhrasing(r.normalized_message),
        a: r.answer,
      }));
    if (!entries.length) return null;

    // The corpus is the library talking to itself. Small, but it is what
    // production has, and it is what the thresholds below were measured on.
    const idf = buildCorpusIdf(entries.map((e) => [e.q, ...e.alts].join(' ')));
    const hit = matchFaq(buildFaqIndex(entries, { idf }), trace.normalizedUserMessage, {
      threshold: LIBRARY_THRESHOLD,
      minContentMatches: 1,
    });
    if (!hit) return null;

    // ⚠️ AND THE SCREEN THAT MAKES IT SAFE. Before it existed, "למה מחלקים
    // ב-12" was served the answer to "למה מחלקים ב-3": same verb, same shape,
    // one different digit, and a confident explanation of arithmetic that is
    // not this student's. A number the question names that the stored phrasing
    // never did means they are not the same question.
    if (foreignNumber(trace.normalizedUserMessage, [hit.faq.q, ...hit.faq.alts].join(' '))) return null;

    const row = rows.find((r) => r.answer === hit.faq.a);
    return row ? { id: row.id, answer: row.answer, via: 'same-topic' } : null;
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
