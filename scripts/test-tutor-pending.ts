/**
 * test-tutor-pending.ts — what the tutor asked, and what may be graded.
 *
 *   npx tsx scripts/test-tutor-pending.ts
 *
 * FREE. Pure functions.
 *
 * The asymmetry here is not about money. A missed expectation costs one model
 * call. A WRONG expectation tells a student who did the work correctly that
 * they are wrong — which is what the old code did, grading an intermediate
 * value against the final answer. So `stepResult` returning null is the safe
 * outcome and most of these cases check that it does.
 */

import { stepResult, expectationOf, yesNo } from '../lib/tutor-pending';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

console.log('\n=== what value does a step produce ===\n');

// The trap: "the last number" is 4 here, and the result is 19.
ok(stepResult('מציבים n=5: 3 + 4*4') === '19', '"מציבים n=5: 3 + 4*4" → 19, not the last number 4');
ok(stepResult('מקבלים 19') === '19', 'a cue word with a bare number');
ok(stepResult('מחשבים ומקבלים 3 + 16') === '19', 'a cue word with an expression');
ok(stepResult('סה"כ 35') === '35', 'סה"כ is a result cue');
ok(stepResult('התוצאה היא 7.5') === '7.5', 'decimals survive');
ok(stepResult('**הכלל:** an = a1 + (n-1)d') === null, 'a formula is not a computed value');
ok(stepResult('מציבים את הנתונים בנוסחה') === null, 'an instruction with no number');
ok(stepResult('בודקים שהתשובה הגיונית') === null, 'prose');
ok(stepResult('נבחר 3 מתוך 7 אנשים') === null, 'numbers with no result cue → null, not a guess');
ok(stepResult('הסיכוי הוא 1/2 מהמקרים') === null, 'a number mid-sentence with no cue → null');

console.log('\n=== what did the tutor ask for ===\n');

const STEP = 'מחשבים ומקבלים 19';
const askValue = 'הצעד הראשון כאן הוא זה:\n\nמציבים\n\nתעשה את הבא ותכתוב לי מה יצא לך.';
const e1 = expectationOf(askValue, STEP);
ok(e1?.kind === 'step-value' && e1.expected === '19', '"מה יצא לך" + a computable step → step-value 19');

const e2 = expectationOf(askValue, 'מציבים את הנתונים בנוסחה');
ok(e2?.kind === 'value-unknown', '"מה יצא לך" + an uncomputable step → value-unknown, NEVER graded');

const e3 = expectationOf(askValue);
ok(e3?.kind === 'value-unknown', 'no step at all → value-unknown');

ok(expectationOf('תיקח את הראשון מהם ותבדוק אותו מול השאלה — הוא מתקיים?')?.kind === 'yes-no',
   '"הוא מתקיים?" → yes-no');
ok(expectationOf('תיקח את האפשרות שאתה שוקל ותבדוק אותה מול המשפט הזה — היא מתאימה?')?.kind === 'yes-no',
   '"היא מתאימה?" → yes-no');
ok(expectationOf('תכתוב בשורה נפרדת מה השאלה מבקשת. מה כתבת?')?.kind === 'prose',
   '"מה כתבת?" → prose, which only the model reads');
ok(expectationOf('בחרת א. הנה מה שקרה שם. עכשיו תסתכל שוב — במה תבחר?')?.kind === 'prose',
   '"במה תבחר?" → prose');
ok(expectationOf('הנה הרמז שלך. בהצלחה.') === null, 'a message with no question sets no expectation');

// The last question wins: these templates say several things before asking.
const twoQuestions = 'מה השאלה מבקשת? תכתוב לעצמך.\n\nעכשיו תעשה את הצעד ותכתוב לי מה יצא לך.';
ok(expectationOf(twoQuestions, STEP)?.kind === 'step-value', 'the LAST question is the one being answered');

console.log('\n=== yes and no ===\n');
ok(yesNo('כן') === true, '"כן"');
ok(yesNo('נכון') === true, '"נכון"');
ok(yesNo('לא') === false, '"לא"');
ok(yesNo('לא מתקיים') === false, '"לא מתקיים"');
ok(yesNo('כן אבל לא הבנתי למה') === null, 'a yes with a question attached is not a bare yes');
ok(yesNo('19') === null, 'a number is not a yes');
ok(yesNo('') === null, 'nothing is not a yes');

console.log(
  failed === 0
    ? '\nOK pending: a value is graded only when the step really produces one\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
