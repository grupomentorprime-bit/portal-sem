"use client";

import { useState } from "react";
import { MediaField } from "@/components/media/MediaPicker";
import { InspectorVideoPicker } from "@/components/visual-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuilderShell, createCmsId, reorderBuilderItems, SectionLayoutEditor } from "@/components/admin/builders";
import { DEFAULT_CMS_SECTION_LAYOUT } from "@/types/cms-shared";
import type {
  AdmissionConfig,
  AdmissionDatesHighlightItem,
  AdmissionHeroAction,
  AdmissionHeroEditorialCardRow,
  AdmissionHeroIndicator,
  AdmissionHeroMicroBenefit,
} from "@/types/admission";

interface AdmissionHeroEditorProps {
  config: AdmissionConfig;
  tenant: string;
  onChange: (config: AdmissionConfig) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ListEditor<T extends { id: string; visible?: boolean; order?: number }>({
  title,
  items,
  onChange,
  createItem,
  renderFields,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  renderFields: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  const updateSelected = (patch: Partial<T>) => {
    if (!selected) return;
    onChange(items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  };

  return (
    <BuilderShell
      items={items.map((item) => ({
        id: item.id,
        label:
          "text" in item
            ? String((item as { text?: string }).text ?? item.id)
            : "label" in item
              ? String((item as { label?: string }).label ?? item.id)
              : item.id,
        subtitle:
          "value" in item ? String((item as { value?: string }).value ?? "") : undefined,
      }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const item = createItem();
        onChange([...items, item]);
        setSelectedId(item.id);
      }}
      addLabel={`Agregar ${title.toLowerCase()}`}
      onRemove={(id) => {
        onChange(items.filter((item) => item.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-3">
          <Switch
            label="Visible"
            checked={selected.visible !== false}
            onChange={(visible) => updateSelected({ visible } as Partial<T>)}
          />
          {renderFields(selected, updateSelected)}
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un ítem para comenzar.</p>
      )}
    </BuilderShell>
  );
}

export function AdmissionHeroEditor({ config, tenant, onChange }: AdmissionHeroEditorProps) {
  const hero = config.hero;
  const datesHighlight = config.datesHighlight;
  const heroSeo = config.sectionSeo?.hero;
  const heroLayout = config.sectionLayouts?.hero;

  const patchHero = (patch: Partial<AdmissionConfig["hero"]>) =>
    onChange({ ...config, hero: { ...hero, ...patch } });

  const patchMedia = (patch: Partial<AdmissionConfig["hero"]["media"]>) =>
    patchHero({ media: { ...hero.media, ...patch } });

  const patchEditorialCard = (patch: Partial<NonNullable<AdmissionConfig["hero"]["editorialCard"]>>) =>
    patchHero({
      editorialCard: {
        visible: hero.editorialCard?.visible ?? true,
        title: hero.editorialCard?.title ?? "",
        rows: hero.editorialCard?.rows ?? [],
        calendarLink: hero.editorialCard?.calendarLink,
        ...patch,
      },
    });

  const patchDatesHighlight = (patch: Partial<AdmissionConfig["datesHighlight"]>) =>
    onChange({ ...config, datesHighlight: { ...datesHighlight, ...patch } });

  const patchHeroSeo = (patch: Partial<NonNullable<typeof heroSeo>>) =>
    onChange({
      ...config,
      sectionSeo: {
        ...config.sectionSeo,
        hero: { ...heroSeo, ...patch },
      },
    });

  const patchHeroLayout = (layout: typeof DEFAULT_CMS_SECTION_LAYOUT) =>
    onChange({
      ...config,
      sectionLayouts: {
        ...config.sectionLayouts,
        hero: layout,
      },
    });

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="mb-2 flex-wrap">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="content">Contenido</TabsTrigger>
        <TabsTrigger value="dates">Fechas</TabsTrigger>
        <TabsTrigger value="image">Imagen</TabsTrigger>
        <TabsTrigger value="indicators">Indicadores</TabsTrigger>
        <TabsTrigger value="benefits">Beneficios</TabsTrigger>
        <TabsTrigger value="ctas">CTAs</TabsTrigger>
        <TabsTrigger value="card">Tarjeta</TabsTrigger>
        <TabsTrigger value="animations">Animaciones</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Switch label="Mostrar hero" checked={hero.enabled} onChange={(enabled) => patchHero({ enabled })} />
        <Switch
          label="Mostrar barra de fechas"
          checked={datesHighlight.enabled}
          onChange={(enabled) => patchDatesHighlight({ enabled })}
        />
        <Field label="Eyebrow">
          <Input value={hero.eyebrow ?? ""} onChange={(e) => patchHero({ eyebrow: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Badge de estado">
            <Input
              value={hero.statusBadge.text}
              onChange={(e) =>
                patchHero({ statusBadge: { ...hero.statusBadge, text: e.target.value } })
              }
            />
          </Field>
          <Select
            label="Tono del badge"
            value={hero.statusBadge.tone}
            onChange={(e) =>
              patchHero({
                statusBadge: {
                  ...hero.statusBadge,
                  tone: e.target.value as AdmissionConfig["hero"]["statusBadge"]["tone"],
                },
              })
            }
            options={[
              { value: "success", label: "Éxito" },
              { value: "info", label: "Info" },
              { value: "neutral", label: "Neutral" },
            ]}
          />
        </div>
      </TabsContent>

      <TabsContent value="content" className="space-y-4">
        <Field label="Título">
          <Input value={hero.title} onChange={(e) => patchHero({ title: e.target.value })} />
        </Field>
        <Field label="Palabra destacada">
          <Input value={hero.highlight ?? ""} onChange={(e) => patchHero({ highlight: e.target.value })} />
        </Field>
        <Field label="Subtítulo">
          <Input value={hero.subtitle} onChange={(e) => patchHero({ subtitle: e.target.value })} />
        </Field>
        <Field label="Descripción">
          <Textarea rows={4} value={hero.description} onChange={(e) => patchHero({ description: e.target.value })} />
        </Field>
      </TabsContent>

      <TabsContent value="dates" className="space-y-4">
        <div className="rounded-lg border border-border bg-background-soft p-4">
          <p className="text-sm text-muted">
            Barra horizontal debajo del hero con fechas clave y CTA de postulación.
          </p>
        </div>
        <Field label="Título de la barra">
          <Input
            value={datesHighlight.title}
            onChange={(e) => patchDatesHighlight({ title: e.target.value })}
          />
        </Field>
        <Field label="Estado destacado">
          <Input
            value={datesHighlight.statusLabel}
            onChange={(e) => patchDatesHighlight({ statusLabel: e.target.value })}
          />
        </Field>
        <ListEditor<AdmissionDatesHighlightItem>
          title="Fecha"
          items={datesHighlight.items}
          onChange={(items) => patchDatesHighlight({ items })}
          createItem={() => ({
            id: createCmsId("dh"),
            label: "Nueva fecha",
            value: "",
            icon: "Calendar",
            visible: true,
            order: datesHighlight.items.length,
          })}
          renderFields={(item, update) => (
            <>
              <Field label="Etiqueta">
                <Input value={item.label} onChange={(e) => update({ label: e.target.value })} />
              </Field>
              <Field label="Valor">
                <Input value={item.value} onChange={(e) => update({ value: e.target.value })} />
              </Field>
              <Field label="Icono">
                <Input value={item.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
              </Field>
              <Switch
                label="Resaltar"
                checked={item.highlight === true}
                onChange={(highlight) => update({ highlight })}
              />
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="image" className="space-y-4">
        <Select
          label="Tipo de medio"
          value={hero.media.type}
          onChange={(e) => patchMedia({ type: e.target.value as "image" | "video" })}
          options={[
            { value: "image", label: "Imagen" },
            { value: "video", label: "Video" },
          ]}
        />
        <MediaField
          label="Imagen desktop"
          tenant={tenant}
          folder="Hero"
          value={hero.media.mediaId ?? ""}
          onChange={(mediaId) => patchMedia({ mediaId, type: "image" })}
        />
        <MediaField
          label="Imagen mobile"
          tenant={tenant}
          folder="Hero"
          value={hero.media.mobileMediaId ?? ""}
          onChange={(mobileMediaId) => patchMedia({ mobileMediaId })}
        />
        <InspectorVideoPicker
          label="Video opcional"
          tenant={tenant}
          folder="Hero"
          value={hero.media.videoMediaId ?? ""}
          onChange={(videoMediaId) => patchMedia({ videoMediaId, type: "video" })}
        />
        <Field label="Texto alternativo">
          <Input value={hero.media.alt ?? ""} onChange={(e) => patchMedia({ alt: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Asset fallback desktop">
            <Input
              value={hero.media.imageAssetId ?? ""}
              onChange={(e) => patchMedia({ imageAssetId: e.target.value })}
            />
          </Field>
          <Field label="Asset fallback mobile">
            <Input
              value={hero.media.mobileImageAssetId ?? ""}
              onChange={(e) => patchMedia({ mobileImageAssetId: e.target.value })}
            />
          </Field>
        </div>
        <Select
          label="Posición"
          value={hero.media.position ?? "center"}
          onChange={(e) =>
            patchMedia({ position: e.target.value as AdmissionConfig["hero"]["media"]["position"] })
          }
          options={[
            { value: "center", label: "Centro" },
            { value: "top", label: "Arriba" },
            { value: "bottom", label: "Abajo" },
            { value: "left", label: "Izquierda" },
            { value: "right", label: "Derecha" },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Oscurecimiento (0–1)">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={hero.media.darkening ?? 0}
              onChange={(e) => patchMedia({ darkening: Number.parseFloat(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Blur (px)">
            <Input
              type="number"
              min={0}
              max={20}
              step={1}
              value={hero.media.blur ?? 0}
              onChange={(e) => patchMedia({ blur: Number.parseInt(e.target.value, 10) || 0 })}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Opacidad overlay">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={hero.media.overlayOpacity ?? 0.4}
              onChange={(e) =>
                patchMedia({ overlayOpacity: Number.parseFloat(e.target.value) || 0.4 })
              }
            />
          </Field>
          <Field label="Opacidad gradiente">
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={hero.media.gradientOpacity ?? 0.28}
              onChange={(e) =>
                patchMedia({ gradientOpacity: Number.parseFloat(e.target.value) || 0.28 })
              }
            />
          </Field>
        </div>
        <Switch
          label="Overlay corporativo"
          checked={hero.media.overlay !== false}
          onChange={(overlay) => patchMedia({ overlay })}
        />
        <Switch
          label="Gradiente editorial"
          checked={hero.media.gradient !== false}
          onChange={(gradient) => patchMedia({ gradient })}
        />
      </TabsContent>

      <TabsContent value="indicators">
        <ListEditor<AdmissionHeroIndicator>
          title="Indicador"
          items={hero.indicators}
          onChange={(indicators) => patchHero({ indicators })}
          createItem={() => ({
            id: createCmsId("ind"),
            value: "100%",
            label: "Nuevo indicador",
            visible: true,
            order: hero.indicators.length,
          })}
          renderFields={(item, update) => (
            <>
              <Field label="Valor">
                <Input value={item.value} onChange={(e) => update({ value: e.target.value })} />
              </Field>
              <Field label="Etiqueta">
                <Input value={item.label} onChange={(e) => update({ label: e.target.value })} />
              </Field>
              <Field label="Icono">
                <Input value={item.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
              </Field>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="benefits">
        <ListEditor<AdmissionHeroMicroBenefit>
          title="Beneficio"
          items={hero.microBenefits ?? []}
          onChange={(microBenefits) => patchHero({ microBenefits })}
          createItem={() => ({
            id: createCmsId("mb"),
            text: "Nuevo beneficio",
            icon: "Check",
            visible: true,
            order: hero.microBenefits?.length ?? 0,
          })}
          renderFields={(item, update) => (
            <>
              <Field label="Texto">
                <Input value={item.text} onChange={(e) => update({ text: e.target.value })} />
              </Field>
              <Field label="Icono">
                <Input value={item.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
              </Field>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="ctas">
        <ListEditor<AdmissionHeroAction>
          title="CTA"
          items={hero.actions}
          onChange={(actions) => patchHero({ actions })}
          createItem={() => ({
            id: createCmsId("act"),
            label: "Nuevo CTA",
            href: "#",
            variant: "primary",
            visible: true,
            order: hero.actions.length,
          })}
          renderFields={(item, update) => (
            <>
              <Field label="Texto">
                <Input value={item.label} onChange={(e) => update({ label: e.target.value })} />
              </Field>
              <Field label="URL">
                <Input value={item.href} onChange={(e) => update({ href: e.target.value })} />
              </Field>
              <Select
                label="Jerarquía"
                value={item.variant}
                onChange={(e) => update({ variant: e.target.value as AdmissionHeroAction["variant"] })}
                options={[
                  { value: "primary", label: "Principal" },
                  { value: "secondary", label: "Secundario" },
                  { value: "tertiary", label: "Terciario" },
                  { value: "ghost", label: "Ghost" },
                ]}
              />
              <Field label="Icono">
                <Input value={item.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
              </Field>
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="card" className="space-y-4">
        <Switch
          label="Mostrar tarjeta editorial"
          checked={hero.editorialCard?.visible ?? false}
          onChange={(visible) => patchEditorialCard({ visible })}
        />
        <Field label="Título tarjeta">
          <Input
            value={hero.editorialCard?.title ?? ""}
            onChange={(e) => patchEditorialCard({ title: e.target.value })}
          />
        </Field>
        <ListEditor<AdmissionHeroEditorialCardRow>
          title="Fila"
          items={hero.editorialCard?.rows ?? []}
          onChange={(rows) => patchEditorialCard({ rows })}
          createItem={() => ({
            id: createCmsId("ec"),
            label: "Nueva fecha",
            value: "",
            visible: true,
            order: hero.editorialCard?.rows.length ?? 0,
          })}
          renderFields={(item, update) => (
            <>
              <Field label="Etiqueta">
                <Input value={item.label} onChange={(e) => update({ label: e.target.value })} />
              </Field>
              <Field label="Valor">
                <Input value={item.value} onChange={(e) => update({ value: e.target.value })} />
              </Field>
            </>
          )}
        />
        <Field label="Enlace calendario — texto">
          <Input
            value={hero.editorialCard?.calendarLink?.label ?? ""}
            onChange={(e) =>
              patchEditorialCard({
                calendarLink: {
                  label: e.target.value,
                  href: hero.editorialCard?.calendarLink?.href ?? "#fechas",
                  visible: hero.editorialCard?.calendarLink?.visible ?? true,
                },
              })
            }
          />
        </Field>
        <Field label="Enlace calendario — URL">
          <Input
            value={hero.editorialCard?.calendarLink?.href ?? ""}
            onChange={(e) =>
              patchEditorialCard({
                calendarLink: {
                  label: hero.editorialCard?.calendarLink?.label ?? "Ver calendario",
                  href: e.target.value,
                  visible: hero.editorialCard?.calendarLink?.visible ?? true,
                },
              })
            }
          />
        </Field>
      </TabsContent>

      <TabsContent value="animations" className="space-y-4">
        <Switch
          label="Animaciones activas"
          checked={hero.animations?.enabled !== false}
          onChange={(enabled) =>
            patchHero({
              animations: {
                enabled,
                entrance: hero.animations?.entrance ?? "fade",
                hoverElevation: hero.animations?.hoverElevation ?? true,
                hoverCta: hero.animations?.hoverCta ?? true,
              },
            })
          }
        />
        <Select
          label="Entrada"
          value={hero.animations?.entrance ?? "fade"}
          onChange={(e) =>
            patchHero({
              animations: {
                enabled: hero.animations?.enabled ?? true,
                entrance: e.target.value as NonNullable<typeof hero.animations>["entrance"],
                hoverElevation: hero.animations?.hoverElevation ?? true,
                hoverCta: hero.animations?.hoverCta ?? true,
              },
            })
          }
          options={[
            { value: "fade", label: "Fade" },
            { value: "slide", label: "Slide" },
            { value: "none", label: "Ninguna" },
          ]}
        />
        <Switch
          label="Hover con elevación en tarjetas"
          checked={hero.animations?.hoverElevation !== false}
          onChange={(hoverElevation) =>
            patchHero({
              animations: {
                enabled: hero.animations?.enabled ?? true,
                entrance: hero.animations?.entrance ?? "fade",
                hoverElevation,
                hoverCta: hero.animations?.hoverCta ?? true,
              },
            })
          }
        />
        <Switch
          label="Hover en CTAs"
          checked={hero.animations?.hoverCta !== false}
          onChange={(hoverCta) =>
            patchHero({
              animations: {
                enabled: hero.animations?.enabled ?? true,
                entrance: hero.animations?.entrance ?? "fade",
                hoverElevation: hero.animations?.hoverElevation ?? true,
                hoverCta,
              },
            })
          }
        />
      </TabsContent>

      <TabsContent value="seo">
        <SectionLayoutEditor
          layout={heroLayout ?? DEFAULT_CMS_SECTION_LAYOUT}
          seo={heroSeo}
          tenant={tenant}
          showHeader={false}
          onLayoutChange={(layout) => patchHeroLayout(layout)}
          onSeoChange={(seo) => patchHeroSeo(seo)}
        />
      </TabsContent>
    </Tabs>
  );
}
