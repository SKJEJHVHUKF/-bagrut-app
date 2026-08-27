/**
 * generate-faq-from-logs.ts — draft FAQ entries for the questions students
 * actually asked and nobody could answer.
 *
 * ============================================================
 * WHERE THIS SITS
 * ============================================================
 * It writes SLICE FILES, not content. The pipeline is unchanged:
 *
 *   [faq-miss] logs  →  this script  →  slices/faq-*.json
 *                                          ↓
 *                       npm run merge:faq  (validates, then writes
 *                                           content/tutor-faq/math5/*.ts)
 *                                          ↓
 *                       npm run test:faq   (recall, noise, transfer)
 *
 * ⚠️ IT DOES NOT WRITE TO content/tutor-faq/math5/ AND MUST NOT.
 *
 * `merge-tutor-faq` holds every content rule this app has learned the hard way
 * — Hebrew inside `$…$`, a maqaf that reads as a minus, an answer that opens on
 * a maths island and flips the line, an answer that states the final result
 * without `reveals`, a duplicate alt, a held-out alt that shares no word with
 * anything kept. A generator that wrote content files directly would be a
 * second, weaker copy of that gate, and the weaker copy is the one that would
 * drift. Model output earns its place by passing the same door authored
 * content passes.
 *
 * ============================================================
 * USAGE
 * ============================================================
 *   # the default: see what it would do, call nothing, spend nothing
 *   npx tsx scripts/generate-faq-from-logs.ts
 *
 *   # the ONLY form that spends money, and it has to be said out loud
 *   npx tsx scripts/generate-faq-from-logs.ts --rows audit/rows.json --limit 5 --spend-api
 *
 *   # then, always:
 *   npm run merge:faq -- --rows audit/rows.json --in slices --out content/tutor-faq/math5/sequences.ts
 *   npm run test:faq
 *
 * FLAGS
 *   --logs <file>    default logs/faq-misses.json
 *   --rows <file>    the unit content: [{ unit, steps[], finalAnswer }].
 *                    Without it nothing is generated — see GROUNDING below.
 *   --topic <hebrew> only this topic
 *   --limit <n>      only the n most-missed units (default 3; cost control)
 *   --out <dir>      slice directory, default slices/
 *   --model <id>     default claude-sonnet-5
 *   --spend-api      actually call the model. WITHOUT IT NOTHING IS SPENT.
 *   --dry-run        the default, kept so the word still works
 *
 * ============================================================
 * GROUNDING — why --rows is not optional
 * ============================================================
 * An entry's answer must describe THIS solution's steps and numbers. Handing
 * the model a student's question with no solution attached asks it to invent
 * one, and an invented answer that reads fluently is exactly what the whole
 * local layer exists to avoid paying for. No row, no generation, and the unit
 * is reported as skipped rather than silently dropped.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { HELD_POSITIONS, type TutorFaq, type TutorFaqKind } from '../content/tutor-faq/types';

// ------------------------------------------------------------
// Arguments
// ------------------------------------------------------------
const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => {
  const i = argv.indexOf(k);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const LOGS = opt('--logs', 'logs/faq-misses.json')!;
const ROWS = opt('--rows');
const TOPIC = opt('--topic');
const LIMIT = Number(opt('--limit', '3'));
const OUT = opt('--out', 'slices')!;
/**
 * ⚠️ DRY BY DEFAULT, AND SPENDING NEEDS AN EXPLICIT WORD.
 *
 * Itay, after a $0.055 sample run: "לא להשתמש לי ב-API בשביל בדיקות". He is
 * right, and a flag named --dry-run puts the burden on the person to remember
 * it — which is the wrong way round for the only script here that can spend
 * money. So the default is to call nothing, and a real run has to say
 * --spend-api out loud. --dry-run still works and means the same thing.
 */
const DRY = !argv.includes('--spend-api');
if (!DRY && argv.includes('--dry-run')) {
  console.error();
  console.error('--dry-run and --spend-api contradict each other. Pick one.');
  console.error();
  process.exit(2);
}

