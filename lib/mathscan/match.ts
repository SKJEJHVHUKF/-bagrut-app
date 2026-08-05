// ============================================================
// mathscan/match.ts — finding a photographed question in the library.
// ============================================================
//
// ── Why this exists ────────────────────────────────────────────────────
// The app already owns ~855 hand-authored, verified solutions. That corpus
// is the entire "answer it for free" strategy: a photographed מתכונת
// question that is already in it costs nothing and comes back with a
// solution a human wrote.
//
// It was unreachable. `lib/question-match.ts` compares Jaccard over token
// sets at a 0.82 threshold, which is right for comparing two clean strings
// and hopeless against OCR output. MEASURED over 24 real past-bagrut
// questions with realistic OCR noise applied (subscripts collapsing into
// digits, √ read as N, ² read as °, ~4% of characters dropped — all errors
// observed on an actual scan): Jaccard came out 0.37-0.64, median 0.53, and
// **0 of 24 matched**. Every one of them matched perfectly when clean.
//
// ── The approach ───────────────────────────────────────────────────────
// Two signals that fail in different ways, combined, then gated on a margin:
//
//   1. CHARACTER TRIGRAMS. OCR corrupts individual glyphs, and a wrong glyph
//      damages only the ~3 trigrams containing it — the rest of the string
//      still matches. Token-level comparison instead loses the whole word.
//   2. IDF-WEIGHTED TOKEN OVERLAP. "את" and "של" appear in every question and
//      carry no evidence; "פרבולה", "ארגומנט", "מרוכבים" nearly identify a
//      question by themselves. Weighting by inverse document frequency makes
//      the rare words decide.
//
// ── Why a margin, not just a threshold ────────────────────────────────
// The failure that matters is not a miss — it is showing the solution to a
// DIFFERENT question, which looks authoritative and is completely wrong.
// Bagrut questions are near-duplicates of each other by construction (same
// phrasing, same topic, different numbers), so a good score against the best
// entry means little if the runner-up scores nearly as well. A match is only
// returned when it beats the second-best candidate by a clear margin.

import { normalizeQuestionText } from '@/lib/question-match';

export type MatchEntry = {
  id: string;
  topic: string;
  /** The stored question text. */
  text: string;
};

export type MatchResult<T extends MatchEntry> = {
  entry: T;
  /** 0..1 combined similarity. */
  score: number;
  /** How far ahead of the runner-up, 0..1. */
  margin: number;
};

// ------------------------------------------------------------
// Tunables — every one calibrated in scripts/bench-match.ts
// ------------------------------------------------------------

/** Trigrams: short enough to survive a corrupted glyph, long enough to be
 *  distinctive. Bigrams collide across unrelated Hebrew; 4-grams break too
 *  easily on a dropped character. */
const NGRAM = 3;

/** Weight split. Trigrams carry more because they degrade gracefully; the
 *  IDF term is what stops two same-topic questions scoring alike. */
const W_TRIGRAM = 0.6;
const W_IDF = 0.4;

/**
 * Accept threshold. Calibrated so that noisy scans of stored questions match
 * while unrelated questions do not — see the bench script for the measured
 * separation.
 */
export const MATCH_THRESHOLD = 0.55;

/** The winner must beat the runner-up by this much. Guards against the
 *  near-duplicate family problem described above. */
export const MATCH_MARGIN = 0.08;

/** Below this many shared characters the comparison is noise. */
const MIN_NORMALIZED_LENGTH = 20;

/** A query far shorter or longer than the entry is a different question even
 *  if the words overlap — e.g. one section of a five-section question. */
const LENGTH_RATIO_FLOOR = 0.45;

// ------------------------------------------------------------
// Index
// ------------------------------------------------------------

type IndexedEntry<T extends MatchEntry> = {
  entry: T;
  normalized: string;
  trigrams: Set<string>;
  tokens: Set<string>;
};

export type MatchIndex<T extends MatchEntry> = {
  entries: IndexedEntry<T>[];
  /** token → inverse document frequency */
  idf: Map<string, number>;
};

function trigramsOf(normalized: string): Set<string> {
  // Spaces are dropped: OCR frequently merges or splits words, and a
  // space-sensitive n-gram set would treat "מצאאת" and "מצא את" as unrelated.
  const dense = normalized.replace(/\s+/g, '');
  const grams = new Set<string>();
  for (let i = 0; i + NGRAM <= dense.length; i++) {
    grams.add(dense.slice(i, i + NGRAM));
  }
  return grams;
}

