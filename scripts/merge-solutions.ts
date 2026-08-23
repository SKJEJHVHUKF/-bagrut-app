/**
 * merge-solutions.ts — assemble the authored solution rewrites (rule line +
 * line-by-line steps + figures) into the item list apply-solutions.ts consumes,
 * rejecting anything malformed BEFORE it reaches the content source.
 *
 *   npx tsx scripts/merge-solutions.ts <workdir>
 *
 * Reads <wd>/rows.json (from audit-solutions.ts), <wd>/manifest.json
 * ([{name}]) and <wd>/out/final-<name>.json (falling back to <wd>/out/<name>.json),
 * writes <wd>/items.json. Exits non-zero on any problem.
 *
 * Entry shape: { where, steps: string[], finalAnswer?: string, figure?: GeoSpec|null }
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { leaksAnswer } from '../lib/help-ladder';
import { checkGeoFences, validateGeo, type GeoSpec } from '../lib/geo-figure';

const RULE = '**הכלל:**';
const HEB = /[֐-׿]/;
const MATH_WORDS = ['dfrac', 'frac', 'cdot', 'binom', 'sqrt', 'approx', 'ldots', 'text', 'times', 'Rightarrow', 'quad', 'Longrightarrow', 'le', 'ge', 'angle', 'triangle', 'parallel', 'perp', 'cong', 'sim', 'tfrac', 'sqrt'];
const BANNED = /[∀∃∧∨⟺∅ℝℂ■]|\\(forall|exists|wedge|lor|iff|Leftrightarrow|mathbb|emptyset|setminus|blacksquare)\b/;

type Row = { where: string; kind: string; steps: string[]; hint: string; hints?: string[]; finalAnswer: string; prompt: string; context?: string; partPrompt?: string };
type Entry = {
  where: string; steps: string[]; finalAnswer?: string; figure?: GeoSpec | null;
  /** optional rewrites of the student-facing text around the solution */
  prompt?: string; hint?: string; hints?: string[]; context?: string;
};
/** One literal replacement located before the solution's steps array. */
type TextPatch = { key: 'question' | 'context' | 'prompt' | 'hint'; from: string; to: string };
type Item = {
  where: string; kind: string; anchor: string; anchor2?: string; near: string;
  steps: string[]; finalAnswer?: string; texts: TextPatch[]; hintsArray?: { firstFrom: string; to: string[] };
};

const wd = process.argv[2];
if (!wd) { console.error('usage: merge-solutions.ts <workdir> [--file <out.json>]'); process.exit(2); }
// --file: validate ONE authored file on its own (the authoring agents' self-check);
// rows it does not cover are not "missing" and no items.json is written.
const oneFile = process.argv.includes('--file') ? process.argv[process.argv.indexOf('--file') + 1] : '';
const allRows: Row[] = JSON.parse(readFileSync(`${wd}/rows.json`, 'utf8'));
const manifest: { name: string }[] = oneFile ? [] : JSON.parse(readFileSync(`${wd}/manifest.json`, 'utf8'));

const byWhere = new Map<string, Entry>();
if (oneFile) for (const e of JSON.parse(readFileSync(oneFile, 'utf8')) as Entry[]) byWhere.set(e.where, e);
const rows = oneFile ? allRows.filter((r) => byWhere.has(r.where)) : allRows;
for (const { name } of manifest) {
  const fin = `${wd}/out/final-${name}.json`, raw = `${wd}/out/${name}.json`;
  const path = existsSync(fin) ? fin : existsSync(raw) ? raw : '';
  if (!path) { console.log(`  ✗ no output for ${name}`); continue; }
  console.log(`  ${path.endsWith(`final-${name}.json`) ? 'reviewed' : 'RAW     '}  ${name}`);
  for (const e of JSON.parse(readFileSync(path, 'utf8')) as Entry[]) {
    if (byWhere.has(e.where)) console.log(`  ! duplicate entry for ${e.where} (last wins)`);
    byWhere.set(e.where, e);
  }
}

let bad = 0;
const fail = (w: string, m: string, d = '') => { bad++; console.log(`  ✗ ${w} — ${m}${d ? `\n      «${d.slice(0, 140)}»` : ''}`); };

const stripFences = (s: string) => s.replace(/```geo\s*\n[\s\S]*?```/g, '').trim();
function mathSpans(line: string): string[] {
  const spans: string[] = [];
  line.replace(/\$\$([\s\S]*?)\$\$/g, (_m, g: string) => (spans.push(g), ' ')).replace(/\$([^$\n]+?)\$/g, (_m, g: string) => (spans.push(g), ' '));
  return spans;
}

