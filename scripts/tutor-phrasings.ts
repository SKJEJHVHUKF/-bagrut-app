/**
 * tutor-phrasings.ts — how students actually write the twelve recurring asks.
 *
 * ONE corpus, imported by BOTH the report and the tests, so a phrasing that is
 * measured is also pinned. Keeping two lists is how a report starts describing
 * a system the tests no longer cover.
 *
 * `expect` is what the phrasing SHOULD resolve to:
 *   an intent name → a rule must recognise it
 *   null          → it names a subject of its own and belongs to the model;
 *                   a rule that matches it is a false positive, and the tests
 *                   fail on that as hard as on a miss
 *
 * ⚠️ REPORTED lines came from real sessions Itay sent as screenshots. They are
 * marked because they are worth more than invented phrasings: every one of
 * them was a paid call in production, and each turned out to represent a whole
 * family. Never delete one to make a number look better.
 */

import type { CanonicalIntent } from '../lib/tutor-intent';

export type Phrasing = {
  text: string;
  /** The intent a rule must resolve it to, or null when no rule may. */
  expect: CanonicalIntent | null;
  /**
   * ⚠️ SEPARATE from `expect`, and it must stay separate.
   *
   * `expect` asks what the message MEANS; this asks who should ANSWER it.
   * They came apart the moment `concept` was added: "מה זה בכלל נגזרת"
   * is unmistakably a concept question, so labelling it null was wrong — and
   * it must still reach the model, because no card is authored for calculus.
   * Folding the two into one field would have forced a choice between a
   * wrong label and a lost safety assertion.
   */
  mustStayWithModel?: boolean;
  reported?: boolean;
};