/**
 * ⚠️ NOT claude-3-5-sonnet, and the substitution is measured rather than a
 * preference. lib/agents/config.ts records a head-to-head on this repo's own
 * grading task: sonnet-5 scored 5/5 with 0 false accusations at $0.0269, the
 * previous generation 4/5 with 1 at $0.0379. Better and cheaper, so there is
 * no version of this decision where the older model wins. Override with
 * --model if you want to compare.
 */
const MODEL = opt('--model', 'claude-sonnet-5')!;

/** Sonnet's minimum cacheable prefix is 1,024 tokens; the rules block clears it. */
const CACHE = { type: 'ephemeral' as const };

// ------------------------------------------------------------
// Inputs
// ------------------------------------------------------------
type Miss = { topic: string; unit: string; msg: string; count?: number };
type Row = { unit: string; question?: string; steps: string[]; finalAnswer: string };

function readMisses(): Miss[] {
  if (!existsSync(LOGS)) {
    console.error(`\n⛔ no log file at ${LOGS}\n`);
    console.error('   It is a JSON array of what students asked that nothing answered:');
    console.error('     [{ "topic": "סדרות", "unit": "seq-004", "msg": "למה מחלקים כאן", "count": 3 }]');
    console.error('\n   Two ways to fill it:');
    console.error('   · Vercel logs → grep for "[faq-miss]" and reshape.');
    console.error('   · BETTER — the live trace already holds this, per phrasing and');
    console.error('     already normalised: npm run report:trace. Rows with');
    console.error('     fallback_reason = no_faq_match ARE this list, and they carry a');
    console.error('     count, which the Vercel log line does not.\n');
    process.exit(2);
  }
  const raw = JSON.parse(readFileSync(LOGS, 'utf8')) as Miss[];
  return raw.filter((m) => m?.unit && m?.msg && (!TOPIC || m.topic === TOPIC));
}

function readRows(): Map<string, Row> {
  if (!ROWS) return new Map();
  return new Map((JSON.parse(readFileSync(ROWS, 'utf8')) as Row[]).map((r) => [r.unit, r]));
}

// ------------------------------------------------------------
// The rules the model is held to
// ------------------------------------------------------------
/**
 * ⚠️ ENGLISH, IN A HEBREW PRODUCT, AND ON PURPOSE.
 *
 * Measured on this repo: the same instruction block costs 4,753 tokens in
 * Hebrew and 1,139 in English. Only the content the student reads has to be
 * Hebrew; the instructions do not, and paying 4x for them on every batch is
 * paying to make the thing that removes API cost expensive.
 */
