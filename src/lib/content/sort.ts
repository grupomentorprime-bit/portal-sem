import { ALLOWED_SORT_FIELDS } from "@/lib/content/types";
import type { ContentQuerySort, SortDirection } from "@/types/content";

const DEFAULT_SORT: ContentQuerySort = { field: "order", direction: "asc" };

export function normalizeSort(input?: ContentQuerySort): Record<string, 1 | -1> {
  const field =
    input?.field && ALLOWED_SORT_FIELDS.includes(input.field as (typeof ALLOWED_SORT_FIELDS)[number])
      ? input.field
      : DEFAULT_SORT.field;

  const direction: SortDirection =
    input?.direction === "desc" || input?.direction === "asc" ? input.direction : DEFAULT_SORT.direction;

  return { [field]: direction === "asc" ? 1 : -1 };
}
