/**
 * patterns/profile.ts — which mistakes actually REPEAT, and whether they are
 * getting better.
 *
 * PURE: misses in, findings out, the clock is a parameter. That is what lets
 * `scripts/test-patterns.ts` run a synthetic student through the identical code
 * the report renders.
 *
 * ============================================================
 * THE ONE RULE THAT MAKES THIS HONEST
 * ============================================================
 * A tag is reported as a PATTERN only if it appears in at least two different
 * sub-topics. Not because two is a magic number, but because a mistake confined
 * to one sub-topic is not a pattern — it is a local weakness, and
 * `lib/remediation` already finds those, names them better, and can build a
 * repair path for them. Reporting it here too would show the student one
 * problem twice and make the report look busier than their maths actually is.
 *
 * The second rule is the same one `lib/cognition` and `lib/remediation` learned
 * the expensive way: below the evidence floor, say NOTHING. An app that tells a
 * student "you have a problem with signs" on the strength of two misses has
 * invented a weakness, and that is the single worst thing a study app can do by
 * accident.
 *
 * ============================================================
 * WHY THERE IS NO ACCURACY RATE
 * ============================================================
 * The obvious design gives each tag a hit rate. It cannot be computed honestly:
 * the denominator would be "questions where this mistake was possible", and
 * outside the generated bank nothing declares that. Inventing one — every open
 * question, say — dilutes real patterns behind questions that could never have
 * produced them.
 *
 * So a finding reports what IS measurable: how many times it happened, what
 * share of the student's labelled mistakes it accounts for, how many topics it
 * crosses, and whether it is happening more or less than it used to. Every one
 * of those is defined without guessing.
 */

import { ALL_TAGS, type ErrorTag } from './tags';
import type { TaggedMiss } from './observe';

const DAY = 24 * 60 * 60 * 1000;

/** Labelled misses before a tag can be called anything at all. */
export const MIN_HITS = 3;
/** Distinct sub-topics a tag must cross to be a PATTERN rather than a weakness. */
export const MIN_SPREAD = 2;
/** The comparison window for the trend, in days, on each side. */
export const TREND_WINDOW_DAYS = 14;
/**
 * Half-life for ranking, in days. Matches `lib/cognition`'s decay so the two
 * layers never disagree about what "recent" means to this app.
 */
export const HALF_LIFE_DAYS = 21;
/**
 * Share-of-mistakes change that counts as a real move rather than noise.
 * Below this the trend is 'steady' — a report that flips between "משתפר"
 * and "מחמיר" on one answer teaches the student to ignore it.
 */
const TREND_EPSILON = 0.08;

export type Trend = 'improving' | 'steady' | 'worsening' | 'unknown';

export type PatternFinding = {
  tag: ErrorTag;
  /** Labelled misses, all time. */
  hits: number;
  /** Of those, how many happened inside a repair session. */
  hitsInRepair: number;
  /** Share of ALL the student's labelled misses. A well-defined denominator. */
  share: number;
  /** Topics it appeared in, strongest first. */
  topics: { topic: string; hits: number }[];
  /** How many distinct sub-topics it crossed — the "pattern" evidence itself. */
  spread: number;
  firstTs: number;
  lastTs: number;
  /** Recency-decayed hit count. Ranking only; never shown as a number. */
  weight: number;
  /** Share of labelled misses in the last window vs the window before it. */
  recentShare: number;
  priorShare: number;
  trend: Trend;
};

function decay(ts: number, now: number): number {
  return Math.pow(2, -Math.max(0, (now - ts) / DAY) / HALF_LIFE_DAYS);
}

/**
 * Share of the misses in `window` that carry `tag`.
 *
 * A SHARE, not a count, and that matters: a student who practises twice as much
 * this fortnight makes more mistakes of every kind, and a raw count would call
 * that "worsening" on every single tag at once. Share asks the question the
 * student actually cares about — is this still the thing tripping me up?
 */
function shareIn(misses: TaggedMiss[], tag: ErrorTag): number {
  if (!misses.length) return 0;
  return misses.filter((m) => m.tag === tag).length / misses.length;
}

