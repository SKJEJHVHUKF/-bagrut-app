-- ============================================================
-- Security hardening (2026-08-19 audit, items H1/H2/H3/M1/M2)
-- Run ONCE in the Supabase dashboard → SQL editor, AFTER the matching code
-- is deployed and SUPABASE_SERVICE_ROLE_KEY is set in Vercel.
-- Every statement is idempotent — running the file twice is harmless.
-- ============================================================


-- ------------------------------------------------------------
-- 0. The usage log every AI route now counts from (may already exist).
--    Same definition as lib/agents/guard.ts / app/api/questions.
-- ------------------------------------------------------------
create table if not exists public.ai_generation_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null,   -- quiz | concept* | tutor | grade | teach | practice | chat | check
  created_at  timestamptz not null default now()
);
create index if not exists ai_generation_log_user_day_idx
  on public.ai_generation_log (user_id, created_at);
alter table public.ai_generation_log enable row level security;
drop policy if exists "own rows read"  on public.ai_generation_log;
create policy "own rows read"  on public.ai_generation_log
  for select using (auth.uid() = user_id);
drop policy if exists "own rows write" on public.ai_generation_log;
create policy "own rows write" on public.ai_generation_log
  for insert with check (auth.uid() = user_id);
-- No delete policy, on purpose: quotas are counted from this table.


-- ------------------------------------------------------------
-- 1. (M2) Site-wide daily count for the GLOBAL_DAILY_LIMIT brake.
--    SECURITY DEFINER so it sees every row, not just the caller's.
-- ------------------------------------------------------------
create or replace function public.ai_calls_today()
returns bigint
language sql stable security definer
set search_path = public
as $$
  select count(*) from public.ai_generation_log
   where created_at >= date_trunc('day', now());   -- DB is UTC, same midnight as the app
$$;
revoke all on function public.ai_calls_today() from public;
grant execute on function public.ai_calls_today() to authenticated;


-- ------------------------------------------------------------
-- 2. (H2) Shared bank + cache: reads stay public, writes server-only.
--    The server now writes with the service role (lib/supabase/admin.ts).
-- ------------------------------------------------------------
drop policy if exists "authed write question_bank"  on public.question_bank;
drop policy if exists "authed update question_bank" on public.question_bank;
drop policy if exists "authed write cache"          on public.solution_cache;
drop policy if exists "authed bump cache"           on public.solution_cache;

-- Counter functions = writes. Postgres grants EXECUTE to PUBLIC on every new
-- function, so PUBLIC must be revoked too, not only anon/authenticated.
revoke execute on function public.increment_bank_served(uuid) from public, anon, authenticated;
revoke execute on function public.report_bank_wrong(uuid)     from public, anon, authenticated;
grant  execute on function public.increment_bank_served(uuid) to service_role;
grant  execute on function public.report_bank_wrong(uuid)     to service_role;

-- One "wrong solution" vote per student per bank row.
create table if not exists public.bank_reports (
  bank_id    uuid not null references public.question_bank(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bank_id, user_id)
);
alter table public.bank_reports enable row level security;   -- no policies = service role only


-- ------------------------------------------------------------
-- 3. (H1) Granting / revoking Pro by hand, until billing ships.
--    app_metadata is writable only here / with the service role — the user
--    cannot touch it (unlike user_metadata). Edit the email and run.
-- ------------------------------------------------------------
-- update auth.users
--    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"pro": true}'
--  where email = 'student@example.com';
--
-- revoke:
-- update auth.users
--    set raw_app_meta_data = raw_app_meta_data - 'pro'
--  where email = 'student@example.com';


-- ------------------------------------------------------------
-- 4. Verify (read-only) — expect NO insert/update policy for
--    question_bank / solution_cache, and bank_reports with zero policies.
-- ------------------------------------------------------------
-- select tablename, cmd, roles, policyname
--   from pg_policies
--  where schemaname = 'public'
--    and tablename in ('question_bank','solution_cache','bank_reports','ai_generation_log')
--  order by tablename, cmd;
-- select public.ai_calls_today();
