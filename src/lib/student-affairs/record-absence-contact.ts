import "server-only";

import { randomUUID } from "crypto";
import { ObjectId, type Document, type UpdateFilter } from "mongodb";
import { buildJustificationRequestSent } from "@/lib/experience/forms/absence-justification-deadline";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";
import { canSendJustificationRequest } from "@/lib/student-affairs/absence-categories";
import { isFailedContactOutcomeForChannel } from "@/lib/student-affairs/operator-contact-outcomes";
import {
  buildParticipantDropoutFields,
  isDropoutContactOutcome,
  validateDropoutNotes,
} from "@/lib/student-affairs/participant-closure";
import type { OperatorManualContactChannel } from "@/lib/student-affairs/operator-contact-channels";
import type {
  AbsenceContactChannel,
  AbsenceContactLogEntry,
  AbsenceContactOutcome,
  ExperienceFormSubmission,
} from "@/types/experience-forms";

export type RecordAbsenceContactResult =
  | { ok: true; submission: ExperienceFormSubmission }
  | {
      ok: false;
      reason: "not-found" | "not-eligible" | "invalid-channel" | "notes-required";
      error: string;
    };

export async function recordAbsenceContact(input: {
  tenant: string;
  submissionId: string;
  channel: AbsenceContactChannel;
  operatorName?: string;
  notes?: string;
  phone?: string;
  email?: string;
  startJustificationDeadline?: boolean;
  contactOutcome?: AbsenceContactOutcome;
}): Promise<RecordAbsenceContactResult> {
  if (!["email", "phone", "whatsapp", "in-person", "other"].includes(input.channel)) {
    return { ok: false, reason: "invalid-channel", error: "Canal de contacto inválido." };
  }

  const existing = await getFormSubmissionById(input.tenant, input.submissionId);
  if (!existing || existing.data.attendance !== "no") {
    return {
      ok: false,
      reason: "not-eligible",
      error: "Solo se registran contactos en inasistencias.",
    };
  }

  const notes = input.notes?.trim() || undefined;
  if (input.channel !== "email" && !notes) {
    return {
      ok: false,
      reason: "notes-required",
      error: isDropoutContactOutcome(input.contactOutcome)
        ? "Indique el antecedente de la deserción."
        : "Indique el detalle del contacto (resultado, acuerdos, etc.).",
    };
  }

  let normalizedDropoutNotes: string | undefined;
  if (isDropoutContactOutcome(input.contactOutcome)) {
    const validated = validateDropoutNotes(notes ?? "");
    if (!validated.ok) {
      return { ok: false, reason: "notes-required", error: validated.error };
    }
    normalizedDropoutNotes = validated.normalized;
  }

  const shouldStartDeadline =
    Boolean(input.startJustificationDeadline) &&
    canSendJustificationRequest(existing) &&
    !isDropoutContactOutcome(input.contactOutcome) &&
    !isFailedContactOutcomeForChannel(
      input.channel as OperatorManualContactChannel,
      input.contactOutcome ?? "reached"
    );

  const entry: AbsenceContactLogEntry = {
    id: randomUUID(),
    channel: input.channel,
    contactedAt: new Date().toISOString(),
    operatorName: input.operatorName?.trim() || undefined,
    notes,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    startedJustificationDeadline: shouldStartDeadline,
    contactOutcome: input.contactOutcome,
  };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(input.submissionId);
  } catch {
    return { ok: false, reason: "not-found", error: "Respuesta no encontrada." };
  }

  const db = await getDatabase();
  const update: Record<string, unknown> = {
    $push: { absenceContactLog: entry },
  };

  if (shouldStartDeadline) {
    const sent = buildJustificationRequestSent({
      operatorName: input.operatorName,
      from: new Date(),
    });
    update.$set = {
      "absenceReview.justificationRequestedAt": sent.justificationRequestedAt,
      "absenceReview.justificationDeadlineAt": sent.justificationDeadlineAt,
      "absenceReview.reviewedAt": sent.reviewedAt,
      "absenceReview.reviewedByName": sent.reviewedByName,
    };
    if (input.email?.trim()) {
      (update.$set as Record<string, string>)["data.email"] = input.email.trim().toLowerCase();
    }
  }

  if (isDropoutContactOutcome(input.contactOutcome)) {
    update.$set = {
      ...(update.$set as Record<string, string> | undefined),
      ...buildParticipantDropoutFields({
        operatorName: input.operatorName,
        notes: normalizedDropoutNotes,
      }),
    };
  }

  const result = await db.collection("experience_form_submissions").findOneAndUpdate(
    { _id: objectId, tenant: input.tenant },
    update as unknown as UpdateFilter<Document>,
    { returnDocument: "after" }
  );

  if (!result) {
    return { ok: false, reason: "not-found", error: "No se pudo registrar el contacto." };
  }

  const doc = result as unknown as ExperienceFormSubmission & { _id: ObjectId };
  return {
    ok: true,
    submission: { ...doc, _id: doc._id?.toString() },
  };
}
