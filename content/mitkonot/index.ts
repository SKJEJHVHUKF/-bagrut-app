/**
 * מתכונות לפי רמת קושי — registry + the level metadata the UI reads.
 *
 * Adding a topic: author `content/mitkonot/<topic>.ts` exporting a
 * `MitkonetQuestion[]`, import it here, spread it into ALL_MITKONOT. The
 * /mitkonot hub groups by level on its own, so nothing else needs touching.
 */

import type { MitkonetQuestion, MitkonetLevel } from './types';
import { mitkonotProbability } from './probability';

export const ALL_MITKONOT: MitkonetQuestion[] = [...mitkonotProbability];

/**
 * What each rung MEANS, in the student's words.
 *
 * The blurb is the honest promise, not marketing: a student who picks רמה 3
 * and gets a standard bagrut question stops trusting the ladder, and a student
 * who picks רמה 1 to rebuild confidence must not meet a challenge question.
 */
export const MITKONET_LEVELS: {
  level: MitkonetLevel;
  title: string;
  subtitle: string;
  blurb: string;
  /** Border/dot colour for the level's rail. */
  rail: string;
  /** Chip background + text. */
  chip: string;
}[] = [
  {
    level: 1,
    title: 'רמה 1',
    subtitle: 'קצת יותר קל מרמת בגרות',
    blurb: 'מבנה של שאלת בגרות, עם פחות מהלכים בכל סעיף. כאן בונים ביטחון בנושא.',
    rail: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20',
  },
  {
    level: 2,
    title: 'רמה 2',
    subtitle: 'רמת בגרות סטנדרטית',
    blurb: 'בדיוק מה ששאלון הבגרות שואל, בניסוח שהבוחן משתמש בו. זו רמת המטרה.',
    rail: 'bg-violet-600',
    chip: 'bg-violet-50 text-violet-800 ring-1 ring-violet-600/20',
  },
  {
    level: 3,
    title: 'רמה 3',
    subtitle: 'שאלת אתגר, מעל רמת בגרות',
    blurb: 'צעד אחד מעל הבחינה. מי שפותר את זה נכנס למבחן בלי הפתעות.',
    rail: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-900 ring-1 ring-amber-600/20',
  },
];

export function getMitkonetById(id: string): MitkonetQuestion | null {
  return ALL_MITKONOT.find((q) => q.id === id) ?? null;
}

export function getMitkonotByLevel(level: MitkonetLevel): MitkonetQuestion[] {
  return ALL_MITKONOT.filter((q) => q.level === level);
}

export function mitkonotTopics(): string[] {
  return Array.from(new Set(ALL_MITKONOT.map((q) => q.topic))).sort();
}

/** Sub-parts across the whole bank — the count that answers "how much is here?"
 *  honestly. Three questions with four parts each is twelve graded answers, and
 *  saying "3 מתכונות" undersells it in exactly the wrong direction. */
export function totalMitkonetParts(): number {
  return ALL_MITKONOT.reduce((sum, q) => sum + q.parts.length, 0);
}

export type { MitkonetQuestion, MitkonetLevel } from './types';
