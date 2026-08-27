/**
 * report.ts — everything `/report` shows, assembled once, as a pure function.
 *
 * PURE: the answer log, the repair history and the clock come in as arguments.
 * That is deliberate and it is the only reason this is testable — a report is
 * exactly the kind of screen where a wrong number is invisible in review and
 * corrosive in use, because the student has no way to check it.
 *
 * ============================================================
 * THE STANDARD EVERY NUMBER HERE HAS TO MEET
 * ============================================================
 * A report is a set of CLAIMS about a person. Three rules follow, and the code
 * below is mostly them:
 *
 *   1 · Every number has a stated denominator. "34% of your labelled mistakes"
 *       is a claim; "34%" is a decoration.
 *   2 · Below the evidence floor, say "still measuring" — never zero, and never
 *       a confident nothing. A student who sees "0 patterns" reads "I'm fine",
 *       and a student who sees a weakness invented from two answers stops
 *       trusting the whole screen.
 *   3 · A repair is reported as WORKING only against evidence gathered after
 *       it. Anything else re-litigates mistakes the student already fixed.
 */

import type { ProfileResult } from '@/lib/patterns';
import { taggedMisses } from '@/lib/patterns/observe';
import { buildProfile } from '@/lib/patterns/profile';
import { detectWeaknesses } from '@/lib/remediation/detect';
import type { Weakness } from '@/lib/remediation/types';
import { getHealCountMap, getHealedMap, healedHistory } from '@/lib/remediation/store';
import type { HealedRecord } from '@/lib/remediation/types';
import { getMistakes, type MistakeRecord } from '@/lib/mistakes';
import { getResults, type ResultEvent } from '@/lib/results';

const DAY = 24 * 60 * 60 * 1000;

/** Answers since a repair before its outcome can be called either way. */
export const REPAIR_VERDICT_MIN_ATTEMPTS = 3;
/** Weeks of activity the trend chart covers. */
export const TREND_WEEKS = 8;

export type RepairStatus =
  /** Practised since the repair, and getting them right. */
  | 'held'
  /** Practised since the repair, and failing again. */
  | 'relapsed'
  /** Not practised enough since the repair to say anything. */
  | 'untested';

export type RepairOutcome = {
  targetId: string;
  title: string;
  topic: string;
  healedAt: number;
  /** How many times this weakness has been repaired. 2+ means it came back. */
  repairs: number;
  /** Questions answered in the session that closed it. */
  answeredInRepair: number;
  /** Evidence gathered SINCE the repair — the only evidence that can judge it. */
  since: { attempts: number; correct: number };
  status: RepairStatus;
};

export type WeekPoint = {
  /** Start of the week, as a timestamp. */
  ts: number;
  answered: number;
  correct: number;
  /** null when nothing was answered — a gap, not a zero. */
  accuracy: number | null;
};

export type TopicMovement = {
  topic: string;
  recent: { attempts: number; accuracy: number } | null;
  prior: { attempts: number; accuracy: number } | null;
  /** recent minus prior, in accuracy points. null when either side is too thin. */
  delta: number | null;
};

export type ReportData = {
  now: number;
  /** Cross-topic recurring mistakes, and the ones still confined to one place. */
  profile: ProfileResult;
  /** Live weaknesses, chronic first. Already ranked by the detector. */
  weaknesses: Weakness[];
  /** Weaknesses that came back after being repaired. A subset of `weaknesses`. */
  chronic: Weakness[];
  /** Every repair the student has made, newest first, with its outcome. */
  repairs: RepairOutcome[];
  /** Weekly activity, oldest first. Gaps are null, not zero. */
  weeks: WeekPoint[];
  /** Per-topic accuracy movement between the last fortnight and the one before. */
  movement: TopicMovement[];
  /** Total non-replay answers on record. The denominator behind the whole page. */
  totalAnswered: number;
  /**
   * True when there is not yet enough of anything to report. The page shows an
   * honest "still measuring" state rather than a grid of zeros.
   */
  earlyDays: boolean;
};

export type ReportInput = {
  subject: string;
  events: readonly ResultEvent[];
  mistakes: readonly MistakeRecord[];
  history: readonly HealedRecord[];
  healed: Record<string, number>;
  healCount: Record<string, number>;
  now: number;
};

/** Answers in `subTopicId` strictly after `since`, replays excluded. */
function statsSince(
  events: readonly ResultEvent[],
  subject: string,
  subTopicId: string | undefined,
  since: number,
): { attempts: number; correct: number } {
  let attempts = 0;
  let correct = 0;
  for (const e of events) {
    if (e.subject !== subject || e.repeat || e.ts <= since) continue;
    if (subTopicId && e.subTopicId !== subTopicId) continue;
    attempts += 1;
    if (e.correct) correct += 1;
  }
  return { attempts, correct };
}

/**
 * A repair target id encodes where the repair happened: `st:<subTopicId>` for a
 * sub-topic, `mc:<misconceptionId>` for a named misconception. Only the first
 * form names a place the answer log can be filtered by; for the second the
 * outcome is judged over the topic, which is looser but still post-repair.
 */
