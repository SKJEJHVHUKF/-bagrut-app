/**
 * tutor-router.ts — who answers this message: code, authored content, or a model?
 *
 * ============================================================
 * WHY A ROUTER AND NOT "ASK THE MODEL, IT IS SMART"
 * ============================================================
 * A model is the wrong instrument for two of the three things a student does
 * in this chat. Grading an answer is arithmetic — mathjs is exactly right and
 * a model is a confident guesser. Serving the next hint is a lookup — the hints
 * are authored, tiered and human-checked, and paraphrasing them can only make
 * them worse. Only the third thing, an original explanation, is what a model is
 * actually for.
 *
 * So every message goes through ONE decision here, and the model is what is
 * left after the deterministic paths decline — not the default.
 *
 * ============================================================
 * THE GAP THIS CLOSES
 * ============================================================
 * MEASURED before this existed: of nine realistic typed answers — "x=3",
 * "1+2i", "d=4, a1=3", "התשובה היא 0.36", "2/6", "זה 16?" — `classifyAsk`
 * recognised ZERO. All nine reached the model, which then judged arithmetic by
 * eye. Meanwhile `lib/answer-check.ts` was sitting in the same bundle doing
 * exactly this job for QuestionPartCard and QuestionRunnerCard, with mathjs,
 * with normalisation of fractions/decimals/ordering, and with a diagnosis of
 * HOW the answer is wrong. The bubble simply never asked it.
 *
 * ============================================================
 * THE ROUTER IS DELIBERATELY TIMID ABOUT `answer`
 * ============================================================
 * Mistaking a question for an answer is the one failure that hurts: the
 * student asks something and gets graded instead of helped. Mistaking an
 * answer for a question costs one model call. The tests are therefore
 * asymmetric — a question misrouted to `answer` is a hard failure, a missed
 * answer is only a miss — and `looksLikeAnswer` requires a spec to grade
 * against, an absence of question wording, and a value that actually parses.
 */

import { answerLocally, classifyAsk, type LocalAnswerKind } from '@/lib/tutor-local';
import { isParseable, latexToMathjs } from '@/lib/mathscan/solve/parse';
import { checkAnswer } from '@/lib/answer-check';
import type { TutorFocus } from '@/lib/tutor-presence';
import type { AnswerSpec, Verdict } from '@/lib/answer-check';
import { reportedValue, unambiguousReport, yesNo, type Pending } from '@/lib/tutor-pending';
import { followUp, ladderMove } from '@/lib/tutor-followup';
import { deriveExpected } from '@/lib/derive-expected';

/** Exported so lib/tutor-chain can hold one between turns without restating it. */
export type Ask = NonNullable<ReturnType<typeof classifyAsk>>;

export type Route =
  /** A. the student typed a value to be graded. `spec` is what to grade against. */
  | {
      kind: 'answer';
      spec: AnswerSpec;
      typed: string;
      /** Present when the value being graded is a STEP's result, not the final answer. */
      about?: { step: string };
    }
  /** B/C. one of the six recurring asks — hint, first step, why wrong, full
   *  solution, formulas, key points — all served from authored content. */
  | { kind: 'ask'; ask: Ask }
  /** "תודה", "הבנתי", "אוקיי". A fixed reply. Paying a model to say "בכיף"
   *  is the least defensible call in the app. */
  | { kind: 'ack'; text: string }
  /** D. an original question. The model's job. */
  | { kind: 'open' };

/**
 * What the tutor said last turn. Without it a conversation cannot be routed:
 * "ואז?" means "more of what you just gave me", and a stateless classifier can
 * only shrug and pay.
 *
 * MEASURED before this existed (scripts/sim-tutor-session.ts): the four
 * opening chips were 100% local, and the conversation that followed was 38%.
 * Every "המשך", "נו", "ואז?", "תודה", "אוקיי" was a billed model call.
 */
