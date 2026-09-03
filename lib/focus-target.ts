/**
 * focus-target.ts — what a teacher is allowed to point at, and proof that it
 * exists.
 *
 * The product decision this file enforces: **the teacher never authors
 * content.** He picks from what is already in the app — a topic, optionally a
 * sub-topic, optionally one rung of its ladder — and that is the entire write.
 * There is no question editor, no upload, no free-text task description.
 *
 * WHY VALIDATION IS NOT OPTIONAL HERE
 * `focus.topic` and `focus.sub_topic_id` are matched as STRINGS against the
 * answers that follow (lib/assignment-progress.ts). A focus naming a topic that
 * does not exist does not fail — it produces a task that can never reach 100%,
 * and the student is the one who looks like he did not do it. So the strings
 * are checked against the real catalogue before they are written, never after.
 *
 * The catalogue is derived from content/lessons, so it cannot drift from what
 * the student is actually served: adding a sub-topic makes it selectable, and
 * deleting one makes it unselectable, with no list to maintain here.
 */

import { allLessonKeys, getSubTopics } from '@/content/lessons';
import { buildSubTopicLevels } from '@/lib/roadmap-levels';
import { getTrack, TRACK_PAPERS } from '@/content/tracks';
import { ladderHref, locateInTrack } from '@/lib/track';
// ⚠️ Re-exported, never re-declared. The rung names live in lib/rungs because
// that file imports NOTHING: a client component that needs the Hebrew labels
// can take them from there without dragging this module — and with it the
// entire authored corpus behind `@/content/lessons` — into the browser bundle.
import { RUNGS, RUNG_LABEL, type Rung } from '@/lib/rungs';

export { RUNGS, RUNG_LABEL };
export type { Rung };

export type CatalogueSubTopic = {
  id: string;
  title: string;
  /** Only the rungs this sub-topic actually has content for. A picker that
   *  offers "אתגר" on a sub-topic with no hard questions sends a class at an
   *  empty screen. */
  rungs: Rung[];
};

export type CatalogueTopic = {
  subject: string;
  topic: string;
  subTopics: CatalogueSubTopic[];
};

export type FocusTarget = {
  topic: string;
  subTopicId: string | null;
  rung: Rung | null;
};

/**
 * Everything a teacher may point at, in the order the app presents it.
 *
 * Built from the content itself on every call. It is a pure read over modules
 * that are already loaded in a server process, and it runs once per picker
 * open — memoising it would trade a real staleness risk (a content deploy
 * serving an old catalogue) for a saving nobody has measured.
 */
export function focusCatalogue(): CatalogueTopic[] {
  const out: CatalogueTopic[] = [];
  for (const { subject, topic } of allLessonKeys()) {
    const subTopics = getSubTopics(subject, topic).map((st) => ({
      id: st.id,
      title: st.title,
      // buildSubTopicLevels skips a tier with no content, so this is the honest
      // list of rungs rather than the theoretical one.
      rungs: buildSubTopicLevels(subject, topic, st).map((l) => l.kind as Rung),
    }));
    out.push({ subject, topic, subTopics });
  }
  return out;
}

/**
 * Check a teacher's selection against the catalogue.
 *
 * Returns the normalised target, or a Hebrew reason it was refused — the reason
 * is shown to the teacher, so it says what to do rather than what failed.
 *
 * A topic with no sub-topics authored yet is still a legal target (the whole
 * topic), which is why `subTopicId` is only checked when one was named.
 */
