// ============================================================
// mathscan/solve/parse.ts — LaTeX-ish math → a mathjs expression tree.
// ============================================================
//
// The bridge between "what OCR read" and "what the CAS can compute". Pure,
// synchronous, no I/O.
//
// This deliberately mirrors the normalisation already proven in
// `lib/answer-check.ts` (the app's answer grader) rather than inventing a
// second dialect: the same `\frac`, `\sqrt`, `cis`, `ln → log` conventions,
// so an expression that grades correctly there parses correctly here. The
// two differ only in scope — answer-check normalises a student's *answer*,
// this normalises a whole *question*, so it additionally understands
// relations (=, <, ≥) and derivative/integral notation.

import { parse, type MathNode } from 'mathjs';

export type Relation = '=' | '<' | '>' | '≤' | '≥' | '≠';

export type ParsedRelation = {
  lhs: string;
  rhs: string;
  relation: Relation;
};

/**
 * LaTeX (or LaTeX-ish OCR output) → a string mathjs can parse.
 *
 * Ordering matters and is not arbitrary: `\frac` must be expanded before
 * braces are stripped, and implicit multiplication must be inserted last,
 * once every macro has become an ordinary function call.
 */
export function latexToMathjs(input: string): string {
  let s = ` ${input} `;

  // --- delimiters and spacing macros ---
  s = s.replace(/\$\$?/g, ' ');
  s = s.replace(/\\left|\\right|\\!|\\;|\\:|\\quad|\\qquad|\\,/g, ' ');
  s = s.replace(/\\displaystyle|\\limits/g, ' ');

  // --- fractions and roots (brace-matching, not regex) ---
  // A regex with `[^{}]*` arguments cannot read `\frac{x^{4}}{4}`: the
  // numerator contains braces, so nothing matches, the braces get stripped
  // later, and the expression becomes the un-parseable `\fracx^(4)4`. That
  // is not a corner case — it is what mathjs's own `toTex()` emits for
  // every power inside a fraction, so the round trip has to handle it.
  s = expandBracedMacros(s);

  // \frac12 — the brace-less two-argument form LaTeX also accepts.
  s = s.replace(/\\[dt]?frac\s*(\d)\s*(\d)/g, '(($1)/($2))');

  // --- unicode roots ---
  s = s.replace(/√\s*\{([^{}]*)\}/g, 'sqrt($1)');
  s = s.replace(/√\s*\(([^()]*)\)/g, 'sqrt($1)');
  s = s.replace(/√\s*(\d+(?:\.\d+)?)/g, 'sqrt($1)');
  s = s.replace(/√\s*([a-zA-Z])/g, 'sqrt($1)');

  // --- functions ---
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|exp|min|max|arcsin|arccos|arctan)\b/g, '$1');
  s = s.replace(/\\operatorname\{([a-z]+)\}/gi, '$1');
  s = s.replace(/\\text\{cis\}|\\mathrm\{cis\}/g, 'cis');
  // mathjs's one-argument `log` IS the natural log — matching answer-check.
  s = s.replace(/\bln\b/g, 'log');
  // log with an explicit base: log_a(b) → log(b, a)
  s = s.replace(/\blog\s*_\s*\{?([0-9a-zA-Z.]+)\}?\s*\(([^()]*)\)/g, 'log($2,$1)');

  // --- constants and operators ---
  s = s.replace(/\\pi|π/g, 'pi');
  s = s.replace(/\\cdot|\\times|·|×/g, '*');
  s = s.replace(/\\div|÷/g, '/');
  s = s.replace(/\\le\b|≤/g, '<=');
  s = s.replace(/\\ge\b|≥/g, '>=');
  s = s.replace(/\\ne\b|≠/g, '!=');
  s = s.replace(/−|–|—/g, '-');
  s = s.replace(/\^\s*\{([^{}]*)\}/g, '^($1)');
  // Absolute value |x| → abs(x). Only for a balanced, single-level pair —
  // nested bars are ambiguous and are left for the fallback to handle.
  s = s.replace(/\|([^|]{1,40})\|/g, 'abs($1)');
  // A degree sign is only meaningful after a NUMBER (`60°`). After a letter
  // it is an OCR misread of a superscript — `x²` comes back as `x°` from
  // Tesseract more often than not. Stripping it unconditionally (as
  // answer-check does, where the input is always an angle) deleted the
  // exponent and turned `x² − 5x + 6 = 0` into `−5x + 6 = 0`, which the
  // solver then answered confidently and wrongly. Leaving it in place makes
  // the expression fail to parse, which is what the validator needs to see.
  s = s.replace(/(\d)\s*°/g, '$1');
  s = s.replace(/\\%|%/g, '/100');

  // --- subscripts: x_1 is a NAME, not a product ---
  s = s.replace(/([a-zA-Z])\s*_\s*\{([^{}]*)\}/g, '$1$2');
  s = s.replace(/([a-zA-Z])\s*_\s*([0-9a-zA-Z])/g, '$1$2');

  // --- leftover braces ---
  s = s.replace(/[{}]/g, '');

  // --- implicit multiplication ---
  // mathjs infers `2x` but not `2sqrt(3)`, `)(`, or `x(x+1)`.
  s = s.replace(/(\d)\s*(sqrt|nthRoot|cis|pi|log|sin|cos|tan|abs|exp|e)\b/g, '$1*$2');
  s = s.replace(/(\d)\s*\(/g, '$1*(');
  s = s.replace(/\)\s*\(/g, ')*(');
  s = s.replace(/\)\s*([a-zA-Z])/g, ')*$1');
  s = s.replace(/([a-zA-Z0-9)])\s*\\/g, '$1*');

  return s.replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------
