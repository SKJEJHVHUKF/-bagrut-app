-- ============================================================
-- question_bank — the answer library that grows from real scans.
-- Run ONCE in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- ============================================================
--
-- WHY THIS EXISTS
-- ---------------
-- Today a photographed question that isn't in the 855-entry static corpus
-- costs an AI call — and so does the NEXT student who photographs the same
-- page, because `solution_cache` is keyed by an exact hash of the OCR text
-- and two photos of one page never produce identical text.
--
-- This table is the durable version of that idea: one row per DISTINCT
-- question, found by fuzzy match rather than exact hash, carrying quality
-- signals so a solution nobody has checked is never labelled "verified".
-- Every solve writes here, so the marginal cost of a repeated question
-- falls to zero.
--
-- The app degrades gracefully without this table: every call is wrapped in
-- try/catch and simply behaves as it does today (static corpus + cache).
--
-- READS ARE PUBLIC, DELIBERATELY
-- ------------------------------
-- `solution_cache` grants select to `authenticated` only, which means an
-- anonymous student silently gets an EMPTY cache. The free path in
-- app/api/scan-solve/route.ts is deliberately open to everyone, so an
-- anon-invisible bank would contradict the whole design. Reads are therefore
-- granted to `anon`; writes stay with `authenticated`, and the solve path
-- that produces them already requires a signed-in user and a daily quota.
-- Rows contain nothing personal: a maths question and its worked solution.
-- ============================================================

-- Trigram search. Without this the candidate query below falls back to a
-- sequential scan, which is fine at 200 rows and useless at 20,000.
create extension if not exists pg_trgm;

-- ⚠️ RUN THIS ONE LINE FIRST AND LOOK AT THE OUTPUT.
--
-- pg_trgm splits on non-alphanumerics using the database ctype. Under a `C`
-- ctype every Hebrew character counts as a separator, the trigram index over
-- Hebrew text is empty, and candidate search silently returns nothing —
-- a failure that looks exactly like "no questions in the bank yet".
--
--     select show_trgm('פתור את המשוואה');
--
-- Healthy   → a list of Hebrew trigrams, e.g. {"  פ"," פת",פתו,תור,...}
-- BROKEN    → an empty list or whitespace-only entries.
-- If it is broken, tell Claude: the fix is to index an ASCII-folded key
-- instead, which needs a small code change and this file re-run.