export function validateFocus(input: {
  topic?: unknown;
  subTopicId?: unknown;
  rung?: unknown;
}): { ok: true; target: FocusTarget } | { ok: false; reason: string } {
  const topic = typeof input.topic === 'string' ? input.topic.trim() : '';
  if (!topic) return { ok: false, reason: 'צריך לבחור נושא' };

  const catalogue = focusCatalogue();
  const entry = catalogue.find((c) => c.topic === topic);
  if (!entry) return { ok: false, reason: `הנושא "${topic}" לא קיים בתוכן` };

  const rawSub = typeof input.subTopicId === 'string' ? input.subTopicId.trim() : '';
  let subTopicId: string | null = null;
  let sub: CatalogueSubTopic | undefined;
  if (rawSub) {
    sub = entry.subTopics.find((s) => s.id === rawSub);
    if (!sub) return { ok: false, reason: `תת-הנושא "${rawSub}" לא קיים ב${topic}` };
    subTopicId = sub.id;
  }

  const rawRung = typeof input.rung === 'string' ? input.rung.trim() : '';
  let rung: Rung | null = null;
  if (rawRung) {
    if (!RUNGS.includes(rawRung as Rung)) {
      return { ok: false, reason: `שלב "${rawRung}" לא קיים` };
    }
    rung = rawRung as Rung;
    // A rung only means something inside a sub-topic — the ladder is per
    // sub-topic, not per topic. Refusing here rather than silently dropping it
    // keeps the teacher's intent visible: he asked for "ביסוס" and would
    // otherwise get the whole topic without being told.
    if (!sub) return { ok: false, reason: 'בחירת שלב דורשת גם תת-נושא' };
    if (!sub.rungs.includes(rung)) {
      return {
        ok: false,
        reason: `אין תוכן בשלב "${RUNG_LABEL[rung]}" ב${sub.title}`,
      };
    }
  }

  return { ok: true, target: { topic, subTopicId, rung } };
}

/** How the focus reads on the student's card and on the teacher's board.
 *  One function so the two can never word it differently. */
export function describeFocus(target: FocusTarget, subTopicTitle?: string | null): string {
  const parts = [target.topic];
  if (subTopicTitle) parts.push(subTopicTitle);
  else if (target.subTopicId) parts.push(target.subTopicId);
  if (target.rung) parts.push(RUNG_LABEL[target.rung]);
  return parts.join(' · ');
}

// ---- where a focus opens ----------------------------------------------------

/**
 * The URL a student lands on when he taps the task his teacher sent.
 *
 * ⚠️ IT MUST BE THE ROADMAP, and this function exists because it was not.
 * The student's card used to build `/practice/math5/<topic>/sub/<id>/practice`,
 * a screen from before the מסלול הלמידה existed. The owner opened his teacher's
 * task on his phone, landed there and said so plainly: that path is not in use
 * any more. Practice lives on the ladder now — `/roadmap/<subId>` — and a task
 * that opens anywhere else is a task that leaves the product.
 *
 * ⚠️ SERVER-SIDE ONLY, like the rest of this file. It reaches the track and the
 * roadmap node registry, which is the authored corpus; a client component that
 * imported this would ship the whole corpus. /api/school/my-classes resolves
 * the href per row and sends the finished string down. (lib/rungs.ts documents
 * the same trap.)
 *
 * Measured over the whole catalogue: all 95 sub-topics resolve to a ladder, and
 * 82 of them also sit on a track, which is the only thing `ctx` adds — the back
 * link and the next station. So the sub-topic case never needs a fallback.
 */
export function focusHref(target: FocusTarget): string {
  if (target.subTopicId) return ladderFor(target.subTopicId, target.rung);

  // A whole-topic task. The track's own topic page is the right screen: it is
  // the journey, with every station in the syllabus order.
  for (const paper of TRACK_PAPERS) {
    const topic = getTrack(paper).topics.find((t) => t.title === target.topic);
    if (topic) return `/roadmap/track/${paper}/${encodeURIComponent(topic.id)}`;
  }

  // Five of the fifteen lesson topics (אלגברה, פונקציות, סטטיסטיקה…) predate the
  // 571/572 tracks and have no page of their own. The first station of the topic
  // beats a list of exam papers: the student starts practising instead of
  // choosing. Nothing at all only if the topic is empty, which validateFocus
  // already refuses.
  const key = allLessonKeys().find((k) => k.topic === target.topic);
  const first = key ? getSubTopics(key.subject, key.topic)[0] : undefined;
  return first ? ladderFor(first.id, null) : '/roadmap';
}

/** `/roadmap/<subId>?ctx=<paper|topicId>&level=<rung>` — the ladder, opened on
 *  the rung the teacher chose, with the track context when there is one. */
function ladderFor(subId: string, rung: Rung | null): string {
  for (const paper of TRACK_PAPERS) {
    const loc = locateInTrack(paper, subId);
    if (loc) return ladderHref(subId, { paper, topicId: loc.topic.id }, rung ?? undefined);
  }
  return ladderHref(subId, null, rung ?? undefined);
}
