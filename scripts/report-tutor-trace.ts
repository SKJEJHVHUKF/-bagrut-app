/**
 * report-tutor-trace.ts — what REALLY reached the model, from real sessions.
 *
 *   npx tsx scripts/report-tutor-trace.ts
 *   npx tsx scripts/report-tutor-trace.ts --days 3
 *
 * FREE, read-only.
 *
 * ============================================================
 * WHY THIS EXISTS ALONGSIDE report-tutor-usage
 * ============================================================
 * The other report is a CENSUS: every phrasing I could think of, against every
 * question, through the real chain. It is complete and it is imaginary — it
 * measures the phrasings I enumerated, which is exactly the set that keeps
 * turning out to be the wrong one. Every miss Itay reported was a shape absent
 * from it.
 *
 * This one is a SAMPLE, and it is real. Fewer rows, no coverage guarantees,
 * and every line is something a person actually typed. When the two disagree,
 * this one is right.
 *
 * ⚠️ AN EMPTY REPORT IS AMBIGUOUS. It means either "no turn reached the model"
 * or "the table does not exist yet". Those are opposite conclusions, so the
 * script checks which and says so rather than printing a comforting zero.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const DAYS = process.argv.includes('--days')
  ? Number(process.argv[process.argv.indexOf('--days') + 1]) || 7
  : 7;

type Trace = {
  created_at: string;
  screen: string;
  topic: string;
  question_id: string;
  normalized_message: string;
  intent: string;
  confidence: number;
  local_router_matched: boolean;
  compiler_flag_on: boolean;
  fallback_reason: string;
  duration_ms: number;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cached_read: number;
  cached_write: number;
  used_llm: boolean;
};

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');

function table(title: string, rows: Map<string, Trace[]>, total: number) {
  console.log(`\n=== ${title} ===\n`);
  const sorted = [...rows.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [k, rs] of sorted) {
    console.log(`  ${(k || '(none)').padEnd(30)} ${String(rs.length).padStart(5)}  ${pct(rs.length, total)}`);
  }
}

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('missing Supabase credentials in the environment');
    process.exit(2);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();

  const { data, error } = await db
    .from('tutor_trace')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    // The ambiguity that matters more than any number below.
    console.error(`\n⛔ could not read tutor_trace (${error.code ?? '?'}: ${error.message})\n`);
    console.error('   If the table does not exist yet, run supabase-tutor-trace.sql in the');
    console.error('   Supabase SQL editor. Until then nothing is being collected — and an');
    console.error('   empty report would have looked exactly like "everything is local".\n');
    process.exit(2);
  }

  const all = (data ?? []) as Trace[];
  // ⚠️ THE HEADLINE IS THE RATE, NOT THE COUNT.
  //
  // This report used to open with "turns that reached the model: 5", which is
  // a number nobody can act on: five out of eight is an emergency and five out
  // of eighty is a finished job. The local rows exist so the denominator does.
  const rows = all.filter((r) => r.used_llm !== false);
  const localRows = all.filter((r) => r.used_llm === false);
  const total = all.length;
  console.log(`\ntutor turns, last ${DAYS} days: ${total}\n`);
  if (total > 0) {
    console.log(`  answered locally, no model call   ${String(localRows.length).padStart(5)}  ${pct(localRows.length, total)}`);
    console.log(`  reached the model                 ${String(rows.length).padStart(5)}  ${pct(rows.length, total)}`);
  }
  if (localRows.length === 0 && rows.length > 0) {
    console.log();
    console.log('  ⚠️ No local turns recorded. Either every turn really did reach the model,');
    console.log('     or these rows predate /api/tutor-trace — the rate above is then a');
    console.log('     ceiling, not a measurement.');
  }
  console.log();
  if (rows.length === 0) {
    console.log('  No turn reached the model in this window.');
    if (localRows.length) console.log(`  ${localRows.length} turn(s) were answered locally. That is the goal state.`);
    else console.log('  And no local turns either — nobody used the tutor.');
    return;
  }

  // ---- the breakdowns ----
  const by = (f: (t: Trace) => string) => {
    const m = new Map<string, Trace[]>();
    for (const r of rows) {
      const k = f(r);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  };

  table('why the model was reached', by((r) => r.fallback_reason), rows.length);
  table('by intent (blank = no rule recognised it)', by((r) => r.intent), rows.length);
  table('by screen', by((r) => r.screen), rows.length);
  table('by topic', by((r) => r.topic), rows.length);

  // ---- the phrasings, which are the actual work list ----
  console.log('\n=== the phrasings that reach the model, most common first ===\n');
  console.log('  This is the authoring and rule backlog. Every line is something a');
  console.log('  person typed that no local layer could answer.\n');
  const phrases = new Map<string, { n: number; reason: string; intent: string }>();
  for (const r of rows) {
    const k = r.normalized_message || '(empty)';
    const cur = phrases.get(k) ?? { n: 0, reason: r.fallback_reason, intent: r.intent };
    phrases.set(k, { ...cur, n: cur.n + 1 });
  }
  for (const [p, { n, reason, intent }] of [...phrases.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 25)) {
    console.log(`  ${String(n).padStart(4)} × "${p}"`);
    console.log(`         ${reason}${intent ? ` · intent ${intent}` : ' · no intent recognised'}`);
  }

  // ---- cost ----
  const inTok = rows.reduce((s, r) => s + r.input_tokens, 0);
  const outTok = rows.reduce((s, r) => s + r.output_tokens, 0);
  const read = rows.reduce((s, r) => s + r.cached_read, 0);
  const write = rows.reduce((s, r) => s + r.cached_write, 0);
  const slow = rows.filter((r) => r.duration_ms > 8000).length;
  console.log('\n=== what it cost ===\n');
  console.log(`  input tokens          ${inTok}`);
  console.log(`  output tokens         ${outTok}`);
  console.log(`  cache reads           ${read}`);
  console.log(`  cache writes          ${write}   ← the expensive half; a write bills 2× at the 1h TTL`);
  console.log(`  turns over 8 seconds  ${slow}  (${pct(slow, rows.length)})`);
  const withFlag = rows.filter((r) => r.compiler_flag_on).length;
  console.log(`\n  turns with the compiler flag ON: ${withFlag} (${pct(withFlag, rows.length)})`);
  if (withFlag === 0) {
    console.log('  ⚠️ None. Either the flag is off, or these turns predate it — the');
    console.log('     compiler cannot be judged from rows it never ran on.\n');
  }
})();
