import { AdlContact, AdlHome } from "@/components/sites/adl/AdlPages";
import { CumpleHome } from "@/components/sites/cumple/CumpleHome";
import {
  ComoFuncionaView,
  ContactoView,
  EvaluarView,
  FaqView,
  NosotrosView,
} from "@/components/sites/cumple/pages/SupportRoutes";
import { createMateriaView } from "@/components/sites/cumple/pages/MateriaRoute";
import { FormacionContact, FormacionHome } from "@/components/sites/formacion/FormacionPages";
import { materias } from "@/sites/cumple/pages/materias";
import { ADL_TENANT_ID } from "@/sites/adl/site";
import { CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import { FORMACION_TENANT_ID } from "@/sites/formacion/site";
import { registerCodedPageView } from "@/sites/page-views";

let registered = false;

export function registerProductionPageViews(): void {
  if (registered) return;
  registered = true;
  registerCodedPageView(FORMACION_TENANT_ID, "/", FormacionHome);
  registerCodedPageView(FORMACION_TENANT_ID, "/contacto", FormacionContact);
  registerCodedPageView(ADL_TENANT_ID, "/", AdlHome);
  registerCodedPageView(ADL_TENANT_ID, "/contacto", AdlContact);
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
