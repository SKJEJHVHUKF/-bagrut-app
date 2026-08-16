// ============================================================
// Ghost Replay registry.
// ============================================================
//
// Keyed `${subject}:${topic}`, like content/cognition and content/concept-quiz.
// math4 shares math5's Hebrew topic names and not always byte-for-byte
// (`גיאומטריה אוקלידית` vs `גאומטריה אוקלידית`), so a flat merge would serve
// 5-unit material to a 4-unit student. Same key shape, same reason.
//
// Adding a topic = one import + one entry.

import type { GhostReplay, TopicGhostReplays } from './types';
import { complexNumbersGhostReplays } from './math5/complex-numbers';
import { vectorsGhostReplays } from './math5/vectors';
import { analyticGeometryGhostReplays } from './math5/analytic-geometry';
import { trigonometryGhostReplays } from './math5/trigonometry';
import { derivativesGhostReplays } from './math5/derivatives';
import { sequencesGhostReplays } from './math5/sequences';
import { lnFunctionGhostReplays } from './math5/ln-function';
import { integralsGhostReplays } from './math5/integrals';
import { expFunctionsGhostReplays } from './math5/exp-functions';
import { functionsGhostReplays } from './math5/functions';
import { euclideanGeometryGhostReplays } from './math5/euclidean-geometry';
import { algebraGhostReplays } from './math5/algebra';

const REGISTRY: Record<string, TopicGhostReplays> = {
  'math5:מספרים מרוכבים': complexNumbersGhostReplays,
  'math5:וקטורים במרחב': vectorsGhostReplays,
  'math5:גאומטריה אנליטית': analyticGeometryGhostReplays,
  'math5:טריגונומטריה': trigonometryGhostReplays,
  'math5:חשבון דיפרנציאלי': derivativesGhostReplays,
  'math5:סדרות': sequencesGhostReplays,
  'math5:פונקציית ln': lnFunctionGhostReplays,
  'math5:חשבון אינטגרלי': integralsGhostReplays,
  'math5:פונקציה מעריכית': expFunctionsGhostReplays,
  'math5:פונקציות': functionsGhostReplays,
  'math5:גיאומטריה אוקלידית': euclideanGeometryGhostReplays,
  'math5:אלגברה': algebraGhostReplays,
};

function key(subject: string, topic: string): string {
  return `${subject}:${topic}`;
}

/** Every replay authored for a topic (empty when none). */
export function getGhostReplays(subject: string, topic: string): GhostReplay[] {
  return REGISTRY[key(subject, topic)]?.replays ?? [];
}

/**
 * The replays that belong to one sub-topic. This is what decides whether the
 * ladder grows a 🧠 rung: a sub-topic with no replay simply doesn't get one,
 * exactly like the bagrut rung.
 */
export function getGhostReplaysForSubTopic(
  subject: string,
  topic: string,
  subTopicId: string,
): GhostReplay[] {
  return getGhostReplays(subject, topic).filter((r) => r.subTopicId === subTopicId);
}

export function hasGhostReplay(subject: string, topic: string, subTopicId: string): boolean {
  return getGhostReplaysForSubTopic(subject, topic, subTopicId).length > 0;
}

/** Every authored topic — used by scripts/verify-ghost.ts. */
export function ghostEntries(): TopicGhostReplays[] {
  return Object.values(REGISTRY);
}

export type {
  GhostReplay,
  GhostReplayStep,
  GhostOption,
  GhostBranch,
  TopicGhostReplays,
} from './types';
