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

const RULES: Rule[] = [
  // --- "איך מחשבים?" ------------------------------------------------
    R('how_to_compute', `${OPEN}(?:איך|כיצד)\\s*(?:מחשבים|לחשב|חישבת|מחשב)${TAIL}`, 0.9),
    R('how_to_compute', `${OPEN}(?:איך|כיצד)${TAIL}`, 0.7),

  // --- "איך זה עובד?" -----------------------------------------------
    R('how_it_works', `${OPEN}(?:איך|למה|מדוע|מה)\\s*זה\\s*(?:עובד|קשור|הולך|מסתדר|יוצא|קורה)${TAIL}`, 0.9),

  // --- "איך פותרים?" ------------------------------------------------
    R('how_to_solve', `${OPEN}(?:איך|כיצד)\\s*(?:פותרים|לפתור|ניגשים|מתחילים|להתחיל)${TAIL}`, 0.9),
    // Singular AND plural. `אני` is filler now, so "מאיפה אני מתחיל" arrives as
    // "מאיפה מתחיל" — and a rule written only for the plural missed it.
    R('how_to_solve', `${OPEN}(?:מאיפה|מהיכן)\\s*(?:מתחילים|מתחיל(?:ה)?|להתחיל)${TAIL}`, 0.9),

  // --- "תסביר לי" ---------------------------------------------------
    // The "more simply" phrases are an optional TAIL of the verb, not only a
    // sentence of their own: "תסביר במילים פשוטות" is one ask, and the first
    // version needed two separate rules that between them covered neither.
    R('explain', `${OPEN}(?:תסביר|הסבר)(?:\\s*(?:יותר\\s*פשוט|פשוט\\s*יותר|במילים\\s*פשוטות|בפשטות|שוב|מחדש))?${TAIL}`, 0.9),
    R('explain', `${OPEN}(?:יותר\\s*פשוט|פשוט\\s*יותר|במילים\\s*פשוטות|בפשטות)${TAIL}`, 0.85),

  // --- "מה עושים כאן?" ----------------------------------------------
    R('what_to_do_here', `${OPEN}מה\\s*(?:עושים|לעשות|צריך\\s*לעשות)${TAIL}`, 0.85),

  // --- "למה עושים את זה?" -------------------------------------------
    R('why_this_step', `${OPEN}(?:למה|מדוע)\\s*(?:עושים|מציבים|מחלקים|מכפילים|מחברים|מחסרים|בוחרים)${TAIL}`, 0.85),
    R('why_this_step', `${OPEN}(?:למה|מדוע)${TAIL}`, 0.7),

  // --- "תן דוגמה" ---------------------------------------------------
    // The verb is optional: "אפשר דוגמה?" normalises to a bare "דוגמה" once
    // the politeness is dropped, and requiring a verb missed that whole form.
    R('give_example', `${OPEN}(?:תן|תראה|יש|רוצה|צריך)?\\s*(?:עוד\\s*)?דוגמה${TAIL}`, 0.9),

  // --- "תן לי טבלה" -------------------------------------------------
    R('give_table', `${OPEN}(?:תן|תבנה|נבנה|תראה|יש|צריך)?\\s*(?:לי)?\\s*(?:את\\s*)?(?:ה)?(?:טבלה|עץ|דיאגרמה)(?:\\s*של\\s*זה)?${TAIL}`, 0.85),
    R('give_table', `${OPEN}(?:איך)\\s*(?:בונים|מסדרים|עושים)\\s*(?:את\\s*)?(?:ה)?(?:טבלה|עץ)${TAIL}`, 0.9),

  // --- "מה הנוסחה?" -------------------------------------------------
    R('which_formula', `${OPEN}(?:מה|איזו|איזה|באיזו|באיזה)\\s*(?:ה)?נוסחה(?:\\s*(?:צריך|משתמשים|מתאימה|נכונה))?${TAIL}`, 0.9),
    R('which_formula', `${OPEN}(?:ה)?נוסחה${TAIL}`, 0.75),

  // --- "מה השלב הבא?" -----------------------------------------------
    R('next_step', `${OPEN}מה\\s*(?:ה)?(?:שלב|צעד)\\s*(?:ה)?בא${TAIL}`, 0.9),
    R('next_step', `${OPEN}(?:מה\\s*(?:הלאה|עכשיו)|ואז|המשך|תמשיך|הלאה)${TAIL}`, 0.8),

  // --- "למה התשובה הזאת שגויה?" -------------------------------------
    R('why_wrong', `${OPEN}(?:למה|מדוע)\\s*(?:ה)?תשובה\\s*(?:ה)?(?:זאת|זו|שלי)?\\s*(?:לא\\s*נכונה|שגויה|לא\\s*טובה)${TAIL}`, 0.95),
    R('why_wrong', `${OPEN}(?:למה|איפה|מה)\\s*(?:טעיתי|הטעות|לא\\s*נכון|זה\\s*לא\\s*נכון)${TAIL}`, 0.9),

  // --- "לא הבנתי" ---------------------------------------------------
    R('didnt_understand', `${OPEN}(?:לא\\s*הבנתי|לא\\s*מבין|לא\\s*מבינה|לא\\s*ברור|תקוע|תקועה|נתקעתי)${TAIL}`, 0.9),

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
    R('concept', `${OPEN}מה\\s*(?:זה|זו|זאת|הכוונה\\s*ב)\\s+[א-ת].{2,}$`, 0.85),
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
export function canonicalIntent(message: string): IntentMatch {
  const canonical = normalise(message);
  if (!canonical) return { intent: null, confidence: 0, canonical: '' };

  const folded = fold(canonical);
  let best: Rule | null = null;
  for (const rule of RULES) {
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
