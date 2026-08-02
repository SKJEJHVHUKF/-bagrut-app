-- ============================================================
-- Learning-path server sync.  Run ONCE in the Supabase SQL editor
-- (Dashboard → SQL → New query → paste → Run).
--
-- Without this table the app keeps working entirely from localStorage
-- (every call is wrapped in try/catch and degrades to a no-op) — running it
-- adds cross-device sync so a student's roadmap progress and study plan follow
-- them from laptop to phone instead of vanishing.
--
-- One row per user, JSONB blobs mirroring the client's localStorage keys:
--   roadmap  ← bagrut-roadmap-v1   (per-rung progress; merged max-wins)
--   plan     ← bagrut-study-plan-v1 (last-write-wins by updated_at)
--   results  ← bagrut-results-v1   (answer log; merged as a SET UNION, capped
--              at the client's MAX_EVENTS, with the `repeat` flags re-derived
--              over the merged history — see lib/sync/roadmap-sync.mergeResults)
--   review / mistakes reserved for later phases.
--
-- `results` has been in this file since the table was first created, so a
-- database built from it needs NO migration to pick up answer-log sync. The
-- client still guards both directions (star select + upsert retry) in case a
-- table was created from an older copy.
-- ============================================================

create table if not exists public.learning_state (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  roadmap    jsonb not null default '{}'::jsonb,
  plan       jsonb,
  results    jsonb,
  review     jsonb,
  mistakes   jsonb,
  updated_at timestamptz not null default now()
);

alter table public.learning_state enable row level security;

-- A user may only ever read/write their own row.
drop policy if exists "own learning_state select" on public.learning_state;
create policy "own learning_state select" on public.learning_state
  for select using (auth.uid() = user_id);

drop policy if exists "own learning_state insert" on public.learning_state;
create policy "own learning_state insert" on public.learning_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "own learning_state update" on public.learning_state;
create policy "own learning_state update" on public.learning_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The client always sends an already-merged blob (it pulls + max-merges before
-- pushing), so a plain upsert is correct. This trigger is a belt-and-suspenders
-- guard that stops an out-of-order write from moving updated_at backwards.
create or replace function public.learning_state_touch()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' and new.updated_at < old.updated_at then
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists learning_state_touch on public.learning_state;
create trigger learning_state_touch
  before update on public.learning_state
  for each row execute function public.learning_state_touch();
