import { registerCongressFormEffect } from "@/core/congress/form-effect";
import { registerCongressPublicForm } from "@/core/congress/public-form";
import { registerCongressRouteRules } from "@/core/congress/shell";
import { registerAdmissionRouteRules } from "@/lib/portal/admission/shell";
import { registerStudentAffairsRouteRules } from "@/lib/student-affairs/shell";
import { ensureSpecializedCapabilities as sealSpecializedCapabilities, registerSpecializedManifest } from "@/nelzuri/contracts/capabilities";
import { SPECIALIZED_MANIFEST_REGISTRATIONS } from "@/nelzuri/catalog/manifests";
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
  for (const entry of SPECIALIZED_MANIFEST_REGISTRATIONS) {
    registerSpecializedManifest(entry);
  }
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
