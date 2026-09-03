/**
 * track.ts — pure helpers that turn a study track (content/tracks) into the
 * shapes the existing roadmap machinery already understands, so progress,
 * resume, pacing and unlocking keep working unchanged over the new tree.
 *
 *   TrackTile ('ladder')  →  RoadmapNode   (topic = the LESSON topic that owns
 *                                            the progress record, never the
 *                                            track topic — a track topic can
 *                                            chain sub-topics from several
 *                                            lessons)
 *   TrackTopic            →  RoadmapMainTopic (for getResumePoint / computePacing)
 *
 * Nothing here reads localStorage except through lib/roadmap-progress.
 */

import { getTrack, TRACK_PAPERS, type TrackGroup, type TrackTile, type TrackTopic, type TrackTree } from '@/content/tracks';
import { resolveRoadmapNode } from '@/constants/roadmapData';
import { getSubTopic, getSubTopics } from '@/content/lessons';
import { buildSubTopicLevels, type RoadmapLevel } from '@/lib/roadmap-levels';
import { nodeStatus } from '@/lib/roadmap-progress';
import type { BagrutPaper } from '@/content/bagrut-curriculum';
import type { RoadmapMainTopic, RoadmapNode, StepStatus } from '@/types/roadmap';

const SUBJECT = 'math5';

export type LadderTile = Extract<TrackTile, { kind: 'ladder' }>;
export type SoonTile = Extract<TrackTile, { kind: 'soon' }>;
export type LinkTile = Extract<TrackTile, { kind: 'link' }>;

const isLadder = (t: TrackTile): t is LadderTile => t.kind === 'ladder';

/** One rendered row of a track topic — a ladder tile resolved against the
 *  lesson content, or a soon/link tile as-is. Ladder tiles whose sub-topic
 *  does not exist are dropped here (verify-tracks turns that into a build
 *  failure). `step` counts inside the tile's group (1…n per group, and 1…n
 *  for the ungrouped tiles), so each sub-track reads "שלב 1 … שלב 4". */
export type TrackEntry =
  | { kind: 'ladder'; tile: LadderTile; node: RoadmapNode; step: number; group?: string }
  | { kind: 'soon'; tile: SoonTile; step: number; group?: string }
  | { kind: 'link'; tile: LinkTile; step: number; group?: string };

/** Resolve a ladder tile → the roadmap node it opens (null if the id is unknown). */
export function trackNode(tile: LadderTile, indexInTopic = 0): RoadmapNode | null {
  const r = resolveRoadmapNode(tile.subId);
  if (!r) return null;
  return {
    topic: r.topic,
    subId: tile.subId,
    title: tile.title ?? r.node.title,
    emoji: r.node.emoji,
    tagline: r.node.tagline,
    indexInTopic,
  };
}

export function trackEntries(topic: TrackTopic): TrackEntry[] {
  const out: TrackEntry[] = [];
  let ladderIndex = 0;
  // Step numbers restart per group ('' = the ungrouped tiles).
  const stepIn: Record<string, number> = {};
  for (const tile of topic.tiles) {
    const key = tile.group ?? '';
    const step = (stepIn[key] = (stepIn[key] ?? 0) + 1);
    if (tile.kind === 'ladder') {
      const node = trackNode(tile, ladderIndex);
      if (!node) continue;
      out.push({ kind: 'ladder', tile, node, step, group: tile.group });
      ladderIndex++;
    } else if (tile.kind === 'soon') {
      out.push({ kind: 'soon', tile, step, group: tile.group });
    } else {
      out.push({ kind: 'link', tile, step, group: tile.group });
    }
  }
  return out;
}

/** The topic's groups, or null when it has none. */
export function topicGroups(topic: TrackTopic): TrackGroup[] | null {
  return topic.groups && topic.groups.length > 0 ? topic.groups : null;
}

/** The ladder nodes of one track topic, in order. */
export function topicNodes(topic: TrackTopic): RoadmapNode[] {
  return trackEntries(topic).flatMap((e) => (e.kind === 'ladder' ? [e.node] : []));
}

/** Adapter for getResumePoint / computePacing, which walk `mainTopics[].nodes`. */
export function trackMainTopics(tree: TrackTree): RoadmapMainTopic[] {
  return tree.topics.map((t) => ({
    topic: t.id,
    displayName: t.title,
    emoji: t.emoji,
    nodes: topicNodes(t),
  }));
}

/** Every distinct sub-topic the track reaches (a `review` tile repeats a
 *  sub-topic climbed elsewhere — count its progress once). */
export function trackNodes(tree: TrackTree): RoadmapNode[] {
  const seen = new Set<string>();
  const out: RoadmapNode[] = [];
  for (const t of tree.topics) {
    for (const n of topicNodes(t)) {
      if (seen.has(n.subId)) continue;
      seen.add(n.subId);
      out.push(n);
    }
  }
  return out;
}

/** Levels per sub-topic — pure, content-derived. */
export function levelsForNodes(nodes: RoadmapNode[]): Record<string, RoadmapLevel[]> {
  const map: Record<string, RoadmapLevel[]> = {};
  for (const n of nodes) {
    if (map[n.subId]) continue;
    const st = getSubTopic(SUBJECT, n.topic, n.subId);
    map[n.subId] = st ? buildSubTopicLevels(SUBJECT, n.topic, st) : [];
  }
  return map;
}

export function trackLevelsBySub(tree: TrackTree): Record<string, RoadmapLevel[]> {
  return levelsForNodes(trackNodes(tree));
}

/** Tile status inside a track topic — COMPLETED or UNLOCKED, never LOCKED
 *  (every tile is open; see nodeStatus). */
