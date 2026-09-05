/**
 * ghost/machine.ts — the Ghost Replay state machine.
 *
 * Pure: no React, no storage, no clock. Every transition takes a state and
 * returns a new one, so the whole walkthrough can be replayed in a test the
 * same way the app runs it (see scripts/test-ghost.ts).
 *
 * WHY THE RULE LIVES HERE AND NOT IN THE COMPONENT
 * "Commit-First" is the entire product idea: you cannot see the next step
 * until you have taken a position on it. If that rule lived in JSX it would be
 * one careless `setStepIndex` away from being bypassed, and the feature would
 * quietly become the worked solution it exists to replace. So `advance` simply
 * refuses to move while the student hasn't committed, and the component has no
 * other way to change steps.
 *
 * The phases:
 *   thinking   the commit prompt is open; nothing below it is rendered
 *   branching  they picked a trap — walking down their own wrong road
 *   revealed   the real step is on screen
 *   done       past the last step
 */

import type { GhostBranch, GhostOption, GhostReplay, GhostReplayStep } from '@/content/ghost-replay/types';

export type GhostPhase = 'thinking' | 'branching' | 'revealed' | 'done';

export type GhostCommit = {
  optionId: string;
  correct: boolean;
};

export type GhostState = {
  /** 0-based index into `replay.steps`. */
  stepIndex: number;
  phase: GhostPhase;
  /** The commit a step SETTLED on — set only once the step stops accepting
   *  further tries (a correct pick, or the last allowed wrong one). */
  commits: Record<number, GhostCommit>;
  /** Wrong option ids already tried on each step, in order. Those options stay
   *  on screen marked ✗ and are not offered again. */
  wrongPicks: Record<number, string[]>;
  /** How many steps were answered correctly ON THE FIRST TRY. Drives the rung's
   *  stars — retries deliberately do NOT earn it back. */
  firstTryCorrect: number;
};

/**
 * Wrong tries a student gets on one step before the answer is shown.
 *
 * Owner, 2026-09-05: "ברמת חשיבה במשולשים חופפים אני רוצה שתיתן כמה ניסיונות
 * לענות את התשובה הנכונה ולא שישר יתן את התשובה." This used to be a single
 * shot — one wrong pick painted the correct option emerald immediately.
 *
 * Capped at `options.length - 1` as well, so the last remaining option is never
 * "guess the only one left": on a 3-option step the reveal comes after 2 wrong
 * tries, not 3. `firstTryCorrect` is unchanged by any of this, so the stars
 * still measure what they always measured.
 */
export const GHOST_MAX_TRIES = 3;

export function maxTries(step: GhostReplayStep): number {
  return Math.max(1, Math.min(GHOST_MAX_TRIES, step.commitPrompt.options.length - 1));
}

export function initGhost(): GhostState {
  return { stepIndex: 0, phase: 'thinking', commits: {}, wrongPicks: {}, firstTryCorrect: 0 };
}

/** Wrong options already tried on the CURRENT step. */
export function wrongPicksNow(state: GhostState): string[] {
  return state.wrongPicks[state.stepIndex] ?? [];
}

/** Wrong tries still available on the current step (0 once it has settled). */
export function triesLeft(state: GhostState, replay: GhostReplay): number {
  const step = currentStep(state, replay);
  if (!step || state.commits[state.stepIndex]) return 0;
  return Math.max(0, maxTries(step) - wrongPicksNow(state).length);
}

export function currentStep(state: GhostState, replay: GhostReplay): GhostReplayStep | null {
  return replay.steps[state.stepIndex] ?? null;
}

export function optionById(step: GhostReplayStep, optionId: string): GhostOption | null {
  return step.commitPrompt.options.find((o) => o.id === optionId) ?? null;
}

