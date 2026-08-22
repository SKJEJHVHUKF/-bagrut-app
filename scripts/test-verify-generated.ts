/**
 * test-verify-generated.ts — the mathjs gate on AI-generated exercises.
 *
 *   npx tsx scripts/test-verify-generated.ts
 *
 * Two things have to hold, and the second is the one that would hurt quietly:
 *
 *   1. ARITHMETIC — a check that disagrees must come back `failed`, and one
 *      that cannot be run must come back `unverifiable`. Collapsing those two
 *      into "bad" would throw away every proof-type exercise.
 *
 *   2. SANDBOX — this evaluates model output on the SERVER. Stock mathjs lets
 *      an expression define functions and re-enter `import`. Those cases are
 *      asserted here rather than trusted, because a hole in the allowlist is
 *      invisible in normal use: every legitimate exercise keeps working.
 */

import { runCheck, verifyGenerated, type SelfCheck } from '../lib/verify-generated';

let checks = 0;
let failures = 0;
const assert = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
};

const check = (expr: string, equals: string, claim = 'בדיקה'): SelfCheck => ({ claim, expr, equals });

// ------------------------------------------------------------
console.log('\n— arithmetic —');
// ------------------------------------------------------------
{
  // The worked example from the module header: roots of x²-5x+6.
  assert(runCheck(check('2^2 - 5*2 + 6', '0')).status === 'verified', 'correct root substitution verifies');
  assert(runCheck(check('3^2 - 5*3 + 6', '0')).status === 'verified', 'second correct root verifies');

  // A model that drifted: claims x=4 is a root when it is not.
  const wrong = runCheck(check('4^2 - 5*4 + 6', '0'));
  assert(wrong.status === 'failed', 'wrong root is caught');
  assert(wrong.status === 'failed' && wrong.got === '2', 'failure reports what it actually got');

  assert(runCheck(check('1/3 * 3', '1')).status === 'verified', 'floating-point noise is inside tolerance');

  // Tolerance is RELATIVE. Both halves of that trade are asserted, so the
  // documented ceiling stays visible instead of being discovered in production.
  assert(runCheck(check('10^7 + 1000', '10^7')).status === 'failed', 'a real error at scale 1e7 is caught');
  assert(
    runCheck(check('10^7 + 1', '10^7')).status === 'verified',
    'KNOWN CEILING: off-by-one above ~1e7 is absorbed (see TOL in lib/verify-generated.ts)'
  );

  // Derivative value: f(x)=x³-3x, f'(2) = 3·4-3 = 9.
  assert(runCheck(check('3*2^2 - 3', '9')).status === 'verified', 'derivative-value check verifies');
}

// ------------------------------------------------------------
console.log('\n— stated precision —');
// ------------------------------------------------------------
{
  // MEASURED: models round decimals, and holding a correctly-rounded 4dp value
  // to 1e-7 was the largest source of false failures in measure-generator.ts.
  // A decimal literal is honoured at the precision it states, and no further.
  assert(
    runCheck(check('(14^2+156-10^2)/(2*14*sqrt(156))', '0.7206')).status === 'verified',
    'a correctly rounded 4dp value is accepted'
  );
  assert(
    runCheck(check('(3/5)*sqrt(156)', '7.4919')).status === 'failed',
    'but a value wrong at its OWN stated precision is still caught'
  );
  assert(runCheck(check('1/3', '0.3333')).status === 'verified', '0.3333 accepted for 1/3');
  assert(runCheck(check('1/3', '0.33')).status === 'verified', '0.33 accepted for 1/3 at 2dp');
  assert(runCheck(check('1/3', '0.34')).status === 'failed', '0.34 rejected — wrong even at 2dp');

  // Exactness claims stay strict: this is where real hallucination shows up.
  assert(runCheck(check('4^2 - 5*4 + 6', '0')).status === 'failed', 'an integer claim stays on the tight tolerance');
  assert(runCheck(check('sqrt(2)*sqrt(2)', '2')).status === 'verified', 'exact symbolic equality still verifies');
}

