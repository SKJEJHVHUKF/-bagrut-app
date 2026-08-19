/**
 * In-memory burst limiter, keyed by client IP.
 *
 * Limits per IP:
 *   - 10 requests per minute (short burst protection)
 *   - 60 requests per hour (long-term protection)
 *
 * Additionally tracks **global** request volume across all IPs:
 *   - 200 requests per minute total (DDoS / cost-spike protection)
 *
 * ⚠️ This is a blast shield, not the quota. It lives in ONE serverless
 * instance's memory: it resets on every cold start and is not shared between
 * concurrent instances. The brake that actually bounds spend is the durable
 * per-user count in `ai_generation_log` (lib/agents/guard.ts) — every AI route
 * must go through that gate; this limiter only absorbs bursts in front of it.
 *
 * The key used to be `ip::hash(user-agent)`, sold as "harder to bypass". It
 * was the opposite: the UA is attacker-controlled, so every rotated UA opened
 * a fresh bucket and the per-key limits meant nothing. Vercel overwrites
 * x-forwarded-for with the real client IP (it cannot be spoofed from outside),
 * so the IP alone is the honest key.
 *
 * For a limiter shared across instances, swap checkRateLimit for
 * @upstash/ratelimit — nothing else needs to change.
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
 * The limiter key: the client IP (first hop of x-forwarded-for, which Vercel
 * sets itself), falling back to x-real-ip. Nothing attacker-controlled goes in.
 */
export function getFingerprint(request: Request): string {
  const first = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip')?.trim() || 'unknown';
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
