// ============================================================
// Cognition catalog registry.
// ============================================================
//
// Keyed `${subject}:${topic}`, NOT by topic alone — math4 shares math5's Hebrew
// topic names and not always byte-for-byte (`גיאומטריה אוקלידית` vs
// `גאומטריה אוקלידית`, one character apart). content/concept-quiz/index.ts hit
// exactly that trap; a flat merge there would have served 5-unit questions to a
// 4-unit student. Same key shape here, same reason.
//
// Adding a topic = one import + one entry. Everything downstream is generic.

import type { Misconception, Skill, SkillId, TopicCognitionMap } from './types';
import { complexNumbersCognition } from './math5/complex-numbers';

const REGISTRY: Record<string, TopicCognitionMap> = {
  'math5:מספרים מרוכבים': complexNumbersCognition,
};

function key(subject: string, topic: string): string {
  return `${subject}:${topic}`;
}

/** The catalog for a topic, or null when none has been authored yet. */
export function getCognitionMap(subject: string, topic: string): TopicCognitionMap | null {
  return REGISTRY[key(subject, topic)] ?? null;
}

/** True iff this topic has a cognition catalog (gates the whole feature). */
export function hasCognitionMap(subject: string, topic: string): boolean {
  return key(subject, topic) in REGISTRY;
}

/** Every authored catalog — used by scripts/verify-cognition.ts. */
export function cognitionEntries(): TopicCognitionMap[] {
  return Object.values(REGISTRY);
}

// ---- convenience lookups over a single map ----

export function skillById(map: TopicCognitionMap, id: SkillId): Skill | null {
  return map.skills.find((s) => s.id === id) ?? null;
}

/** Skills taught in a given sub-topic, in catalog order. */
export function skillsForSubTopic(map: TopicCognitionMap, subTopicId: string): Skill[] {
  return map.skills.filter((s) => s.subTopicId === subTopicId);
}

/**
 * `questionId -> optionIndex -> misconceptionId`, built once per map.
 * This is the hot path: every MCQ observation is one lookup here.
 */
export function buildTriggerIndex(
  map: TopicCognitionMap,
): Map<string, Map<number, string>> {
  const index = new Map<string, Map<number, string>>();
  for (const mc of map.misconceptions) {
    for (const t of mc.triggers) {
      let byOption = index.get(t.questionId);
      if (!byOption) {
        byOption = new Map<number, string>();
        index.set(t.questionId, byOption);
      }
      // First writer wins. verify-cognition rejects duplicate claims on the
      // same (question, option) so this can never silently pick a side.
      if (!byOption.has(t.optionIndex)) byOption.set(t.optionIndex, mc.id);
    }
  }
  return index;
}

export function misconceptionById(
  map: TopicCognitionMap,
  id: string,
): Misconception | null {
  return map.misconceptions.find((m) => m.id === id) ?? null;
}

export type { Misconception, Skill, SkillId, TopicCognitionMap } from './types';
export type { MisconceptionId } from './types';
