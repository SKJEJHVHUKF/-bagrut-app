/**
 * מתכונות לפי רמת קושי
 * =====================
 *
 * The archive (`content/past-bagruyot`) answers "what did the 2024 exam ask?".
 * This bank answers a different question: "give me a bagrut-shaped question at
 * MY level, right now." Same topic, three rungs:
 *
 *   1 — קצת יותר קל מרמת בגרות: the exam's structure, fewer moving parts.
 *   2 — רמת בגרות סטנדרטית:    what a real paper asks, in a real paper's wording.
 *   3 — שאלת אתגר:              one step above the exam.
 *
 * `parts` is `BagrutQuestionPart` verbatim, so <BagrutQuestionBlock> renders a
 * מתכונת with the same deterministic answer-checking, escalating hints and
 * grounded tutor as every other bagrut-level question in the app. This adds a
 * new way to FIND a question, not a new practice surface.
 */

import type { BagrutQuestionPart } from '../lessons/types';

/** The axis the student picks on. 1 = below bagrut, 2 = bagrut, 3 = above. */
export type MitkonetLevel = 1 | 2 | 3;

export type MitkonetQuestion = {
  /** `mitk-<topic slug>-<level>-<nn>`, e.g. 'mitk-prob-1-01'. */
  id: string;
  level: MitkonetLevel;
  /** Topic key — matches the Hebrew topic names in content/lessons/math5. */
  topic: string;
  /** Headline for the browse card: what the question is ABOUT. A student
   *  scanning the list decides from this line alone, so it names the scenario
   *  ("נורות פגומות משתי מכונות"), never the question number. */
  title: string;
  /** Which שאלון family this question belongs to. */
  paper: '571' | '572';
  /** Realistic solving time, in minutes — the honest answer to "do I have
   *  time for this before class?". */
  minutes: number;
  /** Points, on the bagrut's own scale. */
  points: number;
  /** The techniques this question exercises. Shown as chips before the student
   *  opens it, so the list is browsable by what you want to practise. */
  skills: string[];
  /** Shared givens for all parts. */
  context: string;
  parts: BagrutQuestionPart[];
};