const RULES = `You write FAQ entries for an Israeli 5-unit bagrut maths tutor.

Each entry answers ONE question a student asked about ONE worked solution, in
Hebrew, in the tutor's voice. Output is consumed by a strict validator; an entry
that breaks any rule below is rejected wholesale, not repaired.

## Shape

{
  "id": "<unit>#<n>",          // n is 1-based within the unit
  "kind": "why-step" | "where-from" | "why-not" | "what-if" | "concept" | "mistake" | "check" | "other",
  "step": <0-based index into the solution steps, ONLY when the question is about one step>,
  "q": "<the canonical student question, Hebrew>",
  "alts": ["<5 or more different phrasings>"],
  "a": "<the tutor's answer, Hebrew, 40-700 characters>"
}

## The alts, and the two rules that are not obvious

Positions 1 and 4 of \`alts\` are HELD OUT by the recall test. They are hidden
from the index and then fired at it, so they are the only proof the entry can be
found by words nobody wrote into it.

RULE A — PAIRING. A held-out alt is found only if something still VISIBLE echoes
it. Write the alts so position 1 paraphrases position 0, and position 4
paraphrases position 3:

  [A, A-paraphrase, B, C, C-paraphrase]
   0        1        2  3        4

An entry whose paraphrases sit anywhere else scores near zero. This is measured:
the same entries scored 29% one way and 96% the other. Same words, same answer.

RULE B — A DISTINGUISHING WORD. Every held-out alt of a why-step, where-from,
why-not or what-if entry MUST contain at least one content word that belongs to
THIS unit and to no other — a number from this solution, a named object from
this question, a term this step introduces.

Why: those four kinds are NOT transferable between questions, but 'concept'
entries from sibling questions ARE, and they are written generically. A held-out
alt with no unit-specific word cannot outbid them, so a student asking a
question about THEIR exercise is served a general answer about a different one.
Measured at 4.4% of such asks on a topic where this rule was not followed.

Concretely, for a unit whose solution divides by 3 to get 12:
  BAD  "למה מחלקים כאן"          — true of a hundred units
  GOOD "למה מחלקים ב-3 כאן"      — the 3 is this unit's
  GOOD "מאיפה יצא ה-12"          — the 12 is this unit's

## The answer

- Hebrew, 1 to 4 sentences, 40-700 characters, ending on ONE next move for the
  student ("תבדוק את...", "נסה ל...", "מה יוצא לך כש...").
- NEVER Hebrew inside \`$…$\`. KaTeX has no bidi and renders it reversed.
- NEVER open a paragraph on a maths island. A latin or maths first character
  flips the whole line to left-to-right.
- NEVER a maqaf glued to a maths island (\`מ-$a$\`) and NEVER an em dash as a
  clause separator. Both read as a minus sign in Hebrew maths.
- Backslashes doubled, because the output becomes TypeScript source:
  \`$\\\\dfrac{1}{3}$\`, \`$\\\\cdot$\`, \`$\\\\sqrt{2}$\`.
- Secondary-school notation only. NEVER ∀ ∃ ∧ ∨ ⟺ ∅ ℝ ℂ ■ or \\forall \\exists
  \\wedge \\iff \\mathbb.
- The answer must NOT state the final answer of the exercise. If answering the
  question genuinely requires it, add "reveals": true and it will be served only
  after the student has answered or opened the solution.

## What not to write

- No two alts that differ only in punctuation or a filler word. The validator
  drops the entry.
- No entry for a question the six built-in asks already cover (hint, first step,
  why was I wrong, full solution, formulas, key points).
- No praise, no "שאלה מצוינת", no restating the question back.

Return ONLY a JSON array of entries. No prose, no code fence.`;

// ------------------------------------------------------------
// Pre-check: the two rules that are about GENERATION, not content
// ------------------------------------------------------------
/**
 * ⚠️ DELIBERATELY NARROW. Everything else — notation, bidi, answer length, a
 * leaked final answer — belongs to `merge-tutor-faq`, which is the authority
 * and which authored content passes through too. Re-implementing those checks
 * here would create a second copy that drifts, and the drifting copy is always
 * the one that is wrong.
 *
 * These two are here because they are the rules a re-prompt can fix, and
 * because a batch that fails them is worth catching before it reaches a human.
 */
