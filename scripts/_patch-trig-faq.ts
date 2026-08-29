/**
 * _patch-trig-faq.ts — round-trip the trigonometry bank through the authoring
 * shape so targeted repairs go back through merge-tutor-faq's gates instead of
 * being hand-edited into a generated file. TEMP.
 *
 *   npx tsx scripts/_patch-trig-faq.ts <patches.json> <outdir>
 *
 * <patches.json> is { "<entry id>": { q?, a?, alts? } }. Everything else in the
 * bank is passed through untouched, so a run with an empty patch set must
 * reproduce the current bank byte for byte.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadFaqBank } from '../content/tutor-faq';
import type { TutorFaq } from '../content/tutor-faq/types';

type Patch = { q?: string; a?: string; alts?: string[] };

async function main() {
  const patches: Record<string, Patch> = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const outDir = process.argv[3];
  mkdirSync(outDir, { recursive: true });

  const bank = await loadFaqBank('math5', 'טריגונומטריה');
  if (!bank) throw new Error('no trigonometry bank registered');

  const seen = new Set<string>();
  const rows = Object.entries(bank).map(([unit, faqs]) => ({
    unit,
    faqs: faqs.map((f: TutorFaq) => {
      const p = patches[f.id];
      if (!p) return f;
      seen.add(f.id);
      return { ...f, ...(p.q ? { q: p.q } : {}), ...(p.a ? { a: p.a } : {}), ...(p.alts ? { alts: p.alts } : {}) };
    }),
  }));

  const missing = Object.keys(patches).filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`patch ids not found in bank: ${missing.join(', ')}`);

  writeFileSync(join(outDir, 'faq-00.json'), JSON.stringify(rows, null, 1), 'utf8');
  const entries = rows.reduce((n, r) => n + r.faqs.length, 0);
  console.log(`${rows.length} units · ${entries} entries · ${seen.size} patched -> ${outDir}/faq-00.json`);
}
main();

export {};
