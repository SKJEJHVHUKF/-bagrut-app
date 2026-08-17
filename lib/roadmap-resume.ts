/**
 * roadmap-resume.ts — "continue where you left off". Walks the roadmap in order
 * and finds the single most useful place to send the student next, so a 40-node
 * map never feels like a wall. Pure read over the progress store (client-side).
 *
 * Priority:
 *   1. the first UNLOCKED-but-not-core-done node → its next rung (the main climb)
 *   2. else the first not-yet-mastered node → its next rung (optional mastery)
 *   3. else null (everything is mastered).
 *
 * Due spaced-repetition reviews (Phase 3) take precedence over all of this and
 * are surfaced separately by the review card, not here.
 */

import { nodeStatus, nodeLevelSummary } from '@/lib/roadmap-progress';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { RoadmapLevelKind } from '@/lib/roadmap-levels';
import type { RoadmapNode } from '@/types/roadmap';

export type ResumeReason = 'in-progress' | 'next-up' | 'mastery' | 'fresh-start';

export type ResumePoint = {
  topic: string;
  subId: string;
  title: string;
  emoji?: string;
  levelKind: RoadmapLevelKind;
  levelTitle: string;
  levelEmoji: string;
  reason: ResumeReason;
  href: string;
  headline: string;
};

type TopicGroup = { topic: string; nodes: RoadmapNode[] };

function makePoint(node: RoadmapNode, level: RoadmapLevel, reason: ResumeReason): ResumePoint {
  const headline =
    reason === 'in-progress'
      ? `ממשיכים: ${node.title}`
      : reason === 'mastery'
        ? `להשלמת שליטה: ${node.title}`
        : reason === 'fresh-start'
          ? `מתחילים: ${node.title}`
          : `הבא בתור: ${node.title}`;
  return {
    topic: node.topic,
    subId: node.subId,
    title: node.title,
    emoji: node.emoji,
    levelKind: level.kind,
    levelTitle: level.title,
    levelEmoji: level.emoji,
    reason,
    href: `/roadmap/${encodeURIComponent(node.subId)}?level=${level.kind}`,
    headline,
  };
}

export function getResumePoint(
  mainTopics: TopicGroup[],
  levelsBySub: Record<string, RoadmapLevel[]>,
): ResumePoint | null {
  // Pass 1 — the first node whose CORE rungs aren't done yet (the main climb).
  let firstNode: { node: RoadmapNode; level: RoadmapLevel } | null = null;
  for (const mt of mainTopics) {
    // The predecessor may belong to a different lesson topic when `mainTopics`
    // is a track (content/tracks) — pass its own topic for the progress lookup.
    let prev: RoadmapNode | null = null;
    for (const node of mt.nodes) {
      const status = nodeStatus(node.topic, node.subId, prev?.subId ?? null, prev?.topic);
      prev = node;
      const levels = levelsBySub[node.subId] ?? [];
      if (levels.length === 0) continue;
      if (!firstNode) firstNode = { node, level: levels[0] };
      if (status === 'UNLOCKED') {
        const summary = nodeLevelSummary(node.topic, node.subId, levels);
        const idx = Math.min(summary.currentIndex, levels.length - 1);
        const level = levels[idx];
        return makePoint(node, level, summary.clearedCount > 0 ? 'in-progress' : 'next-up');
      }
    }
  }

  // Pass 2 — everything core-done; offer the first not-yet-mastered node's next
  // optional rung (hard / bagrut).
  for (const mt of mainTopics) {
    for (const node of mt.nodes) {
      const levels = levelsBySub[node.subId] ?? [];
      if (levels.length === 0) continue;
      const summary = nodeLevelSummary(node.topic, node.subId, levels);
      if (summary.clearedCount < levels.length) {
        const idx = Math.min(summary.currentIndex, levels.length - 1);
        return makePoint(node, levels[idx], 'mastery');
      }
    }
  }

  // Nothing started yet → point at the very first node as a fresh start.
  if (firstNode && !hasAnyProgress(mainTopics, levelsBySub)) {
    return makePoint(firstNode.node, firstNode.level, 'fresh-start');
  }
  return null;
}

function hasAnyProgress(mainTopics: TopicGroup[], levelsBySub: Record<string, RoadmapLevel[]>): boolean {
  for (const mt of mainTopics) {
    for (const node of mt.nodes) {
      const levels = levelsBySub[node.subId] ?? [];
      if (levels.length === 0) continue;
      if (nodeLevelSummary(node.topic, node.subId, levels).clearedCount > 0) return true;
    }
  }
  return false;
}
