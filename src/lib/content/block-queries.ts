import "server-only";

import type { BlockContentQuery, ContentQuery } from "@/types/content";
import type { PageBlock } from "@/types/page";
import { executeContentQuery } from "@/lib/content/resolver";
import {
  QUERY_BLOCK_TYPES,
  getBlockQuery,
} from "@/lib/content/block-query-defaults";

export {
  QUERY_BLOCK_TYPES,
  blockTypeToDefaultQuery,
  getBlockQuery,
  DEFAULT_BLOCK_QUERIES,
} from "@/lib/content/block-query-defaults";

function blockQueryToContentQuery(
  blockQuery: BlockContentQuery,
  tenant: string,
  includeDraft?: boolean
): ContentQuery {
  const { collection, limit, sort, featured, category, categoryId, tags, status, slug, search } =
    blockQuery;

  const filters: ContentQuery["filters"] = {};
  if (featured !== undefined) filters.featured = featured;
  if (category) filters.category = category;
  if (categoryId) filters.categoryId = categoryId;
  if (tags) filters.tags = tags;
  if (slug) filters.slug = slug;
  if (search) filters.search = search;
  if (status) filters.status = status;
  else if (!includeDraft) filters.status = "published";

  return {
    tenant,
    collection,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    sort,
    pagination: { limit: limit ?? 10, page: 1 },
  };
}

export async function resolveBlockContent(
  block: PageBlock,
  tenant: string,
  options?: { includeDraft?: boolean }
): Promise<unknown[]> {
  if (!QUERY_BLOCK_TYPES.includes(block.type)) return [];

  const blockQuery = getBlockQuery(block);
  if (!blockQuery) return [];

  const contentQuery = blockQueryToContentQuery(blockQuery, tenant, options?.includeDraft);
  const result = await executeContentQuery(contentQuery, {
    includeDraft: options?.includeDraft,
    mapItems: true,
  });

  return result.items;
}

export async function resolvePageBlocks(
  blocks: PageBlock[],
  tenant: string,
  options?: { includeDraft?: boolean }
): Promise<PageBlock[]> {
  const resolved = await Promise.all(
    blocks.map(async (block) => {
      if (!QUERY_BLOCK_TYPES.includes(block.type)) return block;

      const items = await resolveBlockContent(block, tenant, options);
      return {
        ...block,
        settings: {
          ...block.settings,
          items,
        },
      };
    })
  );

  return resolved;
}

export function stripResolvedItems(block: PageBlock): PageBlock {
  if (!QUERY_BLOCK_TYPES.includes(block.type)) return block;

  const settings = { ...block.settings };
  delete settings.items;
  return { ...block, settings };
}

export function stripPageBlocksForSave(blocks: PageBlock[]): PageBlock[] {
  return blocks.map(stripResolvedItems);
}
