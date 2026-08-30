/**
 * tutor-telemetry.ts — one record per tutor turn that reached the model, and
 * why it got there.
 *
 * ============================================================
 * WHY THE CLIENT BUILDS IT
 * ============================================================
 * `/api/chat` is the only place a model call happens, so it can count them
 * perfectly — and it knows nothing about WHY. The router, the local ladder,
 * the FAQ bank and cross-question reuse all run in the browser, in
 * `TutorBubble.send()`, and by the time `fetch('/api/chat')` is reached every
 * one of them has already declined. The reason lives only on the client, so
 * the client reports it and the server records it.
 *
 * ⚠️ The server does NOT trust the client's account of itself. `usedLLM`,
 * `durationMs`, tokens and cost are stamped server-side from what actually
 * happened; the client's fields are validated against the enums below and
 * dropped if they do not fit. A client-supplied field is a claim, not a fact.
 *
 * ============================================================
 * WHAT IT DELIBERATELY DOES NOT KEEP
 * ============================================================
 * No user id, no conversation, no sentence the student wrote. The one text
 * field is `normalizedUserMessage`: folded, punctuation-free, filler-free,
 * capped at 120 characters, with anything shaped like contact detail removed
 * before normalisation. It exists so a report can show "the twenty phrasings
 * that most often reach the model" — which is the input to the next fix — and
 * for nothing else.
 *
 * `fallbackReason` is an ENUM. Free text there would become the thing everyone
 * greps and nobody can count.
 */

import { CANONICAL_INTENTS, type CanonicalIntent } from '@/lib/tutor-intent';

// ============================================================
// The enum
// ============================================================

export const FALLBACK_REASONS = [
  /** No rule recognised what the student was asking. */
  'unknown_intent',
  /** The intent is known but this phrasing is not one we route on. */
  'unsupported_phrase',
  /** No question object on screen — nothing to ground an answer in. */
  'missing_question_context',
  /** The intent is grounded-able in principle; this question has no such content. */
  'no_local_content',
  /** The bank was searched and had nothing for this question. */
  'no_faq_match',
  /** A layer could have answered but was not sure enough. */
  'low_confidence',
  /** A multi-section bagrut question — one answer cannot serve all of it. */
  'multi_part_question',
  /** A proof, a locus, an open discussion. The model's job by definition. */
  'proof_or_open_ended',
  /** The student explicitly asked for a personalised explanation. */
  'explicit_personalized_explanation',
  /** The maths engine was the right tool and could not finish. */
  'deterministic_solver_failed',
  /** Cross-question reuse had a candidate and the safety screen rejected it. */
  'unsafe_cross_question_match',
  /** No layer applied and none claims a reason — the bucket that must stay small. */
  'no_fallback',
] as const;

export type FallbackReason = (typeof FALLBACK_REASONS)[number];

const REASONS = new Set<string>(FALLBACK_REASONS);
export const isFallbackReason = (v: unknown): v is FallbackReason =>
  typeof v === 'string' && REASONS.has(v);

// ============================================================
// The record
// ============================================================

export type TutorTrace = {
  /** 'quiz' | 'lesson' | 'bagrut' | 'practice' | 'scan' | '' */
  screen: string;
  topic: string;
  subtopic: string;
  questionId: string;
  /** Folded, ≤120 chars, no punctuation, no contact detail. Debug only. */
  normalizedUserMessage: string;
  /** A CanonicalIntent, or '' when no rule matched. */
  intent: CanonicalIntent | '';
  localRouterMatched: boolean;
  localLadderMatched: boolean;
  faqMatched: boolean;
  crossQuestionReuseMatched: boolean;
  mathEngineUsed: boolean;
  fallbackReason: FallbackReason;
  /** 0–1, the intent rule's confidence. */
  confidence: number;
  usedLLM: boolean;
  durationMs: number;
};

/** What the client is allowed to assert. Everything else is server-stamped. */
export type ClientTrace = Omit<TutorTrace, 'usedLLM' | 'durationMs'>;

export const EMPTY_TRACE: ClientTrace = {
  screen: '',
  topic: '',
  subtopic: '',
  questionId: '',
  normalizedUserMessage: '',
  intent: '',
  localRouterMatched: false,
  localLadderMatched: false,
  faqMatched: false,
  crossQuestionReuseMatched: false,
  mathEngineUsed: false,
  fallbackReason: 'no_fallback',
  confidence: 0,
};

