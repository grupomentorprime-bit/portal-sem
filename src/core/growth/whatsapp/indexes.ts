/**
 * OT-GROWTH-MESSAGING-002 — índices de conexiones WhatsApp (fuera del doc del Espacio).
 */

import type { Db } from "mongodb";
import { GROWTH_WHATSAPP_CONNECTIONS_COLLECTION } from "./types";

export type EnsureWhatsAppIndexResult = "created" | "exists";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: {
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }
): Promise<EnsureWhatsAppIndexResult> {
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

export async function ensureGrowthWhatsAppIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureWhatsAppIndexResult }>;
}> {
  const col = db.collection(GROWTH_WHATSAPP_CONNECTIONS_COLLECTION);

  const specs: Array<{
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
  }> = [
    {
      keys: { tenantId: 1 },
      name: "tenantId_unique",
      unique: true,
    },
    {
      keys: { phoneNumberId: 1 },
      name: "phoneNumberId_unique",
      unique: true,
    },
  ];

  const results: Array<{ name: string; result: EnsureWhatsAppIndexResult }> = [];
  for (const spec of specs) {
    const result = await ensureIndex(col, spec.keys, {
      name: spec.name,
      unique: spec.unique,
    });
    results.push({ name: spec.name, result });
  }
  return { results };
}
