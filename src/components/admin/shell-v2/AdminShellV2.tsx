"use client";

import { Suspense } from "react";
import { AdminLayoutMaster } from "@/components/admin/shell-v2/AdminLayoutMaster";
import { AdminSidebarV2 } from "@/components/admin/shell-v2/AdminSidebarV2";
import { AdminTopBarV2 } from "@/components/admin/shell-v2/AdminTopBarV2";
import type { AdminShellV2Context } from "@/components/admin/shell-v2/types";
import { useSidebarCollapsed } from "@/components/admin/shell-v2/use-sidebar-collapsed";
import "@/components/admin/shell-v2/admin-shell-v2.css";

interface AdminShellV2Props extends AdminShellV2Context {
  children: React.ReactNode;
}

export function AdminShellV2({ children, ...ctx }: AdminShellV2Props) {
  const { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile } =
    useSidebarCollapsed();

  return (
    <div className="admin-shell-v2 min-h-screen bg-background-soft">
      <AdminTopBarV2
        {...ctx}
        collapsed={collapsed}
        onToggleSidebar={toggleCollapsed}
        onOpenMobileNav={toggleMobile}
      />
      <div className="admin-shell-v2-body flex">
        <Suspense
          fallback={
            <aside
              className="admin-shell-v2-sidebar admin-shell-v2-sidebar--expanded hidden lg:flex lg:flex-col"
              aria-hidden
            />
          }
        >
          <AdminSidebarV2
            {...ctx}
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onMobileClose={closeMobile}
          />
        </Suspense>
        <AdminLayoutMaster sidebarCollapsed={collapsed}>{children}</AdminLayoutMaster>
      </div>
    </div>
  );
}
