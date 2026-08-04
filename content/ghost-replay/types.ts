// ============================================================
// Ghost Replay — the shape of a guided thinking walkthrough.
// ============================================================
//
// A Ghost Replay is NOT a solution. A solution answers "what is the answer";
// this answers "what was going through the head of someone who could solve
// it" — and it refuses to move on until the student has committed to what
// they think comes next.
//
// The product reason: reading a worked solution feels exactly like learning
// and is not. Every step here is a fork the student has to take a position on
// BEFORE the step is revealed. Choosing a trap walks them down their own wrong
// path until it visibly breaks, and only then steers back.
//
// DATA ONLY — static TypeScript, same as every other content module. There is
// no `questions` table in this project; the whole bank is authored TS, which
// is what keeps it free, instant, and checkable by scripts/verify-*.ts.

import type { MisconceptionId } from '@/content/cognition/types';

export type GhostOption = {
  /** Unique WITHIN the step. Also the key a failure branch is attached to. */
  id: string;
  text: string;
  isCorrect: boolean;
  /**
   * Optional link into the misconception catalog (content/cognition), so a
   * wrong choice here is the SAME named idea the question banks already
   * diagnose. Left undefined for forks that are a strategy choice rather than
   * a misconception ("open it algebraically" is not a wrong belief, just a
   * worse road). verify-ghost rejects an id that isn't in the catalog.
   */
  mistakeCategory?: MisconceptionId;
};

export type GhostBranch = {
  /**
   * Keyed by option id, NOT by mistakeCategory — an option without a
   * misconception still needs somewhere to go, and every option id is
   * guaranteed to exist and be unique. verify-ghost enforces exactly one
   * branch per incorrect option and none for the correct one.
   */
  optionId: string;
  /** Walk them DOWN their own wrong road until it visibly breaks. */
  whyItFails: string;
  /** What this costs in the real exam, when it's worth naming. */
  costInExam?: string;
  /** The steer back onto the right road. */
  backOnTrack: string;
};

export type GhostReplayStep = {
  /** 1-based and contiguous; verify-ghost checks it. */
  stepNumber: number;
  title: string;
  /** The intuition — WHY a solver would even think of this. Not the algebra. */
  coreLogic: string;
  /** A classic matriculation pitfall, rendered as a red flag. */
  examinerTrap?: { warning: string; description: string };
  /** The gate. Nothing past this renders until the student picks. */
  commitPrompt: { question: string; options: GhostOption[] };
  branches: GhostBranch[];
  /** WHAT actually comes out of this step. `coreLogic` is the why; without
   *  this the step never resolves and the student is left hanging. */
  reveal: string;
};

export type GhostReplay = {
  /** e.g. 'gr-cx-roots-012'. Stable — it keys ladder progress. */
  id: string;
  subject: string;
  topic: string;
  subTopicId: string;
  /** The bank question this replays. Must exist; verify-ghost checks it. */
  questionId: string;
  title: string;
  /** The problem restated at the top of the walkthrough. */
  prompt: string;
  steps: GhostReplayStep[];
  /** What to carry away — the transferable pattern, not this answer. */
  closing: string;
};

export type TopicGhostReplays = {
  subject: string;
  topic: string;
  replays: GhostReplay[];
};
