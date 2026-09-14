/**
 * parent-report.ts — the weekly parent page, as ONE pure function over the
 * answer log.
 *
 * No Supabase, no React, no clock of its own. It does not count anything
 * either: each week is run through lib/class-board's `buildClassBoard` as a
 * class of one, so "mastery", "stuck" and "a day of practice" mean on the
 * parent's page exactly what they mean on the teacher's board. A second
 * definition would be the first thing a parent and a teacher disagree about.
 *
 * Weeks are 7×24h windows back from `now`, not calendar weeks — same reason
 * the board's activity strip is: a calendar needs a timezone.
 */

import {
  buildClassBoard,
  STRONG_MIN_MASTERY,
  STUCK_MIN_ATTEMPTS,
  type BoardAttempt,
  type TopicMastery,
} from '@/lib/class-board';

const DAY = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY;
/** |Δ mastery| a topic must move between the two weeks to be called a change.
 *  Mirrors the class board's week-over-week trend gate (plan B2, |Δ| ≥ 0.10),
 *  which lib/class-board.ts does not export on main yet. */
const CHANGE_MIN = 0.1;
/** Named mistakes shown under "על מה כדאי לעבוד". A list a parent can talk
 *  about, not a log. */
const NOTE_LIMIT = 3;
/** "יותר / פחות תרגול" only past a quarter more or less than last week — 21
 *  answers against 20 is the same week, and telling a parent otherwise is noise. */
const PRACTICE_RATIO = 1.25;

/** The class route's attempt columns (app/api/school/classes/[id]/route.ts),
 *  copied so the parent page reads the same rows the board does. */
export const ATTEMPT_COLUMNS =
  'user_id, topic, sub_topic_id, correct, is_repeat, hint_used, diagnosis, created_at, ' +
  'ts, question_id, source, difficulty, kind, chosen_index, option_count, self_reported';

/** One `public.attempts` row → BoardAttempt. Same mapping as the class route. */
export function toBoardAttempt(a: Record<string, unknown>): BoardAttempt {
  return {
    user_id: String(a.user_id),
    topic: String(a.topic ?? ''),
    sub_topic_id: (a.sub_topic_id as string) ?? null,
    correct: !!a.correct,
    is_repeat: !!a.is_repeat,
    hint_used: !!a.hint_used,
    diagnosis: (a.diagnosis as { kind?: string; note?: string }) ?? null,
    created_at: String(a.created_at),
  };
}

export type ParentWeek = {
  name: string;
  /** The one instant every number was computed against; the page prints the
   *  week ending here. */
  now: number;
  /** 24h windows this week with at least one answer. */
  activeDays: number;
  /** Every answer this week, replays included — the activity count. */
  answered: number;
  /** Topics measured enough this week and at or above STRONG_MIN_MASTERY. */
  strong: string[];
  /** This week's stuck topics (worst first, with their newest named mistake),
   *  then any other named mistakes, NOTE_LIMIT notes at most. */
  workOn: { topic: string; note?: string }[];
  /** Topics measured enough in BOTH weeks whose mastery moved by CHANGE_MIN. */
  changes: { topic: string; direction: 'up' | 'down' }[];
  /** null when last week had no answers — a first week is not "more". */
  practiceChange: 'more' | 'less' | 'same' | null;
  /** Nothing answered in either week. */
  empty: boolean;
};

const ME = 'student';

export function buildParentWeek({
  name,
  attempts,
  now,
}: {
  name: string;
  attempts: BoardAttempt[];
  now: number;
}): ParentWeek {
  const weekEnding = (end: number) =>
    buildClassBoard(
      [{ id: ME, name }],
      attempts
        .filter((a) => {
          const t = Date.parse(a.created_at);
          return t > end - WEEK_MS && t <= end;
        })
        .map((a) => ({ ...a, user_id: ME })),
      end
    ).students[0];

  const cur = weekEnding(now);
  const prev = weekEnding(now - WEEK_MS);

  const measured = (t: TopicMastery | undefined): t is TopicMastery & { mastery: number } =>
    !!t && t.measured >= STUCK_MIN_ATTEMPTS && t.mastery !== null;

  const notes: { topic: string; note: string }[] = [];
  for (const w of cur.recentWrong) {
    if (notes.length === NOTE_LIMIT) break;
    if (w.note && !notes.some((n) => n.note === w.note)) notes.push({ topic: w.topic, note: w.note });
  }
  const workOn: ParentWeek['workOn'] = cur.stuck.map((t) => {
    const note = notes.find((n) => n.topic === t.topic)?.note;
    return note ? { topic: t.topic, note } : { topic: t.topic };
  });
  for (const n of notes) if (!workOn.some((w) => w.note === n.note)) workOn.push(n);

  const changes: ParentWeek['changes'] = [];
  for (const t of cur.topics) {
    const p = prev.topics.find((x) => x.topic === t.topic);
    if (!measured(t) || !measured(p)) continue;
    const delta = t.mastery - p.mastery;
    // The epsilon keeps 7/10 against 6/10 (0.0999…98 in floating point) a change.
    if (Math.abs(delta) + 1e-9 >= CHANGE_MIN) changes.push({ topic: t.topic, direction: delta > 0 ? 'up' : 'down' });
  }

  return {
    name,
    now,
    activeDays: cur.daily.filter((d) => d.attempts > 0).length,
    answered: cur.attempts,
    strong: cur.topics.filter((t) => measured(t) && t.mastery >= STRONG_MIN_MASTERY).map((t) => t.topic),
    workOn,
    changes,
    practiceChange:
      prev.attempts === 0
        ? null
        : cur.attempts >= prev.attempts * PRACTICE_RATIO
          ? 'more'
          : cur.attempts * PRACTICE_RATIO <= prev.attempts
            ? 'less'
            : 'same',
    empty: cur.attempts === 0 && prev.attempts === 0,
  };
}

/** The page's first sentence. Here and not in the component so its wording —
 *  including "no practice this week" — is tested. */
export function weekSentence(w: Pick<ParentWeek, 'activeDays' | 'answered'>): string {
  if (w.answered === 0) return 'השבוע לא היה תרגול';
  const days = w.activeDays === 1 ? 'יום תרגול אחד' : `${w.activeDays} ימי תרגול`;
  const answered = w.answered === 1 ? 'תרגיל אחד' : `${w.answered} תרגילים`;
  return `השבוע: ${days}, ${answered}`;
}
