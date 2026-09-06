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

// ------------------------------------------------------------
// Operations — the half of the foreign-subject screen that was missing
// ------------------------------------------------------------

/**
 * ⚠️ A STUDENT NAMES AN OPERATION FAR MORE OFTEN THAN HE NAMES A NOUN, AND
 * NOTHING WAS CHECKING IT.
 *
 * `NOUNS` above holds structures and branches — סדרה, נגזרת, משולש. It has no
 * כפל, no חיבור, no חילוק. But "למה מכפילים כאן ולא מחברים" is how a stuck
 * student actually writes, and `lib/tutor-intent` reads that sentence as
 * `why_this_step` from the word למה, THROWS THE VERB AWAY, and the compiler
 * then serves the exercise's own rule line — whatever operation the exercise
 * happens to use.
 *
 * MEASURED (2026-09-07, 438 probes: every operation the exercise demonstrably
 * does NOT use, asked at 25 questions per topic across all 15 topics):
 * **45.9% were answered locally, with confidence, about something else.** A
 * question about multiplication on a factorisation exercise came back
 * "פירוק לגורמים הוא המהיר ביותר כש-a=1"; asking about addition and asking
 * about multiplication returned the identical sentence.
 *
 * Each family lists the words that NAME it and the symbols that PERFORM it,
 * because a solution multiplies with `\cdot` far more often than it writes
 * "מכפילים". The words are stems, not surface forms — every one below was
 * tried against the ה ב ל מ ו ש prefixes, which is where a Hebrew list of
 * this kind normally leaks.
 */
const OPERATIONS: Array<{ name: string; words: RegExp; signs: RegExp }> = [
  // ⚠️ JUXTAPOSITION IS MULTIPLICATION AND HAS NO SYMBOL. `(x-2)(x-3)`, `2x`,
  // `3\sin(x)`, `\pi r^2` all multiply without writing an operator, so a signs
  // list of `·` and `\cdot` alone reports "this exercise never multiplies" on
  // most of algebra. MEASURED: without the three patterns below the guard
  // pushed 0.8% of authored, correct answers to the model — 63 entries whose
  // own exercise multiplies in a form nothing was looking for.
  {
    name: 'כפל',
    words: /כפל|כפול|כפיל|מכפל|הכפל|פעמים/,
    signs: /[·×∙]|\\cdot|\\times|\)\s*\(|\d\s*[a-zA-Z\\]|[a-zA-Z]\s*\(/,
  },
  { name: 'חיבור', words: /חיבור|חובר|חיבר|לחבר|מחבר|פלוס|סכומ|סכום|מסכמ/, signs: /\+/ },
  { name: 'חיסור', words: /חיסור|חיסר|לחסר|מחסר|מינוס|הפרש|מוריד/, signs: /-|−|\\-/ },
  { name: 'חילוק', words: /חילוק|חילק|לחלק|מחלק|חלקי|מכנה|שבר/, signs: /[/:]|\\frac|\\dfrac|\\over/ },
  { name: 'שורש', words: /שורש/, signs: /\\sqrt|√/ },
  { name: 'חזקה', words: /חזקה|בחזקת|בריבוע|ריבוע|מעריכ/, signs: /\^|²|³/ },
];

/**
 * An operation the MESSAGE names that the exercise neither writes nor performs.
 *
 * Returns the offending name, or null when everything the student named is
 * something this exercise actually does.
 *
 * ⚠️ CONSERVATIVE BY CONSTRUCTION, AND THAT IS THE SAFETY MODEL. It only fires
 * on the ABSENCE of every trace of an operation — no word, no symbol. So the
 * cost of the list missing a form is that the guard stays silent and behaviour
 * is exactly what it was; it can never invent a conflict that is not there.
 * That matters because Hebrew maths writes multiplication by juxtaposition
 * (`2x`), which no symbol can catch — the guard must not be used to ASSERT
 * "there is no multiplication here", only to decline to answer as if there
 * were. See the caller in lib/tutor-compiler.
 */
/**
 * Everything the exercise itself says — the text `foreignOperation` is asked
 * about.
 *
 * ⚠️ EXPORTED SO THERE IS EXACTLY ONE OF IT. The guard in lib/tutor-compiler and
 * the gate in scripts/report-tutor-accuracy each built their own version first,
 * and they disagreed: the report counted nine leaks that were not leaks, on
 * exercises that DO multiply in a field it had not thought to read. A screen
 * and its gate assembling the same string separately is a measurement that
 * drifts from the thing it measures.
 *
 * Everything is included, `explanation` object form and all, because the
 * guard's only job is to notice a TOTAL absence — a mention anywhere is enough
 * to prove the operation is part of this exercise.
 */
export function exerciseText(q: Record<string, unknown> | null | undefined): string {
  if (!q) return '';
  const sol = (q.solution ?? {}) as Record<string, unknown>;
  const steps = Array.isArray(sol.steps) ? sol.steps.join(' ') : '';
  const ex = q.explanation;
  const explanation = typeof ex === 'string' ? ex : ex ? JSON.stringify(ex) : '';
  const notes = Array.isArray(q.distractorNotes) ? q.distractorNotes.join(' ') : '';
  return `${String(q.question ?? '')} ${steps} ${String(sol.finalAnswer ?? '')} ${String(q.hint ?? '')} ${explanation} ${notes}`;
}

export function foreignOperation(message: string, ownText: string): string | null {
  for (const op of OPERATIONS) {
    if (!op.words.test(message)) continue;
    if (op.words.test(ownText) || op.signs.test(ownText)) continue;
    return op.name;
  }
  return null;
}
