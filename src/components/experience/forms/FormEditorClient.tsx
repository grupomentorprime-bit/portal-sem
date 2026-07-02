"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

interface FormEditorClientProps {
  form: ExperienceFormDefinition;
}

export function FormEditorClient({ form: initialForm }: FormEditorClientProps) {
  const router = useRouter();
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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/experience/forms" className="text-sm text-muted hover:underline">
            ← Formularios
          </Link>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
          <p className="text-sm text-muted">ID: {form._id}</p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Guardar
        </Button>
      </div>

      {error ? <p className="text-sm text-primary">{error}</p> : null}
      {saved ? <p className="text-sm text-success">Guardado correctamente.</p> : null}

      <div className="space-y-4">
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
        <div>
          <Label htmlFor="destination">Destino</Label>
          <select
            id="destination"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.destination}
            onChange={(e) =>
              setForm({
                ...form,
                destination: e.target.value as ExperienceFormDefinition["destination"],
              })
            }
          >
            <option value="contact">Contacto</option>
            <option value="information_request">Solicitud de información</option>
            <option value="attendance_confirmation">Confirmación de asistencia</option>
            <option value="absence_justification">Justificación de inasistencia</option>
            <option value="event_registration">Inscripción a evento</option>
            <option value="subscription">Suscripción</option>
          </select>
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
            Visible
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
        <div>
          <Label htmlFor="postSubmit">Acción posterior (JSON)</Label>
          <Textarea
            id="postSubmit"
            className="min-h-24 font-mono text-xs"
            value={JSON.stringify(form.postSubmit, null, 2)}
            onChange={(e) => {
              try {
                setForm({
                  ...form,
                  postSubmit: JSON.parse(e.target.value) as ExperienceFormDefinition["postSubmit"],
                });
              } catch {
                /* ignore while typing */
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
