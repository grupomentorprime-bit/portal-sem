import {
  getConvocatoriaByFormId,
  getSupersededFormIds,
  isExperienceFormArchived,
  isExperienceFormPublished,
} from "@/lib/admin/forms-center";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

const STUDENT_AFFAIRS_EXTRA_FORM_IDS = new Set(["absence-justification"]);

const NON_STUDENT_AFFAIRS_FORM_IDS = new Set([
  "information-request",
  "program-application",
  "attendance-confirmation",
]);

function isConvocatoriaLikeForm(form: ExperienceFormDefinition): boolean {
  return (
    form.destination === "attendance_confirmation" &&
    form.fields.some((field) => field.name === "attendance")
  );
}

/** Formularios publicados en el portal y relevantes para asuntos estudiantiles. */
export function filterFormsForStudentAffairsPanel(
  forms: ExperienceFormDefinition[]
): ExperienceFormDefinition[] {
  const superseded = getSupersededFormIds();

  return forms.filter((form) => {
    if (isExperienceFormArchived(form)) return false;
    if (!isExperienceFormPublished(form)) return false;
    if (superseded.has(form._id)) return false;
    if (NON_STUDENT_AFFAIRS_FORM_IDS.has(form._id)) return false;
    if (STUDENT_AFFAIRS_EXTRA_FORM_IDS.has(form._id)) return true;
    if (getConvocatoriaByFormId(form._id)) return true;
    return isConvocatoriaLikeForm(form);
  });
}
