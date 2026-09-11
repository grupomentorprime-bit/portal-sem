import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { getSiteConfig } from "@/lib/cms/config";
import { getActiveMenuById } from "@/lib/cms/menus";
import { resolveBrandingAssets } from "@/core/branding";
import { NAV_MENU_IDS, resolveNavigation } from "@/core/navigation";
import type { ResolvedNavigation } from "@/core/navigation";
import type { ResolvedBrandingAssets } from "@/core/branding";
import type { PortalStatus, SiteConfig } from "@/types/cms";
import { SEM_SITE_ID } from "@/core/tenant/constants";
import { resolveRequestHost } from "@/core/tenant/hosts";
import {
  isHostResolutionPortalActive,
  resolvePublicTenantByHost,
  type HostResolution,
  type HostResolutionSuccess,
} from "@/core/tenant/resolve";

export interface TenantContext {
  config: SiteConfig;
  tenantId: string;
  /** Site del portal resuelto (ADR-008 D2/D4). */
  siteId: string;
  status: PortalStatus;
  branding: ResolvedBrandingAssets;
  navigation: ResolvedNavigation;
  /** Cómo se obtuvo el contexto (útil para auditoría / tests). */
  resolutionSource: "host" | "legacy-singleton";
}

async function buildTenantContext(
  config: SiteConfig,
  siteId: string,
  resolutionSource: TenantContext["resolutionSource"]
): Promise<TenantContext> {
  const tenantId = config.institution.tenant;

  const [headerMenu, footerMenu, mobileMenu, legalMenu, quickLinksMenu] =
    await Promise.all([
      getActiveMenuById(NAV_MENU_IDS.header, tenantId),
      getActiveMenuById(NAV_MENU_IDS.footer, tenantId),
      getActiveMenuById(NAV_MENU_IDS.mobile, tenantId),
      getActiveMenuById(NAV_MENU_IDS.legal, tenantId),
      getActiveMenuById(NAV_MENU_IDS.quickLinks, tenantId),
    ]);

  return {
    config,
    tenantId,
    siteId,
    status: config.institution.status,
    branding: await resolveBrandingAssets({ config }),
    navigation: resolveNavigation(
      {
        header: headerMenu?.items,
        footer: footerMenu?.items,
        mobile: mobileMenu?.items,
        legal: legalMenu?.items,
        quickLinks: quickLinksMenu?.items,
      },
      config.features
    ),
    resolutionSource,
  };
}

function contextFromHostResolution(
  resolution: HostResolutionSuccess
): Promise<TenantContext> {
  return buildTenantContext(resolution.config, resolution.siteId, "host");
}

/**
 * TEMP (SAAS-002): fuera de request (scripts) o sin Host usable →
 * singleton cms_config. Nunca se usa para tapar un host desconocido.
 */
async function getLegacySingletonTenantContext(): Promise<TenantContext | null> {
  const config = await getSiteConfig();
  if (!config?.institution.tenant) return null;
  const tenantId = config.institution.tenant.trim();
  const siteId = tenantId === "seminario-ipn" ? SEM_SITE_ID : tenantId;
  return buildTenantContext(config, siteId, "legacy-singleton");
}

async function readRequestHost(): Promise<string | null> {
  try {
    const headerList = await headers();
    return resolveRequestHost(headerList);
  } catch {
    return null;
  }
}

/**
 * TenantContext público: Host → Domain → Site → Tenant → site_config.
 * Host desconocido → null (sin fallback a otro tenant).
 * Tenant/site inactivo → contexto de ESE espacio (para página de estado), no de otro.
 */
async function loadTenantContext(): Promise<TenantContext | null> {
  const host = await readRequestHost();

  if (host) {
    const resolution = await resolvePublicTenantByHost(host);
    if (!resolution.ok) {
      return null;
    }
    return contextFromHostResolution(resolution);
  }

  // Sin host de request: compat scripts / fuera de HTTP.
  return getLegacySingletonTenantContext();
}

export const getTenantContext = cache(loadTenantContext);

export async function getActiveTenantContext(): Promise<TenantContext | null> {
  const host = await readRequestHost();
  if (host) {
    const resolution = await resolvePublicTenantByHost(host);
    if (!resolution.ok || !isHostResolutionPortalActive(resolution)) {
      return null;
    }
    return contextFromHostResolution(resolution);
  }

  const ctx = await getTenantContext();
  if (!ctx || ctx.status !== "active") return null;
  return ctx;
}

/**
 * TenantId efectivo del request (host) o, sin host, singleton legado.
 * No lee ?tenant= ni headers de spoof.
 */
export async function resolveActiveTenantIdFromRequest(): Promise<string | null> {
  const host = await readRequestHost();
  if (host) {
    const resolution = await resolvePublicTenantByHost(host);
    if (!resolution.ok) return null;
    return resolution.tenantId;
  }

  const legacy = await getLegacySingletonTenantContext();
  return legacy?.tenantId ?? null;
}

/** Expone la resolución cruda por host (tests / diagnostics). */
export async function resolveTenantForRequestHost(
  rawHost?: string | null
): Promise<HostResolution> {
  const host =
    rawHost === undefined ? await readRequestHost() : rawHost;
  return resolvePublicTenantByHost(host);
}
