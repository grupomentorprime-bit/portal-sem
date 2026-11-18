import type { CongressRegistration } from "@/core/congress/types";

export type RegistrationOriginBucket = "form" | "updated" | "import" | "door";

/**
 * Formulario = inscripción nueva por el formulario.
 * Actualizada = nómina (u otra ficha) que ya envió el formulario.
 * Importación = precarga que todavía no completa ni actualiza.
 */
export function registrationOriginBucket(
  reg: Pick<CongressRegistration, "source" | "submissionId">
): RegistrationOriginBucket {
  if (reg.source === "form") return "form";
  if (reg.source === "door") return "door";
  if (reg.submissionId) return "updated";
  return "import";
}

/**
 * "Por verificar" aparece cuando completaron el formulario o actualizaron
 * la ficha y el dato sigue marcado para revisión. La nómina precargada,
 * sin envío, no entra.
 */
export function countsAsPendingVerification(
  reg: Pick<CongressRegistration, "needsReview"> &
    Partial<Pick<CongressRegistration, "source" | "submissionId">>
): boolean {
  if (!reg.needsReview) return false;
  if (reg.source === "import" && !reg.submissionId) return false;
  return true;
}

export function formSubmissionDisplay(
  reg: Pick<CongressRegistration, "source" | "formSubmittedAt">
): { label: "Formulario" | "Actualización" | null; at: string | null } {
  const at = reg.formSubmittedAt?.trim() ? reg.formSubmittedAt.trim() : null;
  if (!at) return { label: null, at: null };
  if (reg.source === "form") return { label: "Formulario", at };
  return { label: "Actualización", at };
}

/**
 * Normaliza un submissionId (string u ObjectId en runtime) a string.
 * Devuelve null si es null/undefined/vacío o no se puede representar.
 */
export function submissionIdKey(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value !== "object") return null;
  const maybeHex = value as { toHexString?: unknown };
  let raw: string;
  try {
    raw =
      typeof maybeHex.toHexString === "function"
        ? String((maybeHex.toHexString as () => unknown).call(value))
        : String(value);
  } catch {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "[object Object]") return null;
  return trimmed;
}

export function withFormSubmittedAt(
  regs: CongressRegistration[],
  submittedAtBySubmissionId: ReadonlyMap<string, string>
): CongressRegistration[] {
  return regs.map((reg) => {
    const sid = submissionIdKey(reg.submissionId);
    const at = sid ? submittedAtBySubmissionId.get(sid) ?? null : null;
    return { ...reg, formSubmittedAt: at };
  });
}
