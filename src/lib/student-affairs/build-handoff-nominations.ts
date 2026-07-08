import { formatGenerationCode } from "@/lib/experience/forms/generations";
import {
  absenceCategoryLabel,
  classifyAbsenceSubmission,
  type AbsenceListCategory,
} from "@/lib/student-affairs/absence-categories";
import { findRosterStudentsWithoutSubmission } from "@/lib/student-affairs/roster-match";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import type { HandoffNominations } from "@/types/student-affairs-operations";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

function sortByName<T extends { fullName: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" })
  );
}

function submissionToNominee(submission: ExperienceFormSubmission, note?: string) {
  const data = submission.data;
  return {
    fullName: String(data.name ?? data.fullName ?? "").trim() || "Sin nombre",
    rut: String(data.rut ?? "").trim() || undefined,
    generation: formatGenerationCode(data.generation ?? data.program) || undefined,
    email: String(data.email ?? "").trim() || undefined,
    phone: String(data.phone ?? "").trim() || undefined,
    note,
  };
}

function rosterStudentToNominee(student: ConvocatoriaRosterStudent) {
  return {
    fullName: student.fullName.trim() || "Sin nombre",
    rut: student.rut?.trim() || undefined,
    generation: formatGenerationCode(student.generation) || undefined,
    email: student.email?.trim() || undefined,
    phone: student.phone?.trim() || undefined,
    note: "Sin registro en formulario",
  };
}

function isWithJustificationCategory(category: AbsenceListCategory | null): boolean {
  return (
    category === "pending-review" ||
    category === "approved" ||
    category === "awaiting-justification"
  );
}

function isWithoutJustificationCategory(category: AbsenceListCategory | null): boolean {
  return category === "unjustified" || category === "pending-email";
}

export function buildHandoffNominations(input: {
  submissions: ExperienceFormSubmission[];
  rosterStudents: ConvocatoriaRosterStudent[];
}): HandoffNominations {
  const { submissions, rosterStudents } = input;

  const noAttendance = sortByName(
    submissions
      .filter((submission) => submission.data.attendance === "yes" && !submission.dayCheckIn?.present)
      .map((submission) => submissionToNominee(submission, "Confirmó asistencia, sin check-in"))
  );

  const withJustification = sortByName(
    submissions
      .filter((submission) => {
        const category = classifyAbsenceSubmission(submission);
        return isWithJustificationCategory(category);
      })
      .map((submission) => {
        const category = classifyAbsenceSubmission(submission)!;
        return submissionToNominee(submission, absenceCategoryLabel(category));
      })
  );

  const withoutJustificationFromSubmissions = submissions
    .filter((submission) => {
      const category = classifyAbsenceSubmission(submission);
      return isWithoutJustificationCategory(category);
    })
    .map((submission) => {
      const category = classifyAbsenceSubmission(submission)!;
      return submissionToNominee(submission, absenceCategoryLabel(category));
    });

  const rosterPending = findRosterStudentsWithoutSubmission(rosterStudents, submissions).map(
    rosterStudentToNominee
  );

  const withoutJustification = sortByName([
    ...withoutJustificationFromSubmissions,
    ...rosterPending,
  ]);

  return { noAttendance, withJustification, withoutJustification };
}
