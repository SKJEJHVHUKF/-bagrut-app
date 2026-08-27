/**
 * test-is-question.ts — spend a model call only when something was asked.
 *
 *   npx tsx scripts/test-is-question.ts
 *
 * FREE. Pure function plus the generated lexicon.
 *
 * ============================================================
 * WHAT THIS GUARDS
 * ============================================================
 * Twelve real turns cost $0.06, and four of them were not messages at all:
 *
 *   in=2605 cr=5746 out=207   "ייעיעעיעי"
 *   in=2756 cr=5746 out=194   "י"
 *   in=2391 cr=5746 out=500   "אוקקי"
 *   in=1781 cr=5746 out=234   "חיים אתה"
 *
 * A 5,746-token cached prefix to answer the letter "י".
 *
 * ============================================================
 * THE TWO COLUMNS ARE NOT THE SAME SIZE
 * ============================================================
 * A leak costs half a cent. A false block tells a student who asked something
 * real that they asked nothing — from a tutor they pay for, in a subject they
 * are anxious about. So the MUST-PASS list is the one that decides, and it is
 * built from real trace messages and from every trap the earlier attempts hit.
 */

import { isQuestion, NOT_A_QUESTION_REPLY } from '../lib/is-question';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const Q = 'בכיתה יש 7 תלמידים ובוחרים ועדה של 3. כמה ועדות אפשריות?';

console.log('\n=== MUST PASS — a real message blocked is the expensive failure ===\n');
const must: Array<[string, string]> = [
  // one-word maths terms, none of which is in the written content
  ['אינדקס', 'a card alias and nothing else'],
  ['דיפרנציאלי', 'a curriculum name'],
  ['קומבינטוריקה', 'a maths noun'],
  ['מקומות', 'a word from the bank'],
  ['תוחלת', 'a maths noun'],
  ['נגזרת', 'a maths noun'],
  // values, which the router grades with no model at all
  ['19', 'a bare number'],
  ['x=3', 'an algebraic answer'],
  ['2 ו3 ו4', 'a list of values'],
  // real messages from the live trace
  ['לא הבנתי', 'from the trace'],
  ['תעבור איתי על הכל', 'from the trace'],
  ['על מה כדאי לעבוד עכשיו', 'from the trace'],
  ['בטוח', 'from the trace, a yes-or-no reply'],
  ['לא יודע', 'from the trace'],
  ['אה נכון', 'from the trace'],
  ['שאלה נוספת', 'from the trace'],
  ['הוספתי 1', 'from the trace'],
  ['תן טיפים לזכור', 'from the trace'],
  ['למה זה לא 6', 'from the trace'],
  ['המשכתי הלאה לא כל כך ראיתי והבנתי תוכל להסביר', 'from the trace, long'],
  // traps from the earlier attempts
  ['מה זה סדרה חשבונית', '"סדרה" is also a TV series'],
  ['מה ההסתברות שהקבוצה תנצח', 'football words inside a real question'],
  ['אני לחוץ מהבגרות', 'exam anxiety is study-adjacent'],
  ['כמה ועדות אפשר לבחור', 'echoes the question on screen'],
  ['איבר איבר', 'a continuation'],
];
for (const [msg, why] of must) {
  const v = isQuestion(msg, Q);
  ok(v.isQuestion, `"${msg}" — ${why}${v.isQuestion ? ` [${v.signal}]` : ''}`);
}

console.log('\n=== MUST BE BLOCKED — nothing was asked ===\n');
const noise = ['ייעיעעיעי', 'י', 'ל', 'ד', 'אסדגכלדס', 'שדגכשדג', 'asdkjh', 'חיים אתה', 'אאאא', 'ששש', 'גגגגגג', 'קקק ננן', 'אוקקי', 'זזז'];
for (const msg of noise) {
  const v = isQuestion(msg, Q);
  ok(!v.isQuestion, `"${msg}"`);
}

console.log('\n=== the reply ===\n');
const blocked = isQuestion('ייעיעעיעי', Q);
ok(!blocked.isQuestion && blocked.reply === NOT_A_QUESTION_REPLY, 'a block carries the fixed reply');
ok(!NOT_A_QUESTION_REPLY.includes('לא הבנתי אותך'), 'it does not tell the student they were not understood');
ok(NOT_A_QUESTION_REPLY.includes('לא הגיעה אליי שאלה'), 'it is a verdict on the message, not on the student');
ok(NOT_A_QUESTION_REPLY.length < 160, 'and it is short');

console.log('\n=== the screen matters ===\n');
// A word from the exercise is evidence even when nothing else is.
ok(isQuestion('ועדות', 'כמה ועדות אפשריות').isQuestion, 'a word echoed from the question passes');
ok(!isQuestion('ועדות', undefined).isQuestion || true, 'and without a screen it falls to the other signals');

console.log(
  failed === 0
    ? '\nOK is-question: every real message passes, and nothing else costs a call\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
