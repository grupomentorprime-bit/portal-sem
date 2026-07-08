"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MeUser {
  id: string;
  email: string;
  displayName: string;
  lastLoginAt?: string;
}

interface MeRole {
  id: string;
  name: string;
}

export function ProfileSettingsClient() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [roles, setRoles] = useState<MeRole[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [compatMode, setCompatMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/identity/me");
        const data = await res.json();
        if (cancelled || !data.ok) return;

        setUser(data.user);
        setRoles(data.roles ?? []);
        setAuthenticated(data.authenticated === true);
        setCompatMode(data.compatMode === true);
        setDisplayName(data.user.displayName ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("saving");
    setProfileError("");

    const res = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    const data = await res.json();

    if (!data.ok) {
      setProfileStatus("error");
      setProfileError(data.error ?? "No se pudo guardar el perfil.");
      return;
    }

    setUser((prev) => (prev ? { ...prev, displayName: data.user.displayName } : prev));
    setProfileStatus("saved");
    setTimeout(() => setProfileStatus("idle"), 2000);
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus("saving");
    setPasswordError("");

    const res = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();

    if (!data.ok) {
      setPasswordStatus("error");
      setPasswordError(data.error ?? "No se pudo cambiar la contraseña.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordStatus("saved");
    setTimeout(() => setPasswordStatus("idle"), 2000);
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando perfil…</p>;
  }

  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesión requerida</CardTitle>
          <CardDescription>
            Para ver y editar tu perfil debes iniciar sesión en el CMS.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <Link href="/admin/login" className="text-sm font-medium text-secondary underline">
            Ir a ingresar
          </Link>
          {compatMode ? (
            <p className="mt-3 text-sm text-muted">
              El modo compatibilidad permite usar el admin sin login, pero el perfil personal requiere
              una cuenta activa.
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>Información visible en el panel de administración.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave} className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Nombre para mostrar</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          {roles.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Roles en este tenant</Label>
              <p className="text-sm text-muted">{roles.map((r) => r.name).join(", ")}</p>
            </div>
          ) : null}
          {user?.lastLoginAt ? (
            <p className="text-xs text-muted">
              Último acceso: {new Date(user.lastLoginAt).toLocaleString("es")}
            </p>
          ) : null}
          {profileError ? <p className="text-sm text-[var(--color-danger)]">{profileError}</p> : null}
          <Button type="submit" disabled={profileStatus === "saving"}>
            {profileStatus === "saving"
              ? "Guardando…"
              : profileStatus === "saved"
                ? "Guardado"
                : "Guardar perfil"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso al CMS.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSave} className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Contraseña nueva</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {passwordError ? <p className="text-sm text-[var(--color-danger)]">{passwordError}</p> : null}
          <Button type="submit" disabled={passwordStatus === "saving"}>
            {passwordStatus === "saving"
              ? "Actualizando…"
              : passwordStatus === "saved"
                ? "Contraseña actualizada"
                : "Cambiar contraseña"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
