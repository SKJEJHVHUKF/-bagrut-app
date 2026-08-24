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
const RULES: Rule[] = [
  // --- "איך מחשבים?" ------------------------------------------------
    R('how_to_compute', `(?:איך|כיצד)\\s*(?:מחשבים|לחשב|חישבת|מחשב)`, 0.9),
    R('how_to_compute', `${OPEN}(?:איך|כיצד)${TAIL}`, 0.7),

  // --- "איך זה עובד?" -----------------------------------------------
    R('how_it_works', `(?:איך|למה|מדוע|מה)\\s*זה\\s*(?:עובד|קשור|הולך|מסתדר|יוצא|קורה|נכון)`, 0.9),

  // --- "איך פותרים?" ------------------------------------------------
    R('how_to_solve', `(?:איך|כיצד)\\s*(?:פותרים|לפתור|ניגשים|לגשת|מתחילים|להתחיל|ממשיכים)`, 0.9),
    R('how_to_solve', `(?:מאיפה|מהיכן)\\s*(?:מתחילים|מתחיל(?:ה)?|להתחיל)`, 0.9),

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
    R('why_wrong', `(?:טעיתי|הטעות|טעות\\s*שלי|לא\\s*נכונה|שגויה|לא\\s*בסדר|פספסתי)`, 0.9),
    R('why_wrong', `(?:למה|מדוע|איפה|מה)\\s*(?:זה\\s*)?לא\\s*נכון`, 0.9),

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
    R('concept', `${OPEN}מתי\\s*(?:משתמשים|בוחרים|צריך)\\s*ב?[א-ת].{2,}$`, 0.85),
    // `\\S` and not `[א-ת]`: the subject is often written in maths notation —
    // "איך מזהים n p k בבינומית" is a concept question whose subject starts on
    // a latin letter, and requiring Hebrew there dropped it silently.
    R('concept', `${OPEN}(?:איך|כיצד)\\s*(?:קוראים|בונים|ממלאים|מזהים)\\s+\\S.{2,}$`, 0.85),
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
export function groundingFor(intent: CanonicalIntent, focus: TutorFocus | null): Grounding | null {
  const q = focus?.question as LooseQuestion | undefined;
  if (!q) return null;

  const steps = list(q.solution?.steps);
  const explanation = text(q.solution?.explanation) || text(q.explanation);
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

    case 'give_table':
    case 'give_example':
      // Deliberately NOT grounded from a hint or an explanation. A table is a
      // specific artefact; offering prose instead and calling it a table is
      // how a local answer earns a reputation for missing the point.
      return keyPoints.length ? { kind: 'key-points', text: keyPoints.join('\n') } : null;
  }
}
