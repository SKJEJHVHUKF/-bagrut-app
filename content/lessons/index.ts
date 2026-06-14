import type { Lesson, PracticeQuestion, StaticBagrutQuestion, SubTopic } from './types';
import { math5Algebra } from './math5/algebra';
import { math5Functions } from './math5/functions';
import { math5Derivatives } from './math5/derivatives';
import { math5Integrals } from './math5/integrals';
import { math5Trigonometry } from './math5/trigonometry';
import { math5Sequences } from './math5/sequences';
import { math5Probability } from './math5/probability';
import { math5AnalyticGeometry } from './math5/analytic-geometry';
import { math5Vectors } from './math5/vectors';
import { math5ComplexNumbers } from './math5/complex-numbers';
import { math5Statistics } from './math5/statistics';
import { math5ExpFunctions } from './math5/exp-functions';
import { math5GrowthDecay } from './math5/growth-decay';
import { math5LnFunction } from './math5/ln-function';
import { math5EuclideanGeometry } from './math5/euclidean-geometry';

// Lessons are keyed by `${subject}:${topic}`. The topic string must match
// the topic name shown in the /practice picker exactly.
const LESSONS: Record<string, Lesson> = {
  'math5:אלגברה': math5Algebra,
  'math5:גיאומטריה אוקלידית': math5EuclideanGeometry,
  'math5:פונקציות': math5Functions,
  'math5:חשבון דיפרנציאלי': math5Derivatives,
  'math5:חשבון אינטגרלי': math5Integrals,
  'math5:טריגונומטריה': math5Trigonometry,
  'math5:פונקציה מעריכית': math5ExpFunctions,
  'math5:גדילה ודעיכה': math5GrowthDecay,
  'math5:פונקציית ln': math5LnFunction,
  'math5:סדרות': math5Sequences,
  'math5:הסתברות': math5Probability,
  'math5:גאומטריה אנליטית': math5AnalyticGeometry,
  'math5:וקטורים במרחב': math5Vectors,
  'math5:מספרים מרוכבים': math5ComplexNumbers,
  'math5:סטטיסטיקה': math5Statistics,
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

// ============================================================
// SubTopic accessors — pedagogical modules inside a lesson.
// ============================================================

/** All sub-topics for a lesson (may be empty array). */
export function getSubTopics(subject: string, topic: string): SubTopic[] {
  return getLesson(subject, topic)?.subTopics ?? [];
}

/** True iff the topic has at least one defined sub-topic module. */
export function hasSubTopics(subject: string, topic: string): boolean {
  return (getLesson(subject, topic)?.subTopics?.length ?? 0) > 0;
}

/** Look up a specific sub-topic by its slug. */
export function getSubTopic(
  subject: string,
  topic: string,
  subId: string,
): SubTopic | null {
  const list = getLesson(subject, topic)?.subTopics ?? [];
  return list.find((s) => s.id === subId) ?? null;
}

/** The sub-topic that follows `subId` in order, or null if it's the last
 *  (or unknown). Used to offer "continue to the next sub-topic". */
export function getNextSubTopic(
  subject: string,
  topic: string,
  subId: string,
): { id: string; title: string } | null {
  const list = getLesson(subject, topic)?.subTopics ?? [];
  const idx = list.findIndex((s) => s.id === subId);
  if (idx === -1 || idx + 1 >= list.length) return null;
  const next = list[idx + 1];
  return { id: next.id, title: next.title };
}

/** Bagrut questions tagged for a specific sub-topic — its bagrut-level
 *  practice (the top of the escalation inside the sub-topic module).
 *  Excludes capstone/mixed questions. */
export function getBagrutQuestionsForSubTopic(
  subject: string,
  topic: string,
  subId: string,
): StaticBagrutQuestion[] {
  return (getLesson(subject, topic)?.bagrutQuestions ?? []).filter(
    (q) => q.subTopicId === subId,
  );
}

/** Mixed, multi-sub-topic bagrut questions — the topic's end-of-unit
 *  capstone, shown after the per-sub-topic modules. */
export function getCapstoneBagrutQuestions(
  subject: string,
  topic: string,
): StaticBagrutQuestion[] {
  return (getLesson(subject, topic)?.bagrutQuestions ?? []).filter(
    (q) => q.subTopicId === 'capstone',
  );
}
