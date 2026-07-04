import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";
import type { AdminTenantBranding } from "@/components/admin/shell-v2/types";

/** Contexto de shell compartido por componentes de navegación AEK. */
export interface AdminShellContext {
  user: AdminUserSummary | null;
  compatMode: boolean;
  permissions: string[];
  roleCodes: string[];
  branding: AdminTenantBranding;
  /** Badges opcionales por id o href de ítem de navegación. */
  navBadges?: Record<string, number>;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  columnId: string;
  direction: SortDirection;
}
