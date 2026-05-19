import type { Lesson, PracticeQuestion, StaticBagrutQuestion } from './types';
import { math5Algebra } from './math5/algebra';
import { math5Functions } from './math5/functions';
import { math5Derivatives } from './math5/derivatives';
import { math5Integrals } from './math5/integrals';

// Lessons are keyed by `${subject}:${topic}`. The topic string must match
// the topic name shown in the /practice picker exactly.
const LESSONS: Record<string, Lesson> = {
  'math5:אלגברה': math5Algebra,
  'math5:פונקציות': math5Functions,
  'math5:חשבון דיפרנציאלי': math5Derivatives,
  'math5:חשבון אינטגרלי': math5Integrals,
};

export function getLesson(subject: string, topic: string): Lesson | null {
  return LESSONS[`${subject}:${topic}`] ?? null;
}

export function hasLesson(subject: string, topic: string): boolean {
  return `${subject}:${topic}` in LESSONS;
}

export function allLessonKeys(): { subject: string; topic: string }[] {
  return Object.keys(LESSONS).map((k) => {
    const [subject, topic] = k.split(':');
    return { subject, topic };
  });
}

// ============================================================
// Static question-bank accessors
// ============================================================
//
// The quiz + quick-practice flows call these to check whether a topic
// has a pre-written bank. If yes, the UI serves questions instantly
// (no API call). If no, the route falls back to /api/* generation
// during the migration window.

/** All questions for the given subject/topic (may be empty array). */
export function getQuestions(subject: string, topic: string): PracticeQuestion[] {
  return getLesson(subject, topic)?.questions ?? [];
}

/** True iff the topic has a non-empty static question bank. */
export function hasQuestionBank(subject: string, topic: string): boolean {
  return (getLesson(subject, topic)?.questions?.length ?? 0) > 0;
}

/** Static bagrut-style multi-part questions for the topic (may be empty). */
export function getBagrutQuestions(subject: string, topic: string): StaticBagrutQuestion[] {
  return getLesson(subject, topic)?.bagrutQuestions ?? [];
}

/** True iff the topic has at least one static bagrut question. */
export function hasBagrutBank(subject: string, topic: string): boolean {
  return (getLesson(subject, topic)?.bagrutQuestions?.length ?? 0) > 0;
}
