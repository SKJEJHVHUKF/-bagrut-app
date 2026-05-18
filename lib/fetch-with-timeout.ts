/**
 * fetchWithTimeout — wraps fetch with an AbortController-based timeout.
 *
 * Vercel Hobby kills serverless functions after 60 seconds. If a function
 * times out, the connection may be left dangling and the browser will sit
 * on a loading spinner forever. We set the client timeout to 58 seconds —
 * just under Vercel's cap — so the user gets a clean error instead of
 * an indefinite hang.
 */

export class FetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`הבקשה לקחה יותר מ-${Math.round(timeoutMs / 1000)} שניות. נסה שוב.`);
    this.name = 'FetchTimeoutError';
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = 58_000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new FetchTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
