// Client-side answer-result log, persisted to localStorage.
//
// Every answered question — in the quick quiz, in sub-topic drills, and in
// the future in bagrut parts — records one event here. The insights page
// ("התמונה שלי") aggregates these events into per-topic and per-sub-topic
// accuracy, which powers the weakness detection and the reinforcement
// practice suggestions.
//
// Kept in localStorage (like lib/progress.ts) so it works without login and
// costs nothing. If we later want cross-device sync, the same events can be
// mirrored to a Supabase table without changing the callers.

// lib/review.ts is a pure localStorage store with no runtime imports of its
// own — safe to pull in from here, which almost every page imports.
import type { AnswerDiagnosis } from '@/lib/answer-check';
import { seedFromMiss, gradeReview } from '@/lib/review';
import { safeSetJSON } from '@/lib/storage';

const STORAGE_KEY = 'bagrut-results-v1';
// Companion set of already-counted `${source}:${questionId}` keys. The insights
// page and the grade prediction must count only the FIRST answer to each
// question — replaying a cleared rung is learning, not a new measurement — so
// once a (source, questionId) pair is logged, later attempts are ignored.
const SEEN_KEY = 'bagrut-results-seen-v1';
/** Exported so lib/sync applies the SAME cap when it merges two devices' logs —
 *  a sync that kept more than the local store does would be silently undone by
 *  the next local write. */
export const MAX_EVENTS = 1000;
const MAX_SEEN = 5000;

/**
 * `'fix'` = an answer inside a lib/remediation repair path. It is deliberately
 * never a MEASUREMENT — see the `repeat` handling in `recordResult`.
 */
export type ResultSource = 'quiz' | 'drill' | 'bagrut' | 'review' | 'fix';

export type ResultEvent = {
  ts: number;
  subject: string;
  topic: string;
  /** Present when the question belongs to a specific sub-topic module. */
  subTopicId?: string;
  /** Static bank id (e.g. "alg-003"). Absent for AI-generated questions. */
  questionId?: string;
  source: ResultSource;
  difficulty?: 'easy' | 'mid' | 'hard';
  correct: boolean;
  /** True when this (source, questionId) was already answered before — a replay.
   *  Replays still count as ACTIVITY (streak, daily goal, 14-day chart) but are
   *  excluded from ACCURACY (per-topic stats → grade prediction), so raising
   *  stars by re-doing a rung can't inflate the predicted grade. */
  repeat?: boolean;

  // ---- Diagnostic fields (lib/cognition) ----
  // All optional and ignored by every aggregation above: an event written
  // before these existed still reads correctly, and nothing here can change a
  // grade prediction. They exist because `correct: false` alone throws away the
  // most informative thing the student did — WHICH wrong answer they picked.
  // Every MCQ distractor in the bank ships an authored note explaining the
  // exact misconception that produces it, so the chosen index turns a click
  // into a labelled observation. See content/cognition.

  /** MCQ or open — lets the tracer pick the right guess parameter. */
  kind?: 'mcq' | 'open';
  /** MCQ only: the index into the ORIGINAL `answers` array — never the shuffled
   *  display position. Callers that shuffle must map back before recording. */
  chosenIndex?: number;
  /** MCQ only: how many options were on offer (guess = 1/optionCount). */
  optionCount?: number;
  /** The hint was revealed before this (counted) attempt. */
  hintUsed?: boolean;
  /** Open questions only. `false` = graded deterministically by
   *  lib/answer-check against an `expected` spec; `true` = the student marked
   *  their own paper. Absent = unknown (events written before this existed).
   *  The gap matters: "I solved it right" is much weaker evidence than a
   *  machine-checked answer, and the tracer prices them differently. */
  selfReported?: boolean;
  /**
   * Open questions only: the SHAPE of the wrong answer, as `lib/answer-check`
   * read it — a sign flip, a conjugate, roots the domain should have rejected,
   * two right values in swapped boxes, or a match against an authored
   * predictable mistake.
   *
   * This is the open-question twin of `chosenIndex`, and it exists for the same
   * reason: `correct: false` throws away the most informative thing the student
   * did. It is computed with no API call and no self-reporting, which is what
   * makes `lib/patterns` able to say "this mistake keeps coming back" without
   * ever asking the student to classify their own error — the error notebook's
   * `category` can only be filled by an API call, so it is silent for most
   * students and cannot carry that claim.
   *
   * Optional and ignored by every aggregation: events written before this
   * existed still read correctly, and nothing here can change a grade
   * prediction.
   */
  answerDiagnosis?: AnswerDiagnosis;
};

