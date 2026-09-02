/**
 * class-board.ts — everything a teacher's class screen shows, as ONE pure
 * function over the answer log.
 *
 * No Supabase, no React, no clock of its own. The route fetches rows and calls
 * this; the screen renders what comes back. That split is deliberate: the
 * judgements a teacher acts on — "she is stuck", "he has not been here in nine
 * days", "the class did not understand sequences" — are the part that must be
 * testable without a database, because every one of them is a sentence someone
 * will say to a fifteen-year-old.
 *
 * ---- THE TWO DENOMINATORS, AND WHY THEY DIFFER ----------------------------
 * Every number here is one of two kinds, and mixing them is the bug that makes
 * a teacher stop trusting the screen:
 *
 *   ACTIVITY  — did he show up and do the work. Counts EVERY attempt, replays
 *               included, because re-doing a cleared rung is real work.
 *   MASTERY   — does he know it. Excludes replays (`is_repeat`), exactly as
 *               lib/results.ts `measured()` does for the student's own screens.
 *
 * The rule this file exists to enforce: the teacher's number for a student is
 * the SAME function as the student's own number. Two definitions of "mastery"
 * in one product is the fastest way to lose a teacher, because the first time
 * they disagree in front of a class, the screen is the thing that was wrong.
 *
 * ---- NO FAKE ZERO ---------------------------------------------------------
 * A student with no attempts in a topic has `mastery: null`, never 0. Zero is a
 * measurement — "he tried and got none right" — and it is a different sentence
 * from "he has not started". `null` renders as "אין נתונים"; 0 renders as a red
 * cell. The existing teacher route already keeps this rule for `syncedAt`; here
 * it is applied to every number on the board.
 */

/** One row of `public.attempts`, as the route selects it. */
export type BoardAttempt = {
  user_id: string;
  topic: string;
  sub_topic_id?: string | null;
  correct: boolean;
  is_repeat?: boolean | null;
  hint_used?: boolean | null;
  /** answerDiagnosis, as lib/answer-check wrote it: WHICH wrong answer, not
   *  just that it was wrong. This is what lets a student card say "he flips the
   *  sign" instead of "42%". */
  diagnosis?: { kind?: string; note?: string } | null;
  /** SERVER clock (attempts.created_at). Never the client's `ts` — "has not
   *  been here in nine days" must not be answerable by a device clock. */
  created_at: string;
};

/** One wrong answer, kept for the student card. The teacher opens this before
 *  a conversation, and "he got 42%" is not something you can talk to a student
 *  about — a specific mistake is. */
export type WrongAnswer = {
  topic: string;
  subTopicId: string | null;
  daysAgo: number;
  hintUsed: boolean;
  /** The shape of the error, when lib/answer-check could name it. */
  kind: string | null;
  note: string | null;
};

/** One day of the activity strip. Counted in 24h windows back from `now`
 *  rather than calendar dates ON PURPOSE: a calendar day needs a timezone, the
 *  server runs in UTC, and the student is in Israel — a sparkline is not worth
 *  a class of bug where the last bar is empty until 3am. */
export type DayCell = {
  /** 0 = the last 24 hours. */
  daysAgo: number;
  attempts: number;
  correct: number;
};

export type BoardStudent = { id: string; name: string };

/**
 * One word for the student, with a defined threshold behind it. A teacher
 * should never have to interpret a percentage to know who needs them.
 *
 *   'no-data'  joined, never answered. NOT a zero.
 *   'away'     has not answered in AWAY_DAYS. Says nothing about ability.
 *   'stuck'    enough attempts in some topic, and failing it.
 *   'active'   working, nothing on fire.
 */
export type StudentState = 'no-data' | 'away' | 'stuck' | 'active';

export type TopicMastery = {
  topic: string;
  /** Attempts that COUNT for mastery (replays excluded). */
  measured: number;
  correct: number;
  /** 0..1, or null when `measured` is 0. Never 0 for "never tried". */
  mastery: number | null;
  /** Every attempt, replays included — the activity denominator. */
  attempts: number;
  hintRate: number | null;
};

