/**
 * off-topic.ts — "this isn't what we're here for", answered locally.
 *
 * ============================================================
 * THE ASYMMETRY THAT DESIGNS THIS FILE
 * ============================================================
 * Missing an off-topic message costs one model call. Redirecting a REAL
 * question costs a student who asked something legitimate and was told to get
 * back on topic — by a tutor they are paying for, about a subject they are
 * anxious about. Those are not the same size, and nothing here treats them as
 * though they were.
 *
 * So the shape is: a long list of reasons to say nothing, and a short list of
 * reasons to speak. Every veto below runs BEFORE any positive match, and any
 * single veto is enough.
 *
 * ============================================================
 * THE TRAPS THIS ALREADY WALKED INTO
 * ============================================================
 * · "סדרה" is a television series AND the entire sequences topic. It cannot
 *   appear in an off-topic list at any strength.
 * · "יש לך טיפים לפני המבחן" names nothing mathematical and is a completely
 *   legitimate question — it is in the live trace, from a real session. The
 *   school-word veto exists for it.
 * · "משחק" is a football match and also every probability question about dice,
 *   cards and spinners. It only counts alongside another sports word.
 * · A fragment like "אה" or "2 ו3 ו4" is a conversational continuation, not an
 *   off-topic message. Too few content words means no decision.
 */

import { namesAMathsSubject } from '@/lib/maths-vocabulary';

/**
 * Anything about school, studying or this app's own machinery.
 *
 * ⚠️ THIS LIST IS A VETO, NOT A TOPIC CHECK. "מתי הבגרות", "כמה נקודות זה
 * שווה", "יש לך טיפים למבחן" are not maths questions and are absolutely not
 * off topic — a tutor that refuses them is a tutor the student stops trusting.
 */
const SCHOOL = [
  'מבחן', 'בחינה', 'בגרות', 'מועד', 'שאלון', 'יחידות', 'ציון', 'ציונים', 'נקודות',
  'שיעור', 'שיעורים', 'תרגיל', 'תרגילים', 'שאלה', 'שאלות', 'נושא', 'נושאים',
  'ללמוד', 'לימוד', 'לימודים', 'למדתי', 'חומר', 'מורה', 'תשובה', 'תשובות',
  'פתרון', 'לפתור', 'טעות', 'טעיתי', 'הסבר', 'להסביר', 'דוגמה', 'נוסחה', 'נוסחאות',
  'חזרה', 'לתרגל', 'תרגול', 'מחברת', 'דף', 'סעיף', 'שלב', 'צעד', 'בוחן', 'סמסטר',
  'להתכונן', 'הכנה', 'לחץ', 'להצליח', 'נכשלתי', 'קשה לי',
];

/**
 * Words that mean the message is not about this at all.
 *
 * Kept short and kept unambiguous. Every entry was checked against the maths
 * vocabulary and against the probability topic in particular, which is full of
 * dice, cards, games and coins.
 */
