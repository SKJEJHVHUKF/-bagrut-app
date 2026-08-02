/**
 * cognition/insight.ts — the one Hebrew sentence.
 *
 * Templates, not a model. Every fact in the output already exists as a number
 * in the state, so a template is both cheaper and more trustworthy than a
 * generated sentence: it cannot hallucinate a count, and it cannot soften a
 * finding into meaninglessness.
 *
 * The most important behaviour in this file is returning `null`. A tool that
 * always has something profound to say about a student who answered four
 * questions is a horoscope. Below the evidence thresholds it says nothing, and
 * the UI is expected to show nothing.
 *
 * Hebrew prose only — never inside `$...$` (KaTeX has no bidi). Skill titles
 * may carry inline math; the Hebrew always stays outside it.
 */

import { MIN_CONFIDENCE } from './trace';
import type { MisconceptionState, SkillMastery, WeakestLink } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** Below this many observations on a topic we do not claim to know anything. */
export const MIN_OBSERVATIONS_FOR_INSIGHT = 6;
/** A misconception needs at least this many hits before it is named. */
export const MIN_HITS_TO_NAME = 2;

/**
 * Attach a one-letter preposition (ב־ / ל־) to a skill title.
 *
 * Hebrew merges the prefix with the definite article: ב + ההצגה is *בהצגה*,
 * not *בההצגה*. Most catalog titles are definite ("הגודל", "הארגומנט",
 * "ההצגה הקוטבית"), so a naive concatenation misspells nearly every sentence
 * this file produces. A title that opens with math takes a maqaf instead —
 * house style throughout the content is `ל-$r\,\text{cis}\,\theta$`.
 */
export function hePrefix(prefix: 'ב' | 'ל', title: string): string {
  if (title.startsWith('$')) return `${prefix}-${title}`;
  if (title.startsWith('ה') && title.length > 1) return `${prefix}${title.slice(1)}`;
  return `${prefix}${title}`;
}

export type InsightInput = {
  weakestLink: WeakestLink | null;
  misconceptions: MisconceptionState[];
  skills: SkillMastery[];
  totalObservations: number;
  now: number;
};

/**
 * Priority order matters: a prerequisite break explains the misconceptions
 * above it, so it is reported first. Naming a symptom while its cause is known
 * would send the student to drill the wrong thing.
 */
export function buildInsight(input: InsightInput): string | null {
  const { weakestLink, misconceptions, skills, totalObservations, now } = input;

  if (totalObservations < MIN_OBSERVATIONS_FOR_INSIGHT) return null;

  // 1 · The prerequisite break — the headline claim.
  if (weakestLink) {
    const root = skills.find((s) => s.skillId === weakestLink.rootSkill);
    // `p` is P(the skill is known) — deliberately NOT called "ביטחון" here, to
    // keep it distinct from `confidence`, which measures how much evidence we
    // have rather than how well the student is doing.
    const evidence = root
      ? `${root.observations} ניסיונות שם, ורמת השליטה המשוערת עומדת על ${Math.round(root.p * 100)}%.`
      : 'שם עדיין לא יציב.';
    return `הבעיה שלך היא לא ${hePrefix('ב', weakestLink.childTitle)}, אלא ${hePrefix('ב', weakestLink.rootTitle)} שלפניו — ${evidence}`;
  }

  // 2 · A live, named misconception with enough hits behind it.
  const named = misconceptions.find(
    (m) => m.status === 'active' && m.hits >= MIN_HITS_TO_NAME,
  );
  if (named) {
    return `${named.insight} זה קרה ב-${named.hits} מתוך ${named.opportunities} הפעמים שנתקלת בזה.`;
  }

  // 3 · A skill that is genuinely not holding, with enough evidence to say so.
  const fragile = skills
    .filter((s) => s.state === 'fragile' && s.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => a.p - b.p)[0];
  if (fragile) {
    const trend =
      fragile.trend === 'up'
        ? ' אתה בכיוון הנכון — התשובות האחרונות טובות מהקודמות.'
        : '';
    return `${fragile.title} עדיין לא יושב — ${fragile.observations} ניסיונות ועדיין לא יציב.${trend}`;
  }

  // 4 · Something solid that has faded.
  const stale = skills
    .filter((s) => s.observations >= 3 && s.lastTs > 0 && now - s.lastTs > 21 * DAY)
    .sort((a, b) => a.lastTs - b.lastTs)[0];
  if (stale) {
    const days = Math.round((now - stale.lastTs) / DAY);
    return `לא נגעת ${hePrefix('ב', stale.title)} כבר ${days} ימים. שווה רענון קצר לפני שזה נשחק.`;
  }

  // 5 · Nothing worth saying. Say nothing.
  return null;
}
