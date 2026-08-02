/**
 * test-cognition.ts — unit + replay tests for the cognitive mapping layer.
 *
 *   npx tsx scripts/test-cognition.ts
 *
 * Everything here runs against a FIXED clock and a synthetic event log, never
 * Date.now() and never real progress — that is the whole reason the layer was
 * built as pure functions over the answer log.
 *
 * The last section is the one that actually matters. Three archetype students
 * are replayed through `buildCognitiveState`, the same entry point the app
 * calls, and the assertion is on the Hebrew sentence that comes out. A unit
 * test can tell you the arithmetic is monotone; only the replay can tell you
 * the product says the right thing about a student you designed.
 */

// --- minimal localStorage + window shim (the libs read it lazily, but
//     lib/cognition/index pulls in modules that expect `window` to exist) ---
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

import { buildCognitiveState } from '../lib/cognition';
import {
  bktUpdate, classify, decay, guessFor, traceSkill, MIN_CONFIDENCE, PRIOR_BY_BAND,
} from '../lib/cognition/trace';
import { scoreMisconceptions } from '../lib/cognition/misconceptions';
import { findWeakestLink } from '../lib/cognition/diagnose';
import { buildInsight, hePrefix } from '../lib/cognition/insight';
import { rankCandidates } from '../lib/cognition/next-step';
import { complexNumbersCognition as CATALOG } from '../content/cognition/math5/complex-numbers';
import { getQuestions, getSubTopics } from '../content/lessons';
import type { Observation } from '../lib/cognition/types';
import type { ResultEvent } from '../lib/results';
import type { Skill } from '../content/cognition/types';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000; // fixed base clock
const SUBJECT = 'math5';
const TOPIC = 'מספרים מרוכבים';

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
// Helpers
// ============================================================

function mcq(
  questionId: string,
  correct: boolean,
  chosenIndex: number,
  atDay: number,
  optionCount = 4,
): ResultEvent {
  return {
    ts: T0 + atDay * DAY,
    subject: SUBJECT,
    topic: TOPIC,
    questionId,
    source: 'drill',
    difficulty: 'mid',
    correct,
    kind: 'mcq',
    chosenIndex,
    optionCount,
  };
}

const skill = (over: Partial<Skill> = {}): Skill => ({
  id: 's',
  title: 'מיומנות',
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'polar-de-moivre',
  prereqs: [],
  band: 'mid',
  ...over,
});

const obs = (over: Partial<Observation> = {}): Observation => ({
  ts: T0,
  skillId: 's',
  correct: true,
  kind: 'mcq',
  optionCount: 4,
  source: 'drill',
  ...over,
});

/**
 * The real correct-option index of a bank question, read from the content.
 * Hard-coding 0 would happen to work today — the whole complex-numbers bank
 * authors `correct: 0` and relies on `seededOrder` to shuffle at render time —
 * but a replay that quietly stops matching the content is a test that stops
 * testing, so it is looked up.
 */
const CORRECT_INDEX = (() => {
  const index = new Map<string, number>();
  for (const st of getSubTopics(SUBJECT, TOPIC)) {
    for (const q of st.questions ?? []) if (q.correct != null) index.set(q.id, q.correct);
    for (const step of st.lesson ?? []) {
      if (step.drill?.correct != null) index.set(step.drill.id, step.drill.correct);
    }
  }
  for (const q of getQuestions(SUBJECT, TOPIC)) {
    if (q.correct != null && !index.has(q.id)) index.set(q.id, q.correct);
  }
  return index;
})();

function correctIndexOf(questionId: string): number {
  const i = CORRECT_INDEX.get(questionId);
  if (i === undefined) throw new Error(`replay references a question with no MCQ key: ${questionId}`);
  return i;
}

// ============================================================
section('BKT update');
// ============================================================

{
  const p0 = 0.25;
  const up = bktUpdate(p0, true, 0.25);
  const down = bktUpdate(p0, false, 0.25);
  assert(up > p0, `a correct answer raises p (${p0} → ${up.toFixed(3)})`);
  assert(down < p0, `a wrong answer lowers p (${p0} → ${down.toFixed(3)})`);
  assert(up > down, 'correct always ends above wrong');

  // Guessing: a 4-option MCQ is much weaker evidence than a typed answer.
  const mcqUp = bktUpdate(p0, true, 0.25);
  const openUp = bktUpdate(p0, true, 0.05);
  assert(
    openUp > mcqUp,
    `one correct open answer beats one correct MCQ (${openUp.toFixed(3)} > ${mcqUp.toFixed(3)})`,
  );

  // A replay is discounted through the guess parameter.
  assert(
    guessFor(obs({ isReplay: true })) >= 0.5,
    'a replay is treated as at least a coin-flip guess',
  );
  assert(guessFor(obs({ kind: 'open', source: 'drill' })) === 0.15, 'self-reported open guess = 0.15');
  assert(guessFor(obs({ optionCount: 5 })) === 0.2, 'guess tracks the real option count (1/5)');
}

