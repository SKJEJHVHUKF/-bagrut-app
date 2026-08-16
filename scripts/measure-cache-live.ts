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

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY missing from .env.local');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

const MODEL = 'claude-sonnet-4-6';
const IN_PRICE = 3.0; // $/MTok

const [topicA, topicB] = process.argv.slice(2);
if (!topicA || !topicB) {
  console.error('usage: npx tsx scripts/measure-cache-live.ts <topicA> <topicB>');
  process.exit(1);
}

async function turn(topic: string, label: string) {
  const system = buildTutorSystem({ unitLevel: 5, formNumber: '572', topic });
  const breakpoints = system.filter((b) => b.cache_control).length;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16,
    system,
    messages: [{ role: 'user', content: 'שלום' }],
  });

  const read = msg.usage.cache_read_input_tokens ?? 0;
  const write = msg.usage.cache_creation_input_tokens ?? 0;
  const fresh = msg.usage.input_tokens;
  // What you are actually billed, in base-input-token equivalents.
  const billed = read * 0.1 + write * 1.25 + fresh;

  console.log(
    `  ${label.padEnd(22)} breakpoints=${breakpoints}  read=${String(read).padStart(5)}  ` +
      `write=${String(write).padStart(5)}  fresh=${String(fresh).padStart(4)}  ` +
      `→ billed ${Math.round(billed).toLocaleString().padStart(6)} tok-eq  ` +
      `$${((billed / 1_000_000) * IN_PRICE).toFixed(5)}`
  );
  return billed;
}

async function main() {
  console.log(`\nLive cache probe on ${MODEL} — 2 calls, ~$0.03\n`);
  console.log(`  (billed tok-eq = read×0.1 + write×1.25 + fresh×1.0)\n`);

  await turn(topicA, `1. ${topicA}`);
  const second = await turn(topicB, `2. ${topicB}`);

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
