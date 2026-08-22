/**
 * apply-rule-lines.ts — prepend authored "**הכלל:**" steps into the content
 * source, deterministically.
 *
 * Input JSON: [{ where, anchor, rule }] where `anchor` is the CURRENT first
 * step string (runtime form) and `rule` is the new step to insert before it.
 * The anchor is re-escaped to its source form and matched literally, so a
 * mismatch is reported instead of silently patching the wrong array.
 *
 *   npx tsx scripts/apply-rule-lines.ts <rules.json> [--dry] [file ...]
 */
import { readFileSync, writeFileSync } from 'fs';

const DEFAULT_FILES = [
  'content/lessons/math5/sequences.ts',
  'content/lessons/math5/sequences-arithmetic.ts',
  'content/lessons/math5/sequences-geometric.ts',
  'content/lessons/math5/sequences-matkonet.ts',
];

type Item = { where: string; anchor: string; rule: string; anchor2?: string; near?: string };

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const jsonPath = args.find((a) => !a.startsWith('--'))!;
const files = args.filter((a) => !a.startsWith('--') && a !== jsonPath);
const targets = files.length ? files : DEFAULT_FILES;

const items: Item[] = JSON.parse(readFileSync(jsonPath, 'utf8'));
const texts = new Map(targets.map((f) => [f, readFileSync(f, 'utf8')]));

/** The three ways a string literal can be written in this codebase. */
function candidates(s: string): { open: string; lit: string }[] {
  const bs = s.replace(/\\/g, '\\\\');
  return [
    { open: "'", lit: `'${bs.replace(/'/g, "\\'")}'` },
    { open: '"', lit: `"${bs.replace(/"/g, '\\"')}"` },
    { open: '`', lit: `\`${bs.replace(/`/g, '\\`')}\`` },
  ];
}

function escapeFor(quote: string, s: string): string {
  const bs = s.replace(/\\/g, '\\\\');
  if (quote === "'") return `'${bs.replace(/'/g, "\\'")}'`;
  if (quote === '"') return `"${bs.replace(/"/g, '\\"')}"`;
  return `\`${bs.replace(/`/g, '\\`')}\``;
}

let applied = 0;
const problems: string[] = [];

for (const item of items) {
  let found: { file: string; idx: number; quote: string }[] = [];

  for (const [file, text] of texts) {
    for (const c of candidates(item.anchor)) {
      let from = 0;
      for (;;) {
        const i = text.indexOf(c.lit, from);
        if (i === -1) break;
        found.push({ file, idx: i, quote: c.open });
        from = i + 1;
      }
    }
  }

  // A hint often repeats the solution's first step verbatim. The rule line
  // belongs in `steps`, never in `hints`/`answers`, so drop hits whose nearest
  // enclosing array opener is not `steps: [`.
  if (found.length > 1) {
    const inSteps = found.filter(({ file, idx }) => {
      const before = texts.get(file)!.slice(Math.max(0, idx - 4000), idx);
      const opener = [...before.matchAll(/(steps|hints|answers|distractorNotes|bullets|keyPoints|summary)\s*:\s*\[/g)].pop();
      return opener?.[1] === 'steps';
    });
    if (inSteps.length >= 1) found = inSteps;
  }

  // Same first step in two solutions: the NEXT step disambiguates.
  if (found.length > 1 && item.anchor2) {
    const narrowed = found.filter(({ file, idx }) => {
      const window = texts.get(file)!.slice(idx, idx + 4000);
      return candidates(item.anchor2!).some((c) => window.includes(c.lit));
    });
    if (narrowed.length === 1) found = narrowed;
  }

  // Still ambiguous: the owning question's id sits above its own solution, so
  // the right hit is the one closest AFTER the nearest `id: '<qid>'`.
  if (found.length > 1 && item.near) {
    const scored = found
      .map((h) => {
        const owner = texts.get(h.file)!.lastIndexOf(`'${item.near}'`, h.idx);
        return { h, dist: owner === -1 ? Infinity : h.idx - owner };
      })
      .sort((a, b) => a.dist - b.dist);
    if (scored[0].dist !== Infinity && scored[0].dist !== scored[1]?.dist) found = [scored[0].h];
  }

  if (found.length === 0) { problems.push(`MISS  ${item.where} — anchor not found in source`); continue; }
  if (found.length > 1) { problems.push(`AMBIG ${item.where} — anchor matches ${found.length} places`); continue; }

  const { file: hitFile, idx: hitIdx, quote: hitQuote } = found[0];
  const text = texts.get(hitFile)!;
  // Reuse the indentation of the anchor line so the array keeps its shape.
  const lineStart = text.lastIndexOf('\n', hitIdx) + 1;
  const before = text.slice(lineStart, hitIdx);
  const sep = /^\s*$/.test(before) ? `,\n${before}` : ', ';
  const insert = `${escapeFor(hitQuote, item.rule)}${sep}`;

  texts.set(hitFile, text.slice(0, hitIdx) + insert + text.slice(hitIdx));
  applied++;
}

if (!dry) for (const [file, text] of texts) writeFileSync(file, text, 'utf8');

console.log(`${dry ? '[dry] ' : ''}applied ${applied}/${items.length}`);
for (const p of problems) console.log('  ' + p);
if (problems.length) process.exit(1);

export {};
