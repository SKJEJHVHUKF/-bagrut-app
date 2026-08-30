// Preflight over the authored slices, BEFORE merging.
//
// ⚠️ PRE-MERGE ONLY. It reads authoring slices — `.faq-work/out/faq-NN.json`,
// each `[{ unit, faqs }]` — not a merged bank and not a bank dumped by
// _dump-trig-faq. Pointed at a finished bank it finds nothing and looks broken.
// To check an already-merged bank, dump it and assert the same three properties
// (id present, unique, matching its unit) over the object directly.
//
// The one that matters: an entry without `id` makes test-tutor-faq compare
// `undefined === undefined` and score a fake 100% recall. One slice author
// found this and reported it; every other slice's 100% is only trustworthy if
// its entries actually carry ids. So this checks the claim rather than the
// report.
import { readdirSync, readFileSync } from 'node:fs';
import { HELD_POSITIONS } from '../content/tutor-faq/types';
// The REAL tokeniser, not a whitespace split. A naive split reports 752
// violations that do not exist: it counts עם / של / יש, which the real one
// drops at the 2-character floor, and it misses the stemming and synonym
// collapsing that decide whether two phrasings are actually the same tokens.
import { tokens as realTokens } from '../lib/tutor-faq';

const DIR = process.argv[2] ?? '.faq-work/out';
let files: string[] = [];
try {
  files = readdirSync(DIR).filter((f) => /^faq-\d+\.json$/.test(f)).sort();
} catch {
  console.error(`no such directory: ${DIR}`);
  console.error('usage: _faq-preflight.ts [slice-dir]   (default .faq-work/out)');
  console.error('This is a PRE-MERGE check over authoring slices, not a merged bank.');
  process.exit(2);
}
if (!files.length) {
  console.error(`${DIR} holds no faq-NN.json slices.`);
  console.error('This is a PRE-MERGE check: run it on the authoring output, before merge-tutor-faq.');
  process.exit(2);
}

let units = 0, entries = 0;
const bad: string[] = [];
const warn: string[] = [];
const seenIds = new Set<string>();
const seenUnits = new Set<string>();
const kinds = new Map<string, number>();
const altCounts = new Map<number, number>();

for (const f of files) {
  const rows = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
  if (!Array.isArray(rows)) { bad.push(`${f}: not an array`); continue; }
  for (const r of rows) {
    units++;
    if (!r.unit) bad.push(`${f}: a row has no unit`);
    if (seenUnits.has(r.unit)) bad.push(`${f}: unit ${r.unit} appears in two slices`);
    seenUnits.add(r.unit);
    for (const e of r.faqs ?? []) {
      entries++;
      if (!e.id) { bad.push(`${f} ${r.unit}: entry with NO id — recall for it is meaningless`); continue; }
      if (seenIds.has(e.id)) bad.push(`${f}: duplicate id ${e.id}`);
      seenIds.add(e.id);
      if (!e.id.startsWith(`${r.unit}#`)) bad.push(`${f}: id ${e.id} does not match unit ${r.unit}`);
      kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
      const n = (e.alts ?? []).length;
      altCounts.set(n, (altCounts.get(n) ?? 0) + 1);
      const maxHeld = Math.max(...HELD_POSITIONS);
      if (n <= maxHeld) bad.push(`${f} ${e.id}: only ${n} alts, held position ${maxHeld} does not exist`);
      if (new Set(e.alts).size !== n) bad.push(`${f} ${e.id}: duplicate alts`);
      if ((e.alts ?? []).some((a: string) => a === e.q)) bad.push(`${f} ${e.id}: an alt equals q`);
      // The subset pairing the whole recall number rests on.
      const toks = (s: string) => new Set(realTokens(s));
      for (const [held, partner] of [[1, 0], [4, 3]] as const) {
        if (n <= held) continue;
        const h = toks(e.alts[held]);
        const p = toks(e.alts[partner]);
        const extra = [...h].filter((w) => !p.has(w));
        // A WARNING, not an error. The subset pairing is a means to recall,
        // and recall is measured directly by test-tutor-faq. A held alt that
        // adds a token can still win its own entry outright; what would make
        // it fail is a margin tie, which the recall number already catches.
        if (extra.length) {
          warn.push(`${f} ${e.id}: alts[${held}] adds ${extra.join(', ')}`);
        }
      }
    }
  }
}

console.log(`${files.length} slice files · ${units} units · ${entries} entries · ${seenIds.size} distinct ids`);
console.log(`kinds: ${[...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
console.log(`alts per entry: ${[...altCounts.entries()].sort().map(([k, n]) => `${k}→${n}`).join(' · ')}`);
if (bad.length) {
  console.log(`\n❌ ${bad.length} problem(s):`);
  console.log(bad.slice(0, 40).map((b) => `  ${b}`).join('\n'));
  if (bad.length > 40) console.log(`  … and ${bad.length - 40} more`);
  process.exit(1);
}
console.log(`\n⚠ ${warn.length}/${entries * 2} held pairs are not strict token subsets (recall measures the real thing)`);
console.log('✅ every entry has a unique, unit-matching id — the recall numbers are real, not undefined===undefined');
