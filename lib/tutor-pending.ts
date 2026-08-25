/**
 * tutor-pending.ts — what the tutor just asked the student, and what counts as
 * an answer to it.
 *
 * ============================================================
 * THE TURN NOBODY DESIGNED FOR
 * ============================================================
 * Every local template in this app ends with a question. That is deliberate —
 * a tutor that only answers is a lookup table — but it means the tutor speaks
 * and then the STUDENT answers, and every layer in the system was built for
 * the opposite order. So the reply to "תעשה את הבא ותכתוב לי מה יצא לך" had
 * nothing to route it, and went to the model. Every single time.
 *
 * ⚠️ AND WORSE THAN COSTING MONEY, IT WAS WRONG.
 *
 * `routeMessage` sees a bare value and grades it against `question.expected` —
 * the FINAL answer. After the tutor asked for an INTERMEDIATE one. A student
 * who correctly computed the middle of a solution was told:
 *
 *   "אתה מדווח שזה לא יצא, ואיני רואה את הדף שלך — אז לא אנחש היכן זה נשבר."
 *
 * They reported nothing of the kind. They did what they were asked and were
 * marked wrong for it, by a sentence that has nothing to do with what they
 * typed. That is the bug this file exists to close; the saved model call is
 * the smaller half.
 *
 * ============================================================
 * WHAT IT WILL NOT DO
 * ============================================================
 * Guess. If the step the student was pointed at does not yield a value we can
 * compute, there is NO expectation, and the reply is not graded at all —
 * against the final answer or anything else. Saying nothing costs one model
 * call. Saying "wrong" to a correct student costs the student.
 */

import { evaluate } from 'mathjs';

export type Pending =
  /** The tutor asked for the result of a specific step, and we know it. */
  | { kind: 'step-value'; expected: string; step: string }
  /** It asked for a value we cannot compute. Recorded so nothing else grades it. */
  | { kind: 'value-unknown'; step?: string }
  /** "הוא מתקיים?", "היא מתאימה?" — a yes or a no. */
  | { kind: 'yes-no' }
  /** "מה כתבת?", "איפה היא נשברת?" — prose, and only the model reads prose. */
  | { kind: 'prose' };

/**
 * Cue words that mark a step's RESULT.
 *
 * ⚠️ "the last number in the step" is the obvious heuristic and it is wrong:
 * in "מציבים n=5: 3 + 4*4" the last number is 4 and the result is 19. The cue
 * word is what separates the two.
 */
