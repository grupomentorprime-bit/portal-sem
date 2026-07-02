"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Dropdown } from "@/components/ui";

export interface AdminUserSummary {
  displayName: string;
  email: string;
}

interface AdminUserMenuProps {
  user: AdminUserSummary | null;
  compatMode: boolean;
}

export function AdminUserMenu({ user, compatMode }: AdminUserMenuProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/identity/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        {compatMode ? (
          <span className="hidden text-xs text-muted sm:inline">Sin sesión</span>
        ) : null}
        <Link href="/admin/login" className="text-sm font-medium text-secondary underline">
          Ingresar
        </Link>
      </div>
    );
  }

  const label = user.displayName || user.email;

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-background-muted">
          <Avatar name={label} size="sm" />
          <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
            {label}
          </span>
        </span>
      }
      items={[
        {
          label: "Mi perfil",
          onClick: () => router.push("/admin/settings/profile"),
        },
        {
          label: "Equipo y roles",
          onClick: () => router.push("/admin/settings/team"),
        },
        {
          label: "Salir",
          onClick: handleLogout,
        },
      ]}
    />
  );
}
