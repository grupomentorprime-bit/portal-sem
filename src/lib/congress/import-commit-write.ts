import "server-only";

import type { ImportCommitPlan } from "@/core/congress/import-commit";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
} from "@/core/congress/constants";
import type { CongressImportBatch } from "@/core/congress/types";
import { upsertCongressChurches } from "@/lib/congress/churches";
import {
  appendCongressAudit,
  buildRegistrationDraft,
  insertCongressRegistration,
} from "@/lib/congress/repository";
import { getDatabase } from "@/lib/mongodb";

/**
 * Ejecuta el plan de importación: stubs + catálogo de iglesias.
 * No escribe pedidos ni asignaciones de alojamiento.
 */
export async function executeCongressImportCommit(input: {
  tenantId: string;
  actorUserId: string;
  batchId: string;
  fileName: string;
  plan: ImportCommitPlan;
}): Promise<{ created: number; churchesUpserted: number; skipped: number }> {
  const now = new Date().toISOString();
  let created = 0;

  for (const item of input.plan.toCreate) {
    const draft = buildRegistrationDraft({
      tenantId: input.tenantId,
      source: "import",
      zoneId: item.zoneId,
      churchName: item.churchName,
      fullName: item.fullName,
      identityStatus: "provisional",
      importRowId: item.importRowId,
      expectedDayLabel: item.expectedDayLabel,
      lodgingNeed: "unknown",
      needsReview: true,
      now,
    });
    draft.importBatchId = input.batchId;
    await insertCongressRegistration(draft);
    created += 1;
  }

  const churchesUpserted = await upsertCongressChurches({
    tenantId: input.tenantId,
    churches: input.plan.churchesToUpsert,
    source: "import",
    importBatchId: input.batchId,
    now,
  });

  const batch: CongressImportBatch = {
    _id: input.batchId,
    tenantId: input.tenantId,
    eventId: CONGRESS_EVENT_ID,
    fileName: input.fileName,
    actorUserId: input.actorUserId,
    createdCount: created,
    churchCount: churchesUpserted,
    skipCount: input.plan.summary.skipCount,
    createdAt: now,
  };
  const db = await getDatabase();
  await db.collection<CongressImportBatch>(CONGRESS_COLLECTIONS.importBatches).insertOne(batch);

  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "import.commit",
    entity: "congress_import",
    entityId: input.batchId,
    metadata: {
      fileName: input.fileName,
      created,
      churchesUpserted,
      skipped: input.plan.summary.skipCount,
      // Explicit: lodging from Excel is never written here.
      lodgingRequestsWritten: 0,
    },
  });

  return {
    created,
    churchesUpserted,
    skipped: input.plan.summary.skipCount,
  };
}
