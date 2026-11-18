import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
import { cumpleSite } from "@/sites/cumple/site";
import { registerCodedSite } from "@/sites/registry";

/** Solo registra sitios que este repositorio publica. Formación y ADL viven fuera. */
export function ensureProductionCodedSites(): void {
  registerCodedSite(cumpleSite);
  ensureCumpleGrowthAssessmentPort();
}
