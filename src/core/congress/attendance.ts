import type { CongressAttendanceDay } from "@/core/congress/constants";
import type { CongressAttendanceDays } from "@/core/congress/types";

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
