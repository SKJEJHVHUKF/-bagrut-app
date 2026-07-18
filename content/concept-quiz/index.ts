/**
 * concept-quiz/index.ts — accessor for the STATIC concept-quiz banks.
 *
 * The /quiz "בוחן מושגים מהיר" serves these directly (no API, no Supabase)
 * whenever a bank exists for the topic; otherwise it falls back to live AI
 * generation. Currently only 582 topics have a static bank.
 */

import { CONCEPT_582, type ConceptQuestion } from './582';

export type { ConceptQuestion };

/** Static concept questions for a topic (empty array if none). */
export function getConceptQuestions(topic: string): ConceptQuestion[] {
  return CONCEPT_582[topic] ?? [];
}

/** Does this topic have a pre-authored static concept bank? */
export function hasConceptBank(topic: string): boolean {
  return (CONCEPT_582[topic]?.length ?? 0) > 0;
}
