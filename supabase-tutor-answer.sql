-- ============================================================
-- tutor_answer — every paid answer, kept so nobody pays for it twice.
-- ============================================================
--
-- Run once in the Supabase SQL editor, like supabase-tutor-trace.sql.
--
-- WHAT THIS IS
-- ------------
-- When the tutor cannot answer locally it asks the model, and today that
-- answer is streamed to one student and then thrown away. The next student on
-- the same question asking the same thing pays again, and so does the one
-- after that. This table keeps the answer and the tutor serves it from here.
--
-- WHAT IT IS NOT
-- --------------
-- Not a cache of a conversation, and not per-student. There is no user id, no
-- conversation id, and no sentence a student wrote beyond the normalised probe
-- — the same 120-character folded form tutor_trace keeps. An answer that
-- mentions a particular student's attempt is REJECTED at capture rather than
-- stored, because serving it to somebody else would be telling one student
-- about another one's work.
--
-- STATUS IS THE SAFETY BOUNDARY
-- -----------------------------
--   'live'      screened and served automatically.
--   'pending'   captured, never served, waiting for a human decision.
--   'rejected'  a person said no. Kept so it is not re-captured forever.
--
-- Only `live` is ever read by the tutor, and a row becomes `live` at capture
-- ONLY when its intent is question-independent. Everything tied to one
-- exercise's numbers lands in `pending`. That is the same rule cross-question
-- reuse already runs on in the FAQ bank, where it measured 1.5% unsafe.

create table if not exists public.tutor_answer (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),

  topic         text not null default '',
  question_id   text not null default '',
  intent        text not null default '',
  -- Folded, punctuation-free, ≤120 chars. The match key, not a transcript.
  normalized_message text not null default '',

  answer        text not null,
  -- The model that produced it and what it cost, so the report can say what
  -- the library has saved rather than estimate it.
  model         text not null default '',
  output_tokens integer not null default 0,

  status        text not null default 'pending',
  -- How many times this row was served instead of a model call.
  hits          integer not null default 0,
  last_hit_at   timestamptz
);

-- The lookup the tutor does on every turn that would otherwise cost money.
create index if not exists tutor_answer_lookup_idx
  on public.tutor_answer (status, question_id, intent);
create index if not exists tutor_answer_topic_idx
  on public.tutor_answer (status, topic, intent);

-- ⚠️ RLS on with no policy: written and read ONLY by the service-role client
-- inside /api/chat, never by a browser session. Same reasoning as
-- tutor_trace — and the same trap that left ai_generation_log silently dead,
-- deliberate here rather than accidental.
alter table public.tutor_answer enable row level security;

comment on table public.tutor_answer is
  'Answers the model was already paid for, screened and reused. No user id, no conversation — see supabase-tutor-answer.sql.';

-- ⚠️ An RPC rather than a read-modify-write.
--
-- `hits` is the whole point of the table — it is the count of model calls that
-- did not happen — and two students hitting the same row in the same second
-- would lose one of them with a select-then-update. `security definer` so the
-- service-role client can call it without a policy, and it touches exactly one
-- counter on one row.
create or replace function public.increment_tutor_answer_hit(row_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tutor_answer
     set hits = hits + 1, last_hit_at = now()
   where id = row_id;
$$;