export type Stats = {
  attempts: number;
  correct: number;
  /** 0..1 */
  accuracy: number;
};

export type SubTopicStat = Stats & {
  subject: string;
  topic: string;
  subTopicId: string;
  lastTs: number;
};

export type TopicStat = Stats & {
  subject: string;
  topic: string;
  lastTs: number;
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): ResultEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ResultEvent[]) : [];
  } catch {
    return [];
  }
}

function writeAll(events: ResultEvent[]) {
  if (!isBrowser()) return;
  if (!safeSetJSON(STORAGE_KEY, events)) return;
  // Tell the sync layer (if mounted) there is something to push, exactly as
  // roadmap-progress does. Without this an answered question would only ever
  // reach the server on the next unrelated write. Only on a write that landed:
  // a dirty flag raised over a dropped write pushes the old log up as current.
  window.dispatchEvent(new Event('bagrut-state-dirty'));
}

function readSeen(): Set<string> {
  if (!isBrowser()) return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  if (!isBrowser()) return;
  // Keep only the most-recent keys if the set grows huge.
  const arr = [...seen];
  const trimmed = arr.length > MAX_SEEN ? arr.slice(arr.length - MAX_SEEN) : arr;
  safeSetJSON(SEEN_KEY, trimmed);
}

/** Record a single answered question. Fire-and-forget.
 *  The event is always logged (so activity/streak counts every answer), but a
 *  replay of the same `${source}:${questionId}` is flagged `repeat: true` so the
 *  accuracy aggregations (and thus the grade prediction) count only the first
 *  answer. Questions with no stable id (AI-generated) never repeat. */
export function recordResult(event: Omit<ResultEvent, 'ts'>) {
  // A repair-path answer is ALWAYS a replay, whatever the question is.
  //
  // A fix path deliberately re-serves material around a weakness the student
  // just failed, immediately after showing them the worked solution. Letting
  // those answers into the accuracy aggregations would mean "practise your
  // mistakes" reliably raises the predicted grade on /insights — a metric the
  // student can game by doing the thing that helps least, and one that would
  // stop reflecting exam readiness. They still count as ACTIVITY (streak, daily
  // goal, the 14-day chart) because the student really did the work, and
  // lib/cognition still reads them as weaker-but-real evidence via `isReplay`.
  // Whether the repair worked is judged by lib/remediation's own store.
  let repeat = event.source === 'fix';
  if (!repeat && event.questionId) {
    const key = `${event.source}:${event.questionId}`;
    const seen = readSeen();
    if (seen.has(key)) {
      repeat = true;
    } else {
      seen.add(key);
      writeSeen(seen);
    }
  }
  const events = readAll();
  events.push({ ...event, ts: Date.now(), ...(repeat ? { repeat: true } : {}) });
  // Cap the log so localStorage never bloats — oldest events fall off.
  writeAll(events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events);

  // Spaced repetition, wired HERE and not at the call sites.
  //
  // lib/review.ts documents "every wrong first attempt anywhere drops the
  // question into box 1". It was true of exactly one of the five surfaces that
  // record results: /quiz, the bagrut rung, ThinkingPractice and SolutionAudit
  // all recorded the miss and dropped it, so a student who failed eight quiz
  // questions and pressed "התחל חזרה על הטעויות שלי" was told there was nothing
  // to review. Every future surface gets the loop for free by calling
  // recordResult, which it must do anyway.
  if (event.source === 'review') {
    if (event.questionId) gradeReview(event.questionId, event.correct);
  } else if (!event.correct) {
    seedFromMiss(event);
  }
}

