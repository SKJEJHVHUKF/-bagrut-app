// ============================================================
// prediction.ts — "אם תיגש היום — הציון החזוי שלך" — a deterministic,
// zero-API grade estimate for the 5-unit bagrut.
//
// Model:
//   - Each curriculum topic carries typical exam points ("15-25") and an
//     appearance frequency ("בכל בגרות"...). midpoint × frequency = the
//     topic's expected weight; weights are normalized to 100 per paper.
//   - The student's accuracy per topic (lib/results.ts) is smoothed with a
//     Bayesian prior (their self-assessed onboarding level) so a handful of
//     lucky/unlucky answers doesn't swing the estimate.
//   - Honesty band: wide when data is sparse, narrows as answers accumulate.
//
// This is an ESTIMATE for motivation and direction — the UI must always
// label it "הערכה", never a promise.
// ============================================================

import {
  MATH5_CURRICULUM,
  topicsByPaper,
  type BagrutPaper,
  type AppearsIn,
} from '@/content/bagrut-curriculum';
import { topicStats } from '@/lib/results';
import { getPlan, type ProficiencyLevel } from '@/lib/study-plan';

// Final-grade composition between the two papers.
// TODO: verify against the current MOE circular (חוזר מפמ"ר) — commonly
// cited split for 5 units is 35% (581) / 65% (582).
export const PAPER_WEIGHTS: Record<BagrutPaper, number> = { '581': 0.35, '582': 0.65 };

const PROB: Record<AppearsIn, number> = {
  'בכל בגרות': 1,
  'ברוב הבגרויות': 0.75,
  'בכמחצית מהבגרויות': 0.5,
  'אופציונלי': 0.25,
  'מחוץ לסילבוס': 0,
};

const LEVEL_PRIOR: Record<ProficiencyLevel, number> = {
  weak: 0.45,
  mid: 0.65,
  strong: 0.8,
};
const DEFAULT_PRIOR = 0.5;
/** Prior strength — how many "virtual answers" the prior is worth. */
const K = 5;

export type TopicImpact = {
  topic: string;
  emoji: string;
  /** This topic's share of the paper, in points (weights sum to 100). */
  weightPts: number;
  /** Smoothed accuracy 0..1. */
  accuracy: number;
  /** Real answered attempts. */
  attempts: number;
  /** Points gained on the paper for +10% accuracy in this topic. */
  gainPer10: number;
};

export type PaperPrediction = {
  paper: BagrutPaper;
  score: number;
  low: number;
  high: number;
  totalAttempts: number;
  topics: TopicImpact[];
};

function midpoint(typicalPoints: string): number {
  if (!typicalPoints || typicalPoints === '—') return 0;
  const parts = typicalPoints.split('-').map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && parts.every((n) => !isNaN(n))) return (parts[0] + parts[1]) / 2;
  const single = parseFloat(typicalPoints);
  return isNaN(single) ? 0 : single;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function predictPaper(subject: string, paper: BagrutPaper): PaperPrediction | null {
  const candidates = topicsByPaper(paper).filter(
    (t) => t.weight !== 'out-of-scope' && midpoint(t.typicalPoints) > 0 && PROB[t.appearsIn] > 0,
  );
  if (candidates.length === 0) return null;

  const raw = candidates.map((t) => midpoint(t.typicalPoints) * PROB[t.appearsIn]);
  const rawSum = raw.reduce((a, b) => a + b, 0);
  if (rawSum === 0) return null;

  const stats = topicStats(subject);
  const plan = getPlan();

  let score = 0;
  let totalAttempts = 0;
  const topics: TopicImpact[] = candidates.map((t, i) => {
    const w = (100 * raw[i]) / rawSum;
    const stat = stats.find((s) => s.topic === t.key);
    const n = stat?.attempts ?? 0;
    const rawAcc = stat?.accuracy ?? 0;
    const planLevel = plan?.topics.find(
      (p) => p.subject === subject && p.topic === t.key,
    )?.level;
    const prior = planLevel ? LEVEL_PRIOR[planLevel] : DEFAULT_PRIOR;
    const acc = (n * rawAcc + K * prior) / (n + K);
    score += w * acc;
    totalAttempts += n;
    return {
      topic: t.key,
      emoji: t.emoji,
      weightPts: Math.round(w * 10) / 10,
      accuracy: acc,
      attempts: n,
      gainPer10: acc < 0.95 ? Math.round(w * 0.1 * 10) / 10 : 0,
    };
  });

  const half = clamp(25 / Math.sqrt(1 + totalAttempts / 10), 3, 25);
  return {
    paper,
    score: Math.round(score),
    low: Math.round(clamp(score - half, 0, 100)),
    high: Math.round(clamp(score + half, 0, 100)),
    totalAttempts,
    topics: topics.sort((a, b) => b.gainPer10 - a.gainPer10),
  };
}

export type OverallPrediction = {
  score: number;
  low: number;
  high: number;
  totalAttempts: number;
  papers: PaperPrediction[];
};

/** Weighted 581+582 estimate, or null when there's no usable model. */
export function predictOverall(subject: string): OverallPrediction | null {
  const papers = (['581', '582'] as BagrutPaper[])
    .map((p) => predictPaper(subject, p))
    .filter((p): p is PaperPrediction => p !== null);
  if (papers.length === 0) return null;

  let score = 0;
  let low = 0;
  let high = 0;
  let weightSum = 0;
  let totalAttempts = 0;
  for (const p of papers) {
    const w = PAPER_WEIGHTS[p.paper];
    score += w * p.score;
    low += w * p.low;
    high += w * p.high;
    weightSum += w;
    totalAttempts += p.totalAttempts;
  }
  return {
    score: Math.round(score / weightSum),
    low: Math.round(low / weightSum),
    high: Math.round(high / weightSum),
    totalAttempts,
    papers,
  };
}

/** The topics where improvement buys the most FINAL-grade points. */
export function topImpactTopics(subject: string, limit = 3): TopicImpact[] {
  const all: TopicImpact[] = [];
  for (const paper of ['581', '582'] as BagrutPaper[]) {
    const p = predictPaper(subject, paper);
    if (!p) continue;
    const paperW = PAPER_WEIGHTS[paper];
    for (const t of p.topics) {
      all.push({ ...t, gainPer10: Math.round(t.gainPer10 * paperW * 10) / 10 });
    }
  }
  // A topic may sit in both papers (alsoIn) under the same key — keep the max.
  const best = new Map<string, TopicImpact>();
  for (const t of all) {
    const cur = best.get(t.topic);
    if (!cur || t.gainPer10 > cur.gainPer10) best.set(t.topic, t);
  }
  return [...best.values()].sort((a, b) => b.gainPer10 - a.gainPer10).slice(0, limit);
}

/** Sanity guard for the curriculum reference in dev scripts. */
export function curriculumSize(): number {
  return MATH5_CURRICULUM.length;
}