/** The string-level rules every student-visible line must pass. */
function checkLine(w: string, label: string, raw: string, opts: { maxLen?: number } = {}) {
  const s = stripFences(raw);
  if ((s.replace(/\\\$/g, '').match(/\$/g) ?? []).length % 2 !== 0) fail(w, `${label}: odd number of $ — unclosed math`, s);
  if (BANNED.test(s)) fail(w, `${label}: university notation — banned in תיכון content`, s);
  if (/\\text\{[^}]*[֐-׿]/.test(s)) fail(w, `${label}: Hebrew inside \\text{} — renders reversed`, s);
  for (const span of mathSpans(s)) {
    if (HEB.test(span)) fail(w, `${label}: Hebrew inside $…$ — renders reversed`, span);
    for (const mw of MATH_WORDS)
      if (new RegExp(`(^|[^a-zA-Z\\\\])${mw}(?![a-zA-Z])`).test(span)) fail(w, `${label}: bare "${mw}" — a lost backslash`, span);
  }
  // RTL dash clutter: a prefix glued to a math island or a digit, or an em-dash
  // next to math, both read as a minus sign.
  const maqaf = s.match(/[א-ת]-(?=\$|\d)/g);
  if (maqaf) fail(w, `${label}: maqaf glued to math/digit (${maqaf.length}x) — rephrase (${maqaf.join(' ')})`, s);
  if (/\$ ?[—–] | [—–] ?\$/.test(s)) fail(w, `${label}: em-dash touching a math island — reads as a minus`, s);
  if (opts.maxLen && s.length > opts.maxLen) fail(w, `${label}: ${s.length} chars — more than one idea on a line (max ${opts.maxLen})`, s);
}

const items: Item[] = [];
const bagrutFigure = new Map<string, { part: string; json: string }>();