// ============================================================
section('Hints, decay and confidence');
// ============================================================

{
  const s = skill({ band: 'mid' });
  const clean = traceSkill(s, [obs({ ts: T0 }), obs({ ts: T0 + DAY })], T0 + DAY);
  const hinted = traceSkill(
    s,
    [obs({ ts: T0, hintUsed: true }), obs({ ts: T0 + DAY, hintUsed: true })],
    T0 + DAY,
  );
  assert(
    hinted.p < clean.p,
    `right-with-a-hint counts for less than right alone (${hinted.p.toFixed(3)} < ${clean.p.toFixed(3)})`,
  );

  // One half-life closes half the distance back to the prior.
  const prior = PRIOR_BY_BAND.mid;
  const decayed = decay(0.9, prior, 21 * DAY);
  const expected = prior + (0.9 - prior) / 2;
  assert(
    Math.abs(decayed - expected) < 1e-9,
    `21 idle days move p half-way to the prior (${decayed.toFixed(4)} ≈ ${expected.toFixed(4)})`,
  );
  assert(decay(0.9, prior, 0) === 0.9, 'no elapsed time, no decay');

  // Idle time inside the history is modelled, not just idle time at the end.
  const gapped = traceSkill(s, [obs({ ts: T0 }), obs({ ts: T0 + 60 * DAY })], T0 + 60 * DAY);
  const dense = traceSkill(s, [obs({ ts: T0 }), obs({ ts: T0 + DAY })], T0 + DAY);
  assert(gapped.p < dense.p, 'a two-month gap mid-history costs mastery');

  // The honesty check: thin evidence must read as "unknown", never as "weak".
  const thin = traceSkill(s, [obs({ correct: false }), obs({ correct: false, ts: T0 + 1000 })], T0);
  assert(thin.state === 'unknown', `two answers is not a diagnosis (state = ${thin.state})`);
  assert(
    thin.confidence < MIN_CONFIDENCE,
    `2 observations stay under the confidence bar (${thin.confidence.toFixed(2)} < ${MIN_CONFIDENCE})`,
  );
  const three = traceSkill(
    s,
    [obs({ correct: false }), obs({ correct: false, ts: T0 + 1000 }), obs({ correct: false, ts: T0 + 2000 })],
    T0,
  );
  assert(three.state === 'fragile', `the third answer makes it a pattern (state = ${three.state})`);
  assert(classify(0.2, 0.9) === 'fragile', 'low p with real evidence = fragile');
  assert(classify(0.9, 0.9) === 'mastered', 'high p with real evidence = mastered');

  const untouched = traceSkill(s, [], T0);
  assert(
    untouched.state === 'unknown' && untouched.observations === 0,
    'a skill with no evidence is reported, at its prior, as unknown',
  );
}

// ============================================================
section('Misconception scoring');
// ============================================================

{
  const cat = CATALOG.misconceptions.slice(0, 1);
  const id = cat[0].id;

  const twoOfTwo = scoreMisconceptions(
    cat,
    [
      { misconceptionId: id, ts: T0, hit: true },
      { misconceptionId: id, ts: T0 + DAY, hit: true },
    ],
    T0 + DAY,
  )[0];
  const twoOfNine = scoreMisconceptions(
    cat,
    [
      { misconceptionId: id, ts: T0, hit: true },
      { misconceptionId: id, ts: T0 + DAY, hit: true },
      ...Array.from({ length: 7 }, (_, i) => ({
        misconceptionId: id,
        ts: T0 + (2 + i) * DAY,
        hit: false,
      })),
    ],
    T0 + 9 * DAY,
  )[0];

  assert(
    twoOfTwo.rate > twoOfNine.rate,
    `2 of 2 outranks 2 of 9 (${twoOfTwo.rate.toFixed(2)} > ${twoOfNine.rate.toFixed(2)})`,
  );
  assert(twoOfTwo.status === 'active', `2 of 2 is active (got ${twoOfTwo.status})`);
  assert(
    twoOfNine.status === 'resolved',
    `2 hits then 7 clean encounters resolves it (got ${twoOfNine.status})`,
  );

  const once = scoreMisconceptions(cat, [{ misconceptionId: id, ts: T0, hit: true }], T0)[0];
  assert(once.status === 'suspected', `a single hit is only 'suspected' (got ${once.status})`);

  const old = scoreMisconceptions(cat, [{ misconceptionId: id, ts: T0, hit: true },
    { misconceptionId: id, ts: T0 + DAY, hit: true }], T0 + 120 * DAY)[0];
  assert(old.status === 'fading', `a hit 4 months ago is no longer active (got ${old.status})`);

  const never = scoreMisconceptions(cat, [], T0);
  assert(never.length === 0, 'a trap the student never met is not reported at all');
}

