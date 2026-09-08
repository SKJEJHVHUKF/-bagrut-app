/**
 * verify:teacher-status — the traffic light on /teacher, exercised.
 *
 * The light decides what a teacher does with his next lesson, and it is the
 * one branchy thing on that screen. Everything else there renders a field.
 *
 * This runs the REAL `studentStatus`, not a copy of its rules — a check that
 * restates the logic it is checking passes for the wrong reason. Each case
 * asserts the OUTPUT (light, and the part of the sentence that carries the
 * meaning), never the shape of the source.
 */

import { studentStatus, type StatusInput, type Light } from '../lib/teacher-status';

/** Topic keys are curriculum ids; the dashboard maps them to display names.
 *  Here the identity map keeps the assertions readable. */
const label = (k: string) => k;

/** A student with nothing wrong. Every case below is this, minus one thing. */
function ok(over: Partial<StatusInput> = {}): StatusInput {
  return {
    name: 'דוד',
    syncedAt: '2026-09-08T10:00:00Z',
    lastAnswerAt: NOW - 2 * 86400000,
    answered: 40,
    correct: 36,
    accuracy: 0.9,
    activeDays: 12,
    stuck: [],
    stuckRungs: [],
    report: { weaknesses: [] },
    assignments: [],
    ...over,
  };
}

const NOW = Date.parse('2026-09-08T12:00:00Z');

const weakness = (over: Partial<StatusInput['report']['weaknesses'][number]> = {}) => ({
  kind: 'subtopic',
  topic: 'וקטורים',
  subTopicId: 'vec-angle',
  title: 'זווית בין וקטורים',
  chronic: false,
  ...over,
});

let ran = 0;
let failed = 0;

function check(what: string, input: StatusInput, expect: { light: Light; says?: string; target?: string | null }) {
  ran++;
  const got = studentStatus(input, label, NOW);
  const problems: string[] = [];
  if (got.light !== expect.light) problems.push(`light ${got.light} ≠ ${expect.light}`);
  if (expect.says !== undefined && !got.headline.includes(expect.says)) {
    problems.push(`headline "${got.headline}" does not contain "${expect.says}"`);
  }
  if (expect.target !== undefined) {
    const t = got.target?.subTopicId ?? null;
    if (t !== expect.target) problems.push(`target ${JSON.stringify(t)} ≠ ${JSON.stringify(expect.target)}`);
  }
  if (problems.length) {
    failed++;
    console.error(`  ✗ ${what}\n      ${problems.join('\n      ')}`);
  } else {
    console.log(`  ✓ ${what} → ${got.light}: ${got.headline}`);
  }
}

console.log('\nverify:teacher-status — the light a teacher acts on\n');

// ── THE INVARIANT ─────────────────────────────────────────────────────────
// A student with no synced log is grey, never red, however bad the derived
// numbers look. An absent answer log and an empty one are the same zeros.
console.log('the invariant — no data is not a failure');
check(
  'never synced, and every number underneath it says "terrible"',
  ok({
    syncedAt: null,
    answered: 0,
    correct: 0,
    accuracy: 0,
    activeDays: 0,
    lastAnswerAt: null,
    report: { weaknesses: [weakness({ kind: 'misconception', chronic: true })] },
    stuckRungs: [{ topic: 'וקטורים', subId: 'vec-angle', title: 'זווית', kind: 'mid', attempts: 9 }],
  }),
  { light: 'none', says: 'לא נכנס לאפליקציה', target: null }
);

