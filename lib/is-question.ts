/**
 * is-question.ts — is there a question here at all?
 *
 * ============================================================
 * THE INVERSION
 * ============================================================
 * Itay, after eight turns cost $0.04: sometimes he typed a single letter or
 * mashed the keyboard and the tutor still called the model. The paid rows:
 *
 *   in=2605 cr=5746 out=207   "ייעיעעיעי"
 *   in=2756 cr=5746 out=194   "י"
 *   in=2391 cr=5746 out=500   "אוקקי"
 *   in=1781 cr=5746 out=234   "חיים אתה"
 *
 * A 5,746-token cached prefix, plus two thousand tokens of context, to answer
 * the letter "י".
 *
 * Three attempts to DETECT gibberish were measured and all three failed: a
 * content vocabulary has "כדורגל" and not "אינדקס"; a consonant-run threshold
 * that rejects "אסדגכלדס" also rejects "דיפרנציאלי"; and letter bigrams have no
 * signal at all, because 6,958 real words already cover essentially every
 * Hebrew bigram.
 *
 * "Is this gibberish" has no reliable answer. "Is there any evidence of a
 * question" does — evidence is a positive thing you can enumerate, and each
 * source can be checked on its own.
 *
 * ============================================================
 * THE ASYMMETRY, AGAIN
 * ============================================================
 * A false NEGATIVE tells a student who asked something real that they did not
 * ask anything. A false POSITIVE costs half a cent. So ANY ONE signal is
 * enough to pass, the signals are deliberately redundant, and the message that
 * comes back on a block never says the student was wrong — it says nothing
 * arrived that could be worked with, and invites the question again.
 */

import { namesAMathsSubject } from '@/lib/maths-vocabulary';
import { HEBREW_LEXICON, ASKING_LEXICON } from '@/lib/generated/hebrew-lexicon';

/**
 * Words that make a message a question by themselves.
 *
 * A closed list, and short on purpose: these are the ones that carry the ask
 * regardless of what follows. Anything relying on the rest of the sentence
 * belongs to one of the other signals.
 */
const ASK_WORD =
  /(?:^|[^א-ת])(?:מה|למה|מדוע|איך|כיצד|מתי|איפה|היכן|כמה|האם|מי|מאיפה|מהיכן|מניין|תסביר|הסבר|תראה|תן|תני|עזור|תעזור|תפתור|תפתרי|בדוק|תבדוק|רמז|נוסחה|נוסחא|דוגמה|תרגיל|פתרון|צעד|שלב|טעות|טעיתי|תקוע|נתקעתי|הבנתי|מבין|רוצה|אפשר|צריך|טיפים|שאלה)(?:[^א-ת]|$)/;

/** Anything numeric or algebraic is a question about something. */
const HAS_MATHS = /[0-9]|[a-zA-Z]\s*[=<>]|[+\-*/^=<>]|\$|√|π|∞/;

const CONTENT_WORD = /^[֐-׿]{3,}$/;

const words = (s: string) =>
  s.replace(/[^֐-׿a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

export type QuestionVerdict =
  | { isQuestion: true; signal: string }
  | { isQuestion: false; reply: string };

/**
 * The reply when nothing arrived that can be worked with.
 *
 * ⚠️ IT NEVER SAYS THE STUDENT WAS WRONG. "לא הבנתי אותך" reads as a verdict on
 * them; "לא הגיעה אליי שאלה" reads as a verdict on the message, which is the
 * accurate one and the only one that survives being wrong. A student whose real
 * question was mistyped simply types it again.
 */
export const NOT_A_QUESTION_REPLY =
  'לא הגיעה אליי שאלה שאני יכול לעבוד איתה 🙂\nתכתוב לי במילים מה לא ברור, ונתקדם משם.';

/**
 * Decide whether to spend a model call.
 *
 * `questionText` is whatever is on the student's screen. A message echoing it
 * is about it, whatever else it contains — the cheapest and strongest signal
 * available, and the reason this takes a parameter at all.
 */
export function isQuestion(message: string, questionText?: string): QuestionVerdict {
  const raw = message.trim();
  const no = { isQuestion: false as const, reply: NOT_A_QUESTION_REPLY };

  // ---- nothing at all ----
  if (!raw) return no;

  // ---- signal 1: a word that carries an ask on its own ----
  if (ASK_WORD.test(raw)) return { isQuestion: true, signal: 'ask-word' };

  // ---- signal 2: anything numeric or algebraic ----
  //
  // ⚠️ BEFORE the length floor. "19" and "x=3" are three characters and are
  // complete, answerable messages — the router grades them against the
  // question's expected answer without any model at all.
  if (HAS_MATHS.test(raw)) return { isQuestion: true, signal: 'maths' };

  const w = words(raw);
  const content = w.filter((x) => CONTENT_WORD.test(x));

  // ---- signal 3: it names a piece of mathematics ----
  if (namesAMathsSubject(raw)) return { isQuestion: true, signal: 'maths-noun' };

  // ---- signal 4: it echoes the exercise on screen ----
  if (questionText) {
    const own = new Set(words(questionText).filter((x) => CONTENT_WORD.test(x)));
    if (content.some((x) => own.has(x))) return { isQuestion: true, signal: 'echoes-question' };
  }

  // ---- signal 5: a word this app has written down ----
  //
  // ⚠️ TWO LEXICONS, AND WHICH ONE APPLIES DEPENDS ON LENGTH.
  //
  // The wide set is every word the app has written, answers and word problems
  // included. On a long message that is good evidence. On a two-word message it
  // is not: "חיים אתה" passed on it, because a probability question is about
  // somebody called חיים. True, and no evidence that anything was asked.
  //
  // So a short message has to clear the ASKING vocabulary — FAQ questions and
  // their alternates, card aliases, maths nouns, curriculum names. "אינדקס" is
  // there because it is a card alias, so a student typing it alone is still
  // asking something this app has an answer for.
  const SHORT = 2;
  const lexicon = content.length <= SHORT ? ASKING_LEXICON : HEBREW_LEXICON;
  if (content.some((x) => lexicon.has(x))) {
    return { isQuestion: true, signal: content.length <= SHORT ? 'asking-lexicon' : 'lexicon' };
  }

  // ---- signal 6: enough real words to be a sentence ----
  //
  // ⚠️ THE SAFETY NET, AND IT IS DELIBERATELY GENEROUS. Four or more Hebrew
  // words of three-plus characters, none of which this app has ever written, is
  // still far more likely to be a student writing about something we have no
  // content for than a hand on the keyboard — mash does not come out as four
  // separate well-sized words. Costing a call there is the cheap mistake.
  if (content.length >= 4) return { isQuestion: true, signal: 'long-enough' };

  return no;
}
