/**
 * verify-waitlist.ts — the /pricing plan ids and the waitlist RLS policy must
 * name the SAME set of plans.
 *
 * WHY THIS GATE EXISTS
 * --------------------
 * The CTA on /pricing inserts `{ email, plan }` into `public.waitlist`, and the
 * insert policy in supabase-waitlist.sql ends with `plan in (…)`. Those two
 * lists live in two files, in two languages, and nothing connects them. Rename
 * a plan id in PLANS — 'semi' → 'half-year', say — and every insert for that
 * plan is refused by the policy, in production, with no visible symptom on the
 * page beyond an error toast nobody is watching.
 *
 * That is the exact failure the whole change was made to remove: a person says
 * "I want to pay you" and the system silently keeps nothing. A silent drop
 * deserves a gate; a loud one does not.
 *
 * The controls at the bottom are not ceremony. A checker that greps two files
 * reports "0 problems" just as happily when its regexes match nothing at all,
 * so each extractor is run against a known-good and a known-bad string first.
 * If the parsing rots, the controls fail before the real comparison is trusted.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

/** Plan ids as the page declares them: `{ id: 'semi', …` inside PLANS. */
function planIdsFromPage(src: string): string[] {
  const block = src.match(/const PLANS:\s*Plan\[\]\s*=\s*\[([\s\S]*?)\n\];/);
  if (!block) return [];
  return [...block[1].matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]);
}

/** Plan ids the RLS policy admits: `plan in ('monthly', 'semi', …)`. */
function planIdsFromPolicy(sql: string): string[] {
  const list = sql.match(/plan\s+in\s*\(([^)]*)\)/i);
  if (!list) return [];
  return [...list[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Controls — run FIRST, so a broken extractor can never read as a clean pass.
// ---------------------------------------------------------------------------
const failures: string[] = [];

const GOOD_PAGE = `const PLANS: Plan[] = [\n  { id: 'monthly', name: 'x' },\n  { id: 'semi', name: 'y' },\n];`;
const BAD_PAGE = `const OTHER = [{ id: 'monthly' }];`;
if (planIdsFromPage(GOOD_PAGE).join() !== 'monthly,semi') {
  failures.push('CONTROL: planIdsFromPage failed on a known-good PLANS block');
}
if (planIdsFromPage(BAD_PAGE).length !== 0) {
  failures.push('CONTROL: planIdsFromPage matched a block that is not PLANS');
}

const GOOD_SQL = `with check (plan in ('monthly', 'semi', 'yearly'))`;
const BAD_SQL = `with check (char_length(email) > 5)`;
if (planIdsFromPolicy(GOOD_SQL).join() !== 'monthly,semi,yearly') {
  failures.push('CONTROL: planIdsFromPolicy failed on a known-good policy');
}
if (planIdsFromPolicy(BAD_SQL).length !== 0) {
  failures.push('CONTROL: planIdsFromPolicy matched a policy with no plan list');
}

// ---------------------------------------------------------------------------
// The real comparison.
// ---------------------------------------------------------------------------
const page = planIdsFromPage(readFileSync(join(ROOT, 'app/pricing/page.tsx'), 'utf8'));
const policy = planIdsFromPolicy(readFileSync(join(ROOT, 'supabase-waitlist.sql'), 'utf8'));

// Empty on either side means the file moved or was restructured — never a pass.
if (page.length === 0) failures.push('app/pricing/page.tsx: no PLANS ids found (did the const move?)');
if (policy.length === 0) failures.push('supabase-waitlist.sql: no `plan in (…)` list found');

const missingInPolicy = page.filter((id) => !policy.includes(id));
const extraInPolicy = policy.filter((id) => !page.includes(id));

for (const id of missingInPolicy) {
  failures.push(`plan '${id}' is offered on /pricing but REFUSED by the RLS policy — every signup for it is dropped`);
}
for (const id of extraInPolicy) {
  failures.push(`plan '${id}' is allowed by the RLS policy but no longer offered on /pricing`);
}

if (failures.length > 0) {
  console.error('verify:waitlist — FAILED');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(`verify:waitlist — 0 problems (plans in sync: ${page.join(', ')})`);