export type StudentRow = {
  id: string;
  name: string;
  state: StudentState;
  /** ms since epoch of the newest attempt, or null when there are none. */
  lastActiveAt: number | null;
  daysSinceActive: number | null;
  attempts: number;
  measured: number;
  /** Overall mastery, or null. */
  mastery: number | null;
  topics: TopicMastery[];
  /** Topics that tripped the stuck rule, worst first. */
  stuck: TopicMastery[];
  /** The most recent wrong answers, newest first. Capped — a teacher opening a
   *  student before a conversation needs the last few mistakes, not a log. */
  recentWrong: WrongAnswer[];
  /** ACTIVITY_DAYS of 24h buckets, oldest first. Counts every attempt including
   *  replays: this strip answers "did he show up", not "does he know it". */
  daily: DayCell[];
};

/** A line in "דורש התייחסות" — a student, and the reason, already worded. */
export type AttentionRow = {
  studentId: string;
  name: string;
  state: Exclude<StudentState, 'active'>;
  /** The topic the reason is about, when there is one. */
  topic: string | null;
  /** Ready to render. Kept here, not in the component, so the wording is
   *  tested and identical wherever it appears. */
  reason: string;
  /** Higher sorts first. */
  severity: number;
};

/** A line in "מה ללמד שוב" — a topic the CLASS is failing, not a student. */
export type ReteachRow = {
  topic: string;
  /** Mean of the per-student masteries that exist. Students with no data are
   *  excluded from the mean rather than counted as zero. */
  mastery: number;
  /** How many students have enough measured attempts to count. */
  measuredStudents: number;
  belowHalf: number;
  reason: string;
};

export type ClassBoard = {
  studentCount: number;
  /** Answered at least once inside ACTIVE_WINDOW_DAYS. */
  activeThisWeek: number;
  /** Never answered at all. Called out separately because it is an onboarding
   *  problem, not a learning one. */
  neverStarted: number;
  needsAttention: AttentionRow[];
  reteach: ReteachRow[];
  students: StudentRow[];
  /** Column order for the heatmap: the topics this class has actually touched,
   *  busiest first. A class is not shown columns it has never met. */
  topics: string[];
};

// ---- thresholds, in one place ---------------------------------------------
//
// These are the same numbers app/api/teacher/overview already uses, kept here
// so the private-teacher board and the school board cannot drift apart. Fewer
// than three attempts is a bad afternoon, not a weakness.
export const STUCK_MIN_ATTEMPTS = 3;
export const STUCK_MAX_MASTERY = 0.6;
/** No attempt in this many days = 'away'. A school week plus slack, so a
 *  student who works Sunday and again the next Sunday never flickers. */
export const AWAY_DAYS = 7;
/** The "active this week" window. */
export const ACTIVE_WINDOW_DAYS = 7;
/** A topic needs this many students with real data before the class average
 *  means anything — otherwise three weak students condemn a topic for 31. */
export const RETEACH_MIN_STUDENTS = 5;
/** ...and this fraction of the class below half before it is worth a lesson. */
export const RETEACH_MAX_MASTERY = 0.55;
/** The attention list is a list a person can act on, not a report. */
export const ATTENTION_LIMIT = 5;
/** Days in the per-student activity strip. Two school weeks — long enough to
 *  show a habit forming or breaking, short enough to read at a glance. */
export const ACTIVITY_DAYS = 14;
/** Wrong answers kept per student. Enough to spot a repeating mistake, few
 *  enough that the card stays a card. */
