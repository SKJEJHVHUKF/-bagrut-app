/**
 * test-remediation.ts — unit + replay tests for the auto-correction loop.
 *
 *   npx tsx scripts/test-remediation.ts
 *
 * Fixed clock, synthetic answer logs, real content. Nothing here mocks the
 * question banks: every path is built from the actual authored sub-topics, so a
 * renamed id or an emptied bank fails a test instead of failing a student.
 *
 * The sections that matter most are the last two. The state machine is where a
 * repair loop can go wrong in ways that are invisible in review — a session that
 * never terminates, a "healed" verdict from one lucky answer, a re-teach that
 * fires twice — so every archetype student is walked to completion under a hard
 * iteration cap, and the cap itself is an assertion.
 */

// --- minimal localStorage + window shim (store.ts and the browser wrappers
//     read it lazily; the pure modules never do) ---
const mem = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  },
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;
(globalThis as unknown as { Event: unknown }).Event = class {
  constructor(public type: string) {}
};

import { complexNumbersCognition as CATALOG } from '../content/cognition/math5/complex-numbers';
import { getSubTopic } from '../content/lessons';
import {
  detectWeaknesses,
  HEAL_SUPPRESSION_DAYS,
  MIN_ATTEMPTS,
  misconceptionTargetId,
  subTopicTargetId,
  type DetectInput,
} from '../lib/remediation/detect';
import {
  buildFixPath,
  decideNext,
  dismissReteach,
  MAX_MISSES,
  MAX_STEPS,
  MIN_ANSWERED_TO_HEAL,
  MIN_STEPS,
  recordFixAnswer,
  startProgress,
  summarise,
} from '../lib/remediation/path';
import { buildSupply, resolveFixQuestion } from '../lib/remediation/supply';
import {
  clearFixStore,
  getActiveFix,
  getHealedMap,
  healedHistory,
  markHealed,
  setActiveFix,
} from '../lib/remediation/store';
import { rankOf, type FixPath, type FixProgress, type Weakness } from '../lib/remediation/types';
import type { ResultEvent } from '../lib/results';
import type { MistakeRecord } from '../lib/mistakes';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;
const NOW = T0 + 10 * DAY;
const SUBJECT = 'math5';

const COARSE_TOPIC = 'אלגברה';
const COARSE_SUB = 'quadratic-equations';
const SHARP_TOPIC = 'מספרים מרוכבים';

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

// ============================================================
// Fixtures built from the REAL content
// ============================================================

const coarseSub = getSubTopic(SUBJECT, COARSE_TOPIC, COARSE_SUB);
if (!coarseSub) {
  console.log(`FATAL: fixture sub-topic ${COARSE_SUB} not found in ${COARSE_TOPIC}`);
  process.exit(1);
}
const coarseQuestions = coarseSub.questions ?? [];

function ev(
  topic: string,
  subTopicId: string | undefined,
  questionId: string,
  correct: boolean,
  atDay: number,
  extra: Partial<ResultEvent> = {},
): ResultEvent {
  return {
    ts: T0 + atDay * DAY,
    subject: SUBJECT,
    topic,
    subTopicId,
    questionId,
    source: 'drill',
    difficulty: 'mid',
    correct,
    kind: 'mcq',
    optionCount: 4,
    ...extra,
  };
}

function input(events: ResultEvent[], mistakes: MistakeRecord[] = []): DetectInput {
  return { subject: SUBJECT, events, mistakes, now: NOW, healed: {} };
}

/** N answers in the coarse fixture sub-topic, `nCorrect` of them right. */
function coarseEvents(n: number, nCorrect: number): ResultEvent[] {
  const out: ResultEvent[] = [];
  for (let i = 0; i < n; i++) {
    const q = coarseQuestions[i % coarseQuestions.length];
    out.push(ev(COARSE_TOPIC, COARSE_SUB, q.id, i < nCorrect, 8 + i * 0.01));
  }
  return out;
}

// ============================================================
section('detection — the evidence floor');
// ============================================================
{
  assert(
    detectWeaknesses(input(coarseEvents(MIN_ATTEMPTS - 1, 0))).length === 0,
    `under ${MIN_ATTEMPTS} answers nothing is called a weakness (never "you are weak" from "we did not measure")`,
  );

  const ws = detectWeaknesses(input(coarseEvents(4, 1)));
  const w = ws.find((x) => x.id === subTopicTargetId(COARSE_SUB));
  assert(!!w, 'a sub-topic answered 4× with 1 correct is detected');
  assert(w?.kind === 'subtopic', 'it is reported at the coarse resolution (no catalog for אלגברה)');
  assert(w?.topic === COARSE_TOPIC && w?.subTopicId === COARSE_SUB, 'it carries subject/topic/sub-topic');
  assert((w?.detail ?? '').includes('3 מתוך 4'), `the detail states the real numbers — got "${w?.detail}"`);
  assert((w?.confidence ?? 0) >= 0.5, 'confidence clears the floor at 4 answers');

  assert(
    detectWeaknesses(input(coarseEvents(6, 6))).length === 0,
    'a sub-topic answered correctly is not a weakness',
  );
  assert(
    detectWeaknesses(input(coarseEvents(10, 8))).length === 0,
    '80% accuracy is above the failing threshold',
  );
}

