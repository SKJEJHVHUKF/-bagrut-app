/**
 * report-cost-shape.ts — of every dollar the tutor spends, where does it go?
 *
 *   npm run report:shape
 *   npm run report:shape -- --days 3
 *
 * FREE. Reads the trace, calls nothing.
 *
 * ============================================================
 * WHY A SHAPE AND NOT A TOTAL
 * ============================================================
 * "Three questions cost $0.02" is true and unactionable. The four components
 * are billed at rates that differ by 20x — cache write 2x, fresh input 1x,
 * cache read 0.1x, output 5x — so the biggest NUMBER is almost never the
 * biggest COST, and two rounds of work went into the wrong one before this
 * existed.
 *
 * It also splits FIRST turns from LATER ones. A cache write is paid once per
 * prefix per TTL window and then amortises; reporting it mixed into an average
 * hides both the spike a student actually feels and the steady state that
 * decides the monthly bill.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const DAYS = process.argv.includes('--days')
  ? Number(process.argv[process.argv.indexOf('--days') + 1]) || 7
  : 7;

/** claude-haiku-4-5, $ per million: in 1, out 5, 1h-write 2, read 0.1. */
const RATE = { in: 1, out: 5, cw: 2, cr: 0.1 };

type Row = {
  created_at: string;
  topic: string;
  input_tokens: number;
  output_tokens: number;
  cached_read: number;
  cached_write: number;
};

(async () => {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
  const { data, error } = await db
    .from('tutor_trace')
    .select('created_at, topic, input_tokens, output_tokens, cached_read, cached_write')
    .gte('created_at', since)
    .limit(20000);
  if (error) {
    console.error(`could not read tutor_trace: ${error.message}`);
    process.exit(2);
  }

  const rows = ((data ?? []) as Row[]).filter(
    (r) => (r.input_tokens ?? 0) + (r.output_tokens ?? 0) + (r.cached_read ?? 0) + (r.cached_write ?? 0) > 0,
  );
  if (!rows.length) {
    console.log('\nno paid turns in the window\n');
    return;
  }

  const usd = (r: Row) =>
    ((r.input_tokens ?? 0) * RATE.in +
      (r.output_tokens ?? 0) * RATE.out +
      (r.cached_write ?? 0) * RATE.cw +
      (r.cached_read ?? 0) * RATE.cr) / 1e6;

  // A turn that WROTE the prefix is a first turn; one that read it is a later one.
  const first = rows.filter((r) => (r.cached_write ?? 0) > 0);
  const later = rows.filter((r) => (r.cached_write ?? 0) === 0);

  const shape = (set: Row[], label: string) => {
    if (!set.length) { console.log(`\n${label}: none\n`); return; }
    const t = {
      cw: set.reduce((s, r) => s + (r.cached_write ?? 0) * RATE.cw, 0),
      in: set.reduce((s, r) => s + (r.input_tokens ?? 0) * RATE.in, 0),
      out: set.reduce((s, r) => s + (r.output_tokens ?? 0) * RATE.out, 0),
      cr: set.reduce((s, r) => s + (r.cached_read ?? 0) * RATE.cr, 0),
    };
    const all = t.cw + t.in + t.out + t.cr;
    const avg = set.reduce((s, r) => s + usd(r), 0) / set.length;
    console.log(`\n${label} — ${set.length} turns, $${avg.toFixed(4)} each on average`);
    const line = (name: string, v: number, raw: number) =>
      console.log(
        `  ${name.padEnd(14)} ${((v / all) * 100).toFixed(0).padStart(3)}%   ` +
          `${String(Math.round(raw)).padStart(6)} tok/turn   $${(v / 1e6 / set.length).toFixed(5)}/turn`,
      );
    line('cache WRITE', t.cw, set.reduce((s, r) => s + (r.cached_write ?? 0), 0) / set.length);
    line('fresh input', t.in, set.reduce((s, r) => s + (r.input_tokens ?? 0), 0) / set.length);
    line('output', t.out, set.reduce((s, r) => s + (r.output_tokens ?? 0), 0) / set.length);
    line('cache read', t.cr, set.reduce((s, r) => s + (r.cached_read ?? 0), 0) / set.length);
  };

  console.log(`\n=== ${rows.length} paid turns over ${DAYS} days, $${rows.reduce((s, r) => s + usd(r), 0).toFixed(4)} ===`);
  shape(first, 'TURNS THAT WROTE THE PREFIX (the spike a student feels)');
  shape(later, 'TURNS THAT READ IT (the steady state that decides the bill)');
  shape(rows, 'EVERYTHING');

  // The write is paid per prefix per window; how often is it actually repeated?
  console.log(`\n  writes ${first.length} · reads ${later.length} · ${(later.length / Math.max(1, first.length)).toFixed(1)} reads per write`);
  console.log('  A 1h write costs 2x and a read 0.1x, so a write pays for itself');
  console.log('  after ~1.2 reads. Below that, caching this prefix loses money.\n');
})();