/** The branch for the option the student picked, when they picked a wrong one. */
export function activeBranch(state: GhostState, replay: GhostReplay): GhostBranch | null {
  const step = currentStep(state, replay);
  const commit = state.commits[state.stepIndex];
  if (!step || !commit || commit.correct) return null;
  return step.branches.find((b) => b.optionId === commit.optionId) ?? null;
}

/**
 * Take a position. Legal only while `thinking`; an unknown option id, or one
 * already tried and found wrong, is ignored rather than throwing (the UI can
 * only offer live ids, but a stale render must not crash a student's session).
 *
 * A wrong pick with tries left keeps the step OPEN: it is recorded in
 * `wrongPicks`, the phase stays `thinking`, and nothing below the prompt
 * renders. Only a correct pick, or the last allowed wrong one, settles the step
 * into `commits` and opens the branch/reveal.
 */
export function commit(state: GhostState, replay: GhostReplay, optionId: string): GhostState {
  if (state.phase !== 'thinking') return state;
  const step = currentStep(state, replay);
  if (!step) return state;
  const option = optionById(step, optionId);
  if (!option) return state;

  const already = wrongPicksNow(state);
  if (already.includes(optionId)) return state;

  if (!option.isCorrect && already.length + 1 < maxTries(step)) {
    return {
      ...state,
      wrongPicks: { ...state.wrongPicks, [state.stepIndex]: [...already, optionId] },
    };
  }

  // A wrong option with no authored branch would land in `branching` with
  // nothing to render and nothing to click — options locked, no acknowledge
  // button, no advance. A hard dead end. verify-ghost makes that content
  // impossible, but the machine should not depend on the gate to stay
  // unstuck, so a missing branch simply skips straight to the reveal.
  const hasBranch =
    option.isCorrect || step.branches.some((b) => b.optionId === optionId);

  return {
    ...state,
    phase: hasBranch && !option.isCorrect ? 'branching' : 'revealed',
    commits: { ...state.commits, [state.stepIndex]: { optionId, correct: option.isCorrect } },
    wrongPicks: option.isCorrect
      ? state.wrongPicks
      : { ...state.wrongPicks, [state.stepIndex]: [...already, optionId] },
    // FIRST try only: a student who got there on try 2 has learned something,
    // but the stars measure the first position they took, exactly as before.
    firstTryCorrect: state.firstTryCorrect + (option.isCorrect && already.length === 0 ? 1 : 0),
  };
}

/** Read the failure branch, then see what the step really was. */
export function acknowledgeBranch(state: GhostState): GhostState {
  if (state.phase !== 'branching') return state;
  return { ...state, phase: 'revealed' };
}

/**
 * Move to the next step. THE gate: only reachable from `revealed`, which can
 * only be reached by committing. From `thinking` and `branching` this is a
 * no-op by design.
 */
export function advance(state: GhostState, replay: GhostReplay): GhostState {
  if (state.phase !== 'revealed') return state;
  const isLast = state.stepIndex >= replay.steps.length - 1;
  if (isLast) return { ...state, phase: 'done' };
  return { ...state, stepIndex: state.stepIndex + 1, phase: 'thinking' };
}

/** Can the student see anything beyond the prompt right now? */
export function isRevealed(state: GhostState): boolean {
  return state.phase === 'revealed' || state.phase === 'done';
}

export function isComplete(state: GhostState): boolean {
  return state.phase === 'done';
}

export type GhostProgress = {
  /** 1-based, for display. */
  stepNumber: number;
  totalSteps: number;
  /** 0..1 — counts a step as done once it has been committed. */
  ratio: number;
  score: number;
  total: number;
};

export function progress(state: GhostState, replay: GhostReplay): GhostProgress {
  const total = replay.steps.length;
  const answered = Object.keys(state.commits).length;
  return {
    stepNumber: Math.min(state.stepIndex + 1, total),
    totalSteps: total,
    ratio: total > 0 ? answered / total : 0,
    score: state.firstTryCorrect,
    total,
  };
}
