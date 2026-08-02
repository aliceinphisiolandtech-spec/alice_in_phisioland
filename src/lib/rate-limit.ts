/**
 * Bardzo prosty limiter w pamięci procesu.
 *
 * Świadome ograniczenie: na serverless (Vercel) licznik żyje per instancja, więc
 * to zabezpieczenie "best effort" — wystarcza, by zwykły user nie zgadywał kodów
 * rabatowych w pętli z przeglądarki, ale nie jest to ochrona przed rozproszonym
 * atakiem. Gdyby kiedyś było potrzebne twardsze ograniczenie, w to miejsce
 * wchodzi Redis/Upstash bez zmiany wywołań.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Sekundy do zresetowania limitu (dla nagłówka Retry-After). */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfter: 0 };
}
