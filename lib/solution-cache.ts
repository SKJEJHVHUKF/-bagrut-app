// ============================================================
// solution-cache.ts — the shared, warms-over-time cache of AI-solved
// questions. When a scan misses the static library, we check here; on a
// second miss we solve once with the AI and store the result keyed by the
// question fingerprint. The next student who scans the same question gets
// it for free.
//
// Content is non-sensitive (just math solutions), so the cache is shared
// across users. Everything is best-effort: if the `solution_cache` table
// doesn't exist yet (created manually in the Supabase dashboard), every
// call degrades to "no cache" and the solve path still works.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeQuestionText } from './question-match';

export type CachedSolution = {
  topic: string;
  transcribedQuestion: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
};

/**
 * Look up a previously-solved question by its normalized fingerprint.
 * Returns the stored solution or null (miss / table missing / any error).
 * Bumps served_count best-effort on a hit.
 */
export async function getCachedSolution(
  supabase: SupabaseClient,
  hash: string,
  /** The question the hash was computed from. Supplying it turns a hash hit
   *  into a verified identity — see the collision note below. */
  question?: string,
): Promise<CachedSolution | null> {
  try {
    const { data, error } = await supabase
      .from('solution_cache')
      .select('id, topic, transcribed_question, solution, served_count')
      .eq('question_hash', hash)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const row = data[0];

    // A hash hit means "same bucket", not "same question". `fingerprint` is
    // FNV-1a 32-bit: the birthday bound is 0.009% at 855 rows but **4.6% at
    // 20,000 and 25% at 50,000**, and this table now grows with every solve.
    // A collision would serve an unrelated question's worked solution, so
    // when the caller can supply the source text we compare it.
    if (question !== undefined) {
      const storedText = (row.transcribed_question as string | null) ?? '';
      if (normalizeQuestionText(storedText) !== normalizeQuestionText(question)) return null;
    }

    // Fire-and-forget usage bump — never block the response on it.
    void supabase
      .from('solution_cache')
      .update({ served_count: (row.served_count ?? 0) + 1 })
      .eq('id', row.id)
      .then(({ error: e }) => {
        if (e) console.error('[solution-cache] bump failed:', e.message);
      });

    const sol = row.solution as { steps?: unknown; finalAnswer?: unknown };
    if (!sol || !Array.isArray(sol.steps)) return null;

    return {
      topic: row.topic as string,
      transcribedQuestion: row.transcribed_question as string,
      steps: sol.steps as { title: string; content: string }[],
      finalAnswer: (sol.finalAnswer as string) ?? '',
    };
  } catch (e) {
    // Table missing or transient error — treat as a clean miss.
    console.error('[solution-cache] get error:', e);
    return null;
  }
}

/**
 * Find a cached solution for a NOISY transcription.
 *
 * The exact-hash lookup above is the right primary key, and it almost never
 * fires for a photograph: two students who photograph the same page get
 * different OCR noise, so different normalised text, so different hashes.
 * That made the shared cache — the mechanism by which cost falls as usage
 * rises — effectively dead for its main use case.
 *
 * This pulls a bounded window of recent rows and runs the same OCR-tolerant
 * matcher the library uses. Bounded on purpose: the cache is unindexed for
 * similarity, and scanning it without a limit would grow the latency of
 * every scan as the table grows.
 */
