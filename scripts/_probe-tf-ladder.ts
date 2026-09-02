/**
 * _probe-tf-ladder.ts — the ladder probe for פונקציות טריגונומטריות.
 *
 *   npx tsx scripts/_probe-tf-ladder.ts
 *
 * WHY THIS EXISTS. tsc / verify-content / verify-tracks / verify-rule-lines /
 * verify-specs were all green while a stage in the מנה ושורש track had no
 * 🌱חימום rung at all — every question was mid/hard and buildSubTopicLevels
 * silently skips an empty tier. No gate looks at rung composition.
 *
 * So this runs the REAL functions per stage and fails on a missing rung, plus
 * the things `verify-rule-lines` will not check here (its REQUIRE_FULL set is
 * by topic, and it can be scoped so it never looks at what you just wrote).
 */
import { getSubTopic } from '../content/lessons';

const TOPIC = 'טריגונומטריה';
// Filled in as the stages land; keeping the survey working on the current
// content means the probe is useful from the first stage rather than the last.
const STAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['trig-identities', 'trig-equations', 'trig-calculus'];

let bad = 0;
const fail = (m: string) => {
  bad += 1;
  console.log(`  FAIL  ${m}`);
};

for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) {
    fail(`${id}: sub-topic not found`);
    continue;
  }
  const qs = st.questions ?? [];
  const byDiff: Record<string, number> = {};
  for (const q of qs) byDiff[q.difficulty ?? '?'] = (byDiff[q.difficulty ?? '?'] ?? 0) + 1;

  const steps = (st.lesson ?? []).length;
  const drills = (st.lesson ?? []).filter((s) => s.drill).length;
  const figs =
    (st.lesson ?? []).filter((s) => s.diagrams?.length).length +
    qs.filter((q) => q.solution?.diagrams?.length).length;

  console.log(
    `${id.padEnd(24)} steps ${String(steps).padStart(2)} · drills ${String(drills).padStart(2)}` +
      ` · figs ${String(figs).padStart(2)} · q ${String(qs.length).padStart(2)}` +
      `  [easy ${byDiff.easy ?? 0} · mid ${byDiff.mid ?? 0} · hard ${byDiff.hard ?? 0}]`,
  );

  for (const tier of ['easy', 'mid', 'hard'] as const) {
    if (!byDiff[tier]) fail(`${id}: no ${tier} question — that rung will not render`);
  }
  if (steps < 3) fail(`${id}: only ${steps} teach step(s)`);

  // The rule line is enforced by verify-rule-lines only for topics in its
  // REQUIRE_FULL set. Check it here too rather than trust that scoping.
  for (const q of qs) {
    const first = q.solution?.steps?.[0] ?? '';
    if (q.solution && !first.startsWith('**הכלל:**')) {
      fail(`${id}/${q.id}: solution does not open on **הכלל:**`);
    }
    if (q.answerLabels && q.expected?.kind === 'set') {
      const n = (q.expected as { values: string[] }).values.length;
      if (q.answerLabels.length !== n) {
        fail(`${id}/${q.id}: ${q.answerLabels.length} answerLabels for ${n} expected values`);
      }
    }
  }
  const ids = qs.map((q) => q.id);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupes.length) fail(`${id}: duplicate question ids ${[...new Set(dupes)].join(', ')}`);
}

console.log(bad === 0 ? '\n✅ ladder probe clean' : `\n❌ ${bad} problem(s)`);
process.exitCode = bad === 0 ? 0 : 1;

export {};
