/**
 * test-verify-solution.ts — the CAS/model cross-check, in isolation.
 *
 *   npx tsx scripts/test-verify-solution.ts
 *
 * FREE — no API, no network. `solveWithCas` is the half that talks to the
 * engines; `compareWithCas` is pure, and it is the half that decides whether a
 * solution is banked, contradicted, or left alone. That decision is now on the
 * path of every paid solve in /api/scan-solve, so it gets a test.
 *
 * The asymmetry this file guards, same as the matcher's: abstaining costs
 * nothing, and a false 'verified' launders a wrong solution into the tier the
 * whole app treats as trustworthy.
 */

import { compareWithCas, type CasResult } from '../lib/mathscan/verify-solution';

let checks = 0;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
};

const cas = (values: string[], latex = values[0]): CasResult => ({
  ok: true,
  answerValues: values,
  answerLatex: latex,
  engine: 'local-mathjs',
});
const casFailed: CasResult = { ok: false, reason: 'cas unsupported' };

const md = (answer: string) => `## סעיף א\n\nמחשבים ומקבלים.\n\n**התשובה:** ${answer}`;

// ---- agreement ----
{
  const v = compareWithCas(cas(['4']), md('$4$'));
  ok(v.status === 'verified', 'matching answer verifies');
}
{
  // The model writes prose around the value; the checker still has to see it.
  const v = compareWithCas(cas(['32']), md('$a_{10} = 32$'));
  ok(v.status === 'verified', 'answer embedded in an equation still verifies');
}

// ---- disagreement: the whole point ----
{
  const v = compareWithCas(cas(['4']), md('$6$'));
  ok(v.status === 'contradicted', 'a different answer is contradicted');
  if (v.status === 'contradicted') {
    ok(v.casAnswer === '4' && v.aiAnswer === '$6$', 'contradiction reports both sides');
  }
}

// ---- abstentions: every ambiguity must land here, never on a verdict ----
{
  const multi = `## סעיף א\n**התשובה:** $4$\n\n## סעיף ב\n**התשובה:** $9$`;
  const v = compareWithCas(cas(['4']), multi);
  // The CAS solved ONE problem. Against two answer lines, "verified" would be
  // decided by whichever section happens to agree.
  ok(v.status === 'abstained', 'a multi-section solution abstains');
}
{
  const v = compareWithCas(cas(['4']), 'פתרון בלי שורת תשובה בכלל');
  ok(v.status === 'abstained', 'no answer line abstains');
}
{
  const v = compareWithCas(casFailed, md('$4$'));
  ok(v.status === 'abstained', 'a CAS that did not solve abstains');
}
{
  // Not machine-comparable — says nothing about the model, so it must not
  // read as disagreement.
  const v = compareWithCas(cas(['4']), md('הפונקציה עולה בכל תחומה'));
  ok(v.status !== 'contradicted', 'an unparseable answer is never a contradiction');
}
{
  const v = compareWithCas(cas([]), md('$4$'));
  ok(v.status === 'abstained', 'an empty CAS answer set abstains');
}

// ---- sets ----
{
  const v = compareWithCas(cas(['2', '-2'], '\\pm 2'), md('$x = 2$ או $x = -2$'));
  ok(v.status === 'verified', 'a root set verifies in either order');
}
{
  const v = compareWithCas(cas(['2', '-2'], '\\pm 2'), md('$x = 2$'));
  ok(v.status !== 'verified', 'half of a root set does not verify');
}

console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exit(failures === 0 ? 0 : 1);