function tokensOf(normalized: string): Set<string> {
  return new Set(normalized.split(/\s+/).filter((t) => t.length >= 2));
}

export function buildMatchIndex<T extends MatchEntry>(entries: T[]): MatchIndex<T> {
  const indexed: IndexedEntry<T>[] = [];
  const documentFrequency = new Map<string, number>();

  for (const entry of entries) {
    const normalized = normalizeQuestionText(entry.text);
    if (normalized.length < MIN_NORMALIZED_LENGTH) continue;
    const tokens = tokensOf(normalized);
    indexed.push({ entry, normalized, trigrams: trigramsOf(normalized), tokens });
    for (const token of tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const total = Math.max(1, indexed.length);
  const idf = new Map<string, number>();
  for (const [token, count] of documentFrequency) {
    // Smoothed IDF, floored at 0 so a token in every document contributes
    // nothing rather than going negative.
    idf.set(token, Math.max(0, Math.log(total / (1 + count))));
  }

  return { entries: indexed, idf };
}

// ------------------------------------------------------------
// Scoring
// ------------------------------------------------------------

function jaccardSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const value of small) if (large.has(value)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Overlap weighted by how distinctive each shared token is. */
function idfOverlap(
  queryTokens: Set<string>,
  entryTokens: Set<string>,
  idf: Map<string, number>
): number {
  let shared = 0;
  let totalQuery = 0;
  for (const token of queryTokens) {
    // An unseen token is maximally distinctive; give it the corpus max
    // rather than 0, or an OCR-mangled rare word would silently count for
    // nothing on both sides.
    const weight = idf.get(token) ?? 1;
    totalQuery += weight;
    if (entryTokens.has(token)) shared += weight;
  }
  if (totalQuery === 0) return 0;
  return shared / totalQuery;
}

export type FindMatchOptions = {
  /** Restrict to this topic when supplied — a large precision win, applied
   *  as a boost rather than a filter because the topic hint is itself a
   *  guess from OCR text. */
  topicHint?: string;
  threshold?: number;
  margin?: number;
};

/**
 * Best entry for a (possibly noisy) query, or null.
 *
 * Returns null rather than a weak guess. A miss costs one API call; a wrong
 * match shows a student the fully-worked solution to someone else's question
 * under a "verified" badge.
 */
export function findMatch<T extends MatchEntry>(
  index: MatchIndex<T>,
  query: string,
  options: FindMatchOptions = {}
): MatchResult<T> | null {
  const threshold = options.threshold ?? MATCH_THRESHOLD;
  const margin = options.margin ?? MATCH_MARGIN;

  const normalized = normalizeQuestionText(query);
  if (normalized.length < MIN_NORMALIZED_LENGTH) return null;

  const queryTrigrams = trigramsOf(normalized);
  const queryTokens = tokensOf(normalized);

  let best: { entry: IndexedEntry<T>; score: number } | null = null;
  let runnerUp = 0;

  for (const candidate of index.entries) {
    const ratio =
      Math.min(normalized.length, candidate.normalized.length) /
      Math.max(normalized.length, candidate.normalized.length);
    if (ratio < LENGTH_RATIO_FLOOR) continue;

    const trigram = jaccardSets(queryTrigrams, candidate.trigrams);
    // Cheap reject: the combined score can never recover from a very low
    // trigram overlap, and this skips the costlier IDF pass on most entries.
    if (trigram < 0.15) continue;

    const idf = idfOverlap(queryTokens, candidate.tokens, index.idf);
    let score = W_TRIGRAM * trigram + W_IDF * idf;
    if (options.topicHint && candidate.entry.topic === options.topicHint) {
      score += 0.03;
    }
    score = Math.min(1, score);

    if (!best || score > best.score) {
      if (best) runnerUp = Math.max(runnerUp, best.score);
      best = { entry: candidate, score };
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }

  if (!best || best.score < threshold) return null;
  const gap = best.score - runnerUp;
  if (gap < margin) return null;

  return { entry: best.entry.entry, score: best.score, margin: gap };
}

export const __testables = { trigramsOf, tokensOf, jaccardSets, idfOverlap };
