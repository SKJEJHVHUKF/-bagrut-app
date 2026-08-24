/**
 * test-intent-rules-alive.ts — a rule that can never fire is not a rule.
 *
 *   npx tsx scripts/test-intent-rules-alive.ts
 *
 * FREE. Reads source, runs nothing.
 *
 * ============================================================
 * THE BUG CLASS THIS EXISTS FOR
 * ============================================================
 * `canonicalIntent` matches its patterns against the CANONICAL form of the
 * message, and `canonicalize` deletes the FILLER words — 'אני', 'שלי', 'אפשר',
 * 'בעצם' and the rest. A pattern that mentions one of them therefore matches
 * nothing, ever. It reads correctly, it typechecks, it sits in the table next
 * to rules that work, and it is dead.
 *
 * Two were found the day this was written:
 *
 *   R('check',     `איך\\s*אני\\s*(?:יודע|בודק)`)   — אני is filler
 *   R('why_wrong', `… |טעות\\s*שלי| …`)             — שלי is filler
 *
 * The first was written that same hour and looked obviously right. The second
 * had been in the file for weeks. Neither would ever have been noticed by a
 * test that only asks "does this phrasing get an intent", because the phrasings
 * they were meant to catch simply returned null like any other unknown shape.
 *
 * A static check is the right shape here: the defect is visible in the source
 * and invisible in the behaviour.
 */

import { readFileSync } from 'fs';

const src = readFileSync('lib/tutor-intent.ts', 'utf8');

let failures = 0;

// The filler list, read from the source rather than duplicated — a copy here
// would drift and start passing exactly when someone adds a new filler word.
const fillerBlock = /const FILLER = \[([\s\S]*?)\];/.exec(src)?.[1] ?? '';
const HEB_ONLY = /^[֐-׿]+$/;
const fillers = fillerBlock
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join(',')
  .split(',')
  .map((w) => w.replace(/['`\s]/g, ''))
  .filter((w) => HEB_ONLY.test(w));

const rules = src.match(/R\('[a-z_]+', `[^`]+`/g) ?? [];

console.log(`\n${rules.length} rules, ${fillers.length} filler words: ${fillers.join(' ')}\n`);

if (rules.length < 10 || fillers.length < 5) {
  console.log('  x   could not parse the rule table or the filler list — the check is not running');
  failures++;
}

for (const rule of rules) {
  for (const f of fillers) {
    // A whole Hebrew word inside the pattern, not a fragment of a longer one:
    // 'לי' must not match inside 'לימוד'.
    const whole = new RegExp(`(^|[^֐-׿])${f}([^֐-׿]|$)`);
    if (whole.test(rule)) {
      failures++;
      console.log(`  x   DEAD: "${f}" is deleted by canonicalize(), so this can never match`);
      console.log(`        ${rule.slice(0, 120)}`);
    }
  }
}

if (failures === 0) console.log('  ok  every rule is written against the canonical form\n');
else console.log('\n  Rewrite the pattern without the filler word: it is already gone by the\n  time the rule runs, so simply deleting it from the pattern is the fix.\n');

process.exit(failures === 0 ? 0 : 1);
