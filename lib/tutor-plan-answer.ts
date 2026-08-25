/**
 * tutor-plan-answer.ts — "על מה כדאי לעבוד עכשיו", answered from the plan the
 * app already built.
 *
 * ============================================================
 * WHY THIS ONE IS WORTH A LAYER
 * ============================================================
 * It is the only phrasing that appeared TWICE in the live trace, and it came
 * back `missing_question_context` — the student was on /roadmap with nothing
 * focused, asking the one question a tutor should obviously be able to answer.
 *
 * Paying a model for it is also the worst kind of paying: the model does not
 * know this student, so it answers with generic advice, while `buildTodayPlan`
 * has their actual results, their actual mistakes and their actual target and
 * is what /my-plan renders. A tutor that gives worse advice than the screen
 * next door is not a tutor.
 *
 * ============================================================
 * WHEN IT MUST STAY QUIET
 * ============================================================
 * ⚠️ NOT when a question is on screen. "מה לעשות עכשיו" in front of an exercise
 * means THIS exercise, and answering it with a study plan is a fluent reply to
 * something nobody asked — the same failure the whole compiler is arranged to
 * avoid. `what_to_do_here` owns that case and is grounded in the question.
 *
 * And not when the plan is empty. A student who has answered nothing yet has
 * no weak topics, and inventing a recommendation from no data is exactly what
 * this layer exists to replace.
 */

import { buildTodayPlan } from '@/lib/daily-plan-client';

/**
 * Asking what to study — not what to do in this exercise.
 *
 * The verbs are about a session or a subject ("לעבוד", "לתרגל", "להתמקד",
 * "להתחיל"), never about a step. "מה עושים כאן" is deliberately absent.
 */
const PLAN_ASK =
  /(?:על\s*מה|במה|מה)\s*(?:כדאי|עדיף|צריך|רצוי|הכי\s*כדאי)?\s*(?:לי\s*)?(?:לעבוד|לתרגל|להתמקד|ללמוד|לחזור|להשקיע)|מאיפה\s*(?:כדאי\s*)?(?:להתחיל|לפתוח)\s*(?:ללמוד|לתרגל)?|מה\s*(?:התוכנית|התכנית)\s*שלי|מה\s*חסר\s*לי|במה\s*אני\s*חלש/;

/**
 * The pattern alone, for the test.
 *
 * Exported because the decision worth guarding is "is this about the session or
 * about the exercise", and testing it through `planAnswer` would mean stubbing
 * localStorage to reach it — which tests the stub.
 */
export const PLAN_ASK_FOR_TEST = PLAN_ASK;

/**
 * The tutor's answer to "what should I work on", or null.
 *
 * `hasQuestion` is the caller's answer to "is there an exercise on screen".
 * Passing true silences this layer entirely, which is the intended behaviour
 * and not a fallback.
 */
export function planAnswer(message: string, hasQuestion: boolean): string | null {
  if (hasQuestion) return null;
  if (!PLAN_ASK.test(message.trim())) return null;

  let plan: ReturnType<typeof buildTodayPlan> = null;
  try {
    plan = buildTodayPlan();
  } catch {
    // localStorage blocked, a half-written record, anything: the model is a
    // fine outcome and a broken tutor is not.
    return null;
  }
  if (!plan || plan.tasks.length === 0) return null;

  // Three at most. A list of eight is a plan nobody starts.
  const tasks = plan.tasks.slice(0, 3);
  const lines = tasks
    .map((t, i) => `${i + 1}. **${t.title}** — ${t.why} (${t.minutes} דקות)`)
    .join('\n');

  const head = plan.goal.headline
    ? `${plan.goal.headline}\n\nלפי זה, מה שהכי שווה לך עכשיו:`
    : 'לפי מה שפתרת עד עכשיו, זה מה שהכי שווה לך:';

  return `${head}\n\n${lines}\n\nרוצה שנתחיל מהראשון?`;
}
