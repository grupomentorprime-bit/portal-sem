import { resolvePageTitle } from "@/core/seo";
import type { PortalContext } from "@/lib/portal/site";

export function portalPageTitle(pageName: string, ctx: PortalContext): string {
  return resolvePageTitle(pageName, ctx.config);
}

export function portalPageDescription(ctx: PortalContext): string {
  return ctx.config.seo.description;
}
