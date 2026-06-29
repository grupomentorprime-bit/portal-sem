import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { CmsMediaAsset, MediaUsageRef } from "@/types/media";

export async function findMediaByUrl(
  tenant: string,
  url: string
): Promise<CmsMediaAsset | null> {
  if (!url?.trim()) return null;
  const db = await getDatabase();
  return db.collection<CmsMediaAsset>("cms_media").findOne({
    tenant,
    $or: [
      { url },
      { thumbnail: url },
      { "responsive.thumbnail": url },
      { "responsive.webp": url },
      { "responsive.w400": url },
      { "responsive.w800": url },
      { "responsive.w1200": url },
      { "responsive.w1920": url },
    ],
    visibility: "active",
  });
}

export async function registerMediaUsage(
  tenant: string,
  url: string,
  ref: MediaUsageRef
): Promise<void> {
  const media = await findMediaByUrl(tenant, url);
  if (!media) return;

  const db = await getDatabase();
  const usage = media.usage ?? [];
  const exists = usage.some(
    (u) => u.module === ref.module && u.entityId === ref.entityId && u.field === ref.field
  );

  if (!exists) {
    await db.collection<CmsMediaAsset>("cms_media").updateOne(
      { _id: media._id },
      { $push: { usage: ref }, $set: { updatedAt: new Date().toISOString() } }
    );
  }
}

export async function unregisterMediaUsage(
  tenant: string,
  module: string,
  entityId: string
): Promise<void> {
  const db = await getDatabase();
  await db.collection<CmsMediaAsset>("cms_media").updateMany(
    { tenant },
    {
      $pull: { usage: { module, entityId } },
      $set: { updatedAt: new Date().toISOString() },
    }
  );
}

export async function syncBrandingMediaUsage(
  tenant: string,
  branding: { logo?: string; favicon?: string; heroImage?: string }
): Promise<void> {
  await unregisterMediaUsage(tenant, "cms_config", "site");

  const fields: Array<{ field: string; url: string; label: string }> = [
    { field: "logo", url: branding.logo ?? "", label: "Configuración — Logo" },
    { field: "favicon", url: branding.favicon ?? "", label: "Configuración — Favicon" },
    { field: "heroImage", url: branding.heroImage ?? "", label: "Configuración — Hero" },
  ];

  for (const { field, url, label } of fields) {
    if (url) {
      await registerMediaUsage(tenant, url, {
        module: "cms_config",
        entityId: "site",
        field,
        label,
      });
    }
  }
}

export function mediaHasUsage(asset: CmsMediaAsset): boolean {
  return (asset.usage?.length ?? 0) > 0;
}
