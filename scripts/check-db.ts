/**
 * check-db.ts — which of the app's tables and functions actually exist?
 *
 *   npx tsx scripts/check-db.ts
 *
 * FREE, read-only. Written because "the SQL was never run" had been a claim in
 * the handoff notes for days without anyone checking it, and half the app's
 * quota logic fails SILENTLY when a table is missing: supabase-js RETURNS the
 * error instead of throwing, and every call site swallowed it.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

// Not named `URL` — that shadows the global URL constructor used below.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

/** What breaks when this object is missing, in the app's own terms. */
const TABLES: [string, string, string][] = [
  ['ai_generation_log', 'supabase-security-hardening.sql', 'no record of billed calls; per-user daily quotas survive only in lambda memory; the global brake cannot count'],
  ['question_bank', 'supabase-question-bank.sql', 'scanned questions are never reused — every scan pays the model again'],
  ['solution_cache', 'supabase-question-bank.sql', 'the same solution is re-generated for every student who scans it'],
  ['bank_reports', 'supabase-question-bank.sql', '"this answer is wrong" reports have nowhere to go'],
  ['question_pool', 'supabase-question-bank.sql', 'pre-generated quiz questions cannot be served'],
  ['learning_state', 'supabase-learning-path.sql', 'progress does not sync between the student\'s devices'],
  ['chat_messages', 'supabase-conversations.sql', 'the tutor has no conversation history'],
  ['conversations', 'supabase-conversations.sql', 'the tutor cannot open a conversation'],
  ['teacher_students', 'supabase-teachers.sql', '/teacher loads with an empty roster — a teacher sees none of his students'],
  ['assignments', 'supabase-teachers.sql', 'a teacher cannot give a task, and the student\'s task card renders nothing'],
  ['teacher_week_hours', 'supabase-teachers.sql', 'a week whose hours differed cannot be corrected; pay is the standing figure only'],
];

/**
 * ⚠️ Argument names must match the SQL EXACTLY. PostgREST resolves an RPC by
 * (name + argument names), so a typo produces "Could not find the function …"
 * — the same message a missing function produces. The first version of this
 * script passed `lim` instead of `max_rows` and reported a function that
 * exists as MISSING, which would have sent someone to re-run SQL for nothing.
 */
const FUNCTIONS: [string, Record<string, unknown>, string, string][] = [
  ['ai_calls_today', {}, 'supabase-security-hardening.sql', 'the GLOBAL daily ceiling (800 calls) is never enforced'],
  ['search_question_bank', { q: 'בדיקה', max_rows: 1 }, 'supabase-question-bank.sql', 'scan reuse cannot look anything up'],
];

(async () => {
  console.log(`\nchecking ${new URL(SUPABASE_URL).host}\n`);
  const missing = new Set<string>();
  let ok = 0;

  for (const [table, file, breaks] of TABLES) {
    const { error } = await db.from(table).select('*', { head: true, count: 'exact' }).limit(1);
    if (error) {
      missing.add(file);
      console.log(`  ❌ ${table.padEnd(20)} MISSING → ${breaks}`);
    } else {
      ok++;
      console.log(`  ✅ ${table.padEnd(20)} exists`);
    }
  }
  for (const [fn, args, file, breaks] of FUNCTIONS) {
    const { error } = await db.rpc(fn, args);
    // A function that exists but rejects the arguments still proves existence.
    if (error && /function .* does not exist|Could not find the function/i.test(error.message)) {
      missing.add(file);
      console.log(`  ❌ ${(fn + '()').padEnd(20)} MISSING → ${breaks}`);
    } else {
      ok++;
      console.log(`  ✅ ${(fn + '()').padEnd(20)} exists`);
    }
  }

  console.log(`\n${ok}/${TABLES.length + FUNCTIONS.length} present`);
  if (missing.size === 0) {
    console.log('✅ nothing to run — the database is complete.\n');
    return;
  }
  console.log('\nRun these in the Supabase SQL editor, one at a time, IN THIS ORDER:');
  // Order matters: hardening revokes grants on functions question-bank creates.
  const ORDER = ['supabase-conversations.sql', 'supabase-question-bank.sql', 'supabase-security-hardening.sql', 'supabase-learning-path.sql'];
  ORDER.filter((f) => missing.has(f)).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log('\nAll of them are idempotent (create if not exists / drop policy if exists),');
  console.log('so re-running one that is already applied changes nothing.\n');
})();
