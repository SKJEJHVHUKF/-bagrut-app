/**
 * Report a rendering crash to /api/client-error, fire-and-forget.
 *
 * Shared by app/error.tsx and app/global-error.tsx. Runs inside an error
 * boundary, so it must never throw itself: every failure path is swallowed.
 */
export function reportClientError(error: Error & { digest?: string }): void {
  try {
    const body = JSON.stringify({
      message: String(error?.message ?? error).slice(0, 500),
      stack: String(error?.stack ?? '').slice(0, 4000),
      digest: error?.digest ?? null,
      path: typeof location !== 'undefined' ? location.pathname : null,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
    });
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* reporting must never make the crash worse */
  }
}
