import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { buildMongoFilter, parseFilters } from "@/lib/content/filters";
import { normalizePagination, withTotal } from "@/lib/content/pagination";
import { normalizeSort } from "@/lib/content/sort";
import { mapDocumentsForCollection } from "@/lib/content/mappers";
import { enrichContentDocumentsMedia } from "@/core/media";
import {
  cachedContentQuery,
  contentCacheTag,
  CONTENT_CACHE_TAG,
  getCollectionTtl,
} from "@/lib/content/cache";
import type { AllowedCollection } from "@/lib/content/types";
import type { ContentDocument, ContentQuery, ContentResult } from "@/types/content";

export interface ResolverOptions {
  includeDraft?: boolean;
  skipCache?: boolean;
  mapItems?: boolean;
  countOnly?: boolean;
}

export class ContentResolver {
  async resolve<T = ContentDocument>(
    query: ContentQuery,
    options?: ResolverOptions
  ): Promise<ContentResult<T>> {
    const collection = query.collection as AllowedCollection;
    const filters = parseFilters(query.filters as Record<string, unknown> | undefined);
    const pagination = normalizePagination({
      page: query.pagination?.page,
      limit: query.pagination?.limit,
    });
    const sort = normalizeSort(query.sort);
    const mongoFilter = buildMongoFilter(query.tenant, filters, {
      includeDraft: options?.includeDraft,
      collection: query.collection,
    });

    const runQuery = async (): Promise<ContentResult<T>> => {
      const db = await getDatabase();
      const col = db.collection<ContentDocument>(collection);

      if (options?.countOnly) {
        const total = await col.countDocuments(mongoFilter);
        const meta = withTotal(pagination, total);
        return {
          items: [] as T[],
          total: meta.total,
          page: meta.page,
          pages: meta.pages,
          limit: meta.limit,
        };
      }

      const [total, docs] = await Promise.all([
        col.countDocuments(mongoFilter),
        col
          .find(mongoFilter)
          .sort(sort)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .toArray(),
      ]);

      const meta = withTotal(pagination, total);
      const enriched = await enrichContentDocumentsMedia(query.tenant, docs);
      const items = options?.mapItems !== false
        ? (mapDocumentsForCollection(collection, enriched) as T[])
        : (enriched as T[]);

      return {
        items,
        total: meta.total,
        page: meta.page,
        pages: meta.pages,
        limit: meta.limit,
      };
    };

    if (options?.skipCache) {
      return runQuery();
    }

    const cacheKey = [
      "content-query",
      collection,
      query.tenant,
      JSON.stringify(mongoFilter),
      JSON.stringify(sort),
      String(pagination.page),
      String(pagination.limit),
      String(options?.mapItems !== false),
    ];

    const tags = [CONTENT_CACHE_TAG, `content-${collection}`, contentCacheTag(collection, query.tenant)];

    return cachedContentQuery(cacheKey, tags, getCollectionTtl(collection), runQuery);
  }
}

export const contentResolver = new ContentResolver();

export async function countContentDocuments(
  tenant: string,
  collection: AllowedCollection,
  options?: { includeDraft?: boolean }
): Promise<number> {
  const result = await executeContentQuery(
    { tenant, collection, pagination: { page: 1, limit: 1 } },
    { includeDraft: options?.includeDraft, mapItems: false, countOnly: true }
  );
  return result.total;
}

export async function executeContentQuery<T = ContentDocument>(
  query: ContentQuery,
  options?: ResolverOptions
): Promise<ContentResult<T>> {
  return contentResolver.resolve<T>(query, options);
}
