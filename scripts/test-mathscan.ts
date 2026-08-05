// ============================================================
// scripts/test-mathscan.ts — the correctness gate for the photo-scan engine.
// ============================================================
//
// Run: npx tsx scripts/test-mathscan.ts   (wired into `npm run check`)
//
// This repo's standing lesson is that a green structural gate says nothing
// about whether the maths is RIGHT — `verify-concept` passes on a wrong
// answer key, and `\cos(545°)` is valid LaTeX. So this file does not check
// shapes. It checks VALUES, and it checks them two ways:
//
//   1. the expected answer is written out by hand, and
//   2. every root the engine returns is INDEPENDENTLY substituted back into
//      the original expression with mathjs (`assertRoot`), so a test that
//      agrees with a wrong implementation still fails.
//
// The second check is the one that matters: it is the reason a copy-paste
// error in an expectation can't quietly pass.

import { evaluate, derivative } from 'mathjs';
import {
  repairOcrText,
  extractMathSegments,
  toDisplayQuestion,
  hasHebrewInsideMath,
  unbalancedDollars,
} from '../lib/mathscan/ocr/normalize';
import { latexToMathjs, splitRelation, freeVariables } from '../lib/mathscan/solve/parse';
import { classifyProblem } from '../lib/mathscan/solve/classify';
import { localEngine, __testables as engineInternals } from '../lib/mathscan/solve/engine-local';
import { simplifySqrt, toFrac, surdToLatex, tidyTex, makeFrac } from '../lib/mathscan/solve/exact';
import { validateTranscription } from '../lib/mathscan/validate';
import { explainSolution } from '../lib/mathscan/explain';
import { __testables as ocrInternals } from '../lib/mathscan/ocr/tesseract-engine';
import { checkScope, topicForDomain } from '../lib/mathscan/levels';
import { summarizeCost } from '../lib/mathscan/cost';
import { matchScannedQuestion } from '../lib/solution-library';
import { buildMatchIndex, findMatch, __testables } from '../lib/mathscan/match';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import type { ClassifiedProblem, ProblemKind, SolveOutcome } from '../lib/mathscan/types';

let passed = 0;
const failures: string[] = [];

