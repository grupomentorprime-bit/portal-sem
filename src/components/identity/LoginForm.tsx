"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

/**
 * Login embebido: usuario y contraseña se validan en el servidor.
 * El navegador no sale a la pantalla de Keycloak.
 */
export function LoginForm({
  next,
  errorMessage,
  authReady,
}: {
  next?: string | null;
  errorMessage?: string | null;
  authReady: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorMessage ?? "");
  const [loading, setLoading] = useState(false);

  if (!authReady) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          El servicio de autenticación no está disponible. Contacta al administrador del Espacio.
        </p>
        <p className="text-center text-xs text-muted">
          <Link
            href="/"
            className="font-medium text-[var(--growth-os-primary)] underline-offset-2 hover:underline"
          >
            Volver a Growth OS
          </Link>
        </p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/identity/auth/keycloak/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: username.trim(),
          password,
          next: next || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const destination =
        data.redirectTo && data.redirectTo.startsWith("/") && !data.redirectTo.startsWith("//")
          ? data.redirectTo
          : "/admin";
      window.location.assign(destination);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <Input
        label="Usuario"
        name="username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Ingresando…" : "Ingresar"}
      </Button>

      <p className="pt-1 text-center text-xs text-muted">
        <Link
          href="/"
          className="font-medium text-[var(--growth-os-primary)] underline-offset-2 hover:underline"
        >
          Volver a Growth OS
        </Link>
      </p>
    </form>
  );
}
