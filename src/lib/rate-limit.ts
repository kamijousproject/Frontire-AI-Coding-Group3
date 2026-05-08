/**
 * Rate Limiting Middleware
 * In-memory per-IP rate limiter: 60 requests per 60-second window.
 *
 * IP extraction reads the LAST value of X-Forwarded-For (Railway appends
 * the real client IP to the end — first value is spoofable).
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Extract client IP from request.
 * Uses the last value of X-Forwarded-For to prevent spoofing.
 * Falls back to '127.0.0.1' if header absent.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded) return '127.0.0.1';

  // Railway appends real IP at the end; split by comma and pop last value
  const parts = forwarded.split(',');
  const ip = parts.pop()?.trim() ?? '127.0.0.1';
  return ip || '127.0.0.1';
}

/**
 * Check the rate limit for the requesting IP.
 * Returns { allowed: boolean; remaining: number }.
 */
export function checkRateLimit(request: Request): {
  allowed: boolean;
  remaining: number;
} {
  const ip = getClientIp(request);
  const now = Date.now();

  const entry = store.get(ip);

  // No entry, or entry has expired: start a fresh window
  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  // Existing valid window: increment count
  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}
