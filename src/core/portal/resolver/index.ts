import "server-only";

import type { PageBlock } from "@/types/page";
import type { ResolvedBlockData } from "@/types/portal";
import { getBlockDefinition } from "@/core/portal/registry";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { resolveMediaRef } from "@/core/media";

export type ContentResolverKey =
  | "programs"
  | "team"
  | "news"
  | "events"
  | "library"
  | "testimonials"
  | "gallery"
  | "stats";

const RESOLVER_KEYS: Record<string, ContentResolverKey> = {
  programs: "programs",
  teachers: "team",
  news: "news",
  events: "events",
  library: "library",
  testimonials: "testimonials",
  gallery: "gallery",
};

export async function resolveBlockData(
  block: PageBlock,
  tenant: string,
  options?: { includeDraft?: boolean }
): Promise<ResolvedBlockData> {
  const def = getBlockDefinition(block.type);
  const base: ResolvedBlockData = { blockId: block.id, type: block.type };

  if (!def?.queryDriven) {
    return base;
  }

  try {
    const items = await resolveBlockContent(block, tenant, options);
    const limit = getQueryLimit(block.settings, items.length);
    return { ...base, items: items.slice(0, limit) };
  } catch {
    return { ...base, error: true, items: [] };
  }
}

export async function resolveBlockMedia(
  tenant: string,
  fields: Array<{ key: string; mediaId?: string; legacyUrl?: string }>
): Promise<Record<string, string | undefined>> {
  const media: Record<string, string | undefined> = {};
  await Promise.all(
    fields.map(async ({ key, mediaId, legacyUrl }) => {
      media[key] =
        (await resolveMediaRef(tenant, { mediaId, legacyUrl })) ?? undefined;
    })
  );
  return media;
}

export function getResolverKey(block: PageBlock): ContentResolverKey | undefined {
  const def = getBlockDefinition(block.type);
  if (def?.resolver) return def.resolver as ContentResolverKey;
  return RESOLVER_KEYS[block.type];
}
