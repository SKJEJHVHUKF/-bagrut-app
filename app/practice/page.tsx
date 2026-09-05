import { redirect } from 'next/navigation';

/**
 * /practice — retired. It was the topic picker, from before מסלול הלמידה.
 *
 * The journey is the picker now: it shows the same topics in the syllabus
 * order, with what is done and what is next, which is everything this screen
 * offered and the ordering it did not. Nothing in the app has linked here since
 * the link sweep (scripts/verify-retired-links.ts keeps it that way), so what
 * arrives is a bookmark, an old message to a student, or a browser's memory of
 * a URL — and each of those deserves the live screen rather than a museum.
 *
 * ⚠️ Its CHILD route /practice/<subject>/<topic>/exercise is NOT retired: the
 * mixed bagrut run and the quick quiz are the roadmap's own gate stations at
 * the end of a topic. A redirect declared on a parent page does not affect a
 * child route, which is exactly why this is a page-level redirect and not a
 * pattern in next.config.
 */
export default function RetiredPracticeHub() {
  redirect('/roadmap');
}
