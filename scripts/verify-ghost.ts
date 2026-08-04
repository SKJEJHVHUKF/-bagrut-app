/**
 * verify-ghost.ts — integrity gate for the Ghost Replay content.
 *
 *   npx tsx scripts/verify-ghost.ts            (errors fail, warnings print)
 *   npx tsx scripts/verify-ghost.ts --strict   (warnings fail too)
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT
 * It proves the walkthrough is STRUCTURALLY SOUND: every step is reachable,
 * every fork has exactly one right answer, every wrong option has somewhere to
 * go, and every `mistakeCategory` names a misconception that actually exists in
 * content/cognition.
 *
 * The check that matters most is `branch-on-correct-option`. A branch attached
 * to the RIGHT answer would tell a student who reasoned correctly that their
 * road breaks — the worst thing this feature could possibly do, and invisible
 * to a human proof-reader once a file has twenty options in it.
 *
 * It cannot tell you the mathematics is right or that a distractor is a
 * mistake a real student makes. That came from deriving the problem by hand,
 * twice, and it is the only way to re-check it.
 */

import { ghostEntries } from '../content/ghost-replay';
import type { GhostReplay, TopicGhostReplays } from '../content/ghost-replay/types';
import { getCognitionMap } from '../content/cognition';
import { getQuestions, getSubTopic, getSubTopics } from '../content/lessons';

const STRICT = process.argv.includes('--strict');

/** Below this a "walkthrough" is a quiz with extra steps. */
const MIN_STEPS = 4;
/** A fork with two options is a coin toss, not a decision. */
const MIN_OPTIONS = 3;

type Finding = { level: 'error' | 'warn'; rule: string; where: string; detail: string };
const findings: Finding[] = [];
const err = (rule: string, where: string, detail: string) =>
  findings.push({ level: 'error', rule, where, detail });
const warn = (rule: string, where: string, detail: string) =>
  findings.push({ level: 'warn', rule, where, detail });

/** Every question id the content bank knows, including lesson micro-drills. */
function questionIds(subject: string, topic: string): Set<string> {
  const ids = new Set<string>();
  for (const st of getSubTopics(subject, topic)) {
    for (const q of st.questions ?? []) ids.add(q.id);
    for (const step of st.lesson ?? []) if (step.drill) ids.add(step.drill.id);
  }
  for (const q of getQuestions(subject, topic)) ids.add(q.id);
  return ids;
}

