/**
 * cognition/misconceptions.ts — scoring the named wrong ideas.
 *
 * Detection itself is a LOOKUP, not a heuristic (see observe.ts): a distractor
 * the student clicked either is or is not the option a human author already
 * described as "this is what you did wrong". What is left to compute is how
 * much it currently matters — which is a rate over OPPORTUNITIES, not a count
 * of hits. Falling into a trap twice out of two encounters is a live problem;
 * twice out of nine is a student who has mostly fixed it.
 *
 * Pure; the clock is a parameter.
 */

import type { Misconception } from '@/content/cognition/types';
import type { MisconceptionEvidence } from './observe';
import type { MisconceptionState, MisconceptionStatus } from './types';
import { DECAY_HALF_LIFE_DAYS } from './trace';

const DAY = 24 * 60 * 60 * 1000;

/** Laplace smoothing — keeps a single hit out of one encounter from reading 100%. */
const SMOOTH_HITS = 0.5;
const SMOOTH_OPPS = 2;

/** Consecutive clean encounters after the last hit that clear a misconception. */
const CLEAN_TO_RESOLVE = 3;
const CLEAN_TO_FADE = 2;

/** A rate at or above this, still recent, is a live problem. */
export const ACTIVE_RATE = 0.34;
/** Past this many days with no hit, nothing is "active" any more. */
export const ACTIVE_WINDOW_DAYS = 21;

function recencyWeight(ts: number, now: number): number {
  const days = Math.max(0, (now - ts) / DAY);
  return Math.pow(2, -days / DECAY_HALF_LIFE_DAYS);
}

function statusOf(
  hits: number,
  cleanSinceLastHit: number,
  rate: number,
  lastHitTs: number,
  now: number,
): MisconceptionStatus {
  if (hits === 0) return 'resolved';
  if (cleanSinceLastHit >= CLEAN_TO_RESOLVE) return 'resolved';
  if (hits >= 2 && cleanSinceLastHit >= CLEAN_TO_FADE) return 'fading';
  const daysSinceHit = (now - lastHitTs) / DAY;
  if (daysSinceHit > ACTIVE_WINDOW_DAYS) return 'fading';
  if (hits === 1) return 'suspected';
  return rate >= ACTIVE_RATE ? 'active' : 'fading';
}

const STATUS_FACTOR: Record<MisconceptionStatus, number> = {
  active: 1,
  suspected: 0.5,
  fading: 0.25,
  resolved: 0,
};

/**
 * Score every misconception in the catalog against the evidence.
 * Returns only those with at least one opportunity — a trap the student has
 * never met is not a finding, and listing it would imply otherwise.
 */
export function scoreMisconceptions(
  catalog: Misconception[],
  evidence: MisconceptionEvidence[],
  now: number,
): MisconceptionState[] {
  const byId = new Map<string, MisconceptionEvidence[]>();
  for (const e of evidence) {
    const list = byId.get(e.misconceptionId);
    if (list) list.push(e);
    else byId.set(e.misconceptionId, [e]);
  }

  const out: MisconceptionState[] = [];
  for (const mc of catalog) {
    const list = byId.get(mc.id);
    if (!list || list.length === 0) continue;

    let weightedHits = 0;
    let weightedOpps = 0;
    let hits = 0;
    let lastHitTs = 0;
    for (const e of list) {
      const w = recencyWeight(e.ts, now);
      weightedOpps += w;
      if (e.hit) {
        weightedHits += w;
        hits += 1;
        lastHitTs = Math.max(lastHitTs, e.ts);
      }
    }

    // Encounters after the last hit, in chronological order.
    let cleanSinceLastHit = 0;
    for (const e of list) {
      if (e.ts > lastHitTs && !e.hit) cleanSinceLastHit += 1;
    }

    const rate = (weightedHits + SMOOTH_HITS) / (weightedOpps + SMOOTH_OPPS);
    const status = statusOf(hits, cleanSinceLastHit, rate, lastHitTs, now);
    const recency = hits > 0 ? recencyWeight(lastHitTs, now) : 0;

    out.push({
      id: mc.id,
      skillId: mc.skill,
      title: mc.title,
      insight: mc.insight,
      hits,
      opportunities: list.length,
      rate,
      weight: rate * recency * STATUS_FACTOR[status],
      lastHitTs,
      status,
    });
  }

  out.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  return out;
}

/** The misconceptions worth showing — live ones only, strongest first. */
export function activeMisconceptions(
  states: MisconceptionState[],
  limit = 3,
): MisconceptionState[] {
  return states
    .filter((m) => m.status === 'active' || m.status === 'suspected')
    .slice(0, limit);
}