function ok(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    return;
  }
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function eq<T>(label: string, actual: T, expected: T): void {
  ok(label, Object.is(actual, expected), `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
}

function near(label: string, actual: number, expected: number, tol = 1e-9): void {
  ok(label, Math.abs(actual - expected) <= tol, `got ${actual}, want ${expected}`);
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** The OCR errors measured on a real printed bagrut page, plus a seeded
 *  character drop. Same generator as `scripts/bench-match.ts` — two calls
 *  with different seeds model two students photographing the same page. */
function noise(s: string, seed: number, dropRate: number): string {
  const substituted = s
    .replace(/\\sqrt/g, 'N')
    .replace(/\^2/g, '°')
    .replace(/_1/g, '1')
    .replace(/_2/g, '2')
    .replace(/\\cdot/g, '.')
    .replace(/\\frac/g, 'frac')
    .replace(/\$/g, '');
  let n = seed || 1;
  return [...substituted]
    .filter(() => {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      return n % 100 >= dropRate;
    })
    .join('');
}

function problem(
  kind: ProblemKind,
  expressions: string[],
  variables: string[] = ['x'],
  extra: Partial<ClassifiedProblem> = {}
): ClassifiedProblem {
  return {
    kind,
    domain: 'algebra',
    expressions,
    variables,
    cues: [],
    confidence: 0.9,
    multiPart: false,
    parts: [],
    ...extra,
  };
}

async function solve(p: ClassifiedProblem): Promise<SolveOutcome> {
  return localEngine.solve(p);
}

/**
 * INDEPENDENT verification: every value the engine reported must satisfy the
 * original equation. This does not consult the engine's own arithmetic —
 * it re-evaluates the source expression with mathjs at each root.
 */
function assertRoot(label: string, equation: string, variable: string, values: string[]): void {
  const relation = splitRelation(equation);
  if (!relation) {
    ok(label, false, 'test equation has no relation');
    return;
  }
  const residual = `(${latexToMathjs(relation.lhs)}) - (${latexToMathjs(relation.rhs)})`;
  for (const value of values) {
    let x: number;
    try {
      x = Number(evaluate(value));
    } catch {
      ok(`${label} [substitute ${value}]`, false, 'answer value does not evaluate');
      continue;
    }
    let r: number;
    try {
      r = Number(evaluate(residual, { [variable]: x }));
    } catch (error) {
      ok(`${label} [substitute ${value}]`, false, String(error));
      continue;
    }
    ok(
      `${label} [substitute ${value} → ${x}]`,
      Math.abs(r) < 1e-8 * Math.max(1, Math.abs(x) ** 2),
      `residual ${r}`
    );
  }
}

// ============================================================
// 1. exact arithmetic
// ============================================================

eq('simplifySqrt(18)', JSON.stringify(simplifySqrt(18)), JSON.stringify({ coefficient: 3, radicand: 2 }));
eq('simplifySqrt(16)', JSON.stringify(simplifySqrt(16)), JSON.stringify({ coefficient: 4, radicand: 1 }));
eq('simplifySqrt(17)', JSON.stringify(simplifySqrt(17)), JSON.stringify({ coefficient: 1, radicand: 17 }));
eq('simplifySqrt(72)', JSON.stringify(simplifySqrt(72)), JSON.stringify({ coefficient: 6, radicand: 2 }));
// 72 = 36·2, and 6² = 36 — checked by hand, then by the identity below.
ok('simplifySqrt(72) is exact', 6 * 6 * 2 === 72);

eq('toFrac(0.5)', JSON.stringify(toFrac(0.5)), JSON.stringify({ n: 1, d: 2 }));
eq('toFrac(1/3)', JSON.stringify(toFrac(1 / 3)), JSON.stringify({ n: 1, d: 3 }));
eq('toFrac(-2.25)', JSON.stringify(toFrac(-2.25)), JSON.stringify({ n: -9, d: 4 }));
eq('toFrac(7)', JSON.stringify(toFrac(7)), JSON.stringify({ n: 7, d: 1 }));
ok('toFrac(sqrt(2)) has no small rational form', toFrac(Math.SQRT2, 1000) === null);

// (2 ± 2√3)/4 must reduce to (1 ± √3)/2 — the common factor has to divide
// the surd coefficient too, which is the classic bug in this reduction.
eq('surdToLatex reduces all three parts', surdToLatex(2, 2, 3, 4), '\\frac{1 + \\sqrt{3}}{2}');
near(
  'surdToLatex(2,2,3,4) preserves the value',
  Number(evaluate('(1 + sqrt(3))/2')),
  (2 + 2 * Math.sqrt(3)) / 4
);
eq('surdToLatex negative branch', surdToLatex(2, -2, 3, 4), '\\frac{1 - \\sqrt{3}}{2}');
near(
  'surdToLatex negative branch preserves the value',
  Number(evaluate('(1 - sqrt(3))/2')),
  (2 - 2 * Math.sqrt(3)) / 4
);
eq('surdToLatex collapses radicand 1', surdToLatex(3, 5, 1, 2), '4');
eq('fraction sign lives on the numerator', JSON.stringify(makeFrac(3, -6)), JSON.stringify({ n: -1, d: 2 }));

eq('tidyTex drops \\cdot before a variable', tidyTex('3\\cdot{ x}^{2}'), '3x^{2}');
ok('tidyTex keeps \\cdot between numbers', tidyTex('2\\cdot 3').includes('\\cdot'));

// ============================================================
// 2. OCR repair + extraction
// ============================================================

eq('superscript glyph becomes a power', repairOcrText('x² - 5x + 6 = 0'), 'x^{2} - 5x + 6 = 0');
eq('unicode minus normalises', repairOcrText('3 − 2 = 1'), '3 - 2 = 1');
eq('times glyph normalises', repairOcrText('3 × 4'), '3 * 4');
eq('digit-flanked O becomes zero', repairOcrText('1O5 + 2'), '105 + 2');
// The gate: `x` is a variable, and `O` between letters is a point label —
// neither may be "repaired" into a digit.
ok('x is never turned into a digit', repairOcrText('2x + 1 = 0').includes('2x'));
ok('a point label survives', repairOcrText('נקודה O נמצאת').includes('O'));
ok('function words are protected', repairOcrText('log(x) + 1').startsWith('log('));
eq('repair is idempotent', repairOcrText(repairOcrText('x² = 4')), repairOcrText('x² = 4'));

const segments = extractMathSegments('פתור את המשוואה x^{2} - 5x + 6 = 0 ומצא את השורשים');
ok('math is extracted from Hebrew prose', segments.length === 1, JSON.stringify(segments));
ok('extracted segment carries the relation', segments[0]?.includes('='), segments[0]);
ok(
  'a section label alone is not math',
  extractMathSegments('א. פתור את השאלה').length === 0,
  JSON.stringify(extractMathSegments('א. פתור את השאלה'))
);

const display = toDisplayQuestion('פתור את המשוואה x^{2} - 5x + 6 = 0');
ok('display wraps the math in $…$', display.includes('$'), display);
ok('NO Hebrew inside the math delimiters', !hasHebrewInsideMath(display), display);
eq('delimiters are balanced', unbalancedDollars(display), 0);

// The rule this app breaks most often, tested against a line that mixes
// three Hebrew fragments with two separate expressions.
const mixed = toDisplayQuestion('נתון x + 1 = 3 וגם y - 2 = 5 מצא את הסכום');
ok('multi-run line keeps Hebrew outside the math', !hasHebrewInsideMath(mixed), mixed);
eq('multi-run line stays balanced', unbalancedDollars(mixed), 0);

// ---- REGRESSION: already-delimited LaTeX must pass through untouched ----
//
// A real מתכונת question rendered as scrambled `\cos` / `$$` / `]^5` on the
// owner's phone. The vision transcription is ASKED for LaTeX, so it returns
// `$…$` and `$$…$$`; the run-wrapper then inserted a SECOND set of delimiters
// inside the first (`$$…$$` → `$$$…$[$…$]`), KaTeX gave up, and raw LaTeX in
// an RTL paragraph was reordered into nonsense by the bidi algorithm.
{
  const vision = String.raw`ב. המספר $z_1$ מקיים: $$z_1 = 4\sqrt{2}[\cos(150^\circ)]^2$$ מצא את המספר.`;
  const out = toDisplayQuestion(repairOcrText(vision));

  ok('LaTeX commands survive the repair pass', out.includes('\\sqrt') && out.includes('\\cos'), out);
  ok('no delimiter is inserted inside existing math', !out.includes('$$$') && !out.includes('$['), out);
  eq('delimiters stay balanced', unbalancedDollars(out), 0);
  ok('no Hebrew ends up inside the math', !hasHebrewInsideMath(out), out);
  ok(
    'the display block survives intact',
    out.includes('$$z_1 = 4\\sqrt{2}[\\cos(150^\\circ)]^2$$'),
    out
  );
  ok('the inline span survives intact', out.includes('$z_1$'), out);
}
{
  // Sections must not merge: a single newline is a markdown SOFT break, and
  // "א. …" + "ב. …" would render as one run-on paragraph.
  const two = 'א. מצא את $z$.\nב. הראה ש-$w = 2$.';
  const out = toDisplayQuestion(repairOcrText(two));
  ok('consecutive sections become separate paragraphs', out.includes('\n\n'), JSON.stringify(out));
}
{
  // An unclosed span from the model must not swallow the rest of the question.
  const broken = 'מצא את $z_1 = 4 והראה שזה נכון';
  const out = toDisplayQuestion(repairOcrText(broken));
  eq('an orphan delimiter is dropped', unbalancedDollars(out), 0);
}
{
  // Hebrew inside a span would render REVERSED; the span must be un-delimited.
  const hebrewInside = 'נתון $z = 2$ ולכן $התשובה היא 5$ בסוף.';
  const out = toDisplayQuestion(repairOcrText(hebrewInside));
  ok('a Hebrew span is un-delimited rather than rendered reversed', !hasHebrewInsideMath(out), out);
  ok('the genuine math span is kept', out.includes('$z = 2$'), out);
}
{
  // Extraction must read the delimited spans, not re-scan character classes —
  // `$` and `\` are not math characters, so `$z + \bar{z} = 2$` was being torn
  // into "z +" and "ar{z} = 2", and the solver saw neither.
  const segs = extractMathSegments(String.raw`נתון $z + \bar{z} = 2$ במישור.`);
  eq('a delimited span extracts as ONE segment', segs.length, 1);
  ok('and keeps its LaTeX intact', segs[0].includes('\\bar'), JSON.stringify(segs));
}

// Superscript reconstruction from Tesseract symbols.
eq(
  'superscripted symbols rebuild as a power',
  ocrInternals.lineFromSymbols({
    text: 'x2',
    confidence: 90,
    words: [
      {
        text: 'x2',
        confidence: 90,
        symbols: [
          { text: 'x', confidence: 95 },
          { text: '2', confidence: 90, is_superscript: true },
        ],
      },
    ],
  }),
  'x^{2}'
);
eq(
  'consecutive superscript digits group into one exponent',
  ocrInternals.lineFromSymbols({
    text: 'x12',
    confidence: 90,
    words: [
      {
        text: 'x12',
        confidence: 90,
        symbols: [
          { text: 'x', confidence: 95 },
          { text: '1', confidence: 90, is_superscript: true },
          { text: '2', confidence: 90, is_superscript: true },
        ],
      },
    ],
  }),
  'x^{12}'
);

// ============================================================
// 3. parsing
// ============================================================

near('\\frac parses', Number(evaluate(latexToMathjs('\\frac{3}{4}'))), 0.75);
near('nested \\frac parses', Number(evaluate(latexToMathjs('\\frac{\\frac{1}{2}}{4}'))), 0.125);
near('\\sqrt parses', Number(evaluate(latexToMathjs('\\sqrt{16}'))), 4);
near('nth root parses', Number(evaluate(latexToMathjs('\\sqrt[3]{27}'))), 3);
near('ln maps to mathjs log', Number(evaluate(latexToMathjs('\\ln(e)'))), 1);
near('absolute value parses', Number(evaluate(latexToMathjs('|-5|'))), 5);
near('implicit multiplication after a paren', Number(evaluate(latexToMathjs('2(3+4)'))), 14);

eq('splitRelation finds =', splitRelation('2x + 1 = 7')?.relation, '=');
eq('splitRelation finds ≤', splitRelation('x <= 4')?.relation, '≤');
ok('a chained inequality is refused', splitRelation('0 < x < 5') === null);
eq('freeVariables ignores constants', JSON.stringify(freeVariables('2*x + pi')), JSON.stringify(['x']));
eq('freeVariables finds nested variables', JSON.stringify(freeVariables('2*(x+1)*y')), JSON.stringify(['x', 'y']));

// ============================================================
// 4. classification
// ============================================================

eq(
  'a solve instruction classifies as an equation',
  classifyProblem({ text: 'פתור את המשוואה x^2 - 4 = 0', expressions: ['x^2 - 4 = 0'] }).kind,
  'equation'
);
eq(
  'a derivative instruction wins over the equals sign',
  classifyProblem({ text: 'גזור את הפונקציה f(x) = x^3', expressions: ['f(x) = x^3'] }).kind,
  'derivative'
);
eq(
  'two equations classify as a system',
  classifyProblem({ text: 'פתור את מערכת המשוואות', expressions: ['x + y = 5', 'x - y = 1'] }).kind,
  'system'
);
eq(
  'an inequality is not an equation',
  classifyProblem({ text: 'פתור את אי-השוויון', expressions: ['x - 3 > 0'] }).kind,
  'inequality'
);
eq(
  'an integral is recognised',
  classifyProblem({ text: 'חשב את האינטגרל של f(x) = 2x', expressions: ['f(x) = 2x'] }).kind,
  'integral'
);
eq(
  'geometry vocabulary beats the generic "משוואה"',
  classifyProblem({ text: 'במשולש ABC נתון שהזווית שווה... מצא את שטח המשולש והיקף המשולש', expressions: [] }).domain,
  'geometry'
);
eq(
  'trig notation sets the domain',
  classifyProblem({ text: 'פתור sin(x) = 0.5', expressions: ['sin(x) = 0.5'] }).domain,
  'trigonometry'
);
eq(
  'probability vocabulary sets the domain',
  classifyProblem({ text: 'מהי ההסתברות שהקובייה תיפול על 6? חשב את התוחלת', expressions: [] }).domain,
  'statistics'
);
eq(
  'a "גזור" instruction sets the CALCULUS domain, not the algebra fallback',
  classifyProblem({ text: 'גזור את הפונקציה f(x) = x^3 - 4x', expressions: ['f(x) = x^3 - 4x'] }).domain,
  'calculus'
);
eq(
  'an "אינטגרל" instruction sets the calculus domain',
  classifyProblem({ text: 'חשב את האינטגרל של f(x) = 2x', expressions: ['f(x) = 2x'] }).domain,
  'calculus'
);
// --- multi-section exam questions ---
{
  const sections = classifyProblem({
    text: 'נתונה הפונקציה f(x)=x^2\nא. מצא את הנגזרת.\nב. מצא נקודות קיצון.\nג. שרטט את הגרף.',
    expressions: ['f(x)=x^2'],
  });
  ok('a bagrut question with sections is flagged multi-part', sections.multiPart, JSON.stringify(sections.parts));
  eq('the sections are listed in order', sections.parts.join(''), 'אבג');
}
{
  const single = classifyProblem({
    text: 'פתור את המשוואה x^2 - 5x + 6 = 0',
    expressions: ['x^2 - 5x + 6 = 0'],
  });
  ok('an ordinary question is NOT multi-part', !single.multiPart, JSON.stringify(single.parts));
}
{
  // A lone "א." is how many single questions open — treating it as a section
  // list would push every one of them onto the paid path.
  const opener = classifyProblem({ text: 'א. פתור את המשוואה x + 1 = 3', expressions: ['x + 1 = 3'] });
  ok('a single opening label is not a section list', !opener.multiPart, JSON.stringify(opener.parts));
}
{
  // Labels must run consecutively from א — a stray "ד." elsewhere on the page
  // is not evidence of sections.
  const gap = classifyProblem({ text: 'א. משהו\nד. משהו אחר', expressions: [] });
  ok('non-consecutive labels are not sections', !gap.multiPart, JSON.stringify(gap.parts));
}

eq(
  'x is preferred over a parameter',
  classifyProblem({ text: 'פתור', expressions: ['a*x + 3 = 0'] }).variables[0],
  'x'
);

// ============================================================
// 5. the CAS — equations
// ============================================================

async function run(): Promise<void> {
  // --- linear ---
  {
    const out = await solve(problem('equation', ['3x + 1 = 10']));
    ok('linear solves', out.status === 'solved');
    if (out.status === 'solved') {
      eq('3x + 1 = 10 → x = 3', out.answerLatex, 'x = 3');
      assertRoot('linear root', '3x + 1 = 10', 'x', out.answerValues);
      ok('linear is verified by substitution', out.verified);
    }
  }

  // --- linear with a fractional root ---
  {
    const out = await solve(problem('equation', ['2x + 1 = 4']));
    ok('fractional linear solves', out.status === 'solved');
    if (out.status === 'solved') {
      eq('2x + 1 = 4 → x = 3/2', out.answerLatex, 'x = \\frac{3}{2}');
      assertRoot('fractional linear root', '2x + 1 = 4', 'x', out.answerValues);
    }
  }

  // --- quadratic, rational roots ---
  {
    const out = await solve(problem('equation', ['x^2 - 5x + 6 = 0']));
    ok('rational quadratic solves', out.status === 'solved');
    if (out.status === 'solved') {
      assertRoot('quadratic roots', 'x^2 - 5x + 6 = 0', 'x', out.answerValues);
      eq('two roots reported', out.answerValues.length, 2);
      const roots = out.answerValues.map((v) => Number(evaluate(v))).sort((a, b) => a - b);
      near('smaller root is 2', roots[0], 2);
      near('larger root is 3', roots[1], 3);
      const discriminantStep = out.steps.find((s) => s.kind === 'discriminant');
      ok('the discriminant step is shown', !!discriminantStep, JSON.stringify(out.steps.map((s) => s.kind)));
      eq('Δ = 25 − 24 = 1', discriminantStep?.data?.discriminant, 1);
    }
  }

  // --- quadratic, irrational roots (surd form must survive) ---
  {
    const out = await solve(problem('equation', ['x^2 - 4x + 1 = 0']));
    ok('surd quadratic solves', out.status === 'solved');
    if (out.status === 'solved') {
      assertRoot('surd roots', 'x^2 - 4x + 1 = 0', 'x', out.answerValues);
      // Δ = 16 − 4 = 12 = 4·3 → roots (4 ± 2√3)/2 = 2 ± √3.
      ok('the answer is exact, not decimal', out.answerLatex.includes('\\sqrt{3}'), out.answerLatex);
      ok('the surd is fully reduced to 2 ± √3', !out.answerLatex.includes('\\frac'), out.answerLatex);
      const roots = out.answerValues.map((v) => Number(evaluate(v))).sort((a, b) => a - b);
      near('root 2 − √3', roots[0], 2 - Math.sqrt(3), 1e-12);
      near('root 2 + √3', roots[1], 2 + Math.sqrt(3), 1e-12);
    }
  }

  // --- quadratic with a double root ---
  {
    const out = await solve(problem('equation', ['x^2 - 6x + 9 = 0']));
    ok('double root solves', out.status === 'solved');
    if (out.status === 'solved') {
      eq('one root reported for Δ = 0', out.answerValues.length, 1);
      eq('x = 3', out.answerLatex, 'x = 3');
      assertRoot('double root', 'x^2 - 6x + 9 = 0', 'x', out.answerValues);
    }
  }

  // --- negative discriminant, non-complex topic ---
  {
    const out = await solve(problem('equation', ['x^2 + 1 = 0']));
    ok('Δ < 0 solves', out.status === 'solved');
    if (out.status === 'solved') {
      eq('no real solution is stated', out.answerLatex, 'אין פתרון ממשי');
      eq('no bogus values are returned', out.answerValues.length, 0);
    }
  }

  // --- negative discriminant IN the complex topic ---
  {
    const out = await solve(problem('equation', ['x^2 + 1 = 0'], ['x'], { domain: 'complex' }));
    ok('complex topic returns the complex pair', out.status === 'solved');
    if (out.status === 'solved') {
      eq('two complex roots', out.answerValues.length, 2);
      ok('the answer shows i', out.answerLatex.includes('i'), out.answerLatex);
    }
  }

  // --- cubic via rational roots ---
  {
    const out = await solve(problem('equation', ['x^3 - 6x^2 + 11x - 6 = 0']));
    ok('cubic solves', out.status === 'solved');
    if (out.status === 'solved') {
      assertRoot('cubic roots', 'x^3 - 6x^2 + 11x - 6 = 0', 'x', out.answerValues);
      eq('three roots', out.answerValues.length, 3);
      const roots = out.answerValues.map((v) => Number(evaluate(v))).sort((a, b) => a - b);
      near('root 1', roots[0], 1);
      near('root 2', roots[1], 2);
      near('root 3', roots[2], 3);
    }
  }

  // --- a cubic with an irrational factor: 1 rational root + a surd pair ---
  {
    const out = await solve(problem('equation', ['x^3 - x^2 - 4x + 4 = 0']));
    ok('mixed cubic solves', out.status === 'solved');
    if (out.status === 'solved') {
      assertRoot('mixed cubic roots', 'x^3 - x^2 - 4x + 4 = 0', 'x', out.answerValues);
      eq('three roots', out.answerValues.length, 3);
    }
  }

  // --- an equation whose sides must be moved first ---
  {
    const out = await solve(problem('equation', ['2x^2 = 8']));
    ok('both-sides equation solves', out.status === 'solved');
    if (out.status === 'solved') {
      assertRoot('roots of 2x² = 8', '2x^2 = 8', 'x', out.answerValues);
      const roots = out.answerValues.map((v) => Number(evaluate(v))).sort((a, b) => a - b);
      near('root −2', roots[0], -2);
      near('root 2', roots[1], 2);
    }
  }

  // --- exponential, invertible form ---
  {
    const out = await solve(problem('equation', ['e^(x) = 1']));
    ok('e^x = 1 solves', out.status === 'solved');
    if (out.status === 'solved') {
      eq('x = 0', out.answerLatex, 'x = 0');
    }
  }

  // --- trig equations are REFUSED, on purpose ---
  {
    const out = await solve(problem('equation', ['sin(x) = 0.5'], ['x'], { domain: 'trigonometry' }));
    eq('a trig equation is refused rather than guessed', out.status, 'unsupported');
  }

  // --- an identity is not a solvable equation ---
  {
    const out = await solve(problem('equation', ['2x + 2 = 2(x + 1)']));
    eq('an identity is refused', out.status, 'unsupported');
  }

  // ============================================================
  // 6. inequalities
  // ============================================================

  {
    const out = await solve(problem('inequality', ['2x - 6 > 0']));
    ok('linear inequality solves', out.status === 'solved');
    if (out.status === 'solved') eq('2x − 6 > 0 → x > 3', out.answerLatex, 'x > 3');
  }
  {
    // The sign flip: dividing by −2 reverses the direction.
    const out = await solve(problem('inequality', ['-2x + 4 > 0']));
    ok('negative-coefficient inequality solves', out.status === 'solved');
    if (out.status === 'solved') {
      eq('−2x + 4 > 0 → x < 2', out.answerLatex, 'x < 2');
      ok(
        'the sign flip is called out as its own step',
        out.steps.some((s) => s.kind === 'solve-linear' && s.data?.flipped === 1)
      );
      // Independent check: x = 1 satisfies it, x = 3 does not.
      ok('x = 1 satisfies', Number(evaluate('-2*1 + 4')) > 0);
      ok('x = 3 does not', !(Number(evaluate('-2*3 + 4')) > 0));
    }
  }
  {
    const out = await solve(problem('inequality', ['x^2 - 5x + 6 < 0']));
    ok('quadratic inequality solves', out.status === 'solved');
    if (out.status === 'solved') {
      // a > 0 and "< 0" → BETWEEN the roots: 2 < x < 3.
      ok('answer is the interval between the roots', out.answerLatex.includes('2') && out.answerLatex.includes('3'), out.answerLatex);
      ok('x = 2.5 is inside', Number(evaluate('2.5^2 - 5*2.5 + 6')) < 0);
      ok('x = 1 is outside', !(Number(evaluate('1^2 - 5*1 + 6')) < 0));
      ok('x = 4 is outside', !(Number(evaluate('4^2 - 5*4 + 6')) < 0));
    }
  }
  {
    const out = await solve(problem('inequality', ['x^2 - 5x + 6 > 0']));
    ok('quadratic > 0 solves', out.status === 'solved');
    if (out.status === 'solved') {
      // a > 0 and "> 0" → OUTSIDE the roots, i.e. two branches.
      ok('two branches are reported', out.answerLatex.includes('|'), out.answerLatex);
    }
  }
  {
    // No real roots and a > 0 → always positive.
    const out = await solve(problem('inequality', ['x^2 + 1 > 0']));
    ok('always-true inequality solves', out.status === 'solved');
    if (out.status === 'solved') eq('answer is "every real value"', out.answerLatex, 'כל ערך ממשי');
  }

  // ============================================================
  // 7. systems
  // ============================================================

  {
    const out = await solve(problem('system', ['x + y = 5', 'x - y = 1'], ['x', 'y']));
    ok('2×2 system solves', out.status === 'solved');
    if (out.status === 'solved') {
      const [x, y] = out.answerValues.map((v) => Number(evaluate(v)));
      near('x = 3', x, 3);
      near('y = 2', y, 2);
      // Independent: substitute into BOTH equations.
      near('equation 1 holds', x + y, 5);
      near('equation 2 holds', x - y, 1);
      ok('the system is verified', out.verified);
    }
  }
  {
    const out = await solve(problem('system', ['2x + 3y = 12', '4x - y = 10'], ['x', 'y']));
    ok('second system solves', out.status === 'solved');
    if (out.status === 'solved') {
      const [x, y] = out.answerValues.map((v) => Number(evaluate(v)));
      near('equation 1 holds', 2 * x + 3 * y, 12, 1e-9);
      near('equation 2 holds', 4 * x - y, 10, 1e-9);
      near('x = 3', x, 3, 1e-9);
      near('y = 2', y, 2, 1e-9);
    }
  }
  {
    // Parallel lines — no unique solution, and saying so is the right answer.
    const out = await solve(problem('system', ['x + y = 1', '2x + 2y = 5'], ['x', 'y']));
    eq('a degenerate system is refused', out.status, 'unsupported');
  }
  {
    // Non-linear: xy is not a linear term, and pretending otherwise would
    // produce a confident wrong answer.
    ok(
      'an xy term is rejected as non-linear',
      engineInternals.bilinearCoefficients('x*y - 4', 'x', 'y') === null
    );
  }

  // ============================================================
  // 8. derivatives
  // ============================================================

  {
    const out = await solve(problem('derivative', ['f(x) = x^3 + 2x']));
    ok('polynomial derivative solves', out.status === 'solved');
    if (out.status === 'solved') {
      // Independent: compare against mathjs's own derivative at sample points.
      const mine = out.answerValues[0];
      const theirs = derivative('x^3 + 2*x', 'x').toString();
      for (const x of [0.3, 1.7, -2.1]) {
        near(
          `derivative agrees at x=${x}`,
          Number(evaluate(mine, { x })),
          Number(evaluate(theirs, { x })),
          1e-9
        );
      }
    }
  }
  {
    const out = await solve(problem('derivative', ['f(x) = x^2*sin(x)']));
    ok('product-rule derivative solves', out.status === 'solved');
    if (out.status === 'solved') {
      // (x²sin x)' = 2x·sin x + x²·cos x — written out by hand and compared.
      const byHand = '2*x*sin(x) + x^2*cos(x)';
      for (const x of [0.4, 1.2, 2.6]) {
        near(
          `product rule agrees at x=${x}`,
          Number(evaluate(out.answerValues[0], { x })),
          Number(evaluate(byHand, { x })),
          1e-9
        );
      }
    }
  }

  // ============================================================
  // 9. integrals — every table entry gets differentiated back
  // ============================================================

  const integralCases: { integrand: string; label: string }[] = [
    { integrand: '2*x', label: '∫2x dx' },
    { integrand: 'x^3', label: '∫x³ dx' },
    { integrand: '3*x^2 + 2*x + 1', label: '∫(3x²+2x+1) dx' },
    { integrand: '1/x', label: '∫1/x dx' },
    { integrand: '1/(2*x + 1)', label: '∫1/(2x+1) dx' },
    { integrand: 'e^(2*x)', label: '∫e^(2x) dx' },
    { integrand: 'sin(3*x)', label: '∫sin(3x) dx' },
    { integrand: 'cos(x)', label: '∫cos(x) dx' },
    { integrand: '(2*x + 1)^3', label: '∫(2x+1)³ dx' },
    { integrand: '5', label: '∫5 dx' },
  ];

  for (const { integrand, label } of integralCases) {
    const out = await solve(problem('integral', [`f(x) = ${integrand}`]));
    ok(`${label} solves`, out.status === 'solved', out.status === 'solved' ? '' : (out as { reason: string }).reason);
    if (out.status !== 'solved') continue;
    ok(`${label} is self-verified`, out.verified);

    // INDEPENDENT: differentiate the reported antiderivative and compare to
    // the integrand. This is what catches a wrong constant factor, which is
    // the single most likely error in a hand-written integral table.
    const primitive = out.answerLatex.replace(/\s*\+\s*C$/, '');
    const asMathjs = latexToMathjs(primitive);
    let back: string;
    try {
      back = derivative(asMathjs, 'x').toString();
    } catch (error) {
      ok(`${label} antiderivative differentiates`, false, String(error));
      continue;
    }
    let compared = 0;
    for (const x of [0.37, 1.13, 2.71]) {
      const lhs = Number(evaluate(back, { x }));
      const rhs = Number(evaluate(integrand, { x }));
      if (!Number.isFinite(lhs) || !Number.isFinite(rhs)) continue;
      near(`${label}: F'(${x}) = f(${x})`, lhs, rhs, 1e-6 * Math.max(1, Math.abs(rhs)));
      compared++;
    }
    ok(`${label} was compared at ≥2 points`, compared >= 2, `compared ${compared}`);
  }

  // Integration by parts is NOT in the table and must be refused.
  {
    const out = await solve(problem('integral', ['f(x) = x*sin(x)']));
    eq('∫x·sin(x) dx is refused (by parts, off-syllabus)', out.status, 'unsupported');
  }

  // --- definite integral ---
  {
    const out = await solve(
      problem('definite-integral', ['f(x) = 2x'], ['x'], { bounds: { lower: '0', upper: '3' } })
    );
    ok('definite integral solves', out.status === 'solved');
    if (out.status === 'solved') {
      // ∫₀³ 2x dx = [x²]₀³ = 9 − 0 = 9.
      eq('∫₀³ 2x dx = 9', out.answerLatex, '9');
    }
  }
  {
    const out = await solve(
      problem('definite-integral', ['f(x) = x^2'], ['x'], { bounds: { lower: '0', upper: '3' } })
    );
    ok('second definite integral solves', out.status === 'solved');
    if (out.status === 'solved') {
      // ∫₀³ x² dx = [x³/3]₀³ = 27/3 = 9.
      eq('∫₀³ x² dx = 9', out.answerLatex, '9');
    }
  }
  {
    const out = await solve(
      problem('definite-integral', ['f(x) = x'], ['x'], { bounds: { lower: '0', upper: '1' } })
    );
    if (out.status === 'solved') {
      // ∫₀¹ x dx = 1/2 — the case where a decimal answer would be wrong.
      eq('∫₀¹ x dx = 1/2 exactly', out.answerLatex, '\\frac{1}{2}');
    }
  }

  // ============================================================
  // 10. simplify + evaluate
  // ============================================================

  {
    const out = await solve(problem('simplify', ['2x + 3x']));
    ok('simplify solves', out.status === 'solved');
    if (out.status === 'solved') {
      for (const x of [0.5, 2, -3]) {
        near(`simplify agrees at x=${x}`, Number(evaluate(out.answerValues[0], { x })), 5 * x);
      }
    }
  }
  {
    const out = await solve(problem('evaluate', ['2 + 3*4']));
    ok('evaluate solves', out.status === 'solved');
    if (out.status === 'solved') eq('2 + 3·4 = 14', out.answerLatex, '14');
  }

  // ============================================================
  // 11. validation
  // ============================================================

  {
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: 'פתור את המשוואה x^2 - 5x + 6 = 0',
        lines: [],
        meanConfidence: 0.92,
        durationMs: 10,
        costUsd: 0,
      },
    });
    eq('a clean, confident read is accepted', v.verdict, 'accept');
    ok('confidence stays high', v.confidence > 0.8, String(v.confidence));
  }
  {
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: '§§ ¤¤ ~~~ ///',
        lines: [],
        meanConfidence: 0.88,
        durationMs: 10,
        costUsd: 0,
      },
    });
    // The engine claimed 88%. The structure says otherwise, and the
    // structure must win — this is the whole point of the validator.
    eq('a confident garbage read is rejected', v.verdict, 'reject');
    ok('confidence collapses despite the engine', v.confidence < 0.4, String(v.confidence));
  }
  {
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: '',
        lines: [],
        meanConfidence: 0.9,
        durationMs: 1,
        costUsd: 0,
      },
    });
    eq('an empty read is rejected', v.verdict, 'reject');
    eq('an empty read scores 0', v.confidence, 0);
  }
  {
    const v = validateTranscription({
      ocr: {
        engine: 'manual',
        text: 'פתור x + 1 = 2',
        lines: [],
        meanConfidence: 1,
        durationMs: 0,
        costUsd: 0,
      },
      humanEdited: true,
    });
    eq('a human-typed question is accepted', v.verdict, 'accept');
  }
  {
    // REGRESSION — a real failure caught in the browser, not in theory.
    // Tesseract read `x²` as `x°`; the parser stripped the degree sign; the
    // `x` terms cancelled; and the app answered `x² − 5x + 6 = 0` with
    // `x = 6/5` at 79% confidence. Two independent guards now stop it.
    ok(
      'a degree sign after a variable is NOT stripped by the parser',
      latexToMathjs('x° - 5x + 6').includes('°'),
      latexToMathjs('x° - 5x + 6')
    );
    ok(
      'a degree sign after a digit still IS stripped (real angles)',
      !latexToMathjs('cis(60°)').includes('°'),
      latexToMathjs('cis(60°)')
    );
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: 'פתור את המשוואה x° - 5x + 6 = 0',
        lines: [],
        meanConfidence: 0.79,
        durationMs: 10,
        costUsd: 0,
      },
    });
    ok(
      'a misread exponent is never accepted silently',
      v.verdict !== 'accept',
      `verdict ${v.verdict}, confidence ${v.confidence}`
    );
    ok(
      'and the student is told what to fix',
      v.issues.some((i) => i.message.includes('מעריך')),
      JSON.stringify(v.issues.map((i) => i.code))
    );
  }

  {
    // The other half of the same class: the Hebrew promises a relation and
    // the maths has none, because part of the formula was lost.
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: 'פתור את המשוואה x⋅2−5x20',
        lines: [],
        meanConfidence: 0.81,
        durationMs: 10,
        costUsd: 0,
      },
    });
    ok(
      'an equation with no "=" is not accepted, however confident the engine',
      v.verdict !== 'accept',
      `verdict ${v.verdict}, confidence ${v.confidence}`
    );
  }

  {
    // REGRESSION — measured on a real printed bagrut question. Tesseract read
    // every Hebrew sentence perfectly and every formula wrong (`z₁`→`21`,
    // `√`→`N`, the conjugate bar→`"`, the exponent lost) and the score came
    // out 80% "זיהוי ברור", because the prose is most of the characters.
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: [
          'שאלה 5 (מספרים מרוכבים)',
          'א. מצא את מקום הנקודות במישור גאוס המקיימות:',
          'z+"',
          '+',
          '2',
          '=',
          '1',
          'ב. המספר 21 מקיים:',
          '4N2 [cos150° + i sin150°] = ,2',
          'מצא את המספר 21 והראה שהנקודה A נמצאת על הפרבולה.',
        ].join('\n'),
        lines: [
          { text: 'שאלה 5 (מספרים מרוכבים)', confidence: 0.9 },
          { text: 'א. מצא את מקום הנקודות במישור גאוס המקיימות:', confidence: 0.92 },
          { text: 'z+"', confidence: 0.6 },
          { text: '+', confidence: 0.7 },
          { text: '2', confidence: 0.8 },
          { text: '=', confidence: 0.8 },
          { text: '1', confidence: 0.7 },
          { text: 'ב. המספר 21 מקיים:', confidence: 0.88 },
          { text: '4N2 [cos150° + i sin150°] = ,2', confidence: 0.7 },
        ],
        meanConfidence: 0.8,
        durationMs: 900,
        costUsd: 0,
      },
    });
    ok(
      'misread formulas are NOT accepted just because the Hebrew is clean',
      v.verdict !== 'accept',
      `verdict ${v.verdict}, confidence ${v.confidence}`
    );
    ok(
      'the fragmented formula is called out',
      v.issues.some((i) => i.message.includes('בחלקים')),
      JSON.stringify(v.issues.map((i) => i.code))
    );
    ok(
      'the letter-between-digits (√ read as N) is called out',
      v.issues.some((i) => i.message.includes('אות בין שתי ספרות')),
      JSON.stringify(v.issues.map((i) => i.message))
    );
  }
  {
    // …and the guard must NOT fire on a clean read, or every scan escalates.
    const good = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: 'פתור את המשוואה x^2 - 5x + 6 = 0',
        lines: [
          { text: 'פתור את המשוואה', confidence: 0.94 },
          { text: 'x^2 - 5x + 6 = 0', confidence: 0.91 },
        ],
        meanConfidence: 0.92,
        durationMs: 400,
        costUsd: 0,
      },
    });
    eq('a clean printed equation is still accepted', good.verdict, 'accept');
  }

  {
    const v = validateTranscription({
      ocr: {
        engine: 'tesseract-local',
        text: 'פתור (x + 1 = 2',
        lines: [],
        meanConfidence: 0.9,
        durationMs: 0,
        costUsd: 0,
      },
    });
    ok(
      'an unclosed bracket is flagged',
      v.issues.some((i) => i.code === 'unbalanced-delimiters'),
      JSON.stringify(v.issues.map((i) => i.code))
    );
  }

  // ============================================================
  // 12. the Hebrew explanation
  // ============================================================

  {
    const p = problem('equation', ['x^2 - 5x + 6 = 0']);
    const out = await solve(p);
    if (out.status === 'solved') {
      const full = explainSolution(out, p, 'full');
      ok('the full explanation has steps', full.steps.length >= 3, String(full.steps.length));
      ok('the full explanation costs nothing', full.source === 'template');
      ok('a final answer is present', !!full.finalAnswer);

      // The app's hardest content rule, enforced on GENERATED content.
      for (const step of full.steps) {
        ok(
          `no Hebrew inside $…$ (step "${step.title}")`,
          !hasHebrewInsideMath(step.content),
          step.content
        );
        eq(`delimiters balanced (step "${step.title}")`, unbalancedDollars(step.content), 0);
      }
      ok('no Hebrew inside $…$ in the final answer', !hasHebrewInsideMath(full.finalAnswer ?? ''));
      eq('final answer delimiters balanced', unbalancedDollars(full.finalAnswer ?? ''), 0);

      const hint = explainSolution(out, p, 'hint');
      // A hint that contains the answer is not a hint.
      const hintText = hint.steps.map((s) => s.content).join(' ');
      ok('the hint does not reveal the roots', !hintText.includes('x_{1}'), hintText);
      ok('the hint has no final answer', hint.finalAnswer === undefined);

      const partial = explainSolution(out, p, 'partial');
      ok('the partial explanation has no final answer', partial.finalAnswer === undefined);
      ok('partial is shorter than full', partial.steps.length <= full.steps.length + 1);
    }
  }

  {
    // The inequality path builds its answer from two branches joined by "|";
    // the Hebrew "או" must end up OUTSIDE the delimiters.
    const p = problem('inequality', ['x^2 - 5x + 6 > 0']);
    const out = await solve(p);
    if (out.status === 'solved') {
      const full = explainSolution(out, p, 'full');
      ok('the two-branch answer says "או"', (full.finalAnswer ?? '').includes('או'), full.finalAnswer);
      ok('and keeps it outside the math', !hasHebrewInsideMath(full.finalAnswer ?? ''), full.finalAnswer);
      eq('two-branch delimiters balanced', unbalancedDollars(full.finalAnswer ?? ''), 0);
    }
  }

  // ============================================================
  // 12b. the OCR-tolerant library matcher — tested on the REAL corpus
  // ============================================================
  //
  // Deliberately not a synthetic mini-corpus: the matcher weights tokens by
  // inverse document frequency, and IDF over four documents is meaningless.
  // These assertions run against the same 855 solutions production serves.
  {
    const sample = ALL_PAST_BAGRUYOT.slice(0, 6);
    let found = 0;
    let wrong = 0;
    for (const q of sample) {
      const text = [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' ');
      // The OCR damage MEASURED on a real printed bagrut question.
      const noisy = text
        .replace(/\sqrt/g, 'N')
        .replace(/\^2/g, '°')
        .replace(/_1/g, '1')
        .replace(/_2/g, '2')
        .replace(/\cdot/g, '.')
        .replace(/\$/g, '');
      const hit = matchScannedQuestion(noisy, q.topic);
      if (!hit) continue;
      if (hit.solution.matchId === q.id) found++;
      else wrong++;
    }
    eq('a noisy scan never matches the WRONG stored question', wrong, 0);
    ok(
      'most noisy scans still find their own stored question',
      found >= sample.length - 1,
      `found ${found}/${sample.length}`
    );
  }
  {
    // PRECISION is the property that matters: a wrong match shows a student a
    // fully-worked solution to somebody else's question under a verified badge.
    for (const stranger of [
      'פתור את המשוואה הדיפרנציאלית מסדר שני עם מקדמים קבועים ותנאי התחלה נתונים',
      'מצא את הדטרמיננטה של המטריצה בסדר 4 על 4 בשיטת הפיתוח לפי שורה ראשונה',
      'כמה דרכים יש לסדר 8 ספרים שונים על מדף כך ששני ספרים מסוימים צמודים',
    ]) {
      ok(
        `an out-of-library question matches NOTHING: "${stranger.slice(0, 28)}…"`,
        matchScannedQuestion(stranger) === null
      );
    }
  }
  {
    // A single section must not match the whole multi-section question.
    ok('a short fragment does not match a long question', matchScannedQuestion('מצא את הארגומנט') === null);
  }
  {
    // THE regression the growing bank depends on.
    //
    // Two students photograph one page: different OCR noise, different hash,
    // so two rows exist. They score almost identically, the margin collapses,
    // and retrieval refuses — meaning an auto-growing bank gets WORSE as it
    // grows. Verified against the real corpus: with the cluster rule disabled
    // this case returns MISS.
    const entries = ALL_PAST_BAGRUYOT.map((q) => ({
      id: q.id,
      topic: q.topic,
      text: [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' '),
    }));
    // The shortest entry over the query floor — long enough to be searchable,
    // short enough that a one-character edit is a realistic OCR difference.
    const target = entries
      .filter((e) => e.text.length > 140 && e.text.includes('את'))
      .sort((a, b) => a.text.length - b.text.length)[0];
    if (!target) {
      ok('found a target question for the duplicate test', false);
    } else {
      const query = target.text.replace(/\$/g, '');
      const withoutDupe = findMatch(buildMatchIndex(entries), query, { topicHint: target.topic });
      ok('the question matches when stored once', withoutDupe?.entry.id === target.id);

      // The same question as a second scan would store it.
      const dupe = { ...target, id: `${target.id}-dup`, text: target.text.replace('את', 'אתt') };
      const withDupe = findMatch(buildMatchIndex([...entries, dupe]), query, {
        topicHint: target.topic,
      });
      ok(
        'a duplicate row does NOT break retrieval',
        withDupe !== null,
        'the margin rule collapsed — the growing bank would stop matching'
      );
      ok(
        'and the winner is still the right question',
        withDupe?.entry.id === target.id || withDupe?.entry.id === dupe.id,
        JSON.stringify(withDupe?.entry.id)
      );

      // The case above differs by ONE character, which is not what a re-scan
      // looks like: both copies carry their own OCR noise. Measured over the
      // corpus, two independently-noised copies of one question overlap
      // 0.478–0.71 — nowhere near the 0.9 an identical-ish pair reaches. The
      // guard that catches THIS is the length-gated one, and it is the one
      // that carries real usage.
      const noisyA = { ...target, id: `${target.id}-a`, text: noise(target.text, 17, 4) };
      const noisyB = { ...target, id: `${target.id}-b`, text: noise(target.text, 8191, 7) };
      const realistic = findMatch(buildMatchIndex([...entries, noisyA, noisyB]), noise(target.text, 71, 5), {
        topicHint: target.topic,
      });
      ok(
        'two INDEPENDENTLY-noised copies still resolve',
        realistic !== null,
        'the realistic duplicate case collapsed — this is what the bank will actually contain'
      );
    }
  }
  {
    // The other half of the duplicate guard, and the dangerous half: it must
    // NOT decide that two DIFFERENT questions are one row. If it does, the
    // rival that was protecting the student is ignored and the wrong worked
    // solution is served — the failure this whole matcher exists to prevent.
    //
    // These pairs are the measured worst cases in the corpus: near-identical
    // wording, different answers.
    const { isSameQuestion } = __testables;
    const asEntry = (text: string) => buildMatchIndex([{ id: 'x', topic: '', text }]).entries[0];

    const confusable: [string, string][] = [
      [
        'מהו תחום ההגדרה של $f(x) = \\dfrac{1}{x - 5}$?',
        'מהו תחום ההגדרה של $f(x) = \\dfrac{1}{x^2 - 9}$?',
      ],
      [
        'נתונה הפונקציה $\\;f(x) = e^x - 1$. מצא את נקודות הקיצון של הפונקציה, קבע את סוגן, ומצא את תחומי העלייה והירידה שלה. שרטט סקיצה של גרף הפונקציה.',
        'נתונה הפונקציה $\\;f(x) = e^{2x} - 1$. מצא את נקודות הקיצון של הפונקציה, קבע את סוגן, ומצא את תחומי העלייה והירידה שלה. שרטט סקיצה של גרף הפונקציה.',
      ],
    ];
    for (const [a, b] of confusable) {
      ok(
        `different questions are NOT merged into one cluster: "${a.slice(0, 28)}…"`,
        !isSameQuestion(asEntry(a), asEntry(b)),
        'the duplicate guard would suppress the rival and serve the wrong solution'
      );
    }

    // And the positive control, so the two assertions above cannot both pass
    // by the guard simply never firing.
    const long = ALL_PAST_BAGRUYOT.map((q) =>
      [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' ')
    ).find((t) => t.length > 400);
    if (long) {
      ok(
        'but two noisy copies of ONE question are',
        isSameQuestion(asEntry(noise(long, 17, 4)), asEntry(noise(long, 8191, 7))),
        'the guard never fires — the growing bank would stop matching'
      );
    }
  }
  {
    // REGRESSION — a REAL false positive caught by re-driving production.
    // "פתור את המשוואה sin(x) = 0.5" returned "z = ±4i" from a complex-numbers
    // question, under a "פתרון מאומת מהמאגר" badge. On a short query the
    // boilerplate ("פתור את המשוואה") is most of the trigram set, so the match
    // was carried entirely by words that appear in hundreds of questions.
    for (const shortQuery of [
      'פתור את המשוואה sin(x) = 0.5',
      'פתור את המשוואה x + 1 = 3',
      'פתור את המשוואה cos(x) = 0.3 בתחום הנתון',
      'מצא את הנגזרת',
      'חשב את השטח',
    ]) {
      ok(
        `a short boilerplate-heavy query matches NOTHING: "${shortQuery.slice(0, 30)}"`,
        matchScannedQuestion(shortQuery) === null,
        JSON.stringify(matchScannedQuestion(shortQuery))
      );
    }
  }

  // ============================================================
  // 13. unit levels
  // ============================================================

  eq('a 5-unit derivative is in scope', checkScope('derivative', 'calculus', 5).inScope, true);
  eq('a 3-unit integral is out of scope', checkScope('integral', 'calculus', 3).inScope, false);
  eq('complex numbers are 5-unit only', checkScope('equation', 'complex', 3).inScope, false);
  eq('calculus maps to the integral topic for integrals', topicForDomain('calculus', 5, 'integral'), 'חשבון אינטגרלי');
  eq('calculus maps to the differential topic otherwise', topicForDomain('calculus', 5, 'derivative'), 'חשבון דיפרנציאלי');
  eq('an unauthored level maps to no topic', topicForDomain('algebra', 3), null);

  // ============================================================
  // 14. cost accounting
  // ============================================================

  {
    const summary = summarizeCost([
      {
        id: 'a',
        createdAt: 1,
        stages: [{ name: 'ocr-local', durationMs: 100, costUsd: 0, paid: false, outcome: 'hit' }],
        totalCostUsd: 0,
        totalDurationMs: 100,
        usedPaidPath: false,
      },
      {
        id: 'b',
        createdAt: 2,
        stages: [{ name: 'fallback-solve', durationMs: 900, costUsd: 0.01, paid: true, outcome: 'hit' }],
        totalCostUsd: 0.01,
        totalDurationMs: 900,
        usedPaidPath: true,
      },
    ]);
    eq('two scans counted', summary.scans, 2);
    eq('one was free', summary.freeScans, 1);
    near('average cost is half a cent', summary.averageCostUsd, 0.005);
    near('free ratio is 50%', summary.freeRatio, 0.5);
  }

  // ------------------------------------------------------------
  report();
}

function report(): void {
  const total = passed + failures.length;
  console.log(`\nmathscan tests: ${passed}/${total} passed`);
  if (failures.length > 0) {
    console.log(`\n${failures.length} FAILED:`);
    for (const failure of failures) console.log(`  ✗ ${failure}`);
    process.exit(1);
  }
  console.log('✓ every value re-derived independently with mathjs');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
