"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BuilderShell, createCmsId, reorderBuilderItems } from "@/components/admin/builders/BuilderShell";
import type {
  ExperienceFormField,
  ExperienceFormFieldType,
} from "@/types/experience-forms";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const FIELD_TYPES: Array<{ value: ExperienceFormFieldType; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "number", label: "Número" },
  { value: "textarea", label: "Área de texto" },
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
  { value: "select", label: "Selección" },
  { value: "radio", label: "Opciones (radio)" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "Archivo" },
  { value: "hidden", label: "Oculto" },
];

interface ExperienceFormFieldsEditorProps {
  fields: ExperienceFormField[];
  onChange: (fields: ExperienceFormField[]) => void;
}

export function ExperienceFormFieldsEditor({ fields, onChange }: ExperienceFormFieldsEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const selected = fields.find((f) => f.id === selectedId) ?? fields[0];

  const update = (patch: Partial<ExperienceFormField>) => {
    if (!selected) return;
    onChange(fields.map((f) => (f.id === selected.id ? { ...f, ...patch } : f)));
  };

  const updateValidation = (patch: Partial<NonNullable<ExperienceFormField["validation"]>>) => {
    if (!selected) return;
    onChange(
      fields.map((f) =>
        f.id === selected.id
          ? { ...f, validation: { ...f.validation, ...patch } }
          : f
      )
    );
  };

  const optionsText = selected?.options?.map((o) => `${o.label}|${o.value}`).join("\n") ?? "";

  const setOptionsFromText = (text: string) => {
    const options = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, value] = line.split("|");
        return { label: label.trim(), value: (value ?? label).trim() };
      });
    update({ options });
  };

  return (
    <BuilderShell
      items={fields.map((f) => ({ id: f.id, label: f.label, subtitle: f.type }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(fields, from, to))}
      onAdd={() => {
        const id = createCmsId("field");
        onChange([
          ...fields,
          {
            id,
            type: "text",
            name: `field_${fields.length + 1}`,
            label: "Nuevo campo",
            validation: { required: false },
          },
        ]);
        setSelectedId(id);
      }}
      addLabel="Agregar campo"
      onRemove={(id) => {
        onChange(fields.filter((f) => f.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Tipo">
            <Select
              value={selected.type}
              onChange={(e) => update({ type: e.target.value as ExperienceFormFieldType })}
              options={FIELD_TYPES}
            />
          </Field>
          <Field label="Nombre interno (name)">
            <Input value={selected.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Etiqueta visible">
            <Input value={selected.label} onChange={(e) => update({ label: e.target.value })} />
          </Field>
          <Field label="Placeholder">
            <Input
              value={selected.placeholder ?? ""}
              onChange={(e) => update({ placeholder: e.target.value })}
            />
          </Field>
          <Field label="Texto de ayuda">
            <Textarea
              rows={2}
              value={selected.helper ?? ""}
              onChange={(e) => update({ helper: e.target.value })}
            />
          </Field>
          {selected.type === "hidden" ? (
            <Field label="Valor por defecto">
              <Input
                value={selected.defaultValue ?? ""}
                onChange={(e) => update({ defaultValue: e.target.value })}
              />
            </Field>
          ) : null}
          {["select", "radio"].includes(selected.type) ? (
            <Field label="Opciones (una por línea: Etiqueta|valor)">
              <Textarea
                rows={4}
                className="font-mono text-xs"
                value={optionsText}
                onChange={(e) => setOptionsFromText(e.target.value)}
                placeholder={"Sí, asistiré|yes\nNo podré asistir|no"}
              />
            </Field>
          ) : null}
          <Switch
            checked={selected.validation?.required ?? false}
            onChange={(required) => updateValidation({ required })}
            label="Campo obligatorio"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Agrega un campo para comenzar a editar el formulario.</p>
      )}
    </BuilderShell>
  );
}
