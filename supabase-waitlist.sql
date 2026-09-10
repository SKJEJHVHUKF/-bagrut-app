-- supabase-waitlist.sql — Pro waitlist leads from /pricing.
--
-- RUN THIS IN THE SUPABASE DASHBOARD (SQL editor) BEFORE THE CTA CAN SAVE
-- ANYTHING. Until it exists the insert fails and the page says so out loud
-- ("לא הצלחנו לשמור את ההרשמה") instead of celebrating — which is the whole
-- point of the change: the button used to show a success toast and store
-- nothing at all, so every person who said "I want to pay" was discarded.
--
-- Read the list back in the dashboard:
--   select plan, count(*), max(created_at) from public.waitlist group by plan;
--   select email, plan, created_at from public.waitlist order by created_at desc;

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  -- 'monthly' | 'semi' | 'yearly' — which plan they had selected when they
  -- clicked. This is the price-point signal; do not collapse it into a flag.
  plan       text not null,
  -- Null for signed-out visitors. `on delete set null` so a deleted account
  -- never takes the demand signal with it.
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- One row per (address, plan). A second click is then a no-op the client
  -- reads as success (error code 23505) rather than a pile of duplicates.
  unique (email, plan)
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- INSERT ONLY, and deliberately so:
--   • anon is allowed because /pricing is public — most visitors who would pay
--     have not signed up yet, and that is exactly the lead worth keeping.
--   • there is NO select/update/delete policy, so the browser can write a lead
--     and can never read the list back. Harvesting the addresses needs the
--     dashboard or the service role.
--   • the check is the trust boundary: anon insert with `check (true)` is an
--     open spam sink, so the address has to at least be shaped like one. The
--     unique constraint caps the rest.
drop policy if exists "waitlist_insert_anyone" on public.waitlist;
create policy "waitlist_insert_anyone" on public.waitlist
  for insert to anon, authenticated
  with check (
    char_length(email) between 5 and 254
    and position('@' in email) > 1
    and plan in ('monthly', 'semi', 'yearly')
  );
