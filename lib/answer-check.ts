// ============================================================
// answer-check.ts — deterministic, $0-per-use answer checking.
// ============================================================
//
// Runs entirely in-process (browser or edge) using mathjs — NO API call,
// no model judgement. This is the engine behind "check my answer" in the
// free, built-in tutor: it decides correct/wrong by NUMERIC EVALUATION,
// accepting ANY mathematically-equivalent form the student types.
//
// Design:
//  - Each practice question carries a clean machine-readable `AnswerSpec`
//    (authored in near-mathjs syntax) — we never parse the human LaTeX
//    `finalAnswer` string, which would be fragile.
//  - The STUDENT'S typed input is the only thing we normalise (LaTeX-ish,
//    √, cis°, ±, fractions) → mathjs → a complex number (or a set of them).
//  - Equivalence = numeric equality within a tiny tolerance. For sets
//    (roots, multiple solutions) we compare as unordered multisets.
//
// What it grades reliably: numbers, complex numbers, algebraic constants,
// and sets of these — i.e. the large majority of bagrut final answers.
// What it deliberately does NOT auto-grade (returns 'manual'): geometric
// descriptions ("circle centre (3,0)"), "find ALL n" families, and proofs.
// Auto-grading those from free text risks a WRONG verdict — and a wrong
// verdict is worse than asking the student to self-check.

import { create, all } from 'mathjs';

const math = create(all, { number: 'number' });

// cis θ (θ in DEGREES — the 5-unit bagrut convention). Authored answers
// and student input both use cis in degrees; define it once here so the
// expression parser treats `cis(60)` as a first-class complex value.
math.import(
  {
    cis: (deg: number) => {
      const r = (deg * Math.PI) / 180;
      return math.complex(Math.cos(r), Math.sin(r));
    },
  },
  { override: true }
);

// ------------------------------------------------------------
// Answer specification — attached to a practice question/part.
// ------------------------------------------------------------
export type AnswerSpec =
  // A single value: real OR complex. `value` is a mathjs-evaluable string,
  // e.g. "5", "-8", "2+3i", "2*sqrt(3)+2i", "2*cis(60)".
  | { kind: 'value'; value: string }
  // An unordered set of values (roots, multiple solutions).
  | { kind: 'set'; values: string[] }
  // Not auto-checkable (geometric locus, "find all n", proof). The UI
  // shows the reference solution and lets the student self-judge.
  | { kind: 'manual'; reason?: string };

export type Verdict = 'correct' | 'wrong' | 'manual' | 'unparseable';

export type CheckResult = {
  verdict: Verdict;
  /** The complex value(s) we parsed the student input into (for debugging
   *  / showing "we read your answer as …"). */
  readAs?: string;
};

const TOL = 1e-7;

type Cx = { re: number; im: number };

function toCx(v: unknown): Cx | null {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { re: v, im: 0 } : null;
  }
  // mathjs Complex has .re / .im
  if (v && typeof v === 'object' && 're' in v && 'im' in v) {
    const re = (v as { re: number }).re;
    const im = (v as { im: number }).im;
    if (Number.isFinite(re) && Number.isFinite(im)) return { re, im };
  }
  // mathjs Fraction or BigNumber → coerce
  if (v && typeof v === 'object' && typeof (v as { toString?: () => string }).toString === 'function') {
    const n = Number((v as { toString: () => string }).toString());
    if (Number.isFinite(n)) return { re: n, im: 0 };
  }
  return null;
}

/** Turn a student's (possibly LaTeX-ish) string into a mathjs-parseable
 *  expression. Spec values are already clean but pass through harmlessly. */
