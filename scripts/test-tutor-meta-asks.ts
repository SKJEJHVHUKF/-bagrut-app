/**
 * test-tutor-meta-asks.ts — messages about the tutor, not about the maths.
 *
 *   npx tsx scripts/test-tutor-meta-asks.ts
 *
 * FREE. Pure functions.
 *
 * Every phrasing in the MUST-CATCH block is verbatim from `report:worklist`
 * over 30 days of real traffic. None is invented, because the invented ones are
 * the set that keeps turning out to be wrong.
 */

import { classifyMetaAsk, metaAnswer } from '../lib/tutor-meta-asks';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

console.log('\n=== from the live trace, verbatim ===\n');
ok(classifyMetaAsk('לא עניתה על מה ששאלתי') === 'complaint', 'a complaint');
ok(classifyMetaAsk('שוב פעם שאלתי אותך שאלה וחזרת תשובה שלא קשורה') === 'complaint', 'a longer complaint');
ok(classifyMetaAsk('רוצה ממך טיפים לבגרות') === 'exam-tips', 'exam tips');
ok(classifyMetaAsk('אתה יכול להביא טיפים להבנה של החומר') === 'exam-tips', 'study tips');

console.log('\n=== and more of the same shapes ===\n');
for (const m of ['זה לא קשור לשאלה', 'שאלתי משהו אחר', 'לא על זה שאלתי', 'לא ענית לי']) {
  ok(classifyMetaAsk(m) === 'complaint', `"${m}"`);
}
for (const m of ['איך כדאי ללמוד למבחן', 'טיפים לפני הבגרות', 'איך להתכונן נכון']) {
  ok(classifyMetaAsk(m) === 'exam-tips', `"${m}"`);
}

console.log('\n=== MUST NOT CLAIM — these belong to other layers ===\n');
// ⚠️ "לא הבנתי" is the one that would do real damage. It is a request for
// another rung of the ladder and the follow-up router owns it; reading it as a
// complaint would answer "tell me what is unclear" to a student who just did.
for (const m of [
  'לא הבנתי',
  'לא הבנתי את הצעד הזה',
  'למה מחלקים ב3',
  'מה זה סדרה חשבונית',
  'תן לי רמז',
  'מה השלב הבא',
  'על מה כדאי לעבוד עכשיו',
  'איך פותרים את זה',
  'מה הנוסחה',
]) {
  ok(classifyMetaAsk(m) === null, `"${m}" is not a meta ask`);
}

console.log('\n=== the second complaint is the model’s ===\n');
{
  const first = metaAnswer('לא עניתה על מה ששאלתי', { hasQuestion: true });
  ok(first?.kind === 'complaint', 'the first gets the stock sentence');
  ok(first!.text.includes('צודק'), 'and it concedes rather than defends');
  ok(first!.text.includes('משפט אחד'), 'and asks for one sentence, which is the fastest route to a real answer');
  ok(
    metaAnswer('לא עניתה על מה ששאלתי', { hasQuestion: true, lastWasComplaint: true }) === null,
    'the second returns null — told twice that we are not listening, a template proves it',
  );
}

console.log('\n=== the tips answer ===\n');
{
  const tips = metaAnswer('רוצה ממך טיפים לבגרות')!;
  ok(tips.kind === 'exam-tips', 'classified');
  ok(tips.text.includes('דף הנוסחאות'), 'names something true about THIS exam');
  ok(tips.text.includes('על מה כדאי לעבוד עכשיו'), 'and hands off to the layer that knows this student');
  ok(tips.text.length < 900, 'short enough to read on a phone');
  ok(!/[∀∃∧∨⟺∅ℝℂ■]/.test(tips.text), 'secondary-school notation only');
}

// With no question on screen the complaint wording must not point at one.
{
  const noQ = metaAnswer('לא ענית לי', { hasQuestion: false })!;
  ok(!noQ.text.includes('שעל המסך'), 'with nothing on screen it does not point at a question');
}

console.log(
  failed === 0
    ? '\nOK meta asks: caught early, conceded once, and handed over the second time\n'
    : `\nFAILED: ${failed}\n`,
);
process.exit(failed === 0 ? 0 : 1);
