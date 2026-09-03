-- client_errors — every crash a student's browser reports via /api/client-error.
-- Run once in the Supabase SQL editor. Without it the crash still shows in the
-- Vercel function log (console.error), but nothing keeps it.
--
-- Read it in the dashboard: Table Editor → client_errors, newest first.
-- Server-only: written with the service role, no client policies on purpose.

create table if not exists public.client_errors (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  message     text not null,
  stack       text,
  digest      text,
  path        text,
  user_agent  text
);

alter table public.client_errors enable row level security;

create index if not exists client_errors_created_idx
  on public.client_errors (created_at desc);

-- Same crash, many students: find the loud ones.
--   select path, digest, message, count(*) n, max(created_at) last
--   from public.client_errors
--   where created_at > now() - interval '7 days'
--   group by 1,2,3 order by n desc limit 20;
