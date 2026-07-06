import "server-only";

import { randomUUID } from "crypto";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { buildJustificationRequestSent } from "@/lib/experience/forms/absence-justification-deadline";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";
import {
  sendParticipantNoShowJustifyEmail,
  type NoShowJustifyReason,
} from "@/lib/notifications/convocatoria-follow-up-email";
import { canSendJustificationRequest } from "@/lib/student-affairs/absence-categories";
import { isValidEmail } from "@/lib/validation/identity";
import type { AbsenceContactLogEntry, ExperienceFormSubmission } from "@/types/experience-forms";
import { ObjectId, type UpdateFilter, type Document } from "mongodb";

export type SendJustificationRequestResult =
  | {
      ok: true;
      submission: ExperienceFormSubmission;
      email: { sent: true; id?: string } | { sent: false; reason: string };
    }
  | {
      ok: false;
      reason:
        | "not-found"
        | "invalid-email"
        | "not-eligible"
        | "no-convocatoria"
        | "email-failed";
      error: string;
    };

function resolveNoShowReason(submission: ExperienceFormSubmission): NoShowJustifyReason {
  if (submission.data.operatorRegistered && submission.data.registrationMode === "roster") {
    return "roster-no-response";
  }
  return "confirmed-no-show";
}

export async function sendAbsenceJustificationRequest(input: {
  tenant: string;
  submissionId: string;
  email: string;
  operatorName?: string;
}): Promise<SendJustificationRequestResult> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, reason: "invalid-email", error: "Correo inválido." };
  }

  const existing = await getFormSubmissionById(input.tenant, input.submissionId);
  if (!existing) {
    return { ok: false, reason: "not-found", error: "Respuesta no encontrada." };
  }

  if (!canSendJustificationRequest(existing)) {
    return {
      ok: false,
      reason: "not-eligible",
      error: "Este participante no está pendiente de envío de solicitud de justificación.",
    };
  }

  const convocatoria = getConvocatoriaByFormId(existing.formId);
  if (!convocatoria) {
    return {
      ok: false,
      reason: "no-convocatoria",
      error: "No se encontró la convocatoria asociada.",
    };
  }

  const sent = buildJustificationRequestSent({
    operatorName: input.operatorName,
    from: new Date(),
  });

  const participantName = String(
    existing.data.name ?? existing.data.fullName ?? "Participante"
  );

  const emailResponse = await sendParticipantNoShowJustifyEmail({
    to: email,
    participantName,
    convocatoria,
    submissionId: input.submissionId,
    reason: resolveNoShowReason(existing),
    justificationDeadlineAt: sent.justificationDeadlineAt,
  });

  if (!emailResponse.ok) {
    return {
      ok: false,
      reason: "email-failed",
      error: emailResponse.error,
    };
  }

  const db = await getDatabase();
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(input.submissionId);
  } catch {
    return { ok: false, reason: "not-found", error: "Respuesta no encontrada." };
  }

  const contactEntry: AbsenceContactLogEntry = {
    id: randomUUID(),
    channel: "email",
    contactedAt: sent.justificationRequestedAt ?? new Date().toISOString(),
    operatorName: input.operatorName?.trim() || undefined,
    email,
    notes: "Solicitud de justificación enviada por correo.",
    startedJustificationDeadline: true,
  };

  const result = await db.collection("experience_form_submissions").findOneAndUpdate(
    { _id: objectId, tenant: input.tenant, "data.attendance": "no" },
    {
      $set: {
        "data.email": email,
        "absenceReview.justificationRequestedAt": sent.justificationRequestedAt,
        "absenceReview.justificationDeadlineAt": sent.justificationDeadlineAt,
        "absenceReview.reviewedAt": sent.reviewedAt,
        "absenceReview.reviewedByName": sent.reviewedByName,
      },
      $push: { absenceContactLog: contactEntry },
    } as unknown as UpdateFilter<Document>,
    { returnDocument: "after" }
  );

  if (!result) {
    return { ok: false, reason: "not-found", error: "No se pudo actualizar el registro." };
  }

  const doc = result as unknown as ExperienceFormSubmission & { _id: ObjectId };

  return {
    ok: true,
    submission: {
      ...doc,
      _id: doc._id?.toString(),
    },
    email: { sent: true, id: emailResponse.id },
  };
}

export interface BulkJustificationRequestItem {
  submissionId: string;
  email: string;
}

export async function sendAbsenceJustificationRequestBulk(input: {
  tenant: string;
  requests: BulkJustificationRequestItem[];
  operatorName?: string;
}): Promise<{
  ok: true;
  sent: number;
  failed: Array<{ submissionId: string; error: string }>;
}> {
  const failed: Array<{ submissionId: string; error: string }> = [];
  let sent = 0;

  for (const request of input.requests) {
    const result = await sendAbsenceJustificationRequest({
      tenant: input.tenant,
      submissionId: request.submissionId,
      email: request.email,
      operatorName: input.operatorName,
    });

    if (result.ok) {
      sent++;
    } else {
      failed.push({ submissionId: request.submissionId, error: result.error });
    }
  }

  return { ok: true, sent, failed };
}
