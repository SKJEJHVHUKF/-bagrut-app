/**
 * test-parent-report.ts — what a parent reads about one week.
 *
 *   npx tsx scripts/test-parent-report.ts
 *
 * WHY THIS EXISTS
 * The parent page is a set of sentences about a child, and every way it can be
 * wrong is quiet:
 *
 *   - a student who practised LAST week but not this one must read "השבוע לא
 *     היה תרגול", not an empty report that looks broken or a zero that looks
 *     like a grade;
 *   - a topic with two answers must not be announced as "השתפר" — two answers
 *     are a bad afternoon, not a trend;
 *   - an answer exactly seven days old belongs to one week, not to both.
 *
 * None of those throw. They print a plausible sentence.
 */

import { buildParentWeek, weekSentence, toBoardAttempt, WEEK_MS } from '../lib/parent-report';
import { STUCK_MIN_ATTEMPTS, type BoardAttempt } from '../lib/class-board';

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

const NOW = Date.UTC(2026, 8, 14, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const U = 'c3d4e5f6-0000-4000-8000-000000000001';

function rows(
  topic: string,
  n: number,
  correctCount: number,
  daysAgo: number,
  opts: { repeat?: boolean; note?: string } = {}
): BoardAttempt[] {
  return Array.from({ length: n }, (_, i) => ({
    user_id: U,
    topic,
    correct: i < correctCount,
    is_repeat: opts.repeat ?? false,
    diagnosis: i >= correctCount && opts.note ? { kind: 'known-mistake', note: opts.note } : null,
    created_at: new Date(NOW - daysAgo * DAY - i * 60_000).toISOString(),
  }));
}

// ============================================================
{
  const w = buildParentWeek({ name: 'נועה', attempts: [], now: NOW });
  assert(w.empty, 'no answers at all → empty');
  assert(w.answered === 0 && w.activeDays === 0, 'no answers → 0 answered, 0 active days');
  assert(
    w.strong.length === 0 && w.workOn.length === 0 && w.changes.length === 0 && w.practiceChange === null,
    'no answers → nothing strong, nothing to work on, no change claimed'
  );
  assert(w.name === 'נועה' && w.now === NOW, 'name and the instant are carried through');
}

// ============================================================
{
  // Practised last week, not this one.
  const w = buildParentWeek({ name: 'x', attempts: rows('סדרות', 6, 4, 9), now: NOW });
  assert(!w.empty, 'active only last week → NOT empty');
  assert(w.answered === 0 && w.activeDays === 0, 'active only last week → 0 answered this week');
  assert(weekSentence(w) === 'השבוע לא היה תרגול', 'active only last week → the page says "השבוע לא היה תרגול"');
  assert(w.practiceChange === 'less', 'active only last week → less practice than last week');
  assert(w.strong.length === 0 && w.changes.length === 0, 'last week alone produces no strong topic and no change');
}

// ============================================================
{
  const attempts = [
    // טריגונומטריה: 3/6 last week → 9/10 this week.
    ...rows('טריגונומטריה', 6, 3, 10),
    ...rows('טריגונומטריה', 10, 9, 1),
    // סדרות: 3/4 last week → 2/6 this week, with named mistakes.
    ...rows('סדרות', 4, 3, 8),
    ...rows('סדרות', 6, 2, 2, { note: 'נוסחת האיבר הכללי עם $n$ במקום $n-1$' }),
    // פונקציות: 6/10 → 7/10, exactly the 0.10 gate (0.0999…98 in floating point).
    ...rows('פונקציות', 10, 6, 12),
    ...rows('פונקציות', 10, 7, 3),
    // הסתברות: thin this week (below the sample gate), measured last week.
    ...rows('הסתברות', 5, 1, 11),
    ...rows('הסתברות', STUCK_MIN_ATTEMPTS - 1, STUCK_MIN_ATTEMPTS - 1, 4),
  ];
  const w = buildParentWeek({ name: 'x', attempts, now: NOW });

  const change = (t: string) => w.changes.find((c) => c.topic === t)?.direction;
  assert(change('טריגונומטריה') === 'up', 'a topic improving 0.5 → 0.9 is an "up" change');
  assert(change('סדרות') === 'down', 'a topic falling 0.75 → 0.33 is a "down" change');
  assert(change('פונקציות') === 'up', 'a move of exactly 0.10 counts (floating point does not eat it)');
  assert(change('הסתברות') === undefined, 'a thin topic this week produces NO change entry, even from 0.2 to 1.0');
  assert(!w.strong.includes('הסתברות'), 'a thin topic is not "strong" either, even at 100%');

  assert(w.strong.includes('טריגונומטריה') && w.strong.includes('פונקציות'), 'measured topics ≥ 0.7 are strong');
  assert(!w.strong.includes('סדרות'), 'a stuck topic is not strong');

  assert(w.workOn[0]?.topic === 'סדרות', 'the stuck topic leads "על מה כדאי לעבוד"');
  assert(w.workOn[0]?.note === 'נוסחת האיבר הכללי עם $n$ במקום $n-1$', 'it carries its named mistake');
  assert(
    w.workOn.filter((x) => x.note === 'נוסחת האיבר הכללי עם $n$ במקום $n-1$').length === 1,
    'the same mistake made four times is listed once'
  );

  assert(w.answered === 10 + 6 + 10 + (STUCK_MIN_ATTEMPTS - 1), 'answered counts this week only');
  assert(w.activeDays === 4, 'four distinct days this week → 4 active days');
  assert(weekSentence(w) === `השבוע: 4 ימי תרגול, ${w.answered} תרגילים`, 'the sentence names days and answers');
  assert(w.practiceChange === 'same', `${w.answered} answers against 25 last week is "same", not "more"`);
}

// ============================================================
{
  // An answer exactly 7×24h old is last week's, never both weeks'.
  const edge: BoardAttempt = {
    user_id: U,
    topic: 'סדרות',
    correct: true,
    created_at: new Date(NOW - WEEK_MS).toISOString(),
  };
  const w = buildParentWeek({ name: 'x', attempts: [edge], now: NOW });
  assert(w.answered === 0 && w.practiceChange === 'less', 'an answer exactly 7×24h old belongs to last week');

  const replays = buildParentWeek({
    name: 'x',
    attempts: [...rows('סדרות', 3, 3, 1), ...rows('סדרות', 5, 0, 1, { repeat: true })],
    now: NOW,
  });
  assert(replays.answered === 8, 'replays are practice: they count in "answered"');
  assert(replays.strong.includes('סדרות') && replays.workOn.length === 0, 'replays are not measurement: 3/3 stays strong');

  const busy = buildParentWeek({
    name: 'x',
    attempts: [...rows('סדרות', 10, 5, 9), ...rows('סדרות', 13, 5, 1)],
    now: NOW,
  });
  assert(busy.practiceChange === 'more', '13 answers against 10 is "more"');

  assert(
    weekSentence({ activeDays: 1, answered: 1 }) === 'השבוע: יום תרגול אחד, תרגיל אחד',
    'singular day and answer read as Hebrew, not "1 ימי תרגול"'
  );
}

// ============================================================
{
  const a = toBoardAttempt({
    user_id: U,
    topic: 'סדרות',
    sub_topic_id: null,
    correct: true,
    is_repeat: null,
    hint_used: 1,
    diagnosis: null,
    created_at: '2026-09-14T09:00:00Z',
    ts: 123,
  });
  assert(
    a.user_id === U && a.correct === true && a.is_repeat === false && a.hint_used === true && a.sub_topic_id === null,
    'a raw row maps to a BoardAttempt with booleans coerced'
  );
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