export const PHRASINGS: Phrasing[] = [
  // ---- how_to_compute ----------------------------------------------
  { text: 'ואיך מחשבים?', expect: 'how_to_compute', reported: true },
  { text: 'איך מחשבים?', expect: 'how_to_compute' },
  { text: 'איך מחשבים את זה', expect: 'how_to_compute' },
  { text: 'אז איך מחשבים כאן', expect: 'how_to_compute' },
  { text: 'איך לחשב את זה בדיוק', expect: 'how_to_compute' },
  { text: 'אז איך?', expect: 'how_to_compute' },
  { text: 'ואיך?', expect: 'how_to_compute' },

  // ---- how_it_works ------------------------------------------------
  { text: 'איך זה עובד', expect: 'how_it_works', reported: true },
  { text: 'איך זה עובד?', expect: 'how_it_works', reported: true },
  { text: 'איך זה עובד בדיוק', expect: 'how_it_works' },
  { text: 'למה זה עובד', expect: 'how_it_works' },
  { text: 'איך זה קשור', expect: 'how_it_works' },

  // ---- how_to_solve ------------------------------------------------
  { text: 'איך פותרים?', expect: 'how_to_solve' },
  { text: 'איך פותרים את זה', expect: 'how_to_solve' },
  { text: 'איך ניגשים לזה', expect: 'how_to_solve' },
  { text: 'מאיפה מתחילים', expect: 'how_to_solve' },
  { text: 'מאיפה אני מתחיל', expect: 'how_to_solve' },
  { text: 'איך מתחילים כאן', expect: 'how_to_solve' },

  // ---- explain -----------------------------------------------------
  { text: 'תסביר לי', expect: 'explain' },
  { text: 'תסביר', expect: 'explain' },
  { text: 'תסביר לי את זה', expect: 'explain' },
  { text: 'אפשר יותר פשוט', expect: 'explain' },
  { text: 'תסביר במילים פשוטות', expect: 'explain' },

  // ---- what_to_do_here ---------------------------------------------
  { text: 'מה עושים כאן?', expect: 'what_to_do_here' },
  { text: 'מה עושים עכשיו', expect: 'what_to_do_here' },
  { text: 'מה צריך לעשות פה', expect: 'what_to_do_here' },
  { text: 'מה לעשות עכשיו', expect: 'what_to_do_here' },

  // ---- why_this_step -----------------------------------------------
  { text: 'למה עושים את זה', expect: 'why_this_step' },
  { text: 'למה מחלקים כאן', expect: 'why_this_step' },
  { text: 'למה מכפילים פה', expect: 'why_this_step' },
  { text: 'למה מציבים את זה', expect: 'why_this_step' },
  { text: 'למה?', expect: 'why_this_step' },

  // ---- give_example ------------------------------------------------
  { text: 'תן דוגמה', expect: 'give_example' },
  { text: 'תן לי דוגמה', expect: 'give_example' },
  { text: 'תן לי עוד דוגמה', expect: 'give_example' },
  { text: 'אפשר דוגמה?', expect: 'give_example' },

  // ---- give_table --------------------------------------------------
  { text: 'תן לי הטבלה של זה', expect: 'give_table', reported: true },
  { text: 'תן לי את הטבלה', expect: 'give_table' },
  { text: 'אפשר טבלה?', expect: 'give_table' },
  { text: 'תבנה לי טבלה', expect: 'give_table' },
  { text: 'איך בונים את הטבלה', expect: 'give_table' },
  { text: 'תן לי עץ', expect: 'give_table' },

  // ---- which_formula -----------------------------------------------
  { text: 'מה הנוסחה?', expect: 'which_formula' },
  { text: 'איזו נוסחה צריך', expect: 'which_formula' },
  { text: 'באיזו נוסחה משתמשים כאן', expect: 'which_formula' },
  { text: 'מה הנוסחא פה', expect: 'which_formula' },
  { text: 'הנוסחה?', expect: 'which_formula' },

  // ---- next_step ---------------------------------------------------
  { text: 'מה השלב הבא?', expect: 'next_step' },
  { text: 'מה הצעד הבא', expect: 'next_step' },
  { text: 'מה עכשיו', expect: 'next_step' },
  { text: 'ואז?', expect: 'next_step' },
  { text: 'תמשיך', expect: 'next_step' },

  // ---- why_wrong ---------------------------------------------------
  { text: 'למה התשובה שלי שגויה?', expect: 'why_wrong' },
  { text: 'למה זה לא נכון?', expect: 'why_wrong' },
  { text: 'למה טעיתי', expect: 'why_wrong' },
  { text: 'איפה הטעות', expect: 'why_wrong' },
  { text: 'מה הטעות שלי', expect: 'why_wrong' },

  // ---- didnt_understand --------------------------------------------
  { text: 'לא הבנתי', expect: 'didnt_understand' },
  { text: 'לא הבנתי את זה', expect: 'didnt_understand' },
  { text: 'לא ברור לי', expect: 'didnt_understand' },
  { text: 'נתקעתי', expect: 'didnt_understand' },
  { text: 'אני תקוע', expect: 'didnt_understand' },

  // ---- concept: answerable ONLY by an authored Topic Card ----------
  //
  // One phrasing per card, so the census exercises the card layer instead of
  // reporting a zero that only means "the corpus never asked". These name a
  // subject on purpose — that is what a concept question is — and they are
  // safe because a card is the only thing allowed to answer them.
  { text: 'מה זה בלי החזרה', expect: 'concept' },
  { text: 'מה ההבדל בין וגם לאו', expect: 'concept' },
  { text: 'מה זה מאורעות זרים', expect: 'concept' },
  { text: 'מה זה בלתי תלויים', expect: 'concept' },
  { text: 'מה זה הסתברות מותנית', expect: 'concept' },
  { text: 'איך קוראים עץ הסתברות', expect: 'concept' },
  { text: 'איך ממלאים טבלת הסתברות', expect: 'concept' },
  { text: 'מה זה חוק המשלים', expect: 'concept' },
  { text: 'מתי משתמשים בהתפלגות בינומית', expect: 'concept' },
  { text: 'איך מזהים n p k בבינומית', expect: 'concept' },

  // ==================================================================
  // HELD OUT — the shapes hand-enumeration always misses.
  //
  // Every line here is the SAME ask as one above with ordinary extra words
  // around it, and every one of them returned null under the anchored rules:
  // an anchor breaks on the first word it did not expect, and students never
  // write the shape you listed. These exist to measure GENERALISATION rather
  // than recall — passing them means the recogniser found the ask inside a
  // sentence, which is the only thing that can converge.
  //
  // Safety is unaffected: the veto, not the anchor, is what stops a message
  // that names its own subject, and the `mustStayWithModel` block below still
  // holds it.
  // ==================================================================
  { text: 'אז מה עושים עכשיו עם זה?', expect: 'what_to_do_here' },
  { text: 'רגע, אני לא בטוח מה עושים כאן', expect: 'what_to_do_here' },
  { text: 'אוקיי אבל איך מחשבים את זה בפועל', expect: 'how_to_compute' },
  { text: 'תוכל להסביר לי שוב בבקשה', expect: 'explain' },
  { text: 'לא הבנתי כלום ממה שכתבת', expect: 'didnt_understand' },
  { text: 'אני קצת אבוד פה', expect: 'didnt_understand' },
  { text: 'רגע למה עושים את הצעד הזה', expect: 'why_this_step' },
  { text: 'ומה השלב הבא אחרי זה', expect: 'next_step' },
  { text: 'טוב ואז מה', expect: 'next_step' },
  { text: 'אפשר בבקשה עוד דוגמה אחת', expect: 'give_example' },
  { text: 'תוכל לתת לי טבלה בשביל זה', expect: 'give_table' },
  { text: 'איפה בדיוק הטעות שלי פה', expect: 'why_wrong' },
  { text: 'אני חושב שטעיתי אבל לא יודע איפה', expect: 'why_wrong' },
  { text: 'מאיפה מתחילים בכלל עם השאלה הזאת', expect: 'how_to_solve' },
  { text: 'תסביר לי את זה יותר פשוט בבקשה', expect: 'explain' },

  // ==================================================================
  // MUST STAY WITH THE MODEL — each names a subject of its own.
  //
  // These are the reason every rule is anchored at both ends. A rule that
  // matched these would be "saving" a call by answering a different question
  // than the one asked, which is worse than paying for it.
  // ==================================================================
  { text: 'איך מחשבים סטיית תקן', expect: null, mustStayWithModel: true },
  { text: 'איך מחשבים נגזרת של ln בכלל', expect: null, mustStayWithModel: true },
  { text: 'איך עובד חוק בייס', expect: null, mustStayWithModel: true },
  { text: 'איך זה עובד כשיש שלושה מאורעות בלתי תלויים', expect: null, mustStayWithModel: true },
  { text: 'איך פותרים משוואה ריבועית עם פרמטר באופן כללי', expect: null, mustStayWithModel: true },
  { text: 'מה ההבדל בין טבלה דו ממדית לדיאגרמת עץ', expect: 'concept', mustStayWithModel: true },
  { text: 'מה ההבדל בין סדרה חשבונית להנדסית', expect: 'concept', mustStayWithModel: true },
  { text: 'מה הנוסחה לסכום סדרה הנדסית אינסופית', expect: null, mustStayWithModel: true },
  { text: 'למה מחלקים בשונות ולא בתוחלת', expect: null, mustStayWithModel: true },
  { text: 'תן דוגמה לסדרה שמתכנסת אבל לא חסומה', expect: null, mustStayWithModel: true },
  { text: 'כמה זמן יש בבגרות לשאלה כזאת', expect: null, mustStayWithModel: true },
  { text: 'מה זה בכלל נגזרת', expect: 'concept', mustStayWithModel: true },
  { text: 'תסביר לי על וקטורים', expect: null, mustStayWithModel: true },
  { text: 'מה עושים כשהדיסקרימיננטה שלילית', expect: null, mustStayWithModel: true },
];

export const REPORTED = PHRASINGS.filter((p) => p.reported);