for (const r of rows) {
  const e = byWhere.get(r.where);
  if (!e) { fail(r.where, 'MISSING — no rewrite was authored'); continue; }
  const steps = e.steps;
  if (!Array.isArray(steps) || steps.length < 3) { fail(r.where, `needs ≥3 steps (rule + 2 working), got ${steps?.length ?? 0}`); continue; }

  const first = steps[0].trim();
  if (!first.startsWith(RULE)) { fail(r.where, 'steps[0] does not open with **הכלל:**', first); continue; }
  const body = stripFences(first.slice(RULE.length)).trim();
  if (body.length < 25) fail(r.where, `rule body too short (${body.length})`, first);
  if (body.length > 340) fail(r.where, `rule body too long (${body.length})`, first);
  const fa = e.finalAnswer ?? r.finalAnswer;
  if (fa && leaksAnswer(first, fa)) fail(r.where, 'the rule line leaks the final answer', first);
  if (r.hint && body.replace(/\s/g, '') === r.hint.replace(/\s/g, '')) fail(r.where, 'rule line restates the hint verbatim', first);
  if (steps.slice(1).some((s) => s.trim().startsWith(RULE))) fail(r.where, 'a second **הכלל:** line — only steps[0] may carry it');
  if (first.includes('```')) fail(r.where, 'a figure inside the rule line — put it in steps[1] (the gate measures steps[0] raw)');

  steps.forEach((s, i) => {
    if (typeof s !== 'string' || !s.trim()) { fail(r.where, `steps[${i}] empty`); return; }
    checkLine(r.where, `steps[${i}]`, s, { maxLen: i === 0 ? 420 : 230 });
    const fences = (s.match(/```geo/g) ?? []).length;
    if (fences > 1) fail(r.where, `steps[${i}] has ${fences} figures — one per step`);
    for (const ge of checkGeoFences(s)) fail(r.where, `steps[${i}] figure: ${ge}`);
    if (/```/.test(s) && !/```geo\s*\n[\s\S]*?```/.test(s)) fail(r.where, `steps[${i}]: a fence that is not \`\`\`geo`, s);
  });
  if (e.finalAnswer !== undefined) {
    if (!e.finalAnswer.trim()) fail(r.where, 'finalAnswer empty');
    checkLine(r.where, 'finalAnswer', e.finalAnswer);
    if (/ [—–] /.test(e.finalAnswer)) fail(r.where, 'finalAnswer: em-dash — write a comma or a new sentence', e.finalAnswer);
  }

  let figure: GeoSpec | undefined;
  if (e.figure) {
    if (r.kind === 'example' || r.kind === 'example-top') fail(r.where, 'examples cannot carry a prompt figure — embed it in a step');
    else {
      const errs = validateGeo(e.figure);
      for (const ge of errs) fail(r.where, `figure: ${ge}`);
      if (!errs.length) figure = e.figure;
    }
  }

  // --- student-facing text around the solution ------------------------------
  const texts: TextPatch[] = [];
  let hintsArray: Item['hintsArray'];
  const isBagrut = r.kind === 'bagrut';
  const isExample = r.kind === 'example' || r.kind === 'example-top';
  for (const [k, v] of [['prompt', e.prompt], ['hint', e.hint], ['context', e.context]] as const) {
    if (v === undefined) continue;
    if (typeof v !== 'string' || !v.trim()) { fail(r.where, `${k} empty`); continue; }
    checkLine(r.where, k, v);
    if (/```/.test(v)) fail(r.where, `${k}: do not write fences into text — give \`figure\` instead`, v);
  }
  if (e.hints !== undefined) {
    if (!isBagrut) fail(r.where, 'hints[] is for bagrut parts; ladder questions use `hint`');
    else if (!Array.isArray(e.hints) || e.hints.length < 2 || e.hints.length > 3 || e.hints.some((h) => typeof h !== 'string' || !h.trim())) fail(r.where, 'hints must be 2–3 non-empty strings');
    else { e.hints.forEach((h, i) => checkLine(r.where, `hints[${i}]`, h)); if (r.hints?.length) hintsArray = { firstFrom: r.hints[0], to: e.hints.map((h) => h.trim()) }; else fail(r.where, 'row has no current hints to replace'); }
  }
  if (e.hint !== undefined && isBagrut) fail(r.where, 'bagrut parts carry hints[] — use `hints`');
  if (e.hint !== undefined && isExample) fail(r.where, 'examples have no hint');
  if (e.context !== undefined && !isBagrut) fail(r.where, '`context` is a bagrut field');
  if (e.prompt !== undefined && isExample) fail(r.where, 'examples: the problem text renders inline and is not rewritten by this pass');

  // The question text (or the bagrut context) is where the figure lands.
  // Bagrut parts share ONE context: it is patched once, from part א (the first
  // part that supplies a context or a figure); a different one later is a conflict.
  const fence = figure ? `\n\n\`\`\`geo\n${JSON.stringify(figure)}\n\`\`\`` : '';
  if (isBagrut) {
    if (figure || e.context !== undefined) {
      const qid = r.where.split('/')[0];
      const json = JSON.stringify({ c: e.context ?? null, f: figure ?? null });
      const prev = bagrutFigure.get(qid);
      if (prev && prev.json !== json) fail(r.where, `context/figure differs from part ${prev.part} — give them on part א only`);
      if (!prev) {
        bagrutFigure.set(qid, { part: r.where.split('/')[1], json });
        if (!r.context) fail(r.where, 'figure/context given but this bagrut question has no context text');
        else texts.push({ key: 'context', from: r.context, to: (e.context ?? r.context).trim() + fence });
      }
    }
    if (e.prompt !== undefined && r.partPrompt) texts.push({ key: 'prompt', from: r.partPrompt, to: e.prompt.trim() });
  } else if (!isExample) {
    if (figure || e.prompt !== undefined) texts.push({ key: 'question', from: r.prompt, to: (e.prompt ?? r.prompt).trim() + fence });
    if (e.hint !== undefined) {
      if (!r.hint) fail(r.where, 'hint given but the question has no current hint literal to replace');
      else texts.push({ key: 'hint', from: r.hint, to: e.hint.trim() });
    }
  }

  items.push({
    where: r.where, kind: r.kind, anchor: r.steps[0], anchor2: r.steps[1] || undefined, near: r.where.split('/')[0],
    steps: steps.map((s) => s.trim()), finalAnswer: e.finalAnswer?.trim(), texts, hintsArray,
  });
}

for (const w of [...byWhere.keys()].filter((w) => !allRows.some((r) => r.where === w))) fail(w, 'authored for a `where` that is not in the audit — typo?');

if (!oneFile || process.argv.includes('--emit')) writeFileSync(`${wd}/items.json`, JSON.stringify(items, null, 1), 'utf8');
const nFig = items.filter((i) => i.texts.some((t) => t.to.includes('```geo'))).length, nStepFig = items.filter((i) => i.steps.some((s) => s.includes('```geo'))).length;
const nText = items.reduce((n, i) => n + i.texts.length + (i.hintsArray ? 1 : 0), 0);
console.log(`\n${items.length}/${rows.length} solutions ready (${nFig} prompt figures, ${nStepFig} solutions with a figure in a step, ${nText} text patches); ${bad} problem(s).`);
if (bad > 0) process.exit(1);

export {};
