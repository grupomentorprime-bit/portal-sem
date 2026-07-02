import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import {
  DEFAULT_MEDIA_FOLDER,
  TRASH_RETENTION_DAYS,
  inferCategory,
} from "@/lib/cms/media-defaults";
import {
  computeFileHash,
  extractImageMetadata,
  processUploadedImage,
} from "@/lib/cms/media-processing";
import {
  buildStorageKey,
  deleteMediaPrefix,
  putMediaFile,
  readMediaFile,
  resolveMediaStoragePublicUrl,
  storageKeyFromMediaUrl,
} from "@/lib/cms/media-storage";
import { invalidateMediaCache } from "@/core/media/cache";
import { mediaHasUsage } from "@/lib/cms/media-usage-helpers";
import type {
  CmsMediaAsset,
  CmsMediaUpdate,
  MediaBulkAction,
  MediaFolder,
  MediaListQuery,
  MediaListResult,
  MediaSearchQuery,
} from "@/types/media";

const CMS_MEDIA_TAG = "cms-media";

function normalizeAsset(asset: CmsMediaAsset): CmsMediaAsset {
  return {
    ...asset,
    tags: asset.tags ?? [],
    usage: asset.usage ?? [],
    responsive: asset.responsive ?? {},
    visibility: asset.visibility ?? "active",
    title: asset.title ?? asset.originalName,
    status: asset.status ?? "active",
    favorite: asset.favorite ?? false,
    version: asset.version ?? 1,
  };
}

function buildSort(query: MediaListQuery): Record<string, 1 | -1> {
  const dir = query.direction === "asc" ? 1 : -1;
  switch (query.sort) {
    case "name":
      return { originalName: dir };
    case "size":
      return { size: dir };
    case "type":
      return { mimeType: dir };
    case "favorite":
      return { favorite: -1, createdAt: -1 };
    case "date":
    default:
      return { createdAt: dir };
  }
}

function buildFilter(query: MediaListQuery | MediaSearchQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    tenant: query.tenant,
    visibility: query.visibility ?? "active",
  };

  if (query.folder) filter.folder = query.folder;
  if (query.category) filter.category = query.category;
  if (query.mimeType) filter.mimeType = query.mimeType;
  if (query.createdBy) filter.createdBy = query.createdBy;
  if (query.tags?.length) filter.tags = { $in: query.tags };
  if (query.favorite === true) filter.favorite = true;

  if (query.usageFilter === "inUse") {
    filter["usage.0"] = { $exists: true };
  } else if (query.usageFilter === "noUse") {
    filter.$nor = [{ "usage.0": { $exists: true } }];
  }

  if (query.search) {
    const regex = {
      $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    filter.$or = [
      { originalName: regex },
      { alt: regex },
      { caption: regex },
      { tags: regex },
      { folder: regex },
      { author: regex },
      { mimeType: regex },
      { extension: regex },
    ];
  }

  const sq = query as MediaSearchQuery;
  if (sq.minSize !== undefined || sq.maxSize !== undefined) {
    const sizeFilter: Record<string, number> = {};
    if (sq.minSize !== undefined) sizeFilter.$gte = sq.minSize;
    if (sq.maxSize !== undefined) sizeFilter.$lte = sq.maxSize;
    filter.size = sizeFilter;
  }
  if (sq.dateFrom || sq.dateTo) {
    const dateFilter: Record<string, string> = {};
    if (sq.dateFrom) dateFilter.$gte = sq.dateFrom;
    if (sq.dateTo) dateFilter.$lte = sq.dateTo;
    filter.createdAt = dateFilter;
  }

  return filter;
}

async function fetchMediaList(query: MediaListQuery): Promise<MediaListResult> {
  const db = await getDatabase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 24));
  const skip = (page - 1) * limit;
  const filter = buildFilter(query);
  const sort = buildSort(query);

  const col = db.collection<CmsMediaAsset>("cms_media");
  const [total, items] = await Promise.all([
    col.countDocuments(filter),
    col.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
  ]);

  return {
    items: items.map(normalizeAsset),
    total,
    page,
    pages: total === 0 ? 1 : Math.ceil(total / limit),
    limit,
  };
}

export async function listMedia(query: MediaListQuery): Promise<MediaListResult> {
  return fetchMediaList(query);
}

export async function searchMedia(query: MediaSearchQuery): Promise<MediaListResult> {
  return fetchMediaList(query);
}

export async function getMediaById(id: string): Promise<CmsMediaAsset | null> {
  const db = await getDatabase();
  const asset = await db.collection<CmsMediaAsset>("cms_media").findOne({ _id: id });
  return asset ? normalizeAsset(asset) : null;
}

