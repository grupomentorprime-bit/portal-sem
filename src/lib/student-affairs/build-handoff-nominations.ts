import { formatGenerationCode } from "@/lib/experience/forms/generations";
import { classifyAbsenceSubmission } from "@/lib/student-affairs/absence-categories";
import { findRosterStudentsWithoutSubmission } from "@/lib/student-affairs/roster-match";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import type { HandoffNominations } from "@/types/student-affairs-operations";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

function sortByName<T extends { fullName: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" })
  );
}

function submissionToNominee(submission: ExperienceFormSubmission) {
  const data = submission.data;
  return {
    fullName: String(data.name ?? data.fullName ?? "").trim() || "Sin nombre",
    rut: String(data.rut ?? "").trim() || undefined,
    generation: formatGenerationCode(data.generation ?? data.program) || undefined,
    email: String(data.email ?? "").trim() || undefined,
    phone: String(data.phone ?? "").trim() || undefined,
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

export function buildHandoffNominations(input: {
  submissions: ExperienceFormSubmission[];
  rosterStudents: ConvocatoriaRosterStudent[];
}): HandoffNominations {
  const { submissions, rosterStudents } = input;

  const noAttendance = sortByName(
    submissions
      .filter((submission) => submission.data.attendance === "yes" && !submission.dayCheckIn?.present)
      .map(submissionToNominee)
  );

  const unjustifiedFromSubmissions = submissions
    .filter((submission) => classifyAbsenceSubmission(submission) === "unjustified")
    .map(submissionToNominee);

  const rosterPending = findRosterStudentsWithoutSubmission(rosterStudents, submissions).map(
    rosterStudentToNominee
  );

  const unjustified = sortByName([...unjustifiedFromSubmissions, ...rosterPending]);

  return { noAttendance, unjustified };
}
