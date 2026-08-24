/**
 * test-tutor-intent.ts — the canonical intent layer, both directions.
 *
 *   npx tsx scripts/test-tutor-intent.ts
 *
 * FREE. Pure functions, no content, no network.
 *
 * TWO FAILURES, AND THE SECOND IS THE EXPENSIVE ONE:
 *   a MISS   a phrasing students use is not recognised → a paid call that a
 *            written answer could have covered. Costs money.
 *   a FALSE  a phrasing that names its own subject IS recognised → the student
 *   POSITIVE is answered about the exercise on screen when they asked about
 *            something else. Costs trust, and trust does not come back.
 *
 * The corpus carries both kinds and the suite treats them the same way, which
 * is why every `expect: null` line matters as much as every intent line.
 */

import {
  canonicalIntent,
  canonicalize,
  groundingFor,
  CANONICAL_INTENTS,
} from '../lib/tutor-intent';
import {
  decideFallbackReason,
  sanitizeClientTrace,
  FALLBACK_REASONS,
  isFallbackReason,
} from '../lib/tutor-telemetry';
import { PHRASINGS, REPORTED } from './tutor-phrasings';
import type { TutorFocus } from '../lib/tutor-presence';

let checks = 0;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
};

// ============================================================
console.log('\n-- every phrasing resolves the way the corpus says --');
// ============================================================
{
  let misses = 0;
  let falsePositives = 0;
  for (const p of PHRASINGS) {
    const got = canonicalIntent(p.text).intent;
    if (got === p.expect) continue;
    if (p.expect === null) {
      falsePositives++;
      ok(false, `FALSE POSITIVE: "${p.text}" names its own subject but matched ${got}`);
    } else {
      misses++;
      ok(false, `miss: "${p.text}" → ${got ?? 'null'}, expected ${p.expect}`);
    }
  }
  ok(misses === 0, `no misses (${misses})`);
  ok(falsePositives === 0, `no false positives (${falsePositives})`);
  console.log(`   ${PHRASINGS.length} phrasings, ${PHRASINGS.filter((p) => p.mustStayWithModel).length} of them must stay with the model`);
}

// ============================================================
console.log('\n-- the phrasings Itay reported from real sessions --');
// ============================================================
{
  // These are worth more than the invented ones: each was a real paid call and
  // each turned out to stand for a whole family. Asserted by name so a future
  // change that breaks one is reported as breaking THAT one.
  ok(REPORTED.length >= 4, `the reported set is present (${REPORTED.length})`);
  for (const p of REPORTED) {
    ok(canonicalIntent(p.text).intent === p.expect, `reported: "${p.text}" → ${p.expect}`);
  }
}

// ============================================================
console.log('\n-- normalisation --');
// ============================================================
{
  ok(canonicalize('  איך   מחשבים???  ') === 'איך מחשבים', 'punctuation and repeated spaces collapse');
  // `לי` is filler too, so the canonical form is "תן את הטבלה" — the ask
  // without the manners. Asserted on what survives, not on a guess.
  ok(canonicalize('תן לי בבקשה את הטבלה') === 'תן את הטבלה', `politeness is dropped (got "${canonicalize('תן לי בבקשה את הטבלה')}")`);
  ok(!canonicalize('שלח לi@b.com את זה').includes('@'), 'an email address never survives');
  ok(!canonicalize('תתקשר 052-1234567 בבקשה').includes('052'), 'a phone number never survives');
  ok(canonicalize('א'.repeat(400)).length <= 120, 'the stored text is capped');

  // Deixis must SURVIVE normalisation — it is the evidence the rules read.
  for (const word of ['פה', 'כאן', 'זה', 'עכשיו']) {
    ok(canonicalize(`מה עושים ${word}`).includes(word), `deixis "${word}" is kept`);
  }

  // Spelling variants reach the same intent.
  for (const [a, b] of [
    ['מה הנוסחה?', 'מה הנוסחא פה'],
    ['תן לי דוגמה', 'תני לי דוגמא'],
    ['איך מחשבים?', 'איך מחשבים'],
  ] as const) {
    ok(
      canonicalIntent(a).intent === canonicalIntent(b).intent,
      `"${a}" and "${b}" reach the same intent (${canonicalIntent(a).intent} vs ${canonicalIntent(b).intent})`,
    );
  }
}

