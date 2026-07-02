"use client";

import { usePathname } from "next/navigation";
import { AdminInstitutionalHeader } from "@/components/admin/AdminInstitutionalHeader";
import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";

interface AdminShellProps {
  children: React.ReactNode;
  user: AdminUserSummary | null;
  compatMode: boolean;
  permissions: string[];
}

export function AdminShell({ children, user, compatMode, permissions }: AdminShellProps) {
  const pathname = usePathname();
  const hideChrome = pathname === "/admin/login";

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background-soft">
      <AdminInstitutionalHeader
        user={user}
        compatMode={compatMode}
        permissions={permissions}
      />
      {children}
    </div>
  );
}