// ============================================================
// Deciding the reason
// ============================================================

export type ReasonInput = {
  hasQuestion: boolean;
  intent: CanonicalIntent | '';
  confidence: number;
  /** The intent is one a question's own content could answer, but this one has none. */
  groundingMissing: boolean;
  faqSearched: boolean;
  faqMatched: boolean;
  transferCandidateRejected: boolean;
  multiPart: boolean;
  proofOrOpen: boolean;
  askedForPersonalExplanation: boolean;
  solverAttemptedAndFailed: boolean;
};

/**
 * ONE reason per turn, chosen by a fixed precedence.
 *
 * The order is the point: a multi-part question with no bank entry is reported
 * as `multi_part_question`, not `no_faq_match`, because the first is the fact
 * that decides what to do about it and the second is a consequence. A report
 * whose buckets overlap cannot be acted on — every row would need reading.
 *
 * ⚠️ THIS FUNCTION NEVER RETURNS `no_fallback`. Once `!f.intent` is handled,
 * every remaining path has an intent, so the old trailing `if (f.intent)` /
 * `return 'no_fallback'` pair was unreachable — and a bucket that reads 0
 * forever looks like good news instead of dead code. `no_fallback` now means
 * exactly one thing: the trace itself was absent or malformed, stamped by
 * `sanitizeClientTrace`. If it grows, the client stopped sending, which is a
 * different bug from any of the reasons below.
 */
export function decideFallbackReason(f: ReasonInput): FallbackReason {
  if (!f.hasQuestion) return 'missing_question_context';
  if (f.multiPart) return 'multi_part_question';
  if (f.proofOrOpen) return 'proof_or_open_ended';
  if (f.askedForPersonalExplanation) return 'explicit_personalized_explanation';
  if (f.solverAttemptedAndFailed) return 'deterministic_solver_failed';
  if (f.transferCandidateRejected) return 'unsafe_cross_question_match';
  if (!f.intent) return 'unknown_intent';
  if (f.confidence > 0 && f.confidence < 0.75) return 'low_confidence';
  if (f.groundingMissing) return 'no_local_content';
  if (f.faqSearched && !f.faqMatched) return 'no_faq_match';
  return 'unsupported_phrase';
}

// ============================================================
// Validation — the server's side of the trust boundary
// ============================================================

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const bool = (v: unknown) => v === true;

// ⚠️ `intent` IS AN ENUM TOO, not only `fallbackReason`.
//
// The report groups by it, and a free-text value in a grouped column is worse
// than a missing one: it splits one bucket into several that nobody notices
// while the totals still add up. Anything not in the set lands in '', which
// the report already shows as "(none)".
//
// `screen` is deliberately NOT checked against a list. It comes from our own
// router — `pathname.split('/')[1]` — and never from the student, so there is
// nothing to pollute it; a stale allow-list would silently blank real rows the
// day a route is added, which is the more expensive failure. Length cap only.
const INTENTS = new Set<string>(CANONICAL_INTENTS);
const oneOf = (v: unknown, allowed: Set<string>) =>
  typeof v === 'string' && allowed.has(v) ? v : '';

/**
 * Coerce whatever arrived into a record we are willing to store.
 *
 * Never throws and never rejects the request: a malformed trace must not cost
 * a student their answer. It degrades to `EMPTY_TRACE` with the fields that
 * did parse, which the report can see as such.
 */
export function sanitizeClientTrace(raw: unknown): ClientTrace {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY_TRACE };
  const o = raw as Record<string, unknown>;
  return {
    screen: str(o.screen, 24),
    topic: str(o.topic, 40),
    subtopic: str(o.subtopic, 40),
    questionId: str(o.questionId, 64),
    normalizedUserMessage: str(o.normalizedUserMessage, 120),
    intent: oneOf(o.intent, INTENTS) as CanonicalIntent | '',
    localRouterMatched: bool(o.localRouterMatched),
    localLadderMatched: bool(o.localLadderMatched),
    faqMatched: bool(o.faqMatched),
    crossQuestionReuseMatched: bool(o.crossQuestionReuseMatched),
    mathEngineUsed: bool(o.mathEngineUsed),
    fallbackReason: isFallbackReason(o.fallbackReason) ? o.fallbackReason : 'no_fallback',
    confidence: typeof o.confidence === 'number' && Number.isFinite(o.confidence)
      ? Math.max(0, Math.min(1, o.confidence))
      : 0,
  };
}