function trendOf(recentShare: number, priorShare: number, priorCount: number): Trend {
  // With nothing to compare against, "steady" would be a claim we cannot make.
  if (priorCount < MIN_HITS) return 'unknown';
  const delta = recentShare - priorShare;
  if (Math.abs(delta) < TREND_EPSILON) return 'steady';
  return delta < 0 ? 'improving' : 'worsening';
}

export type ProfileResult = {
  /** Tags that cross sub-topics — the recurring patterns. Strongest first. */
  patterns: PatternFinding[];
  /**
   * Tags that cleared the evidence floor but stayed inside ONE sub-topic.
   * Kept separate so the UI can present them as what they are — a local
   * weakness — and hand them to `lib/remediation` rather than to the report.
   */
  local: PatternFinding[];
  /** Total labelled misses. The denominator behind every `share` above. */
  totalTagged: number;
  /**
   * Labelled misses that were NOT enough to report anything. Shown to the
   * student as "still measuring" rather than hidden, so an empty report reads
   * as early days and not as a broken screen.
   */
  belowFloor: number;
};

export function buildProfile(misses: readonly TaggedMiss[], now: number): ProfileResult {
  const all = [...misses];
  const cutoff = now - TREND_WINDOW_DAYS * DAY;
  const priorCutoff = now - 2 * TREND_WINDOW_DAYS * DAY;

  // The trend compares PRACTICE with practice. Repair sessions are excluded
  // from both windows: they are concentrated on the student's weakest tag by
  // construction, so a fortnight containing a repair session would show that
  // tag "worsening" precisely because it is being worked on.
  const practice = all.filter((m) => !m.inRepair);
  const recentWindow = practice.filter((m) => m.ts >= cutoff);
  const priorWindow = practice.filter((m) => m.ts >= priorCutoff && m.ts < cutoff);

  const patterns: PatternFinding[] = [];
  const local: PatternFinding[] = [];
  let belowFloor = 0;

  for (const tag of ALL_TAGS) {
    const hits = all.filter((m) => m.tag === tag);
    if (!hits.length) continue;
    if (hits.length < MIN_HITS) {
      belowFloor += hits.length;
      continue;
    }

    const byTopic = new Map<string, number>();
    const subTopics = new Set<string>();
    for (const h of hits) {
      byTopic.set(h.topic, (byTopic.get(h.topic) ?? 0) + 1);
      // A miss with no sub-topic still counts toward spread via its topic —
      // otherwise bagrut questions, which carry no sub-topic, would be invisible
      // to the one rule this file is built on.
      subTopics.add(h.subTopicId ?? `topic:${h.topic}`);
    }

    const recentShare = shareIn(recentWindow, tag);
    const priorShare = shareIn(priorWindow, tag);

    const finding: PatternFinding = {
      tag,
      hits: hits.length,
      hitsInRepair: hits.filter((h) => h.inRepair).length,
      share: hits.length / all.length,
      topics: [...byTopic.entries()]
        .map(([topic, n]) => ({ topic, hits: n }))
        .sort((a, b) => b.hits - a.hits || a.topic.localeCompare(b.topic)),
      spread: subTopics.size,
      firstTs: Math.min(...hits.map((h) => h.ts)),
      lastTs: Math.max(...hits.map((h) => h.ts)),
      weight: hits.reduce((sum, h) => sum + decay(h.ts, now), 0),
      recentShare,
      priorShare,
      trend: trendOf(recentShare, priorShare, priorWindow.length),
    };

    (finding.spread >= MIN_SPREAD ? patterns : local).push(finding);
  }

  // Fully deterministic ordering. The same state must always render the same
  // report; a list that reshuffles on reload reads as broken even when every
  // individual row is defensible.
  const rank = (a: PatternFinding, b: PatternFinding) =>
    b.weight - a.weight || b.hits - a.hits || b.spread - a.spread || a.tag.localeCompare(b.tag);

  return {
    patterns: patterns.sort(rank),
    local: local.sort(rank),
    totalTagged: all.length,
    belowFloor,
  };
}

/** The single pattern most worth telling the student about, or null. */
export function topPattern(profile: ProfileResult): PatternFinding | null {
  return profile.patterns[0] ?? null;
}
