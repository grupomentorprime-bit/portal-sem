"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { isProtectedPlatformSpace } from "@/lib/platform/delete-space-client";

export function PlatformDeleteSpacePanel({
  tenantId,
  spaceName,
}: {
  tenantId: string;
  spaceName: string;
}) {
  const router = useRouter();
  const protectedSpace = isProtectedPlatformSpace(tenantId);
  const [open, setOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (submitting) return;
    setOpen(false);
    setConfirmSlug("");
    setError("");
  }

  async function handleDelete() {
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

      setOpen(false);
      router.push(`${PLATFORM_ADMIN_HOME}#espacios`);
      router.refresh();
    } catch {
      setError("No se pudo eliminar el Espacio.");
    } finally {
      setSubmitting(false);
    }
  }

  if (protectedSpace) {
    return (
      <section className="rounded-[14px] border border-[var(--color-border-default)] bg-white px-5 py-4">
        <h2 className="text-[15px] font-semibold text-[var(--gray-900)]">
          Eliminar Espacio
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--gray-500)]">
          Este Espacio de fundación no se puede eliminar desde Growth OS.
        </p>
      </section>
    );
  }

  const canConfirm = confirmSlug.trim() === tenantId;

  return (
    <>
      <section className="rounded-[14px] border border-[color-mix(in_srgb,var(--color-danger)_28%,var(--color-border-default))] bg-[color-mix(in_srgb,var(--color-danger)_5%,white)] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[var(--gray-900)]">
              Eliminar Espacio
            </h2>
            <p className="max-w-xl text-[13px] text-[var(--gray-500)]">
              Quita {spaceName} de Growth OS: dominios, Sitio, miembros y datos
              del Espacio. Esta acción no se puede deshacer.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setOpen(true)}
            className="h-10 shrink-0 rounded-[12px]"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Eliminar
          </Button>
        </div>
      </section>

      <Modal
        open={open}
        onClose={handleClose}
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
            autoFocus
          />
          {error ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={!canConfirm || submitting}
              loading={submitting}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
