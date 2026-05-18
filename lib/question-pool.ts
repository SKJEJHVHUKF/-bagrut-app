/**
 * question-pool.ts — server-side helpers for serving pre-generated questions
 * from the Supabase `question_pool` table.
 *
 * The pool is populated by scripts/generate-pool.ts (runs locally, one-off).
 * API routes call `serveFromPool()` first; if the pool is empty for that
 * subject/topic, the route falls back to calling Anthropic directly.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Kind = 'quiz' | 'bagrut';

/**
 * Pull a random pool row for the given subject/topic/kind, or return null
 * if the pool has no rows matching. Caller decides whether to fall back to
 * Anthropic. Bumps `served_count` best-effort (fire-and-forget) so future
 * shuffles prefer less-served items.
 *
 * `data` is jsonb on the table side and comes back already parsed.
 */
export async function serveFromPool<T = unknown>(
  supabase: SupabaseClient,
  subject: string,
  topic: string,
  kind: Kind
): Promise<T | null> {
  // 1) How many pool rows match this (subject, topic, kind)?
  const { count, error: countErr } = await supabase
    .from('question_pool')
    .select('id', { count: 'exact', head: true })
    .eq('subject', subject)
    .eq('topic', topic)
    .eq('kind', kind);

  if (countErr) {
    console.error('[pool] count error:', countErr.message);
    return null;
  }
  if (!count || count === 0) return null;

  // 2) Pick a random offset within that count and fetch the one row.
  //    With a few dozen rows per topic, ORDER BY served_count keeps the
  //    rotation gentle: less-served rows surface first, then RNG picks
  //    among them.
  const offset = Math.floor(Math.random() * count);
  const { data, error } = await supabase
    .from('question_pool')
    .select('id, data, served_count')
    .eq('subject', subject)
    .eq('topic', topic)
    .eq('kind', kind)
    .order('served_count', { ascending: true })
    .range(offset, offset)
    .limit(1);

  if (error || !data || data.length === 0) {
    if (error) console.error('[pool] fetch error:', error.message);
    return null;
  }

  const row = data[0];

  // 3) Best-effort bump of served_count. We don't await — if Supabase
  //    is slow or the update fails, the user still gets their question.
  void supabase
    .from('question_pool')
    .update({ served_count: (row.served_count ?? 0) + 1 })
    .eq('id', row.id)
    .then(({ error: updErr }) => {
      if (updErr) console.error('[pool] update error:', updErr.message);
    });

  return row.data as T;
}
