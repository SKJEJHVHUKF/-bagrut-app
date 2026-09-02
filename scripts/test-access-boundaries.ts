/**
 * test-access-boundaries.ts — can a plain student reach the staff system?
 *
 *   npx tsx scripts/test-access-boundaries.ts            (against localhost:3000)
 *   npx tsx scripts/test-access-boundaries.ts <base-url>
 *
 * WHY THIS EXISTS
 * "Only the teachers I mark in /admin, and me" is a claim about four separate
 * layers — middleware, the page gates, the API guards, and Postgres RLS — and
 * reading four files and believing them is not the same as checking. So this
 * creates a REAL student account, signs in as him, and tries everything he
 * would have to be stopped from doing. It deletes the account on the way out.
 *
 * It costs nothing (no model call) and touches no existing data: the temp
 * account only ever reads, and the one write it attempts is the self-promotion
 * that has to fail.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BASE = process.argv[2] ?? 'http://localhost:3000';
if (!URL_ || !SERVICE || !ANON) {
  console.error('Missing Supabase env in .env.local');
  process.exit(1);
}

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
/** The student's own client — the anon key, exactly what a browser gets. */
const anonClient = () => createClient(URL_, ANON, { auth: { persistSession: false } });
const PROJECT_REF = new URL(URL_).hostname.split('.')[0];

async function main() {
  // ---- a throwaway student, exactly like one who signed up on his own ----
  const email = `boundary-probe-${Date.now()}@example.com`;
  const password = `Probe!${Date.now()}`;
  const { data: made, error: makeErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (makeErr || !made.user) {
    console.error('could not create the probe account:', makeErr?.message);
    process.exit(1);
  }
  const studentId = made.user.id;
  console.log(`probe student: ${email}\n`);


  // A task addressed to SOMEONE ELSE, so the privacy rule is actually
  // exercised. Without it the check passes on an empty table — which is how a
  // policy that was never written looks identical to one that works. Removed
  // again in the finally block.
  let plantedTask: string | null = null;
  const { data: aTeacher } = await admin
    .from('teacher_students')
    .select('teacher_id, student_id')
    .limit(1)
    .maybeSingle();
  if (aTeacher) {
    const { data: planted } = await admin
      .from('assignments')
      .insert({
        teacher_id: aTeacher.teacher_id,
        student_id: aTeacher.student_id,
        topic: 'algebra-probe',
        title: 'boundary probe — auto-deleted',
      })
      .select('id')
      .single();
    plantedTask = planted?.id ?? null;
  }
  try {
    // ---- 1. he signs in normally -------------------------------------------
    const as = anonClient();
    const { data: signIn, error: signInErr } = await as.auth.signInWithPassword({
      email,
      password,
    });
    assert(!signInErr && !!signIn.session, 'the probe student can sign in (so the rest is a real test)');
    if (!signIn.session) throw new Error('no session');

    // ---- 2. Postgres: the roster and the hours are invisible to him --------
    // RLS is on with no policies, so this is a deny for every logged-in user.
    for (const table of ['teacher_students', 'teacher_week_hours']) {
      const { data, error } = await as.from(table).select('*');
      assert(
        (data ?? []).length === 0,
        `${table}: a student reads 0 rows${error ? ` (${error.code})` : ''}`
      );
    }

    // ---- 3. he sees his OWN assignments and nobody else's ------------------
    const { data: seen } = await as.from('assignments').select('student_id');
    assert(
      (seen ?? []).every((r) => r.student_id === studentId),
      'assignments: every row he can read is addressed to him'
    );
    const { data: allTasks } = await admin.from('assignments').select('id');
    assert(
      (allTasks ?? []).length > 0 && (seen ?? []).length === 0,
      `assignments: ${(allTasks ?? []).length} task(s) exist for other students, and he reads none`
    );

    // ---- 4. he cannot write himself a task, or one for anyone else ---------
    const { error: insertErr } = await as
      .from('assignments')
      .insert({ teacher_id: studentId, student_id: studentId, topic: 'אלגברה', title: 'x' });
    assert(!!insertErr, 'assignments: he cannot create a task at all');

    // ---- 5. another student's progress is not readable ---------------------
    const { data: others } = await admin.from('learning_state').select('user_id').limit(5);
    const someoneElse = (others ?? []).map((r) => String(r.user_id)).find((id) => id !== studentId);
    if (someoneElse) {
      const { data: peek } = await as.from('learning_state').select('user_id').eq('user_id', someoneElse);
      assert((peek ?? []).length === 0, "learning_state: another student's answer log is invisible");
    }

    // ---- 6. THE ONE THAT MATTERS: he cannot make himself a teacher ---------
    // user_metadata is his to write; app_metadata — which isTeacher() reads —
    // is service-role only. This is what makes the role a real boundary.
    await as.auth.updateUser({ data: { teacher: true, hourlyRate: 999 } });
    const { data: after } = await admin.auth.admin.getUserById(studentId);
    assert(
      after.user?.app_metadata?.teacher !== true,
      'self-promotion: writing user_metadata does NOT make him a teacher'
    );

    // ---- 7. the HTTP layer, with his real session cookie -------------------
    // @supabase/ssr stores the session in `sb-<ref>-auth-token`; forging it
    // here is exactly what his browser would send.
    const cookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(
      JSON.stringify(signIn.session)
    ).toString('base64url')}`;

    const hit = async (path: string) => {
      const res = await fetch(`${BASE}${path}`, {
        headers: { cookie },
        redirect: 'manual',
      });
      return { status: res.status, to: res.headers.get('location') ?? '' };
    };

    const teacherPage = await hit('/teacher');
    const authed = !teacherPage.to.includes('/login');
    if (!authed) {
      console.log('\n  ⚠️  the forged cookie did not authenticate — the HTTP checks below');
      console.log('      only prove the anonymous case, which is the weaker one.\n');
    }
    assert(
      teacherPage.status >= 300 && teacherPage.status < 400 && !teacherPage.to.endsWith('/teacher'),
      `/teacher redirects a student away (${teacherPage.status} → ${teacherPage.to || '—'})`
    );

    const adminPage = await hit('/admin');
    assert(
      adminPage.status >= 300 && adminPage.status < 400 && !adminPage.to.endsWith('/admin'),
      `/admin redirects a student away (${adminPage.status} → ${adminPage.to || '—'})`
    );

    for (const api of ['/api/teacher/overview', '/api/teacher/overview?as=x', '/api/admin/teachers']) {
      const r = await hit(api);
      // The status is in the message on purpose: a guard that refuses for the
      // WRONG reason (503 for a missing service key, say) still looks like a
      // refusal, and would pass a bare === 403 check on the machine where the
      // key happens to be set.
      assert(r.status === 403, `${api} answers 403 to a student (got ${r.status})`);
    }
  } finally {
    if (plantedTask) await admin.from('assignments').delete().eq('id', plantedTask);
    await admin.auth.admin.deleteUser(studentId);
    console.log('\nprobe account deleted.');
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
