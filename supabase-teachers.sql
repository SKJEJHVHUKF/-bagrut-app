-- ============================================================
-- The private-teacher layer.  Run ONCE in the Supabase SQL editor
-- (Dashboard → SQL → New query → paste → Run).
--
-- Itay employs students as paid private teachers and hands them MathUp
-- students. /teacher shows a teacher his own students' progress plus his
-- hours and pay; /admin owns everything else.
--
-- Three tables and nothing more, because the two expensive things — what the
-- student actually did, and who he is — already exist:
--   learning_state.results   every answered question, per user (see
--                            supabase-learning-path.sql)
--   auth.users.app_metadata  role, hourly rate and weekly hours, writable
--                            ONLY with the service role (same place `pro`
--                            lives — see lib/access.ts)
--
-- ⚠️ RLS POSTURE. teacher_students and teacher_week_hours have RLS enabled and
-- NO policies at all: that denies every logged-in user and leaves only the
-- service-role client (which bypasses RLS) able to read them. Every teacher
-- read therefore goes through /api/teacher/*, which checks isTeacher() and
-- scopes the query to that teacher's own roster. `assignments` is the one
-- exception and carries a single SELECT policy, because the student's own
-- browser reads it directly — see below.
-- ============================================================

-- ---- who teaches whom -------------------------------------------------
create table if not exists public.teacher_students (
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id)
);

alter table public.teacher_students enable row level security;
-- No policies on purpose. Service role only.

-- ---- a task a teacher gave to ONE student -----------------------------
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references auth.users(id) on delete cascade,
  student_id   uuid not null references auth.users(id) on delete cascade,
  subject      text not null default 'math',
  -- Must match ResultEvent.topic exactly (lib/results.ts) — progress is
  -- counted by comparing this string to the topic on each answered question.
  topic        text not null,
  sub_topic_id text,
  title        text not null,
  -- How many answered questions in `topic` count as done.
  target_count int not null default 5,
  due_date     date,
  created_at   timestamptz not null default now()
);

alter table public.assignments enable row level security;

-- THE privacy rule: a student sees his own assignments and no one else's.
-- This is enforced here rather than in the API because the student's browser
-- selects from this table directly (components/TeacherAssignments.tsx).
drop policy if exists "own assignments select" on public.assignments;
create policy "own assignments select" on public.assignments
  for select using (auth.uid() = student_id);

-- Deliberately NO insert/update/delete policy: RLS denies all three, so a
-- student cannot invent an assignment or edit the one he was given. Teachers
-- write through /api/teacher/assignments on the service role.

create index if not exists assignments_student_idx on public.assignments(student_id);
create index if not exists assignments_teacher_idx on public.assignments(teacher_id);

-- ---- a week whose hours differ from the standing weekly figure --------
--
-- Hours are NOT logged per lesson. Itay sets a weekly figure per teacher
-- (app_metadata.weeklyHours) and it accrues by itself; a row here overrides
-- one specific week when reality differed. Absence of a row means "the
-- standing figure", so a normal month writes nothing at all.
--
-- week_start is the SUNDAY of that week in Asia/Jerusalem — the same week
-- boundary lib/teacher-pay.ts computes. Storing it as a date (not a
-- timestamptz) keeps it a calendar fact that no timezone can shift.
create table if not exists public.teacher_week_hours (
  teacher_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  hours      numeric(5,2) not null check (hours >= 0),
  note       text,
  updated_at timestamptz not null default now(),
  primary key (teacher_id, week_start)
);

alter table public.teacher_week_hours enable row level security;
-- No policies on purpose. Service role only; a teacher reads the resulting
-- numbers through /api/teacher/overview, and only Itay can write them.
