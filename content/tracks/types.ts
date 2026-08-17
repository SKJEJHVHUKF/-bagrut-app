/**
 * content/tracks — the STUDY TRACK layer: the order and grouping in which a
 * student walks through a שאלון, as a tree of tiles over the EXISTING lesson
 * content. It never holds lesson material; a `ladder` tile only points at a
 * sub-topic id whose lesson + practice ladder already live in content/lessons.
 *
 * Why a separate layer: the owner's syllabus for 571 (see paper-571.ts) groups
 * the material differently from the lesson files — "פונקציות מנה ושורש" spans
 * three lesson topics, "פונקציות טריגונומטריות" is its own topic, "שאלות קצרות"
 * is an exam section — and the lesson files are edited by other work in
 * parallel. So the track is authored here and the lessons stay untouched.
 */

import type { BagrutPaper } from '@/content/bagrut-curriculum';

export type TrackTile =
  /** Opens the sub-topic's level ladder at /roadmap/{subId}. `title` defaults
   *  to the sub-topic's own title; `bullets` = "מה לומדים" from the syllabus.
   *  `review` marks a repeat appearance of a sub-topic already climbed
   *  elsewhere in the track (the syllabus lists identities again before
   *  trig-function calculus, on purpose). */
  | { kind: 'ladder'; subId: string; title?: string; bullets?: string[]; review?: boolean }
  /** Syllabus item that has no authored content yet — rendered locked, in place,
   *  so the order the owner specified is visible before the content exists. */
  | { kind: 'soon'; title: string; bullets?: string[] }
  /** Anything that already has its own screen (the topic's mixed bagrut
   *  practice, the quick quiz). */
  | { kind: 'link'; title: string; href: string; bullets?: string[]; emoji?: string };

export type TrackTopic = {
  /** URL slug — /roadmap/track/{paper}/{id}. */
  id: string;
  title: string;
  emoji: string;
  /** Optional appendix the syllabus attaches to the topic (a formula list, …). */
  note?: { label: string; href: string };
  tiles: TrackTile[];
};

export type TrackTree = {
  paper: BagrutPaper;
  topics: TrackTopic[];
};
