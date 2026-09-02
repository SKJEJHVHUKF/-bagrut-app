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
  AWAY_DAYS,
  STUCK_MIN_ATTEMPTS,
  RETEACH_MIN_STUDENTS,
  ATTENTION_LIMIT,
  type BoardAttempt,
} from '../lib/class-board';

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
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