export async function findSimilarCached(
  supabase: SupabaseClient,
  question: string,
  topic?: string,
): Promise<CachedSolution | null> {
  try {
    let query = supabase
      .from('solution_cache')
      .select('id, topic, transcribed_question, solution, served_count')
      .order('served_count', { ascending: false })
      .limit(CACHE_SCAN_WINDOW);
    // Same-topic rows first when we have a hint — it shrinks the window to
    // the only rows that could plausibly match.
    if (topic) query = query.eq('topic', topic);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    const { buildMatchIndex, findMatch } = await import('./mathscan/match');
    const { corpusIdf } = await import('./solution-library');
    const rows = data.filter((row) => typeof row.transcribed_question === 'string');
    // Corpus IDF, not per-window IDF. This index holds at most 200 rows and
    // starts at zero; derived from that few, `log(N/(1+df))` floors to 0 for
    // every token and the MIN_SHARED_IDF gate then rejects every candidate —
    // a fuzzy lookup that can never hit, failing silently as a cache miss.
    const index = buildMatchIndex(
      rows.map((row, i) => ({
        id: String(i),
        topic: (row.topic as string) ?? '',
        text: row.transcribed_question as string,
      })),
      { idf: corpusIdf() },
    );
    const found = findMatch(index, question, { topicHint: topic });
    if (!found) return null;

    const row = rows[Number(found.entry.id)];
    const sol = row.solution as { steps?: unknown; finalAnswer?: unknown };
    if (!sol || !Array.isArray(sol.steps) || sol.steps.length === 0) return null;

    void supabase
      .from('solution_cache')
      .update({ served_count: (row.served_count ?? 0) + 1 })
      .eq('id', row.id)
      .then(({ error: e }) => {
        if (e) console.error('[solution-cache] bump failed:', e.message);
      });

    return {
      topic: (row.topic as string) ?? '',
      transcribedQuestion: row.transcribed_question as string,
      steps: sol.steps as { title: string; content: string }[],
      finalAnswer: (sol.finalAnswer as string) ?? '',
    };
  } catch (e) {
    console.error('[solution-cache] similar lookup error:', e);
    return null;
  }
}

/** How many cache rows a fuzzy lookup will consider. Ordered by served_count
 *  so the questions students actually repeat are always in the window. */
const CACHE_SCAN_WINDOW = 200;

/**
 * Store a freshly AI-solved question so future scans of it are free.
 * Best-effort: swallows errors (incl. "table does not exist" and unique-
 * violation races where two students solved the same question at once).
 */
export async function putCachedSolution(
  supabase: SupabaseClient,
  hash: string,
  payload: CachedSolution,
): Promise<void> {
  try {
    await supabase.from('solution_cache').insert({
      question_hash: hash,
      topic: payload.topic,
      transcribed_question: payload.transcribedQuestion,
      solution: { steps: payload.steps, finalAnswer: payload.finalAnswer },
    });
  } catch (e) {
    console.error('[solution-cache] put error:', e);
  }
}

// ============================================================
// SQL — run once in the Supabase dashboard (SQL editor). The app works
// without these tables (cache just no-ops), but creating them turns on the
// shared cache + the free-tier daily scan cap.
// ============================================================
//
// -- Shared solution cache (public math solutions, keyed by question hash)
// create table if not exists public.solution_cache (
//   id                   uuid primary key default gen_random_uuid(),
//   question_hash        text not null unique,
//   topic                text,
//   transcribed_question text,
//   solution             jsonb not null,
//   served_count         int  not null default 0,
//   created_at           timestamptz not null default now()
// );
// create index if not exists solution_cache_hash_idx
//   on public.solution_cache (question_hash);
// alter table public.solution_cache enable row level security;
// create policy "authed read cache"  on public.solution_cache
//   for select to authenticated using (true);
// create policy "authed write cache" on public.solution_cache
//   for insert to authenticated with check (true);
// create policy "authed bump cache"  on public.solution_cache
//   for update to authenticated using (true) with check (true);
//
// -- Per-user scan log (drives the free-tier daily cap)
// create table if not exists public.scan_log (
//   id         uuid primary key default gen_random_uuid(),
//   user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
//   source     text not null,          -- 'library' | 'cache' | 'ai'
//   created_at timestamptz not null default now()
// );
// create index if not exists scan_log_user_day_idx
//   on public.scan_log (user_id, created_at desc);
// alter table public.scan_log enable row level security;
// create policy "users read own scans"  on public.scan_log
//   for select using (auth.uid() = user_id);
// create policy "users insert own scans" on public.scan_log
//   for insert with check (auth.uid() = user_id);
