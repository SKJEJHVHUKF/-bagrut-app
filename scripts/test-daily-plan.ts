/**
 * test-daily-plan.ts — the goal → today's tasks builder.
 *
 *   npx tsx scripts/test-daily-plan.ts
 *
 * buildDailyPlan takes every input as an argument, so there is nothing to mock
 * and no storage to shim. The cases that matter are the honest ones: what it
 * says when there is no prediction yet, and that a time budget can never empty
 * the list.
 */

import { buildDailyPlan, DEFAULT_MINUTES_PER_DAY } from '../lib/daily-plan';
import type { OverallPrediction, TopicImpact } from '../lib/prediction';
import type { Weakness } from '../lib/remediation/types';

let checks = 0;
let failures = 0;
const assert = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
};

const prediction = (score: number): OverallPrediction => ({
  score,
  low: score - 10,
  high: score + 10,
  totalAttempts: 40,
  papers: [],
});

const impact = (topic: string, gainPer10: number): TopicImpact => ({
  topic,
  emoji: '📘',
  weightPts: 20,
  accuracy: 0.5,
  attempts: 10,
  gainPer10,
});

const weakness = (topic: string, title: string): Weakness => ({
  id: `st:${title}`,
  kind: 'subtopic',
  subject: 'math5',
  topic,
  subTopicId: title,
  title,
  detail: '',
  band: 'mid',
  confidence: 1,
  score: 1,
  hits: 3,
  opportunities: 5,
  lastTs: 0,
});

const base = {
  target: '90' as const,
  minutesPerDay: 60,
  prediction: prediction(78),
  impact: [impact('טריגונומטריה', 8), impact('אלגברה', 3)],
  weaknesses: [weakness('טריגונומטריה', 'זהויות')],
  dueCount: 5,
  resume: { href: '/roadmap/x?level=mid', title: 'המשך: זהויות' },
  pacing: null,
};

console.log('── goal maths ' + '─'.repeat(50));
{
  const p = buildDailyPlan(base);
  assert(p.goal.gap === 12, `90 − 78 = 12 points short (got ${p.goal.gap})`);
  assert(p.goal.headline?.includes('12') === true, 'the headline states the real gap');

  const there = buildDailyPlan({ ...base, prediction: prediction(94) });
  assert((there.goal.gap ?? 0) < 0, 'already past the target reports a negative gap');
  assert(there.goal.headline?.includes('כבר על היעד') === true, 'and says so rather than "0 short"');

  // The important one: no prediction means too few answers to claim anything.
  const cold = buildDailyPlan({ ...base, prediction: null });
  assert(cold.goal.gap === null, 'no prediction → no gap number');
  assert(
    cold.goal.headline !== null && !/\d/.test(cold.goal.headline.replace(/[^\d]/g, '')),
    'and the headline contains no invented number',
  );

  const boost = buildDailyPlan({ ...base, target: 'boost' });
  assert(boost.goal.targetScore === null && boost.goal.gap === null, "'boost' has no fixed bar");
  assert(boost.goal.headline?.includes('78') === true, 'but still reports the predicted score');
}

console.log('\n── ordering ' + '─'.repeat(52));
{
  const p = buildDailyPlan(base);
  assert(p.tasks[0]?.kind === 'fix', 'repair comes first — drilling on a broken idea wastes the evening');
  assert(p.tasks[1]?.kind === 'review', 'retention second');
  assert(p.tasks.some((t) => t.kind === 'climb'), 'climbing is scheduled');
  assert(
    p.tasks[0].why.includes('8'),
    'the repair task cites the topic\'s real points-per-10% from lib/prediction',
  );
  assert(
    p.tasks.every((t) => t.why.trim().length > 0),
    'every task says why it is on the list',
  );

  const noWeak = buildDailyPlan({ ...base, weaknesses: [] });
  assert(noWeak.tasks[0]?.kind === 'review', 'with nothing broken, retention leads');

  // A goal already met should not schedule more grade-chasing drill.
  const met = buildDailyPlan({ ...base, prediction: prediction(95) });
  assert(!met.tasks.some((t) => t.kind === 'drill'), 'past the target, the ROI drill is dropped');
}

console.log('\n── time budget ' + '─'.repeat(49));
{
  const tight = buildDailyPlan({ ...base, minutesPerDay: 5 });
  assert(tight.tasks.length === 1, 'a 5-minute day still gets exactly one task, never zero');
  assert(tight.tasks[0].kind === 'fix', 'and it is the highest-priority one');
  assert(tight.deferred > 0, 'the rest are reported as deferred, not silently dropped');

  const roomy = buildDailyPlan({ ...base, minutesPerDay: 240 });
  assert(roomy.deferred === 0, 'a long day defers nothing');
  assert(
    roomy.totalMinutes === roomy.tasks.reduce((s, t) => s + t.minutes, 0),
    'totalMinutes matches the scheduled tasks',
  );

  const dflt = buildDailyPlan({ ...base, minutesPerDay: null });
  assert(dflt.totalMinutes <= DEFAULT_MINUTES_PER_DAY, `no stated time falls back to ${DEFAULT_MINUTES_PER_DAY} min`);
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
