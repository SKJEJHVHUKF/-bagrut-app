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
 * WHERE THE PROGRESS DATA COMES FROM — TWO SOURCES, UNIONED
 *
 * `public.attempts` is the durable one: one append-only row per answer, written
 * server-side by /api/attempt, never truncated, with the SERVER's clock on it.
 * It is the source of record from the day that writer shipped.
 *
 * `learning_state.results` is the older one: a JSONB blob the student's browser
 * syncs on every app load — and lib/results.ts caps it at MAX_EVENTS = 1000 and
 * truncates from the FRONT. The busiest student measured 543 answers, so within
 * months a tutor's accuracy and fortnight trend would have quietly started
 * resting on partial history with nothing on screen saying so.
 *
 * Both are read and merged, deduped on (ts, questionId). Not one or the other:
 * `attempts` holds nothing from before it shipped, and the blob holds nothing
 * after it truncates. The union is the only thing that is complete on both
 * sides of that date, and it needs no migration and no backfill.
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
import { mergeAnswerLog } from '@/lib/answer-log';
import { buildReport } from '@/lib/report';
import { TAG_INFO } from '@/lib/patterns/tags';
import type { ResultEvent } from '@/lib/results';
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
  /** REQUIRED by lib/report, which filters on it. A row typed without it
   *  produces an empty report that reads as "not enough data yet" rather
   *  than as the bug it is. */
  subject?: string;
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
  const [states, attemptRows, assignmentRows, ...profiles] = await Promise.all([
    ctx.db
      .from('learning_state')
      .select('user_id, results, roadmap, plan, updated_at')
      .in('user_id', studentIds),
    // The durable log. Scoped to the roster like everything else here, newest
    // first, capped high enough to cover any real student and low enough that
    // one query cannot become the page's problem.
    ctx.db
      .from('attempts')
      .select(
        'user_id, ts, topic, sub_topic_id, question_id, source, difficulty, correct, is_repeat, hint_used, self_reported, diagnosis'
      )
      .in('user_id', studentIds)
      .order('ts', { ascending: false })
      .limit(20000),
    ctx.db
      .from('assignments')
      .select('id, student_id, title, topic, sub_topic_id, target_count, due_date, created_at')
      .eq('teacher_id', ctx.teacher.id)
      .order('created_at', { ascending: false }),
    ...studentIds.map((id) => ctx.db.auth.admin.getUserById(id)),
  ]);

  const stateOf = new Map<
    string,
    {
      results: ResultRow[];
      roadmap: RoadmapStore;
      plan: { bagrutDate?: string; targetGrade?: number } | null;
      updatedAt: string | null;
    }
  >();
  for (const s of (states.data ?? []) as Record<string, unknown>[]) {
    stateOf.set(String(s.user_id), {
      results: Array.isArray(s.results) ? (s.results as ResultRow[]) : [],
      roadmap: s.roadmap && typeof s.roadmap === 'object' ? (s.roadmap as RoadmapStore) : {},
      plan: s.plan && typeof s.plan === 'object' ? (s.plan as { bagrutDate?: string }) : null,
      updatedAt: typeof s.updated_at === 'string' ? s.updated_at : null,
    });
  }

  // attempts rows → the same shape the aggregation below already speaks. The
  // column names differ (snake_case in Postgres) and nothing else does; the
  // table was deliberately built to mirror ResultEvent field for field.
  const attemptsOf = new Map<string, ResultRow[]>();
  for (const a of (attemptRows.data ?? []) as Record<string, unknown>[]) {
    const id = String(a.user_id);
    const list = attemptsOf.get(id) ?? [];
    list.push({
      ts: Number(a.ts),
      topic: (a.topic as string) ?? undefined,
      subTopicId: (a.sub_topic_id as string) ?? undefined,
      questionId: (a.question_id as string) ?? undefined,
      source: (a.source as string) ?? undefined,
      difficulty: (a.difficulty as string) ?? undefined,
      correct: a.correct === true,
      repeat: a.is_repeat === true,
      hintUsed: a.hint_used === true,
      selfReported: (a.self_reported as boolean) ?? undefined,
      answerDiagnosis: (a.diagnosis as { kind?: string; note?: string }) ?? undefined,
      subject: 'math5',
    });
    attemptsOf.set(id, list);
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

    // The durable rows win where both sources describe the same answer: they
    // are server-stamped and cannot be edited from a browser. The blob then
    // contributes only what predates the writer.
    const durable = attemptsOf.get(id) ?? [];
    const results = mergeAnswerLog(durable, state?.results ?? []) as ResultRow[];

    // ⚠️ ACCURACY IS MEASURED ON FIRST ATTEMPTS ONLY, and this is not a
    // preference — it is the rule lib/results.ts already applies to every
    // number the STUDENT sees (`measured()`, which drops `repeat`). Counting
    // replays here made the same student read 72% on his own screen and 85%
    // on his tutor's, and re-doing a cleared rung — which is learning, not a
    // new measurement — silently raised the tutor's figure. Two people
    // looking at one student must not see two numbers.
    const measured = results.filter((r) => !r.repeat);

    const topics = new Map<string, { answered: number; correct: number; hints: number }>();
    // Same counters one level down. Every answer has carried subTopicId all
    // along and the board threw the resolution away at the last step, so a
    // tutor read "טריגונומטריה 62%" for a student who is fine everywhere in it
    // except one sub-topic at 40%. 62% is not a lesson plan; the sub-topic is.
    const subTopics = new Map<string, { answered: number; correct: number }>();
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

      // Keyed by topic AND sub-topic: the same sub-topic id can legitimately
      // exist under two topics, and merging them would invent a weakness.
      if (r.subTopicId) {
        const k = `${name} ${r.subTopicId}`;
        const sb = subTopics.get(k) ?? { answered: 0, correct: 0 };
        sb.answered++;
        if (r.correct) sb.correct++;
        subTopics.set(k, sb);
      }
    }

    const answered = measured.length;
    const correct = measured.filter((r) => r.correct).length;

    // ⚠️ A PAST-PAPER QUESTION AND A WARM-UP DRILL ARE NOT THE SAME EVIDENCE,
    // and until now they landed in one bucket. In an app whose entire purpose
    // is a bagrut grade, "80% overall" hiding "has never opened a real paper"
    // is the most expensive thing this board could fail to say. `source` has
    // been on every event since the log existed.
    // ============================================================
    // The recurring mistake, named — from lib/report, not from a model.
    // ============================================================
    // lib/patterns turns labelled wrong answers into "this same misconception
    // keeps coming back, across four sub-topics", with the Hebrew name, what
    // it looks like, and one habit that prevents it — all authored, none of it
    // generated. One call over the array already in hand.
    //
    // ⚠️ IT PRODUCES NOTHING TODAY, AND THAT IS NOT A BUG HERE. A miss is only
    // labelled when it came from a PARAMETRIC GENERATOR question (`gen:` id)
    // whose template carries `distractorTags` — see tagFromChoice in
    // lib/patterns/observe. Measured 2026-09-02 across every synced student:
    // 716 answers, 712 with a question id, and ZERO of them generator ids,
    // while 31 of the 37 templates do carry tags. So the raw material is
    // authored and the wiring is sound; the questions simply never reach a
    // student. `patterns` is therefore an empty array for everyone right now,
    // the section self-hides, and it will light up on its own the day the
    // generator serves questions. The student's own /report page is empty for
    // exactly the same reason — this route did not cause it and cannot fix it.
    //
    // ⚠️ `repairs` is deliberately NOT passed through. It is derived from
    // `healed`/`healCount`, which live only in the student's browser, so it is
    // always empty here — and "0 תיקונים" would be exactly the false zero this
    // route's header warns about. Same reason `mistakes` is empty: the error
    // notebook is localStorage-only and never synced.
    const raw = buildReport({
      subject: 'math5',
      // The rows were WRITTEN by lib/results, so they are ResultEvent at
      // runtime; the local type above is optional-everywhere only because a
      // JSON column deserves a defensive read.
      events: results as unknown as ResultEvent[],
      mistakes: [],
      history: [],
      healed: {},
      healCount: {},
      now: Date.now(),
    });

    const report = {
      earlyDays: raw.earlyDays,
      // ⚠️ THE ONE THING ON THIS BOARD THAT NAMES THE MISTAKE, and it works
      // today. `weaknesses` was left out of this payload at first on the
      // reasoning that the topic rows and the ladder already say "where" —
      // that was wrong. They say where; this says WHAT, in a sentence a
      // person wrote: "מחשב שליפה עם החזרה כשנדרשת שליפה בלי החזרה", with
      // the explanation underneath.
      //
      // It does NOT depend on the parametric generator. lib/patterns needs a
      // `gen:` id and is therefore still dark; detectWeaknesses reads the
      // cognition maps' trigger index over AUTHORED mcq ids via chosenIndex,
      // which every quiz and drill answer has carried all along. Measured on
      // live data the day it was added: 3, 7 and 28 weaknesses on the three
      // students with real history, including named misconceptions.
      //
      // Misconceptions first: a named cause outranks "6 of 8 were wrong".
      weaknesses: [...raw.weaknesses]
        .sort((a, b) => Number(b.kind === 'misconception') - Number(a.kind === 'misconception'))
        .slice(0, 5)
        .map((w) => ({
          kind: w.kind,
          topic: w.topic,
          subTopicId: w.subTopicId,
          title: w.title,
          detail: w.detail,
          band: w.band,
          chronic: raw.chronic.some((c) => c.id === w.id),
        })),
      totalAnswered: raw.totalAnswered,
      // Cross-topic patterns only: `local` ones are a single sub-topic's
      // problem and the rung list above already points at those.
      patterns: raw.profile.patterns.slice(0, 3).map((p) => ({
        label: TAG_INFO[p.tag].label,
        detail: TAG_INFO[p.tag].detail,
        fix: TAG_INFO[p.tag].fix,
        hits: p.hits,
        share: p.share,
        spread: p.spread,
        topics: p.topics.slice(0, 4).map((t) => t.topic),
      })),
      // Movement needs both halves; the module already returns null rather
      // than inventing a delta from a thin fortnight.
      movement: raw.movement
        .filter((m) => m.delta !== null)
        .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
        .map((m) => ({
          topic: m.topic,
          delta: m.delta,
          recentAttempts: m.recent?.attempts ?? 0,
          priorAttempts: m.prior?.attempts ?? 0,
        })),
    };

    const bagrutRows = measured.filter((r) => r.source === 'bagrut');
    const bagrut = {
      answered: bagrutRows.length,
      correct: bagrutRows.filter((r) => r.correct).length,
    };

    // The date the whole plan points at, and the grade he told the app he
    // wants. Both are already synced in learning_state.plan and shown to
    // nobody but the student.
    const planDate = state?.plan?.bagrutDate ?? null;
    const daysToBagrut =
      planDate && /^\d{4}-\d{2}-\d{2}$/.test(planDate)
        ? Math.round(
            (Date.parse(`${planDate}T00:00:00Z`) - Date.parse(`${israelDay(new Date())}T00:00:00Z`)) /
              86400000
          )
        : null;

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

    /** The weakest sub-topic inside one topic, if any clears the same bar. */
    const worstSubTopicIn = (topic: string) => {
      let worst: {
        subTopicId: string;
        title: string;
        answered: number;
        correct: number;
        accuracy: number;
      } | null = null;
      for (const [k, v] of subTopics) {
        const [t, subId] = k.split(' ');
        if (t !== topic || v.answered < STUCK_MIN_ATTEMPTS) continue;
        const accuracy = v.correct / v.answered;
        if (accuracy >= STUCK_MAX_ACCURACY) continue;
        if (worst && accuracy >= worst.accuracy) continue;
        worst = {
          subTopicId: subId,
          // Never the raw id on screen: `trig-right-triangle` is not a thing a
          // tutor recognises. Falls back to the id only if the content was
          // renamed since the answer was recorded.
          title: getSubTopic('math5', topic, subId)?.title ?? subId,
          answered: v.answered,
          correct: v.correct,
          accuracy,
        };
      }
      return worst;
    };

    const stuck = topicRows
      .filter((t) => t.answered >= STUCK_MIN_ATTEMPTS && t.accuracy < STUCK_MAX_ACCURACY)
      .sort((a, b) => b.answered - b.correct - (a.answered - a.correct))
      .map((t) => ({ ...t, worstSubTopic: worstSubTopicIn(t.topic) }));

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
      // null = nothing from EITHER source. NOT zero — see the header. A student
      // with durable rows but no synced blob is a real, measurable student.
      syncedAt: state?.updatedAt ?? (durable.length ? new Date(durable[durable.length - 1].ts ?? 0).toISOString() : null),
      /** How much of this student's history is on the durable log. */
      durableAnswers: durable.length,
      lastAnswerAt,
      answered,
      correct,
      accuracy: answered ? correct / answered : 0,
      // How much of that accuracy the student graded himself.
      selfReported,
      difficulty,
      report,
      bagrut,
      bagrutDate: planDate,
      daysToBagrut,
      targetGrade: state?.plan?.targetGrade ?? null,
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
