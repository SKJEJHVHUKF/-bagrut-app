/**
 * study-tips.ts — the answer to "יש לך טיפים?", written once.
 *
 * ============================================================
 * WHY THIS IS STATIC AND WHY THAT IS NOT A COMPROMISE
 * ============================================================
 * Four paid turns in fourteen days were this question in four different
 * phrasings — "תן טיפים לזכור", "יש לך טיפים לתת לפני המבחן",
 * "רוצה ממך טיפים לבגרות", "אתה יכול להביא טיפים להבנה של החומר". Four
 * students asking the same thing is not four questions.
 *
 * Every other local layer in this tutor is grounded in the question on screen,
 * because a generic answer about a specific question is the failure mode. Tips
 * are the one thing that inverts: a real tutor gives the same five to
 * everybody, and the model was being paid to reinvent them each time. There is
 * nothing here a model would say better.
 *
 * ⚠️ IT ENDS BY POINTING BACK AT THE WORK. A tips answer that finishes with a
 * flourish is where a session goes to die — the student reads five bullets,
 * feels productive and closes the tab. The last line is a question about the
 * thing in front of them, same as every other template in this app.
 */

const TIPS = `**חמישה דברים שמשנים ציון במתמטיקה, לפי הסדר:**

1. **הנוסחאון הוא כלי, לא רשימה לשינון.** מה שכתוב בו לא צריך זיכרון, ומה שלא כתוב בו כן. תעבור עליו פעם אחת ותסמן לעצמך מה חסר.

2. **הניסוח מסגיר את סוג השאלה.** כמעט כל שאלה מכריזה על עצמה: "סדרה חשבונית", "בהינתן ש", "מהי ההסתברות ש". המילה בניסוח היא שאומרת באיזו נוסחה להשתמש, ולכן שווה לקרוא את השאלה פעמיים לפני שכותבים משהו.

3. **נתונים ומבוקש, לפני החישוב.** שתי שורות בצד הדף. הן חוסכות את רוב הטעויות, שנובעות מבלבול בין מה שנתון לבין מה שמחפשים.

4. **בדיקה בהצבה חזרה.** קיבלת $x = 4$? תציב אותו בנתון המקורי ותראה שהוא מסתדר. זו הבדיקה שתופסת טעויות חשבון לפני שהן עולות נקודות.

5. **לחזור על שאלה שטעית בה, במקום לעבור לחדשה.** שאלה חדשה מרגישה כמו התקדמות; שאלה שטעית בה היא ההתקדמות.`;

/**
 * The tips, closed with a question about what the student is actually doing.
 *
 * `topic` names the current subject when there is one, so the closing line is
 * about their work and not about studying in the abstract.
 */
export function studyTips(topic?: string): string {
  const back = topic
    ? `\n\nועכשיו נחזור ל${topic} — על איזו שאלה נעבוד?`
    : '\n\nעל איזו שאלה נעבוד עכשיו?';
  return TIPS + back;
}
