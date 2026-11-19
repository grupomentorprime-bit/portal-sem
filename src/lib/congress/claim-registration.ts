import "server-only";

import {
  applyProtectedRegistrationChange,
  claimAuditMetadata,
  filePublicClaimRequest,
  type ProposedRegistrationChange,
} from "@/core/congress/claim";
import { CONGRESS_COLLECTIONS, CONGRESS_EVENT_ID } from "@/core/congress/constants";
import { parseExpectedDayLabel } from "@/core/congress/expected-days";
import type { CongressAttendanceDays } from "@/core/congress/types";
import { generateId } from "@/core/identity/auth/crypto";
import { enrolleeIdentity } from "@/lib/experience/forms/already-enrolled";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import {
  appendCongressAudit,
  getCongressRegistration,
  updateCongressRegistration,
} from "@/lib/congress/repository";
import { getDatabase } from "@/lib/mongodb";

export interface CongressClaimRequestRecord {
  _id: string;
  tenantId: string;
  eventId: string;
  registrationId: string;
  submissionId: string;
  status: "pending" | "applied";
  fieldNames: string[];
  createdAt: string;
  appliedAt?: string;
  authorization?: "operator" | "accredited-contact";
}

function expectedDaysFromFormData(
  data: Record<string, unknown>,
  fallback: CongressAttendanceDays | undefined
): CongressAttendanceDays {
  if (data.expectedDays && typeof data.expectedDays === "object") {
    const raw = data.expectedDays as { saturday?: unknown; sunday?: unknown };
    return {
      saturday: typeof raw.saturday === "boolean" ? raw.saturday : null,
      sunday: typeof raw.sunday === "boolean" ? raw.sunday : null,
    };
  }
  const label = String(
    data.expectedDayLabel ?? data.diasPrevistos ?? data.diaAsistir ?? ""
  ).trim();
  if (label) return parseExpectedDayLabel(label);
  return fallback ?? { saturday: null, sunday: null };
}

function proposedFromSubmission(
  submissionId: string,
  data: Record<string, unknown>,
  fallback: CongressAttendanceDays | undefined,
  zoneId: string,
  churchName: string
): ProposedRegistrationChange {
  const identity = enrolleeIdentity(data);
  return {
    submissionId,
    fullName: String(data.fullName ?? data.nombre ?? data.name ?? "").trim(),
    rut: identity.rut,
    email: identity.email,
    phone: String(data.phone ?? data.telefono ?? "").trim() || null,
    zoneId: String(data.zona ?? data.zoneId ?? data.zone ?? "").trim() || zoneId,
    churchName: String(data.iglesia ?? data.churchName ?? data.church ?? "").trim() || churchName,
    expectedDays: expectedDaysFromFormData(data, fallback),
  };
}

export async function fileCongressClaimRequestFromForm(input: {
  tenantId: string;
  submissionId: string;
  opened: { ok: true; kind: string; tenantId: string; subjectId: string } | { ok: false };
}): Promise<{ ok: true; applied: false } | { ok: false; error: "not_claimable" | "id_not_authority" | "not_found" }> {
  if (!input.opened.ok) return { ok: false, error: "id_not_authority" };
  const registration = await getCongressRegistration(input.tenantId, input.opened.subjectId);
  if (!registration) return { ok: false, error: "not_found" };
  const filed = filePublicClaimRequest({
    registration,
    submissionId: input.submissionId,
    tenantId: input.tenantId,
    opened: input.opened,
  });
  if (!filed.ok) return { ok: false, error: filed.error };

  const db = await getDatabase();
  const record: CongressClaimRequestRecord = {
    _id: generateId("cclaim"),
    tenantId: input.tenantId,
    eventId: CONGRESS_EVENT_ID,
    registrationId: filed.request.registrationId,
    submissionId: filed.request.submissionId,
    status: "pending",
    fieldNames: filed.request.fieldNames,
    createdAt: new Date().toISOString(),
  };
  await db.collection<CongressClaimRequestRecord>(CONGRESS_COLLECTIONS.claimRequests).insertOne(record);
  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: "public-form",
    action: "registration.claim_requested",
    entity: "congress_registration",
    entityId: registration._id,
    metadata: claimAuditMetadata({
      phase: "requested",
      fields: filed.request.fieldNames,
    }),
  });
  return { ok: true, applied: false };
}

export async function applyCongressClaimAsOperator(input: {
  tenantId: string;
  registrationId: string;
  requestId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDatabase();
  const request = await db
    .collection<CongressClaimRequestRecord>(CONGRESS_COLLECTIONS.claimRequests)
    .findOne({
      _id: input.requestId,
      tenantId: input.tenantId,
      registrationId: input.registrationId,
      status: "pending",
    });
  if (!request) return { ok: false, error: "Solicitud no encontrada." };
  const registration = await getCongressRegistration(input.tenantId, input.registrationId);
  if (!registration) return { ok: false, error: "Inscripción no encontrada." };
  const submission = await getFormSubmissionById(input.tenantId, request.submissionId);
  if (!submission) return { ok: false, error: "Respuesta no encontrada." };
  const proposed = proposedFromSubmission(
    request.submissionId,
    submission.data ?? {},
    registration.expectedDays,
    registration.zoneId,
    registration.churchName
  );
  const applied = applyProtectedRegistrationChange({
    registration,
    proposed,
    authorization: { method: "operator", permission: "congress.operate" },
    nowIso: new Date().toISOString(),
  });
  if (!applied.ok) return { ok: false, error: "No se pudo aplicar la solicitud." };
  const updated = await updateCongressRegistration(
    input.tenantId,
    registration._id,
    {
      submissionId: applied.registration.submissionId,
      zoneId: applied.registration.zoneId,
      churchName: applied.registration.churchName,
      expectedDays: applied.registration.expectedDays,
      identity: applied.registration.identity,
      needsReview: applied.registration.needsReview,
    },
    registration.version
  );
  if (!updated) return { ok: false, error: "Conflicto de versión." };
  await db.collection<CongressClaimRequestRecord>(CONGRESS_COLLECTIONS.claimRequests).updateOne(
    { _id: request._id },
    {
      $set: {
        status: "applied",
        appliedAt: new Date().toISOString(),
        authorization: "operator",
      },
    }
  );
  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "registration.claim_applied",
    entity: "congress_registration",
    entityId: registration._id,
    metadata: claimAuditMetadata({
      phase: "applied",
      fields: request.fieldNames,
      authorization: "operator",
    }),
  });
  return { ok: true };
}