// ============================================================
section('detection — replays, healing and determinism');
// ============================================================
{
  const replays = coarseEvents(6, 0).map((e) => ({ ...e, repeat: true }));
  assert(
    detectWeaknesses(input(replays)).length === 0,
    'replayed answers are not measurements — six wrong replays raise no weakness',
  );

  const evs = coarseEvents(4, 1);
  const target = subTopicTargetId(COARSE_SUB);
  const justHealed = detectWeaknesses({ ...input(evs), healed: { [target]: NOW - DAY } });
  assert(
    !justHealed.some((w) => w.id === target),
    'a weakness repaired yesterday is not recommended again',
  );
  const longHealed = detectWeaknesses({
    ...input(evs),
    healed: { [target]: NOW - (HEAL_SUPPRESSION_DAYS + 1) * DAY },
  });
  assert(
    longHealed.some((w) => w.id === target),
    `the suppression expires after ${HEAL_SUPPRESSION_DAYS} days`,
  );

  const a = detectWeaknesses(input(coarseEvents(8, 2))).map((w) => w.id).join('|');
  const b = detectWeaknesses(input(coarseEvents(8, 2))).map((w) => w.id).join('|');
  assert(a === b && a.length > 0, 'the ranking is deterministic — same state, same order');
}

// ============================================================
section('detection — the sharp resolution (cognition catalog)');
// ============================================================
{
  // Pick a misconception with triggers on at least two different questions so
  // the student can meet it repeatedly, the way the real bank serves them.
  const mc = CATALOG.misconceptions.find((m) => new Set(m.triggers.map((t) => t.questionId)).size >= 2);
  assert(!!mc, 'the complex-numbers catalog has a misconception with ≥2 distinct trigger questions');

  if (mc) {
    const seen = new Set<string>();
    const events: ResultEvent[] = [];
    let day = 8;
    for (const t of mc.triggers) {
      if (seen.has(t.questionId)) continue;
      seen.add(t.questionId);
      // Chose exactly the option the author labelled as this wrong idea.
      events.push(
        ev(SHARP_TOPIC, undefined, t.questionId, false, day, { chosenIndex: t.optionIndex }),
      );
      day += 0.01;
    }

    const ws = detectWeaknesses(input(events));
    const sharp = ws.find((w) => w.id === misconceptionTargetId(mc.id));
    assert(!!sharp, `the named misconception "${mc.title}" is detected from its own triggers`);
    assert(sharp?.kind === 'misconception', 'it is reported at the sharp resolution');
    assert(
      sharp?.subTopicId === mc.remedy.subTopicId,
      'the repair points at the catalog remedy sub-topic',
    );
    assert(
      !ws.some((w) => w.kind === 'subtopic' && w.subTopicId === sharp?.subTopicId),
      'the same sub-topic is NOT also reported coarsely — one finding, not two',
    );
  }
}

// ============================================================
section('supply');
// ============================================================
{
  const w = detectWeaknesses(input(coarseEvents(4, 1)))[0]!;
  const supply = buildSupply(w);
  assert(supply.length >= MIN_STEPS, `supply for ${COARSE_SUB} has at least ${MIN_STEPS} questions`);

  const ranks = supply.map((s) => rankOf(s.difficulty));
  assert(
    ranks.every((r, i) => i === 0 || ranks[i - 1] <= r),
    'supply is ordered easiest-first',
  );

  const ids = supply.map((s) => s.question.id);
  assert(new Set(ids).size === ids.length, 'no question appears twice in the supply');

  const firstEasyOrigins = supply.filter((s) => s.difficulty === 'easy').map((s) => s.origin);
  assert(
    firstEasyOrigins[0] === 'subtopic-bank',
    'the sub-topic bank outranks the concept bank at the same difficulty',
  );

  const trigger = coarseQuestions[0].id;
  const pushed = buildSupply(w, { deprioritise: new Set([trigger]) });
  assert(
    pushed[pushed.length - 1].question.id === trigger,
    'the question that triggered the fix is pushed to the very back',
  );
}