create table if not exists public.question_bank (
  id                uuid primary key default gen_random_uuid(),
  -- FNV-1a of the normalized text. Catches only exact repeats; the fuzzy
  -- path below is what actually finds a re-photographed question.
  question_hash     text not null unique,
  -- normalizeQuestionText() output — the column the trigram index covers.
  normalized_text   text not null,
  -- The wording shown to the student on a hit.
  canonical_text    text not null,
  topic             text,
  unit_level        int  not null default 5,
  solution_markdown text not null,

  -- Quality, all machine-derived. See lib/mathscan/bank.ts for promotion.
  --   'new'          a single AI solution, nothing has checked it
  --   'corroborated' >= 2 independent scans produced a matching answer
  --   'verified'     the local CAS confirmed the answer by substitution
  quality_tier      text not null default 'new'
                    check (quality_tier in ('new', 'corroborated', 'verified')),
  cas_verified      boolean not null default false,
  agreement_count   int  not null default 1,
  -- Independent scans whose ANSWER disagreed with the stored one.
  disputed          int  not null default 0,
  served_count      int  not null default 0,
  reported_wrong    int  not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists question_bank_trgm_idx
  on public.question_bank using gin (normalized_text gin_trgm_ops);
create index if not exists question_bank_hash_idx
  on public.question_bank (question_hash);

-- ------------------------------------------------------------
-- Candidate search
-- ------------------------------------------------------------
-- Stage one of two. This returns ~20 plausible rows using the trigram index;
-- the app then re-ranks them with the calibrated matcher in
-- lib/mathscan/match.ts (threshold 0.55, margin 0.08, measured 92.6% recall
-- with zero wrong matches). Postgres narrows the field, it does not decide.
--
-- An RPC is required because the supabase-js client cannot express the `%`
-- operator, and `%` is what uses the GIN index.
--
-- The similarity floor is lowered from pg_trgm's default 0.3 via a
-- FUNCTION-LEVEL `SET`, not `set_limit()`: `set_limit` is VOLATILE and cannot
-- be called from a STABLE function, and supabase-js has no way to set a
-- session GUC. OCR noise routinely pushes a true match under 0.3, and the
-- app's own matcher is the real gate, so being generous here costs only a
-- few extra candidate rows.
create or replace function public.search_question_bank(
  q         text,
  max_rows  int  default 20
)
returns table (
  id                uuid,
  canonical_text    text,
  normalized_text   text,
  topic             text,
  unit_level        int,
  solution_markdown text,
  quality_tier      text,
  agreement_count   int,
  reported_wrong    int,
  sim               real
)
language sql
stable
set pg_trgm.similarity_threshold = 0.15
as $$
  select b.id, b.canonical_text, b.normalized_text, b.topic, b.unit_level,
         b.solution_markdown, b.quality_tier, b.agreement_count,
         b.reported_wrong, similarity(b.normalized_text, q) as sim
  from public.question_bank b
  -- Three independent reports retire a row from search entirely.
  where b.reported_wrong < 3
    -- `%`, NOT `similarity(...) > x`: only the operator uses the GIN index.
    -- A bare similarity predicate produces a sequential scan and the whole
    -- point of the index is lost. Confirm with EXPLAIN ANALYZE that this
    -- shows a Bitmap Index Scan on question_bank_trgm_idx.
    and b.normalized_text % q
  order by similarity(b.normalized_text, q) desc
  limit greatest(1, least(max_rows, 50));
$$;

-- ------------------------------------------------------------
-- Atomic counters
-- ------------------------------------------------------------
-- These are functions rather than client-side updates because a read-then-
-- write from two concurrent scans loses one of the increments — and
-- `agreement_count` is a quality signal, so losing increments quietly
-- understates how corroborated a solution is.

create or replace function public.increment_bank_served(row_id uuid)
returns void
language sql
volatile
as $$
  update public.question_bank
     set served_count = served_count + 1
   where id = row_id;
$$;

-- A student reporting a wrong solution is the only ground truth that reaches
-- us without a reviewer, so it also DEMOTES the quality claim: two reports
-- drop the row back to 'new', and three retire it from search (the `< 3`
-- filter above), which no stale client can bypass.
create or replace function public.report_bank_wrong(row_id uuid)
returns void
language sql
volatile
as $$
  update public.question_bank
     set reported_wrong = reported_wrong + 1,
         quality_tier   = case when reported_wrong + 1 >= 2 then 'new'
                               else quality_tier end,
         cas_verified   = case when reported_wrong + 1 >= 2 then false
                               else cas_verified end,
         updated_at     = now()
   where id = row_id;
$$;

-- ------------------------------------------------------------
-- RLS — reads are public, WRITES ARE SERVER-ONLY (service role)
-- ------------------------------------------------------------
-- The bank used to carry `for insert/update to authenticated ... (true)` so the
-- route could write as the student. Those policies also applied to the
-- student's own browser: any signed-in account could rewrite every row's
-- solution_markdown and stamp it 'verified' (2026-08-19 security audit, H2).
-- Writes now go through lib/supabase/admin.ts (service role, bypasses RLS),
-- so no write policy exists for anon/authenticated at all.
alter table public.question_bank enable row level security;

drop policy if exists "public read question_bank" on public.question_bank;
create policy "public read question_bank" on public.question_bank
  for select to anon, authenticated using (true);

-- Remove the old client write policies (no-ops on a fresh database).
drop policy if exists "authed write question_bank"  on public.question_bank;
drop policy if exists "authed update question_bank" on public.question_bank;

-- The search function runs as the caller, so anon reads flow through the
-- select policy above.
grant execute on function public.search_question_bank(text, int) to anon, authenticated;

-- The two counters are writes → callable by the service role only. Postgres
-- grants EXECUTE to PUBLIC on every new function, so revoking from
-- anon/authenticated alone is not enough — PUBLIC has to go too.
revoke execute on function public.increment_bank_served(uuid) from public, anon, authenticated;
revoke execute on function public.report_bank_wrong(uuid)     from public, anon, authenticated;
grant  execute on function public.increment_bank_served(uuid) to service_role;
grant  execute on function public.report_bank_wrong(uuid)     to service_role;

-- ------------------------------------------------------------
-- One "wrong solution" vote per student per row
-- ------------------------------------------------------------
-- Three reports retire a row from search (`reported_wrong < 3` above). Without
-- this table one account could send all three. The route inserts here first
-- (service role); a duplicate hits the primary key and the row is NOT demoted
-- again. RLS on with no policies = invisible to anon/authenticated.
create table if not exists public.bank_reports (
  bank_id    uuid not null references public.question_bank(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bank_id, user_id)
);
alter table public.bank_reports enable row level security;
