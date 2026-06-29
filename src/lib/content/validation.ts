import {
  ALLOWED_COLLECTIONS,
  ALLOWED_FILTER_KEYS,
  ALLOWED_SORT_FIELDS,
  MAX_QUERY_LIMIT,
  type ContentQueryRequest,
} from "@/lib/content/types";
import type { ContentQuery } from "@/types/content";

export interface ContentValidationError {
  field: string;
  message: string;
}

function isAllowedCollection(value: string): boolean {
  return (ALLOWED_COLLECTIONS as readonly string[]).includes(value);
}

export function validateContentQuery(body: ContentQueryRequest): ContentValidationError[] {
  const errors: ContentValidationError[] = [];

  if (!body.tenant?.trim()) {
    errors.push({ field: "tenant", message: "El tenant es obligatorio." });
  } else if (body.tenant.length > 100) {
    errors.push({ field: "tenant", message: "Tenant demasiado largo." });
  }

  if (!body.collection?.trim()) {
    errors.push({ field: "collection", message: "La colección es obligatoria." });
  } else if (!isAllowedCollection(body.collection)) {
    errors.push({ field: "collection", message: `Colección "${body.collection}" no permitida.` });
  }

  if (body.filters && typeof body.filters === "object") {
    for (const key of Object.keys(body.filters)) {
      if (!(ALLOWED_FILTER_KEYS as readonly string[]).includes(key)) {
        errors.push({ field: `filters.${key}`, message: "Filtro no permitido." });
      }
    }
  }

  if (body.sort) {
    if (!ALLOWED_SORT_FIELDS.includes(body.sort.field as (typeof ALLOWED_SORT_FIELDS)[number])) {
      errors.push({ field: "sort.field", message: "Campo de orden no permitido." });
    }
    if (body.sort.direction !== "asc" && body.sort.direction !== "desc") {
      errors.push({ field: "sort.direction", message: "Dirección debe ser asc o desc." });
    }
  }

  const limit = body.pagination?.limit;
  if (limit !== undefined) {
    if (typeof limit !== "number" || limit < 1 || limit > MAX_QUERY_LIMIT) {
      errors.push({ field: "pagination.limit", message: `Límite entre 1 y ${MAX_QUERY_LIMIT}.` });
    }
  }

  const page = body.pagination?.page;
  if (page !== undefined && (typeof page !== "number" || page < 1)) {
    errors.push({ field: "pagination.page", message: "Página debe ser >= 1." });
  }

  return errors;
}

export function toContentQuery(body: ContentQueryRequest): ContentQuery {
  return {
    tenant: body.tenant.trim(),
    collection: body.collection.trim(),
    filters: body.filters as ContentQuery["filters"],
    sort: body.sort as ContentQuery["sort"],
    pagination: body.pagination,
  };
}