// ============================================================
section('path building');
// ============================================================
{
  const w = detectWeaknesses(input(coarseEvents(4, 1)))[0]!;
  const path = buildFixPath(w, buildSupply(w), NOW);
  assert(!!path, 'a path is built for a real weakness');

  if (path) {
    assert(
      path.steps.length >= MIN_STEPS && path.steps.length <= MAX_STEPS,
      `the path has ${MIN_STEPS}-${MAX_STEPS} steps (got ${path.steps.length})`,
    );
    const stepRanks = path.steps.map((s) => rankOf(s.difficulty));
    assert(
      stepRanks.every((r, i) => i === 0 || stepRanks[i - 1] <= r),
      'steps are stored easiest-first',
    );
    assert(
      new Set(path.steps.map((s) => s.questionId)).size === path.steps.length,
      'no question is repeated inside one path',
    );
    assert(
      stepRanks[0] <= rankOf(path.band),
      'the ladder starts at or below the band the student broke at',
    );
    assert(
      path.steps.every((s) => resolveFixQuestion(path, s) !== null),
      'EVERY stored step resolves back to a real question (id + origin round-trip)',
    );
  }

  // A weakness whose banks cannot produce a ladder must produce nothing.
  const starved: Weakness = { ...w, subTopicId: 'no-such-sub-topic', topic: 'לא-נושא' };
  assert(
    buildFixPath(starved, buildSupply(starved), NOW) === null,
    'an empty supply yields null, not a two-question stub dressed as a repair',
  );
}

// ============================================================
section('state machine');
// ============================================================

/** Build the standard fixture path used by the walk tests. */
function fixture(): FixPath {
  const w = detectWeaknesses(input(coarseEvents(4, 1)))[0]!;
  const path = buildFixPath(w, buildSupply(w), NOW);
  if (!path) {
    console.log('FATAL: fixture path could not be built');
    process.exit(1);
  }
  return path;
}

{
  const path = fixture();
  let p = startProgress(path.targetId, NOW);

  const first = decideNext(path, p);
  assert(first.kind === 'question', 'the session opens on a question');
  if (first.kind === 'question') {
    assert(
      rankOf(first.step.difficulty) <= rankOf(path.band),
      'the first question is at or below the band — a repair starts with something completable',
    );
    assert(first.position === 1 && first.total === path.steps.length, 'position/total are 1-based and honest');
  }

  // Two consecutive correct, the second at or above the band → healed.
  let guard = 0;
  while (p.status === 'active' && guard++ < 20) {
    const d = decideNext(path, p);
    if (d.kind !== 'question') break;
    p = recordFixAnswer(path, p, d.step.questionId, true, NOW + guard * 1000);
  }
  assert(guard < 20, 'an all-correct walk terminates');
  assert(p.status === 'healed', 'a clean run closes the weakness');
  assert(
    p.answered.length >= MIN_ANSWERED_TO_HEAL,
    `a repair is never claimed on fewer than ${MIN_ANSWERED_TO_HEAL} questions (got ${p.answered.length})`,
  );
  const walked = p.answered.map((a) => a.rank);
  assert(
    walked.every((r, i) => i === 0 || walked[i - 1] <= r) && walked[walked.length - 1] >= rankOf(path.band),
    `the clean run escalates and finishes at/above the band (ranks ${walked.join('→')}, band ${path.band})`,
  );
  assert(summarise(p).healed && summarise(p).correct === p.answered.length, 'the summary agrees');

  const frozen = recordFixAnswer(path, p, path.steps[path.steps.length - 1].questionId, false, NOW);
  assert(frozen === p, 'answers after healing are ignored — a closed session cannot re-open');
}

{
  const path = fixture();
  let p = startProgress(path.targetId, NOW);

  // One correct, then wrong, then correct: the streak was broken, so not healed.
  const d1 = decideNext(path, p);
  if (d1.kind === 'question') p = recordFixAnswer(path, p, d1.step.questionId, true, NOW + 1);
  const d2 = decideNext(path, p);
  if (d2.kind === 'question') p = recordFixAnswer(path, p, d2.step.questionId, false, NOW + 2);
  const d3 = decideNext(path, p);
  if (d3.kind === 'question') p = recordFixAnswer(path, p, d3.step.questionId, true, NOW + 3);
  assert(p.status === 'active', 'correct → wrong → correct is not a repair (the streak reset)');
  assert(p.misses === 1, 'exactly one miss was counted');
}

