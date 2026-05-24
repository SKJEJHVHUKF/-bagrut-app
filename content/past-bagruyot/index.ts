/**
 * Past Bagrut Repository — registry + query helpers.
 *
 * To add a new bagrut session:
 *   1. Create `content/past-bagruyot/{year}-{season}-{paper}.ts`
 *      that exports `bagrut{Year}{Season}{Paper}: PastBagrutQuestion[]`.
 *   2. Import it below and spread into `ALL_PAST_BAGRUYOT`.
 *
 * Query helpers below are pure functions over `ALL_PAST_BAGRUYOT`.
 * No network, no API — pure static data.
 */

import type { PastBagrutQuestion, BagrutPaper } from './types';
import { bagrut2024Summer581 } from './2024-summer-581';
import { bagrut2024Summer582 } from './2024-summer-582';
import { bagrut2024Winter581 } from './2024-winter-581';
import { bagrut2024Winter582 } from './2024-winter-582';
import { bagrut2023Summer581 } from './2023-summer-581';

export const ALL_PAST_BAGRUYOT: PastBagrutQuestion[] = [
  ...bagrut2024Summer581,
  ...bagrut2024Summer582,
  ...bagrut2024Winter581,
  ...bagrut2024Winter582,
  ...bagrut2023Summer581,
];

// ============================================================
// Query helpers
// ============================================================

export function getQuestionById(id: string): PastBagrutQuestion | null {
  return ALL_PAST_BAGRUYOT.find((q) => q.id === id) ?? null;
}

export function getByYear(year: number): PastBagrutQuestion[] {
  return ALL_PAST_BAGRUYOT.filter((q) => q.year === year);
}

export function getByPaper(paper: BagrutPaper): PastBagrutQuestion[] {
  return ALL_PAST_BAGRUYOT.filter((q) => q.paper === paper);
}

export function getByTopic(topic: string): PastBagrutQuestion[] {
  return ALL_PAST_BAGRUYOT.filter((q) => q.topic === topic);
}

/** Available years, descending (newest first). */
export function availableYears(): number[] {
  const set = new Set(ALL_PAST_BAGRUYOT.map((q) => q.year));
  return Array.from(set).sort((a, b) => b - a);
}

/** Available topics, deduplicated. */
export function availableTopics(): string[] {
  const set = new Set(ALL_PAST_BAGRUYOT.map((q) => q.topic));
  return Array.from(set).sort();
}

/** Total count — useful for the /bagruyot page header. */
export function totalQuestions(): number {
  return ALL_PAST_BAGRUYOT.length;
}

/**
 * Naive text search across context and prompts. For matching photos to
 * the database we'd build a smarter (token-overlap or embedding) version.
 * For browse, a simple substring search is enough.
 */
export function search(query: string): PastBagrutQuestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_PAST_BAGRUYOT;
  return ALL_PAST_BAGRUYOT.filter((qn) => {
    const haystack = [
      qn.context,
      ...qn.parts.map((p) => p.prompt),
      qn.topic,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export type { PastBagrutQuestion, BagrutPaper, BagrutSeason, PastBagrutPart } from './types';
