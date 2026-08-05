// ============================================================
// mathscan/bank.ts — the answer library that grows from real scans.
// ============================================================
//
// One row per DISTINCT question. Every AI solve either creates a row or
// merges into an existing one, so the marginal cost of a question that has
// been photographed before falls to zero — which is the whole point: cost
// should go DOWN as usage goes up, not up.
//
// ── Two-stage retrieval ────────────────────────────────────────────────
// Postgres narrows, the app decides. `search_question_bank` uses a trigram
// GIN index to return ~20 plausible rows in milliseconds at any table size;
// `findMatch` then re-ranks those with the calibration that was actually
// measured (0.55 / 0.08 → 92.6% recall, 0 wrong matches). Doing the ranking
// in SQL would mean re-tuning against a similarity function nothing has
// benchmarked.
//
// ── Deduplication is not optional ──────────────────────────────────────
// `question_hash` is unique but useless for this: two photos of one page
// produce different OCR text and therefore different hashes. Without the
// fuzzy merge below, every re-scan adds a near-identical row, and
// near-identical rows are exactly what the matcher's margin rule refuses to
// choose between — an auto-growing bank would get WORSE as it grew. The
// margin rule in match.ts has a cluster guard as the second line of defence,
// because this one only has to lose one race to leave a duplicate behind.

import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeQuestionText, fingerprint } from '@/lib/question-match';
import { corpusIdf } from '@/lib/solution-library';
import { buildMatchIndex, findMatch, MATCH_THRESHOLD } from './match';

export type QualityTier = 'new' | 'corroborated' | 'verified';

export type BankHit = {
  id: string;
  canonicalText: string;
  topic: string | null;
  unitLevel: number;
  solutionMarkdown: string;
  qualityTier: QualityTier;
  agreementCount: number;
  /** 0..1 from the app's matcher, not from Postgres. */
  score: number;
};

type BankRow = {
  id: string;
  canonical_text: string;
  normalized_text: string;
  topic: string | null;
  unit_level: number;
  solution_markdown: string;
  quality_tier: QualityTier;
  agreement_count: number;
  reported_wrong: number;
};

/** Candidates pulled from Postgres before the app re-ranks them. Generous:
 *  the trigram stage is recall-oriented and `findMatch` is the real gate. */
const CANDIDATE_ROWS = 20;

/**
 * Deduplication runs WITHOUT the margin rule.
 *
 * The margin exists to stop us *serving* the wrong question when two are
 * plausible. For "have we already stored this?" it is actively wrong — two
 * copies of the same question is precisely the situation it refuses to
 * resolve, and refusing here would create the third copy.
 */
const DEDUPE_MARGIN = 0;

function toHit(row: BankRow, score: number): BankHit {
  return {
    id: row.id,
    canonicalText: row.canonical_text,
    topic: row.topic,
    unitLevel: row.unit_level,
    solutionMarkdown: row.solution_markdown,
    qualityTier: row.quality_tier,
    agreementCount: row.agreement_count,
    score,
  };
}

async function candidates(
  supabase: SupabaseClient,
  question: string
): Promise<BankRow[]> {
  const { data, error } = await supabase.rpc('search_question_bank', {
    q: normalizeQuestionText(question),
    max_rows: CANDIDATE_ROWS,
  });
  if (error || !Array.isArray(data)) return [];
  return data as BankRow[];
}

/**
 * Find a stored question. Returns null rather than a weak guess — a wrong hit
 * shows a student the worked solution to somebody else's question.
 */
