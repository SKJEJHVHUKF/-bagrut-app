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

const STORAGE_KEY = 'bagrut-results-v1';
const MAX_EVENTS = 1000;

export type ResultSource = 'quiz' | 'drill' | 'bagrut';

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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // quota exceeded or storage disabled — silently ignore
  }
}

/** Record a single answered question. Fire-and-forget. */
export function recordResult(event: Omit<ResultEvent, 'ts'>) {
  const events = readAll();
  events.push({ ...event, ts: Date.now() });
  // Cap the log so localStorage never bloats — oldest events fall off.
  writeAll(events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events);
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
  const events = getResults(subject);
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
  for (const e of getResults(subject)) {
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
  for (const e of getResults(subject)) {
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
