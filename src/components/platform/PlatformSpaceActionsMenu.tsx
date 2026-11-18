"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Archive,
  CircleOff,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { isProtectedPlatformSpace } from "@/lib/platform/delete-space-client";
import { cn } from "@/lib/utils";
import type { TenantStatus } from "@/core/tenant/types";

type PendingAction =
  | { kind: "status"; status: TenantStatus; title: string; description: string }
  | { kind: "delete" };

const STATUS_ACTIONS: Array<{
  status: TenantStatus;
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: string;
}> = [
  {
    status: "active",
    label: "Activar",
    title: "Activar Espacio",
    description: "El portal vuelve a publicarse con el dominio de este Espacio.",
    icon: <Play className="h-[15px] w-[15px]" aria-hidden />,
    tone: "text-success hover:bg-success/10",
  },
  {
    status: "inactive",
    label: "Desactivar",
    title: "Desactivar Espacio",
    description: "El portal deja de publicarse. Puedes activarlo de nuevo.",
    icon: <CircleOff className="h-[15px] w-[15px]" aria-hidden />,
    tone: "text-muted hover:bg-muted/10",
  },
  {
    status: "suspended",
    label: "Suspender",
    title: "Suspender Espacio",
    description: "El portal queda en mantenimiento hasta que lo actives.",
    icon: <Pause className="h-[15px] w-[15px]" aria-hidden />,
    tone: "text-warning hover:bg-warning/10",
  },
  {
    status: "archived",
    label: "Archivar",
    title: "Archivar Espacio",
    description:
      "El portal deja de publicarse. El Espacio sigue en el catálogo para reactivarlo.",
    icon: <Archive className="h-[15px] w-[15px]" aria-hidden />,
    tone: "text-accent hover:bg-accent/10",
  },
];

const iconBtn =
  "inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] transition disabled:cursor-default disabled:opacity-45";

export function PlatformSpaceActionsMenu({
  tenantId,
  spaceName,
  status,
}: {
  tenantId: string;
  spaceName: string;
  status: TenantStatus;
}) {
  const router = useRouter();
  const protectedSpace = isProtectedPlatformSpace(tenantId);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (submitting) return;
    setPending(null);
    setConfirmSlug("");
    setError("");
  }

  async function applyStatus(next: TenantStatus) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/platform/spaces/${encodeURIComponent(tenantId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo actualizar el estado.");
        return;
      }
      setPending(null);
      router.refresh();
    } catch {
      setError("No se pudo actualizar el estado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function applyDelete() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/platform/spaces/${encodeURIComponent(tenantId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmSlug }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo eliminar el Espacio.");
        return;
      }
      setPending(null);
      router.push(`${PLATFORM_ADMIN_HOME}#espacios`);
      router.refresh();
    } catch {
      setError("No se pudo eliminar el Espacio.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusItem = STATUS_ACTIONS.find(
    (action) => pending?.kind === "status" && action.status === pending.status
  );

  return (
    <>
      <div
        className="inline-flex items-center gap-0.5"
        aria-label={`Controles de ${spaceName}`}
      >
        {STATUS_ACTIONS.filter((action) => action.status !== status).map((action) => (
          <button
            key={action.status}
            type="button"
            className={cn(iconBtn, action.tone)}
            aria-label={action.label}
            title={action.label}
            disabled={submitting}
            onClick={() =>
              setPending({
                kind: "status",
                status: action.status,
                title: action.title,
                description: action.description,
              })
            }
          >
            {action.icon}
          </button>
        ))}
        <button
          type="button"
          className={cn(iconBtn, "text-danger hover:bg-danger/10")}
          aria-label="Eliminar"
          title={protectedSpace ? "Espacio protegido" : "Eliminar"}
          disabled={submitting || protectedSpace}
          onClick={() => setPending({ kind: "delete" })}
        >
          <Trash2 className="h-[15px] w-[15px]" aria-hidden />
        </button>
      </div>

      <Modal
        open={pending?.kind === "status"}
        onClose={close}
        title={statusItem?.title ?? "Cambiar estado"}
        description={statusItem?.description}
        size="sm"
      >
        <div className="space-y-4">
          {error ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={statusItem?.status === "active" ? "primary" : "danger"}
              loading={submitting}
              disabled={submitting || !statusItem}
              onClick={() => statusItem && applyStatus(statusItem.status)}
            >
              {statusItem?.label ?? "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={pending?.kind === "delete"}
        onClose={close}
        title="Eliminar Espacio"
        description={`Vas a eliminar «${spaceName}». Es irreversible.`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={`Escribe ${tenantId} para confirmar`}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            placeholder={tenantId}
            autoComplete="off"
          />
          {error ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={submitting}
              disabled={submitting || confirmSlug.trim() !== tenantId}
              onClick={applyDelete}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
