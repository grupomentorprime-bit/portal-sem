"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import {
  Eye,
  LayoutTemplate,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { MediaField } from "@/components/media/MediaPicker";
import { BuilderShell } from "@/components/admin/builders/BuilderShell";
import { AdmissionSortableList } from "@/components/admin/admission/AdmissionSortableList";
import { FormPublicExperience } from "@/components/portal/forms/FormPublicExperience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { reorderFormExperienceBlocks } from "@/lib/cms/form-experience-utils";
import { counterDateInputValue, normalizeChileEventTime } from "@/lib/experience/forms/convocatoria-event-datetime";
import { publicFormUrl } from "@/lib/admin/forms-center";
import type {
  ExperienceFormExperience,
  FormExperienceBanner,
  FormExperienceInfoCard,
  FormExperienceInfoIcon,
  FormExperienceStateKey,
  FormExperienceTemplateId,
} from "@/types/experience-form-experience";
import {
  FORM_EXPERIENCE_BLOCK_LABELS,
  FORM_EXPERIENCE_TEMPLATE_IDS,
} from "@/types/experience-form-experience";
import { createCmsId } from "@/types/cms-shared";
import { FormExperienceAppearancePanel } from "./FormExperienceAppearancePanel";
import { FormExperienceSeoPanel } from "./FormExperienceSeoPanel";

function extractMediaIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/(media-[a-z0-9-]+)(?:\/|\.|$)/i);
  return match?.[1];
}

function withRecoveredConfirmationEmailMediaId(
  experience: ExperienceFormExperience
): ExperienceFormExperience {
  const url = experience.formShell.confirmationEmailCtaUrl?.trim();
  const mediaId = experience.formShell.confirmationEmailCtaMediaId?.trim();
  if (!url || mediaId) return experience;

  const recovered = extractMediaIdFromUrl(url);
  if (!recovered) return experience;

  return {
    ...experience,
    formShell: {
      ...experience.formShell,
      confirmationEmailCtaMediaId: recovered,
    },
  };
}

type EditorSection =
  | "blocks"
  | "hero"
  | "cards"
  | "editorial"
  | "form"
  | "states"
  | "banners"
  | "counter"
  | "footer"
  | "share";

type PreviewViewport = "desktop" | "tablet" | "mobile";

const INFO_ICON_OPTIONS: FormExperienceInfoIcon[] = [
  "calendar",
  "map-pin",
  "users",
  "book",
  "heart",
  "clock",
  "sparkles",
  "message",
  "shirt",
  "utensils",
  "door-open",
  "clipboard-check",
];

const STATE_KEYS: FormExperienceStateKey[] = [
  "open",
  "closed",
  "comingSoon",
  "full",
  "readonly",
  "expired",
  "archived",
  "inactive",
  "hidden",
  "notFound",
];

const STATE_LABELS: Record<FormExperienceStateKey, string> = {
  open: "Formulario abierto",
  closed: "Formulario cerrado",
  comingSoon: "Próximamente",
  full: "Cupos completos",
  readonly: "Sólo lectura",
  expired: "Fuera de plazo",
  archived: "Archivado",
  inactive: "No abierto",
  hidden: "No publicado",
  notFound: "No encontrado",
};