function verifyReplay(map: TopicGhostReplays, replay: GhostReplay, bankIds: Set<string>) {
  const where = `${map.subject}:${map.topic}/${replay.id}`;
  const cognition = getCognitionMap(map.subject, map.topic);
  const knownMisconceptions = new Set((cognition?.misconceptions ?? []).map((m) => m.id));

  if (replay.subject !== map.subject || replay.topic !== map.topic) {
    err('replay-registry-mismatch', where, `${replay.subject}:${replay.topic}`);
  }
  if (!getSubTopic(map.subject, map.topic, replay.subTopicId)) {
    err('unknown-subtopic', where, replay.subTopicId);
  }
  if (!bankIds.has(replay.questionId)) {
    err('unknown-question', where, `${replay.questionId} is not in the content bank`);
  }
  if (replay.steps.length < MIN_STEPS) {
    err('too-few-steps', where, `${replay.steps.length} < ${MIN_STEPS}`);
  }

  replay.steps.forEach((step, i) => {
    const at = `${where}#step${i + 1}`;

    if (step.stepNumber !== i + 1) {
      err('step-number-mismatch', at, `stepNumber=${step.stepNumber}, position=${i + 1}`);
    }

    const options = step.commitPrompt.options;
    if (options.length < MIN_OPTIONS) {
      err('too-few-options', at, `${options.length} < ${MIN_OPTIONS}`);
    }

    const ids = new Set<string>();
    for (const o of options) {
      if (ids.has(o.id)) err('duplicate-option-id', at, o.id);
      ids.add(o.id);
      if (o.mistakeCategory && !knownMisconceptions.has(o.mistakeCategory)) {
        err('unknown-mistake-category', at, `${o.id} → ${o.mistakeCategory}`);
      }
      if (o.isCorrect && o.mistakeCategory) {
        err('mistake-category-on-correct', at, `${o.id} is correct but names a misconception`);
      }
    }

    const correct = options.filter((o) => o.isCorrect);
    if (correct.length !== 1) {
      err('correct-option-count', at, `${correct.length} options marked correct, expected exactly 1`);
    }

    // --- branches ---
    const byOption = new Map<string, number>();
    for (const b of step.branches) {
      byOption.set(b.optionId, (byOption.get(b.optionId) ?? 0) + 1);
      if (!ids.has(b.optionId)) {
        err('branch-unknown-option', at, b.optionId);
        continue;
      }
      const option = options.find((o) => o.id === b.optionId)!;
      // THE one. A branch on the right answer would walk a student who
      // reasoned correctly through why their reasoning fails.
      if (option.isCorrect) {
        err('branch-on-correct-option', at, `${b.optionId} IS the correct option`);
      }
      if (!b.whyItFails.trim() || !b.backOnTrack.trim()) {
        err('branch-empty', at, `${b.optionId} is missing whyItFails or backOnTrack`);
      }
    }
    for (const [optionId, n] of byOption) {
      if (n > 1) err('duplicate-branch', at, `${optionId} has ${n} branches`);
    }
    for (const o of options) {
      if (!o.isCorrect && !byOption.has(o.id)) {
        // A dead end: the student picks it and the walkthrough has nothing to say.
        err('missing-branch', at, `wrong option ${o.id} has no failure branch`);
      }
    }

    if (!step.reveal.trim()) err('empty-reveal', at, 'a step must resolve to something');
    if (!step.coreLogic.trim()) err('empty-core-logic', at, 'a step must explain its own why');
  });

  const trapped = replay.steps.filter((s) => s.examinerTrap).length;
  if (trapped === 0) {
    warn('no-examiner-traps', where, 'no step flags a matriculation pitfall');
  }
  if (trapped === replay.steps.length) {
    warn('all-steps-trapped', where, 'a red flag on every step is a red flag on none');
  }
}

function main() {
  const maps = ghostEntries();
  console.log(`verify-ghost — ${maps.length} topic(s)\n`);

  const rows: string[][] = [['topic', 'sub-topic', 'replay', 'steps', 'forks', 'branches', 'traps']];

  for (const map of maps) {
    const bankIds = questionIds(map.subject, map.topic);
    const seen = new Set<string>();
    for (const replay of map.replays) {
      if (seen.has(replay.id)) err('duplicate-replay-id', map.topic, replay.id);
      seen.add(replay.id);
      verifyReplay(map, replay, bankIds);
      rows.push([
        map.topic,
        replay.subTopicId,
        replay.id,
        String(replay.steps.length),
        String(replay.steps.reduce((n, s) => n + s.commitPrompt.options.length, 0)),
        String(replay.steps.reduce((n, s) => n + s.branches.length, 0)),
        String(replay.steps.filter((s) => s.examinerTrap).length),
      ]);
    }

    // Coverage: which sub-topics still have no walkthrough. This is the worklist.
    const covered = new Set(map.replays.map((r) => r.subTopicId));
    for (const st of getSubTopics(map.subject, map.topic)) {
      if (!covered.has(st.id)) {
        warn('subtopic-uncovered', `${map.subject}:${map.topic}`, `${st.id} has no ghost replay yet`);
      }
    }
  }

  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const [n, r] of rows.entries()) {
    console.log('  ' + r.map((c, i) => c.padEnd(widths[i])).join('  '));
    if (n === 0) console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '));
  }
  console.log('');

  const errors = findings.filter((f) => f.level === 'error');
  const warns = findings.filter((f) => f.level === 'warn');
  for (const f of [...errors, ...warns]) {
    console.log(`${f.level === 'error' ? 'ERROR' : 'warn '}  ${f.rule.padEnd(28)} ${f.where}  ${f.detail}`);
  }

  console.log(`\n${errors.length} error(s), ${warns.length} warning(s)`);
  console.log(
    'NOTE: structure only. Whether the maths is right, and whether a distractor is\n' +
      '      a mistake a real student makes, still has to be re-derived by hand.',
  );

  if (errors.length > 0 || (STRICT && warns.length > 0)) process.exit(1);
}

main();
