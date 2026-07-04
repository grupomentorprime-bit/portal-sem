"use client";

import { AdminBreadcrumb } from "@/components/admin/kit/navigation/AdminBreadcrumb";
import { Workspace } from "@/components/admin/kit/layout/Workspace";
import { cn } from "@/lib/utils";

interface AdminLayoutMasterProps {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
}

export function AdminLayoutMaster({ children, sidebarCollapsed }: AdminLayoutMasterProps) {
  return (
    <div
      className={cn(
        "admin-shell-v2-main flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 flex-col",
        sidebarCollapsed
          ? "admin-shell-v2-main--collapsed"
          : "admin-shell-v2-main--expanded"
      )}
    >
      <Workspace>
        <AdminBreadcrumb />
        {children}
      </Workspace>
    </div>
  );
}
