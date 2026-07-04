"use client";

import { AdminShell } from "@/components/identity/AdminShell";
import type { AdminTenantBranding } from "@/components/admin/shell-v2/types";
import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";
import type { ReactNode } from "react";

interface DashboardVisualPreviewShellProps {
  shellV2: boolean;
  branding: AdminTenantBranding;
  user: AdminUserSummary;
  permissions: string[];
  children: ReactNode;
}

export function DashboardVisualPreviewShell({
  shellV2,
  branding,
  user,
  permissions,
  children,
}: DashboardVisualPreviewShellProps) {
  return (
    <AdminShell
      user={user}
      compatMode={false}
      permissions={permissions}
      roleCodes={["super_admin"]}
      shellV2={shellV2}
      branding={branding}
    >
      <div className={shellV2 ? undefined : "mx-auto max-w-6xl px-4 py-6 sm:px-6"}>
        {children}
      </div>
    </AdminShell>
  );
}
