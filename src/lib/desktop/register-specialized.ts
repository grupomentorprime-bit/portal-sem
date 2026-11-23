import { registerCongressPublicForm } from "@/core/congress/public-form";
import { IPN_CHILE_TENANT_ID } from "@/core/units/ipn-chile";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import { registerCongressRouteRules } from "@/core/congress/shell";
import { registerAdmissionRouteRules } from "@/lib/portal/admission/shell";
import { registerStudentAffairsRouteRules } from "@/lib/student-affairs/shell";
import { ensureSpecializedCapabilities as sealSpecializedCapabilities, registerSpecializedManifest } from "@/nelzuri/contracts/capabilities";
import { ADMISSION_REGISTRATION } from "@/lib/portal/admission/manifest";
import { CONGRESS_REGISTRATION } from "@/core/congress/manifest";
import { STUDENT_AFFAIRS_REGISTRATION } from "@/lib/student-affairs/manifest";
import { registerSemFormCatalog } from "@/lib/portal/sem-forms";
import { registerSemPublicForm } from "@/lib/portal/sem-public-form";
import { setSpecializedCapabilityInstaller } from "@/nelzuri/contracts/capabilities";

/**
 * Único lugar que inscribe las capacidades especializadas.
 * La inscripción es idempotente y ocurre antes de publicar el registro.
 */
setSpecializedCapabilityInstaller(() => {
  registerSpecializedManifest(ADMISSION_REGISTRATION);
  registerSpecializedManifest(STUDENT_AFFAIRS_REGISTRATION);
  registerSpecializedManifest(CONGRESS_REGISTRATION);
  registerAdmissionRouteRules();
  registerStudentAffairsRouteRules();
  registerCongressRouteRules();
  registerSemFormCatalog();
  registerSemPublicForm();
  registerCongressPublicForm();
});

export function ensureSpecializedCapabilities(): void {
  sealSpecializedCapabilities();
}

/** El formulario del congreso solo se envía en IPN Chile. La ruta compartida no nombra al cliente. */
export function publicFormSubmitAllowed(formId: string, tenantId: string): boolean {
  ensureSpecializedCapabilities();
  if (formId === CONGRESS_VARONES_FORM_ID && tenantId !== IPN_CHILE_TENANT_ID) return false;
  return true;
}

ensureSpecializedCapabilities();
