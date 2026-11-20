import { isActiveLodgingAssignment } from "@/core/congress/lodging";

type PaymentSlice = {
  status: "posted" | "voided";
  allocations: Array<{ registrationId: string; amountClp: number }>;
};

type AssignmentSlice = {
  registrationId: string;
  status?: string | null;
};

/** Motivo para no borrar una ficha. null si se puede eliminar. */
export function registrationDeleteBlockReason(input: {
  registrationId: string;
  allocatedPaidClp: number;
  payments: PaymentSlice[];
  assignments: AssignmentSlice[];
}): string | null {
  const paidOnFile =
    input.allocatedPaidClp > 0 ||
    input.payments.some(
      (payment) =>
        payment.status !== "voided" &&
        payment.allocations.some(
          (allocation) =>
            allocation.registrationId === input.registrationId && allocation.amountClp > 0
        )
    );
  if (paidOnFile) {
    return "No se puede eliminar: esta ficha tiene un aporte registrado.";
  }

  const hasBed = input.assignments.some(
    (assignment) =>
      assignment.registrationId === input.registrationId &&
      isActiveLodgingAssignment(assignment)
  );
  if (hasBed) {
    return "No se puede eliminar: tiene una cama asignada. Cancele el alojamiento primero.";
  }

  return null;
}
