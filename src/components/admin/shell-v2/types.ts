import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";

/** Branding del Espacio activo para Shell V2.
 * `centerLabel` = producto (Growth OS); institution* / logo = contexto Espacio.
 */
export interface AdminTenantBranding {
  institutionName: string;
  institutionShortName?: string;
  logoUrl?: string;
  /** Producto estable — Growth OS */
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
