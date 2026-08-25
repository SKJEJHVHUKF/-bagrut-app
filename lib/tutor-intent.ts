/**
 * tutor-intent.ts — one canonical name for the many ways a student says the
 * same thing.
 *
 * ============================================================
 * WHAT THIS IS FOR, AND WHAT IT MUST NOT DO
 * ============================================================
 * Two jobs, and the first one is the reason it exists:
 *
 *   1. LABELLING. Every message that reaches the model gets a stable intent
 *      name, so a report can say "40% of paid calls are `how_to_compute`"
 *      instead of listing 400 phrasings. Labelling changes NOTHING about
 *      routing — it only makes the problem countable.
 *   2. ROUTING, later and only where the answer can be GROUNDED in the
 *      question on screen.
 *
 * ⚠️ AN INTENT IS NOT PERMISSION TO ANSWER. Recognising "מה הנוסחה?" says what
 * the student wants; it does not mean we have it. The grounding check is
 * separate and lives in `groundingFor` — if the active question carries no
 * formulas, the honest outcome is still a model call. A general answer about
 * the topic, served because the intent matched, is exactly the failure the
 * cross-question reuse work spent its measurement avoiding: a student told
 * something true about a different exercise stops trusting the tutor.
 *
 * ============================================================
 * WHY RULES AND NOT A MODEL
 * ============================================================
 * A classifier call to decide whether to make a classifier call is the cost
 * this whole layer exists to avoid. Rules also abstain honestly: when nothing
 * matches, `intent` is null and the message continues down the existing chain
 * untouched. Guessing is the one thing that cannot be allowed here.
 */

import type { TutorFocus } from '@/lib/tutor-presence';
import { namesAMathsSubject, foreignSubject } from '@/lib/maths-vocabulary';

// ============================================================
// Canonical intents
// ============================================================

/** The families measured as recurring. Add only from the report, never from
 *  imagination — every phrasing family here came from a real session. */
export const CANONICAL_INTENTS = [
  'how_to_compute',
  'how_it_works',
  'how_to_solve',
  'explain',
  'what_to_do_here',
  'why_this_step',
  'give_example',
  'give_table',
  'which_formula',
  'next_step',
  'why_wrong',
  'didnt_understand',
  // ⚠️ THE FOUR BELOW MIRROR THE FAQ BANK'S OWN KINDS, AND THEIR ABSENCE WAS
  // THE LARGEST HOLE IN THE ROUTER.
  //
  // Measured over 21,381 Hebrew phrasings that content authors actually wrote
  // (scripts/measure-intent-coverage.ts): 85.1% matched no rule at all, and
  // 14,382 of those misses fall into exactly four shapes the bank has always
  // had entries for and the router had no name for. "מאיפה …" alone was 5,323
  // — the single most common way a student asks anything in this app.
  'where_from',
  'why_not',
  'what_if',
  'check',
  // ⚠️ The one intent that is ALLOWED to name its own subject.
  //
  // Every other rule here refuses a message that names a piece of mathematics,
  // because a general answer to a question about the exercise is something
  // true about something else. A concept question is the opposite case: the
  // subject IS the question, and the right answer is general by nature.
  //
  // It is safe only because of what may serve it. `concept` is answerable by
  // an authored Topic Card and by nothing else — no ladder rung, no FAQ entry,
  // no derived step. If no card matches, it goes to the model unchanged.
  'concept',
] as const;

export type CanonicalIntent = (typeof CANONICAL_INTENTS)[number];

export type IntentMatch = {
  intent: CanonicalIntent | null;
  /** 0–1. How sure the RULE is, before any grounding check. Never rounded up. */
  confidence: number;
  /** The normalised form the rule matched on — the only text a trace keeps. */
  canonical: string;
};

// ============================================================
// Normalisation
// ============================================================

const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/**
 * Politeness and filler that never changes the ask. Removed so "תן לי בבקשה
 * את הטבלה" and "תן טבלה" reach the same rule.
 *
 * ⚠️ NOT here: פה / כאן / הזה / עכשיו. Those are DEIXIS — they are the
 * evidence that the student means the exercise in front of them, which is the
 * single signal separating a groundable ask from a new question. Stripping
 * them would erase the thing the rules are reading.
 */
