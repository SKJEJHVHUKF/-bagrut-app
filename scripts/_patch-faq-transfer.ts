// Repair unsafe cross-question transfer in ANY tutor FAQ bank.
//
// WHY THIS CAN BE MECHANICAL. `q` and `alts` are never rendered — lib/tutor-faq
// returns `hit.faq.a` and nothing else, and uses the phrasings only to build
// the match index. So an anchor appended to an alt is a MATCHING-KEY edit with
// no user-visible text, which is why a script is appropriate here and would not
// be for an answer.
//
// WHAT IT DOES. For each offender in unsafe.txt: find a word in the unit's OWN
// prompt whose matcher-token the thief's unit does not have, and append it to
// the held alt AND to its partner (alts[1]↔[0], alts[4]↔[3]) so the subset
// pairing that recall depends on survives.
//
// It edits the SLICE files, never the generated bank — the bank is rebuilt by
// merge-tutor-faq afterwards.
//
//   npx tsx scripts/_patch-faq-transfer.ts <sliceDir> <rows.json> <unsafe.txt> [--dry]
//
// Was hardcoded to one topic's .faq-work paths; parameterised 2026-08-30 when
// the same repair was needed for חשבון דיפרנציאלי. 11 topics still have no bank.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tokens } from '../lib/tutor-faq';
import { HELD_POSITIONS } from '../content/tutor-faq/types';

const DRY = process.argv.includes('--dry');
const [OUT_DIR, ROWS_PATH, UNSAFE_PATH] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!OUT_DIR || !ROWS_PATH || !UNSAFE_PATH) {
  console.error('usage: _patch-faq-transfer.ts <sliceDir> <rows.json> <unsafe.txt> [--dry]');
  process.exit(1);
}
/** Only the fields this patcher reads out of the dumped rows / FAQ slices;
 *  both files carry more, and none of the rest is touched here. */
type Row = { unit: string; question?: string; context?: string; partPrompt?: string; prompt?: string; steps?: string[]; finalAnswer?: string };
type FaqEntry = { id: string; alts: string[]; [k: string]: unknown };
type SliceRow = { unit: string; faqs?: FaqEntry[] };

const ROWS = JSON.parse(readFileSync(ROWS_PATH, 'utf8')) as Row[];
const rowFor = (u: string) => ROWS.find((r) => r.unit === u);

/** Everything a student can see for a unit, as one string. */
function unitText(u: string): string {
  const r = rowFor(u);
  if (!r) return '';
  return [r.question, r.context, r.partPrompt, r.prompt, ...(r.steps ?? []), r.finalAnswer]
    .filter(Boolean)
    .join(' ');
}

const unsafe = readFileSync(UNSAFE_PATH, 'utf8')
  .split('\n')
  .slice(2)
  .filter(Boolean)
  .map((l) => {
    const [id, kind, score, stolen, held] = l.split('\t');
    return { id, kind, score, thief: (stolen ?? '').replace('STOLEN BY ', '').trim(), held: (held ?? '').trim() };
  });

// Load every slice file, keyed for editing.
const files = readdirSync(OUT_DIR).filter((f) => /^faq-\d+\.json$/.test(f)).sort();
const slices = new Map<string, SliceRow[]>();
for (const f of files) slices.set(f, JSON.parse(readFileSync(`${OUT_DIR}/${f}`, 'utf8')));

const findEntry = (id: string) => {
  const unit = id.split('#')[0];
  for (const [f, rows] of slices) {
    const row = rows.find((r) => r.unit === unit);
    const e = row?.faqs?.find((x) => x.id === id);
    if (e) return { file: f, row, entry: e, unit };
  }
  return null;
};

let patched = 0;
const skipped: string[] = [];
const used = new Map<string, Set<string>>(); // unit → anchors already spent

for (const u of unsafe) {
  const found = findEntry(u.id);
  if (!found) { skipped.push(`${u.id}: entry not found`); continue; }
  const { entry, unit } = found;

  const held = entry.alts.findIndex((a) => a.trim() === u.held);
  if (held < 0) { skipped.push(`${u.id}: held alt not found in alts`); continue; }
  if (!HELD_POSITIONS.has(held)) { skipped.push(`${u.id}: alt ${held} is not a held position`); continue; }
  const partner = held === 1 ? 0 : 3;

  // Candidate anchors: words from MY unit's own text whose token the thief lacks.
  const thiefTokens = new Set(tokens(unitText(u.thief.split('#')[0])));
  const spent = used.get(unit) ?? new Set<string>();
  const mine = unitText(unit);
  const words = [...new Set(mine.replace(/\$[^$]*\$/g, ' ').split(/[^֐-ת]+/).filter((w) => w.length >= 3))];
  const anchor = words.find((w) => {
    const t = tokens(w);
    if (!t.length) return false;
    if (t.some((x) => thiefTokens.has(x))) return false;
    if (spent.has(w)) return false;
    // must not already be in this alt pair
    const cur = new Set([...tokens(entry.alts[held]), ...tokens(entry.alts[partner])]);
    return !t.some((x) => cur.has(x));
  });
  if (!anchor) { skipped.push(`${u.id}: no separating word available`); continue; }

  spent.add(anchor);
  used.set(unit, spent);
  entry.alts[held] = `${entry.alts[held]} ${anchor}`;
  entry.alts[partner] = `${entry.alts[partner]} ${anchor}`;
  patched++;
  console.log(`  ${u.id.padEnd(24)} +${anchor.padEnd(14)} (thief ${u.thief})`);
}

console.log(`\npatched ${patched}/${unsafe.length}${DRY ? ' (dry run)' : ''}`);
if (skipped.length) console.log(`skipped ${skipped.length}:\n  ${skipped.slice(0, 12).join('\n  ')}`);
if (!DRY) {
  for (const [f, rows] of slices) writeFileSync(`${OUT_DIR}/${f}`, JSON.stringify(rows, null, 1), 'utf8');
  console.log(`rewrote ${slices.size} slice files`);
}