/** First-attempt events only — the measurement subset (excludes replays). */
function measured(events: ResultEvent[]): ResultEvent[] {
  return events.filter((e) => !e.repeat);
}

/** All events, optionally filtered to one subject. Newest last. */
export function getResults(subject?: string): ResultEvent[] {
  const events = readAll();
  return subject ? events.filter((e) => e.subject === subject) : events;
}

/** Subjects that have at least one recorded event. */
export function subjectsWithResults(): string[] {
  const seen = new Set<string>();
  for (const e of readAll()) seen.add(e.subject);
  return [...seen];
}

export function totalStats(subject?: string): Stats & { lastTs: number } {
  const events = measured(getResults(subject));
  const correct = events.filter((e) => e.correct).length;
  return {
    attempts: events.length,
    correct,
    accuracy: events.length > 0 ? correct / events.length : 0,
    lastTs: events.length > 0 ? events[events.length - 1].ts : 0,
  };
}

/** Per-topic accuracy for a subject, sorted weakest-first. */
export function topicStats(subject: string): TopicStat[] {
  const map = new Map<string, TopicStat>();
  for (const e of measured(getResults(subject))) {
    const cur = map.get(e.topic) ?? {
      subject,
      topic: e.topic,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      lastTs: 0,
    };
    cur.attempts += 1;
    if (e.correct) cur.correct += 1;
    cur.lastTs = Math.max(cur.lastTs, e.ts);
    map.set(e.topic, cur);
  }
  const list = [...map.values()];
  for (const s of list) s.accuracy = s.attempts > 0 ? s.correct / s.attempts : 0;
  list.sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
  return list;
}

/** Per-sub-topic accuracy for a subject, sorted weakest-first. */
export function subTopicStats(subject: string): SubTopicStat[] {
  const map = new Map<string, SubTopicStat>();
  for (const e of measured(getResults(subject))) {
    if (!e.subTopicId) continue;
    const key = `${e.topic}|${e.subTopicId}`;
    const cur = map.get(key) ?? {
      subject,
      topic: e.topic,
      subTopicId: e.subTopicId,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      lastTs: 0,
    };
    cur.attempts += 1;
    if (e.correct) cur.correct += 1;
    cur.lastTs = Math.max(cur.lastTs, e.ts);
    map.set(key, cur);
  }
  const list = [...map.values()];
  for (const s of list) s.accuracy = s.attempts > 0 ? s.correct / s.attempts : 0;
  list.sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
  return list;
}

/**
 * The sub-topics the student most needs to reinforce: lowest accuracy first,
 * only counting sub-topics with enough attempts to mean something.
 */
export function weakestSubTopics(
  subject: string,
  { minAttempts = 3, limit = 4, maxAccuracy = 0.85 } = {}
): SubTopicStat[] {
  return subTopicStats(subject)
    .filter((s) => s.attempts >= minAttempts && s.accuracy <= maxAccuracy)
    .slice(0, limit);
}

/** Topic-level fallback when there isn't enough sub-topic data yet. */
export function weakestTopics(
  subject: string,
  { minAttempts = 3, limit = 4, maxAccuracy = 0.85 } = {}
): TopicStat[] {
  return topicStats(subject)
    .filter((s) => s.attempts >= minAttempts && s.accuracy <= maxAccuracy)
    .slice(0, limit);
}

// ============================================================
// Daily activity, streak & goal — the habit layer.
// ============================================================

/** Local-date key (NOT UTC — a study day is the student's calendar day). */
function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type DayActivity = { date: string; attempts: number; correct: number };

