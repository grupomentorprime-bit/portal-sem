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

/**
 * Shell V2 — layout patrón maestro:
 * sidebar full-height a la izquierda · topbar + main a la derecha.
 */
export function AdminShellV2({ children, ...ctx }: AdminShellV2Props) {
  const { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile } =
    useSidebarCollapsed();

  return (
    <div className="admin-shell-v2 min-h-screen bg-[var(--gray-50)] text-foreground">
      <div className="flex min-h-screen">
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
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBarV2
            {...ctx}
            collapsed={collapsed}
            onToggleSidebar={toggleCollapsed}
            onOpenMobileNav={toggleMobile}
          />
          <AdminLayoutMaster sidebarCollapsed={collapsed}>{children}</AdminLayoutMaster>
        </div>
      </div>
    </div>
  );
}
