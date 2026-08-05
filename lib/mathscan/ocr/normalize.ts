// ============================================================
// mathscan/ocr/normalize.ts — raw OCR text → math the app can use.
// ============================================================
//
// Pure string work, no dependencies, fully unit-tested. Three products:
//
//   repairOcrText()      raw OCR → cleaned plain text (confusions repaired)
//   extractMathSegments()cleaned text → the math expressions, for the solver
//   toDisplayQuestion()  cleaned text → Hebrew + $…$ LaTeX, for MathText
//
// The hard rule that shapes everything here: **every repair must be
// context-gated.** A blanket `l → 1` is catastrophic in a Hebrew math app,
// because `l` also appears in real Latin identifiers, and a blanket `O → 0`
// destroys `O` as a point label in geometry. So each confusion below fires
// only in a neighbourhood where the other reading is impossible — a digit on
// both sides, an operator to the left, and so on. Anything ambiguous is left
// exactly as OCR produced it and the validator lowers the confidence
// instead; a scan that says "I'm not sure" is recoverable, a scan that
// silently solves the wrong equation is not.

// ------------------------------------------------------------
// Character classes
// ------------------------------------------------------------

const HEBREW = /[֐-׿]/;
const DIGIT = /[0-9]/;
/**
 * Characters that can legitimately sit inside a mathematical run.
 *
 * `°` is in the list for a defensive reason, not a mathematical one. Any
 * character MISSING from this set silently terminates the run, and the part
 * of the expression before it is discarded as "not meaningful maths". When
 * `x²` was misread as `x°`, that truncation dropped the squared term at
 * EXTRACTION — long before the parser or the validator could object — and
 * the app answered a first-degree equation instead. Keeping the character in
 * the run means the parser sees it, fails, and the validator gets to say so.
 */
const MATH_CHAR = /[0-9a-zA-Z+\-*/^_=<>≤≥≠±().,|√πθαβ!°]/;
const OPERATOR = /[+\-*/^=<>≤≥≠±]/;

/** Latin words that are function names, not variables — never touched by the
 *  digit-confusion repairs. */
const FUNCTION_WORDS = [
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'log', 'ln', 'lim', 'sqrt', 'exp', 'cis',
  'max', 'min', 'abs',
];

// ------------------------------------------------------------
// 1. Repair
// ------------------------------------------------------------

/** Unicode superscripts a phone camera + OCR often produce directly. */
const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  'ⁿ': 'n', '⁺': '+', '⁻': '-',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/**
 * Repair a raw OCR string into clean text.
 * Idempotent: running it twice gives the same result, which matters because
 * the "נסח מחדש" path re-runs the pipeline on already-repaired text.
 */
export function repairOcrText(raw: string): string {
  if (!raw) return '';
  let s = raw;

  // --- unify the punctuation a camera + OCR scatter around ---
  s = s.replace(/[‐-―−]/g, '-'); // every dash flavour → hyphen
  s = s.replace(/[‘’‛]/g, "'");
  s = s.replace(/[“”]/g, '"');
  s = s.replace(/[×⋅·]/g, '*');
  s = s.replace(/÷/g, '/');
  s = s.replace(/[⁄∕]/g, '/'); // fraction slash / division slash
  s = s.replace(/[（］]/g, (m) => (m === '（' ? '(' : ']'));
  s = s.replace(/[）［]/g, (m) => (m === '）' ? ')' : '['));
  s = s.replace(/ /g, ' ');

  // --- superscript / subscript glyphs → explicit ^ and _ ---
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁺⁻]+/g, (run) =>
    `^{${[...run].map((c) => SUPERSCRIPT_MAP[c] ?? '').join('')}}`
  );
  s = s.replace(/[₀-₉]+/g, (run) =>
    `_{${[...run].map((c) => SUBSCRIPT_MAP[c] ?? '').join('')}}`
  );

  // --- comparison operators ---
  s = s.replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=|=\/=/g, '≠');

  // --- the context-gated digit confusions ---
  s = repairDigitConfusions(s);

  // --- roots written as words ---
  s = s.replace(/\bsqrt\s*\(([^()]{1,40})\)/gi, '\\sqrt{$1}');
  s = s.replace(/√\s*\(([^()]{1,40})\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*(\d+(?:\.\d+)?)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([a-zA-Z])/g, '\\sqrt{$1}');

  // --- collapse whitespace, keep line structure ---
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return s;
}

