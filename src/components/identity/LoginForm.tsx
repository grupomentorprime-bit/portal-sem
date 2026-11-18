"use client";

import Link from "next/link";
import { useState } from "react";
import { useThresholdOnAuthenticated } from "@/components/identity/ThresholdLogin";
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
  const [showAccessHelp, setShowAccessHelp] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);
  const onAuthenticated = useThresholdOnAuthenticated();

  if (!authReady) {
    return (
      <div className="space-y-4 text-center">
        <p className="login-unavailable">
          El servicio de autenticación no está disponible. Contacta al administrador del Espacio.
        </p>
        <div className="login-actions">
          <Link href="/" className="login-back">
            Volver
          </Link>
        </div>
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
        thresholdLine?: string;
        thresholdArrival?: boolean;
      };
      if (!data.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      const destination =
        data.redirectTo && data.redirectTo.startsWith("/") && !data.redirectTo.startsWith("//")
          ? data.redirectTo
          : "/admin";
      if (onAuthenticated) {
        await onAuthenticated({
          redirectTo: destination,
          thresholdLine: data.thresholdLine,
          thresholdArrival: data.thresholdArrival,
        });
        return;
      }
      window.location.assign(destination);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function onRequestAccessLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoverError("");
    setRecoverMessage("");
    setRecoverLoading(true);
    try {
      const res = await fetch("/api/identity/access/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoverEmail.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setRecoverError(data.error ?? "No se pudo enviar el enlace.");
        return;
      }
      setRecoverMessage(
        data.message ??
          "Si el correo está registrado, enviamos un enlace para crear o renovar tu clave."
      );
    } catch {
      setRecoverError("No se pudo conectar con el servidor.");
    } finally {
      setRecoverLoading(false);
    }
  }

  function openAccessHelp() {
    setShowAccessHelp((open) => {
      const nextOpen = !open;
      if (nextOpen && !recoverEmail.trim() && username.includes("@")) {
        setRecoverEmail(username.trim());
      }
      return nextOpen;
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <p className="login-error">{error}</p> : null}

        <Input
          label="Nombre de usuario"
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

        <div className="login-actions">
          <Button type="submit" loading={loading} disabled={loading} className="login-submit">
            Iniciar sesión
          </Button>
          <Link href="/" className="login-back">
            Volver
          </Link>
        </div>
      </form>

      <div className="space-y-2 pt-2">
        <button type="button" className="login-back" onClick={openAccessHelp}>
          ¿No tienes o perdiste tu clave?
        </button>
        {showAccessHelp ? (
          <form onSubmit={onRequestAccessLink} className="space-y-3">
            <Input
              label="Correo"
              name="recover-email"
              type="email"
              autoComplete="email"
              value={recoverEmail}
              onChange={(event) => setRecoverEmail(event.target.value)}
              required
            />
            <Button type="submit" loading={recoverLoading} disabled={recoverLoading}>
              Enviar enlace
            </Button>
            {recoverMessage ? <p className="login-unavailable">{recoverMessage}</p> : null}
            {recoverError ? <p className="login-error">{recoverError}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
