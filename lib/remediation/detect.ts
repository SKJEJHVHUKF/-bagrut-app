/**
 * remediation/detect.ts — what, exactly, is worth repairing right now.
 *
 * PURE: events and mistakes come in as arguments, the clock is a parameter, and
 * the only things read from the module scope are the static catalogs. That is
 * what lets scripts/test-remediation.ts replay a synthetic student through the
 * identical code the browser runs.
 *
 * Two detectors, one output type:
 *
 *   • SHARP — topics with a `content/cognition` catalog. A misconception is a
 *     LOOKUP, not a heuristic: the student clicked an option a human author had
 *     already labelled "this is the wrong idea that produces this answer".
 *
 *   • COARSE — every other topic. A sub-topic the student is measurably failing,
 *     labelled with the dominant category from their error notebook.
 *
 * The coarse detector is not a placeholder for the sharp one. It runs on all 14
 * topics on day one, and each catalog that gets authored simply removes
 * sub-topics from its jurisdiction — no call site changes.
 *
 * ⚠️ The single most important rule in this file: below the evidence floor we
 * emit NOTHING. lib/cognition learned this the expensive way — a lenient
 * threshold turned "we haven't measured you" into "you are weak at this", which
 * is the one thing a study app must never say by accident.
 */

import { getTopicMapping, type TopicWeight } from '@/content/bagrut-curriculum';
import { cognitionEntries, getCognitionMap, hasCognitionMap } from '@/content/cognition';
import type { Misconception } from '@/content/cognition/types';
import { getSubTopic, hasSubTopics } from '@/content/lessons';
import { scoreMisconceptions } from '@/lib/cognition/misconceptions';
import { toMisconceptionEvidence } from '@/lib/cognition/observe';
import { DECAY_HALF_LIFE_DAYS } from '@/lib/cognition/trace';
import type { MistakeRecord, ErrorCategory } from '@/lib/mistakes';
import type { ResultEvent } from '@/lib/results';
import { rankOf, type Difficulty, type Weakness } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** Answers in a sub-topic before we are willing to call it a weakness. */
export const MIN_ATTEMPTS = 3;
/** Accuracy at or below this counts as failing (over MIN_ATTEMPTS answers). */
export const MAX_ACCURACY = 0.65;
/** Below this we stay silent, whatever the score says. */
export const MIN_CONFIDENCE = 0.5;
/**
 * A repaired weakness is not recommended again for this long, whatever the
 * evidence says. A student who repairs something and then misses it twice the
 * next evening should not be dragged straight back into it.
 */
export const HEAL_SUPPRESSION_DAYS = 14;
/**
 * Answers SINCE the repair before a returning weakness can be called back.
 *
 * Past the quiet period, a repaired weakness is judged on post-repair evidence
 * ONLY. This matters more than it looks: the all-time stats that raised the
 * weakness in the first place still contain every pre-repair miss, so a student
 * who fixed something and has been fine since would be re-flagged forever on
 * the strength of mistakes they no longer make. Restarting the window at the
 * repair is the only reading of "did it come back?" that the word means.
 */
export const RELAPSE_MIN_ATTEMPTS = 3;
/**
 * A weakness that has been repaired and broke again outranks a first-time one
 * of equal size. It is strictly more informative: the ordinary repair path has
 * already been tried on it and did not hold, so it needs attention sooner and a
 * different treatment — which is exactly what the report is for.
 */
const CHRONIC_PRIORITY = 1.5;
/**
 * A named misconception outranks an equally-scored sub-topic weakness. It is a
 * strictly sharper finding: it names the wrong idea rather than the area, so the
 * repair can be aimed at it and the student can be told what it was.
 */
const MISCONCEPTION_PRIORITY = 1.3;

/** How much the bagrut cares about the topic — a tiebreak, never a gate. */
const WEIGHT_FACTOR: Record<TopicWeight, number> = {
  core: 1,
  standard: 0.85,
  foundational: 0.8,
  optional: 0.6,
  'out-of-scope': 0.2,
};

