/**
 * measure-cache-fit.ts — does each cached prefix actually clear its model's
 * minimum, and what does the Hebrew in it cost?
 *   npx tsx scripts/measure-cache-fit.ts
 *
 * Uses `messages.countTokens`, which is FREE — no model call, no spend. Same
 * approach as scripts/measure-tutor.ts, widened from one prompt to every
 * candidate.
 *
 * WHY THIS RUNS BEFORE ANY `cache_control` IS ADDED
 * Below the model's minimum, a `cache_control` marker is a silent no-op: no
 * error, no warning, `cache_creation_input_tokens: 0` — and you still pay the
 * 1.25x write premium on every request. The minimum is NOT uniform and NOT
 * monotonic across generations, which is what makes this worth measuring
 * rather than assuming:
 *
 *     Haiku 4.5              4096   ← the tutor's tier
 *     Sonnet 4.5 / 4.6 / 5   1024
 *     Opus 4.8               1024
 *     Opus 5                  512
 *
 * A prefix at 3K tokens caches on Sonnet and silently does not on Haiku.
 *
 * IT ALSO PRICES THE HEBREW. Model-facing Hebrew costs 3–4x the tokens of the
 * same instruction in English (measured previously at 4,753 -> 1,139 on Haiku).
 * That matters twice over: once per request in raw input cost, and again
 * because shrinking a prefix can drop it BELOW the cache minimum — turning a
 * working cache into a silent no-op. Translate and re-measure, never one
 * without the other.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '@/lib/agents/prompts';
import { TUTOR_TOOLS } from '@/lib/agents/tools';

// countTokens is free but still needs a key, and this is the ONE step of the
// chain that touches the network. Without a key it skips — the same way in
// both places, so a run is reproducible — and says so where it will be seen:
//   · on a laptop, a banner in the terminal;
//   · in CI, ALSO a GitHub workflow annotation (`::warning::`), which shows in
//     the run summary without anyone opening the log. A green run with a
//     yellow "skipped" badge is honest; a red main on a forgotten secret or an
//     API blip is a gate people learn to bypass.
// The check stays in the chain because it IS a regression gate: a prompt edit
// that drops a cached prefix under its model's floor silently costs the 1.25x
// write premium on every request (that happened once, −35 tokens, +47% bill).
if (!process.env.ANTHROPIC_API_KEY) {
  console.log(
    '\n⚠️  measure:cache SKIPPED — ANTHROPIC_API_KEY is not set, the cache-floor check did not run.\n' +
      '    countTokens is free (no model call) but needs a key. Locally: put it in .env.local.\n' +
      '    In GitHub Actions: Settings → Secrets and variables → Actions → New repository secret →\n' +
      '    name ANTHROPIC_API_KEY. The workflow passes it through as env.\n',
  );
  if (process.env.GITHUB_ACTIONS) {
    console.log('::warning title=measure:cache skipped::ANTHROPIC_API_KEY secret not set — the cache-floor check did not run');
  }
  process.exit(0);
}

const client = new Anthropic();

/** Cacheable-prefix minimums, per shared/prompt-caching.md. */
const MINIMUM: Record<string, number> = {
  'claude-haiku-4-5': 4096,
  'claude-sonnet-4-5': 1024,
  'claude-sonnet-4-6': 1024,
  'claude-sonnet-5': 1024,
  'claude-opus-4-8': 1024,
  'claude-opus-5': 512,
};

/**
 * How far above the floor a breakpoint has to sit before this script calls it
 * safe — and the reason this file now FAILS instead of only reporting.
 *
 * ⚠️ TWO SEPARATE THINGS MAKE "IT CLEARS THE FLOOR" AN UNSAFE VERDICT.
 *
 * 1. `countTokens` DOES NOT AGREE WITH THE BILLED PREFIX. Measured against a
 *    live call on the same blocks: countTokens said 6,149, the API wrote 5,833.
 *    It over-reports by roughly 300, and always in the dangerous direction — a
 *    prefix this script calls "+281 over" was really 35 UNDER.
 *
 * 2. EVERY EDIT TO A PROMPT IS A REDUCTION. The last three here were: worked
 *    examples out, summary and exam tips out, TUTOR_CORE translated to English
 *    (4,502 → 3,098). A breakpoint sitting 35 tokens over the floor does not
 *    survive that, and it fails SILENTLY: no error, no warning, just the whole
 *    prefix rewritten on every topic instead of a shared entry read at 0.1x.
 *    It cost 47% of the bill for a week and looked like "the tutor got hungry
 *    again".
 *
 * 1,000 is comfortably past the measurement error and past a normal edit.
 */
const MARGIN = 1000;
let failures = 0;

/**
 * ⚠️ TOOLS ARE PART OF THE CACHED PREFIX AND THIS SCRIPT USED TO OMIT THEM.
 *
 * Anthropic serialises tool definitions BEFORE the system blocks, so the prefix
 * a `cache_control` marker actually covers is tools + system — and TUTOR_TOOLS
 * is ~1,100 tokens on Haiku (lib/agents/tools.ts measures it). Counting the
 * system blocks alone under-reports the prefix by that much, which on the Haiku
 * path is a quarter of the 4,096 minimum: enough to report a live cache as a
 * no-op, or worse, to bless a trim that pushes a real prefix under the floor.
 *
 * Counting through `tools` + `system` rather than as one user string also means
 * the per-block and tool-use overheads are counted the way the API counts them,
 * instead of being lost in a flat concatenation.
 */
