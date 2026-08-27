/**
 * tutor-memory.ts — what the student TOLD the tutor, across conversations.
 *
 * The cognitive layer already knows what the student can DO (lib/cognition, fed
 * to the tutor via lib/tutor-context). It cannot know what he SAID: that his
 * exam is on the 12th, that his class teacher does induction differently, that
 * word problems are the part he dreads. That is the difference between a tutor
 * who has met you before and a very good stranger.
 *
 * ============================================================
 * FOUR CONSTRAINTS, EACH OF WHICH COST SOMETHING TO IGNORE
 * ============================================================
 *
 * 1. IT IS SENT ON EVERY TURN, SO IT MUST BE SMALL AND UNCACHED.
 *    Memory is per-student, so it can never sit in the shared cached prefix —
 *    it goes in a trailing block that is re-read at full price each turn. Hence
 *    MAX_FACTS/MAX_CHARS: an unbounded list is a bill that grows forever and is
 *    invisible until someone reads a usage graph.
 *
 * 2. THE STUDENT CAN SEE AND DELETE ALL OF IT.
 *    A model writing durable notes about a teenager, that the teenager cannot
 *    read, is not a feature. `/api/chat/memory` serves and deletes it.
 *
 * 3. NEWEST WINS, OLDEST EVICTED.
 *    Facts go stale ("exam on the 12th" survives the exam). Eviction is FIFO
 *    rather than clever: a relevance score here would be a second model call to
 *    save 200 tokens.
 *
 * 4. IT NEVER BLOCKS THE REPLY.
 *    Every read and write is wrapped — a missing column or a failed write costs
 *    a remembered fact, never the answer the student is waiting for.
 *
 * ⚠️ The `tutor_memory` column is NOT in the sync payload in
 * lib/sync/roadmap-sync.ts, and must stay out of it. That upsert names its
 * columns explicitly, so ON CONFLICT DO UPDATE leaves this one untouched —
 * which is the only reason a client sync can't wipe what the server wrote.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type TutorFact = { text: string; ts: number };

/** Hard ceilings. Both are enforced on write, so a legacy row can't exceed them. */
export const MAX_FACTS = 12;
export const MAX_CHARS = 1200;
/** One fact per turn. The model does not get to narrate the whole session. */
export const MAX_FACT_LEN = 160;

function parse(raw: unknown): TutorFact[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (f): f is TutorFact =>
        !!f && typeof f === 'object' && typeof (f as TutorFact).text === 'string',
    )
    .map((f) => ({ text: f.text, ts: typeof f.ts === 'number' ? f.ts : 0 }));
}

/** Enforce both ceilings, newest-first. Exported for the test. */
export function capFacts(facts: TutorFact[]): TutorFact[] {
  const out: TutorFact[] = [];
  let chars = 0;
  for (const f of facts.slice(0, MAX_FACTS)) {
    if (chars + f.text.length > MAX_CHARS) break;
    chars += f.text.length;
    out.push(f);
  }
  return out;
}

/**
 * Merge a new fact in, newest-first, dropping a near-duplicate of itself.
 * Pure, so the eviction and dedup rules are testable without a database.
 */
export function mergeFact(existing: TutorFact[], text: string, now: number): TutorFact[] {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX_FACT_LEN);
  if (!clean) return existing;
  const key = clean.toLowerCase();
  // A tutor re-told the same thing in two conversations writes it twice; the
  // student then reads his own profile stuttering back at him.
  const deduped = existing.filter((f) => f.text.trim().toLowerCase() !== key);
  return capFacts([{ text: clean, ts: now }, ...deduped]);
}

export async function readFacts(
  supabase: SupabaseClient,
  userId: string,
): Promise<TutorFact[]> {
  try {
    const { data, error } = await supabase
      .from('learning_state')
      .select('tutor_memory')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return [];
    return capFacts(parse((data as { tutor_memory?: unknown }).tutor_memory));
  } catch {
    return [];
  }
}

export async function writeFacts(
  supabase: SupabaseClient,
  userId: string,
  facts: TutorFact[],
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('learning_state')
      .upsert(
        { user_id: userId, tutor_memory: facts, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    return !error;
  } catch {
    return false;
  }
}

/**
 * The prompt block. Returns '' for an empty memory so the caller can skip the
 * block entirely rather than send the model an empty heading to reason about.
 *
 * ⚠️ DATA ONLY — NO INSTRUCTIONS. This block is per-student, so it can never
 * sit in the cached prefix (see PromptContext.memory in lib/agents/prompts.ts):
 * every token is billed at full price on every single turn.
 *
 * MEASURED 2026-08-26: three short facts rendered as **203 fresh tokens**, of
 * which the facts themselves were ~45. The other ~160 were three lines of
 * Hebrew instruction — "השתמש בהם כדי להתאים את ההסבר", "אל תציג אותם כרשימה",
 * "אם משהו לא רלוונטי התעלם ממנו" — which are identical on every request for
 * every student, and were therefore being re-bought thousands of times over.
 * They now live once in TUTOR_CORE's "בלוקי ההקשר" section, at 0.1x.
 *
 * The `MEMORY` header is what that section keys off, so it stays. Anything
 * longer than a bare fact list does not belong here.
 */
export function renderMemoryBlock(facts: TutorFact[]): string {
  if (!facts.length) return '';
  return `MEMORY\n${facts.map((f) => `- ${f.text}`).join('\n')}`;
}
