/**
 * test-tutor-followup.ts — the conversation AFTER a free move.
 *
 *   npx tsx scripts/test-tutor-followup.ts
 *
 * FREE. Pure functions plus the real router.
 *
 * The scenario, in Itay's words: a student uses one of the offered moves — a
 * hint, a formula, "why was I wrong" — and then keeps talking to the tutor
 * about that same choice. Every one of those follow-ups was a paid call.
 *
 * Two things are checked, and the second matters more:
 *   · the wide patterns catch the way students actually continue
 *   · they fire ONLY when the previous turn was local, because the same words
 *     opening a conversation mean something else entirely
 */

import { followUp, ladderMove } from '../lib/tutor-followup';
import { reportedValue } from '../lib/tutor-pending';
import { routeMessage } from '../lib/tutor-router';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const focus = {
  topic: 'סדרות',
  question: {
    id: 'q1',
    question: 'נתון a1=3 ו-d=4. מצא את האיבר החמישי.',
    hint: 'השתמש בנוסחת האיבר הכללי.',
    expected: { kind: 'value', value: '19' },
    solution: { steps: ['**הכלל:** an = a1 + (n-1)d', 'מציבים n=5', 'מקבלים 19'], finalAnswer: '19' },
  },
} as never;

console.log('\n=== how students actually continue ===\n');
const cases: Array<[string, string]> = [
  ['עוד קצת', 'more'],
  ['תן עוד רמז', 'more'],
  ['זה לא מספיק', 'more'],
  ['אפשר עוד משהו', 'more'],
  ['לא הבנתי', 'stuck'],
  ['עדיין לא ברור לי', 'stuck'],
  ['אני תקוע', 'stuck'],
  ['זה מסובך מדי', 'stuck'],
  ['לא קלטתי', 'stuck'],
  ['זה לא עוזר', 'stuck'],
  ['ניסיתי ולא יצא', 'tried'],
  ['עשיתי את זה אבל יצא לי משהו אחר', 'tried'],
  ['הצבתי ולא יצא', 'tried'],
  ['קיבלתי משהו אחר', 'tried'],
  ['תסביר אחרת', 'restate'],
  ['תסביר יותר פשוט', 'restate'],
  ['במילים פשוטות', 'restate'],
  ['למה דווקא ככה', 'why'],
  ['למה זה עובד', 'why'],
  ['בשביל מה זה', 'why'],
];
for (const [msg, want] of cases) ok(followUp(msg) === want, `"${msg}" → ${want}`);

console.log('\n=== and what each one gets ===\n');
ok(ladderMove('why', []) === 'explain', 'why → explain');
ok(ladderMove('restate', []) === 'explain', 'restate → explain');
ok(ladderMove('stuck', []) === 'help', 'stuck with nothing spent → the help ladder');
ok(ladderMove('more', ['hint']) === 'help', 'more with only a hint spent → still the help ladder');
ok(
  ladderMove('more', ['hint', 'first-step']) === 'full',
  'the help ladder is spent → the whole solution, same predicate the router already used',
);
ok(ladderMove('tried', ['hint', 'key-points']) === 'full', 'tried, ladder spent → full');

console.log('\n=== the gate: only after a LOCAL turn ===\n');
for (const msg of ['לא הבנתי', 'עוד קצת', 'ניסיתי ולא יצא', 'תסביר אחרת']) {
  const after = routeMessage(msg, focus, { lastAsk: 'help', served: ['hint'], lastWasLocal: true });
  const cold = routeMessage(msg, focus, { lastAsk: null, served: [], lastWasLocal: false });
  ok(after.kind === 'ask', `"${msg}" after a local turn → answered locally (${after.kind})`);
  // Without the gate these must fall through to whatever the normal rules say —
  // and crucially must not be routed by the WIDE patterns.
  ok(
    cold.kind !== 'ask' || followUp(msg) === null || ['לא הבנתי', 'תסביר אחרת'].includes(msg),
    `"${msg}" cold is not routed by the wide follow-up patterns`,
  );
}

console.log('\n=== a new question is still a new question ===\n');
// These are NOT continuations, even one message after a local answer.
for (const msg of ['מה זה סטיית תקן', 'תן לי שאלה אחרת', 'מתי הבגרות']) {
  ok(followUp(msg) === null, `"${msg}" is not a follow-up`);
}
// A bare value is a value, not a follow-up: the pending-answer path owns it.
ok(followUp('19') === null, 'a bare number is not a follow-up');
ok(followUp('א'.repeat(200)) === null, 'a long message is a new question, whatever it contains');

console.log('');
console.log('=== a reported result is an answer, not a request for help ===');
console.log('');
// looksLikeAnswer only strips a lead-in anchored at the start, so these four
// words in front made the same report invisible to the grading path.
ok(reportedValue('ניסיתי שוב ויצא לי 19') === '19', 'a value reported mid-sentence is found');
ok(reportedValue('יצא לי 16') === '16', 'and at the start');
ok(reportedValue('קיבלתי 3.5') === '3.5', 'decimals');
ok(reportedValue('הגעתי ל 42') === '42', '"הגעתי ל"');
ok(reportedValue('ניסיתי ולא יצא') === null, 'a failure report carries no value');
ok(reportedValue('יש 19 אפשרויות') === null, 'a number with no result cue is not a report');
{
  const r = routeMessage('ניסיתי שוב ויצא לי 19', focus, {
    lastAsk: 'help', served: ['hint'], lastWasLocal: true,
  });
  ok(r.kind === 'answer', 'and the router grades it instead of offering another hint');
}

console.log(
  failed === 0
    ? '\nOK follow-up: the conversation after a free move stays free\n'
    : `\nFAILED: ${failed}\n`,
);
process.exit(failed === 0 ? 0 : 1);
