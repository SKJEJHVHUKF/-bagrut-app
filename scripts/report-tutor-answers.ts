/**
 * report-tutor-answers.ts — what the library holds, and what it has saved.
 *
 *   npx tsx scripts/report-tutor-answers.ts
 *   npx tsx scripts/report-tutor-answers.ts --pending      the review queue
 *   npx tsx scripts/report-tutor-answers.ts --approve 42   promote one row
 *   npx tsx scripts/report-tutor-answers.ts --reject 42
 *
 * FREE, and the only script here that writes: --approve/--reject are how a
 * `pending` answer becomes servable. There is no admin UI, and one command is
 * cheaper than building one for a queue that a person reads a few times a week.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const argv = process.argv.slice(2);
const flag = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const APPROVE = flag('--approve');
const REJECT = flag('--reject');
const PENDING_ONLY = argv.includes('--pending');

type Row = {
  id: number; created_at: string; topic: string; question_id: string; intent: string;
  normalized_message: string; answer: string; model: string; output_tokens: number;
  status: string; hits: number; last_hit_at: string | null;
};

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('missing Supabase credentials'); process.exit(2); }
  const db = createClient(url, key, { auth: { persistSession: false } });

  // ---- the two writes ----
  for (const [id, status] of [[APPROVE, 'live'], [REJECT, 'rejected']] as const) {
    if (!id) continue;
    const { error } = await db.from('tutor_answer').update({ status }).eq('id', Number(id));
    console.log(error ? `failed: ${error.message}` : `row ${id} → ${status}`);
    if (!error && status === 'live') {
      console.log('  It will be served from the next turn. Nothing to deploy.');
    }
    return;
  }

  const { data, error } = await db
    .from('tutor_answer').select('*').order('created_at', { ascending: false }).limit(2000);
  if (error) {
    console.error(`\n⛔ could not read tutor_answer (${error.code ?? '?'}: ${error.message})\n`);
    console.error('   If the table does not exist yet, run supabase-tutor-answer.sql in the');
    console.error('   Supabase SQL editor. Until then every answer is paid for again each time.\n');
    process.exit(2);
  }
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    console.log('\nThe table exists and is empty. No turn has reached the model since it was created.\n');
    return;
  }

  const by = (s: string) => rows.filter((r) => r.status === s);
  const live = by('live'), pending = by('pending'), rejected = by('rejected');
  const hits = rows.reduce((s, r) => s + r.hits, 0);

  console.log(`\n=== the library ===\n`);
  console.log(`  live (served automatically)   ${String(live.length).padStart(5)}`);
  console.log(`  pending (waiting on you)      ${String(pending.length).padStart(5)}`);
  console.log(`  rejected                      ${String(rejected.length).padStart(5)}`);
  console.log(`\n  model calls that did NOT happen: ${hits}`);
  if (hits === 0 && live.length > 0) {
    console.log('  ⚠️ Nothing has been reused yet. Expected early: a row can only be hit by a');
    console.log('     SECOND student asking the same thing. It is not evidence of a fault.');
  }

  if (live.length) {
    console.log('\n=== most reused ===\n');
    for (const r of [...live].sort((a, b) => b.hits - a.hits).slice(0, 10)) {
      console.log(`  ${String(r.hits).padStart(4)} × [${r.intent}] "${r.normalized_message}"  (${r.topic}/${r.question_id})`);
    }
  }

  const queue = PENDING_ONLY ? pending : pending.slice(0, 8);
  if (queue.length) {
    console.log(`\n=== the review queue — ${pending.length} waiting ===\n`);
    console.log('  These are answers about ONE exercise, so they are never served until a');
    console.log('  person says so. Read the answer, then approve or reject by id.\n');
    for (const r of queue) {
      console.log(`  #${r.id}  [${r.intent}]  ${r.topic} / ${r.question_id}`);
      console.log(`      asked: "${r.normalized_message}"`);
      console.log(`      ${r.answer.replace(/\s+/g, ' ').slice(0, 220)}${r.answer.length > 220 ? '…' : ''}`);
      console.log(`      npx tsx scripts/report-tutor-answers.ts --approve ${r.id}\n`);
    }
    if (!PENDING_ONLY && pending.length > queue.length)
      console.log(`  … ${pending.length - queue.length} more — run with --pending to see them all\n`);
  }
})();
