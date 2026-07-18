/**
 * roadmap.ts — types for the personalized learning roadmap (מסלול למידה אישי).
 *
 * The roadmap is a navigation + progress layer over the EXISTING lesson
 * content: a 4-level tree (variant → main topics → sub-topic milestones →
 * 4 steps) whose nodes are derived from `content/lessons` sub-topics.
 */

import type { BagrutPaper } from '@/content/bagrut-curriculum';

/** Visual + gating state of a roadmap node. */
export type StepStatus = 'LOCKED' | 'UNLOCKED' | 'COMPLETED';

/** The 4 sequential steps inside a sub-topic (the lesson-viewer tabs). */
export type RoadmapTabKind = 'theory' | 'formulas' | 'example' | 'quiz';

/** A single milestone in the roadmap = one lesson sub-topic. */
export type RoadmapNode = {
  /** Owning topic key (e.g. "מספרים מרוכבים"). */
  topic: string;
  /** Sub-topic id (unique across 582 — used as the /roadmap/[lessonId] slug). */
  subId: string;
  title: string;
  emoji?: string;
  tagline: string;
  /** 0-based position within its topic (drives the sequential unlock). */
  indexInTopic: number;
};

/** A main topic section = one questionnaire topic with its sub-topic nodes. */
export type RoadmapMainTopic = {
  topic: string;
  displayName: string;
  emoji: string;
  nodes: RoadmapNode[];
};

/** The whole roadmap for one questionnaire variant (currently 582 only). */
export type RoadmapVariant = {
  paper: BagrutPaper;
  label: string;
  mainTopics: RoadmapMainTopic[];
};
