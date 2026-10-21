"use client";

import { Suspense } from "react";
import { AdminBreadcrumb } from "@/components/admin/kit/navigation/AdminBreadcrumb";
import { AdminModuleSubnav } from "@/components/admin/kit/navigation/AdminModuleSubnav";
import { Workspace } from "@/components/admin/kit/layout/Workspace";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { cn } from "@/lib/utils";

interface AdminLayoutMasterProps {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  shell: Pick<
    AdminShellContext,
    "permissions" | "compatMode" | "roleCodes" | "navBadges"
  >;
}

export function AdminLayoutMaster({
  children,
  sidebarCollapsed,
  shell,
}: AdminLayoutMasterProps) {
  return (
    <div
      className={cn(
        "admin-shell-v2-main flex min-h-0 min-w-0 flex-1 flex-col",
        sidebarCollapsed
          ? "admin-shell-v2-main--collapsed"
          : "admin-shell-v2-main--expanded"
      )}
    >
      <Workspace>
        <AdminBreadcrumb />
        <Suspense fallback={null}>
          <AdminModuleSubnav
            permissions={shell.permissions}
            compatMode={shell.compatMode}
            roleCodes={shell.roleCodes}
            navBadges={shell.navBadges}
          />
        </Suspense>
        {children}
      </Workspace>
    </div>
  );
}
