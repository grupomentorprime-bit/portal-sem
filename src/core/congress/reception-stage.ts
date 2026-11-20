import type { CongressAttendanceDay } from "@/core/congress/constants";
import { labelExpectedDays } from "@/core/congress/expected-days";
import { deriveContributionStatus } from "@/core/congress/finance-status";
import type {
  CongressLodgingAssignment,
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";
import { isValidChilePhone } from "@/lib/experience/forms/phone-chile";

export type ReceptionStageId = "asistencia" | "alimentacion" | "alojamiento" | "listo";
export type ReceptionStepId = "asistencia" | "alimentacion" | "alojamiento";
export type ReceptionStepState = "ahora" | "pendiente" | "listo" | "bloqueado";
export type ReceptionMissingField = "fullName" | "phone" | "zoneId" | "churchName";
export type ReceptionFoodLock = "leader" | "paid" | "exempt" | null;

export type ReceptionStageRegistration = Pick<
  CongressRegistration,
  | "identity"
  | "zoneId"
  | "churchName"
  | "expectedDays"
  | "attendance"
  | "lodgingNeed"
  | "chargeAmountClp"
  | "allocatedPaidClp"
  | "needsReview"
  | "source"
  | "submissionId"
>;

export type ReceptionProgress = {
  stage: ReceptionStageId;
  stageLabel: "En asistencia" | "En alimentación" | "En alojamiento" | "Listo";
  steps: Record<ReceptionStepId, ReceptionStepState>;
  missingFields: ReceptionMissingField[];
  arrivalRequired: boolean;
  foodLock: ReceptionFoodLock;
};

const STEP_ORDER: ReceptionStepId[] = ["asistencia", "alimentacion", "alojamiento"];

const STAGE_LABEL: Record<ReceptionStageId, ReceptionProgress["stageLabel"]> = {
  asistencia: "En asistencia",
  alimentacion: "En alimentación",
  alojamiento: "En alojamiento",
  listo: "Listo",
};

function missingFields(reg: ReceptionStageRegistration): ReceptionMissingField[] {
  const missing: ReceptionMissingField[] = [];
  if (!reg.identity.fullName.trim()) missing.push("fullName");
  const phone = reg.identity.phone?.trim() ?? "";
  if (!phone || !isValidChilePhone(phone)) missing.push("phone");
  if (!reg.zoneId.trim()) missing.push("zoneId");
  if (!reg.churchName.trim()) missing.push("churchName");
  return missing;
}

function activeAssignment(
  registrationId: string,
  assignments: Array<Pick<CongressLodgingAssignment, "registrationId" | "status" | "confirmed">>
): boolean {
  return assignments.some(
    (assignment) =>
      assignment.registrationId === registrationId &&
      assignment.status !== "cancelled" &&
      (assignment.status === "assigned" ||
        assignment.status === "confirmed" ||
        assignment.confirmed)
  );
}

function leaderPaid(
  registrationId: string,
  payments: Array<Pick<CongressPayment, "status" | "payerType" | "allocations">>
): boolean {
  return payments.some(
    (payment) =>
      payment.status === "posted" &&
      payment.payerType === "church" &&
      payment.allocations.some(
        (allocation) =>
          allocation.registrationId === registrationId && allocation.amountClp > 0
      )
  );
}

export function deriveReceptionProgress(input: {
  registrationId: string;
  registration: ReceptionStageRegistration;
  payments: Array<Pick<CongressPayment, "status" | "payerType" | "allocations">>;
  assignments: Array<Pick<CongressLodgingAssignment, "registrationId" | "status" | "confirmed">>;
  journeyDay: CongressAttendanceDay;
}): ReceptionProgress {
  const expected = labelExpectedDays(input.registration.expectedDays);
  const caseClear = expected !== "unconfirmed";
  const arrivalRequired = caseClear && (expected === "both" || expected === input.journeyDay);
  const arrived = input.registration.attendance[input.journeyDay] === true;
  const missing = missingFields(input.registration);
  const attendanceReady = caseClear && missing.length === 0 && (!arrivalRequired || arrived);

  const contribution = deriveContributionStatus(input.registration);
  const foodReady = contribution === "paid" || contribution === "no_charge";
  const foodLock: ReceptionFoodLock = !foodReady
    ? null
    : contribution === "no_charge"
      ? "exempt"
      : leaderPaid(input.registrationId, input.payments)
        ? "leader"
        : "paid";

  const hasBed = activeAssignment(input.registrationId, input.assignments);
  const lodgingNeed = input.registration.lodgingNeed ?? "unknown";
  const lodgingReady = hasBed || (lodgingNeed === "none" && !hasBed);

  const stage: ReceptionStageId = !attendanceReady
    ? "asistencia"
    : !foodReady
      ? "alimentacion"
      : !lodgingReady
        ? "alojamiento"
        : "listo";

  const stageIndex = stage === "listo" ? STEP_ORDER.length : STEP_ORDER.indexOf(stage);
  const steps = {} as ReceptionProgress["steps"];
  for (const step of STEP_ORDER) {
    const stepIndex = STEP_ORDER.indexOf(step);
    if (stepIndex > stageIndex) {
      steps[step] = "pendiente";
      continue;
    }
    if (stepIndex < stageIndex || stage === "listo") {
      steps[step] = step === "alimentacion" && foodLock === "leader" ? "bloqueado" : "listo";
      continue;
    }
    steps[step] = "ahora";
  }

  return {
    stage,
    stageLabel: STAGE_LABEL[stage],
    steps,
    missingFields: missing,
    arrivalRequired,
    foodLock,
  };
}

/** La llegada se marca en la fila solo si, al registrarla, la ficha queda lista. */
export function arrivalMarksImmediately(input: {
  registrationId: string;
  registration: ReceptionStageRegistration;
  payments: Array<Pick<CongressPayment, "status" | "payerType" | "allocations">>;
  assignments: Array<Pick<CongressLodgingAssignment, "registrationId" | "status" | "confirmed">>;
  day: CongressAttendanceDay;
}): boolean {
  const registration = {
    ...input.registration,
    attendance: { ...input.registration.attendance, [input.day]: true as const },
  };
  return (
    deriveReceptionProgress({
      registrationId: input.registrationId,
      registration,
      payments: input.payments,
      assignments: input.assignments,
      journeyDay: input.day,
    }).stage === "listo"
  );
}

export function receptionPrimaryAction(
  viewStep: ReceptionStepId,
  steps: ReceptionProgress["steps"]
): { label: "Siguiente" | "Listo, siguiente de la fila"; enabled: boolean; kind: "advance" | "close" } {
  if (viewStep === "alojamiento") {
    return {
      label: "Listo, siguiente de la fila",
      enabled: steps.alojamiento === "listo",
      kind: "close",
    };
  }
  const state = steps[viewStep];
  return {
    label: "Siguiente",
    enabled: state === "listo" || state === "bloqueado",
    kind: "advance",
  };
}