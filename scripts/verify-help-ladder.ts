/**
 * verify-help-ladder.ts — the content gate for "למד אותי" (lib/help-ladder).
 *
 *   npx tsx scripts/verify-help-ladder.ts
 *
 * The ladder is DERIVED from existing fields, which is what makes it free — and
 * also what makes it silently uneven: a question with no authored `hint` loses
 * rung 1, and a question with a two-line solution cannot show its first line
 * without showing the answer. This gate measures that unevenness instead of
 * letting it hide behind "the feature works".
 *
 * The check that actually earns its keep is LEAKAGE: rung 2 promises "how to
 * start — you do the rest", and a first step that already contains the final
 * answer turns the middle rung into the full solution wearing a smaller label.
 * That is worse than having no middle rung at all, because the student chose
 * the gentler option and got spoiled anyway.
 *
 * What it CANNOT do: judge whether a hint is a good hint, or whether a first
 * step is a useful place to start. `0 errors` here means "no rung is missing,
 * empty, or self-defeating" — not "the help is good".
 */

import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';
import { getSubTopics, hasSubTopics } from '../content/lessons';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';
import { buildHelpLadder, leaksAnswer, MIN_STEPS_FOR_FIRST_STEP } from '../lib/help-ladder';
import { voiceCorrect, VOICE_BANKS } from '../lib/voice';

const SUBJECT = 'math5';

const errors: string[] = [];
const warnings: string[] = [];

// The leak test is imported from the builder, NOT re-implemented here. When a
// gate owns its own copy of a rule, the two drift and the gate starts certifying
// something the app no longer does.

type Row = {
  topic: string;
  total: number;
  withHint: number;
  firstStep: number;
  keyPoints: number;
  leakGuard: number;
  noMiddle: number;
};

const rows: Row[] = [];
let grandTotal = 0;
let grandFull = 0;

for (const t of MATH5_CURRICULUM) {
  if (!hasSubTopics(SUBJECT, t.key)) continue;

  const row: Row = {
    topic: t.key,
    total: 0,
    withHint: 0,
    firstStep: 0,
    keyPoints: 0,
    leakGuard: 0,
    noMiddle: 0,
  };

  for (const st of getSubTopics(SUBJECT, t.key)) {
    const questions: PracticeQuestion[] = [
      ...(st.questions ?? []),
      ...(st.lesson ?? []).flatMap((s) => (s.drill ? [s.drill] : [])),
    ];

    for (const q of questions) {
      const ladder = buildHelpLadder(q, st as SubTopic);
      row.total++;
      grandTotal++;

      const full = ladder.tiers.find((x) => x.kind === 'full');
      if (!full) {
        errors.push(`${st.id} / ${q.id}: the ladder has no full-solution rung — the student can dead-end`);
      } else {
        grandFull++;
      }

      if (ladder.tiers.some((x) => x.kind === 'hint')) row.withHint++;

      const middle = ladder.tiers.find((x) => x.kind === 'first-step' || x.kind === 'key-points');
      if (!middle) {
        row.noMiddle++;
        warnings.push(
          `[no-middle] ${st.id} / ${q.id} — solution has ${q.solution?.steps?.length ?? 0} step(s) ` +
            `(needs ${MIN_STEPS_FOR_FIRST_STEP}) and the sub-topic has no keyPoints, so there is no rung ` +
            `between the hint and the answer`,
        );
      } else if (middle.kind === 'first-step') {
        row.firstStep++;
        const step = middle.body[0] ?? '';
        if (!step.trim()) {
          errors.push(`${st.id} / ${q.id}: the "first step" rung is empty`);
        } else if (leaksAnswer(step, q.solution.finalAnswer)) {
          // The builder is supposed to have caught this and fallen back. If it
          // ever reaches here, the guard has been broken — which is exactly the
          // regression this assertion exists to catch.
          errors.push(
            `${st.id} / ${q.id}: the "first step" rung contains the final answer ` +
              `("${q.solution.finalAnswer}") — the leak guard in buildHelpLadder did not fire`,
          );
        }
      } else {
        row.keyPoints++;
        if (ladder.middleReason === 'would-leak') {
          row.leakGuard++;
          warnings.push(
            `[leak-guard] ${st.id} / ${q.id} — the solution's first line already contains the final ` +
              `answer ("${q.solution.finalAnswer}"), so rung 2 fell back to the sub-topic keyPoints. ` +
              `Re-ordering that solution would give this question a real middle rung.`,
          );
        }
      }

      // Every rung that exists must have something in it. A button that opens
      // an empty card is worse than a button that isn't there.
      for (const tier of ladder.tiers) {
        if (tier.kind === 'full') continue;
        if (tier.body.length === 0 || tier.body.every((b) => !b.trim())) {
          errors.push(`${st.id} / ${q.id}: rung "${tier.title}" opens to nothing`);
        }
        if (!tier.promise.trim() || !tier.title.trim()) {
          errors.push(`${st.id} / ${q.id}: rung ${tier.level} has no label or no promise`);
        }
      }
    }
  }

  rows.push(row);
}

