import type { ExperienceFormDefinition } from "@/types/experience-forms";

/** Formularios accesibles solo por enlace directo (no hub /formularios). */
export const PRIVATE_EXPERIENCE_FORM_IDS = ["testimonial-submission"] as const;

export function isPrivateExperienceFormId(formId: string): boolean {
  return (PRIVATE_EXPERIENCE_FORM_IDS as readonly string[]).includes(formId);
}

export function isExperienceFormArchived(form: Pick<ExperienceFormDefinition, "archived">): boolean {
  return form.archived === true;
}

export function isExperienceFormPrivate(
  form: Pick<ExperienceFormDefinition, "private"> & { _id?: string }
): boolean {
  return form.private === true || (form._id ? isPrivateExperienceFormId(form._id) : false);
}

/** Visible en el hub /formularios y embeddable en bloques: activo, publicado y no archivado. */
export function isExperienceFormPublished(
  form: Pick<ExperienceFormDefinition, "active" | "visible" | "archived" | "private">
): boolean {
  return (
    form.active === true &&
    form.visible === true &&
    !isExperienceFormArchived(form) &&
    !isExperienceFormPrivate(form)
  );
}

/** Accesible por URL directa o envío: publicado en portal o marcado como privado. */
export function isExperienceFormDirectAccessible(
  form: Pick<ExperienceFormDefinition, "active" | "visible" | "archived" | "private">
): boolean {
  if (isExperienceFormArchived(form)) return false;
  if (form.active !== true) return false;
  return isExperienceFormPrivate(form) || (form.visible === true && !isExperienceFormArchived(form));
}

export type FormUnavailabilityReason = "not_found" | "archived" | "inactive" | "hidden";

export function getExperienceFormUnavailabilityReason(
  form: ExperienceFormDefinition | null
): FormUnavailabilityReason | null {
  if (!form) return "not_found";
  if (isExperienceFormArchived(form)) return "archived";
  if (form.active !== true) return "inactive";
  if (!isExperienceFormDirectAccessible(form)) return "hidden";
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
          "Este formulario no está disponible. Si recibiste un enlace directo, verifica que siga vigente o contacta al equipo del SEM.",
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
