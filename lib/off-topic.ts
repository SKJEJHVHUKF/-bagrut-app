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

  // ---- widened on Itay's ask: "סתם כל דבר שלא קשור ללימוד" ----------
  //
  // Each entry below was checked against the app's own 10,753-word Hebrew
  // vocabulary before being added, because that corpus contains surprises: it
  // has "כדורגל" (probability questions about matches) and does NOT have
  // "אינדקס". A word that appears in a real question can never go on this list.
  { re: /(לקנות|חנות|קניון|מחיר של|בזול|מבצע|אמזון|עלי אקספרס|שופינג)/, label: 'קניות' },
  { re: /(טיסה|חופשה|מלון|לטייל|חול|אילת|יוון|תאילנד|דרכון)/, label: 'טיולים' },
  { re: /(רכב|אוטו|מכונית|רישיון נהיגה|טסט|טויוטה|מאזדה)/, label: 'רכב' },
  { re: /(כלב|חתול|תוכי|אוגר|חיית מחמד|וטרינר)/, label: 'חיות' },
  { re: /(כאב ראש|כואב לי|חולה|רופא|תרופה|מחלה|חיסון|קופת חולים)/, label: 'בריאות' },
  { re: /(צבא|גיוס|מילואים|קבע|יחידה קרבית|טירונות)/, label: 'צבא' },
  { re: /(חברה שלי|חבר שלי|דייט|להתחתן|חתונה|להיפרד|מאוהב)/, label: 'אישי' },
  { re: /(עבודה במשמרות|מלצר|משכורת|מעסיק|ראיון עבודה|קורות חיים)/, label: 'עבודה' },
  { re: /(שבת|חג|פסח|ראש השנה|יום כיפור|סוכות|בית כנסת)/, label: 'חגים' },
  { re: /(מזל|הורוסקופ|אסטרולוגיה|קלפי טארוט)/, label: 'אמונות' },
  { re: /(איך קוראים לך|מי בנה אותך|מאיזה מודל|אתה chatgpt|אתה gpt|מי יצר אותך)/i, label: 'עליי' },
];

/** Words shorter than this carry nothing in Hebrew and are not evidence of anything. */
const MIN_WORD = 3;

/**
 * Social openers. Not off-topic in the "football" sense — off-topic in the
 * sense that no maths was asked and answering with a model call is paying for
 * "היי" to be greeted.
 */
const CHIT_CHAT =
  /^[ ]*(?:היי|הי|שלום|אהלן|יו|הלו|מה[ ]*קורה|מה[ ]*נשמע|מה[ ]*המצב|מה[ ]*שלומך|בוקר[ ]*טוב|ערב[ ]*טוב|לילה[ ]*טוב|hi|hello|hey|yo)(?:[ ]+(?:אחי|אח|גבר|מלך|מה[ ]*קורה|מה[ ]*נשמע|מה[ ]*המצב|יא[ ]*\S+))*[ ]*[!?.]*[ ]*$/i;

/**
 * Noise: laughter, filler and a key held down.
 *
 * A run of four identical characters is the giveaway and it is safe — Hebrew
 * has no word with four of the same letter in a row, and neither does any
 * formula the app renders.
 */
const NOISE = /^[ ]*(?:[חהה]{3,}|לול|חחח+|lol+|xd+|hahaha+|\?{2,}|\.{3,})[ ]*$/i;
// ⚠️ The backreference IS the rule. Written without it, /(.){3,}/ matches any
// three characters and every message becomes noise. It also arrived here once
// as a literal 0x01 byte, which greps as nothing and reads as correct.
const RUN_OF_FOUR = /(.)\1{3,}/;

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
  const contentWords = w.filter((x) => x.length >= MIN_WORD).length;
  // ⚠️ The short-message veto runs AFTER the noise check below, not before it.
  // "לול" and "חחחח" are one short word each and would be waved through by a
  // rule written to protect "אה" and "2 ו3 ו4" — which are continuations of
  // something the tutor said, not noise.
  const isNoise = NOISE.test(raw) || RUN_OF_FOUR.test(raw) || CHIT_CHAT.test(raw);
  // A LONE long word is not "too little to judge" — it is a whole message that
  // nothing recognised, and it has its own answer below. The veto exists for
  // continuations like "אה" and "2 ו3 ו4", which are short AND follow something
  // the tutor just said.
  if (!isNoise && contentWords < 2) return null;

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

  // ---- nothing was asked at all ----
  //
  // ⚠️ THESE GET A DIFFERENT SENTENCE, AND THE DIFFERENCE IS THE POINT.
  //
  // "היי מה קורה אחי" and "אסדגכלדס" are not football. One is a greeting and
  // the other is a key held down, and telling either of them "אני המורה
  // למתמטיקה כאן" answers a question nobody asked. The honest reply is that
  // nothing was understood, phrased as an invitation rather than a verdict —
  // a student whose real message was mistyped simply types it again.
  if (CHIT_CHAT.test(raw) || NOISE.test(raw) || RUN_OF_FOUR.test(raw)) {
    return 'לא הגיעה אליי שאלה שאני יכול לעבוד איתה 🙂\nתכתוב לי מה מפריע לך בשאלה שעל המסך, ונתקדם משם.';
  }

  // ⚠️ THERE IS DELIBERATELY NO "A LONE UNKNOWN WORD IS GIBBERISH" RULE.
  //
  // It was written and measured and removed. It caught "אסדגכלדס" and
  // "asdkjhasd", and it also caught "אינדקס", "דיפרנציאלי" and "מקומות" —
  // three real maths words a student might reasonably type on their own, each
  // answered with "לא הצלחתי להבין". Every shape test tried afterwards had the
  // same problem: a consonant-run threshold that rejects "אסדגכלדס" also
  // rejects "דיפרנציאלי", which has four consonants in a row.
  //
  // So single-word mash reaches the model, and that is the cheaper mistake by a
  // wide margin: one call, versus telling a student who asked a real question
  // that they made no sense.

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
