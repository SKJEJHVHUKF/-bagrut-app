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

/**
 * Minimum query length, in normalised characters.
 *
 * Raised from 20 after a real false positive: "פתור את המשוואה sin(x) = 0.5"
 * (26 chars) matched a complex-numbers question and returned "z = ±4i" under
 * a verified badge. On a short query the boilerplate — "פתור את המשוואה" —
 * is most of the trigram set, so the match is carried by words that appear in
 * hundreds of questions while the part that identifies it (`sin(x)=0.5`) is a
 * rounding error. Measured: 26 chars false-matched, 38 chars correctly
 * missed. A genuine bagrut or מתכונת question is far longer than 40, so this
 * costs no recall — the bench confirms it.
 */
const MIN_QUERY_LENGTH = 40;

/**
 * Minimum length to be INDEXED — deliberately lower than the query floor.
 *
 * These are two different questions. "Is this query specific enough to search
 * with?" is about evidence and needs 40. "Should this stored question be
 * findable at all?" is about coverage: a short drill question still belongs
 * in the corpus, both because a specific query can legitimately find it and
 * because it contributes to the IDF statistics that make every other match
 * work. Conflating them dropped recall from 90.2% to 70.2% by silently
 * deleting a third of the library.
 */
const MIN_INDEX_LENGTH = 20;

/**
 * When two candidates are the SAME question stored twice.
 *
 * These two constants were MEASURED, not chosen, because getting them wrong
 * is not symmetric: treating two different questions as one duplicate makes
 * the matcher ignore the rival that was protecting the student, and serve the
 * wrong worked solution confidently. Treating one duplicate as two questions
 * only costs a miss, and a miss costs an API call.
 *
 * Over the corpus, comparing every pair of DIFFERENT questions (clean text —
 * OCR noise only pushes two different texts further apart, so measuring with
 * noise flatters the guard) against the same question re-scanned:
 *
 *   length ≥ 40    DIFFERENT max 1.000, 1 pair ≥0.9   | SAME min 0.273
 *   length ≥ 160   DIFFERENT max 0.671, 3 pairs ≥0.5  | SAME min 0.478
 *   length ≥ 200   DIFFERENT max 0.464, 0 pairs ≥0.5  | SAME min 0.478
 *
 * The first line is the important one: at short lengths the two populations
 * fully overlap, so NO threshold separates them — not 0.9, not 0.99. A first
 * version of this guard used 0.9 with no length test on the reasoning that
 * "different bagrut questions never get that close". They do:
 * `f(x) = e^x - 1` and `f(x) = e^{2x} - 1`, identical for 140 characters,
 * different answers. That version merged them, which suppresses the rival and
 * serves the wrong worked solution — the one failure this file exists to
 * prevent.
 *
 * Length is what separates the populations, so the guard is gated on it. At
 * ≥200 characters the gap is 0.464 → 0.478 and the threshold sits above the
 * worst different-question pair, not in the middle: a missed duplicate costs
 * an API call, a false merge lies to a student.
 *
 * Below 200 characters the guard is OFF and merge-on-write is the only
 * protection. That is the correct trade — a short question stored twice costs
 * a solve. A real photographed bagrut or מתכונת question is far longer.
 *
 * Re-measure with `npm run bench:match` before touching either number.
 */
const DUPLICATE_TRIGRAM_OVERLAP = 0.5;
const DUPLICATE_MIN_LENGTH = 200;

