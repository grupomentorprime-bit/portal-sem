"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { createCmsId, reorderBuilderItems } from "@/components/admin/builders/BuilderShell";
import type {
  ExperienceFormField,
  ExperienceFormFieldType,
} from "@/types/experience-forms";

function slugifyToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

const FIELD_TYPE_LABELS: Record<ExperienceFormFieldType, string> = {
  text: "Respuesta corta",
  email: "Correo",
  phone: "Teléfono",
  number: "Número",
  textarea: "Respuesta larga",
  date: "Fecha",
  time: "Hora",
  select: "Lista de opciones",
  radio: "Elegir una opción",
  checkbox: "Casilla",
  file: "Subir archivo",
  hidden: "Oculto",
};

const VISIBLE_FIELD_TYPES: Array<{ value: ExperienceFormFieldType; label: string }> = [
  { value: "text", label: FIELD_TYPE_LABELS.text },
  { value: "email", label: FIELD_TYPE_LABELS.email },
  { value: "phone", label: FIELD_TYPE_LABELS.phone },
  { value: "number", label: FIELD_TYPE_LABELS.number },
  { value: "textarea", label: FIELD_TYPE_LABELS.textarea },
  { value: "date", label: FIELD_TYPE_LABELS.date },
  { value: "time", label: FIELD_TYPE_LABELS.time },
  { value: "select", label: FIELD_TYPE_LABELS.select },
  { value: "radio", label: FIELD_TYPE_LABELS.radio },
  { value: "checkbox", label: FIELD_TYPE_LABELS.checkbox },
  { value: "file", label: FIELD_TYPE_LABELS.file },
];

