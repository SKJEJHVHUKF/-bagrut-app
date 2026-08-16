/**
 * storage.ts — one localStorage write, and one place that notices when it fails.
 *
 * Every store in lib/ had its own `try { setItem } catch { /* ignore *\/ }`. That
 * is the right shape — a full disk must never crash a lesson — but it made the
 * app's single worst failure mode completely invisible:
 *
 *   the quota fills → `recordResult` still returns normally → the score on
 *   screen still updates → and the write is gone. The streak stops, the 14-day
 *   chart flatlines, the roadmap stops remembering cleared rungs, and there is
 *   no error anywhere. A student sees an app that has started forgetting them,
 *   days before an exam, and leaves.
 *
 * `safeSet` keeps the degradation and removes the silence: it returns false, and
 * the first failure in a session dispatches `bagrut-storage-full`, which the
 * global chrome turns into one toast. A DOM event rather than a direct `sonner`
 * import on purpose — the same convention `bagrut-state-dirty` already uses, so
 * these pure stores stay free of UI dependencies.
 */

export const STORAGE_FULL_EVENT = 'bagrut-storage-full';

/** One notice per session. A student who is out of space is out of space for
 *  every subsequent write, and ten toasts say nothing the first one didn't. */
let notified = false;

export function safeSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[storage] write failed for "${key}" — ${(value.length / 1024) | 0}KB`, err);
    if (!notified) {
      notified = true;
      try {
        window.dispatchEvent(new Event(STORAGE_FULL_EVENT));
      } catch {
        /* very old browser — the console warning above is all we get */
      }
    }
    return false;
  }
}

/** `safeSet` for a value that still needs JSON encoding. Encoding is inside the
 *  try because a circular structure throws here too, and that is also a write
 *  that silently did not happen. */
export function safeSetJSON(key: string, value: unknown): boolean {
  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch (err) {
    console.warn(`[storage] could not encode "${key}"`, err);
    return false;
  }
  return safeSet(key, encoded);
}
