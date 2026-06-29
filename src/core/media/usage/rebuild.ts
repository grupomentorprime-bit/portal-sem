import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { CmsMediaAsset, MediaUsageRef } from "@/types/media";
import { getSiteConfigUncached } from "@/lib/cms/config";
import {
  scanBranding,
  scanEvents,
  scanNews,
  scanPages,
  scanPrograms,
  scanTeam,
} from "./scanners";

async function collectAllRefs(tenant: string): Promise<Map<string, MediaUsageRef[]>> {
  const config = await getSiteConfigUncached();
  const scans = await Promise.all([
    config ? scanBranding(tenant, config) : Promise.resolve([]),
    scanPages(tenant),
    scanPrograms(tenant),
    scanNews(tenant),
    scanEvents(tenant),
    scanTeam(tenant),
  ]);

  const byMediaId = new Map<string, MediaUsageRef[]>();

  for (const batch of scans) {
    for (const { mediaId, ref } of batch) {
      const list = byMediaId.get(mediaId) ?? [];
      const exists = list.some(
        (u) => u.module === ref.module && u.entityId === ref.entityId && u.field === ref.field
      );
      if (!exists) list.push(ref);
      byMediaId.set(mediaId, list);
    }
  }

  return byMediaId;
}

export async function rebuildUsageIndex(tenant: string): Promise<number> {
  const db = await getDatabase();
  const col = db.collection<CmsMediaAsset>("cms_media");
  const now = new Date().toISOString();

  await col.updateMany({ tenant }, { $set: { usage: [], updatedAt: now } });

  const refsByMediaId = await collectAllRefs(tenant);
  let updated = 0;

  for (const [mediaId, usage] of refsByMediaId) {
    const result = await col.updateOne(
      { _id: mediaId, tenant },
      { $set: { usage, updatedAt: now } }
    );
    if (result.matchedCount > 0) updated++;
  }

  return updated;
}
