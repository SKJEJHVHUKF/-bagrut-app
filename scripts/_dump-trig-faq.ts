// Dump one topic's FAQ bank as JSON so test-tutor-faq can be pointed at it
// alone — the gate reports aggregates across every registered bank, which hides
// whether any single topic is carrying or being carried.
import { writeFileSync } from 'node:fs';
import { loadFaqBank } from '../content/tutor-faq';

const topic = process.argv[2] ?? 'טריגונומטריה';
const out = process.argv[3] ?? '/tmp/trig-bank.json';

async function main() {
  const bank = await loadFaqBank('math5', topic);
  if (!bank) throw new Error(`no bank registered for ${topic}`);

  const units = Object.keys(bank).length;
  const entries = Object.values(bank).reduce((n, f) => n + f.length, 0);
  writeFileSync(out, JSON.stringify(bank), 'utf8');
  console.log(`${topic}: ${entries} entries across ${units} units -> ${out}`);
}
main();

export {};
