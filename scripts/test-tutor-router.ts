/**
 * test-tutor-router.ts — does the router send each message to the right place?
 *
 *   npx tsx scripts/test-tutor-router.ts
 *
 * THE TWO ERRORS ARE NOT EQUAL, AND THE THRESHOLDS SAY SO
 * ------------------------------------------------------
 *   a QUESTION routed to `answer`  → the student asked for help and got
 *                                    graded. Breaks trust. MUST be zero.
 *   an ANSWER routed to `open`     → one model call. A miss, not a bug.
 *
 * So `MAX_FALSE_ANSWER` is 0 and `MIN_ANSWER_RECALL` is a bar, not a ceiling.
 *
 * The corpus is written the way students type: with lead-ins ("יצא לי"), with
 * a checking question mark ("זה 16?"), with LaTeX, with two values at once,
 * and with the near-misses that make naive detection fail — "למה זה 16" is a
 * question that contains a number, and "16" alone is an answer that does not.
 */

import { routeMessage, looksLikeAnswer, bareValue } from '../lib/tutor-router';
import type { TutorFocus } from '../lib/tutor-presence';
import type { PracticeQuestion } from '../content/lessons/types';
import type { AnswerSpec } from '../lib/answer-check';
import { checkAnswer } from '../lib/answer-check';

let checks = 0;
let failures = 0;
const bad = (m: string) => { failures++; if (failures <= 20) console.log(`FAIL  ${m}`); };
const ok = (cond: boolean, msg: string) => { checks++; if (!cond) bad(msg); };

function focusWith(spec: AnswerSpec | undefined): TutorFocus {
  const question: PracticeQuestion = {
    id: 'prob-sub-basics-001',
    difficulty: 'mid',
    kind: 'open',
    question: 'מטילים קובייה הוגנת. מה ההסתברות לקבל מספר גדול מ-4?',
    hint: 'כמה תוצאות גדולות מארבע?',
    ...(spec ? { expected: spec } : {}),
    solution: { steps: ['**הכלל:** …', '…'], finalAnswer: '1/3', explanation: '' },
  };
  return { where: 'בדיקה', topic: 'הסתברות', questionText: question.question, question };
}

const VALUE: AnswerSpec = { kind: 'value', value: '1/3' };
const SET: AnswerSpec = { kind: 'set', values: ['2', '3'] };
const withValue = focusWith(VALUE);

// ------------------------------------------------------------
console.log('\n— A: typed answers must be graded in code —');
// ------------------------------------------------------------
const ANSWERS = [
  'x=3', '1+2i', '0.36', '2/6', 'x = -5', '1/3', '$x=3$', 'זה 16?',
  'יצא לי 0.36', 'קיבלתי 1/3', 'התשובה היא 2/6', 'אני חושב ש-x=3',
  'd=4, a1=3', 'x=2 או x=3', '2*sqrt(3)', '\\dfrac{1}{3}', '-0.5', '16',
];
let caught = 0;
for (const msg of ANSWERS) {
  const r = routeMessage(msg, withValue);
  if (r.kind === 'answer') caught++;
  else console.log(`  ↯ missed (goes to the model): ${JSON.stringify(msg)} → ${r.kind}`);
}
const recall = caught / ANSWERS.length;
console.log(`  caught ${caught}/${ANSWERS.length} (${(recall * 100).toFixed(0)}%)`);

// ------------------------------------------------------------
console.log('\n— the error that must never happen: a question graded —');
// ------------------------------------------------------------
const QUESTIONS = [
  'למה זה 16', 'למה התשובה 1/3', 'איך הגעת ל-0.36', 'מאיפה ה-6',
  'תן לי רמז', 'אני תקוע', 'מאיפה מתחילים?', 'למה טעיתי',
  'תראה לי את הפתרון', 'מה הנוסחה', 'מה חשוב לזכור', 'תסביר לי את השאלה',
  'לא הבנתי את 2/6', 'זה נכון ש-x=3?', 'האם 0.36 נכון', 'מה זה אומר x=3',
  'בדוק לי את התשובה', 'אפשר עוד רמז', 'מה עושים עכשיו', 'למה לא 1/2',
  'כן', 'תודה', 'אוקיי', 'מה ההבדל בין וגם לאו',
];
let misrouted = 0;
for (const msg of QUESTIONS) {
  const r = routeMessage(msg, withValue);
  checks++;
  if (r.kind === 'answer') {
    misrouted++;
    bad(`question graded as an answer: ${JSON.stringify(msg)} → typed=${JSON.stringify(r.typed)}`);
  }
}
console.log(`  ${QUESTIONS.length - misrouted}/${QUESTIONS.length} correctly NOT graded`);

// ------------------------------------------------------------
console.log('\n— routing preconditions —');
// ------------------------------------------------------------
{
  // No spec → nothing to grade against, so never `answer`.
  ok(routeMessage('x=3', focusWith(undefined)).kind === 'open', 'no spec → open, not answer');
  // `manual` means the author said it cannot be graded mechanically.
  ok(routeMessage('x=3', focusWith({ kind: 'manual' })).kind === 'open', 'manual spec → open');
  // No question on screen at all.
  ok(routeMessage('x=3', null).kind === 'open', 'no focus → open');
  // An ask always wins, even with a spec present.
  const r = routeMessage('תן לי רמז', withValue);
  ok(r.kind === 'ask' && r.ask === 'help', 'an ask beats answer detection');
  // Long prose is never a value.
  ok(!looksLikeAnswer('חשבתי על זה הרבה ואני חושב שהתשובה צריכה להיות שליש כי יש שתי תוצאות'), 'long prose is not an answer');
}

// ------------------------------------------------------------
console.log('\n— the graded verdict is the deterministic one —');
// ------------------------------------------------------------
{
  // The point of the whole exercise: the value the router extracts must be
  // what answer-check grades, and it must agree with maths, not with a model.
  const cases: [string, AnswerSpec, 'correct' | 'wrong'][] = [
    ['1/3', VALUE, 'correct'],
    ['2/6', VALUE, 'correct'],          // same number, different form
    ['0.3333333333', VALUE, 'correct'], // decimal vs fraction
    ['יצא לי 1/3', VALUE, 'correct'],   // lead-in stripped
    ['1/2', VALUE, 'wrong'],
    ['x=2, x=3', SET, 'correct'],
    ['2', SET, 'wrong'],                // partial set
  ];
  for (const [msg, spec, expected] of cases) {
    const r = routeMessage(msg, focusWith(spec));
    checks++;
    if (r.kind !== 'answer') { bad(`not routed to answer: ${JSON.stringify(msg)}`); continue; }
    const verdict = checkAnswer(r.typed, spec).verdict;
    if (verdict !== expected) bad(`${JSON.stringify(msg)} → ${verdict}, expected ${expected} (typed=${JSON.stringify(r.typed)})`);
  }
  // And the diagnosis survives, so the tutor can say WHY without a model.
  const wrong = checkAnswer('2', SET);
  ok(wrong.verdict === 'wrong' && wrong.diagnosis?.kind === 'partial-set', 'a partial set is diagnosed, not just rejected');
  ok(bareValue('זה 16?') === '16', 'the checking question mark is stripped');
}

// ------------------------------------------------------------
const MIN_ANSWER_RECALL = 0.8;
checks += 2;
if (misrouted > 0) bad(`${misrouted} question(s) routed to grading — this must be zero`);
if (recall < MIN_ANSWER_RECALL) bad(`answer recall ${(recall * 100).toFixed(0)}% < ${MIN_ANSWER_RECALL * 100}%`);

console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exit(failures === 0 ? 0 : 1);
