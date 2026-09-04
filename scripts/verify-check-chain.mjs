// verify-check-chain.mjs — does every step of `npm run check` resolve?
//
//   node scripts/verify-check-chain.mjs
//
// The chain has ~70 `npm run X` entries and nothing else verifies that each X
// is a script and that the file it runs exists. A renamed or deleted script
// surfaces as "npm ERR! Missing script" at whatever position it sits — after
// however many minutes of earlier steps. This runs first, in under a second.
import { readFileSync, existsSync } from 'node:fs';

const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
const steps = (scripts.check ?? '')
  .split('&&')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s.replace(/^npm run\s+/, ''));

const problems = [];
for (const step of steps) {
  const cmd = scripts[step];
  if (!cmd) { problems.push(`"${step}" is not a script in package.json`); continue; }
  for (const m of cmd.matchAll(/\b(?:scripts|api)\/[\w./-]+\.(?:tsx?|mjs|js|py)\b/g)) {
    if (!existsSync(m[0])) problems.push(`"${step}" runs ${m[0]}, which does not exist`);
  }
}

console.log(`check chain: ${steps.length} steps, ${problems.length} unresolved`);
for (const p of problems) console.log('  ✗ ' + p);
process.exit(problems.length ? 1 : 0);
