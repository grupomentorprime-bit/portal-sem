"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Clock3 } from "lucide-react";
import { isNavActive } from "@/lib/admin/institutional";
import { filterAdminNav } from "@/lib/admin/nav-access";
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
import { AdminNavDrawer } from "@/components/admin/AdminNavDrawer";
import { AdminStatusBadges } from "@/components/admin/AdminStatusBadges";
import {
  AdminUserMenuPanel,
  type AdminUserSummary,
} from "@/components/admin/AdminUserMenuPanel";
import { cn } from "@/lib/utils";

interface AdminInstitutionalHeaderProps {
  user: AdminUserSummary | null;
  compatMode: boolean;
  permissions: string[];
}

export function AdminInstitutionalHeader({
  user,
  compatMode,
  permissions,
}: AdminInstitutionalHeaderProps) {
  const pathname = usePathname();
  const navItems = filterAdminNav(permissions, compatMode);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* Barra superior: marca + utilidades */}
      <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-2 sm:px-6">
        <AdminNavDrawer compatMode={compatMode} permissions={permissions} />

        <Link
          href="/admin"
          className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
        >
          Centro SEM
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <AdminStatusBadges compatMode={compatMode} />

          <div className="hidden items-center sm:flex">
            <Link
              href="/admin/settings/notifications"
              className="rounded-lg p-2 text-muted transition hover:bg-background-muted hover:text-foreground"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <Link
              href="/admin/settings/activity"
              className="rounded-lg p-2 text-muted transition hover:bg-background-muted hover:text-foreground"
              aria-label="Actividad"
            >
              <Clock3 className="h-4 w-4" />
            </Link>
          </div>

          <AdminGlobalSearch />
          <AdminUserMenuPanel user={user} compatMode={compatMode} />
        </div>
      </div>

      {/* Navegación principal — fila completa, sin scroll */}
      <div className="hidden border-t border-border/50 lg:block">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6">
          <nav
            className="-mb-px flex flex-wrap items-center gap-x-0.5"
            aria-label="Administración institucional"
          >
            {navItems.map((item) => {
              const active = isNavActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
