"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import Link from "next/link";

export function SecuritySettingsClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [institutionalAuth, setInstitutionalAuth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/identity/me")
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated === true);
        setInstitutionalAuth(data.authMethod === "institutional");
      });
  }, []);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!data.ok) {
      setStatus("error");
      setError(data.error ?? "No se pudo actualizar");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  if (!authenticated) {
    return (
      <p className="text-sm text-muted">
        <Link href="/admin/login" className="underline">
          Inicia sesión
        </Link>{" "}
        para administrar tu seguridad.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {institutionalAuth ? (
        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="font-semibold">Autenticación institucional</h2>
          <p className="mt-2 text-sm text-muted">
            Tu contraseña y factores de autenticación se administran en el portal institucional de
            identidad, no en el CMS.
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="font-semibold">Contraseña</h2>
          <form onSubmit={handlePassword} className="mt-4 grid max-w-md gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                minLength={8}
                required
              />
            </div>
            {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
            <Button type="submit" disabled={status === "saving"}>
              {status === "saving" ? "Actualizando…" : status === "saved" ? "Actualizada" : "Cambiar contraseña"}
            </Button>
          </form>
        </section>
      )}

      {[
        { title: "Verificación en dos pasos", desc: "Protección adicional al iniciar sesión." },
        { title: "Sesiones abiertas", desc: "Revisa dónde has iniciado sesión." },
        { title: "Dispositivos", desc: "Equipos autorizados para tu cuenta." },
        { title: "Historial de acceso", desc: "Registro de inicios de sesión." },
      ].map((item) => (
        <section key={item.title} className="rounded-xl border border-dashed border-border p-6">
          <h2 className="font-semibold">{item.title}</h2>
          <p className="mt-1 text-sm text-muted">{item.desc}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">Próximamente</p>
        </section>
      ))}

      <section className="rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] p-6">
        <h2 className="font-semibold text-[var(--color-danger)]">Cerrar todas las sesiones</h2>
        <p className="mt-1 text-sm text-muted">
          Finaliza tu sesión actual en todos los dispositivos. Disponible en la siguiente fase.
        </p>
      </section>
    </div>
  );
}
