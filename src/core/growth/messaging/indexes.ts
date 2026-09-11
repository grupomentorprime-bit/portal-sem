/**
 * OT-GROWTH-MESSAGING-001 — índices tenant-scoped Conversación / Mensaje.
 */

import type { Db } from "mongodb";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
} from "./types";

export type EnsureMessagingIndexResult = "created" | "exists";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: {
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }
): Promise<EnsureMessagingIndexResult> {
  try {
    const indexOptions: {
      name: string;
      background: boolean;
      unique?: boolean;
      sparse?: boolean;
    } = {
      name: options.name,
      background: true,
    };
    if (options.unique) indexOptions.unique = true;
    if (options.sparse) indexOptions.sparse = true;
    await collection.createIndex(keys, indexOptions);
    return "created";
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

export async function ensureGrowthMessagingIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureMessagingIndexResult }>;
}> {
  const conversaciones = db.collection(GROWTH_CONVERSACIONES_COLLECTION);
  const mensajes = db.collection(GROWTH_MENSAJES_COLLECTION);

  const specs: Array<{
    collection: typeof conversaciones | typeof mensajes;
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }> = [
    {
      collection: conversaciones,
      keys: { tenantId: 1, channel: 1, externalThreadId: 1 },
      name: "tenantId_channel_externalThreadId_unique",
      unique: true,
      sparse: true,
    },
    {
      collection: conversaciones,
      keys: { tenantId: 1, personaId: 1, channel: 1, status: 1 },
      name: "tenantId_personaId_channel_status",
    },
    {
      collection: conversaciones,
      keys: { tenantId: 1, updatedAt: -1 },
      name: "tenantId_updatedAt",
    },
    {
      collection: mensajes,
      keys: { tenantId: 1, channel: 1, externalMessageId: 1 },
      name: "tenantId_channel_externalMessageId_unique",
      unique: true,
      sparse: true,
    },
    {
      collection: mensajes,
      keys: { tenantId: 1, conversationId: 1, occurredAt: 1 },
      name: "tenantId_conversationId_occurredAt",
    },
    {
      collection: mensajes,
      keys: { tenantId: 1, clientRequestId: 1 },
      name: "tenantId_clientRequestId_unique",
      unique: true,
      sparse: true,
    },
  ];

  const results: Array<{ name: string; result: EnsureMessagingIndexResult }> =
    [];
  for (const spec of specs) {
    const result = await ensureIndex(spec.collection, spec.keys, {
      name: spec.name,
      unique: spec.unique,
      sparse: spec.sparse,
    });
    results.push({ name: spec.name, result });
  }

  return { results };
}
