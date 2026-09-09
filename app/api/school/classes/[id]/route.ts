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
import { buildReport } from '@/lib/report';
import type { ResultEvent } from '@/lib/results';
import { classMistakes, type StudentMistakes } from '@/lib/class-mistakes';

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
          // ⚠️ The last six columns are what turns "43% בוקטורים" into "מחשב
          // שליפה עם החזרה כשנדרשת שליפה בלי החזרה". `chosen_index` +
          // `question_id` are the pair lib/remediation reads against the
          // cognition maps' trigger index — the WRONG OPTION he picked is what
          // names the misconception. Without them the board can only say a
          // percentage, which is what it did: of 325 wrong answers in
          // production, 6 had a name.
          .select(
            'user_id, topic, sub_topic_id, correct, is_repeat, hint_used, diagnosis, created_at, ' +
              'ts, question_id, source, difficulty, kind, chosen_index, option_count, self_reported'
          )
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
      diagnosis: (a.diagnosis as { kind?: string; note?: string }) ?? null,
      created_at: String(a.created_at),
    })
  );

  const board = buildClassBoard(roster, attempts, Date.now());

  // ---- what is actually broken, per student and for the class --------------
  //
  // The board above says WHERE (topic, percentage). This says WHAT, in the
  // Hebrew somebody authored: a named misconception where the student picked a
  // wrong OPTION the cognition map recognises, and the exact sub-topic
  // otherwise. Same engine the private-teacher board uses — imported, not
  // re-implemented, so the two boards cannot describe one student differently.
  //
  // `mistakes`/`history`/`healed` are empty on purpose: the error notebook is
  // localStorage-only and never synced, so a server-side value would be a
  // false zero rather than a fact. buildReport degrades to the parts it can
  // compute from the answers themselves.
  const now = Date.now();
  const eventsOf = new Map<string, ResultEvent[]>();
  for (const raw of (attemptsRes.data ?? []) as Record<string, unknown>[]) {
    const sid = String(raw.user_id);
    const list = eventsOf.get(sid) ?? [];
    list.push({
      ts: Number(raw.ts ?? Date.parse(String(raw.created_at))),
      subject: 'math5',
      topic: String(raw.topic ?? ''),
      subTopicId: (raw.sub_topic_id as string) ?? undefined,
      questionId: (raw.question_id as string) ?? undefined,
      source: (raw.source as ResultEvent['source']) ?? 'drill',
      difficulty: (raw.difficulty as ResultEvent['difficulty']) ?? undefined,
      correct: !!raw.correct,
      repeat: !!raw.is_repeat,
      hintUsed: !!raw.hint_used,
      selfReported: !!raw.self_reported,
      kind: (raw.kind as 'mcq' | 'open') ?? undefined,
      chosenIndex: raw.chosen_index === null ? undefined : Number(raw.chosen_index),
      optionCount: raw.option_count === null ? undefined : Number(raw.option_count),
    } as ResultEvent);
    eventsOf.set(sid, list);
  }

  const byStudent: Record<string, StudentMistakes> = {};
  for (const s of roster) {
    const events = (eventsOf.get(s.id) ?? []).sort((a, b) => a.ts - b.ts);
    if (events.length === 0) continue;
    const report = buildReport({
      subject: 'math5',
      events,
      mistakes: [],
      history: [],
      healed: {},
      healCount: {},
      now,
    });
    byStudent[s.id] = {
      weaknesses: report.weaknesses.map((w) => ({
        kind: w.kind,
        topic: w.topic,
        subTopicId: w.subTopicId,
        title: w.title,
        detail: w.detail,
        chronic: !!w.chronic,
      })),
    };
  }

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

  const nameOf = new Map(roster.map((r) => [r.id, r.name]));

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
    // ⚠️ WHO has not closed it, not just how many. "3 מתוך 8 סגרו" tells a
    // teacher a task is unfinished; it does not tell her whom to talk to, so
    // she opens eight student cards to find five names. The board already
    // walks every targeted student here, so the names cost nothing.
    //
    // Ordered the way she will act: the ones who never opened it first, then
    // the ones who started and stopped, fewest answers first.
    const notDone: { id: string; name: string; answered: number }[] = [];
    for (const sid of targeted) {
      const p = assignmentProgress(
        countable.filter((c) => c.userId === sid),
        spec
      );
      if (p.answered > 0) started++;
      if (target === null ? p.answered > 0 : p.answered >= target) done++;
      else notDone.push({ id: sid, name: nameOf.get(sid) ?? 'תלמיד', answered: p.answered });
    }
    notDone.sort((a, b) => a.answered - b.answered);

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
      studentIds: targetsOf.get(id) ?? null,
      totalCount: targeted.length,
      started,
      done,
      notDone,
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
    mistakes: {
      byStudent,
      // The same mistake, counted across the class. This is the one that turns
      // thirty private diagnoses into a lesson: "7 תלמידים עושים את אותה
      // טעות" is a thing to teach on Sunday, and it carries the exact ids so
      // the practice goes to those seven and nobody else.
      shared: classMistakes(byStudent, new Map(roster.map((r) => [r.id, r.name]))),
    },
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

/**
 * PATCH — the three things a teacher may change about a class: its name, its
 * level, and whether the door is open. `archived: true` closes joining AND
 * hides the class from students (the join route refuses archived classes; the
 * student's focus policy still reads, so nothing he was asked to do vanishes).
 * Nothing here touches the roster or any answer.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const ctx = await requireClassTeacher(request, id, true);
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('bad request', 400);
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    const name = body.name.trim().slice(0, 40);
    if (!name) return jsonError('צריך שם לכיתה', 400);
    patch.name = name;
  }
  if (body.units !== undefined) {
    const u = Number(body.units);
    if (![3, 4, 5].includes(u)) return jsonError('רמה לא תקינה', 400);
    patch.units = u;
  }
  if (typeof body.archived === 'boolean') patch.archived = body.archived;
  if (Object.keys(patch).length === 0) return jsonError('אין מה לעדכן', 400);

  const { error } = await ctx.db.from('classes').update(patch).eq('id', ctx.classId);
  if (error) {
    console.error('[api/school/classes] patch failed:', error.message);
    return jsonError('לא הצלחנו לשמור', 500);
  }
  return Response.json({ ok: true, ...patch });
}
