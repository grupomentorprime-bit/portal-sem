export const PUBLIC_ROSTER_MIN_QUERY = 3;
export const PUBLIC_ROSTER_LIMIT = 8;

export interface PublicRosterHit {
  selectionRef: string;
  fullName: string;
  generation: string;
  hasEmail: boolean;
  hasPhone: boolean;
}

const FORBIDDEN_PUBLIC_KEYS = [
  "id",
  "studentId",
  "registrationId",
  "email",
  "phone",
  "rut",
  "_id",
] as const;

export function toPublicRosterHit(
  student: { fullName: string; generation: string; email?: string | null; phone?: string | null },
  selectionRef: string
): PublicRosterHit {
  return {
    selectionRef,
    fullName: student.fullName,
    generation: student.generation,
    hasEmail: Boolean(student.email?.trim()),
    hasPhone: Boolean(student.phone?.trim()),
  };
}

export function publicRosterHitExposesInternalId(hit: object): boolean {
  const record = hit as Record<string, unknown>;
  return FORBIDDEN_PUBLIC_KEYS.some((key) => key in record);
}

export function publicRosterMatchFields(student: {
  fullName: string;
  generation?: string | null;
}): Array<string | null | undefined> {
  return [student.fullName, student.generation];
}

export type RosterContactAuthorization =
  | { method: "operator"; permission: "student-affairs" }
  | { method: "accredited-contact" }
  | { method: "student-id" }
  | { method: "name-or-rut" };

/** studentId, el nombre y el RUT no autorizan cambiar el contacto de la nómina. */
export function authorizeRosterContactChange(
  authorization: RosterContactAuthorization
): { ok: true } | { ok: false; error: "identity_not_proven" } {
  if (authorization.method === "operator" && authorization.permission === "student-affairs") {
    return { ok: true };
  }
  if (authorization.method === "accredited-contact") return { ok: true };
  return { ok: false, error: "identity_not_proven" };
}
