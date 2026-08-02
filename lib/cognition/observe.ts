/**
 * cognition/observe.ts — turn the raw answer log into skill-level observations.
 *
 * This is where a click becomes a measurement. `results.ts` records WHICH
 * question was answered and whether it was right; the catalog says which SKILLS
 * that question exercises and — for MCQ — which MISCONCEPTION each wrong option
 * encodes. One event fans out to one observation per skill, carrying the
 * misconception id when the chosen distractor matched a trigger.
 *
 * Pure: no storage, no clock. The caller passes the events in.
 */

import { getQuestions, getSubTopics } from '@/content/lessons';
import { buildTriggerIndex, getCognitionMap } from '@/content/cognition';
import type { SkillId, TopicCognitionMap } from '@/content/cognition/types';
import type { ResultEvent } from '@/lib/results';
import type { Observation } from './types';

/** What the content knows about a question, independent of the catalog. */
export type QuestionFacts = {
  kind: 'mcq' | 'open';
  optionCount?: number;
  subTopicId?: string;
};

/**
 * questionId → facts, over the sub-topic banks, the lesson micro-drills and the
 * topic-level bank. Built once per topic and cached — the maps are static for
 * the lifetime of the page.
 */
const questionFactsCache = new Map<string, Map<string, QuestionFacts>>();

export function buildQuestionFacts(subject: string, topic: string): Map<string, QuestionFacts> {
  const cacheKey = `${subject}:${topic}`;
  const cached = questionFactsCache.get(cacheKey);
  if (cached) return cached;

  const facts = new Map<string, QuestionFacts>();
  const add = (
    q: { id: string; kind: 'mcq' | 'open'; answers?: string[] },
    subTopicId?: string,
  ) => {
    facts.set(q.id, {
      kind: q.kind,
      optionCount: q.kind === 'mcq' ? q.answers?.length : undefined,
      subTopicId,
    });
  };

  for (const st of getSubTopics(subject, topic)) {
    for (const q of st.questions ?? []) add(q, st.id);
    for (const step of st.lesson ?? []) if (step.drill) add(step.drill, st.id);
  }
  // Topic-level bank last: it has no sub-topic, and must not shadow a
  // sub-topic entry if an id ever appears in both.
  for (const q of getQuestions(subject, topic)) if (!facts.has(q.id)) add(q, undefined);

  questionFactsCache.set(cacheKey, facts);
  return facts;
}

/** questionId → the misconceptions that have at least one trigger on it. */
const opportunityCache = new Map<string, Map<string, string[]>>();

export function buildOpportunityIndex(map: TopicCognitionMap): Map<string, string[]> {
  const cacheKey = `${map.subject}:${map.topic}`;
  const cached = opportunityCache.get(cacheKey);
  if (cached) return cached;

  const index = new Map<string, string[]>();
  for (const mc of map.misconceptions) {
    const seen = new Set<string>();
    for (const t of mc.triggers) {
      if (seen.has(t.questionId)) continue;
      seen.add(t.questionId);
      const list = index.get(t.questionId) ?? [];
      list.push(mc.id);
      index.set(t.questionId, list);
    }
  }
  opportunityCache.set(cacheKey, index);
  return index;
}

/**
 * Which skills a question exercises. Explicit map first; otherwise fall back to
 * every skill of the question's sub-topic. The fallback is coarse — it spreads
 * one answer over 3-5 skills — but it is never WRONG, and it means a newly
 * authored question still produces signal before anyone tags it.
 */
export function skillsForQuestion(
  map: TopicCognitionMap,
  questionId: string,
  facts: QuestionFacts | undefined,
): SkillId[] {
  const explicit = map.questionSkills[questionId];
  if (explicit && explicit.length > 0) return explicit;
  if (!facts?.subTopicId) return [];
  return map.skills.filter((s) => s.subTopicId === facts.subTopicId).map((s) => s.id);
}

/**
 * The event log → observations, oldest first.
 *
 * Events are kept even when they are replays: re-answering a question IS
 * evidence about retention, just weaker (trace.ts raises the guess parameter
 * for them). That is why this reads the raw log and not `results.measured()`,
 * which drops replays because they must not inflate the grade prediction.
 */
export function toObservations(
  subject: string,
  topic: string,
  events: ResultEvent[],
): Observation[] {
  const map = getCognitionMap(subject, topic);
  if (!map) return [];

  const facts = buildQuestionFacts(subject, topic);
  const triggers = buildTriggerIndex(map);
  const out: Observation[] = [];

  for (const e of events) {
    if (e.subject !== subject || e.topic !== topic || !e.questionId) continue;

    const f = facts.get(e.questionId);
    const skills = skillsForQuestion(map, e.questionId, f);
    if (skills.length === 0) continue;

    // The event's own fields win when present (they were recorded at answer
    // time); the content is the fallback for events written before the fields
    // existed, and for the option count, which the log need not carry.
    const kind = e.kind ?? f?.kind ?? (typeof e.chosenIndex === 'number' ? 'mcq' : 'open');
    const optionCount = e.optionCount ?? f?.optionCount;

    let misconceptionId: string | undefined;
    if (!e.correct && typeof e.chosenIndex === 'number') {
      misconceptionId = triggers.get(e.questionId)?.get(e.chosenIndex);
    }

    for (const skillId of skills) {
      out.push({
        ts: e.ts,
        skillId,
        correct: e.correct,
        kind,
        optionCount,
        hintUsed: e.hintUsed,
        isReplay: e.repeat,
        source: e.source,
        misconceptionId,
      });
    }
  }

  out.sort((a, b) => a.ts - b.ts);
  return out;
}

/**
 * Misconception evidence: for each answered MCQ, every misconception with a
 * trigger on that question counts as an OPPORTUNITY, and the one whose option
 * was actually chosen counts as a HIT.
 *
 * Counting opportunities is the whole reason `chosenIndex` had to be recorded.
 * Without it, "met this trap nine times and avoided it eight" and "met it twice
 * and fell in twice" both look like two hits.
 */
export type MisconceptionEvidence = {
  misconceptionId: string;
  ts: number;
  hit: boolean;
};

export function toMisconceptionEvidence(
  subject: string,
  topic: string,
  events: ResultEvent[],
): MisconceptionEvidence[] {
  const map = getCognitionMap(subject, topic);
  if (!map) return [];

  const triggers = buildTriggerIndex(map);
  const opportunities = buildOpportunityIndex(map);
  const out: MisconceptionEvidence[] = [];

  for (const e of events) {
    if (e.subject !== subject || e.topic !== topic || !e.questionId) continue;
    const candidates = opportunities.get(e.questionId);
    if (!candidates) continue;

    // An answer with no recorded choice tells us nothing about WHICH trap was
    // avoided, so it is not an opportunity either — counting it would dilute
    // every rate on the page with events that could never have produced a hit.
    if (typeof e.chosenIndex !== 'number') continue;

    const hitId = e.correct ? undefined : triggers.get(e.questionId)?.get(e.chosenIndex);
    for (const id of candidates) {
      out.push({ misconceptionId: id, ts: e.ts, hit: id === hitId });
    }
  }

  out.sort((a, b) => a.ts - b.ts);
  return out;
}
