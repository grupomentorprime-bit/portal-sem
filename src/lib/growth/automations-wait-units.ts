/**
 * OT-GROWTH-AUTOMATION-006 — unidades humanas de espera (sin milisegundos en UI).
 */

export type AutomationWaitUnit = "minutes" | "hours" | "days";

export const AUTOMATION_WAIT_UNIT_OPTIONS: Array<{
  value: AutomationWaitUnit;
  label: string;
}> = [
  { value: "minutes", label: "minutos" },
  { value: "hours", label: "horas" },
  { value: "days", label: "días" },
];

const MS_PER_UNIT: Record<AutomationWaitUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

export function waitDurationMs(
  amount: number,
  unit: AutomationWaitUnit
): number {
  return amount * MS_PER_UNIT[unit];
}

/** Descompone durationMs a cantidad/unidad humanas. */
export function waitFromDurationMs(durationMs: number): {
  amount: string;
  unit: AutomationWaitUnit;
} {
  if (durationMs % MS_PER_UNIT.days === 0) {
    return {
      amount: String(durationMs / MS_PER_UNIT.days),
      unit: "days",
    };
  }
  if (durationMs % MS_PER_UNIT.hours === 0) {
    return {
      amount: String(durationMs / MS_PER_UNIT.hours),
      unit: "hours",
    };
  }
  if (durationMs % MS_PER_UNIT.minutes === 0) {
    return {
      amount: String(durationMs / MS_PER_UNIT.minutes),
      unit: "minutes",
    };
  }
  return {
    amount: String(Math.max(1, Math.round(durationMs / MS_PER_UNIT.minutes))),
    unit: "minutes",
  };
}
