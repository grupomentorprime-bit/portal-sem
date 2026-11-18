import { normalizeChileRut } from "@/lib/experience/forms/rut-chile";

export type DuplicateCandidate = {
  rut?: string | null;
  email?: string | null;
  provisionalKey?: string | null;
};

/**
 * Clave de unicidad dentro del evento.
 * Con RUT válido → rut canónico.
 * Sin RUT → provisionalKey explícita (nunca se inventa por nombre).
 */
export function registrationDuplicateKey(input: DuplicateCandidate): string | null {
  const rut = input.rut ? normalizeChileRut(String(input.rut)) : null;
  if (rut) return `rut:${rut}`;
  const provisional = String(input.provisionalKey ?? "").trim();
  if (provisional) return `prov:${provisional}`;
  return null;
}

export function findDuplicateRegistrationId(
  existing: Array<{ _id: string } & DuplicateCandidate>,
  candidate: DuplicateCandidate
): string | null {
  const key = registrationDuplicateKey(candidate);
  if (!key) return null;
  for (const row of existing) {
    if (registrationDuplicateKey(row) === key) return row._id;
  }
  return null;
}

/** Nunca fusionar por similitud de nombre. */
export function shouldAutoMergeBySimilarName(): false {
  return false;
}
