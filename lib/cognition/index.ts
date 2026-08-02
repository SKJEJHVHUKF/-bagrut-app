/**
 * cognition/index.ts — the public entry point.
 *
 *   buildCognitiveState(...)  PURE. events + catalog + clock → the whole state.
 *   getCognitiveState(...)    Browser convenience: reads the existing stores and
 *                             calls the pure one.
 *
 * The split is the point. Nothing is persisted, so the state can never drift
 * from the evidence, and a synthetic student replayed through
 * `buildCognitiveState` exercises exactly the code the app runs — which is what
 * scripts/test-cognition.ts does.
 */

import { getCognitionMap, hasCognitionMap } from '@/content/cognition';
import { getSubTopics } from '@/content/lessons';
import { buildSubTopicLevels } from '@/lib/roadmap-levels';
import { nodeLevelSummary } from '@/lib/roadmap-progress';
import { getResults, type ResultEvent } from '@/lib/results';
import { dueCount as reviewDueCount } from '@/lib/review';
import { findWeakestLink } from './diagnose';
import { buildInsight } from './insight';
import { scoreMisconceptions } from './misconceptions';
import { toMisconceptionEvidence, toObservations } from './observe';
import { buildCandidates, chooseNextStep, type NextStepContext } from './next-step';
import { traceAll } from './trace';
import type { CognitiveState } from './types';

export type BuildInput = {
  subject: string;
  topic: string;
  events: ResultEvent[];
  now: number;
} & NextStepContext;

/** PURE. The whole cognitive state as a function of its inputs. */
export function buildCognitiveState(input: BuildInput): CognitiveState | null {
  const { subject, topic, events, now, dueCount, resume } = input;
  const map = getCognitionMap(subject, topic);
  if (!map) return null;

  const observations = toObservations(subject, topic, events);
  const evidence = toMisconceptionEvidence(subject, topic, events);

  const skills = traceAll(map.skills, observations, now);
  const misconceptions = scoreMisconceptions(map.misconceptions, evidence, now);
  const weakestLink = findWeakestLink(map.skills, skills, now);

  const candidates = buildCandidates(
    map.skills,
    map.misconceptions,
    skills,
    misconceptions,
    weakestLink,
    { dueCount, resume },
  );
  const { nextStep, alternates } = chooseNextStep(candidates, resume?.href ?? null);

  const measured = skills.filter((s) => s.observations > 0).length;

  return {
    subject,
    topic,
    skills,
    misconceptions,
    weakestLink,
    nextStep,
    alternates,
    insight: buildInsight({
      weakestLink,
      misconceptions,
      skills,
      totalObservations: observations.length,
      now,
    }),
    coverage: map.skills.length > 0 ? measured / map.skills.length : 0,
    totalObservations: observations.length,
    updatedAt: now,
  };
}

/**
 * The first sub-topic of this topic that still has an unclimbed rung, as a
 * resume target. Deliberately NOT lib/roadmap-resume.getResumePoint — that one
 * answers "where am I in the whole roadmap" and needs the full topic groups;
 * here the question is scoped to one topic, which keeps the recommendation
 * about the thing the student is actually looking at.
 */
function topicResume(
  subject: string,
  topic: string,
): { href: string; title: string } | null {
  for (const st of getSubTopics(subject, topic)) {
    const levels = buildSubTopicLevels(subject, topic, st);
    if (levels.length === 0) continue;
    const summary = nodeLevelSummary(topic, st.id, levels);
    if (summary.currentIndex >= levels.length) continue;
    const level = levels[summary.currentIndex];
    return {
      href: `/roadmap/${encodeURIComponent(st.id)}?level=${level.kind}`,
      title:
        summary.clearedCount > 0
          ? `המשך: ${st.title} — ${level.title}`
          : `התחל: ${st.title}`,
    };
  }
  return null;
}

/**
 * Browser entry point. Safe to call on any render — it reads localStorage and
 * runs a few thousand arithmetic operations. Callers should still wrap it in a
 * `useMemo`, keyed on whatever tells them an answer was recorded.
 */
export function getCognitiveState(
  subject: string,
  topic: string,
  now: number = Date.now(),
): CognitiveState | null {
  if (!hasCognitionMap(subject, topic)) return null;
  return buildCognitiveState({
    subject,
    topic,
    events: getResults(subject),
    now,
    dueCount: reviewDueCount(now),
    resume: topicResume(subject, topic),
  });
}

export { hasCognitionMap } from '@/content/cognition';
export * from './types';