// ------------------------------------------------------------
console.log('\n— bagrut conventions —');
// ------------------------------------------------------------
{
  // cis in DEGREES, never radians — the 5-unit convention. If this instance
  // used radians, cis(90) would not be i and every מרוכבים check would fail.
  assert(runCheck(check('cis(90)', 'i')).status === 'verified', 'cis(90) = i  (degrees, not radians)');
  assert(runCheck(check('2*cis(60)', '1 + sqrt(3)*i')).status === 'verified', 'cis composes with complex arithmetic');
  assert(runCheck(check('cis(0)', '1')).status === 'verified', 'cis(0) = 1');

  // Trigonometry with an EXPLICIT unit. Bare cos(360) is radians in mathjs and
  // evaluates to -0.284; the bagrut convention is degrees. Both readings are
  // legitimate somewhere in the syllabus (geometry vs calculus), so the unit is
  // required rather than guessed — these assert that both still work.
  assert(runCheck(check('cos(360 deg)', '1')).status === 'verified', 'cos(360 deg) = 1');
  assert(runCheck(check('sin(30 deg)', '0.5')).status === 'verified', 'sin(30 deg) = 0.5');
  assert(runCheck(check('cos(60 deg)', 'sqrt(3)/2')).status === 'failed', 'a wrong trig value is still caught');
  assert(runCheck(check('cos(pi)', '-1')).status === 'verified', 'bare radians still work for calculus');

  // The model writes LaTeX in every other field; tolerate it here too.
  assert(runCheck(check('\\frac{6}{2}', '3')).status === 'verified', 'LaTeX \\frac is accepted');
  assert(runCheck(check('\\sqrt{16}', '4')).status === 'verified', 'LaTeX \\sqrt is accepted');
  assert(runCheck(check('$2+2$', '4')).status === 'verified', 'stray $ delimiters are stripped');
}

// ------------------------------------------------------------
console.log('\n— unverifiable is not failure —');
// ------------------------------------------------------------
{
  // A leftover variable means the model emitted an identity it never evaluated.
  // That is unverifiable, NOT wrong — refusing it as wrong would be a lie.
  const free = runCheck(check('x^2 - 5*x + 6', '0'));
  assert(free.status === 'unverifiable', 'free variable is unverifiable, not failed');

  assert(runCheck(check('', '0')).status === 'unverifiable', 'empty expr is unverifiable');
  assert(runCheck(check('2 +', '0')).status === 'unverifiable', 'unparseable expr is unverifiable');

  // Proof-type exercise: no numeric identity to assert.
  const none = verifyGenerated([]);
  assert(none.ok === true, 'an exercise with no checks is allowed through');
  assert(none.failed === 0 && none.verified === 0, 'and is counted as neither pass nor fail');

  assert(verifyGenerated(undefined).ok === true, 'missing checks array does not crash');
}

// ------------------------------------------------------------
console.log('\n— sandbox (server-side, model-controlled input) —');
// ------------------------------------------------------------
{
  // Each of these is legal mathjs that must NOT run here. They come back
  // `unverifiable` rather than throwing — a hostile payload must not be able
  // to take a route down with an unhandled error either.
  const blocked: [string, string][] = [
    ['import({evil:()=>1})', 're-entering import'],
    ['f(x) = x^2', 'defining a function'],
    ['a = 5', 'assigning a variable'],
    ['createUnit("zzz")', 'creating a unit'],
    ['evaluate("1+1")', 'nested evaluate'],
    ['[1,2,3]', 'array literal'],
    ['{a: 1}', 'object literal'],
    ['config({})', 'reaching config'],
    ['9!.toString', 'property access'],
  ];
  for (const [expr, what] of blocked) {
    const out = runCheck(check(expr, '1'));
    assert(out.status === 'unverifiable', `refused: ${what}`);
  }

  // The allowlist must not have refused ordinary maths along the way.
  assert(runCheck(check('sqrt(2)^2', '2')).status === 'verified', 'allowlisted functions still work');
  assert(runCheck(check('combinations(5,2)', '10')).status === 'verified', 'combinatorics still works');
  assert(runCheck(check('log(e^3)', '3')).status === 'verified', 'natural log still works');
  assert(runCheck(check('pi', '3.14159265358979')).status === 'verified', 'pi resolves to the real constant');
  assert(runCheck(check('pi', '3.14')).status === 'verified', 'pi to 2dp is accepted at its stated precision');
  assert(runCheck(check('pi', '3.15')).status === 'failed', 'but 3.15 is wrong even at 2dp');
}

// ------------------------------------------------------------
console.log('\n— report aggregation —');
// ------------------------------------------------------------
{
  const report = verifyGenerated([
    check('2^2 - 5*2 + 6', '0', 'הצבת x=2'),
    check('4^2 - 5*4 + 6', '0', 'הצבת x=4'),
    check('x + 1', '0', 'זהות לא מוצבת'),
  ]);
  assert(report.verified === 1, 'counts the verified check');
  assert(report.failed === 1, 'counts the failed check');
  assert(report.unverifiable === 1, 'counts the unverifiable check');
  assert(report.ok === false, 'one failed check makes the whole exercise not ok');

  const clean = verifyGenerated([check('1+1', '2'), check('x', '0')]);
  assert(clean.ok === true, 'verified + unverifiable, with no failure, is ok');
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
