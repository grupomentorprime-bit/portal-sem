import "server-only";

import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import type { StudentAffairsScope } from "@/types/identity";

export {
  findRosterStudentsWithoutSubmission,
  normalizeRosterMatchRut,
  submissionMatchesRosterStudent,
} from "@/lib/student-affairs/roster-match";

export function filterRosterStudentsForStudentAffairs(
  students: ConvocatoriaRosterStudent[],
  scope: StudentAffairsScope | null
): ConvocatoriaRosterStudent[] {
  if (!scope) return students;
  if (!scope.generationCodes.length) return [];
  return students.filter((student) =>
    scope.generationCodes.includes(normalizeGenerationValue(student.generation))
  );
}
