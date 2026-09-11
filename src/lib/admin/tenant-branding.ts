import {
  PLATFORM_DISPLAY_NAME,
  PLATFORM_SPACE_FALLBACK,
  displayInstitutionName,
  displayInstitutionShortName,
} from "@/core/branding";
import type { AdminTenantBranding } from "@/components/admin/shell-v2/types";
import type { SiteConfig } from "@/types/cms";

/**
 * Branding del Espacio activo para el Shell V2.
 * Producto = Growth OS; nombre del Sitio/Espacio debajo.
 * Sin Site name → "tu Espacio", nunca SEM.
 */
export function buildAdminTenantBranding(config: SiteConfig | null): AdminTenantBranding {
  const institutionName = displayInstitutionName(config?.institution.name);
  const institutionShortName =
    displayInstitutionShortName(config?.institution.shortName, config?.institution.name) ||
    undefined;

  return {
    institutionName: institutionName || PLATFORM_SPACE_FALLBACK,
    institutionShortName,
    logoUrl: config?.branding.logo?.trim() || undefined,
    centerLabel: PLATFORM_DISPLAY_NAME,
  };
}
