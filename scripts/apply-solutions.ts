/**
 * apply-solutions.ts — write authored solution rewrites into the content
 * source, deterministically: replace the whole `steps: [...]` array, the final
 * answer literal next to it, and append a ```geo figure to the prompt text.
 *
 * Input: items.json from merge-solutions.ts. Each item's `anchor` is the
 * CURRENT first step (runtime form); it is re-escaped to its source form and
 * matched literally, so a mismatch is reported instead of silently patching
 * the wrong array. Disambiguation mirrors apply-rule-lines.ts (steps-not-hints,
 * then the second step, then proximity to the owning id).
 *
 *   npx tsx scripts/apply-solutions.ts <items.json> [--dry] <file ...>
 */
import { readFileSync, writeFileSync } from 'fs';

type TextPatch = { key: 'question' | 'context' | 'prompt' | 'hint'; from: string; to: string };
type Item = {
  where: string; kind: string; anchor: string; anchor2?: string; near: string;
  steps: string[]; finalAnswer?: string;
  /** literal replacements for the text around the solution (question / context / prompt / hint),
   *  each located as the nearest occurrence BEFORE the steps array */
  texts: TextPatch[];
  /** bagrut parts: replace the whole `hints: [...]` array, found by its current first hint */
  hintsArray?: { firstFrom: string; to: string[] };
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const [jsonPath, ...files] = args.filter((a) => !a.startsWith('--'));
if (!jsonPath || !files.length) { console.error('usage: apply-solutions.ts <items.json> [--dry] <file ...>'); process.exit(2); }

const items: Item[] = JSON.parse(readFileSync(jsonPath, 'utf8'));
const texts = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

/** Source form of a runtime string in each of the three quote styles. */
function escapeFor(quote: string, s: string): string {
  const bs = s.replace(/\\/g, '\\\\');
  if (quote === "'") return `'${bs.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  if (quote === '"') return `"${bs.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  return `\`${bs.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}
const QUOTES = ["'", '"', '`'];

/** All source occurrences of a runtime string as a complete literal. */
function findLiteral(text: string, s: string): { idx: number; end: number; quote: string }[] {
  const hits: { idx: number; end: number; quote: string }[] = [];
  for (const q of QUOTES) {
    const lit = escapeFor(q, s);
    let from = 0;
    for (;;) {
      const i = text.indexOf(lit, from);
      if (i === -1) break;
      hits.push({ idx: i, end: i + lit.length, quote: q });
      from = i + 1;
    }
  }
  return hits;
}

/** Index just past the closing quote of the literal opening at `open`. */
function literalEnd(text: string, open: number): number {
  const q = text[open];
  for (let i = open + 1; i < text.length; i++) {
    if (text[i] === '\\') { i++; continue; }
    if (text[i] === q) return i + 1;
  }
  throw new Error('unterminated literal');
}

/** Bounds of the `<key>: [ … ]` array that contains position `at`. */
function stepsArray(text: string, at: number, key = 'steps'): { open: number; close: number } {
  const before = text.slice(Math.max(0, at - 6000), at);
  const m = [...before.matchAll(new RegExp(`${key}\\s*:\\s*\\[`, 'g'))].pop();
  if (!m) throw new Error(`no ${key}: [ before anchor`);
  const open = Math.max(0, at - 6000) + m.index! + m[0].length - 1;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') { i = literalEnd(text, i) - 1; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return { open, close: i }; }
  }
  throw new Error('unterminated steps array');
}

let applied = 0, figures = 0, answers = 0, textPatches = 0;
const problems: string[] = [];

// Apply from the END of each file backwards so earlier offsets stay valid.
type Hit = { file: string; idx: number; quote: string };
const plan: { item: Item; hit: Hit }[] = [];

for (const item of items) {
  let found: Hit[] = [];
  for (const [file, text] of texts) for (const h of findLiteral(text, item.anchor)) found.push({ file, idx: h.idx, quote: h.quote });

  if (found.length > 1) {
    const inSteps = found.filter(({ file, idx }) => {
      const before = texts.get(file)!.slice(Math.max(0, idx - 4000), idx);
      const opener = [...before.matchAll(/(steps|hints|answers|distractorNotes|bullets|keyPoints|summary)\s*:\s*\[/g)].pop();
      return opener?.[1] === 'steps';
    });
    if (inSteps.length >= 1) found = inSteps;
  }
  if (found.length > 1 && item.anchor2) {
    const narrowed = found.filter(({ file, idx }) => {
      const win = texts.get(file)!.slice(idx, idx + 4000);
      return QUOTES.some((q) => win.includes(escapeFor(q, item.anchor2!)));
    });
    if (narrowed.length === 1) found = narrowed;
  }
  if (found.length > 1 && item.near) {
    const scored = found.map((h) => {
      const owner = texts.get(h.file)!.lastIndexOf(`'${item.near}'`, h.idx);
      return { h, dist: owner === -1 ? Infinity : h.idx - owner };
    }).sort((a, b) => a.dist - b.dist);
    if (scored[0].dist !== Infinity && scored[0].dist !== scored[1]?.dist) found = [scored[0].h];
  }
  if (found.length === 0) { problems.push(`MISS  ${item.where} — anchor not found in source`); continue; }
  if (found.length > 1) { problems.push(`AMBIG ${item.where} — anchor matches ${found.length} places`); continue; }
  plan.push({ item, hit: found[0] });
}

plan.sort((a, b) => (a.hit.file === b.hit.file ? b.hit.idx - a.hit.idx : a.hit.file < b.hit.file ? -1 : 1));

for (const { item, hit } of plan) {
  let text = texts.get(hit.file)!;
  try {
    const { open, close } = stepsArray(text, hit.idx);
    const lineStart = text.lastIndexOf('\n', hit.idx) + 1;
    const indent = text.slice(lineStart, hit.idx).match(/^\s*/)![0];
    const closeIndent = indent.slice(0, Math.max(0, indent.length - 2));
    const body = `\n${item.steps.map((s) => indent + escapeFor(hit.quote, s)).join(',\n')},\n${closeIndent}`;

    // Final answer: the literal that follows the array (finalAnswer / final_answer / answer).
    let tail = text.slice(close + 1);
    if (item.finalAnswer !== undefined) {
      const m = tail.slice(0, 600).match(/(finalAnswer|final_answer|answer)\s*:\s*(['"`])/);
      if (!m) problems.push(`NOANS ${item.where} — no answer literal after the steps array`);
      else {
        const litStart = m.index! + m[0].length - 1;
        const litEnd = literalEnd(tail, litStart);
        tail = tail.slice(0, litStart) + escapeFor(m[2], item.finalAnswer) + tail.slice(litEnd);
        answers++;
      }
    }
    text = text.slice(0, open + 1) + body + ']' + tail;

    // Text around the solution: each patch replaces the literal nearest BEFORE
    // the steps array (located on the text as it was, all at once), and only
    // if it sits on the expected key. Applied from the highest offset down, so
    // the earlier offsets stay valid.
    type Located = { idx: number; end: number; quote: string; apply: (t: string, h: { idx: number; end: number; quote: string }) => string | null };
    const located: Located[] = [];
    for (const p of item.texts) {
      const hits = findLiteral(text, p.from).filter((h) => h.idx < open);
      const h = hits[hits.length - 1];
      if (!h) { problems.push(findLiteral(text, p.to).length ? `DUP   ${item.where} — ${p.key} already patched` : `NOTEXT ${item.where} — ${p.key} literal not found before the solution`); continue; }
      const key = text.slice(Math.max(0, h.idx - 24), h.idx);
      if (!new RegExp(`${p.key}\\s*:\\s*$`).test(key)) { problems.push(`BADKEY ${item.where} — ${p.key} literal sits on «${key.trim().slice(-20)}»`); continue; }
      located.push({ ...h, apply: (t, hh) => { if (p.to.includes('```geo')) figures++; return t.slice(0, hh.idx) + escapeFor(hh.quote, p.to) + t.slice(hh.end); } });
    }
    if (item.hintsArray) {
      const hits = findLiteral(text, item.hintsArray.firstFrom).filter((h) => h.idx < open);
      const h = hits[hits.length - 1];
      if (!h) problems.push(`NOHINTS ${item.where} — first hint literal not found before the solution`);
      else {
        const to = item.hintsArray.to;
        located.push({ ...h, apply: (t, hh) => {
          const arr = stepsArray(t, hh.idx, 'hints');
          const ls = t.lastIndexOf('\n', hh.idx) + 1;
          const ind = t.slice(ls, hh.idx).match(/^\s*/)![0];
          return t.slice(0, arr.open + 1) + `\n${to.map((s) => ind + escapeFor(hh.quote, s)).join(',\n')},\n${ind.slice(0, Math.max(0, ind.length - 2))}` + t.slice(arr.close);
        } });
      }
    }
    located.sort((a, b) => b.idx - a.idx);
    for (const l of located) { const t = l.apply(text, l); if (t !== null) { text = t; textPatches++; } }
    texts.set(hit.file, text);
    applied++;
  } catch (e) {
    problems.push(`ERR   ${item.where} — ${(e as Error).message}`);
  }
}

if (!dry) for (const [file, text] of texts) writeFileSync(file, text, 'utf8');
console.log(`${dry ? '[dry] ' : ''}applied ${applied}/${items.length} solutions, ${answers} answers, ${textPatches} text patches (${figures} with a figure)`);
for (const p of problems) console.log('  ' + p);
if (problems.length) process.exit(1);

export {};
