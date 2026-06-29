import { PortalRenderer } from "@/components/portal/PortalRenderer";
import { loadHomePage } from "@/core/portal";
import type { PortalContext } from "@/lib/portal/site";

interface PortalHomeProps {
  ctx: PortalContext;
}

/** Contenedor de la Home — delega 100% al Portal Engine */
export async function PortalHome({ ctx }: PortalHomeProps) {
  const page = await loadHomePage(ctx.tenant);
  return <PortalRenderer page={page} ctx={ctx} />;
}
