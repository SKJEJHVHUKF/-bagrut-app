/**
 * formula-sheet.ts — WHICH formulas belong on the formula sheet.
 *
 * The lessons teach far more formulas than a student looks up while solving:
 * derivations, near-duplicates of the same identity in two notations, and
 * pedagogical mnemonics ("מבנה ההוכחה", "תרגום המבוקש לכלי") that are teaching
 * aids, not reference material. Showing all of them turned the sheet into
 * noise — סדרות alone listed 30 entries, גיאומטריה אוקלידית 28.
 *
 * This file is the curated list: per topic, the formulas a student actually
 * reaches for in a bagrut question, in the order they belong on the sheet.
 * Entries are matched by `Formula.name` against the topic's taught formulas,
 * so the content itself (latex, variables, note) still lives in ONE place —
 * the lesson files. Nothing is duplicated here, only selected and ordered.
 *
 * Matching by name also collapses the near-duplicates for free: the lessons
 * define e.g. "מרחק מנקודה לישר" and "מרחק נקודה-ישר" with identical latex,
 * and the drawer's dedupe (by exact latex) never caught those.
 *
 * NOT here on purpose: congruence/similarity criteria (צ.ז.צ, ז.ז), proof
 * strategy notes, and process reminders. They are taught in the lesson and
 * shown there; they are not sheet formulas. Adding one back is a one-line
 * change — its name, in the topic's list below.
 *
 * A topic with NO entry here falls back to showing everything (fail-open:
 * never hide material from a student because a list wasn't updated).
 * `scripts/check-formula-sheet.ts` reports those, and fails on any name here
 * that no longer resolves after a lesson rename.
 */

import type { Formula } from './lessons/types';

