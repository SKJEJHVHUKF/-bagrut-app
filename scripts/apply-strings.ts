/**
 * apply-strings.ts — write authored phrasing rewrites into the content source
 * by exact string-literal replacement.
 *
 *   npx tsx scripts/apply-strings.ts <string-items.json> [--dry]
 *
 * Each item carries its own target file. Literals are matched in all three
 * quote styles with the source escaping re-applied. LONGEST NEEDLE FIRST: a
 * short string is often the opening line of a longer template literal, and
 * patching the short one first orphans the long one (measured on הסתברות).
 * A needle that appears more than once is patched everywhere ONLY when every
 * occurrence is the same literal; otherwise it is reported, never guessed.
 */
import { readFileSync, writeFileSync } from 'fs';

type Item = { file: string; from: string; to: string; where: string };

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const jsonPath = args.find((a) => !a.startsWith('--'));
if (!jsonPath) { console.error('usage: apply-strings.ts <string-items.json> [--dry]'); process.exit(2); }

const items: Item[] = JSON.parse(readFileSync(jsonPath, 'utf8'));
const files = [...new Set(items.map((i) => i.file))];
const texts = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

/** The three ways this codebase writes a string literal. */
function literals(s: string): { q: string; lit: string }[] {
  const bs = s.replace(/\\/g, '\\\\');
  return [
    { q: "'", lit: `'${bs.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'` },
    { q: '"', lit: `"${bs.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"` },
    { q: '`', lit: `\`${bs.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`` },
  ];
}
function escapeFor(q: string, s: string): string {
  const bs = s.replace(/\\/g, '\\\\');
  if (q === "'") return `'${bs.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  if (q === '"') return `"${bs.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  return `\`${bs.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}

let applied = 0, multi = 0;
const problems: string[] = [];

// Longest needle first — see the header.
for (const item of [...items].sort((a, b) => b.from.length - a.from.length)) {
  const text = texts.get(item.file)!;
  const hits = literals(item.from)
    .map((c) => ({ ...c, n: text.split(c.lit).length - 1 }))
    .filter((c) => c.n > 0);

  if (!hits.length) {
    const already = literals(item.to).some((c) => text.includes(c.lit));
    problems.push(already ? `DUP   ${item.where} — already patched` : `MISS  ${item.where} — literal not found in ${item.file}`);
    continue;
  }
  if (hits.length > 1) { problems.push(`QUOTE ${item.where} — matches in ${hits.length} quote styles, ambiguous`); continue; }

  const { q, lit, n } = hits[0];
  if (n > 1) multi++;
  texts.set(item.file, text.split(lit).join(escapeFor(q, item.to)));
  applied++;
}

if (!dry) for (const [f, t] of texts) writeFileSync(f, t, 'utf8');
console.log(`${dry ? '[dry] ' : ''}applied ${applied}/${items.length} rewrites across ${files.length} file(s)${multi ? ` (${multi} appeared more than once and were patched everywhere)` : ''}`);
for (const p of problems) console.log('  ' + p);
if (problems.length) process.exit(1);

export {};
