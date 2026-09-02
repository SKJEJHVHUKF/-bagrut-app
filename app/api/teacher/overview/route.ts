/**
 * /api/teacher/overview — everything the teacher's dashboard shows, in one GET.
 *
 * One route rather than three (roster / assignments / pay) because the screen
 * loads all of it at once: one auth check, one round trip, one place where the
 * "only his own students" rule is applied.
 *
 * ⚠️ ZERO AI. Every number here is Postgres plus arithmetic — the teacher
 * system was specified to cost nothing per view, so nothing in this file may
 * ever call Anthropic. "Where is he stuck" is a threshold over answers he
 * already gave, not a model's opinion.
 *
 * WHERE THE PROGRESS DATA COMES FROM
 * `learning_state.results` — the answer log the student's own browser syncs on
 * every app load (lib/sync/roadmap-sync.ts, called from AppChrome). Nothing new
 * is recorded for this feature.
 *
 * ⚠️ AND WHAT THAT MEANS WHEN IT IS EMPTY. A student who never signed in has no
 * learning_state row at all, and an empty answer log is indistinguishable from
 * a lazy week unless we say so. So `syncedAt: null` is passed through and the
 * dashboard prints "לא סונכרן מעולם" — never a zero. A wrong zero here walks
 * straight into a lesson with the student.
 */

import { requireTeacher, roster, jsonError } from '@/lib/teacher-guard';
import { teacherRate, teacherWeeklyHours, teacherSince } from '@/lib/access';
import { buildPay, type HourOverride } from '@/lib/teacher-pay';
import { assignmentProgress } from '@/lib/assignment-progress';
import { israelDay } from '@/lib/teacher-pay';
import { getSubTopic } from '@/content/lessons';

export const dynamic = 'force-dynamic';

/** One answered question, as lib/results.ts wrote it. Every field optional:
 *  these rows were written by clients of many ages. */
type ResultRow = {
  ts?: number;
  topic?: string;
  correct?: boolean;
  hintUsed?: boolean;
  questionId?: string;
  subTopicId?: string;
  difficulty?: string;
  answerDiagnosis?: { kind?: string; note?: string };
  /** A replay of a question already answered once. EXCLUDED from accuracy —
   *  see the header. Still counts as activity. */
  repeat?: boolean;
  /** 'quiz' | 'drill' | 'bagrut' | 'review' | 'fix'. */
  source?: string;
  /** Open questions: the student marked his own paper. Much weaker evidence
   *  than a machine-checked answer, so the board says how much of the score
   *  rests on it. */
  selfReported?: boolean;
};

/** The per-rung ladder progress, as lib/roadmap-progress writes it. */
type RoadmapStore = Record<
  string,
  { levels?: Record<string, { cleared?: boolean; attempts?: number; stars?: number }> }
>;

/** A topic is "stuck" at this much failure, over at least this many tries —
 *  fewer than three answers is a bad day, not a weakness. */
const STUCK_MIN_ATTEMPTS = 3;
const STUCK_MAX_ACCURACY = 0.6;
const RECENT_WRONG = 20;