export type TurnState = {
  /** The ask the previous turn resolved to, if any. */
  lastAsk?: Ask | null;
  /** Rungs already handed out for this question (the bubble's `servedRef`). */
  served?: readonly LocalAnswerKind[];
  /**
   * What the tutor's OWN last message asked the student for.
   *
   * ⚠️ WITHOUT THIS A CORRECT STUDENT IS TOLD THEY ARE WRONG. Every local
   * template ends by asking something, and most ask for the result of the NEXT
   * step. The reply is a bare number, `looksLikeAnswer` says yes, and the value
   * gets graded against `question.expected` — the FINAL answer. On the
   * sequences question below, a student who correctly computes the middle and
   * types it is told it is not equivalent to the right answer.
   *
   * When this says a specific step's value was asked for, that value is what
   * the reply is graded against. When it says a value was asked for and we
   * could not compute it, the reply is NOT GRADED AT ALL — the model answers
   * it, which costs a call and cannot be wrong.
   */
  pending?: Pending | null;
  /**
   * Has the tutor already said something in this conversation?
   *
   * ⚠️ This is the permission slip for `tutor-followup`, whose patterns are far
   * wider than anything else in this file. "לא הבנתי" one message after the
   * tutor explained something can only mean "not that"; the same words opening
   * a conversation mean anything at all. Without this flag the wide patterns
   * would fire on nothing and answer the wrong question confidently.
   *
   * ⚠️ IT USED TO BE `lastWasLocal` — "was the PREVIOUS turn answered locally" —
   * AND THAT WAS NARROWER THAN ITS OWN JUSTIFICATION, WHICH COST REAL MONEY.
   *
   * The reason above says "after the tutor explained something". It does not
   * say "explained something LOCALLY", and it never needed to: a student
   * replying to the model is replying to the tutor. Under the old flag the
   * first paid turn locked every follow-up out of the free layers for the rest
   * of the conversation, so one model call became three. Observed on a real
   * trigonometry session (2026-08-29):
   *
   *   "יצא 16 69"   paid   a REPORTED VALUE, which the grader answers for free
   *   "לא זוכר"     paid   `stuck` — the same shape as "לא יודע", free a minute
   *                        earlier in the same session
   *   "ביחס ישר"    paid
   *
   * Three turns, $0.020, and the first one is why the other two cost anything.
   */
  tutorSpoke?: boolean;
  /**
   * What the PREVIOUS turn's grading said, when the previous turn was a grade.
   *
   * ⚠️ WITHOUT IT THE TUTOR CONTRADICTS ITSELF IN TWO MESSAGES, AND A STUDENT
   * SAW IT. Reported with a screenshot:
   *
   *   student   10
   *   tutor     נכון! 10 היא התשובה. 🎯          ← graded here, deterministically
   *   student   בטוח?
   *   tutor     לא, טעות. חשב שוב: ...            ← answered by the MODEL
   *
   * Neither layer was broken on its own. `checkAnswer` compared 10 against the
   * authored answer and was right. The model was obeying its own rule — never
   * confirm a final answer thrown at you, hand the check back — and had no way
   * to know the answer had already been verified against written content.
   *
   * Two layers answered and neither knew about the other. This is the missing
   * fact: a challenge to a verdict is answered by standing behind the verdict,
   * from a template, and never by re-litigating it with a model that cannot see
   * it.
   */
  lastVerdict?: Verdict | null;
};

// ------------------------------------------------------------
// Conversational moves that are not questions
// ------------------------------------------------------------

/**
 * Pure acknowledgement — nothing is being asked.
 *
 * ⚠️ THE TWO-WORD FORMS COST REAL CALLS. Every entry here was a single word,
 * and "אה נכון" — the sound a student makes when it lands — is two. From the
 * trace: `"אה נכון"  in=1456 cr=5709 out=200  $0.0030`, paid twice on separate
 * days, for a message that is asking nothing at all.
 */
const ACK =
  /^\s*(?:תודה(?:\s*רבה)?|אה+|אה\s*(?:נכון|כן|אוקיי?|הבנתי|באמת)|אוקיי?(?:\s*(?:תודה|הבנתי|מעולה))?|או\.?ק\.?|סבבה|מגניב|יופי|מעולה|מצוין|מצויין|הבנתי(?:\s*(?:תודה|עכשיו|אותך))?|עכשיו\s*הבנתי|ברור(?:\s*עכשיו)?|נכון\s*(?:מאוד|נכון)|בסדר(?:\s*גמור)?|טוב|כן\s*טוב|ok|okay|thanks?)\s*[!.…]*\s*$/i;

