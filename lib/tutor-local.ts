/**
 * tutor-local.ts — the tutor speaking, from material that is already written.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * Almost everything a student asks mid-exercise is one of six things: give me a
 * hint, where do I start, why is my answer wrong, just show me, which formula,
 * what should I remember. Every one already has an authored, human-checked
 * answer in the content:
 *
 *   question.hint                 the authored one-line nudge
 *   question.solution.steps       the worked solution
 *   question.solution.explanation why it works
 *   question.distractorNotes[i]   why THAT wrong option is wrong — written as
 *                                 a real misconception, one per distractor
 *   subTopic.formulas / keyPoints the module's tools and its "must remember"
 *   answer-check diagnosis        the shape of a mistake in a TYPED answer
 *
 * Sending those to an API to be paraphrased costs money on every turn and can
 * only make them worse: the model drifts, the authored text cannot.
 *
 * ============================================================
 * BUT PASTING CONTENT IS NOT TEACHING
 * ============================================================
 * The first version did exactly that, and it read like a database. The notes
 * were written as CAPTIONS beside an option, so as a chat reply they open
 * mid-thought — and nothing ever said "בחרת $x \ge 5$", as if the student were
 * expected to remember. Meanwhile "מאיפה מתחילים" could escalate all the way to
 * the full solution: a student who asked where to start was handed the end.
 *
 * So every answer here is a TEMPLATE with the authored content set inside it.
 * The template names what the student did, weaves the written explanation in,
 * and closes with exactly one next move.
 *
 * ============================================================
 * SIX RULES THE TEMPLATES OBEY — each one is a bug that happened
 * ============================================================
 * 1. NO MESSAGE STARTS WITH A SLOT. The bubble is `unicodeBidi: 'plaintext'`,
 *    not `dir="rtl"`, so a paragraph opening on a latin/math character flips
 *    the whole thing to LTR. globals.css documents this; it has bitten before.
 * 2. A FALLBACK USES NO OPTIONAL SLOT. It is the last stage — there is no
 *    third. It must read as a whole sentence with nothing filled in.
 * 3. THE TEMPLATE IS CHOSEN BY THE LADDER'S TIER, NOT THE STUDENT'S WORDING.
 *    "מאיפה מתחילים" on a 2-step question gets the hint, because no first-step
 *    rung exists. A template headed "הצעד הראשון:" over a hint body is a lie.
 * 4. `stepsLeft`/`firstStep` COME ONLY FROM THE first-step TIER, never from
 *    `solution.steps[0]`. The ladder already refuses that rung when the
 *    solution is short or when the first step leaks the answer.
 * 5. THE STUDENT'S TYPED ANSWER IS ALWAYS IN BACKTICKS. It is raw keyboard
 *    input through no content gate; a lone `$` opens a math span that swallows
 *    the rest of the Hebrew sentence.
 * 6. EVERY ANSWER ENDS IN ONE NEXT MOVE OR ONE QUESTION. Never a menu.
 *
 * Nothing here calls an API and nothing here generates text: every string is
 * authored content or a fixed template written by hand.
 */

import { buildHelpLadder, type HelpTier } from '@/lib/help-ladder';
import type { TutorFocus } from '@/lib/tutor-presence';

export type LocalAnswerKind =
  | 'why-wrong'
  | 'hint'
  | 'first-step'
  | 'key-points'
  | 'full'
  | 'formulas'
  | 'explain';

export type LocalAnswer = {
  /** Markdown + LaTeX, rendered by the same pipeline as a real reply. */
  text: string;
  kind: LocalAnswerKind;
};

/** What the student asked for. */
type Ask = 'help' | 'why-wrong' | 'full' | 'formulas' | 'key-points' | 'explain';

/**
 * Which situation the screen is in.
 *
 *   A  mcq, not answered yet          E  open, typed answer graded wrong
 *   B  mcq wrong, distractor note     F  open/proof, self-reported wrong
 *   C  mcq wrong, no note             G  open, not answered yet
 *   D  solution already revealed      H  no question on screen
 *   I  a question is on screen but we have no question object (bagrut view)
 */
type State = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

// ------------------------------------------------------------
// 1. What is the student asking?
// ------------------------------------------------------------

