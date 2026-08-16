/**
 * measure-cache.ts — exact token accounting for the tutor's prompt-caching layout.
 *
 * FREE: uses the token-counting endpoint, which is not billed. No completion is
 * generated, so this can be run as often as you like. (smoke-agents.ts is the
 * paid counterpart — it proves a cache HIT actually happens on a live call.)
 *
 * What it answers, per grounded topic:
 *   - how many tokens each system block costs
 *   - whether each cache breakpoint clears the model minimum (below it,
 *     `cache_control` is a silent no-op: no error, no saving)
 *   - what a turn costs with and without caching, in real dollars
 *
 * Usage:  npx tsx scripts/measure-cache.ts
 * Env:    ANTHROPIC_API_KEY in .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { buildTutorSystem } from '../lib/agents/prompts';
import { allLessonKeys } from '../content/lessons';
import { TUTOR_TOOLS } from '../lib/agents/tools';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY missing from .env.local');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

// Both models the /api/chat route can pick, with their cache minimums and
// input price per MTok. Minimums are per-model and differ by 4x — this is the
// whole reason the layout has to be checked against BOTH.
const MODELS = {
  'claude-haiku-4-5': { min: 4096, inPrice: 1.0 },
  'claude-sonnet-4-6': { min: 1024, inPrice: 3.0 },
} as const;
type ModelName = keyof typeof MODELS;

/** Tokens for a prefix of the system blocks — exact, from the API. */
async function countSystem(model: ModelName, blocks: TextBlockParam[]): Promise<number> {
  const res = await client.messages.countTokens({
    model,
    system: blocks,
    messages: [{ role: 'user', content: '.' }],
  });
  // Subtract the 1-char user message so the number is the system prefix alone.
  const bare = await client.messages.countTokens({
    model,
    messages: [{ role: 'user', content: '.' }],
  });
  return res.input_tokens - bare.input_tokens;
}

function usd(tokens: number, pricePerMTok: number): string {
  return `$${((tokens / 1_000_000) * pricePerMTok).toFixed(5)}`;
}

async function main() {
  const topics = allLessonKeys()
    .filter((k) => k.subject === 'math5')
    .map((k) => k.topic);

  console.log('Prompt-cache accounting for buildTutorSystem() — token counting is free.\n');

  // ---- block sizes, measured once on each model's tokenizer ----
  for (const model of Object.keys(MODELS) as ModelName[]) {
    const { min, inPrice } = MODELS[model];
    console.log(`\n=== ${model}  (cache minimum ${min} tokens, input $${inPrice}/MTok) ===`);

    // Tools serialise AHEAD of the system blocks, so they are part of the same
    // cached prefix and have to be counted or this script under-reports what a
    // turn actually costs. Measured separately rather than folded into
    // countSystem, so the per-block numbers below stay comparable to older runs.
    const withTools = await client.messages.countTokens({
      model,
      tools: TUTOR_TOOLS,
      messages: [{ role: 'user', content: '.' }],
    });
    const bare = await client.messages.countTokens({
      model,
      messages: [{ role: 'user', content: '.' }],
    });
    console.log(
      `  TUTOR_TOOLS: ${withTools.input_tokens - bare.input_tokens} tokens  (cached with the prefix; editing them invalidates every entry once)`
    );

    const ungrounded = buildTutorSystem({ unitLevel: 5, formNumber: '572' });
    const coreOnly = await countSystem(model, [ungrounded[0]]);
    console.log(
      `  TUTOR_CORE alone: ${coreOnly} tokens  →  ${
        coreOnly >= min ? '✓ cacheable on its own' : `✗ under the ${min} minimum (no-op)`
      }`
    );

    const rows: { topic: string; upToBreak: number; total: number; ok: boolean }[] = [];
    for (const topic of topics) {
      const blocks = buildTutorSystem({ unitLevel: 5, formNumber: '572', topic });
      // The breakpoint is the LAST block carrying cache_control.
      const lastBreak = blocks.map((b) => !!b.cache_control).lastIndexOf(true);
      if (lastBreak < 0) {
        rows.push({ topic, upToBreak: 0, total: await countSystem(model, blocks), ok: false });
        continue;
      }
      const upToBreak = await countSystem(model, blocks.slice(0, lastBreak + 1));
      const total = await countSystem(model, blocks);
      rows.push({ topic, upToBreak, total, ok: upToBreak >= min });
    }

    rows.sort((a, b) => a.upToBreak - b.upToBreak);
    console.log(`\n  ${'topic'.padEnd(26)} cached  tail  status`);
    for (const r of rows) {
      const tail = r.total - r.upToBreak;
      console.log(
        `  ${r.topic.padEnd(26)} ${String(r.upToBreak).padStart(6)} ${String(tail).padStart(5)}  ${
          r.ok ? '✓ caches' : `✗ under ${min} — silent no-op`
        }`
      );
    }

    // ---- what it costs, per 6-turn session, cached vs not ----
    const cacheable = rows.filter((r) => r.ok);
    if (cacheable.length) {
      const avg = Math.round(cacheable.reduce((s, r) => s + r.upToBreak, 0) / cacheable.length);
      const TURNS = 6;
      const noCache = avg * TURNS;
      const withCache = avg * 1.25 + avg * 0.1 * (TURNS - 1);
      console.log(
        `\n  Cached prefix averages ${avg} tokens across ${cacheable.length} topics.` +
          `\n  Over a ${TURNS}-turn session, on the prefix alone:` +
          `\n    no caching : ${noCache.toLocaleString()} billed tokens  ${usd(noCache, inPrice)}` +
          `\n    with cache : ${Math.round(withCache).toLocaleString()} billed tokens  ${usd(withCache, inPrice)}` +
          `\n    saving     : ${(100 - (withCache / noCache) * 100).toFixed(1)}%`
      );
    } else {
      console.log(`\n  No topic clears the ${min}-token minimum — caching saves nothing here.`);
    }
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
