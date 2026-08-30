/**
 * measure-cache-ttl.ts — is the 1-hour cache TTL cheaper than the 5-minute one
 * for THIS app's actual usage?
 *
 *   npx tsx scripts/measure-cache-ttl.ts
 *
 * FREE, read-only. Reads the real timestamps in `ai_generation_log` and prices
 * both options against them.
 *
 * ============================================================
 * WHY THIS CANNOT BE ANSWERED FROM THE PRICE LIST
 * ============================================================
 * The multipliers are fixed and public:
 *
 *   5-minute write   1.25 × base input
 *   1-hour write     2.00 × base input
 *   cache read       0.10 × base input
 *
 * Which is cheaper depends entirely on the GAPS between one student's calls. A
 * write is paid once per window; every call inside the window reads at a
 * tenth. So the 1-hour TTL wins only when calls actually land more than five
 * minutes apart but less than an hour — and loses on every isolated question,
 * where it pays 2× for a cache nobody reads.
 *
 * That is a fact about behaviour, not about pricing, and the log has it.
 *
 * ⚠️ SAMPLE SIZE IS PART OF THE ANSWER. With a handful of rows this reports a
 * direction, not a decision, and says so rather than dressing a small number
 * up as a finding.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

/** Documented Anthropic multipliers, relative to the base input price. */
const WRITE_5M = 1.25;
const WRITE_1H = 2.0;
const READ = 0.1;

const MIN_5 = 5 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** The grounded tutor prefix, from scripts/measure-cache-fit.ts. Hebrew is
 *  token-heavy, which is why this is thousands rather than hundreds. */
const PREFIX_TOKENS = Number(process.env.PREFIX_TOKENS ?? 6000);

type Row = { user_id: string; created_at: string; kind: string };

/**
 * Walk one student's calls in order and price them.
 *
 * A call is a WRITE when the previous call by that student is further back
 * than the window (or there was none); otherwise it READS what is still warm.
 */
function price(times: number[], window: number, writeMult: number) {
  let writes = 0;
  let reads = 0;
  let last = -Infinity;
  for (const t of times) {
    if (t - last > window) writes++;
    else reads++;
    last = t;
  }
  return {
    writes,
    reads,
    tokenEq: writes * PREFIX_TOKENS * writeMult + reads * PREFIX_TOKENS * READ,
  };
}

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('missing Supabase credentials in the environment');
    process.exit(2);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from('ai_generation_log')
    .select('user_id, created_at, kind')
    .order('created_at', { ascending: true })
    .limit(5000);

  if (error) {
    console.error(`could not read ai_generation_log: ${error.message}`);
    process.exit(2);
  }
  const rows = (data ?? []) as Row[];
  // Only the tutor: the other agents have their own prompts and their own
  // cache decisions, and mixing them would answer a question nobody asked.
  const chat = rows.filter((r) => r.kind === 'chat');

  console.log(`\nai_generation_log: ${rows.length} rows, ${chat.length} of them tutor calls\n`);
  if (chat.length === 0) {
    console.log('  nothing to measure yet.\n');
    return;
  }

  const byUser = new Map<string, number[]>();
  for (const r of chat) {
    const t = new Date(r.created_at).getTime();
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push(t);
  }

  // ---- the gaps, which are the whole answer ----
  const gaps: number[] = [];
  for (const times of byUser.values()) {
    for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
  }
  const within5 = gaps.filter((g) => g <= MIN_5).length;
  const between = gaps.filter((g) => g > MIN_5 && g <= HOUR).length;
  const beyond = gaps.filter((g) => g > HOUR).length;

  const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(0)}%` : '—');
  console.log('=== gaps between one student\'s consecutive tutor calls ===\n');
  console.log(`  within 5 minutes      ${String(within5).padStart(5)}  ${pct(within5, gaps.length)}   both TTLs read`);
  console.log(`  5 min to 1 hour       ${String(between).padStart(5)}  ${pct(between, gaps.length)}   ONLY the 1h TTL reads`);
  console.log(`  beyond an hour        ${String(beyond).padStart(5)}  ${pct(beyond, gaps.length)}   both TTLs re-write`);
  console.log(`  first call of a run   ${String(byUser.size).padStart(5)}         always a write\n`);

  // ---- price both ----
  let a = { writes: 0, reads: 0, tokenEq: 0 };
  let b = { writes: 0, reads: 0, tokenEq: 0 };
  for (const times of byUser.values()) {
    const p5 = price(times, MIN_5, WRITE_5M);
    const p1 = price(times, HOUR, WRITE_1H);
    a = { writes: a.writes + p5.writes, reads: a.reads + p5.reads, tokenEq: a.tokenEq + p5.tokenEq };
    b = { writes: b.writes + p1.writes, reads: b.reads + p1.reads, tokenEq: b.tokenEq + p1.tokenEq };
  }
  const noCache = chat.length * PREFIX_TOKENS;

  console.log(`=== cost of the ${PREFIX_TOKENS}-token prefix, in token-equivalents ===\n`);
  console.log(`  no cache at all       ${String(Math.round(noCache)).padStart(9)}`);
  console.log(`  5-minute TTL          ${String(Math.round(a.tokenEq)).padStart(9)}   ${a.writes} writes, ${a.reads} reads`);
  console.log(`  1-hour TTL            ${String(Math.round(b.tokenEq)).padStart(9)}   ${b.writes} writes, ${b.reads} reads`);

  const winner = a.tokenEq < b.tokenEq ? '5-minute' : b.tokenEq < a.tokenEq ? '1-hour' : 'a tie';
  const diff = Math.abs(a.tokenEq - b.tokenEq);
  const worse = Math.max(a.tokenEq, b.tokenEq);
  console.log(`\n  cheaper on this data: ${winner}${winner === 'a tie' ? '' : `, by ${pct(diff, worse)}`}`);

  // ---- and the honesty about the sample ----
  if (gaps.length < 30) {
    console.log(
      `\n  ⚠️ ${gaps.length} gaps is a DIRECTION, not a decision. One person testing in\n` +
        `     short bursts is not the usage pattern of thirty students revising, and\n` +
        `     the whole answer turns on that. Re-run when the log is larger.\n`,
    );
  }
})();
