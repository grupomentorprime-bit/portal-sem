/**
 * Exclusión de nómina de convocatoria (p. ej. desertores).
 * Sin I/O: el alumno no marca asistencia solo; AE/Soporte/Admin puede reincorporarlo.
 */

import { findRosterStudentByIdentity } from "@/lib/experience/forms/roster-import";
import type {
  ConvocatoriaExcludedStudent,
  ConvocatoriaRosterStudent,
} from "@/types/convocatoria-roster";

export const CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE =
  "No puedes registrar asistencia en esta convocatoria. Si necesitas hacerlo, contacta a Asuntos Estudiantiles.";

/** Si el alumno vuelve a la nómina activa, sale de la lista de exclusión. */
export function reconcileExcludedStudents(
  students: ConvocatoriaRosterStudent[],
  excluded: ConvocatoriaExcludedStudent[]
): ConvocatoriaExcludedStudent[] {
  if (excluded.length === 0) return [];
  return excluded.filter((blocked) => {
    if (students.some((student) => student.id === blocked.id)) return false;
    return !findRosterStudentByIdentity(students, {
      fullName: blocked.fullName,
      rut: blocked.rut,
    });
  });
}

export function findExcludedStudentByIdentity(
  excluded: ConvocatoriaExcludedStudent[],
  identity: { fullName?: string; rut?: string; studentId?: string }
): ConvocatoriaExcludedStudent | null {
  const studentId = identity.studentId?.trim();
  if (studentId) {
    const byId = excluded.find((student) => student.id === studentId);
    if (byId) return byId;
  }
  const fullName = identity.fullName?.trim() ?? "";
  const rut = identity.rut?.trim();
  if (!fullName && !rut) return null;
  return findRosterStudentByIdentity(excluded, {
    fullName,
    rut,
  }) as ConvocatoriaExcludedStudent | null;
}
