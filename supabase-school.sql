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
-- EVERY table here has RLS enabled and NO policies: the database denies every
-- logged-in user, and lib/school-guard.ts is the single place that decides who
-- may read what. There is no exception, including `focus` — the student's own
-- "המורה ביקש" list comes through /api/school/my-classes. `focus` did carry a
-- select policy once; it could never be true, and the block further down says
-- exactly why, because that failure is worth reading before writing another.
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

-- ---- differentiated focus --------------------------------------------------
--
-- ⚠️ ORDER MATTERS IN THIS FILE. focus_targets has a foreign key to focus(id),
-- so `focus` must exist first. A statement that names a table Postgres has not
-- created yet aborts on
--   ERROR: 42P01: relation "public.…" does not exist
-- and — because the Supabase SQL editor runs the script as one transaction —
-- nothing at all is created, including every table above the failure. That
-- already happened once here. scripts/test-school.ts now asserts the ordering
-- over the real file.
--
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
-- No policies. The student never reads this table at all: /api/school/my-classes
-- resolves "is this one for me" on the service role and sends him only the
-- answer. Exposing the target list would tell each student who else was singled
-- out, which is the one thing differentiated practice must never do.

-- ---- the privacy rule ------------------------------------------------------
--
-- ⚠️ THERE IS NO SELECT POLICY ON `focus`, AND THAT IS THE FIX, NOT AN OVERSIGHT.
--
-- There was one. It read "the student is in this class, and the focus is either
-- for the whole class or names him", and it could never be true:
--
--   * its first half asked `exists (select 1 from public.class_members …)`, and
--     a subquery inside a policy runs with the READER's privileges, so row
--     security on class_members applied to it too. That table has RLS on and no
--     policies by design, so the subquery was empty for every student and the
--     `exists` was false for every row. A task a teacher sent showed up nowhere.
--
--   * its second half, `not exists (… focus_targets …)`, meant "aimed at the
--     whole class". focus_targets is policy-less too, so that subquery was also
--     empty and the clause was ALWAYS true — a focus aimed at one struggling
--     student would have been shown to all thirty.
--
-- Both halves were unfixable in SQL without a security-definer function, and a
-- function would only move the same rule somewhere harder to test. So `focus`
-- now matches every other table in this file: RLS on, no policies, service role
-- only. The student's screen reads it through /api/school/my-classes, and the
-- rule itself is a pure function with tests — lib/focus-visibility.ts,
-- `npm run test:school`.
--
-- Re-running this file DROPS the old policy (the line below), which is the only
-- action an already-provisioned database needs.
drop policy if exists "own focus select" on public.focus;

-- Deliberately NO insert/update/delete policy on `focus`: RLS denies all three,
-- so a student cannot invent a focus, retarget one, or delete the one he was
-- given. Teachers write through /api/school/focus on the service role.
