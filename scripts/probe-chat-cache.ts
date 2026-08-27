/**
 * probe-chat-cache.ts — is /api/chat's prompt cache actually being read?
 *
 *   npx tsx scripts/probe-chat-cache.ts
 *
 * ⚠️ NOT free. Makes 4 real calls on claude-haiku-4-5 with max_tokens=16.
 * Costs a few cents. That is the point: the free token-counting endpoint
 * cannot tell you whether a cache entry FORMED, only how big the prompt is.
 *
 * It reproduces the EXACT payload /api/chat sends — same `tools` array, same
 * `system` blocks from buildTutorSystem, same model — and runs two consecutive
 * calls per path so the second one is the proof:
 *
 *   call 1  cache_creation_input_tokens > 0   cache_read_input_tokens = 0
 *   call 2  cache_read_input_tokens > 0                          ← cache works
 *
 * If call 2 reads 0, the prefix is drifting or is under the model's minimum,
 * and the raw `usage` object printed below says which.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '../lib/agents/prompts';
import { TUTOR_TOOLS } from '../lib/agents/tools';

const MODEL = 'claude-haiku-4-5';
/** Published minimum cacheable prefix for this model. Under it, cache_control
 *  is a silent no-op — no error, no write, no read. */
const MIN_CACHEABLE = 4096;
const RATE = { input: 1 / 1e6, output: 5 / 1e6 };

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) { console.error('ANTHROPIC_API_KEY missing'); process.exit(1); }
const client = new Anthropic({ apiKey });

type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: unknown;
};

const usd = (u: Usage) =>
  u.input_tokens * RATE.input +
  u.output_tokens * RATE.output +
  (u.cache_read_input_tokens ?? 0) * RATE.input * 0.1 +
  (u.cache_creation_input_tokens ?? 0) * RATE.input * 2.0; // 1h TTL = 2x

async function turn(label: string, topic: string, message: string): Promise<Usage> {
  const system = buildTutorSystem({
    unitLevel: 5,
    formNumber: '571',
    topic: topic || undefined,
    memory: '',
  });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16,
    system,
    tools: TUTOR_TOOLS,
    messages: [{ role: 'user', content: message }],
  });
  const u = res.usage as unknown as Usage;
  console.log(`\n  ${label}`);
  console.log('  REAL ANTHROPIC USAGE:', JSON.stringify({
    input_tokens: u.input_tokens,
    output_tokens: u.output_tokens,
    cache_creation: u.cache_creation_input_tokens ?? 0,
    cache_read: u.cache_read_input_tokens ?? 0,
  }));
  console.log('  raw usage.cache_creation:', JSON.stringify(u.cache_creation ?? null));
  console.log(`  prompt total = ${u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)} tok   $${usd(u).toFixed(5)}`);
  return u;
}

async function probe(name: string, topic: string) {
  console.log(`\n${'='.repeat(70)}\n${name}  (topic=${topic ? topic : '<none>'})\n${'='.repeat(70)}`);

  // What the prefix WOULD be, before spending anything: tools render at
  // position 0, so the cacheable prefix is tools + every system block up to
  // and including the last cache_control marker.
  const system = buildTutorSystem({ unitLevel: 5, formNumber: '571', topic: topic || undefined, memory: '' });
  const toolsTok = (await client.messages.countTokens({
    model: MODEL, tools: TUTOR_TOOLS, messages: [{ role: 'user', content: '.' }],
  })).input_tokens;
  let prefix = toolsTok;
  let lastMarked = 0;
  for (const b of system) {
    const n = (await client.messages.countTokens({
      model: MODEL, messages: [{ role: 'user', content: b.text }],
    })).input_tokens;
    prefix += n;
    if (b.cache_control) lastMarked = prefix;
  }
  console.log(`\n  cacheable prefix at last breakpoint: ${lastMarked} tok  (minimum ${MIN_CACHEABLE})`);
  console.log(`  ${lastMarked >= MIN_CACHEABLE ? '✅ clears the minimum' : '❌ UNDER THE MINIMUM — cache_control is a silent no-op'}`);

  const a = await turn('CALL 1 (expect creation > 0, read = 0)', topic, 'שלום, אני תקוע בתרגיל.');
  const b = await turn('CALL 2 (expect read > 0)', topic, 'עדיין לא הבנתי, אפשר רמז?');

  const ok = (b.cache_read_input_tokens ?? 0) > 0;
  console.log(`\n  VERDICT: ${ok ? `✅ cache is being READ (${b.cache_read_input_tokens} tok)` : '❌ cache_read = 0 on the second call'}`);
  console.log(`  cost call 1 $${usd(a).toFixed(5)}  →  call 2 $${usd(b).toFixed(5)}`);
}

(async () => {
  await probe('GROUNDED path', 'הסתברות');
  await probe('UNGROUNDED path', '');
})();
