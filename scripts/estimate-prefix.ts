/**
 * estimate-prefix.ts — how big is the cacheable prefix on each /api/chat path?
 *
 *   npx tsx scripts/estimate-prefix.ts
 *
 * FREE — token counting, not generation.
 *
 * The minimum cacheable prefix on claude-haiku-4-5 is 4,096 tokens. Below it,
 * `cache_control` is a silent no-op: no error, no write, no read, no saving.
 * That is not hypothetical here — the ungrounded path sat at 3,490 and had
 * never cached once (scripts/probe-chat-cache.ts, 2026-08-25).
 *
 * Run this after ANY edit to TUTOR_CORE, TUTOR_BASE_CURRICULUM or TUTOR_TOOLS.
 * It counts `tools` too, which render at position 0 and therefore count toward
 * the prefix — leaving them out under-reports by ~1,100 tokens on Haiku.
 *
 * ⚠️ This file used to estimate from a chars-per-token ratio calibrated on
 * TUTOR_CORE's measured size, because the API key was out of credit. That
 * calibration silently broke the moment TUTOR_CORE was edited: the constant
 * went stale, the ratio moved 0.666 → 0.475, and the answer was wrong while
 * still looking plausible. Hence: measure, never calibrate.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '../lib/agents/prompts';
import { TUTOR_TOOLS } from '../lib/agents/tools';

const MODEL = 'claude-haiku-4-5';
const MIN_CACHEABLE = 4096;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) { console.error('ANTHROPIC_API_KEY missing'); process.exit(1); }
const client = new Anthropic({ apiKey });

const count = async (text: string, tools?: typeof TUTOR_TOOLS) =>
  (await client.messages.countTokens({
    model: MODEL,
    ...(tools ? { tools } : {}),
    messages: [{ role: 'user', content: text || '.' }],
  })).input_tokens;

(async () => {
  // Tools alone: count WITH tools minus the same call without them.
  const toolsTok = (await count('.', TUTOR_TOOLS)) - (await count('.'));
  console.log(`\ntools (render at position 0)   ${String(toolsTok).padStart(6)} tok\n`);

  for (const [name, topic] of [['UNGROUNDED', undefined], ['GROUNDED (הסתברות)', 'הסתברות']] as const) {
    const blocks = buildTutorSystem({ unitLevel: 5, formNumber: '571', topic, memory: '' });
    let prefix = toolsTok;
    let marked = 0;
    for (const b of blocks) {
      prefix += await count(b.text);
      if (b.cache_control) marked = prefix;
    }
    const ok = marked >= MIN_CACHEABLE;
    console.log(
      `${name.padEnd(20)} cacheable prefix ${String(marked).padStart(6)} tok  ` +
        `${ok ? `✅ ${marked - MIN_CACHEABLE} over` : `❌ ${MIN_CACHEABLE - marked} SHORT — silent no-op`}`
    );
  }
  console.log(`\nminimum for ${MODEL}: ${MIN_CACHEABLE} tok\n`);
})();