// ============================================================
section('Weakest-link diagnosis');
// ============================================================

{
  const skills: Skill[] = [
    skill({ id: 'root', title: 'הבסיס', prereqs: [] }),
    skill({ id: 'mid', title: 'האמצע', prereqs: ['root'] }),
    skill({ id: 'leaf', title: 'העלה', prereqs: ['mid'] }),
  ];
  const m = (id: string, p: number, over: Partial<ReturnType<typeof traceSkill>> = {}) => ({
    skillId: id, title: id, p, state: classify(p, 0.9), observations: 5,
    effectiveN: 5, confidence: 0.9, lastTs: T0, trend: 'flat' as const, ...over,
  });

  const link = findWeakestLink(skills, [m('root', 0.2), m('mid', 0.4), m('leaf', 0.7)], T0);
  assert(link !== null, 'a fragile prerequisite under an attempted skill is found');
  assert(link?.rootSkill === 'root', `the deepest broken prerequisite wins (got ${link?.rootSkill})`);

  // Never blame a prerequisite we know nothing about.
  const noEvidence = findWeakestLink(
    skills,
    [m('root', 0.2, { observations: 0, confidence: 0, state: 'unknown' }), m('mid', 0.4), m('leaf', 0.7)],
    T0,
  );
  assert(
    noEvidence?.rootSkill !== 'root',
    'a prerequisite with no evidence is never named as the root cause',
  );

  // No gap, no claim.
  const flat = findWeakestLink(skills, [m('root', 0.45), m('mid', 0.5), m('leaf', 0.52)], T0);
  assert(flat === null, 'uniformly mediocre skills produce no prerequisite claim');

  // Stale work is not "current".
  const stale = findWeakestLink(
    skills,
    [m('root', 0.2), m('mid', 0.4, { lastTs: T0 - 60 * DAY }), m('leaf', 0.7, { lastTs: T0 - 60 * DAY })],
    T0,
  );
  assert(stale === null, 'skills untouched for two months are not "currently being learned"');
}

// ============================================================
section('Insight templates');
// ============================================================

{
  assert(hePrefix('ב', 'ההצגה הקוטבית') === 'בהצגה הקוטבית', 'ב + ההצגה → בהצגה (definite article merges)');
  assert(hePrefix('ב', 'נוסחת דה-מואבר') === 'בנוסחת דה-מואבר', 'ב + indefinite title concatenates');
  assert(hePrefix('ב', '$|z|$ כמרחק') === 'ב-$|z|$ כמרחק', 'a title opening with math takes a maqaf');

  const thin = buildInsight({
    weakestLink: null, misconceptions: [], skills: [], totalObservations: 3, now: T0,
  });
  assert(thin === null, 'no insight is claimed from 3 observations');
}

// ============================================================
section('Next-step arbitration');
// ============================================================

{
  const a = { kind: 'review-due' as const, score: 30, title: 'a', reason: '', href: '/a' };
  const b = { kind: 'prereq-repair' as const, score: 30, title: 'b', reason: '', href: '/b' };
  const c = { kind: 'continue-ladder' as const, score: 90, title: 'c', reason: '', href: '/c' };
  const ranked = rankCandidates([a, b, c]);
  assert(ranked[0].href === '/c', 'the highest score wins');
  assert(ranked[1].href === '/b', 'ties break toward the higher-priority kind, deterministically');
  assert(
    JSON.stringify(rankCandidates([c, b, a])) === JSON.stringify(ranked),
    'ranking does not depend on input order',
  );
}

// ============================================================
section('Replay — three archetype students');
// ============================================================

const NOW = T0 + 10 * DAY;
const CTX = { dueCount: 0, resume: { href: '/roadmap/polar-de-moivre?level=mid', title: 'המשך' } };

