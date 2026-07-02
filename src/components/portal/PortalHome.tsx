import { PortalRenderer } from "@/components/portal/PortalRenderer";
import { loadHomePage } from "@/core/portal";
import { ensureHomeInstitutionalContent } from "@/lib/portal/ensure-home-content";
import { enrichPortalContextForHome } from "@/lib/portal/institutional-demo";
import type { PortalContext } from "@/lib/portal/site";

interface PortalHomeProps {
  ctx: PortalContext;
}

/** Contenedor de la Home — delega 100% al Portal Engine */
export async function PortalHome({ ctx }: PortalHomeProps) {
  await ensureHomeInstitutionalContent(ctx.tenant);
  const page = await loadHomePage(ctx.tenant);
  const homeCtx = enrichPortalContextForHome(ctx, page.slug);
  return <PortalRenderer page={page} ctx={homeCtx} />;
}
