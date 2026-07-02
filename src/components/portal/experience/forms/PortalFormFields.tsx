"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ExperienceFormField } from "@/types/experience-forms";

interface PortalFormFieldsProps {
  fields: ExperienceFormField[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (name: string, value: unknown) => void;
}

export function PortalFormFields({
  fields,
  values,
  errors,
  disabled,
  onChange,
}: PortalFormFieldsProps) {
  const visibleFields = fields.filter((f) => f.visible !== false && f.type !== "hidden");

  return (
    <div className="portal-experience-form__fields">
      {fields
        .filter((f) => f.type === "hidden")
        .map((field) => (
          <input
            key={field.id}
            type="hidden"
            name={field.name}
            value={String(values[field.name] ?? field.defaultValue ?? "")}
            readOnly
          />
        ))}

      {visibleFields.map((field) => (
        <div key={field.id} className="portal-experience-form__field">
          {renderField(field, values, errors, disabled, onChange)}
        </div>
      ))}
    </div>
  );
}

function renderField(
  field: ExperienceFormField,
  values: Record<string, unknown>,
  errors: Record<string, string>,
  disabled: boolean | undefined,
  onChange: (name: string, value: unknown) => void
) {
  const error = errors[field.name];
  const value = values[field.name];

  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          label={field.label}
          name={field.name}
          placeholder={field.placeholder}
          helper={field.helper}
          error={error}
          required={field.validation?.required}
          disabled={disabled}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    case "select":
      return (
        <Select
          label={field.label}
          name={field.name}
          helper={field.helper}
          error={error}
          required={field.validation?.required}
          disabled={disabled}
          value={String(value ?? "")}
          placeholder="Seleccionar…"
          options={field.options?.map((opt) => ({ label: opt.label, value: opt.value })) ?? []}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    case "radio":
      return (
        <div className="space-y-1.5">
          <RadioGroup
            legend={field.label}
            name={field.name}
            value={String(value ?? "")}
            onChange={(v) => onChange(field.name, v)}
            options={
              field.options?.map((opt) => ({ label: opt.label, value: opt.value })) ?? []
            }
          />
          {field.helper && !error ? (
            <p className="text-xs text-muted">{field.helper}</p>
          ) : null}
          {error ? (
            <p className="text-xs text-primary" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      );
    case "checkbox":
      return (
        <div className="space-y-1.5">
          <Checkbox
            label={field.label}
            name={field.name}
            description={field.helper}
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(e) => onChange(field.name, e.target.checked)}
          />
          {error ? (
            <p className="text-xs text-primary" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      );
    case "file":
      return (
        <Input
          label={field.label}
          name={field.name}
          type="file"
          helper={field.helper ?? "Preparado para carga en futuras versiones"}
          error={error}
          disabled={disabled}
          onChange={(e) => onChange(field.name, e.target.files?.[0]?.name ?? "")}
        />
      );
    default: {
      const inputType =
        field.type === "email"
          ? "email"
          : field.type === "phone"
            ? "tel"
            : field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "time"
                  ? "time"
                  : "text";

      return (
        <Input
          label={field.label}
          name={field.name}
          type={inputType}
          placeholder={field.placeholder}
          helper={field.helper}
          error={error}
          required={field.validation?.required}
          disabled={disabled}
          value={String(value ?? field.defaultValue ?? "")}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    }
  }
}
