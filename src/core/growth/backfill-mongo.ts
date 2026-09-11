/**
 * OT-GROWTH-CORE-006 — reader Mongo de fuentes históricas (solo lectura).
 */

import { ObjectId, type Db } from "mongodb";
import type { GrowthBackfillSourceReader } from "./backfill";
import type {
  GrowthInteresadoSourceRow,
  GrowthSubmissionSourceRow,
} from "./ingest-map";

const PORTAL_INTERESADOS = "portal_interesados";
const EXPERIENCE_FORM_SUBMISSIONS = "experience_form_submissions";

function idString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof ObjectId) return raw.toString();
  if (raw && typeof raw === "object" && "toString" in raw) {
    return String((raw as { toString: () => string }).toString());
  }
  return "";
}

function parseObjectIdCursor(cursor: string | null): ObjectId | null {
  if (!cursor) return null;
  try {
    return ObjectId.isValid(cursor) ? new ObjectId(cursor) : null;
  } catch {
    return null;
  }
}

export function createMongoGrowthBackfillSource(
  db: Db
): GrowthBackfillSourceReader {
  return {
    async listInteresadosPage(tenantId, cursor, limit) {
      const filter: Record<string, unknown> = { tenant: tenantId };
      const oid = parseObjectIdCursor(cursor);
      if (oid) filter._id = { $gt: oid };

      const docs = await db
        .collection(PORTAL_INTERESADOS)
        .find(filter)
        .sort({ _id: 1 })
        .limit(limit)
        .toArray();

      const items: GrowthInteresadoSourceRow[] = [];
      for (const doc of docs) {
        const _id = idString(doc._id);
        if (!_id) continue;
        items.push({
          _id,
          tenant: String(doc.tenant ?? ""),
          firstName: String(doc.firstName ?? ""),
          lastName: String(doc.lastName ?? ""),
          email: String(doc.email ?? ""),
          phone: String(doc.phone ?? ""),
          programId: String(doc.programId ?? ""),
          ...(doc.programLabel
            ? { programLabel: String(doc.programLabel) }
            : {}),
          ...(doc.source ? { source: String(doc.source) } : {}),
          ...(doc.createdAt ? { createdAt: String(doc.createdAt) } : {}),
          ...(doc.handoff && typeof doc.handoff === "object"
            ? {
                handoff: {
                  delivered: Boolean(
                    (doc.handoff as { delivered?: boolean }).delivered
                  ),
                  ...((doc.handoff as { externalId?: string }).externalId
                    ? {
                        externalId: String(
                          (doc.handoff as { externalId: string }).externalId
                        ),
                      }
                    : {}),
                  ...((doc.handoff as { adapter?: string }).adapter
                    ? {
                        adapter: String(
                          (doc.handoff as { adapter: string }).adapter
                        ),
                      }
                    : {}),
                },
              }
            : {}),
        });
      }

      const nextCursor =
        items.length === limit ? items[items.length - 1]!._id : null;
      return { items, nextCursor };
    },

    async listSubmissionsPage(tenantId, cursor, limit) {
      // Todos los destinos del Espacio: V1 proyecta; fuera de V1 → omitidos.
      const filter: Record<string, unknown> = { tenant: tenantId };
      const oid = parseObjectIdCursor(cursor);
      if (oid) filter._id = { $gt: oid };

      const docs = await db
        .collection(EXPERIENCE_FORM_SUBMISSIONS)
        .find(filter)
        .sort({ _id: 1 })
        .limit(limit)
        .toArray();

      const items: GrowthSubmissionSourceRow[] = [];
      for (const doc of docs) {
        const _id = idString(doc._id);
        if (!_id) continue;
        items.push({
          _id,
          tenant: String(doc.tenant ?? ""),
          formId: String(doc.formId ?? ""),
          destination: String(doc.destination ?? ""),
          data:
            doc.data && typeof doc.data === "object"
              ? (doc.data as Record<string, unknown>)
              : {},
          ...(doc.createdAt ? { createdAt: String(doc.createdAt) } : {}),
        });
      }

      const nextCursor =
        items.length === limit ? items[items.length - 1]!._id : null;
      return { items, nextCursor };
    },
  };
}
