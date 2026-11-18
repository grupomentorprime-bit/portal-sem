import "server-only";

import { generateId } from "@/core/identity/auth/crypto";
import {
  foldCongressChurchBase,
  formatCongressChurchLabel,
} from "@/core/congress/church-name";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
} from "@/core/congress/constants";
import type { CongressChurch } from "@/core/congress/types";
import { getDatabase } from "@/lib/mongodb";

function foldChurchKey(zoneId: string, churchName: string): string {
  return `${zoneId.trim().toLowerCase()}|${foldCongressChurchBase(churchName)}`;
}

export async function upsertCongressChurches(input: {
  tenantId: string;
  churches: Array<{ zoneId: string; churchName: string }>;
  source?: CongressChurch["source"];
  importBatchId?: string | null;
  now?: string;
}): Promise<number> {
  if (!input.churches.length) return 0;
  const db = await getDatabase();
  const now = input.now ?? new Date().toISOString();
  const source = input.source ?? "import";
  const col = db.collection<CongressChurch>(CONGRESS_COLLECTIONS.churches);

  const existing = await col
    .find({ tenantId: input.tenantId, eventId: CONGRESS_EVENT_ID })
    .toArray();
  const byKey = new Map(
    existing.map((row) => [foldChurchKey(row.zoneId, row.churchName), row] as const)
  );

  let upserted = 0;
  for (const church of input.churches) {
    const churchName = formatCongressChurchLabel(church.churchName.trim());
    const zoneId = church.zoneId.trim();
    if (!churchName || !zoneId) continue;
    const key = foldChurchKey(zoneId, churchName);
    const found = byKey.get(key);
    if (found) {
      await col.updateOne(
        { _id: found._id },
        {
          $set: {
            updatedAt: now,
            ...(input.importBatchId
              ? { importBatchId: input.importBatchId }
              : {}),
          },
        }
      );
      upserted += 1;
      continue;
    }
    const doc: CongressChurch = {
      _id: generateId("cch"),
      tenantId: input.tenantId,
      eventId: CONGRESS_EVENT_ID,
      zoneId,
      churchName,
      source,
      importBatchId: input.importBatchId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);
    byKey.set(key, doc);
    upserted += 1;
  }
  return upserted;
}

export async function listCongressChurches(
  tenantId: string,
  zoneId?: string
): Promise<CongressChurch[]> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = {
    tenantId,
    eventId: CONGRESS_EVENT_ID,
  };
  if (zoneId?.trim()) filter.zoneId = zoneId.trim();
  return db
    .collection<CongressChurch>(CONGRESS_COLLECTIONS.churches)
    .find(filter)
    .sort({ zoneId: 1, churchName: 1 })
    .toArray();
}
