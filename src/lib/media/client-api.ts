"use client";

import type { CmsMediaAsset, CmsMediaUpdate, MediaBulkAction, MediaFolder } from "@/types/media";

export async function mediaList(params: URLSearchParams) {
  const res = await fetch(`/api/cms/media?${params}`);
  return res.json() as Promise<{
    ok: boolean;
    items?: CmsMediaAsset[];
    total?: number;
    error?: string;
  }>;
}

export async function mediaGet(id: string) {
  const res = await fetch(`/api/cms/media/${encodeURIComponent(id)}`);
  return res.json() as Promise<{ ok: boolean; media?: CmsMediaAsset; error?: string }>;
}

export async function mediaUpdate(id: string, data: CmsMediaUpdate) {
  const res = await fetch(`/api/cms/media/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ ok: boolean; media?: CmsMediaAsset; error?: string }>;
}

export async function mediaDelete(id: string) {
  const res = await fetch(`/api/cms/media/${id}`, { method: "DELETE" });
  return res.json() as Promise<{ ok: boolean; error?: string }>;
}

export async function mediaBulk(body: MediaBulkAction) {
  const res = await fetch("/api/cms/media/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{ ok: boolean; affected?: number; error?: string }>;
}

export async function mediaDuplicate(id: string) {
  const res = await fetch(`/api/cms/media/${id}/duplicate`, { method: "POST" });
  return res.json() as Promise<{ ok: boolean; media?: CmsMediaAsset; error?: string }>;
}

export async function mediaUpload(form: FormData) {
  const res = await fetch("/api/cms/media", { method: "POST", body: form });
  return res.json() as Promise<{ ok: boolean; media?: CmsMediaAsset; error?: string }>;
}

export async function mediaMoveBulk(tenant: string, ids: string[], folder: MediaFolder) {
  return mediaBulk({ tenant, ids, action: "move", folder });
}

export async function mediaRename(id: string, originalName: string) {
  return mediaUpdate(id, { originalName, title: originalName });
}

export async function mediaReplace(id: string, form: FormData) {
  const res = await fetch(`/api/cms/media/${id}/replace`, { method: "POST", body: form });
  return res.json() as Promise<{
    ok: boolean;
    media?: CmsMediaAsset;
    optimization?: import("@/lib/cms/media-optimization").MediaOptimizationSummary | null;
    error?: string;
  }>;
}