export function trackTileStatus(node: RoadmapNode): StepStatus {
  return nodeStatus(node.topic, node.subId);
}

// ---------------------------------------------------------------------------
// Ladder-page context: which track topic did the student come from?
// ---------------------------------------------------------------------------

/** `?ctx=571:probability` on /roadmap/[subId] — keeps "back" and "next" inside
 *  the topic the student was browsing (a sub-topic can appear in two topics). */
export function ctxParam(paper: BagrutPaper, topicId: string): string {
  return `${paper}:${topicId}`;
}

export function parseCtx(raw: string | null | undefined): { paper: BagrutPaper; topicId: string } | null {
  if (!raw) return null;
  const i = raw.indexOf(':');
  if (i < 0) return null;
  const paper = raw.slice(0, i);
  const topicId = raw.slice(i + 1);
  if ((paper !== '571' && paper !== '572') || !topicId) return null;
  return { paper, topicId };
}

export function ladderHref(subId: string, ctx?: { paper: BagrutPaper; topicId: string } | null, level?: string): string {
  const params = new URLSearchParams();
  if (ctx) params.set('ctx', ctxParam(ctx.paper, ctx.topicId));
  if (level) params.set('level', level);
  const q = params.toString();
  return `/roadmap/${encodeURIComponent(subId)}${q ? `?${q}` : ''}`;
}

/**
 * Where a SUB-TOPIC opens from anywhere in the app: its ladder, with the track
 * context when it sits on a track (82 of 95 do — ctx only adds the back link
 * and the next station, so the null fallback is complete). `preferPaper` is
 * the student's own שאלון, tried first so a 572 student is not sent into 571.
 *
 * This replaced the retired `/practice/<subject>/<topic>/sub/<id>/practice`
 * links (2026-09-04) — the owner: that screen is "long out of use".
 */
export function subTopicHref(subId: string, level?: string, preferPaper?: BagrutPaper | null): string {
  for (const paper of papersFirst(preferPaper)) {
    const loc = locateInTrack(paper, subId);
    if (loc) return ladderHref(subId, { paper, topicId: loc.topic.id }, level);
  }
  return ladderHref(subId, null, level);
}

/**
 * Where a lesson TOPIC (its Hebrew title) opens: the track's topic page, else
 * — for the five lesson topics that predate the tracks — the ladder of its
 * first sub-topic, so the student starts practising instead of choosing.
 * Matched on title, never id: 571 uses English ids and 572 Hebrew ones.
 */
export function topicHref(topic: string, preferPaper?: BagrutPaper | null): string {
  for (const paper of papersFirst(preferPaper)) {
    const t = getTrack(paper).topics.find((x) => x.title === topic);
    if (t) return `/roadmap/track/${paper}/${encodeURIComponent(t.id)}`;
  }
  const first = getSubTopics(SUBJECT, topic)[0];
  return first ? subTopicHref(first.id, undefined, preferPaper) : '/roadmap';
}

function papersFirst(prefer?: BagrutPaper | null): BagrutPaper[] {
  return prefer ? [prefer, ...TRACK_PAPERS.filter((p) => p !== prefer)] : [...TRACK_PAPERS];
}

export type TrackLocation = {
  paper: BagrutPaper;
  topic: TrackTopic;
  /** The sub-track (group) the ladder sits in, if the topic has groups. */
  group: TrackGroup | null;
  prevSubId: string | null;
  nextSubId: string | null;
  nextTitle: string | null;
  /** The topic page: /roadmap/track/{paper}/{topic.id}[?group={group.id}] —
   *  "back" from a ladder returns to the same sub-track. */
  topicHref: string;
};

/** Where does `subId` sit in the track for `paper`? Prefers the topic named by
 *  the ctx param, then the first non-review appearance, then any appearance.
 *  prev/next skip soon/link tiles — they are the neighbouring LADDERS, and
 *  they stay inside the ladder's own group (a sub-track has its own stages;
 *  the last stage of סדרות חשבוניות does not flow into סדרות הנדסיות). */
export function locateInTrack(paper: BagrutPaper, subId: string, ctxTopicId?: string | null): TrackLocation | null {
  const tree = getTrack(paper);
  const holds = (t: TrackTopic) => t.tiles.some((tl) => isLadder(tl) && tl.subId === subId);
  const candidates = tree.topics.filter(holds);
  if (candidates.length === 0) return null;
  const topic =
    (ctxTopicId ? candidates.find((t) => t.id === ctxTopicId) : undefined) ??
    candidates.find((t) => t.tiles.some((tl) => isLadder(tl) && tl.subId === subId && !tl.review)) ??
    candidates[0];
  const mine = topic.tiles.find((tl) => isLadder(tl) && tl.subId === subId) as LadderTile;
  const groupId = mine.group;
  const group = (groupId && topic.groups?.find((g) => g.id === groupId)) || null;
  const ladders = topic.tiles.filter((tl): tl is LadderTile => isLadder(tl) && (tl.group ?? '') === (groupId ?? ''));
  const idx = ladders.findIndex((tl) => tl.subId === subId);
  const prev = idx > 0 ? ladders[idx - 1] : null;
  const next = idx >= 0 && idx < ladders.length - 1 ? ladders[idx + 1] : null;
  return {
    paper,
    topic,
    group,
    prevSubId: prev?.subId ?? null,
    nextSubId: next?.subId ?? null,
    nextTitle: next ? (next.title ?? resolveRoadmapNode(next.subId)?.node.title ?? null) : null,
    topicHref: `/roadmap/track/${paper}/${encodeURIComponent(topic.id)}${group ? `?group=${encodeURIComponent(group.id)}` : ''}`,
  };
}
