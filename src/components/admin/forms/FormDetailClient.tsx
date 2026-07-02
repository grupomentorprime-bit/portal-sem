"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { FormSubmissionsPanel } from "@/components/admin/forms/FormSubmissionsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { publicFormUrl } from "@/lib/admin/forms-center";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

type TabId = "respuestas" | "configuracion";

interface FormDetailClientProps {
  form: ExperienceFormDefinition;
}

export function FormDetailClient({ form: initialForm }: FormDetailClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("respuestas");
  const [form, setForm] = useState(initialForm);
  const [fieldsJson, setFieldsJson] = useState(JSON.stringify(initialForm.fields, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    let fields = form.fields;
    try {
      fields = JSON.parse(fieldsJson) as ExperienceFormDefinition["fields"];
    } catch {
      setError("JSON de campos inválido.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/experience/forms/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          successMessage: form.successMessage,
          errorMessage: form.errorMessage,
          destination: form.destination,
          postSubmit: form.postSubmit,
          active: form.active,
          visible: form.visible,
          fields,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Error al guardar.");
        return;
      }
      setForm(data.form);
      setFieldsJson(JSON.stringify(data.form.fields, null, 2));
      setSaved(true);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Centro de formularios", href: "/admin/portal/forms" },
        { label: form.name },
      ]}
      title={form.name}
      description={form.description ?? "Gestión de respuestas y configuración del formulario."}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={publicFormUrl(form._id)}
            target="_blank"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Ver público
          </Link>
          {tab === "configuracion" ? (
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Guardar
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="mb-6 flex gap-2 border-b border-border">
        <TabButton active={tab === "respuestas"} onClick={() => setTab("respuestas")}>
          Respuestas
        </TabButton>
        <TabButton active={tab === "configuracion"} onClick={() => setTab("configuracion")}>
          Configuración
        </TabButton>
      </div>

      {tab === "respuestas" ? <FormSubmissionsPanel formId={form._id} /> : null}

      {tab === "configuracion" ? (
        <div className="max-w-3xl space-y-4">
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {saved ? <p className="text-sm text-success">Guardado correctamente.</p> : null}

          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="success">Mensaje de éxito</Label>
            <Textarea
              id="success"
              value={form.successMessage}
              onChange={(e) => setForm({ ...form, successMessage: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="error">Mensaje de error</Label>
            <Textarea
              id="error"
              value={form.errorMessage}
              onChange={(e) => setForm({ ...form, errorMessage: e.target.value })}
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              />
              Visible en portal
            </label>
          </div>
          <div>
            <Label htmlFor="fields">Campos (JSON)</Label>
            <Textarea
              id="fields"
              className="min-h-80 font-mono text-xs"
              value={fieldsJson}
              onChange={(e) => setFieldsJson(e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </AdminModuleLayout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "border-b-2 border-primary px-4 py-2 text-sm font-medium text-foreground"
          : "px-4 py-2 text-sm text-muted hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
