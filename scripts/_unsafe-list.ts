/**
 * _unsafe-list.ts — list EVERY unsafe cross-question transfer in one bank, so a
 * repair pass gets a worklist instead of the 5 the gate prints. TEMP.
 *
 *   npx tsx scripts/_unsafe-list.ts <bank.json> [outfile]
 *
 * Mirrors scripts/test-tutor-faq.ts exactly: same group(), same TRANSFERABLE
 * kinds, same near-pool, same TRANSFER_OPTS, same pointsAtThisExercise screen,
 * same mentionsForeignNumber exclusion. If this disagrees with the gate the
 * gate is right and this is wrong.
 */
import { readFileSync, writeFileSync } from 'fs';
import {
  buildCorpusIdf, buildFaqIndex, matchFaq,
  FAQ_TRANSFER_THRESHOLD, mentionsForeignNumber, pointsAtThisExercise,
} from '../lib/tutor-faq';
import { HELD_POSITIONS, type TutorFaq, type TutorFaqBank } from '../content/tutor-faq/types';

const file = process.argv[2];
const out = process.argv[3];
if (!file) { console.error('usage: _unsafe-list.ts <bank.json> [outfile]'); process.exit(2); }

const raw = JSON.parse(readFileSync(file, 'utf8'));
const bank: TutorFaqBank = Array.isArray(raw)
  ? Object.fromEntries(raw.map((r: { unit: string; faqs: TutorFaq[] }) => [r.unit, r.faqs]))
  : raw;

function group(unit: string): string {
  const u = unit.replace(/\/.*$/, '');
  const g = u.replace(/[-_]?\d+$/, '');
  return g.includes('-') ? g : u;
}
const TRANSFERABLE = new Set(['concept', 'mistake', 'check']);
const heldAlts = (f: TutorFaq) => f.alts.filter((_, i) => HELD_POSITIONS.has(i));

const units = Object.entries(bank).filter(([, f]) => f.length > 0);
const topicIdf = buildCorpusIdf(
  units.flatMap(([, fs]) => fs.flatMap((f) => [f.q, ...f.alts.filter((_, i) => !HELD_POSITIONS.has(i))])),
);

const TRANSFER_OPTS = { threshold: FAQ_TRANSFER_THRESHOLD, minContentMatches: 2 };
const rows: string[] = [];
let total = 0, unsafe = 0;

for (const [unit, faqs] of units) {
  const near = units.filter(([u]) => u !== unit && group(u) === group(unit));
  const pool = near.flatMap(([, fs]) => fs.filter((f) => TRANSFERABLE.has(f.kind)));
  if (!pool.length) continue;
  const index = buildFaqIndex(pool, { idf: topicIdf });
  const ownText = faqs.map((f) => `${f.q} ${f.a}`).join(' ');

  for (const f of faqs) {
    if (TRANSFERABLE.has(f.kind)) continue;
    for (const alt of heldAlts(f)) {
      total++;
      if (pointsAtThisExercise(alt)) continue;
      const hit = matchFaq(index, alt, TRANSFER_OPTS);
      if (hit && !mentionsForeignNumber(hit.faq.a, ownText)) {
        unsafe++;
        rows.push(`${f.id}\t${f.kind}\t${hit.score.toFixed(2)}\tSTOLEN BY ${hit.faq.id}\t${alt}`);
      }
    }
  }
}

const header = `unsafe ${unsafe}/${total} = ${((unsafe / total) * 100).toFixed(1)}%\n` +
  `id\tkind\tscore\tstolen-by\theld-alt that needs a unique token\n`;
const body = header + rows.join('\n') + '\n';
if (out) { writeFileSync(out, body, 'utf8'); console.log(`${header.trim()}\nwrote ${out} (${rows.length} rows)`); }
else console.log(body);
