/**
 * measure-generator-cachefit.ts — is a cache breakpoint on the generator prompt
 * worth declaring, or would it be a silent no-op?
 *
 *   npx tsx scripts/measure-generator-cachefit.ts
 *
 * FREE — uses the token-counting endpoint, not a generation.
 *
 * WHY THIS RUNS BEFORE ANY `cache_control` IS ADDED
 * -------------------------------------------------
 * Below a model's minimum cacheable prefix, a `cache_control` marker is a
 * SILENT no-op: no error, no warning, no saving. lib/agents/prompts.ts has the
 * scar tissue — its comment warns that shrinking the tutor prefix back under
 * 4,096 "silently switches caching off on the Haiku path and roughly 10x's the
 * input cost per turn". Declaring a breakpoint and assuming it works is how you
 * end up reporting a saving that never happened.
 *
 * Minimums: Haiku 4.5 needs 4,096 tokens; Sonnet needs 1,024.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { buildGeneratorPrompt, SUBJECTS } from '@/lib/generator-prompt';
import { GENERATOR_MODEL } from '@/lib/agents/config';
import { MATH_FORMAT_RULES } from '@/lib/agents/prompts';

const MINIMUMS: Record<string, number> = {
  'claude-haiku-4-5': 4096,
  'claude-sonnet-5': 1024,
  'claude-sonnet-4-6': 1024,
};

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY missing');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

async function count(text: string): Promise<number> {
  const res = await client.messages.countTokens({
    model: GENERATOR_MODEL,
    messages: [{ role: 'user', content: text }],
  });
  return res.input_tokens;
}

(async () => {
  const topics = ['חשבון דיפרנציאלי', 'מספרים מרוכבים', 'טריגונומטריה', 'הסתברות'];

  console.log(`\nmeasure-generator-cachefit — model ${GENERATOR_MODEL}\n`);

  // The STABLE prefix is everything that does not change between calls. Only
  // that part can ever be cached: the topic and the variation seed cannot.
  const rulesOnly = await count(MATH_FORMAT_RULES);
  console.log(`  MATH_FORMAT_RULES alone          ${rulesOnly} tokens`);

  let min = Infinity;
  let max = 0;
  for (const topic of topics) {
    const full = await count(
      buildGeneratorPrompt({ subject: 'math5', topic, difficulty: 'normal', seed: 'x' })
    );
    min = Math.min(min, full);
    max = Math.max(max, full);
    console.log(`  full prompt — ${topic.padEnd(18)} ${full} tokens`);
  }

  // Cross-subject: the per-subject line differs, so a shared breakpoint can
  // only cover what every subject has in common.
  const perSubject: number[] = [];
  for (const key of Object.keys(SUBJECTS)) {
    perSubject.push(
      await count(buildGeneratorPrompt({ subject: key, topic: 'נושא', difficulty: 'normal', seed: 'x' }))
    );
  }

  const minimum = MINIMUMS[GENERATOR_MODEL] ?? 4096;
  console.log(`\n  full prompt range        ${min}-${max} tokens`);
  console.log(`  across all 7 subjects    ${Math.min(...perSubject)}-${Math.max(...perSubject)} tokens`);
  console.log(`  cacheable stable prefix  ~${rulesOnly} tokens (the shared rules block)`);
  console.log(`  ${GENERATOR_MODEL} minimum    ${minimum} tokens\n`);

  if (rulesOnly >= minimum) {
    console.log('  ✅ WORTH IT — the stable prefix clears the minimum. Add cache_control.');
  } else {
    console.log(`  ❌ NO-OP — the stable prefix is ${minimum - rulesOnly} tokens SHORT of the minimum.`);
    console.log('     A cache_control marker here would cost nothing and save nothing.');
    console.log('     Do not add one, and do not report a saving from it.');
  }
  console.log();
})();
