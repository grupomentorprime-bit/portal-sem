import type { CongressRegistration } from "@/core/congress/types";

export type EntryNumberRow = Pick<
  CongressRegistration,
  "_id" | "entryNumber" | "identity" | "createdAt"
>;

export function registrationEntryNumber(
  reg: Pick<CongressRegistration, "entryNumber">
): number | null {
  const n = reg.entryNumber;
  if (typeof n === "number" && Number.isInteger(n) && n > 0) return n;
  return null;
}

/** Orden estable para backfill: más antiguo primero. */
export function compareRegistrationsForEntryBackfill(
  a: EntryNumberRow,
  b: EntryNumberRow
): number {
  const byCreated = a.createdAt.localeCompare(b.createdAt);
  if (byCreated !== 0) return byCreated;
  const byName = a.identity.fullName.localeCompare(b.identity.fullName, "es");
  if (byName !== 0) return byName;
  return a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
}

/** Lista con el correlativo más alto arriba; sin número, al final. */
export function compareByRegistrationEntryNumber(
  a: EntryNumberRow,
  b: EntryNumberRow
): number {
  const na = registrationEntryNumber(a);
  const nb = registrationEntryNumber(b);
  if (na != null && nb != null && na !== nb) return nb - na;
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;
  return compareRegistrationsForEntryBackfill(a, b);
}

/**
 * Cierra huecos después de borrar una ficha.
 * El menor correlativo que queda no se mueve; los siguientes quedan seguidos.
 */
export function planCompactEntryNumbers<T extends EntryNumberRow>(
  rows: T[]
): Array<{ _id: string; entryNumber: number }> {
  const ordered = [...rows].sort((a, b) => compareByRegistrationEntryNumber(b, a));
  const first =
    ordered.map((row) => registrationEntryNumber(row)).find((n) => n != null) ?? 1;
  return ordered.map((row, index) => ({
    _id: row._id,
    entryNumber: first + index,
  }));
}
