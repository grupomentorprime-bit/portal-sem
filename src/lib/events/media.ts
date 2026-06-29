import "server-only";

import type { CmsMediaAsset } from "@/types/media";

export async function emitMediaUploaded(asset: CmsMediaAsset): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "MediaUploaded",
    tenantId: asset.tenant,
    entityType: "cms.media",
    entityId: asset._id,
    userId: asset.createdBy,
    payload: {
      filename: asset.filename,
      mimeType: asset.mimeType,
      folder: asset.folder,
      url: asset.url,
    },
  });
}

export async function emitMediaUpdated(asset: CmsMediaAsset): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "MediaUpdated",
    tenantId: asset.tenant,
    entityType: "cms.media",
    entityId: asset._id,
    payload: { filename: asset.filename, folder: asset.folder },
  });
}

export async function emitMediaDeleted(asset: CmsMediaAsset): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "MediaDeleted",
    tenantId: asset.tenant,
    entityType: "cms.media",
    entityId: asset._id,
    payload: { filename: asset.filename, permanent: asset.visibility === "trash" },
  });
}
