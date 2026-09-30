import { CumpleHome } from "@/components/sites/cumple/CumpleHome";
import { createMateriaView } from "@/components/sites/cumple/pages/MateriaRoute";
import { materias } from "@/sites/cumple/pages/materias";
import { CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import { registerCodedPageView } from "@/sites/page-views";

const MATERIA_PATHS = [
  "/materias/ley-karin",
  "/materias/seguridad-salud-trabajo",
  "/materias/laboral-rrhh",
  "/materias/proteccion-datos",
  "/materias/inclusion-laboral",
  "/materias/contratistas-terceros",
] as const;

let registered = false;

export function registerProductionPageViews(): void {
  if (registered) return;
  registered = true;
  registerCodedPageView(CUMPLE_TENANT_ID, "/", CumpleHome);
  for (const path of MATERIA_PATHS) {
    const content = materias.find((materia) => materia.path === path);
    if (!content) throw new Error(`materia faltante: ${path}`);
    registerCodedPageView(CUMPLE_TENANT_ID, path, createMateriaView(content));
  }
}
