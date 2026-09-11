"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { SPACE_ACCESS_REQUIRED_MESSAGE } from "@/lib/platform/enter-space-messages";
import { cn } from "@/lib/utils";

export function PlatformEnterSpacePanel({
  tenantId,
  spaceName,
  hasAccess: initialHasAccess,
  compact = false,
}: {
  tenantId: string;
  spaceName: string;
  hasAccess: boolean;
  /** Solo el botón primario (para cabecera de ficha). */
  compact?: boolean;
}) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(initialHasAccess);
  const [entering, setEntering] = useState(false);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleEnter() {
    setEntering(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/identity/spaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectedTo?: string;
      };

      if (!res.ok || !data.ok) {
        setHasAccess(false);
        setError(
          data.error?.includes("membresía")
            ? SPACE_ACCESS_REQUIRED_MESSAGE
            : data.error || SPACE_ACCESS_REQUIRED_MESSAGE
        );
        return;
      }

      // Switch real → backoffice del Espacio (sin bypass ni impersonación).
      window.location.assign(data.redirectedTo || "/admin");
    } catch {
      setError(SPACE_ACCESS_REQUIRED_MESSAGE);
    } finally {
      setEntering(false);
    }
  }

  async function handleGrantAccess() {
    setGranting(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(
        `/api/platform/spaces/${encodeURIComponent(tenantId)}/access`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
        roleLabel?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo crear el acceso.");
        return;
      }

      setHasAccess(true);
      setInfo(
        data.message ||
          `Acceso de ${data.roleLabel || "Soporte"} listo. Ya puedes entrar.`
      );
      router.refresh();
    } catch {
      setError("No se pudo crear el acceso.");
    } finally {
      setGranting(false);
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleEnter}
          disabled={entering || granting}
          className="h-11 rounded-[12px] bg-[var(--growth-os-primary)] px-5 hover:opacity-95"
        >
          {entering ? "Entrando…" : "Entrar al Espacio"}
        </Button>
        {error ? (
          <p className="max-w-[16rem] text-[12px] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "space-y-3.5 rounded-[14px] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-sm)]"
      )}
    >
      <div className="space-y-1">
        <h2 className="text-[15px] font-semibold text-foreground">
          Entrar al Espacio
        </h2>
        <p className="text-[13px] text-muted">
          Abre el panel de {spaceName} con tu acceso en esa organización.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleEnter}
          disabled={entering || granting}
          className="h-10 rounded-[12px]"
        >
          {entering ? "Entrando…" : "Entrar al Espacio"}
        </Button>
        {!hasAccess ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleGrantAccess}
            disabled={entering || granting}
            className="h-10 rounded-[12px]"
          >
            {granting ? "Creando acceso…" : "Crear acceso de Soporte"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-[13px] text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-[13px] text-foreground" role="status">
          {info}
        </p>
      ) : null}
      {!hasAccess && !error && !info ? (
        <p className="text-[12px] text-muted">{SPACE_ACCESS_REQUIRED_MESSAGE}</p>
      ) : null}
    </section>
  );
}