const RESULT_CUE =
  /(?:מקבלים|נקבל|מתקבל|יוצא|יצא|שווה|סה"כ|סך הכל|התוצאה(?: היא)?|כלומר)\s*:?\s*([-\d][\d.,\s+*/^()־-]*)/;

/** A trailing arithmetic expression, for steps written as "… : 3 + 4*4". */
const TRAILING_EXPR = /[:=]\s*([-\d][\d.\s+*/^()]*)$/;

const clean = (s: string) =>
  s
    .replace(/[־–—]/g, '-')
    .replace(/,/g, '')
    .trim()
    .replace(/[.\s]+$/, '');

function evalOrNull(expr: string): string | null {
  const e = clean(expr);
  if (!e || !/\d/.test(e)) return null;
  // Anything that is not arithmetic is not ours to evaluate.
  if (!/^[-\d.\s+*/^()]+$/.test(e)) return null;
  try {
    const v = evaluate(e);
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    return String(v);
  } catch {
    return null;
  }
}

/**
 * The value a step produces, or null when it does not clearly produce one.
 *
 * Null is the common case and is not a failure — most steps are instructions,
 * not computations. Returning null means "do not grade this turn", which is
 * always safe.
 */
export function stepResult(step: string): string | null {
  const withoutMarkup = step.replace(/\*\*/g, '').replace(/\$/g, '');
  const cue = RESULT_CUE.exec(withoutMarkup);
  if (cue) {
    const v = evalOrNull(cue[1]);
    if (v !== null) return v;
  }
  const trailing = TRAILING_EXPR.exec(withoutMarkup);
  if (trailing) {
    const v = evalOrNull(trailing[1]);
    if (v !== null) return v;
  }
  return null;
}

/**
 * What did the tutor's own message just ask for?
 *
 * Read from the text it sent, not from the template id: the templates are
 * rewritten often, and a rendered message is the thing the student actually
 * saw. Ordering matters — a message can contain several question marks, and
 * the LAST question is the one being answered.
 */
/**
 * The step that comes AFTER the one the tutor just quoted.
 *
 * "תעשה את הבא ותכתוב לי מה יצא לך" points at the step following the one in
 * the message, so the expected value is that step's result — not the current
 * step's, and not the final answer. Found by locating the quoted step rather
 * than by counting served rungs, because the templates quote a step directly
 * and a counter would drift the moment one of them changes.
 */
export function nextStepAfter(servedText: string, steps: readonly string[]): string | undefined {
  const idx = steps.findIndex((st) => st.trim().length > 8 && servedText.includes(st.trim()));
  return idx >= 0 ? steps[idx + 1] : undefined;
}

export function expectationOf(servedText: string, nextStep?: string): Pending | null {
  const t = servedText.trim();
  if (!t) return null;

  // ⚠️ NOT GATED ON A QUESTION MARK.
  //
  // The first version required one and matched almost nothing, because these
  // templates ask as an instruction: "תעשה את הבא ותכתוב לי מה יצא לך." ends
  // in a full stop and is unmistakably a question. Hebrew tutoring prose does
  // this constantly, and a '?' gate quietly excluded the single most common
  // ask in the app.
  const sentences = t
    .split(/\n+|(?<=[.?!])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

  // From the END: a template says several things and asks last.
  for (let i = sentences.length - 1; i >= 0; i--) {
    const line = sentences[i];

    // "מה יצא לך", "תכתוב לי מה יוצא", "מה קיבלת" — a value is wanted.
    if (/מה\s+(?:יצא|יוצא|קיבלת|יוצאת|התקבל)/.test(line)) {
      const expected = nextStep ? stepResult(nextStep) : null;
      return expected
        ? { kind: 'step-value', expected, step: nextStep as string }
        : { kind: 'value-unknown', step: nextStep };
    }

    // "הוא מתקיים?", "היא מתאימה?", "היא עומדת בהם או נופלת?"
    if (/(?:מתקיים|מתאימה|מתאים|עומדת|נופלת)\s*\??$/.test(line)) return { kind: 'yes-no' };

    // Anything else that is explicitly a question wants a sentence back, and a
    // sentence is the model's job.
    if (line.includes('?')) return { kind: 'prose' };
  }

  return null;
}

/**
 * A value the student REPORTS mid-sentence: "ניסיתי שוב ויצא לי 19".
 *
 * ⚠️ `looksLikeAnswer` cannot see this one. Its LEAD_IN stripper is anchored at
 * the start, so "יצא לי 19" is graded and "ניסיתי שוב ויצא לי 19" is not — the
 * same report with four words in front of it. That message was being answered
 * with another hint while the student was telling us they had got it right.
 *
 * Only after a result cue, and only a plain number: "יש 19 אפשרויות" reports
 * nothing.
 */
const REPORTED = /(?:יצא|יוצא|קיבלתי|מקבל|התקבל|הגעתי\s*ל)(?:\s*לי)?\s*[:=]?\s*(-?[0-9]+(?:[.,][0-9]+)?)/;

export function reportedValue(message: string): string | null {
  const m = REPORTED.exec(message);
  return m ? m[1].replace(',', '.') : null;
}

const YES = /^\s*(?:כן|נכון|אכן|בדיוק|מתקיים|מתאים|יש|בטח|אמת)\s*[.!]*\s*$/;
const NO = /^\s*(?:לא|לא\s*נכון|לא\s*מתקיים|לא\s*מתאים|שלילי|אין)\s*[.!]*\s*$/;

/** A bare yes or no, or null when the reply is anything richer. */
export function yesNo(message: string): boolean | null {
  if (YES.test(message)) return true;
  if (NO.test(message)) return false;
  return null;
}
