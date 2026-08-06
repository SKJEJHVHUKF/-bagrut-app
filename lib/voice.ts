/**
 * voice.ts — the one place the app talks to the student in its own voice.
 *
 * Scope is deliberately tiny. Most of what "sounds like a private tutor rather
 * than a machine" is already shipped and is not tone at all: 563 authored
 * per-distractor notes explaining the exact wrong idea behind the option you
 * picked, `solution.explanation` under "למה זה עובד", the re-teach card, and the
 * graded help ladder. Those carry the "why it happened and how to improve" half
 * of the brief.
 *
 * What was left is narrower and dumber: the two short reaction lines were
 * string literals, so a student answering forty questions read "בדיוק! כל
 * הכבוד." forty times. Identical repetition is most of what reads robotic.
 *
 * Rules this module follows:
 * - SEEDED, never random. `Math.random()` would differ between the server
 *   render and hydration and re-roll on every re-render, which in this repo is
 *   a known class of bug. `seededOrder` already exists and is already tested,
 *   so the index comes from there rather than from a second hash.
 * - Context it already has, never new state. A repair session knows it is a
 *   repair session because `source` is already a prop — that is enough to say
 *   something a generic drill cannot, at zero plumbing cost.
 * - No praise inflation. A correct answer on the second try is not "מושלם".
 */

import { seededOrder } from '@/lib/shuffle';
import type { ResultSource } from '@/lib/results';

/** Deterministic pick — same seed, same line, on server and client alike. */
function pick(lines: string[], seed: string): string {
  if (lines.length === 0) return '';
  return lines[seededOrder(lines.length, seed)[0]];
}

const CORRECT = [
  'בדיוק. ככה זה נראה.',
  'נכון — וזה בדיוק המהלך.',
  'יפה. זה היה מדויק.',
  'כן. הלכת ישר לעניין.',
  'מצוין — הבנת מה השאלה מבקשת.',
];

/** Second try. Still correct, but "מושלם" would be a lie they can feel. */
const CORRECT_RETRY = [
  'עכשיו כן. זה נתפס.',
  'הפעם זה יצא — וזה מה שחשוב.',
  'נכון. הניסיון השני עשה את העבודה.',
];

/** Inside a repair path: this is the thing that broke, and it just worked. */
const CORRECT_FIX = [
  'זה בדיוק מה שנשבר קודם — ועכשיו זה עובד.',
  'הנה ההבדל. את זה לא ידעת לפני חצי שעה.',
  'נכון, ובדיוק בנקודה שנפלת בה.',
];

const WRONG = [
  'לא נורא — בוא נראה מאיפה זה הגיע:',
  'זה קורה. הנה מה שהיה צריך לקרות:',
  'טעות שווה יותר מניחוש נכון. הנה הפתרון:',
  'בסדר גמור — נפרק את זה שלב-שלב:',
  'כאן זה נשבר. בוא נראה איפה בדיוק:',
];

export type VoiceContext = {
  source?: ResultSource;
  /** False when the student needed a second attempt. */
  firstTry?: boolean;
};

/** The line shown when the student gets it right. */
export function voiceCorrect(seed: string, ctx: VoiceContext = {}): string {
  if (ctx.source === 'fix') return pick(CORRECT_FIX, seed);
  if (ctx.firstTry === false) return pick(CORRECT_RETRY, seed);
  return pick(CORRECT, seed);
}

/** The line shown above the worked solution after a wrong answer. */
export function voiceWrong(seed: string): string {
  return pick(WRONG, seed);
}

/** Exported for the gate: every bank must stay non-empty and duplicate-free. */
export const VOICE_BANKS = { CORRECT, CORRECT_RETRY, CORRECT_FIX, WRONG };
