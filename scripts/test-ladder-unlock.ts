/**
 * test-ladder-unlock.ts — the ladder's unlock rule.
 *
 *   npx tsx scripts/test-ladder-unlock.ts
 *
 * WHY THIS EXISTS
 * Inserting the 🧠 rung between 🔥 אתגר and 🎓 בגרות shifted bagrut down one
 * position, and the plain "previous rung must be cleared" rule re-locked it
 * for every student who was already inside it. That reached production before
 * it was caught by eye. The rule it violated is one lib/roadmap-progress states
 * in its own header — "returning students are never re-locked" — so it is
 * pinned here rather than left to the next person inserting a rung.
 */

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;
(globalThis as unknown as { Event: unknown }).Event = class {
  constructor(public type: string) {}
};

import { levelStatus } from '../lib/roadmap-progress';
import type { RoadmapLevel, RoadmapLevelKind } from '../lib/roadmap-levels';

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

const TOPIC = 'מספרים מרוכבים';
const SUB = 'complex-roots';

const ladder = (kinds: RoadmapLevelKind[]): RoadmapLevel[] =>
  kinds.map((kind, index) => ({
    kind,
    index,
    title: kind,
    subtitle: '',
    emoji: '',
    xp: 0,
    questions: [],
    bagrut: [],
    ghost: [],
  }));

type Rec = { cleared?: boolean; stars?: number; attempts?: number };
function seed(levels: Record<string, Rec>) {
  store.clear();
  store.set(
    'bagrut-roadmap-v1',
    JSON.stringify({ [`${TOPIC}::${SUB}`]: { levels } }),
  );
}
const cleared = (): Rec => ({ cleared: true, stars: 2, attempts: 1 });
const played = (): Rec => ({ cleared: false, stars: 0, attempts: 1 });

const BEFORE = ladder(['learn', 'easy', 'mid', 'hard', 'bagrut']);
const AFTER = ladder(['learn', 'easy', 'mid', 'hard', 'ghost', 'bagrut']);
const at = (levels: RoadmapLevel[], kind: RoadmapLevelKind) =>
  levelStatus(TOPIC, SUB, levels.find((l) => l.kind === kind)!, levels);

// ============================================================
section('The regression that shipped');
// ============================================================

{
  // Exactly the owner's state: everything through אתגר cleared, and בגרות
  // already attempted but not passed ("כמעט! נסה שוב").
  seed({ learn: cleared(), easy: cleared(), mid: cleared(), hard: cleared(), bagrut: played() });

  assert(at(BEFORE, 'bagrut') === 'UNLOCKED', 'before the insertion, bagrut was open');
  assert(
    at(AFTER, 'bagrut') === 'UNLOCKED',
    'after a rung is inserted above it, bagrut STAYS open — progress never regresses',
  );
  assert(at(AFTER, 'ghost') === 'UNLOCKED', 'the new rung itself is open, since hard is cleared');
}

// ============================================================
section('A student who had already finished the rung');
// ============================================================

{
  seed({ learn: cleared(), easy: cleared(), mid: cleared(), hard: cleared(), bagrut: cleared() });
  assert(at(AFTER, 'bagrut') === 'COMPLETED', 'a cleared rung stays completed');
  assert(
    at(AFTER, 'ghost') === 'UNLOCKED',
    'and the inserted rung is reachable rather than stranded behind it',
  );
}

// ============================================================
section('The gate still holds for everyone else');
// ============================================================

{
  // A student who never got past חימום must not be handed the later rungs.
  seed({ learn: cleared(), easy: played() });
  assert(at(AFTER, 'easy') === 'UNLOCKED', 'the rung being played is open');
  assert(at(AFTER, 'mid') === 'LOCKED', 'the next rung is still locked');
  assert(at(AFTER, 'ghost') === 'LOCKED', 'and so is the new one');
  assert(at(AFTER, 'bagrut') === 'LOCKED', 'and so is bagrut');

  // A brand-new student.
  store.clear();
  assert(at(AFTER, 'learn') === 'UNLOCKED', 'a new student starts with the first rung open');
  assert(at(AFTER, 'easy') === 'LOCKED', 'and nothing else');
  assert(at(AFTER, 'bagrut') === 'LOCKED', 'least of all bagrut');
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
