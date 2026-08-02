/**
 * teach/rubric.ts — what a good explanation of a sub-topic must contain.
 *
 * ⚠️ THE POINTS COME FROM `lesson[].title`, NOT FROM `keyPoints`.
 *
 * The first version of this file scored the student against `keyPoints`, and
 * that was wrong at the root. STYLE_GUIDE rule 7 forbids a keyPoint from
 * restating the definition or the formula — every bullet must be
 * "מתי זה נדלק / מה זה חוסך / מה המלכודת". So keyPoints are exam TRIGGERS AND
 * TRAPS, and a checklist built from them can never ask the student for the
 * actual content of an explanation. For מכפלה סקלרית the scored points were
 * "the words that trigger a dot product", "what the sign tells you" and two
 * traps — while what a dot product *is* and both formulas were never asked for.
 * A student could give a genuinely good beginner explanation and be marked
 * against a list that never requested it.
 *
 * The guided lesson's step titles are the right source: they are, in order, the
 * shape of a correct explanation of the sub-topic — "מה נותנת מכפלה סקלרית?" →
 * "הנוסחה הקואורדינטית" → "מבחן הניצבות" → "הזווית בין שני וקטורים". All 58
 * sub-topics have at least 4 of them, so this still needs ZERO new authoring.
 *
 * `keyPoints` and `pitfalls` are still used — as `traps`, the unscored material
 * the confused-classmate persona draws on to ask authentic wrong-headed
 * questions. That is what they were written for.
 *
 * Pure functions — no Anthropic call, no storage. Imported by the API route
 * (to build the prompt), by the client (to render the checklist), and by
 * scripts/verify-teach.ts.
 */

import { getSubTopic, getLesson } from '@/content/lessons';

export type RubricPoint = {
  /** Stable within a sub-topic (`st-0`, `st-1`). The model echoes these back —
   *  never renumber them. */
  id: string;
  /** Hebrew + LaTeX, from the guided lesson's step title. */
  text: string;
};

export type Rubric = {
  subject: string;
  topic: string;
  subTopicId: string;
  /** Sub-topic title — what the student is being asked to teach. */
  title: string;
  tagline: string;
  points: RubricPoint[];
  /** UNSCORED material for the persona only: the sub-topic's `keyPoints` (exam
   *  triggers and traps) plus the topic's `pitfalls`. נועה uses these to ask
   *  authentic wrong-headed questions and to "fall into" a classic mistake on
   *  purpose. The student is never marked down for not mentioning one. */
  traps: string[];
};

/** Minimum points for a sub-topic to be teachable. Below this the checklist is
 *  too thin to give the student meaningful feedback, so `/teach` hides it and
 *  `verify-teach` names it as authoring work. */
export const MIN_RUBRIC_POINTS = 3;

/**
 * Cap on scored points. A session allows TEACH_MAX_TURNS explanations, so a
 * rubric longer than this is unfinishable by construction — the student would
 * be told they "missed" points they were never given a turn to reach.
 */
const MAX_POINTS = 5;

/** Keeps the prompt small — the whole rubric block stays a few hundred tokens. */
const MAX_POINT_CHARS = 300;
/** keyPoints run long (~200 chars each), and every trap is re-sent on every
 *  turn. Three is enough ammunition for a 5-turn confusion arc. */
const MAX_TRAPS = 3;

function clean(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().slice(0, MAX_POINT_CHARS) : '';
}

/**
 * Lesson step titles are authored for a numbered walkthrough, so many open with
 * a "צעד 3 — " ordinal. That prefix is navigation, not content: as a rubric row
 * it reads like an instruction to the student rather than a thing to explain.
 */
function stripStepOrdinal(title: string): string {
  return title.replace(/^\s*צעד\s*\d+\s*[—–-]\s*/, '').trim();
}

/** Content words of a string, for detecting that a trap restates a scored
 *  point. Strips LaTeX and Hebrew function words so the comparison is about
 *  mathematical content rather than phrasing. */
function significantWords(s: string): Set<string> {
  const STOP = new Set([
    'של', 'את', 'עם', 'על', 'אם', 'כי', 'זה', 'הוא', 'היא', 'יש', 'אין', 'לא',
    'כל', 'או', 'גם', 'רק', 'אבל', 'כדי', 'בין', 'תמיד', 'לכן', 'מה', 'הם',
  ]);
  return new Set(
    s
      .replace(/\$[^$]*\$/g, ' ')
      .replace(/[^֐-׿a-zA-Z ]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/**
 * The rubric for one sub-topic, or null if the sub-topic doesn't exist.
 *
 * Points are the guided lesson's step titles, in order — the shape of a correct
 * explanation. keyPoints and pitfalls become unscored `traps`.
 */
export function buildRubric(
  subject: string,
  topic: string,
  subTopicId: string,
): Rubric | null {
  const sub = getSubTopic(subject, topic, subTopicId);
  if (!sub) return null;

  const points: RubricPoint[] = (sub.lesson ?? [])
    .map((step) => clean(stripStepOrdinal(step.title)))
    .filter(Boolean)
    .slice(0, MAX_POINTS)
    .map((text, i) => ({ id: `st-${i}`, text }));

  // Traps must not hand over a scored point. keyPoints are trigger/trap-shaped
  // but several of them ARE the correct resolution of a lesson step — for
  // gauss-loci the keyPoints spell out exactly the three loci the rubric scores.
  // נועה is told to voice trap material, so an overlapping trap is a free point.
  const pointWords = points.map((p) => significantWords(p.text));
  const leaksAPoint = (trap: string) => {
    const t = significantWords(trap);
    return pointWords.some((pw) => {
      if (!pw.size) return false;
      let shared = 0;
      for (const w of pw) if (t.has(w)) shared += 1;
      return shared / pw.size >= 0.6;
    });
  };

  // Interleaved, not concatenated: keyPoints alone always filled MAX_TRAPS, so
  // the topic's `pitfalls` were unreachable in all 58 sub-topics.
  const keyPoints = (sub.keyPoints ?? []).map(clean).filter(Boolean);
  const pitfalls = (getLesson(subject, topic)?.pitfalls ?? []).map(clean).filter(Boolean);
  const traps: string[] = [];
  for (let i = 0; traps.length < MAX_TRAPS && (i < keyPoints.length || i < pitfalls.length); i++) {
    for (const candidate of [keyPoints[i], pitfalls[i]]) {
      if (traps.length >= MAX_TRAPS) break;
      if (candidate && !leaksAPoint(candidate)) traps.push(candidate);
    }
  }

  return {
    subject,
    topic,
    subTopicId,
    title: sub.title,
    tagline: sub.tagline,
    points,
    traps,
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
