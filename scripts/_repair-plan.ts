/**
 * _repair-plan.ts — for every unsafe cross-question transfer, work out which
 * tokens could actually separate the losing unit from the one stealing its
 * query, using the SAME tokeniser the matcher uses. Eyeballing this is how you
 * pick a word that tokenises to nothing. TEMP.
 *
 *   npx tsx scripts/_repair-plan.ts <bank.json> <unsafe.txt> <rows.json> [out]
 */
import { readFileSync, writeFileSync } from 'fs';
import { tokens } from '../lib/tutor-faq';
import { HELD_POSITIONS, type TutorFaqBank } from '../content/tutor-faq/types';

const bank: TutorFaqBank = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const unsafeRows = readFileSync(process.argv[3], 'utf8').split('\n').slice(2).filter(Boolean);
const rows: Array<Record<string, unknown>> = JSON.parse(readFileSync(process.argv[4], 'utf8'));
const out = process.argv[5] ?? '/tmp/trig-repair-plan.md';

const rowFor = (unit: string) => rows.find((r) => r.unit === unit);
/** Everything a student can see for this unit, as matcher tokens. */
function unitTokens(unit: string): Set<string> {
  const r = rowFor(unit);
  if (!r) return new Set();
  const text = [r.prompt, ...(Array.isArray(r.steps) ? r.steps : []), r.finalAnswer]
    .filter(Boolean)
    .join(' ');
  return new Set(tokens(String(text)));
}
/** Tokens already spent by this unit's OTHER entries — reusing one is safe. */
function entryTokens(unit: string, exceptId: string): Set<string> {
  const s = new Set<string>();
  for (const f of bank[unit] ?? []) {
    if (f.id === exceptId) continue;
    for (const p of [f.q, ...f.alts]) for (const t of tokens(p)) s.add(t);
  }
  return s;
}

const lines: string[] = [];
let n = 0;
for (const row of unsafeRows) {
  const [id, kind, score, stolen, heldAlt] = row.split('\t');
  const thiefId = (stolen ?? '').replace('STOLEN BY ', '').trim();
  const unit = id.split('#')[0];
  const thiefUnit = thiefId.split('#')[0];
  const faq = (bank[unit] ?? []).find((f) => f.id === id);
  if (!faq) continue;
  n += 1;

  const mine = unitTokens(unit);
  const theirs = unitTokens(thiefUnit);
  const heldToks = new Set(tokens(heldAlt ?? ''));
  // A good anchor: this unit's content has it, the thief's does not, and the
  // held alt is not already carrying it.
  const anchors = [...mine].filter((t) => !theirs.has(t) && !heldToks.has(t) && !t.startsWith('num:'));
  const numAnchors = [...mine].filter((t) => !theirs.has(t) && t.startsWith('num:'));

  const strip = (s: unknown) => String(s ?? '').replace(/\$[^$]*\$/g, ' ').replace(/\s+/g, ' ').trim();
  const myRow = rowFor(unit);
  const theirRow = rowFor(thiefUnit);
  const spent = entryTokens(unit, id);

  lines.push(`## ${n}. ${id} (${kind}, ${score}) — stolen by ${thiefId}`);
  lines.push(`MY  unit ${unit}: ${strip(myRow?.prompt).slice(0, 190)}`);
  lines.push(`HIS unit ${thiefUnit}: ${strip(theirRow?.prompt).slice(0, 150)}`);
  lines.push(`held alt : ${heldAlt}`);
  lines.push(`anchors  : ${anchors.slice(0, 14).join(' ')}`);
  lines.push(`num anch : ${numAnchors.slice(0, 6).join(' ')}`);
  lines.push(`safe-reuse (already in my other entries): ${anchors.filter((t) => spent.has(t)).slice(0, 10).join(' ')}`);
  lines.push(`q        : ${faq.q}`);
  faq.alts.forEach((a, i) =>
    lines.push(`  [${i}]${(HELD_POSITIONS as ReadonlySet<number>).has(i) ? '*' : ' '} ${a}`),
  );
  lines.push('');
}
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`wrote ${out} — ${n} offenders`);

export {};
