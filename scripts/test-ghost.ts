/**
 * test-ghost.ts — the Ghost Replay state machine.
 *
 *   npx tsx scripts/test-ghost.ts
 *
 * The machine is pure, so these run with no DOM, no storage and no clock.
 *
 * The first section is the one that matters. "Commit-First" is the entire
 * product idea — you may not see the next step until you have taken a position
 * on it — and if that rule ever softens, the feature silently degrades back
 * into the worked solution it was built to replace. It is tested here, against
 * the machine, rather than trusted to a component.
 */

import {
  acknowledgeBranch,
  activeBranch,
  advance,
  commit,
  currentStep,
  initGhost,
  isComplete,
  isRevealed,
  progress,
  type GhostState,
} from '../lib/ghost/machine';
import { complexNumbersGhostReplays } from '../content/ghost-replay/math5/complex-numbers';
import type { GhostReplay } from '../content/ghost-replay/types';

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

/** A two-step fixture: mechanics are clearer without real content in the way. */
const FIXTURE: GhostReplay = {
  id: 'gr-fixture',
  subject: 'math5',
  topic: 'מספרים מרוכבים',
  subTopicId: 'complex-roots',
  questionId: 'cx-sub-roots-012',
  title: 'fixture',
  prompt: 'fixture',
  closing: 'fixture',
  steps: [
    {
      stepNumber: 1,
      title: 's1',
      coreLogic: 'why1',
      commitPrompt: {
        question: 'q1',
        options: [
          { id: 'a', text: 'right', isCorrect: true },
          { id: 'b', text: 'wrong-b', isCorrect: false },
          { id: 'c', text: 'wrong-c', isCorrect: false },
        ],
      },
      branches: [
        { optionId: 'b', whyItFails: 'fails-b', backOnTrack: 'back-b' },
        { optionId: 'c', whyItFails: 'fails-c', backOnTrack: 'back-c' },
      ],
      reveal: 'reveal1',
    },
    {
      stepNumber: 2,
      title: 's2',
      coreLogic: 'why2',
      commitPrompt: {
        question: 'q2',
        options: [
          { id: 'a', text: 'wrong-a', isCorrect: false },
          { id: 'b', text: 'right', isCorrect: true },
        ],
      },
      branches: [{ optionId: 'a', whyItFails: 'fails-a', backOnTrack: 'back-a' }],
      reveal: 'reveal2',
    },
  ],
};

// ============================================================
section('Commit-First — the rule the product rests on');
// ============================================================

{
  const s0 = initGhost();
  assert(s0.phase === 'thinking', 'a fresh replay starts in `thinking`');
  assert(!isRevealed(s0), 'nothing is revealed before a commit');

  const notMoved = advance(s0, FIXTURE);
  assert(
    notMoved.stepIndex === 0 && notMoved.phase === 'thinking',
    'advance() while thinking is a NO-OP — the step cannot be skipped',
  );
  assert(notMoved === s0 || JSON.stringify(notMoved) === JSON.stringify(s0), 'and it changes nothing at all');

  // Wrong commit → must read the branch before the step opens.
  const wrong = commit(s0, FIXTURE, 'b');
  assert(wrong.phase === 'branching', 'a wrong commit opens the failure branch');
  assert(!isRevealed(wrong), 'the real step is still hidden while branching');
  const blocked = advance(wrong, FIXTURE);
  assert(
    blocked.stepIndex === 0 && blocked.phase === 'branching',
    'advance() while branching is a NO-OP — you do not skip past your own mistake',
  );
}

// ============================================================
section('Committing');
// ============================================================

