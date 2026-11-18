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
