import { DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT } from "@/lib/content/types";

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  skip: number;
  total: number;
  pages: number;
}

export function normalizePagination(input?: PaginationInput): PaginationMeta {
  const page = Math.max(1, Math.floor(input?.page ?? 1));
  const rawLimit = input?.limit ?? DEFAULT_QUERY_LIMIT;
  const limit = Math.min(MAX_QUERY_LIMIT, Math.max(1, Math.floor(rawLimit)));
  const skip = (page - 1) * limit;

  return { page, limit, skip, total: 0, pages: 1 };
}

export function withTotal(meta: PaginationMeta, total: number): PaginationMeta {
  const pages = total === 0 ? 1 : Math.ceil(total / meta.limit);
  return { ...meta, total, pages };
}
