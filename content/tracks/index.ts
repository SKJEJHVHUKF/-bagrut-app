/**
 * content/tracks/index.ts — one accessor: `getTrack(paper)`.
 *
 * 571 is authored (paper-571.ts, from the owner's syllabus). 572 has no
 * syllabus document yet, so its track is DERIVED from the lesson content in
 * curriculum order — one topic per lesson topic, one tile per sub-topic, plus
 * the topic's mixed-bagrut practice link. When the 572 document arrives, add
 * paper-572.ts and route it here; nothing else changes.
 */

import { buildRoadmap } from '@/constants/roadmapData';
import { hasBagrutBank } from '@/content/lessons';
import type { BagrutPaper } from '@/content/bagrut-curriculum';
import { TRACK_571 } from './paper-571';
import type { TrackTree, TrackTopic } from './types';

export type { TrackTile, TrackTopic, TrackTree } from './types';

const SUBJECT = 'math5';

/** 571 sub-topics intentionally absent from the authored track (verify-tracks
 *  fails on any OTHER 571 sub-topic that the track does not reach). */
export const EXCLUDED_571: readonly string[] = ['volume-revolution'];

function derivedTrack(paper: BagrutPaper): TrackTree {
  const topics: TrackTopic[] = buildRoadmap(paper).mainTopics.map((mt) => ({
    id: mt.topic,
    title: mt.displayName,
    emoji: mt.emoji,
    tiles: [
      ...mt.nodes.map((n) => ({ kind: 'ladder' as const, subId: n.subId })),
      ...(hasBagrutBank(SUBJECT, mt.topic)
        ? [
            {
              kind: 'link' as const,
              title: 'תרגול בגרות מלאה על כל הנושא',
              href: `/practice/${SUBJECT}/${encodeURIComponent(mt.topic)}/exercise?mode=bagrut`,
              emoji: '🎓',
            },
          ]
        : []),
    ],
  }));
  return { paper, topics };
}

let cache572: TrackTree | null = null;

export function getTrack(paper: BagrutPaper): TrackTree {
  if (paper === '571') return TRACK_571;
  // Content is static, so derive once per process.
  return (cache572 ??= derivedTrack('572'));
}

export const TRACK_PAPERS: readonly BagrutPaper[] = ['571', '572'];

export function isTrackPaper(raw: unknown): raw is BagrutPaper {
  return raw === '571' || raw === '572';
}
