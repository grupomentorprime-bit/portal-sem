"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Eye, EyeOff, Monitor, Smartphone, Tablet } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ADMISSION_SECTION_GROUPS,
  ADMISSION_SECTION_META,
  getAdmissionPreviewUrl,
} from "@/lib/admin/admission-section-meta";
import {
  reorderAdmissionSections,
  sortAdmissionSections,
} from "@/lib/portal/admission-sections";
import type { AdmissionConfig, AdmissionSectionId } from "@/types/admission";
import { ADMISSION_SECTION_LABELS } from "@/types/admission";
import { AdmissionSectionEditor } from "./AdmissionSectionEditor";
import { AdmissionSortableList } from "./AdmissionSortableList";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PreviewDevice = "desktop" | "tablet" | "mobile";

interface AdmissionCmsClientProps {
  initialConfig: AdmissionConfig;
  tenant: string;
}

const PREVIEW_WIDTH: Record<PreviewDevice, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const PREVIEW_HEIGHT: Record<PreviewDevice, string> = {
  desktop: "640px",
  tablet: "720px",
  mobile: "760px",
};

export function AdmissionCmsClient({ initialConfig, tenant }: AdmissionCmsClientProps) {
  const [config, setConfig] = useState(initialConfig);
  const [baseline, setBaseline] = useState(initialConfig);
  const [activeSection, setActiveSection] = useState<AdmissionSectionId>("hero");
  const [selectedClosingBlockId, setSelectedClosingBlockId] = useState<string | null>(
    initialConfig.closing.blocks[0]?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [showPreview, setShowPreview] = useState(true);

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(baseline),
    [config, baseline]
  );

  const previewUrl = useMemo(
    () => getAdmissionPreviewUrl(config, activeSection),
    [config, activeSection]
  );

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleSave = useCallback(
    async (publish = false) => {
      setSaveStatus("saving");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/cms/admission-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...config,
            saveDraft: !publish,
            publish,
          }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          setErrorMessage(data.error ?? "No se pudo guardar el Centro de Admisión.");
          setSaveStatus("error");
          return;
        }

        setConfig(data.config);
        setBaseline(data.config);
        setSaveStatus("saved");
      } catch {
        setErrorMessage("Error de red al guardar.");
        setSaveStatus("error");
      }
    },
    [config]
  );

  const sections = sortAdmissionSections(config.sections);
  const sectionMeta = ADMISSION_SECTION_META[activeSection];

  const sectionItemsByGroup = useMemo(() => {
    return ADMISSION_SECTION_GROUPS.map((group) => ({
      ...group,
      items: sections
        .filter((section) => ADMISSION_SECTION_META[section.id].group === group.id)
        .map((section) => ({
          id: section.id,
          label: section.label,
          subtitle: ADMISSION_SECTION_META[section.id].description,
          enabled: section.enabled,
        })),
    }));
  }, [sections]);

  return (
    <AdminModuleLayout
      className="admission-cms"
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Centro de admisión" },
      ]}
      title="Centro de Admisión"
      description="Editor visual del portal de postulación. Configure hero, programas, requisitos y formulario desde un solo lugar."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {isDirty ? (
            <Badge variant="warning">Cambios sin guardar</Badge>
          ) : saveStatus === "saved" ? (
            <Badge variant="success">Guardado</Badge>
          ) : config.publishStatus ? (
            <Badge variant={config.publishStatus === "published" ? "success" : "warning"}>
              {config.publishStatus === "published" ? "Publicado" : "Borrador"}
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((value) => !value)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" aria-hidden />
                Ocultar preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" aria-hidden />
                Preview
              </>
            )}
          </Button>

          <Link
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-background-muted"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ver sección
          </Link>

          <Link
            href="/admision"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-background-muted"
          >
            Ver portal
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSave(false)}
            disabled={!isDirty || saveStatus === "saving"}
          >
            Guardar borrador
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave(true)}
            disabled={!isDirty || saveStatus === "saving"}
          >
            {saveStatus === "saving" ? "Guardando…" : "Publicar"}
          </Button>
        </div>
      }
      sidebar={
        <div className="admission-cms__sidebar space-y-5">
          {sectionItemsByGroup.map((group) =>
            group.items.length > 0 ? (
              <div key={group.id}>
                <p className="admission-cms__sidebar-group mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {group.label}
                </p>
                <AdmissionSortableList
                  items={group.items}
                  selectedId={activeSection}
                  onSelect={(id) => setActiveSection(id as AdmissionSectionId)}
                  onReorder={(draggedId, targetId) => {
                    setConfig((prev) => ({
                      ...prev,
                      sections: reorderAdmissionSections(
                        prev.sections,
                        draggedId as AdmissionSectionId,
                        targetId as AdmissionSectionId
                      ),
                    }));
                  }}
                  onToggleEnabled={(id) => {
                    setConfig((prev) => ({
                      ...prev,
                      sections: prev.sections.map((section) =>
                        section.id === id ? { ...section, enabled: !section.enabled } : section
                      ),
                    }));
                  }}
                />
              </div>
            ) : null
          )}

          <div className="rounded-xl border border-border bg-background-soft p-3 text-xs text-muted">
            <p className="font-medium text-foreground">Consejo</p>
            <p className="mt-1 leading-relaxed">
              Arrastre las secciones para cambiar el orden en el portal. Use el interruptor para
              ocultar bloques sin perder su contenido.
            </p>
          </div>
        </div>
      }
    >
      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div
        className={
          showPreview
            ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,36%)]"
            : "grid gap-6"
        }
      >
        <div className="min-w-0 space-y-5">
          <div className="admission-cms__section-header flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-background p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {ADMISSION_SECTION_GROUPS.find((group) => group.id === sectionMeta.group)?.label}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {ADMISSION_SECTION_LABELS[activeSection]}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">{sectionMeta.description}</p>
            </div>

            {activeSection === "closing" ? (
              <Switch
                checked={config.closing.enabled}
                onChange={(enabled: boolean) =>
                  setConfig((prev) => ({
                    ...prev,
                    closing: { ...prev.closing, enabled },
                  }))
                }
                label="Sección activa"
              />
            ) : null}
          </div>

          <div className="admission-cms__editor rounded-xl border border-border bg-background p-5 sm:p-6">
            <AdmissionSectionEditor
              sectionId={activeSection}
              config={config}
              tenant={tenant}
              onChange={setConfig}
              selectedClosingBlockId={selectedClosingBlockId}
              onSelectClosingBlock={setSelectedClosingBlockId}
            />
          </div>
        </div>

        {showPreview ? (
          <aside className="admission-cms__preview xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-xl border border-border bg-background-soft p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Vista previa en vivo</p>
                  <p className="text-xs text-muted">Sección: {ADMISSION_SECTION_LABELS[activeSection]}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: "desktop", label: "Escritorio", icon: Monitor },
                      { id: "tablet", label: "Tablet", icon: Tablet },
                      { id: "mobile", label: "Móvil", icon: Smartphone },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPreviewDevice(id)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                        previewDevice === id
                          ? "bg-primary text-text-inverse"
                          : "bg-background text-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-auto rounded-lg border border-border bg-background p-2">
                <iframe
                  key={previewUrl}
                  title={`Preview ${ADMISSION_SECTION_LABELS[activeSection]}`}
                  src={previewUrl}
                  className="rounded border-0"
                  style={{
                    width: PREVIEW_WIDTH[previewDevice],
                    maxWidth: "100%",
                    height: PREVIEW_HEIGHT[previewDevice],
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-muted">
                El preview navega a{" "}
                <Link href={previewUrl} className="font-medium text-primary underline" target="_blank">
                  {previewUrl}
                </Link>
              </p>
            </div>
          </aside>
        ) : null}
      </div>
    </AdminModuleLayout>
  );
}