/**
 * "Carry on" — no new content, just a request for more of the same. Anchored
 * to the whole message on purpose: "ואז מחשבים את הסכום" is a statement about
 * the maths, not a nudge, and must not be swallowed as one.
 */
const CONTINUE = /^\s*(?:ו?אז\s*(?:מה)?|ו?מה\s*(?:עכשיו|הלאה|הצעד הבא)|המשך|תמשיך|הלאה|נו|עוד|עוד\s*קצת|ו\?|וכן\?|אחר כך|ואחר כך|ובהמשך)\s*[?!.…]*\s*$/;

/** "עוד רמז", "תן לי עוד כיוון" — a request for one more of whatever came
 *  last. Not anchored, because it carries a noun and cannot be confused with a
 *  statement about the maths. */
// ⚠️ No `\b`. Hebrew letters are not `\w` in JavaScript regex, so a word
// boundary next to them matches in places you do not expect and fails in the
// ones you do — `\bעוד` did not match "תן לי עוד כיוון" at all.
const MORE = /עוד\s+(?:רמז|כיוון|צעד|משהו|אחד|דוגמ)/;

/** A bare "למה?" with nothing after it is about the sentence the tutor just
 *  said, not about the exercise. It continues the thread. */
const BARE_WHY = /^\s*(?:למה|למה\s*זה(?:\s*ככה)?|מדוע)\s*[?!.…]*\s*$/;

/** A leading acknowledgement in front of a real move: "אוקיי ומה הלאה",
 *  "תודה, עוד רמז". Stripped so the move underneath is seen. */
const ACK_PREFIX = /^\s*(?:תודה(?:\s*רבה)?|אוקיי?|או\.?ק\.?|סבבה|יופי|מעולה|הבנתי|ברור|בסדר|טוב|ok|okay)\s*[,.!]*\s+/i;

/** The student has stopped trying and wants the solution. TUTOR_CORE's own
 *  rule says this is the moment to give it, in full. */
const GIVE_UP = /אני\s*מוותר|פשוט\s*תגיד|תגיד\s*לי\s*כבר|תראה\s*לי\s*כבר|נמאס|לא\s*מצליח\s*בכלל|אין\s*לי\s*כוח/;

/** Warm, short, and it always ends by offering the next move — the same rule
 *  every template in lib/tutor-local follows. Rotated by message length so two
 *  acknowledgements in a row do not get the identical line. */
const ACK_REPLIES = [
  'בכיף. רוצה לנסות את הסעיף הבא, או שנעבור על משהו שוב?',
  'יופי. תגיד לי כשתרצה את הצעד הבא, או אם משהו עוד לא יושב.',
  'מצוין. אני כאן אם תיתקע בהמשך.',
];

// ------------------------------------------------------------
// Answer detection
// ------------------------------------------------------------

/** Hebrew verbs and question words that mean "this is a request, not a value".
 *  Any of these and the message is never routed to grading, whatever else it
 *  contains — "למה זה 16" is a question that happens to hold a number. */
// ⚠️ `נכון` is here WITHOUT a question mark. "זה נכון ש-x=3?" was the one case
// that got through the first version: the lead-in stripper removed "זה", and
// what was left parsed as a value. A student asking whether something is right
// is asking, not answering — and no real answer contains the word.
const ASKING = /למה|מדוע|איך|כיצד|מאיפה|מהיכן|תסביר|הסבר|רמז|עזרה|תעזור|תראה|תפתור|נוסחה|נוסחא|מה\s|מתי|האם|אפשר|לא הבנתי|תקוע|מבין|בדוק|נכון|נכונה|צודק/;

/** Wrappers a student puts around a value: "התשובה היא", "יצא לי", "קיבלתי",
 *  "אני חושב ש". Stripped before parsing so the value underneath is seen. */
