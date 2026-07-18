/**
 * roadmapData.ts — the roadmap tree for questionnaire 582.
 *
 * DERIVED from existing content — it never duplicates lesson material. The
 * ordered list of main topics comes from the curriculum; each topic's nodes
 * come from its authored `subTopics` (their array order = the roadmap order).
 */

import { getSubTopics, hasSubTopics } from '@/content/lessons';
import { topicsByPaper, getTopicMapping } from '@/content/bagrut-curriculum';
import type { RoadmapVariant, RoadmapMainTopic, RoadmapNode } from '@/types/roadmap';

const SUBJECT = 'math5';

/**
 * The core 582 topics that have guided sub-topic content, in curriculum
 * order. `topicsByPaper('582')` is the strict primary-582 list (it excludes
 * the shared 581 foundations), and we drop the out-of-scope statistics topic
 * and anything without sub-topics.
 */
export function paper582TopicOrder(): string[] {
  return topicsByPaper('582')
    .filter((t) => t.weight !== 'out-of-scope' && hasSubTopics(SUBJECT, t.key))
    .map((t) => t.key);
}

/** Build the full 582 roadmap tree from the current content. */
export function buildRoadmap582(): RoadmapVariant {
  const mainTopics: RoadmapMainTopic[] = paper582TopicOrder().map((topic) => {
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

  return { paper: '582', label: 'שאלון 582 · כיתה יב', mainTopics };
}

/** Flat list of every 582 node (for overall-progress counts). */
export function allRoadmap582Nodes(): RoadmapNode[] {
  return buildRoadmap582().mainTopics.flatMap((mt) => mt.nodes);
}

/** Resolve a sub-topic id → its owning topic + node (for /roadmap/[lessonId]). */
export function resolveRoadmapNode(
  subId: string
): { topic: string; node: RoadmapNode; prevSubId: string | null; nextSubId: string | null } | null {
  const rm = buildRoadmap582();
  for (const mt of rm.mainTopics) {
    const idx = mt.nodes.findIndex((n) => n.subId === subId);
    if (idx >= 0) {
      return {
        topic: mt.topic,
        node: mt.nodes[idx],
        prevSubId: idx > 0 ? mt.nodes[idx - 1].subId : null,
        nextSubId: idx < mt.nodes.length - 1 ? mt.nodes[idx + 1].subId : null,
      };
    }
  }
  return null;
}