// ---- 1 · The quadrant confuser -----------------------------
// Solid on |z|; every argument question is answered with the
// "no quadrant correction" distractor; polar form is shaky as a result.
{
  const events: ResultEvent[] = [
    // modulus — right, three times
    mcq('cx-003', true, correctIndexOf('cx-003'), 1),
    mcq('cx-sub-polar-001', true, correctIndexOf('cx-sub-polar-001'), 2),
    mcq('polar-de-moivre-drill-002', true, correctIndexOf('polar-de-moivre-drill-002'), 3),
    // argument — wrong, always the aux-angle distractor
    mcq('polar-de-moivre-drill-003', false, 1, 4),
    mcq('cx-sub-polar-002', false, 1, 5),
    mcq('cx-006', false, 1, 6),
    // polar form — mostly right
    mcq('polar-de-moivre-drill-001', true, correctIndexOf('polar-de-moivre-drill-001'), 7),
    mcq('polar-de-moivre-drill-004', true, correctIndexOf('polar-de-moivre-drill-004'), 8),
    mcq('cx-sub-polar-006', false, 1, 9),
  ];
  const state = buildCognitiveState({ subject: SUBJECT, topic: TOPIC, events, now: NOW, ...CTX })!;

  assert(state !== null, 'a state is produced for the complex-numbers catalog');
  assert(
    state.weakestLink?.rootSkill === 'cx.arg.quadrant',
    `the root cause is the argument skill (got ${state.weakestLink?.rootSkill})`,
  );
  const argMastery = state.skills.find((s) => s.skillId === 'cx.arg.quadrant')!;
  const modMastery = state.skills.find((s) => s.skillId === 'cx.modulus')!;
  assert(argMastery.state === 'fragile', `argument reads fragile (got ${argMastery.state})`);
  assert(modMastery.state === 'mastered', `modulus reads mastered (got ${modMastery.state})`);

  const top = state.misconceptions[0];
  assert(
    top?.id === 'cx.arg.no-quadrant-fix',
    `the strongest misconception is the quadrant one (got ${top?.id})`,
  );
  // Four hits, not three: the wrong answer on the POLAR-FORM question was also
  // the aux-angle option, so the same wrong idea is caught on a question about
  // a different skill. That cross-skill attribution is the point of anchoring
  // misconceptions to distractors rather than to sub-topics.
  assert(top.hits === 4 && top.status === 'active', `4 hits, active (got ${top?.hits}/${top?.status})`);
  assert(top.opportunities === 4, `4 encounters (got ${top?.opportunities})`);

  assert(
    !!state.insight && state.insight.includes('אלא ב') && state.insight.includes('ארגומנט'),
    'the insight names the upstream cause',
  );
  assert(!state.insight!.includes('בההצגה'), 'no *בההצגה* — the article merged correctly');

  // THE invariant: the button must not contradict the headline. Whatever kind
  // the arbiter picks, it has to point at the skill the diagnosis blamed.
  assert(
    state.nextStep.skillId === state.weakestLink!.rootSkill,
    `the next step targets the skill the insight blamed (${state.nextStep.skillId} vs ${state.weakestLink!.rootSkill})`,
  );
  assert(
    state.nextStep.kind === 'prereq-repair',
    `a misconception sitting on the broken prerequisite carries its priority (got ${state.nextStep.kind})`,
  );
  assert(
    !state.alternates.some((a) => a.skillId === state.weakestLink!.rootSkill),
    'the prerequisite is not offered twice as its own alternative',
  );
  console.log(`      insight → ${state.insight}`);
  console.log(`      next    → ${state.nextStep.title}  (${state.nextStep.href})`);
}

// ---- 2 · Forgot the n-th root ------------------------------
// Polar and root-counting are fine; every root MODULUS question takes the
// "use |w| as-is" distractor. No prerequisite is broken, so the report must
// fall through to the named misconception rather than inventing a root cause.
{
  const right = (id: string, day: number) => mcq(id, true, correctIndexOf(id), day);
  const events: ResultEvent[] = [
    right('polar-de-moivre-drill-001', 1),
    right('polar-de-moivre-drill-004', 1),
    right('cx-sub-polar-006', 2),
    right('complex-roots-drill-001', 3),
    right('cx-sub-roots-001', 3),
    // every root-MODULUS question takes a "|w| as-is / wrong root" distractor
    mcq('complex-roots-drill-002', false, 1, 4),
    mcq('cx-sub-roots-002', false, 2, 5),
    mcq('cx-sub-roots-005', false, 2, 6),
  ];
  const state = buildCognitiveState({ subject: SUBJECT, topic: TOPIC, events, now: NOW, ...CTX })!;

  const top = state.misconceptions[0];
  assert(
    top?.id === 'cx.roots.modulus-not-rooted',
    `the n-th-root misconception surfaces first (got ${top?.id})`,
  );
  assert(top.hits === 3 && top.opportunities === 3, `3 hits of 3 encounters (got ${top?.hits}/${top?.opportunities})`);
  assert(
    !!state.insight && state.insight.includes('מתוך'),
    'the insight quotes the hit rate',
  );
  assert(
    state.nextStep.kind === 'misconception-drill' || state.nextStep.kind === 'prereq-repair',
    `the next step targets the defect (got ${state.nextStep.kind})`,
  );
  console.log(`      insight → ${state.insight}`);
  console.log(`      next    → ${state.nextStep.title}  (${state.nextStep.href})`);
}

