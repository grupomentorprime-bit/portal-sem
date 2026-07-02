"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";

export interface AdminUserSummary {
  displayName: string;
  email: string;
  roleLabel?: string;
  institutionName?: string;
}

interface AdminUserMenuPanelProps {
  user: AdminUserSummary | null;
  compatMode: boolean;
}

export function AdminUserMenuPanel({ user, compatMode }: AdminUserMenuPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/identity/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (!user) {
    return (
      <Link href="/admin/login" className="text-sm font-medium text-primary hover:underline">
        Ingresar
      </Link>
    );
  }

  const label = user.displayName || user.email;
  const subtitle = user.roleLabel ?? "Colaborador";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 transition hover:bg-background-muted"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <AdminUserAvatar name={label} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-medium text-foreground">
            {label}
          </span>
          <span className="block max-w-[9rem] truncate text-xs text-muted">{subtitle}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-lg)]"
        >
          <div className="border-b border-border bg-background-muted/40 px-4 py-3">
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>

          <MenuSection>
            <MenuItem onClick={() => router.push("/admin/settings/profile")}>Mi perfil</MenuItem>
            <MenuItem onClick={() => router.push("/admin/settings/activity")}>Mi actividad</MenuItem>
            <MenuItem onClick={() => router.push("/admin/settings/notifications")}>
              Notificaciones
            </MenuItem>
            <MenuItem onClick={() => router.push("/admin/settings/profile")}>
              Configuración personal
            </MenuItem>
          </MenuSection>

          <MenuSection>
            <MenuItem onClick={() => router.push("/admin/settings/users")}>
              Administrar usuarios
            </MenuItem>
            <MenuItem onClick={() => router.push("/admin/settings/help")}>Centro de ayuda</MenuItem>
          </MenuSection>

          {compatMode ? (
            <p className="border-t border-border px-4 py-2 text-xs text-[var(--color-warning)]">
              El acceso sin sesión está activo en este entorno.
            </p>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full border-t border-border px-4 py-3 text-left text-sm text-[var(--color-danger)] hover:bg-background-muted"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuSection({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border py-1">{children}</div>;
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onClick();
      }}
      className="flex w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-background-muted"
    >
      {children}
    </button>
  );
}