const FILLER = [
  'בבקשה', 'סליחה', 'תודה', 'רגע', 'אוקיי', 'אוקי', 'טוב', 'יאללה', 'בא לי',
  'אפשר', 'אולי', 'קצת', 'ממש', 'בעצם', 'סתם', 'כאילו', 'נו',
  // Possessives and the first person carry no ask: "מה הטעות שלי" asks exactly
  // what "מה הטעות" asks, and "אני תקוע" what "תקוע" asks. Every rule writes
  // לי as optional already, so dropping it here cannot break "תן לי".
  'לי', 'אני', 'שלי', 'שלך', 'לנו',
];

/** Typos and spellings seen in real messages, mapped to one form. */
const SPELLING: [RegExp, string][] = [
  [/מחשבי[םמ]/g, 'מחשבים'],
  [/פותרי[םמ]/g, 'פותרים'],
  [/עושי[םמ]/g, 'עושים'],
  [/מתחילי[םמ]/g, 'מתחילים'],
  [/נוסחא(?:ות)?/g, 'נוסחה'],
  [/תסבירי/g, 'תסביר'],
  [/הסבירי/g, 'הסבר'],
  // ⚠️ NOT `\b`. JavaScript defines a word boundary against [A-Za-z0-9_], so
  // between י and a space there is none and /תני\b/ can never fire — the same
  // trap documented in lib/mathscan/solve/classify.ts, and it came back here.
  // Found by scripts/test-tutor-intent.ts: "תני לי דוגמא" resolved to null
  // while "תן לי דוגמה" resolved correctly, which is the shape of a rule that
  // silently covers only half its family.
  [/תני(?![א-ת])/g, 'תן'],
  [/תבני(?![א-ת])/g, 'תבנה'],
  [/דוגמא/g, 'דוגמה'],
];

/**
 * The one text a trace is allowed to keep.
 *
 * Short, folded, punctuation-free, filler-free — enough to debug a miss, and
 * deliberately not the student's sentence. Anything that looks like contact
 * detail is dropped before anything else, because a maths chat is still a text
 * box and a text box eventually receives an email address.
 */