function norm(s: string): string {
  return s.replace(/[?!.,:;"'׳״\-–—()[\]]/g, ' ').replace(/\s+/g, ' ').trim();
}
const has = (t: string, ...w: string[]) => w.some((x) => t.includes(x));

/**
 * Keyword matching, deliberately blunt. A classifier here would be a second
 * model call — the cost this module exists to avoid — and every ambiguous case
 * is supposed to reach the real tutor anyway, so an instrument that abstains
 * often is the right one.
 *
 * Order matters: "למה התשובה שלי שגויה" contains both "למה" and "תשובה".
 */
export function classifyAsk(message: string): Ask | null {
  const t = norm(message);

  if (
    has(t, 'למה טעיתי', 'למה זה שגוי', 'למה התשובה שלי', 'מה הטעות שלי', 'איפה טעיתי') ||
    (has(t, 'למה') && has(t, 'שגוי', 'שגויה', 'לא נכון', 'לא נכונה', 'טעות', 'טעיתי'))
  ) {
    return 'why-wrong';
  }

  if (has(t, 'נוסחה', 'נוסחא', 'נוסחאות')) return 'formulas';

  // ⚠️ 'הכי חשוב' and 'חשוב לדעת' are here because the app's OWN one-tap chip
  // reads "מה הכי חשוב לדעת פה לבגרות?" (lib/tutor-presence.focusPrompts).
  // Without them the only button that produces this traffic fell through to the
  // API even though a perfectly good template was waiting for it.
  if (has(t, 'מה חשוב', 'הכי חשוב', 'חשוב לזכור', 'חשוב לדעת', 'מה לזכור', 'סיכום'))
    return 'key-points';

  if (
    has(t, 'תראה לי את הפתרון', 'הפתרון המלא', 'תפתור', 'תראה לי איך', 'פתרון מלא', 'תפתרי') ||
    (has(t, 'פתרון') && has(t, 'תראה', 'תן', 'רוצה', 'תסביר'))
  ) {
    return 'full';
  }

  // "Explain this to me" — the one-tap chip "תסביר לי את השאלה הזאת מההתחלה"
  // and its natural variants. Checked AFTER why-wrong/formulas/key-points/full,
  // so "תסביר למה טעיתי" and "תסביר את הפתרון" keep their more specific asks;
  // the bare "לא הבנתי" (no object) stays a help ask below.
  if (
    has(t, 'תסביר', 'תסבירי', 'הסבר לי', 'הסבירי') ||
    has(t, 'מה השאלה מבקשת', 'מה השאלה רוצה', 'מה מבקשים כאן', 'לא הבנתי את השאלה', 'מה זאת אומרת')
  ) {
    return 'explain';
  }

  // hint + "where do I start" collapse into one ask: which rung the student
  // actually gets is the ladder's call, not their phrasing (rule 3).
  if (
    has(t, 'רמז', 'תרמז', 'רמזים') ||
    has(t, 'מאיפה מתחילים', 'איך מתחילים', 'מאיפה להתחיל', 'הצעד הראשון', 'איך ניגשים') ||
    has(t, 'תקוע', 'תקועה', 'לא מצליח', 'לא מצליחה', 'נתקעתי', 'לא מבין', 'לא מבינה', 'לא הבנתי')
  ) {
    return 'help';
  }

  return null;
}

// ------------------------------------------------------------
// 2. Which situation are we in?
// ------------------------------------------------------------

function detectState(f: TutorFocus): State {
  // Keyed on the OBJECT first, not on the text. A screen that supplies the
  // question object is answerable whether or not it also set `questionText`,
  // and testing the text first sent a fully-populated focus to the
  // no-question-on-screen branch.
  if (f.question) {
    // fall through to the per-kind detection below
  } else if (f.questionText) {
    return 'I'; // something is displayed, but we hold no breakdown of it
  } else {
    return 'H'; // nothing to hold on to
  }
  const q = f.question;
  const answered = !!f.wrongAnswer || typeof f.chosenIndex === 'number';

  if (f.correctAnswer) return 'D';

  if (q.kind === 'mcq') {
    if (!answered) return 'A';
    const note =
      typeof f.chosenIndex === 'number' ? q.distractorNotes?.[f.chosenIndex]?.trim() : '';
    return note ? 'B' : 'C';
  }
  // open
  if (!answered) return 'G';
  return f.answerDiagnosis ? 'E' : 'F';
}

// ------------------------------------------------------------
// 3. Slots — every value a template may reference
// ------------------------------------------------------------

type Slots = Record<string, string | undefined>;

function buildSlots(f: TutorFocus, tier: HelpTier | null): Slots {
  const q = f.question;
  const st = f.subTopic;

  const keyPoints3 = (st?.keyPoints ?? []).slice(0, 3);

  return {
    // ⚠️ Only from the first-step tier (rule 4). Reading solution.steps[0]
    // here would bypass the ladder's leak check and its 3-step minimum.
    firstStep: tier?.kind === 'first-step' ? tier.body[0] : undefined,
    stepsLeft: tier?.kind === 'first-step' && tier.stepsLeft ? String(tier.stepsLeft) : undefined,
    hint: q?.hint?.trim() || undefined,
    keyPoints3: keyPoints3.length ? keyPoints3.map((k) => `- ${k}`).join('\n') : undefined,
    keyPoint1: keyPoints3[0],
    title: st?.title,
    // The sub-topic's authored overview — the closest thing to "explain this
    // to me from the top" that exists in writing.
    summary: st?.summary?.trim() || undefined,
    formulas: st?.formulas?.length
      ? st.formulas
          .map((x) => `- **${x.name}** — $${x.latex}$${x.note ? ` — ${x.note}` : ''}`)
          .join('\n')
      : undefined,
    steps: q?.solution.steps.length
      ? q.solution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : undefined,
    // The authored "which rule and why" line — solutions open with a step
    // marked `**הכלל:**` (probability first, rolling out per topic). Kept with
    // its label so the template can drop it in as-is.
    rule: q?.solution.steps.find((s) => s.startsWith('**הכלל:**'))?.trim() || undefined,
    finalAnswer: q?.solution.finalAnswer,
    explanation: q?.solution.explanation?.trim() || undefined,
    chosenText:
      typeof f.chosenIndex === 'number' ? q?.answers?.[f.chosenIndex] : undefined,
    correctText: f.correctAnswer,
    // Rule 5: raw keyboard input, always fenced.
    studentAnswer: f.wrongAnswer ? '`' + f.wrongAnswer.replace(/`/g, '') + '`' : undefined,
    why:
      (typeof f.chosenIndex === 'number' ? q?.distractorNotes?.[f.chosenIndex]?.trim() : '') ||
      q?.solution.explanation?.trim() ||
      undefined,
    // The authored note behind a matched predictable mistake on a TYPED answer
    // (question.wrongAnswers) — the open-question counterpart of {note}.
    kmNote: f.answerDiagnosis?.kind === 'known-mistake' ? f.answerDiagnosis.note : undefined,
    note:
      typeof f.chosenIndex === 'number' ? q?.distractorNotes?.[f.chosenIndex]?.trim() : undefined,
  };
}

// ------------------------------------------------------------
// 4. The templates
// ------------------------------------------------------------

type Tpl = { t: string; f: string; kind: LocalAnswerKind };
const T = (kind: LocalAnswerKind, t: string, f: string): Tpl => ({ kind, t, f });

/**
 * Keyed `${state}:${ask}` — and for the help ask, `${state}:help:${tierKind}`,
 * because rule 3 says the rung decides the wording. State E's why-wrong is
 * keyed by the diagnosis, with a DEFAULT INSIDE THE MAP: a new diagnosis kind
 * must not silently select the fallback, since a fallback is only chosen when a
 * slot is missing and here the slot is present.
 */
const TEMPLATES: Record<string, Tpl> = {
  // ---- A · MCQ, not answered yet -------------------------------------
  'A:help:hint': T(
    'hint',
    'רגע לפני שאתה בוחר — {hint}\n\nעכשיו תעבור על התשובות ותפסול כל אחת שלא מתאימה לזה. מה נשאר?',
    'רגע לפני שאתה בוחר: תכתוב לעצמך בשורה נפרדת מה השאלה מבקשת, ורק אז תסתכל על התשובות. איזו מהן לא מתאימה?',
  ),
  'A:help:first-step': T(
    'first-step',
    'הצעד הראשון כאן הוא זה:\n\n{firstStep}\n\nתכתוב אותו אצלך עם המספרים של השאלה. אחריו נשארו עוד {stepsLeft} צעדים — תעשה את הבא ותכתוב לי מה יצא לך.',
    'השאלה הזאת קצרה מדי בשביל להראות לך צעד ראשון בלי לגלות איתו את הסוף. אז נתחיל אחרת: תכתוב בשורה נפרדת מה השאלה מבקשת, ורק אז תיגע במספרים. מה כתבת?',
  ),
  'A:help:key-points': T(
    'key-points',
    'השאלה הזאת קצרה מדי בשביל צעד ראשון שלא מגלה את התשובה. אז הנה מה שהיא בודקת:\n\n{keyPoints3}\n\nתיקח את הראשון מהם ותבדוק אותו מול השאלה שעל המסך — הוא מתקיים?',
    'השאלה הזאת קצרה מדי בשביל צעד ראשון שלא מגלה את התשובה. אז נתחיל מהניסוח: תכתוב בשורה נפרדת מה השאלה מבקשת, ורק אז תסתכל על התשובות. מה כתבת?',
  ),
  'A:full': T(
    'full',
    'נעבור על הפתרון המלא:\n\n{steps}\n\n**התשובה: {finalAnswer}**\n\n**למה זה עובד:** {explanation}\n\nעכשיו תסגור את הפתרון ותפתור את השאלה מחדש. פתרון שקראת הוא עדיין לא פתרון שאתה יודע.',
    'נעבור על הפתרון המלא:\n\n{steps}\n\n**התשובה: {finalAnswer}**\n\nעכשיו תסגור את הפתרון ותפתור את השאלה מחדש. פתרון שקראת הוא עדיין לא פתרון שאתה יודע.',
  ),
  // Question-specific "which formula and why" — served BEFORE A:formulas when
  // the solution carries an authored `**הכלל:**` opening step. Both t and f
  // require {rule} ON PURPOSE (an exception to rule 2): when the question has
  // no rule line, both fail and the loop falls through to the generic
  // A:formulas below, which keeps today's behavior for every other topic.
  'A:formulas-q': T(
    'formulas',
    'שאלת בדיוק את השאלה הנכונה — קודם בוחרים כלי, רק אחר כך מחשבים. בשאלה הזאת:\n\n{rule}\n\nוכל שאר הכלים של {title}, כדי לראות איפה זה יושב:\n\n{formulas}\n\nעכשיו תציב בכלל הזה את המספרים מהשאלה — מה יוצא לך?',
    'שאלת בדיוק את השאלה הנכונה — קודם בוחרים כלי, רק אחר כך מחשבים. בשאלה הזאת:\n\n{rule}\n\nעכשיו תציב בכלל הזה את המספרים מהשאלה — מה יוצא לך?',
  ),
  'A:formulas': T(
    'formulas',
    'הנוסחאות שהשאלה הזאת יושבת עליהן, מתוך {title}:\n\n{formulas}\n\nתסתכל בשאלה מה נתון לך. הנוסחה שכל האיברים שלה נתונים חוץ מאחד — היא הנוסחה שצריך.',
    'אין לי כאן דף נוסחאות למסך הזה. תכתוב לי איזה ביטוי בשאלה אתה לא יודע לפתוח, ונתחיל ממנו.',
  ),
  'A:key-points': T(
    'key-points',
    'מה שחשוב לזכור ב{title}:\n\n{keyPoints3}\n\nתיקח את הראשון מהם ותבדוק אותו מול השאלה שעל המסך — הוא מתקיים?',
    'אין לי כאן רשימת דגשים למסך הזה. תכתוב בשתי שורות מה השאלה הזאת בודקת לדעתך, ואני אגיד לך אם דייקת.',
  ),
  'A:why-wrong': T(
    'why-wrong',
    'עוד לא סימנת כאן תשובה, אז אין לי מה להשוות מולה — ואני לא רוצה לנחש. מה שכן יש: {hint}\n\nתיקח את האפשרות שאתה שוקל ותבדוק אותה מול המשפט הזה — היא מתאימה?',
    'עוד לא סימנת כאן תשובה, אז אין לי מה להשוות מולה — ואני לא רוצה לנחש. תכתוב לי איזו אפשרות אתה שוקל ולמה, ונבדוק אותה יחד.',
  ),
  // "תסביר לי את השאלה הזאת מההתחלה" — the one-tap chip. Explains WHAT the
  // question is testing and how to read it, without solving: the topic, the
  // one rule it stands on, and the authored nudge. Borrowed by B/C/E/F/G via
  // keysFor, so a student who already answered gets the same grounding.
  'A:explain': T(
    'explain',
    'בוא נפרק את השאלה שעל המסך, בלי לפתור אותה.\n\nהיא שייכת לנושא **{title}**, והכלל שהיא נשענת עליו: {keyPoint1}\n\nוהכיוון שלה: {hint}\n\nעכשיו קרא אותה שוב לאט, וכתוב לעצמך בשורה אחת מה נתון ומה מבקשים. כתוב לי מה יצא — ומשם נמשיך יחד.',
    'בוא נפרק את השאלה שעל המסך, בלי לפתור אותה: קרא אותה שוב לאט, וכתוב בשורה אחת מה נתון ובשורה שנייה מה מבקשים. שלח לי את שתי השורות — ואגיד לך אם דייקת.',
  ),

  // ---- B · MCQ wrong, authored note ----------------------------------
  'B:why-wrong': T(
    'why-wrong',
    'בחרת {chosenText}. הנה בדיוק מה שקרה שם:\n\n{note}\n\nעכשיו תסתכל שוב על התשובות עם זה בראש — במה תבחר?',
    'בחרת {chosenText}. אין לי כאן הסבר כתוב לטעות הזאת ואני לא רוצה לנחש — אז נבדוק אותה ישר: תציב את מה שסימנת בחזרה בשאלה ותעבור על התנאים אחד-אחד. איזה מהם נשבר ראשון?',
  ),
  'B:help:hint': T(
    'hint',
    'כבר פסלת אפשרות אחת, וזו התקדמות אמיתית. בוא ניגש לזה מהכלל עצמו: {hint}\n\nתעבור על התשובות ותפסול כל אחת שנופלת באותה נקודה. מה נשאר?',
    'כבר פסלת אפשרות אחת, וזו התקדמות אמיתית. עכשיו תציב את התשובה שסימנת בחזרה בשאלה ותבדוק אם היא מקיימת את הדרישה. אם לא — אותה בדיקה תפסול עוד אפשרויות.',
  ),
  'B:help:first-step': T(
    'first-step',
    'בוא נשים בצד את התשובות ונפתור ישר. הצעד הראשון:\n\n{firstStep}\n\nאחריו נשארו עוד {stepsLeft} צעדים. תעשה את הבא, ואז נשווה למה שסימנת.',
    'בוא נשים בצד את התשובות ונפתור ישר: תכתוב בשורה נפרדת מה השאלה מבקשת, בלי להסתכל על התשובות. מה יצא לך?',
  ),
  'B:help:key-points': T(
    'key-points',
    'בוא נשים בצד את התשובות. השאלה קצרה מדי בשביל צעד ראשון שלא מגלה את הסוף, אז הנה הכללים שהיא נשענת עליהם:\n\n{keyPoints3}\n\nתבדוק מולם את {chosenText} — היא עומדת בהם או נופלת?',
    'בוא נשים בצד את התשובות. תציב את התשובה שסימנת בחזרה בשאלה ותעבור על התנאים אחד-אחד — איזה מהם נשבר ראשון?',
  ),
  'B:full': T(
    'full',
    'בוא נפרוס את זה מהתחלה:\n\n{steps}\n\n**התשובה: {finalAnswer}**\n\n**למה זה עובד:** {explanation}\n\nעכשיו תגיד במילים שלך באיזה צעד {chosenText} נפרדת מהפתרון הזה.',
    'בוא נפרוס את זה מהתחלה:\n\n{steps}\n\n**התשובה: {finalAnswer}**\n\nעכשיו תגיד במילים שלך באיזה צעד התשובה שסימנת נפרדה מהפתרון הזה.',
  ),

  // ---- C · MCQ wrong, no note for that option ------------------------
  // This replaces the one `return null` in the old code that fell through to
  // the API on a request that has written material behind it.
  'C:why-wrong': T(
    'why-wrong',
    'בחרת {chosenText}. אין לי כאן הסבר כתוב לטעות הזאת ואני לא רוצה לנחש מה עבר לך בראש — אז ניקח את זה בדרך שתמיד עובדת: {hint}\n\nתעביר את {chosenText} דרך הדרישה הזאת — איפה בדיוק היא נשברת?',
    'בחרת {chosenText}. אין לי כאן הסבר כתוב לטעות הזאת ואני לא רוצה לנחש — אז נבדוק אותה ישר: תציב את מה שסימנת בחזרה בשאלה ותעבור על התנאים אחד-אחד. איזה מהם נשבר ראשון?',
  ),

  // ---- D · solution already on screen --------------------------------
  'D:why-wrong': T(
    'why-wrong',
    'בחרת {chosenText}, והנכונה היא {correctText}. כל ההבדל יושב בנקודה אחת:\n\n{why}\n\nאיזה צעד בפתרון הוא זה שמפריד בין השתיים?',
    'בחרת {chosenText}, והנכונה היא {correctText}. תנסה לנסח לעצמך במשפט אחד מה מפריד ביניהן ותכתוב לי אותו — אם הצלחת לנסח, זה כבר שלך.',
  ),
  'D:full': T(
    'full',
    'הפתרון כבר פתוח לפניך, אז במקום לחזור עליו — הנה השלד שלו:\n\n{steps}\n\n**למה זה עובד:** {explanation}\n\nעכשיו תכסה את המסך ותכתוב לי את הצעד הראשון מהזיכרון. אם הוא יוצא לך, כל השאר נגזר ממנו.',
    'הפתרון כבר פתוח לפניך, אז במקום לחזור עליו: תכסה את המסך ותכתוב לי את הצעד הראשון מהזיכרון. אם הוא יוצא לך, השאר יוצא איתו.',
  ),
  'D:key-points': T(
    'key-points',
    'מה ששווה לקחת מהשאלה הזאת: {explanation}\n\nאם תפגוש שאלה כזאת בבגרות, מה הדבר הראשון שתבדוק?',
    'תנסה לנסח לעצמך במשפט אחד מה השאלה הזאת בדקה, ותכתוב לי אותו. אם הצלחת לנסח — זה כבר שלך.',
  ),
  'D:explain': T(
    'explain',
    'הפתרון כבר פתוח לפניך, אז "להסביר מההתחלה" פירושו להסביר למה הצעדים האלה בכלל: {explanation}\n\nעכשיו כסה את הפתרון ונסה לשחזר מהזיכרון את הצעד הראשון — כתוב לי אותו, ואגיד לך אם הוא מדויק.',
    'הפתרון כבר פתוח לפניך. כסה אותו, נסה לשחזר מהזיכרון את הצעד הראשון, וכתוב לי אותו — אם הוא יוצא לך, כל השאר נגזר ממנו.',
  ),

  // ---- E · typed answer, graded wrong, keyed by the diagnosis --------
  'E:why-wrong:known-mistake': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. אני מזהה בדיוק את הטעות — היא מוכרת:\n\n{kmNote}\n\nעכשיו תקן רק את הצעד הזה ותחשב שוב — מה יוצא לך?',
    'קראתי את מה שכתבת, והתוצאה לא נכונה — אבל אני לא רוצה לנחש איפה. תכתוב לי את השורה האחרונה שאתה בטוח בה, ונמשיך משם.',
  ),
  'E:why-wrong:sign-flip': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. הגודל נכון והסימן הפוך — כלומר השיטה שלך עבדה, ומה שנשבר הוא מינוס אחד באחד המעברים. זו הטעות הכי שקטה שיש, כי כל השאר נראה תקין.\n\nתחזור לצעד שבו העברת אגף או פתחת סוגריים — איפה זה קרה?',
    'קראתי את מה שכתבת, והגודל נכון עם סימן הפוך. תחזור לצעד שבו העברת אגף או פתחת סוגריים — איפה הסימן התהפך?',
  ),
  'E:why-wrong:conjugate': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. החלק הממשי מדויק, והחלק המדומה יצא עם סימן הפוך — זה הצמוד של התשובה, לא התשובה עצמה.\n\nאיפה בדרך הופיע צמוד — בחילוק, בכפל או בשורש?',
    'קראתי את מה שכתבת: החלק הממשי מדויק, והחלק המדומה יצא עם סימן הפוך. איפה בדרך הופיע צמוד — בחילוק, בכפל או בשורש?',
  ),
  'E:why-wrong:partial-set': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. כל מה שכתבת נכון — לא המצאת כלום. מה שחסר זה לא חישוב אלא ספירה: עצרת לפני הסוף.\n\nמה בשאלה הזאת מייצר יותר מפתרון אחד, ואיפה עצרת?',
    'קראתי את מה שכתבת, וכל מה שרשמת נכון — פשוט עצרת לפני הסוף. מה בשאלה הזאת מייצר יותר מפתרון אחד?',
  ),
  'E:why-wrong:extra-root': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. האלגברה שלך תקינה, וכל מה שכתבת מקיים את המשוואה שגזרת — אבל מה שמקיים את המשוואה הוא לא בהכרח פתרון של השאלה.\n\nתציב כל ערך שכתבת בנפרד בשאלה המקורית, לא במשוואה שגזרת. איזה מהם לא חוקי שם?',
    'האלגברה שלך תקינה, וכל מה שכתבת מקיים את המשוואה שגזרת — אבל מה שמקיים את המשוואה הוא לא בהכרח פתרון של השאלה. תציב כל ערך בנפרד בשאלה המקורית — איזה מהם לא חוקי שם?',
  ),
  // Labelled boxes (answerLabels) with every value right but in the wrong box.
  'E:why-wrong:swapped': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. הערכים עצמם נכונים, אבל הם יושבים בתיבות הלא-נכונות: מה שכתבת בתיבה אחת שייך לתיבה האחרת.\n\nתחזור לשאלה ותבדוק מה כל גודל מסמן, ותכתוב כל ערך ליד הסימון שלו.',
    'הערכים עצמם נכונים, אבל הם יושבים בתיבות הלא-נכונות. תחזור לשאלה ותבדוק מה כל גודל מסמן, ותכתוב כל ערך ליד הסימון שלו.',
  ),
  // ⚠️ The default lives IN the map, not in the fallback. A fallback is only
  // reached when a slot is missing — here the slot is present, so an unknown
  // diagnosis kind would otherwise render a broken key.
  'E:why-wrong': T(
    'why-wrong',
    'קראתי את מה שכתבת: {studentAnswer}. התוצאה לא נכונה, אבל צורת ההפרש לא מספיקה לי כדי לדעת איפה זה נשבר, ואני לא רוצה לנחש.\n\nתכתוב לי את השורה האחרונה שאתה בטוח בה, ונמשיך משם.',
    'קראתי את מה שכתבת, והתוצאה לא נכונה — אבל אני לא רוצה לנחש איפה. תכתוב לי את השורה האחרונה שאתה בטוח בה, ונמשיך משם.',
  ),
  'E:help:hint': T(
    'hint',
    'כתבת {studentAnswer} — בוא נשים את זה בצד רגע. {hint}\n\nתבדוק את השורה האחרונה שכתבת מול הרמז הזה — היא עומדת בו?',
    'בוא נשים בצד רגע את מה שכתבת ונעשה את הבדיקה שתמיד עובדת: תציב את התשובה שלך בחזרה בשאלה עצמה. מה לא מסתדר?',
  ),

  // ---- F · proof / open, self-reported wrong -------------------------
  // The focus here is byte-identical to "not answered yet", so any claim about
  // what the student did would be an invention.
  'F:why-wrong': T(
    'why-wrong',
    'אתה מדווח שזה לא יצא, ואיני רואה את הדף שלך — אז לא אנחש היכן זה נשבר. אבל זה מה שהשאלה נשענת עליו: {hint}\n\nאין צורך להתחיל מחדש — עבור על מה שכתבת ואתר את השורה הראשונה שאינה עומדת במשפט הזה.',
    'אתה מדווח שזה לא יצא, ואיני רואה את הדף שלך — אז לא אנחש היכן זה נשבר. אין צורך להתחיל מחדש: עבור על מה שכתבת, אתר את השורה הראשונה שאינך יכול להצדיק, וכתוב לי אותה.',
  ),

  // ---- G · open question, not answered yet ---------------------------
  'G:help:hint': T(
    'hint',
    'עוד לא כתבת דבר, וזה הרגע הטוב ביותר לרמז — ערכו גדול יותר לפני שהדף מתמלא. {hint}\n\nרשום שורה אחת בעקבותיו — לא את הפתרון, אלא את התנאי או המשוואה שהוא מכתיב.',
    'עוד לא כתבת דבר, וזה בסדר גמור. נתחיל מהמקום שתמיד עובד: רשום בשורה אחת מה נתון, ובשורה שנייה מה נדרש. שלח לי את שתי השורות.',
  ),
  'G:help:first-step': T(
    'first-step',
    'הצעד הראשון בשאלה הזאת:\n\n{firstStep}\n\nכתוב אותו אצלך עם המספרים של השאלה. אחריו נותרו עוד {stepsLeft} צעדים — בצע את הבא וכתוב לי מה קיבלת.',
    'השאלה הזאת קצרה מכדי לתת צעד ראשון בלי לגלות את הסוף. אז נתחיל אחרת: כתוב בשורה נפרדת מה השאלה דורשת שיתקיים, ורק אז תיגע במספרים. מה כתבת?',
  ),

  // ---- H · no question on screen -------------------------------------
  'H:help': T(
    'hint',
    'אין לי שאלה על המסך לתפוס בה, ו"תקוע" לבדו רחב מדי מכדי לתת רמז. הנה העיקר של {title}:\n\n{keyPoint1}\n\nכתוב לי אם המשפט הזה מובן לך מאליו או לא — התשובה תקבע מהיכן נתחיל.',
    'אין לי כאן שאלה על המסך לתפוס בה. פתח תרגיל אחד מהנושא, אפילו קל, וכתוב לי היכן נעצרת. על שאלה קונקרטית אוכל לעזור הרבה יותר.',
  ),
  'H:key-points': T(
    'key-points',
    'אין עכשיו שאלה על המסך, אז ניקח את זה מלמעלה. מה שחשוב לזכור ב{title}:\n\n{keyPoints3}\n\nבחר את הדגש הפחות ברור לך וכתוב לי אותו — משם נצא לתרגול ממוקד.',
    'אין לי כאן רשימת דגשים למסך הזה. כתוב לי איזה חלק בנושא הזה רעוע אצלך, ונתחיל בדיוק ממנו.',
  ),
  // "תסביר לי את {topic}" — the topic-level chip. The authored sub-topic
  // overview IS the written explanation; when no sub-topic is published the
  // fallback asks for an anchor instead of paying a model to improvise.
  'H:explain': T(
    'explain',
    'ניקח את זה מלמעלה. הנה ההסבר של **{title}**, מהחומר עצמו:\n\n{summary}\n\nזה הבסיס. עכשיו בחר מכאן משפט אחד שהכי פחות ברור לך וכתוב לי אותו — ומשם נצלול פנימה.',
    'כדי להסביר כמו שצריך אני צריך עוגן: כתוב לי איזה מושג או איזו שאלה עצרו אותך, ונתחיל בדיוק משם.',
  ),
  'H:formulas': T(
    'formulas',
    'אין עכשיו שאלה על המסך, אז זה בדיוק הזמן לעבור על הנוסחאות של {title}:\n\n{formulas}\n\nבחר אחת וכתוב לי באיזה סוג שאלה היא משמשת. לדעת מתי משתמשים שווה יותר מלדעת בעל-פה.',
    'אין לי כאן דף נוסחאות למסך הזה. כתוב לי איזה גודל אתה מנסה לחשב, ואכוון אותך לנוסחה המתאימה.',
  ),
  'H:full': T(
    'full',
    'אין כרגע שאלה על המסך שאפשר לפתור. בחר תרגיל אחד מ{title} ונעבור עליו צעד אחר צעד. באיזה תבחר?',
    'אין כרגע שאלה על המסך שאפשר לפתור. פתח תרגיל ואני אעבור עליו איתך צעד-צעד.',
  ),
  'H:why-wrong': T(
    'why-wrong',
    'אני לא רואה כרגע את השאלה שטעית בה. כתוב לי מה ענית, ונתחיל משם.',
    'אני לא רואה כרגע את השאלה שטעית בה. כתוב לי מה ענית, ונתחיל משם.',
  ),

  // ---- the graded rungs are spent ------------------------------------
  // Reached when the ladder has nothing ungiven left. The old code escalated
  // to the full solution here, which is exactly backwards: the student asked
  // where to start, not for the answer. But silence is a dead end, so this is
  // the honest third move — hand the initiative back and ask for their work.
  // If they then ask to see it, the 'full' ask gives it to them, deliberately.
  'ANY:help': T(
    'hint',
    'עברנו על הרמז ועל הכללים ואתה עדיין תקוע. בדרך כלל זה סימן שנקודת התקיעה אינה באף אחד מהם. כתוב לי את השורה האחרונה שהצלחת לכתוב, גם אם אינך בטוח בה, ונמשיך משם.',
    'עברנו על הרמז ועל הכללים ואתה עדיין תקוע. בדרך כלל זה סימן שנקודת התקיעה אינה באף אחד מהם. כתוב לי את השורה האחרונה שהצלחת לכתוב, גם אם אינך בטוח בה, ונמשיך משם.',
  ),

  // ---- I · a question is displayed but we hold no question object ----
  // Slotless on purpose: there is nothing true to fill in.
  'I:any': T(
    'hint',
    'אני רואה שיש כאן שאלה, אבל לא את הפירוק שלה — אז לא אמציא צעדים. כתוב לי באיזה סעיף אתה נמצא ומה השורה האחרונה שקיבלת, ונמשיך משם.',
    'אני רואה שיש כאן שאלה, אבל לא את הפירוק שלה — אז לא אמציא צעדים. כתוב לי באיזה סעיף אתה נמצא ומה השורה האחרונה שקיבלת, ונמשיך משם.',
  ),
};

