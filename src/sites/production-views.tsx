import { CumpleHome } from "@/components/sites/cumple/CumpleHome";
import {
  ComoFuncionaView,
  ContactoView,
  EvaluarView,
  FaqView,
  NosotrosView,
} from "@/components/sites/cumple/pages/SupportRoutes";
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
  registerCodedPageView(CUMPLE_TENANT_ID, "/como-funciona", ComoFuncionaView);
  registerCodedPageView(CUMPLE_TENANT_ID, "/preguntas-frecuentes", FaqView);
  registerCodedPageView(CUMPLE_TENANT_ID, "/evaluar", EvaluarView);
  registerCodedPageView(CUMPLE_TENANT_ID, "/nosotros", NosotrosView);
  registerCodedPageView(CUMPLE_TENANT_ID, "/contacto", ContactoView);
}