const LEAD_IN =
  /^\s*(?:אז\s+)?(?:אני\s+)?(?:חושב(?:ת)?\s+ש|מקבל(?:ת)?|קיבלתי|יצא\s+לי|התשובה\s+(?:היא|שלי)?|התוצאה\s+(?:היא)?|זה|נראה\s+לי\s+ש|לדעתי)\s*[:=]?\s*/;

/**
 * "האם התשובה היא 15?" — a value being CHECKED, not a question.
 *
 * ⚠️ THE ASKING VETO REJECTED EVERY ONE OF THESE, AND IT WAS RIGHT TO EXIST.
 *
 * `ASKING` keeps questions out of the grading path, and it lists האם, נכון and
 * "מה " among the words that mark one. But "האם התשובה היא 15" is not a
 * question about the material — it is a value with a question mark around it,
 * which is the single most natural way a student asks to be checked. Every
 * form below was going to the model to have arithmetic confirmed:
 *
 *   האם התשובה היא 15 · האם זה 19 · אז זה 19 נכון? · האם קיבלתי נכון 42
 *
 * The frame is matched first and the value falls out of it, so the veto still
 * guards everything that is not shaped this way. "האם צריך להכפיל" and "האם
 * הסדרה חשבונית" carry no value and are left exactly where they were.
 */
const VERIFY_FORM =
  /^[ ]*(?:אז[ ]+)?(?:האם[ ]+)?(?:זה[ ]+|התשובה[ ]+|התוצאה[ ]+|הפתרון[ ]+|קיבלתי[ ]+|יצא[ ]+לי[ ]+)?(?:היא[ ]+|הוא[ ]+|זה[ ]+)?([^A-Za-z֐-׿]*[0-9][^֐-׿]*?)[ ]*(?:נכון|נכונה|נכונים)?[ ]*[?]*[ ]*$/;

/**
 * The value a "is it X?" message is asking about, or null.
 *
 * Requires a digit, and refuses anything with a Hebrew letter left in the
 * captured part: "האם הסדרה חשבונית" must not be read as a value.
 */
export function verificationValue(message: string): string | null {
  const m = VERIFY_FORM.exec(message.trim());
  if (!m) return null;
  const v = m[1].trim();
  if (!v || !/[0-9]/.test(v)) return null;
  if (/[֐-׿]/.test(v)) return null;
  return v;
}

/** Longest a plain answer gets. A value is short; prose is not. */
const MAX_ANSWER_LEN = 60;

/**
 * Strip the conversational wrapper and the trailing question mark a student
 * adds when they are checking ("זה 16?"). Returns the bare candidate value.
 */
export function bareValue(message: string): string {
  return message
    .trim()
    .replace(LEAD_IN, '')
    .replace(/[?!]+\s*$/, '')
    .replace(/^\$+|\$+$/g, '')
    .trim();
}

/**
 * Could this message be a typed answer?
 *
 * Every condition here exists to keep a QUESTION out of the grading path:
 *   - short: a value is short, an explanation request is not
 *   - no asking words anywhere in the ORIGINAL message
 *   - `classifyAsk` abstains (it owns hint/why-wrong/full/formulas/…)
 *   - at least one digit or a latin variable — a bare Hebrew sentence is prose
 *   - and mathjs can actually parse it, after LaTeX is normalised away
 */
export function looksLikeAnswer(message: string): boolean {
  const raw = message.trim();
  if (!raw || raw.length > MAX_ANSWER_LEN) return false;
  if (ASKING.test(raw)) return false;
  if (classifyAsk(raw)) return false;

  const bare = bareValue(raw);
  if (!bare) return false;
  // Something numeric or algebraic has to be present. "כן", "אוקיי", "תודה"
  // are not answers and must not be graded.
  if (!/[0-9]|[a-zA-Z]/.test(bare)) return false;

  // A multi-value answer ("d=4, a1=3" / "x=2 או x=3") parses per part.
  // ⚠️ "ו3" HAS NO DASH, AND THAT COST THREE CALLS.
  //
  // The separator list had `ו-`, which needs the maqaf. Students write
  // "2 ו3 ו4" — the vav glued straight onto the digit — and the whole thing
  // parsed as one unparseable token, so a list of three values went to the
  // model. Seen in report:worklist, verbatim.
  const parts = bare.split(/\s*(?:,|;|\bאו\b|ו-|ו(?=[0-9]))\s*/).filter(Boolean);
  return parts.every((p) => {
    // Grade the right-hand side of "x = 3"; the name is not the value.
    const rhs = p.includes('=') ? p.slice(p.lastIndexOf('=') + 1) : p;
    const cleaned = latexToMathjs(rhs).trim();
    return cleaned.length > 0 && isParseable(cleaned);
  });
}

