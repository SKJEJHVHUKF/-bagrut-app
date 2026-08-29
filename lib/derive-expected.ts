/**
 * derive-expected.ts — grade a typed answer from content that is already written.
 *
 * ============================================================
 * THE GAP
 * ============================================================
 * `lib/tutor-router` can grade a typed value only when the question carries an
 * `expected` spec. MEASURED over the whole curriculum (`npm run report:gradable`):
 *
 *   199 of 1,214 questions have one          16%
 *   942 have no `expected` at all
 *   73 are deliberately 'manual' (proofs, loci, "find all n")
 *
 * So a student typing "15" on 84% of the questions in this app cannot be graded,
 * and the turn goes to the model. That costs money AND — the part that was
 * missed for a long time — it makes claude-haiku-4-5 WRITE THE HEBREW ITSELF,
 * which is where it invents words: "בטעות הנתת", "והקבלן לך 2.3", "בוגדר
 * לרדיאנים". Every turn served from here is a turn where that cannot happen,
 * because a human wrote the sentence.
 *
 * And the answer is already written: all 942 carry `solution.finalAnswer`.
 *
 * ============================================================
 * WHY THIS IS STRICT TO THE POINT OF REFUSING MOST OF THEM
 * ============================================================
 * The first version of this extraction took the right-hand side of the last
 * `=` in the final answer. Run over the real content it produced:
 *
 *   "$x_1 = 3, \; x_2 = 4$"     → 4     ← TWO answers; a student typing 3 is
 *                                         told they are wrong
 *   "$x^2 - 5x + 6 = 0$"        → 0     ← that is the EQUATION, not its answer
 *   "$-3 < x < 3$"              → -3<x<3  ← an interval, not a value
 *
 * Telling a correct student they are wrong is the one failure this whole local
 * layer exists to prevent, and it is strictly worse than paying for the turn.
 * So every rule below is a reason to REFUSE, the shapes above are refused by
 * name, and `scripts/test-derive-expected.ts` asserts each of them stays
 * refused. When in doubt this returns null and the model answers, which costs
 * a cent and cannot be wrong.
 */

import { latexToMathjs, isParseable } from '@/lib/mathscan/solve/parse';
import { checkAnswer, type AnswerSpec } from '@/lib/answer-check';

/** Words that announce more than one answer, whatever the maths looks like. */
const MULTIPLE =
  /(?:^|[^א-ת])(?:או|שני|שתי|שלושה|שלוש|ארבעה|כל\s+ה?ערכים|כל\s+n|הפתרונות|התשובות|זוגות)(?:[^א-ת]|$)/;

/** A final answer that is prose, not a value. */
const NOT_A_VALUE = /אין\s+פתרון|לא\s+קיים|תלוי\s+ב|מתבדר|כל\s+ממשי/;

/** Math islands: everything between single dollars, in order. */
function islands(s: string): string[] {
  return (s.match(/\$[^$]+\$/g) ?? []).map((m) => m.slice(1, -1));
}

/**
 * The one value this question's final answer states, or null.
 *
 * Returns a `value` spec ready for `lib/answer-check`, so the caller grades it
 * with exactly the same code path an authored `expected` would take.
 */
export function deriveExpected(question: unknown): AnswerSpec | null {
  const q = question as { expected?: AnswerSpec; solution?: { finalAnswer?: unknown } } | null;
  if (!q) return null;
  // An authored spec always wins — including `manual`, which is an author
  // saying "this cannot be graded mechanically". Overriding that would be
  // exactly the failure this file is written to avoid.
  if (q.expected?.kind) return null;

  const raw = q.solution?.finalAnswer;
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text || text.length > 200) return null;

  // ---- refusal 1: the sentence itself announces more than one answer ----
  if (MULTIPLE.test(text) || NOT_A_VALUE.test(text)) return null;

  // ---- refusal 2: more than one island carries a number ----
  //
  // "$x = 3$ ו-$y = 4$" is two answers wearing one sentence. A single island
  // is the only shape where "the value" is unambiguous.
  const numeric = islands(text).filter((i) => /[0-9]/.test(i));
  if (numeric.length !== 1) return null;
  const island = numeric[0];

  // ---- refusal 3: an interval or an inequality is not a value ----
  if (/[<>≤≥]|\\le|\\ge|\\leq|\\geq|\\neq/.test(island)) return null;

  // ---- refusal 3b: ± is two answers wearing one symbol ----
  //
  // "$x = 2 \pm \sqrt{5}$" survived every rule above and `latexToMathjs` turned
  // it into "2*pm sqrt(5)", which parses. A student who typed either root would
  // have been graded against a nonsense expression.
  if (/\\pm|\\mp|±/.test(island)) return null;

  // ---- refusal 4: a comma or a second equals means two statements ----
  const eqCount = (island.match(/=/g) ?? []).length;
  if (eqCount > 1) return null;
  if (/,|;|\\;|\\,/.test(island)) return null;

  // ---- refusal 5: an EQUATION, not an assignment ----
  //
  // "$x^2 - 5x + 6 = 0$" has one equals sign and parses perfectly. What gives
  // it away is the left-hand side: an answer assigns to a NAME, an equation has
  // an expression on the left.
  let value = island;
  if (eqCount === 1) {
    const [lhs, rhs] = island.split('=');
    if (!/^\s*[A-Za-z\\][A-Za-z0-9_{}\\^\s]*\s*$/.test(lhs)) return null;
    if (/[+\-*/^]|\\frac|\\sqrt/.test(lhs.replace(/\^\s*\{?\s*\}?/g, ''))) return null;
    value = rhs;
  }

  // ---- and it has to actually parse to something numeric ----
  const cleaned = latexToMathjs(value).trim();
  if (!cleaned || !/[0-9]/.test(cleaned)) return null;
  if (!isParseable(cleaned)) return null;

  const spec = { kind: 'value', value: cleaned } as AnswerSpec;

  // ---- the last gate: the spec must be able to grade its OWN value ----
  //
  // ⚠️ THIS REPLACED THREE MORE ENUMERATED RULES, AND IT IS WHY THE LIST ABOVE
  // STOPPED GROWING.
  //
  // The curriculum sweep found 108 accepted specs that could not grade the very
  // value they were built from:
  //
  //   "1:4"                  a RATIO — mathjs cannot evaluate it
  //   "2x^2 + 1"             a symbolic expression with a free variable
  //   "((2)/(3))*x^(3/2)+C"  an integral, constant of integration and all
  //
  // Each could have had its own refusal rule, and the next content author would
  // have found a fourth shape. Asking `checkAnswer` whether the spec works is
  // the general form of all of them: anything it cannot grade correctly against
  // itself, it would grade wrongly against a student.
  if (checkAnswer(cleaned, spec).verdict !== 'correct') return null;

  return spec;
}
