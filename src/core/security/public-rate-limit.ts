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

/**
 * Contador atómico por ventana. Varios procesos comparten la misma instancia
 * (Mongo u otra) y entonces el tope vale para todos. La memoria de un proceso
 * no cruza instancias.
 */
export interface DistributedRateLimitStore {
  increment(bucketKey: string, ttlMs: number): Promise<number>;
}

export function createMemoryDistributedRateLimitStore(): DistributedRateLimitStore & {
  clear(): void;
} {
  const buckets = new Map<string, { count: number; expiresAt: number }>();
  return {
    async increment(bucketKey, ttlMs) {
      const now = Date.now();
      const current = buckets.get(bucketKey);
      if (!current || current.expiresAt <= now) {
        buckets.set(bucketKey, { count: 1, expiresAt: now + ttlMs });
        return 1;
      }
      current.count += 1;
      return current.count;
    },
    clear() {
      buckets.clear();
    },
  };
}

export const sharedMemoryRateLimitStore = createMemoryDistributedRateLimitStore();

export async function consumeDistributedRateLimit(input: {
  store: DistributedRateLimitStore;
  key: string;
  limit: number;
  windowMs: number;
  nowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const bucket = Math.floor(input.nowMs / input.windowMs);
  const count = await input.store.increment(`${input.key}|${bucket}`, input.windowMs);
  if (count > input.limit) {
    const elapsed = input.nowMs % input.windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((input.windowMs - elapsed) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

type RateCollection = {
  findOneAndUpdate(
    filter: { _id: string },
    update: { $inc: { count: number }; $setOnInsert: { expiresAt: Date } },
    options: { upsert: true; returnDocument: "after" }
  ): Promise<{ count?: number; value?: { count?: number } } | null>;
};

/** Adaptador del contador sobre una colección ya existente. No abre la base por su cuenta. */
export function createCollectionRateLimitStore(collection: RateCollection): DistributedRateLimitStore {
  return {
    async increment(bucketKey, ttlMs) {
      const doc = await collection.findOneAndUpdate(
        { _id: bucketKey },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(Date.now() + ttlMs) },
        },
        { upsert: true, returnDocument: "after" }
      );
      const count = doc?.count ?? doc?.value?.count;
      if (typeof count !== "number" || count < 1) {
        throw new Error("El almacén de límite no devolvió un contador.");
      }
      return count;
    },
  };
}

let mongoStorePromise: Promise<DistributedRateLimitStore> | null = null;

export const RATE_LIMIT_FAILURE_RETRY_SEC = 60;

/** Producción siempre comparte Mongo. En otras ejecuciones, solo si RATE_LIMIT_BACKEND=mongo. */
export function sharedRateLimitBackend(env: NodeJS.ProcessEnv = process.env): "mongo" | "memory" {
  if (env.NODE_ENV === "production") return "mongo";
  if (env.RATE_LIMIT_BACKEND === "mongo") return "mongo";
  return "memory";
}

export function resetSharedRateLimitBackendForTests(): void {
  mongoStorePromise = null;
}

async function mongoRateLimitStore(): Promise<DistributedRateLimitStore> {
  if (!mongoStorePromise) {
    mongoStorePromise = (async () => {
      const { getDatabase } = await import("@/lib/mongodb");
      const db = await getDatabase();
      const collection = db.collection("security_rate_limits");
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      return createCollectionRateLimitStore(collection as unknown as RateCollection);
    })().catch((error: unknown) => {
      mongoStorePromise = null;
      throw error;
    });
  }
  return mongoStorePromise;
}

/**
 * Tope compartido entre procesos cuando el backend es Mongo.
 * Si el almacén falla, la ruta queda cerrada: no se cae a la memoria del proceso.
 */
export async function consumeSharedRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
  store?: DistributedRateLimitStore;
  env?: NodeJS.ProcessEnv;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  try {
    const store =
      input.store ??
      (sharedRateLimitBackend(input.env) === "mongo"
        ? await mongoRateLimitStore()
        : sharedMemoryRateLimitStore);
    return await consumeDistributedRateLimit({
      store,
      key: input.key,
      limit: input.limit,
      windowMs: input.windowMs,
      nowMs: input.nowMs ?? Date.now(),
    });
  } catch {
    console.error("[rate-limit] backend unavailable");
    return { ok: false, retryAfterSec: RATE_LIMIT_FAILURE_RETRY_SEC };
  }
}
