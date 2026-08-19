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
import { getSubTopics, hasBagrutBank } from '@/content/lessons';
import type { BagrutPaper } from '@/content/bagrut-curriculum';
import { TRACK_571 } from './paper-571';
import type { TrackTree, TrackTopic } from './types';

export type { TrackGroup, TrackTile, TrackTopic, TrackTree } from './types';

const SUBJECT = 'math5';

/** Whole LESSON topics the owner keeps off a paper's track (2026-08-18), even
 *  though the curriculum lists them for it: אלגברה is not 571 exam material,
 *  and the functions / plane-trigonometry foundations are not 572 material.
 *  The lessons stay authored and reachable elsewhere (quiz, formulas, search);
 *  only the study track skips them. The 571 track is authored by hand and no
 *  longer contains אלגברה; the derived 572 track filters here. */
export const EXCLUDED_TOPICS: Record<BagrutPaper, readonly string[]> = {
  '571': ['אלגברה'],
  '572': ['פונקציות', 'טריגונומטריה'],
};

/** 571 sub-topics intentionally absent from the authored track (verify-tracks
 *  fails on any OTHER 571 sub-topic that the track does not reach).
 *  `sequences-applications` (ריבית ונסיגה): the owner's סדרות structure
 *  (2026-08-19) is two groups of four stages and does not include an interest
 *  module; recursion moved into ar-recursion-sums. The module stays authored
 *  (lesson page, quiz, cognition, ghost) — only the track skips it. */
export const EXCLUDED_571: readonly string[] = ['volume-revolution', 'sequences-applications'];

/** Every sub-topic a paper's track leaves out on purpose — the sub-topic list
 *  above plus every sub-topic of the excluded topics. verify-tracks treats
 *  anything else the curriculum authored for the paper as a stranded ladder. */
export function excludedFor(paper: BagrutPaper): readonly string[] {
  return [
    ...(paper === '571' ? EXCLUDED_571 : []),
    ...EXCLUDED_TOPICS[paper].flatMap((topic) => getSubTopics(SUBJECT, topic).map((st) => st.id)),
  ];
}

function derivedTrack(paper: BagrutPaper): TrackTree {
  const excluded = new Set(excludedFor(paper));
  const skipTopics = new Set(EXCLUDED_TOPICS[paper]);
  const topics: TrackTopic[] = buildRoadmap(paper)
    .mainTopics.filter((mt) => !skipTopics.has(mt.topic))
    .map((mt) => ({
    id: mt.topic,
    title: mt.displayName,
    emoji: mt.emoji,
    tiles: [
      ...mt.nodes.filter((n) => !excluded.has(n.subId)).map((n) => ({ kind: 'ladder' as const, subId: n.subId })),
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