const OFF_TOPIC: Array<{ re: RegExp; label: string }> = [
  { re: /(כדורגל|כדורסל|מונדיאל|ליגה|מכבי|הפועל|ברצלונה|ריאל|אלופות)/, label: 'ספורט' },
  { re: /(פיצה|המבורגר|שווארמה|מסעדה|רעב|לאכול|ארוחה|שוקולד|גלידה)/, label: 'אוכל' },
  { re: /(נטפליקס|יוטיוב|טיקטוק|אינסטגרם|פייסבוק|ווטסאפ|סנאפצ)/, label: 'רשתות' },
  { re: /(פורטנייט|מיינקראפט|פלייסטיישן|אקסבוקס|גיימינג|קונסולה)/, label: 'גיימינג' },
  { re: /(זמר|זמרת|שיר של|מוזיקה|קונצרט|סרט של|שחקנית)/, label: 'בידור' },
  { re: /(מזג האוויר|גשם|שלג|חם בחוץ|קר בחוץ)/, label: 'מזג אוויר' },
  { re: /(בחירות|ממשלה|כנסת|פוליטיקה|מלחמה|חדשות)/, label: 'אקטואליה' },
  { re: /(בדיחה|בדיחות|תצחיק|משעמם לי|שעמום)/, label: 'סתם' },
  { re: /(מה שלומך|מי אתה|מי את|בן כמה אתה|אתה רובוט|אתה בוט|אתה אדם|אוהב אותך|יש לך רגשות)/, label: 'עליי' },
  { re: /(אנגלית|תנך|תנ"ך|היסטוריה|ספרות|אזרחות|ביולוגיה|גאוגרפיה)/, label: 'מקצוע אחר' },
];

/** Words shorter than this carry nothing in Hebrew and are not evidence of anything. */
const MIN_WORD = 3;

/**
 * Words long enough to pass MIN_WORD and still carrying no subject.
 *
 * ⚠️ WITHOUT THIS THE ECHO VETO SILENCES ALMOST EVERYTHING. "בן כמה אתה" was
 * ruled on-topic because the question on screen happened to read "כמה ועדות
 * אפשריות" — one shared word, and it was "כמה". Sharing a question word is
 * evidence of being on topic only when the word is about something.
 */
const NO_SUBJECT = new Set([
  'כמה', 'מה', 'איך', 'למה', 'מתי', 'איפה', 'מי', 'האם', 'יש', 'אין', 'של', 'את',
  'אם', 'לא', 'כן', 'זה', 'זו', 'הוא', 'היא', 'הם', 'אני', 'אתה', 'את', 'אנחנו',
  'עם', 'על', 'אל', 'כל', 'גם', 'רק', 'כדי', 'אבל', 'או', 'כמו', 'אחרי', 'לפני',
  'עכשיו', 'פה', 'שם', 'ככה', 'אפשריות', 'אפשרי',
]);

const words = (s: string) =>
  s
    .replace(/[^֐-׿a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/**
 * The redirect to send, or null to leave the message alone.
 *
 * `questionText` is whatever is on the student's screen — the question, and
 * anything else that describes what they are working on. A message that echoes
 * it is by definition on topic, whatever else it contains.
 */
export function offTopicRedirect(message: string, questionText?: string): string | null {
  const raw = message.trim();
  if (!raw) return null;

  // ---- veto 1: too little to judge ----
  //
  // "אה", "2 ו3 ו4", "איבר איבר" — real messages from the trace, all of them
  // continuations of something the tutor just said. A two-word fragment is
  // never enough evidence to tell a student they have wandered off.
  const w = words(raw);
  if (w.filter((x) => x.length >= MIN_WORD).length < 2) return null;

  // ---- veto 2: anything mathematical ----
  if (/\d/.test(raw)) return null;
  if (/\$/.test(raw)) return null;
  if (namesAMathsSubject(raw)) return null;

  // ---- a different subject is checked BEFORE the school veto ----
  //
  // "תעזור לי בשיעורי אנגלית" is about school by every measure, and the school
  // veto would silence it — but a maths tutor is exactly the wrong address for
  // it, which is the whole point of the feature. The maths vetoes above still
  // outrank this: "אנגלית ומתמטיקה באותו יום" says nothing here.
  const otherSubject = OFF_TOPIC.find((o) => o.label === 'מקצוע אחר');
  const namesOther = otherSubject?.re.test(raw) === true;

  // ---- veto 3: anything about school ----
  if (!namesOther && SCHOOL.some((s) => raw.includes(s))) return null;

  // ---- veto 4: it echoes what is on the screen ----
  //
  // The cheapest and strongest signal available: a content word shared with the
  // question the student is looking at means they are talking about it, whether
  // or not any list of ours recognises the vocabulary.
  if (questionText && !namesOther) {
    const own = new Set(
      words(questionText).filter((x) => x.length >= MIN_WORD && !NO_SUBJECT.has(x)),
    );
    if (w.some((x) => x.length >= MIN_WORD && !NO_SUBJECT.has(x) && own.has(x))) return null;
  }

  // ---- and only now, a reason to speak ----
  const hit = OFF_TOPIC.find((o) => o.re.test(raw));
  if (!hit) return null;

  return questionText
    ? 'אני המורה למתמטיקה כאן, אז על זה אני לא הכתובת 🙂\nבוא נחזור לשאלה שאתה עובד עליה — מה תרצה לעשות איתה?'
    : 'אני המורה למתמטיקה כאן, אז על זה אני לא הכתובת 🙂\nבוא נחזור לנושא שלנו — מה תרצה לתרגל?';
}

/** For the tests and the report: which category fired, without sending anything. */
export function offTopicLabel(message: string, questionText?: string): string | null {
  if (!offTopicRedirect(message, questionText)) return null;
  return OFF_TOPIC.find((o) => o.re.test(message))?.label ?? null;
}