export async function getMediaByIdCached(id: string): Promise<CmsMediaAsset | null> {
  return unstable_cache(
    async () => getMediaById(id),
    [`cms-media-${id}`],
    { tags: [CMS_MEDIA_TAG, `cms-media-${id}`], revalidate: 60 }
  )();
}

export interface UploadMediaInput {
  tenant: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: MediaFolder;
  tags?: string[];
  alt?: string;
  caption?: string;
  credits?: string;
  createdBy?: string;
  /** Omite deduplicación por hash (p. ej. duplicar asset) */
  skipDuplicateCheck?: boolean;
}

function storageKeyForAsset(asset: CmsMediaAsset, originalName?: string): string {
  const fromUrl = storageKeyFromMediaUrl(asset.url);
  if (fromUrl) return fromUrl;

  const ext =
    originalName?.split(".").pop()?.toLowerCase() ??
    asset.extension?.replace(/^\./, "") ??
    "bin";
  return buildStorageKey(asset.tenant, asset._id, `${asset._id}.${ext}`);
}

async function repairMissingMediaStorage(
  asset: CmsMediaAsset,
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<CmsMediaAsset> {
  const storageKey = storageKeyForAsset(asset, originalName);
  const existing = await readMediaFile(storageKey);
  if (existing) return normalizeAsset(asset);

  await putMediaFile(storageKey, buffer, mimeType);
  const url = await resolveMediaStoragePublicUrl(storageKey);
  const thumbnail = mimeType.startsWith("video/") ? asset.thumbnail : url;

  if (url === asset.url && thumbnail === asset.thumbnail) {
    return normalizeAsset(asset);
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  const updated: CmsMediaAsset = {
    ...asset,
    url,
    thumbnail,
    updatedAt: now,
  };

  await db.collection<CmsMediaAsset>("cms_media").replaceOne({ _id: asset._id }, updated);
  revalidateMediaTags(asset.tenant, asset._id);
  invalidateMediaCache(asset._id);
  return normalizeAsset(updated);
}

export async function uploadMedia(input: UploadMediaInput): Promise<CmsMediaAsset> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const hash = await computeFileHash(input.buffer);

  const duplicate = input.skipDuplicateCheck
    ? null
    : await db.collection<CmsMediaAsset>("cms_media").findOne({
        tenant: input.tenant,
        hash,
        visibility: "active",
      });
  if (duplicate) {
    return repairMissingMediaStorage(
      duplicate,
      input.buffer,
      input.mimeType,
      input.originalName
    );
  }

  const ext = input.originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const mediaId = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const category = inferCategory(input.mimeType);
  const folder = input.folder ?? DEFAULT_MEDIA_FOLDER;

  let url = "";
  let thumbnail = "";
  let responsive = {};
  let width: number | undefined;
  let height: number | undefined;

  if (input.mimeType.startsWith("image/")) {
    const baseName = input.originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-");
    const processed = await processUploadedImage(
      input.buffer,
      input.mimeType,
      input.tenant,
      mediaId,
      baseName || "image",
      folder === "Hero" ? "hero" : "default"
    );
    url = processed.primaryUrl;
    thumbnail = processed.thumbnail;
    responsive = processed.responsive;
    width = processed.metadata.width;
    height = processed.metadata.height;
  } else {
    const key = buildStorageKey(input.tenant, mediaId, `${mediaId}.${ext}`);
    const stored = await putMediaFile(key, input.buffer, input.mimeType);
    url = stored.publicUrl;
    thumbnail = input.mimeType.startsWith("video/") ? "" : url;

    if (input.mimeType.startsWith("image/")) {
      const meta = await extractImageMetadata(input.buffer);
      width = meta.width;
      height = meta.height;
    }
  }

  const storageKey = buildStorageKey(input.tenant, mediaId, "");

  const document: CmsMediaAsset = {
    _id: mediaId,
    tenant: input.tenant,
    filename: input.originalName,
    originalName: input.originalName,
    extension: ext,
    mimeType: input.mimeType,
    size: input.buffer.length,
    width,
    height,
    folder,
    category,
    tags: input.tags?.length ? input.tags : folder === "Hero" ? ["Hero"] : [],
    alt: input.alt ?? input.originalName,
    title: input.originalName,
    caption: input.caption ?? "",
    credits: input.credits ?? "",
    status: "active",
    version: 1,
    visibility: "active",
    url,
    thumbnail: thumbnail || url,
    responsive,
    storageKey,
    hash,
    usage: [],
    createdBy: input.createdBy ?? "admin",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<CmsMediaAsset>("cms_media").insertOne(document);
  revalidateMediaTags(input.tenant);
  const { emitMediaUploaded } = await import("@/lib/events/media");
  await emitMediaUploaded(document).catch(console.error);
  return document;
}

export async function renameMedia(
  id: string,
  originalName: string
): Promise<CmsMediaAsset | null> {
  const trimmed = originalName.trim();
  if (!trimmed) return null;
  return updateMedia(id, { originalName: trimmed, title: trimmed });
}

export async function moveMedia(
  id: string,
  folder: MediaFolder
): Promise<CmsMediaAsset | null> {
  return updateMedia(id, { folder });
}

async function readAssetBuffer(asset: CmsMediaAsset): Promise<Buffer | null> {
  const streamMatch = asset.url.match(/[?&]key=([^&]+)/);
  if (streamMatch) {
    const key = decodeURIComponent(streamMatch[1]);
    const file = await readMediaFile(key);
    return file?.buffer ?? null;
  }

  try {
    const urlPath = asset.url.replace(/^https?:\/\/[^/]+/, "");
    if (urlPath.startsWith("/media/")) {
      const relative = urlPath.replace(/^\/media\//, "").replace(/\?.*$/, "");
      const key = storageKeyFromMediaUrl(asset.url) ?? relative;
      const file = await readMediaFile(key);
      if (file) return file.buffer;

      const filePath = path.join(process.cwd(), "public", "media", relative);
      return readFile(filePath);
    }
    if (urlPath.startsWith("/api/cms/media/stream")) {
      const key = new URL(asset.url, "http://localhost").searchParams.get("key");
      if (key) {
        const file = await readMediaFile(key);
        return file?.buffer ?? null;
      }
    }
  } catch {
    /* fallback fetch */
  }

  try {
    const res = await fetch(asset.url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function duplicateMedia(id: string): Promise<CmsMediaAsset | null> {
  const source = await getMediaById(id);
  if (!source) return null;

  const buffer = await readAssetBuffer(source);
  if (!buffer) return null;

  const baseName = source.originalName.replace(/\.[^.]+$/, "");
  const copyName = source.originalName.includes("(copia)")
    ? source.originalName
    : `${baseName} (copia)${source.extension ? `.${source.extension}` : ""}`;

  return uploadMedia({
    tenant: source.tenant,
    buffer,
    originalName: copyName,
    mimeType: source.mimeType,
    folder: source.folder,
    tags: source.tags,
    alt: source.alt,
    caption: source.caption,
    credits: source.credits,
    createdBy: source.createdBy,
    skipDuplicateCheck: true,
  });
}

export async function replaceMediaFile(
  id: string,
  input: Pick<UploadMediaInput, "buffer" | "originalName" | "mimeType" | "tenant">
): Promise<CmsMediaAsset | null> {
  const existing = await getMediaById(id);
  if (!existing) return null;

  await deleteMediaPrefix(`${existing.tenant}/${id}`);

  let url = existing.url;
  let thumbnail = existing.thumbnail;
  let responsive = existing.responsive;
  let width = existing.width;
  let height = existing.height;

  if (input.mimeType.startsWith("image/")) {
    const baseName = input.originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-");
    const processed = await processUploadedImage(
      input.buffer,
      input.mimeType,
      input.tenant,
      id,
      baseName || "image",
      existing.folder === "Hero" ? "hero" : "default"
    );
    url = processed.primaryUrl;
    thumbnail = processed.thumbnail;
    responsive = processed.responsive;
    width = processed.metadata.width;
    height = processed.metadata.height;
  } else {
    const ext = input.originalName.split(".").pop()?.toLowerCase() ?? "bin";
    const key = buildStorageKey(input.tenant, id, `${id}.${ext}`);
    const stored = await putMediaFile(key, input.buffer, input.mimeType);
    url = stored.publicUrl;
    thumbnail = url;
    responsive = {};
  }

  const hash = await computeFileHash(input.buffer);
  const db = await getDatabase();
  const now = new Date().toISOString();

  const updated: CmsMediaAsset = {
    ...existing,
    originalName: input.originalName,
    filename: input.originalName,
    mimeType: input.mimeType,
    size: input.buffer.length,
    width,
    height,
    url,
    thumbnail,
    responsive,
    hash,
    version: (existing.version ?? 1) + 1,
    updatedAt: now,
  };

  await db.collection<CmsMediaAsset>("cms_media").replaceOne({ _id: id }, updated);
  revalidateMediaTags(existing.tenant, id);
  const { emitMediaReplaced } = await import("@/lib/events/media");
  await emitMediaReplaced(updated).catch(console.error);
  return updated;
}

export async function updateMedia(
  id: string,
  data: CmsMediaUpdate
): Promise<CmsMediaAsset | null> {
  const db = await getDatabase();
  const existing = await getMediaById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: CmsMediaAsset = {
    ...existing,
    ...data,
    tags: data.tags ?? existing.tags,
    updatedAt: now,
  };

  await db.collection<CmsMediaAsset>("cms_media").replaceOne({ _id: id }, updated);
  revalidateMediaTags(existing.tenant, id);

  const events = await import("@/lib/events/media");
  if (data.originalName && data.originalName !== existing.originalName) {
    await events.emitMediaRenamed(updated, existing.originalName).catch(console.error);
  } else if (data.folder && data.folder !== existing.folder) {
    await events.emitMediaMoved(updated, existing.folder).catch(console.error);
  } else if (data.favorite !== undefined && data.favorite !== existing.favorite) {
    await events.emitMediaFavorited(updated, Boolean(data.favorite)).catch(console.error);
  } else if (data.tags && JSON.stringify(data.tags) !== JSON.stringify(existing.tags)) {
    await events.emitMediaTagged(updated, data.tags).catch(console.error);
  } else {
    await events.emitMediaUpdated(updated).catch(console.error);
  }

  return updated;
}

export async function trashMedia(id: string): Promise<CmsMediaAsset | null> {
  const existing = await getMediaById(id);
  if (!existing) return null;
  if (mediaHasUsage(existing)) {
    throw new Error(
      `No se puede eliminar: el archivo está en uso (${existing.usage.map((u) => u.label).join(", ")}).`
    );
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.collection<CmsMediaAsset>("cms_media").updateOne(
    { _id: id },
    { $set: { visibility: "trash", trashedAt: now, updatedAt: now } }
  );
  revalidateMediaTags(existing.tenant, id);
  const trashed = await getMediaById(id);
  if (trashed) {
    const { emitMediaDeleted } = await import("@/lib/events/media");
    await emitMediaDeleted(trashed).catch(console.error);
  }
  return trashed;
}

export async function restoreMedia(id: string): Promise<CmsMediaAsset | null> {
  const db = await getDatabase();
  await db.collection<CmsMediaAsset>("cms_media").updateOne(
    { _id: id },
    { $unset: { trashedAt: "" } }
  );
  return updateMedia(id, { visibility: "active" });
}

export async function deleteMediaPermanent(id: string): Promise<boolean> {
  const existing = await getMediaById(id);
  if (!existing) return false;

  if (existing.visibility !== "trash" && mediaHasUsage(existing)) {
    throw new Error("El archivo está en uso. Muévelo a papelera primero o desvincúlalo.");
  }

  await deleteMediaPrefix(`${existing.tenant}/${id}`);

  const db = await getDatabase();
  const result = await db.collection<CmsMediaAsset>("cms_media").deleteOne({ _id: id });
  revalidateMediaTags(existing.tenant, id);
  if (result.deletedCount > 0) {
    const { emitMediaDeleted } = await import("@/lib/events/media");
    await emitMediaDeleted({ ...existing, visibility: "trash" }).catch(console.error);
  }
  return result.deletedCount > 0;
}

export async function bulkMediaAction(body: MediaBulkAction): Promise<number> {
  let count = 0;
  for (const id of body.ids) {
    try {
      switch (body.action) {
        case "trash":
          if (await trashMedia(id)) count++;
          break;
        case "restore":
          if (await restoreMedia(id)) count++;
          break;
        case "delete":
          if (await deleteMediaPermanent(id)) count++;
          break;
        case "move":
          if (body.folder && (await updateMedia(id, { folder: body.folder }))) count++;
          break;
        case "tag":
          if (body.tags) {
            const asset = await getMediaById(id);
            if (asset) {
              const merged = [...new Set([...(asset.tags ?? []), ...body.tags])];
              if (await updateMedia(id, { tags: merged })) count++;
            }
          }
          break;
        case "duplicate":
          if (await duplicateMedia(id)) count++;
          break;
        case "activate":
          if (await updateMedia(id, { status: "active", visibility: "active" })) count++;
          break;
        case "deactivate":
          if (await updateMedia(id, { status: "archived" })) count++;
          break;
      }
    } catch {
      /* skip failed items in bulk */
    }
  }
  return count;
}

export async function purgeExpiredTrash(tenant?: string): Promise<number> {
  const db = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  const filter: Record<string, unknown> = {
    visibility: "trash",
    trashedAt: { $lte: cutoff.toISOString() },
  };
  if (tenant) filter.tenant = tenant;

  const expired = await db.collection<CmsMediaAsset>("cms_media").find(filter).toArray();
  let count = 0;
  for (const asset of expired) {
    if (await deleteMediaPermanent(asset._id)) count++;
  }
  return count;
}

function revalidateMediaTags(tenant: string, id?: string) {
  revalidateTag(CMS_MEDIA_TAG, "max");
  revalidateTag(`cms-media-tenant-${tenant}`, "max");
  if (id) revalidateTag(`cms-media-${id}`, "max");
  invalidateMediaCache(id);
}

export { CMS_MEDIA_TAG };