{
  const s0 = initGhost();

  const right = commit(s0, FIXTURE, 'a');
  assert(right.phase === 'revealed', 'a correct commit reveals the step directly');
  assert(right.firstTryCorrect === 1, 'and scores');
  assert(activeBranch(right, FIXTURE) === null, 'a correct commit has no branch');

  const wrongB = commit(s0, FIXTURE, 'b');
  assert(activeBranch(wrongB, FIXTURE)?.whyItFails === 'fails-b', 'branch matches the option chosen (b)');
  const wrongC = commit(s0, FIXTURE, 'c');
  assert(activeBranch(wrongC, FIXTURE)?.whyItFails === 'fails-c', 'branch matches the option chosen (c)');
  assert(wrongB.firstTryCorrect === 0, 'a wrong commit scores nothing');

  // No retry: a second commit must not overwrite the record or inflate the score.
  const twice = commit(commit(s0, FIXTURE, 'b'), FIXTURE, 'a');
  assert(twice.commits[0].optionId === 'b', 'a second commit does not overwrite the first');
  assert(twice.firstTryCorrect === 0, 'and cannot raise the score after a miss');

  const bogus = commit(s0, FIXTURE, 'zzz');
  assert(JSON.stringify(bogus) === JSON.stringify(s0), 'an unknown option id is ignored, not thrown on');

  // acknowledgeBranch only applies while branching.
  assert(acknowledgeBranch(right).phase === 'revealed', 'acknowledging from `revealed` is a no-op');
  assert(acknowledgeBranch(wrongB).phase === 'revealed', 'acknowledging a branch reveals the step');
}

// ============================================================
section('Walking the whole thing');
// ============================================================

{
  // All correct.
  let s: GhostState = initGhost();
  s = commit(s, FIXTURE, 'a');
  s = advance(s, FIXTURE);
  assert(s.stepIndex === 1 && s.phase === 'thinking', 'advancing moves to the next step, unrevealed');
  s = commit(s, FIXTURE, 'b');
  s = advance(s, FIXTURE);
  assert(isComplete(s), 'advancing past the last step finishes the walkthrough');
  assert(s.firstTryCorrect === 2, 'perfect walk scores every step');

  // All wrong — must still reach the end, because the branches ARE the lesson.
  let t: GhostState = initGhost();
  t = commit(t, FIXTURE, 'b');
  t = acknowledgeBranch(t);
  t = advance(t, FIXTURE);
  t = commit(t, FIXTURE, 'a');
  t = acknowledgeBranch(t);
  t = advance(t, FIXTURE);
  assert(isComplete(t), 'a student who gets everything wrong still completes the walk');
  assert(t.firstTryCorrect === 0, 'and scores zero, which the gateway rung does not punish');

  const p = progress(t, FIXTURE);
  assert(p.ratio === 1 && p.score === 0 && p.total === 2, 'progress reports 100% walked, 0 correct');
}

// ============================================================
section('Determinism');
// ============================================================

{
  const run = () => {
    let s = initGhost();
    s = commit(s, FIXTURE, 'c');
    s = acknowledgeBranch(s);
    s = advance(s, FIXTURE);
    s = commit(s, FIXTURE, 'b');
    return advance(s, FIXTURE);
  };
  assert(JSON.stringify(run()) === JSON.stringify(run()), 'the same sequence always yields the same state');
}

// ============================================================
section('The real authored replay');
// ============================================================

{
  const replay = complexNumbersGhostReplays.replays[0];
  assert(!!replay, 'the complex-numbers replay is registered');
  assert(replay.questionId === 'cx-sub-roots-012', `it targets the intended question (${replay.questionId})`);

  // Walk it end to end taking every WRONG option, which is the path that
  // exercises every branch in the file.
  let s: GhostState = initGhost();
  let branchesSeen = 0;
  for (let i = 0; i < replay.steps.length; i++) {
    const step = currentStep(s, replay)!;
    const wrong = step.commitPrompt.options.find((o) => !o.isCorrect)!;
    s = commit(s, replay, wrong.id);
    const b = activeBranch(s, replay);
    assert(b !== null, `step ${i + 1}: the first wrong option has a branch`);
    assert(
      b?.optionId === wrong.id,
      `step ${i + 1}: the branch belongs to the option chosen`,
    );
    if (b) branchesSeen++;
    s = acknowledgeBranch(s);
    s = advance(s, replay);
  }
  assert(isComplete(s), 'the authored replay completes on the all-wrong path');
  assert(branchesSeen === replay.steps.length, 'every step produced a failure branch');

  // And the all-correct path.
  let g: GhostState = initGhost();
  for (let i = 0; i < replay.steps.length; i++) {
    const step = currentStep(g, replay)!;
    const right = step.commitPrompt.options.find((o) => o.isCorrect)!;
    g = commit(g, replay, right.id);
    assert(activeBranch(g, replay) === null, `step ${i + 1}: a correct commit shows no branch`);
    g = advance(g, replay);
  }
  assert(
    isComplete(g) && g.firstTryCorrect === replay.steps.length,
    'the authored replay completes clean on the all-correct path',
  );
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
