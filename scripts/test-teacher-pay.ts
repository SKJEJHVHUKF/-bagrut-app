/**
 * test-teacher-pay.ts — the salary contract, and the homework counter.
 *
 *   npx tsx scripts/test-teacher-pay.ts
 *
 * WHY THIS EXISTS
 * lib/teacher-pay turns a clock into money someone is owed. Every failure mode
 * it has is silent: a week boundary that lands an hour off across Israel's DST
 * shift moves a Sunday into the wrong week, a month that quietly holds 5 weeks
 * instead of 4 pays 25% too much, and a teacher hired mid-month gets paid for
 * weeks he did not work. None of those throw — they just print a wrong number
 * next to a shekel sign.
 *
 * So the properties pinned here are the ones a person would have to check by
 * hand otherwise: the week boundary across both DST transitions, which weeks
 * belong to which month, that an override moves exactly one week, that weeks
 * before the hire date and weeks that have not started never accrue, and that
 * corrections apply retroactively because nothing is stored.
 */

import {
  addDays,
  buildPay,
  israelDay,
  weekStartOf,
  weekStartsInMonth,
} from '../lib/teacher-pay';
import { assignmentProgress } from '../lib/assignment-progress';

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (cond) {
    console.log(`PASS  ${msg}`);
  } else {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
}

// ---- the civil date in Israel, not the server's ---------------------------
// The server runs in UTC on Vercel. An evening instant in UTC is already the
// next day in Israel, and the whole week hangs off getting this right.
assert(
  israelDay(new Date('2026-09-06T21:30:00Z')) === '2026-09-07',
  'a UTC evening is already the next day in Israel'
);
assert(
  israelDay(new Date('2026-09-06T09:00:00Z')) === '2026-09-06',
  'a UTC morning is the same day in Israel'
);

// ---- the week boundary, across BOTH DST transitions ------------------------
// Israel leaves DST on 2026-10-25 (UTC+3 → UTC+2). These two instants are 24h
// apart with different offsets between them; both must land on the same week.
assert(weekStartOf('2026-09-07') === '2026-09-06', 'Monday belongs to the Sunday before it');
assert(weekStartOf('2026-09-06') === '2026-09-06', 'Sunday is its own week start');
assert(weekStartOf('2026-09-12') === '2026-09-06', 'Saturday closes the same week');
assert(
  weekStartOf(israelDay(new Date('2026-10-24T22:30:00Z'))) === '2026-10-25',
  'the last Sunday on summer time opens its own week'
);
assert(
  weekStartOf(israelDay(new Date('2026-10-25T22:30:00Z'))) === '2026-10-25',
  'the Monday after the clocks go back stays in that same week (DST does not shift it)'
);
assert(
  weekStartOf(israelDay(new Date('2026-03-28T22:30:00Z'))) === '2026-03-29',
  'the spring-forward Sunday opens its own week too'
);
assert(addDays('2026-10-25', 1) === '2026-10-26', 'calendar arithmetic ignores the 25-hour day');

// ---- which weeks a month owns ---------------------------------------------
// A week goes to the month holding most of its days (the month of its
// Thursday), so the week of Sun 2026-08-30 — 5 of whose days are September —
// is paid by September.
assert(
  weekStartsInMonth('2026-09').join() === '2026-08-30,2026-09-06,2026-09-13,2026-09-20',
  'September 2026 holds 4 weeks, starting with the one that opens in August'
);
assert(
  weekStartsInMonth('2026-10').join() ===
    '2026-09-27,2026-10-04,2026-10-11,2026-10-18,2026-10-25',
  'October 2026 holds 5 weeks — the 25% month'
);
// The property that matters more than either list: every week is paid once.
// A gap loses someone a week's wages; an overlap pays it twice.
const chain = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11'].flatMap(
  weekStartsInMonth
);
assert(new Set(chain).size === chain.length, 'no week is claimed by two months');
assert(
  chain.every((w, i) => i === 0 || w === addDays(chain[i - 1], 7)),
  'and consecutive months hand over without skipping a week'
);

// ---- the standing figure accrues by itself --------------------------------
// Wednesday 2026-09-30: September's four weeks (08-30, 09-06, 09-13, 09-20)
// have all started.
const base = {
  now: new Date('2026-09-30T09:00:00Z'),
  rate: 90,
  weeklyHours: 10,
  since: null,
  overrides: [],
};
const plain = buildPay(base);
assert(plain.week.hours === 10 && plain.week.pay === 900, 'this week: 10h → ₪900');
assert(plain.month.hours === 40 && plain.month.pay === 3600, 'September: 4 weeks × 10h → ₪3,600');
assert(plain.month.weeks.length === 4, 'and the four weeks are listed so the total is auditable');

const october = buildPay({ ...base, now: new Date('2026-10-31T09:00:00Z') });
assert(october.month.hours === 50, 'October pays 5 weeks — the same teacher, the same figure');