{
  const path = fixture();
  let p = startProgress(path.targetId, NOW);

  // Miss twice → the re-teach card, then the EASIEST remaining question.
  const a = decideNext(path, p);
  if (a.kind === 'question') p = recordFixAnswer(path, p, a.step.questionId, false, NOW + 1);
  assert(decideNext(path, p).kind === 'question', 'one miss does not interrupt the ladder');

  const b = decideNext(path, p);
  if (b.kind === 'question') p = recordFixAnswer(path, p, b.step.questionId, false, NOW + 2);

  const c = decideNext(path, p);
  assert(c.kind === 'reteach', 'the second miss opens the re-teach card');

  const answeredIds = new Set(p.answered.map((x) => x.questionId));
  const remaining = path.steps.filter((s) => !answeredIds.has(s.questionId));
  const easiestRank = Math.min(...remaining.map((s) => rankOf(s.difficulty)));
  if (c.kind === 'reteach') {
    assert(
      rankOf(c.step.difficulty) === easiestRank,
      'the question behind the re-teach is the EASIEST remaining, not the next rung',
    );
  }

  p = dismissReteach(p, NOW + 3);
  const d = decideNext(path, p);
  assert(d.kind === 'question', 'after reading the card the same question is served');
  assert(
    d.kind === 'question' && c.kind === 'reteach' && d.step.questionId === c.step.questionId,
    'the re-teach and the relief question are about the same item',
  );

  p = dismissReteach(p, NOW + 4);
  assert(decideNext(path, p).kind === 'question', 'the re-teach card never fires twice');
}

{
  const path = fixture();
  let p = startProgress(path.targetId, NOW);
  let guard = 0;
  while (p.status === 'active' && guard++ < 30) {
    const d = decideNext(path, p);
    if (d.kind === 'reteach') {
      p = dismissReteach(p, NOW + guard * 1000);
      continue;
    }
    if (d.kind !== 'question') break;
    p = recordFixAnswer(path, p, d.step.questionId, false, NOW + guard * 1000);
  }
  assert(guard < 30, 'an all-wrong walk terminates — there is no infinite loop');
  assert(p.status === 'paused', 'a student who keeps missing is stopped, not ground down');
  assert(p.misses === MAX_MISSES, `it stops at exactly ${MAX_MISSES} misses`);
  assert(p.pauseReason === 'too-many-misses', 'the pause names its reason');
  assert(
    p.answered.length <= path.steps.length,
    'no question is served more than once across the whole session',
  );
}

{
  // Exhausting the path without repairing ends in out-of-supply, not silence.
  const path = fixture();
  let p = startProgress(path.targetId, NOW);
  // Alternate wrong/right so the miss cap is never reached but the streak never
  // completes at the band either.
  let i = 0;
  let guard = 0;
  while (p.status === 'active' && guard++ < 30) {
    const d = decideNext(path, p);
    if (d.kind === 'reteach') {
      p = dismissReteach(p, NOW + guard * 1000);
      continue;
    }
    if (d.kind !== 'question') break;
    const correct = i % 2 === 1;
    i++;
    p = recordFixAnswer(path, p, d.step.questionId, correct, NOW + guard * 1000);
  }
  assert(guard < 30, 'the alternating walk terminates');
  assert(
    p.status === 'healed' || p.pauseReason === 'out-of-supply' || p.pauseReason === 'too-many-misses',
    `an exhausted path always reaches a terminal state (got ${p.status}/${p.pauseReason})`,
  );
  const served = p.answered.map((x) => x.questionId);
  assert(new Set(served).size === served.length, 'decideNext never re-serves an answered question');
}

{
  const path = fixture();
  const p = startProgress(path.targetId, NOW);
  const one = decideNext(path, p);
  const two = decideNext(path, p);
  assert(
    one.kind === two.kind &&
      (one.kind !== 'question' || (two.kind === 'question' && one.step.questionId === two.step.questionId)),
    'decideNext is pure — the same state always yields the same question',
  );
}

// ============================================================
section('store');
// ============================================================
{
  clearFixStore();
  const path = fixture();
  const p: FixProgress = startProgress(path.targetId, NOW);
  setActiveFix(path, p);
  const back = getActiveFix(NOW);
  assert(back?.path.targetId === path.targetId, 'the active session round-trips through localStorage');
  assert(back?.path.steps.length === path.steps.length, 'the stored path keeps its steps');

  assert(getActiveFix(NOW + 5 * DAY) === null, 'a session untouched for days is dropped, not resumed');

  clearFixStore();
  setActiveFix(path, p);
  markHealed({
    targetId: path.targetId,
    title: path.title,
    subject: path.subject,
    topic: path.topic,
    healedAt: NOW,
    answered: 3,
  });
  assert(getActiveFix(NOW) === null, 'closing a weakness ends the session');
  assert(getHealedMap()[path.targetId] === NOW, 'the repair is recorded for suppression');
  assert(healedHistory()[0]?.targetId === path.targetId, 'the repair shows in the history');
  clearFixStore();
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