/**
 * The digit/letter confusions, each fired only where the alternative reading
 * is impossible.
 *
 * The gate is always "is this glyph sitting in a numeric neighbourhood" —
 * a digit on at least one side, or an operator on the left and a digit on
 * the right. `x`, `O`, `l` and `S` are all legitimate mathematical symbols in
 * this app (variable, point label, length, area), so an ungated substitution
 * would corrupt correct reads far more often than it repairs broken ones.
 */
function repairDigitConfusions(input: string): string {
  const chars = [...input];
  const isDigit = (i: number) => i >= 0 && i < chars.length && DIGIT.test(chars[i]);
  const isOp = (i: number) => i >= 0 && i < chars.length && OPERATOR.test(chars[i]);

  // Mask out function words so `log`'s "o" and "l" are never candidates.
  const masked = new Set<number>();
  for (const word of FUNCTION_WORDS) {
    const re = new RegExp(word, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      for (let i = m.index; i < m.index + word.length; i++) masked.add(i);
    }
  }

  const CONFUSIONS: Record<string, string> = {
    O: '0', o: '0', D: '0', Q: '0',
    l: '1', I: '1', '|': '1', i: '1',
    S: '5', s: '5',
    Z: '2', z: '2',
    B: '8',
    G: '6',
    T: '7',
  };

  for (let i = 0; i < chars.length; i++) {
    if (masked.has(i)) continue;
    const replacement = CONFUSIONS[chars[i]];
    if (!replacement) continue;

    const digitLeft = isDigit(i - 1);
    const digitRight = isDigit(i + 1);
    const opLeft = isOp(i - 1);

    // Between two digits — unambiguous ("1O5" can only be 105).
    if (digitLeft && digitRight) {
      chars[i] = replacement;
      continue;
    }
    // Digit on exactly one side AND no letter on the other: "2O" → "20".
    const letterLeft = i > 0 && /[a-zA-Z֐-׿]/.test(chars[i - 1]);
    const letterRight = i + 1 < chars.length && /[a-zA-Z֐-׿]/.test(chars[i + 1]);
    if (digitLeft && !letterRight) {
      chars[i] = replacement;
      continue;
    }
    if (digitRight && !letterLeft) {
      chars[i] = replacement;
      continue;
    }
    // Right after an operator and before a non-letter: "= O" → "= 0".
    if (opLeft && !letterRight && !digitRight) {
      chars[i] = replacement;
      continue;
    }
  }

  return chars.join('');
}

// ------------------------------------------------------------
// 2. Extract the math
// ------------------------------------------------------------

/**
 * Pull the mathematical expressions out of a repaired line of Hebrew text.
 *
 * A "math run" is a maximal span of math characters that contains at least
 * one operator or digit and at least two characters. Hebrew letters end a
 * run — which is precisely why the Hebrew must never be inside `$…$` later:
 * the same boundary that lets us extract the math is the one KaTeX needs.
 */
export function extractMathSegments(text: string): string[] {
  const segments: string[] = [];

  for (const line of text.split('\n')) {
    let current = '';
    let lastCharWasHebrew = false;
    let runFollowsHebrewDirectly = false;

    const flush = () => {
      const trimmed = stripMaqaf(
        current.trim().replace(/[.,;:]+$/, ''),
        runFollowsHebrewDirectly
      );
      if (isMeaningfulMath(trimmed)) segments.push(trimmed);
      current = '';
    };

    for (const ch of line) {
      if (HEBREW.test(ch)) {
        flush();
        lastCharWasHebrew = true;
        continue;
      }
      const isMathChar =
        MATH_CHAR.test(ch) || ch === '\\' || ch === '{' || ch === '}' || ch === '[' || ch === ']';
      if (isMathChar || ch === ' ') {
        // Remember whether this run began flush against a Hebrew letter —
        // that is what distinguishes the maqaf in "ו-x" from a real minus.
        if (current === '' && ch !== ' ') runFollowsHebrewDirectly = lastCharWasHebrew;
        current += ch;
        if (ch !== ' ') lastCharWasHebrew = false;
        continue;
      }
      flush();
      lastCharWasHebrew = false;
    }
    flush();
  }

  return dedupe(segments);
}

/**
 * Drop the Hebrew maqaf that prefixes a variable.
 *
 * Hebrew writes "ו-x", "ל-3", "ב-x" with a hyphen glued to the preceding
 * letter. The hyphen is punctuation, not a minus — but it sits inside the
 * math run, so "x + y = 5 ו- x - y = 1" extracts a SECOND equation of
 * "- x - y = 1", whose coefficients are the negatives of the real ones. The
 * determinant then vanishes and a perfectly ordinary system is reported as
 * having no unique solution.
 *
 * The gate is deliberately narrow: only when the run started IMMEDIATELY
 * after a Hebrew letter with no space. "המספר -5" keeps its minus, because
 * there the hyphen is separated by a space.
 */
