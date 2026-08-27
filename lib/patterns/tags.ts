/**
 * patterns/tags.ts — the cross-topic vocabulary of mistakes.
 *
 * ============================================================
 * WHY A SECOND VOCABULARY EXISTS
 * ============================================================
 * The app already has `ErrorCategory` in `lib/mistakes` ("טעות סימן", "תחום
 * הגדרה", …). It is not usable for this feature, and the reason is not
 * cosmetic: the ONLY code path that ever sets a category to something other
 * than 'אחר' is an API call (`/api/why-wrong`, `/api/analyze-solution`,
 * `/api/check-answer`). Every other caller writes `category: 'אחר'`. So for a
 * student who never opens the AI tutor — which is most of a free session — the
 * error notebook is a list of untyped misses, and any claim built on it would
 * be a claim about who talks to the tutor, not about who makes which mistake.
 *
 * The owner's requirement was explicit: the student must see where their
 * mistakes repeat WITHOUT reporting anything. That forces the signal to be
 * something the app already observes on its own. Two such signals exist:
 *
 *   1 · `ResultEvent.chosenIndex` — WHICH wrong option was clicked. For a
 *       generated question the template declares what each distractor means
 *       (`GenTemplate.distractorTags`), so a click is a labelled observation.
 *   2 · `ResultEvent.answerDiagnosis` — the SHAPE of a wrong typed answer, as
 *       `lib/answer-check` derived it. Available on every open question in the
 *       app with an `expected` spec, in every topic, at no cost.
 *
 * ============================================================
 * WHAT MAKES A TAG A TAG
 * ============================================================
 * A tag earns its place only if the SAME mistake can occur in more than one
 * topic. That is the entire product claim of the report — "this keeps coming
 * back, across subjects" — and a tag that can only fire inside one topic would
 * dress a local weakness up as a pattern. `lib/remediation` already handles
 * local weaknesses, and handles them better.
 *
 * The list is closed and small on purpose. An open string would drift into
 * synonyms and split one tally into three, which is the failure mode that makes
 * a report look thorough and say nothing.
 */

export type ErrorTag =
  | 'index-offset'
  | 'formula-mismatch'
  | 'complement-skipped'
  | 'sample-space'
  | 'dropped-factor'
  | 'operation-swap'
  | 'exponent-slip'
  | 'sign-slip'
  | 'condition-ignored'
  | 'values-swapped'
  | 'partial-answer';

export type TagInfo = {
  /** Student-facing name. A noun phrase they would recognise in their own work. */
  label: string;
  /** One sentence naming what the mistake LOOKS like, not what it is called. */
  detail: string;
  /** One concrete habit that prevents it. Actionable, not encouragement. */
  fix: string;
};

export const TAG_INFO: Record<ErrorTag, TagInfo> = {
  'index-offset': {
    label: 'הסחה במקום של האיבר',
    detail: 'החזקה או המכפלה מקבלות $n$ במקום $n-1$, או עצירה איבר אחד לפני המבוקש.',
    fix: 'לפני ההצבה, ספור צעדים ולא איברים: מהאיבר הראשון אל האיבר שבמקום $n$ יש $n-1$ צעדים.',
  },
  'formula-mismatch': {
    label: 'נוסחה שאינה מתאימה לשאלה',
    detail: 'החישוב עצמו תקין, אבל הנוסחה שנבחרה עונה על שאלה אחרת מזו שנשאלה.',
    fix: 'לפני החישוב, כתוב במילים מה בדיוק מבוקש. שורת ה**הכלל:** בכל פתרון באפליקציה עושה בדיוק את זה.',
  },
  'complement-skipped': {
    label: 'עצירה על המאורע המשלים',
    detail: 'ההסתברות של ההפך חושבה נכון, והחיסור מ-$1$ לא בוצע.',
    fix: 'כשבשאלה מופיע "לפחות" או "לפחות אחד", סמן לעצמך שהתשובה מסתיימת בחיסור מ-$1$.',
  },
  'sample-space': {
    label: 'מכנה שגוי בהסתברות',
    detail: 'המונה נכון, אבל החלוקה נעשית בקבוצה הלא נכונה — סך הכול במקום מרחב מצומצם, או להפך.',
    fix: 'לפני החלוקה, אמור בקול מי בכלל נספר כאן. נתון שמאורע כבר קרה מחליף את המכנה.',
  },
  'dropped-factor': {
    label: 'רכיב שנשמט מהנוסחה',
    detail: 'הנוסחה הנכונה נבחרה, אבל אחד הגורמים שבה נעלם בדרך — מקדם, חלוקה בשניים, או האיבר הראשון.',
    fix: 'כתוב את הנוסחה במלואה לפני שאתה מציב בה מספרים, ורק אז החלף כל אות בערך שלה.',
  },
  'operation-swap': {
    label: 'פעולה מוחלפת',
    detail: 'חיבור במקום הכפלה, או הפרש במקום יחס — הפעולה שמתאימה למבנה הוחלפה בשכנה שלה.',
    fix: 'שאל אם המעבר בין השלבים מוסיף או מכפיל. סדרה חשבונית מוסיפה, הנדסית מכפילה, ובעץ הסתברויות מכפילים לאורך ענף ומחברים בין ענפים.',
  },
  'exponent-slip': {
    label: 'חזקה שגויה',
    detail: 'הבסיס נכון והמעריך לא — לרוב מספר הצעדים, מספר ההצלחות או מספר הכישלונות התחלפו.',
    fix: 'בדוק שסכום המעריכים מתאים לגודל שבשאלה: בבינומית הוא תמיד מספר הניסויים.',
  },
  'sign-slip': {
    label: 'טעות סימן',
    detail: 'התשובה נכונה בערכה המוחלט והסימן הפוך, או שמינוס בתוך סוגריים אבד בדרך.',
    fix: 'כשמציבים ערך שלילי, השאר אותו בסוגריים לאורך כל השורה ופתח אותם רק בסוף.',
  },
  'condition-ignored': {
    label: 'תנאי שלא נבדק',
    detail: 'הפתרון בוצע בלי לבדוק את התנאי שמאפשר אותו — התכנסות, החזרה, תחום הגדרה או פסילת פתרון.',
    fix: 'לפני ההצבה, כתוב את התנאי בשורה נפרדת. אחרי הפתרון, חזור אליו ובדוק כל פתרון מולו.',
  },
  'values-swapped': {
    label: 'ערכים נכונים במקומות מוחלפים',
    detail: 'כל הערכים חושבו נכון, והם הוצבו בתשובה בסדר הפוך.',
    fix: 'לפני שאתה כותב את התשובה, סמן ליד כל מספר איזו אות הוא. $d$ ו-$a_1$ מתחלפים בדיוק כשלא עושים את זה.',
  },
  'partial-answer': {
    label: 'תשובה חלקית',
    detail: 'החישוב נעצר בשלב ביניים נכון, או שרק חלק מהפתרונות המבוקשים נמצאו.',
    fix: 'חזור לניסוח השאלה אחרי שקיבלת מספר, ובדוק שהמספר הזה הוא מה שנשאלת עליו.',
  },
};

export const ALL_TAGS = Object.keys(TAG_INFO) as ErrorTag[];

export function tagLabel(tag: ErrorTag): string {
  return TAG_INFO[tag].label;
}
