import "server-only";

import { randomUUID } from "crypto";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { formatChilePhoneDisplay, normalizeChilePhone } from "@/lib/experience/forms/phone-chile";
import { getConvocatoriaRoster, saveConvocatoriaRoster } from "@/lib/experience/forms/roster";
import { isValidEmail } from "@/lib/validation/identity";
import type { AbsenceContactLogEntry, AbsenceContactOutcome } from "@/types/experience-forms";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import { isFailedContactOutcomeForChannel } from "@/lib/student-affairs/operator-contact-outcomes";

export type UpdateRosterStudentResult =
  | { ok: true; student: ConvocatoriaRosterStudent }
  | { ok: false; reason: "not-found" | "invalid-email" | "invalid-input"; error: string };

function patchRosterStudent(
  students: ConvocatoriaRosterStudent[],
  studentId: string,
  patch: Partial<ConvocatoriaRosterStudent>
): ConvocatoriaRosterStudent[] | null {
  let updated: ConvocatoriaRosterStudent | null = null;
  const next = students.map((student) => {
    if (student.id !== studentId) return student;
    updated = { ...student, ...patch };
    return updated;
  });
  return updated ? next : null;
}

export async function updateRosterStudentEmail(input: {
  tenant: string;
  formId: string;
  studentId: string;
  email: string;
}): Promise<UpdateRosterStudentResult> {
  return updateRosterStudentContactFields({
    tenant: input.tenant,
    formId: input.formId,
    studentId: input.studentId,
    email: input.email,
  });
}

export async function updateRosterStudentContactFields(input: {
  tenant: string;
  formId: string;
  studentId: string;
  email?: string;
  phone?: string;
}): Promise<UpdateRosterStudentResult> {
  const patch: Partial<ConvocatoriaRosterStudent> = {};

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (email && !isValidEmail(email)) {
      return { ok: false, reason: "invalid-email", error: "Correo inválido." };
    }
    patch.email = email || undefined;
  }

  if (input.phone !== undefined) {
    const raw = input.phone.trim();
    patch.phone =
      formatChilePhoneDisplay(raw) ||
      normalizeChilePhone(raw) ||
      raw ||
      undefined;
  }

  if (!Object.keys(patch).length) {
    return { ok: false, reason: "invalid-input", error: "Sin datos para actualizar." };
  }

  const convocatoria = getConvocatoriaByFormId(input.formId);
  if (!convocatoria) {
    return { ok: false, reason: "not-found", error: "Convocatoria no encontrada." };
  }

  const roster = await getConvocatoriaRoster(input.tenant, convocatoria.slug);
  if (!roster) {
    return { ok: false, reason: "not-found", error: "Nómina no encontrada." };
  }

  const students = patchRosterStudent(roster.students, input.studentId, patch);
  if (!students) {
    return { ok: false, reason: "not-found", error: "Participante no encontrado en nómina." };
  }

  const student = students.find((s) => s.id === input.studentId)!;
  await saveConvocatoriaRoster(input.tenant, convocatoria.slug, input.formId, students);
  return { ok: true, student };
}

export async function recordRosterStudentOutreach(input: {
  tenant: string;
  formId: string;
  studentId: string;
  channel: "phone" | "whatsapp" | "in-person" | "other";
  operatorName?: string;
  notes: string;
  phone?: string;
  startJustificationDeadline?: boolean;
  contactOutcome?: AbsenceContactOutcome;
}): Promise<UpdateRosterStudentResult> {
  const notes = input.notes.trim();
  if (!notes) {
    return { ok: false, reason: "not-found", error: "Indique el detalle del contacto." };
  }

  const convocatoria = getConvocatoriaByFormId(input.formId);
  if (!convocatoria) {
    return { ok: false, reason: "not-found", error: "Convocatoria no encontrada." };
  }

  const roster = await getConvocatoriaRoster(input.tenant, convocatoria.slug);
  if (!roster) {
    return { ok: false, reason: "not-found", error: "Nómina no encontrada." };
  }

  const existing = roster.students.find((s) => s.id === input.studentId);
  if (!existing) {
    return { ok: false, reason: "not-found", error: "Participante no encontrado en nómina." };
  }

  const failedContact = isFailedContactOutcomeForChannel(
    input.channel,
    input.contactOutcome ?? "reached"
  );

  const entry: AbsenceContactLogEntry = {
    id: randomUUID(),
    channel: input.channel,
    contactedAt: new Date().toISOString(),
    operatorName: input.operatorName?.trim() || undefined,
    notes,
    phone: input.phone?.trim() || undefined,
    startedJustificationDeadline: failedContact
      ? false
      : Boolean(input.startJustificationDeadline),
    contactOutcome: input.contactOutcome,
  };

  const outreachLog = [...(existing.outreachLog ?? []), entry];
  const students = patchRosterStudent(roster.students, input.studentId, { outreachLog });
  if (!students) {
    return { ok: false, reason: "not-found", error: "No se pudo actualizar la nómina." };
  }

  const student = students.find((s) => s.id === input.studentId)!;
  await saveConvocatoriaRoster(input.tenant, convocatoria.slug, input.formId, students);
  return { ok: true, student };
}

export function resolveRosterJustificationDeadlineFromOutreach(
  outreachLog: AbsenceContactLogEntry[] | undefined
): AbsenceContactLogEntry | undefined {
  if (!outreachLog?.length) return undefined;
  for (let i = outreachLog.length - 1; i >= 0; i--) {
    if (outreachLog[i]?.startedJustificationDeadline) return outreachLog[i];
  }
  return undefined;
}
