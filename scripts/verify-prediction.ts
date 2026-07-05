// verify-prediction.ts — sanity checks for the grade-prediction model.
//   npx tsx scripts/verify-prediction.ts
// Note: runs in Node where localStorage is absent → topicStats()=[] and
// getPlan()=null, so accuracies collapse to the DEFAULT_PRIOR. That's the
// "no data" baseline; we check structure + math invariants.

import { predictPaper, predictOverall, topImpactTopics } from '@/lib/prediction';

export {};

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
};

for (const paper of ['581', '582'] as const) {
  const p = predictPaper('math5', paper);
  check(`${paper}: prediction exists`, p !== null);
  if (!p) continue;
  const weightSum = p.topics.reduce((a, t) => a + t.weightPts, 0);
  check(`${paper}: weights sum ≈ 100`, Math.abs(weightSum - 100) < 1, `got ${weightSum.toFixed(1)}`);
  check(`${paper}: score in [0,100]`, p.score >= 0 && p.score <= 100, String(p.score));
  check(`${paper}: band ordered`, p.low <= p.score && p.score <= p.high, `${p.low}≤${p.score}≤${p.high}`);
  check(`${paper}: sparse band is wide`, p.high - p.low >= 20, `width ${p.high - p.low}`);
  check(`${paper}: no out-of-scope topic`, p.topics.every((t) => t.topic !== 'סטטיסטיקה'));
  console.log(`  ${paper}: score=${p.score} [${p.low}-${p.high}] topics=${p.topics.length} Σw=${weightSum.toFixed(1)}`);
}

const overall = predictOverall('math5');
check('overall exists', overall !== null);
if (overall) {
  check('overall in [0,100]', overall.score >= 0 && overall.score <= 100);
  check('overall band ordered', overall.low <= overall.score && overall.score <= overall.high);
  console.log(`  overall: ${overall.score} [${overall.low}-${overall.high}]`);
}

const impact = topImpactTopics('math5', 3);
check('impact: 3 topics', impact.length === 3);
check('impact: sorted desc', impact.every((t, i) => i === 0 || impact[i - 1].gainPer10 >= t.gainPer10));
console.log(`  impact: ${impact.map((t) => `${t.topic}(+${t.gainPer10})`).join(' · ')}`);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
