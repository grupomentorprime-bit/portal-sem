import type { AdminTenantBranding } from "@/components/admin/shell-v2/types";
import type { SiteConfig } from "@/types/cms";

/** Branding del tenant activo para el Shell V2 — sin referencias a institución fija. */
export function buildAdminTenantBranding(config: SiteConfig | null): AdminTenantBranding {
  const institutionName = config?.institution.name?.trim() || "Institución";
  const institutionShortName = config?.institution.shortName?.trim() || undefined;
  const centerLabel = institutionShortName
    ? `Centro ${institutionShortName}`
    : `Centro ${institutionName}`;

  return {
    institutionName,
    institutionShortName,
    logoUrl: config?.branding.logo?.trim() || undefined,
    centerLabel,
  };
}
