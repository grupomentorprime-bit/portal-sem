import type { CongressAttendanceDay } from "@/core/congress/constants";
import type {
  CongressAttendanceDays,
  CongressAttendanceHistoryEntry,
} from "@/core/congress/types";

export function emptyAttendance(): CongressAttendanceDays {
  return { saturday: null, sunday: null };
}

/** Marca un día sin alterar el otro. null = sin registrar; true/false = presente/ausente. */
export function setAttendanceDay(
  current: CongressAttendanceDays,
  day: CongressAttendanceDay,
  present: boolean | null
): CongressAttendanceDays {
  return { ...current, [day]: present };
}

export function isAttendanceRecorded(
  attendance: CongressAttendanceDays,
  day: CongressAttendanceDay
): boolean {
  return attendance[day] !== null;
}

export type CongressAttendanceMeta = {
  saturdayMarkedAt?: string | null;
  sundayMarkedAt?: string | null;
};

function markedAtKey(day: CongressAttendanceDay): "saturdayMarkedAt" | "sundayMarkedAt" {
  return day === "saturday" ? "saturdayMarkedAt" : "sundayMarkedAt";
}

export type ApplyAttendanceChangeInput = {
  attendance: CongressAttendanceDays;
  attendanceMeta: CongressAttendanceMeta;
  attendanceHistory: CongressAttendanceHistoryEntry[];
  day: CongressAttendanceDay;
  present: boolean | null;
  reason?: string | null;
  nowIso: string;
  actorUserId: string;
};

export type ApplyAttendanceChangeResult = {
  ok: true;
  attendance: CongressAttendanceDays;
  attendanceMeta: CongressAttendanceMeta;
  attendanceHistory: CongressAttendanceHistoryEntry[];
  idempotent?: boolean;
};

/**
 * Primera hora inmutable ante reintentos present=true.
 * Marcar/desmarcar sin exigir motivo; el historial previo se conserva.
 */
export function applyAttendanceChange(
  input: ApplyAttendanceChangeInput
): ApplyAttendanceChangeResult {
  const { day, present, nowIso, actorUserId } = input;
  const metaKey = markedAtKey(day);
  const previousPresent = input.attendance[day] ?? null;
  const previousMarkedAt = input.attendanceMeta[metaKey] ?? null;
  const history = [...(input.attendanceHistory ?? [])];
  const meta: CongressAttendanceMeta = { ...input.attendanceMeta };

  if (present === true && previousPresent === true && previousMarkedAt) {
    return {
      ok: true,
      attendance: input.attendance,
      attendanceMeta: meta,
      attendanceHistory: history,
      idempotent: true,
    };
  }

  // Sin cambio real (p. ej. limpiar cuando ya está sin marcar).
  if (present === previousPresent) {
    return {
      ok: true,
      attendance: input.attendance,
      attendanceMeta: meta,
      attendanceHistory: history,
      idempotent: true,
    };
  }

  const attendance = setAttendanceDay(input.attendance, day, present);

  if (present === true) {
    if (!meta[metaKey]) {
      meta[metaKey] = nowIso;
    }
  } else {
    meta[metaKey] = null;
  }

  const reasonTrimmed = String(input.reason ?? "").trim();
  history.push({
    day,
    previousPresent,
    nextPresent: present,
    previousMarkedAt,
    reason: reasonTrimmed || null,
    at: nowIso,
    actorUserId,
  });

  return {
    ok: true,
    attendance,
    attendanceMeta: meta,
    attendanceHistory: history,
  };
}
