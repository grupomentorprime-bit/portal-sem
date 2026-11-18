const WINDOW_MS = 60_000;
const hits = new Map<string, number>();

export function __resetAccessRequestRateLimitForTests(): void {
  hits.clear();
}

export function assertAccessRequestAllowed(
  key: string
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const prev = hits.get(key) ?? 0;
  if (prev && now - prev < WINDOW_MS) {
    return { ok: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - prev)) / 1000) };
  }
  hits.set(key, now);
  return { ok: true };
}
