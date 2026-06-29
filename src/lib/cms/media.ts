import "server-only";

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
} from "@/lib/cms/media-storage";
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
}

export async function uploadMedia(input: UploadMediaInput): Promise<CmsMediaAsset> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const hash = await computeFileHash(input.buffer);

  const duplicate = await db.collection<CmsMediaAsset>("cms_media").findOne({
    tenant: input.tenant,
    hash,
    visibility: "active",
  });
  if (duplicate) return normalizeAsset(duplicate);

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
      baseName || "image"
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
    tags: input.tags ?? [],
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
  return document;
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
  return getMediaById(id);
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
}

export { CMS_MEDIA_TAG };
