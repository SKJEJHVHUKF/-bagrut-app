/**
 * test-tutor-answer.ts — the screen is the safety boundary, so it is the test.
 *
 *   npx tsx scripts/test-tutor-answer.ts
 *
 * Everything the library does that could hurt a student happens in two pure
 * functions: `screen`, which decides whether an answer may ever be reused, and
 * `similarity`, which decides whether a stranger's phrasing is close enough to
 * count as the same question. Both are tested here without a database.
 *
 * The asymmetry that shapes every case below: a false NEGATIVE costs one model
 * call the student was going to pay for anyway. A false POSITIVE serves a
 * confident, specific, wrong answer. They are not the same size, so the tests
 * are one-sided on purpose — far more of them check that something is NOT
 * served than that it is.
 */

import {
  screen, similarity, SIMILARITY_THRESHOLD, SAME_QUESTION_THRESHOLD, TRANSFERABLE,
} from '../lib/tutor-answer-library';
import { EMPTY_TRACE, type ClientTrace } from '../lib/tutor-telemetry';
import { CANONICAL_INTENTS } from '../lib/tutor-intent';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const t = (over: Partial<ClientTrace>): ClientTrace => ({
  ...EMPTY_TRACE,
  questionId: 'prob-001',
  topic: 'הסתברות',
  intent: 'concept',
  normalizedUserMessage: 'מה זה הסתברות מותנית',
  ...over,
});

// A clean, general answer of a realistic length.
const GOOD =
  'הסתברות מותנית היא ההסתברות שמאורע יקרה בהינתן שמאורע אחר כבר קרה. ' +
  'מסמנים אותה בסוגריים אחרי הקו, ומחשבים אותה כיחס בין ההסתברות של שני ' +
  'המאורעות יחד לבין ההסתברות של המאורע שכבר ידוע שקרה.';

console.log('\n=== what may be stored at all ===\n');
ok(screen(t({ questionId: '' }), GOOD) === 'skipped', 'no question id → nothing to key on, skipped');
// ⚠️ The case that emptied the library. 10 of the first 12 turns that reached
// the model had no recognised intent — which is WHY they reached it — and the
// first version skipped every one of them.
ok(screen(t({ intent: '' }), GOOD) === 'live', 'NO intent is still captured: those are the turns that cost money');
ok(screen(t({ normalizedUserMessage: 'אה' }), GOOD) === 'skipped', 'a probe too short to mean anything keys nothing');
ok(screen(t({ normalizedUserMessage: '' }), GOOD) === 'skipped', 'an empty probe keys nothing');
ok(screen(t({}), 'קצר מדי') === 'rejected-shape', 'too short to be an answer');
ok(screen(t({}), 'א'.repeat(2000)) === 'rejected-shape', 'too long to be an answer');
ok(screen(t({}), `${GOOD} ∀x∈ℝ`) === 'rejected-shape', 'university notation is not תיכון notation');

console.log('\n=== what is about ONE student, and must never be reused ===\n');
for (const phrase of ['התשובה שלך', 'כתבת', 'טעית', 'הפתרון שלך', 'ענית', 'בחרת', 'סימנת', 'הזנת']) {
  ok(
    screen(t({}), `${GOOD} ${phrase} משהו אחר.`) === 'rejected-personal',
    `"${phrase}" → rejected, it is true of exactly one person`,
  );
}
ok(
  screen(t({ intent: 'why_wrong' }), GOOD) === 'rejected-personal',
  'why_wrong → rejected even when the wording is clean; the INTENT is about their attempt',
);

console.log('\n=== capture is permissive, TRANSFER is not ===\n');
// Capture keeps everything that passes the personal and shape screens. What an
// answer may be REUSED for is decided at LOOKUP: tier 1 is the same question,
// tier 2 refuses any intent outside TRANSFERABLE. Gating capture on that rule
// as well was the same check twice, and the second copy emptied the library.
for (const intent of CANONICAL_INTENTS) {
  if (intent === 'why_wrong') continue; // covered above, always rejected
  ok(screen(t({ intent }), GOOD) === 'live', `${intent.padEnd(22)} → captured`);
}
ok(!TRANSFERABLE.has('why_this_step'), 'why_this_step never travels — it is about this exercise');
ok(!TRANSFERABLE.has('next_step'), 'next_step never travels');
ok(!TRANSFERABLE.has('what_to_do_here'), 'what_to_do_here never travels');
ok(!TRANSFERABLE.has('how_to_solve'), 'how_to_solve never travels — it would hand over the solution');
ok(!TRANSFERABLE.has(''), 'an unrecognised intent never travels across questions either');
ok(SAME_QUESTION_THRESHOLD > SIMILARITY_THRESHOLD,
   'the same-question bar is HIGHER: nothing else has filtered the match there');

console.log('\n=== how close is close enough ===\n');
const sim = (a: string, b: string) => similarity(a, b);
ok(sim('מה זה הסתברות מותנית', 'מה זה הסתברות מותנית') === 1, 'identical → 1');
ok(
  sim('מה זה מותנית', 'מה זה בעצם הסתברות מותנית') >= SIMILARITY_THRESHOLD,
  'the same question asked at greater length still matches',
);
ok(
  sim('מה זה הסתברות מותנית', 'מה זה תוחלת') < SIMILARITY_THRESHOLD,
  'a different concept in the same topic does NOT match',
);
ok(
  sim('איך מחשבים סטיית תקן', 'איך מחשבים תוחלת') < SIMILARITY_THRESHOLD,
  'same verb, different subject → not the same question',
);
ok(sim('', 'מה זה מותנית') === 0, 'an empty probe matches nothing');
ok(sim('מה זה', 'איך זה') === 0, 'only sub-3-character words in common → 0, not a match');

// The one that would be a real incident: two questions that share their frame
// words and differ only in the noun.
ok(
  sim('מה ההבדל בין מאורעות זרים', 'מה ההבדל בין מאורעות בלתי תלויים') < 1,
  'sharing the frame is not sharing the question',
);

console.log(
  failed === 0
    ? '\nOK answer library: nothing personal is stored and nothing question-bound travels\n'
    : `\nFAILED: ${failed}\n`,
);
process.exit(failed === 0 ? 0 : 1);
