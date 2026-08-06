/**
 * test-sync.ts — merge semantics for cross-device sync.
 *
 *   npx tsx scripts/test-sync.ts
 *
 * The two stores merge differently and both have to be right:
 *   roadmap  a MAP of progress that only moves forward → max-wins
 *   results  an append-only SEQUENCE of answers        → set union
 *
 * The property that matters most here is CONVERGENCE: whichever device syncs
 * first, both must end up with byte-identical state. A merge that depends on
 * order silently gives two devices two different grade predictions, and the
 * student sees the number change when they pick up their phone.
 */

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { mergeResults, mergeRoadmap, rebuildSeen } from '../lib/sync/roadmap-sync';
import { MAX_EVENTS, MIN_PER_WEEK_WINDOW, weeklyDelta } from '../lib/results';

const T0 = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
}
function section(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}`);
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

type Ev = Record<string, unknown> & { ts: number; subject: string; topic: string; source: string; correct: boolean };

const ev = (questionId: string, day: number, correct = true, extra: Record<string, unknown> = {}): Ev => ({
  ts: T0 + day * DAY,
  subject: 'math5',
  topic: 'מספרים מרוכבים',
  questionId,
  source: 'drill',
  correct,
  ...extra,
});

// ============================================================
section('Answer log — union');
// ============================================================

{
  const laptop = [ev('q1', 1), ev('q2', 2)];
  const phone = [ev('q3', 3)];
  const merged = mergeResults(laptop, phone);
  assert(merged.length === 3, `disjoint logs combine (${merged.length} events)`);
  assert(
    same(merged.map((e) => e.questionId), ['q1', 'q2', 'q3']),
    'merged log is ordered oldest-first',
  );

  // Idempotent: syncing twice must not duplicate anything.
  assert(same(mergeResults(merged, merged), merged), 'merging a log with itself is a no-op');
  assert(same(mergeResults(merged, []), merged), 'merging with an empty remote is a no-op');

  // Convergent: order of arrival cannot change the result.
  assert(
    same(mergeResults(laptop, phone), mergeResults(phone, laptop)),
    'merge is order-independent — both devices converge on identical state',
  );
}

// ============================================================
section('Answer log — the `repeat` flag');
// ============================================================

{
  // The case this re-derivation exists for: two devices, apart, each recording
  // what IT believed was a first answer to the same question.
  const laptop = [ev('q1', 1)];
  const phone = [ev('q1', 5)];
  const merged = mergeResults(laptop, phone);
  assert(merged.length === 2, 'both answers survive — they really both happened');
  const firsts = merged.filter((e) => !e.repeat);
  assert(
    firsts.length === 1 && firsts[0].ts === T0 + DAY,
    'exactly ONE counts as a first attempt, and it is the earlier one',
  );
  assert(
    merged[1].repeat === true,
    'the later one is flagged a replay, so it cannot inflate the grade prediction',
  );

  // A device may have flagged something wrong while offline; the merge fixes it.
  const wronglyFlagged = [ev('q9', 1, true, { repeat: true })];
  const fixed = mergeResults(wronglyFlagged, []);
  assert(
    fixed[0].repeat === undefined,
    'a stale `repeat` flag is cleared when the merged history says it was first',
  );

  // Different sources are counted separately (that is the local rule too).
  const twoSources = mergeResults([ev('q1', 1)], [{ ...ev('q1', 2), source: 'quiz' }]);
  assert(
    twoSources.every((e) => !e.repeat),
    'the same question in a different source is a fresh measurement, not a replay',
  );

  // AI-generated questions have no id and can never be replays.
  const noId = mergeResults([{ ...ev('x', 1), questionId: undefined }], []);
  assert(noId.length === 1 && noId[0].repeat === undefined, 'an event with no questionId is never flagged');
}

// ============================================================
section('Answer log — diagnostic fields survive');
// ============================================================

{
  // Regression guard: a merge that rebuilt events field-by-field would strip
  // these and blind lib/cognition on every student who ever syncs.
  const rich = ev('q1', 1, false, { kind: 'mcq', chosenIndex: 2, optionCount: 4, selfReported: false, hintUsed: true, difficulty: 'mid', subTopicId: 'polar-de-moivre' });
  const merged = mergeResults([rich], []);
  for (const field of ['kind', 'chosenIndex', 'optionCount', 'selfReported', 'hintUsed', 'difficulty', 'subTopicId']) {
    assert(merged[0][field] === rich[field], `\`${field}\` survives the merge`);
  }

  // Same event seen by an old build and a new one: keep the informative copy.
  const poor = ev('q1', 1, false);
  assert(
    (mergeResults([poor], [rich])[0] as Record<string, unknown>).chosenIndex === 2 &&
      (mergeResults([rich], [poor])[0] as Record<string, unknown>).chosenIndex === 2,
    'the richer copy of the same event wins, from either side',
  );
}

