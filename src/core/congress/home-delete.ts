import { isActiveLodgingAssignment } from "@/core/congress/lodging";

type AssignmentSlice = {
  homeId: string;
  status?: string | null;
};

/** Motivo para no borrar un hogar. null si se puede eliminar. */
export function homeDeleteBlockReason(input: {
  homeId: string;
  assignments: AssignmentSlice[];
}): string | null {
  const hasGuests = input.assignments.some(
    (assignment) =>
      assignment.homeId === input.homeId && isActiveLodgingAssignment(assignment)
  );
  if (hasGuests) {
    return "No se puede eliminar: este hogar ya tiene hermanos asignados.";
  }
  return null;
}
