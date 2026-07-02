"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  CardBuilder,
  DocumentBuilder,
  FAQBuilder,
  FormFieldBuilder,
  PricingBuilder,
  SectionLayoutEditor,
  TimelineBuilder,
} from "@/components/admin/builders";
import type {
  AdmissionConfig,
  AdmissionSectionId,
  AdmissionProfileItem,
  AdmissionRequirementItem,
} from "@/types/admission";
import type {
  CmsDateItem,
  CmsCardItem,
  CmsDocumentItem,
  CmsPricingItem,
} from "@/types/cms-shared";
import { AdmissionClosingEditor } from "./AdmissionClosingEditor";
import { AdmissionHeroEditor } from "./AdmissionHeroEditor";
import { AdmissionProgramsEditor } from "./AdmissionProgramsEditor";
import { reorderClosingBlocks } from "@/lib/portal/admission-closing-utils";

interface AdmissionSectionEditorProps {
  sectionId: AdmissionSectionId;
  config: AdmissionConfig;
  tenant: string;
  onChange: (config: AdmissionConfig) => void;
  selectedClosingBlockId: string | null;
  onSelectClosingBlock: (id: string | null) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function patchLayout(
  config: AdmissionConfig,
  sectionId: AdmissionSectionId,
  layout: Partial<NonNullable<AdmissionConfig["sectionLayouts"][typeof sectionId]>>
): AdmissionConfig {
  return {
    ...config,
    sectionLayouts: {
      ...config.sectionLayouts,
      [sectionId]: { ...config.sectionLayouts?.[sectionId], ...layout },
    },
  };
}

function patchSeo(
  config: AdmissionConfig,
  sectionId: AdmissionSectionId,
  seo: Partial<NonNullable<AdmissionConfig["sectionSeo"][typeof sectionId]>>
): AdmissionConfig {
  return {
    ...config,
    sectionSeo: {
      ...config.sectionSeo,
      [sectionId]: { ...config.sectionSeo?.[sectionId], ...seo },
    },
  };
}

function profilesToCards(profiles: AdmissionProfileItem[]): CmsCardItem[] {
  return profiles.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    icon: p.icon,
    imageMediaId: p.imageMediaId,
    link: p.link,
    color: p.color,
    background: p.background,
  }));
}

function cardsToProfiles(cards: CmsCardItem[]): AdmissionProfileItem[] {
  return cards.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description ?? "",
    icon: c.icon,
    imageMediaId: c.imageMediaId,
    link: c.link,
    color: c.color,
    background: c.background,
  }));
}

function requirementsToCards(reqs: AdmissionRequirementItem[]): CmsCardItem[] {
  return reqs.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
  }));
}

function cardsToRequirements(cards: CmsCardItem[]): AdmissionRequirementItem[] {
  return cards.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description ?? "",
    icon: c.icon,
  }));
}

function feesToPricing(fees: AdmissionConfig["fees"]): CmsPricingItem[] {
  return fees.map((f) => ({
    id: f.id,
    name: f.label,
    price: f.value,
    description: f.note,
    icon: f.icon,
    highlighted: f.highlighted,
    color: f.color,
    buttonText: f.buttonText,
    buttonUrl: f.buttonUrl,
    note: f.note,
  }));
}

function pricingToFees(pricing: CmsPricingItem[]): AdmissionConfig["fees"] {
  return pricing.map((p) => ({
    id: p.id,
    label: p.name,
    value: p.price,
    note: p.note ?? p.description,
    icon: p.icon,
    highlighted: p.highlighted,
    color: p.color,
    buttonText: p.buttonText,
    buttonUrl: p.buttonUrl,
  }));
}

function documentsToBuilder(docs: AdmissionConfig["documents"]): CmsDocumentItem[] {
  return docs.map((d) => ({
    id: d.id,
    name: d.title,
    description: d.description,
    required: d.required,
    icon: d.icon,
    order: d.order,
  }));
}

