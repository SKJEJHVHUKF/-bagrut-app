/**
 * error-coach.ts — turning a detected mistake SHAPE into a sentence a tutor
 * would say.
 *
 * ============================================================
 * WHAT IS ACTUALLY DETECTED, AND WHAT IS NOT
 * ============================================================
 * `lib/answer-check.ts` reports a diagnosis only when the shape of the
 * difference names the mistake by itself. It detects five things, and it
 * detects them with certainty rather than probability:
 *
 *   sign-flip     the value is right and the sign is not
 *   conjugate     a complex answer with the imaginary part negated
 *   partial-set   a subset of the roots, all of them correct
 *   extra-root    every correct root, plus one that is not
 *   swapped       labelled boxes whose values are right and exchanged
 *
 * The brief also names domain_error, substitution_error, wrong_formula and
 * arithmetic_error. NOTHING IN THIS CODEBASE DETECTS THOSE. They cannot be
 * told apart from "the answer is simply wrong" by comparing two values —
 * distinguishing them needs the student's WORKING, which the tutor never sees.
 *
 * They are present in the type as names the pipeline may one day supply, and
 * every one of them is served the neutral wording until something real
 * produces them. Writing "נראה שהצבת לא נכון" from a value mismatch would be
 * telling a student what they did wrong on the strength of a guess, and a
 * tutor that guesses at your mistakes is worse than one that admits it cannot
 * see them.
 */

import type { AnswerDiagnosis } from '@/lib/answer-check';

export type MistakeKind =
  // Detected today, by the shape of the difference.
  | 'sign_error'
  | 'conjugate_error'
  | 'partial_solution'
  | 'extraneous_root'
  | 'swapped_values'
  | 'known_mistake'
  | 'rounding_error'
  // Named in the brief; NOT detected. Served neutrally on purpose.
  | 'domain_error'
  | 'substitution_error'
  | 'wrong_formula'
  | 'arithmetic_error'
  | 'unknown_error';

/** The five the checker really produces, plus the two this app added. */
const FROM_DIAGNOSIS: Record<AnswerDiagnosis['kind'], MistakeKind> = {
  'sign-flip': 'sign_error',
  conjugate: 'conjugate_error',
  'partial-set': 'partial_solution',
  'extra-root': 'extraneous_root',
  swapped: 'swapped_values',
  'known-mistake': 'known_mistake',
};

export function mistakeKindOf(diagnosis: AnswerDiagnosis | undefined | null): MistakeKind {
  if (!diagnosis) return 'unknown_error';
  return FROM_DIAGNOSIS[diagnosis.kind] ?? 'unknown_error';
}

export type CoachedMistake = {
  kind: MistakeKind;
  message: string;
  /** False for every kind we did not actually detect. A caller may use it to
   *  decide whether to show the line at all. */
  detected: boolean;
};

/**
 * ⚠️ Every message names the mistake WITHOUT naming the student.
 *
 * "טעית" and "לא הבנת" are absent by design. The wording says what happened to
 * the answer, then hands back one move — the same shape the local templates
 * use, so a student cannot tell which layer is speaking.
 *
 * `{typed}` is the student's raw keyboard input and is always fenced by the
 * caller: a lone `$` opens a maths span that swallows the rest of the Hebrew.
 */
const WORDING: Record<MistakeKind, { text: string; detected: boolean }> = {
  sign_error: {
    text: 'הערך שקיבלת נכון, והסימן הפוך. זה כמעט תמיד קורה במעבר אגף אחד, או בכפל במספר שלילי ששוכחים שהוא הופך את הסימן. תעבור על השורה שבה הסימן התחלף ותגיד לי מה קרה שם.',
    detected: true,
  },
  conjugate_error: {
    text: 'החלק הממשי נכון, והחלק המדומה יצא עם סימן הפוך. זה הצמוד של התשובה, ולא התשובה עצמה. בדוק את הסימן שהצבת בשורש של הדיסקרימיננטה.',
    detected: true,
  },
  partial_solution: {
    text: 'מה שכתבת נכון, ויש עוד. משוואה מהסוג הזה מחזירה יותר מפתרון אחד, ואתה הבאת חלק מהם. תחזור לשלב שבו חילצת את הפתרונות ותבדוק כמה יצאו שם.',
    detected: true,
  },
  extraneous_root: {
    text: 'כל הפתרונות הנכונים נמצאים אצלך, ונוסף אחד שאינו מתאים. זה קורה כשמעלים בריבוע או מכפילים במכנה, ואז נוצר פתרון שאינו מקיים את המשוואה המקורית. הצב כל אחד מהם בחזרה ותראה איזה נופל.',
    detected: true,
  },
  swapped_values: {
    text: 'שני הערכים נכונים, והם החליפו מקומות. תקרא שוב מה השאלה מבקשת ראשון ומה שני, ותגיד לי איזה מהם צריך לשבת בתיבה הראשונה.',
    detected: true,
  },
  known_mistake: {
    text: 'התשובה הזאת מוכרת לנו, וכתוב עליה הסבר בשאלה עצמה. תקרא אותו ותגיד לי אם הוא מסביר מה קרה אצלך.',
    detected: true,
  },
  rounding_error: {
    text: 'הדרך שלך נכונה, והתשובה עוגלה מוקדם מדי. תשמור את הערך המדויק עד הסוף ותעגל רק בשורה האחרונה.',
    detected: true,
  },

  // ---- named in the brief, not detected by anything here ----
  domain_error: { text: '', detected: false },
  substitution_error: { text: '', detected: false },
  wrong_formula: { text: '', detected: false },
  arithmetic_error: { text: '', detected: false },
  unknown_error: { text: '', detected: false },
};

/**
 * The neutral wording, used whenever the mistake was not actually identified.
 *
 * It says what is true — the answer does not match — and asks rather than
 * accuses. This is the branch the four undetected kinds always take, and it
 * must stay the honest one: it is served far more often than any of the
 * specific lines.
 */
const NEUTRAL =
  'התשובה שקיבלת אינה מסתדרת עם הפתרון, ואיני רואה את הדרך שבה הגעת אליה, אז לא אנחש היכן זה נפרד. תכתוב לי את השורה האחרונה שעשית ונמצא את זה יחד.';

export function coachMistake(
  diagnosis: AnswerDiagnosis | undefined | null,
  override?: MistakeKind,
): CoachedMistake {
  const kind = override ?? mistakeKindOf(diagnosis);
  const w = WORDING[kind];
  return w?.detected
    ? { kind, message: w.text, detected: true }
    : { kind, message: NEUTRAL, detected: false };
}

/** The kinds that carry a specific, authored line today. */
export const DETECTED_KINDS = (Object.keys(WORDING) as MistakeKind[]).filter(
  (k) => WORDING[k].detected,
);
