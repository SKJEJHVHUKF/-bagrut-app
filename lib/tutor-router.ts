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

import { answerLocally, classifyAsk } from '@/lib/tutor-local';
import { isParseable, latexToMathjs } from '@/lib/mathscan/solve/parse';
import { checkAnswer } from '@/lib/answer-check';
import type { TutorFocus } from '@/lib/tutor-presence';
import type { AnswerSpec, Verdict } from '@/lib/answer-check';

export type Route =
  /** A. the student typed a value to be graded. `spec` is what to grade against. */
  | { kind: 'answer'; spec: AnswerSpec; typed: string }
  /** B/C. one of the six recurring asks — hint, first step, why wrong, full
   *  solution, formulas, key points — all served from authored content. */
  | { kind: 'ask'; ask: NonNullable<ReturnType<typeof classifyAsk>> }
  /** D. an original question. The model's job. */
  | { kind: 'open' };

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
  const parts = bare.split(/\s*(?:,|;|\bאו\b|\bו-)\s*/).filter(Boolean);
  return parts.every((p) => {
    // Grade the right-hand side of "x = 3"; the name is not the value.
    const rhs = p.includes('=') ? p.slice(p.lastIndexOf('=') + 1) : p;
    const cleaned = latexToMathjs(rhs).trim();
    return cleaned.length > 0 && isParseable(cleaned);
  });
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
export function routeMessage(message: string, focus: TutorFocus | null): Route {
  const ask = classifyAsk(message);
  if (ask) return { kind: 'ask', ask };

  const spec = focus?.question?.expected;
  // `manual` means the content author said this answer cannot be graded
  // mechanically (a proof, a locus, "find all n"). Honour that.
  if (spec && spec.kind !== 'manual' && looksLikeAnswer(message)) {
    return { kind: 'answer', spec, typed: bareValue(message) };
  }
  return { kind: 'open' };
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
