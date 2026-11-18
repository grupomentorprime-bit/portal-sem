import { normalizeChileRut, isValidChileRut } from "@/lib/experience/forms/rut-chile";
import type { CongressRegistration } from "@/core/congress/types";

export type AttachRutInput = {
  registration: CongressRegistration;
  rut: string;
  existingRuts: Array<{ registrationId: string; rut: string }>;
  updatedAt: string;
};

export type AttachRutOk = {
  ok: true;
  registration: CongressRegistration;
};

export type AttachRutErr = {
  ok: false;
  error: "invalid_rut" | "rut_taken" | "already_verified";
};

export type AttachRutResult = AttachRutOk | AttachRutErr;

/** Adjunta RUT a ficha provisional sin crear duplicado. */
export function attachRutToProvisional(input: AttachRutInput): AttachRutResult {
  if (input.registration.identity.status === "verified" && input.registration.identity.rut) {
    return { ok: false, error: "already_verified" };
  }

  const rutRaw = input.rut.trim();
  if (!isValidChileRut(rutRaw)) {
    return { ok: false, error: "invalid_rut" };
  }
  const rut = normalizeChileRut(rutRaw);
  if (!rut) return { ok: false, error: "invalid_rut" };

  for (const row of input.existingRuts) {
    if (row.registrationId === input.registration._id) continue;
    const other = normalizeChileRut(row.rut);
    if (other && other === rut) {
      return { ok: false, error: "rut_taken" };
    }
  }

  const registration: CongressRegistration = {
    ...input.registration,
    identity: {
      ...input.registration.identity,
      rut,
      status: "verified",
    },
    needsReview: false,
    version: input.registration.version + 1,
    updatedAt: input.updatedAt,
  };

  return { ok: true, registration };
}