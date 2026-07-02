"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import Link from "next/link";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  displayName: string;
  existingUser: boolean;
}

export function AcceptInviteForm({
  token,
  email,
  displayName,
  existingUser,
}: AcceptInviteFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!existingUser) {
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/identity/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "No se pudo completar la invitación.");
        return;
      }

      if (data.redirectLogin) {
        router.push(`/admin/login?email=${encodeURIComponent(email)}`);
        router.refresh();
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Correo</Label>
        <Input id="invite-email" type="email" value={email} readOnly disabled />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-name">Nombre completo</Label>
        <Input id="invite-name" value={displayName} readOnly disabled />
      </div>

      {existingUser ? (
        <p className="rounded-xl bg-background-muted/50 p-4 text-sm text-muted">
          Ya tienes una cuenta con este correo. Al aceptar se agregará tu acceso al CMS institucional.
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="invite-password">Nueva contraseña</Label>
            <Input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-confirm">Confirmar contraseña</Label>
            <Input
              id="invite-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
        </>
      )}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? "Procesando…"
          : existingUser
            ? "Aceptar invitación"
            : "Crear contraseña y acceder"}
      </Button>

      <p className="text-center text-xs text-muted">
        <Link href="/admin/login" className="underline">
          Ir al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