// ── RED, in priority order ────────────────────────────────────────────────
console.log('\nred');
check(
  'a mistake he repaired and fell back into outranks everything',
  ok({
    report: {
      weaknesses: [
        weakness({ kind: 'misconception', title: 'טעות אחרת' }),
        weakness({ chronic: true, title: 'מחשב שליפה עם החזרה', subTopicId: 'prob-wo' }),
      ],
    },
  }),
  { light: 'red', says: 'חזר לטעות שכבר תוקנה', target: 'prob-wo' }
);
check(
  'a named misconception is said in the words it was authored in',
  ok({
    report: {
      weaknesses: [weakness({ kind: 'misconception', title: 'מחשב שליפה עם החזרה כשנדרשת בלי' })],
    },
  }),
  { light: 'red', says: 'דוד מחשב שליפה עם החזרה כשנדרשת בלי', target: 'vec-angle' }
);
check(
  'a weak topic points at the weakest sub-topic inside it, not at the topic',
  ok({
    stuck: [
      {
        topic: 'וקטורים',
        answered: 8,
        correct: 2,
        accuracy: 0.25,
        worstSubTopic: { subTopicId: 'vec-angle', title: 'זווית בין וקטורים' },
      },
    ],
  }),
  { light: 'red', says: 'מתקשה בנושא זווית בין וקטורים', target: 'vec-angle' }
);
check(
  'a weak topic with no sub-topic breakdown still lands somewhere',
  ok({
    stuck: [{ topic: 'אלגברה', answered: 8, correct: 2, accuracy: 0.25, worstSubTopic: null }],
  }),
  { light: 'red', says: '6 טעויות מתוך 8', target: null }
);
check(
  'a rung played three times and never cleared',
  ok({
    stuckRungs: [
      { topic: 'פונקציות', subId: 'rq-invest', title: 'חקירת פונקציה', kind: 'mid', attempts: 4 },
    ],
  }),
  { light: 'red', says: 'ניסה חקירת פונקציה ברמת תרגול 4 פעמים', target: 'rq-invest' }
);
check('stopped working entirely', ok({ activeDays: 0 }), {
  light: 'red',
  says: 'לא תרגל אף יום',
});
check('below 60% with enough questions behind it', ok({ answered: 20, correct: 9, accuracy: 0.45 }), {
  light: 'red',
  says: '9 שאלות מתוך 20',
});

// ── YELLOW ────────────────────────────────────────────────────────────────
console.log('\nyellow');
check('a weakness that is not a named misconception', ok({ report: { weaknesses: [weakness()] } }), {
  light: 'yellow',
  says: 'מתקשה בנושא זווית בין וקטורים',
  target: 'vec-angle',
});
check(
  'homework whose due date has passed',
  ok({ assignments: [{ dueDate: '2026-09-01', complete: false }] }),
  { light: 'yellow', says: 'תאריך ההגשה שלהם עבר' }
);
check(
  'homework due today is NOT late yet',
  ok({ assignments: [{ dueDate: '2026-09-08', complete: false }] }),
  { light: 'green' }
);
check(
  'homework that is late but already finished is not held against him',
  ok({ assignments: [{ dueDate: '2026-09-01', complete: true }] }),
  { light: 'green' }
);
check('signed in, never answered', ok({ answered: 0, correct: 0, accuracy: 0, lastAnswerAt: null }), {
  light: 'yellow',
  says: 'עוד לא ענה על שאלות',
});
check('a fortnight without a question', ok({ lastAnswerAt: NOW - 21 * 86400000 }), {
  light: 'yellow',
  says: 'לא תרגל 21 ימים',
});
check(
  'four questions is not a measurement, and says so',
  ok({ answered: 4, correct: 4, accuracy: 1 }),
  { light: 'yellow', says: 'מעט מדי כדי לדעת' }
);
check('between 60% and 80%', ok({ answered: 20, correct: 14, accuracy: 0.7 }), {
  light: 'yellow',
  says: 'לא בשליטה מלאה',
});

// ── GREEN ─────────────────────────────────────────────────────────────────
console.log('\ngreen');
check('nothing wrong', ok(), { light: 'green', says: 'שולט בחומר', target: null });
check('exactly at the 80% line is green, not yellow', ok({ answered: 20, correct: 16, accuracy: 0.8 }), {
  light: 'green',
});

// ── EVERY HEADLINE NAMES THE STUDENT ──────────────────────────────────────
// A sentence on a roster of 30 that does not say who it is about is a sentence
// the teacher has to trace back to a row.
console.log('\nevery light names the student');
for (const [what, input] of Object.entries({
  grey: ok({ syncedAt: null }),
  red: ok({ activeDays: 0 }),
  yellow: ok({ answered: 20, correct: 14, accuracy: 0.7 }),
  green: ok(),
})) {
  ran++;
  const got = studentStatus(input, label, NOW);
  if (got.headline.startsWith('דוד')) {
    console.log(`  ✓ ${what} opens with the name`);
  } else {
    failed++;
    console.error(`  ✗ ${what} headline does not open with the name: "${got.headline}"`);
  }
}

console.log(`\n${ran} cases, ${failed} failed\n`);
if (failed > 0) process.exit(1);