export function canonicalize(message: string): string {
  return String(message ?? '')
    .replace(/[\w.+-]+@[\w.-]+/g, ' ')
    .replace(/\b0\d[\d-]{7,}\b/g, ' ')
    .replace(/[?!.,:;"'`׳״()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => !FILLER.includes(w))
    .join(' ')
    .trim()
    .slice(0, 120);
}

/**
 * ⚠️ FOLDING IS APPLIED TO BOTH SIDES OR TO NEITHER.
 *
 * Final letters were folded inside `canonicalize` at first, so "תן דוגמה"
 * became "תנ דוגמה" while every rule below still said `תן` — and the two never
 * met. Measured effect on the first census: `give_example` matched 0 of 696
 * turns and `what_to_do_here` half of its own family, all reported as
 * `unknown_intent` with "תנ דוגמה" at the top of the list. A normaliser that
 * only one side of the comparison uses is not a normaliser.
 *
 * The readable form is what a trace stores and a report prints; folding
 * happens only for the match, on both the message and the pattern.
 */
function fold(s: string): string {
  return s.replace(/[ךםןףץ]/g, (c) => FINALS[c] ?? c);
}

function normalise(message: string): string {
  let t = canonicalize(message);
  for (const [re, to] of SPELLING) t = t.replace(re, to);
  return t.replace(/\s+/g, ' ').trim();
}

// ============================================================
// The rules
// ============================================================

/**
 * ⚠️ ANCHORING IS THE WHOLE SAFETY MODEL.
 *
 * A rule that matches anywhere in the sentence cannot tell "איך מחשבים?" from
 * "איך מחשבים סטיית תקן" — the first is about the screen, the second is a new
 * question the model should answer. Every rule below is therefore anchored at
 * BOTH ends, with an optional tail of deictic or intensifier words only.
 *
 * `weight` is the rule's confidence. 0.9 = the phrase can only mean this;
 * 0.7 = it usually does but the wording is shared with something else.
 */
type Rule = { intent: CanonicalIntent; re: RegExp; weight: number };

/** Build a rule with its pattern folded, so it meets the folded message. */
const R = (intent: CanonicalIntent, source: string, weight: number): Rule => ({
  intent,
  re: new RegExp(fold(source)),
  weight,
});

/** Words that point AT the exercise rather than naming a new subject. */
const HERE =
  '(?:את\\s*זה|את\\s*זו|לזה|לזו|זה|זאת|פה|כאן|עכשיו|בשאלה|בתרגיל|בסעיף|בשלב\\s*הזה)';
/** Emphasis that adds no subject. */
const JUST = '(?:בדיוק|בכלל|באמת|שוב|קצת)';
const OPEN = '(?:^|^ו|^אז|^טוב|^אבל)\\s*';
const TAIL = `(?:\\s*${HERE})?(?:\\s*${JUST})?\\s*$`;

/**
 * ⚠️ THESE ARE PHRASES, NOT WHOLE SENTENCES — and that reversal is the fix.
 *
 * The first version anchored every rule at both ends. It was precise and it
 * could not converge: "מה עושים עכשיו" matched and "אז מה עושים עכשיו עם זה?"
 * did not, because one extra word fell outside the anchor. Students write
 * hundreds of shapes; enumerating them by hand is a race that never ends, and
 * every screenshot Itay sent was one more shape nobody had listed.
 *
 * The anchoring existed to stop "איך מחשבים סטיית תקן" from being answered
 * about the exercise on screen. That job now belongs to the VETO in
 * `canonicalIntent` — the same object test that already screens the FAQ — so
 * the rules can go back to doing the one thing they are good at: recognising
 * the ask, wherever it sits in the sentence.
 *
 * A rule that matches too widely now costs a paid call at worst, because the
 * veto is what protects the student. A rule that matched too narrowly cost a
 * paid call every single time.
 */
// ⚠️ EVERY PATTERN BELOW IS TESTED AGAINST THE CANONICAL FORM, NOT THE RAW
// MESSAGE. `canonicalize` removes the FILLER words above, so a rule that
// mentions one can never match anything — it is dead the moment it is written
// and looks perfectly correct.
//
// Two rules were dead exactly this way: `איך אני בודק` (אני is filler) and
// `טעות שלי` (שלי is filler). `npm run test:intent` now fails on any pattern
// containing a filler word, so the next one is caught at authoring time.
const RULES: Rule[] = [
  // --- "איך מחשבים?" ------------------------------------------------
    R('how_to_compute', `(?:איך|כיצד)\\s*(?:מחשבים|לחשב|חישבת|מחשב)`, 0.9),
    R('how_to_compute', `${OPEN}(?:איך|כיצד)${TAIL}`, 0.7),

  // --- "איך זה עובד?" -----------------------------------------------
    R('how_it_works', `(?:איך|למה|מדוע|מה)\\s*זה\\s*(?:עובד|קשור|הולך|מסתדר|יוצא|קורה|נכון)`, 0.9),

  // --- "איך פותרים?" ------------------------------------------------
    R('how_to_solve', `(?:איך|כיצד)\\s*(?:[א-ת]+\\s+)?(?:פותרים|לפתור|ניגשים|לגשת|מתחילים|להתחיל|ממשיכים)`, 0.9),
    R('how_to_solve', `(?:מאיפה|מהיכן)\\s*(?:מתחילים|מתחיל(?:ה)?|להתחיל)`, 0.9),
    R('how_to_solve', `יש\\s*(?:עוד\\s*)?דרך`, 0.8),

  // --- "תסביר לי" ---------------------------------------------------
    R('explain', `(?:תסביר|הסבר|להסביר)`, 0.9),
    R('explain', `(?:יותר\\s*פשוט|פשוט\\s*יותר|במילים\\s*פשוטות|בפשטות|לא\\s*תפסתי)`, 0.85),

  // --- "מה עושים כאן?" ----------------------------------------------
    // ⚠️ The left boundary is load-bearing: "למה" ENDS in "מה", so an unguarded
    // `מה\s*עושים` swallows "למה עושים את זה" and reports it as
    // what_to_do_here instead of why_this_step. Hebrew has no word boundary in
    // JavaScript regex, so it is written as "not preceded by a Hebrew letter".
    R('what_to_do_here', `(?:^|[^א-ת])מה\\s*(?:עושים|לעשות|צריך\\s*לעשות|עלי\\s*לעשות)`, 0.85),

  // --- "למה עושים את זה?" -------------------------------------------
    R('why_this_step', `(?:למה|מדוע|בשביל\\s*מה)\\s*(?:עושים|מציבים|מחלקים|מכפילים|מחברים|מחסרים|בוחרים|צריך|לוקחים)`, 0.85),
    R('why_this_step', `${OPEN}(?:למה|מדוע)${TAIL}`, 0.7),

  // --- "תן דוגמה" ---------------------------------------------------
    R('give_example', `דוגמה`, 0.9),

  // --- "תן לי טבלה" -------------------------------------------------
    // `עץ` needs boundaries on both sides — it is two letters and sits inside
    // ordinary words. "תן לי עץ" is a real ask and must reach the tree card.
    R('give_table', `(?:טבלה|טבלת|דיאגרמ|(?:^|[^א-ת])עץ(?:[^א-ת]|$))`, 0.85),

  // --- "מאיפה ה-60?" -------------------------------------------------
    // The most common question shape in the bank, and the only one of the four
    // that can be answered from the question object: the step that introduces
    // the number IS the answer.
    R('where_from', `(?:^|[^א-ת])(?:מאיפה|מהיכן|מניין|מנין)`, 0.9),
    R('where_from', `(?:מה|למה)\\s*(?:אומר|המשמעות\\s*של)\\s*ה?סימון`, 0.85),
    R('where_from', `(?:איך|כיצד)\\s*(?:יצא|מגיעים|מקבלים|הגענו|הגיע|קיבלנו|יוצא)`, 0.85),

  // --- "למה לא הפוך?" ------------------------------------------------
    // Checked before why_this_step on purpose: "למה לא" is a question about a
    // road not taken, not about the step that was taken.
    R('why_not', `(?:למה|מדוע)\\s*(?:לא|אי(?:[^א-ת]|$)|אסור|אין)`, 0.9),

  // --- "מה אם היו ארבעה?" --------------------------------------------
    R('what_if', `(?:^|[^א-ת])(?:מה\\s*(?:אם|יקרה\\s*אם|היה\\s*קורה\\s*אם)|ואם\\s)`, 0.85),
    R('what_if', `מה\\s*(?:קורה|משתנה|יקרה|יהיה)`, 0.8),

  // --- "איך יודעים שזה נכון?" ----------------------------------------
    R('check', `איך\\s*(?:בודקים|לבדוק|יודעים\\s*ש|לוודא|מוודאים|אדע\\s*ש)`, 0.9),
    R('check', `איך\\s*(?:יודע|בודק|לבדוק|לוודא|מוודא|אדע)`, 0.85),
    R('check', `(?:מה\\s*ה?בדיקה|איך\\s*מאמתים|(?:יש\\s*)?דרך\\s*לבדוק|לבדוק\\s*את\\s*ה?תשובה)`, 0.85),

  // --- "מה הנוסחה?" -------------------------------------------------
    R('which_formula', `נוסחה`, 0.85),

  // --- "מה השלב הבא?" -----------------------------------------------
    R('next_step', `(?:ה)?(?:שלב|צעד)\\s*(?:ה)?בא`, 0.9),
    R('next_step', `מה\\s*(?:הלאה|עכשיו|אחר\\s*כך)`, 0.85),
    // Unanchored like the rest, with Hebrew boundaries. "טוב ואז מה" was the
    // last held-out phrasing still failing, and it failed for the old reason:
    // an anchor that expected the sentence to end where the keyword did.
    R('next_step', `(?:^|[^א-ת])(?:ואז|אז\\s*מה|המשך|תמשיך|הלאה)(?:[^א-ת]|$)`, 0.8),

  // --- "למה התשובה הזאת שגויה?" -------------------------------------
    R('why_wrong', `(?:טעיתי|טעות|לא\\s*נכונה|שגויה|לא\\s*בסדר|פספסתי)`, 0.9),
    R('why_wrong', `(?:למה|מדוע|איפה|מה)\\s*(?:זה\\s*)?לא\\s*נכון`, 0.9),
    R('why_wrong', `(?:מה\\s*ה?מלכודת|איפה\\s*טועים|במה\\s*מתבלבלים|התבלבלתי|חשבתי\\s*ש|יצא\\s*אחרת|טעות\\s*נפוצה)`, 0.85),

  // --- "לא הבנתי" ---------------------------------------------------
    R('didnt_understand', `(?:לא\\s*הבנתי|לא\\s*מבין|לא\\s*מבינה|לא\\s*ברור|לא\\s*מובן|מבולבל|תקוע|תקועה|נתקעתי|אבוד)`, 0.9),

  // --- concept: the subject IS the question -------------------------
  //
  // ⚠️ These rules deliberately require a NAMED SUBJECT, which every other
  // rule in this file refuses. That inversion is safe here and only here,
  // because a `concept` intent is answerable by an authored Topic Card and by
  // nothing else — no ladder rung, no derived step, no FAQ entry from another
  // exercise. No card, no answer.
  //
  // The subject is required (`[א-ת]{3,}` after the frame) precisely so a bare
  // "מה זה?" does NOT land here: with nothing named there is no card to find
  // and no question to answer.
    R('concept', `${OPEN}מה\\s*(?:זה|זו|זאת|הכוונה)\\s*ב?\\s*[א-ת].{2,}$`, 0.85),
    R('concept', `${OPEN}מה\\s*ה?הבדל\\s*בין\\s+[א-ת].{2,}$`, 0.9),
    R('concept', `מה\\s*(?:מייצג|מסמל|המשמעות\\s*של)\\s+[א-ת].{2,}`, 0.8),
    R('concept', `${OPEN}מתי\\s*(?:משתמשים|בוחרים|צריך)\\s*ב?[א-ת].{2,}$`, 0.85),
    // `\\S` and not `[א-ת]`: the subject is often written in maths notation —
    // "איך מזהים n p k בבינומית" is a concept question whose subject starts on
    // a latin letter, and requiring Hebrew there dropped it silently.
    R('concept', `${OPEN}(?:איך|כיצד)\\s*(?:קוראים|בונים|ממלאים|מזהים)\\s+\\S.{2,}$`, 0.85),

  // --- the catch-all "למה" ------------------------------------------
  //
  // ⚠️ LAST IN THE TABLE, AND THAT POSITION IS THE WHOLE DESIGN.
  //
  // "למה" opens 4,877 of the phrasings no rule matched — by far the largest
  // single shape in the corpus, and the old rule wanted למה followed by one of
  // eight verbs. Students write "למה האיבר", "למה המכנה", "למה הסכום",
  // "למה 3", "למה כל", "למה זו" — the noun is the subject, not a verb from a
  // list nobody can finish enumerating.
  //
  // Placed after EVERY other rule so each specific one gets first refusal:
  // "למה לא" is still why_not, "למה טעיתי" is still why_wrong, "למה זה עובד"
  // is still how_it_works. Only a "למה" that nothing else claimed lands here.
  // Confidence 0.7 says so — below the 0.75 line, so `decideFallbackReason`
  // reports `low_confidence` rather than pretending to be sure.
    R('why_this_step', `(?:^|[^א-ת])(?:למה|מדוע|מדוע)(?:[^א-ת]|$)`, 0.7),
];

/**
 * Which intent is this, if any?
 *
 * Returns `intent: null` whenever no rule matches at full anchor — and that is
 * the common case by design. A message that names a subject ("איך מחשבים
 * סטיית תקן") matches nothing here and continues to the model, which is
 * correct: it is a new question, not an ask about the screen.
 */
/**
 * Which intent is this, if any?
 *
 * ============================================================
 * THE VETO IS THE SAFETY MODEL — the rules are only the recogniser
 * ============================================================
 * A phrase rule fires wherever the ask appears, so "איך מחשבים סטיית תקן" and
 * "ואיך מחשבים?" both match `how_to_compute`. What separates them is not the
 * pattern but whether the sentence NAMES A SUBJECT of its own:
 *
 *   with `ownText`     the subject is foreign only if the question on screen
 *                      does not mention it. "מה עושים עם ההסתברות הזאת" on a
 *                      probability question names nothing foreign and is
 *                      answerable; "תסביר לי על וקטורים" there is.
 *   without `ownText`  any maths noun vetoes. Strictly more cautious, which is
 *                      right for a caller with no context to judge against —
 *                      the report, a test, a trace label.
 *
 * `concept` inverts both: it REQUIRES a named subject, because there the
 * subject is the question. It is safe only because an authored Topic Card is
 * the one thing allowed to answer it.
 *
 * This replaced whole-sentence anchoring. Anchoring was precise and could not
 * converge — one extra word broke every rule, and students write hundreds of
 * shapes. A rule that fires too widely now costs a model call at worst,
 * because the veto is what protects the student; a rule that fired too
 * narrowly cost a model call every time.
 */
export function canonicalIntent(message: string, ownText?: string): IntentMatch {
  const canonical = normalise(message);
  if (!canonical) return { intent: null, confidence: 0, canonical: '' };

  const folded = fold(canonical);
  const namesSubject = ownText
    ? foreignSubject(canonical, ownText) !== null
    : namesAMathsSubject(canonical);

  let best: Rule | null = null;
  for (const rule of RULES) {
    // The veto, and the inversion for `concept`.
    // ⚠️ The veto does NOT apply to `concept`. Its own patterns already
    // demand a subject ("מה זה <משהו>"), and the vocabulary list cannot
    // stand in for that: "מה זה בלי החזרה" names a real concept that no
    // noun list will ever contain in full. Gating concept on the list made
    // every card unreachable — measured, all ten card phrasings returned null.
    if (rule.intent !== 'concept' && namesSubject) continue;
    if (!rule.re.test(folded)) continue;
    if (!best || rule.weight > best.weight) best = rule;
  }
  return best
    ? { intent: best.intent, confidence: best.weight, canonical }
    : { intent: null, confidence: 0, canonical };
}

// ============================================================
// Grounding
// ============================================================

/** What, in the ACTIVE question, could answer this intent. */
export type Grounding =
  | { kind: 'hint'; text: string }
  | { kind: 'first-step'; text: string }
  | { kind: 'formulas'; text: string }
  | { kind: 'key-points'; text: string }
  | { kind: 'distractor-note'; text: string }
  | { kind: 'explanation'; text: string }
  | { kind: 'solution-steps'; text: string };

/** ⚠️ Every field is `unknown`, deliberately. The focus reaches here from
 *  `useState<any[]>` in app/quiz/page.tsx and from several content schemas
 *  that spell the same idea differently — `explanation` is a string on a
 *  ConceptQuestion and is NOT always one elsewhere, which threw on the first
 *  run of the report. A declared shape here would be a claim about data this
 *  module does not own. */
type LooseQuestion = Record<string, unknown> & {
  solution?: Record<string, unknown>;
};

const text = (v: unknown): string => (typeof v === 'string' && v.trim() ? v.trim() : '');
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * Is there authored content on THIS question that answers this intent?
 *
 * The answer is deliberately a piece of the question's own content, never a
 * topic-level fact. `null` means the honest outcome is a model call — this
 * function exists to say no.
 */
/**
 * The solution step that introduces what the student asked about, or null.
 *
 * ⚠️ DIGITS ONLY. A shared Hebrew word means nothing here — every step shares
 * words with its own question — but a number is specific enough to point at.
 * The step that mentions the MOST of what was asked wins, not the first one to
 * mention any of it: "מאיפה 7 מעל 3" belongs on the step that has both, not on
 * an earlier one that happens to contain a 3.
 *
 * Exported because `compileTutorResponse` answers `where_from` with exactly
 * this and a second copy would drift.
 */
/**
 * The written explanation a question carries, for the thing being asked.
 *
 * ⚠️ TWO CONTENT SHAPES, AND ONE OF THEM WAS INVISIBLE.
 *
 * A lesson question stores `solution.explanation` as a STRING. A concept-quiz
 * question (/quiz, 574 of them) stores an OBJECT with four fields —
 * `why_correct`, `why_wrong`, `concept`, `remember` — and every reader here
 * did `text(q.explanation)`, which yields '' for an object. So the richest
 * content in the app was unreachable, and every explanatory ask on /quiz came
 * back ungrounded and went to the model.
 *
 * Found by scripts/measure-quiz-gap: fifteen different phrasings failed on
 * ALL 574 questions, which is the signature of one systematic cause rather
 * than 574 missing entries. Counting bank entries could never have shown it.
 *
 * The field is chosen by what was asked, because the four are genuinely
 * different answers and handing over the wrong one is worse than handing over
 * nothing.
 */
export function explanationFor(
  q: Record<string, unknown> | null | undefined,
  intent?: CanonicalIntent | null,
): string {
  if (!q) return '';
  const direct = (q.solution as Record<string, unknown> | undefined)?.explanation ?? q.explanation;
  if (typeof direct === 'string') return direct.trim();
  if (!direct || typeof direct !== 'object') return '';
  const e = direct as Record<string, unknown>;
  const pick = (...keys: string[]): string => {
    for (const k of keys) if (typeof e[k] === 'string' && (e[k] as string).trim()) return (e[k] as string).trim();
    return '';
  };
  switch (intent) {
    case 'concept':
    case 'how_it_works':
      return pick('concept', 'why_correct', 'remember');
    case 'check':
      return pick('remember', 'why_correct', 'concept');
    case 'why_wrong':
      return pick('why_wrong', 'why_correct');
    case 'why_not':
      return pick('why_wrong', 'concept', 'why_correct');
    default:
      return pick('why_correct', 'concept', 'remember');
  }
}

export function stepIntroducing(steps: string[], message?: string): string | null {
  if (!message || !steps.length) return null;
  const asked = (message.match(/\d+(?:[.,]\d+)?/g) ?? []).filter((n) => n.length <= 6);
  if (!asked.length) return null;
  let hit: string | null = null;
  let best = 0;
  for (const st of steps) {
    const score = asked.filter((n) => st.includes(n)).length;
    if (score > best) { best = score; hit = st; }
  }
  return hit;
}

export function groundingFor(
  intent: CanonicalIntent,
  focus: TutorFocus | null,
  /**
   * The student's own words. Optional, and used by exactly one intent:
   * `where_from` cannot be answered without knowing WHICH number was asked
   * about. Every existing caller keeps working without passing it — they
   * simply get `null` for that one intent, which is the old behaviour.
   */
  message?: string,
): Grounding | null {
  const q = focus?.question as LooseQuestion | undefined;
  if (!q) return null;

  const steps = list(q.solution?.steps);
  const explanation = explanationFor(q as Record<string, unknown>, intent);
  const note =
    typeof focus?.chosenIndex === 'number' ? text(list(q.distractorNotes)[focus.chosenIndex]) : '';
  const hint = text(q.hint);
  const st = focus?.subTopic as Record<string, unknown> | undefined;
  const formulas = (Array.isArray(st?.formulas) ? st.formulas : []) as { name?: string }[];
  const keyPoints = list(st?.keyPoints);

  switch (intent) {
    case 'why_wrong':
      // The single best thing we can say, and only when it was written for the
      // option this student actually picked.
      if (note) return { kind: 'distractor-note', text: note };
      return explanation ? { kind: 'explanation', text: explanation } : null;

    case 'which_formula':
      return formulas.length ? { kind: 'formulas', text: formulas.map((f) => f.name ?? '').filter(Boolean).join(', ') } : null;

    case 'how_to_compute':
    case 'how_to_solve':
    case 'what_to_do_here':
    case 'next_step':
      if (steps.length) return { kind: 'first-step', text: steps[0] };
      return hint ? { kind: 'hint', text: hint } : null;

    case 'didnt_understand':
      // Rung 1, never the full solution: a student who says they are lost has
      // not asked for the answer.
      return hint ? { kind: 'hint', text: hint } : null;

    case 'how_it_works':
    case 'explain':
    case 'why_this_step':
      if (explanation) return { kind: 'explanation', text: explanation };
      return steps.length ? { kind: 'solution-steps', text: steps.join('\n') } : null;

    case 'concept':
      // A concept question is answered by an authored Topic Card, which is not
      // part of the active question at all. Nothing HERE can ground it, and
      // saying so is the honest answer.
      return null;

    case 'where_from': {
      // "מאיפה ה-60?" — the step that introduces the number IS the answer, and
      // it is already written. Without the student's words there is nothing to
      // look for, so this is the one intent that needs them.
      const hit = stepIntroducing(steps, message);
      return hit ? { kind: 'solution-steps', text: hit } : null;
    }

    case 'why_not':
    case 'what_if':
      // ⚠️ Honestly ungrounded. "למה לא הפוך" and "מה אם היו ארבעה" are about a
      // road the solution did not take, and nothing in the question object
      // describes roads not taken. The FAQ bank answers these — it has entries
      // written for exactly these kinds — and when it has none, a model call is
      // the truthful outcome. Naming the intent still earns its place: the
      // trace stops calling them `unknown_intent`, and the answer library knows
      // not to carry them to a different question.
      return null;

    case 'check':
      // "איך יודעים שזה נכון" — the last step is the one that closes the
      // argument, and on a written solution that is where the verification
      // lives. Falls back to nothing rather than inventing a method.
      return steps.length > 1 ? { kind: 'solution-steps', text: steps[steps.length - 1] } : null;

    case 'give_table':
    case 'give_example':
      // Deliberately NOT grounded from a hint or an explanation. A table is a
      // specific artefact; offering prose instead and calling it a table is
      // how a local answer earns a reputation for missing the point.
      return keyPoints.length ? { kind: 'key-points', text: keyPoints.join('\n') } : null;
  }
}
