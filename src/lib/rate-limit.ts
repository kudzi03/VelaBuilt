/**
 * Fixed-window rate limiter, in process memory.
 *
 * Adequate for a single-instance marketing site and honest about its limits:
 * it does not survive a restart and does not coordinate across instances.
 * Before running multiple instances, swap the two functions below for a
 * shared store (Upstash Redis, Vercel KV, Cloudflare Durable Object). The
 * call sites do not change.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Bounded so a flood of unique keys cannot grow memory without limit. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  readonly ok: boolean;
  readonly remaining: number;
  /** Seconds until the window resets. */
  readonly retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_KEYS) sweep(now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: limit - existing.count, retryAfter };
}

function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  // Still full of live windows: drop the oldest to stay bounded.
  if (windows.size >= MAX_TRACKED_KEYS) {
    const oldest = [...windows.entries()]
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
      .slice(0, Math.floor(MAX_TRACKED_KEYS / 4));
    for (const [key] of oldest) windows.delete(key);
  }
}

/**
 * Best-effort client identity for rate limiting. Proxy headers are spoofable,
 * so this is a throttle, not an authorisation decision — never treat it as one.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return (
    first ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
