/**
 * check-usage.ts — is the billed-call log actually recording anything?
 *
 *   npx tsx scripts/check-usage.ts
 *
 * FREE, read-only. `ai_calls_today()` returning 0 is ambiguous: it means either
 * "no AI calls today" or "logging has never worked". Those need very different
 * responses, and the table cannot tell you which without being asked.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

const DAY = 86_400_000;
const since = (days: number) => new Date(Date.now() - days * DAY).toISOString();

(async () => {
  const { count: total, error } = await db
    .from('ai_generation_log')
    .select('*', { head: true, count: 'exact' });
  if (error) {
    console.error('cannot read ai_generation_log:', error.message);
    process.exit(1);
  }

  const { data: rpc } = await db.rpc('ai_calls_today');
  console.log(`\nai_generation_log`);
  console.log(`  rows ever            ${total}`);
  console.log(`  ai_calls_today()     ${rpc ?? 'n/a'}   ← what the 800/day brake reads`);

  if (!total) {
    console.log(`\n⚠️  The table is EMPTY. Either no student has used an AI feature since it was`);
    console.log(`   created, or logAgentUsage is failing. Use a paid feature once and re-run:`);
    console.log(`   a row must appear. If it does not, the write is being rejected (RLS) and`);
    console.log(`   every per-user quota is running on lambda memory only.\n`);
    return;
  }

  for (const [label, days] of [['today', 0], ['last 7 days', 7], ['last 30 days', 30]] as const) {
    const q = db.from('ai_generation_log').select('kind', { count: 'exact' });
    const { data, count } = days === 0
      ? await q.gte('created_at', new Date().toISOString().slice(0, 10))
      : await q.gte('created_at', since(days));
    const byKind = new Map<string, number>();
    for (const r of data ?? []) byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1);
    const top = [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, n]) => `${k}:${n}`).join('  ');
    console.log(`  ${label.padEnd(20)} ${String(count ?? 0).padStart(5)}   ${top}`);
  }

  const { data: newest } = await db
    .from('ai_generation_log').select('kind, created_at')
    .order('created_at', { ascending: false }).limit(1);
  if (newest?.[0]) {
    const ago = Math.round((Date.now() - new Date(newest[0].created_at).getTime()) / 60000);
    console.log(`\n  most recent call     ${newest[0].kind}, ${ago} min ago`);
  }
  console.log();
})();
