import { normalizeChileRut, isValidChileRut } from "@/lib/experience/forms/rut-chile";
import { registrationDuplicateKey } from "@/core/congress/duplicates";
import type { CongressRegistration } from "@/core/congress/types";

export type AttachRutResult =
  | { ok: true; registration: CongressRegistration }
  | {
      ok: false;
      error: "invalid_rut" | "duplicate_rut" | "already_has_rut";
      duplicateId?: string;
    };

/**
 * Incorpora RUT a una ficha provisional sin crear otra inscripción.
 */
export function attachRutToRegistration(input: {
  registration: CongressRegistration;
  rut: string;
  existing: CongressRegistration[];
  now: string;
}): AttachRutResult {
  if (!isValidChileRut(input.rut)) return { ok: false, error: "invalid_rut" };
  const rut = normalizeChileRut(input.rut);
  if (!rut) return { ok: false, error: "invalid_rut" };

  if (input.registration.identity.rut) {
    if (input.registration.identity.rut === rut) {
      return { ok: true, registration: input.registration };
    }
    return { ok: false, error: "already_has_rut" };
  }

  const key = registrationDuplicateKey({ rut });
  for (const other of input.existing) {
    if (other._id === input.registration._id) continue;
    if (registrationDuplicateKey({ rut: other.identity.rut }) === key) {
      return { ok: false, error: "duplicate_rut", duplicateId: other._id };
    }
  }

  return {
    ok: true,
    registration: {
      ...input.registration,
      identity: {
        ...input.registration.identity,
        rut,
        status: "verified",
      },
      needsReview: false,
      version: input.registration.version + 1,
      updatedAt: input.now,
    },
  };
}
