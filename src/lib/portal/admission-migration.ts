/**
 * OT-CMSV2-BUILD-001 — Migración de configs legacy a modelo de 12 secciones.
 * OT-PORTAL-ADMISION-006 — Hero premium CMS-first.
 */
import { DEFAULT_ADMISSION_CONFIG } from "@/lib/portal/admission-content";
import {
  buildDatesHighlightFromCalendar,
  migrateHeroContent,
  migrateProgramsSection,
  sortMicroBenefits,
  sortVisibleHeroItems,
} from "@/lib/portal/admission-hero-utils";
import type { AdmissionConfig, AdmissionSectionId, AdmissionSectionMeta } from "@/types/admission";
import { ADMISSION_SECTION_LABELS } from "@/types/admission";
import type { CmsSectionLayout } from "@/types/cms-shared";
import { DEFAULT_CMS_SECTION_LAYOUT } from "@/types/cms-shared";

const LEGACY_COMPOSITE_ID = "requirements" as const;

const EXPANDED_SECTION_ORDER: AdmissionSectionId[] = [
  "hero",
  "programs",
  "why_study",
  "profiles",
  "requirements",
  "dates",
  "documents",
  "timeline",
  "fees",
  "scholarships",
  "form",
  "faq",
  "closing",
];

function hasLegacyComposite(sections: AdmissionSectionMeta[]): boolean {
  return sections.some((s) => s.id === LEGACY_COMPOSITE_ID);
}

function expandLegacySections(sections: AdmissionSectionMeta[]): AdmissionSectionMeta[] {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const composite = sorted.find((s) => s.id === LEGACY_COMPOSITE_ID);
  if (!composite) return sections;

  const compositeOrder = composite.order;
  const subSections: AdmissionSectionId[] = [
    "why_study",
    "profiles",
    "requirements",
    "dates",
    "documents",
  ];

  const withoutComposite = sorted.filter((s) => s.id !== LEGACY_COMPOSITE_ID);
  const expanded: AdmissionSectionMeta[] = [];

  let order = 0;
  for (const section of withoutComposite) {
    if (section.order < compositeOrder) {
      expanded.push({ ...section, order: order++ });
      continue;
    }
    if (section.order === compositeOrder) {
      for (const subId of subSections) {
        expanded.push({
          id: subId,
          label: ADMISSION_SECTION_LABELS[subId],
          enabled: composite.enabled,
          order: order++,
        });
      }
      expanded.push({ ...section, order: order++ });
      continue;
    }
    expanded.push({ ...section, order: order++ });
  }

  return expanded;
}

function ensureAllSections(sections: AdmissionSectionMeta[]): AdmissionSectionMeta[] {
  const byId = new Map(sections.map((s) => [s.id, s]));
  return EXPANDED_SECTION_ORDER.map((id, order) => {
    const existing = byId.get(id);
    return (
      existing ?? {
        id,
        label: ADMISSION_SECTION_LABELS[id],
        enabled: true,
        order,
      }
    );
  }).map((s, order) => ({ ...s, order }));
}

function ensureProgramsSection(sections: AdmissionSectionMeta[]): AdmissionSectionMeta[] {
  if (sections.some((section) => section.id === "programs")) {
    return sections;
  }

  const heroOrder = sections.find((section) => section.id === "hero")?.order ?? 0;
  const next = sections.map((section) =>
    section.order > heroOrder ? { ...section, order: section.order + 1 } : section
  );

  next.push({
    id: "programs",
    label: ADMISSION_SECTION_LABELS.programs,
    enabled: true,
    order: heroOrder + 1,
  });

  return next.sort((a, b) => a.order - b.order).map((section, index) => ({
    ...section,
    order: index,
  }));
}

export function migrateAdmissionConfig(config: AdmissionConfig): AdmissionConfig {
  let sections = config.sections;
  if (hasLegacyComposite(sections)) {
    sections = expandLegacySections(sections);
  }
  sections = ensureAllSections(sections);

  const layouts = { ...config.sectionLayouts };

  if (!layouts.why_study?.title) {
    layouts.why_study = {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      title: config.intro.whyTitle,
      description: config.intro.whyDescription,
      ...layouts.why_study,
    };
  }

  if (!layouts.profiles?.title) {
    layouts.profiles = {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      title: config.intro.profilesTitle,
      description: config.intro.profilesDescription,
      muted: true,
      ...layouts.profiles,
    };
  }

  if (!layouts.requirements?.title) {
    layouts.requirements = {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Requisitos",
      title: "¿Qué necesitas para postular?",
      description:
        "Requisitos reales del SEM. El equipo de admisiones confirmará tu elegibilidad tras recibir tu solicitud.",
      ...layouts.requirements,
    };
  }

  if (!layouts.dates?.title) {
    layouts.dates = {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Calendario",
      title: "Fechas importantes",
      description: config.calendar.note,
      muted: true,
      ...layouts.dates,
    };
  }

  if (!layouts.documents?.title) {
    layouts.documents = {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Documentación",
      title: "Documentos requeridos",
      description:
        "Listado informativo. No es necesario adjuntar archivos en esta etapa del portal.",
      ...layouts.documents,
    };
  }

  const calendarLabels =
    config.calendarLabels ??
    config.hero.calendarDateLabels ??
    DEFAULT_ADMISSION_CONFIG.calendarLabels;

  const migratedHero = migrateHeroContent(config.hero, config.calendar);
  const defaultHero = DEFAULT_ADMISSION_CONFIG.hero;
  const hero = {
    ...defaultHero,
    ...migratedHero,
    enabled: migratedHero.enabled ?? defaultHero.enabled,
    title: migratedHero.title?.trim() ? migratedHero.title : defaultHero.title,
    subtitle: migratedHero.subtitle?.trim() ? migratedHero.subtitle : defaultHero.subtitle,
    description: migratedHero.description?.trim()
      ? migratedHero.description
      : defaultHero.description,
    actions: sortVisibleHeroItems(migratedHero.actions).length
      ? migratedHero.actions
      : defaultHero.actions,
    indicators: sortVisibleHeroItems(migratedHero.indicators).length
      ? migratedHero.indicators
      : defaultHero.indicators,
    microBenefits: sortMicroBenefits(migratedHero.microBenefits).length
      ? migratedHero.microBenefits
      : defaultHero.microBenefits,
  };

  const datesHighlight = buildDatesHighlightFromCalendar(
    config.datesHighlight ?? DEFAULT_ADMISSION_CONFIG.datesHighlight,
    config.calendar,
    calendarLabels
  );

  const programsSection = migrateProgramsSection({
    ...DEFAULT_ADMISSION_CONFIG.programsSection,
    ...config.programsSection,
    ...config.heroPrograms,
  });

  sections = ensureProgramsSection(sections);

  return {
    ...config,
    sections,
    sectionLayouts: layouts,
    formFields: config.formFields?.length
      ? config.formFields
      : DEFAULT_ADMISSION_CONFIG.formFields,
    calendarLabels,
    hero,
    datesHighlight,
    programsSection,
    heroPrograms: programsSection,
  };
}
