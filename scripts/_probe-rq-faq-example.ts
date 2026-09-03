// Throwaway: dump one rq unit's FAQ entries as JSON, so the authoring brief can
// show the real shape. Run: npx tsx scripts/_probe-rq-faq-example.ts <unit> <out>
import { writeFileSync } from 'node:fs';
import bank from '../content/tutor-faq/math5/functions';

const [unit = 'rq-sub-dom-005', out = 'faq-example.json'] = process.argv.slice(2);
const entries = (bank as Record<string, unknown[]>)[unit];
writeFileSync(out, JSON.stringify([{ unit, faqs: entries }], null, 2), 'utf8');
console.log(`${unit}: ${entries?.length ?? 0} entries → ${out}`);
