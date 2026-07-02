import "server-only";

import type { CmsMediaAsset, MediaListQuery, MediaListResult, MediaSearchQuery } from "@/types/media";
import {
  bulkMediaAction,
  deleteMediaPermanent,
  duplicateMedia,
  getMediaById,
  listMedia,
  moveMedia,
  renameMedia,
  replaceMediaFile,
  searchMedia,
  trashMedia,
  updateMedia,
  uploadMedia,
  type UploadMediaInput,
} from "@/lib/cms/media";
import { rebuildUsageIndex } from "@/core/media/usage";

/**
 * MediaService — API única corporativa (OT-CORE-MEDIA-001)
 * Capa de dominio sobre persistencia MongoDB + storage.
 */
export const MediaService = {
  upload(input: UploadMediaInput) {
    return uploadMedia(input);
  },

  getById(id: string) {
    return getMediaById(id);
  },

  search(query: MediaListQuery | MediaSearchQuery) {
    return searchMedia(query);
  },

  list(query: MediaListQuery) {
    return listMedia(query);
  },

  async delete(id: string, permanent = false) {
    if (permanent) return deleteMediaPermanent(id);
    return trashMedia(id);
  },

  replace(id: string, input: Omit<UploadMediaInput, "tenant" | "folder"> & { tenant: string }) {
    return replaceMediaFile(id, input);
  },

  move(id: string, folder: CmsMediaAsset["folder"]) {
    return moveMedia(id, folder);
  },

  rename(id: string, originalName: string) {
    return renameMedia(id, originalName);
  },

  duplicate(id: string) {
    return duplicateMedia(id);
  },

  update(id: string, data: Parameters<typeof updateMedia>[1]) {
    return updateMedia(id, data);
  },

  bulk(body: Parameters<typeof bulkMediaAction>[0]) {
    return bulkMediaAction(body);
  },

  async getUsage(tenant: string, id: string) {
    await rebuildUsageIndex(tenant);
    const asset = await getMediaById(id);
    return asset?.usage ?? [];
  },

  async refreshUsageIndex(tenant: string) {
    return rebuildUsageIndex(tenant);
  },
} as const;

export type { UploadMediaInput, MediaListQuery, MediaListResult };
