export const PUBLIC_SEARCH_LIMIT = 20;
export const PUBLIC_SEARCH_WINDOW_MS = 60_000;
export const PUBLIC_MEDIA_PROBE_LIMIT = 30;

export interface RateLimitStore {
  get(key: string): number[] | undefined;
  set(key: string, hits: number[]): void;
}

export function createMemoryRateLimitStore(): RateLimitStore & { clear(): void } {
  const hits = new Map<string, number[]>();
  return {
    get: (key) => hits.get(key),
    set: (key, value) => {
      hits.set(key, value);
    },
    clear: () => hits.clear(),
  };
}

export const publicRateLimitStore = createMemoryRateLimitStore();

export function consumeRateLimit(input: {
  store: RateLimitStore;
  key: string;
  limit: number;
  windowMs: number;
  nowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const prev = (input.store.get(input.key) ?? []).filter(
    (stamp) => input.nowMs - stamp < input.windowMs
  );
  if (prev.length >= input.limit) {
    const oldest = prev[0] ?? input.nowMs;
    const retryAfterSec = Math.max(1, Math.ceil((input.windowMs - (input.nowMs - oldest)) / 1000));
    input.store.set(input.key, prev);
    return { ok: false, retryAfterSec };
  }
  prev.push(input.nowMs);
  input.store.set(input.key, prev);
  return { ok: true };
}

export function publicClientKey(forwardedFor: string | null, route: string): string {
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return `${route}|${ip}`;
}
