import type { ExperienceFormSubmission } from "@/types/experience-forms";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";

export function normalizeRosterMatchRut(rut: string): string {
  return rut.replace(/\./g, "").replace(/-/g, "").toLowerCase().trim();
}

export function submissionMatchesRosterStudent(
  submission: ExperienceFormSubmission,
  student: ConvocatoriaRosterStudent
): boolean {
  const data = submission.data;
  const studentId = String(data.studentId ?? "").trim();
  if (studentId && studentId === student.id) return true;

  const subRut = normalizeRosterMatchRut(String(data.rut ?? ""));
  const rosterRut = student.rut ? normalizeRosterMatchRut(student.rut) : "";
  if (subRut && rosterRut && subRut === rosterRut) return true;

  const subName = String(data.name ?? data.fullName ?? "").trim().toLowerCase();
  const rosterName = student.fullName.trim().toLowerCase();
  if (subName && rosterName && subName === rosterName) return true;

  return false;
}

export function findRosterStudentsWithoutSubmission(
  rosterStudents: ConvocatoriaRosterStudent[],
  submissions: ExperienceFormSubmission[]
): ConvocatoriaRosterStudent[] {
  if (!rosterStudents.length) return [];
  return rosterStudents.filter(
    (student) => !submissions.some((submission) => submissionMatchesRosterStudent(submission, student))
  );
}
