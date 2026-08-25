/**
 * measure-intent-coverage.ts — how much real Hebrew the router recognises.
 *
 *   npx tsx scripts/measure-intent-coverage.ts
 *   npx tsx scripts/measure-intent-coverage.ts --misses 60
 *
 * FREE. No model, no network.
 *
 * ============================================================
 * WHY THIS CORPUS AND NOT ANOTHER ONE
 * ============================================================
 * The tutor census fires 101 phrasings I wrote myself, which measures my
 * imagination — and every miss Itay has reported was a shape absent from it.
 * The live trace measures reality but arrives a few rows a day.
 *
 * The FAQ bank is the third option and it is already paid for: ~2,300 entries,
 * each with a `q` and five or more `alts`, all of them Hebrew phrasings written
 * to sound like a student. Eleven thousand of them. They were authored as
 * CONTENT, so they are not tuned to the rules in any way — which is exactly
 * what makes them a fair test of the rules.
 *
 * ============================================================
 * THE SPLIT THAT DECIDES WHAT TO FIX
 * ============================================================
 * Two very different failures look identical from outside:
 *
 *   no rule matched     the phrasing is a shape nobody wrote a rule for.
 *                       The fix is a rule, and it is cheap.
 *   a rule matched but  the veto refused it because the message names a piece
 *   the veto refused    of mathematics the question on screen does not.
 *                       Often CORRECT — that veto is what stops a general
 *                       answer being served about the wrong subject.
 *
 * Measured separately by running each phrasing twice: once as production does
 * it, and once with the message passed as its own context, which makes
 * `foreignSubject` find nothing foreign and so disables the veto.
 */

import { canonicalIntent } from '../lib/tutor-intent';
import type { TutorFaqBank } from '../content/tutor-faq/types';

const N = process.argv.includes('--misses')
  ? Number(process.argv[process.argv.indexOf('--misses') + 1]) || 40
  : 40;

const TOPICS = ['probability', 'sequences', 'trigonometry', 'geometry'];

(async () => {
  const phrases: Array<{ text: string; unit: string; kind: string }> = [];
  const loaded: string[] = [];

  for (const topic of TOPICS) {
    let bank: TutorFaqBank;
    try {
      bank = (await import(`../content/tutor-faq/math5/${topic}`)).default as TutorFaqBank;
    } catch {
      continue; // a topic whose bank is not authored yet
    }
    loaded.push(topic);
    for (const [unit, entries] of Object.entries(bank)) {
      for (const f of entries) {
        phrases.push({ text: f.q, unit, kind: f.kind });
        for (const a of f.alts) phrases.push({ text: a, unit, kind: f.kind });
      }
    }
  }

  console.log(`\nbanks loaded: ${loaded.join(', ') || '(none)'}`);
  console.log(`real Hebrew phrasings to classify: ${phrases.length}\n`);
  if (phrases.length === 0) {
    console.log('No bank found. Nothing to measure.\n');
    return;
  }

  let recognised = 0;
  let vetoed = 0;
  const misses = new Map<string, { unit: string; kind: string; wouldBe: string }>();
  const byIntent = new Map<string, number>();
  const missByKind = new Map<string, number>();

  for (const p of phrases) {
    const asProduction = canonicalIntent(p.text);
    if (asProduction.intent) {
      recognised++;
      byIntent.set(asProduction.intent, (byIntent.get(asProduction.intent) ?? 0) + 1);
      continue;
    }
    // Same message as its own context: `foreignSubject` finds nothing foreign,
    // so no rule is vetoed and what is left is pure rule coverage.
    const unvetoed = canonicalIntent(p.text, p.text);
    if (unvetoed.intent) {
      vetoed++;
      continue;
    }
    missByKind.set(p.kind, (missByKind.get(p.kind) ?? 0) + 1);
    if (!misses.has(p.text)) misses.set(p.text, { unit: p.unit, kind: p.kind, wouldBe: '' });
  }

  const pct = (n: number) => `${((n / phrases.length) * 100).toFixed(1)}%`;
  console.log('=== coverage ===\n');
  console.log(`  recognised by a rule            ${String(recognised).padStart(6)}  ${pct(recognised)}`);
  console.log(`  a rule matched, the veto said no${String(vetoed).padStart(6)}  ${pct(vetoed)}`);
  console.log(`  NO rule matched at all          ${String(phrases.length - recognised - vetoed).padStart(6)}  ${pct(phrases.length - recognised - vetoed)}`);

  console.log('\n=== which intents carry the traffic ===\n');
  for (const [k, n] of [...byIntent.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.padEnd(22)} ${String(n).padStart(6)}  ${pct(n)}`);

  console.log('\n=== unmatched, by entry kind ===\n');
  console.log('  A kind with many misses is a kind whose natural phrasings have no rule.\n');
  for (const [k, n] of [...missByKind.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.padEnd(16)} ${String(n).padStart(6)}`);

  // ---- the shapes, which is what a rule is written against ----
  //
  // A flat list of 16,000 phrasings is unreadable and a list of the first words
  // is not: Hebrew questions open on the interrogative, so grouping by the
  // first one or two words shows which SHAPES have no rule, in order of how
  // much traffic each carries. That is the unit a rule is written in.
  const shape1 = new Map<string, number>();
  const shape2 = new Map<string, number>();
  for (const [text] of misses) {
    const parts = text.replace(/[?!.,]/g, '').split(/\s+/).filter(Boolean);
    if (parts[0]) shape1.set(parts[0], (shape1.get(parts[0]) ?? 0) + 1);
    if (parts[1]) {
      const k = `${parts[0]} ${parts[1]}`;
      shape2.set(k, (shape2.get(k) ?? 0) + 1);
    }
  }
  console.log();
  console.log('=== unmatched, by opening word ===');
  console.log();
  for (const [k, n] of [...shape1.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22))
    console.log(`  ${String(n).padStart(5)}  ${k}`);
  console.log();
  console.log('=== unmatched, by opening pair ===');
  console.log();
  for (const [k, n] of [...shape2.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30))
    console.log(`  ${String(n).padStart(5)}  ${k}`);

  console.log(`\n=== ${Math.min(N, misses.size)} of ${misses.size} distinct unmatched phrasings ===\n`);
  console.log('  This is the rule backlog, in the words content authors actually chose.\n');
  for (const [text, m] of [...misses.entries()].slice(0, N))
    console.log(`  [${m.kind.padEnd(11)}] ${text}`);

  console.log(
    `\nIf "NO rule matched" is large, the bottleneck is RECOGNITION and more\n` +
      `content will not be reached. If it is small, the bottleneck is content.\n`,
  );
})();
