import { countAbsenceCategories } from "@/lib/student-affairs/absence-categories";
import { findRosterStudentsWithoutSubmission } from "@/lib/student-affairs/roster-pending";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import type { StudentAffairsHandoffReport } from "@/types/student-affairs-operations";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

export function buildStudentAffairsHandoffReport(input: {
  submissions: ExperienceFormSubmission[];
  rosterStudents: ConvocatoriaRosterStudent[];
  operatorUserId: string;
  operatorName: string;
  closedAt?: string;
}): StudentAffairsHandoffReport {
  const { submissions, rosterStudents, operatorUserId, operatorName } = input;
  const closedAt = input.closedAt ?? new Date().toISOString();
  const absence = countAbsenceCategories(submissions);
  const confirmaron = submissions.filter((s) => s.data.attendance === "yes").length;
  const asistieron = submissions.filter((s) => s.dayCheckIn?.present).length;
  const rosterPending = findRosterStudentsWithoutSubmission(rosterStudents, submissions);

  return {
    generatedAt: closedAt,
    closedByName: operatorName.trim() || "Operador",
    closedByUserId: operatorUserId,
    closedAt,
    respondieron: submissions.length,
    confirmaron,
    asistieron,
    sinAsistir: Math.max(0, confirmaron - asistieron),
    inasistencias: absence.total,
    porRevisar: absence.pendingReview,
    sinRegistrarNiJustificar: absence.unjustified + rosterPending.length,
    pendienteContacto: absence.pendingEmail,
    plazoJustificacion: absence.awaitingJustification,
  };
}
