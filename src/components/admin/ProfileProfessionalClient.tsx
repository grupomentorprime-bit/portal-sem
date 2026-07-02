"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { LOCALE_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/admin/institutional";
import { formatRelativeTime } from "@/lib/admin/audit-labels";

export function ProfileProfessionalClient() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Santiago");
  const [locale, setLocale] = useState("es-CL");
  const [institutionName, setInstitutionName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [lastLoginAt, setLastLoginAt] = useState<string | undefined>();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/identity/me");
        const data = await res.json();
        if (cancelled || !data.ok) return;
        setAuthenticated(data.authenticated === true);
        setDisplayName(data.user.displayName ?? "");
        setJobTitle(data.user.jobTitle ?? "");
        setEmail(data.user.email ?? "");
        setPhone(data.user.phone ?? "");
        setTimezone(data.user.timezone ?? "America/Santiago");
        setLocale(data.user.locale ?? "es-CL");
        setInstitutionName(data.institutionName ?? "");
        setRoleLabel(data.roleLabel ?? "");
        setLastLoginAt(data.user.lastLoginAt);
        setPermissions(data.permissions ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, jobTitle, phone, timezone, locale }),
    });
    const data = await res.json();
    if (!data.ok) {
      setStatus("error");
      setError(data.error ?? "No se pudo guardar");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  if (loading) return <p className="text-sm text-muted">Cargando perfil…</p>;

  if (!authenticated) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 text-center">
        <p className="text-sm text-muted">Inicia sesión para ver tu ficha profesional.</p>
        <Link href="/admin/login" className="mt-3 inline-block text-sm font-medium text-primary underline">
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-border bg-background p-6 text-center lg:text-left">
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <AdminUserAvatar name={displayName || email} size="lg" />
          <div>
            <h2 className="text-lg font-semibold">{displayName || email}</h2>
            <p className="text-sm text-muted">{roleLabel}</p>
            <p className="text-sm text-muted">{institutionName}</p>
          </div>
          {lastLoginAt ? (
            <p className="text-xs text-muted">Último acceso: {formatRelativeTime(lastLoginAt)}</p>
          ) : null}
        </div>
        <nav className="mt-6 space-y-1 text-sm">
          <SideLink href="/admin/settings/profile" active>
            Perfil
          </SideLink>
          <SideLink href="/admin/settings/security">Seguridad</SideLink>
          <SideLink href="/admin/settings/activity">Actividad</SideLink>
        </nav>
      </aside>

      <div className="space-y-6">
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="font-semibold">Información profesional</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="displayName">Nombre completo</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Cargo</Label>
              <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ej. Administrador Institucional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" value={email} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 …" />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Zona horaria"
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={TIMEZONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Idioma"
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                options={LOCALE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado" : "Guardar cambios"}
          </Button>
        </form>

        <section className="rounded-xl border border-border bg-background p-6">
          <h3 className="font-semibold">Permisos asignados</h3>
          <p className="mt-1 text-sm text-muted">Capacidades activas según tu rol institucional.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {permissions.slice(0, 12).map((perm) => (
              <li key={perm} className="rounded-full bg-background-muted px-3 py-1 text-xs text-muted">
                {humanizePermission(perm)}
              </li>
            ))}
            {permissions.length > 12 ? (
              <li className="text-xs text-muted">+{permissions.length - 12} más</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">
          <p className="font-medium text-foreground">Próximamente en Seguridad</p>
          <p className="mt-1">Verificación en dos pasos, sesiones abiertas y dispositivos conectados.</p>
          <Link href="/admin/settings/security" className="mt-3 inline-block text-primary underline">
            Ir a Seguridad
          </Link>
        </section>
      </div>
    </div>
  );
}

function SideLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={active ? "block font-medium text-primary" : "block text-muted hover:text-foreground"}
    >
      {children}
    </Link>
  );
}

function humanizePermission(perm: string): string {
  const map: Record<string, string> = {
    "cms.pages.update": "Editar páginas",
    "cms.pages.publish": "Publicar páginas",
    "cms.media.upload": "Subir medios",
    "settings.team": "Administrar usuarios",
    "news.publish": "Publicar noticias",
    "programs.manage": "Gestionar programas",
  };
  return map[perm] ?? perm.replace(/\./g, " · ");
}
