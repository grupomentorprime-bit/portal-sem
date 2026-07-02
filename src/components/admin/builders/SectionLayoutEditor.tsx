"use client";

import {
  InspectorAlignment,
  InspectorPanel,
  InspectorSection,
  InspectorTextField,
  InspectorTextarea,
  InspectorImagePicker,
  InspectorVideoPicker,
} from "@/components/visual-builder";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CmsSectionLayout, CmsSectionSeo } from "@/types/cms-shared";

interface SectionLayoutEditorProps {
  layout: CmsSectionLayout;
  seo?: CmsSectionSeo;
  tenant: string;
  onLayoutChange: (layout: CmsSectionLayout) => void;
  onSeoChange?: (seo: CmsSectionSeo) => void;
  showHeader?: boolean;
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

export function SectionLayoutEditor({
  layout,
  seo,
  tenant,
  onLayoutChange,
  onSeoChange,
  showHeader = true,
}: SectionLayoutEditorProps) {
  const patch = (partial: Partial<CmsSectionLayout>) =>
    onLayoutChange({ ...layout, ...partial });

  const patchBg = (partial: Partial<NonNullable<CmsSectionLayout["background"]>>) =>
    patch({
      background: {
        type: layout.background?.type ?? "color",
        ...layout.background,
        ...partial,
      },
    });

  return (
    <InspectorPanel title="Inspector de sección">
      {showHeader ? (
        <InspectorSection section="content">
          <InspectorTextField
            label="Badge superior"
            value={layout.badge ?? ""}
            onChange={(badge) => patch({ badge })}
          />
          <InspectorTextField
            label="Título"
            value={layout.title ?? ""}
            onChange={(title) => patch({ title })}
          />
          <InspectorTextField
            label="Subtítulo"
            value={layout.subtitle ?? ""}
            onChange={(subtitle) => patch({ subtitle })}
          />
          <InspectorTextarea
            label="Descripción"
            value={layout.description ?? ""}
            onChange={(description) => patch({ description })}
          />
        </InspectorSection>
      ) : null}

      <SubSection title="Fondo y diseño">
        <Select
          label="Tipo de fondo"
          value={layout.background?.type ?? "color"}
          onChange={(e) =>
            patchBg({ type: e.target.value as NonNullable<CmsSectionLayout["background"]>["type"] })
          }
          options={[
            { value: "color", label: "Color" },
            { value: "image", label: "Imagen" },
            { value: "video", label: "Video" },
            { value: "gradient", label: "Gradiente" },
          ]}
        />
        {layout.background?.type === "color" || !layout.background?.type ? (
          <InspectorTextField
            label="Color"
            value={layout.background?.color ?? ""}
            onChange={(color) => patchBg({ type: "color", color })}
          />
        ) : null}
        {layout.background?.type === "gradient" ? (
          <InspectorTextField
            label="Gradiente CSS"
            value={layout.background?.gradient ?? ""}
            onChange={(gradient) => patchBg({ type: "gradient", gradient })}
          />
        ) : null}
        {layout.background?.type === "image" ? (
          <InspectorImagePicker
            label="Imagen de fondo"
            tenant={tenant}
            folder="Galería"
            value={layout.background?.imageMediaId ?? ""}
            onChange={(imageMediaId) => patchBg({ type: "image", imageMediaId })}
          />
        ) : null}
        {layout.background?.type === "video" ? (
          <InspectorVideoPicker
            label="Video de fondo"
            tenant={tenant}
            folder="Videos"
            value={layout.background?.videoMediaId ?? ""}
            onChange={(videoMediaId) => patchBg({ type: "video", videoMediaId })}
          />
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Overlay (%)</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={layout.background?.overlay ?? 0}
            onChange={(e) => patchBg({ overlay: Number(e.target.value) })}
          />
        </label>
        <InspectorAlignment
          label="Alineación"
          value={layout.alignment ?? "left"}
          onChange={(alignment) => patch({ alignment })}
        />
        <Select
          label="Ancho máximo"
          value={layout.maxWidth ?? "lg"}
          onChange={(e) => patch({ maxWidth: e.target.value as CmsSectionLayout["maxWidth"] })}
          options={[
            { value: "sm", label: "Pequeño" },
            { value: "md", label: "Mediano" },
            { value: "lg", label: "Grande" },
            { value: "full", label: "Completo" },
          ]}
        />
        <Select
          label="Animación"
          value={layout.animation ?? "none"}
          onChange={(e) => patch({ animation: e.target.value as CmsSectionLayout["animation"] })}
          options={[
            { value: "none", label: "Ninguna" },
            { value: "fade", label: "Fade" },
            { value: "slide", label: "Slide" },
            { value: "zoom", label: "Zoom" },
          ]}
        />
        <Switch
          checked={Boolean(layout.muted)}
          onChange={(muted) => patch({ muted })}
          label="Fondo suave"
        />
      </SubSection>

      {onSeoChange ? (
        <SubSection title="SEO y ancla">
          <InspectorTextField
            label="Ancla (id)"
            value={seo?.anchor ?? ""}
            onChange={(anchor) => onSeoChange({ ...seo, anchor })}
          />
          <InspectorTextField
            label="Slug"
            value={seo?.slug ?? ""}
            onChange={(slug) => onSeoChange({ ...seo, slug })}
          />
          <InspectorTextField
            label="Meta título"
            value={seo?.title ?? ""}
            onChange={(title) => onSeoChange({ ...seo, title })}
          />
          <InspectorTextarea
            label="Meta descripción"
            value={seo?.description ?? ""}
            onChange={(description) => onSeoChange({ ...seo, description })}
          />
          <InspectorImagePicker
            label="Open Graph"
            tenant={tenant}
            folder="Otros"
            value={seo?.openGraphImageId ?? ""}
            onChange={(openGraphImageId) => onSeoChange({ ...seo, openGraphImageId })}
          />
        </SubSection>
      ) : null}
    </InspectorPanel>
  );
}
