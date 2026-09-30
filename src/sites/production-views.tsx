import { CumpleHome } from "@/components/sites/cumple/CumpleHome";
import { CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import { registerCodedPageView } from "@/sites/page-views";

let registered = false;

export function registerProductionPageViews(): void {
  if (registered) return;
  registered = true;
  registerCodedPageView(CUMPLE_TENANT_ID, "/", CumpleHome);
}