export async function searchBank(
  supabase: SupabaseClient,
  question: string,
  topicHint?: string,
  options: { margin?: number } = {}
): Promise<BankHit | null> {
  try {
    // Exact repeat: free and indexed — but a hash hit is NOT proof of
    // identity and must never be treated as one.
    //
    // `fingerprint()` is FNV-1a 32-bit. The birthday bound over this table:
    // 0.009% collision at 855 rows, **4.6% at 20,000, 25% at 50,000**. A
    // collision here hands a student the fully-worked solution to an
    // unrelated question, through the one path that skips every guard the
    // matcher provides — and it gets more likely exactly as the bank
    // succeeds. Comparing the normalized text is exact and free, so the
    // class is removed rather than made unlikely.
    const normalized = normalizeQuestionText(question);
    const hash = fingerprint(normalized);
    const { data: exact } = await supabase
      .from('question_bank')
      .select(
        'id, canonical_text, normalized_text, topic, unit_level, solution_markdown, quality_tier, agreement_count, reported_wrong'
      )
      .eq('question_hash', hash)
      .lt('reported_wrong', 3)
      .limit(1);
    if (exact && exact.length > 0 && (exact[0] as BankRow).normalized_text === normalized) {
      return toHit(exact[0] as BankRow, 1);
    }

    const rows = await candidates(supabase, question);
    if (rows.length === 0) return null;

    // The index covers only the ~20 candidates, so its IDF MUST come from the
    // corpus. Deriving it from 20 rows is not merely imprecise — at the sizes
    // a new bank actually has, `log(N/(1+df))` floors to 0 for every token,
    // `sharedMass` is 0, `MIN_SHARED_IDF` rejects everything, and the bank
    // silently answers nothing until it happens to grow diverse enough.
    // MEASURED: with a per-candidate IDF, a one-row bank matched 0/6 of its
    // own questions; with the corpus IDF, 6/6.
    const index = buildMatchIndex(
      rows.map((row) => ({ id: row.id, topic: row.topic ?? '', text: row.canonical_text })),
      { idf: corpusIdf() }
    );
    const found = findMatch(index, question, {
      topicHint,
      margin: options.margin,
    });
    if (!found) return null;

    const row = rows.find((r) => r.id === found.entry.id);
    return row ? toHit(row, found.score) : null;
  } catch {
    // A bank outage must never take the scan down — the static corpus and
    // the local CAS still work.
    return null;
  }
}

/**
 * Store a solved question, or merge into the one already there.
 *
 * Returns what happened so the caller can report it in the cost trace:
 * a merge means this scan cost the student money but cost the NEXT one
 * nothing, which is the mechanism the whole design rests on.
 */
export async function upsertIntoBank(
  supabase: SupabaseClient,
  entry: {
    question: string;
    solutionMarkdown: string;
    topic?: string;
    unitLevel?: number;
    /** True only when the local CAS confirmed the answer by substitution. */
    casVerified?: boolean;
  }
): Promise<'inserted' | 'merged' | 'skipped'> {
  const canonical = entry.question.trim();
  const normalized = normalizeQuestionText(canonical);
  // Below the matcher's own query floor there is not enough text to dedupe
  // against, so storing it would create a row nothing can ever find.
  if (normalized.length < 40 || entry.solutionMarkdown.trim().length < 40) return 'skipped';

  try {
    // Dedupe with NO margin — see DEDUPE_MARGIN.
    const existing = await searchBank(supabase, canonical, entry.topic, {
      margin: DEDUPE_MARGIN,
    });

    if (existing) {
      const agreement = existing.agreementCount + 1;
      await supabase
        .from('question_bank')
        .update({
          agreement_count: agreement,
          // Two independent scans landing on the same question is the only
          // corroboration available without a human. It never overrides a
          // CAS-verified row downward.
          quality_tier:
            existing.qualityTier === 'verified'
              ? 'verified'
              : agreement >= 2
                ? 'corroborated'
                : existing.qualityTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      return 'merged';
    }

    await supabase.from('question_bank').insert({
      question_hash: fingerprint(normalized),
      normalized_text: normalized,
      canonical_text: canonical,
      topic: entry.topic ?? null,
      unit_level: entry.unitLevel ?? 5,
      solution_markdown: entry.solutionMarkdown,
      cas_verified: entry.casVerified ?? false,
      quality_tier: entry.casVerified ? 'verified' : 'new',
    });
    return 'inserted';
  } catch {
    // A failed write costs nothing but a repeat solve later.
    return 'skipped';
  }
}

/** Count a serve, so the most-used questions are visible in the data. */
export async function bumpServed(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    await supabase.rpc('increment_bank_served', { row_id: id });
  } catch {
    /* best effort */
  }
}

/**
 * A student says the solution is wrong.
 *
 * The only ground-truth signal that reaches us without a human reviewer. Two
 * reports demote the row out of any corroborated/verified claim; three retire
 * it from search entirely (enforced in the SQL function, so a retired row
 * cannot be served even if this client is stale).
 */
export async function reportWrong(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    await supabase.rpc('report_bank_wrong', { row_id: id });
  } catch {
    /* best effort */
  }
}

export { MATCH_THRESHOLD };