function subTopicOf(targetId: string): string | undefined {
  return targetId.startsWith('st:') ? targetId.slice(3) : undefined;
}

function repairOutcomes(input: ReportInput): RepairOutcome[] {
  return input.history
    .filter((h) => h.subject === input.subject)
    .map((h) => {
      const since = statsSince(input.events, input.subject, subTopicOf(h.targetId), h.healedAt);
      const status: RepairStatus =
        since.attempts < REPAIR_VERDICT_MIN_ATTEMPTS
          ? 'untested'
          : since.correct / since.attempts > 0.65
            ? 'held'
            : 'relapsed';
      return {
        targetId: h.targetId,
        title: h.title,
        topic: h.topic,
        healedAt: h.healedAt,
        repairs: input.healCount[h.targetId] ?? 1,
        answeredInRepair: h.answered,
        since,
        status,
      };
    })
    .sort((a, b) => b.healedAt - a.healedAt);
}

/**
 * Weekly activity, oldest first.
 *
 * A week with no answers is `accuracy: null`, not `0`. Drawing a zero there
 * would show a student who took a week off a line crashing to the floor, which
 * is a lie about their maths told with a chart.
 */
function weeklyActivity(input: ReportInput): WeekPoint[] {
  const weekMs = 7 * DAY;
  const start = input.now - TREND_WEEKS * weekMs;
  const buckets: WeekPoint[] = [];
  for (let i = 0; i < TREND_WEEKS; i++) {
    buckets.push({ ts: start + i * weekMs, answered: 0, correct: 0, accuracy: null });
  }
  for (const e of input.events) {
    if (e.subject !== input.subject || e.repeat || e.ts < start) continue;
    const idx = Math.min(TREND_WEEKS - 1, Math.floor((e.ts - start) / weekMs));
    if (idx < 0) continue;
    buckets[idx].answered += 1;
    if (e.correct) buckets[idx].correct += 1;
  }
  for (const b of buckets) b.accuracy = b.answered ? b.correct / b.answered : null;
  return buckets;
}

/** Per-topic accuracy, last 14 days against the 14 before. */
function topicMovement(input: ReportInput): TopicMovement[] {
  const cut = input.now - 14 * DAY;
  const priorCut = input.now - 28 * DAY;
  const agg = new Map<string, { rA: number; rC: number; pA: number; pC: number }>();

  for (const e of input.events) {
    if (e.subject !== input.subject || e.repeat) continue;
    const cur = agg.get(e.topic) ?? { rA: 0, rC: 0, pA: 0, pC: 0 };
    if (e.ts >= cut) {
      cur.rA += 1;
      if (e.correct) cur.rC += 1;
    } else if (e.ts >= priorCut) {
      cur.pA += 1;
      if (e.correct) cur.pC += 1;
    }
    agg.set(e.topic, cur);
  }

  // Three answers is the same floor the weakness detector uses. Below it an
  // "accuracy" is one lucky question away from any value at all.
  const side = (a: number, c: number) => (a >= 3 ? { attempts: a, accuracy: c / a } : null);

  return [...agg.entries()]
    .map(([topic, v]) => {
      const recent = side(v.rA, v.rC);
      const prior = side(v.pA, v.pC);
      return {
        topic,
        recent,
        prior,
        delta: recent && prior ? recent.accuracy - prior.accuracy : null,
      };
    })
    .filter((m) => m.recent || m.prior)
    .sort((a, b) => (b.recent?.attempts ?? 0) - (a.recent?.attempts ?? 0) || a.topic.localeCompare(b.topic));
}

/** Assemble the whole report. Pure — every input is a parameter. */
export function buildReport(input: ReportInput): ReportData {
  const profile = buildProfile(taggedMisses(input.events), input.now);
  const weaknesses = detectWeaknesses({
    subject: input.subject,
    events: [...input.events],
    mistakes: [...input.mistakes],
    now: input.now,
    healed: input.healed,
    healCount: input.healCount,
  });
  const totalAnswered = input.events.filter((e) => e.subject === input.subject && !e.repeat).length;

  return {
    now: input.now,
    profile,
    weaknesses,
    chronic: weaknesses.filter((w) => w.chronic),
    repairs: repairOutcomes(input),
    weeks: weeklyActivity(input),
    movement: topicMovement(input),
    totalAnswered,
    // One screen of practice is not a profile. The page says so plainly rather
    // than rendering a grid of empty cards that reads as a broken feature.
    earlyDays: totalAnswered < 10,
  };
}

/** Browser wrapper: read every store and build the report for `subject`. */
export function getReport(subject: string, now: number = Date.now()): ReportData {
  return buildReport({
    subject,
    events: getResults(subject),
    mistakes: getMistakes(subject),
    history: healedHistory(),
    healed: getHealedMap(),
    healCount: getHealCountMap(),
    now,
  });
}
