/**
 * sequences.ts — ten Topic Cards for סדרות.
 *
 * ============================================================
 * HOW THE TEN WERE CHOSEN
 * ============================================================
 * Not from the curriculum and not from memory. The FAQ bank holds 161 authored
 * `concept` entries for this topic; clustering their questions by content word
 * gives the concepts students actually ask about, in order:
 *
 *   ההפרש 9 · סכום 9 · חשבונית 9 · נסיגה 8 · האיבר 7 · המנה 6 · יורדת 4 ·
 *   שלם 4 · מקומות 4
 *
 * Every card below answers one of those. "מה הכוונה אינדקס" is here because
 * `measure-quiz-gap` found it failing on all 574 quiz questions, and the live
 * trace has a student asking it.
 *
 * ⚠️ WHY CARDS AND NOT THE BANK ENTRIES THEMSELVES. Two things were measured
 * before any of this was written:
 *   · A topic-wide search over `concept` entries adds 2.2% reach for 21.4%
 *     wrong ideas (scripts/measure-concept-transfer) — "למה שלישייה נספרת פעם
 *     אחת" comes back with an answer about "לפחות פעם אחת". Not enabled.
 *   · A card cannot be derived from an entry either: a card is five fields —
 *     idea, rule, tiny example, trap, question back — and an entry is one
 *     paragraph.
 * So these are written, and they are written once per topic rather than once
 * per question, which is the whole economy of the format.
 *
 * ============================================================
 * HOUSE RULES — each is a bug that already happened
 * ============================================================
 *   · Hebrew NEVER inside $…$. KaTeX has no bidi and renders it reversed.
 *   · A paragraph never OPENS on a maths island: the bubble is
 *     unicodeBidi:'plaintext', so a maths first character flips the line.
 *   · No maqaf glued to a maths island and no em dash as a clause separator.
 *     Both read as a minus sign in Hebrew maths.
 *   · A given sequence is stated as "נתון a1 וההפרש d", never as a bare list.
 *   · Every card ends on a question. A card that ends on a full stop ends the
 *     conversation, and the point is to hand the turn back.
 *   · Aliases must not collide: each card owns a word no other card here has,
 *     or the matcher picks between them by score.
 *   · SHORT forms belong in the alias list too. Measured on twelve paraphrases
 *     a student would really type: 5/12 at first. Every failure was a question
 *     with ONE content word — "מה זה אינדקס", "מה זאת המנה", "מה זה q" — which
 *     can only ever reach a card through the exact-alias path, because one word
 *     out of a three-word message does not clear the fuzzy threshold. Writing
 *     only the long, careful phrasings is writing for the wrong reader.
 */

import type { TopicCard } from '../types';

const TOPIC = 'סדרות';

