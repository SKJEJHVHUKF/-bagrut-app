// ============================================================
// mathscan/validate.ts — is this transcription good enough to act on?
// ============================================================
//
// The gate between free and paid. Its whole job is to answer one question
// honestly: *can we trust what the local OCR just read?*
//
// Getting it wrong is asymmetric, and the thresholds below reflect that:
//   · too strict  → we pay for a vision call we didn't need (cents)
//   · too lenient → a student is confidently shown the solution to a
//                   DIFFERENT equation than the one on their page
// So the composition is deliberately pessimistic. The engine's own
// confidence is treated as a ceiling, never as the answer — Tesseract is
// routinely 90% sure of text that is structurally impossible as maths, and
// the structural checks are what catch that.
//
// Pure and synchronous. Zero cost, runs on every scan.

import type { OcrResult, Validation, ValidationIssue, ValidationVerdict } from './types';
import { extractMathSegments, hasHebrewInsideMath, repairOcrText, unbalancedDollars } from './ocr/normalize';
import { isParseable, splitRelation } from './solve/parse';

// ------------------------------------------------------------
// Thresholds
// ------------------------------------------------------------

/** At or above this we solve on-device without asking. Set from the
 *  asymmetry above: 0.72 is the point where, in the failure cases we could
 *  construct, the remaining errors were visible to the student in the
 *  "השאלה שזיהינו" panel rather than silent. */
const ACCEPT_THRESHOLD = 0.72;

/** Below this the text is not worth showing at all — escalate. */
const REJECT_THRESHOLD = 0.4;

/** Characters that belong in a Hebrew maths question. Anything else is
 *  OCR debris, and the ratio of debris is the single most reliable signal
 *  that a read has gone wrong. */
const EXPECTED_CHARS =
  /[֐-׿a-zA-Z0-9\s+\-*/^_=<>≤≥≠±().,;:!?'"\\{}[\]|√π°%$⋅×÷∫]/;

const MAX_GARBAGE_RATIO = 0.08;

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

export type ValidateInput = {
  /** Raw engine output. */
  ocr: OcrResult;
  /** Set when the STUDENT typed or corrected the text — a human-supplied
   *  string skips the OCR-confidence term entirely. */
  humanEdited?: boolean;
};

export function validateTranscription({ ocr, humanEdited = false }: ValidateInput): Validation {
  const normalized = repairOcrText(ocr.text ?? '');
  const issues: ValidationIssue[] = [];

  const push = (
    code: ValidationIssue['code'],
    message: string,
    penalty: number
  ) => issues.push({ code, message, penalty });

  // ---- structural checks ----
  const stripped = normalized.replace(/\s/g, '');
  if (stripped.length === 0) {
    push('empty', 'לא זוהה טקסט בתמונה.', 1);
    return finish(normalized, [], issues, 0, ocr, humanEdited);
  }
  if (stripped.length < 6) {
    push('too-short', 'זוהו מעט מדי תווים כדי לזהות שאלה.', 0.6);
  }

  const garbageRatio = ratioOfUnexpectedCharacters(normalized);
  if (garbageRatio > MAX_GARBAGE_RATIO) {
    push(
      'garbage-ratio',
      'חלק מהתווים לא נקראו כראוי — כדאי לצלם שוב באור טוב יותר.',
      Math.min(0.6, garbageRatio * 2)
    );
  }

  if (!isBalanced(normalized)) {
    push('unbalanced-delimiters', 'יש סוגריים לא סגורים בטקסט שזוהה.', 0.25);
  }

  // ---- mathematical content ----
  const expressions = extractMathSegments(normalized);
  if (expressions.length === 0) {
    push('no-math-content', 'לא זוהה ביטוי מתמטי בתמונה.', 0.55);
  }

  const parseable = expressions.filter((expression) => {
    const relation = splitRelation(expression);
    if (relation) return isParseable(relation.lhs) && isParseable(relation.rhs);
    return isParseable(expression);
  });
  if (expressions.length > 0 && parseable.length === 0) {
    push('unparseable', 'הביטוי המתמטי שזוהה אינו תקין — כדאי לתקן אותו ידנית.', 0.45);
  }

  const hasRelation = expressions.some((expression) => splitRelation(expression) !== null);
  const hasInstruction = /פתור|פתרו|חשב|חשבו|מצא|מצאו|גזור|גזרו|הוכח|הוכיחו|פשט|פשטו|קבע|נתון/.test(
    normalized
  );

  /**
   * The Hebrew and the maths must agree.
   *
   * This is the check that catches the failure mode the engine confidence
   * cannot: OCR read "פתור את המשוואה" perfectly at 81%, then rendered
   * `x² − 5x + 6 = 0` as `x⋅2−5x20` — no `=`, no `+`, a completely different
   * expression that still parses. Every other signal said "fine". But the
   * instruction WORD promises a relation, so its absence is proof that part
   * of the formula was lost, regardless of how sure the engine is.
   */
  const promisesRelation = /משוואה|אי[-\s]?ה?שוויון|אי[-\s]?ה?שיוויון|פתור|פתרו/.test(normalized);
  if (promisesRelation && expressions.length > 0 && !hasRelation) {
    push(
      'no-relation',
      'השאלה מבקשת לפתור, אבל לא זוהה סימן שוויון בנוסחה — כנראה חלק ממנה לא נקרא.',
      0.5
    );
  } else if (!hasRelation && !hasInstruction) {
    push('no-relation', 'לא זוהתה משוואה או הוראה — ייתכן שחלק מהשאלה נחתך.', 0.3);
  }

  // ---- suspicious patterns ----
  if (/(.)\1{5,}/.test(stripped)) {
    push('suspicious-characters', 'זוהתה חזרה חריגה של תו — סימן לרעש בתמונה.', 0.3);
  }

  /**
   * A degree sign that does not follow a digit is a misread exponent.
   *
   * `60°` is an angle; `x°` is not a thing in mathematics. Tesseract returns
   * the second one for a raised `2` regularly, and the consequence is not a
   * cosmetic error — it silently changes the DEGREE of the polynomial. This
   * fired on a real run where `x² − 5x + 6 = 0` was answered as `x = 6/5`.
   * The penalty is large on purpose: an exponent we cannot read means we
   * cannot solve the question, only a different one.
   */
  if (/[a-zA-Z)\]]\s*°/.test(normalized)) {
    push(
      'suspicious-characters',
      'זוהה סימן מעלות אחרי משתנה — כמעט תמיד זה מעריך (חזקה) שלא נקרא נכון. כדאי לתקן ידנית.',
      0.55
    );
  }

  // Informational only: several sub-questions in one shot still solve, we
  // just want the student to know we may have merged them.
  const sectionLabels = normalized.match(/(?:^|\s)[אבגדה][.)]/g) ?? [];
  if (sectionLabels.length >= 2) {
    push('multiple-questions', 'זוהו כמה סעיפים בתמונה אחת — נפתור את מה שזוהה במלואו.', 0.05);
  }

  // ---- engine confidence ----
  if (!humanEdited && ocr.meanConfidence < 0.6) {
    push(
      'low-engine-confidence',
      'הזיהוי המקומי לא היה בטוח — נעבור לזיהוי מתקדם.',
      (0.6 - ocr.meanConfidence) * 0.8
    );
  }

  const confidence = composeConfidence(ocr, issues, humanEdited);
  return finish(normalized, parseable.length > 0 ? parseable : expressions, issues, confidence, ocr, humanEdited);
}

