/**
 * test-math-engine.ts — the façade's contract, and the ORDER behind it.
 *
 *   npx tsx scripts/test-math-engine.ts
 *
 * FREE. The local engine runs in-process; SymPy is only reached if an endpoint
 * is configured, and these cases are chosen so the assertions hold either way.
 *
 * The property that actually matters is not "can it solve x": it is that a
 * caller can never be silently charged. `requiresLLM` is the only route to a
 * model, the module never takes it itself, and every deterministic answer
 * carries `isExact` (substituted back and checked) separately from
 * `confidence` (how sure we are the question was read right). A result that
 * conflates those two is how a guess gets shown to a student as a fact.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { MathEngine } from '../lib/math-engine';
import type { AnswerSpec } from '../lib/answer-check';

let checks = 0;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) { failures++; console.log(`FAIL  ${msg}`); }
};

(async () => {
  console.log('\n-- solve --');
  {
    const r = await MathEngine.solve('2*x + 3 = 11', { variable: 'x' });
    ok(r.success, `2x+3=11 solves (engine=${r.engine}, warnings=${r.warnings.join('|')})`);
    if (r.success) {
      ok(r.requiresLLM === false, 'a solved equation does not ask for a model');
      ok(r.steps.length > 0, 'steps are returned');
      ok(r.normalizedExpression.length > 0, 'the normalised expression is reported');
      ok(typeof r.isExact === 'boolean', 'isExact is present');
    }
  }

  console.log('\n-- validate against an AUTHORED spec (no network, with diagnosis) --');
  {
    const spec: AnswerSpec = { kind: 'value', value: '1/3' };
    for (const [typed, expected] of [['1/3', true], ['2/6', true], ['0.3333333333', true], ['1/2', false]] as const) {
      const r = await MathEngine.validate(typed, { spec });
      ok(r.isCorrect === expected, `${JSON.stringify(typed)} → ${r.isCorrect}, expected ${expected}`);
      ok(r.requiresLLM === false, `${JSON.stringify(typed)} needs no model`);
      ok(r.engine === 'local-mathjs', `${JSON.stringify(typed)} answered in-process`);
    }
    // The shape of the mistake survives, which is what lets the tutor say WHY
    // without paying for a guess.
    const set: AnswerSpec = { kind: 'set', values: ['2', '3'] };
    const partial = await MathEngine.validate('2', { spec: set });
    ok(partial.isCorrect === false, 'a partial set is wrong');
    ok(partial.diagnosis?.kind === 'partial-set', `and is diagnosed as partial-set (got ${partial.diagnosis?.kind})`);
  }

  console.log('\n-- validate with NO spec: solve, then compare --');
  {
    const r = await MathEngine.validate('4', { expression: '2*x + 3 = 11', variable: 'x' });
    if (r.success) {
      ok(r.isCorrect === true, `4 is the answer to 2x+3=11 (got ${r.isCorrect})`);
    } else {
      // Acceptable outcome when neither engine handles it — but it must SAY so
      // rather than return a confident wrong verdict.
      ok(r.requiresLLM === true, 'if it could not solve, it asks for a model instead of guessing');
      ok(r.isCorrect === null, 'and returns no verdict at all');
    }
  }

  console.log('\n-- what must NOT be answered deterministically --');
  {
    for (const prose of [
      'הוכח שהסדרה מתכנסת',
      'הסבר למה מכפילים כאן',
      'מצא את המקום הגאומטרי של הנקודות',
    ]) {
      const r = await MathEngine.solve(prose);
      ok(r.success === false, `prose is refused: ${prose.slice(0, 24)}`);
      ok(r.requiresLLM === true, `…and is handed to the caller for a model: ${prose.slice(0, 18)}`);
      ok(r.isCorrect === null, '…with no verdict');
    }
  }

  console.log('\n-- malformed input is an outcome, never a throw --');
  {
    for (const bad of ['', '   ', '((((', 'x '.repeat(400)]) {
      const r = await MathEngine.solve(bad);
      ok(r.success === false, `refused: ${JSON.stringify(bad.slice(0, 12))}`);
      ok(r.warnings.length > 0, 'and says why');
    }
    const empty = await MathEngine.validate('', { spec: { kind: 'value', value: '1' } });
    ok(empty.isCorrect === null, 'an empty answer gets no verdict');
  }

  console.log('\n-- the Hebrew instruction decides what the engine DOES --');
  {
    // Same expression, two questions. Dropping `text` is not a harmless
    // default: without it classifyProblem sees only `x^3-4x`, calls it an
    // `evaluate`, and the engine simplifies — handing the input back as a
    // "verified" answer to a question nobody asked. Measured, not theorised:
    // the scan pipeline, which passes the full transcription, got the correct
    // derivative from this same engine on this same input.
    const withText = await MathEngine.solve('x^3 - 4*x', {
      text: 'גזור את הפונקציה $x^3 - 4x$',
      variable: 'x',
    });
    ok(withText.success, `with the Hebrew verb it solves (${withText.warnings.join('|')})`);
    ok(
      !withText.success || /3\s*\*?\s*x\s*\^\s*\{?2/.test(withText.result),
      `and differentiates: expected 3x^2-4, got ${withText.result}`,
    );

    const withoutText = await MathEngine.solve('x^3 - 4*x', { variable: 'x' });
    ok(
      !withoutText.success || withoutText.result !== withText.result,
      'without it the engine is asked something else entirely — which is why callers pass `text`',
    );
  }

  console.log('\n-- the cost contract --');
  {
    // The single most important property in this file: nothing here can spend
    // money. `requiresLLM` is a REPORT, and the caller is the only one who can
    // act on it.
    const source = await import('fs').then((fs) =>
      fs.readFileSync(resolve(process.cwd(), 'lib/math-engine.ts'), 'utf8'),
    );
    ok(!/anthropic|messages\.create|\/api\/chat/i.test(source),
      'math-engine.ts contains no path to a model — it reports requiresLLM and stops');
  }

  console.log(`\n${failures === 0 ? 'PASS' : 'FAILED'}  ${checks - failures}/${checks} passed`);
  process.exitCode = failures === 0 ? 0 : 1;
})();