function builderToDocuments(docs: CmsDocumentItem[]): AdmissionConfig["documents"] {
  return docs.map((d) => ({
    id: d.id,
    title: d.name,
    description: d.description ?? "",
    required: d.required,
    icon: d.icon,
    order: d.order,
  }));
}

export function AdmissionSectionEditor({
  sectionId,
  config,
  tenant,
  onChange,
  selectedClosingBlockId,
  onSelectClosingBlock,
}: AdmissionSectionEditorProps) {
  const layout = config.sectionLayouts?.[sectionId] ?? {};
  const seo = config.sectionSeo?.[sectionId] ?? {};

  const layoutEditor = (showHeader = true) => (
    <SectionLayoutEditor
      layout={layout}
      seo={seo}
      tenant={tenant}
      showHeader={showHeader}
      onLayoutChange={(next) => onChange(patchLayout(config, sectionId, next))}
      onSeoChange={(next) => onChange(patchSeo(config, sectionId, next))}
    />
  );

  switch (sectionId) {
    case "hero":
      return <AdmissionHeroEditor config={config} tenant={tenant} onChange={onChange} />;

    case "programs":
      return <AdmissionProgramsEditor config={config} tenant={tenant} onChange={onChange} />;

    case "why_study":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <p className="text-sm text-muted">
            Edite el encabezado de la sección en el Inspector. El contenido principal es el texto
            descriptivo del encabezado.
          </p>
          {layoutEditor()}
        </div>
      );

    case "profiles":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <CardBuilder
            items={profilesToCards(config.profiles)}
            tenant={tenant}
            addLabel="Agregar perfil"
            onChange={(cards) => onChange({ ...config, profiles: cardsToProfiles(cards) })}
          />
          {layoutEditor()}
        </div>
      );

    case "requirements":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <CardBuilder
            items={requirementsToCards(config.requirements)}
            tenant={tenant}
            addLabel="Agregar requisito"
            onChange={(cards) =>
              onChange({ ...config, requirements: cardsToRequirements(cards) })
            }
          />
          {layoutEditor()}
        </div>
      );

    case "dates":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-xl border border-border p-5">
            {(
              config.calendarItems ?? [
                {
                  id: "d-open",
                  label: config.calendarLabels.applicationsOpen,
                  value: config.calendar.applicationsOpen,
                },
                {
                  id: "d-close",
                  label: config.calendarLabels.applicationsClose,
                  value: config.calendar.applicationsClose,
                },
                {
                  id: "d-classes",
                  label: config.calendarLabels.classesStart,
                  value: config.calendar.classesStart,
                },
              ]
            ).map((item, index, arr) => (
              <div key={item.id} className="grid gap-3 sm:grid-cols-2">
                <Field label="Etiqueta">
                  <Input
                    value={item.label}
                    onChange={(e) => {
                      const next = [...arr] as CmsDateItem[];
                      next[index] = { ...item, label: e.target.value };
                      onChange({
                        ...config,
                        calendarItems: next,
                        calendar: {
                          ...config.calendar,
                          applicationsOpen: next[0]?.value ?? config.calendar.applicationsOpen,
                          applicationsClose: next[1]?.value ?? config.calendar.applicationsClose,
                          classesStart: next[2]?.value ?? config.calendar.classesStart,
                        },
                      });
                    }}
                  />
                </Field>
                <Field label="Fecha">
                  <Input
                    value={item.value}
                    onChange={(e) => {
                      const next = [...arr] as CmsDateItem[];
                      next[index] = { ...item, value: e.target.value };
                      onChange({
                        ...config,
                        calendarItems: next,
                        calendar: {
                          ...config.calendar,
                          applicationsOpen: next[0]?.value ?? config.calendar.applicationsOpen,
                          applicationsClose: next[1]?.value ?? config.calendar.applicationsClose,
                          classesStart: next[2]?.value ?? config.calendar.classesStart,
                        },
                      });
                    }}
                  />
                </Field>
              </div>
            ))}
            <Field label="Nota">
              <Textarea
                rows={2}
                value={config.calendar.note ?? ""}
                onChange={(e) =>
                  onChange({
                    ...config,
                    calendar: { ...config.calendar, note: e.target.value },
                    sectionLayouts: {
                      ...config.sectionLayouts,
                      dates: {
                        ...config.sectionLayouts?.dates,
                        description: e.target.value,
                      },
                    },
                  })
                }
              />
            </Field>
          </div>
          {layoutEditor()}
        </div>
      );

    case "documents":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <DocumentBuilder
            items={documentsToBuilder(config.documents)}
            onChange={(docs) => onChange({ ...config, documents: builderToDocuments(docs) })}
          />
          {layoutEditor()}
        </div>
      );

    case "timeline":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <TimelineBuilder
            items={config.processSteps}
            onChange={(processSteps) => onChange({ ...config, processSteps })}
          />
          {layoutEditor()}
        </div>
      );

    case "fees":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <PricingBuilder
              items={feesToPricing(config.fees)}
              onChange={(items) => onChange({ ...config, fees: pricingToFees(items) })}
            />
            <Field label="Nota de aranceles">
              <Textarea
                rows={2}
                value={config.feesNote ?? ""}
                onChange={(e) => onChange({ ...config, feesNote: e.target.value })}
              />
            </Field>
          </div>
          {layoutEditor()}
        </div>
      );

    case "scholarships":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <CardBuilder
              items={config.scholarships.map((s) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                icon: s.icon,
                color: s.color,
              }))}
              tenant={tenant}
              addLabel="Agregar beca"
              onChange={(cards) =>
                onChange({
                  ...config,
                  scholarships: cards.map((c) => ({
                    id: c.id,
                    kind: "benefit",
                    title: c.title,
                    description: c.description ?? "",
                    icon: c.icon,
                    color: c.color,
                  })),
                })
              }
            />
            <Field label="Descripción general">
              <Textarea
                rows={2}
                value={config.scholarshipsDescription ?? ""}
                onChange={(e) => onChange({ ...config, scholarshipsDescription: e.target.value })}
              />
            </Field>
          </div>
          {layoutEditor()}
        </div>
      );

    case "form":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Field label="Título del formulario">
              <Input
                value={config.formTitle}
                onChange={(e) => onChange({ ...config, formTitle: e.target.value })}
              />
            </Field>
            <Field label="Descripción">
              <Textarea
                rows={2}
                value={config.formDescription}
                onChange={(e) => onChange({ ...config, formDescription: e.target.value })}
              />
            </Field>
            <FormFieldBuilder
              items={config.formFields}
              onChange={(formFields) => onChange({ ...config, formFields })}
            />
            <Field label="Texto del botón enviar">
              <Input
                value={config.formSubmitLabel ?? ""}
                onChange={(e) => onChange({ ...config, formSubmitLabel: e.target.value })}
              />
            </Field>
            <Field label="Nota al pie">
              <Textarea
                rows={2}
                value={config.formFooterNote ?? ""}
                onChange={(e) => onChange({ ...config, formFooterNote: e.target.value })}
              />
            </Field>
          </div>
          {layoutEditor()}
        </div>
      );

    case "faq":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <FAQBuilder items={config.faq} onChange={(faq) => onChange({ ...config, faq })} />
          {layoutEditor()}
        </div>
      );

    case "closing":
      return (
        <AdmissionClosingEditor
          blocks={config.closing.blocks}
          selectedBlockId={selectedClosingBlockId}
          tenant={tenant}
          onSelectBlock={onSelectClosingBlock}
          onBlocksChange={(blocks) =>
            onChange({ ...config, closing: { ...config.closing, blocks } })
          }
          onReorderBlocks={(draggedId, targetId) =>
            onChange({
              ...config,
              closing: {
                ...config.closing,
                blocks: reorderClosingBlocks(config.closing.blocks, draggedId, targetId),
              },
            })
          }
          onToggleBlock={(id) =>
            onChange({
              ...config,
              closing: {
                ...config.closing,
                blocks: config.closing.blocks.map((block) =>
                  block.id === id ? { ...block, enabled: !block.enabled } : block
                ),
              },
            })
          }
        />
      );

    default:
      return null;
  }
}