/**
 * The replies to "בטוח?" — one per verdict, and both of them stand.
 *
 * They say WHY the tutor is sure, because "כן, בטוח" on its own is the same
 * confident noise the model was producing. The grader compared the student's
 * value to the answer written in the content; saying so is both the honest
 * reason and the strongest one.
 *
 * Neither ends the conversation: a student who doubts a verdict usually has a
 * real disagreement one step earlier, and the last line goes looking for it.
 */
const STANDS_CORRECT = `כן, בטוח. השוויתי את מה שכתבת לתשובה שרשומה בפתרון של השאלה, והן זהות.

אם יש צעד בדרך שלא הסתדר לך, תגיד לי איזה ונעבור עליו יחד.`;

const STANDS_WRONG = `כן. השוויתי את מה שכתבת לתשובה שרשומה בפתרון, והן לא יוצאות אותו דבר.

זה כמעט תמיד צעד אחד שהחליק. תכתוב לי איך הגעת לזה, ונמצא איפה.`;

/** Anything numeric or algebraic: then the message is about the maths, not
 *  about whether we meant the verdict. */
function hasMaths(s: string): boolean {
  return /[0-9]|[a-zA-Z]\s*=/.test(s);
}

/**
 * What this question's typed answer is graded against.
 *
 * ⚠️ THE AUTHORED SPEC FIRST, AND A DERIVED ONE ONLY WHERE THERE IS NONE.
 *
 * MEASURED (`npm run report:gradable`): 199 of 1,214 questions carry an
 * `expected`. On the other 84%, a student typing "15" could not be graded at
 * all, so the turn went to the model — which costs money and, worse, makes
 * claude-haiku-4-5 write the reply itself. That is where it invents Hebrew:
 * "בטעות הנתת", "והקבלן לך 2.3", "בוגדר לרדיאנים". A graded turn answers from
 * an authored template, so the Hebrew is a human's.
 *
 * `deriveExpected` reads the answer the content already states in
 * `solution.finalAnswer` and refuses anything it cannot grade unambiguously —
 * including every question an author marked `manual`. 319 of the 942 qualify;
 * the rest still go to the model, on purpose.
 */
function specOf(focus: TutorFocus | null): AnswerSpec | undefined {
  const q = focus?.question as { expected?: AnswerSpec } | undefined;
  return q?.expected ?? deriveExpected(q) ?? undefined;
}

// ------------------------------------------------------------
// The single decision
// ------------------------------------------------------------

/**
 * Decide who answers. Pure and synchronous — no I/O, no model, no bank lookup;
 * the caller does those once it knows which path it is on.
 *
 * Order matters. `ask` is checked FIRST: "למה התשובה שלי שגויה" contains no
 * value, but "זה 16?" does, and a student asking for a hint while a spec
 * happens to exist must still get the hint.
 */
