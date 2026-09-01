/**
 * assignment-progress.ts — how far a student got on a task his teacher gave.
 *
 * Both sides of the feature count this, from the same answer log:
 *   the teacher, server-side, over learning_state.results
 *   the student, in his own browser, over lib/results
 *
 * It lives here because they must never disagree. Two four-line filters, one
 * over snake_case database rows and one over camelCase client events, is
 * exactly the shape of bug that shows a teacher 3/5 and the student 4/5 with
 * nothing on either screen to suggest one of them is wrong.
 *
 * The rule: an answer counts when it is in the assignment's topic (and its
 * sub-topic, when the task named one) and was given AFTER the task was. Work
 * the student did before being told to do it is not work he did for the task.
 */

export type CountableAnswer = {
  topic?: string;
  ts?: number;
  subTopicId?: string;
  correct?: boolean;
};

export type CountableAssignment = {
  topic: string;
  subTopicId?: string | null;
  /** ISO timestamp — when the teacher gave the task. */
  createdAt: string;
};

export function assignmentProgress(
  answers: CountableAnswer[],
  assignment: CountableAssignment
): { answered: number; correct: number } {
  const givenAt = Date.parse(assignment.createdAt);
  // An unparseable timestamp would make `ts >= NaN` false for every answer and
  // silently pin the counter at 0. Counting from 0 instead is the honest
  // failure: it over-counts visibly rather than under-counting invisibly.
  const from = Number.isFinite(givenAt) ? givenAt : 0;

  const hits = answers.filter(
    (a) =>
      a.topic === assignment.topic &&
      typeof a.ts === 'number' &&
      a.ts >= from &&
      (!assignment.subTopicId || a.subTopicId === assignment.subTopicId)
  );

  return { answered: hits.length, correct: hits.filter((a) => a.correct).length };
}
