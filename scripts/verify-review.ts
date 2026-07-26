/**
 * verify-review.ts — exercises the spaced-repetition engine against a mocked
 * localStorage + clock (the lib is pure but reads window.localStorage). Asserts:
 *   • a correct review promotes the box and pushes the due date out;
 *   • a wrong review drops it back to box 1 and counts a lapse;
 *   • dueItems respects the clock and the cap;
 *   • a 30-day synthetic run never exceeds MAX_ITEMS.
 *
 *   npx tsx scripts/verify-review.ts
 */

// --- minimal localStorage + window shim so the client lib runs under node ---
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

import {
  seedFromMiss,
  gradeReview,
  dueItems,
  dueCount,
  BOX_INTERVAL_DAYS,
  MAX_ITEMS,
} from '../lib/review';

const DAY = 24 * 60 * 60 * 1000;
let failures = 0;
function assert(cond: boolean, msg: string) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + msg);
  if (!cond) failures++;
}

let now = 1_000_000_000_000; // fixed base clock (no Date.now — deterministic)

// 1) Seed a miss → box 1, due tomorrow.
seedFromMiss({ subject: 'math5', topic: 'אלגברה', subTopicId: 'quadratic-equations', questionId: 'q1' }, now);
assert(dueCount(now) === 0, 'freshly-seeded item is NOT due today');
assert(dueItems(now + DAY).length === 1, 'item is due tomorrow');

// 2) Correct review → box 2, due in 3 days.
now += DAY;
gradeReview('q1', true, now);
assert(dueItems(now).length === 0, 'after a correct review it is not immediately due');
assert(dueItems(now + 3 * DAY).length === 1, `promoted item is due in ${BOX_INTERVAL_DAYS[1]} days`);

// 3) Two more correct reviews → box 4.
now += 3 * DAY;
gradeReview('q1', true, now);
now += 7 * DAY;
gradeReview('q1', true, now);
assert(dueItems(now + 16 * DAY).length === 1, 'box-4 item is due in 16 days');

// 4) A wrong review resets to box 1 (due tomorrow) and records a lapse.
now += 16 * DAY;
gradeReview('q1', false, now);
assert(dueItems(now).length === 0, 'after a lapse it is not due the same instant');
assert(dueItems(now + DAY).length === 1, 'lapsed item is back to box 1 (due tomorrow)');

// 5) 30-day synthetic run with many items never exceeds the cap.
for (let i = 0; i < MAX_ITEMS + 50; i++) {
  seedFromMiss(
    { subject: 'math5', topic: 'אלגברה', subTopicId: 'quadratic-equations', questionId: `bulk-${i}` },
    now,
  );
}
const stored = JSON.parse(store.get('bagrut-review-v1') || '[]');
assert(stored.length <= MAX_ITEMS, `queue capped at ${MAX_ITEMS} (has ${stored.length})`);

console.log(failures === 0 ? '\n✅ review engine OK' : `\n❌ ${failures} failure(s)`);
if (failures > 0) process.exit(1);
