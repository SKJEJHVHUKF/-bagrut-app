/**
 * preview-teacher-view.ts — what will a given teacher actually SEE on /teacher?
 *
 *   npx tsx scripts/preview-teacher-view.ts [teacher-email]
 *
 * FREE, read-only, no model call.
 *
 * WHY THIS EXISTS
 * /teacher is behind that teacher's own login, so the only way to check it is
 * to be him. This reproduces the same reads /api/teacher/overview does — his
 * roster, then those students' answer logs — and prints the result, so "the
 * teacher sees nothing" can be diagnosed without anyone's password.
 *
 * And there is one answer it exists to give honestly: a student who never
 * signed in has no learning_state row at all. On the dashboard that is printed
 * as "לא סונכרן מעולם", never as a zero, and this script says the same — an
 * empty table means there is nothing to measure, not that the student idled.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';
import { buildPay } from '../lib/teacher-pay';
import { assignmentProgress } from '../lib/assignment-progress';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

type ResultRow = {
  ts?: number;
  topic?: string;
  correct?: boolean;
  hintUsed?: boolean;
  subTopicId?: string;
  answerDiagnosis?: { kind?: string };
};

const wanted = process.argv[2]?.toLowerCase();

async function main() {
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = list?.users ?? [];
  const teachers = users.filter((u) => u.app_metadata?.teacher === true);

  if (teachers.length === 0) {
    console.log('No teachers. Mark an account as a teacher in /admin/accounts first.');
    return;
  }

  for (const t of teachers) {
    if (wanted && t.email?.toLowerCase() !== wanted) continue;

    const name = (t.user_metadata?.name as string) || t.email || t.id;
    const rate = Number(t.app_metadata?.hourlyRate ?? 0);
    const weeklyHours = Number(t.app_metadata?.weeklyHours ?? 0);

    const { data: weeks } = await db
      .from('teacher_week_hours')
      .select('week_start, hours, note')
      .eq('teacher_id', t.id);

    const pay = buildPay({
      now: new Date(),
      rate,
      weeklyHours,
      since: (t.app_metadata?.teacherSince as string) ?? null,
      overrides: (weeks ?? []).map((w) => ({
        weekStart: String(w.week_start),
        hours: Number(w.hours ?? 0),
        note: (w.note as string) ?? null,
      })),
    });

    console.log(`\n================ ${name} ================`);
    console.log(`terms: ${weeklyHours}h/week at ${rate} ILS`);
    console.log(
      `pay:   this week ${pay.week.hours}h = ${pay.week.pay} ILS | ` +
        `${pay.month.month} so far ${pay.month.hours}h = ${pay.month.pay} ILS`
    );

    const { data: links } = await db
      .from('teacher_students')
      .select('student_id')
      .eq('teacher_id', t.id);
    const ids = (links ?? []).map((l) => String(l.student_id));
    console.log(`students: ${ids.length}`);
    if (ids.length === 0) continue;

    const { data: states } = await db
      .from('learning_state')
      .select('user_id, results, updated_at')
      .in('user_id', ids);
    const { data: tasks } = await db
      .from('assignments')
      .select('student_id, title, topic, sub_topic_id, target_count, created_at')
      .eq('teacher_id', t.id);

    for (const id of ids) {
      const u = users.find((x) => x.id === id);
      const who = (u?.user_metadata?.name as string) || u?.email || id.slice(0, 8);
      const state = (states ?? []).find((s) => String(s.user_id) === id);

      if (!state) {
        console.log(`\n  ${who}\n    NEVER SYNCED — no learning_state row; he has not opened the`);
        console.log(`    app while signed in to this account. Nothing to measure (not a zero).`);
        continue;
      }

      const results: ResultRow[] = Array.isArray(state.results) ? (state.results as ResultRow[]) : [];
      const byTopic = new Map<string, { n: number; ok: number; hints: number }>();
      for (const r of results) {
        const k = r.topic ?? '(no topic)';
        const b = byTopic.get(k) ?? { n: 0, ok: 0, hints: 0 };
        b.n++;
        if (r.correct) b.ok++;
        if (r.hintUsed) b.hints++;
        byTopic.set(k, b);
      }
      const ok = results.filter((r) => r.correct).length;

      console.log(`\n  ${who}`);
      console.log(`    synced ${state.updated_at} · ${results.length} answers, ${ok} correct`);
      if (results.length === 0) {
        console.log('    (synced, but has not answered a question yet)');
      }
      for (const [topic, b] of [...byTopic.entries()].sort((a, c) => c[1].n - a[1].n)) {
        const pct = Math.round((b.ok / b.n) * 100);
        const stuck = b.n >= 3 && b.ok / b.n < 0.6 ? '  <-- STUCK' : '';
        console.log(`      ${topic}: ${b.ok}/${b.n} (${pct}%)${b.hints ? ` ${b.hints} hints` : ''}${stuck}`);
      }

      for (const a of (tasks ?? []).filter((x) => String(x.student_id) === id)) {
        const p = assignmentProgress(results, {
          topic: String(a.topic),
          subTopicId: (a.sub_topic_id as string) ?? null,
          createdAt: String(a.created_at),
        });
        console.log(
          `      TASK "${a.title}" [${a.topic}]: ${p.answered}/${a.target_count} answered, ${p.correct} correct`
        );
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
