/**
 * verify-prob-ladder.ts — the הסתברות track's promise, enforced.
 *
 *   npx tsx scripts/verify-prob-ladder.ts
 *
 * The owner's two requirements for this track, in his own words:
 *   "שהשאלות יהיו מגוונות … ושככל שעולים רמה כך גם השאלות עצמן קשות ומאתגרות
 *    יותר באמת", and "שבסוף יצליח לגשת לשאלת בגרות אמיתית ולהצליח בה."
 *
 * Neither had a gate, and both were being broken in shipped content: measured
 * 2026-09-06, pr-basics' hard rung averaged FEWER solution steps than its mid
 * rung, pr-tables' hard rung invoked fewer named rules than its EASY rung, four
 * of six stages asked "compute" in 100% of their questions, and five hard
 * questions were a lower-rung question with different numbers.
 *
 * This runs the two proofs that keep that from coming back:
 *   1. scripts/_prob-extra-check.ts all — structure, escalation, variety, and
 *      the exam-reach measurement against the archived שאלון 571 questions.
 *   2. scripts/_prob-extra-checks/<stage>.ts — the independent re-derivation of
 *      every authored number, written by a verifier who solved each question
 *      from its statement before reading its solution.
 *
 * A pass means no rung is flat or inverted, no challenge question restates an
 * easier one, and every number still agrees with an independent computation.
 * It does not mean the questions are interesting; a human reads for that.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const STAGES = ['basics', 'tree', 'tables', 'bernoulli', 'conditional', 'practice'];
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const run = (args: string[]) => spawnSync(npx, ['tsx', ...args], { encoding: 'utf8', shell: process.platform === 'win32' });

let bad = 0;

for (const stage of STAGES) {
  const file = join('scripts', '_prob-extra-checks', `${stage}.ts`);
  const r = run([file]);
  const lines = (r.stdout + r.stderr).trim().split(/\r?\n/);
  const last = lines[lines.length - 1] ?? '';
  const ok = r.status === 0 && /passed, 0 failed/.test(last);
  console.log(`${ok ? '✓' : '✗'} ${last || `${stage}: exit ${r.status}`}`);
  if (!ok) {
    for (const l of lines.slice(0, -1)) console.log(`    ${l}`);
    bad++;
  }
}

const gate = run(['scripts/_prob-extra-check.ts', 'all']);
const out = (gate.stdout + gate.stderr).trim().split(/\r?\n/);
console.log(out.filter((l) => /^exam bar|^pr-|^\s+[✗⚠]/.test(l)).join('\n'));
if (gate.status !== 0) bad++;

console.log(bad === 0 ? '\n✅ verify-prob-ladder: every rung climbs, and the top reaches the exam' : `\n❌ verify-prob-ladder: ${bad} problem(s)`);
process.exit(bad === 0 ? 0 : 1);
