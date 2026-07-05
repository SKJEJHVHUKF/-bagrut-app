// Registry of advanced courses ("קורס מתקדם"), keyed by `${subject}:${topic}`.
//
// Mirrors content/learning-paths/index.ts. An advanced course only makes
// sense for a topic that ALSO has a base learning path — the entry gate
// refers students back to it. The /learn/[subject]/[topic]/advanced route
// reads from here.

import type { AdvancedCourse } from './types';
import { math5ComplexNumbersAdvanced } from './math5/complex-numbers';
import { math5ExpFunctionsAdvanced } from './math5/exp-functions';
import { math5LnFunctionAdvanced } from './math5/ln-function';
import { math5AnalyticGeometryAdvanced } from './math5/analytic-geometry';

const COURSES: Record<string, AdvancedCourse> = {
  'math5:מספרים מרוכבים': math5ComplexNumbersAdvanced,
  'math5:פונקציה מעריכית': math5ExpFunctionsAdvanced,
  'math5:פונקציית ln': math5LnFunctionAdvanced,
  'math5:גאומטריה אנליטית': math5AnalyticGeometryAdvanced,
};

/** Look up an advanced course by subject + topic. Null if none exists. */
export function getAdvancedCourse(subject: string, topic: string): AdvancedCourse | null {
  return COURSES[`${subject}:${topic}`] ?? null;
}

/** True iff the topic has an advanced course. */
export function hasAdvancedCourse(subject: string, topic: string): boolean {
  return `${subject}:${topic}` in COURSES;
}

/** All (subject, topic) pairs that currently have an advanced course. */
export function allAdvancedCourseKeys(): { subject: string; topic: string }[] {
  return Object.keys(COURSES).map((k) => {
    const [subject, topic] = k.split(':');
    return { subject, topic };
  });
}
