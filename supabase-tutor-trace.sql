-- ============================================================
-- tutor_trace — one row per tutor turn that reached the model.
-- ============================================================
--
-- Run once in the Supabase SQL editor. Until it exists the app writes nothing
-- and behaves exactly as before: lib/agents/guard.ts already proved that a
-- missing table must never cost a student their answer, so the insert is
-- fire-and-forget and its error is swallowed.
--
-- WHAT IS DELIBERATELY NOT HERE
-- -----------------------------
-- No user id, no conversation id, no message text. The single text column is
-- `normalized_message`: folded, punctuation-free, filler-free, capped at 120
-- characters, with anything shaped like an email or a phone number stripped
-- BEFORE normalisation. It exists so a report can show "the twenty phrasings
-- that most often reach the model", which is the input to the next fix, and
-- for nothing else.
--
-- Without a user id this cannot be joined back to a person, which is the
-- point. It also means the table is useless for quotas — `ai_generation_log`
-- keeps that job, and keeps the user id it needs for it.

create table if not exists public.tutor_trace (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),

  -- where the student was
  screen        text not null default '',
  topic         text not null default '',
  subtopic      text not null default '',
  question_id   text not null default '',

  -- what they asked, normalised
  normalized_message text not null default '',
  intent        text not null default '',
  confidence    real not null default 0,

  -- which layers were reached and what they said
  local_router_matched        boolean not null default false,
  local_ladder_matched        boolean not null default false,
  faq_matched                 boolean not null default false,
  cross_question_reuse_matched boolean not null default false,
  math_engine_used            boolean not null default false,
  compiler_flag_on            boolean not null default false,

  -- ⚠️ An enum in the application, a text column here. A CHECK constraint
  -- would reject a row the day a new reason is added and the migration has not
  -- run yet — and losing the row loses the very signal that a new reason
  -- exists. lib/tutor-telemetry validates on the way in.
  fallback_reason text not null default 'no_fallback',

  -- stamped server-side, never taken from the client
  used_llm      boolean not null default true,
  duration_ms   integer not null default 0,
  model         text not null default '',
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  cached_read   integer not null default 0,
  cached_write  integer not null default 0
);

-- The two questions the report asks, and nothing else.
create index if not exists tutor_trace_created_idx on public.tutor_trace (created_at desc);
create index if not exists tutor_trace_reason_idx  on public.tutor_trace (fallback_reason, created_at desc);

-- ⚠️ RLS ON WITH NO POLICY = every write silently denied.
--
-- That exact configuration made `ai_generation_log` dead in production for
-- weeks: supabase-js RETURNS errors rather than throwing, the insert was
-- awaited and ignored, and nothing anywhere said so. This table is written
-- ONLY by the service-role client, which bypasses RLS, and read only by a
-- local script using the same key. So: RLS on, no policy, and that is
-- deliberate — no browser session can read or write it.
alter table public.tutor_trace enable row level security;

comment on table public.tutor_trace is
  'One row per tutor turn that reached the model. No user id, no conversation, no raw message — see supabase-tutor-trace.sql.';