export const RECENT_WRONG_LIMIT = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/** Hebrew day count, so "לפני יום 1" never appears. */
function daysAgo(days: number): string {
  if (days <= 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

/**
 * Build the whole board.
 *
 * `now` is a parameter and not `Date.now()` so the day arithmetic is testable
 * and so every number on one screen is computed against ONE instant — a board
 * that read the clock per student could put two students in different days.
 */
export function buildClassBoard(
  roster: BoardStudent[],
  attempts: BoardAttempt[],
  now: number
): ClassBoard {
  const byStudent = new Map<string, BoardAttempt[]>();
  for (const a of attempts) {
    const list = byStudent.get(a.user_id);
    if (list) list.push(a);
    else byStudent.set(a.user_id, [a]);
  }

  // Column order comes from the CLASS's activity, not from the full syllabus:
  // a heatmap padded with topics nobody has opened is mostly empty cells, and
  // an empty cell and a failed cell must not sit next to each other looking
  // equally alarming.
  const topicVolume = new Map<string, number>();
  for (const a of attempts) {
    topicVolume.set(a.topic, (topicVolume.get(a.topic) ?? 0) + 1);
  }
  const topics = [...topicVolume.entries()]
    .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))
    .map(([t]) => t);

  const students: StudentRow[] = roster.map((s) => {
    const mine = byStudent.get(s.id) ?? [];

    let lastActiveAt: number | null = null;
    let measured = 0;
    let correct = 0;
    const perTopic = new Map<
      string,
      { attempts: number; measured: number; correct: number; hints: number }
    >();

    for (const a of mine) {
      const at = Date.parse(a.created_at);
      if (Number.isFinite(at) && (lastActiveAt === null || at > lastActiveAt)) lastActiveAt = at;

      const bucket = perTopic.get(a.topic) ?? { attempts: 0, measured: 0, correct: 0, hints: 0 };
      bucket.attempts++;
      if (a.hint_used) bucket.hints++;
      // Replays are activity, never a measurement — same rule as the student's
      // own screens (lib/results.ts `measured`).
      if (!a.is_repeat) {
        bucket.measured++;
        measured++;
        if (a.correct) {
          bucket.correct++;
          correct++;
        }
      }
      perTopic.set(a.topic, bucket);
    }

    const topicRows: TopicMastery[] = [...perTopic.entries()]
      .map(([topic, t]) => ({
        topic,
        attempts: t.attempts,
        measured: t.measured,
        correct: t.correct,
        mastery: ratio(t.correct, t.measured),
        hintRate: ratio(t.hints, t.attempts),
      }))
      .sort((a, b) => b.attempts - a.attempts);

    const stuck = topicRows
      .filter(
        (t) =>
          t.measured >= STUCK_MIN_ATTEMPTS && t.mastery !== null && t.mastery < STUCK_MAX_MASTERY
      )
      .sort((a, b) => (a.mastery ?? 1) - (b.mastery ?? 1));

    // ---- the student card's two extra views, from the SAME rows ------------
    // Both are derived here rather than in a second query: the attempts are
    // already in hand, and a card that re-fetched would be able to disagree
    // with the row it was opened from.
    const recentWrong: WrongAnswer[] = mine
      .filter((a) => !a.correct)
      .sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at))
      .slice(0, RECENT_WRONG_LIMIT)
      .map((a) => ({
        topic: a.topic,
        subTopicId: a.sub_topic_id ?? null,
        daysAgo: Math.max(0, Math.floor((now - Date.parse(a.created_at)) / DAY_MS)),
        hintUsed: !!a.hint_used,
        kind: a.diagnosis?.kind ?? null,
        note: a.diagnosis?.note ?? null,
      }));

    const daily: DayCell[] = Array.from({ length: ACTIVITY_DAYS }, (_, i) => ({
      daysAgo: ACTIVITY_DAYS - 1 - i,
      attempts: 0,
      correct: 0,
    }));
    for (const a of mine) {
      const at = Date.parse(a.created_at);
      if (!Number.isFinite(at)) continue;
      const bucket = Math.floor((now - at) / DAY_MS);
      if (bucket < 0 || bucket >= ACTIVITY_DAYS) continue;
      const cell = daily[ACTIVITY_DAYS - 1 - bucket];
      cell.attempts++;
      if (a.correct) cell.correct++;
    }

    const daysSinceActive =
      lastActiveAt === null ? null : Math.floor((now - lastActiveAt) / DAY_MS);

    let state: StudentState;
    if (mine.length === 0) state = 'no-data';
    else if (daysSinceActive !== null && daysSinceActive >= AWAY_DAYS) state = 'away';
    else if (stuck.length > 0) state = 'stuck';
    else state = 'active';

    return {
      id: s.id,
      name: s.name,
      state,
      lastActiveAt,
      daysSinceActive,
      attempts: mine.length,
      measured,
      mastery: ratio(correct, measured),
      topics: topicRows,
      stuck,
      recentWrong,
      daily,
    };
  });

  // ---- zone 1: who needs the teacher ---------------------------------------
  //
  // Ordered by how much a person is stuck, not by how bad the percentage looks:
  // a student failing a topic he has attempted eleven times needs the teacher
  // more than one who failed three, even at the same accuracy.
  const attention: AttentionRow[] = [];
  for (const s of students) {
    if (s.state === 'active') continue;

    if (s.state === 'stuck') {
      const worst = s.stuck[0];
      const pct = Math.round((worst.mastery ?? 0) * 100);
      attention.push({
        studentId: s.id,
        name: s.name,
        state: 'stuck',
        topic: worst.topic,
        reason: `${worst.topic} — ${pct}% ב-${worst.measured} תרגילים`,
        severity: 100 + (worst.measured - worst.correct),
      });
    } else if (s.state === 'away') {
      attention.push({
        studentId: s.id,
        name: s.name,
        state: 'away',
        topic: null,
        reason: `${s.daysSinceActive} ימים ללא פעילות · נכנס לאחרונה ${daysAgo(s.daysSinceActive ?? 0)}`,
        severity: 50 + Math.min(s.daysSinceActive ?? 0, 40),
      });
    } else {
      // 'no-data' — deliberately the LOWEST severity and deliberately still on
      // the list. It is an onboarding problem, not a learning one, and the
      // wording has to say so: a teacher who reads this as "did nothing" walks
      // into the wrong conversation.
      attention.push({
        studentId: s.id,
        name: s.name,
        state: 'no-data',
        topic: null,
        reason: 'הצטרף לכיתה, טרם התחיל — אין נתונים, לא אפס',
        severity: 10,
      });
    }
  }
  attention.sort((a, b) => b.severity - a.severity || (a.name < b.name ? -1 : 1));

  // ---- zone 2: what to teach again -----------------------------------------
  //
  // A per-STUDENT mean, not a pooled ratio over raw attempts. Pooling would let
  // one student who answered 200 questions decide the class average for 31
  // people. Students with no data in the topic are excluded from the mean
  // rather than counted as zero — that is the no-fake-zero rule at class level.
  const reteach: ReteachRow[] = [];
  for (const topic of topics) {
    const masteries: number[] = [];
    for (const s of students) {
      const t = s.topics.find((x) => x.topic === topic);
      if (t && t.measured >= STUCK_MIN_ATTEMPTS && t.mastery !== null) masteries.push(t.mastery);
    }
    if (masteries.length < RETEACH_MIN_STUDENTS) continue;

    const mean = masteries.reduce((a, b) => a + b, 0) / masteries.length;
    if (mean > RETEACH_MAX_MASTERY) continue;

    const belowHalf = masteries.filter((m) => m < 0.5).length;
    reteach.push({
      topic,
      mastery: mean,
      measuredStudents: masteries.length,
      belowHalf,
      reason: `${belowHalf} מתוך ${masteries.length} מתחת ל-50% — זה שיעור, לא תלמיד`,
    });
  }
  reteach.sort((a, b) => a.mastery - b.mastery);

  const activeThisWeek = students.filter(
    (s) => s.daysSinceActive !== null && s.daysSinceActive < ACTIVE_WINDOW_DAYS
  ).length;

  return {
    studentCount: roster.length,
    activeThisWeek,
    neverStarted: students.filter((s) => s.state === 'no-data').length,
    needsAttention: attention.slice(0, ATTENTION_LIMIT),
    reteach,
    students,
    topics,
  };
}
