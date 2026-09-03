/**
 * verify-rq-extra.ts — the numeric gate for the EXTRA מנה ושורש questions.
 *
 *   npx tsx scripts/verify-rq-extra.ts
 *
 * Runs every scripts/_rq-extra-checks/<stage>.ts — one file per stage, written
 * by the INDEPENDENT verifier that re-derived each question's answer from its
 * statement (not by the author), each check labelled with the question id —
 * and then the structural gate over all eight stages. A file that is missing
 * is an error, not a skip: the stage exists, so its proof must too.
 *
 * What a pass means: every authored number the verifier encoded still agrees
 * with mathjs, and the content still satisfies every house rule. What it does
 * not mean: that the verifier encoded every claim. Read the check counts.
 */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const DIR = join('scripts', '_rq-extra-checks');
const EXPECTED = ['domain', 'intersections', 'asymptotes', 'derivative', 'sketch', 'transformations', 'integral', 'bagrut-mixed'];

const present = new Set(readdirSync(DIR).filter((f) => f.endsWith('.ts') && !f.startsWith('_')).map((f) => f.replace(/\.ts$/, '')));
let bad = 0;
for (const stage of EXPECTED) {
  if (!present.has(stage)) {
    console.log(`✗ ${stage}: no re-derivation file (${DIR}/${stage}.ts)`);
    bad++;
    continue;
  }
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', join(DIR, `${stage}.ts`)], { encoding: 'utf8', shell: process.platform === 'win32' });
  const lines = (r.stdout + r.stderr).trim().split(/\r?\n/);
  const last = lines[lines.length - 1] ?? '';
  const ok = r.status === 0 && /passed, 0 failed/.test(last);
  console.log(`${ok ? '✓' : '✗'} ${last || `${stage}: exit ${r.status}`}`);
  if (!ok) {
    for (const l of lines.slice(0, -1)) console.log(`    ${l}`);
    bad++;
  }
}

const gate = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/_rq-extra-check.ts', 'all'], { encoding: 'utf8', shell: process.platform === 'win32' });
const gateLines = (gate.stdout + gate.stderr).trim().split(/\r?\n/);
console.log(gateLines.filter((l) => /^rq-|^[✅❌]/.test(l)).join('\n'));
if (gate.status !== 0) bad++;

console.log(bad === 0 ? '\n✅ verify-rq-extra: every stage proven and clean' : `\n❌ verify-rq-extra: ${bad} problem(s)`);
process.exit(bad === 0 ? 0 : 1);
