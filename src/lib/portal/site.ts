import {
  getActiveTenantContext,
  getTenantContext,
  type TenantContext,
} from "@/core/tenant";
import type { ResolvedNavigation, NavLink } from "@/core/navigation";
import type { ResolvedBrandingAssets } from "@/core/branding";
import type { SiteConfig } from "@/types/cms";

export interface PortalLogos {
  primary: string;
  secondary?: string;
  hero: string;
  hasPrimary: boolean;
  hasSecondary: boolean;
  hasHero: boolean;
}

export interface PortalContext {
  config: SiteConfig;
  tenant: string;
  navLinks: NavLink[];
  navigation: ResolvedNavigation;
  branding: ResolvedBrandingAssets;
  logos: PortalLogos;
}

function mapTenantContext(ctx: TenantContext): PortalContext {
  return {
    config: ctx.config,
    tenant: ctx.tenantId,
    navLinks: ctx.navigation.header,
    navigation: ctx.navigation,
    branding: ctx.branding,
    logos: {
      primary: ctx.branding.logo,
      secondary: ctx.branding.secondaryLogo,
      hero: ctx.branding.hero,
      hasPrimary: Boolean(ctx.config.branding.logoMediaId?.trim() || ctx.config.branding.logo?.trim()),
      hasSecondary: Boolean(
        ctx.config.branding.secondaryLogoMediaId?.trim() || ctx.config.branding.secondaryLogo?.trim()
      ),
      hasHero: Boolean(ctx.config.branding.heroMediaId?.trim() || ctx.config.branding.heroImage?.trim()),
    },
  };
}

export async function getPortalContext(): Promise<PortalContext | null> {
  const ctx = await getTenantContext();
  return ctx ? mapTenantContext(ctx) : null;
}

export async function getActivePortal(): Promise<PortalContext | null> {
  const ctx = await getActiveTenantContext();
  return ctx ? mapTenantContext(ctx) : null;
}

export async function requireActivePortal(): Promise<PortalContext> {
  const ctx = await getActivePortal();
  if (!ctx) throw new Error("PORTAL_INACTIVE");
  return ctx;
}
