/**
 * Simple in-memory IP-based rate limiter.
 * Protects /api/questions from abuse (e.g., someone hammering the
 * endpoint to drain the Anthropic API quota).
 *
 * Limits:
 *   - 10 requests per minute per IP (short burst protection)
 *   - 60 requests per hour per IP (long-term protection)
 *
 * Notes / limitations:
 *   - Works within a single serverless instance. Vercel may spin up
 *     multiple instances under heavy load, in which case each instance
 *     enforces the limit independently. Good enough for a hobby/free
 *     project. For production-grade, switch to Upstash Redis.
 *   - The in-memory map self-cleans expired entries on every check.
 */

type Bucket = {
  minuteCount: number;
  minuteResetAt: number;
  hourCount: number;
  hourResetAt: number;
};

const buckets = new Map<string, Bucket>();

// Limits
const MINUTE_LIMIT = 10;
const HOUR_LIMIT = 60;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Cleanup interval - prune expired entries to keep memory bounded
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  for (const [key, b] of buckets.entries()) {
    if (b.hourResetAt < now) buckets.delete(key);
  }
  lastCleanup = now;
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: 'minute' | 'hour'; retryAfterSeconds: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = {
      minuteCount: 0,
      minuteResetAt: now + MINUTE_MS,
      hourCount: 0,
      hourResetAt: now + HOUR_MS,
    };
    buckets.set(ip, bucket);
  }

  // Reset windows if elapsed
  if (bucket.minuteResetAt < now) {
    bucket.minuteCount = 0;
    bucket.minuteResetAt = now + MINUTE_MS;
  }
  if (bucket.hourResetAt < now) {
    bucket.hourCount = 0;
    bucket.hourResetAt = now + HOUR_MS;
  }

  // Enforce limits
  if (bucket.minuteCount >= MINUTE_LIMIT) {
    return {
      allowed: false,
      reason: 'minute',
      retryAfterSeconds: Math.ceil((bucket.minuteResetAt - now) / 1000),
    };
  }
  if (bucket.hourCount >= HOUR_LIMIT) {
    return {
      allowed: false,
      reason: 'hour',
      retryAfterSeconds: Math.ceil((bucket.hourResetAt - now) / 1000),
    };
  }

  // Allowed - increment counters
  bucket.minuteCount += 1;
  bucket.hourCount += 1;
  return { allowed: true, remaining: MINUTE_LIMIT - bucket.minuteCount };
}

/**
 * Extract the client IP from a Fetch Request.
 * On Vercel, x-forwarded-for is set with the real client IP first.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    // First entry is the original client (subsequent are proxies)
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}
