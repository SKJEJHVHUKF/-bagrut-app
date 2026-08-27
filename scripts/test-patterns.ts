/**
 * test-patterns.ts — the cross-topic mistake profile and the report, tested
 * against synthetic students on a fixed clock.
 *
 *   npx tsx scripts/test-patterns.ts
 *
 * Nothing here mocks the generator: every tagged miss is produced by feeding a
 * REAL generated question id and a REAL option index through the same code the
 * browser runs. A retagged distractor or a renamed template therefore fails a
 * test instead of silently relabelling a student's history.
 *
 * The assertions that matter most are the negative ones. This module's whole
 * job is to make claims about a person, so the expensive failures are not
 * "missed a pattern" — they are "invented one": a pattern from two answers, a
 * pattern that never left one sub-topic, a repair called successful on evidence
 * gathered before it happened.
 */

import { generate } from '../lib/generator';
import { buildProfile, MIN_HITS, MIN_SPREAD } from '../lib/patterns/profile';
import { taggedMisses, tagOf } from '../lib/patterns/observe';
import { buildReport, REPAIR_VERDICT_MIN_ATTEMPTS, TREND_WEEKS } from '../lib/report';
import type { ResultEvent } from '../lib/results';
import type { HealedRecord } from '../lib/remediation/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 27);
const SUBJECT = 'math5';

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
// Fixtures — real generated questions, real option indices
// ============================================================

/**
 * A wrong answer on a generated question, clicking option `chosenIndex`.
 * `daysAgo` places it on the timeline.
 */
function miss(
  templateId: string,
  difficulty: 'easy' | 'mid' | 'hard',
  seed: number,
  chosenIndex: number,
  topic: string,
  subTopicId: string,
  daysAgo: number,
  extra: Partial<ResultEvent> = {},
): ResultEvent {
  const g = generate(templateId, difficulty, seed);
  if (!g) throw new Error(`fixture: ${templateId}/${difficulty} produced nothing`);
  return {
    ts: NOW - daysAgo * DAY,
    subject: SUBJECT,
    topic,
    subTopicId,
    questionId: g.question.id,
    source: 'drill',
    difficulty,
    correct: false,
    kind: 'mcq',
    chosenIndex,
    optionCount: 4,
    ...extra,
  };
}

function hit(topic: string, subTopicId: string, daysAgo: number): ResultEvent {
  return {
    ts: NOW - daysAgo * DAY,
    subject: SUBJECT,
    topic,
    subTopicId,
    questionId: `authored-${daysAgo}`,
    source: 'drill',
    difficulty: 'mid',
    correct: true,
  };
}

// ============================================================
section('observation — a click becomes a labelled mistake');
// ============================================================
{
  // seq-ar-nth option 1 is "multiplied d by n instead of n-1" → index-offset.
  const e = miss('seq-ar-nth', 'mid', 11, 1, 'סדרות', 'ar-general-term', 3);
  assert(tagOf(e) === 'index-offset', 'clicking the n-vs-n-1 distractor is tagged index-offset');

  assert(tagOf({ ...e, correct: true }) === null, 'a correct answer is never tagged');
  assert(tagOf({ ...e, chosenIndex: 0 }) === null, 'the correct option carries no tag');
  assert(
    tagOf({ ...e, chosenIndex: undefined }) === null,
    'a miss with no recorded option is left unlabelled rather than guessed',
  );
  assert(
    tagOf({ ...e, questionId: 'seq-001' }) === null,
    'an authored question with no declared distractor meaning is not guessed at',
  );
  assert(
    tagOf({ ...e, questionId: 'gen:no-such-template:mid:1' }) === null,
    'a removed template orphans the label instead of mislabelling it',
  );

  assert(
    tagOf({ ...e, questionId: undefined, chosenIndex: undefined, kind: 'open',
      answerDiagnosis: { kind: 'sign-flip' } }) === 'sign-slip',
    'an open question in ANY topic is labelled from its answer diagnosis — no content work needed',
  );
  assert(
    tagOf({ ...e, questionId: undefined, chosenIndex: undefined, kind: 'open',
      answerDiagnosis: { kind: 'extra-root', extra: 1 } }) === 'condition-ignored',
    'roots the domain should have rejected are tagged as an unchecked condition',
  );

  assert(
    taggedMisses([{ ...e, repeat: true }]).length === 0,
    'a replay is practice, not measurement — it cannot feed a pattern',
  );
}

