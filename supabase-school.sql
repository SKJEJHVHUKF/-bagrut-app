-- ============================================================
-- The school layer: a class, who is in it, and what the teacher pointed at.
-- Run ONCE in the Supabase SQL editor, AFTER supabase-attempts.sql.
--
-- Four tables. Three things this deliberately does NOT add, because each would
-- be work that buys nothing until a school actually signs:
--
--   ✗ organizations / org_members. A class already knows its teacher
--     (class_members.role = 'teacher'). An "organisation" only starts meaning
--     something when a coordinator wants to compare classes, and it arrives
--     then as `alter table classes add column org_id` — one column, no
--     migration of anything that already works.
--
--   ✗ columns on `attempts`. A class board reads the roster's attempts with
--     `where user_id in (…)`, which the existing (user_id, created_at) index
--     already serves for a class of thirty. Stamping class_id onto every answer
--     would denormalise a fact that can change — a student moves class — into
--     a million immutable rows.
--
--   ✗ a progress table for `focus`. Progress is counted from `attempts` by the
--     rule lib/assignment-progress.ts already implements: an answer counts when
--     it is in the focus's topic (and sub-topic, when one was named) and came
--     AFTER the focus was set. A second stored counter would drift from the
--     first, and the student's screen and the teacher's screen would disagree.
--
-- ⚠️ RLS POSTURE — the same one supabase-teachers.sql uses, for the same reason.
-- `classes`, `class_members` and `focus_targets` have RLS enabled and NO
-- policies: the database denies every logged-in user, and lib/school-guard.ts
-- is the single place that decides which class a teacher may read. `focus` is
-- the one exception and carries a SELECT policy, because the STUDENT's own
-- browser reads it directly to show "המורה ביקש".
-- ============================================================

-- ---- a class ---------------------------------------------------------------
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                    -- "י'3"
  school      text,                             -- free text until a school signs
  units       int,                              -- 3 / 4 / 5 יח"ל
  school_year text not null,                    -- "תשפ״ז"
  -- How a student joins. Six characters, no vowels or lookalikes (see
  -- lib/join-code.ts) because it gets read aloud in a classroom and typed by
  -- thirty people at once. Nullable so a teacher can turn joining off after
  -- everyone is in, which is the cheapest possible protection against the code
  -- being passed around a year group.
  join_code   text unique,
  archived    boolean not null default false,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists classes_created_by_idx on public.classes(created_by);

alter table public.classes enable row level security;
-- No policies on purpose. Service role only, scoped in lib/school-guard.ts.

-- ---- who is in it ----------------------------------------------------------
-- One table for teachers and students, because "a second teacher on the class"
-- is then free rather than a feature: a co-teacher, or the מורה מחליף, is one
-- row with role = 'teacher'.
create table if not exists public.class_members (
  class_id  uuid not null references public.classes(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null check (role in ('teacher', 'student')),
  -- Denormalised ON PURPOSE. The alternative is one auth.admin.getUserById per
  -- student on every board load — thirty round trips to render one screen, which
  -- is what app/api/teacher/overview does today and what stops it scaling past a
  -- private tutor's five students. A display name is also the ONLY personal
  -- field this layer stores: no email, no phone, no ID number.
  name      text not null,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists class_members_user_idx on public.class_members(user_id);

alter table public.class_members enable row level security;
-- No policies on purpose. Service role only.

-- ---- what the teacher pointed at -------------------------------------------
--
-- NOT an assignment, and the difference is the whole product decision: the
-- teacher never authors content. Every column below is a POINTER into material
-- that already exists in the app, chosen from closed lists — there is not one
-- free-text field a teacher has to fill in except an optional one-line note.
create table if not exists public.focus (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes(id) on delete cascade,
  created_by   uuid not null references auth.users(id) on delete cascade,

  -- Must match ResultEvent.topic / SubTopic.id EXACTLY (content/lessons), because
  -- progress is counted by comparing these strings to the answers that follow.
  -- A typo here does not fail loudly: it produces a focus that can never be
  -- completed, which is why the API validates both against the content
  -- catalogue before writing (lib/focus-target.ts).
  topic        text not null,
  sub_topic_id text,                            -- null = the whole topic
  -- learn | easy | mid | hard | ghost | bagrut, per lib/roadmap-levels.ts.
  -- null = the whole ladder.
  rung         text,

  -- How many answers count as done. Null = "until mastery", judged by the same
  -- threshold the student's own roadmap uses.
  target_count int check (target_count is null or target_count between 1 and 100),
  due_on       date,
  note         text check (note is null or length(note) <= 200),

  created_at   timestamptz not null default now()
);

create index if not exists focus_class_idx on public.focus(class_id, created_at desc);

alter table public.focus enable row level security;

-- THE privacy rule, and the only direct-read policy in this file: a student
-- sees the focuses aimed at him, and nobody else's. Enforced here rather than
-- in the API because the student's own browser selects this table directly to
-- render "המורה ביקש" on his roadmap.
--
-- A focus with no rows in focus_targets is aimed at the WHOLE class, so both
-- halves of the OR are needed.
drop policy if exists "own focus select" on public.focus;
create policy "own focus select" on public.focus
  for select using (
    exists (
      select 1 from public.class_members m
       where m.class_id = focus.class_id
         and m.user_id = auth.uid()
    )
    and (
      not exists (select 1 from public.focus_targets t where t.focus_id = focus.id)
      or exists (
        select 1 from public.focus_targets t
         where t.focus_id = focus.id and t.student_id = auth.uid()
      )
    )
  );

-- Deliberately NO insert/update/delete policy: RLS denies all three, so a
-- student cannot invent a focus, retarget one, or delete the one he was given.
-- Teachers write through /api/school/focus on the service role.

-- ---- differentiated focus --------------------------------------------------
-- EMPTY MEANS THE WHOLE CLASS. That is the common case and it costs zero rows;
-- rows appear only when the teacher aims at specific students, which is the
-- feature a generic homework system cannot do well and this one can, because
-- the board already knows who is stuck in what.
create table if not exists public.focus_targets (
  focus_id   uuid not null references public.focus(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  primary key (focus_id, student_id)
);

create index if not exists focus_targets_student_idx on public.focus_targets(student_id);

alter table public.focus_targets enable row level security;
-- No policies. The student never reads this table directly — the policy on
-- `focus` above already resolves "is this one for me", so exposing the target
-- list would only tell each student who else was singled out.