async function count(model: string, text: string): Promise<number> {
  const r = await client.messages.countTokens({
    model,
    tools: TUTOR_TOOLS,
    system: [{ type: 'text', text }],
    messages: [{ role: 'user', content: '.' }],
  });
  return r.input_tokens;
}

const hebrewShare = (s: string) => {
  const heb = (s.match(/[א-ת]/g) ?? []).length;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  return heb + latin === 0 ? 0 : heb / (heb + latin);
};

/**
 * ⚠️ MEASURE THE GROUNDED PATH, NOT JUST THE CORE.
 * `buildTutorSystem` emits the topic-grounding block only for topics that have
 * authored lesson content behind them. Measure a topic without it and you get
 * the bare core, which makes caching look dead everywhere. It is not — it is
 * dead only on the ungrounded path, which lib/agents/prompts.ts already
 * documents as an accepted no-op. This list covers both kinds.
 */
// סדרות and הסתברות lead the list on purpose: they carry the FAQ banks, so they
// are the two highest-volume topics in the tutor and the ones any prompt or
// tool trim has to be measured against first.
const TOPICS = ['סדרות', 'הסתברות', 'מספרים מרוכבים', 'וקטורים במרחב', 'טריגונומטריה', 'אלגברה', ''];

(async () => {
  // Which model actually serves this? The route picks Sonnet only for topics in
  // the TUTOR_SONNET_TOPICS allowlist; unset, every call is Haiku — whose
  // minimum is 4x Sonnet's, which flips the verdict on the same prompt.
  const allowlist = (process.env.TUTOR_SONNET_TOPICS ?? '').trim();
  console.log(
    allowlist
      ? `TUTOR_SONNET_TOPICS = "${allowlist}" — those topics run on Sonnet 4.6 (min 1024)\n`
      : 'TUTOR_SONNET_TOPICS unset — every tutor call runs on Haiku 4.5 (min 4096)\n',
  );

  for (const topic of TOPICS) {
    let blocks: { text?: string; cache_control?: unknown }[];
    try {
      blocks = buildTutorSystem({ topic, unitLevel: 5, formNumber: '582' } as never);
    } catch (e) {
      console.log(`  ${topic || '(no topic)'}: build failed — ${(e as Error).message}`);
      continue;
    }

    const model = topic && allowlist.includes(topic) ? 'claude-sonnet-4-6' : 'claude-haiku-4-5';
    const min = MINIMUM[model];

    // WARNING: EVERY BREAKPOINT IS ITS OWN PREFIX, AND EACH HAS TO CLEAR THE
    // FLOOR ON ITS OWN. This script used to join ALL the cached blocks and
    // measure that one string, which only ever tested the LAST breakpoint. The
    // first one - the shared core, the entry every topic and every student is
    // supposed to reuse - was never measured, and it spent a week 35 tokens
    // under the floor as a silent no-op while this script printed CACHES.
    const marks: number[] = [];
    blocks.forEach((b, i) => { if (b.cache_control) marks.push(i); });

    for (const [n, upto] of marks.entries()) {
      // WARNING: TOOLS COUNT. They serialise AHEAD of `system` in the cached
      // prefix, so a measurement without them is short by ~1,035 tokens at the
      // very front - and that error is in the SAFE direction for the last
      // breakpoint and the dangerous one for the first.
      const text = blocks.slice(0, upto + 1).map((b) => b.text ?? '').join('');
      const tokens = await count(model, text);
      const margin = tokens - min;
      const ok = margin >= MARGIN;
      if (!ok) failures++;
      const verdict = ok
        ? `caches, +${margin} over the floor`
        : margin >= 0
          ? `⛔ ONLY +${margin} OVER THE FLOOR — one edit from a silent no-op`
          : `⛔ SILENT NO-OP — ${-margin} short of ${min}`;
      console.log(
        `  ${String(tokens).padStart(5)} tok  breakpoint ${n}  ` +
          `hebrew ${String(Math.round(hebrewShare(text) * 100)).padStart(3)}%  ` +
          `${verdict}   ← ${topic || '(no topic — ungrounded chat)'}`,
      );
    }
  }

  console.log('\nhebrew share is of letters only — 0% means the block is already English.');
  console.log('⚠️ Translating model-facing Hebrew shrinks the prefix roughly 4x. On a prefix');
  console.log('   that currently caches, that can drop it under the minimum and turn a live');
  console.log('   cache into a silent no-op: a cached 2,200-token prefix bills ~220 tok-eq');
  console.log('   per turn, an uncached 550-token English one bills 550. Re-run this after');
  console.log('   any translation and compare tok-eq, not raw tokens.');

  // ⚠️ IT FAILS NOW. This script printed "CACHES on claude-haiku-4-5" for a week
  // while the shared core was a silent no-op, because printing is not a gate and
  // nobody re-reads a report that has always looked fine.
  console.log(
    failures === 0
      ? `\nOK cache fit: every breakpoint clears its floor by at least ${MARGIN} tokens\n`
      : `\n⛔ ${failures} breakpoint(s) too close to the floor — a cached prefix is about to\n` +
          '   stop caching, silently. Grow the block or drop its marker; do not ship this.\n',
  );
  process.exitCode = failures === 0 ? 0 : 1;
})();
