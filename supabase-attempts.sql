-- ============================================================
-- attempts — the durable answer log.  Run ONCE in the Supabase SQL editor
-- (Dashboard → SQL → New query → paste → Run).
--
-- WHY THIS EXISTS
-- Until now every answered question lived in ONE place: `learning_state.results`,
-- a JSONB blob the student's own browser syncs up from localStorage. That is the
-- right design for the student's own device sync, and the wrong one for anything
-- a teacher is shown, for two reasons that are invisible until they bite:
--
--   1. It TRUNCATES. lib/results.ts caps the log at MAX_EVENTS = 1000 as a
--      sliding window — the oldest answers fall off. A student answering ten
--      questions a day passes 1,800 in a school year, so "how was he doing in
--      November" silently stops existing. No error, no warning.
--   2. It is a MIRROR OF A BROWSER. Clear localStorage on every device and the
--      student's history is gone; the teacher's screen then says he did nothing.
--
-- This table is append-only and server-stamped, so neither can happen. It does
-- NOT replace learning_state — that stays exactly as it is and keeps owning the
-- student's roadmap, plan and offline use. The rule this table introduces is:
--   ⚠️ nothing a TEACHER is shown may be computed from client-synced state.
--
-- ---- WHAT THIS DOES AND DOES NOT GUARANTEE ----------------------------------
-- Guaranteed: history never truncates; a student cannot erase a bad week by
-- clearing storage; a student cannot write, edit or delete another student's
-- rows (RLS + no UPDATE/DELETE policy at all); "when" is the SERVER's clock.
--
-- NOT guaranteed: a determined student can still script this endpoint and
-- fabricate his OWN attempts. Closing that needs server-side grading, which
-- today runs in the browser (lib/answer-check). The upgrade path when it
-- matters: verify `correct` server-side for rows carrying a question_id that
-- exists in the static bank — most answers — and mark the rest unverified.
-- ============================================================

create table if not exists public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- ⚠️ TWO CLOCKS, ON PURPOSE.
  -- `ts` is the client's millisecond stamp, kept so a row can be lined up with
  -- the same event in the student's local log (and so it can dedupe a retry).
  -- `created_at` is the SERVER's, and it is the one every teacher screen reads:
  -- "has not logged in for 9 days" must not be answerable by a device clock.
  ts            bigint not null,
  created_at    timestamptz not null default now(),

  -- Mirrors ResultEvent (lib/results.ts) field for field. Same names, same
  -- vocabulary, no translation layer — a mapping table between two spellings of
  -- the same event is exactly where a silent drift starts.
  subject       text not null,
  topic         text not null,
  sub_topic_id  text,
  question_id   text,
  -- quiz | drill | bagrut | review | fix | scan | thinking
  source        text not null,
  difficulty    text,                   -- easy | mid | hard
  correct       boolean not null,
  -- A replay of a question already answered, OR an answer from a source that is
  -- never a measurement (fix / scan / thinking). Counts as ACTIVITY, excluded
  -- from ACCURACY — the same rule lib/results.ts applies, carried over so the
  -- teacher's numbers cannot disagree with the student's.
  is_repeat     boolean not null default false,
  hint_used     boolean not null default false,
  -- Open questions: true = the student marked his own paper. Much weaker
  -- evidence than a machine-checked answer, and a teacher screen must be able
  -- to tell them apart.
  self_reported boolean,
  kind          text,                   -- mcq | open
  chosen_index  int,
  option_count  int,
  -- answerDiagnosis — WHICH wrong answer, not just that it was wrong. This is
  -- what lets a student card say "he flips the sign" instead of "42%". Null on
  -- branches where ResultEvent does not carry it; the column costs nothing.
  diagnosis     jsonb
);

-- The reads every screen is built on. class_id/org_id arrive in phase 1 (they
-- reference tables that do not exist yet) — `alter table add column`.
create index if not exists attempts_user_time_idx  on public.attempts (user_id, created_at desc);
create index if not exists attempts_user_topic_idx on public.attempts (user_id, topic, created_at desc);

-- Idempotency. The client fires this on every answer with `keepalive`, which
-- may be retried by the browser, and React can double-invoke a handler. One
-- user cannot answer two questions in the same millisecond, so this collapses a
-- duplicate delivery without needing an id round-trip; the route inserts with
-- ignoreDuplicates so a repeat is a silent no-op rather than an error.
create unique index if not exists attempts_dedupe_idx on public.attempts (user_id, ts);

alter table public.attempts enable row level security;

-- A student may APPEND his own rows and READ his own rows. That is all.
drop policy if exists "own attempts insert" on public.attempts;
create policy "own attempts insert" on public.attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "own attempts select" on public.attempts;
create policy "own attempts select" on public.attempts
  for select using (auth.uid() = user_id);

-- ⚠️ NO UPDATE AND NO DELETE POLICY, deliberately. RLS denies both, which is
-- what makes this an append-only record: the whole point is that a bad week
-- cannot be edited away. Teacher and school reads go through the service role,
-- scoped in code to that teacher's own students — the same posture as
-- lib/teacher-guard.ts, which is the single place that decides whose rows a
-- teacher may see.
