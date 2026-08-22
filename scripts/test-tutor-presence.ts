/**
 * test-tutor-presence.ts — the focus registry's four load-bearing behaviours.
 *   npx tsx scripts/test-tutor-presence.ts
 *
 * WHY THIS IS WORTH A TEST WHEN SO LITTLE ELSE HERE IS
 * Every screen publishes what the student is looking at, and the tutor answers
 * from whatever wins. If the wrong claim wins, the tutor confidently discusses
 * a question the student is not on — which is indistinguishable, from the
 * student's side, from the tutor being broken.
 *
 * Case 2 is the regression that motivated the file. Publishers used to share
 * one registry key, so a parent and the question card nested inside it were the
 * SAME entry: whichever unmounted first deleted the focus for both, and the
 * survivor kept publishing into a slot it thought it owned. SubTopicLadder
 * carried a hand-written yield to dodge it. Distinct keys + priority removed
 * the choreography; this asserts it stays removed.
 */
import {
  publishTutorFocus,
  getTutorFocus,
  FOCUS_PRIORITY,
  type TutorFocus,
} from '@/lib/tutor-presence';

let failed = 0;
function check(name: string, got: unknown, want: unknown) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${ok ? '' : `\n         got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
}

const focus = (where: string): TutorFocus => ({ where });
const clearAll = () =>
  ['lesson', 'question', 'other'].forEach((id) => publishTutorFocus(id, null));

// 1. specificity wins, not publish order — a lesson published AFTER the
//    question card must not displace it. Parent effects commit last in React,
//    so this is the ordinary case, not the exotic one.
publishTutorFocus('question', focus('the question'), FOCUS_PRIORITY.question);
publishTutorFocus('lesson', focus('the lesson'), FOCUS_PRIORITY.lesson);
check('question outranks a lesson published after it', getTutorFocus()?.where, 'the question');

// 2. THE REGRESSION: withdrawing one publisher leaves the others intact.
publishTutorFocus('lesson', null);
check('withdrawing the lesson does not clear the question', getTutorFocus()?.where, 'the question');

// 3. withdrawing the winner falls back to the next-highest, not to null.
publishTutorFocus('lesson', focus('the lesson'), FOCUS_PRIORITY.lesson);
publishTutorFocus('question', null);
check('withdrawing the winner falls back to the lesson', getTutorFocus()?.where, 'the lesson');

// 4. re-publishing the same id replaces its entry instead of accumulating —
//    every publisher re-publishes on each render of its effect.
publishTutorFocus('lesson', focus('the lesson, updated'), FOCUS_PRIORITY.lesson);
check('re-publishing one id replaces it', getTutorFocus()?.where, 'the lesson, updated');

// 5. EQUAL priority: the most recently published entry wins. Two parts of one
//    bagrut question both publish at question level; the tutor must follow the
//    part the student touched LAST, not the one that mounted first — and an
//    older id that re-publishes becomes the most recent again.
publishTutorFocus('question', focus('part a'), FOCUS_PRIORITY.question);
publishTutorFocus('other', focus('part b'), FOCUS_PRIORITY.question);
check('among equal priorities the later publisher wins', getTutorFocus()?.where, 'part b');
publishTutorFocus('question', focus('part a, touched again'), FOCUS_PRIORITY.question);
check('re-publishing an older id makes it the most recent', getTutorFocus()?.where, 'part a, touched again');
publishTutorFocus('lesson', focus('the lesson'), FOCUS_PRIORITY.lesson);
check('a lower priority published last still loses', getTutorFocus()?.where, 'part a, touched again');

clearAll();
check('withdrawing everything leaves no focus', getTutorFocus(), null);

console.log(failed ? `\n${failed} failure(s)` : '\nall good');
process.exit(failed ? 1 : 0);