export function routeMessage(message: string, focus: TutorFocus | null, state: TurnState = {}): Route {
  const trimmed = message.trim();

  // Social move. Answered, not billed.
  if (ACK.test(trimmed)) {
    return { kind: 'ack', text: ACK_REPLIES[trimmed.length % ACK_REPLIES.length] };
  }

  // "פשוט תגיד לי" — the student is done trying. TUTOR_CORE already says this
  // is when to give the whole solution, so it is an ask, not an open question.
  if (GIVE_UP.test(trimmed)) return { kind: 'ask', ask: 'full' };

  const ask = classifyAsk(message);
  if (ask) return { kind: 'ask', ask };

  // "ואז?" / "המשך" / "נו" / "עוד רמז" — no content of its own; it inherits
  // the last ask. The acknowledgement prefix is stripped first, so
  // "אוקיי ומה הלאה" is read as the nudge it is.
  const move = trimmed.replace(ACK_PREFIX, '');
  if (state.lastAsk && (CONTINUE.test(move) || MORE.test(move) || BARE_WHY.test(move))) {
    // …except when the help ladder is spent. Repeating "here is a hint" to a
    // student who has had every hint is the behaviour TUTOR_CORE forbids
    // ("after about two hints that did not land, switch to a full, direct
    // explanation"), so continuation escalates instead of looping.
    const served = state.served ?? [];
    const ladderSpent =
      state.lastAsk === 'help' && served.includes('hint') &&
      (served.includes('first-step') || served.includes('key-points'));
    // A bare "למה?" asks about the sentence just said, which is an
    // explanation request — not another rung of the same ladder.
    if (BARE_WHY.test(move)) return { kind: 'ask', ask: 'explain' };
    return { kind: 'ask', ask: ladderSpent ? 'full' : state.lastAsk };
  }

  // ---- the reply to the tutor's own question -----------------------
  if (looksLikeAnswer(message)) {
    // It asked for THIS step's result and we know it. Grade against that.
    if (state.pending?.kind === 'step-value') {
      return {
        kind: 'answer',
        spec: { kind: 'value', value: state.pending.expected },
        typed: bareValue(message),
        about: { step: state.pending.step },
      };
    }
    // It asked for a value we could not compute. Grading against the final
    // answer here is the bug: the student was asked for something else.
    if (state.pending?.kind === 'value-unknown') return { kind: 'open' };
  }

  // ---- "האם התשובה היא 15?" — a value, wearing a question mark -------
  //
  // Placed before the yes-no and follow-up branches because it is the most
  // specific reading available: the message names a number and asks whether it
  // is right, and that is answerable exactly and for free.
  {
    const checking = verificationValue(trimmed);
    if (checking) {
      if (state.pending?.kind === 'step-value') {
        return {
          kind: 'answer',
          spec: { kind: 'value', value: state.pending.expected },
          typed: checking,
          about: { step: state.pending.step },
        };
      }
      const own = specOf(focus);
      if (own && own.kind !== 'manual') return { kind: 'answer', spec: own, typed: checking };
    }
  }

  // ---- the tutor asked a yes-or-no question and got one -------------
  //
  // "תיקח את הראשון מהם ותבדוק אותו מול השאלה — הוא מתקיים?" and the student
  // types "לא". That was an unrecognised message and therefore a paid call, on
  // a question the tutor itself had just asked. Both answers move the ladder:
  // a "כן" means the check held and the next rung is what they need, a "לא"
  // means it did not and they need the rung anyway. The difference is which
  // template speaks, and `answerLocally` decides that from `served`.
  //
  // Gated on the pending expectation, so a bare "לא" in a fresh conversation —
  // where it means something else entirely, or nothing — is untouched.
  // ⚠️ AFTER ANY LOCAL TURN, NOT ONLY AFTER A YES-OR-NO QUESTION.
  //
  // The first version required `pending.kind === 'yes-no'`, and report:worklist
  // then showed a bare "לא" costing three separate model calls. A student who
  // answers "לא" one message after the tutor said something is answering the
  // tutor whatever shape the question took: asked "מה יצא לך" and it did not
  // work out, asked "הוא מתקיים" and it does not. Both mean the same next move.
  //
  // Still gated: a bare "לא" OPENING a conversation means nothing, or
  // something else entirely, and is left alone. Once the tutor has spoken —
  // by any means — "לא" is an answer to it.
  // ---- "בטוח?" after a verdict: stand behind it -------------------
  //
  // ⚠️ THIS RUNS BEFORE EVERYTHING ELSE THAT COULD CLAIM THE MESSAGE, because
  // being second here is what produced the contradiction in `lastVerdict`.
  // A challenge to a grade is not a question about the maths; it is a question
  // about whether we meant it, and only the layer that graded knows the answer.
  if (state.tutorSpoke && state.lastVerdict && followUp(trimmed) === 'why' && !hasMaths(trimmed)) {
    if (state.lastVerdict === 'correct') return { kind: 'ack', text: STANDS_CORRECT };
    if (state.lastVerdict === 'wrong') return { kind: 'ack', text: STANDS_WRONG };
  }

  if (state.tutorSpoke) {
    const v = yesNo(trimmed);
    if (v !== null) {
      return { kind: 'ask', ask: ladderMove(v ? 'more' : 'stuck', state.served ?? [], state.lastAsk) as Ask };
    }
  }

  // ---- still talking about what the tutor just said ----------------
  //
  // The student took a free move — a hint, a formula, "why was I wrong" — and
  // then kept going: "עוד קצת", "עדיין תקוע", "ניסיתי ולא יצא". Each of those
  // used to be unrecognised and therefore paid for, on a conversation that had
  // already been answered from authored content.
  //
  // Only once the tutor has spoken. The reply is always another rung of the
  // same ladder, about the exercise already on screen, so the worst case is a
  // rung they did not want rather than an answer about something else — and
  // that worst case does not get worse when the previous speaker was the model:
  // `served` still records which rungs this app has handed out, so `ladderMove`
  // still picks one the student has not seen.
  if (state.tutorSpoke) {
    const fu = followUp(trimmed);
    if (fu) {
      // ⚠️ A REPORT OF A RESULT IS AN ANSWER, NOT A REQUEST FOR HELP.
      //
      // "ניסיתי שוב ויצא לי 19" reads as `tried` and was answered with another
      // hint — while the student was telling us they had got it right.
      // `looksLikeAnswer` misses it because its lead-in stripper is anchored at
      // the start, so the same sentence with four words in front of it is
      // invisible to the grading path.
      const reported = reportedValue(trimmed);
      if (reported) {
        if (state.pending?.kind === 'step-value') {
          return {
            kind: 'answer',
            spec: { kind: 'value', value: state.pending.expected },
            typed: reported,
            about: { step: state.pending.step },
          };
        }
        const own = specOf(focus);
        if (own && own.kind !== 'manual') return { kind: 'answer', spec: own, typed: reported };
      }
      return { kind: 'ask', ask: ladderMove(fu, state.served ?? [], state.lastAsk) as Ask };
    }
  }

  const spec = specOf(focus);

  // ---- a reported result, whatever else the sentence is doing ------
  //
  // ⚠️ THIS USED TO LIVE INSIDE THE FOLLOW-UP BRANCH, so it only ran on a
  // message that ALSO read as a follow-up. "יצא לי 19" reports a result and
  // matches no follow-up pattern, so it was paid for — while the same words
  // wrapped in "ניסיתי שוב ו..." were free.
  //
  // `unambiguousReport`, not `reportedValue`: a message with two numbers in it
  // is not graded on a guess about which one was meant. See lib/tutor-pending.
  if (state.tutorSpoke && spec && spec.kind !== 'manual') {
    const reported = unambiguousReport(trimmed);
    if (reported) {
      if (state.pending?.kind === 'step-value') {
        return {
          kind: 'answer',
          spec: { kind: 'value', value: state.pending.expected },
          typed: reported,
          about: { step: state.pending.step },
        };
      }
      return { kind: 'answer', spec, typed: reported };
    }
  }

  // `manual` means the content author said this answer cannot be graded
  // mechanically (a proof, a locus, "find all n"). Honour that.
  if (spec && spec.kind !== 'manual' && looksLikeAnswer(message)) {
    return { kind: 'answer', spec, typed: bareValue(message) };
  }
  return { kind: 'open' };
}

