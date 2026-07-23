/**
 * roadmapData.ts — the roadmap tree, per ACTIVE questionnaire (581 or 582).
 *
 * DERIVED from existing content — it never duplicates lesson material. The
 * ordered list of main topics comes from the curriculum for the active paper
 * (INCLUDING the shared 581/582 foundations — functions / trig / calculus —
 * via `topicsForActivePaper`); each topic's nodes come from its authored
 * `subTopics` (array order = roadmap order).
 */

import { getSubTopics, hasSubTopics } from '@/content/lessons';
import {
  topicsForActivePaper,
  getTopicMapping,
  paperLabel,
  MATH5_CURRICULUM,
  type BagrutPaper,
} from '@/content/bagrut-curriculum';
import type { RoadmapVariant, RoadmapMainTopic, RoadmapNode } from '@/types/roadmap';

const SUBJECT = 'math5';

/** Fallback paper when the student has no plan yet. */
export const DEFAULT_PAPER: BagrutPaper = '582';

/**
 * Topics for `paper` that have guided sub-topic content, in curriculum order.
 * `topicsForActivePaper` includes the shared foundations (functions / trig /
 * חדו"א) via `alsoIn` and already drops the out-of-scope statistics topic; we
 * additionally require authored `subTopics`.
 */
export function roadmapTopicOrder(paper: BagrutPaper): string[] {
  return topicsForActivePaper(paper)
    .filter((t) => hasSubTopics(SUBJECT, t.key))
    .map((t) => t.key);
}

/** Build the full roadmap tree for a paper from the current content. */
export function buildRoadmap(paper: BagrutPaper): RoadmapVariant {
  const mainTopics: RoadmapMainTopic[] = roadmapTopicOrder(paper).map((topic) => {
    const mapping = getTopicMapping(topic);
    const nodes: RoadmapNode[] = getSubTopics(SUBJECT, topic).map((st, i) => ({
      topic,
      subId: st.id,
      title: st.title,
      emoji: st.emoji,
      tagline: st.tagline,
      indexInTopic: i,
    }));
    return {
      topic,
      displayName: mapping?.displayName ?? topic,
      emoji: mapping?.emoji ?? '📘',
      nodes,
    };
  });

  return { paper, label: paperLabel(paper), mainTopics };
}

/** Flat list of every node for a paper (for overall-progress counts). */
export function allRoadmapNodes(paper: BagrutPaper): RoadmapNode[] {
  return buildRoadmap(paper).mainTopics.flatMap((mt) => mt.nodes);
}

/** Every math5 topic that has sub-topics (paper-independent). */
function allTopicsWithSubTopics(): string[] {
  return MATH5_CURRICULUM.filter((t) => hasSubTopics(SUBJECT, t.key)).map((t) => t.key);
}

/**
 * Resolve a sub-topic id → owning topic + node + within-topic prev/next.
 * PAPER-INDEPENDENT: a topic's sub-topic order is the same for both papers, so
 * the lesson page can resolve any sub-topic the student navigates to (including
 * shared-foundation topics) without knowing the active paper.
 */
export function resolveRoadmapNode(
  subId: string
): { topic: string; node: RoadmapNode; prevSubId: string | null; nextSubId: string | null } | null {
  for (const topic of allTopicsWithSubTopics()) {
    const subs = getSubTopics(SUBJECT, topic);
    const idx = subs.findIndex((s) => s.id === subId);
    if (idx >= 0) {
      const st = subs[idx];
      return {
        topic,
        node: {
          topic,
          subId: st.id,
          title: st.title,
          emoji: st.emoji,
          tagline: st.tagline,
          indexInTopic: idx,
        },
        prevSubId: idx > 0 ? subs[idx - 1].id : null,
        nextSubId: idx < subs.length - 1 ? subs[idx + 1].id : null,
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backward-compat shims — some callers still reference the 582-specific names.
// ---------------------------------------------------------------------------
export function buildRoadmap582(): RoadmapVariant {
  return buildRoadmap('582');
}
export function allRoadmap582Nodes(): RoadmapNode[] {
  return allRoadmapNodes('582');
}
export function paper582TopicOrder(): string[] {
  return roadmapTopicOrder('582');
}