export async function GET(request: Request): Promise<Response> {
  const ctx = await requireTeacher(request, false);
  if (ctx instanceof Response) return ctx;

  const rate = teacherRate(ctx.teacher);
  const weeklyHours = teacherWeeklyHours(ctx.teacher);

  const [overrides, studentIds] = await Promise.all([
    ctx.db
      .from('teacher_week_hours')
      .select('week_start, hours, note')
      .eq('teacher_id', ctx.teacher.id),
    roster(ctx),
  ]);

  const pay = buildPay({
    now: new Date(),
    rate,
    weeklyHours,
    since: teacherSince(ctx.teacher),
    overrides: ((overrides.data ?? []) as Record<string, unknown>[]).map(
      (o): HourOverride => ({
        weekStart: String(o.week_start),
        hours: Number(o.hours ?? 0),
        note: (o.note as string) ?? null,
      })
    ),
  });

  if (studentIds.length === 0) return Response.json({ students: [], pay });

  // Scoped by student id on purpose — never a full-table scan. The roster is
  // the only thing standing between this teacher and every other teacher's
  // students, so it is applied in the query, not after it.
  const [states, assignmentRows, ...profiles] = await Promise.all([
    ctx.db
      .from('learning_state')
      .select('user_id, results, roadmap, updated_at')
      .in('user_id', studentIds),
    ctx.db
      .from('assignments')
      .select('id, student_id, title, topic, sub_topic_id, target_count, due_date, created_at')
      .eq('teacher_id', ctx.teacher.id)
      .order('created_at', { ascending: false }),
    ...studentIds.map((id) => ctx.db.auth.admin.getUserById(id)),
  ]);

  const stateOf = new Map<
    string,
    { results: ResultRow[]; roadmap: RoadmapStore; updatedAt: string | null }
  >();
  for (const s of (states.data ?? []) as Record<string, unknown>[]) {
    stateOf.set(String(s.user_id), {
      results: Array.isArray(s.results) ? (s.results as ResultRow[]) : [],
      roadmap: s.roadmap && typeof s.roadmap === 'object' ? (s.roadmap as RoadmapStore) : {},
      updatedAt: typeof s.updated_at === 'string' ? s.updated_at : null,
    });
  }

  const assignmentsOf = new Map<string, Record<string, unknown>[]>();
  for (const a of (assignmentRows.data ?? []) as Record<string, unknown>[]) {
    const list = assignmentsOf.get(String(a.student_id)) ?? [];
    list.push(a);
    assignmentsOf.set(String(a.student_id), list);
  }

  const students = studentIds.map((id, i) => {
    const user = profiles[i]?.data?.user ?? null;
    const state = stateOf.get(id);
    const results = state?.results ?? [];

    // ⚠️ ACCURACY IS MEASURED ON FIRST ATTEMPTS ONLY, and this is not a
    // preference — it is the rule lib/results.ts already applies to every
    // number the STUDENT sees (`measured()`, which drops `repeat`). Counting
    // replays here made the same student read 72% on his own screen and 85%
    // on his tutor's, and re-doing a cleared rung — which is learning, not a
    // new measurement — silently raised the tutor's figure. Two people
    // looking at one student must not see two numbers.
    const measured = results.filter((r) => !r.repeat);

    const topics = new Map<string, { answered: number; correct: number; hints: number }>();
    const days = new Set<string>();
    const difficulty = { easy: 0, mid: 0, hard: 0 };
    let lastAnswerAt: number | null = null;
    let selfReported = 0;

    // ACTIVITY is every event, replays included: re-doing a rung is still a
    // student who sat down to work, and the tutor needs to know he did.
    for (const r of results) {
      if (typeof r.ts !== 'number') continue;
      if (lastAnswerAt === null || r.ts > lastAnswerAt) lastAnswerAt = r.ts;
      days.add(israelDay(new Date(r.ts)));
    }

    for (const r of measured) {
      if (r.selfReported) selfReported++;
      if (r.difficulty === 'easy' || r.difficulty === 'mid' || r.difficulty === 'hard') {
        difficulty[r.difficulty]++;
      }
      const name = r.topic ?? '(ללא נושא)';
      const bucket = topics.get(name) ?? { answered: 0, correct: 0, hints: 0 };
      bucket.answered++;
      if (r.correct) bucket.correct++;
      if (r.hintUsed) bucket.hints++;
      topics.set(name, bucket);
    }

    const answered = measured.length;
    const correct = measured.filter((r) => r.correct).length;

    // Days worked in the last 30, not questions answered ever: 200 questions
    // in one panic night and 20 spread over ten days are the same total and
    // two completely different students.
    const cutoff = Date.now() - 30 * 86400000;
    const activeDays = [...new Set(
      results.filter((r) => typeof r.ts === 'number' && r.ts >= cutoff)
        .map((r) => israelDay(new Date(r.ts as number)))
    )].length;

    const topicRows = [...topics.entries()]
      .map(([topic, t]) => ({ topic, ...t, accuracy: t.answered ? t.correct / t.answered : 0 }))
      .sort((a, b) => b.answered - a.answered);

    const stuck = topicRows
      .filter((t) => t.answered >= STUCK_MIN_ATTEMPTS && t.accuracy < STUCK_MAX_ACCURACY)
      .sort((a, b) => b.answered - b.correct - (a.answered - a.correct));

    // The ladder: a rung played three times and still not cleared is the
    // sentence that decides what to open Tuesday's lesson with. No percentage
    // says it. `learning_state.roadmap` has carried this all along and nothing
    // has ever rendered it.
    const stuckRungs: { topic: string; subId: string; title: string; kind: string; attempts: number }[] = [];
    for (const [key, node] of Object.entries(state?.roadmap ?? {})) {
      const [topic, subId] = key.split('::');
      if (!topic || !subId) continue;
      for (const [kind, rung] of Object.entries(node?.levels ?? {})) {
        if (rung?.cleared || (rung?.attempts ?? 0) < 3) continue;
        stuckRungs.push({
          topic,
          subId,
          title: getSubTopic('math5', topic, subId)?.title ?? subId,
          kind,
          attempts: rung?.attempts ?? 0,
        });
      }
    }
    stuckRungs.sort((a, b) => b.attempts - a.attempts);

    const recentWrong = measured
      .filter((r) => r.correct === false)
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
      .slice(0, RECENT_WRONG)
      .map((r) => ({
        topic: r.topic ?? '(ללא נושא)',
        ts: r.ts ?? null,
        hintUsed: !!r.hintUsed,
        difficulty: r.difficulty ?? null,
        diagnosis: r.answerDiagnosis?.kind ?? null,
        note: r.answerDiagnosis?.note ?? null,
      }));

    const assignments = (assignmentsOf.get(id) ?? []).map((a) => {
      const target = Number(a.target_count ?? 5);
      // Shared with the student's own card so the two counters cannot drift.
      const progress = assignmentProgress(results, {
        topic: String(a.topic),
        subTopicId: (a.sub_topic_id as string) ?? null,
        createdAt: String(a.created_at),
      });
      return {
        id: String(a.id),
        title: String(a.title),
        topic: String(a.topic),
        subTopicId: (a.sub_topic_id as string) ?? null,
        targetCount: target,
        dueDate: (a.due_date as string) ?? null,
        createdAt: String(a.created_at),
        answered: progress.answered,
        correct: progress.correct,
        complete: progress.answered >= target,
      };
    });

    return {
      id,
      // ⚠️ NAME ONLY, NEVER THE EMAIL. A teacher is here to see how his own
      // students are doing, not to hold their contact details — the account
      // itself belongs to the owner, who employs him. The id has to stay (a
      // task is addressed to it) but it identifies nothing on its own.
      //
      // The fallback matters as much as the rule: falling back to the email
      // when a name is unset would leak it for exactly the accounts created in
      // a hurry. Four hex characters keep two unnamed students apart instead.
      name: (user?.user_metadata?.name as string) || `תלמיד ${id.slice(0, 4)}`,
      // null = no learning_state row at all. NOT zero — see the header.
      syncedAt: state?.updatedAt ?? null,
      lastAnswerAt,
      answered,
      correct,
      accuracy: answered ? correct / answered : 0,
      // How much of that accuracy the student graded himself.
      selfReported,
      difficulty,
      activeDays,
      totalDays: days.size,
      topics: topicRows,
      stuck,
      stuckRungs: stuckRungs.slice(0, 5),
      recentWrong,
      assignments,
    };
  });

  students.sort((a, b) => (b.lastAnswerAt ?? 0) - (a.lastAnswerAt ?? 0));

  return Response.json({ students, pay });
}

export function POST(): Response {
  // Read-only by construction: a mutation living next to a full dump of every
  // student's answer history is a mistake waiting to be made.
  return jsonError('method not allowed', 405);
}