function topicFactor(topic: string): number {
  const w = getTopicMapping(topic)?.weight;
  return w ? WEIGHT_FACTOR[w] : 0.85;
}

/** Same decay the cognition layer uses, so the two never disagree about "recent". */
function recencyWeight(ts: number, now: number): number {
  const days = Math.max(0, (now - ts) / DAY);
  return Math.pow(2, -days / DECAY_HALF_LIFE_DAYS);
}

export type DetectInput = {
  subject: string;
  /** The raw answer log — replays included; they are weaker evidence, not none. */
  events: ResultEvent[];
  /** The error notebook, for the dominant category of a coarse weakness. */
  mistakes: MistakeRecord[];
  now: number;
  /** targetId → healedAt. Suppressed for HEAL_SUPPRESSION_DAYS, then re-judged. */
  healed?: Record<string, number>;
  /** targetId → how many times it has been repaired. Drives `chronic`. */
  healCount?: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Id encoding. Sub-topic ids are unique across the curriculum (that is what
// makes /roadmap/[lessonId] resolvable without a topic), and misconception ids
// are namespaced by their catalog, so a bare id is enough in both cases.
// ---------------------------------------------------------------------------

export function subTopicTargetId(subTopicId: string): string {
  return `st:${subTopicId}`;
}

export function misconceptionTargetId(misconceptionId: string): string {
  return `mc:${misconceptionId}`;
}

/** The catalog entry behind a `mc:` id, searched across every registered map. */
export function findMisconception(
  misconceptionId: string,
): { mc: Misconception; subject: string; topic: string } | null {
  for (const map of cognitionEntries()) {
    const mc = map.misconceptions.find((m) => m.id === misconceptionId);
    if (mc) return { mc, subject: map.subject, topic: map.topic };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Coarse detector — works on every topic, catalog or not.
// ---------------------------------------------------------------------------

type SubStat = {
  topic: string;
  subTopicId: string;
  attempts: number;
  correct: number;
  lastTs: number;
  /** Wrong answers per difficulty — the mode is the band we repair at. */
  wrongByDifficulty: Record<Difficulty, number>;
};

/**
 * Per-sub-topic accuracy, computed here rather than borrowed from
 * lib/results.subTopicStats because that one reads localStorage and this module
 * must stay pure. Replays are excluded for the same reason results.ts excludes
 * them from accuracy: re-answering a question you have already seen the solution
 * to is practice, not a measurement.
 */
function subTopicStatsFrom(events: ResultEvent[], subject: string): SubStat[] {
  const map = new Map<string, SubStat>();
  for (const e of events) {
    if (e.subject !== subject || !e.subTopicId || e.repeat) continue;
    const key = `${e.topic}|${e.subTopicId}`;
    const cur =
      map.get(key) ??
      ({
        topic: e.topic,
        subTopicId: e.subTopicId,
        attempts: 0,
        correct: 0,
        lastTs: 0,
        wrongByDifficulty: { easy: 0, mid: 0, hard: 0 },
      } satisfies SubStat);
    cur.attempts += 1;
    if (e.correct) cur.correct += 1;
    else cur.wrongByDifficulty[e.difficulty ?? 'mid'] += 1;
    cur.lastTs = Math.max(cur.lastTs, e.ts);
    map.set(key, cur);
  }
  return [...map.values()];
}

/** The difficulty the student is actually breaking at. */
function bandFromWrong(w: Record<Difficulty, number>): Difficulty {
  let best: Difficulty = 'mid';
  let bestN = -1;
  // Iterate hardest→easiest so a tie resolves DOWN to the easier rung: repairing
  // one level too low costs a minute, one level too high wastes the session.
  for (const d of ['hard', 'mid', 'easy'] as Difficulty[]) {
    if (w[d] >= bestN) {
      bestN = w[d];
      best = d;
    }
  }
  return bestN <= 0 ? 'mid' : best;
}

/** The dominant error category the notebook recorded for this sub-topic. */
function dominantCategory(
  mistakes: MistakeRecord[],
  subTopicId: string,
): ErrorCategory | undefined {
  const counts = new Map<ErrorCategory, number>();
  for (const m of mistakes) {
    if (m.subTopicId !== subTopicId) continue;
    // 'אחר' is the default assigned to every untagged miss. Treating it as a
    // finding would name "אחר" as the student's problem, which says nothing.
    if (m.category === 'אחר') continue;
    counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
  }
  let top: ErrorCategory | undefined;
  let max = 0;
  for (const [c, n] of counts) {
    if (n > max) {
      max = n;
      top = c;
    }
  }
  // One tagged mistake is an anecdote; two is a pattern worth naming.
  return max >= 2 ? top : undefined;
}

function coarseWeaknesses(input: DetectInput, claimed: Set<string>): Weakness[] {
  const out: Weakness[] = [];
  for (const s of subTopicStatsFrom(input.events, input.subject)) {
    if (claimed.has(s.subTopicId)) continue;
    if (s.attempts < MIN_ATTEMPTS) continue;
    const accuracy = s.correct / s.attempts;
    if (accuracy > MAX_ACCURACY) continue;
    if (!hasSubTopics(input.subject, s.topic)) continue;

    const st = getSubTopic(input.subject, s.topic, s.subTopicId);
    if (!st) continue; // content renamed — never invent a destination

    const confidence = Math.min(1, s.attempts / 6);
    if (confidence < MIN_CONFIDENCE) continue;

    const wrong = s.attempts - s.correct;
    const category = dominantCategory(input.mistakes, s.subTopicId);
    const severity = 1 - accuracy;

    out.push({
      id: subTopicTargetId(s.subTopicId),
      kind: 'subtopic',
      subject: input.subject,
      topic: s.topic,
      subTopicId: s.subTopicId,
      title: st.title,
      detail: category
        ? `${wrong} מתוך ${s.attempts} שאלות כאן יצאו שגויות, ורובן מסוג ${category}.`
        : `${wrong} מתוך ${s.attempts} שאלות בתת-הנושא הזה יצאו שגויות.`,
      band: bandFromWrong(s.wrongByDifficulty),
      confidence,
      score: severity * confidence * recencyWeight(s.lastTs, input.now) * topicFactor(s.topic),
      hits: wrong,
      opportunities: s.attempts,
      lastTs: s.lastTs,
      category,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sharp detector — topics that have a cognition catalog.
// ---------------------------------------------------------------------------

function sharpWeaknesses(input: DetectInput): Weakness[] {
  const topics = new Set(
    input.events.filter((e) => e.subject === input.subject).map((e) => e.topic),
  );
  const out: Weakness[] = [];

  for (const topic of topics) {
    if (!hasCognitionMap(input.subject, topic)) continue;
    const map = getCognitionMap(input.subject, topic);
    if (!map) continue;

    const evidence = toMisconceptionEvidence(input.subject, topic, input.events);
    const states = scoreMisconceptions(map.misconceptions, evidence, input.now);

    for (const state of states) {
      // 'fading' and 'resolved' are the layer's way of saying the student has
      // been getting this right lately. Re-drilling it would spend their evening
      // proving something we already believe.
      const live =
        state.status === 'active' || (state.status === 'suspected' && state.opportunities >= 3);
      if (!live) continue;

      const mc = map.misconceptions.find((m) => m.id === state.id);
      if (!mc) continue;
      const subTopicId = mc.remedy.subTopicId;
      if (!getSubTopic(input.subject, topic, subTopicId)) continue;

      const confidence = Math.min(1, state.opportunities / 4);
      if (confidence < MIN_CONFIDENCE) continue;

      const skill = map.skills.find((s) => s.id === (mc.rootSkill ?? mc.skill));
      out.push({
        id: misconceptionTargetId(state.id),
        kind: 'misconception',
        subject: input.subject,
        topic,
        subTopicId,
        title: state.title,
        detail: `${state.insight} נפלת בזה ב-${state.hits} מתוך ${state.opportunities} הפעמים שנתקלת בו.`,
        band: skill?.band ?? 'mid',
        confidence,
        score: state.weight * confidence * topicFactor(topic) * MISCONCEPTION_PRIORITY,
        hits: state.hits,
        opportunities: state.opportunities,
        lastTs: state.lastHitTs,
        misconceptionId: state.id,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * Every weakness worth repairing, strongest first.
 *
 * A sub-topic already claimed by a misconception is NOT also reported coarsely:
 * they would be the same finding at two resolutions, and a screen that lists
 * both reads as two problems where there is one. The sharper one wins — that is
 * the same rule lib/cognition/next-step.ts applies when a misconception explains
 * the broken prerequisite.
 */
export function detectWeaknesses(input: DetectInput): Weakness[] {
  const sharp = sharpWeaknesses(input);
  const claimed = new Set(sharp.map((w) => w.subTopicId));
  const all = [...sharp, ...coarseWeaknesses(input, claimed)];

  return all
    .map((w) => applyHealHistory(w, input))
    .filter((w): w is Weakness => w !== null)
    // Fully deterministic ordering: the same state must always produce the same
    // recommendation. A list that reshuffles on reload reads as broken even when
    // every individual answer is defensible.
    .sort((a, b) => b.score - a.score || rankOf(b.band) - rankOf(a.band) || a.id.localeCompare(b.id));
}

/**
 * Accuracy in this weakness's sub-topic SINCE a given moment.
 *
 * Replays are excluded for the same reason they are excluded everywhere else in
 * this file: re-answering a question whose solution you have already seen is
 * practice, not a measurement.
 */
function statsSince(
  input: DetectInput,
  subTopicId: string,
  since: number,
): { attempts: number; wrong: number } {
  let attempts = 0;
  let wrong = 0;
  for (const e of input.events) {
    if (e.subject !== input.subject || e.subTopicId !== subTopicId) continue;
    if (e.repeat || e.ts <= since) continue;
    attempts += 1;
    if (!e.correct) wrong += 1;
  }
  return { attempts, wrong };
}

/**
 * Decide what a previously-repaired weakness is now: suppressed, or back.
 *
 * Returns null to suppress. Returns the weakness marked `chronic` when the
 * evidence gathered SINCE the repair independently clears the same bars that
 * raise a weakness in the first place — which is the honest test for "it came
 * back", and the reason the pre-repair misses are deliberately not counted.
 */
function applyHealHistory(w: Weakness, input: DetectInput): Weakness | null {
  const healedAt = input.healed?.[w.id];
  if (!healedAt) return w;

  // Quiet period: never re-recommend something just repaired, at any evidence.
  if (input.now - healedAt <= HEAL_SUPPRESSION_DAYS * DAY) return null;

  const since = statsSince(input, w.subTopicId, healedAt);
  // Not enough practice since the repair to say anything either way. Silence is
  // the only honest answer; the report shows it as "תוקן, טרם נבדק מאז".
  if (since.attempts < RELAPSE_MIN_ATTEMPTS) return null;
  // The repair is holding.
  if ((since.attempts - since.wrong) / since.attempts > MAX_ACCURACY) return null;

  const relapses = input.healCount?.[w.id] ?? 1;
  return {
    ...w,
    chronic: true,
    relapses,
    score: w.score * CHRONIC_PRIORITY,
    detail:
      `${w.detail} תיקנת את זה כבר ${relapses === 1 ? 'פעם אחת' : `${relapses} פעמים`}, ` +
      `ומאז חזרו ${since.wrong} שגיאות מתוך ${since.attempts} שאלות כאן.`,
  };
}

/** The single most worthwhile repair, or null when the evidence is too thin. */
export function topWeakness(input: DetectInput): Weakness | null {
  return detectWeaknesses(input)[0] ?? null;
}

/** The weakness behind a target id, if it is still supported by evidence. */
export function findWeakness(targetId: string, input: DetectInput): Weakness | null {
  return detectWeaknesses(input).find((w) => w.id === targetId) ?? null;
}
