"use client";

import { Input, Label, Textarea } from "@/components/ui";
import { MediaField } from "@/components/media/MediaPicker";
import { BlockDataSourceEditor } from "./BlockDataSourceEditor";
import type { PageBlock } from "@/types/page";

interface BlockEditorProps {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
  tenant: string;
}

function updateSetting(
  block: PageBlock,
  key: string,
  value: unknown,
  onChange: (block: PageBlock) => void
) {
  onChange({
    ...block,
    settings: { ...block.settings, [key]: value },
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function BlockEditor({ block, onChange, tenant }: BlockEditorProps) {
  const s = block.settings;

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <Field label="Título / Nombre institución">
            <Input
              value={String(s.institutionName ?? "")}
              onChange={(e) => updateSetting(block, "institutionName", e.target.value, onChange)}
            />
          </Field>
          <Field label="Lema">
            <Input
              value={String(s.motto ?? "")}
              onChange={(e) => updateSetting(block, "motto", e.target.value, onChange)}
            />
          </Field>
          <MediaField
            label="Imagen hero"
            value={String(s.heroImage ?? "")}
            onChange={(v) => updateSetting(block, "heroImage", v, onChange)}
            tenant={tenant}
            folder="Hero"
            category="Imagen"
          />
          <MediaField
            label="Logo"
            value={String(s.logoSrc ?? "")}
            onChange={(v) => updateSetting(block, "logoSrc", v, onChange)}
            tenant={tenant}
            folder="Logos"
            category="Imagen"
          />
          <Field label="Texto del botón">
            <Input
              value={String(s.ctaLabel ?? "")}
              onChange={(e) => updateSetting(block, "ctaLabel", e.target.value, onChange)}
            />
          </Field>
          <Field label="Enlace del botón">
            <Input
              value={String(s.ctaHref ?? "")}
              onChange={(e) => updateSetting(block, "ctaHref", e.target.value, onChange)}
            />
          </Field>
        </div>
      );

    case "text":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Contenido">
            <Textarea value={String(s.body ?? "")} onChange={(e) => updateSetting(block, "body", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "presentation":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Texto del versículo">
            <Textarea value={String(s.verseText ?? "")} onChange={(e) => updateSetting(block, "verseText", e.target.value, onChange)} />
          </Field>
          <Field label="Referencia">
            <Input value={String(s.verseReference ?? "")} onChange={(e) => updateSetting(block, "verseReference", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-4">
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Botón principal">
            <Input value={String(s.primaryLabel ?? "")} onChange={(e) => updateSetting(block, "primaryLabel", e.target.value, onChange)} />
          </Field>
          <Field label="Enlace principal">
            <Input value={String(s.primaryHref ?? "")} onChange={(e) => updateSetting(block, "primaryHref", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "programs":
    case "news":
    case "teachers":
    case "events":
    case "testimonials":
    case "gallery":
    case "library":
      return <BlockDataSourceEditor block={block} onChange={onChange} />;

    case "stats":
      return (
        <div className="space-y-4">
          <Field label="Título de sección">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Estadísticas (JSON)">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.items ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "items", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore invalid json while typing */
                }
              }}
            />
          </Field>
        </div>
      );

    case "verse":
      return (
        <div className="space-y-4">
          <Field label="Texto">
            <Textarea value={String(s.text ?? "")} onChange={(e) => updateSetting(block, "text", e.target.value, onChange)} />
          </Field>
          <Field label="Referencia">
            <Input value={String(s.reference ?? "")} onChange={(e) => updateSetting(block, "reference", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "html":
    case "markdown":
      return (
        <Field label="Contenido">
          <Textarea
            className="min-h-48 font-mono text-xs"
            value={String(s.content ?? "")}
            onChange={(e) => updateSetting(block, "content", e.target.value, onChange)}
          />
        </Field>
      );

    default:
      return (
        <p className="text-caption text-muted">
          Editor básico no disponible para este bloque.
        </p>
      );
  }
}
