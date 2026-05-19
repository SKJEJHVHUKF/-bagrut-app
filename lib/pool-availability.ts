/**
 * pool-availability.ts — static manifest of which (subject, topic, kind)
 * combinations have a pre-generated pool of questions in Supabase.
 *
 * Why static instead of querying Supabase from the client? Because we need
 * to decide whether to show the "בגרות מלאה" button *before* navigating —
 * a live query would add 200-400ms to every lesson-page render. The
 * manifest is updated by hand each time we run scripts/generate-pool.ts
 * to populate a new (subject, topic, kind).
 *
 * The cost story: a Sonnet 4.6 generation of a full bagrut question costs
 * ~$0.04 and takes 30-50s. If we let a student click "בגרות מלאה" on a
 * topic with no pool, they wait that long AND we pay every time, every
 * student. So we just hide the button until the pool exists for them.
 */

type Kind = 'quiz' | 'bagrut';

// Manually maintained — update after every `npm run generate-pool` run.
const AVAILABLE: Record<string, Record<Kind, boolean>> = {
  'math5:אלגברה': { quiz: true, bagrut: false },
  // Add new entries here as the pool grows. Format:
  // 'math5:פונקציות': { quiz: false, bagrut: false },
};

export function poolHas(subject: string, topic: string, kind: Kind): boolean {
  return AVAILABLE[`${subject}:${topic}`]?.[kind] ?? false;
}

export function hasAnyPool(subject: string, topic: string): boolean {
  return poolHas(subject, topic, 'quiz') || poolHas(subject, topic, 'bagrut');
}
