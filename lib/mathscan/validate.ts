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

  // An odd number of `$` means a LaTeX span was never closed. Left alone it
  // swallows the rest of the question into math mode and renders as raw
  // backslash commands — which RTL then reorders into nonsense.
  if (((normalized.match(/\$/g) ?? []).length) % 2 === 1) {
    push('unbalanced-delimiters', 'נוסחה שלא נסגרה כראוי — כדאי לעבור על הטקסט.', 0.2);
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

  // ---- the maths, judged separately from the Hebrew ----
  //
  // THE failure this catches, measured on a real printed bagrut question:
  // Tesseract read every Hebrew sentence perfectly and every FORMULA wrong —
  // `z₁` became `21`, `√` became `N`, the conjugate bar and the exponent
  // vanished — and the composite score came out 80% "זיהוי ברור". The prose
  // is most of the characters, so it drowns the part that actually matters.
  //
  // Tesseract is a text engine: it has no model of two-dimensional maths
  // layout, so it does not fail loudly on a subscript or a radical, it
  // silently returns something plausible. These signals are how we notice.
  for (const anomaly of mathAnomalies(expressions, ocr.lines)) {
    push(anomaly.code, anomaly.message, anomaly.penalty);
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

type MathAnomaly = {
  code: ValidationIssue['code'];
  message: string;
  penalty: number;
};

/**
 * Signals that the FORMULAS were misread, independent of how well the Hebrew
 * came out. Each one was observed on a real scan, not imagined.
 */
function mathAnomalies(expressions: string[], lines: OcrResult['lines']): MathAnomaly[] {
  const anomalies: MathAnomaly[] = [];

  // (1) Fragmentation. A formula is ONE line. When Tesseract cannot resolve
  // the 2-D layout it emits the pieces separately — the real scan produced
  // `z+"`, `+`, `2`, `=`, `1` as five distinct lines. Several one- or
  // two-character maths lines in a row is the strongest signal available,
  // and it needs no assumption about what the formula should have been.
  const mathLines = lines.filter((line) => {
    const text = line.text.trim();
    if (!text) return false;
    const hebrew = [...text].filter((ch) => HEBREW_CHAR.test(ch)).length;
    return hebrew / text.length < 0.3;
  });
  const fragments = mathLines.filter((line) => line.text.trim().length <= 2).length;
  if (fragments >= 3) {
    anomalies.push({
      code: 'unparseable',
      message: 'הנוסחאות נקראו בחלקים ולא כמכלול — סימן שהמבנה שלהן לא זוהה.',
      penalty: 0.55,
    });
  }

  // Patterns (2) and (3) scan the math-heavy LINES as well as the extracted
  // expressions. On the real scan the mangled formula was so broken that
  // `isMeaningfulMath` rejected it outright, so `expressions` was empty and a
  // check that looked only there would have found nothing to complain about —
  // exactly when complaining matters most.
  const mathText = [...mathLines.map((line) => line.text), ...expressions].join(' \n ');

  // (2) A letter wedged between digits with no operator: `4N2` is what
  // `4√2` became. Real notation almost never writes that.
  if (/\d[a-zA-Z]\d/.test(mathText.replace(/[ \t]/g, ''))) {
    anomalies.push({
      code: 'suspicious-characters',
      message: 'זוהתה אות בין שתי ספרות — לרוב זה שורש או סימן שלא נקרא נכון.',
      penalty: 0.45,
    });
  }

  // (3) Quote marks inside maths — `z + z̄` came back as `z+"`, the
  // conjugate bar read as a double quote.
  if (/["'”“]/.test(mathText)) {
    anomalies.push({
      code: 'suspicious-characters',
      message: 'זוהו גרשיים בתוך נוסחה — לרוב זה סימן (כמו צמוד) שלא נקרא.',
      penalty: 0.4,
    });
  }

  return anomalies;
}

const HEBREW_CHAR = /[֐-׿]/;

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
