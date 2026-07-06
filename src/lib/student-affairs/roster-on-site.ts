import "server-only";

import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import { formatChilePhoneDisplay, normalizeChilePhone } from "@/lib/experience/forms/phone-chile";
import { saveFormSubmission } from "@/lib/experience/forms/repository";
import { buildOperatorAbsenceMarked, buildJustificationDeadline } from "@/lib/experience/forms/absence-justification-deadline";
import {
  findConvocatoriaRosterStudent,
  hasConvocatoriaSubmission,
} from "@/lib/experience/forms/roster";
import { resolveRosterJustificationDeadlineFromOutreach } from "@/lib/student-affairs/roster-outreach";
import type {
  ExperienceFormDestination,
  ExperienceFormSubmission,
} from "@/types/experience-forms";

export type RosterOnSiteAction = "check-in" | "mark-absent";

export type RegisterRosterStudentOnSiteResult =
  | { ok: true; submission: ExperienceFormSubmission }
  | { ok: false; reason: "not-found" | "already-submitted" | "invalid-action" };

export async function registerRosterStudentOnSite(input: {
  tenant: string;
  formId: string;
  convocatoriaSlug: string;
  destination: ExperienceFormDestination;
  studentId: string;
  action: RosterOnSiteAction;
  operatorName?: string;
  notes?: string;
}): Promise<RegisterRosterStudentOnSiteResult> {
  const student = await findConvocatoriaRosterStudent(
    input.tenant,
    input.convocatoriaSlug,
    input.studentId
  );
  if (!student) return { ok: false, reason: "not-found" };

  const alreadySubmitted = await hasConvocatoriaSubmission(
    input.tenant,
    input.formId,
    input.studentId
  );
  if (alreadySubmitted) return { ok: false, reason: "already-submitted" };

  const now = new Date().toISOString();
  const operator = input.operatorName?.trim() || undefined;
  const notes = input.notes?.trim() || undefined;
  const generation = normalizeGenerationValue(student.generation);
  const phone =
    formatChilePhoneDisplay(student.phone ?? "") ||
    normalizeChilePhone(String(student.phone ?? "")) ||
    String(student.phone ?? "").trim();

  const baseData: Record<string, unknown> = {
    registrationMode: "roster",
    operatorRegistered: true,
    studentId: student.id,
    rut: student.rut ?? "",
    fullName: student.fullName,
    name: student.fullName,
    program: generation,
    generation,
    phone,
    ...(student.email?.trim() ? { email: student.email.trim().toLowerCase() } : {}),
  };

  let submission: ExperienceFormSubmission;

  if (input.action === "check-in") {
    submission = {
      tenant: input.tenant,
      formId: input.formId,
      destination: input.destination,
      data: { ...baseData, attendance: "yes" },
      dayCheckIn: {
        present: true,
        checkedInAt: now,
        checkedInByName: operator,
        notes,
      },
      createdAt: now,
    };
  } else if (input.action === "mark-absent") {
    const outreachDeadline = resolveRosterJustificationDeadlineFromOutreach(student.outreachLog);
    let absenceReview = buildOperatorAbsenceMarked({
      operatorName: operator,
      operatorNotes: notes,
    });

    if (outreachDeadline?.contactedAt) {
      const from = new Date(outreachDeadline.contactedAt);
      absenceReview = {
        ...absenceReview,
        justificationRequestedAt: outreachDeadline.contactedAt,
        justificationDeadlineAt: buildJustificationDeadline(from),
        reviewedAt: outreachDeadline.contactedAt,
        reviewedByName: outreachDeadline.operatorName ?? operator,
      };
    }

    submission = {
      tenant: input.tenant,
      formId: input.formId,
      destination: input.destination,
      data: { ...baseData, attendance: "no", operatorNoShow: true },
      absenceReview,
      absenceContactLog: student.outreachLog?.length ? [...student.outreachLog] : undefined,
      createdAt: now,
    };
  } else {
    return { ok: false, reason: "invalid-action" };
  }

  const { id } = await saveFormSubmission(submission);
  return {
    ok: true,
    submission: { ...submission, _id: id },
  };
}
