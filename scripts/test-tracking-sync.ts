/**
 * test-tracking-sync.ts — a surface that records a MISTAKE must record a RESULT.
 *
 *   npx tsx scripts/test-tracking-sync.ts
 *
 * FREE. Pure functions plus two source reads.
 *
 * ============================================================
 * WHAT IS ACTUALLY BEING GUARDED
 * ============================================================
 * `recordResult` in lib/results.ts is the hub write. The fan-out at the bottom
 * of it — `gradeReview` on a review answer, `seedFromMiss` on any other miss —
 * is the ONLY thing that puts a wrong answer into the spaced-review queue, and
 * the event it logs is the only thing lib/cognition and lib/remediation read.
 *
 * SolutionAudit and ThinkingPractice each recorded a mistake and stopped there.
 * A wrong answer on either surface landed in the error notebook and reached
 * nothing else — and, less visibly, counted for nothing at all: no streak, no
 * daily goal, no 14-day chart, because every one of those reads the answer log.
 *
 * Two halves, because only one of them can be behavioural:
 *
 *   1. BEHAVIOUR — `recordResult` really does log a 'scan'/'thinking' answer as
 *      activity while keeping it out of the accuracy aggregations. Run against
 *      the real module over a fake localStorage, with a 'quiz' CONTROL so a
 *      test that has stopped distinguishing the two cannot pass silently.
 *
 *   2. SOURCE SHAPE — that the two components still make both calls. This one
 *      asserts on TEXT, deliberately: both are React client components whose
 *      wrong-answer branch only runs after a `fetch` to a Pro-gated AI route
 *      resolves, so exercising it for real would mean a DOM, a renderer and a
 *      mocked paid endpoint to observe two localStorage writes. The check is
 *      structural rather than a bare grep — it brace-matches the handler and
 *      requires both identifiers INSIDE it, so moving `recordResult` out to
 *      some unreached branch fails just as removing it does.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

// ---- a localStorage for lib/results ----------------------------------------
// Imported-after-globals for the same reason scripts/test-storage.ts is: tsx
// evaluates these in source order, so the fake store must exist first.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;
(globalThis as unknown as { Event: unknown }).Event = class { constructor(public type: string) {} };

import { recordResult, getResults, topicStats, todayCount } from '../lib/results';

const TOPIC = 'אלגברה';

// ============================================================
console.log('\n=== the log counts a scan / thinking answer as activity ===\n');

// CONTROL first: a quiz miss is a MEASUREMENT, and every assertion below is
// only meaningful because this one moves the accuracy numbers.
recordResult({ subject: 'math5', topic: TOPIC, questionId: 'q1', source: 'quiz', correct: false });
ok(topicStats('math5')[0]?.attempts === 1, 'control: a quiz answer is measured');
const measuredBefore = topicStats('math5')[0]?.attempts ?? 0;
const activityBefore = todayCount('math5');

recordResult({ subject: 'math5', topic: TOPIC, source: 'scan', correct: false });
recordResult({ subject: 'math5', topic: TOPIC, source: 'thinking', correct: true });

const log = getResults('math5');
ok(log.length === 3, `all three answers are in the log (got ${log.length})`);
ok(log.some((e) => e.source === 'scan'), "the scan answer is logged with source 'scan'");
ok(log.some((e) => e.source === 'thinking'), "the thinking answer is logged with source 'thinking'");
ok(todayCount('math5') === activityBefore + 2, 'both count as activity — streak, daily goal, chart');

console.log('\n=== but neither is allowed to move the predicted grade ===\n');
// No stable questionId exists on either surface, so the `${source}:${questionId}`
// replay guard can never fire for them: without this, re-scanning one page would
// log an unlimited number of fresh "first attempts".
ok(
  log.filter((e) => e.source === 'scan' || e.source === 'thinking').every((e) => e.repeat === true),
  'both are flagged as replays (NEVER_MEASURED)',
);
ok(
  (topicStats('math5')[0]?.attempts ?? 0) === measuredBefore,
  'and the accuracy aggregation is unchanged by them',
);

// ============================================================
// SOURCE SHAPE — see the header: behavioural is not available here.
// ============================================================
console.log('\n=== every surface that records a mistake records a result ===\n');

/** The body of `function <name>(` … matched by brace depth. Safe on these two
 *  files because neither handler contains an unbalanced brace inside a string. */
function functionBody(src: string, name: string): string | null {
  const at = src.indexOf(`function ${name}(`);
  if (at < 0) return null;
  const open = src.indexOf('{', src.indexOf(')', at));
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1);
  }
  return null;
}

for (const [file, handler, source] of [
  ['components/practice/SolutionAudit.tsx', 'analyze', 'scan'],
  ['components/thinking/ThinkingPractice.tsx', 'evaluate', 'thinking'],
] as const) {
  const src = readFileSync(resolve(process.cwd(), file), 'utf8');
  ok(/import \{ recordResult \} from '@\/lib\/results'/.test(src), `${file}: imports recordResult`);

  const body = functionBody(src, handler);
  ok(body !== null, `${file}: found the ${handler}() handler`);
  if (!body) continue;

  ok(body.includes('recordMistake('), `${file}: ${handler}() still records the mistake`);
  ok(body.includes('recordResult('), `${file}: ${handler}() ALSO records the result`);
  ok(
    // No 's' flag: `[^)]*` already crosses newlines by itself, and the flag
    // needs an es2018 target this project does not set (TS1501).
    new RegExp(`recordResult\\([^)]*source: '${source}'`).test(body),
    `${file}: and does it with source: '${source}'`,
  );
  // …and does NOT invent an id to get past the three downstream gates
  // (review.seedFromMiss, cognition.toObservations, remediation.subTopicStatsFrom).
  // Both resolve ids against the authored corpus, so a synthetic one buys no
  // observation and seeds a review card the student can never be served — it is
  // pruned by `pruneUnresolvable` on the next visit. See NEVER_MEASURED.
  ok(
    !/recordResult\([^)]*(questionId|subTopicId):/.test(body),
    `${file}: and invents no questionId/subTopicId for it`,
  );
}

console.log(
  failed === 0
    ? '\nOK tracking sync: no surface records a mistake without a result\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
