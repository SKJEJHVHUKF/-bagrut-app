/**
 * In-memory rate limiter with fingerprinting.
 *
 * Tracks by a fingerprint that combines client IP + a hash of the User-Agent.
 * This makes simple IP rotation less effective — an attacker would also need
 * to randomize their User-Agent to bypass per-fingerprint limits.
 *
 * Limits per fingerprint:
 *   - 10 requests per minute (short burst protection)
 *   - 60 requests per hour (long-term protection)
 *
 * Additionally tracks **global** request volume across all IPs:
 *   - 200 requests per minute total (DDoS / cost-spike protection)
 *
 * Notes:
 *   - Works within a single serverless instance. For multi-instance
 *     consistency, switch to Upstash Redis (free tier 10K commands/day).
 *   - In-memory entries self-clean periodically to bound memory.
 */

type Bucket = {
  minuteCount: number;
  minuteResetAt: number;
  hourCount: number;
  hourResetAt: number;
};

const buckets = new Map<string, Bucket>();

// Per-fingerprint limits
const MINUTE_LIMIT = 10;
const HOUR_LIMIT = 60;

// Global circuit breaker - protects against distributed attacks
const GLOBAL_MINUTE_LIMIT = 200;
let globalMinuteCount = 0;
let globalMinuteResetAt = Date.now() + 60_000;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Cleanup
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
  | { allowed: false; reason: 'minute' | 'hour' | 'global'; retryAfterSeconds: number };

/**
 * Cheap, deterministic 32-bit hash. We don't need cryptographic strength here —
 * just a way to fold the User-Agent into the fingerprint so attackers can't
 * trivially bypass the limiter by rotating IPs while keeping the same UA.
 */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function checkRateLimit(fingerprint: string): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  // ===== Global circuit breaker =====
  if (globalMinuteResetAt < now) {
    globalMinuteCount = 0;
    globalMinuteResetAt = now + MINUTE_MS;
  }
  if (globalMinuteCount >= GLOBAL_MINUTE_LIMIT) {
    return {
      allowed: false,
      reason: 'global',
      retryAfterSeconds: Math.ceil((globalMinuteResetAt - now) / 1000),
    };
  }

  // ===== Per-fingerprint =====
  let bucket = buckets.get(fingerprint);
  if (!bucket) {
    bucket = {
      minuteCount: 0,
      minuteResetAt: now + MINUTE_MS,
      hourCount: 0,
      hourResetAt: now + HOUR_MS,
    };
    buckets.set(fingerprint, bucket);
  }

  if (bucket.minuteResetAt < now) {
    bucket.minuteCount = 0;
    bucket.minuteResetAt = now + MINUTE_MS;
  }
  if (bucket.hourResetAt < now) {
    bucket.hourCount = 0;
    bucket.hourResetAt = now + HOUR_MS;
  }

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

  bucket.minuteCount += 1;
  bucket.hourCount += 1;
  globalMinuteCount += 1;
  return { allowed: true, remaining: MINUTE_LIMIT - bucket.minuteCount };
}

/**
 * Build a fingerprint from request headers.
 * Combines client IP (from x-forwarded-for) with a hash of the User-Agent.
 */
export function getFingerprint(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  let ip = 'unknown';
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) ip = first;
  } else {
    const xri = request.headers.get('x-real-ip');
    if (xri) ip = xri.trim();
  }
  const ua = request.headers.get('user-agent') || '';
  return `${ip}::${fnv1a(ua)}`;
}

/**
 * Detect obvious automated clients via User-Agent.
 * Not bulletproof (UAs can be spoofed) but stops casual scraping.
 */
const BOT_UA_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /scraper/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /python-urllib/i,
  /http-client/i,
  /go-http-client/i,
  /postman/i,
  /insomnia/i,
  /^$/, // empty UA - very suspicious for a browser request
];

export function looksLikeBot(request: Request): boolean {
  const ua = (request.headers.get('user-agent') || '').trim();
  if (!ua) return true;
  return BOT_UA_PATTERNS.some((re) => re.test(ua));
}