const contentWords = (s: string) =>
  s.replace(/[^֐-׿a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);

function preCheck(entry: TutorFaq, siblingsText: string): string[] {
  const bad: string[] = [];
  if (!Array.isArray(entry.alts) || entry.alts.length < 5) {
    bad.push(`needs 5+ alts (has ${entry.alts?.length ?? 0})`);
    return bad;
  }
  const visible = new Set(
    [entry.q, ...entry.alts.filter((_, i) => !HELD_POSITIONS.has(i))].flatMap(contentWords),
  );
  const sibling = new Set(contentWords(siblingsText));
  const NON_TRANSFERABLE: TutorFaqKind[] = ['why-step', 'where-from', 'why-not', 'what-if'];

  for (const i of HELD_POSITIONS) {
    const alt = entry.alts[i];
    if (typeof alt !== 'string') continue;
    const w = contentWords(alt);
    // RULE A
    if (!w.some((t) => visible.has(t))) {
      bad.push(`alt[${i}] "${alt}" shares no word with q or any kept alt (rule A)`);
    }
    // RULE B
    if (NON_TRANSFERABLE.includes(entry.kind) && !w.some((t) => !sibling.has(t))) {
      bad.push(`alt[${i}] "${alt}" has no word this unit does not share (rule B)`);
    }
  }
  return bad;
}

// ------------------------------------------------------------
// One unit
// ------------------------------------------------------------
async function draftUnit(
  client: Anthropic,
  unit: string,
  row: Row,
  asks: string[],
  siblingsText: string,
): Promise<{ faqs: TutorFaq[]; problems: string[]; usage: { in: number; out: number; cacheRead: number; cacheWrite: number } }> {
  const solution = row.steps.map((s, i) => `${i}. ${s}`).join('\n');
  const user = [
    `Unit id: ${unit}`,
    row.question ? `Question:\n${row.question}` : '',
    `Solution steps (0-based, use these indices for "step"):\n${solution}`,
    `Final answer (must NOT appear in an answer unless reveals:true): ${row.finalAnswer}`,
    '',
    `Students asked these and nothing could answer them. Write one entry per`,
    `DISTINCT question — merge phrasings that are the same question:`,
    ...asks.map((a) => `  - ${a}`),
  ]
    .filter(Boolean)
    .join('\n');

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: [{ type: 'text', text: RULES, cache_control: CACHE }],
    messages: [{ role: 'user', content: user }],
  });

  const u = res.usage as unknown as Record<string, number | undefined>;
  const usage = {
    in: res.usage.input_tokens,
    out: res.usage.output_tokens,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
  };

  const text = res.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .replace(/^```(?:json)?\s*|\s*```$/g, '')
    .trim();

  let faqs: TutorFaq[] = [];
  try {
    const parsed = JSON.parse(text);
    faqs = Array.isArray(parsed) ? parsed : [];
  } catch {
    return { faqs: [], problems: [`${unit}: the reply was not JSON`], usage };
  }

  const problems: string[] = [];
  for (const f of faqs) for (const p of preCheck(f, siblingsText)) problems.push(`${f.id ?? unit}: ${p}`);
  return { faqs, problems, usage };
}

