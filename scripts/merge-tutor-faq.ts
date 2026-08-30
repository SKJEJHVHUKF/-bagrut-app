/**
 * merge-tutor-faq.ts — validate authored FAQ slices and emit the topic bank.
 *
 *   npx tsx scripts/merge-tutor-faq.ts --rows <rows.json> --in <dir> --out <content .ts> [--dry]
 *
 * Reads every `faq-*.json` in <dir> (each an array of { unit, faqs }), checks
 * each entry against the audit rows and the content gates, DROPS entries that
 * fail (reported by id, so the authoring loop can fix them), and writes the
 * survivors as a generated TS module. Exits non-zero when more than 5% of the
 * entries were dropped — a rate that high means the brief is wrong, not the
 * entry.
 *
 * Gates (the same ones the rule-line merge applies to solution steps):
 *   structure    unit exists in the audit · id = `${unit}#n` · step index in range
 *                · ≥5 alts, all distinct · answer 40–700 chars
 *   notation     balanced $ · no Hebrew inside $…$ · no lost backslash (bare
 *                `dfrac` in maths) · no university symbols · no maqaf glued to
 *                a maths island · no em-dash clause separators
 *   voice        opens on Hebrew (not `$`, not latin) · no {slot} holes
 *   leak         unless `reveals`, the answer must not contain the unit's
 *                final answer (lib/help-ladder.leaksAnswer)
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { leaksAnswer } from '../lib/help-ladder';
import { tokens } from '../lib/tutor-faq';
import { HELD_POSITIONS, type TutorFaq, type TutorFaqBank, type TutorFaqKind } from '../content/tutor-faq/types';

const argv = process.argv.slice(2);
const opt = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const ROWS = opt('--rows'); const IN = opt('--in'); const OUT = opt('--out'); const DRY = argv.includes('--dry');
/** `--file <one.json>` validates a single authored file (an agent's self-check)
 *  without seeing the other agents' files in the same directory. */
const FILE = opt('--file');
if (!ROWS || (!IN && !FILE) || (!OUT && !DRY)) {
  console.error('usage: --rows <rows.json> (--in <dir> | --file <one.json>) [--out <file.ts>] [--dry]');
  process.exit(1);
}

type Row = { unit: string; steps: string[]; finalAnswer: string };
const rows = new Map<string, Row>((JSON.parse(readFileSync(ROWS, 'utf8')) as Row[]).map((r) => [r.unit, r]));

const KINDS = new Set<TutorFaqKind>(['why-step', 'where-from', 'why-not', 'what-if', 'concept', 'mistake', 'check', 'other']);
const HEB = /[֐-׿]/;
const MATH_WORDS = ['dfrac', 'frac', 'cdot', 'binom', 'sqrt', 'approx', 'ldots', 'text', 'times', 'Rightarrow', 'quad', 'le', 'ge'];
const BANNED = /[∀∃∧∨⟺∅ℝℂ■]|\\(forall|exists|wedge|lor|iff|Leftrightarrow|mathbb|emptyset|setminus|blacksquare)\b/;

function mathSpans(s: string): string[] {
  const parts = s.split('$');
  const out: string[] = [];
  for (let i = 1; i < parts.length; i += 2) out.push(parts[i]);
  return out;
}

const problems: string[] = [];
const fail = (id: string, why: string) => problems.push(`${id}: ${why}`);

// A SEPARATE LIST, BECAUSE THIS IS NOT A REASON TO DROP AN ENTRY.
//
// Everything above is structural: a malformed entry is worse than no entry, so
// it goes. This is about whether an entry can ever be REACHED, which is not
// decidable from the entry alone — the real answer is a recall number over a
// whole bank, and that is test:faq's job.
//
// It earns its place anyway. Six trigonometry slices passed this script with
// "dropped 0" and then measured 19-35% recall: structurally perfect, silent in
// production. "dropped 0" read as success and nearly shipped ~600 dead
// entries. A merge that can only say "well-formed" must not be the last thing
// anyone looks at.
const unreachable: string[] = [];