// Brace-matching macro expansion
// ------------------------------------------------------------

/** Read the `{…}` group starting at `start`, honouring nesting. */
function readGroup(source: string, start: number): { content: string; end: number } | null {
  if (source[start] !== '{') return null;
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return { content: source.slice(start + 1, i), end: i + 1 };
    }
  }
  return null; // unbalanced — the caller leaves the text alone
}

function skipSpaces(source: string, index: number): number {
  let i = index;
  while (i < source.length && /\s/.test(source[i])) i++;
  return i;
}

/**
 * Expand `\frac{a}{b}`, `\sqrt{a}` and `\sqrt[n]{a}` into mathjs syntax,
 * recursing into each argument so arbitrary nesting works.
 */
function expandBracedMacros(source: string): string {
  let out = '';
  let i = 0;

  while (i < source.length) {
    if (source[i] !== '\\') {
      out += source[i++];
      continue;
    }

    const fracMatch = /^\\[dt]?frac/.exec(source.slice(i));
    if (fracMatch) {
      let cursor = skipSpaces(source, i + fracMatch[0].length);
      const numerator = readGroup(source, cursor);
      if (numerator) {
        cursor = skipSpaces(source, numerator.end);
        const denominator = readGroup(source, cursor);
        if (denominator) {
          out += `((${expandBracedMacros(numerator.content)})/(${expandBracedMacros(denominator.content)}))`;
          i = denominator.end;
          continue;
        }
      }
      out += source[i++];
      continue;
    }

    if (source.startsWith('\\sqrt', i)) {
      let cursor = skipSpaces(source, i + 5);
      let degree: string | null = null;
      if (source[cursor] === '[') {
        const close = source.indexOf(']', cursor);
        if (close !== -1) {
          degree = source.slice(cursor + 1, close);
          cursor = skipSpaces(source, close + 1);
        }
      }
      const radicand = readGroup(source, cursor);
      if (radicand) {
        const inner = expandBracedMacros(radicand.content);
        out += degree ? `nthRoot((${inner}),(${expandBracedMacros(degree)}))` : `sqrt(${inner})`;
        i = radicand.end;
        continue;
      }
      out += source[i++];
      continue;
    }

    out += source[i++];
  }

  return out;
}

/** Parse, returning null instead of throwing. */
export function tryParse(expression: string): MathNode | null {
  const cleaned = latexToMathjs(expression);
  if (!cleaned) return null;
  try {
    return parse(cleaned);
  } catch {
    return null;
  }
}

/** True when the string is valid math the CAS can work with. Used by the
 *  validator to score a transcription without solving it. */
export function isParseable(expression: string): boolean {
  return tryParse(expression) !== null;
}

const RELATION_PATTERN = /(<=|>=|!=|≤|≥|≠|=|<|>)/;

/**
 * Split "3x + 1 = 10" into its two sides.
 *
 * Returns null for a chained relation ("0 < x < 5") — that is a genuinely
 * different object (a compound inequality) and pretending it is a simple one
 * would produce a confidently wrong answer. The classifier marks those
 * unsupported so they go to the fallback intact.
 */
export function splitRelation(expression: string): ParsedRelation | null {
  const normalized = expression.replace(/\s+/g, ' ').trim();
  const parts = normalized.split(RELATION_PATTERN).filter((p) => p !== '');
  // A simple relation splits into exactly [lhs, op, rhs].
  if (parts.length !== 3) return null;
  const [lhs, op, rhs] = parts;
  if (!lhs.trim() || !rhs.trim()) return null;

  const relation: Relation =
    op === '<=' || op === '≤'
      ? '≤'
      : op === '>=' || op === '≥'
        ? '≥'
        : op === '!=' || op === '≠'
          ? '≠'
          : (op as Relation);

  return { lhs: lhs.trim(), rhs: rhs.trim(), relation };
}

/** Free variables in an expression, excluding constants and function names. */
export function freeVariables(expression: string): string[] {
  const node = tryParse(expression);
  if (!node) return [];
  const reserved = new Set([
    'pi', 'e', 'i', 'Infinity', 'NaN', 'true', 'false',
    'sqrt', 'nthRoot', 'log', 'exp', 'abs', 'cis',
    'sin', 'cos', 'tan', 'cot', 'asin', 'acos', 'atan',
  ]);
  const found = new Set<string>();
  // `traverse` visits the node itself and every descendant; `forEach` would
  // only reach direct children and would miss the variable in `2*(x+1)`.
  node.traverse((child, path) => {
    if (child.type !== 'SymbolNode') return;
    // A FunctionNode stores its name as a SymbolNode at path 'fn'. Counting
    // it would make `f` a variable of `f(x) = x^2`, and the solver would
    // happily try to differentiate with respect to f.
    if (path === 'fn') return;
    const name = (child as unknown as { name: string }).name;
    if (!reserved.has(name)) found.add(name);
  });
  return [...found].sort();
}