// THE MONTH-BOUNDARY REGRESSION. On Tue 2026-09-01 the week in progress began
// Sun 2026-08-30. Under the old "month of the Sunday" rule September owned no
// started week, so the screen showed "this week ₪900" beside "this month ₪0"
// — the week being worked belonged to a month that was already paid.
const firstOfMonth = buildPay({ ...base, now: new Date('2026-09-01T09:00:00Z') });
assert(
  firstOfMonth.week.weekStart === '2026-08-30',
  'the week in progress on the 1st opened in the previous month'
);
assert(
  firstOfMonth.month.hours === 10 && firstOfMonth.month.pay === 900,
  'and it is paid by THIS month — never ₪0 next to a week that is being worked'
);

// ---- one override moves exactly one week ----------------------------------
const fixed = buildPay({
  ...base,
  overrides: [{ weekStart: '2026-09-13', hours: 4, note: 'מילואים' }],
});
assert(fixed.month.hours === 34, 'a corrected week replaces its hours and no others');
assert(
  fixed.month.weeks.filter((w) => w.edited).length === 1,
  'exactly one week is flagged as hand-edited'
);
assert(
  fixed.month.weeks.find((w) => w.weekStart === '2026-09-13')?.note === 'מילואים',
  'the reason rides along with the correction'
);
assert(
  buildPay({ ...base, overrides: [{ weekStart: '2026-09-13', hours: 0 }] }).month.hours === 30,
  'zeroing a week is a correction, not a missing row'
);

// ---- nothing is stored, so corrections are retroactive --------------------
const raised = buildPay({ ...base, rate: 120 });
assert(raised.month.pay === 4800, 'a rate change re-prices the whole month, past weeks included');

// ---- weeks that never accrue ----------------------------------------------
// Hired 2026-09-16 (a Wednesday): the weeks of 08-30 and 09-06 must not appear.
const hiredMidMonth = buildPay({ ...base, since: '2026-09-16' });
assert(
  hiredMidMonth.month.weeks.map((w) => w.weekStart).join() === '2026-09-13,2026-09-20',
  'weeks before the hire week are not listed'
);
assert(hiredMidMonth.month.hours === 20, 'and are not paid — 2 weeks, not 4');

// Mid-month "so far": on Tuesday 2026-09-08 two of September's four weeks
// have started.
const midMonth = buildPay({ ...base, now: new Date('2026-09-08T09:00:00Z') });
assert(midMonth.month.hours === 20, 'the month total is what has accrued so far, not a projection');
assert(
  midMonth.month.weeks.filter((w) => !w.counted).length === 2,
  'the weeks still to come are shown, but uncounted'
);

// A teacher hired today still sees this week — the week is his first, whole.
const hiredToday = buildPay({
  ...base,
  now: new Date('2026-09-08T09:00:00Z'),
  since: '2026-09-08',
});
assert(hiredToday.week.hours === 10, 'the hire week counts whole (correct it with an override)');

// ---- unset terms are zero, never a guess ----------------------------------
const unset = buildPay({ ...base, rate: 0, weeklyHours: 0 });
assert(
  unset.month.hours === 0 && unset.month.pay === 0,
  'a teacher with no terms set is owed 0 — never an invented default'
);
assert(
  buildPay({ ...base, overrides: [{ weekStart: '2026-09-13', hours: -5 }] }).month.hours === 30,
  'a negative override cannot subtract from the salary'
);

// ============================================================
// The assignment counter — the OTHER number two screens must agree on.
// ============================================================
// The teacher's dashboard and the student's card both run this, over the same
// events in two different shapes. If they disagree, one of them is lying to a
// person about whether homework got done.
const GIVEN = '2026-09-10T08:00:00.000Z';
const answers = [
  { topic: 'אלגברה', ts: Date.parse('2026-09-09T10:00:00Z'), correct: true }, // before
  { topic: 'אלגברה', ts: Date.parse('2026-09-11T10:00:00Z'), correct: true },
  { topic: 'אלגברה', ts: Date.parse('2026-09-12T10:00:00Z'), correct: false },
  { topic: 'טריגונומטריה', ts: Date.parse('2026-09-12T10:00:00Z'), correct: true }, // other topic
  { topic: 'אלגברה', ts: Date.parse('2026-09-13T10:00:00Z'), correct: true, subTopicId: 'alg-2' },
];

const counted = assignmentProgress(answers, { topic: 'אלגברה', createdAt: GIVEN });
assert(counted.answered === 3, 'only answers in the task topic, given after the task, are counted');
assert(counted.correct === 2, 'and the correct ones among them');

assert(
  assignmentProgress(answers, { topic: 'אלגברה', subTopicId: 'alg-2', createdAt: GIVEN })
    .answered === 1,
  'a task narrowed to a sub-topic counts only that sub-topic'
);
assert(
  assignmentProgress(answers, { topic: 'גאומטריה', createdAt: GIVEN }).answered === 0,
  'a topic he never touched counts 0'
);
assert(
  assignmentProgress(answers, { topic: 'אלגברה', createdAt: 'not-a-date' }).answered === 4,
  'an unparseable given-at counts from the beginning rather than pinning the counter at 0'
);

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
