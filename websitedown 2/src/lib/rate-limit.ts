// src/lib/rate-limit.ts
// In-memory rate limiter. Resets on cold start â acceptable for Netlify Functions.
// For production persistence, replace with @upstash/ratelimit + Redis.

const store = new Map<string, { count: number; reset: number }>();

// Cleanup stale entries every 60s to prevent memory leak
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key);
  }
}

/**
 * Check if a request is within rate limits.
 * @param key   Unique identifier (typically IP or IP+route)
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Extract client IP from Next.js request headers */
export function getClientIP(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")
    || "unknown";
}
