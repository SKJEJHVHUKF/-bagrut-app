/**
 * measure-cache-live.ts — proves what the cache ACTUALLY does across topics.
 *
 * Costs real money (~$0.03/run: 2 calls, max_tokens=16 so output is negligible).
 * Runs on `claude-sonnet-4-6` — the model /api/chat picks for a grounded topic
 * (useSonnet defaults to true for every grounded topic when TUTOR_SONNET_TOPICS
 * is unset), NOT the Haiku that smoke-agents.ts exercises.
 *
 * The question it answers: when a student opens topic B while topic A's entry
 * is warm, does anything get reused? The shared TUTOR_CORE sits in front of
 * both groundings, so it CAN be — but only if a breakpoint marks it.
 *
 * Usage:  npx tsx scripts/measure-cache-live.ts <topicA> <topicB>
 * Use a DIFFERENT topic pair for the before and after runs — entries live 5
 * minutes, and a re-used topic would hit the previous run's entry.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '../lib/agents/prompts';
import { TUTOR_TOOLS } from '../lib/agents/tools';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY missing from .env.local');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

// WARNING: HAIKU, NOT SONNET, AND THE HEADER ABOVE WAS STALE FOR A WEEK.
// `useSonnet` needs TUTOR_SONNET_TOPICS to name the topic; the variable is
// unset, so EVERY tutor turn in production runs on Haiku. Probing Sonnet
// measured a model no student reaches, at 3x the price, against a different
// cache minimum (1,024 vs 4,096) - the one number this probe turns on.
const MODEL = 'claude-haiku-4-5';
const IN_PRICE = 1.0; // $/MTok

const [topicA, topicB] = process.argv.slice(2);
if (!topicA || !topicB) {
  console.error('usage: npx tsx scripts/measure-cache-live.ts <topicA> <topicB>');
  process.exit(1);
}

async function turn(topic: string, label: string) {
  // `hasQuestion: true` is the shape of a real turn: a student on an exercise.
  const system = buildTutorSystem({ unitLevel: 5, formNumber: '572', topic, hasQuestion: true });
  const breakpoints = system.filter((b) => b.cache_control).length;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16,
    system,
    // WARNING: TOOLS, because they SERIALISE AHEAD OF `system` in the cached
    // prefix. Without them this probe measures a prefix that differs from
    // production by ~1,035 tokens at the very front, which is a different cache
    // entry entirely - every read would miss for the wrong reason.
    tools: TUTOR_TOOLS,
    messages: [{ role: 'user', content: 'שלום' }],
  });

  const read = msg.usage.cache_read_input_tokens ?? 0;
  const write = msg.usage.cache_creation_input_tokens ?? 0;
  const fresh = msg.usage.input_tokens;
  // What you are actually billed, in base-input-token equivalents.
  // 1h TTL: the write is 2x, not the 5-minute 1.25x this line assumed.
  const billed = read * 0.1 + write * 2.0 + fresh;

  console.log(
    `  ${label.padEnd(22)} breakpoints=${breakpoints}  read=${String(read).padStart(5)}  ` +
      `write=${String(write).padStart(5)}  fresh=${String(fresh).padStart(4)}  ` +
      `→ billed ${Math.round(billed).toLocaleString().padStart(6)} tok-eq  ` +
      `$${((billed / 1_000_000) * IN_PRICE).toFixed(5)}`
  );
  return billed;
}

async function main() {
  console.log(`\nLive cache probe on ${MODEL} — 3 calls, ~$0.02\n`);
  console.log(`  (billed tok-eq = read x0.1 + write x2.0 + fresh x1.0)\n`);

  await turn(topicA, `1. ${topicA} (cold)`);
  const second = await turn(topicB, `2. ${topicB} (new topic)`);
  // WARNING: THE CONTROL. Without it a read=0 on call 2 proves nothing - it
  // could mean the shared core is not reused, or that NOTHING caches at all.
  // Repeating topic A must read its own full prefix; if that also reads 0, the
  // problem is caching itself and not the breakpoint layout.
  await turn(topicA, `3. ${topicA} again`);

  console.log(
    `\n  The second call is the one that matters: it is a DIFFERENT topic, so its\n` +
      `  grounding block is new. Anything it reads from cache is the shared core.\n` +
      `  → second call billed ${Math.round(second).toLocaleString()} token-equivalents.\n`
  );
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
