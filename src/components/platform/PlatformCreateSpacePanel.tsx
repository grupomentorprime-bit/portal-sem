"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Input, Modal, Select } from "@/components/ui";

const TYPE_OPTIONS = [
  { value: "institution", label: "Institución" },
  { value: "academy", label: "Academia" },
];

interface CreatedSpaceSummary {
  name: string;
  siteName: string;
  primaryDomain: string | null;
  statusLabel: string;
}

export function PlatformCreateSpacePanel({
  children,
}: {
  children: (ctx: {
    open: () => void;
    summary: ReactNode;
  }) => ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<CreatedSpaceSummary | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("institution");
  const [host, setHost] = useState("");
  const [siteName, setSiteName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  function resetForm() {
    setName("");
    setSlug("");
    setType("institution");
    setHost("");
    setSiteName("");
    setOwnerEmail("");
    setError("");
  }

  function handleClose() {
    setOpen(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/platform/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          type,
          host,
          siteName,
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
        description="Agrega una organización nueva a Growth OS."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-0">
          <Input
            label="Nombre del Espacio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helper="Identificador único (a-z, 0-9, guiones)."
            required
            autoComplete="off"
          />
          <Select
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={TYPE_OPTIONS}
            required
          />
          <Input
            label="Dominio o subdominio inicial"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="ejemplo.localhost:3000"
            required
            autoComplete="off"
          />
          <Input
            label="Nombre del Sitio"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
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

          {error ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Crear Espacio
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
