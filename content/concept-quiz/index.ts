/**
 * concept-quiz/index.ts — accessor for the STATIC concept-quiz banks.
 *
 * The /quiz "בוחן מושגים מהיר" serves these directly (no API, no Supabase)
 * whenever a bank exists for the topic; otherwise it falls back to the lesson
 * MCQ bank, and only as a last resort to live AI generation. Both papers now
 * have static banks: 571 (8 core topics) + 572 (6 topics), merged here so a
 * lookup by topic name finds whichever paper owns it.
 */

import { CONCEPT_571 } from './571';
import { CONCEPT_582, type ConceptQuestion } from './582';

export type { ConceptQuestion };

// 571 and 582 topic names are disjoint (each topic belongs to one paper), so a
// flat merge is unambiguous.
const CONCEPT: Record<string, ConceptQuestion[]> = { ...CONCEPT_571, ...CONCEPT_582 };

/** Static concept questions for a topic (empty array if none). */
export function getConceptQuestions(topic: string): ConceptQuestion[] {
  return CONCEPT[topic] ?? [];
}

/** Does this topic have a pre-authored static concept bank? */
export function hasConceptBank(topic: string): boolean {
  return (CONCEPT[topic]?.length ?? 0) > 0;
}
