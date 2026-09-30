import { CumpleHome } from "@/components/sites/cumple/CumpleHome";
import { createMateriaView } from "@/components/sites/cumple/pages/MateriaRoute";
import { materias } from "@/sites/cumple/pages/materias";
import { CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import { registerCodedPageView } from "@/sites/page-views";

let registered = false;

export function registerProductionPageViews(): void {
  if (registered) return;
  registered = true;
  registerCodedPageView(CUMPLE_TENANT_ID, "/", CumpleHome);
  for (const materia of materias) {
    registerCodedPageView(CUMPLE_TENANT_ID, materia.path, createMateriaView(materia));
  }
}