function validate(unit: string, f: TutorFaq): boolean {
  const before = problems.length;
  const row = rows.get(unit);
  if (!row) { fail(f.id ?? unit, `unit "${unit}" is not in the audit rows`); return false; }
  if (typeof f.id !== 'string' || !f.id.startsWith(`${unit}#`)) fail(f.id ?? unit, `id must be "${unit}#n"`);
  if (!KINDS.has(f.kind)) fail(f.id, `unknown kind "${f.kind}"`);
  if (f.step !== undefined && (!Number.isInteger(f.step) || f.step < 0 || f.step >= row.steps.length))
    fail(f.id, `step ${f.step} out of range (unit has ${row.steps.length} steps)`);
  if (typeof f.q !== 'string' || f.q.trim().length < 4) fail(f.id, 'q missing');
  if (!Array.isArray(f.alts) || f.alts.length < 5) fail(f.id, `needs ≥5 alts (has ${f.alts?.length ?? 0})`);
  else {
    const norm = (s: string) => s.replace(/[?!.,\s]/g, '');
    const seen = new Set<string>([norm(f.q)]);
    for (const a of f.alts) {
      if (typeof a !== 'string' || a.trim().length < 3) { fail(f.id, 'empty alt'); continue; }
      if (seen.has(norm(a))) fail(f.id, `duplicate alt "${a}"`);
      seen.add(norm(a));
    }
  }
  // ---- can the entry be found by the alts the recall test hides? ----
  //
  // `matchFaq` scores each phrasing on its own and keeps the best, so a hidden
  // alt is found only if something still visible echoes it. Real tokens, from
  // the real tokenizer — `$…$` stripped, sub-2-char dropped — because a shared
  // vertex letter is not a shared word.
  if (Array.isArray(f.alts) && f.alts.length >= 5) {
    const visible = new Set(
      [f.q, ...f.alts.filter((_, i) => !HELD_POSITIONS.has(i))]
        .filter((t): t is string => typeof t === 'string')
        .flatMap(tokens),
    );
    for (const i of HELD_POSITIONS) {
      const alt = f.alts[i];
      if (typeof alt !== 'string') continue;
      if (!tokens(alt).some((t) => visible.has(t)))
        unreachable.push(`${f.id} alt[${i}] "${alt.slice(0, 46)}" shares no word with q or any kept alt`);
    }
  }

  const a = typeof f.a === 'string' ? f.a : '';
  if (a.length < 40) fail(f.id, `answer too short (${a.length})`);
  if (a.length > 700) fail(f.id, `answer too long (${a.length})`);
  if ((a.match(/\$/g) ?? []).length % 2) fail(f.id, 'odd number of $');
  if (BANNED.test(a)) fail(f.id, 'university notation');
  for (const span of mathSpans(a)) {
    if (HEB.test(span)) fail(f.id, `Hebrew inside $…$: "${span.slice(0, 40)}"`);
    for (const w of MATH_WORDS)
      if (new RegExp(`(^|[^a-zA-Z\\\\])${w}(?![a-zA-Z])`).test(span)) fail(f.id, `bare "${w}" in maths — lost backslash`);
  }
  if (/[א-ת]-\$/.test(a)) fail(f.id, 'maqaf glued to a maths island (reads as a minus)');
  if (/ [—–] /.test(a)) fail(f.id, 'em-dash used as a clause separator');
  const first = a.trimStart()[0] ?? '';
  if (first === '$' || /[A-Za-z0-9]/.test(first)) fail(f.id, `answer opens on "${first}" → bidi flip`);
  // Outside maths only — `\dfrac{1}{3}` is not a hole.
  if (/\{[a-zA-Z0-9]+\}/.test(a.replace(/\$[^$]*\$/g, ''))) fail(f.id, 'unfilled {slot}');
  if (!f.reveals && row.finalAnswer && leaksAnswer(a, row.finalAnswer)) fail(f.id, 'states the final answer without reveals:true');
  return problems.length === before;
}

const bank: TutorFaqBank = {};
let total = 0, kept = 0;
const files = FILE
  ? [FILE]
  : IN && existsSync(IN) ? readdirSync(IN).filter((f) => /^faq-.*\.json$/.test(f)).sort().map((f) => join(IN, f)) : [];
if (files.length === 0) { console.error(`no faq-*.json in ${IN ?? FILE}`); process.exit(1); }
for (const file of files) {
  let parsed: { unit: string; faqs: TutorFaq[] }[];
  try { parsed = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { problems.push(`${file}: not valid JSON — ${(e as Error).message.slice(0, 60)}`); continue; }
  if (!Array.isArray(parsed)) { problems.push(`${file}: expected an array of { unit, faqs }`); continue; }
  for (const { unit, faqs } of parsed) {
    if (!Array.isArray(faqs)) { problems.push(`${file}/${unit}: faqs is not an array`); continue; }
    const ids = new Set<string>();
    for (const f of faqs) {
      total++;
      if (ids.has(f.id)) { fail(f.id, 'duplicate id in unit'); continue; }
      ids.add(f.id);
      if (validate(unit, f)) {
        (bank[unit] ??= []).push({
          id: f.id, kind: f.kind, ...(f.step !== undefined ? { step: f.step } : {}),
          q: f.q.trim(), alts: f.alts.map((s) => s.trim()), a: f.a.trim(), ...(f.reveals ? { reveals: true } : {}),
        });
        kept++;
      }
    }
  }
}

const units = Object.keys(bank).sort();
const dropped = total - kept;
console.log(`\n${files.length} file(s) · ${total} entries · kept ${kept} · dropped ${dropped} · units ${units.length}/${rows.size}`);
const uncovered = [...rows.keys()].filter((u) => !bank[u]);
if (uncovered.length) console.log(`units without entries (${uncovered.length}): ${uncovered.slice(0, 8).join(', ')}${uncovered.length > 8 ? ' …' : ''}`);
if (unreachable.length) {
  const pct = ((unreachable.length / Math.max(1, total * HELD_POSITIONS.size)) * 100).toFixed(1);
  console.log();
  console.log(`!!  ${unreachable.length} held-out alt(s) (${pct}%) share no word with anything kept:`);
  for (const w of unreachable.slice(0, 12)) console.log(`  ! ${w}`);
  if (unreachable.length > 12) console.log(`  ... and ${unreachable.length - 12} more`);
  console.log();
  console.log('  These entries are well-formed and may still be unfindable. This is a');
  console.log('  lexical proxy, not the measurement - run `npm run test:faq` for the recall');
  console.log('  number, which is the one that decides. Nothing was dropped for it.');
}

if (problems.length) {
  console.log(`\nproblems (${problems.length}):`);
  for (const p of problems.slice(0, 40)) console.log(`  ✗ ${p}`);
  if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
}

if (!DRY && OUT) {
  const ordered: TutorFaqBank = {};
  for (const u of units) ordered[u] = bank[u];
  const body = JSON.stringify(ordered, null, 2);
  const src =
    `// GENERATED by scripts/merge-tutor-faq.ts — do not edit by hand.\n` +
    `// ${kept} entries across ${units.length} units. Re-run the merge to change.\n` +
    `import type { TutorFaqBank } from '../types';\n\n` +
    `const bank: TutorFaqBank = ${body};\n\nexport default bank;\n`;
  writeFileSync(OUT, src, 'utf8');
  console.log(`wrote ${OUT}`);
}
process.exit(total && dropped / total > 0.05 ? 1 : 0);
