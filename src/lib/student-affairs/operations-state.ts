import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type {
  StudentAffairsFormOperations,
  StudentAffairsHandoffReport,
  StudentAffairsOperationsPhase,
} from "@/types/student-affairs-operations";
import { getHandoffValidationStatus } from "@/lib/student-affairs/follow-up-access";

const COLLECTION = "student_affairs_form_operations";

export async function getStudentAffairsFormOperations(
  tenant: string,
  formId: string
): Promise<StudentAffairsFormOperations | null> {
  const db = await getDatabase();
  return db.collection<StudentAffairsFormOperations>(COLLECTION).findOne({ tenant, formId });
}

export async function getStudentAffairsOperationsPhase(
  tenant: string,
  formId: string
): Promise<StudentAffairsOperationsPhase> {
  const doc = await getStudentAffairsFormOperations(tenant, formId);
  return doc?.phase ?? "on-site";
}

export async function assertOnSiteOperationsOpen(
  tenant: string,
  formId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const phase = await getStudentAffairsOperationsPhase(tenant, formId);
  if (phase === "follow-up") {
    return {
      ok: false,
      error:
        "La jornada presencial ya fue cerrada. Asuntos Estudiantiles continúa el seguimiento de excusas e inasistencias.",
    };
  }
  return { ok: true };
}

export async function closeStudentAffairsOnSitePhase(input: {
  tenant: string;
  formId: string;
  operatorUserId: string;
  operatorName: string;
  report: StudentAffairsHandoffReport;
}): Promise<StudentAffairsFormOperations> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const document: StudentAffairsFormOperations = {
    tenant: input.tenant,
    formId: input.formId,
    phase: "follow-up",
    onSiteClosedAt: now,
    onSiteClosedByUserId: input.operatorUserId,
    onSiteClosedByName: input.operatorName,
    handoffReport: input.report,
    handoffValidationStatus: "pending",
    updatedAt: now,
  };

  await db.collection<StudentAffairsFormOperations>(COLLECTION).updateOne(
    { tenant: input.tenant, formId: input.formId },
    { $set: document },
    { upsert: true }
  );

  return document;
}

export async function validateStudentAffairsHandoffReport(input: {
  tenant: string;
  formId: string;
  validatorUserId: string;
  validatorName: string;
}): Promise<StudentAffairsFormOperations | null> {
  const db = await getDatabase();
  const existing = await getStudentAffairsFormOperations(input.tenant, input.formId);
  if (!existing || existing.phase !== "follow-up") return null;
  if (getHandoffValidationStatus(existing) === "validated") return existing;

  const now = new Date().toISOString();
  const document: StudentAffairsFormOperations = {
    ...existing,
    handoffValidationStatus: "validated",
    handoffValidatedAt: now,
    handoffValidatedByUserId: input.validatorUserId,
    handoffValidatedByName: input.validatorName,
    updatedAt: now,
  };

  await db.collection<StudentAffairsFormOperations>(COLLECTION).updateOne(
    { tenant: input.tenant, formId: input.formId },
    { $set: document }
  );

  return document;
}

export async function reopenStudentAffairsOnSitePhase(
  tenant: string,
  formId: string
): Promise<StudentAffairsFormOperations> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const document: StudentAffairsFormOperations = {
    tenant,
    formId,
    phase: "on-site",
    updatedAt: now,
  };

  await db.collection<StudentAffairsFormOperations>(COLLECTION).updateOne(
    { tenant, formId },
    {
      $set: document,
      $unset: {
        onSiteClosedAt: "",
        onSiteClosedByUserId: "",
        onSiteClosedByName: "",
        handoffReport: "",
        handoffValidationStatus: "",
        handoffValidatedAt: "",
        handoffValidatedByUserId: "",
        handoffValidatedByName: "",
      },
    },
    { upsert: true }
  );

  return document;
}
