/**
 * concept-adapt.ts — ConceptQuestion → PracticeQuestion.
 *
 * The concept-quiz bank (240 questions across 3 levels) is the app's only
 * question supply that is indexed by TOPIC rather than by sub-topic, which makes
 * it the natural overflow pool when a single sub-topic's bank runs dry. Every
 * consumer of a question in this app — QuestionRunnerCard, the daily review,
 * the fix path — speaks `PracticeQuestion`, so the conversion lives here once
 * instead of in each of them.
 *
 * The mapping is lossy in exactly one place and it is worth naming: a
 * ConceptQuestion carries a single `why_correct` paragraph where a lesson-bank
 * question carries an authored `solution.steps[]`. So a converted question shows
 * ONE solution step. That is why lib/remediation/supply.ts treats this bank as
 * the LAST tier — after a mistake the stepped solution is most of the value.
 *
 * `LEVEL_DIFFICULTY` (1/2/3 → easy/mid/hard) is the existing bridge between the
 * two difficulty vocabularies and is deliberately reused rather than redefined —
 * it is the identity of the migration that introduced `level`, so answer history
 * stays comparable.
 */

import {
  LEVEL_DIFFICULTY,
  getConceptQuestions,
  type ConceptQuestion,
} from '@/content/concept-quiz';
import type { PracticeQuestion } from '@/content/lessons/types';

export function conceptToPractice(q: ConceptQuestion): PracticeQuestion {
  const correct = q.answers[q.correct] ?? '';
  return {
    id: q.id,
    difficulty: LEVEL_DIFFICULTY[q.level],
    kind: 'mcq',
    question: q.question,
    answers: q.answers,
    correct: q.correct,
    // '' is the authored placeholder at the correct index — normalise it to
    // undefined so a caller testing truthiness and a caller testing `!== ''`
    // reach the same conclusion.
    distractorNotes: q.distractorNotes?.map((n) => (n && n.trim() ? n : undefined)),
    hint: q.hint,
    solution: {
      steps: [q.explanation.why_correct],
      finalAnswer: correct,
      explanation: q.explanation.remember || q.explanation.concept || q.explanation.why_wrong,
    },
  };
}

/** All of a topic's concept questions, already in PracticeQuestion shape. */
export function conceptPracticeQuestions(subject: string, topic: string): PracticeQuestion[] {
  return getConceptQuestions(subject, topic).map(conceptToPractice);
}

/** One concept question by id, or null. Used to resolve a stored pointer. */
export function findConceptQuestion(
  subject: string,
  topic: string,
  questionId: string,
): PracticeQuestion | null {
  const q = getConceptQuestions(subject, topic).find((c) => c.id === questionId);
  return q ? conceptToPractice(q) : null;
}
