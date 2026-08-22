/**
 * merge-rule-lines.ts — assemble the authored rule lines into the item list
 * that apply-rule-lines.ts consumes, and reject anything malformed BEFORE it
 * reaches the content source.
 *
 *   npx tsx scripts/merge-rule-lines.ts <scratchpad-dir>
 *
 * Reads <sp>/sequences-rows.json plus <sp>/out/final-*.json (falling back to
 * <sp>/out/<slice>.json when the review pass produced nothing) and writes
 * <sp>/items.json. Exits non-zero on any structural problem.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';

const RULE = '**הכלל:**';
const HEB = /[֐-׿]/;
const MATH_WORDS = ['dfrac', 'frac', 'cdot', 'binom', 'sqrt', 'approx', 'ldots', 'text', 'times', 'Rightarrow', 'quad', 'Longrightarrow', 'le', 'ge'];
const BANNED = /[∀∃∧∨⟺∅ℝℂ■]|\\(forall|exists|wedge|lor|iff|Leftrightarrow|mathbb|emptyset|setminus|blacksquare)\b/;

const sp = process.argv[2];
const rowsFile = process.argv[3] ?? `${sp}/sequences-rows.json`;
const rows: { where: string; steps: string[]; hint: string }[] = JSON.parse(readFileSync(rowsFile, 'utf8'));

const manifest: { name: string }[] = JSON.parse(readFileSync(`${sp}/manifest.json`, 'utf8'));
const byWhere = new Map<string, string>();
const sources: string[] = [];

for (const { name } of manifest) {
  const fin = `${sp}/out/final-${name}.json`;
  const raw = `${sp}/out/${name}.json`;
  const path = existsSync(fin) ? fin : existsSync(raw) ? raw : '';
  if (!path) { console.log(`  ✗ no output for ${name}`); continue; }
  sources.push(`${path.endsWith(`final-${name}.json`) ? 'reviewed' : 'RAW     '}  ${name}`);
  for (const e of JSON.parse(readFileSync(path, 'utf8')) as { where: string; rule: string }[]) {
    if (byWhere.has(e.where)) console.log(`  ! duplicate entry for ${e.where} (last wins)`);
    byWhere.set(e.where, e.rule);
  }
}

// The dash pass (maqaf-on-math + em-dash clause separators) runs after the
// review pass, so its lines win wherever it produced one.
let dashed = 0;
if (existsSync(`${sp}/dash`)) {
  for (const f of readdirSync(`${sp}/dash`).filter((f) => f.startsWith('out-'))) {
    for (const e of JSON.parse(readFileSync(`${sp}/dash/${f}`, 'utf8')) as { where: string; rule: string }[]) {
      if (byWhere.has(e.where)) { byWhere.set(e.where, e.rule); dashed++; }
    }
  }
}

console.log(readdirSync(`${sp}/out`).length + ' output files\n' + sources.join('\n') + `\ndash pass overrode ${dashed} lines\n`);

let bad = 0;
const fail = (w: string, m: string, d = '') => { bad++; console.log(`  ✗ ${w} — ${m}${d ? `\n      «${d.slice(0, 120)}»` : ''}`); };

function mathSpans(line: string): string[] {
  const spans: string[] = [];
  line.replace(/\$([^$\n]+?)\$/g, (_m, g: string) => (spans.push(g), ' '));
  return spans;
}

const items: { where: string; anchor: string; anchor2?: string; near: string; rule: string }[] = [];

for (const r of rows) {
  const rule = byWhere.get(r.where);
  if (!rule) { fail(r.where, 'MISSING — no rule line was authored'); continue; }
  if (!rule.trim().startsWith(RULE)) { fail(r.where, 'does not open with the rule marker', rule); continue; }

  const body = rule.trim().slice(RULE.length).trim();
  if (body.length < 40) fail(r.where, `body too short (${body.length} chars) — cramped`, rule);
  if (body.length > 320) fail(r.where, `body too long (${body.length} chars)`, rule);
  if ((rule.match(/\$/g) ?? []).length % 2 !== 0) fail(r.where, 'odd number of $ — unclosed math span', rule);
  if (BANNED.test(rule)) fail(r.where, 'university notation — banned in תיכון content', rule);
  if (/\bP\(([nk]|k\s*\+\s*1)\)/.test(rule)) fail(r.where, 'P(n) proposition notation in induction', rule);

  for (const span of mathSpans(rule)) {
    if (HEB.test(span)) fail(r.where, 'Hebrew inside $…$ — renders reversed', span);
    for (const w of MATH_WORDS) {
      if (new RegExp(`(^|[^a-zA-Z\\\\])${w}(?![a-zA-Z])`).test(span)) fail(r.where, `bare "${w}" — a lost backslash`, span);
    }
  }

  if (r.hint && body.replace(/\s/g, '') === r.hint.replace(/\s/g, '')) fail(r.where, 'restates the hint verbatim', rule);

  // RTL dash clutter: a maqaf touching a math island, or an em-dash used as a
  // clause separator, both read as a minus sign next to real minus signs.
  const maqaf = body.match(/[א-ת]-\$/g);
  if (maqaf) fail(r.where, `maqaf glued to a math island (${maqaf.length}x) — reads as a minus`, rule);
  if (/ [—–] /.test(body)) fail(r.where, 'em-dash used as a clause separator', rule);

  items.push({
    where: r.where,
    anchor: r.steps[0],
    anchor2: r.steps[1] || undefined,
    near: r.where.split('/')[0],
    rule: rule.trim(),
  });
}

const extra = [...byWhere.keys()].filter((w) => !rows.some((r) => r.where === w));
for (const w of extra) fail(w, 'authored for a `where` that is not in the audit — typo?');

writeFileSync(`${sp}/items.json`, JSON.stringify(items, null, 1), 'utf8');
console.log(`\n${items.length}/${rows.length} rule lines ready; ${bad} problem(s).`);
if (bad > 0) process.exit(1);

export {};
