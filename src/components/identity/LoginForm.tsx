"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import Link from "next/link";

const OAUTH_ERRORS: Record<string, string> = {
  keycloak: "No se pudo completar el inicio de sesión.",
  oauth_state: "La sesión de autenticación expiró. Intenta de nuevo.",
  email: "No se pudo validar el correo de tu cuenta institucional.",
  no_access: "Tu cuenta no tiene acceso al CMS. Solicita una invitación al administrador.",
  tenant: "El tenant institucional no está configurado.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [institutionalOnly, setInstitutionalOnly] = useState(true);

  useEffect(() => {
    if (oauthError && OAUTH_ERRORS[oauthError]) {
      setError(OAUTH_ERRORS[oauthError]);
    }
  }, [oauthError]);

  useEffect(() => {
    fetch("/api/identity/auth/providers")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) return;
        setInstitutionalOnly(data.providers?.institutionalOnly === true);
        setAuthReady(data.providers?.institutional === true);
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/identity/auth/keycloak/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push(nextPath.startsWith("/") ? nextPath : "/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          {institutionalOnly
            ? "El servicio de autenticación no está disponible. Contacta al administrador del sistema."
            : "Cargando opciones de acceso…"}
        </p>
        <p className="text-center text-xs text-muted">
          <Link href="/" className="underline">
            Volver al portal
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo institucional</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition hover:text-foreground"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Ingresando…" : "Ingresar"}
      </Button>

      <p className="text-center text-xs text-muted">
        <Link href="/" className="underline">
          Volver al portal
        </Link>
      </p>
    </form>
  );
}
