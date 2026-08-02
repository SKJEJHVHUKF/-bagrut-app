/**
 * teach/rubric.ts — what a good explanation of a sub-topic must contain.
 *
 * "למד את הבוט" asks the student to TEACH. To grade that we need to know what
 * a correct explanation covers — and that already exists in the content layer:
 * every sub-topic carries `keyPoints`, which by house rule (STYLE_GUIDE rule 7)
 * are "triggers and traps, not a restatement of the formulas". That is exactly
 * the checklist a good explanation has to hit, so the rubric needs ZERO new
 * authoring — it is derived, not written.
 *
 * That derivation is also what keeps the feature cheap: the model is handed a
 * short closed list of ids and only has to say which ones the student covered,
 * instead of reasoning from scratch about mathematical completeness.
 *
 * Pure functions — no Anthropic call, no storage. Imported by the API route
 * (to build the prompt), by the client (to render the live checklist), and by
 * scripts/verify-teach.ts.
 */

import { getSubTopic, getLesson } from '@/content/lessons';

/** Where a rubric point came from. Shown as a small label in the UI. */
export type RubricPointKind = 'keypoint' | 'pitfall';

export type RubricPoint = {
  /** Stable within a sub-topic (`kp-0`, `pf-1`). The model echoes these back,
   *  and they are persisted in the mistake record — never renumber them. */
  id: string;
  /** Hebrew + LaTeX, straight from the authored content. */
  text: string;
  kind: RubricPointKind;
};

export type Rubric = {
  subject: string;
  topic: string;
  subTopicId: string;
  /** Sub-topic title — what the student is being asked to teach. */
  title: string;
  tagline: string;
  points: RubricPoint[];
  /** Topic-level pitfalls NOT used as scored points. The confused-classmate
   *  persona draws on these to ask authentic wrong-headed questions; the
   *  student is never marked down for skipping one, because they belong to the
   *  whole topic rather than to this sub-topic. */
  traps: string[];
};

/** Minimum points for a sub-topic to be teachable. Below this the checklist is
 *  too thin to give the student meaningful feedback, so `/teach` hides it and
 *  `verify-teach` names it as authoring work. */
export const MIN_RUBRIC_POINTS = 3;

/** Keeps the prompt small — the whole rubric block stays a few hundred tokens.
 *  A keyPoint longer than this is a paragraph, not a checklist item. */
const MAX_POINT_CHARS = 300;
const MAX_TRAPS = 4;

function clean(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().slice(0, MAX_POINT_CHARS) : '';
}

/**
 * The rubric for one sub-topic, or null if the sub-topic doesn't exist.
 *
 * Points come from `keyPoints`. If a sub-topic has fewer than MIN_RUBRIC_POINTS
 * of them, we top up from the topic's `pitfalls` rather than returning a stub —
 * a thin-but-real checklist still teaches, and `verify-teach` reports which
 * sub-topics needed the top-up so the gap is visible instead of silent.
 */
export function buildRubric(
  subject: string,
  topic: string,
  subTopicId: string,
): Rubric | null {
  const sub = getSubTopic(subject, topic, subTopicId);
  if (!sub) return null;

  const pitfalls = (getLesson(subject, topic)?.pitfalls ?? [])
    .map(clean)
    .filter(Boolean);

  const points: RubricPoint[] = (sub.keyPoints ?? [])
    .map(clean)
    .filter(Boolean)
    .map((text, i) => ({ id: `kp-${i}`, text, kind: 'keypoint' as const }));

  // Top-up, in order, until the floor is met. Pitfalls used here are scored;
  // the rest stay in `traps` for the persona only.
  let topUp = 0;
  while (points.length < MIN_RUBRIC_POINTS && topUp < pitfalls.length) {
    points.push({ id: `pf-${topUp}`, text: pitfalls[topUp], kind: 'pitfall' });
    topUp += 1;
  }

  return {
    subject,
    topic,
    subTopicId,
    title: sub.title,
    tagline: sub.tagline,
    points,
    traps: pitfalls.slice(topUp, topUp + MAX_TRAPS),
  };
}

/** True iff this sub-topic has enough authored material to teach against. */
export function isTeachable(subject: string, topic: string, subTopicId: string): boolean {
  const r = buildRubric(subject, topic, subTopicId);
  return !!r && r.points.length >= MIN_RUBRIC_POINTS;
}

/**
 * Deep link into `/teach` for a sub-topic, or undefined when there isn't enough
 * authored material to teach against.
 *
 * Returning undefined rather than a dead link is the point: callers spread it
 * straight into an optional prop, so an un-teachable sub-topic simply never
 * offers the button instead of offering one that lands on an error.
 */
export function teachHref(
  subject: string,
  topic: string,
  subTopicId: string,
): string | undefined {
  if (!isTeachable(subject, topic, subTopicId)) return undefined;
  return `/teach?topic=${encodeURIComponent(topic)}&sub=${encodeURIComponent(subTopicId)}`;
}

/** Look up a point by id — used to turn the model's `coveredPointIds` back into
 *  text for the report and the mistake record. */
export function findPoint(rubric: Rubric, id: string): RubricPoint | null {
  return rubric.points.find((p) => p.id === id) ?? null;
}

/**
 * Narrow whatever the model returned onto the closed set of real ids.
 *
 * Structured outputs constrain the SHAPE, not the VALUES — the model can and
 * does return an id that isn't in the list. Dropping unknown ids here means an
 * invented id can never light up a checklist row or suppress a real gap.
 */
export function coerceCoveredIds(rubric: Rubric, raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(rubric.points.map((p) => p.id));
  return Array.from(new Set(raw.filter((id): id is string => typeof id === 'string' && valid.has(id))));
}