// ---- 3 · The solid student ---------------------------------
// Nine correct answers across four skills. The system must invent nothing.
{
  const right = (id: string, day: number) => mcq(id, true, correctIndexOf(id), day);
  const events: ResultEvent[] = [
    right('cx-003', 1),
    right('cx-sub-polar-001', 1),
    right('polar-de-moivre-drill-002', 2),
    right('polar-de-moivre-drill-003', 2),
    right('cx-sub-polar-002', 3),
    right('cx-006', 3),
    right('polar-de-moivre-drill-001', 4),
    right('polar-de-moivre-drill-004', 4),
    right('cx-sub-polar-006', 5),
  ];
  const state = buildCognitiveState({ subject: SUBJECT, topic: TOPIC, events, now: NOW, ...CTX })!;

  assert(state.weakestLink === null, 'no prerequisite break is invented for a strong student');
  assert(
    state.misconceptions.every((m) => m.hits === 0),
    'no misconception is credited without a hit',
  );
  assert(state.insight === null, 'a strong student is told nothing rather than something made up');
  assert(
    state.nextStep.kind === 'continue-ladder',
    `the next step is simply to keep going (got ${state.nextStep.kind})`,
  );
  console.log(`      insight → ${state.insight}`);
  console.log(`      next    → ${state.nextStep.title}  (${state.nextStep.href})`);
}

// ---- determinism + evidence hygiene ------------------------
{
  const events: ResultEvent[] = [
    mcq('polar-de-moivre-drill-003', false, 1, 1),
    mcq('cx-sub-polar-002', false, 1, 2),
    mcq('cx-003', true, 0, 3),
  ];
  const a = buildCognitiveState({ subject: SUBJECT, topic: TOPIC, events, now: NOW, ...CTX })!;
  const b = buildCognitiveState({ subject: SUBJECT, topic: TOPIC, events, now: NOW, ...CTX })!;
  assert(JSON.stringify(a) === JSON.stringify(b), 'the same inputs always produce the same state');

  // A correct answer never counts as a misconception hit, even though the
  // chosen index is recorded for it too.
  const rightOnly = buildCognitiveState({
    subject: SUBJECT, topic: TOPIC, now: NOW, ...CTX,
    events: [mcq('polar-de-moivre-drill-003', true, correctIndexOf('polar-de-moivre-drill-003'), 1)],
  })!;
  assert(
    rightOnly.misconceptions.every((m) => m.hits === 0),
    'a correct answer is an opportunity, never a hit',
  );
  assert(
    rightOnly.misconceptions.some((m) => m.opportunities > 0),
    'a correct answer on a trap question still counts as an encounter',
  );

  // Legacy events (written before chosenIndex existed) must not fabricate
  // opportunities — they carry no information about which trap was avoided.
  const legacy = buildCognitiveState({
    subject: SUBJECT, topic: TOPIC, now: NOW, ...CTX,
    events: [{
      ts: T0, subject: SUBJECT, topic: TOPIC, questionId: 'polar-de-moivre-drill-003',
      source: 'drill', correct: false,
    }],
  })!;
  assert(
    legacy.misconceptions.length === 0,
    'an event with no chosenIndex creates neither a hit nor an opportunity',
  );
  assert(
    legacy.skills.some((s) => s.observations > 0),
    'a legacy event still feeds knowledge tracing',
  );

  // Events from another topic must not leak in.
  const other = buildCognitiveState({
    subject: SUBJECT, topic: TOPIC, now: NOW, ...CTX,
    events: [{ ...mcq('cx-003', true, correctIndexOf('cx-003'), 1), topic: 'אלגברה' }],
  })!;
  assert(other.totalObservations === 0, 'events from another topic are ignored');
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
