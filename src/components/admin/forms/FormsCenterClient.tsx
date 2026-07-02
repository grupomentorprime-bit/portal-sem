"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FORM_CENTER_CATEGORIES,
  FORM_CONVOCATORIAS,
  formatConvocatoriaDate,
  publicFormUrl,
} from "@/lib/admin/forms-center";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

interface FormsCenterClientProps {
  initialForms: ExperienceFormDefinition[];
}

export function FormsCenterClient({ initialForms }: FormsCenterClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convocatoriaFormIds = new Set(FORM_CONVOCATORIAS.map((item) => item.formId));

  const refresh = useCallback(async () => {
    const res = await fetch("/api/experience/forms");
    const data = await res.json();
    if (data.ok) setForms(data.forms);
  }, []);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experience/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Error al inicializar formularios.");
        return;
      }
      setForms(data.forms);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (form: ExperienceFormDefinition, field: "active" | "visible") => {
    await fetch(`/api/experience/forms/${form._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !form[field] }),
    });
    await refresh();
  };

  const handleDuplicate = async (form: ExperienceFormDefinition) => {
    const res = await fetch(`/api/experience/forms/${form._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" }),
    });
    const data = await res.json();
    if (data.ok) router.push(`/admin/portal/forms/${data.form._id}`);
  };

  const generalForms = forms.filter((form) => !convocatoriaFormIds.has(form._id));

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Centro de formularios" },
      ]}
      title="Centro de formularios"
      description="Convocatorias, confirmaciones de asistencia, justificaciones y otros formularios del portal."
      actions={
        <Button variant="secondary" onClick={handleSeed} loading={loading}>
          Sincronizar formularios base
        </Button>
      }
    >
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            Convocatorias
          </h2>
          <p className="mt-1 text-sm text-muted">
            {FORM_CENTER_CATEGORIES.find((c) => c.id === "convocatorias")?.description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {FORM_CONVOCATORIAS.map((convocatoria) => {
            const form = forms.find((item) => item._id === convocatoria.formId);
            return (
              <Card key={convocatoria.slug} className="border-primary/20">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{convocatoria.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatConvocatoriaDate(convocatoria.date)} · {convocatoria.location}
                      </CardDescription>
                    </div>
                    <Badge variant={convocatoria.active ? "success" : "warning"}>
                      {convocatoria.active ? "Activa" : "Cerrada"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">{convocatoria.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/portal/forms/convocatorias/${convocatoria.slug}`}
                      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                      Gestionar respuestas
                    </Link>
                    {form ? (
                      <>
                        <Link
                          href={publicFormUrl(form._id)}
                          target="_blank"
                          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
                        >
                          Ver formulario público
                        </Link>
                        <Link
                          href={`/admin/portal/forms/${form._id}`}
                          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
                        >
                          Editar
                        </Link>
                      </>
                    ) : (
                      <span className="text-sm text-muted">
                        Ejecuta &quot;Sincronizar formularios base&quot; para crear el formulario.
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            Todos los formularios
          </h2>
          <p className="mt-1 text-sm text-muted">
            Definiciones reutilizables en páginas del portal y convocatorias.
          </p>
        </div>

        <div className="grid gap-4">
          {generalForms.map((form) => (
            <FormRow
              key={form._id}
              form={form}
              onToggle={handleToggle}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>

        {forms.length === 0 ? (
          <p className="text-sm text-muted">
            No hay formularios. Usa &quot;Sincronizar formularios base&quot; para crear los
            formularios institucionales.
          </p>
        ) : null}
      </section>
    </AdminModuleLayout>
  );
}

function FormRow({
  form,
  onToggle,
  onDuplicate,
}: {
  form: ExperienceFormDefinition;
  onToggle: (form: ExperienceFormDefinition, field: "active" | "visible") => void;
  onDuplicate: (form: ExperienceFormDefinition) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">
            <Link href={`/admin/portal/forms/${form._id}`} className="hover:underline">
              {form.name}
            </Link>
          </CardTitle>
          <CardDescription>
            {form.description ?? `Destino: ${form.destination}`}
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={form.active ? "success" : "warning"}>
              {form.active ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant={form.visible ? "info" : "neutral"}>
              {form.visible ? "Publicado" : "Oculto"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => onToggle(form, "active")}>
            {form.active ? "Desactivar" : "Activar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggle(form, "visible")}>
            {form.visible ? "Ocultar" : "Publicar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(form)}>
            Duplicar
          </Button>
          <Link
            href={`/admin/portal/forms/${form._id}`}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            Gestionar
          </Link>
        </div>
      </CardHeader>
    </Card>
  );
}
