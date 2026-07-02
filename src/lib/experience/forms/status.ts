import type { ExperienceFormDefinition } from "@/types/experience-forms";

export function isExperienceFormArchived(form: Pick<ExperienceFormDefinition, "archived">): boolean {
  return form.archived === true;
}

/** Visible en el portal público: activo, publicado y no archivado. */
export function isExperienceFormPublished(
  form: Pick<ExperienceFormDefinition, "active" | "visible" | "archived">
): boolean {
  return form.active === true && form.visible === true && !isExperienceFormArchived(form);
}

export type FormUnavailabilityReason = "not_found" | "archived" | "inactive" | "hidden";

export function getExperienceFormUnavailabilityReason(
  form: ExperienceFormDefinition | null
): FormUnavailabilityReason | null {
  if (!form) return "not_found";
  if (isExperienceFormArchived(form)) return "archived";
  if (form.active !== true) return "inactive";
  if (form.visible !== true) return "hidden";
  return null;
}

export function formUnavailabilityCopy(reason: FormUnavailabilityReason): {
  title: string;
  description: string;
} {
  switch (reason) {
    case "archived":
      return {
        title: "Formulario cerrado",
        description:
          "Esta convocatoria o formulario ya finalizó y ya no acepta respuestas. Si necesitas información, contáctanos.",
      };
    case "inactive":
      return {
        title: "Formulario no abierto",
        description:
          "Este formulario existe pero aún no está recibiendo respuestas. Vuelve a intentarlo más adelante o revisa otras convocatorias activas.",
      };
    case "hidden":
      return {
        title: "Formulario no publicado",
        description:
          "Este formulario aún no está visible en el portal público. Si recibiste un enlace directo, es posible que aún no haya sido publicado.",
      };
    case "not_found":
    default:
      return {
        title: "Formulario no encontrado",
        description:
          "No encontramos el formulario que buscas. Puede haber cambiado de dirección o ya no estar disponible.",
      };
  }
}
