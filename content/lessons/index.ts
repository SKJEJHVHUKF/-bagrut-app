import type { Lesson } from './types';
import { math5Algebra } from './math5/algebra';

// Lessons are keyed by `${subject}:${topic}`. The topic string must match
// the topic name shown in the /practice picker exactly.
const LESSONS: Record<string, Lesson> = {
  'math5:אלגברה': math5Algebra,
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
