/**
 * /api/school/classes/[id] — the whole class board, in one GET.
 *
 * One route rather than four (roster / board / focus / student cards) because
 * the screen loads all of it at once: one auth check, one round trip, and ONE
 * place where "only the class you teach" is applied.
 *
 * ⚠️ ZERO AI, and every number comes from lib/class-board — a pure function
 * tested without a database. This file's only jobs are to fetch the rows the
 * caller is allowed to see and to hand them over.
 *
 * ⚠️ THE READ IS SCOPED BY ROSTER, NOT FILTERED AFTER. `.in('user_id', ids)` is
 * the only thing standing between this teacher and every other student's answer
 * history, so it is applied in the query.
 */

import { requireClassTeacher, classRoster, jsonError } from '@/lib/school-guard';
import { buildClassBoard, type BoardAttempt } from '@/lib/class-board';
import { assignmentProgress } from '@/lib/assignment-progress';
import { describeFocus, type Rung } from '@/lib/focus-target';
import { formatJoinCode } from '@/lib/join-code';

export const dynamic = 'force-dynamic';

/**
 * How far back the board looks.
 *
 * A term, not a year: a class board answers "who needs me now", and a topic
 * someone failed in October is a different claim from one they are failing this
 * week. The full history stays in `attempts` for the per-student card and the
 * end-of-year report, which are the screens that should read it.
 */
const WINDOW_DAYS = 120;
/** A hard ceiling so one very active class cannot pull an unbounded result set
 *  into a serverless function. 30 students × 120 days would have to average 5.5
 *  answers a day each to reach it. */
const MAX_ROWS = 20000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const ctx = await requireClassTeacher(request, id, false);
  if (ctx instanceof Response) return ctx;

  const [{ data: klass }, roster] = await Promise.all([
    ctx.db
      .from('classes')
      .select('id, name, school, units, school_year, join_code, archived')
      .eq('id', ctx.classId)
      .single(),
    classRoster(ctx),
  ]);

  if (!klass) return jsonError('forbidden', 403);

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const studentIds = roster.map((s) => s.id);

  const [attemptsRes, focusRes] = await Promise.all([
    studentIds.length
      ? ctx.db
          .from('attempts')
          .select('user_id, topic, sub_topic_id, correct, is_repeat, hint_used, created_at')
          .in('user_id', studentIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(MAX_ROWS)
      : Promise.resolve({ data: [] as unknown[] }),
    ctx.db
      .from('focus')
      .select('id, topic, sub_topic_id, rung, target_count, due_on, note, created_at')
      .eq('class_id', ctx.classId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const attempts = ((attemptsRes.data ?? []) as Record<string, unknown>[]).map(
    (a): BoardAttempt => ({
      user_id: String(a.user_id),
      topic: String(a.topic ?? ''),
      sub_topic_id: (a.sub_topic_id as string) ?? null,
      correct: !!a.correct,
      is_repeat: !!a.is_repeat,
      hint_used: !!a.hint_used,
      created_at: String(a.created_at),
    })
  );

  const board = buildClassBoard(roster, attempts, Date.now());

  // ---- how each focus is going ---------------------------------------------
  //
  // Counted from `attempts`, never stored. The rule is the one
  // lib/assignment-progress already implements for the private-teacher board —
  // reused rather than re-written, because two counters over the same events is
  // exactly how a teacher sees 3/5 while the student sees 4/5.
  const focusRows = (focusRes.data ?? []) as Record<string, unknown>[];
  const focusIds = focusRows.map((f) => String(f.id));

  const { data: targetRows } = focusIds.length
    ? await ctx.db.from('focus_targets').select('focus_id, student_id').in('focus_id', focusIds)
    : { data: [] as Record<string, unknown>[] };

  const targetsOf = new Map<string, string[]>();
  for (const t of targetRows ?? []) {
    const k = String(t.focus_id);
    const list = targetsOf.get(k) ?? [];
    list.push(String(t.student_id));
    targetsOf.set(k, list);
  }

  // One camelCase view of the answers, built once, for the shared counter.
  const countable = attempts.map((a) => ({
    topic: a.topic,
    subTopicId: a.sub_topic_id ?? undefined,
    correct: a.correct,
    ts: Date.parse(a.created_at),
    userId: a.user_id,
  }));

  const focuses = focusRows.map((f) => {
    const id = String(f.id);
    // No target rows means the whole class — the common case, and it costs no
    // rows to say so.
    const targeted = targetsOf.get(id) ?? studentIds;
    const target = Number(f.target_count ?? 0) || null;
    const spec = {
      topic: String(f.topic),
      subTopicId: (f.sub_topic_id as string) ?? null,
      createdAt: String(f.created_at),
    };

    let done = 0;
    let started = 0;
    for (const sid of targeted) {
      const p = assignmentProgress(
        countable.filter((c) => c.userId === sid),
        spec
      );
      if (p.answered > 0) started++;
      if (target === null ? p.answered > 0 : p.answered >= target) done++;
    }

    return {
      id,
      topic: String(f.topic),
      subTopicId: (f.sub_topic_id as string) ?? null,
      rung: (f.rung as Rung) ?? null,
      label: describeFocus({
        topic: String(f.topic),
        subTopicId: (f.sub_topic_id as string) ?? null,
        rung: (f.rung as Rung) ?? null,
      }),
      targetCount: target,
      dueOn: (f.due_on as string) ?? null,
      note: (f.note as string) ?? null,
      createdAt: String(f.created_at),
      /** null = the whole class. */
      targetedCount: targetsOf.has(id) ? targeted.length : null,
      totalCount: targeted.length,
      started,
      done,
    };
  });

  return Response.json({
    class: {
      id: String(klass.id),
      name: String(klass.name),
      school: (klass.school as string) ?? null,
      units: (klass.units as number) ?? null,
      schoolYear: String(klass.school_year),
      joinCode: klass.join_code ? formatJoinCode(String(klass.join_code)) : null,
      archived: !!klass.archived,
    },
    board,
    focuses,
    // Told, never inferred: an empty board because nobody has joined is a
    // different screen from an empty board because nobody has worked.
    windowDays: WINDOW_DAYS,
  });
}

export function POST(): Response {
  // Read-only by construction: a mutation living next to a full dump of thirty
  // students' answer history is a mistake waiting to be made.
  return jsonError('method not allowed', 405);
}
