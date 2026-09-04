/**
 * tutor-exam-meta.ts — "will this be on the bagrut?", answered from the
 * curriculum table instead of from a model.
 *
 * WHY THIS IS NOT A FAQ ENTRY
 * ---------------------------
 * These questions have EXACT answers that already exist as data.
 * `content/bagrut-curriculum.ts` records, per topic, how often it appears in
 * real exams (`appearsIn`), what it is typically worth (`typicalPoints`), how
 * it is examined (`examStyle`) and which שאלון it belongs to. A model asked
 * "כמה נקודות זה שווה" would produce a plausible number; the table produces
 * the right one, and it is the same number /roadmap and /insights already show
 * the student elsewhere. Two sources for one fact is how they start to differ.
 *
 * MEASURED (scripts/sim-tutor-session.ts): three of every twelve remaining
 * paid turns in a deep-dive session were these, and none of them needed a
 * word written by anyone.
 */

import { getTopicMapping, paperLabel } from '@/content/bagrut-curriculum';

/** Does it come up in the exam, and in which שאלון. */
const APPEARS = /יבוא\s*בבגרות|יופיע\s*בבגרות|נשאל\s*בבגרות|בבגרות\?|יש\s*את\s*זה\s*בבגרות|שואלים\s*את\s*זה|חשוב\s*לבגרות|צריך\s*לדעת\s*(?:את\s*)?זה\s*לבגרות|זה\s*בשאלון/;
/** What is it worth. */
const POINTS = /כמה\s*זה\s*שווה|כמה\s*אחוז(?:ים)?\s*מהציון|שווה\s*הרבה/;
/**
 * "כמה נקודות" is exam scoring ONLY next to a scoring word. Bare, it is at
 * least as often a maths question — "כמה נקודות חיתוך יש עם ציר y", "כמה
 * נקודות קיצון יש לפונקציה" — and a student asking one was told what the
 * topic is worth in the bagrut (found by scripts/measure-faq-intercept.ts,
 * 2026-09-04). Boundaries are explicit whitespace, not \b: JS \b does not
 * see Hebrew letters as word characters.
 */
const HOW_MANY_POINTS = /כמה\s*נקודות/;
const SCORING =
  /(?:^|\s)(?:זה|שווה|מקבלים|נותנים|ניקוד|ציון|בציון|בגרות|בבגרות|בשאלון|בשאלה|השאלה|הסעיף|סעיף|הנושא)(?=\s|$|[?!.,])/;

function asksPoints(message: string): boolean {
  return POINTS.test(message) || (HOW_MANY_POINTS.test(message) && SCORING.test(message));
}
/** How is it examined — "is it always like this". */
const STYLE = /תמיד\s*ככה|איך\s*(?:זה\s*)?(?:נשאל|שואלים)|באיזה\s*אופן\s*שואלים|איך\s*נראית\s*שאלה|מה\s*הסגנון/;

/**
 * An exact answer about the exam, or null.
 *
 * Every reply ends with one next move, opens on a Hebrew word, and states only
 * what the table says — no estimates, no encouragement dressed as fact.
 */
export function examMetaAnswer(message: string, topic: string | undefined): string | null {
  if (!topic) return null;
  const t = getTopicMapping(topic);
  if (!t) return null;

  const paper = `שאלון ${t.paper}${t.alsoIn ? ` (ומופיע גם ב-${t.alsoIn})` : ''}`;

  if (asksPoints(message)) {
    return (
      `לפי הבגרויות האחרונות, שאלה ב${t.displayName} שווה בדרך כלל ${t.typicalPoints} נקודות, ` +
      `והנושא מופיע ${t.appearsIn}. שאלה מלאה בבגרות היא 20–25 נקודות, אז זה משקל אמיתי.\n\n` +
      'רוצה לראות איך נראית שאלת בגרות מלאה בנושא?'
    );
  }

  if (APPEARS.test(message)) {
    return (
      `כן — ${t.displayName} נמצא ב${paper}, ומופיע ${t.appearsIn}, בדרך כלל ${t.typicalPoints} נקודות.\n\n` +
      `${t.examStyle}\n\nרוצה לתרגל בדיוק את הסגנון הזה?`
    );
  }

  if (STYLE.test(message)) {
    return (
      `ככה הנושא הזה נשאל בפועל: ${t.examStyle}\n\n` +
      `הוא ב${paper} ומופיע ${t.appearsIn}. מה מהחלקים האלה הכי פחות ברור לך?`
    );
  }

  // Which paper is this topic in — asked constantly around exam time.
  if (/איזה\s*שאלון|באיזה\s*שאלון|שאלון\s*כמה/.test(message)) {
    return `הנושא הזה שייך ל${paperLabel(t.paper)}${t.alsoIn ? `, ומופיע גם ב-${t.alsoIn}` : ''}. רוצה לראות מה עוד יש בשאלון הזה?`;
  }

  return null;
}
