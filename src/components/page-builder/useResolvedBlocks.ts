"use client";

import { useEffect, useState } from "react";
import { QUERY_BLOCK_TYPES, getBlockQuery } from "@/lib/content/block-query-defaults";
import type { BlockContentQuery } from "@/types/content";
import type { PageBlock } from "@/types/page";

async function fetchBlockItems(
  blockQuery: BlockContentQuery,
  tenant: string,
  preview?: boolean
): Promise<unknown[]> {
  const res = await fetch("/api/cms/content-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant,
      collection: blockQuery.collection,
      filters: {
        ...(blockQuery.featured !== undefined ? { featured: blockQuery.featured } : {}),
        ...(blockQuery.category ? { category: blockQuery.category } : {}),
        ...(blockQuery.categoryId ? { categoryId: blockQuery.categoryId } : {}),
        ...(blockQuery.tags ? { tags: blockQuery.tags } : {}),
        ...(blockQuery.status ? { status: blockQuery.status } : {}),
        ...(blockQuery.slug ? { slug: blockQuery.slug } : {}),
        ...(blockQuery.search ? { search: blockQuery.search } : {}),
      },
      sort: blockQuery.sort,
      pagination: { page: 1, limit: blockQuery.limit ?? 10 },
      preview,
    }),
  });

  const data = await res.json();
  if (!data.ok) return [];
  return data.items ?? [];
}

export function useResolvedBlocks(
  blocks: PageBlock[],
  tenant: string,
  preview?: boolean
): { blocks: PageBlock[]; loading: boolean } {
  const [resolved, setResolved] = useState(blocks);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveAll() {
      setLoading(true);
      try {
        const next = await Promise.all(
          blocks.map(async (block) => {
            if (!QUERY_BLOCK_TYPES.includes(block.type)) return block;
            if (Array.isArray(block.settings.items) && block.settings.items.length > 0) {
              return block;
            }
            const blockQuery = getBlockQuery(block);
            if (!blockQuery) return block;
            const items = await fetchBlockItems(blockQuery, tenant, preview);
            return { ...block, settings: { ...block.settings, items } };
          })
        );
        if (!cancelled) setResolved(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolveAll();
    return () => {
      cancelled = true;
    };
  }, [blocks, tenant, preview]);

  return { blocks: resolved, loading };
}