// ============================================================
section('profile — what counts as a repeating pattern');
// ============================================================
{
  const twice = [
    miss('seq-ar-nth', 'mid', 11, 1, 'סדרות', 'ar-general-term', 5),
    miss('seq-ar-nth', 'mid', 29, 1, 'סדרות', 'ar-general-term', 4),
  ];
  const p2 = buildProfile(taggedMisses(twice), NOW);
  assert(
    p2.patterns.length === 0 && p2.local.length === 0,
    `under ${MIN_HITS} hits nothing is reported — never a weakness invented from two answers`,
  );
  assert(p2.belowFloor === 2, 'the un-reportable hits are counted as "still measuring", not discarded');

  // Three hits, but all inside ONE sub-topic: a local weakness, not a pattern.
  const oneSub = [
    miss('seq-ar-nth', 'mid', 11, 1, 'סדרות', 'ar-general-term', 6),
    miss('seq-ar-nth', 'mid', 29, 1, 'סדרות', 'ar-general-term', 5),
    miss('seq-ar-nth', 'easy', 47, 1, 'סדרות', 'ar-general-term', 4),
  ];
  const pLocal = buildProfile(taggedMisses(oneSub), NOW);
  assert(
    pLocal.patterns.length === 0,
    `a mistake that never left one sub-topic is not a pattern (needs ${MIN_SPREAD} sub-topics)`,
  );
  assert(
    pLocal.local.some((f) => f.tag === 'index-offset'),
    'it is still reported — as a local weakness, which is what lib/remediation repairs',
  );

  // The same mistake in סדרות AND in הסתברות — this is the product's claim.
  const crossTopic = [
    miss('seq-ar-nth', 'mid', 11, 1, 'סדרות', 'ar-general-term', 9),
    miss('seq-ge-nth', 'mid', 23, 1, 'סדרות', 'ge-general-term', 7),
    miss('seq-compound-interest', 'mid', 31, 1, 'סדרות', 'sequences-applications', 3),
  ];
  const pCross = buildProfile(taggedMisses(crossTopic), NOW);
  const found = pCross.patterns.find((f) => f.tag === 'index-offset');
  assert(!!found, 'the same mistake across three sub-topics is reported as a pattern');
  assert(found?.spread === 3, 'the spread is the number of distinct sub-topics it crossed');
  assert(found?.hits === 3 && found?.share === 1, 'share is against a stated denominator: all labelled misses');
  assert(
    found?.topics[0].topic === 'סדרות' && found.topics[0].hits === 3,
    'the topics it appeared in are listed, strongest first',
  );
}

// ============================================================
section('profile — trend, and why repair sessions are excluded from it');
// ============================================================
{
  // index-offset dominated a month ago; complement-skipped dominates now.
  const events = [
    ...[20, 21, 22, 23].map((d, i) =>
      miss('seq-ar-nth', 'mid', 11 + i * 7, 1, 'סדרות', 'ar-general-term', d),
    ),
    miss('seq-ge-nth', 'mid', 23, 1, 'סדרות', 'ge-general-term', 24),
    ...[2, 3, 4].map((d, i) =>
      miss('pr-bernoulli-at-least-one', 'mid', 5 + i * 13, 1, 'הסתברות', 'pr-bernoulli', d),
    ),
    miss('pr-union-complement', 'mid', 41, 2, 'הסתברות', 'pr-basics', 5),
  ];
  const p = buildProfile(taggedMisses(events), NOW);
  const offset = p.patterns.find((f) => f.tag === 'index-offset');
  const complement = p.patterns.find((f) => f.tag === 'complement-skipped');

  assert(!!offset && offset.trend === 'improving', 'a mistake that stopped happening reads as improving');
  assert(!!complement && complement.trend === 'worsening', 'a mistake that took over reads as worsening');
  assert(
    !!complement && !!offset && complement.weight > offset.weight,
    'recency decides the ranking — the live problem outranks the old one',
  );

  // The same misses, but inside a repair session. A repair path deliberately
  // serves the weakest tag, so counting it would report every weakness under
  // active treatment as "worsening" precisely because it is being worked on.
  const inRepair = events.map((e) =>
    e.topic === 'הסתברות' ? { ...e, source: 'fix' as const } : e,
  );
  const pRepair = buildProfile(taggedMisses(inRepair), NOW);
  const complementR = pRepair.patterns.find((f) => f.tag === 'complement-skipped');
  assert(
    !!complementR && complementR.trend !== 'worsening',
    'misses inside a repair session do not make the tag being repaired look worse',
  );
  // Four, not three: `pr-union-complement` option 2 ("answered the complement
  // instead of the union") carries the same tag as the three ברנולי misses.
  assert(
    complementR?.hitsInRepair === 4,
    'they are still counted and reported separately, so progress inside a repair stays visible',
  );
}

