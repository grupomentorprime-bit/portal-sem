import { registerCongressFormEffect } from "@/core/congress/form-effect";
import { registerCongressPublicForm } from "@/core/congress/public-form";
import { registerCongressRouteRules } from "@/core/congress/shell";
import { registerAdmissionRouteRules } from "@/lib/portal/admission/shell";
import { registerStudentAffairsRouteRules } from "@/lib/student-affairs/shell";
import { ensureSpecializedCapabilities as sealSpecializedCapabilities, registerSpecializedManifest } from "@/nelzuri/contracts/capabilities";
import { ADMISSION_REGISTRATION } from "@/lib/portal/admission/manifest";
import { CONGRESS_REGISTRATION } from "@/core/congress/manifest";
import { STUDENT_AFFAIRS_REGISTRATION } from "@/lib/student-affairs/manifest";
import { registerSemFormCatalog } from "@/lib/portal/sem-forms";
import { registerSemPublicForm } from "@/lib/portal/sem-public-form";
import { registerSemFormEffect } from "@/lib/student-affairs/form-effect";
import { registerCumpleFormEffect } from "@/sites/cumple/form-effect";
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
  registerSemFormEffect();
  registerCongressFormEffect();
  registerCumpleFormEffect();
  registerSemPublicForm();
  registerCongressPublicForm();
});

export function ensureSpecializedCapabilities(): void {
  sealSpecializedCapabilities();
}

ensureSpecializedCapabilities();
