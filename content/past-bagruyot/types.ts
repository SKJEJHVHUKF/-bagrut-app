/**
 * Past Bagrut Questions Repository
 * ================================
 *
 * Real-style bagrut questions from past exams, with full step-by-step
 * solutions. When a student photographs a question or browses the
 * archive, we serve answers from here — no API call needed.
 *
 * Naming convention for question IDs:
 *   `b{year}{season}{paper}-q{number}`
 *   examples: 'b2024s581-q1', 'b2023w582-q3'
 *
 * Adding a new question:
 *   1. Create or open a year-season-paper file under content/past-bagruyot/
 *      (e.g. `2024-summer-581.ts`).
 *   2. Append a PastBagrutQuestion object.
 *   3. Register the file in `content/past-bagruyot/index.ts`.
 *   4. The /bagruyot picker auto-shows it.
 */

import type { DiagramSpec } from '../lessons/types';

export type BagrutSeason = 'summer' | 'winter';
export type BagrutPaper = '581' | '582';
/** מועד הבחינה — 'a' = מועד א', 'b' = מועד ב', 'special' = מועד מיוחד. */
export type BagrutMoed = 'a' | 'b' | 'special';

export type PastBagrutPart = {
  /** Hebrew label of the section. Single sections use 'א', 'ב', 'ג', 'ד';
   *  split sub-questions get their own answerable section labeled 'א1',
   *  'א2', 'ב1' … so each piece has its own answer box + solution. */
  label: string;
  /** The sub-question text (markdown + LaTeX). */
  prompt: string;
  /** Points value of this sub-part (e.g. 8). Optional. */
  points?: number;
  /** Type of expected answer — controls future input widgets. */
  answer_type?: 'number' | 'expression' | 'text' | 'proof';
  /** Progressive hints — from gentle nudge to explicit guidance. 1-3 typical. */
  hints?: string[];
  /** Optional diagrams for this section (geometry figures, function graphs).
   *  Rendered beneath the prompt via <DiagramRenderer>. */
  diagrams?: DiagramSpec[];
  solution: {
    /** Step-by-step solution, one idea per step. */
    steps: string[];
    /** Final answer in succinct form (or "הוכח" for proofs). */
    final_answer: string;
  };
};

export type PastBagrutQuestion = {
  /** Unique identifier — see naming convention above. */
  id: string;
  /** Year of the bagrut session. */
  year: number;
  /** Summer or winter session. */
  season: BagrutSeason;
  /** מועד הבחינה (מועד א'/ב'/מיוחד). Optional for legacy entries; when present
   *  it disambiguates multiple sessions in the same year+season. */
  moed?: BagrutMoed;
  /** Which paper this question is from. */
  paper: BagrutPaper;
  /** Question number within the paper (1-7 typically). */
  questionNumber: number;
  /** Topic key — should match keys in content/bagrut-curriculum.ts when possible. */
  topic: string;
  /** Total point value of the entire question. */
  totalPoints: number;
  /** Shared setup / givens for all sub-parts. */
  context: string;
  /** Optional diagrams shown once for the whole question (beneath the
   *  context) — e.g. the graph of the function being studied. */
  diagrams?: DiagramSpec[];
  /** Ordered sub-questions. */
  parts: PastBagrutPart[];
  /** Provenance of the solution:
   *  - 'official' — from MOE-published solution key
   *  - 'authored' — written by us, verified against an answer
   *  - 'ai-generated' — Claude-generated and reviewed */
  solutionSource: 'official' | 'authored' | 'ai-generated';
};
