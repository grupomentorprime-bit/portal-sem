/**
 * OT-GROWTH-CORE-006 / ADR-010 §4.3 — backfill histórico tenant-scoped.
 * Reutiliza projectGrowthFromSignalSafe (mismo contrato que CORE-005).
 * Fail-soft por registro; reejecutable e idempotente; no muta fuentes.
 */

import type { GrowthIngestDeps, GrowthIngestResult } from "./ingest";
import { projectGrowthFromSignalSafe } from "./ingest";
import {
  toGrowthAdmissionInput,
  toGrowthFormInput,
  type GrowthInteresadoSourceRow,
  type GrowthSubmissionSourceRow,
} from "./ingest-map";

export interface GrowthBackfillPage<T> {
  items: T[];
  /** Cursor opaco para la siguiente página; null = fin. */
  nextCursor: string | null;
}

export interface GrowthBackfillSourceReader {
  listInteresadosPage(
    tenantId: string,
    cursor: string | null,
    limit: number
  ): Promise<GrowthBackfillPage<GrowthInteresadoSourceRow>>;
  listSubmissionsPage(
    tenantId: string,
    cursor: string | null,
    limit: number
  ): Promise<GrowthBackfillPage<GrowthSubmissionSourceRow>>;
}

export interface GrowthBackfillSummary {
  /** Registros de fuente intentados (interesados + submissions del reader). */
  processed: number;
  /** outcome === projected */
  created: number;
  /** outcome === idempotent_hit (p. ej. ya creados por CORE-005) */
  alreadyExisting: number;
  /** outcome === identity_conflict */
  conflicts: number;
  /** outcome === skipped (fuera de V1, sin identidad, etc.) */
  omitted: number;
  /** ok === false (projection_error u otros) */
  errors: number;
}

export interface GrowthBackfillOptions {
  tenantId: string;
  /** Tamaño de lote por página (interesados y submissions). Default 100. */
  batchSize?: number;
  /** Si true, no proyecta; solo cuenta lo que se leería. */
  dryRun?: boolean;
}

export type GrowthBackfillClassify =
  | "created"
  | "alreadyExisting"
  | "conflicts"
  | "omitted"
  | "errors";

export function emptyGrowthBackfillSummary(): GrowthBackfillSummary {
  return {
    processed: 0,
    created: 0,
    alreadyExisting: 0,
    conflicts: 0,
    omitted: 0,
    errors: 0,
  };
}

export function classifyGrowthBackfillResult(
  result:
    | GrowthIngestResult
    | { ok: false; reason: "projection_error"; error: string }
): GrowthBackfillClassify {
  if (!result.ok) return "errors";
  switch (result.outcome) {
    case "projected":
      return "created";
    case "idempotent_hit":
      return "alreadyExisting";
    case "identity_conflict":
      return "conflicts";
    case "skipped":
      return "omitted";
    default:
      return "errors";
  }
}

function bump(
  summary: GrowthBackfillSummary,
  key: GrowthBackfillClassify
): void {
  summary[key] += 1;
  summary.processed += 1;
}

/**
 * Proyecta históricos de un Espacio vía el mismo contrato de ingestión.
 * No aborta el lote ante error parcial.
 */
export async function runGrowthBackfill(
  deps: GrowthIngestDeps,
  reader: GrowthBackfillSourceReader,
  options: GrowthBackfillOptions
): Promise<GrowthBackfillSummary> {
  const tenantId = options.tenantId.trim();
  if (!tenantId) {
    throw new Error("Growth backfill requiere tenantId");
  }
  const batchSize = Math.max(1, options.batchSize ?? 100);
  const dryRun = options.dryRun === true;
  const summary = emptyGrowthBackfillSummary();

  let cursor: string | null = null;
  do {
    const page = await reader.listInteresadosPage(tenantId, cursor, batchSize);
    for (const row of page.items) {
      if (!row._id?.trim() || row.tenant !== tenantId) {
        bump(summary, "errors");
        continue;
      }
      if (dryRun) {
        bump(summary, "omitted");
        continue;
      }
      const result = await projectGrowthFromSignalSafe(
        deps,
        toGrowthAdmissionInput(row)
      );
      bump(summary, classifyGrowthBackfillResult(result));
    }
    cursor = page.nextCursor;
  } while (cursor);

  cursor = null;
  do {
    const page = await reader.listSubmissionsPage(tenantId, cursor, batchSize);
    for (const row of page.items) {
      if (!row._id?.trim() || row.tenant !== tenantId) {
        bump(summary, "errors");
        continue;
      }
      if (dryRun) {
        bump(summary, "omitted");
        continue;
      }
      const result = await projectGrowthFromSignalSafe(
        deps,
        toGrowthFormInput(row)
      );
      bump(summary, classifyGrowthBackfillResult(result));
    }
    cursor = page.nextCursor;
  } while (cursor);

  return summary;
}

/** Harness de tests: fuentes en memoria con paginación por índice. */
export function createMemoryGrowthBackfillSource(seed: {
  interesados?: GrowthInteresadoSourceRow[];
  submissions?: GrowthSubmissionSourceRow[];
}): GrowthBackfillSourceReader & {
  interesados: GrowthInteresadoSourceRow[];
  submissions: GrowthSubmissionSourceRow[];
} {
  const interesados = [...(seed.interesados ?? [])];
  const submissions = [...(seed.submissions ?? [])];

  function pageSlice<T extends { _id: string; tenant: string }>(
    items: T[],
    tenantId: string,
    cursor: string | null,
    limit: number
  ): GrowthBackfillPage<T> {
    const scoped = items.filter((r) => r.tenant === tenantId);
    let start = 0;
    if (cursor) {
      const idx = scoped.findIndex((r) => r._id === cursor);
      start = idx >= 0 ? idx + 1 : scoped.length;
    }
    const slice = scoped.slice(start, start + limit);
    const nextCursor =
      start + limit < scoped.length && slice.length > 0
        ? slice[slice.length - 1]!._id
        : null;
    return { items: slice, nextCursor };
  }

  return {
    interesados,
    submissions,
    async listInteresadosPage(tenantId, cursor, limit) {
      return pageSlice(interesados, tenantId, cursor, limit);
    },
    async listSubmissionsPage(tenantId, cursor, limit) {
      return pageSlice(submissions, tenantId, cursor, limit);
    },
  };
}
