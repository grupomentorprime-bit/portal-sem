"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

interface FormListClientProps {
  initialForms: ExperienceFormDefinition[];
}

export function FormListClient({ initialForms }: FormListClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (data.ok) router.push(`/admin/experience/forms/${data.form._id}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Experience Forms</h1>
          <p className="text-sm text-muted">Motor oficial de formularios del Portal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSeed} loading={loading}>
            Inicializar SEM
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <div className="grid gap-4">
        {forms.map((form) => (
          <Card key={form._id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  <Link href={`/admin/experience/forms/${form._id}`} className="hover:underline">
                    {form.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  ID: {form._id} · Destino: {form.destination}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(form, "active")}
                >
                  {form.active ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(form, "visible")}
                >
                  {form.visible ? "Ocultar" : "Publicar"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(form)}>
                  Duplicar
                </Button>
                <Link
                  href={`/admin/experience/forms/${form._id}`}
                  className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                >
                  Editar
                </Link>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {forms.length === 0 ? (
        <p className="text-sm text-muted">
          No hay formularios. Usa &quot;Inicializar SEM&quot; para crear los cuatro formularios base.
        </p>
      ) : null}
    </div>
  );
}