/**
 * A canonical phrasing for each ask.
 *
 * `answerLocally` takes the student's WORDS and classifies them itself, so a
 * resolved continuation ("ואז?" → the previous ask) has to be handed to it as
 * something it can classify. Without this the router would resolve the ask and
 * the local tutor would immediately re-classify the raw "ואז?" as nothing and
 * fall through to the model — the routing would be correct and have no effect.
 *
 * Each string below is asserted to classify back to its own key in
 * scripts/test-tutor-voice.ts's phrasing corpus.
 */
const CANONICAL: Record<Ask, string> = {
  help: 'תן לי רמז',
  'why-wrong': 'למה התשובה שלי שגויה?',
  full: 'תראה לי את הפתרון',
  formulas: 'באיזו נוסחה משתמשים כאן?',
  'key-points': 'מה חשוב לזכור?',
  explain: 'תסביר לי את השאלה הזאת מההתחלה',
};

export function canonicalFor(ask: Ask): string {
  return CANONICAL[ask];
}

// ------------------------------------------------------------
// Answering a graded answer, from templates that already exist
// ------------------------------------------------------------

/**
 * Grade a typed answer and phrase the verdict — with no model and no new
 * pedagogical copy.
 *
 * A wrong answer is handed straight back to `answerLocally` as a why-wrong
 * ask, with the diagnosis attached. That reuses the templates the app already
 * ships and has already gate-tested (`E:why-wrong:sign-flip`, `:conjugate`,
 * `:partial-set`, `:extra-root`, `:swapped`, `:known-mistake`) instead of
 * inventing a second voice for the same situation — which is how two paths
 * that say the same thing start disagreeing.
 *
 * `unparseable` returns null on purpose: the router thought this was a value
 * and the checker could not read it, so the honest move is to let the message
 * continue to the model rather than guess.
 */