function isAutoFieldName(name: string, label: string): boolean {
  if (/^field_\d+$/.test(name)) return true;
  const fromLabel = slugifyToken(label);
  return Boolean(fromLabel) && name === fromLabel;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface FormSimpleVisualEditorProps {
  name: string;
  description?: string;
  fields: ExperienceFormField[];
  submitLabel?: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onFieldsChange: (fields: ExperienceFormField[]) => void;
}

export function FormSimpleVisualEditor({
  name,
  description,
  fields,
  submitLabel = "Enviar",
  onNameChange,
  onDescriptionChange,
  onFieldsChange,
}: FormSimpleVisualEditorProps) {
  const visibleFields = fields.filter((f) => f.type !== "hidden" && f.visible !== false);
  const [selectedId, setSelectedId] = useState<string | null>(visibleFields[0]?.id ?? null);
  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const update = (patch: Partial<ExperienceFormField>) => {
    if (!selected) return;
    onFieldsChange(fields.map((f) => (f.id === selected.id ? { ...f, ...patch } : f)));
  };

  const updateValidation = (patch: Partial<NonNullable<ExperienceFormField["validation"]>>) => {
    if (!selected) return;
    onFieldsChange(
      fields.map((f) =>
        f.id === selected.id ? { ...f, validation: { ...f.validation, ...patch } } : f
      )
    );
  };

  const updateLabel = (label: string) => {
    if (!selected) return;
    const patch: Partial<ExperienceFormField> = { label };
    if (isAutoFieldName(selected.name, selected.label)) {
      const nextName = slugifyToken(label);
      if (nextName) patch.name = nextName;
    }
    update(patch);
  };

  const options = selected?.options ?? [];

  const updateOptionLabel = (index: number, label: string) => {
    if (!selected) return;
    const next = options.map((opt, i) => {
      if (i !== index) return opt;
      const prevAuto = slugifyToken(opt.label);
      const shouldResync = !opt.value || opt.value === prevAuto;
      return {
        label,
        value: shouldResync ? slugifyToken(label) || `opcion_${index + 1}` : opt.value,
      };
    });
    update({ options: next });
  };

  const addOption = () => {
    if (!selected) return;
    const n = options.length + 1;
    update({ options: [...options, { label: `Opción ${n}`, value: `opcion_${n}` }] });
  };

  const removeOption = (index: number) => {
    if (!selected) return;
    update({ options: options.filter((_, i) => i !== index) });
  };

  const addField = () => {
    const id = createCmsId("field");
    const index = fields.length + 1;
    onFieldsChange([
      ...fields,
      {
        id,
        type: "text",
        name: `field_${index}`,
        label: "Nueva pregunta",
        placeholder: "Escribe aquí…",
        validation: { required: false },
      },
    ]);
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selected) return;
    const next = fields.filter((f) => f.id !== selected.id);
    onFieldsChange(next);
    setSelectedId(next.find((f) => f.type !== "hidden")?.id ?? null);
  };

  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return;
    const index = fields.findIndex((f) => f.id === selected.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= fields.length) return;
    onFieldsChange(reorderBuilderItems(fields, fields[index].id, fields[target].id));
  };

  const showExample =
    selected && !["radio", "checkbox", "hidden", "file"].includes(selected.type);

  return (
    <div className="form-simple-editor">
      <div className="form-simple-editor__layout">
        <div className="form-simple-editor__canvas-wrap">
          <div className="form-simple-editor__canvas" aria-label="Vista del formulario">
            <input
              className="form-simple-editor__title"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Título del formulario"
              aria-label="Título del formulario"
            />
            <textarea
              className="form-simple-editor__subtitle"
              value={description ?? ""}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Una frase corta para quien responde…"
              rows={2}
              aria-label="Descripción del formulario"
            />

            <div className="form-simple-editor__fields">
              {visibleFields.length === 0 ? (
                <p className="form-simple-editor__empty">
                  Aún no hay preguntas. Agrega la primera abajo.
                </p>
              ) : null}

              {visibleFields.map((field) => {
                const isSelected = selected?.id === field.id;
                return (
                  <button
                    key={field.id}
                    type="button"
                    className={`form-simple-editor__field${
                      isSelected ? " form-simple-editor__field--selected" : ""
                    }`}
                    onClick={() => setSelectedId(field.id)}
                  >
                    <span className="form-simple-editor__field-label">
                      {field.label || "Sin título"}
                      {field.validation?.required ? (
                        <span className="form-simple-editor__required" aria-hidden="true">
                          *
                        </span>
                      ) : null}
                    </span>
                    <FieldPreview field={field} />
                    {field.helper ? (
                      <span className="form-simple-editor__field-helper">{field.helper}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="form-simple-editor__add"
              onClick={addField}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar pregunta
            </button>

            <div className="form-simple-editor__submit" aria-hidden="true">
              <span>{submitLabel}</span>
            </div>
          </div>
        </div>

        <aside className="form-simple-editor__panel" aria-label="Editar pregunta">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Pregunta seleccionada
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{selected.label}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeSelected}
                  className="text-muted"
                  aria-label="Eliminar pregunta"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              {selected.type === "hidden" ? (
                <p className="rounded-md border border-border bg-background-muted px-3 py-2 text-sm text-muted">
                  Esta pregunta está oculta. Quien responde no la ve.
                </p>
              ) : (
                <Field label="Tipo de respuesta">
                  <Select
                    value={selected.type}
                    onChange={(e) => {
                      const type = e.target.value as ExperienceFormFieldType;
                      update({
                        type,
                        ...(type === "select" || type === "radio"
                          ? {
                              options:
                                selected.options && selected.options.length > 0
                                  ? selected.options
                                  : [
                                      { label: "Opción 1", value: "opcion_1" },
                                      { label: "Opción 2", value: "opcion_2" },
                                    ],
                            }
                          : {}),
                      });
                    }}
                    options={VISIBLE_FIELD_TYPES}
                  />
                </Field>
              )}

              <Field label="Pregunta">
                <Input value={selected.label} onChange={(e) => updateLabel(e.target.value)} />
              </Field>

              {showExample ? (
                <Field label="Ejemplo dentro del campo">
                  <Input
                    value={selected.placeholder ?? ""}
                    onChange={(e) => update({ placeholder: e.target.value })}
                    placeholder="Ej. María López"
                  />
                </Field>
              ) : null}

              <Field label="Ayuda">
                <Input
                  value={selected.helper ?? ""}
                  onChange={(e) => update({ helper: e.target.value })}
                  placeholder="Opcional"
                />
              </Field>

              {["select", "radio"].includes(selected.type) ? (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Opciones</span>
                  <div className="space-y-2">
                    {options.map((opt, index) => (
                      <div key={`${selected.id}-opt-${index}`} className="flex items-center gap-2">
                        <Input
                          value={opt.label}
                          onChange={(e) => updateOptionLabel(index, e.target.value)}
                          placeholder={`Opción ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          aria-label={`Quitar opción ${index + 1}`}
                          className="shrink-0 text-muted"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Agregar opción
                  </Button>
                </div>
              ) : null}

              {selected.type !== "hidden" ? (
                <Switch
                  checked={selected.validation?.required ?? false}
                  onChange={(required) => updateValidation({ required })}
                  label="Respuesta obligatoria"
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveSelected(-1)}>
                  Subir
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveSelected(1)}>
                  Bajar
                </Button>
              </div>

              <details className="rounded-lg border border-border px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-muted">
                  Más opciones
                </summary>
                <div className="mt-3 space-y-4 pb-1">
                  <Field label="Nombre interno">
                    <Input
                      value={selected.name}
                      onChange={(e) => update({ name: e.target.value })}
                    />
                  </Field>
                  <Switch
                    checked={selected.type === "hidden"}
                    onChange={(hidden) =>
                      update({
                        type: hidden ? "hidden" : "text",
                        ...(hidden
                          ? { validation: { ...selected.validation, required: false } }
                          : {}),
                      })
                    }
                    label="Campo oculto"
                    description="No lo ve quien responde. Solo para uso interno."
                  />
                  {selected.type === "hidden" ? (
                    <Field label="Valor fijo">
                      <Input
                        value={selected.defaultValue ?? ""}
                        onChange={(e) => update({ defaultValue: e.target.value })}
                      />
                    </Field>
                  ) : null}
                </div>
              </details>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Selecciona una pregunta en el formulario o agrega una nueva.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: ExperienceFormField }) {
  if (field.type === "textarea") {
    return (
      <span className="form-simple-editor__control form-simple-editor__control--area">
        {field.placeholder || " "}
      </span>
    );
  }
  if (field.type === "select") {
    return (
      <span className="form-simple-editor__control form-simple-editor__control--select">
        {field.placeholder || "Selecciona una opción"}
      </span>
    );
  }
  if (field.type === "radio") {
    return (
      <span className="form-simple-editor__choices">
        {(field.options ?? []).map((opt) => (
          <span key={opt.value} className="form-simple-editor__choice">
            {opt.label}
          </span>
        ))}
      </span>
    );
  }
  if (field.type === "checkbox") {
    return <span className="form-simple-editor__control">Casilla</span>;
  }
  if (field.type === "file") {
    return <span className="form-simple-editor__control">Elegir archivo…</span>;
  }
  return (
    <span className="form-simple-editor__control">{field.placeholder || " "}</span>
  );
}