interface FormExperienceEditorProps {
  formId: string;
  formName: string;
  tenantId: string;
  mode: "experience" | "seo" | "appearance";
  isConvocatoria?: boolean;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function FormExperienceEditor({
  formId,
  formName,
  tenantId,
  mode,
  isConvocatoria = false,
}: FormExperienceEditorProps) {
  const [experience, setExperience] = useState<ExperienceFormExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<EditorSection>("blocks");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<FormExperienceStateKey>("open");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/form-experience/${formId}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo cargar la experiencia.");
        return;
      }
      setExperience(withRecoveredConfirmationEmailMediaId(data.experience));
    } catch {
      setError("Error de red al cargar la experiencia.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const save = async (options?: { publish?: boolean; saveDraft?: boolean }) => {
    if (!experience) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/cms/form-experience/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...experience, ...options }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Error al guardar.");
        return;
      }
      setExperience(withRecoveredConfirmationEmailMediaId(data.experience));
      setSaved(true);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (templateId: FormExperienceTemplateId) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/form-experience/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applyTemplate: templateId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo aplicar la plantilla.");
        return;
      }
      setExperience(withRecoveredConfirmationEmailMediaId(data.experience));
      setSaved(true);
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<ExperienceFormExperience>) => {
    if (!experience) return;
    setExperience({ ...experience, ...patch });
    setSaved(false);
  };

  const sortedCards = useMemo(
    () => [...(experience?.infoCards ?? [])].sort((a, b) => a.order - b.order),
    [experience?.infoCards]
  );

  const sortedBanners = useMemo(
    () => [...(experience?.banners ?? [])].sort((a, b) => a.order - b.order),
    [experience?.banners]
  );

  const selectedCard = sortedCards.find((card) => card.id === selectedCardId) ?? sortedCards[0];
  const selectedBanner =
    sortedBanners.find((banner) => banner.id === selectedBannerId) ?? sortedBanners[0];

  if (loading) {
    return <p className="text-sm text-muted">Cargando experiencia del formulario…</p>;
  }

  if (!experience) {
    return <p className="text-sm text-[var(--color-danger)]">{error ?? "Experiencia no disponible."}</p>;
  }

  if (mode === "seo") {
    return (
      <div className="space-y-4">
        {error ? <p className="admin-form-detail__alert admin-form-detail__alert--error">{error}</p> : null}
        {saved ? (
          <p className="admin-form-detail__alert admin-form-detail__alert--success">Guardado correctamente.</p>
        ) : null}
        <FormExperienceSeoPanel
          tenantId={tenantId}
          seo={experience.seo}
          share={experience.share}
          onChangeSeo={(seo) => update({ seo })}
          onChangeShare={(share) => update({ share })}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => save({ publish: true })} loading={saving}>
            Publicar
          </Button>
          <Button variant="secondary" onClick={() => save({ saveDraft: true })} loading={saving}>
            Guardar borrador
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "appearance") {
    return (
      <div className="space-y-4">
        {error ? <p className="admin-form-detail__alert admin-form-detail__alert--error">{error}</p> : null}
        {saved ? (
          <p className="admin-form-detail__alert admin-form-detail__alert--success">Guardado correctamente.</p>
        ) : null}
        <FormExperienceAppearancePanel
          appearance={experience.appearance}
          onChange={(appearance) => update({ appearance })}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => save({ publish: true })} loading={saving}>
            Publicar
          </Button>
          <Button variant="secondary" onClick={() => save({ saveDraft: true })} loading={saving}>
            Guardar borrador
          </Button>
        </div>
      </div>
    );
  }

  const blockItems = [...experience.blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => ({
      id: block.id,
      label: FORM_EXPERIENCE_BLOCK_LABELS[block.type],
      subtitle: block.enabled ? "Visible" : "Oculto",
      enabled: block.enabled,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm">
            <LayoutTemplate className="h-4 w-4 text-muted" aria-hidden />
            <span className="text-muted">Plantilla:</span>
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value as FormExperienceTemplateId;
                if (value) void applyTemplate(value);
                e.target.value = "";
              }}
            >
              <option value="">Aplicar plantilla…</option>
              {FORM_EXPERIENCE_TEMPLATE_IDS.map((id) => (
                <option key={id} value={id}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen((v) => !v)}>
            <Eye className="mr-1.5 h-4 w-4" aria-hidden />
            Vista previa
          </Button>
          <a
            href={publicFormUrl(formId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary/30"
          >
            Abrir público
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => save({ publish: true })} loading={saving}>
            Publicar
          </Button>
          <Button variant="secondary" onClick={() => save({ saveDraft: true })} loading={saving}>
            Guardar borrador
          </Button>
        </div>
      </div>

      {error ? <p className="admin-form-detail__alert admin-form-detail__alert--error">{error}</p> : null}
      {saved ? (
        <p className="admin-form-detail__alert admin-form-detail__alert--success">Guardado correctamente.</p>
      ) : null}

      {previewOpen ? (
        <div className="rounded-xl border border-border bg-background-muted p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Vista previa</span>
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([viewport, Icon]) => (
              <button
                key={viewport}
                type="button"
                onClick={() => setPreviewViewport(viewport)}
                className={`admin-form-detail__viewport-tab ${
                  previewViewport === viewport ? "admin-form-detail__viewport-tab--active" : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {viewport}
              </button>
            ))}
          </div>
          <div
            className={`mx-auto overflow-hidden rounded-lg border border-border bg-white transition-all ${
              previewViewport === "desktop"
                ? "w-full"
                : previewViewport === "tablet"
                  ? "max-w-[768px]"
                  : "max-w-[390px]"
            }`}
          >
            <FormPublicExperience experience={experience}>
              <div className="p-6 text-sm text-muted">Vista previa del formulario ({formName})</div>
            </FormPublicExperience>
          </div>
        </div>
      ) : null}

      <div className="admin-form-detail__section-nav">
        {(
          [
            ["blocks", "Bloques"],
            ["hero", "Hero"],
            ["cards", "Tarjetas"],
            ["editorial", "Editorial"],
            ["form", "Formulario"],
            ["states", "Estados"],
            ["banners", "Banners"],
            ["counter", "Contador"],
            ["footer", "Footer"],
            ["share", "Compartir"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`admin-form-detail__section-tab ${
              section === id ? "admin-form-detail__section-tab--active" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "blocks" ? (
        <AdmissionSortableList
          items={blockItems}
          selectedId={null}
          onSelect={() => undefined}
          onReorder={(draggedId, targetId) => {
            update({ blocks: reorderFormExperienceBlocks(experience.blocks, draggedId, targetId) });
          }}
          onToggleEnabled={(id) => {
            update({
              blocks: experience.blocks.map((block) =>
                block.id === id ? { ...block, enabled: !block.enabled } : block
              ),
            });
          }}
        />
      ) : null}

      {section === "hero" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Switch
            checked={experience.hero.enabled}
            onChange={(enabled) => update({ hero: { ...experience.hero, enabled } })}
            label="Mostrar hero"
          />
          <Switch
            checked={experience.hero.showBreadcrumb}
            onChange={(showBreadcrumb) => update({ hero: { ...experience.hero, showBreadcrumb } })}
            label="Mostrar breadcrumb"
          />
          <Field label="Eyebrow">
            <Input
              value={experience.hero.eyebrow}
              onChange={(e) => update({ hero: { ...experience.hero, eyebrow: e.target.value } })}
            />
          </Field>
          <Field label="Altura">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={experience.hero.height}
              onChange={(e) =>
                update({
                  hero: {
                    ...experience.hero,
                    height: e.target.value as ExperienceFormExperience["hero"]["height"],
                  },
                })
              }
            >
              <option value="compact">Compacta</option>
              <option value="default">Estándar</option>
              <option value="tall">Alta</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Título">
              <Input
                value={experience.hero.headline}
                onChange={(e) => update({ hero: { ...experience.hero, headline: e.target.value } })}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Subtítulo">
              <Textarea
                rows={2}
                value={experience.hero.subheadline}
                onChange={(e) => update({ hero: { ...experience.hero, subheadline: e.target.value } })}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Mensaje destacado">
              <Textarea
                rows={2}
                value={experience.hero.motivational ?? ""}
                onChange={(e) => update({ hero: { ...experience.hero, motivational: e.target.value } })}
              />
            </Field>
          </div>
          <Field label="Overlay (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={experience.hero.overlayOpacity}
              onChange={(e) =>
                update({ hero: { ...experience.hero, overlayOpacity: Number(e.target.value) || 0 } })
              }
            />
          </Field>
          <Field label="Color del hero">
            <Input
              value={experience.hero.heroColor ?? ""}
              onChange={(e) => update({ hero: { ...experience.hero, heroColor: e.target.value } })}
              placeholder="Color primario institucional"
            />
          </Field>
          <div className="md:col-span-2">
            <MediaField
              label="Imagen de fondo"
              tenant={tenantId}
              folder="Hero"
              value={experience.hero.mediaId ?? ""}
              onChange={(mediaId) =>
                update({
                  hero: {
                    ...experience.hero,
                    mediaId,
                  },
                })
              }
              onAssetChange={(asset) =>
                update({
                  hero: {
                    ...experience.hero,
                    mediaUrl: asset?.url,
                  },
                })
              }
            />
          </div>
        </div>
      ) : null}

      {section === "cards" ? (
        <BuilderShell
          items={sortedCards.map((card) => ({
            id: card.id,
            label: card.label,
            subtitle: card.value,
          }))}
          selectedId={selectedCard?.id ?? null}
          onSelect={setSelectedCardId}
          onReorder={(draggedId, targetId) => {
            const from = sortedCards.findIndex((c) => c.id === draggedId);
            const to = sortedCards.findIndex((c) => c.id === targetId);
            if (from < 0 || to < 0) return;
            const next = [...sortedCards];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            update({
              infoCards: next.map((card, index) => ({ ...card, order: index })),
            });
          }}
          onAdd={() => {
            const card: FormExperienceInfoCard = {
              id: createCmsId("info"),
              icon: "calendar",
              label: "Nueva tarjeta",
              value: "",
              order: experience.infoCards.length,
              visible: true,
            };
            update({ infoCards: [...experience.infoCards, card] });
            setSelectedCardId(card.id);
          }}
          onRemove={(id) => {
            update({ infoCards: experience.infoCards.filter((card) => card.id !== id) });
          }}
          addLabel="Agregar tarjeta"
        >
          {selectedCard ? (
            <div className="space-y-4">
              <Switch
                checked={selectedCard.visible}
                onChange={(visible) =>
                  update({
                    infoCards: experience.infoCards.map((card) =>
                      card.id === selectedCard.id ? { ...card, visible } : card
                    ),
                  })
                }
                label="Visible"
              />
              <Field label="Icono">
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectedCard.icon}
                  onChange={(e) =>
                    update({
                      infoCards: experience.infoCards.map((card) =>
                        card.id === selectedCard.id
                          ? { ...card, icon: e.target.value as FormExperienceInfoIcon }
                          : card
                      ),
                    })
                  }
                >
                  {INFO_ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Título">
                <Input
                  value={selectedCard.label}
                  onChange={(e) =>
                    update({
                      infoCards: experience.infoCards.map((card) =>
                        card.id === selectedCard.id ? { ...card, label: e.target.value } : card
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Valor">
                <Input
                  value={selectedCard.value}
                  onChange={(e) =>
                    update({
                      infoCards: experience.infoCards.map((card) =>
                        card.id === selectedCard.id ? { ...card, value: e.target.value } : card
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Descripción">
                <Textarea
                  rows={2}
                  value={selectedCard.description ?? ""}
                  onChange={(e) =>
                    update({
                      infoCards: experience.infoCards.map((card) =>
                        card.id === selectedCard.id ? { ...card, description: e.target.value } : card
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ) : null}
        </BuilderShell>
      ) : null}

      {section === "editorial" ? (
        <div className="space-y-4">
          <Switch
            checked={experience.editorial.enabled}
            onChange={(enabled) => update({ editorial: { ...experience.editorial, enabled } })}
            label="Mostrar bloque editorial"
          />
          <Field label="Título">
            <Input
              value={experience.editorial.title}
              onChange={(e) =>
                update({ editorial: { ...experience.editorial, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Contenido">
            <Textarea
              rows={4}
              value={experience.editorial.body}
              onChange={(e) =>
                update({ editorial: { ...experience.editorial, body: e.target.value } })
              }
            />
          </Field>
        </div>
      ) : null}

      {section === "form" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["overline", "Overline"],
              ["title", "Título del formulario"],
              ["description", "Subtítulo / descripción"],
              ["helpText", "Texto de ayuda"],
              ["beforeSubmitText", "Texto antes del botón"],
              ["afterSubmitText", "Texto después del envío"],
              ["submitLabel", "Etiqueta del botón"],
              ["searchPlaceholder", "Placeholder de búsqueda"],
              ["fieldPlaceholder", "Placeholder de campos"],
              ["successMessage", "Mensaje de éxito (experiencia)"],
              ["errorMessage", "Mensaje de error (experiencia)"],
              ["attendanceYesMessage", "Mensaje al elegir «Sí, asistiré»"],
              ["attendanceNoMessage", "Mensaje al elegir «No podré asistir»"],
              ["attendanceYesSuccessMessage", "Mensaje de éxito al confirmar asistencia"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              {key === "description" || key === "helpText" || key.includes("Text") || key.includes("Message") ? (
                <Textarea
                  rows={2}
                  value={experience.formShell[key] ?? ""}
                  onChange={(e) =>
                    update({ formShell: { ...experience.formShell, [key]: e.target.value } })
                  }
                />
              ) : (
                <Input
                  value={experience.formShell[key] ?? ""}
                  onChange={(e) =>
                    update({ formShell: { ...experience.formShell, [key]: e.target.value } })
                  }
                />
              )}
            </Field>
          ))}
          {isConvocatoria ? (
            <div className="md:col-span-2 space-y-4 rounded-lg border border-border bg-muted/10 p-4">
              <div>
                <p className="font-medium text-foreground">Correo de confirmación</p>
                <p className="text-sm text-muted">
                  Configura el botón que aparece al final del correo automático (p. ej. «Ver detalles de la
                  convocatoria»). Si no subes un documento, el botón llevará a la página pública del
                  formulario.
                </p>
              </div>
              <Field
                label="Etiqueta del botón"
                hint="Opcional. Por defecto: «Ver detalles de la convocatoria» (asistencia) o «Revisar convocatoria» (no asistencia)."
              >
                <Input
                  value={experience.formShell.confirmationEmailCtaLabel ?? ""}
                  onChange={(e) =>
                    update({
                      formShell: {
                        ...experience.formShell,
                        confirmationEmailCtaLabel: e.target.value,
                      },
                    })
                  }
                  placeholder="Ver detalles de la convocatoria"
                />
              </Field>
              <MediaField
                label="Documento del botón"
                description="Sube un PDF u otro archivo desde la biblioteca de medios. El botón del correo abrirá este documento. Para reemplazarlo, haz clic en «Cambiar documento» y elige otro archivo."
                tenant={tenantId}
                folder="Documentos"
                changeLabel="Cambiar documento"
                value={experience.formShell.confirmationEmailCtaMediaId ?? ""}
                onChange={(confirmationEmailCtaMediaId) =>
                  update({
                    formShell: {
                      ...experience.formShell,
                      confirmationEmailCtaMediaId,
                      ...(confirmationEmailCtaMediaId
                        ? {}
                        : { confirmationEmailCtaUrl: "" }),
                    },
                  })
                }
                onAssetChange={(asset) =>
                  update({
                    formShell: {
                      ...experience.formShell,
                      confirmationEmailCtaMediaId: asset?._id ?? "",
                      confirmationEmailCtaUrl: asset?.url ?? "",
                    },
                  })
                }
              />
              {experience.formShell.confirmationEmailCtaUrl ||
              experience.formShell.confirmationEmailCtaMediaId ? (
                <div className="md:col-span-2 space-y-2">
                  <p className="text-sm text-muted">
                    Después de guardar, abre el enlace de prueba. Si ves un error, vuelve a subir el PDF
                    desde la biblioteca de medios.
                  </p>
                  {experience.formShell.confirmationEmailCtaUrl ? (
                    <a
                      href={experience.formShell.confirmationEmailCtaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Probar descarga del documento
                    </a>
                  ) : null}
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        update({
                          formShell: {
                            ...experience.formShell,
                            confirmationEmailCtaMediaId: "",
                            confirmationEmailCtaUrl: "",
                          },
                        })
                      }
                    >
                      Quitar documento
                    </Button>
                  </div>
                </div>
              ) : null}
              <Field
                label="Enlace alternativo"
                hint="Opcional. Pega una URL externa si prefieres no usar la biblioteca de medios."
              >
                <Input
                  type="url"
                  value={experience.formShell.confirmationEmailCtaUrl ?? ""}
                  onChange={(e) =>
                    update({
                      formShell: {
                        ...experience.formShell,
                        confirmationEmailCtaUrl: e.target.value,
                        ...(e.target.value.trim()
                          ? {}
                          : { confirmationEmailCtaMediaId: "" }),
                      },
                    })
                  }
                  placeholder="https://…"
                />
              </Field>
            </div>
          ) : null}
        </div>
      ) : null}

      {section === "states" ? (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-1">
            {STATE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedState(key)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedState === key ? "bg-primary/10 text-primary" : "text-muted hover:bg-background-muted"
                }`}
              >
                {STATE_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {(() => {
              const state = experience.states[selectedState] ?? {
                title: "",
                description: "",
              };
              return (
                <>
                  <Field label="Título">
                    <Input
                      value={state.title}
                      onChange={(e) =>
                        update({
                          states: {
                            ...experience.states,
                            [selectedState]: { ...state, title: e.target.value },
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="Texto">
                    <Textarea
                      rows={3}
                      value={state.description}
                      onChange={(e) =>
                        update({
                          states: {
                            ...experience.states,
                            [selectedState]: { ...state, description: e.target.value },
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="CTA">
                    <Input
                      value={state.ctaLabel ?? ""}
                      onChange={(e) =>
                        update({
                          states: {
                            ...experience.states,
                            [selectedState]: { ...state, ctaLabel: e.target.value },
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="Enlace CTA">
                    <Input
                      value={state.ctaHref ?? ""}
                      onChange={(e) =>
                        update({
                          states: {
                            ...experience.states,
                            [selectedState]: { ...state, ctaHref: e.target.value },
                          },
                        })
                      }
                    />
                  </Field>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

      {section === "banners" ? (
        <BuilderShell
          items={sortedBanners.map((banner) => ({
            id: banner.id,
            label: banner.title,
            subtitle: banner.body,
          }))}
          selectedId={selectedBanner?.id ?? null}
          onSelect={setSelectedBannerId}
          onReorder={(draggedId, targetId) => {
            const from = sortedBanners.findIndex((b) => b.id === draggedId);
            const to = sortedBanners.findIndex((b) => b.id === targetId);
            if (from < 0 || to < 0) return;
            const next = [...sortedBanners];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            update({ banners: next.map((banner, index) => ({ ...banner, order: index })) });
          }}
          onAdd={() => {
            const banner: FormExperienceBanner = {
              id: createCmsId("banner"),
              icon: "book",
              title: "Nuevo aviso",
              tone: "info",
              priority: 0,
              visible: true,
              order: experience.banners.length,
            };
            update({ banners: [...experience.banners, banner] });
            setSelectedBannerId(banner.id);
          }}
          onRemove={(id) => {
            update({ banners: experience.banners.filter((banner) => banner.id !== id) });
          }}
          addLabel="Agregar banner"
        >
          {selectedBanner ? (
            <div className="space-y-4">
              <Switch
                checked={selectedBanner.visible}
                onChange={(visible) =>
                  update({
                    banners: experience.banners.map((banner) =>
                      banner.id === selectedBanner.id ? { ...banner, visible } : banner
                    ),
                  })
                }
                label="Visible"
              />
              <Field label="Título">
                <Input
                  value={selectedBanner.title}
                  onChange={(e) =>
                    update({
                      banners: experience.banners.map((banner) =>
                        banner.id === selectedBanner.id ? { ...banner, title: e.target.value } : banner
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Texto">
                <Textarea
                  rows={2}
                  value={selectedBanner.body ?? ""}
                  onChange={(e) =>
                    update({
                      banners: experience.banners.map((banner) =>
                        banner.id === selectedBanner.id ? { ...banner, body: e.target.value } : banner
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Color">
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectedBanner.tone}
                  onChange={(e) =>
                    update({
                      banners: experience.banners.map((banner) =>
                        banner.id === selectedBanner.id
                          ? { ...banner, tone: e.target.value as FormExperienceBanner["tone"] }
                          : banner
                      ),
                    })
                  }
                >
                  <option value="info">Info</option>
                  <option value="warning">Advertencia</option>
                  <option value="success">Éxito</option>
                  <option value="accent">Destacado</option>
                </select>
              </Field>
            </div>
          ) : null}
        </BuilderShell>
      ) : null}

      {section === "counter" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Switch
            checked={experience.counter.enabled}
            onChange={(enabled) => update({ counter: { ...experience.counter, enabled } })}
            label="Mostrar contador"
          />
          <Field label="Etiqueta">
            <Input
              value={experience.counter.label}
              onChange={(e) => update({ counter: { ...experience.counter, label: e.target.value } })}
            />
          </Field>
          <Field label="Modo">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={experience.counter.mode}
              onChange={(e) =>
                update({
                  counter: {
                    ...experience.counter,
                    mode: e.target.value as ExperienceFormExperience["counter"]["mode"],
                  },
                })
              }
            >
              <option value="days_until">Días restantes</option>
              <option value="slots">Cupos</option>
              <option value="custom">Texto personalizado</option>
            </select>
          </Field>
          {experience.counter.mode === "days_until" ? (
            <>
              <Field label="Fecha objetivo">
                <Input
                  type="date"
                  value={counterDateInputValue(experience.counter.targetDate)}
                  onChange={(e) =>
                    update({ counter: { ...experience.counter, targetDate: e.target.value } })
                  }
                />
              </Field>
              <Field
                label="Hora de inicio"
                hint="Hora de Chile (America/Santiago). Se usa en la cuenta regresiva y en la tarjeta Horario."
              >
                <Input
                  type="time"
                  value={normalizeChileEventTime(experience.counter.targetTime)}
                  onChange={(e) =>
                    update({
                      counter: {
                        ...experience.counter,
                        targetTime: normalizeChileEventTime(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </>
          ) : null}
          {experience.counter.mode === "slots" ? (
            <Field label="Cupos restantes">
              <Input
                type="number"
                value={experience.counter.slotsRemaining ?? ""}
                onChange={(e) =>
                  update({
                    counter: {
                      ...experience.counter,
                      slotsRemaining: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </Field>
          ) : null}
          {experience.counter.mode === "custom" ? (
            <Field label="Texto">
              <Input
                value={experience.counter.customText ?? ""}
                onChange={(e) =>
                  update({ counter: { ...experience.counter, customText: e.target.value } })
                }
              />
            </Field>
          ) : null}
        </div>
      ) : null}

      {section === "footer" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Switch
            checked={experience.footer.enabled}
            onChange={(enabled) => update({ footer: { ...experience.footer, enabled } })}
            label="Mostrar pie de página"
          />
          <Field label="Correo">
            <Input
              value={experience.footer.contactEmail ?? ""}
              onChange={(e) =>
                update({ footer: { ...experience.footer, contactEmail: e.target.value } })
              }
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={experience.footer.contactPhone ?? ""}
              onChange={(e) =>
                update({ footer: { ...experience.footer, contactPhone: e.target.value } })
              }
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={experience.footer.whatsapp ?? ""}
              onChange={(e) =>
                update({ footer: { ...experience.footer, whatsapp: e.target.value } })
              }
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Mensaje pastoral">
              <Textarea
                rows={2}
                value={experience.footer.pastoralMessage ?? ""}
                onChange={(e) =>
                  update({ footer: { ...experience.footer, pastoralMessage: e.target.value } })
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Versículo">
              <Input
                value={experience.footer.verse ?? ""}
                onChange={(e) =>
                  update({ footer: { ...experience.footer, verse: e.target.value } })
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Copyright">
              <Input
                value={experience.footer.copyright ?? ""}
                onChange={(e) =>
                  update({ footer: { ...experience.footer, copyright: e.target.value } })
                }
              />
            </Field>
          </div>
        </div>
      ) : null}

      {section === "share" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Texto para WhatsApp">
            <Textarea
              rows={2}
              value={experience.share.whatsappText ?? ""}
              onChange={(e) => update({ share: { ...experience.share, whatsappText: e.target.value } })}
            />
          </Field>
          <Field label="Texto para Facebook">
            <Textarea
              rows={2}
              value={experience.share.facebookText ?? ""}
              onChange={(e) => update({ share: { ...experience.share, facebookText: e.target.value } })}
            />
          </Field>
          <Field label="Asunto de correo">
            <Input
              value={experience.share.emailSubject ?? ""}
              onChange={(e) => update({ share: { ...experience.share, emailSubject: e.target.value } })}
            />
          </Field>
          <Field label="Cuerpo de correo">
            <Textarea
              rows={2}
              value={experience.share.emailBody ?? ""}
              onChange={(e) => update({ share: { ...experience.share, emailBody: e.target.value } })}
            />
          </Field>
          <Field label="Etiqueta copiar enlace">
            <Input
              value={experience.share.copyLinkLabel ?? ""}
              onChange={(e) => update({ share: { ...experience.share, copyLinkLabel: e.target.value } })}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
