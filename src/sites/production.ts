import { adlSite } from "@/sites/adl/site";
import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
import { cumpleSite } from "@/sites/cumple/site";
import { formacionSite } from "@/sites/formacion/site";
import { registerCodedSite } from "@/sites/registry";

/** Registra los sitios de código que este repositorio publica. No toca otros espacios. */
export function ensureProductionCodedSites(): void {
  registerCodedSite(cumpleSite);
  registerCodedSite(formacionSite);
  registerCodedSite(adlSite);
  ensureCumpleGrowthAssessmentPort();
}
