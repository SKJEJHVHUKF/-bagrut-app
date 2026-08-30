/**
 * tutor-meta-asks.ts — messages about the TUTOR or about studying, not about
 * the exercise.
 *
 * ============================================================
 * WHERE THESE CAME FROM
 * ============================================================
 * Not invented. `npm run report:worklist` over 30 days of real traffic, in the
 * students' own words:
 *
 *   "לא עניתה על מה ששאלתי"
 *   "שוב פעם שאלתי אותך שאלה וחזרת תשובה שלא קשורה"
 *   "רוצה ממך טיפים לבגרות"
 *   "אתה יכול להביא טיפים להבנה של החומר"
 *
 * Every one cost a model call. None of them is a maths question, so no amount
 * of bank content or intent rules would ever have caught them — they needed
 * their own layer, and the trace is what showed that.
 *
 * ============================================================
 * THE COMPLAINT IS THE INTERESTING ONE
 * ============================================================
 * A complaint means a previous answer missed. Replying to it with a canned
 * "rephrase please" is cheap and, the FIRST time, genuinely the right move: the
 * fastest way to a good answer is one more sentence from the student.
 *
 * ⚠️ THE SECOND TIME IT IS NOT. A student who has now told us twice that we
 * answered the wrong thing, and gets the same stock sentence back, has been
 * told the tutor is not listening — which is exactly what they said. So a
 * repeated complaint is handed to the model deliberately, and the caller passes
 * `lastWasComplaint` to make that possible. One call is much cheaper than a
 * student deciding the tutor is useless.
 */

export type MetaKind = 'complaint' | 'exam-tips' | null;

/**
 * "That is not what I asked."
 *
 * Needs a word about the ANSWER ("ענית", "תשובה", "לא קשור") — a bare "לא
 * הבנתי" is a request for another rung and is owned by the follow-up router,
 * not a complaint about being misheard.
 */
const COMPLAINT =
  /(?:לא\s*ענית|לא\s*עניתה|לא\s*קשור\s*למה\s*ששאלתי|תשובה\s*שלא\s*קשורה|לא\s*זה\s*מה\s*ששאלתי|לא\s*ענית\s*לי|זה\s*לא\s*קשור\s*לשאלה|שאלתי\s*משהו\s*אחר|לא\s*על\s*זה\s*שאלתי)/;

/** "Give me tips for the bagrut." A real ask, with no exercise attached. */
const EXAM_TIPS =
  /(?:טיפים|עצות|טיפ)\s*(?:ל|על|בשביל)?\s*(?:הבגרות|בגרות|מבחן|המבחן|לימוד|להבנה|הבנה|החומר|לפני)|איך\s*(?:כדאי\s*)?(?:ללמוד|להתכונן|לתרגל)\s*(?:ל|נכון|יותר\s*טוב)?/;

export function classifyMetaAsk(message: string): MetaKind {
  const m = message.trim();
  if (!m) return null;
  if (COMPLAINT.test(m)) return 'complaint';
  if (EXAM_TIPS.test(m)) return 'exam-tips';
  return null;
}

/**
 * The reply, or null when the model should take it.
 *
 * `lastWasComplaint` — see the note at the top. A second complaint in a row is
 * the one case here where paying is the right answer.
 */
export function metaAnswer(
  message: string,
  opts: { lastWasComplaint?: boolean; hasQuestion?: boolean } = {},
): { text: string; kind: Exclude<MetaKind, null> } | null {
  const kind = classifyMetaAsk(message);
  if (!kind) return null;

  if (kind === 'complaint') {
    if (opts.lastWasComplaint) return null; // twice is not a template's job
    return {
      kind,
      text: opts.hasQuestion
        ? 'צודק, פספסתי. תכתוב לי במשפט אחד מה בדיוק לא ברור בשאלה שעל המסך — איזה צעד, איזה מספר, או איזו מילה בניסוח — ואענה בדיוק על זה.'
        : 'צודק, פספסתי. תכתוב לי במשפט אחד מה אתה מנסה להבין, ואענה בדיוק על זה.',
    };
  }

  // ⚠️ AUTHORED ONCE, TOPIC-INDEPENDENT, AND DELIBERATELY SPECIFIC.
  //
  // A model asked for study tips returns the same five generic sentences every
  // student has already read. These are about THIS exam and this app: the
  // formula sheet is provided, sections are worth stated marks, and /my-plan
  // already knows which topics this student is weak on. Ends on a question, so
  // it is a move rather than a leaflet.
  return {
    kind,
    text: [
      'ארבעה דברים שמזיזים ציון בבגרות במתמטיקה, לפי הסדר:',
      '',
      '1. **דף הנוסחאות נמצא אצלך בבחינה.** לא צריך לשנן אותו, צריך לדעת לאתר בו. תרגל עם הדף פתוח.',
      '2. **קרא את הסעיף עד הסוף לפני שאתה כותב.** רוב הטעויות הן תשובה לשאלה קרובה, לא טעות חשבון.',
      '3. **כתוב את הכלל לפני ההצבה.** בודק שרואה את הכלל נותן ניקוד חלקי גם כשהמספר יוצא שגוי.',
      '4. **תרגל נושא חלש ולא נושא נוח.** שעה בנושא שאתה שולט בו לא מזיזה כלום.',
      '',
      'ואם תרצה שאבדוק מה חלש דווקא אצלך, תשאל אותי "על מה כדאי לעבוד עכשיו" — יש לי את זה מהתשובות שלך.',
    ].join('\n'),
  };
}
