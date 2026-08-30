// 345 of 1018 authored entries carry an alt that repeats `q` verbatim, and
// merge-tutor-faq drops every one of them (34%, far past its 5% bar).
//
// The agents' STRUCTURE is right: they built the held-position pairing the brief
// asks for — alts[1] a token subset of alts[0], alts[4] of alts[3]. Their only
// mistake is that alts[0] is `q` itself rather than a paraphrase of it.
//
// So this is a reordering problem, not a rewriting one. The matcher scores `q`
// and every alt SEPARATELY and takes the max, and `q` is never held out — so an
// alt that paraphrases `q` is findable through `q` whether or not some other alt
// also happens to equal it. Removing the duplicate therefore costs nothing, as
// long as the two HELD slots (1 and 4) still land on alts that have a live
// partner:
//
//   index 1 <- the surviving alt closest to `q` (partner: `q`, always indexed)
//   index 3,4 <- the original alts[3] / alts[4] pair, kept adjacent
//   everything else fills the gaps in its original order
//
// Run: npx tsx scripts/_fix-faq-qdup.ts <dir> [--dry]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '../lib/tutor-faq';

const DIR = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!DIR) { console.error('usage: _fix-faq-qdup.ts <dir> [--dry]'); process.exit(1); }

const norm = (s: string) => s.replace(/[?!.,\s]/g, '');
/** Share of the candidate's tokens that `q` also has — how well `q` can stand in
 *  for it when it is hidden. */
const overlap = (a: string, b: string) => {
  const A = new Set(tokens(a));
  const B = tokens(b);
  if (!B.length) return 0;
  return B.filter((t) => A.has(t)).length / B.length;
};

let fixed = 0;
let untouched = 0;

for (const file of readdirSync(DIR).filter((f) => /^faq-\d+\.json$/.test(f)).sort()) {
  const rows = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as {
    unit: string;
    faqs: { id: string; q: string; alts: string[] }[];
  }[];

  for (const row of rows) {
    for (const e of row.faqs) {
      const dupAt = e.alts.findIndex((a) => norm(a) === norm(e.q));
      if (dupAt < 0) { untouched++; continue; }

      const pair3 = dupAt === 3 ? null : e.alts[3];
      const pair4 = dupAt === 4 ? null : e.alts[4];
      const rest = e.alts.filter((_, i) => i !== dupAt && i !== 3 && i !== 4);

      // The held slot at index 1 goes to whichever survivor `q` covers best.
      let bestI = 0;
      let bestS = -1;
      rest.forEach((a, i) => {
        const s = overlap(e.q, a);
        if (s > bestS) { bestS = s; bestI = i; }
      });
      const held1 = rest.splice(bestI, 1)[0];

      const out: string[] = [];
      out[0] = rest.shift()!;          // filler; held1's real partner is `q`
      out[1] = held1;                  // HELD
      out[2] = rest.shift()!;
      if (pair3 && pair4) { out[3] = pair3; out[4] = pair4; }  // HELD pair, intact
      else { out[3] = rest.shift()!; out[4] = (pair3 ?? pair4 ?? rest.shift())!; }
      out.push(...rest);

      const clean = out.filter((a) => typeof a === 'string' && a.length > 0);
      if (clean.length < 5) { console.log(`  ! ${e.id}: only ${clean.length} alts left, skipped`); continue; }
      e.alts = clean;
      fixed++;
    }
  }

  if (!DRY) writeFileSync(join(DIR, file), JSON.stringify(rows, null, 2), 'utf8');
}

console.log(`${fixed} entries repaired, ${untouched} already clean${DRY ? ' (dry run)' : ''}`);
