import type { CongressAttendanceDays } from "@/core/congress/types";

export type ExpectedDaysLabel = "saturday" | "sunday" | "both" | "unconfirmed";

export function emptyExpectedDays(): CongressAttendanceDays {
  return { saturday: null, sunday: null };
}

/** Clasifica días previstos (independiente de asistencia real). */
export function labelExpectedDays(
  days: CongressAttendanceDays | null | undefined
): ExpectedDaysLabel {
  const saturday = days?.saturday === true;
  const sunday = days?.sunday === true;
  if (saturday && sunday) return "both";
  if (saturday && !sunday) return "saturday";
  if (sunday && !saturday) return "sunday";
  return "unconfirmed";
}

export function expectedDaysLabelEs(label: ExpectedDaysLabel): string {
  switch (label) {
    case "saturday":
      return "Sábado";
    case "sunday":
      return "Domingo";
    case "both":
      return "Ambos";
    default:
      return "Por confirmar";
  }
}

/** Parseo conservador de etiquetas legacy del Excel. */
export function parseExpectedDayLabel(
  raw: string | null | undefined
): CongressAttendanceDays {
  const text = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!text) return emptyExpectedDays();
  const hasSat = /s[aá]bado|sab/.test(text);
  const hasSun = /domingo|dom/.test(text);
  const both = /ambos|los dos|s[aá]bado\s*y\s*domingo/.test(text);
  if (both || (hasSat && hasSun)) {
    return { saturday: true, sunday: true };
  }
  if (hasSat) return { saturday: true, sunday: false };
  if (hasSun) return { saturday: false, sunday: true };
  return emptyExpectedDays();
}
