"use client";

import {
  InspectorAccordion,
  InspectorAlignment,
  InspectorImagePicker,
  InspectorSpacing,
  InspectorTextField,
  InspectorTextarea,
  InspectorVideoPicker,
  INSPECTOR_SECTION_LABELS,
} from "@/components/visual-builder";
import type { InspectorCanonicalSection } from "@/components/visual-builder/inspector/types";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getBlockSchema } from "@/lib/experience-studio/schema/definitions";
import type { SchemaField } from "@/lib/experience-studio/schema/types";
import { INSPECTOR_SECTION_ORDER } from "@/components/visual-builder/inspector/types";
import type { PageBlock } from "@/types/page";

interface SchemaInspectorProps {
  block: PageBlock;
  tenant: string;
  onChange: (block: PageBlock) => void;
}

function getSetting(block: PageBlock, key: string): string {
  const value = block.settings[key];
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function getBoolean(block: PageBlock, key: string): boolean {
  return Boolean(block.settings[key]);
}

function getNumber(block: PageBlock, key: string): number {
  const value = block.settings[key];
  return typeof value === "number" ? value : Number(value) || 0;
}

function patchSettings(
  block: PageBlock,
  key: string,
  value: unknown
): PageBlock {
  return {
    ...block,
    settings: { ...block.settings, [key]: value },
  };
}

function renderField(
  field: SchemaField,
  block: PageBlock,
  tenant: string,
  onChange: (block: PageBlock) => void
) {
  switch (field.type) {
    case "text":
    case "slug":
      return (
        <InspectorTextField
          key={field.key}
          label={field.label}
          hint={field.hint}
          required={field.required}
          value={getSetting(block, field.key)}
          onChange={(value) => onChange(patchSettings(block, field.key, value))}
        />
      );
    case "textarea":
      return (
        <InspectorTextarea
          key={field.key}
          label={field.label}
          hint={field.hint}
          required={field.required}
          value={getSetting(block, field.key)}
          onChange={(value) => onChange(patchSettings(block, field.key, value))}
        />
      );
    case "number":
      return (
        <label key={field.key} className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">{field.label}</span>
          {field.hint ? <span className="block text-xs text-muted">{field.hint}</span> : null}
          <Input
            type="number"
            value={getNumber(block, field.key)}
            onChange={(e) =>
              onChange(patchSettings(block, field.key, Number(e.target.value) || 0))
            }
          />
        </label>
      );
    case "boolean":
      return (
        <Switch
          key={field.key}
          label={field.label}
          checked={getBoolean(block, field.key)}
          onChange={(checked: boolean) => onChange(patchSettings(block, field.key, checked))}
        />
      );
    case "select":
      return (
        <label key={field.key} className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">{field.label}</span>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={getSetting(block, field.key)}
            onChange={(e) => onChange(patchSettings(block, field.key, e.target.value))}
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "image":
      return (
        <InspectorImagePicker
          key={field.key}
          tenant={tenant}
          label={field.label}
          hint={field.hint ?? "Elija de la Biblioteca de Medios institucional."}
          folder={field.folder as "Hero" | undefined}
          value={getSetting(block, field.key)}
          onChange={(mediaId) => onChange(patchSettings(block, field.key, mediaId))}
        />
      );
    case "video":
      return (
        <InspectorVideoPicker
          key={field.key}
          tenant={tenant}
          label={field.label}
          hint={field.hint ?? "Elija de la Biblioteca de Medios institucional."}
          value={getSetting(block, field.key)}
          onChange={(mediaId) => onChange(patchSettings(block, field.key, mediaId))}
        />
      );
    case "alignment":
      return (
        <InspectorAlignment
          key={field.key}
          label={field.label}
          value={(getSetting(block, field.key) as "left" | "center" | "right") || "center"}
          onChange={(value) => onChange(patchSettings(block, field.key, value))}
        />
      );
    case "spacing":
      return (
        <InspectorSpacing
          key={field.key}
          label={field.label}
          value={
            (getSetting(block, field.key) as "none" | "sm" | "md" | "lg" | "xl") || "md"
          }
          onChange={(value) => onChange(patchSettings(block, field.key, value))}
        />
      );
    default:
      return null;
  }
}

export function SchemaInspector({ block, tenant, onChange }: SchemaInspectorProps) {
  const schema = getBlockSchema(block.type);
  if (!schema) return null;

  const fieldsBySection = INSPECTOR_SECTION_ORDER.reduce(
    (acc, section) => {
      acc[section] = schema.fields.filter((f) => (f.section ?? "content") === section);
      return acc;
    },
    {} as Record<InspectorCanonicalSection, SchemaField[]>
  );

  const sections = INSPECTOR_SECTION_ORDER.map((id) => ({
    id,
    defaultOpen: id === "content",
    children: (
      <>
        {fieldsBySection[id].map((field) => renderField(field, block, tenant, onChange))}
      </>
    ),
  })).filter((section) => fieldsBySection[section.id].length > 0);

  if (sections.length === 0) return null;

  return <InspectorAccordion sections={sections} />;
}

export function SchemaInspectorTitle({ block }: { block: PageBlock }) {
  const schema = getBlockSchema(block.type);
  return schema?.label ?? block.type;
}
