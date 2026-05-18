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
 * once on JSON.SyntaxError — but only if there's time budget left.
 *
 * Why the time check: Vercel Hobby caps serverless functions at 60s. A
 * single Sonnet 4.6 call with 2500 max_tokens takes ~35-45s. If we naively
 * retry on parse failure, two attempts run ~80s → Vercel kills the
 * function mid-flight and the client hangs forever in a loading state.
 *
 * So: if the first attempt finished within 25s, we have room for a retry.
 * Otherwise we surface the error to the client immediately so the UI can
 * show "try again" instead of looping into a timeout.
 */
const TIME_BUDGET_FOR_RETRY_MS = 25_000;

export async function generateJSON<T = unknown>(
  client: Anthropic,
  args: CreateArgs,
  context: string = 'generateJSON'
): Promise<GenerateJSONResult<T>> {
  const start = Date.now();
  let totalIn = 0;
  let totalOut = 0;

  async function once(): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = await client.messages.create(args as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = message as any;
    totalIn += msg.usage?.input_tokens ?? 0;
    totalOut += msg.usage?.output_tokens ?? 0;

    const content = msg.content?.[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response shape from Claude');
    }
    return JSON.parse(content.text) as T;
  }

  try {
    const data = await once();
    return {
      data,
      attempts: 1,
      modelTokens: { input: totalIn, output: totalOut },
    };
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;

    const elapsed = Date.now() - start;
    if (elapsed > TIME_BUDGET_FOR_RETRY_MS) {
      console.warn(
        `[${context}] parse failed after ${elapsed}ms — no time budget for retry`
      );
      throw err;
    }

    console.warn(`[${context}] parse failed after ${elapsed}ms — retrying once`);
    const data = await once();
    return {
      data,
      attempts: 2,
      modelTokens: { input: totalIn, output: totalOut },
    };
  }
}