// ============================================================
console.log('\n-- an intent is not permission to answer --');
// ============================================================
{
  // The whole safety model: recognising the ask says nothing about whether we
  // hold the content. With no question there is nothing to ground in, and the
  // honest outcome is a model call.
  for (const intent of CANONICAL_INTENTS) {
    ok(groundingFor(intent, null) === null, `${intent}: no focus → no grounding`);
    ok(
      groundingFor(intent, { question: {} } as unknown as TutorFocus) === null,
      `${intent}: an empty question → no grounding`,
    );
  }

  // …and it IS granted when the question carries the content.
  const withHint = { question: { hint: 'התחילו מהגדרת המאורע המשלים.' } } as unknown as TutorFocus;
  ok(groundingFor('didnt_understand', withHint)?.kind === 'hint', 'a hint grounds "לא הבנתי"');
  const withNote = {
    chosenIndex: 1,
    question: { distractorNotes: ['', 'זו ההסתברות שהמאורע כן יתרחש.'] },
  } as unknown as TutorFocus;
  ok(
    groundingFor('why_wrong', withNote)?.kind === 'distractor-note',
    'the note for the option THEY picked grounds "למה טעיתי"',
  );
  // …and only for the option they picked.
  const otherNote = {
    chosenIndex: 0,
    question: { distractorNotes: ['', 'זו ההסתברות שהמאורע כן יתרחש.'] },
  } as unknown as TutorFocus;
  ok(
    groundingFor('why_wrong', otherNote)?.kind !== 'distractor-note',
    'a note written for a DIFFERENT option does not ground it',
  );
}

// ============================================================
console.log('\n-- the fallback reason is an enum, and its order is the point --');
// ============================================================
{
  const base = {
    hasQuestion: true,
    intent: 'how_to_compute' as const,
    confidence: 0.9,
    groundingMissing: false,
    faqSearched: true,
    faqMatched: false,
    transferCandidateRejected: false,
    multiPart: false,
    proofOrOpen: false,
    askedForPersonalExplanation: false,
    solverAttemptedAndFailed: false,
  };

  ok(decideFallbackReason({ ...base, hasQuestion: false }) === 'missing_question_context', 'no question wins over everything');
  // A multi-part question with no bank entry is reported as multi-part: the
  // first is the fact that decides what to do, the second is a consequence.
  ok(decideFallbackReason({ ...base, multiPart: true }) === 'multi_part_question', 'multi-part outranks no_faq_match');
  ok(decideFallbackReason({ ...base, proofOrOpen: true }) === 'proof_or_open_ended', 'a proof is named as one');
  ok(decideFallbackReason({ ...base, transferCandidateRejected: true }) === 'unsafe_cross_question_match', 'a rejected transfer is named');
  ok(decideFallbackReason({ ...base, intent: '' }) === 'unknown_intent', 'no intent → unknown_intent');
  ok(decideFallbackReason({ ...base, confidence: 0.7 }) === 'low_confidence', 'a weak rule is not treated as a miss');
  ok(decideFallbackReason({ ...base, groundingMissing: true }) === 'no_local_content', 'known ask, nothing to ground in');
  ok(decideFallbackReason(base) === 'no_faq_match', 'and finally the bank');

  for (const r of FALLBACK_REASONS) ok(isFallbackReason(r), `${r} is a valid reason`);
  ok(!isFallbackReason('because'), 'free text is not a reason');
  ok(new Set(FALLBACK_REASONS).size === FALLBACK_REASONS.length, 'the enum has no duplicates');
}

// ============================================================
console.log('\n-- the trust boundary: nothing the client says is taken on faith --');
// ============================================================
{
  const hostile = sanitizeClientTrace({
    screen: 'x'.repeat(500),
    fallbackReason: 'DROP TABLE students',
    confidence: 99,
    localRouterMatched: 'yes',
    normalizedUserMessage: 'y'.repeat(9000),
    extra: 'ignored',
  });
  ok(hostile.screen.length <= 24, 'oversized fields are cut');
  ok(hostile.fallbackReason === 'no_fallback', 'an invalid reason becomes no_fallback, never stored raw');
  ok(hostile.confidence === 1, 'confidence is clamped to 0..1');
  ok(hostile.localRouterMatched === false, 'a non-boolean is false, not truthy');
  ok(hostile.normalizedUserMessage.length <= 120, 'the debug text stays capped server-side too');
  ok(!('extra' in hostile), 'unknown keys are dropped');

  for (const junk of [null, undefined, 'string', 42, []]) {
    const t = sanitizeClientTrace(junk);
    ok(t.fallbackReason === 'no_fallback', `${JSON.stringify(junk)} degrades instead of throwing`);
  }
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAILED'}  ${checks - failures}/${checks} passed`);

process.exit(failures === 0 ? 0 : 1);
