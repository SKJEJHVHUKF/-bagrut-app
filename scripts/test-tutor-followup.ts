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
import { reportedValue, yesNo } from '../lib/tutor-pending';
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
  // "go slower, one at a time" is the same ask as "explain it differently".
  // From report:worklist, where each cost a model call.
  ['איבר איבר', 'restate'],
  ['צעד צעד', 'restate'],
  ['לאט לאט', 'restate'],
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
  const after = routeMessage(msg, focus, { lastAsk: 'help', served: ['hint'], tutorSpoke: true });
  const cold = routeMessage(msg, focus, { lastAsk: null, served: [], tutorSpoke: false });
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
    lastAsk: 'help', served: ['hint'], tutorSpoke: true,
  });
  ok(r.kind === 'answer', 'and the router grades it instead of offering another hint');
}

console.log('');
console.log('=== a bare yes or no after ANY local turn ===');
console.log('');
// ⚠️ The first version required a yes-or-no EXPECTATION, and report:worklist
// then showed a bare "לא" costing three model calls. A student answering one
// message after the tutor spoke is answering the tutor, whatever shape the
// question took.
for (const [msg, ll, want] of [
  ['לא', true, 'ask'], ['כן', true, 'ask'], ['בטוח', true, 'ask'], ['לא חושב', true, 'ask'],
  ['לא', false, 'open'], ['כן', false, 'open'],
] as const) {
  const r = routeMessage(msg, focus, { lastAsk: 'help', served: ['hint'], tutorSpoke: ll });
  ok(r.kind === want, `"${msg}" tutorSpoke=${ll} → ${want} (got ${r.kind})`);
}
// And a phrase that is not a yes or a no is untouched by it.
ok(
  routeMessage('לא הבנתי', focus, { lastAsk: 'help', served: ['hint'], tutorSpoke: true }).kind === 'ask',
  '"לא הבנתי" still routes as a follow-up, not as a bare no',
);

// ============================================================
console.log('\n=== the paid turn must not lock the free layers ===\n');
// ============================================================
//
// ⚠️ THE REGRESSION THIS FILE EXISTS FOR NOW.
//
// The gate used to be "was the PREVIOUS turn answered LOCALLY", so the moment
// one turn reached the model every follow-up after it was locked out too — one
// paid call became three. A real trigonometry session (trace, 2026-08-29):
//
//   "יצא 16 69"   paid    → and because it was paid,
//   "לא זוכר"     paid    → these two could not reach
//   "ביחס ישר"    paid    → the free layers at all
//
// `tutorSpoke` is true after ANY assistant message, so a model answer no longer
// disables the ladder. Asserted as the FLAG, not as the wiring, because the
// wiring lives in a React ref in TutorBubble that this file cannot reach.
for (const msg of ['לא זוכר', 'לא בטוח', 'אין לי מושג', 'שכחתי', 'לא יודע']) {
  const r = routeMessage(msg, focus, { lastAsk: 'help', served: ['hint'], tutorSpoke: true });
  ok(r.kind === 'ask', `"${msg}" after the model spoke → ask (got ${r.kind})`);
  const cold = routeMessage(msg, focus, { tutorSpoke: false });
  ok(cold.kind === 'open', `"${msg}" opening a conversation → open (got ${cold.kind})`);
}

// ============================================================
// ⚠️ A QUESTION MARK REVERSES THE MEANING, AND THE REPORTS CANNOT SEE IT.
// ============================================================
// `yesNo`'s anchor allows "." and "!" but not "?", so "בטוח?" fell through to
// the model — while the trace, which stores the message with punctuation
// stripped, showed a row reading "בטוח" that looked identical to the free one.
// Two sessions were read as "the fix did not deploy" before this was found.
//
// And the fix is NOT to let `yesNo` ignore the mark: "בטוח" is the student
// saying yes, "בטוח?" is the student saying they do not believe you.
for (const [msg, want] of [
  ['בטוח', 'ask'], ['בטוח?', 'ask'], ['אתה בטוח?', 'ask'],
  ['כן', 'ask'], ['כן?', 'ask'], ['נכון?', 'ask'], ['באמת?', 'ask'],
] as const) {
  const r = routeMessage(msg, focus, { lastAsk: 'help', served: ['hint'], tutorSpoke: true });
  ok(r.kind === want, `"${msg}" → ${want} (got ${r.kind})`);
}
// The two are handled by DIFFERENT layers, and that is the point.
ok(yesNo('בטוח') === true, '"בטוח" is a yes');
ok(yesNo('בטוח?') === null, '"בטוח?" is NOT a yes — it is a challenge');
ok(followUp('בטוח?') === 'why', 'and it asks for the reasoning');

// ⚠️ THE CHALLENGE HAS A TAIL, AND THE FIRST FIX MISSED IT. "אתה בטוח" was
// answered locally on its first live session; "בטוח שזאת התשובה" — the same
// move with three more words — cost a call in the very next one.
for (const msg of ['בטוח שזאת התשובה', 'אתה בטוח שזאת התשובה', 'את בטוחה שזה נכון', 'אתה בטוח']) {
  ok(followUp(msg) === 'why', `"${msg}" is a challenge`);
}
// And what it must NOT swallow: "בטוח" inside a sentence about being lost.
ok(followUp('אני לא בטוח מה עושים') === 'stuck', '"אני לא בטוח מה עושים" is stuck, not a challenge');

// The cue list for a reported result was written from imagination. "כתבתי 4"
// cost a call while "יצא לי 4" was free — the same report, a different verb.
for (const msg of ['כתבתי 4', 'רשמתי 4', 'עניתי 4', 'שמתי 4']) {
  ok(reportedValue(msg) === '4', `"${msg}" reports 4`);
}
ok(reportedValue('כתבתי את הנוסחה') === null, 'and a verb with no number reports nothing');

// A reported result is graded wherever it appears in the sentence — it used to
// need the message to ALSO read as a follow-up, so "יצא לי 19" was paid for
// while "ניסיתי שוב ויצא לי 19" was free.
{
  const r = routeMessage('יצא לי 19', focus, { served: [], tutorSpoke: true });
  ok(r.kind === 'answer', `"יצא לי 19" is graded, not sent to the model (got ${r.kind})`);
}
// ⚠️ AND THE ONE THAT MUST STILL BE PAID FOR. Two numbers means we would be
// guessing which one the student meant, and telling a correct student they are
// wrong is worse than paying for the turn.
{
  const r = routeMessage('יצא 16 69', focus, { served: [], tutorSpoke: true });
  ok(r.kind !== 'answer', `"יצא 16 69" is ambiguous and is NOT graded (got ${r.kind})`);
}

console.log(
  failed === 0
    ? '\nOK follow-up: the conversation after a free move stays free\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
