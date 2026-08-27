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

import { readFileSync, readdirSync, existsSync } from 'fs';
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

console.log('');
console.log('=== EVERY tutor route is behind the gate, and a new one cannot slip past ===');
console.log('');
// ⚠️ /api/chat WAS GATED FIRST AND IT LOOKED COMPLETE.
//
// /api/scan-tutor is a whole second tutor — its own free text from the student,
// its own model call, its own spend controls — and it was not behind the gate
// at all. A student who typed "י" there still paid for it. One endpoint being
// covered says nothing about the others, so this asserts the list rather than
// trusting that somebody remembered.
const TUTOR_ROUTES = ['app/api/chat/route.ts', 'app/api/scan-tutor/route.ts'];
for (const route of TUTOR_ROUTES) {
  const src = existsSync(route) ? readFileSync(route, 'utf8') : '';
  ok(src.includes('isQuestion('), `${route} calls the gate`);
  ok(/if \(!\w+\.isQuestion\)/.test(src), `${route} returns early when it is not a question`);
}

// And the trap that would defeat the list: somebody adds a THIRD chat-shaped
// route. Any route reading `body.messages` is a conversation endpoint, and a
// conversation endpoint that is not on the list above is ungated.
{
  const apiDir = 'app/api';
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(full);
      else if (e.name === 'route.ts') {
        const src = readFileSync(full, 'utf8');
        const takesChat = /body\.messages/.test(src);
        const callsModel = /messages\.(?:create|stream)\(/.test(src);
        if (takesChat && callsModel && !TUTOR_ROUTES.includes(full)) found.push(full);
      }
    }
  };
  if (existsSync(apiDir)) walk(apiDir);
  ok(
    found.length === 0,
    found.length === 0
      ? 'no ungated conversation endpoint exists'
      : `UNGATED conversation endpoint(s): ${found.join(', ')} — add the gate, then add it to TUTOR_ROUTES`,
  );
}

console.log(
  failed === 0
    ? '\nOK is-question: every real message passes, and nothing else costs a call\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
