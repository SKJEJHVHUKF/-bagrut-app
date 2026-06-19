/**
 * Past Bagrut Repository — registry + query helpers.
 *
 * ============================================================
 * STATUS: empty repository — awaiting real bagrut questions.
 * ============================================================
 *
 * The infrastructure (types, queries, /bagruyot page) is ready, but
 * the registry below is intentionally empty. We will only register
 * REAL past bagrut questions here, with sources we can verify:
 *
 *  - Official PDFs from meyda.education.gov.il (MOE archive)
 *  - Solution keys from MOE or verified tutoring companies
 *  - User-contributed transcriptions of bagrut papers they have
 *
 * To add a real bagrut session:
 *   1. Create `content/past-bagruyot/{year}-{season}-{paper}.ts`
 *      that exports `bagrut{Year}{Season}{Paper}: PastBagrutQuestion[]`.
 *      Each question must have `solutionSource: 'official'` (from MOE
 *      solution key) or `'ai-generated'` (Claude-generated, with the
 *      question text verbatim from the real bagrut PDF).
 *   2. Import it below and spread into `ALL_PAST_BAGRUYOT`.
 *
 * The /bagruyot page handles the empty state gracefully — shows
 * instructions for users to send questions in.
 */

import type { PastBagrutQuestion, BagrutPaper } from './types';
import { bagrut2020Summer582 } from './2020-summer-582';
import { bagrut2021Summer582 } from './2021-summer-582';
import { bagrut2021Summer582MoedA } from './2021-summer-582-moed-a';
import { bagrut2021Summer582MoedB } from './2021-summer-582-moed-b';
import { bagrut2022Summer582 } from './2022-summer-582';
import { bagrut2022Summer582MoedB } from './2022-summer-582-moed-b';
import { bagrut2022Winter582 } from './2022-winter-582';
import { bagrut2023Summer582 } from './2023-summer-582';
import { bagrut2023Summer582Special } from './2023-summer-582-special';
import { bagrut2023Summer582MoedB } from './2023-summer-582-moed-b';
import { bagrut2024Summer582 } from './2024-summer-582';
import { bagrut2025Summer582 } from './2025-summer-582';
import { bagrut2025Summer582MoedB } from './2025-summer-582-moed-b';

export const ALL_PAST_BAGRUYOT: PastBagrutQuestion[] = [
  ...bagrut2020Summer582,
  ...bagrut2021Summer582,
  ...bagrut2021Summer582MoedA,
  ...bagrut2021Summer582MoedB,
  ...bagrut2022Summer582,
  ...bagrut2022Summer582MoedB,
  ...bagrut2022Winter582,
  ...bagrut2023Summer582,
  ...bagrut2023Summer582Special,
  ...bagrut2023Summer582MoedB,
  ...bagrut2024Summer582,
  ...bagrut2025Summer582,
  ...bagrut2025Summer582MoedB,
];

// ============================================================
// Query helpers — all work over an empty list cleanly.
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

export function availableYears(): number[] {
  const set = new Set(ALL_PAST_BAGRUYOT.map((q) => q.year));
  return Array.from(set).sort((a, b) => b - a);
}

export function availableTopics(): string[] {
  const set = new Set(ALL_PAST_BAGRUYOT.map((q) => q.topic));
  return Array.from(set).sort();
}

export function totalQuestions(): number {
  return ALL_PAST_BAGRUYOT.length;
}

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

export type { PastBagrutQuestion, BagrutPaper, BagrutSeason, BagrutMoed, PastBagrutPart } from './types';
