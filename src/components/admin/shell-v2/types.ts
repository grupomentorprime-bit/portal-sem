import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";

/** Branding del tenant activo — sin referencias fijas a institución. */
export interface AdminTenantBranding {
  institutionName: string;
  institutionShortName?: string;
  logoUrl?: string;
  /** Etiqueta del centro admin, p. ej. «Centro [shortName]» */
  centerLabel: string;
}

export interface AdminShellV2Context {
  user: AdminUserSummary | null;
  compatMode: boolean;
  permissions: string[];
  roleCodes: string[];
  branding: AdminTenantBranding;
  navBadges?: Record<string, number>;
}

export interface ModuleHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export interface RightPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}
