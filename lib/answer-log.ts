/**
 * answer-log.ts — one student's answers, from the two places they live.
 *
 * `public.attempts` is the durable log: one append-only row per answer, written
 * server-side, never truncated, server-stamped. It is the source of record from
 * the day that writer shipped.
 *
 * `learning_state.results` is the older JSONB blob the student's browser syncs.
 * lib/results.ts caps it at MAX_EVENTS = 1000 and truncates from the FRONT, so
 * a busy student's oldest answers fall off it — silently, with no marker
 * anywhere that anything was dropped.
 *
 * Neither is complete on its own: the durable log holds nothing from before it
 * shipped, and the blob holds nothing after it truncates. So both are read and
 * merged here, and this is the function that decides how.
 *
 * ⚠️ THE DUPLICATE IS THE WHOLE PROBLEM. Once the writer shipped, every new
 * answer exists in BOTH — the browser still syncs its blob. Counted twice, a
 * student's "answered" doubles and his accuracy stays put, which is exactly the
 * kind of wrong number that looks plausible enough to act on.
 */

/** The shape both sources are read into. Every field optional: these rows were
 *  written by clients of many ages, and a JSONB column deserves a defensive
 *  read. */
export type AnswerRow = {
  ts?: number;
  topic?: string;
  subTopicId?: string;
  questionId?: string;
  source?: string;
  difficulty?: string;
  correct?: boolean;
  repeat?: boolean;
  hintUsed?: boolean;
  selfReported?: boolean;
  subject?: string;
  answerDiagnosis?: { kind?: string; note?: string };
};

/**
 * The identity of one answer, in both spellings.
 *
 * `ts` is the client's millisecond stamp and the durable row keeps it for
 * exactly this purpose — lining a row up with the same event in the local log.
 * The question id disambiguates two answers inside the same millisecond, which
 * a fast retry can produce.
 */
function identity(r: AnswerRow): string {
  return `${r.ts ?? 0}:${r.questionId ?? ''}`;
}

/**
 * Merge the durable log with the synced blob, oldest first.
 *
 * The durable row WINS on a collision: it is server-written and cannot be
 * edited from a browser, while the blob is localStorage that the student's own
 * device could have mangled. The blob then contributes only what the durable
 * log has never seen — which today is nearly everything, and in six months
 * will be nothing.
 */
export function mergeAnswerLog(durable: AnswerRow[], synced: AnswerRow[]): AnswerRow[] {
  const seen = new Set(durable.map(identity));
  const merged = [...durable, ...synced.filter((r) => !seen.has(identity(r)))];
  return merged.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
}
