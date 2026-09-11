/**
 * OT-GROWTH-CORE-002 — normalización email/teléfono para Persona.
 * Reutiliza normalizeEmail (Identity) y helpers Chile (Experience Forms).
 */

import { normalizeEmail } from "@/lib/validation/identity";
import {
  extractChileNationalDigits,
  formatChilePhoneDisplay,
  isValidChilePhone,
} from "@/lib/experience/forms/phone-chile";

export function normalizeGrowthEmail(raw: string | undefined | null): {
  email?: string;
  emailNormalized?: string;
} {
  if (raw == null) return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const emailNormalized = normalizeEmail(trimmed);
  return { email: emailNormalized, emailNormalized };
}

/**
 * phoneNormalized = dígitos nacionales (Chile) o dígitos si no aplica.
 * phone = display Chile cuando es válido; si no, valor trimmeado.
 */
export function normalizeGrowthPhone(raw: string | undefined | null): {
  phone?: string;
  phoneNormalized?: string;
} {
  if (raw == null) return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};

  if (isValidChilePhone(trimmed)) {
    const national = extractChileNationalDigits(trimmed);
    return {
      phone: formatChilePhoneDisplay(trimmed),
      phoneNormalized: national,
    };
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return {};
  return { phone: trimmed, phoneNormalized: digits };
}

export function buildDisplayName(input: {
  displayName?: string;
  firstName?: string;
  lastName?: string;
}): string {
  const explicit = input.displayName?.trim().replace(/\s+/g, " ");
  if (explicit) return explicit;
  const parts = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return "";
}
