/**
 * estimate-scan-prefix.ts — can /api/scan-solve's cached system prompt survive
 * a move from claude-sonnet-4-5 to claude-haiku-4-5?
 *
 * ⚠️ ESTIMATE. Same calibration as scripts/estimate-prefix.ts (0.666 tok/char,
 * derived from TUTOR_CORE's live-measured 2,206 tokens), because the API key is
 * out of credit and countTokens is blocked too. Confirm with a real call.
 *
 * The question it answers: the minimum cacheable prefix is 1,024 tokens on
 * Sonnet 4.5 and 4,096 on Haiku 4.5. A prompt sitting between those two numbers
 * caches today and would SILENTLY stop caching after the swap — no error, no
 * warning. That is the exact failure /api/chat's ungrounded path was already in.
 */
import { readFileSync } from 'fs';

const TOK_PER_CHAR = 0.666;
const MIN = { 'claude-sonnet-4-5': 1024, 'claude-haiku-4-5': 4096 } as const;

const src = readFileSync('app/api/scan-solve/route.ts', 'utf8');

/** Grab a top-level `const NAME = ...` block up to the next top-level const. */
function block(name: string): string {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) throw new Error(`${name} not found`);
  const rest = src.slice(start + 10);
  const end = rest.search(/\nconst [A-Z_]+ =/);
  return end < 0 ? rest : rest.slice(0, end);
}

for (const name of ['SOLVE_STREAM_SYSTEM', 'TRANSCRIBE_SYSTEM']) {
  const chars = block(name).length;
  const tok = Math.round(chars * TOK_PER_CHAR);
  console.log(`${name.padEnd(20)} ~${tok} tok (${chars} chars)`);
  for (const [model, min] of Object.entries(MIN)) {
    console.log(`    ${model.padEnd(20)} min ${min}  ${tok >= min ? '✅ caches' : '❌ silent no-op'}`);
  }
}