function finish(
  normalized: string,
  expressions: string[],
  issues: ValidationIssue[],
  confidence: number,
  ocr: OcrResult,
  humanEdited: boolean
): Validation {
  void ocr;
  const verdict: ValidationVerdict =
    confidence >= ACCEPT_THRESHOLD ? 'accept' : confidence >= REJECT_THRESHOLD ? 'review' : 'reject';
  return {
    // Text the student typed themselves is authoritative: they looked at the
    // page. Never downgrade it below 'review' on a heuristic.
    verdict: humanEdited && verdict === 'reject' ? 'review' : verdict,
    confidence: Math.round(confidence * 100) / 100,
    issues,
    normalized,
    expressions,
  };
}

/**
 * Compose the number the UI shows.
 *
 * Multiplicative, not subtractive: two independent doubts should compound,
 * and no single penalty should be able to drive the score negative. The
 * engine's confidence is the STARTING point and every issue can only reduce
 * it — an engine cannot talk its way past a structural failure.
 */
function composeConfidence(ocr: OcrResult, issues: ValidationIssue[], humanEdited: boolean): number {
  // A human-typed string starts from near-certainty; a machine read starts
  // from what the machine claims, capped at 0.97 so it is never "certain".
  let score = humanEdited ? 0.97 : Math.min(0.97, Math.max(0, ocr.meanConfidence));

  for (const issue of issues) {
    score *= 1 - Math.min(0.95, Math.max(0, issue.penalty));
  }
  return Math.max(0, Math.min(1, score));
}

function ratioOfUnexpectedCharacters(text: string): number {
  if (text.length === 0) return 1;
  let bad = 0;
  for (const ch of text) if (!EXPECTED_CHARS.test(ch)) bad++;
  return bad / text.length;
}

function isBalanced(text: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const opens = new Set(Object.values(pairs));
  const stack: string[] = [];
  for (const ch of text) {
    if (opens.has(ch)) stack.push(ch);
    else if (pairs[ch]) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}

// ------------------------------------------------------------
// Display safety
// ------------------------------------------------------------

/**
 * Final guard before a transcription reaches `MathText`.
 *
 * CLAUDE.md rule #5: Hebrew inside `$…$` renders REVERSED, because KaTeX has
 * no bidi. A scanned question is the one place in this app where content
 * isn't hand-authored and can't be caught by `npm run verify:content`, so it
 * is checked at runtime instead — and if the delimiters are wrong we render
 * the text as plain prose rather than shipping reversed Hebrew.
 */
export function isSafeToRenderAsMath(display: string): boolean {
  if (unbalancedDollars(display) !== 0) return false;
  if (hasHebrewInsideMath(display)) return false;
  return true;
}

export const __testables = { composeConfidence, isBalanced, ratioOfUnexpectedCharacters };
export { ACCEPT_THRESHOLD, REJECT_THRESHOLD };
