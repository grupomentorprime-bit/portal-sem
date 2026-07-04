"use client";

import { usePathname } from "next/navigation";
import { AdminChromeProvider } from "@/components/admin/AdminChromeContext";
import { AdminInstitutionalHeader } from "@/components/admin/AdminInstitutionalHeader";
import { ToastProvider } from "@/components/admin/kit/states/Toast";
import { AdminShellV2 } from "@/components/admin/shell-v2/AdminShellV2";
import type { AdminTenantBranding } from "@/components/admin/shell-v2/types";
import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";

interface AdminShellProps {
  children: React.ReactNode;
  user: AdminUserSummary | null;
  compatMode: boolean;
  permissions: string[];
  roleCodes?: string[];
  shellV2?: boolean;
  branding?: AdminTenantBranding;
  navBadges?: Record<string, number>;
}

export function AdminShell({
  children,
  user,
  compatMode,
  permissions,
  roleCodes = [],
  shellV2 = false,
  branding,
  navBadges,
}: AdminShellProps) {
  const pathname = usePathname();
  const hideChrome = pathname === "/admin/login";

  if (hideChrome) {
    return <>{children}</>;
  }

  const shell = shellV2 && branding ? (
    <AdminChromeProvider shellV2>
      <AdminShellV2
        user={user}
        compatMode={compatMode}
        permissions={permissions}
        roleCodes={roleCodes}
        branding={branding}
        navBadges={navBadges}
      >
        {children}
      </AdminShellV2>
    </AdminChromeProvider>
  ) : (
    <AdminChromeProvider shellV2={false}>
      <div className="min-h-screen bg-background-soft">
        <AdminInstitutionalHeader
          user={user}
          compatMode={compatMode}
          permissions={permissions}
          roleCodes={roleCodes}
        />
        {children}
      </div>
    </AdminChromeProvider>
  );

  return <ToastProvider>{shell}</ToastProvider>;
}
