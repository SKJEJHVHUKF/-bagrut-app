/**
 * concept-quiz/index.ts — accessor for the STATIC concept-quiz banks.
 *
 * The /quiz "בוחן מושגים" serves these directly (no API, no Supabase) whenever a
 * bank exists for the topic; otherwise it falls back to the lesson MCQ bank, and
 * only as a last resort to live AI generation.
 *
 * KEYED BY `${subject}:${topic}`, not by topic alone. The old flat merge worked
 * only because 571 and 572 topic names are disjoint — but math4 shares most of
 * math5's Hebrew topic names, and not always byte-identically (math5 says
 * 'גיאומטריה אוקלידית', the math4 picker says 'גאומטריה אוקלידית', one character
 * apart). A topic-keyed merge would serve 5-unit questions to a 4-unit student.
 * Adding math4/math3 later is one import plus one spread here — no refactor.
 */
import type { ConceptLevel, ConceptQuestion, ConceptTopicBank } from './types';
import { CONCEPT_MATH5 } from './math5';

export * from './types';

/** Subject key -> that subject's topic banks. */
const REGISTRY: Record<string, Record<string, ConceptTopicBank>> = {
  math5: CONCEPT_MATH5,
  // math4: CONCEPT_MATH4,   ← drops in here when authored
};

/** The bank object for (subject, topic), or null when there is none. */
export function getConceptBank(subject: string, topic: string): ConceptTopicBank | null {
  return REGISTRY[subject]?.[topic] ?? null;
}

/**
 * Static concept questions for (subject, topic), optionally narrowed to one
 * level. Returns an empty array when there is nothing — callers must NOT
 * substitute a different level silently; the student picked this one.
 */
export function getConceptQuestions(
  subject: string,
  topic: string,
  level?: ConceptLevel,
): ConceptQuestion[] {
  const qs = getConceptBank(subject, topic)?.questions ?? [];
  return level === undefined ? qs : qs.filter((q) => q.level === level);
}

/** Does (subject, topic) have a pre-authored bank — at this level, if given? */
export function hasConceptBank(subject: string, topic: string, level?: ConceptLevel): boolean {
  return getConceptQuestions(subject, topic, level).length > 0;
}

/** How many questions exist per level — drives the counts on the level picker
 *  and the "still being written" state, so the UI never promises what the bank
 *  can't serve. */
export function conceptLevelCounts(subject: string, topic: string): Record<ConceptLevel, number> {
  const counts: Record<ConceptLevel, number> = { 1: 0, 2: 0, 3: 0 };
  for (const q of getConceptQuestions(subject, topic)) counts[q.level]++;
  return counts;
}

/** Subjects that have any concept bank registered. */
export function conceptSubjects(): string[] {
  return Object.keys(REGISTRY);
}

/**
 * Every registered bank, flattened. The verify scripts iterate THIS rather than
 * a hardcoded import list, so a newly added topic file is covered by the gates
 * automatically instead of silently escaping them.
 */
export function conceptBankEntries(): Array<{
  subject: string;
  topic: string;
  bank: ConceptTopicBank;
}> {
  const out: Array<{ subject: string; topic: string; bank: ConceptTopicBank }> = [];
  for (const [subject, topics] of Object.entries(REGISTRY)) {
    for (const [topic, bank] of Object.entries(topics)) out.push({ subject, topic, bank });
  }
  return out;
}
