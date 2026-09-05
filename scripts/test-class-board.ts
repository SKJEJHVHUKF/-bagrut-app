/**
 * test-class-board.ts — the judgements a teacher acts on.
 *
 *   npx tsx scripts/test-class-board.ts
 *
 * WHY THIS EXISTS
 * Every output of lib/class-board turns into a sentence someone says to a
 * fifteen-year-old, and every way it can be wrong is quiet:
 *
 *   - counting replays as measurements means re-doing a cleared rung raises a
 *     student's mastery, so the board rewards the activity that helps least;
 *   - a student with no data rendering as 0% sends a teacher into "why did you
 *     do nothing this week" with a student who was never onboarded;
 *   - a POOLED class average lets one student who answered 200 questions decide
 *     what 31 people get re-taught;
 *   - reading the clock per student can put two students in different days.
 *
 * None of those throw. They print a plausible number.
 */

import {
  buildClassBoard,
  topicSummary,
  AWAY_DAYS,
  STUCK_MIN_ATTEMPTS,
  RETEACH_MIN_STUDENTS,
  ATTENTION_LIMIT,
  STRONG_MIN_MASTERY,
  type BoardAttempt,
} from '../lib/class-board';
import { demoBoard, demoFocuses } from '../lib/demo-board';

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (cond) console.log(`PASS  ${msg}`);
  else {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
}

