/**
 * anthropic-json.ts — wrapper around Anthropic's structured-output mode
 * that retries on the known Sonnet-4.6 Hebrew-JSON parse glitch.
 *
 * The model occasionally returns malformed JSON (most often "Unterminated
 * string in JSON at position N") when generating Hebrew content with
 * structured outputs. We saw this in the pool-generation script (5 out
 * of 9 batches failed). Real users hit the same bug in /api/practice.
 *
 * Strategy: try once, and on a parse failure (SyntaxError), retry once.
 * Each retry costs ~$0.03-0.05 but is significantly better than showing
 * the student an error.
 */

import type Anthropic from '@anthropic-ai/sdk';

type CreateArgs = Parameters<Anthropic['messages']['create']>[0];

export type GenerateJSONResult<T> = {
  data: T;
  attempts: number;
  modelTokens: { input: number; output: number };
};

/**
 * Call Anthropic with structured-output JSON, parse the response, retry
 * once on JSON.SyntaxError. Throws if both attempts fail.
 */
export async function generateJSON<T = unknown>(
  client: Anthropic,
  args: CreateArgs,
  context: string = 'generateJSON'
): Promise<GenerateJSONResult<T>> {
  let lastError: unknown = null;
  let totalIn = 0;
  let totalOut = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await client.messages.create(args as any);

      // Track tokens across attempts so callers can log accurate cost.
      // The `as any` chain is unavoidable: Anthropic's stream/non-stream
      // union doesn't narrow cleanly here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = message as any;
      totalIn += msg.usage?.input_tokens ?? 0;
      totalOut += msg.usage?.output_tokens ?? 0;

      const content = msg.content?.[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response shape from Claude');
      }

      const parsed = JSON.parse(content.text) as T;
      return {
        data: parsed,
        attempts: attempt,
        modelTokens: { input: totalIn, output: totalOut },
      };
    } catch (err) {
      lastError = err;
      // Only retry on JSON parse errors — anything else (network, auth,
      // bad schema) won't be fixed by trying again.
      if (!(err instanceof SyntaxError)) throw err;
      console.warn(`[${context}] JSON parse attempt ${attempt} failed:`, (err as Error).message);
      // fall through to next attempt
    }
  }

  // Both attempts failed with parse errors.
  throw new Error(
    `Both generation attempts produced unparseable JSON. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