// ============================================================
section('Answer log — cap');
// ============================================================

{
  const many = Array.from({ length: MAX_EVENTS }, (_, i) => ev(`a${i}`, i));
  const more = Array.from({ length: 200 }, (_, i) => ev(`b${i}`, MAX_EVENTS + i));
  const merged = mergeResults(many, more);
  assert(merged.length === MAX_EVENTS, `capped at MAX_EVENTS (${merged.length})`);
  assert(
    merged[merged.length - 1].questionId === 'b199',
    'the cap keeps the NEWEST events, not the first ones it happened to see',
  );
  assert(merged[0].ts < merged[merged.length - 1].ts, 'still ordered oldest-first after capping');
}

// ============================================================
section('The derived "already counted" set');
// ============================================================

{
  const merged = mergeResults([ev('q1', 1), ev('q2', 2)], [ev('q1', 3)]);
  const seen = rebuildSeen(merged);
  assert(same(seen.sort(), ['drill:q1', 'drill:q2']), 'the seen set is rebuilt from the merged log, deduped');
  assert(
    rebuildSeen(mergeResults(merged, merged)).length === seen.length,
    'rebuilding after a repeat sync is stable',
  );
}

// ============================================================
section('Roadmap progress — max-wins (unchanged behaviour)');
// ============================================================

{
  const a = { 'אלגברה::quad': { levels: { easy: { cleared: true, stars: 2, attempts: 3 } } } };
  const b = { 'אלגברה::quad': { levels: { easy: { cleared: false, stars: 3, attempts: 1 } } } };
  const m = mergeRoadmap(a, b) as Record<string, { levels: Record<string, { cleared: boolean; stars: number; attempts: number }> }>;
  assert(m['אלגברה::quad'].levels.easy.cleared === true, 'cleared never regresses');
  assert(m['אלגברה::quad'].levels.easy.stars === 3, 'best stars win');
  assert(m['אלגברה::quad'].levels.easy.attempts === 3, 'attempts take the max');
  assert(same(mergeRoadmap(a, b), mergeRoadmap(b, a)), 'roadmap merge is order-independent too');
}

// ============================================================
section('weeklyDelta — "did I actually improve?"');
// ============================================================
{
  const DAY = 24 * 60 * 60 * 1000;
  const NOW = 1_700_000_000_000;
  const ev = (daysAgo: number, correct: boolean, repeat = false) => ({
    ts: NOW - daysAgo * DAY,
    subject: 'math5',
    topic: 'אלגברה',
    source: 'drill' as const,
    correct,
    ...(repeat ? { repeat: true } : {}),
  });
  const put = (list: unknown[]) => store.set('bagrut-results-v1', JSON.stringify(list));

  // Thin data must NOT produce a number — this is the whole reason for the gate.
  put([...Array(4)].map(() => ev(1, true)));
  assert(weeklyDelta('math5', NOW).enough === false, 'four answers is not enough to claim a weekly change');

  // 10 this week at 80%, 10 last week at 40% → +40 points.
  put([
    ...[...Array(8)].map(() => ev(2, true)),
    ...[...Array(2)].map(() => ev(2, false)),
    ...[...Array(4)].map(() => ev(9, true)),
    ...[...Array(6)].map(() => ev(9, false)),
  ]);
  const w = weeklyDelta('math5', NOW);
  assert(w.enough === true, `both windows cleared MIN_PER_WEEK_WINDOW (${MIN_PER_WEEK_WINDOW})`);
  assert(w.thisWeek.attempts === 10 && w.lastWeek.attempts === 10, 'answers land in the right window');
  assert(w.deltaPoints === 40, `80% vs 40% is +40 points (got ${w.deltaPoints})`);

  // A repair session is replays; it must not manufacture a weekly gain.
  put([
    ...[...Array(4)].map(() => ev(2, true)),
    ...[...Array(6)].map(() => ev(2, false)),
    ...[...Array(4)].map(() => ev(9, true)),
    ...[...Array(6)].map(() => ev(9, false)),
    ...[...Array(20)].map(() => ev(1, true, true)),
  ]);
  const w2 = weeklyDelta('math5', NOW);
  assert(w2.deltaPoints === 0, `20 correct replays move the weekly delta by 0 (got ${w2.deltaPoints})`);
  assert(w2.thisWeek.attempts === 10, 'replays are excluded from the window counts too');

  // Events older than 14 days belong to neither window.
  put([...[...Array(12)].map(() => ev(30, true)), ...[...Array(12)].map(() => ev(2, true))]);
  assert(weeklyDelta('math5', NOW).enough === false, 'a month-old burst does not fill last week');
  store.delete('bagrut-results-v1');
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
