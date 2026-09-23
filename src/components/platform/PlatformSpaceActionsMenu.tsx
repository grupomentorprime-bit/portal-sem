"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button, Dropdown, Input, Modal } from "@/components/ui";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { isProtectedPlatformSpace } from "@/lib/platform/delete-space-client";
import type { TenantStatus } from "@/core/tenant/types";

type PendingAction =
  | { kind: "status"; status: TenantStatus; title: string; description: string }
  | { kind: "delete" };

const STATUS_ACTIONS: Array<{
  status: TenantStatus;
  label: string;
  title: string;
  description: string;
}> = [
  {
    status: "active",
    label: "Activar",
    title: "Activar Espacio",
    description: "El portal vuelve a publicarse con el dominio de este Espacio.",
  },
  {
    status: "inactive",
    label: "Desactivar",
    title: "Desactivar Espacio",
    description: "El portal deja de publicarse. Puedes activarlo de nuevo.",
  },
  {
    status: "suspended",
    label: "Suspender",
    title: "Suspender Espacio",
    description: "El portal queda en mantenimiento hasta que lo actives.",
  },
  {
    status: "archived",
    label: "Archivar",
    title: "Archivar Espacio",
    description:
      "El portal deja de publicarse. El Espacio sigue en el catálogo para reactivarlo.",
  },
];

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

  const items = [
    ...STATUS_ACTIONS.filter((action) => action.status !== status).map(
      (action) => ({
        label: action.label,
        onClick: () =>
          setPending({
            kind: "status",
            status: action.status,
            title: action.title,
            description: action.description,
          }),
      })
    ),
    {
      label: "Eliminar",
      danger: true,
      disabled: protectedSpace,
      onClick: () => setPending({ kind: "delete" }),
    },
  ];

  return (
    <>
      <Dropdown
        align="right"
        trigger={
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-white text-[var(--gray-700)] transition hover:bg-[var(--gray-100)]"
            aria-label={`Controles de ${spaceName}`}
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </span>
        }
        items={items}
      />

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
