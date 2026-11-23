import { CONGRESS_REGISTRATION } from "@/core/congress/manifest";
import { ADMISSION_REGISTRATION } from "@/lib/portal/admission/manifest";
import { STUDENT_AFFAIRS_REGISTRATION } from "@/lib/student-affairs/manifest";
import type { SpecializedManifestRegistration } from "@/nelzuri/contracts/capabilities";

/**
 * Fichas que el registro publica al leerse.
 * Son los mismos objetos que inscribe el instalador de cada capacidad.
 */
export const SPECIALIZED_MANIFEST_REGISTRATIONS: readonly SpecializedManifestRegistration[] = [
  ADMISSION_REGISTRATION,
  STUDENT_AFFAIRS_REGISTRATION,
  CONGRESS_REGISTRATION,
];
