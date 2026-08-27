/**
 * test-tutor-plan-answer.ts — "what should I work on", and when NOT to answer it.
 *
 *   npx tsx scripts/test-tutor-plan-answer.ts
 *
 * FREE. The plan builder is stubbed, so this tests the decision and the
 * wording, not localStorage.
 *
 * The failure that matters is not a missed ask — that costs one model call. It
 * is answering "מה לעשות עכשיו" with a study plan while an exercise is on the
 * screen, because there the student meant THIS exercise and a fluent answer to
 * the other question is exactly what the compiler spends its whole design
 * avoiding.
 */

import { PLAN_ASK_FOR_TEST as PLAN_ASK } from '../lib/tutor-plan-answer';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

console.log('\n=== asks that mean "what should I study" ===\n');
for (const m of [
  'על מה כדאי לעבוד עכשיו',
  'על מה כדאי לי לעבוד',
  'במה כדאי להתמקד',
  'מה כדאי לתרגל',
  'מה כדאי ללמוד עכשיו',
  'מאיפה כדאי להתחיל ללמוד',
  'מה התוכנית שלי',
  'מה חסר לי',
  'במה אני חלש',
  'על מה לעבוד',
]) {
  ok(PLAN_ASK.test(m), `"${m}"`);
}

console.log('\n=== asks about the EXERCISE, which this must never claim ===\n');
for (const m of [
  'מה עושים כאן',
  'מה לעשות עכשיו בשאלה',
  'מה השלב הבא',
  'איך פותרים את זה',
  'מה הנוסחה',
  'רמז',
  'למה טעיתי',
]) {
  ok(!PLAN_ASK.test(m), `"${m}" is not a plan ask`);
}

console.log(
  failed === 0
    ? '\nOK plan answer: recognises the study ask and leaves the exercise alone\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
