-- ============================================================
-- ai_daily_usage — the AI allowance, counted where it cannot be raced.
-- ============================================================
--
-- Run once in the Supabase SQL editor.
--
-- WHAT WAS WRONG WITH THE OLD COUNT
-- ---------------------------------
-- The quota was `select count(*) from ai_generation_log where kind='chat'`,
-- taken before the model was called. Three consequences, all measurable:
--
--   1. A FAILED call cost a credit. The row was written the moment the
--      student's message was saved, so a timeout, a 529, or an abort charged
--      the student for an answer they never received.
--   2. Two requests at once BOTH passed. Count-then-act is not atomic; on the
--      last credit, both read 9 and both proceeded.
--   3. The day rolled over at UTC midnight — 02:00 or 03:00 in Israel,
--      depending on the season. A student working late lost their allowance
--      partway through the evening and got it back mid-night.
--
-- ai_generation_log is NOT replaced. It stays the audit trail and the cost
-- record; it simply stops being the thing that decides.
--
-- THE DATE IS COMPUTED HERE, ON PURPOSE
-- -------------------------------------
-- `(now() at time zone 'Asia/Jerusalem')::date` — in Postgres, not in Node.
-- The server region is not Israel and does not have to be, the DST switch is
-- handled by the timezone database rather than by arithmetic, and every caller
-- necessarily agrees about what day it is because none of them decides.

create table if not exists public.ai_daily_usage (
  user_id             uuid not null,
  -- Asia/Jerusalem, always. Never the server's date.
  usage_date          date not null,
  successful_ai_calls integer not null default 0,
  daily_limit         integer not null default 10,
  updated_at          timestamptz not null default now(),

  -- The whole concurrency story rests on this: one row per student per day,
  -- so the conditional UPDATE below has exactly one row to lock.
  primary key (user_id, usage_date)
);

create index if not exists ai_daily_usage_date_idx on public.ai_daily_usage (usage_date desc);

-- ⚠️ RLS on with no policy. Written and read only by the service-role client
-- inside the API routes; a student's browser must never be able to read its
-- own counter, let alone write it.
alter table public.ai_daily_usage enable row level security;

-- ============================================================
-- reserve_ai_call — the only place a credit is taken.
-- ============================================================
--
-- ⚠️ RESERVE, NOT CHARGE, AND THE DIFFERENCE IS THE POINT.
--
-- "Only decrement after a successful call" and "two parallel requests must not
-- both pass" cannot both be satisfied by counting after the fact: if the
-- counter moves only on success, two requests on the last credit both see 9
-- and both proceed. So the credit is taken BEFORE the call and given back by
-- `release_ai_call` if the call does not produce an answer. From outside, a
-- failed call ends on the same number it started on, which is the rule.
--
-- The atomicity is in one clause: `where successful_ai_calls < daily_limit`
-- inside the UPDATE. Postgres locks the row for the duration, so of two
-- concurrent statements on the last credit exactly one updates a row and the
-- other updates none — and `returning` tells them apart with no extra query.
create or replace function public.reserve_ai_call(p_user uuid, p_limit integer default 10)
returns table (allowed boolean, used integer, cap integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'Asia/Jerusalem')::date;
  v_used integer;
begin
  insert into public.ai_daily_usage (user_id, usage_date, successful_ai_calls, daily_limit)
  values (p_user, v_date, 0, p_limit)
  on conflict (user_id, usage_date) do nothing;

  update public.ai_daily_usage
     set successful_ai_calls = successful_ai_calls + 1,
         daily_limit         = p_limit,
         updated_at          = now()
   where user_id = p_user
     and usage_date = v_date
     and successful_ai_calls < p_limit
  returning successful_ai_calls into v_used;

  if v_used is null then
    -- No row updated: the allowance is gone. Report what is actually stored
    -- rather than assuming it equals the cap — the cap can change between days.
    select successful_ai_calls into v_used
      from public.ai_daily_usage
     where user_id = p_user and usage_date = v_date;
    return query select false, coalesce(v_used, p_limit), p_limit;
  end if;

  return query select true, v_used, p_limit;
end;
$$;

-- ============================================================
-- release_ai_call — the call did not produce an answer.
-- ============================================================
--
-- `greatest(0, …)` because a double release must never mint credit. Called on
-- every failure path: a thrown request, a timeout, an abort, an empty reply.
create or replace function public.release_ai_call(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'Asia/Jerusalem')::date;
  v_used integer;
begin
  update public.ai_daily_usage
     set successful_ai_calls = greatest(0, successful_ai_calls - 1),
         updated_at          = now()
   where user_id = p_user and usage_date = v_date
  returning successful_ai_calls into v_used;
  return coalesce(v_used, 0);
end;
$$;

-- ============================================================
-- read_ai_usage — for the counter in the UI.
-- ============================================================
--
-- An RPC rather than a select, for one reason: the caller must not compute the
-- date. A Node process deciding what "today" means in Israel is how the two
-- halves of a quota end up disagreeing at 00:30.
create or replace function public.read_ai_usage(p_user uuid, p_limit integer default 10)
returns table (used integer, cap integer)
language sql
security definer
set search_path = public
as $$
  select coalesce(
           (select successful_ai_calls from public.ai_daily_usage
             where user_id = p_user
               and usage_date = (now() at time zone 'Asia/Jerusalem')::date),
           0),
         p_limit;
$$;

comment on table public.ai_daily_usage is
  'One row per student per Israeli day. A credit is reserved before the model call and released if it fails — see supabase-ai-daily-usage.sql.';
