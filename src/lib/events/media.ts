import "server-only";

import type { CmsMediaAsset } from "@/types/media";

async function publishMediaEvent(
  type: string,
  asset: CmsMediaAsset,
  payload: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type,
    tenantId: asset.tenant,
    entityType: "cms.media",
    entityId: asset._id,
    userId: userId ?? asset.createdBy,
    payload: {
      filename: asset.filename,
      mimeType: asset.mimeType,
      folder: asset.folder,
      ...payload,
    },
  });
}

export async function emitMediaUploaded(asset: CmsMediaAsset): Promise<void> {
  await publishMediaEvent("MediaUploaded", asset, { url: asset.url });
}

export async function emitMediaRenamed(asset: CmsMediaAsset, previousName: string): Promise<void> {
  await publishMediaEvent("MediaRenamed", asset, { previousName, newName: asset.originalName });
}

export async function emitMediaMoved(asset: CmsMediaAsset, previousFolder: string): Promise<void> {
  await publishMediaEvent("MediaMoved", asset, { previousFolder, folder: asset.folder });
}

export async function emitMediaReplaced(asset: CmsMediaAsset): Promise<void> {
  await publishMediaEvent("MediaReplaced", asset, { version: asset.version });
}

export async function emitMediaFavorited(asset: CmsMediaAsset, favorite: boolean): Promise<void> {
  await publishMediaEvent("MediaFavorited", asset, { favorite });
}

export async function emitMediaTagged(asset: CmsMediaAsset, tags: string[]): Promise<void> {
  await publishMediaEvent("MediaTagged", asset, { tags });
}

export async function emitMediaUpdated(asset: CmsMediaAsset): Promise<void> {
  await publishMediaEvent("MediaUpdated", asset);
}

export async function emitMediaDeleted(asset: CmsMediaAsset): Promise<void> {
  await publishMediaEvent("MediaDeleted", asset, {
    permanent: asset.visibility === "trash",
  });
}

export async function emitMediaRestoreRequested(asset: CmsMediaAsset): Promise<void> {
  await publishMediaEvent("MediaRestoreRequested", asset);
}
