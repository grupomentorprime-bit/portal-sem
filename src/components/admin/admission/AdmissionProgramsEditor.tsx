"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionLayoutEditor, createCmsId } from "@/components/admin/builders";
import type { AdmissionConfig, AdmissionProgramFilter } from "@/types/admission";
import { AdmissionProgramPicker } from "./AdmissionProgramPicker";
import { AdmissionSecondaryProgramsPicker } from "./AdmissionSecondaryProgramsPicker";

interface AdmissionProgramsEditorProps {
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

function ListEditor<T extends { id: string }>({
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
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title} {index + 1}
          </p>
          {renderFields(item, (patch) =>
            onChange(items.map((row) => (row.id === item.id ? { ...row, ...patch } : row)))
          )}
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-medium text-primary hover:underline"
        onClick={() => onChange([...items, createItem()])}
      >
        Agregar filtro
      </button>
    </div>
  );
}

export function AdmissionProgramsEditor({
  config,
  tenant,
  onChange,
}: AdmissionProgramsEditorProps) {
  const programs = config.programsSection;
  const layout = config.sectionLayouts?.programs ?? {};
  const seo = config.sectionSeo?.programs ?? {};

  const patchPrograms = (patch: Partial<AdmissionConfig["programsSection"]>) =>
    onChange({
      ...config,
      programsSection: { ...programs, ...patch },
      heroPrograms: { ...programs, ...patch },
    });

  const patchHelp = (patch: Partial<AdmissionConfig["programsSection"]["help"]>) =>
    patchPrograms({ help: { ...programs.help, ...patch } });

  const patchLayout = (next: typeof layout) =>
    onChange({
      ...config,
      sectionLayouts: { ...config.sectionLayouts, programs: { ...layout, ...next } },
    });

  const patchSeo = (next: typeof seo) =>
    onChange({
      ...config,
      sectionSeo: { ...config.sectionSeo, programs: { ...seo, ...next } },
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="featured">Programa destacado</TabsTrigger>
          <TabsTrigger value="secondary">Programas secundarios</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
          <TabsTrigger value="help">Bloque de ayuda</TabsTrigger>
          <TabsTrigger value="visibility">Visibilidad</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Switch
            label="Mostrar sección de programas"
            checked={programs.enabled}
            onChange={(enabled) => patchPrograms({ enabled })}
          />
          <Field label="Overline">
            <Input
              value={programs.overline ?? ""}
              onChange={(e) => patchPrograms({ overline: e.target.value })}
            />
          </Field>
          <Field label="Título">
            <Input
              value={programs.title}
              onChange={(e) => patchPrograms({ title: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={programs.description ?? ""}
              onChange={(e) => patchPrograms({ description: e.target.value })}
            />
          </Field>
          <Field label="Tagline editorial">
            <Textarea
              rows={2}
              value={programs.tagline ?? ""}
              onChange={(e) => patchPrograms({ tagline: e.target.value })}
            />
          </Field>
          <Select
            label="Animación de entrada"
            value={programs.animation ?? "fade"}
            onChange={(e) =>
              patchPrograms({ animation: e.target.value as AdmissionConfig["programsSection"]["animation"] })
            }
            options={[
              { value: "fade", label: "Fade" },
              { value: "slide", label: "Slide" },
              { value: "none", label: "Sin animación" },
            ]}
          />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <AdmissionProgramPicker
            tenant={tenant}
            label="Programa destacado"
            value={programs.featuredProgramId ?? ""}
            onChange={(featuredProgramId) => patchPrograms({ featuredProgramId })}
            placeholder="Automático — primer programa publicado"
          />
          <p className="text-sm text-muted">
            El programa destacado usa layout editorial horizontal a ancho completo.
          </p>
        </TabsContent>

        <TabsContent value="secondary" className="space-y-4">
          <Field label="Máximo de tarjetas secundarias">
            <Input
              type="number"
              min={1}
              max={3}
              value={programs.maxSecondaryVisible ?? 3}
              onChange={(e) =>
                patchPrograms({ maxSecondaryVisible: Number.parseInt(e.target.value, 10) || 3 })
              }
            />
          </Field>
          <AdmissionSecondaryProgramsPicker
            tenant={tenant}
            selectedIds={programs.secondaryProgramIds ?? []}
            maxVisible={programs.maxSecondaryVisible ?? 3}
            onChange={(secondaryProgramIds) => patchPrograms({ secondaryProgramIds })}
          />
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="URL catálogo completo">
              <Input
                value={programs.catalogHref ?? ""}
                onChange={(e) => patchPrograms({ catalogHref: e.target.value })}
              />
            </Field>
            <Field label="Texto enlace catálogo">
              <Input
                value={programs.catalogLabel ?? ""}
                onChange={(e) => patchPrograms({ catalogLabel: e.target.value })}
              />
            </Field>
          </div>
          <Field label="CTA de tarjetas">
            <Input
              value={programs.cardCtaLabel ?? ""}
              onChange={(e) => patchPrograms({ cardCtaLabel: e.target.value })}
            />
          </Field>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Switch
            label="Mostrar bloque de ayuda"
            checked={programs.help.enabled}
            onChange={(enabled) => patchHelp({ enabled })}
          />
          <Field label="Título">
            <Input
              value={programs.help.title}
              onChange={(e) => patchHelp({ title: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={programs.help.description}
              onChange={(e) => patchHelp({ description: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CTA primario — etiqueta">
              <Input
                value={programs.help.primaryLabel}
                onChange={(e) => patchHelp({ primaryLabel: e.target.value })}
              />
            </Field>
            <Field label="CTA primario — URL">
              <Input
                value={programs.help.primaryHref}
                onChange={(e) => patchHelp({ primaryHref: e.target.value })}
              />
            </Field>
            <Field label="CTA secundario — etiqueta">
              <Input
                value={programs.help.secondaryLabel}
                onChange={(e) => patchHelp({ secondaryLabel: e.target.value })}
              />
            </Field>
            <Field label="CTA secundario — URL">
              <Input
                value={programs.help.secondaryHref}
                onChange={(e) => patchHelp({ secondaryHref: e.target.value })}
              />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="visibility" className="space-y-4">
          <Field label="Mínimo de programas para mostrar filtros">
            <Input
              type="number"
              min={4}
              value={programs.minProgramsForFilters ?? 8}
              onChange={(e) =>
                patchPrograms({ minProgramsForFilters: Number.parseInt(e.target.value, 10) || 8 })
              }
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            Los filtros se ocultan automáticamente si el catálogo es pequeño o no hay categorías
            suficientes con programas.
          </p>
          <ListEditor<AdmissionProgramFilter>
            title="Filtro"
            items={programs.filters ?? []}
            onChange={(filters) => patchPrograms({ filters })}
            createItem={() => ({
              id: createCmsId("pf"),
              label: "Nuevo filtro",
              matchKind: "text",
              matchValue: "",
              visible: true,
              order: programs.filters?.length ?? 0,
            })}
            renderFields={(item, update) => (
              <>
                <Field label="Etiqueta">
                  <Input value={item.label} onChange={(e) => update({ label: e.target.value })} />
                </Field>
                <Select
                  label="Tipo de coincidencia"
                  value={item.matchKind}
                  onChange={(e) =>
                    update({ matchKind: e.target.value as AdmissionProgramFilter["matchKind"] })
                  }
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "text", label: "Texto" },
                    { value: "status", label: "Estado" },
                    { value: "category", label: "Categoría" },
                  ]}
                />
                {item.matchKind !== "all" ? (
                  <Field label="Valor">
                    <Input
                      value={item.matchValue ?? ""}
                      onChange={(e) => update({ matchValue: e.target.value })}
                    />
                  </Field>
                ) : null}
                <Switch
                  label="Visible"
                  checked={item.visible !== false}
                  onChange={(visible) => update({ visible })}
                />
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Field label="Ancla de sección">
            <Input
              value={seo.anchor ?? ""}
              onChange={(e) => patchSeo({ anchor: e.target.value })}
              placeholder="programas-admision"
            />
          </Field>
          <Field label="Meta título">
            <Input
              value={seo.title ?? ""}
              onChange={(e) => patchSeo({ title: e.target.value })}
            />
          </Field>
          <Field label="Meta descripción">
            <Textarea
              rows={2}
              value={seo.description ?? ""}
              onChange={(e) => patchSeo({ description: e.target.value })}
            />
          </Field>
        </TabsContent>
      </Tabs>

      <SectionLayoutEditor
        layout={layout}
        seo={seo}
        tenant={tenant}
        showHeader={false}
        onLayoutChange={patchLayout}
        onSeoChange={patchSeo}
      />
    </div>
  );
}