/** Topic (the lesson key) → formula names, in sheet order. */
export const CORE_FORMULAS: Record<string, string[]> = {
  אלגברה: [
    'נוסחת השורשים',
    'דיסקרימיננטה',
    'סכום ומכפלת השורשים (וייטה)',
    'קודקוד פרבולה',
    'נוסחאות הכפל המקוצר',
    'הפרש ריבועים',
    'הפרש וסכום קוביות',
    'פתרון משוואת שורש',
    'ערך מוחלט קטן מ-',
    'ערך מוחלט גדול מ-',
  ],

  סדרות: [
    'איבר כללי — חשבונית',
    'סכום $n$ איברים',
    'הפרש משני איברים',
    'ממוצע חשבוני',
    'כלל נסיגה — סדרה חשבונית',
    'איברים סימטריים',
    'מהסכום אל האיבר',
    'סכום האיברים מהמקום $p$ עד המקום $r$',
    'איבר כללי — הנדסית',
    'סכום $n$ איברים — הנדסית',
    'מנה משני איברים',
    'ממוצע הנדסי',
    'כלל נסיגה — סדרה הנדסית',
    'תנאי התכנסות',
    'סכום אינסופי — הנדסית מתכנסת',
    'ריבית דריבית (צמיחה הנדסית)',
    'עקרון האינדוקציה',
    'סכום המספרים הטבעיים',
    'סכום ריבועים',
  ],

  הסתברות: [
    'הסתברות מותנית',
    'מאורע משלים',
    'אי-תלות',
    'שוליים ותאים',
    'נוסחת ברנולי',
    'מקרי קצה',
    'צירוף',
    'נוסחת בייס',
  ],

  טריגונומטריה: [
    'זהות פיתגורס',
    'נוסחאות סכום וחיסור',
    'נוסחאות כפל-זווית',
    'נוסחאות חצי-זווית (להורדת חזקה)',
    'זוויות צמצום — רבע II',
    'זוויות צמצום — רבע III',
    'זוגיות ואי-זוגיות',
    'צורת R·sin(x+φ)',
    'פתרון כללי לסינוס',
    'פתרון כללי לקוסינוס',
    'משפט הסינוסים (המורחב)',
    'משפט הקוסינוסים',
    'חילוץ זווית משלוש צלעות',
    'שטח משולש',
    'שטח ורדיוס המעגל החוסם',
    'נגזרות טריגונומטריות',
    'אינטגרלים טריגונומטריים',
  ],

  פונקציות: [
    'קודקוד פרבולה',
    'תחום הגדרה — מכנה',
    'תחום הגדרה — שורש ולוגריתם',
    'אסימפטוטה אופקית של פונקציה רציונלית',
    'פונקציה זוגית ואי-זוגית',
    'פונקציה הפכית',
    'חוקי חזקות',
    'חוקי לוגריתמים',
  ],

  'חשבון דיפרנציאלי': [
    'כללי גזירה בסיסיים',
    'נגזרת של מכפלה',
    'נגזרת של מנה',
    'כלל השרשרת',
    'נגזרת של ביטוי הפוך',
    'משוואת המשיק',
    'תנאי קיצון וסיווג',
  ],

  'חשבון אינטגרלי': [
    'אינטגרל של חזקה',
    'אינטגרל של 1/x',
    'אינטגרלים של פונקציות אלמנטריות',
    'אינטגרל עם הצבה לינארית',
    'נוסחת ניוטון-לייבניץ',
    'שטח בין שני גרפים',
    'נפח גוף סיבוב סביב ציר x',
  ],

  'פונקציה מעריכית': [
    'חוקי חזקות',
    'הקשר $a^x$ ו-$e^x$',
    'לקיחת לוגריתם',
    'נגזרת מעריכית',
    'נגזרת בסיס כללי',
    'כלל מכפלה עם $e^x$',
    'הצבה ריבועית מעריכית',
    'אינטגרל מעריכי',
    'אינטגרל בהצבה',
  ],

  'פונקציית ln': [
    'חוקי לוגריתם',
    'הקשר $\\ln$-מעריכי',
    'שינוי בסיס',
    'עליה ל-$e$',
    'הצבה ריבועית',
    'נגזרת לוגריתם',
    'אינטגרל $1/x$',
    "אינטגרל $u'(x)/g(x)$",
    'אינטגרל $\\ln x$ עצמו',
    'גבולות שלעולם לא תשכחו',
  ],

  'גדילה ודעיכה': [
    'מודל גדילה ודעיכה',
    'מציאת קצב $k$ משתי נקודות',
    'מציאת הזמן',
    'חצי-חיים',
    'ריבית רציפה',
    'חוק הצינון של ניוטון',
  ],

  'גאומטריה אנליטית': [
    'מרחק בין שתי נקודות',
    'שיפוע',
    'מרחק מנקודה לישר',
    'משוואת מעגל',
    'משיק בנקודה (מעגל סביב הראשית)',
    'פרבולה קנונית',
    'משיק לפרבולה',
    'אליפסה קנונית',
    'מוקדים',
    'אקסצנטריות',
    'משולש המוקדים',
  ],

  'וקטורים במרחב': [
    'וקטור בין שתי נקודות',
    'אורך וקטור',
    'מכפלה סקלרית',
    'זווית בין וקטורים',
    'מכפלה וקטורית',
    'שטח משולש',
    'ישר פרמטרי במרחב',
    'מישור — צורה כללית',
    'מרחק נקודה-מישור',
    'זווית ישר-מישור',
  ],

  'מספרים מרוכבים': [
    'גודל וארגומנט',
    'מכפלת צמודים',
    'הצגה קוטבית',
    'משפט דה-מואבר',
    'נוסחת השורש ה-$n$-י',
    'שורשי $z^n = 1$',
    'שורש ריבועי של $w$ מרוכב',
    'נוסחת השורשים — עם $\\Delta$ שלילי',
    'משפט וייטה',
    'מרחק במישור גאוס',
    'משוואת מעגל',
  ],

  'גיאומטריה אוקלידית': [
    'משפט פיתגורס',
    'סכום זוויות במצולע',
    'שטחים',
    'שטח משולש',
    'משפט תאלס',
    'משפט קו האמצעים',
    'משפט חוצה הזווית',
    'תיכון ליתר',
    'מפגש התיכונים',
    'יחס דמיון ופרופורציה',
    'דמיון משולשים — יחס שטחים',
    'זווית היקפית ומרכזית',
    'מרובע חסום במעגל',
    'מיתרים מצטלבים',
    'משיק וחותך מנקודה חיצונית',
  ],

  סטטיסטיקה: ['ממוצע וסטיית תקן', 'ציון תקן'],
};

/** The shape this module needs from a lesson — structural, so callers can pass
 *  a Lesson straight through without this file importing the lesson registry. */
type LessonLike = {
  formulas?: Formula[];
  subTopics?: { formulas?: Formula[] }[];
} | null | undefined;

/**
 * The formulas the sheet shows for one topic: everything the lesson and its
 * sub-topics teach, deduped by latex, narrowed to CORE_FORMULAS and ordered by
 * it. Unknown topic → the full taught set (see the fail-open note above).
 */
export function sheetFormulas(lesson: LessonLike, topic: string): Formula[] {
  if (!lesson) return [];

  const seen = new Set<string>();
  const taught: Formula[] = [];
  const push = (f: Formula) => {
    const key = f.latex.trim();
    if (seen.has(key)) return;
    seen.add(key);
    taught.push(f);
  };
  lesson.formulas?.forEach(push);
  lesson.subTopics?.forEach((st) => st.formulas?.forEach(push));

  const names = CORE_FORMULAS[topic];
  if (!names) return taught;

  const out: Formula[] = [];
  for (const name of names) {
    // First match wins: where two sub-topics define the same formula under one
    // name in different notation, the earlier (lesson-level) one is canonical.
    const found = taught.find((f) => f.name === name);
    if (found) out.push(found);
  }
  return out;
}
