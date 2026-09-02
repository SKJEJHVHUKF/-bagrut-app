/**
 * attempt-row.ts — turn a posted answer event into a row for `public.attempts`.
 *
 * Pure on purpose: no Supabase, no Request, no clock of its own. This is the
 * trust boundary (the body arrives from a browser) AND the field mapping
 * between ResultEvent and the table, which is precisely the pair of things
 * worth being able to test without a database.
 *
 * The route owns WHO (the user id comes from the session, never the body) and
 * this file owns WHAT.
 *
 * ⚠️ `source` is validated against a literal list rather than imported as
 * `ResultSource`. Two branches of this repo disagree about that union (one adds
 * 'scan' and 'thinking'), and a type import would make this file compile on one
 * and fail on the other for no benefit — the check that matters is the runtime
 * one, which is right here. Keep the list in step with lib/results.ts.
 */

const SOURCES = ['quiz', 'drill', 'bagrut', 'review', 'fix', 'scan', 'thinking'] as const;
const DIFFICULTIES = ['easy', 'mid', 'hard'] as const;
const KINDS = ['mcq', 'open'] as const;

/** Field caps. Generous next to real content, small enough that a scripted
 *  client cannot post a megabyte of topic name. */
const MAX_SUBJECT = 40;
const MAX_TOPIC = 160;
const MAX_ID = 160;
/** Serialised size of `answerDiagnosis`. Over this it is dropped, not rejected:
 *  a fat diagnosis is worth less than the attempt it hangs off. */
const MAX_DIAGNOSIS_CHARS = 2000;

/** Bounds on the client's own timestamp. A device clock can be wrong by years,
 *  and `ts` also carries the dedupe key — so an absurd value is replaced by the
 *  server's clock rather than trusted or rejected. `created_at` is unaffected
 *  either way: the database stamps it. */
const TS_FLOOR = Date.UTC(2020, 0, 1);
const TS_CEILING_SKEW_MS = 60 * 60 * 1000;

export type AttemptRow = {
  user_id: string;
  ts: number;
  subject: string;
  topic: string;
  sub_topic_id: string | null;
  question_id: string | null;
  source: string;
  difficulty: string | null;
  correct: boolean;
  is_repeat: boolean;
  hint_used: boolean;
  self_reported: boolean | null;
  kind: string | null;
  chosen_index: number | null;
  option_count: number | null;
  diagnosis: unknown | null;
};

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function smallInt(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1000 ? v : null;
}

/**
 * Build the row, or null when the payload is not a usable attempt.
 *
 * Null means "reject with 400" and covers only the three fields a row is
 * meaningless without: topic, source and correct. Everything else degrades to
 * null — an event written by an older client that never learned about
 * `answerDiagnosis` is still a real answer, and dropping it because a field it
 * predates is missing would put a hole in the teacher's history for exactly the
 * students on the oldest devices.
 */
export function attemptRow(input: unknown, userId: string, now: number): AttemptRow | null {
  if (!input || typeof input !== 'object') return null;
  const e = input as Record<string, unknown>;

  const topic = str(e.topic, MAX_TOPIC);
  const source = oneOf(e.source, SOURCES);
  if (!topic || !source || typeof e.correct !== 'boolean') return null;

  const rawTs = e.ts;
  const ts =
    typeof rawTs === 'number' &&
    Number.isFinite(rawTs) &&
    rawTs >= TS_FLOOR &&
    rawTs <= now + TS_CEILING_SKEW_MS
      ? Math.round(rawTs)
      : now;

  let diagnosis: unknown = null;
  if (e.answerDiagnosis && typeof e.answerDiagnosis === 'object') {
    try {
      if (JSON.stringify(e.answerDiagnosis).length <= MAX_DIAGNOSIS_CHARS) {
        diagnosis = e.answerDiagnosis;
      }
    } catch {
      // Circular or otherwise unserialisable — drop it, keep the attempt.
    }
  }

  return {
    user_id: userId,
    ts,
    // 'math5' and not 'math': that is the subject key the content and every
    // practice route actually use (content/lessons allLessonKeys). The default
    // only fires for a body that omitted it, and a default nothing else in the
    // app agrees with would make those rows silently unmatchable.
    subject: str(e.subject, MAX_SUBJECT) ?? 'math5',
    topic,
    sub_topic_id: str(e.subTopicId, MAX_ID),
    question_id: str(e.questionId, MAX_ID),
    source,
    difficulty: oneOf(e.difficulty, DIFFICULTIES),
    correct: e.correct,
    is_repeat: e.repeat === true,
    hint_used: e.hintUsed === true,
    self_reported: typeof e.selfReported === 'boolean' ? e.selfReported : null,
    kind: oneOf(e.kind, KINDS),
    chosen_index: smallInt(e.chosenIndex),
    option_count: smallInt(e.optionCount),
    diagnosis,
  };
}
