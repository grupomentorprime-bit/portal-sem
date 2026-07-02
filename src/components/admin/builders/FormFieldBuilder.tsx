"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CmsFormField, CmsFormFieldType } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const FIELD_TYPES: Array<{ value: CmsFormFieldType; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "textarea", label: "Área de texto" },
  { value: "date", label: "Fecha" },
  { value: "select", label: "Selección" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "file", label: "Archivo" },
];

interface FormFieldBuilderProps {
  items: CmsFormField[];
  onChange: (items: CmsFormField[]) => void;
}

export function FormFieldBuilder({ items, onChange }: FormFieldBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsFormField>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.label, subtitle: i.type }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("field");
        onChange([
          ...items,
          {
            id,
            type: "text",
            name: `field_${items.length}`,
            label: "Nuevo campo",
            required: false,
            width: "full",
          },
        ]);
        setSelectedId(id);
      }}
      addLabel="Agregar campo"
      onRemove={(id) => {
        onChange(items.filter((i) => i.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Tipo">
            <Select
              value={selected.type}
              onChange={(e) => update({ type: e.target.value as CmsFormFieldType })}
              options={FIELD_TYPES}
            />
          </Field>
          <Field label="Nombre (name)">
            <Input value={selected.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Etiqueta">
            <Input value={selected.label} onChange={(e) => update({ label: e.target.value })} />
          </Field>
          <Field label="Placeholder">
            <Input
              value={selected.placeholder ?? ""}
              onChange={(e) => update({ placeholder: e.target.value })}
            />
          </Field>
          <Field label="Regex validación">
            <Input
              value={selected.regex ?? ""}
              onChange={(e) => update({ regex: e.target.value })}
            />
          </Field>
          <Field label="Ancho">
            <Select
              value={selected.width}
              onChange={(e) => update({ width: e.target.value as "full" | "half" })}
              options={[
                { value: "full", label: "Completo" },
                { value: "half", label: "Mitad" },
              ]}
            />
          </Field>
          <Field label="Ayuda">
            <Textarea
              rows={2}
              value={selected.helper ?? ""}
              onChange={(e) => update({ helper: e.target.value })}
            />
          </Field>
          <Switch
            checked={selected.required}
            onChange={(required) => update({ required })}
            label="Obligatorio"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un campo para comenzar.</p>
      )}
    </BuilderShell>
  );
}
