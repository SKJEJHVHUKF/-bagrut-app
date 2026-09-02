/**
 * _dump-faq-as-slice.ts — re-emit an existing FAQ bank in AUTHORING shape.
 *
 *   npx tsx scripts/_dump-faq-as-slice.ts <topic> <out.json>
 *
 * WHY THIS EXISTS. `merge-tutor-faq` does not merge into the bank it writes —
 * it OVERWRITES the output module with exactly the entries found in `--in`.
 * So running it with only the new slices would silently delete every unit
 * banked in an earlier round: the file would be rewritten, the gate would say
 * "kept N/N, 0 drops", and the loss would look like a success.
 *
 * `_dump-trig-faq.ts` already dumps a bank, but in RUNTIME shape
 * (`Record<unit, TutorFaq[]>`, which is what test-tutor-faq consumes). The
 * merge reads AUTHORING shape (`[{ unit, faqs }]`). This converts, so the old
 * round can sit in the input directory beside the new one and the merge sees
 * the whole topic.
 */
import { writeFileSync } from 'node:fs';
import { loadFaqBank } from '../content/tutor-faq';

const topic = process.argv[2];
const out = process.argv[3];
if (!topic || !out) {
  console.error('usage: npx tsx scripts/_dump-faq-as-slice.ts <topic> <out.json>');
  process.exit(1);
}

async function main() {
  const bank = await loadFaqBank('math5', topic);
  if (!bank) throw new Error(`no bank registered for ${topic}`);
  const rows = Object.entries(bank).map(([unit, faqs]) => ({ unit, faqs }));
  const entries = rows.reduce((n, r) => n + r.faqs.length, 0);
  writeFileSync(out, JSON.stringify(rows, null, 1), 'utf8');
  console.log(`${topic}: ${entries} entries across ${rows.length} units -> ${out}`);
}

main();

export {};
