// Registry of learning paths ("לימוד מ-0"), keyed by `${subject}:${topic}`.
//
// Mirrors content/lessons/index.ts so the two systems resolve identically.
// A topic may have a legacy Lesson, a LearningPath, or both during the
// migration. The /learn route reads from here; the legacy /practice route
// keeps reading from content/lessons.

import type { LearningPath } from './types';
import { math5ComplexNumbers } from './math5/complex-numbers';
import { math5ExpFunctions } from './math5/exp-functions';
import { math5AnalyticGeometry } from './math5/analytic-geometry';

const PATHS: Record<string, LearningPath> = {
  'math5:מספרים מרוכבים': math5ComplexNumbers,
  'math5:פונקציה מעריכית': math5ExpFunctions,
  'math5:גאומטריה אנליטית': math5AnalyticGeometry,
};

/** Look up a learning path by subject + topic. Null if none exists yet. */
export function getLearningPath(subject: string, topic: string): LearningPath | null {
  return PATHS[`${subject}:${topic}`] ?? null;
}

/** True iff a full learning path exists for this topic. */
export function hasLearningPath(subject: string, topic: string): boolean {
  return `${subject}:${topic}` in PATHS;
}

/** All (subject, topic) pairs that currently have a learning path. */
export function allLearningPathKeys(): { subject: string; topic: string }[] {
  return Object.keys(PATHS).map((k) => {
    const [subject, topic] = k.split(':');
    return { subject, topic };
  });
}
