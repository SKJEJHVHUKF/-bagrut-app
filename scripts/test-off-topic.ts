/**
 * test-off-topic.ts — mostly a test that it stays quiet.
 *
 *   npx tsx scripts/test-off-topic.ts
 *
 * FREE. Pure function, no content, no network.
 *
 * Missing an off-topic message costs one model call. Redirecting a REAL
 * question costs a student who asked something legitimate and was told to get
 * back on topic. So the cases below are lopsided on purpose: far more of them
 * check silence than check speech, and every phrasing in the MUST STAY SILENT
 * block is either a real message from the live trace or a trap the vocabulary
 * actually contains.
 */

import { offTopicRedirect, offTopicLabel } from '../lib/off-topic';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const Q = 'בכיתה יש 7 תלמידים ובוחרים ועדה של 3. כמה ועדות אפשריות?';

console.log('\n=== MUST STAY SILENT — a real question, redirected, is the expensive failure ===\n');

const silent: Array<[string, string]> = [
  // From the live trace, all of them real.
  ['יש לך טיפים לתת לפני המבחן', 'exam advice is a legitimate question'],
  ['תעבור איתי על הכל', 'a walkthrough request'],
  ['על מה כדאי לעבוד עכשיו', 'what to study next'],
  ['לא מובן', 'a two-word plea'],
  ['אה', 'a fragment'],
  ['2 ו3 ו4', 'a numeric fragment'],
  ['איבר איבר', 'a continuation'],
  ['למה הטבלה בנויה ככה', 'a question about the table'],
  // Traps the vocabulary genuinely contains.
  ['מה זה סדרה חשבונית', '"סדרה" is a TV series AND the sequences topic'],
  ['מה ההסתברות לצאת בקוביה במשחק', '"משחק" is football and also every dice question'],
  ['איך מחשבים הסתברות בקלפים', 'cards are a probability staple'],
  ['מה הסיכוי לנצח בהגרלה', 'lotteries are the subject, not gambling talk'],
  ['אני לחוץ מהבגרות ולא מצליח להתרכז', 'exam anxiety is study-adjacent and must not be brushed off'],
  ['כמה נקודות שווה הסעיף הזה', 'marks are app data'],
  ['מתי המועד של השאלון', 'exam dates are app data'],
  ['כמה ועדות אפשר לבחור', 'echoes the question on screen'],
];
for (const [msg, why] of silent) ok(offTopicRedirect(msg, Q) === null, `"${msg}" — ${why}`);

// The same list again with NO question on screen: the screen echo veto is gone,
// so this is the harder version and the one /roadmap actually hits.
console.log('\n=== …and still silent with nothing on the screen ===\n');
for (const [msg] of silent.slice(0, 12)) {
  ok(offTopicRedirect(msg) === null, `"${msg}" with no question in context`);
}

console.log('\n=== MUST SPEAK ===\n');
const speak: Array<[string, string]> = [
  ['מי ניצח אתמול בכדורגל', 'ספורט'],
  ['בא לי פיצה עכשיו', 'אוכל'],
  ['מה כדאי לראות בנטפליקס', 'רשתות'],
  ['אתה משחק פורטנייט', 'גיימינג'],
  ['מה מזג האוויר מחר', 'מזג אוויר'],
  ['תספר לי בדיחה', 'סתם'],
  ['בן כמה אתה', 'עליי'],
  ['אתה רובוט או אדם', 'עליי'],
  ['תעזור לי בשיעורי אנגלית', 'מקצוע אחר'],
];
for (const [msg, label] of speak) {
  const out = offTopicRedirect(msg, Q);
  ok(out !== null && offTopicLabel(msg, Q) === label, `"${msg}" → ${label}`);
}

console.log('\n=== the redirect itself ===\n');
const withQ = offTopicRedirect('מי ניצח אתמול בכדורגל', Q) ?? '';
const noQ = offTopicRedirect('מי ניצח אתמול בכדורגל') ?? '';
ok(withQ.includes('לשאלה שאתה עובד עליה'), 'with a question on screen it points back at that question');
ok(noQ.includes('לנושא שלנו'), 'with nothing on screen it points back at the topic');
ok(!withQ.includes('לא קשור'), 'it does not say "not related" — that reads as a telling-off');
ok(withQ.length < 200, 'it is short; a lecture about scope is worse than the question');

// The one that would be a genuine incident: a maths word inside an otherwise
// off-topic sentence must win, because a false redirect is the expensive error.
console.log('\n=== when the two collide, silence wins ===\n');
ok(offTopicRedirect('בכדורגל יש הסתברות שהקבוצה תנצח', Q) === null,
   'football + probability → silent, the maths veto outranks the positive match');
ok(offTopicRedirect('אחרי המבחן אני הולך לאכול פיצה', Q) === null,
   'pizza + exam → silent, the school veto outranks it too');
ok(offTopicRedirect('כמה קלוריות יש בפיצה אם יש 8 משולשים', Q) === null,
   'a digit anywhere → silent');

console.log('');
console.log('=== nothing was asked at all — greetings and noise ===');
console.log('');
// Itay: "או סתם מחרבש לו דברים". These are not football; one is a greeting and
// the other is a key held down, and paying a model to be greeted is the least
// defensible call in the app.
for (const m of ['היי', 'שלום', 'מה נשמע', 'היי מה קורה אחי', 'yo אחי', 'hello', 'לול', 'חחחחח', 'אאאאאא', '???']) {
  const out = offTopicRedirect(m, Q) ?? '';
  ok(out.includes('לא הגיעה אליי'), `"${m}" → the nothing-was-asked reply`);
}

console.log('');
console.log('=== and the words that ARE a question, alone ===');
console.log('');
// ⚠️ A lone-unknown-word rule was written, measured and REMOVED. It caught
// "אסדגכלדס" and it also caught these three, each answered with "לא הצלחתי
// להבין" — a student who asked a real thing, told they made no sense. Mash
// reaching the model costs one call; this costs the student.
for (const m of ['אינדקס', 'דיפרנציאלי', 'מקומות', 'קומבינטוריקה', 'נוסחה', 'הסתברות']) {
  ok(offTopicRedirect(m, Q) === null, `"${m}" alone is a question, not noise`);
}
ok(offTopicRedirect('אסדגכלדס', Q) === null, 'and single-word mash goes to the model, by choice');

console.log(
  failed === 0
    ? '\nOK off-topic: speaks on nine shapes and stays quiet on everything else\n'
    : `\nFAILED: ${failed}\n`,
);
process.exit(failed === 0 ? 0 : 1);
