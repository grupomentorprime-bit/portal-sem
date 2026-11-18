import "server-only";

import { displayBrotherName } from "@/core/congress/brother-name";
import {
  foldCongressChurchBase,
  formatCongressChurchLabel,
} from "@/core/congress/church-name";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
} from "@/core/congress/constants";
import { planRegistrationNameDedupes } from "@/core/congress/registration-dedupe";
import type {
  CongressChurch,
  CongressLodgingAssignment,
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";
import { getDatabase } from "@/lib/mongodb";

function eventFilter(tenantId: string) {
  return { tenantId, eventId: CONGRESS_EVENT_ID };
}

/**
 * 1) Canoniza nombres de iglesia (ÑUBLE ALTO = IPN ÑUBLE ALTO).
 * 2) Fusiona fichas con el mismo nombre de persona; deja la más actualizada.
 */
export async function cleanupCongressChurchAndNameDupes(
  tenantId: string
): Promise<{
  churchesCanonicalized: number;
  catalogMerged: number;
  registrationsMerged: number;
  deletedIds: string[];
}> {
  const db = await getDatabase();
  const regs = db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations);
  const churches = db.collection<CongressChurch>(CONGRESS_COLLECTIONS.churches);
  const payments = db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments);
  const assignments = db.collection<CongressLodgingAssignment>(
    CONGRESS_COLLECTIONS.assignments
  );

  const allRegs = await regs.find(eventFilter(tenantId)).toArray();
  let churchesCanonicalized = 0;
  for (const row of allRegs) {
    const next = formatCongressChurchLabel(row.churchName || "Sin iglesia");
    if (next === row.churchName) continue;
    await regs.updateOne(
      { _id: row._id },
      {
        $set: { churchName: next, updatedAt: new Date().toISOString() },
        $inc: { version: 1 },
      }
    );
    row.churchName = next;
    churchesCanonicalized += 1;
  }

  const catalog = await churches.find(eventFilter(tenantId)).toArray();
  const byChurchKey = new Map<string, CongressChurch>();
  let catalogMerged = 0;
  for (const row of catalog) {
    const canonical = formatCongressChurchLabel(row.churchName);
    const key = `${row.zoneId.trim().toLowerCase()}|${foldCongressChurchBase(canonical)}`;
    const existing = byChurchKey.get(key);
    if (!existing) {
      byChurchKey.set(key, row);
      if (canonical !== row.churchName) {
        await churches.updateOne(
          { _id: row._id },
          {
            $set: { churchName: canonical, updatedAt: new Date().toISOString() },
          }
        );
        catalogMerged += 1;
      }
      continue;
    }
    await churches.deleteOne({ _id: row._id });
    catalogMerged += 1;
  }

  const plans = planRegistrationNameDedupes(allRegs);
  const deletedIds: string[] = [];
  for (const plan of plans) {
    const keep = plan.keep;
    for (const loser of plan.drop) {
      const patch: Partial<CongressRegistration> = {};
      if (!keep.submissionId && loser.submissionId) {
        patch.submissionId = loser.submissionId;
      }
      if (!keep.importRowId && loser.importRowId) {
        patch.importRowId = loser.importRowId;
      }
      if (!keep.importBatchId && loser.importBatchId) {
        patch.importBatchId = loser.importBatchId;
      }
      const keepPaid = keep.allocatedPaidClp ?? 0;
      const loserPaid = loser.allocatedPaidClp ?? 0;
      if (loserPaid > keepPaid) {
        patch.allocatedPaidClp = loserPaid;
      }
      for (const day of ["saturday", "sunday"] as const) {
        if (keep.attendance?.[day] !== true && loser.attendance?.[day] === true) {
          patch.attendance = {
            ...(patch.attendance ?? keep.attendance),
            [day]: true,
          };
          const metaKey =
            day === "saturday" ? "saturdayMarkedAt" : "sundayMarkedAt";
          patch.attendanceMeta = {
            ...(patch.attendanceMeta ?? keep.attendanceMeta ?? {}),
            [metaKey]:
              loser.attendanceMeta?.[metaKey] ??
              keep.attendanceMeta?.[metaKey] ??
              null,
          };
        }
      }

      const keepName = keep.identity.fullName.trim();
      const loserName = loser.identity.fullName.trim();
      const nicerName =
        /[A-ZÁÉÍÓÚÑ]/.test(loserName) && !/[A-ZÁÉÍÓÚÑ]/.test(keepName)
          ? loserName
          : keepName;
      const displayName = displayBrotherName(nicerName);
      if (displayName && displayName !== keep.identity.fullName) {
        patch.identity = { ...keep.identity, fullName: displayName };
      }

      if (Object.keys(patch).length > 0) {
        await regs.updateOne(
          { _id: keep._id },
          {
            $set: { ...patch, updatedAt: new Date().toISOString() },
            $inc: { version: 1 },
          }
        );
        Object.assign(keep, patch);
      }

      await payments.updateMany(
        {
          ...eventFilter(tenantId),
          "allocations.registrationId": loser._id,
        },
        { $set: { "allocations.$[row].registrationId": keep._id } },
        { arrayFilters: [{ "row.registrationId": loser._id }] }
      );
      await assignments.updateMany(
        { ...eventFilter(tenantId), registrationId: loser._id },
        { $set: { registrationId: keep._id } }
      );

      await regs.deleteOne({ _id: loser._id });
      deletedIds.push(loser._id);
    }
  }

  return {
    churchesCanonicalized,
    catalogMerged,
    registrationsMerged: deletedIds.length,
    deletedIds,
  };
}
