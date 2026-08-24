/**
 * merge-strings.ts — validate authored phrasing rewrites for the side surfaces
 * and emit the item list apply-strings.ts consumes.
 *
 *   npx tsx scripts/merge-strings.ts <workdir> [--file out/<slice>.json]
 *
 * The load-bearing invariant: a phrasing fix may change Hebrew wording ONLY.
 * The mathematics, the data and the letters must survive untouched, so the gate
 * compares the multiset of `$…$` islands and refuses any new digit or Latin
 * identifier. That is what makes a 200-string sweep safe to apply blind.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { spelledNums } from '../lib/rtl-prose';

const MAQAF = /[א-ת]-(?=\$|\d)/g;
const DASHM = /\$ ?[—–] | [—–] ?\$/g;
const UNI = /כוח הנקודה|הומותטי|ז\.ז\.צ/g;
const ISLAND = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g;

type Row = { where: string; field: string; text: string; bad: string[] };
type Entry = { where: string; text: string };
type Item = { file: string; from: string; to: string; where: string };

const wd = process.argv[2];
if (!wd) { console.error('usage: merge-strings.ts <workdir> [--file <out.json>]'); process.exit(2); }
const oneFile = process.argv.includes('--file') ? process.argv[process.argv.indexOf('--file') + 1] : '';
const manifest: { name: string; file: string }[] = JSON.parse(readFileSync(`${wd}/manifest.json`, 'utf8'));

const partial = process.argv.includes('--partial');
let bad = 0, skipped = 0;
const fail = (w: string, m: string, d = '') => { bad++; console.log(`  ✗ ${w} — ${m}${d ? `\n      «${d.slice(0, 150)}»` : ''}`); };

const islands = (s: string) => (s.match(ISLAND) ?? []).slice().sort();
const strip = (s: string) => s.replace(ISLAND, ' ');
const digits = (s: string) => (strip(s).match(/\d+/g) ?? []).slice().sort();
/** Bare Latin runs outside math — point names, theorem letters. */
const latin = (s: string) => (strip(s).match(/[A-Za-z]+/g) ?? []).slice().sort();
const eq = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

const items: Item[] = [];
const slices = oneFile
  ? manifest.filter((m) => oneFile.includes(`${m.name}.json`))
  : manifest;
if (oneFile && !slices.length) { console.error(`no manifest entry matches ${oneFile}`); process.exit(2); }

for (const { name, file } of slices) {
  const rows: Row[] = JSON.parse(readFileSync(`${wd}/${name}.json`, 'utf8'));
  const outPath = oneFile || (existsSync(`${wd}/out/final-${name}.json`) ? `${wd}/out/final-${name}.json` : `${wd}/out/${name}.json`);
  if (!existsSync(outPath)) { console.log(`  ✗ no output for ${name}`); bad++; continue; }
  console.log(`  ${outPath.includes('final-') ? 'reviewed' : 'RAW     '}  ${name}`);
  const byWhere = new Map<string, Entry>();
  for (const e of JSON.parse(readFileSync(outPath, 'utf8')) as Entry[]) byWhere.set(e.where, e);

  for (const r of rows) {
    const e = byWhere.get(r.where);
    // --partial: a deterministic rules sweep deliberately leaves the rows whose
    // phrasing needs judgment. Those are reported and hand-fixed, not guessed.
    if (!e) { if (!partial) fail(r.where, 'MISSING — no rewrite authored'); else skipped++; continue; }
    const to = e.text;
    if (typeof to !== 'string' || !to.trim()) { fail(r.where, 'empty rewrite'); continue; }
    if (to === r.text) { fail(r.where, 'unchanged — the defect is still there'); continue; }

    // 1. the mathematics is untouchable — except that a bare-number island may
    //    legitimately become its Hebrew word (`ב-$2$` → `בשניים`), which is the
    //    sanctioned fix for a maqaf on a digit. deWord puts the number back so
    //    the comparison sees through that one rewrite and nothing else.
    const fromIslands = islands(r.text);
    const toIslands = islands(to);
    const toSpelled = spelledNums(to);
    const lostAsWord: string[] = [];
    const stillMissing = fromIslands.filter((i) => {
      const k = toIslands.indexOf(i);
      if (k !== -1) { toIslands.splice(k, 1); return false; }
      const m = i.match(/^\$(-?\d+)\$$/);
      if (m && toSpelled.includes(m[1])) { lostAsWord.push(m[1]); return false; }
      return true;
    });
    if (stillMissing.length || toIslands.length)
      fail(r.where, `math islands changed (lost: ${stillMissing.join(' ') || '—'}; added: ${toIslands.join(' ') || '—'})`, to);
    // 2. no invented or lost data. A number may move between an island, a bare
    //    digit and a Hebrew word, but the SET of numbers mentioned may not change.
    const fromNums = [...digits(r.text), ...spelledNums(r.text), ...lostAsWord].sort();
    const toNums = [...digits(to), ...toSpelled].sort();
    if (!eq(fromNums, toNums))
      fail(r.where, `numbers changed [${fromNums}] → [${toNums}]`, to);
    if (!eq(latin(r.text), latin(to)))
      fail(r.where, `Latin identifiers outside math changed [${latin(r.text)}] → [${latin(to)}]`, to);
    // 3. the defect must actually be gone, and none introduced
    const left = [...(to.match(MAQAF) ?? []), ...(to.match(DASHM) ?? []), ...(to.match(UNI) ?? [])];
    if (left.length) fail(r.where, `still defective: ${left.join(' ')}`, to);
    // 4. structure preserved — markdown lead and bold count
    const lead = (s: string) => (s.match(/^[\s>#*-]*/) ?? [''])[0].replace(/\s+/g, '');
    if (lead(r.text) !== lead(to)) fail(r.where, `markdown lead changed «${lead(r.text)}» → «${lead(to)}»`, to);
    if ((r.text.match(/\*\*/g) ?? []).length !== (to.match(/\*\*/g) ?? []).length)
      fail(r.where, 'bold markers changed', to);
    if ((to.match(/\n/g) ?? []).length !== (r.text.match(/\n/g) ?? []).length)
      fail(r.where, 'line count changed — these strings are laid out', to);
    // 5. rambling / truncation
    const ratio = to.length / r.text.length;
    if (ratio < 0.6 || ratio > 1.8) fail(r.where, `length ${r.text.length} → ${to.length} (×${ratio.toFixed(2)})`, to);

    items.push({ file, from: r.text, to, where: r.where });
  }
  for (const w of [...byWhere.keys()].filter((w) => !rows.some((r) => r.where === w)))
    fail(w, 'authored for a `where` not in the audit — typo?');
}

if (!oneFile) writeFileSync(`${wd}/string-items.json`, JSON.stringify(items, null, 1), 'utf8');
console.log(`\n${items.length} rewrites ready; ${bad} problem(s)${skipped ? `; ${skipped} row(s) left for a human pass` : ''}.`);
if (bad > 0) process.exit(1);

export {};