export function answerGradedLocally(
  route: Extract<Route, { kind: 'answer' }>,
  focus: TutorFocus,
): { text: string; verdict: Verdict } | null {
  const result = checkAnswer(route.typed, route.spec);
  if (result.verdict === 'unparseable' || result.verdict === 'manual') return null;

  if (result.verdict === 'correct' && route.about) {
    return {
      verdict: 'correct',
      text: `כן, \`${route.typed}\` — בדיוק מה שהצעד הזה נותן. 🎯

עכשיו קדימה לצעד הבא.`,
    };
  }

  // ⚠️ A WRONG INTERMEDIATE IS NOT A WRONG ANSWER. The student was asked for
  // one step's result, so the reply is about that step and nothing else —
  // handing them the why-wrong templates here would discuss a final answer they
  // never claimed.
  //
  // ⚠️ AND THE STEP IS NOT QUOTED BACK. The first version pasted it in, and the
  // step that produces the value CONTAINS the value: the student got it wrong
  // and was immediately shown the number they were asked to find. That is the
  // ladder collapsing at the exact moment it matters. They get told it does not
  // match and are sent back to the step, which is the rung below.
  if (result.verdict === 'wrong' && route.about) {
    return {
      verdict: 'wrong',
      text:
        `בדקתי — הצעד הזה נותן משהו אחר מ-\`${route.typed}\`.

` +
        'תעבור עליו שוב לאט, ותגיד לי מה יצא הפעם.',
    };
  }

  if (result.verdict === 'correct') {
    // Deliberately short and specific. The student's own value is echoed in
    // backticks — it is raw keyboard input, and a lone `$` would open a maths
    // span that swallows the rest of the sentence (the rule tutor-local's
    // templates already follow).
    return {
      verdict: 'correct',
      text:
        `נכון! \`${route.typed}\` היא התשובה. 🎯\n\n` +
        'רוצה שאלה נוספת באותו סגנון, או להמשיך לשלב הבא?',
    };
  }

  // Wrong: let the authored why-wrong templates do the talking.
  const local = answerLocally('למה התשובה שלי שגויה?', {
    ...focus,
    wrongAnswer: route.typed,
    ...(result.diagnosis ? { answerDiagnosis: result.diagnosis } : {}),
  });
  if (local) return { verdict: 'wrong', text: local.text };

  return {
    verdict: 'wrong',
    text:
      `בדקתי את \`${route.typed}\` והיא לא שקולה לתשובה הנכונה.\n\n` +
      'תראה לי את הצעד האחרון שעשית, ונמצא ביחד איפה זה נשבר.',
  };
}
