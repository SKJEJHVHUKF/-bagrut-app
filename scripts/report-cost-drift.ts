/**
 * report-cost-drift.ts — is the per-turn cost going UP, and which part?
 *
 *   npm run report:drift
 *
 * FREE. Reads the trace, calls nothing.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * Itay, after the third round of optimisation: "כל פעם שאנחנו מצליחים ליעל את
 * עלויות ה-API שוב פעם לאחר כמה ימים הוא זולל הרבה יותר".
 *
 * He is right, and the reason is structural: every fix is measured ONCE, at the
 * moment it ships, against the number it was meant to move. Nothing measures
 * the SUM. A change that adds 200 fresh tokens to buy a real improvement is a
 * good trade and invisible; four of them in a week is the cost back where it
 * started, and no single commit looks wrong.
 *
 * So this reports the per-turn cost by DAY and by COMPONENT. A component that
 * climbs is a change that was never measured after it shipped.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

/** claude-haiku-4-5, $ per million. */
const RATE = { in: 1, out: 5, cw: 2, cr: 0.1 };

type Row = {
  created_at: string;
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
  const { data, error } = await db
    .from('tutor_trace')
    .select('created_at, input_tokens, output_tokens, cached_read, cached_write')
    .order('created_at')
    .limit(20000);
  if (error) {
    console.error(`could not read tutor_trace: ${error.message}`);
    process.exit(2);
  }

  const paid = ((data ?? []) as Row[]).filter(
    (r) => (r.input_tokens ?? 0) + (r.output_tokens ?? 0) + (r.cached_read ?? 0) + (r.cached_write ?? 0) > 0,
  );

  const byDay = new Map<string, Row[]>();
  for (const r of paid) {
    const d = r.created_at.slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(r);
  }

  const avg = (rows: Row[], pick: (r: Row) => number) =>
    rows.reduce((s, r) => s + pick(r), 0) / rows.length;

  console.log('\nper PAID turn, by day — the numbers, not the story\n');
  console.log('day          turns   fresh-in  cache-rd  cache-WR    out    $/turn   writes');
  for (const [day, rows] of byDay) {
    const fin = avg(rows, (r) => r.input_tokens ?? 0);
    const crd = avg(rows, (r) => r.cached_read ?? 0);
    const cwr = avg(rows, (r) => r.cached_write ?? 0);
    const out = avg(rows, (r) => r.output_tokens ?? 0);
    const usd =
      (fin * RATE.in + out * RATE.out + cwr * RATE.cw + crd * RATE.cr) / 1e6;
    const writes = rows.filter((r) => (r.cached_write ?? 0) > 0).length;
    console.log(
      day,
      String(rows.length).padStart(7),
      String(Math.round(fin)).padStart(10),
      String(Math.round(crd)).padStart(10),
      String(Math.round(cwr)).padStart(10),
      String(Math.round(out)).padStart(7),
      ('$' + usd.toFixed(4)).padStart(9),
      `${writes}/${rows.length}`.padStart(8),
    );
  }

  // ---- the one number that decides whether the trend is real ----
  const days = [...byDay.keys()];
  if (days.length >= 2) {
    const first = byDay.get(days[0])!;
    const last = byDay.get(days[days.length - 1])!;
    const freshFirst = avg(first, (r) => r.input_tokens ?? 0);
    const freshLast = avg(last, (r) => r.input_tokens ?? 0);
    console.log(`\n  fresh input per turn: ${Math.round(freshFirst)} → ${Math.round(freshLast)} tokens`);
    console.log('  ⚠️ THIS IS THE ONE TO WATCH. The cached prefix is billed at 0.1x and');
    console.log('  is visible in every review; fresh input is billed at 1.0x and nobody');
    console.log('  looks at it, so it is where a fix quietly puts its cost back.\n');
  }

  // ---- and how much of the bill is the cache WRITE, which a deploy resets ----
  const writes = paid.filter((r) => (r.cached_write ?? 0) > 0);
  const writeCost = writes.reduce((s, r) => s + ((r.cached_write ?? 0) * RATE.cw) / 1e6, 0);
  const allCost = paid.reduce(
    (s, r) =>
      s +
      ((r.input_tokens ?? 0) * RATE.in +
        (r.output_tokens ?? 0) * RATE.out +
        (r.cached_write ?? 0) * RATE.cw +
        (r.cached_read ?? 0) * RATE.cr) / 1e6,
    0,
  );
  console.log(
    `  cache writes: ${writes.length} of ${paid.length} turns, $${writeCost.toFixed(4)} of $${allCost.toFixed(4)} ` +
      `(${((writeCost / allCost) * 100).toFixed(0)}% of everything)`,
  );
  console.log('  A write happens on the first turn after ANY deploy, per topic, per');
  console.log('  hour. During a day of shipping it is most of the bill and it is not');
  console.log('  what a student pays; on a quiet day it should be a few percent.\n');
})();
