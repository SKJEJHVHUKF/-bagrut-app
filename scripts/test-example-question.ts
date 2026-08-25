/**
 * test-example-question.ts — "תן תרגיל דוגמה" is answered from the bank.
 *
 *   npx tsx scripts/test-example-question.ts
 *
 * FREE. Pure functions.
 *
 * The one thing that must never happen here is the sibling's ANSWER travelling
 * with it. An example a student can read the answer to is a second worked
 * solution, and the whole ladder in this app exists to avoid handing those over
 * early — so most of these cases check what is NOT in the message.
 */

import { pickExample, renderExample } from '../lib/example-question';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const SIBLINGS = [
  { id: 'cq-1', question: 'בכיתה 7 תלמידים ובוחרים ועדה של 3. כמה ועדות אפשריות?', hint: 'הסדר לא קובע.' },
  { id: 'cq-2', question: 'מטילים קובייה הוגנת פעמיים. מה ההסתברות לשני מספרים זוגיים?' },
  { id: 'cq-3', question: 'קצר', hint: 'x' },
];

console.log('\n=== picking one ===\n');
ok(pickExample(SIBLINGS, 'cq-9')?.id === 'cq-1', 'the first usable sibling');
ok(pickExample(SIBLINGS, 'cq-1')?.id === 'cq-2', 'never the question the student is on');
ok(pickExample([SIBLINGS[2]], undefined) === null, 'a question too short to be one is skipped');
ok(pickExample([], 'cq-1') === null, 'no siblings → nothing, and the model answers');
ok(pickExample(undefined, 'cq-1') === null, 'undefined siblings → nothing');
// Deterministic: the same ask twice gives the same example, not a shuffle that
// makes the tutor look like it is guessing.
ok(pickExample(SIBLINGS, 'cq-9')?.id === pickExample(SIBLINGS, 'cq-9')?.id, 'the same ask gives the same example');

console.log('\n=== what the message contains, and what it must not ===\n');
const msg = renderExample(SIBLINGS[0]);
ok(msg.includes(SIBLINGS[0].question), 'the sibling question is shown');
ok(msg.includes(SIBLINGS[0].hint as string), 'and its hint, when it has one');
ok(msg.includes('נסה אותו'), 'and the student is asked to try it');
ok(!/\b35\b/.test(msg), 'no computed answer appears');

// The type carries no answer field at all, which is the real guarantee — but
// assert on a hostile object too, in case a caller widens it later.
const hostile = { id: 'x', question: 'שאלה כלשהי שאורכה מספיק', hint: 'רמז', answers: ['35', '21'], correct: 0 } as never;
const rendered = renderExample(hostile);
ok(!rendered.includes('35') && !rendered.includes('21'), 'even if a caller passes answers, they are not rendered');

ok(renderExample({ question: 'שאלה בלי רמז בכלל כאן' }).includes('נסה אותו'), 'a sibling with no hint still renders');
ok(!renderExample({ question: 'שאלה בלי רמז בכלל כאן' }).includes('הכיוון'), 'and does not invent one');

console.log(
  failed === 0
    ? '\nOK example: a real authored sibling, without its answer\n'
    : `\nFAILED: ${failed}\n`,
);
process.exit(failed === 0 ? 0 : 1);
