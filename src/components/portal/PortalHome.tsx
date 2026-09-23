import { SemInstitutionalHome } from "@/components/portal/home/institutional/SemInstitutionalHome";
import { PortalRenderer } from "@/components/portal/PortalRenderer";
import { isSemTenant } from "@/core/tenant/is-sem";
import { loadHomePage } from "@/core/portal";
import { enrichPortalContextForHome } from "@/lib/portal/institutional-demo";
import type { PortalContext } from "@/lib/portal/site";

interface PortalHomeProps {
  ctx: PortalContext;
}

/** Home pública. En SEM, la composición institucional. En otros Espacios, el Portal Engine. */
export async function PortalHome({ ctx }: PortalHomeProps) {
  if (isSemTenant(ctx.tenant)) {
    return <SemInstitutionalHome />;
  }

  const page = await loadHomePage(ctx.tenant);
  const homeCtx = enrichPortalContextForHome(ctx, page.slug);
  return <PortalRenderer page={page} ctx={homeCtx} />;
}