// ============================================================
section('profile — determinism');
// ============================================================
{
  const events = [
    miss('seq-ar-nth', 'mid', 11, 1, 'סדרות', 'ar-general-term', 9),
    miss('seq-ge-nth', 'mid', 23, 1, 'סדרות', 'ge-general-term', 7),
    miss('pr-union-complement', 'mid', 41, 2, 'הסתברות', 'pr-basics', 5),
    miss('pr-counting-bag', 'mid', 53, 2, 'הסתברות', 'pr-basics', 4),
    miss('pr-bernoulli-at-least-one', 'mid', 5, 1, 'הסתברות', 'pr-bernoulli', 2),
  ];
  const a = buildProfile(taggedMisses(events), NOW).patterns.map((f) => f.tag).join('|');
  const b = buildProfile(taggedMisses([...events].reverse()), NOW).patterns.map((f) => f.tag).join('|');
  assert(a === b && a.length > 0, 'the same state always yields the same order, whatever the event order');
}

// ============================================================
section('report — a repair is judged only on what happened after it');
// ============================================================
{
  const healedAt = NOW - 20 * DAY;
  const record: HealedRecord = {
    targetId: 'st:ar-general-term',
    title: 'סדרה חשבונית',
    subject: SUBJECT,
    topic: 'סדרות',
    healedAt,
    answered: 4,
  };
  const base = {
    subject: SUBJECT,
    mistakes: [],
    history: [record],
    healed: { 'st:ar-general-term': healedAt },
    healCount: { 'st:ar-general-term': 1 },
    now: NOW,
  };

  // Failures BEFORE the repair must not count against it.
  const onlyBefore = buildReport({
    ...base,
    events: [25, 26, 27, 28].map((d) =>
      miss('seq-ar-nth', 'mid', 11, 1, 'סדרות', 'ar-general-term', d),
    ),
  });
  assert(
    onlyBefore.repairs[0].status === 'untested',
    'mistakes made before the repair never judge it — the verdict is "not tested yet"',
  );
  assert(
    onlyBefore.repairs[0].since.attempts === 0,
    'the post-repair evidence window really does start at the repair',
  );

  const held = buildReport({
    ...base,
    events: [...[10, 9, 8, 7].map((d) => hit('סדרות', 'ar-general-term', d))],
  });
  assert(held.repairs[0].status === 'held', 'answered correctly since the repair — it held');

  const relapsed = buildReport({
    ...base,
    events: [
      hit('סדרות', 'ar-general-term', 10),
      ...[9, 8, 7].map((d, i) =>
        miss('seq-ar-nth', 'mid', 11 + i * 7, 1, 'סדרות', 'ar-general-term', d),
      ),
    ],
  });
  assert(relapsed.repairs[0].status === 'relapsed', 'failing again since the repair — it came back');

  const thin = buildReport({
    ...base,
    events: [hit('סדרות', 'ar-general-term', 5), hit('סדרות', 'ar-general-term', 4)],
  });
  assert(
    thin.repairs[0].status === 'untested',
    `under ${REPAIR_VERDICT_MIN_ATTEMPTS} answers since the repair, no verdict is claimed either way`,
  );
}

// ============================================================
section('report — weekly activity and early days');
// ============================================================
{
  const empty = buildReport({
    subject: SUBJECT, events: [], mistakes: [], history: [], healed: {}, healCount: {}, now: NOW,
  });
  assert(empty.earlyDays, 'an empty log reports "still measuring", not a page of zeros');
  assert(empty.weeks.length === TREND_WEEKS, `the chart always spans ${TREND_WEEKS} weeks`);
  assert(
    empty.weeks.every((w) => w.accuracy === null),
    'a week with no practice is a GAP, not 0% — a week off must not look like a collapse',
  );

  const active = buildReport({
    subject: SUBJECT,
    mistakes: [], history: [], healed: {}, healCount: {}, now: NOW,
    events: [
      ...Array.from({ length: 8 }, (_, i) => hit('סדרות', 'ar-general-term', 3 + i * 0.1)),
      ...Array.from({ length: 4 }, (_, i) =>
        miss('seq-ar-nth', 'mid', 11 + i * 7, 1, 'סדרות', 'ar-general-term', 3.5 + i * 0.1),
      ),
    ],
  });
  assert(!active.earlyDays, 'twelve answers is enough to start reporting');
  const last = active.weeks[TREND_WEEKS - 1];
  assert(
    last.answered === 12 && last.correct === 8 && Math.abs((last.accuracy ?? 0) - 8 / 12) < 1e-9,
    'the weekly bucket counts every non-replay answer, correct and wrong alike',
  );
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) process.exit(1);