const NOW = Date.UTC(2026, 8, 6, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const at = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

function rows(
  user_id: string,
  topic: string,
  n: number,
  correctCount: number,
  opts: { daysAgo?: number; repeat?: boolean } = {}
): BoardAttempt[] {
  return Array.from({ length: n }, (_, i) => ({
    user_id,
    topic,
    correct: i < correctCount,
    is_repeat: opts.repeat ?? false,
    created_at: at(opts.daysAgo ?? 0),
  }));
}

// ============================================================
// The two denominators
// ============================================================
{
  const roster = [{ id: 'u1', name: 'נועה' }];
  // 4 measured, 1 right (25%) + 10 replays all correct.
  const attempts = [...rows('u1', 'סדרות', 4, 1), ...rows('u1', 'סדרות', 10, 10, { repeat: true })];
  const b = buildClassBoard(roster, attempts, NOW);
  const s = b.students[0];

  assert(s.measured === 4, 'mastery counts only non-replay attempts');
  assert(s.attempts === 14, 'activity counts every attempt, replays included');
  assert(s.mastery === 0.25, 'ten perfect replays do NOT raise mastery above the real 25%');
  assert(s.state === 'stuck', 'a student failing a topic he has really attempted is stuck');
}

// ============================================================
// No fake zero
// ============================================================
{
  const roster = [
    { id: 'u1', name: 'מאיה' },
    { id: 'u2', name: 'רן' },
  ];
  const b = buildClassBoard(roster, rows('u2', 'סדרות', 3, 3), NOW);
  const maya = b.students.find((s) => s.id === 'u1')!;

  assert(maya.mastery === null, 'a student who never answered has mastery null, NOT 0');
  assert(maya.state === 'no-data', 'and the state says so in one word');
  assert(maya.lastActiveAt === null && maya.daysSinceActive === null, 'no invented last-seen time');
  assert(b.neverStarted === 1, 'never-started is counted separately from inactive');

  const row = b.needsAttention.find((r) => r.studentId === 'u1')!;
  assert(row.state === 'no-data', 'she still reaches the attention list');
  assert(
    /אין נתונים/.test(row.reason) && !/0%/.test(row.reason),
    'and the wording says "no data", never a zero a teacher would read as laziness'
  );
  assert(
    b.needsAttention[0].studentId !== 'u1' || b.needsAttention.length === 1,
    'but never-started ranks BELOW a real problem'
  );
}

// ============================================================
// away — measured on the SERVER clock, and it is not a verdict on ability
// ============================================================
{
  const roster = [{ id: 'u1', name: 'יובל' }];
  const b = buildClassBoard(roster, rows('u1', 'סדרות', 5, 5, { daysAgo: AWAY_DAYS + 2 }), NOW);
  const s = b.students[0];

  assert(s.state === 'away', `no attempt for ${AWAY_DAYS}+ days reads as away`);
  assert(s.daysSinceActive === AWAY_DAYS + 2, 'the day count is exact, not bucketed');
  assert(s.mastery === 1, 'and his mastery is untouched — away is about attendance, not ability');
  assert(b.activeThisWeek === 0, 'he is not counted as active this week');

  const recent = buildClassBoard(roster, rows('u1', 'סדרות', 5, 5, { daysAgo: 1 }), NOW);
  assert(recent.students[0].state === 'active', 'yesterday is active');
  assert(recent.activeThisWeek === 1, 'and counts toward the weekly figure');
  assert(recent.needsAttention.length === 0, 'a working student never appears on the attention list');
}

// ============================================================
// stuck needs enough evidence
// ============================================================
{
  const roster = [{ id: 'u1', name: 'שיר' }];
  const thin = buildClassBoard(roster, rows('u1', 'סדרות', STUCK_MIN_ATTEMPTS - 1, 0), NOW);
  assert(
    thin.students[0].state === 'active',
    `fewer than ${STUCK_MIN_ATTEMPTS} attempts is a bad afternoon, not a weakness`
  );

  const real = buildClassBoard(roster, rows('u1', 'סדרות', STUCK_MIN_ATTEMPTS, 0), NOW);
  assert(real.students[0].state === 'stuck', `${STUCK_MIN_ATTEMPTS} failed attempts is a weakness`);
  assert(
    /סדרות/.test(real.needsAttention[0].reason) && /3 תרגילים/.test(real.needsAttention[0].reason),
    'the reason names the topic AND the evidence, so the teacher can judge it'
  );
}

// ============================================================
// reteach: a class-level claim needs a class-level sample
// ============================================================
{
  // Four students all failing — under the minimum, so no class claim.
  const few = Array.from({ length: RETEACH_MIN_STUDENTS - 1 }, (_, i) => ({
    id: `u${i}`,
    name: `ת${i}`,
  }));
  const fewAttempts = few.flatMap((s) => rows(s.id, 'סדרות', 5, 1));
  assert(
    buildClassBoard(few, fewAttempts, NOW).reteach.length === 0,
    `fewer than ${RETEACH_MIN_STUDENTS} students with data cannot condemn a topic`
  );

  // Same failure rate, enough students — now it is a lesson.
  const many = Array.from({ length: 8 }, (_, i) => ({ id: `u${i}`, name: `ת${i}` }));
  const manyAttempts = many.flatMap((s) => rows(s.id, 'סדרות', 5, 1));
  const b = buildClassBoard(many, manyAttempts, NOW);
  assert(b.reteach.length === 1 && b.reteach[0].topic === 'סדרות', 'eight failing students is a lesson');
  assert(b.reteach[0].belowHalf === 8, 'and it reports how many, not just an average');
  assert(/זה שיעור, לא תלמיד/.test(b.reteach[0].reason), 'the wording points at the lesson');
}

// ============================================================
// the class average is a per-student mean, not a pooled ratio
// ============================================================
{
  const roster = Array.from({ length: 6 }, (_, i) => ({ id: `u${i}`, name: `ת${i}` }));
  // Five students: 3 attempts each, all correct. One heavy student: 200
  // attempts, all wrong. Pooled would be 15/215 = 7% and demand a re-teach.
  const attempts = [
    ...roster.slice(0, 5).flatMap((s) => rows(s.id, 'סדרות', 3, 3)),
    ...rows('u5', 'סדרות', 200, 0),
  ];
  const b = buildClassBoard(roster, attempts, NOW);

  assert(
    b.reteach.length === 0,
    'one student who answered 200 questions cannot decide what 31 people are re-taught'
  );
  const heavy = b.students.find((s) => s.id === 'u5')!;
  assert(heavy.state === 'stuck', 'he is still flagged individually — the signal is not lost, just scoped');
}

// ============================================================
// the attention list is a list a person can act on
// ============================================================
{
  const roster = Array.from({ length: 12 }, (_, i) => ({ id: `u${i}`, name: `ת${i}` }));
  const attempts = roster.flatMap((s) => rows(s.id, 'סדרות', 6, 0));
  const b = buildClassBoard(roster, attempts, NOW);

  assert(b.needsAttention.length === ATTENTION_LIMIT, `capped at ${ATTENTION_LIMIT}, not a report of 12`);
  assert(b.students.length === 12, 'while the full roster is still available underneath');
}

// ============================================================
// severity: more evidence of being stuck outranks a worse-looking percentage
// ============================================================
{
  const roster = [
    { id: 'deep', name: 'עמוק' },
    { id: 'shallow', name: 'רדוד' },
  ];
  const attempts = [
    ...rows('deep', 'סדרות', 11, 2), // 18%, 9 wrong
    ...rows('shallow', 'סדרות', 3, 0), // 0%, 3 wrong
  ];
  const b = buildClassBoard(roster, attempts, NOW);
  assert(
    b.needsAttention[0].studentId === 'deep',
    'nine wrong answers outranks a prettier 0% over three — evidence, not percentage'
  );
}

// ============================================================
// heatmap columns come from the class, not the syllabus
// ============================================================
{
  const roster = [{ id: 'u1', name: 'נועה' }];
  const attempts = [...rows('u1', 'הסתברות', 2, 2), ...rows('u1', 'סדרות', 9, 5)];
  const b = buildClassBoard(roster, attempts, NOW);

  assert(b.topics.length === 2, 'only topics the class actually touched become columns');
  assert(b.topics[0] === 'סדרות', 'busiest first, so the column that matters is nearest');
  assert(
    !b.topics.includes('גאומטריה'),
    'a topic nobody opened is absent, not an empty column next to a failed one'
  );
}

// ============================================================
// an empty class is empty, not broken
// ============================================================
{
  const b = buildClassBoard([], [], NOW);
  assert(b.studentCount === 0 && b.needsAttention.length === 0 && b.topics.length === 0, 'a class with no students renders nothing, throws nothing');

  const noWork = buildClassBoard([{ id: 'u1', name: 'א' }], [], NOW);
  assert(
    noWork.reteach.length === 0 && noWork.students[0].mastery === null,
    'a class where nobody has started makes no claims about anyone'
  );
}

// ============================================================
// topicSummary — the class's topics as three words
// ============================================================
//
// This is what the teacher's first screen shows instead of a heatmap, so the
// things pinned here are the sentences: a topic under the sample gate makes
// NO claim (absent, not "borderline"); "ללמד שוב" is exactly board.reteach and
// never a second opinion; a student with no data neither drags a topic down
// nor appears as stuck in it; and the order is what to fix first.
{
  const few = Array.from({ length: RETEACH_MIN_STUDENTS - 1 }, (_, i) => ({ id: `u${i}`, name: `ת${i}` }));
  const fewBoard = buildClassBoard(few, few.flatMap((s) => rows(s.id, 'סדרות', 5, 1)), NOW);
  assert(
    topicSummary(fewBoard).length === 0,
    `fewer than ${RETEACH_MIN_STUDENTS} students with data → the topic is ABSENT, not "borderline"`
  );

  const six = Array.from({ length: 6 }, (_, i) => ({ id: `u${i}`, name: `ת${i}` }));
  const strong = topicSummary(buildClassBoard(six, six.flatMap((s) => rows(s.id, 'הסתברות', 3, 3)), NOW));
  assert(strong.length === 1 && strong[0].state === 'strong', 'six students at 3/3 → הכיתה שולטת');
  assert(strong[0].stuckStudents.length === 0, '…and nobody is listed as stuck in it');

  const five = six.slice(0, 5);
  const boundary = topicSummary(buildClassBoard(five, five.flatMap((s) => rows(s.id, 'פונקציות', 10, 7)), NOW));
  assert(
    boundary[0]?.state === 'strong' && boundary[0].mean === STRONG_MIN_MASTERY,
    `a class mean of exactly ${STRONG_MIN_MASTERY} is strong, not borderline (boundary is inclusive)`
  );

  const border = topicSummary(buildClassBoard(six, six.flatMap((s) => rows(s.id, 'פונקציות', 3, 2)), NOW));
  assert(border[0]?.state === 'borderline', 'six students at 2/3 (0.67) → על הגבול');
  assert(border[0].stuckStudents.length === 0, '…and 0.67 is above the stuck rule, so no one is listed');

  const eight = Array.from({ length: 8 }, (_, i) => ({ id: `u${i}`, name: `ת${i}` }));
  const reteachBoard = buildClassBoard(eight, eight.flatMap((s) => rows(s.id, 'סדרות', 5, 1)), NOW);
  const reteachRows = topicSummary(reteachBoard);
  assert(
    reteachRows[0]?.state === 'reteach' && reteachRows[0].topic === reteachBoard.reteach[0].topic,
    'eight students at 1/5 → ללמד שוב, and it is the SAME topic the board\'s reteach zone names'
  );
  assert(reteachRows[0].stuckStudents.length === 8, 'all eight are listed under it, so the teacher sees who');

  // Both directions: every reteach row is in board.reteach and vice versa.
  const mixed = buildClassBoard(
    eight,
    [...eight.flatMap((s) => rows(s.id, 'סדרות', 5, 1)), ...eight.flatMap((s) => rows(s.id, 'הסתברות', 3, 3))],
    NOW
  );
  const mixedRows = topicSummary(mixed);
  const fromSummary = mixedRows.filter((r) => r.state === 'reteach').map((r) => r.topic).sort();
  const fromBoard = mixed.reteach.map((r) => r.topic).sort();
  assert(JSON.stringify(fromSummary) === JSON.stringify(fromBoard), '"ללמד שוב" ⇔ board.reteach, both directions');

  const three = buildClassBoard(
    six,
    [
      ...six.flatMap((s) => rows(s.id, 'סדרות', 5, 1)),
      ...six.flatMap((s) => rows(s.id, 'פונקציות', 3, 2)),
      ...six.flatMap((s) => rows(s.id, 'הסתברות', 3, 3)),
    ],
    NOW
  );
  const order = topicSummary(three).map((r) => r.state);
  assert(
    order.indexOf('reteach') < order.indexOf('borderline') && order.indexOf('borderline') < order.indexOf('strong'),
    'order is what to fix first: ללמד שוב, then על הגבול, then הכיתה שולטת'
  );

  const worst = buildClassBoard(
    [...six.slice(0, 4), { id: 'a', name: 'קצת' }, { id: 'b', name: 'מאוד' }],
    [
      ...six.slice(0, 4).flatMap((s) => rows(s.id, 'סדרות', 3, 3)),
      ...rows('a', 'סדרות', 5, 2),
      ...rows('b', 'סדרות', 5, 1),
    ],
    NOW
  );
  assert(
    topicSummary(worst)[0]?.stuckStudents[0]?.name === 'מאוד' &&
      topicSummary(worst)[0]?.stuckStudents.length === 2,
    'the students under a topic are listed worst first'
  );

  const withEmpty = buildClassBoard(
    [...six, { id: 'z', name: 'ריק' }],
    six.flatMap((s) => rows(s.id, 'הסתברות', 3, 3)),
    NOW
  );
  const we = topicSummary(withEmpty)[0];
  assert(
    we?.state === 'strong' && we.students === 6 && !we.stuckStudents.some((x) => x.name === 'ריק'),
    'a student with no data neither lowers the class mean nor appears as stuck — no fake zero at topic level'
  );

  const withAway = buildClassBoard(
    [...six.slice(0, 5), { id: 'w', name: 'נעלם' }],
    [...six.slice(0, 5).flatMap((s) => rows(s.id, 'סדרות', 3, 3)), ...rows('w', 'סדרות', 5, 1, { daysAgo: AWAY_DAYS + 2 })],
    NOW
  );
  assert(
    topicSummary(withAway)[0]?.stuckStudents.some((x) => x.name === 'נעלם'),
    'a student who is away but stuck in the topic is still listed under it — attendance is a different question'
  );

  const demo = topicSummary(demoBoard(NOW));
  assert(
    JSON.stringify(demo.map((r) => r.topic)) === JSON.stringify(['סדרות', 'טריגונומטריה', 'פונקציות']),
    'the sample class reads: סדרות, טריגונומטריה, פונקציות — in that order'
  );
  assert(
    JSON.stringify(demo.map((r) => r.state)) === JSON.stringify(['reteach', 'borderline', 'strong']),
    '…as ללמד שוב / על הגבול / הכיתה שולטת'
  );
  assert(!demo.some((r) => r.topic === 'הסתברות'), 'הסתברות has four students with data and makes no claim');
  {
    // ⚠️ The ids, not just the names. The console sends a task to exactly these
    // students in one click, so an id that does not match a student on the
    // board would silently aim at nobody — the send would succeed and reach
    // no one.
    const ids = new Set(demoBoard(NOW).students.map((s) => s.id));
    const listed = demo.flatMap((r) => r.stuckStudents);
    assert(listed.length > 0, 'the demo board lists someone as stuck, so the check has something to check');
    assert(
      listed.every((x) => ids.has(x.id)),
      'every stuck student carries an id that exists on the board, so a task can be aimed at them'
    );
  }

  assert(
    demo[0].stuckStudents.some((x) => x.name === 'שיר מ.') &&
      demo[0].stuckStudents.some((x) => x.name === 'רן כ.'),
    'and the names under סדרות include the two the demo is built around'
  );
}

// ============================================================
// The demo's sent-tasks list names who has not closed each one
// ============================================================
//
// The console shows "5 מתוך 8 סגרו" and, under it, the names. The names are
// what a teacher acts on; the count only tells her to go looking. The demo is
// the screen the owner opens, so it has to carry the same shape as real data -
// a sample that quietly lacks the feature is how a screen gets called cheap.
{
  const focuses = demoFocuses(NOW);
  assert(focuses.length > 0, 'the demo has sent tasks to show');
  assert(
    focuses.every((f) => Array.isArray(f.notDone)),
    'every demo task carries a list of who has not closed it'
  );
  const rosterIds = new Set(demoBoard(NOW).students.map((s) => s.id));
  const listed = focuses.flatMap((f) => f.notDone);
  assert(listed.length > 0, 'at least one demo task is unfinished, so the line has something to say');
  assert(
    listed.every((x) => rosterIds.has(x.id)),
    'each of them is a real student on the board, so "send it again" can aim at them'
  );
  assert(
    focuses.every((f) => f.notDone.length === f.totalCount - f.done),
    'the names and the count agree - a list shorter than the gap is the bug that makes a teacher trust neither'
  );
  assert(
    focuses.every((f) => f.notDone.every((x, i, a) => i === 0 || a[i - 1].answered <= x.answered)),
    'the ones who never opened it come first, which is the order she will work in'
  );
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
