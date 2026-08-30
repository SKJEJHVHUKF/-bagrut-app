/**
 * fix-faq-dupe-alts.ts — report (and optionally repair) FAQ entries whose
 * `alts` contain a verbatim duplicate.
 *
 *   npx tsx scripts/fix-faq-dupe-alts.ts <outdir> [--apply]
 *
 * merge-tutor-faq drops an entry whose alts are not all distinct, and aborts
 * the whole merge once more than 5% of entries are dropped. A duplicate is
 * always an authoring slip, never a judgement call, so it is safe to repair
 * mechanically — BUT only by deleting the duplicate, and only while at least
 * the 5 distinct alts the contract requires survive. Anything that would fall
 * below 5 is reported for a human instead of being silently padded, because a
 * padded alt is worse than a dropped entry: it inflates the blind-recall
 * measurement with a phrasing no student would type.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = process.argv[2];
const apply = process.argv.includes('--apply');
if (!dir) { console.error('usage: fix-faq-dupe-alts.ts <outdir> [--apply]'); process.exit(2); }

type Faq = { id: string; q: string; alts: string[] };
type Unit = { unit: string; faqs: Faq[] };

/** EXACTLY merge-tutor-faq's rule — all whitespace and `?!.,` removed. A looser
 *  norm here reports 0 duplicates while the gate still drops the entries. */
const norm = (s: string) => s.replace(/[?!.,\s]/g, '');

let files = 0, entries = 0, repaired = 0, tooFew = 0;
const needsHuman: string[] = [];

for (const f of readdirSync(dir).filter((n) => /^faq-.*\.json$/.test(n))) {
  const path = join(dir, f);
  const units: Unit[] = JSON.parse(readFileSync(path, 'utf8'));
  let touched = false;
  files++;
  for (const u of units) {
    for (const e of u.faqs ?? []) {
      entries++;
      // A duplicate of `q` itself also counts — the matcher indexes them together.
      const seen = new Set<string>([norm(e.q)]);
      const kept: string[] = [];
      for (const a of e.alts ?? []) {
        const k = norm(a);
        if (seen.has(k)) continue;
        seen.add(k);
        kept.push(a);
      }
      if (kept.length === (e.alts ?? []).length) continue;
      if (kept.length < 5) { tooFew++; needsHuman.push(`${e.id}  ${kept.length} distinct alts left`); continue; }
      e.alts = kept;
      repaired++;
      touched = true;
    }
  }
  if (touched && apply) writeFileSync(path, JSON.stringify(units, null, 1), 'utf8');
}

console.log(`${files} file(s) · ${entries} entries · ${repaired} repaired${apply ? ' (written)' : ' (dry)'} · ${tooFew} need a human`);
for (const n of needsHuman) console.log('  ✗ ' + n);
