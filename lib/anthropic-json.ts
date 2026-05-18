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
 * Single attempt — no automatic retry. The earlier retry strategy was
 * doubling cost on failure (~$0.10/call instead of $0.04). If a generation
 * fails, surface the error to the client and let the student press
 * "try again" if they want to spend another call.
 */
export async function generateJSON<T = unknown>(
  client: Anthropic,
  args: CreateArgs,
  context: string = 'generateJSON'
): Promise<GenerateJSONResult<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await client.messages.create(args as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = message as any;
  const totalIn = msg.usage?.input_tokens ?? 0;
  const totalOut = msg.usage?.output_tokens ?? 0;

  const content = msg.content?.[0];
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response shape from Claude');
  }
  try {
    const data = JSON.parse(content.text) as T;
    return { data, attempts: 1, modelTokens: { input: totalIn, output: totalOut } };
  } catch (err) {
    console.warn(`[${context}] JSON parse failed:`, (err as Error).message);
    throw err;
  }
}
