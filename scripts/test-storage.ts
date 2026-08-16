/**
 * test-storage.ts — the quota-failure contract.
 *
 *   npx tsx scripts/test-storage.ts
 *
 * WHY THIS EXISTS
 * Every store in lib/ swallowed a failed localStorage write. The score on
 * screen still updated and the answer was gone — the streak stopped, the chart
 * flatlined, the roadmap forgot cleared rungs, and nothing anywhere said so.
 *
 * Two properties are worth pinning, because both are easy to undo by accident:
 *   1. a dropped write must NOT raise `bagrut-state-dirty`. The sync layer
 *      treats that flag as "there is something newer here" — raising it over a
 *      write that never landed pushes the OLD state to the server as current,
 *      turning a local loss into a synced one.
 *   2. the "out of space" notice fires ONCE. A student who is out of space is
 *      out of space for every later write, and ten toasts say nothing the first
 *      one didn't.
 */

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

// ---- a localStorage that can be told to run out of room --------------------
const store = new Map<string, string>();
let full = false;
const events: string[] = [];

(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      if (full) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      store.set(k, v);
    },
    removeItem: (k: string) => void store.delete(k),
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  dispatchEvent: (e: { type: string }) => {
    events.push(e.type);
    return true;
  },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;
(globalThis as unknown as { Event: unknown }).Event = class {
  constructor(public type: string) {}
};

const warn = console.warn;
console.warn = () => {}; // the helper logs every failure; keep the output readable

// Imported AFTER the globals above on purpose: tsx compiles these to require()
// calls in source order, so the fake localStorage is in place before either
// module is evaluated. Same pattern as scripts/test-ladder-unlock.ts.
import { safeSet, safeSetJSON, STORAGE_FULL_EVENT } from '../lib/storage';
import { recordResult, getResults } from '../lib/results';

// ============================================================
console.log('\n── a write that lands ────────────────────────────────────────');
assert(safeSet('k', 'v') === true, 'safeSet reports success');
assert(store.get('k') === 'v', 'and the value is actually there');
assert(safeSetJSON('j', { a: 1 }) === true, 'safeSetJSON reports success');
assert(store.get('j') === '{"a":1}', 'and encodes the value');

console.log('\n── a write that is dropped ───────────────────────────────────');
full = true;
events.length = 0;
assert(safeSet('k2', 'v2') === false, 'safeSet reports failure instead of throwing');
assert(store.has('k2') === false, 'and nothing was written');
assert(events.includes(STORAGE_FULL_EVENT), 'the student is told once');

const firstCount = events.filter((e) => e === STORAGE_FULL_EVENT).length;
safeSet('k3', 'v3');
safeSet('k4', 'v4');
const laterCount = events.filter((e) => e === STORAGE_FULL_EVENT).length;
assert(firstCount === 1 && laterCount === 1, 'and only once, however many writes fail after');

console.log('\n── the flag that must not be raised ──────────────────────────');
events.length = 0;
recordResult({ subject: 'math5', topic: 'אלגברה', questionId: 'q1', source: 'quiz', correct: true });
assert(
  !events.includes('bagrut-state-dirty'),
  'a dropped answer does NOT mark the state dirty (it would push stale data up)',
);
assert(getResults().length === 0, 'and the answer is genuinely not in the log');

console.log('\n── and when there is room again ──────────────────────────────');
full = false;
events.length = 0;
recordResult({ subject: 'math5', topic: 'אלגברה', questionId: 'q2', source: 'quiz', correct: true });
assert(getResults().length === 1, 'the answer is recorded');
assert(events.includes('bagrut-state-dirty'), 'and NOW the state is marked dirty');

console.warn = warn;

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
