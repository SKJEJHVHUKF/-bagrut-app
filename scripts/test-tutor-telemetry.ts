/**
 * test-tutor-telemetry.ts — the trace is only worth what its buckets are worth.
 *
 *   npx tsx scripts/test-tutor-telemetry.ts
 *
 * Two things are checked, and the second is the one that earns its keep.
 *
 * 1. PRECEDENCE. One reason per turn, chosen by a fixed order. If the order
 *    drifts, a multi-part question starts being reported as `no_faq_match` and
 *    the fix that follows is authoring bank entries for a question that no
 *    single entry can serve.
 *
 * 2. REACHABILITY. Every reason the decider is supposed to emit must be
 *    emitted by SOME input. `no_fallback` was unreachable for exactly this
 *    reason — a trailing `if (f.intent)` after `if (!f.intent) return …` — and
 *    an unreachable bucket reads as a permanent, comforting zero. A report
 *    whose 0 might mean "never happens" or "cannot happen" is not a report.
 */

import {
  decideFallbackReason,
  sanitizeClientTrace,
  FALLBACK_REASONS,
  EMPTY_TRACE,
  type ReasonInput,
  type FallbackReason,
} from '../lib/tutor-telemetry';

let failed = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    failed++;
    console.log(`  x ${name}\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
  }
  return ok;
};

const base: ReasonInput = {
  hasQuestion: true,
  intent: 'explain',
  confidence: 1,
  groundingMissing: false,
  faqSearched: false,
  faqMatched: false,
  transferCandidateRejected: false,
  multiPart: false,
  proofOrOpen: false,
  askedForPersonalExplanation: false,
  solverAttemptedAndFailed: false,
};
const reason = (o: Partial<ReasonInput>) => decideFallbackReason({ ...base, ...o });

console.log('\n=== precedence ===\n');

// Each row: an input where two conditions are true at once, and the reason
// that must win. Testing one flag at a time would pass on any order.
const order: Array<[string, Partial<ReasonInput>, FallbackReason]> = [
  ['no question beats everything', { hasQuestion: false, multiPart: true, proofOrOpen: true }, 'missing_question_context'],
  ['multi-part beats a missing entry', { multiPart: true, faqSearched: true }, 'multi_part_question'],
  ['a proof beats a personal ask', { proofOrOpen: true, askedForPersonalExplanation: true }, 'proof_or_open_ended'],
  ['a personal ask beats a dead solver', { askedForPersonalExplanation: true, solverAttemptedAndFailed: true }, 'explicit_personalized_explanation'],
  ['a dead solver beats a rejection', { solverAttemptedAndFailed: true, transferCandidateRejected: true }, 'deterministic_solver_failed'],
  ['a rejected reuse beats no intent', { transferCandidateRejected: true, intent: '' }, 'unsafe_cross_question_match'],
  ['no intent beats low confidence', { intent: '', confidence: 0.4 }, 'unknown_intent'],
  ['low confidence beats no grounding', { confidence: 0.4, groundingMissing: true }, 'low_confidence'],
  ['no grounding beats no bank entry', { groundingMissing: true, faqSearched: true }, 'no_local_content'],
  ['a searched, empty bank', { faqSearched: true }, 'no_faq_match'],
  ['understood, nothing routed on it', {}, 'unsupported_phrase'],
];
for (const [name, input, want] of order) {
  if (eq(name, reason(input), want)) console.log(`  ok  ${name.padEnd(36)} -> ${want}`);
}

// A rule that matched at full confidence is not "low confidence".
if (eq('confidence 0.75 is not low', reason({ confidence: 0.75, faqSearched: true }), 'no_faq_match')) {
  console.log('  ok  0.75 is the boundary and is not low confidence');
}

console.log('\n=== reachability ===\n');
// Sweep every combination of the flags that matter and collect the reasons
// actually produced. Cheap: 2^8 x 2 x 3.
const produced = new Set<string>();
const bools = [false, true];
for (const hasQuestion of bools) {
  for (const multiPart of bools) {
    for (const proofOrOpen of bools) {
      for (const askedForPersonalExplanation of bools) {
        for (const solverAttemptedAndFailed of bools) {
          for (const transferCandidateRejected of bools) {
            for (const groundingMissing of bools) {
              for (const faqSearched of bools) {
                for (const intent of ['', 'explain'] as const) {
                  for (const confidence of [0, 0.4, 1]) {
                    produced.add(
                      decideFallbackReason({
                        ...base,
                        hasQuestion,
                        multiPart,
                        proofOrOpen,
                        askedForPersonalExplanation,
                        solverAttemptedAndFailed,
                        transferCandidateRejected,
                        groundingMissing,
                        faqSearched,
                        intent,
                        confidence,
                      }),
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// `no_fallback` is the one reason the decider must NEVER produce: it means the
// client sent nothing readable, and only the sanitizer can say that.
for (const r of FALLBACK_REASONS.filter((x) => x !== 'no_fallback')) {
  if (produced.has(r)) {
    console.log(`  ok  ${r}`);
  } else {
    failed++;
    console.log(`  x   ${r} — UNREACHABLE: no input produces it, so its 0 in the report means nothing`);
  }
}
if (produced.has('no_fallback')) {
  failed++;
  console.log('  x   no_fallback — the decider produced it; that value must mean "malformed trace" and nothing else');
} else {
  console.log('  ok  no_fallback is never produced here (it means "the trace itself was unreadable")');
}

console.log('\n=== the trust boundary ===\n');
if (eq('no trace at all', sanitizeClientTrace(undefined), EMPTY_TRACE)) console.log('  ok  a missing trace degrades to EMPTY_TRACE');
if (eq('an array is not a record', sanitizeClientTrace([1, 2]), EMPTY_TRACE)) console.log('  ok  an array degrades to EMPTY_TRACE');

const forged = sanitizeClientTrace({
  screen: 'quiz',
  intent: 'give_me_free_tokens',
  fallbackReason: 'because_i_said_so',
  confidence: 99,
  localRouterMatched: 'yes',
  normalizedUserMessage: 'x'.repeat(500),
  questionId: 7,
});
if (eq('a forged intent is dropped', forged.intent, '')) console.log('  ok  an intent outside the enum becomes ""');
if (eq('a forged reason is dropped', forged.fallbackReason, 'no_fallback')) console.log('  ok  a reason outside the enum becomes no_fallback');
if (eq('confidence is clamped', forged.confidence, 1)) console.log('  ok  confidence is clamped to 0-1');
if (eq('a truthy string is not true', forged.localRouterMatched, false)) console.log('  ok  only a real boolean counts as true');
if (eq('the message is capped', forged.normalizedUserMessage.length, 120)) console.log('  ok  the one text field is capped at 120');
if (eq('a number id is not an id', forged.questionId, '')) console.log('  ok  a non-string id becomes ""');
if (eq('a real screen survives', forged.screen, 'quiz')) console.log('  ok  a real screen is kept as-is');

const real = sanitizeClientTrace({
  intent: 'how_to_compute',
  fallbackReason: 'no_faq_match',
  confidence: 0.9,
  faqMatched: true,
});
if (
  eq(
    'a real trace survives',
    [real.intent, real.fallbackReason, real.confidence, real.faqMatched],
    ['how_to_compute', 'no_faq_match', 0.9, true],
  )
) {
  console.log('  ok  a well-formed trace passes through untouched');
}

console.log(
  failed === 0
    ? '\nOK telemetry: every bucket is reachable and every claim is checked\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