/**
 * Ordered candidate keys. Inheritance is just "try the more specific key, then
 * the more general one" — C borrows B's non-why-wrong wording, G borrows A's,
 * E borrows A's for anything but why-wrong and hint.
 */
function keysFor(state: State, ask: Ask, tierKind?: string, diag?: string): string[] {
  const out: string[] = [];
  if (state === 'I') return ['I:any'];

  if (ask === 'help') {
    if (tierKind) {
      out.push(`${state}:help:${tierKind}`);
      if (state === 'C') out.push(`B:help:${tierKind}`);
      if (state === 'E' || state === 'F') out.push(`G:help:${tierKind}`, `A:help:${tierKind}`);
      if (state === 'G') out.push(`A:help:${tierKind}`);
      if (state === 'D') out.push(`A:help:${tierKind}`);
    }
    out.push(`${state}:help`);
    // Terminal rung: nothing ungiven is left on the ladder.
    out.push('ANY:help');
    return out;
  }

  if (state === 'E' && ask === 'why-wrong' && diag) out.push(`E:why-wrong:${diag}`);
  // A formulas ask on a question whose solution names its rule gets the
  // question-specific answer first, in every state; without a rule line the
  // template pair fails to fill and the generic keys below take over.
  if (ask === 'formulas') out.push('A:formulas-q');
  out.push(`${state}:${ask}`);
  // Everything that isn't specialised borrows A's wording verbatim.
  if (state === 'C') out.push(`B:${ask}`);
  if (state === 'B' || state === 'D' || state === 'E' || state === 'F' || state === 'G')
    out.push(`A:${ask}`);
  return out;
}

