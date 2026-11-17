import { normalizeChileRut } from "@/lib/experience/forms/rut-chile";

/** Confirmación de asistencia del 3.° Congreso de Varones. */
export const CONGRESS_VARONES_FORM_ID = "ipn-asistencia-congreso-varones-2026";

export type EnrolleeMatch = "rut" | "email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EnrolleeIdentity {
  rut: string | null;
  email: string | null;
}

/** RUT canónico y correo normalizado. Vacío o inválido no sirve para buscar una inscripción. */
export function enrolleeIdentity(data: Record<string, unknown>): EnrolleeIdentity {
  const rut = normalizeChileRut(String(data.rut ?? "").trim());
  const emailRaw = String(data.email ?? "").trim().toLowerCase();
  const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw : null;
  return { rut, email };
}

export function alreadyEnrolledMessage(match: EnrolleeMatch): string {
  if (match === "email") {
    return "Ya estás inscrito en el 3° Congreso de Varones. Este correo ya tiene una inscripción y no necesitas enviar el formulario otra vez.";
  }
  return "Ya estás inscrito en el 3° Congreso de Varones. Este RUT ya tiene una inscripción y no necesitas enviar el formulario otra vez.";
}

export function missingFieldMessage(label: string): string {
  const name = label.trim() || "este dato";
  return `Falta completar ${name}`;
}

export function isMissingFieldMessage(message: string): boolean {
  return message.startsWith("Falta completar ");
}
