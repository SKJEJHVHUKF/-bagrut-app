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
  /** One commit per step index. A step is answered exactly once — committing
   *  is a position, not an attempt, so there is no retry to game. */
  commits: Record<number, GhostCommit>;
  /** How many steps were committed correctly. Drives the rung's stars. */
  firstTryCorrect: number;
};

export function initGhost(): GhostState {
  return { stepIndex: 0, phase: 'thinking', commits: {}, firstTryCorrect: 0 };
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
 * Take a position. Legal only while `thinking`; committing twice is a no-op,
 * and an unknown option id is ignored rather than throwing (the UI can only
 * offer real ids, but a stale render must not crash a student's session).
 */
export function commit(state: GhostState, replay: GhostReplay, optionId: string): GhostState {
  if (state.phase !== 'thinking') return state;
  const step = currentStep(state, replay);
  if (!step) return state;
  const option = optionById(step, optionId);
  if (!option) return state;

  return {
    ...state,
    phase: option.isCorrect ? 'revealed' : 'branching',
    commits: { ...state.commits, [state.stepIndex]: { optionId, correct: option.isCorrect } },
    firstTryCorrect: state.firstTryCorrect + (option.isCorrect ? 1 : 0),
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
