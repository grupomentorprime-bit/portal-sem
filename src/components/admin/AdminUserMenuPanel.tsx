"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
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
    setOpen(false);
    await fetch("/api/identity/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
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
  const institution = user.institutionName;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition",
          open
            ? "border-primary/25 bg-primary/5 shadow-sm"
            : "border-border bg-background hover:bg-background-muted"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <AdminUserAvatar name={label} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="block max-w-[9rem] truncate text-xs text-muted">{subtitle}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-lg)]"
        >
          <div className="flex items-center gap-3 border-b border-border bg-background-muted/30 px-4 py-3.5">
            <AdminUserAvatar name={label} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{label}</p>
              <p className="truncate text-sm text-muted">{subtitle}</p>
              {institution ? (
                <p className="truncate text-[11px] text-muted">{institution}</p>
              ) : null}
            </div>
          </div>

          <MenuSection label="Mi cuenta">
            <MenuItem icon={UserRound} onClick={() => navigate("/admin/settings/profile")}>
              Mi perfil
            </MenuItem>
            <MenuItem icon={Activity} onClick={() => navigate("/admin/settings/activity")}>
              Mi actividad
            </MenuItem>
            <MenuItem icon={Bell} onClick={() => navigate("/admin/settings/notifications")}>
              Notificaciones
            </MenuItem>
            <MenuItem icon={Settings2} onClick={() => navigate("/admin/settings/profile")}>
              Preferencias
            </MenuItem>
          </MenuSection>

          <MenuSection label="Administración">
            <MenuItem icon={Users} onClick={() => navigate("/admin/settings/users")}>
              Administrar usuarios
            </MenuItem>
            <MenuItem icon={HelpCircle} onClick={() => navigate("/admin/settings/help")}>
              Centro de ayuda
            </MenuItem>
          </MenuSection>

          {compatMode ? (
            <p className="border-t border-border px-4 py-2 text-xs text-[var(--color-warning)]">
              El acceso sin sesión está activo en este entorno.
            </p>
          ) : null}

          <div className="border-t border-border p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-danger)] transition hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-2 py-2">
      <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  children,
  onClick,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-background-muted"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      <span>{children}</span>
    </button>
  );
}