// ------------------------------------------------------------
// Run
// ------------------------------------------------------------
(async () => {
  const misses = readMisses();
  const rows = readRows();

  // Group by unit, most-missed first: the unit ten students got stuck on is
  // worth more than the one that saw a single stray message.
  const byUnit = new Map<string, { topic: string; asks: Map<string, number> }>();
  for (const m of misses) {
    const g = byUnit.get(m.unit) ?? { topic: m.topic, asks: new Map<string, number>() };
    g.asks.set(m.msg, (g.asks.get(m.msg) ?? 0) + (m.count ?? 1));
    byUnit.set(m.unit, g);
  }
  const ranked = [...byUnit.entries()]
    .map(([unit, g]) => ({ unit, ...g, total: [...g.asks.values()].reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);

  console.log(`\n${misses.length} missed asks across ${ranked.length} units${TOPIC ? ` in ${TOPIC}` : ''}`);

  const withRow = ranked.filter((r) => rows.has(r.unit));
  const noRow = ranked.filter((r) => !rows.has(r.unit));
  if (noRow.length) {
    console.log(`\n⚠️ ${noRow.length} unit(s) have no row in --rows and are SKIPPED, not dropped quietly:`);
    for (const r of noRow.slice(0, 8)) console.log(`     ${r.unit}  (${r.total} asks)`);
    console.log('   An answer has to describe THIS solution. With no steps to describe, the');
    console.log('   model would invent one, and a fluent invention is what we are removing.');
  }

  const todo = withRow.slice(0, LIMIT);
  console.log(`\nwould draft ${todo.length} unit(s) (--limit ${LIMIT}):\n`);
  for (const t of todo) {
    console.log(`  ${t.unit.padEnd(24)} ${t.total} asks, ${t.asks.size} distinct`);
    for (const [ask, n] of [...t.asks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)) {
      console.log(`      ${String(n).padStart(3)} × ${ask}`);
    }
  }

  if (DRY) {
    console.log('\n--- DRY RUN: nothing was called and nothing was written ---');
    console.log(`\nmodel: ${MODEL}   rules block: ~${Math.round(RULES.length / 3.5)} tokens (cached after the first unit)`);
    console.log('\nThe rules the model will be held to, verbatim:\n');
    console.log(RULES.split('\n').map((l) => `  │ ${l}`).join('\n'));
    console.log('\nRun without --dry-run to draft, then:');
    console.log('  npm run merge:faq -- --rows <rows> --in slices --out content/tutor-faq/math5/<topic>.ts --dry');
    console.log('  npm run test:faq\n');
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n⛔ ANTHROPIC_API_KEY is not set. Use --dry-run to review without it.\n');
    process.exit(2);
  }
  if (!todo.length) {
    console.log('\nnothing to draft.\n');
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  const slice: { unit: string; faqs: TutorFaq[] }[] = [];
  const allProblems: string[] = [];
  let inTok = 0, outTok = 0, cacheRead = 0, cacheWrite = 0;

  for (const t of todo) {
    const row = rows.get(t.unit)!;
    // What the SIBLINGS say, so rule B can be checked against something real:
    // a word is distinguishing only relative to the units it is not in.
    const siblingsText = [...rows.values()]
      .filter((r) => r.unit !== t.unit)
      .flatMap((r) => r.steps)
      .join(' ');

    process.stdout.write(`  ${t.unit} … `);
    const { faqs, problems, usage } = await draftUnit(
      client,
      t.unit,
      row,
      [...t.asks.keys()],
      siblingsText,
    );
    inTok += usage.in; outTok += usage.out; cacheRead += usage.cacheRead; cacheWrite += usage.cacheWrite;
    console.log(`${faqs.length} entries${problems.length ? `, ${problems.length} pre-check problem(s)` : ''}`);
    if (faqs.length) slice.push({ unit: t.unit, faqs });
    allProblems.push(...problems);
  }

  const stamp = `${ranked[0]?.topic ?? 'faq'}-${readdirSync(OUT).length + 1}`.replace(/[^\w-]/g, '');
  const file = join(OUT, `faq-${stamp}.json`);
  writeFileSync(file, JSON.stringify(slice, null, 2), 'utf8');
  console.log(`\nwrote ${file}  (${slice.reduce((n, s) => n + s.faqs.length, 0)} entries)`);

  if (allProblems.length) {
    console.log(`\n⚠️ ${allProblems.length} pre-check problem(s) — these are the two rules a re-prompt can fix:\n`);
    for (const p of allProblems.slice(0, 20)) console.log(`   ${p}`);
    if (allProblems.length > 20) console.log(`   … and ${allProblems.length - 20} more`);
  }

  // Sonnet 5: $3/MTok in, $15/MTok out, cache write 1.25x in, cache read 0.1x in.
  const cost =
    (inTok * 3 + outTok * 15 + cacheWrite * 3.75 + cacheRead * 0.3) / 1_000_000;
  console.log(
    `\ntokens  in ${inTok} · out ${outTok} · cache write ${cacheWrite} · cache read ${cacheRead}` +
      `\ncost    ~$${cost.toFixed(4)} for ${todo.length} unit(s)`,
  );

  console.log('\n⚠️ NOTHING IS LIVE YET. The slice is a draft and has passed two checks,');
  console.log('   not the gate. Next, in this order:\n');
  console.log(`   npm run merge:faq -- --rows ${ROWS} --in ${OUT} --out content/tutor-faq/math5/<topic>.ts --dry`);
  console.log('   (read the problems, fix or delete entries, drop --dry when clean)');
  console.log('   npm run test:faq\n');
})();
