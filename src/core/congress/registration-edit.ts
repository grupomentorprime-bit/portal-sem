import { ensureHnoPrefix } from "@/core/congress/brother-name";
import { registrationDuplicateKey } from "@/core/congress/duplicates";
import type { CongressRegistration, CongressRegistrationIdentity } from "@/core/congress/types";
import { isValidChileRut, normalizeChileRut } from "@/lib/experience/forms/rut-chile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OperatorIdentityEditError =
  | "missing_name"
  | "missing_zone"
  | "missing_church"
  | "invalid_rut"
  | "invalid_email"
  | "duplicate_rut";

export const OPERATOR_IDENTITY_EDIT_MESSAGES: Record<OperatorIdentityEditError, string> = {
  missing_name: "Falta el nombre.",
  missing_zone: "Falta la zona.",
  missing_church: "Falta la iglesia.",
  invalid_rut: "El RUT no es válido.",
  invalid_email: "El correo no es válido.",
  duplicate_rut: "Ese RUT ya está en otra ficha.",
};

export type OperatorIdentityEditResult =
  | {
      ok: true;
      identity: CongressRegistrationIdentity;
      zoneId: string;
      churchName: string;
      needsReview: boolean;
    }
  | { ok: false; error: OperatorIdentityEditError; duplicateId?: string };

/**
 * Corrige los datos guardados de una ficha.
 * Permite reemplazar un RUT ya existente si no pertenece a otra persona.
 */
export function applyOperatorIdentityEdit(input: {
  registration: CongressRegistration;
  fullName: string;
  rut: string;
  email: string;
  phone: string;
  zoneId: string;
  churchName: string;
  existing: CongressRegistration[];
}): OperatorIdentityEditResult {
  const fullName = ensureHnoPrefix(input.fullName);
  if (!fullName || fullName === "Hno") return { ok: false, error: "missing_name" };

  const zoneId = input.zoneId.trim();
  if (!zoneId) return { ok: false, error: "missing_zone" };

  const churchName = input.churchName.trim().replace(/\s+/g, " ");
  if (!churchName) return { ok: false, error: "missing_church" };

  const rutRaw = input.rut.trim();
  let rut: string | null = null;
  if (rutRaw) {
    if (!isValidChileRut(rutRaw)) return { ok: false, error: "invalid_rut" };
    rut = normalizeChileRut(rutRaw);
    if (!rut) return { ok: false, error: "invalid_rut" };
  }

  const emailRaw = input.email.trim().toLowerCase();
  if (emailRaw && !EMAIL_RE.test(emailRaw)) return { ok: false, error: "invalid_email" };
  const email = emailRaw || null;

  const phone = input.phone.trim().replace(/\s+/g, " ") || null;

  if (rut) {
    const key = registrationDuplicateKey({ rut });
    for (const other of input.existing) {
      if (other._id === input.registration._id) continue;
      if (registrationDuplicateKey({ rut: other.identity.rut }) === key) {
        return { ok: false, error: "duplicate_rut", duplicateId: other._id };
      }
    }
  }

  return {
    ok: true,
    identity: {
      ...input.registration.identity,
      fullName,
      rut,
      email,
      phone,
      status: rut ? "verified" : "provisional",
    },
    zoneId,
    churchName,
    needsReview: !rut,
  };
}
