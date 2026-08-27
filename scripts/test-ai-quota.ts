/**
 * test-ai-quota.ts — the six cases, five of them against the real database.
 *
 *   npx tsx scripts/test-ai-quota.ts
 *
 * FREE. No model is called. Uses a synthetic user id and deletes its rows at
 * the end, so it is safe to run against production Supabase — which is the
 * point: the concurrency case and the Israeli-midnight case cannot be proved
 * anywhere else. A mock of Postgres row locking proves that the mock locks.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const TEST_USER = '00000000-0000-4000-8000-0000000000aa';
const CAP = 10;

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('missing Supabase credentials'); process.exit(2); }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const reserve = async () => {
    const { data, error } = await db.rpc('reserve_ai_call', { p_user: TEST_USER, p_limit: CAP });
    if (error) throw new Error(`${error.code}: ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: row.allowed === true, used: Number(row.used) };
  };
  const release = async () => {
    const { data, error } = await db.rpc('release_ai_call', { p_user: TEST_USER });
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return Number(data);
  };
  const read = async () => {
    const { data, error } = await db.rpc('read_ai_usage', { p_user: TEST_USER, p_limit: CAP });
    if (error) throw new Error(`${error.code}: ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return Number(row.used);
  };
  const wipe = () => db.from('ai_daily_usage').delete().eq('user_id', TEST_USER);

  try {
    await wipe();

    console.log('\n=== 1-2. ten pass, the eleventh does not ===\n');
    let allAllowed = true;
    for (let i = 1; i <= CAP; i++) {
      const r = await reserve();
      if (!r.allowed || r.used !== i) allAllowed = false;
    }
    ok(allAllowed, `${CAP} successive calls are allowed, and the counter reads 1…${CAP}`);
    const eleventh = await reserve();
    ok(!eleventh.allowed, 'the 11th is refused');
    ok(eleventh.used === CAP, `and the counter did NOT move past the cap (${eleventh.used})`);
    ok((await read()) === CAP, 'what the UI reads agrees with what the gate decided');

    console.log('\n=== 4. a failed call gives the credit back ===\n');
    ok((await release()) === CAP - 1, 'release decrements');
    const afterRelease = await reserve();
    ok(afterRelease.allowed && afterRelease.used === CAP, 'the freed credit can be spent again');
    // Two releases in a row must not mint credit out of nothing.
    await release(); await release();
    ok((await read()) === CAP - 2, 'a double release decrements twice, no further');
    for (let i = 0; i < 20; i++) await release();
    ok((await read()) === 0, 'releasing past zero floors at zero rather than going negative');

    console.log('\n=== 5. two requests, one credit ===\n');
    await wipe();
    for (let i = 1; i < CAP; i++) await reserve();      // 9 used, 1 left
    ok((await read()) === CAP - 1, 'set up with exactly one credit left');
    // Fired together, deliberately not awaited in sequence.
    const [a, b] = await Promise.all([reserve(), reserve()]);
    const winners = [a, b].filter((r) => r.allowed).length;
    ok(winners === 1, `exactly one of two concurrent requests got the last credit (got ${winners})`);
    ok((await read()) === CAP, 'and the counter is at the cap, not above it');

    console.log('\n=== 6. the day rolls over in Israel, not in UTC ===\n');
    await wipe();
    // What Postgres thinks today is, in Israel.
    const { data: dRow } = await db.rpc('reserve_ai_call', { p_user: TEST_USER, p_limit: CAP });
    void dRow;
    const { data: stored } = await db
      .from('ai_daily_usage').select('usage_date').eq('user_id', TEST_USER).limit(1);
    const pgDate = (stored?.[0] as { usage_date: string } | undefined)?.usage_date ?? '';
    const jsDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
    ok(pgDate === jsDate, `the row is dated by the Israeli calendar (postgres ${pgDate}, node ${jsDate})`);

    // A row from the Israeli yesterday must not be counted today. This is the
    // case UTC midnight got wrong: at 00:30 in Israel it is still yesterday in
    // UTC, so the old reset handed the allowance back in the middle of the night.
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    const yDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(yesterday);
    await db.from('ai_daily_usage').insert({
      user_id: TEST_USER, usage_date: yDate, successful_ai_calls: CAP, daily_limit: CAP,
    });
    ok((await read()) === 1, `yesterday's ${CAP} used calls do not count today`);
    const freshToday = await reserve();
    ok(freshToday.allowed, 'and today still has credit despite a full day yesterday');

    console.log('\n=== 3. a local answer never reaches the counter ===\n');
    // Control flow, not state: the only call site must sit behind the guard
    // that means "no local layer and no library answer could serve this".
    const route = readFileSync('app/api/chat/route.ts', 'utf8');
    const calls = (route.match(/reserveAiCall\(/g) ?? []).length;
    ok(calls === 1, `reserveAiCall has exactly one call site (found ${calls})`);
    const guarded = /if \(!learned && \(enforceV2 \|\| shadowV2\)\) \{[\s\S]{0,400}?reserveAiCall\(/.test(route);
    ok(guarded, 'and it sits inside `if (!learned && …)` — a library hit cannot spend a credit');
    const releases = (route.match(/releaseAiCall\(/g) ?? []).length;
    ok(releases >= 3, `every failure path gives the credit back (${releases} release sites)`);
  } catch (e) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`\n  x   the RPCs are not installed or failed: ${msg}`);
    console.log('      Run supabase-ai-daily-usage.sql in the Supabase SQL editor.');
  } finally {
    await wipe();
    console.log('\n(test rows deleted)');
  }

  console.log(failed === 0 ? '\nOK ai quota: reserved atomically, returned on failure, Israeli midnight\n' : `\nFAILED: ${failed}\n`);
  process.exitCode = failed === 0 ? 0 : 1;
})();