/**
 * EXPRESSION FINGERPRINT — what separates two SHORT questions.
 *
 * The comment above ends with "below 200 characters the guard is OFF", and
 * `bench-match.ts` prices that honestly: short questions in a duplicated bank
 * hit 38% against 98% for long ones. The mechanism is not scoring. It is
 * `findMatch`'s margin rule: with the guard off, the SAME question stored
 * twice counts as its own rival, the gap collapses below MATCH_MARGIN, and a
 * correct match is refused.
 *
 * Length was used as the separator because prose alone cannot tell two short
 * questions apart — the guard's own counter-example is `f(x) = e^x - 1`
 * versus `f(x) = e^{2x} - 1`, identical for 140 characters. But that example
 * is precisely the point: they differ in the MATHS, and the maths survives
 * normalisation (`normalizeQuestionText` keeps digits, latin letters and
 * operators; only `$` delimiters are stripped). Prose was never the signal
 * that could separate them; the expression was, and it was being diluted by
 * boilerplate instead of read on its own.
 *
 * So: atoms are the operand-level pieces of every math run — identifiers and
 * numbers, with operators used only as separators.
 *
 * ⚠️ 0.85 IS A FLOOR, NOT A PREFERENCE. The guard's own counter-example
 * scores EXACTLY 0.8: `f(x) = e^x - 1` gives {f, x, e, 1} and
 * `f(x) = e^{2x} - 1` gives {f, x, e, 2x, 1}, a Jaccard of 4/5. Any bar at or
 * below 0.8 merges them, which is the precise false merge this file exists to
 * prevent — `scripts/test-mathscan.ts` fails on it by name. Do not lower this
 * number; `bench-match.ts` cannot see that failure (it reports WRONG=0 at
 * every value), so the bench alone will happily talk you into it.
 *
 * MEASURED at 0.85, against the shipped baseline:
 *   short questions, duplicated bank   38% → 40%
 *   noisy library, 4% char drop      94.8% → 95.5%
 *   noisy library, 10% char drop     75.3% → 76.3%
 *   WRONG / false positives              0 → 0
 *
 * A small gain, honestly. The bulk of what remains is not this guard:
 * measured over the 100 short questions, 12 fall under MIN_QUERY_LENGTH once
 * OCR noise shortens them and 6 land within 0.03 of MATCH_THRESHOLD. Both are
 * floors that exist to stop documented false positives.
 *
 * ⚠️ ASYMMETRY, unchanged from the rest of this file: a duplicate we fail to
 * merge costs an API call; two different questions we DO merge suppress the
 * rival that was protecting the student and serve the wrong worked solution.
 * So this path is additive — it can only recognise duplicates that the
 * trigram bar ALREADY accepted, never loosen that bar.
 */
const DUPLICATE_EXPR_OVERLAP = 0.85;

/** Operators and delimiters separate operands; they are not atoms themselves. */
const EXPR_SPLIT = /[+\-=/^_\\().,<>\s]+/;

function exprAtomsOf(normalized: string): Set<string> {
  const atoms = new Set<string>();
  for (const piece of normalized.split(EXPR_SPLIT)) {
    // A math atom carries a digit or a latin letter. Hebrew prose tokens are
    // exactly what must NOT dilute this signal, so they are excluded.
    if (piece && /[0-9a-z]/.test(piece)) atoms.add(piece);
  }
  return atoms;
}

function isSameQuestion(a: IndexedEntry<MatchEntry>, b: IndexedEntry<MatchEntry>): boolean {
  // The trigram bar is required on BOTH paths. Nothing below only widens what
  // counts as a duplicate among candidates that already look alike.
  if (jaccardSets(a.trigrams, b.trigrams) < DUPLICATE_TRIGRAM_OVERLAP) return false;

  // Long enough for prose to separate the populations on its own — the
  // measured rule this file shipped with, untouched.
  if (a.normalized.length >= DUPLICATE_MIN_LENGTH && b.normalized.length >= DUPLICATE_MIN_LENGTH) {
    return true;
  }

  // Short. Prose cannot decide, so the expression must — and only when both
  // sides actually HAVE one. No expression means no evidence, which is a
  // miss, which is the safe direction.
  if (!a.exprAtoms.size || !b.exprAtoms.size) return false;
  // A topic disagreement is cheap, decisive evidence of two different
  // questions. Applied ONLY on this new short path: the topic is itself an
  // OCR guess, and letting it veto the long path could regress a rule that
  // measures well today.
  if (a.entry.topic !== b.entry.topic) return false;
  return jaccardSets(a.exprAtoms, b.exprAtoms) >= DUPLICATE_EXPR_OVERLAP;
}

/**
 * A match must be carried by DISTINCTIVE words, not by boilerplate.
 *
 * `idfOverlap` is a ratio, so a query made almost entirely of stopwords can
 * score well by matching those stopwords. This is an absolute floor on the
 * shared IDF mass: there has to be real evidence, not just a high proportion
 * of weak evidence.
 */
const MIN_SHARED_IDF = 2.0;

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
  /** Operand-level pieces of the maths — see `exprAtomsOf`. Computed once at
   *  index time because `isSameQuestion` is called per rival, per query. */
  exprAtoms: Set<string>;
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