// ---------------------------------------------------------------------------
// The reaction lines (lib/voice) — same domain: what the app says to a student.
// ---------------------------------------------------------------------------

{
  const allIds: string[] = [];
  for (const t of MATH5_CURRICULUM) {
    if (!hasSubTopics(SUBJECT, t.key)) continue;
    for (const st of getSubTopics(SUBJECT, t.key)) for (const q of st.questions ?? []) allIds.push(q.id);
  }

  for (const [name, bank] of Object.entries(VOICE_BANKS)) {
    if (bank.length < 3) errors.push(`voice bank ${name} has ${bank.length} lines — too few to stop it reading canned`);
    if (new Set(bank).size !== bank.length) errors.push(`voice bank ${name} contains a duplicate line`);
    if (bank.some((l) => !l.trim())) errors.push(`voice bank ${name} contains an empty line`);
  }

  // Determinism: the same question must produce the same line on the server
  // render and on the client, forever. A re-roll here is a hydration mismatch.
  const sample = allIds[0];
  if (sample && voiceCorrect(sample) !== voiceCorrect(sample)) {
    errors.push('voiceCorrect is not deterministic — it would differ between SSR and hydration');
  }

  // Spread. Ids in this bank differ only in their LAST characters
  // (alg-sub-quad-001 / -002), which is exactly the seed shape that collapsed a
  // hash in this repo before. Measured over the real bank, never assumed.
  const seen = new Map<string, number>();
  for (const id of allIds) {
    const line = voiceCorrect(id);
    seen.set(line, (seen.get(line) ?? 0) + 1);
  }
  const ideal = allIds.length / VOICE_BANKS.CORRECT.length;
  const worst = seen.size > 0 ? Math.max(...seen.values()) / ideal : 0;
  if (seen.size < VOICE_BANKS.CORRECT.length) {
    errors.push(
      `voice lines collapse: only ${seen.size} of ${VOICE_BANKS.CORRECT.length} are ever used across ${allIds.length} questions`,
    );
  } else if (worst > 1.6) {
    warnings.push(
      `[voice-skew] one reaction line is ${worst.toFixed(2)}× over-represented across ${allIds.length} questions`,
    );
  }
  console.log(
    `\nvoice: ${allIds.length} question ids → ${seen.size}/${VOICE_BANKS.CORRECT.length} lines used, worst skew ${worst.toFixed(2)}×`,
  );
}

console.log('\n── "למד אותי" ladder inventory ' + '─'.repeat(40));
console.log(
  'topic'.padEnd(26) + 'questions  rung1(hint)  rung2:first-step  rung2:keyPoints  leak-guard  no-middle',
);
let tHint = 0;
let tFirst = 0;
let tKey = 0;
let tLeak = 0;
let tNone = 0;
for (const r of rows) {
  tHint += r.withHint;
  tFirst += r.firstStep;
  tKey += r.keyPoints;
  tLeak += r.leakGuard;
  tNone += r.noMiddle;
  console.log(
    r.topic.padEnd(26) +
      String(r.total).padEnd(11) +
      String(r.withHint).padEnd(13) +
      String(r.firstStep).padEnd(18) +
      String(r.keyPoints).padEnd(17) +
      String(r.leakGuard).padEnd(12) +
      String(r.noMiddle),
  );
}
console.log('─'.repeat(96));
const pct = (n: number) => (grandTotal ? Math.round((n / grandTotal) * 100) : 0);
console.log(
  `${grandTotal} questions · rung1 ${tHint} (${pct(tHint)}%) · ` +
    `rung2 question-specific ${tFirst} (${pct(tFirst)}%) · rung2 fallback ${tKey} (${pct(tKey)}%) · ` +
    `no middle ${tNone} (${pct(tNone)}%) · rung3 ${grandFull}/${grandTotal}`,
);
console.log(
  `note: "rung2 fallback" = the sub-topic keyPoints stood in, either because the solution was shorter than\n` +
    `      ${MIN_STEPS_FOR_FIRST_STEP} steps or because its first line already contained the answer (${tLeak} caught by the leak guard).\n` +
    `      Those questions are the authoring worklist, not a failure — every one of them still has all three rungs.`,
);

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s) — first 10:`);
  for (const w of warnings.slice(0, 10)) console.log(`   ${w}`);
  if (warnings.length > 10) console.log(`   … and ${warnings.length - 10} more`);
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  for (const e of errors) console.log(`   ${e}`);
  process.exit(1);
}
console.log('\n✅ 0 errors — every question has a full rung, no rung opens empty, no middle rung leaks the answer.');
