"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { proposeInitialSpaceHost } from "@/lib/platform/propose-space-host";
import { SPACE_ORGANIZATION_TYPES } from "@/lib/platform/space-organization-types";
import { slugify } from "@/lib/slugify";

const TYPE_OPTIONS = SPACE_ORGANIZATION_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
}));

interface CreatedSpaceSummary {
  name: string;
  siteName: string;
  primaryDomain: string | null;
  statusLabel: string;
}

function proposeSpaceId(name: string): string {
  return slugify(name).slice(0, 64);
}

export function PlatformCreateSpacePanel({
  children,
  platformBaseDomain = null,
}: {
  children: (ctx: {
    open: () => void;
    summary: ReactNode;
  }) => ReactNode;
  /** Base pública de subdominios (`PLATFORM_BASE_DOMAIN`). Null → localhost en dev. */
  platformBaseDomain?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<CreatedSpaceSummary | null>(null);

  const [name, setName] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [spaceIdTouched, setSpaceIdTouched] = useState(false);
  const [type, setType] = useState("");
  const [host, setHost] = useState("");
  const [hostTouched, setHostTouched] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  function resetForm() {
    setName("");
    setSpaceId("");
    setSpaceIdTouched(false);
    setType("");
    setHost("");
    setHostTouched(false);
    setOwnerEmail("");
    setShowAdvanced(false);
    setError("");
  }

  function handleClose() {
    setOpen(false);
    setError("");
  }

  function proposeHost(id: string): string {
    return proposeInitialSpaceHost(id, platformBaseDomain);
  }

  function handleNameChange(value: string) {
    setName(value);
    const nextId = proposeSpaceId(value);
    if (!spaceIdTouched) {
      setSpaceId(nextId);
      if (!hostTouched) setHost(proposeHost(nextId));
    } else if (!hostTouched && spaceId) {
      setHost(proposeHost(spaceId));
    }
  }

  function handleSpaceIdChange(value: string) {
    setSpaceIdTouched(true);
    const nextId = slugify(value).slice(0, 64);
    setSpaceId(nextId);
    if (!hostTouched) setHost(proposeHost(nextId));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const trimmedName = name.trim();
      const res = await fetch("/api/platform/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          slug: spaceId,
          type,
          host,
          // El Sitio toma el mismo nombre del Espacio; evita pedir lo mismo dos veces.
          siteName: trimmedName,
          ownerEmail: ownerEmail.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        space?: CreatedSpaceSummary;
      };
      if (!res.ok || !data.ok || !data.space) {
        setError(data.error || "No se pudo crear el Espacio.");
        return;
      }
      setSummary(data.space);
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setError("No se pudo crear el Espacio.");
    } finally {
      setSubmitting(false);
    }
  }

  const summaryNode = summary ? (
    <div
      className="rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-4 shadow-[var(--shadow-sm)]"
      role="status"
    >
      <p className="text-sm font-semibold text-foreground">Espacio creado</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Nombre</dt>
          <dd className="font-medium text-foreground">{summary.name}</dd>
        </div>
        <div>
          <dt className="text-muted">Sitio</dt>
          <dd className="font-medium text-foreground">{summary.siteName}</dd>
        </div>
        <div>
          <dt className="text-muted">Dominio</dt>
          <dd className="font-medium text-foreground">
            {summary.primaryDomain ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Estado</dt>
          <dd className="font-medium text-foreground">{summary.statusLabel}</dd>
        </div>
      </dl>
    </div>
  ) : null;

  return (
    <>
      {children({ open: () => setOpen(true), summary: summaryNode })}

      <Modal
        open={open}
        onClose={handleClose}
        title="Crear Espacio"
        description="Agrega una organización o negocio a Growth OS."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-0">
          <Input
            label="Nombre del Espacio"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Mentor Capacitación"
            required
            autoComplete="off"
          />

          <Select
            label="¿Qué tipo de organización es?"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={TYPE_OPTIONS}
            placeholder="Selecciona una categoría"
            helper="La categoría no limita las capacidades de Growth OS."
            required
          />

          <Input
            label="Dirección web inicial"
            value={host}
            onChange={(e) => {
              setHostTouched(true);
              setHost(e.target.value);
            }}
            placeholder={
              proposeHost("mentor-capacitacion") ||
              "mentor-capacitacion.localhost:3000"
            }
            helper="Dominio o subdominio con el que se abrirá el Sitio."
            required
            autoComplete="off"
          />

          <div className="rounded-[var(--radius-md)] border border-border/70 bg-muted/20 px-3 py-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
            >
              <span>Opciones avanzadas</span>
              <span className="text-muted">{showAdvanced ? "Ocultar" : "Mostrar"}</span>
            </button>

            {showAdvanced ? (
              <div className="mt-3 space-y-4">
                <Input
                  label="Identificador del Espacio"
                  value={spaceId}
                  onChange={(e) => handleSpaceIdChange(e.target.value)}
                  helper="Se propone desde el nombre. Solo cámbialo si hace falta."
                  required
                  autoComplete="off"
                />
                <Input
                  label="Dueño inicial (opcional)"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  helper="Correo de una cuenta existente. El acceso no se crea solo."
                  autoComplete="off"
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Identificador:{" "}
                <span className="font-medium text-foreground">
                  {spaceId || "—"}
                </span>
                {ownerEmail.trim() ? (
                  <>
                    {" "}
                    · Dueño:{" "}
                    <span className="font-medium text-foreground">
                      {ownerEmail.trim()}
                    </span>
                  </>
                ) : null}
              </p>
            )}
          </div>

          {error ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || !spaceId || !type}
            >
              Crear Espacio
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