/**
 * @param options.idf  Use THIS token→IDF map instead of deriving one from
 *   `entries`. Required whenever the index is a small, dynamically-retrieved
 *   set rather than a corpus.
 *
 *   IDF is smoothed as `log(N / (1 + df))` and floored at 0. Over 855 corpus
 *   questions that is exactly right. Over a handful of rows it is degenerate:
 *   at N=1 every token scores `log(1/2) → 0`, so `sharedMass` is 0, so
 *   `MIN_SHARED_IDF` rejects every candidate and the index matches NOTHING.
 *   That is not a rounding problem, it is a dead index — and it is silent,
 *   because a matcher that finds nothing looks exactly like an empty table.
 *
 *   The bank and the fuzzy cache lookup both hand this function ~20 rows
 *   fetched per request, and both would have been dead until the table grew
 *   large enough to produce a diverse candidate set. They pass the corpus IDF
 *   instead — which is also the more correct model: how distinctive the word
 *   "משוואה" is, is a property of the subject, not of these 20 rows.
 */
export function buildMatchIndex<T extends MatchEntry>(
  entries: T[],
  options: { idf?: Map<string, number> } = {}
): MatchIndex<T> {
  const indexed: IndexedEntry<T>[] = [];
  const documentFrequency = new Map<string, number>();

  for (const entry of entries) {
    const normalized = normalizeQuestionText(entry.text);
    if (normalized.length < MIN_INDEX_LENGTH) continue;
    const tokens = tokensOf(normalized);
    indexed.push({
      entry,
      normalized,
      trigrams: trigramsOf(normalized),
      tokens,
      exprAtoms: exprAtomsOf(normalized),
    });
    for (const token of tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  if (options.idf) return { entries: indexed, idf: options.idf };

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

/** Overlap weighted by how distinctive each shared token is. Returns both
 *  the ratio and the ABSOLUTE shared mass — the ratio alone lets a query made
 *  of stopwords score well by matching stopwords. */
function idfOverlap(
  queryTokens: Set<string>,
  entryTokens: Set<string>,
  idf: Map<string, number>
): { ratio: number; sharedMass: number } {
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
  if (totalQuery === 0) return { ratio: 0, sharedMass: 0 };
  return { ratio: shared / totalQuery, sharedMass: shared };
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
  if (normalized.length < MIN_QUERY_LENGTH) return null;

  const queryTrigrams = trigramsOf(normalized);
  const queryTokens = tokensOf(normalized);

  let best: { entry: IndexedEntry<T>; score: number } | null = null;
  // Every scoring candidate is kept, not just the best runner-up, because the
  // runner-up can only be judged once we know who won — see the cluster rule
  // below. The list is bounded by the cheap rejects above.
  const runners: { entry: IndexedEntry<T>; score: number }[] = [];

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
    // Not enough distinctive evidence — whatever overlap exists is
    // boilerplate, and boilerplate must never decide a match.
    if (idf.sharedMass < MIN_SHARED_IDF) continue;
    let score = W_TRIGRAM * trigram + W_IDF * idf.ratio;
    if (options.topicHint && candidate.entry.topic === options.topicHint) {
      score += 0.03;
    }
    score = Math.min(1, score);

    if (!best || score > best.score) {
      if (best) runners.push(best);
      best = { entry: candidate, score };
    } else {
      runners.push({ entry: candidate, score });
    }
  }

  if (!best || best.score < threshold) return null;

  /**
   * The runner-up only counts if it is a DIFFERENT question.
   *
   * The margin rule exists to stop us serving question B's solution when the
   * student photographed question A — bagrut questions are near-duplicates of
   * each other by construction. But once the bank grows from real scans, the
   * closest rival is usually the SAME question stored twice: two students
   * photograph one page, OCR differs, the hashes differ, and two rows exist.
   * Those two score almost identically, the gap collapses, and the match is
   * refused — so an auto-growing bank would get WORSE as it grew.
   *
   * Near-identical candidates are therefore treated as one cluster and
   * skipped when measuring the gap. Deduplication on write is the primary
   * defence; this is the net under it, because that one only has to miss once
   * (a race between two simultaneous scans) to break retrieval permanently.
   */
  const bestEntry = best;
  let runnerUp = 0;
  for (const rival of runners) {
    if (rival.score <= runnerUp) continue;
    if (isSameQuestion(rival.entry, bestEntry.entry)) continue;
    runnerUp = rival.score;
  }

  const gap = best.score - runnerUp;
  if (gap < margin) return null;

  return { entry: best.entry.entry, score: best.score, margin: gap };
}

export const __testables = { trigramsOf, tokensOf, jaccardSets, idfOverlap, isSameQuestion };
