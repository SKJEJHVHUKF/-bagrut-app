/**
 * maths-vocabulary.ts — the nouns that name a SUBJECT.
 *
 * One list, two callers, and the same job in both: deciding whether a Hebrew
 * sentence is about the exercise on the screen or about a piece of mathematics
 * in its own right.
 *
 *   lib/tutor-local     "מה הנוסחה?" is this screen · "מה הנוסחה לסכום סדרה
 *                       הנדסית אינסופית" names a subject → the model
 *   lib/analyze-question  "הוכח שהסדרה מתכנסת" has no expression but is
 *                       unmistakably maths → not junk
 *
 * ⚠️ NOUNS ONLY, and that is not a stylistic choice. The instruction verbs are
 * excluded because Hebrew glues them inside ordinary words: חשב sits inside
 * המחשב (the computer) and פתור inside כפתור (button), so including them made
 * "המחשב שלי איטי" read as an arithmetic question.
 *
 * ⚠️ Also excluded: the ASK words themselves — נוסחה, תשובה, פתרון, דוגמה,
 * טבלה. A student saying "מה הנוסחה?" is not naming a subject, they are naming
 * what they want. Putting those here would make every formula ask look like a
 * general question and send all of them to the model.
 *
 * Substring matching, deliberately. Hebrew prepositions are PREFIXES — "לסכום"
 * is ל+סכום with nothing between them — so a rule that expects a space after
 * the preposition misses the commonest form. Measured: an anchored
 * `(?:על|של|ל)\s+` version left "מה הנוסחה לסכום סדרה הנדסית אינסופית" being
 * answered from the sub-topic's formula sheet, 174 times in one census.
 */

/** Kept as one source string so both the list and the regex stay in step. */
const NOUNS = [
  // structures
  'סדרה', 'סדרת', 'סדרות', 'פונקציה', 'פונקציות', 'פונקצית',
  'משוואה', 'משוואות', 'אי שוויון', 'פולינום', 'מטריצה', 'וקטור', 'וקטורים',
  // branches
  'הסתברות', 'סטטיסטיק', 'טריגונומטר', 'גאומטר', 'גיאומטר', 'אלגבר',
  'אינטגרל', 'נגזרת', 'גבול', 'לוגריתם', 'מרוכב',
  // named objects
  'משולש', 'מרובע', 'מלבן', 'טרפז', 'מקבילית', 'מעוין', 'מעגל', 'זווית',
  'פרבולה', 'היפרבולה', 'אליפסה', 'אסימפטוט', 'שיפוע', 'ישר',
  // quantities and named ideas
  'התפלגות', 'תוחלת', 'שכיח', 'חציון', 'ממוצע', 'שונות', 'סטיית תקן',
  'דיסקרימיננט', 'קיצון', 'חשבונית', 'הנדסית', 'מותנית', 'בלתי תלוי',
  'סינוס', 'קוסינוס', 'טנגנס', 'חזקה', 'שורש', 'צמוד', 'ארגומנט',
  'בייס', 'קומבינטורי', 'פרמוטצי', 'התכנסות', 'מתכנסת', 'חסומה',
];

/** Does this sentence NAME a piece of mathematics, rather than point at the
 *  screen? Used to refuse a local answer, so a false positive costs one model
 *  call and a false negative costs a student a wrong answer — which is why the
 *  list leans towards catching. */
export const NAMES_A_MATHS_SUBJECT = new RegExp(NOUNS.join('|'));

export function namesAMathsSubject(text: string): boolean {
  return NAMES_A_MATHS_SUBJECT.test(text);
}

/**
 * A subject the MESSAGE names that the question in front of the student does
 * not mention — the foreign-subject screen.
 *
 * `mentionsForeignNumber` stops another exercise's ARITHMETIC from landing on
 * the screen. This stops another exercise's SUBJECT from doing the same, and
 * it was added after a measurement: "תסביר לי על וקטורים", asked while sitting
 * on a sequences question, matched that question's FAQ entry at 0.77 and would
 * have been served. Nothing about vectors is in the answer, so the number
 * screen could not see it.
 *
 * Returns the offending noun, or null when every subject the student named is
 * one this question is actually about.
 */
export function foreignSubject(message: string, ownText: string): string | null {
  for (const noun of NOUNS) {
    if (message.includes(noun) && !ownText.includes(noun)) return noun;
  }
  return null;
}

export const MATHS_NOUNS = NOUNS;