/** Per-day activity, oldest first. Optionally scoped to one subject. */
export function dailyActivity(subject?: string): DayActivity[] {
  const map = new Map<string, DayActivity>();
  for (const e of getResults(subject)) {
    const k = dateKey(e.ts);
    const cur = map.get(k) ?? { date: k, attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (e.correct) cur.correct += 1;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Attempts answered today (local time). */
export function todayCount(subject?: string): number {
  const k = dateKey(Date.now());
  return dailyActivity(subject).find((d) => d.date === k)?.attempts ?? 0;
}

/**
 * Consecutive study days ending today or yesterday (a streak survives until
 * a full calendar day is missed). 0 when there's no recent activity.
 */
export function currentStreak(subject?: string): number {
  const days = new Set(dailyActivity(subject).map((d) => d.date));
  if (days.size === 0) return 0;
  const DAY = 24 * 60 * 60 * 1000;
  let cursor = Date.now();
  // The streak may start today or (if nothing yet today) yesterday.
  if (!days.has(dateKey(cursor))) {
    cursor -= DAY;
    if (!days.has(dateKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

/** The last N days as a fixed-length series (missing days = 0 attempts). */
export function lastNDays(n: number, subject?: string): DayActivity[] {
  const byDate = new Map(dailyActivity(subject).map((d) => [d.date, d]));
  const DAY = 24 * 60 * 60 * 1000;
  const out: DayActivity[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = dateKey(Date.now() - i * DAY);
    out.push(byDate.get(k) ?? { date: k, attempts: 0, correct: 0 });
  }
  return out;
}

/** Answers in each window before the comparison means anything. */
export const MIN_PER_WEEK_WINDOW = 10;

export type WeeklyDelta = {
  thisWeek: Stats;
  lastWeek: Stats;
  /** Percentage POINTS, this week minus last. Only read it when `enough`. */
  deltaPoints: number;
  /** Both windows cleared MIN_PER_WEEK_WINDOW. */
  enough: boolean;
};

/**
 * Accuracy over the last 7 days vs the 7 before them.
 *
 * Gated on volume in BOTH windows on purpose: with four answers a week, one
 * lucky question swings "accuracy" by 25 points and the app would report a
 * dramatic improvement that is pure noise. When `enough` is false the UI must
 * say there is not enough data — not print a number.
 *
 * Replays are excluded, like every other accuracy figure here, so a repair
 * session cannot manufacture a week-on-week gain.
 */
export function weeklyDelta(subject?: string, now: number = Date.now()): WeeklyDelta {
  const DAY = 24 * 60 * 60 * 1000;
  const events = measured(getResults(subject));
  const window = (fromDaysAgo: number, toDaysAgo: number): Stats => {
    const from = now - fromDaysAgo * DAY;
    const to = now - toDaysAgo * DAY;
    const inWindow = events.filter((e) => e.ts >= from && e.ts < to);
    const correct = inWindow.filter((e) => e.correct).length;
    return {
      attempts: inWindow.length,
      correct,
      accuracy: inWindow.length > 0 ? correct / inWindow.length : 0,
    };
  };
  const thisWeek = window(7, 0);
  const lastWeek = window(14, 7);
  return {
    thisWeek,
    lastWeek,
    deltaPoints: Math.round((thisWeek.accuracy - lastWeek.accuracy) * 100),
    enough:
      thisWeek.attempts >= MIN_PER_WEEK_WINDOW && lastWeek.attempts >= MIN_PER_WEEK_WINDOW,
  };
}

// ---- Daily goal (questions per day) ----

const GOAL_KEY = 'bagrut-goal-v1';
export const DEFAULT_DAILY_GOAL = 10;

export function getDailyGoal(): number {
  if (!isBrowser()) return DEFAULT_DAILY_GOAL;
  const raw = window.localStorage.getItem(GOAL_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 200 ? n : DEFAULT_DAILY_GOAL;
}

export function setDailyGoal(n: number) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(GOAL_KEY, String(Math.max(1, Math.min(200, Math.round(n)))));
  } catch {
    // storage disabled — ignore
  }
}