// ------------------------------------------------------------
// 5. Render
// ------------------------------------------------------------

const SLOT = /\{([a-zA-Z0-9]+)\}/g;

/** Fill a template, or null when a slot it needs has no value. */
function fill(tpl: string, slots: Slots): string | null {
  let missing = false;
  const out = tpl.replace(SLOT, (_, name: string) => {
    const v = slots[name];
    if (v === undefined || v === '') {
      missing = true;
      return '';
    }
    return v;
  });
  return missing ? null : out;
}

// ------------------------------------------------------------
// 6. The entry point
// ------------------------------------------------------------

/**
 * Answer from authored content, or null to let the real tutor handle it.
 *
 * @param alreadyServed rungs already given for THIS question, so a second
 *   "אני תקוע" walks the ladder instead of repeating itself.
 */
export function answerLocally(
  message: string,
  focus: TutorFocus | null,
  alreadyServed: LocalAnswerKind[] = [],
): LocalAnswer | null {
  if (!focus) return null;
  const ask = classifyAsk(message);
  if (!ask) return null;

  const state = detectState(focus);

  // The ladder decides which rung a "help" ask gets (rule 3). Only rungs with
  // a real body count, and one already served is spent.
  //
  // 'full' is NOT part of this walk. A student who asked where to start has not
  // asked for the answer, and escalating them into it was the loudest failure
  // of the first version.
  let tier: HelpTier | null = null;
  if (ask === 'help' && focus.question) {
    const ladder = buildHelpLadder(focus.question, focus.subTopic ?? null);
    tier =
      ladder.tiers.find(
        (t) => t.kind !== 'full' && t.body.length > 0 && !alreadyServed.includes(t.kind),
      ) ?? null;
  }

  const slots = buildSlots(focus, tier);
  const diag = focus.answerDiagnosis?.kind;

  for (const key of keysFor(state, ask, tier?.kind, diag)) {
    const tpl = TEMPLATES[key];
    if (!tpl) continue;
    const filled = fill(tpl.t, slots);
    if (filled) return { kind: tpl.kind, text: filled };
    // Rule 2: the fallback carries no optional slot, so it always renders.
    const fb = fill(tpl.f, slots);
    if (fb) return { kind: tpl.kind, text: fb };
  }
  return null;
}
