// Simple fixed-window rate limiter kept in process memory. It protects a single
// server instance; account lockout in the database covers multi-instance hosts.

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { _rateLimit?: Map<string, Bucket> };
const buckets = globalStore._rateLimit || (globalStore._rateLimit = new Map());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}