export const SEQUENCES_CARDS: TopicCard[] = [
  {
    id: 'seq-arithmetic-vs-geometric',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה ההבדל בין חשבונית להנדסית',
      'איך יודעים אם הסדרה חשבונית או הנדסית',
      'חשבונית או הנדסית',
      'מה זאת סדרה חשבונית',
      'מה זאת סדרה הנדסית',
    ],
    shortExplanation:
      'בסדרה חשבונית עוברים מאיבר לאיבר על ידי חיבור של אותו מספר קבוע, ובסדרה הנדסית על ידי הכפלה באותו מספר קבוע. זו כל ההבחנה, וכל שאר הנוסחאות נגזרות ממנה.',
    formulaOrRule:
      'חשבונית: ההפרש בין כל שני איברים עוקבים קבוע, $a_{n+1} - a_n = d$. הנדסית: היחס בין כל שני איברים עוקבים קבוע, $\\frac{a_{n+1}}{a_n} = q$.',
    microExample:
      'נתון $a_1 = 3$ וההפרש $d = 4$, כך שהסדרה נראית $3, 7, 11, 15$. לעומת זאת נתון $a_1 = 3$ והמנה $q = 2$, כך שהסדרה נראית $3, 6, 12, 24$.',
    commonMistake:
      'הטעות השכיחה היא לבדוק רק זוג אחד של איברים. שני איברים תמיד מגדירים גם הפרש וגם יחס, ולכן צריך לבדוק לפחות שני זוגות ולראות מה מהם נשאר קבוע.',
    followUpQuestion: 'בסדרה שלפניך, מה יוצא כשאתה מחסר שני איברים עוקבים, ומה יוצא כשאתה מחלק אותם?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-difference-d',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זה ההפרש d',
      'מה זה d בסדרה',
      'איך מוצאים את ההפרש',
      'מה מסמן הפרש שלילי',
      'ההפרש',
    ],
    shortExplanation:
      'ההפרש הוא הקפיצה הקבועה בין כל איבר לאיבר שאחריו בסדרה חשבונית. הוא מחושב תמיד כאיבר המאוחר פחות המוקדם, ולכן הסימן שלו מספר לך לאן הסדרה הולכת.',
    formulaOrRule:
      'ההפרש מוגדר $d = a_{n+1} - a_n$, והוא זהה בכל מקום בסדרה. אם ידועים שני איברים לא עוקבים, מתקיים $d = \\frac{a_m - a_n}{m - n}$.',
    microExample:
      'בסדרה שאיבריה $5, 9, 13$ מתקיים $d = 9 - 5 = 4$. בסדרה שאיבריה $20, 17, 14$ מתקיים $d = 17 - 20 = -3$, כלומר הסדרה יורדת.',
    commonMistake:
      'הטעות השכיחה היא לחסר בסדר ההפוך ולקבל הפרש בסימן הפוך. אם חיסרתם את המאוחר מהמוקדם, הסדרה תיראה יורדת כשהיא עולה.',
    followUpQuestion: 'נסה לחשב את ההפרש בסדרה שלפניך פעמיים, על שני זוגות שונים. יצא אותו דבר?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-ratio-q',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זאת המנה של סדרה הנדסית',
      'מה זאת המנה',
      'מה זה המנה',
      'מה זה q',
      'מה זה q בסדרה',
      'איך מוצאים את המנה',
      'המנה',
      'מה זה מנה קבועה',
    ],
    shortExplanation:
      'המנה היא המספר שבו מכפילים כל איבר כדי לקבל את הבא אחריו בסדרה הנדסית. היא מחושבת כחילוק של איבר באיבר שלפניו, ולכן היא נשארת אותה מנה בכל מקום בסדרה.',
    formulaOrRule:
      'המנה מוגדרת $q = \\frac{a_{n+1}}{a_n}$. אם ידועים שני איברים לא עוקבים, מתקיים $q^{m-n} = \\frac{a_m}{a_n}$.',
    microExample:
      'בסדרה שאיבריה $2, 6, 18$ מתקיים $q = \\frac{6}{2} = 3$. בסדרה שאיבריה $16, 8, 4$ מתקיים $q = \\frac{8}{16} = \\frac{1}{2}$, כלומר הסדרה קטנה.',
    commonMistake:
      'הטעות השכיחה היא לחשב את המנה כהפרש. אם חיסרתם במקום לחלק, כל שאר הפתרון יתנהג כמו סדרה חשבונית ויסטה מיד.',
    followUpQuestion: 'בסדרה שלפניך, מה מתקבל כשאתה מחלק איבר באיבר שלפניו?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-index-n',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה הכוונה אינדקס',
      'מה זה אינדקס',
      'מה זה n',
      'מה המשמעות של n',
      'מה זה n בסדרה',
      'מה זה המקום של האיבר',
      'מה זה מציין המקום',
      'מה זה האיבר הכללי',
    ],
    shortExplanation:
      'המספר הקטן שיושב ליד האות הוא המקום של האיבר בתור, ולא הערך שלו. האיבר החמישי הוא זה שעומד חמישי בשורה, והערך שלו הוא משהו אחר לגמרי שצריך לחשב.',
    formulaOrRule:
      'האיבר הכללי של סדרה חשבונית הוא $a_n = a_1 + (n-1)d$, ושל סדרה הנדסית $a_n = a_1 \\cdot q^{n-1}$. בשתיהן $n$ הוא המקום ולא הערך.',
    microExample:
      'נתון $a_1 = 3$ וההפרש $d = 4$. אז $a_5 = 3 + 4 \\cdot 4 = 19$, כלומר האיבר שעומד חמישי בתור שווה $19$.',
    commonMistake:
      'הטעות השכיחה היא לבלבל בין המקום לערך ולהציב את הערך במקום שבו צריך את המספר הסידורי. אם נאמר לכם שהאיבר שווה $19$, זה לא אומר שהוא האיבר התשע-עשרה.',
    followUpQuestion: 'בשאלה שלפניך, המספר שנתון לך הוא המקום בתור או הערך של האיבר?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-sum-notation',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זה הסימון S10',
      'מה זה S של עשר',
      'מה זה הסימון של הסכום',
      'מה זה סכום של סדרה',
      'מה זה Sn',
      'מה ההבדל בין איבר לסכום',
      'סכום של איברים',
    ],
    shortExplanation:
      'האות הגדולה מסמנת סכום, כלומר את מה שמתקבל מחיבור של כמה איברים יחד, ולא איבר בודד. המספר הקטן לידה אומר כמה איברים מהתחלה נכללו בחיבור.',
    formulaOrRule:
      'הסכום של $n$ האיברים הראשונים בסדרה חשבונית הוא $S_n = \\frac{a_1 + a_n}{2} \\cdot n$, ובסדרה הנדסית $S_n = a_1 \\cdot \\frac{q^n - 1}{q - 1}$.',
    microExample:
      'בסדרה שאיבריה $3, 7, 11, 15$ מתקיים $a_4 = 15$ אבל $S_4 = 3 + 7 + 11 + 15 = 36$. אלה שני מספרים שונים לחלוטין.',
    commonMistake:
      'הטעות השכיחה היא להציב סכום במקום שדורש איבר, או להפך. אם השאלה אומרת "עד למקום העשירי" היא מבקשת סכום, ואם היא אומרת "האיבר העשירי" היא מבקשת איבר אחד.',
    followUpQuestion: 'בשאלה שלפניך, מבקשים ממך איבר בודד או את החיבור של כמה איברים?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-recursive-rule',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זה כלל נסיגה',
      'מה זה נוסחה רקורסיבית',
      'מה זאת רקורסיה',
      'מה זה נוסחת נסיגה',
      'נסיגה',
      'מה ההבדל בין כלל נסיגה לאיבר כללי',
      'מה זה כלל רקורסיבי',
    ],
    shortExplanation:
      'כלל נסיגה מתאר איבר באמצעות זה שלפניו, ולכן כדי להגיע לאיבר רחוק צריך לעבור דרך כל הקודמים. נוסחת האיבר הכללי מתארת אותו ישירות מהמקום, בלי לעבור בדרך.',
    formulaOrRule:
      'כלל נסיגה נראה $a_{n+1} = a_n + d$ ודורש איבר פתיחה. נוסחת האיבר הכללי נראית $a_n = a_1 + (n-1)d$ ואינה דורשת שום איבר קודם.',
    microExample:
      'נתון $a_1 = 3$ והכלל $a_{n+1} = a_n + 4$. כדי להגיע ל-$a_4$ בדרך הזאת מחשבים $7$, אחר כך $11$, אחר כך $15$. הנוסחה הכללית נותנת אותו דבר בשלב אחד.',
    commonMistake:
      'הטעות השכיחה היא לשכוח את איבר הפתיחה. כלל נסיגה בלי איבר ראשון מתאר אינסוף סדרות שונות ואינו מגדיר אף אחת מהן.',
    followUpQuestion: 'בשאלה שלפניך, נתון לך איבר פתיחה יחד עם הכלל?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-infinite-sum',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זה סכום אינסופי',
      'מתי יש סכום אינסופי',
      'מה זה סדרה מתכנסת',
      'סכום אינסוף',
      'למה יש סכום למשהו אינסופי',
    ],
    shortExplanation:
      'כשהאיברים של סדרה הנדסית הולכים וקטנים, התוספת של כל איבר נוסף קטנה מהקודמת, והחיבור מתקרב למספר מסוים ולא בורח לאינסוף. המספר הזה הוא הסכום האינסופי.',
    formulaOrRule:
      'סכום אינסופי קיים רק כאשר $|q| < 1$, ואז $S = \\frac{a_1}{1 - q}$. אם $|q| \\ge 1$ אין סכום כזה.',
    microExample:
      'נתון $a_1 = 8$ והמנה $q = \\frac{1}{2}$. אז הסכום האינסופי הוא $\\frac{8}{1 - 0.5} = 16$, בזמן שהאיברים עצמם ממשיכים להיות $8, 4, 2, 1$ וכן הלאה.',
    commonMistake:
      'הטעות השכיחה היא להשתמש בנוסחה בלי לבדוק את התנאי. אם המנה גדולה מאחד האיברים גדלים, החיבור בורח, ומספר שיוצא מהנוסחה במקרה כזה אינו אומר דבר.',
    followUpQuestion: 'בשאלה שלפניך, מה המנה, והאם הערך המוחלט שלה קטן מאחד?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-increasing-decreasing',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זאת סדרה יורדת',
      'מתי סדרה עולה',
      'איך יודעים אם הסדרה עולה או יורדת',
      'סדרה עולה',
      'למה הסדרה יורדת',
    ],
    shortExplanation:
      'בסדרה חשבונית הכיוון נקבע לפי הסימן של ההפרש, ובסדרה הנדסית לפי המנה יחד עם הסימן של האיבר הראשון. אין צורך לחשב איברים כדי לדעת את זה.',
    formulaOrRule:
      'חשבונית עולה כאשר $d > 0$ ויורדת כאשר $d < 0$. הנדסית עם איבר ראשון חיובי עולה כאשר $q > 1$ ויורדת כאשר $0 < q < 1$.',
    microExample:
      'נתון $a_1 = 20$ וההפרש $d = -3$, ולכן הסדרה יורדת ואיבריה $20, 17, 14$. נתון $a_1 = 2$ והמנה $q = 3$, ולכן היא עולה ואיבריה $2, 6, 18$.',
    commonMistake:
      'הטעות השכיחה היא להסיק מהמנה לבדה בלי להסתכל על האיבר הראשון. מנה גדולה מאחד עם איבר ראשון שלילי מייצרת סדרה שיורדת, לא עולה.',
    followUpQuestion: 'בסדרה שלפניך, מה הסימן של ההפרש או של המנה?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-n-must-be-integer',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'למה המקום חייב לצאת שלם',
      'למה n לא יכול להיות שבר',
      'למה לא יוצא מספר שלם',
      'למה n חייב להיות מספר שלם',
      'מה קורה אם יוצא שבר',
      'למה זה חייב להיות שלם',
      'המקום לא יצא שלם',
    ],
    shortExplanation:
      'המקום בתור סופר איברים, ואי אפשר לעמוד במקום וחצי בתור. לכן כשמשוואה מחזירה תוצאה שאינה מספר שלם וחיובי, המשמעות היא שהמספר שחיפשתם פשוט אינו איבר של הסדרה.',
    formulaOrRule:
      'בכל פתרון שבו הנעלם הוא המקום, התנאי הוא $n$ שלם וגם $n \\ge 1$. תוצאה כמו $n = 7.5$ או $n = -2$ נפסלת ואינה טעות חישוב בהכרח.',
    microExample:
      'נתון $a_1 = 3$ וההפרש $d = 4$, ושואלים אם $30$ הוא איבר בסדרה. מהמשוואה מתקבל $n = 7.75$, ולכן התשובה היא שהוא אינו איבר בה.',
    commonMistake:
      'הטעות השכיחה היא לעגל את התוצאה למספר הקרוב ולהמשיך. עיגול הופך תשובה נכונה של "לא נמצא בסדרה" לתשובה שגויה לגמרי.',
    followUpQuestion: 'בשאלה שלפניך, אחרי שתפתור, בדוק אם המקום שיצא הוא מספר שלם וחיובי. מה קיבלת?',
    version: 1,
    approved: true,
  },

  {
    id: 'seq-symmetric-positions',
    topic: TOPIC,
    subtopic: '',
    aliases: [
      'מה זה מקומות סימטריים',
      'מה זה מקומות זוגיים',
      'מה זה הקיצוניים בשלישייה',
      'מקומות סימטריים',
      'למה סכום הקצוות שווה',
    ],
    shortExplanation:
      'בסדרה חשבונית, שני איברים שנמצאים במרחק שווה משני קצות הקטע מתחברים תמיד לאותו סכום. זו הסיבה שנוסחת הסכום מכפילה את הממוצע של הראשון והאחרון במספר האיברים.',
    formulaOrRule:
      'אם $i + j = k + l$ אז $a_i + a_j = a_k + a_l$. במיוחד, האיבר האמצעי בשלישייה שווה לממוצע של שני הקיצוניים.',
    microExample:
      'בסדרה שאיבריה $3, 7, 11, 15$ מתקיים $3 + 15 = 18$ וגם $7 + 11 = 18$. האמצעי בשלישייה $3, 7, 11$ הוא $7$, שהוא בדיוק הממוצע של $3$ ו-$11$.',
    commonMistake:
      'הטעות השכיחה היא להחיל את התכונה הזאת על סדרה הנדסית. שם מה שנשמר הוא המכפלה של הקצוות ולא הסכום שלהם.',
    followUpQuestion: 'בשאלה שלפניך, יש שלושה איברים שאפשר לכתוב את האמצעי שבהם כממוצע של השניים האחרים?',
    version: 1,
    approved: true,
  },
];

export default SEQUENCES_CARDS;
