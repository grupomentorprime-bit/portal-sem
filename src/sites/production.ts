import { cumpleSite } from "@/sites/cumple/site";
import { registerCodedSite } from "@/sites/registry";

/** Registra los sitios de código que este repositorio publica. No toca otros espacios. */
export function ensureProductionCodedSites(): void {
  registerCodedSite(cumpleSite);
}
