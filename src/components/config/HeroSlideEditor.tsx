"use client";

import { MediaField } from "@/components/media/MediaPicker";
import { ColorPicker } from "@/components/config/ColorPicker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_HERO_FEATURES } from "@/lib/portal/hero-defaults";
import type { HeroFeature } from "@/types/hero";
import {
  HERO_ALIGNMENT_OPTIONS,
  HERO_PUBLICATION_STATUS_OPTIONS,
  HERO_SLIDE_PRIORITY_OPTIONS,
} from "@/types/hero-portal";
import type { HeroSlide, HeroSlideFloatingCard } from "@/types/hero-portal";
import { HERO_FLOATING_CARD_SOURCE_OPTIONS } from "@/types/hero-portal";

interface HeroSlideEditorProps {
  slide: HeroSlide;
  tenant: string;
  onChange: (slide: HeroSlide) => void;
  onPreviewUpdate?: (field: "desktop" | "mobile", url?: string) => void;
}

export function HeroSlideEditor({ slide, tenant, onChange, onPreviewUpdate }: HeroSlideEditorProps) {
  const update = (patch: Partial<HeroSlide>) => onChange({ ...slide, ...patch });

  const updateContent = (patch: Partial<HeroSlide["content"]>) =>
    update({ content: { ...slide.content, ...patch } });

  const updateMultimedia = (patch: Partial<HeroSlide["multimedia"]>) =>
    update({ multimedia: { ...slide.multimedia, ...patch } });

  const updateOverlay = (patch: Partial<HeroSlide["multimedia"]["overlay"]>) =>
    update({
      multimedia: {
        ...slide.multimedia,
        overlay: { ...slide.multimedia.overlay, ...patch },
      },
    });

  const updateActions = (patch: Partial<HeroSlide["actions"]>) =>
    update({ actions: { ...slide.actions, ...patch } });

  const updateFloatingCard = (patch: Partial<HeroSlide["floatingCard"]>) =>
    update({ floatingCard: { ...slide.floatingCard, ...patch } });

  const updateBenefits = (patch: Partial<HeroSlide["benefits"]>) =>
    update({ benefits: { ...slide.benefits, ...patch } });

  const updateInstitutionalVideo = (patch: Partial<HeroSlide["institutionalVideo"]>) =>
    update({ institutionalVideo: { ...slide.institutionalVideo, ...patch } });

  const updateStatistics = (patch: Partial<HeroSlide["statistics"]>) =>
    update({ statistics: { ...slide.statistics, ...patch } });

  const updateSeo = (patch: Partial<HeroSlide["seo"]>) =>
    update({ seo: { ...slide.seo, ...patch } });

  const updatePublication = (patch: Partial<HeroSlide["publication"]>) =>
    update({ publication: { ...slide.publication, ...patch } });

  const updateScheduling = (patch: Partial<HeroSlide["scheduling"]>) =>
    update({ scheduling: { ...slide.scheduling, ...patch } });

  const updateFeature = (index: number, field: keyof HeroFeature, value: string) => {
    const items = [...(slide.benefits.items.length ? slide.benefits.items : DEFAULT_HERO_FEATURES)];
    items[index] = { ...items[index]!, [field]: value };
    updateBenefits({ items });
  };

  const benefitItems =
    slide.benefits.items.length > 0 ? slide.benefits.items : DEFAULT_HERO_FEATURES;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Publicación y prioridad</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Estado"
            value={slide.publication.status}
            onChange={(e) =>
              updatePublication({
                status: e.target.value as HeroSlide["publication"]["status"],
              })
            }
            options={HERO_PUBLICATION_STATUS_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
          <Select
            label="Prioridad"
            helper="Principal se muestra antes que Destacado y Normal"
            value={slide.priority}
            onChange={(e) =>
              update({ priority: e.target.value as HeroSlide["priority"] })
            }
            options={HERO_SLIDE_PRIORITY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mostrar desde"
            type="date"
            value={slide.scheduling.showFrom.slice(0, 10)}
            onChange={(e) => updateScheduling({ showFrom: e.target.value })}
            helper="Opcional. Para campañas programadas."
          />
          <Input
            label="Mostrar hasta"
            type="date"
            value={slide.scheduling.showUntil.slice(0, 10)}
            onChange={(e) => updateScheduling({ showUntil: e.target.value })}
            helper="El slide desaparece automáticamente después de esta fecha."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Contenido</h4>
        <Input
          label="Eyebrow"
          value={slide.content.eyebrow}
          onChange={(e) => updateContent({ eyebrow: e.target.value })}
        />
        <Textarea
          label="Título"
          helper="Use saltos de línea para varias líneas"
          value={slide.content.title}
          onChange={(e) => updateContent({ title: e.target.value })}
          rows={3}
        />
        <Input
          label="Palabra destacada"
          helper="Se resalta dentro del título (ej: ministerio)"
          value={slide.content.highlight}
          onChange={(e) => updateContent({ highlight: e.target.value })}
        />
        <Input
          label="Subtítulo"
          value={slide.content.subtitle}
          onChange={(e) => updateContent({ subtitle: e.target.value })}
        />
        <Textarea
          label="Descripción"
          value={slide.content.description}
          onChange={(e) => updateContent({ description: e.target.value })}
          rows={3}
        />
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Multimedia</h4>
        <MediaField
          label="Imagen Desktop (1920 × 900)"
          description="Biblioteca Multimedia — carpeta Hero."
          value={slide.multimedia.desktopMediaId}
          onChange={(v) => updateMultimedia({ desktopMediaId: v })}
          onAssetChange={(asset) =>
            onPreviewUpdate?.("desktop", asset?.responsive?.w1920 ?? asset?.url)
          }
          tenant={tenant}
          folder="Hero"
          category="Imagen"
          pickerContext="hero-desktop"
          previewClassName="h-32"
        />
        <MediaField
          label="Imagen Mobile (1080 × 1350)"
          value={slide.multimedia.mobileMediaId}
          onChange={(v) => updateMultimedia({ mobileMediaId: v })}
          onAssetChange={(asset) =>
            onPreviewUpdate?.("mobile", asset?.responsive?.w1080 ?? asset?.url)
          }
          tenant={tenant}
          folder="Hero"
          category="Imagen"
          pickerContext="hero-mobile"
          previewClassName="h-32"
        />
        <Input
          label="Texto alternativo"
          value={slide.multimedia.imageAlt}
          onChange={(e) => updateMultimedia({ imageAlt: e.target.value })}
        />
        <Select
          label="Posición imagen"
          value={slide.multimedia.alignment}
          onChange={(e) =>
            updateMultimedia({
              alignment: e.target.value as HeroSlide["multimedia"]["alignment"],
            })
          }
          options={HERO_ALIGNMENT_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
        {slide.multimedia.alignment === "custom" ? (
          <Input
            label="Encuadre personalizado"
            helper="CSS object-position, ej: 30% 20%"
            value={slide.multimedia.customAlignment}
            onChange={(e) => updateMultimedia({ customAlignment: e.target.value })}
          />
        ) : null}
        <Switch
          label="Activar overlay sobre imagen"
          checked={slide.multimedia.overlay.enabled}
          onChange={(v) => updateOverlay({ enabled: v })}
        />
        {slide.multimedia.overlay.enabled ? (
          <>
            <ColorPicker
              label="Color del overlay"
              value={slide.multimedia.overlay.color}
              onChange={(v) => updateOverlay({ color: v })}
            />
            <Input
              label="Opacidad (0–100%)"
              type="number"
              min={0}
              max={100}
              value={String(slide.multimedia.overlay.opacity)}
              onChange={(e) =>
                updateOverlay({
                  opacity: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
            />
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Acciones</h4>
        <Switch
          label="Mostrar CTAs"
          checked={slide.actions.enabled}
          onChange={(v) => updateActions({ enabled: v })}
        />
        {slide.actions.enabled ? (
          <>
            <div className="space-y-3 rounded-md border border-border p-3">
              <p className="text-caption font-medium text-muted">CTA principal</p>
              <Input
                label="Texto"
                value={slide.actions.primary.text}
                onChange={(e) =>
                  updateActions({
                    primary: { ...slide.actions.primary, text: e.target.value },
                  })
                }
              />
              <Input
                label="URL"
                value={slide.actions.primary.url}
                onChange={(e) =>
                  updateActions({
                    primary: { ...slide.actions.primary, url: e.target.value },
                  })
                }
              />
              <Switch
                label="Abrir en nueva pestaña"
                checked={Boolean(slide.actions.primary.openInNewTab)}
                onChange={(v) =>
                  updateActions({
                    primary: { ...slide.actions.primary, openInNewTab: v },
                  })
                }
              />
            </div>
            <div className="space-y-3 rounded-md border border-border p-3">
              <p className="text-caption font-medium text-muted">CTA secundario</p>
              <Input
                label="Texto"
                value={slide.actions.secondary.text}
                onChange={(e) =>
                  updateActions({
                    secondary: { ...slide.actions.secondary, text: e.target.value },
                  })
                }
              />
              <Input
                label="URL"
                value={slide.actions.secondary.url}
                onChange={(e) =>
                  updateActions({
                    secondary: { ...slide.actions.secondary, url: e.target.value },
                  })
                }
              />
              <Switch
                label="Abrir en nueva pestaña"
                checked={Boolean(slide.actions.secondary.openInNewTab)}
                onChange={(v) =>
                  updateActions({
                    secondary: { ...slide.actions.secondary, openInNewTab: v },
                  })
                }
              />
            </div>
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Tarjeta flotante</h4>
        <Switch
          label="Mostrar tarjeta"
          checked={slide.floatingCard.enabled}
          onChange={(v) => updateFloatingCard({ enabled: v })}
        />
        {slide.floatingCard.enabled ? (
          <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Tarjeta del Hero</legend>
              <div className="flex flex-col gap-2">
                {HERO_FLOATING_CARD_SOURCE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`floating-source-${slide.id}`}
                      value={opt.value}
                      checked={(slide.floatingCard.source ?? "manual") === opt.value}
                      onChange={() => updateFloatingCard({ source: opt.value })}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            {(slide.floatingCard.source ?? "manual") === "manual" ? (
              <>
            <Input
              label="Icono"
              helper="Identificador Lucide: calendar, award, book-open…"
              value={slide.floatingCard.icon}
              onChange={(e) => updateFloatingCard({ icon: e.target.value })}
            />
            <Input
              label="Título"
              value={slide.floatingCard.title}
              onChange={(e) => updateFloatingCard({ title: e.target.value })}
            />
            <Input
              label="Subtítulo"
              value={slide.floatingCard.subtitle}
              onChange={(e) => updateFloatingCard({ subtitle: e.target.value })}
            />
            <Textarea
              label="Texto"
              value={slide.floatingCard.description}
              onChange={(e) => updateFloatingCard({ description: e.target.value })}
              rows={2}
            />
            <Input
              label="Botón — texto"
              value={slide.floatingCard.button.text}
              onChange={(e) =>
                updateFloatingCard({
                  button: { ...slide.floatingCard.button, text: e.target.value },
                })
              }
            />
            <Input
              label="Botón — URL"
              value={slide.floatingCard.button.url}
              onChange={(e) =>
                updateFloatingCard({
                  button: { ...slide.floatingCard.button, url: e.target.value },
                })
              }
            />
              </>
            ) : (
              <p className="text-sm text-muted">
                El contenido se obtiene automáticamente desde{" "}
                {slide.floatingCard.source === "next_academic_event"
                  ? "Agenda Académica (próximo hito)"
                  : "Avisos Institucionales (aviso destacado)"}
                . Puedes personalizar solo el icono.
              </p>
            )}
            {(slide.floatingCard.source ?? "manual") !== "manual" ? (
              <Input
                label="Icono"
                helper="Identificador Lucide: calendar, megaphone…"
                value={slide.floatingCard.icon}
                onChange={(e) => updateFloatingCard({ icon: e.target.value })}
              />
            ) : null}
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Beneficios</h4>
        <Switch
          label="Mostrar beneficios"
          checked={slide.benefits.enabled}
          onChange={(v) => updateBenefits({ enabled: v, items: benefitItems })}
        />
        {slide.benefits.enabled
          ? benefitItems.map((feature, index) => (
              <div key={`${feature.title}-${index}`} className="grid gap-2 rounded-md border border-border p-3">
                <Input
                  label={`Beneficio ${index + 1} — título`}
                  value={slide.benefits.items[index]?.title ?? feature.title}
                  onChange={(e) => updateFeature(index, "title", e.target.value)}
                />
                <Input
                  label="Icono"
                  value={slide.benefits.items[index]?.icon ?? feature.icon}
                  onChange={(e) => updateFeature(index, "icon", e.target.value)}
                />
                <Input
                  label="Descripción"
                  value={slide.benefits.items[index]?.description ?? feature.description}
                  onChange={(e) => updateFeature(index, "description", e.target.value)}
                />
              </div>
            ))
          : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Video institucional</h4>
        <Switch
          label="Activar video"
          checked={slide.institutionalVideo.enabled}
          onChange={(v) => updateInstitutionalVideo({ enabled: v })}
        />
        {slide.institutionalVideo.enabled ? (
          <>
            <MediaField
              label="Archivo de video"
              value={slide.institutionalVideo.mediaId}
              onChange={(v) => updateInstitutionalVideo({ mediaId: v })}
              tenant={tenant}
              folder="Hero"
              category="Video"
              pickerContext="default"
            />
            <Input
              label="URL externa (opcional)"
              value={slide.institutionalVideo.url}
              onChange={(e) => updateInstitutionalVideo({ url: e.target.value })}
            />
            <MediaField
              label="Poster del video"
              value={slide.institutionalVideo.posterMediaId}
              onChange={(v) => updateInstitutionalVideo({ posterMediaId: v })}
              tenant={tenant}
              folder="Hero"
              category="Imagen"
              pickerContext="default"
            />
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Estadísticas</h4>
        <Switch
          label="Mostrar estadísticas"
          checked={slide.statistics.enabled}
          onChange={(v) => updateStatistics({ enabled: v })}
        />
        <p className="text-caption text-muted">
          El diseño de estadísticas queda congelado en código. Aquí se administran los valores cuando el módulo esté activo en render.
        </p>
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">SEO del slide</h4>
        <Input
          label="Meta título"
          value={slide.seo.title}
          onChange={(e) => updateSeo({ title: e.target.value })}
        />
        <Textarea
          label="Meta descripción"
          value={slide.seo.description}
          onChange={(e) => updateSeo({ description: e.target.value })}
          rows={2}
        />
        <MediaField
          label="Imagen OG"
          value={slide.seo.imageMediaId}
          onChange={(v) => updateSeo({ imageMediaId: v })}
          tenant={tenant}
          folder="Hero"
          category="Imagen"
          pickerContext="default"
        />
      </section>
    </div>
  );
}