function normalizeExpr(raw: string): string {
  let s = ` ${raw} `;

  // Strip math delimiters and spacing macros.
  s = s.replace(/\$\$?/g, ' ');
  s = s.replace(/\\left|\\right|\\!|\\;|\\:|\\quad|\\qquad/g, ' ');
  s = s.replace(/\\,/g, ' ');
  s = s.replace(/[（）]/g, (m) => (m === '（' ? '(' : ')'));

  // Drop a leading label like "z_1 =", "|z| =", "arg(z) =", "n =", "S ="
  // — keep only what's after the LAST '=' (the actual value).
  if (s.includes('=')) {
    const parts = s.split('=');
    s = parts[parts.length - 1];
  }

  // cis notation → cis(<angle>). Handle \text{cis}, \operatorname{cis}, cis.
  s = s.replace(/\\operatorname\{cis\}|\\text\{cis\}|\\mathrm\{cis\}/g, 'cis');
  // "cis 60", "cis60", "cis 60°", "cis(60)" → "cis(60)"
  s = s.replace(/cis\s*\(?\s*(-?\d+(?:\.\d+)?)\s*°?\s*\)?/g, 'cis($1)');

  // Roots and fractions.
  s = s.replace(/\\sqrt\s*\[\s*(\d+)\s*\]\s*\{([^{}]*)\}/g, 'nthRoot(($2),$1)');
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
  s = s.replace(/√\s*\{([^{}]*)\}/g, 'sqrt($1)');
  s = s.replace(/√\s*\(([^()]*)\)/g, 'sqrt($1)');
  s = s.replace(/√\s*(\d+(?:\.\d+)?)/g, 'sqrt($1)');
  s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '(($1)/($2))');

  // Operators and powers. Also normalise the bare Unicode glyphs a math
  // keyboard inserts (× ÷ − π) — without this they reach mathjs unparsed
  // and every such answer would come back 'unparseable'.
  s = s.replace(/\\cdot|\\times|·|×/g, '*');
  s = s.replace(/\\div|÷/g, '/');
  s = s.replace(/−/g, '-'); // U+2212 minus sign → ASCII hyphen-minus
  s = s.replace(/\^\s*\{([^{}]*)\}/g, '^($1)');
  s = s.replace(/_\s*\{[^{}]*\}/g, ''); // drop subscripts (labels)
  s = s.replace(/[°]/g, ' '); // any stray degree marks
  s = s.replace(/\\pi|π/g, 'pi');

  // Natural log: LaTeX "\ln" and bare "ln" → mathjs `log` (whose one-arg form
  // IS the natural log). Lets exp/ln/growth answers grade whether the student
  // (or the spec) writes ln or log.
  s = s.replace(/\\ln\b/g, 'log');
  s = s.replace(/\bln\b/g, 'log');

  // Implicit multiplication the mathjs parser doesn't always infer:
  //   2sqrt(3) → 2*sqrt(3) · 3√.. handled above · )(  → )*( · 2cis → 2*cis
  s = s.replace(/(\d)\s*(sqrt|nthRoot|cis|pi|log|e)\b/g, '$1*$2');
  s = s.replace(/(\d)\s*\(/g, '$1*(');
  s = s.replace(/\)\s*\(/g, ')*(');
  s = s.replace(/\)\s*(sqrt|nthRoot|cis|log)\b/g, ')*$1');

  return s.trim();
}

/** Split a set-answer string into individual item strings, expanding ±. */
function splitItems(raw: string): string[] {
  // Normalise separators: Hebrew "ו-"/"או", "and", commas, semicolons,
  // and LaTeX line breaks "\\".
  let s = raw.replace(/\\\\/g, ',');
  s = s.replace(/\s+(?:ו-?|או|and)\s+/g, ',');
  const rawItems = s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);

  // Expand ± / \pm: one ± → 2 items, two ± → 4 items.
  const out: string[] = [];
  for (const item of rawItems) {
    const pmCount = (item.match(/±|\\pm/g) || []).length;
    if (pmCount === 0) {
      out.push(item);
      continue;
    }
    const combos = expandPm(item);
    out.push(...combos);
  }
  return out;
}

function expandPm(item: string): string[] {
  let results = [item];
  let guard = 0;
  while (results.some((r) => /±|\\pm/.test(r)) && guard < 4) {
    const next: string[] = [];
    for (const r of results) {
      if (!/±|\\pm/.test(r)) {
        next.push(r);
        continue;
      }
      next.push(r.replace(/±|\\pm/, '+'));
      next.push(r.replace(/±|\\pm/, '-'));
    }
    results = next;
    guard++;
  }
  return results;
}

function evalCx(expr: string): Cx | null {
  const normalized = normalizeExpr(expr);
  if (!normalized) return null;
  try {
    const val = math.evaluate(normalized);
    return toCx(val);
  } catch {
    return null;
  }
}

function eq(a: Cx, b: Cx): boolean {
  return Math.abs(a.re - b.re) < TOL && Math.abs(a.im - b.im) < TOL;
}

/** Unordered multiset equality of two complex lists. */
function sameSet(student: Cx[], expected: Cx[]): boolean {
  if (student.length !== expected.length) return false;
  const used = new Array(student.length).fill(false);
  for (const e of expected) {
    const idx = student.findIndex((s, i) => !used[i] && eq(s, e));
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}

/**
 * Check a student's typed answer against the spec. Pure + deterministic.
 */
export function checkAnswer(studentRaw: string, spec: AnswerSpec): CheckResult {
  if (spec.kind === 'manual') return { verdict: 'manual' };

  const input = (studentRaw ?? '').trim();
  if (!input) return { verdict: 'unparseable' };

  if (spec.kind === 'value') {
    const student = evalCx(input);
    const expected = evalCx(spec.value);
    if (!student) return { verdict: 'unparseable' };
    if (!expected) return { verdict: 'manual' }; // bad spec — don't false-fail
    return {
      verdict: eq(student, expected) ? 'correct' : 'wrong',
      readAs: fmt(student),
    };
  }

  // set
  const studentItems = splitItems(input).map(evalCx);
  if (studentItems.some((x) => x === null)) return { verdict: 'unparseable' };
  const expectedItems = spec.values.map(evalCx);
  if (expectedItems.some((x) => x === null)) return { verdict: 'manual' };
  const s = studentItems as Cx[];
  const e = expectedItems as Cx[];
  return {
    verdict: sameSet(s, e) ? 'correct' : 'wrong',
    readAs: s.map(fmt).join(', '),
  };
}

function fmt(c: Cx): string {
  const r = round(c.re);
  const i = round(c.im);
  if (Math.abs(i) < TOL) return `${r}`;
  if (Math.abs(r) < TOL) return `${i}i`;
  return `${r}${i >= 0 ? '+' : ''}${i}i`;
}

function round(n: number): number {
  return Math.abs(n) < TOL ? 0 : Math.round(n * 1e6) / 1e6;
}
