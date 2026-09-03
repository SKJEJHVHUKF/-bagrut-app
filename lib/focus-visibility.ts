/**
 * focus-visibility.ts — which of a class's focuses belong to ONE student.
 *
 * ⚠️ WHY THIS IS TYPESCRIPT AND NOT A ROW-LEVEL SECURITY POLICY
 *
 * It was a policy ("own focus select" in supabase-school.sql), and the policy
 * could never be true. Its first clause asked whether the reader is in the
 * class:
 *
 *     exists (select 1 from public.class_members m
 *              where m.class_id = focus.class_id and m.user_id = auth.uid())
 *
 * A subquery inside a policy runs with the READER's own privileges, so row
 * security on `class_members` applies to it too — and `class_members` has RLS
 * enabled with no policies at all, on purpose, so that no student can read his
 * classmates. The subquery therefore returned nothing for every student, the
 * `exists` was false for every row, and the student saw an empty list while the
 * teacher saw a task he had definitely sent. Proven on the real database with a
 * throwaway student: 0 focus rows, 0 class_members rows.
 *
 * The second clause had the mirror-image bug. `not exists (… focus_targets …)`
 * means "this one is for the whole class", but `focus_targets` is also
 * policy-less, so that subquery was empty too and the clause was ALWAYS true —
 * a focus aimed at one struggling student would have been shown to all thirty.
 *
 * So the rule lives here, next to the guard that already decides who sees what
 * (lib/school-guard.ts), and runs on the service-role client that can actually
 * read both tables. It is a pure function over rows so it can be tested without
 * a database — `npm run test:school`.
 */

/** The columns the student's screen needs, and nothing more. No `class_id`,
 *  no `created_by`: the student is not shown who else is in the task. */
export type StudentFocusRow = {
  id: string;
  topic: string;
  sub_topic_id: string | null;
  rung: string | null;
  target_count: number | null;
  due_on: string | null;
  note: string | null;
  created_at: string;
  /** Where tapping it opens — always inside the roadmap. Resolved on the
   *  server (lib/focus-target focusHref), because working it out needs the
   *  authored corpus and this row is rendered in the browser. */
  href: string;
};

/** Focuses older than this stop being shown. A task from three months ago is
 *  not a task any more, and a list that only grows is a list nobody reads. */
export const FOCUS_MAX_AGE_DAYS = 45;

/** At most this many on the screen, newest first. */
export const FOCUS_LIMIT = 20;

/**
 * Keep the focuses this student should see.
 *
 * `targets` is every row of focus_targets for the given focuses — the whole
 * list, not the student's own. That is the point: telling "aimed at nobody in
 * particular" apart from "aimed at someone else" is impossible from a filtered
 * view, which is the second reason this cannot be a policy.
 *
 * Empty target list for a focus = the whole class. That is the common case and
 * it costs zero rows.
 */
export function visibleFocus<T extends { id: string }>(
  focuses: T[],
  targets: { focus_id: string; student_id: string }[],
  studentId: string
): T[] {
  const aimed = new Set<string>();
  const mine = new Set<string>();
  for (const t of targets) {
    aimed.add(t.focus_id);
    if (t.student_id === studentId) mine.add(t.focus_id);
  }
  return focuses.filter((f) => !aimed.has(f.id) || mine.has(f.id));
}