function stripMaqaf(segment: string, followsHebrewDirectly: boolean): string {
  if (!followsHebrewDirectly) return segment;
  return segment.replace(/^-\s*/, '');
}

/** Reject the fragments that are technically math characters but carry no
 *  mathematical content — a stray "3." from a section label, a lone "(", the
 *  page number. Without this the solver spends its time on debris. */
function isMeaningfulMath(s: string): boolean {
  if (s.length < 3) return false;
  if (!/[0-9a-zA-Z]/.test(s)) return false;
  // Must contain a real operator or relation.
  if (!OPERATOR.test(s)) return false;
  // A bare enumeration like "1)" or "2." never reaches here (no operator),
  // but "a-" and "3-" do — require something on BOTH sides of an operator.
  if (!/[0-9a-zA-Z)}\]]\s*[+\-*/^=<>≤≥≠]\s*[0-9a-zA-Z(\\{[]/.test(s)) return false;
  return true;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// ------------------------------------------------------------
// 3. Render for MathText
// ------------------------------------------------------------

/**
 * Wrap the math runs in `$…$` so `components/practice/MathText.tsx` renders
 * them with KaTeX, leaving the Hebrew prose outside.
 *
 * This is the app's hardest content rule (CLAUDE.md #5): Hebrew inside `$…$`
 * renders reversed because KaTeX has no bidi. The function is written so
 * that a Hebrew character can never end up inside a delimiter — the run
 * terminates at the first Hebrew glyph, before the `$` is closed.
 */
export function toDisplayQuestion(text: string): string {
  const lines = text.split('\n').map((line) => {
    let out = '';
    let run = '';
    let lastCharWasHebrew = false;
    let runFollowsHebrewDirectly = false;

    const flushRun = () => {
      const trimmed = run.trim();
      if (!trimmed) {
        out += run;
        run = '';
        return;
      }
      // The maqaf in "ו-x" belongs to the Hebrew, not to the formula: it must
      // stay OUTSIDE the `$…$` or the equation renders with a phantom minus.
      const maqaf = runFollowsHebrewDirectly && trimmed.startsWith('-');
      const body = maqaf ? stripMaqaf(trimmed, true) : trimmed;
      if (isMeaningfulMath(body)) {
        const lead = run.slice(0, run.length - run.trimStart().length);
        const tail = run.slice(run.trimEnd().length);
        out += `${maqaf ? '-' : ''}${lead}$${prettyMath(body)}$${tail}`;
      } else {
        out += run;
      }
      run = '';
    };

    for (const ch of line) {
      if (HEBREW.test(ch)) {
        flushRun();
        out += ch;
        lastCharWasHebrew = true;
        continue;
      }
      if (MATH_CHAR.test(ch) || ch === '\\' || ch === '{' || ch === '}' || ch === ' ') {
        if (run === '' && ch !== ' ') runFollowsHebrewDirectly = lastCharWasHebrew;
        run += ch;
        if (ch !== ' ') lastCharWasHebrew = false;
        continue;
      }
      flushRun();
      out += ch;
      lastCharWasHebrew = false;
    }
    flushRun();
    return out;
  });

  return lines.join('\n\n'); // blank line = a real paragraph break in remark
}

/** Cosmetic pass applied only to what the STUDENT sees. `*` is a valid
 *  multiplication in the parser but renders as `∗` in KaTeX, which reads as
 *  a footnote marker; `\cdot` is what a maths paper prints. */
function prettyMath(segment: string): string {
  return (
    segment
      .replace(/\s*\*\s*/g, ' \\cdot ')
      // A raw `°` inside `$…$` makes KaTeX log "unknown symbol" on every
      // render; `^{\circ}` is the same glyph and parses.
      .replace(/°/g, '^{\\circ}')
  );
}

/** Sanity gate used by both the pipeline and the verify script: no Hebrew
 *  character may appear between a pair of `$` delimiters. */
export function hasHebrewInsideMath(text: string): boolean {
  const re = /\$([^$]*)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (HEBREW.test(m[1])) return true;
  }
  return false;
}

/** Count of unmatched `$` delimiters — 0 means balanced. */
export function unbalancedDollars(text: string): number {
  const count = (text.match(/\$/g) || []).length;
  return count % 2;
}
