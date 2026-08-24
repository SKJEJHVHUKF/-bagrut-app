/**
 * sweep-side-surfaces.ts — apply the shared RTL prose rules to the three SIDE
 * surfaces of a topic (ghost-replay / concept-quiz / cognition), producing the
 * `{where, text}` files that merge-strings.ts validates and apply-strings.ts
 * writes.
 *
 *   npx tsx scripts/audit-strings.ts <stem> <wd>        # first: dump the rows
 *   npx tsx scripts/sweep-side-surfaces.ts <wd>         # then: this
 *   npx tsx scripts/merge-strings.ts <wd>               # gate
 *   npx tsx scripts/apply-strings.ts <wd>/string-items.json
 *
 * Why deterministic instead of authoring agents: after the geometry round the
 * rule table in lib/rtl-prose.ts took a whole topic's prose from 291 defects to
 * 0 with no misfires, and merge-strings already refuses any rewrite that moves
 * a math island, a digit, a Latin identifier or the layout. Agents are still
 * the right tool for MEANING; they are overkill for a rule that is now proven.
 * Anything the rules cannot clean is reported here and left for a human pass.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { transformProse, proseDefects } from '../lib/rtl-prose';

const wd = process.argv[2];
if (!wd) { console.error('usage: sweep-side-surfaces.ts <workdir>'); process.exit(2); }

const manifest: { name: string; rows: number }[] = JSON.parse(readFileSync(`${wd}/manifest.json`, 'utf8'));
mkdirSync(`${wd}/out`, { recursive: true });

let total = 0, clean = 0;
const leftovers: { where: string; bad: string[]; text: string }[] = [];

for (const { name } of manifest) {
  const rows: { where: string; text: string; bad: string[] }[] = JSON.parse(readFileSync(`${wd}/${name}.json`, 'utf8'));
  const out: { where: string; text: string }[] = [];
  for (const r of rows) {
    total++;
    const t = transformProse(r.text);
    const left = proseDefects(t);
    if (t !== r.text && left.length === 0) { out.push({ where: r.where, text: t }); clean++; }
    else leftovers.push({ where: r.where, bad: left.length ? left : ['UNCHANGED'], text: t });
  }
  writeFileSync(`${wd}/out/${name}.json`, JSON.stringify(out, null, 1), 'utf8');
  console.log(`  ${String(out.length).padStart(3)}/${String(rows.length).padStart(3)} cleaned  ${name}`);
}

console.log(`\n${clean}/${total} strings cleaned by the rules; ${leftovers.length} need a human.`);
for (const l of leftovers.slice(0, 40)) console.log(`  ✗ ${l.where} [${l.bad.join(' ')}]\n      ${l.text.slice(0, 130).replace(/\n/g, ' ')}`);
if (leftovers.length > 40) console.log(`  … and ${leftovers.length - 40} more`);
writeFileSync(`${wd}/leftovers.json`, JSON.stringify(leftovers, null, 1), 'utf8');
