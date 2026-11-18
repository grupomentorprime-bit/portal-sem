import { isMentorAppId, type MentorAppId } from "@/lib/desktop/catalog";

export interface AppRequest {
  tenantId: string;
  appId: MentorAppId;
  requestedBy: string;
  createdAt: string;
  status: "open" | "fulfilled";
}

export interface AppRequestStore {
  findOpen(tenantId: string, appId: MentorAppId): Promise<AppRequest | null>;
  insertOpen(row: AppRequest): Promise<void>;
  fulfillOpen(tenantId: string, appId: MentorAppId): Promise<void>;
  listOpen(tenantId: string): Promise<AppRequest[]>;
  listAllOpen(): Promise<AppRequest[]>;
}

export function createMemoryAppRequestStore(): AppRequestStore {
  const rows: AppRequest[] = [];
  return {
    async findOpen(tenantId, appId) {
      return rows.find((row) => row.tenantId === tenantId && row.appId === appId && row.status === "open") ?? null;
    },
    async insertOpen(row) {
      rows.push(row);
    },
    async fulfillOpen(tenantId, appId) {
      for (const row of rows) {
        if (row.tenantId === tenantId && row.appId === appId && row.status === "open") {
          row.status = "fulfilled";
        }
      }
    },
    async listOpen(tenantId) {
      return rows.filter((row) => row.tenantId === tenantId && row.status === "open");
    },
    async listAllOpen() {
      return rows.filter((row) => row.status === "open");
    },
  };
}

export async function recordAppRequest(
  store: AppRequestStore,
  input: {
    tenantId: string;
    appId: string;
    requestedBy: string;
    contracted: readonly string[];
    now?: string;
  }
): Promise<{ ok: true; already: boolean } | { ok: false; reason: "unknown" | "contracted" }> {
  if (!isMentorAppId(input.appId)) return { ok: false, reason: "unknown" };
  if (input.contracted.includes(input.appId)) return { ok: false, reason: "contracted" };
  const existing = await store.findOpen(input.tenantId, input.appId);
  if (existing) return { ok: true, already: true };
  await store.insertOpen({
    tenantId: input.tenantId,
    appId: input.appId,
    requestedBy: input.requestedBy,
    createdAt: input.now ?? new Date().toISOString(),
    status: "open",
  });
  return { ok: true, already: false };
}
