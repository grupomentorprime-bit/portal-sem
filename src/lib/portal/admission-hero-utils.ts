import type {
  AdmissionCalendarDates,
  AdmissionDatesHighlight,
  AdmissionHeroAction,
  AdmissionHeroContent,
  AdmissionHeroEditorialCard,
  AdmissionHeroIndicator,
  AdmissionHeroMedia,
  AdmissionHeroMicroBenefit,
  AdmissionProgramsSectionConfig,
} from "@/types/admission";
import { DEFAULT_PROGRAMS_SHOWCASE_FILTERS } from "@/lib/experience/programs-showcase-utils";
import type { CmsCTA, CmsIndicatorItem } from "@/types/cms-shared";

export function sortVisibleHeroItems<T extends { order?: number; visible?: boolean }>(
  items: T[] | undefined
): T[] {
  if (!items?.length) return [];
  return [...items]
    .filter((item) => item.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function resolveEditorialCard(
  hero: Partial<AdmissionHeroContent>,
  calendar?: AdmissionCalendarDates
): AdmissionHeroEditorialCard | undefined {
  if (hero.editorialCard) return hero.editorialCard;

  if (hero.classStartCard) {
    return {
      visible: hero.classStartCard.visible,
      title: hero.classStartCard.caption ?? "ADMISIÓN 2026",
      rows: [
        {
          id: "ec-classes",
          label: hero.classStartCard.label,
          value: hero.classStartCard.date,
          visible: true,
          order: 0,
        },
      ],
      calendarLink: {
        label: "Ver calendario",
        href: "#fechas",
        visible: true,
      },
    };
  }

  if (!calendar) return undefined;

  return {
    visible: true,
    title: "ADMISIÓN 2026",
    rows: [
      {
        id: "ec-open",
        label: "Inicio postulaciones",
        value: calendar.applicationsOpen,
        visible: true,
        order: 0,
      },
      {
        id: "ec-close",
        label: "Cierre",
        value: calendar.applicationsClose,
        visible: true,
        order: 1,
      },
      {
        id: "ec-classes",
        label: "Inicio clases",
        value: calendar.classesStart,
        visible: true,
        order: 2,
      },
    ],
    calendarLink: {
      label: "Ver calendario",
      href: "#fechas",
      visible: true,
    },
  };
}

function resolveHeroMedia(hero: Partial<AdmissionHeroContent>): AdmissionHeroMedia {
  if (hero.media) return hero.media;
  return {
    type: hero.videoMediaId ? "video" : "image",
    mediaId: hero.mediaId,
    videoMediaId: hero.videoMediaId,
    imageAssetId: hero.imageAssetId ?? "hero-ministerial-call",
    alt: hero.title,
    overlay: true,
    overlayOpacity: 0.4,
    darkening: 0.15,
    blur: 0,
    gradient: true,
    gradientOpacity: 0.28,
    focalPoint: { x: 0.58, y: 0.42 },
    position: "center",
  };
}

function ctaToAction(cta: CmsCTA, variant: AdmissionHeroAction["variant"], order: number): AdmissionHeroAction {
  return {
    id: cta.id,
    label: cta.text,
    href: cta.url,
    variant,
    icon: cta.icon,
    visible: true,
    order,
  };
}

function legacyIndicatorsToPremium(items: CmsIndicatorItem[] | undefined): AdmissionHeroIndicator[] {
  return (items ?? []).map((item, order) => ({
    id: item.id,
    icon: item.icon,
    value: item.value,
    label: item.label,
    visible: true,
    order,
    link: item.link,
  }));
}

export function isPremiumHeroContent(hero: Partial<AdmissionHeroContent>): boolean {
  return Boolean(hero.enabled !== undefined && Array.isArray(hero.actions));
}

export function migrateHeroContent(
  hero: Partial<AdmissionHeroContent>,
  calendar?: AdmissionCalendarDates
): AdmissionHeroContent {
  if (isPremiumHeroContent(hero)) {
    const premium = hero as AdmissionHeroContent;
    return {
      ...premium,
      quote: premium.quote ? { ...premium.quote, visible: premium.quote.visible ?? false } : undefined,
      editorialCard: premium.editorialCard ?? resolveEditorialCard(premium, calendar),
      animations: premium.animations ?? {
        enabled: true,
        entrance: "fade",
        hoverElevation: true,
        hoverCta: true,
      },
    };
  }

  const primary = hero.primaryCta;
  const secondary = hero.secondaryCta;
  const actions: AdmissionHeroAction[] = [];

  if (primary) {
    actions.push(ctaToAction(primary, "primary", 0));
  }
  if (secondary) {
    actions.push(
      ctaToAction(
        secondary,
        secondary.variant === "ghost" ? "ghost" : "secondary",
        1
      )
    );
  }

  const legacyIndicators = hero.indicators as CmsIndicatorItem[] | AdmissionHeroIndicator[] | undefined;
  const indicators: AdmissionHeroIndicator[] =
    legacyIndicators?.length &&
    "visible" in (legacyIndicators[0] ?? {})
      ? (legacyIndicators as AdmissionHeroIndicator[])
      : legacyIndicatorsToPremium(legacyIndicators as CmsIndicatorItem[] | undefined);

  return {
    enabled: true,
    eyebrow: hero.eyebrow ?? hero.overline,
    statusBadge: hero.statusBadge ?? {
      text: "Admisión 2026 abierta",
      icon: "Sparkles",
      tone: "success",
      visible: true,
    },
    title: hero.title ?? "",
    highlight: hero.highlight,
    subtitle: hero.subtitle ?? "",
    description: hero.description ?? "",
    media: resolveHeroMedia(hero),
    quote: hero.quote ? { ...hero.quote, visible: hero.quote.visible ?? false } : undefined,
    editorialCard: resolveEditorialCard(hero, calendar),
    classStartCard: hero.classStartCard,
    animations: hero.animations ?? {
      enabled: true,
      entrance: "fade",
      hoverElevation: true,
      hoverCta: true,
    },
    actions: hero.actions?.length ? hero.actions : actions,
    indicators: hero.indicators?.length ? indicators : [],
    microBenefits: hero.microBenefits,
    calendarDateLabels: hero.calendarDateLabels,
    overline: hero.overline,
    imageAssetId: hero.imageAssetId,
    mediaId: hero.mediaId,
    videoMediaId: hero.videoMediaId,
    primaryCta: hero.primaryCta,
    secondaryCta: hero.secondaryCta,
    seals: hero.seals,
    dateLabels: hero.dateLabels,
    background: hero.background,
  };
}

export function buildDatesHighlightFromCalendar(
  highlight: Partial<AdmissionDatesHighlight> | undefined,
  calendar: AdmissionCalendarDates,
  labels: { applicationsOpen: string; applicationsClose: string; classesStart: string }
): AdmissionDatesHighlight {
  const defaults: AdmissionDatesHighlight = {
    enabled: true,
    title: "Fechas importantes",
    statusLabel: "Postulaciones abiertas",
    items: [
      {
        id: "dh-open",
        label: labels.applicationsOpen,
        value: calendar.applicationsOpen,
        icon: "Send",
        visible: true,
        order: 0,
      },
      {
        id: "dh-close",
        label: labels.applicationsClose,
        value: calendar.applicationsClose,
        icon: "Calendar",
        highlight: true,
        visible: true,
        order: 1,
      },
      {
        id: "dh-classes",
        label: labels.classesStart,
        value: calendar.classesStart,
        icon: "BookOpen",
        visible: true,
        order: 2,
      },
    ],
  };

  if (!highlight) return defaults;

  return {
    ...defaults,
    ...highlight,
    items: highlight.items?.length ? highlight.items : defaults.items,
  };
}

export function sortMicroBenefits(
  items: AdmissionHeroMicroBenefit[] | undefined
): AdmissionHeroMicroBenefit[] {
  return sortVisibleHeroItems(items);
}

export function migrateHeroPrograms(
  programs: Partial<AdmissionProgramsSectionConfig> | undefined
): AdmissionProgramsSectionConfig {
  return migrateProgramsSection(programs);
}

export function migrateProgramsSection(
  programs: Partial<AdmissionProgramsSectionConfig> | undefined
): AdmissionProgramsSectionConfig {
  const defaults: AdmissionProgramsSectionConfig = {
    enabled: true,
    overline: "PROGRAMAS FORMATIVOS",
    title: "Elige la ruta que Dios tiene para ti.",
    description:
      "Programas de formación ministerial con profundidad bíblica, acompañamiento pastoral y modalidad 100% online.",
    tagline: "Formación bíblica con excelencia académica y corazón pastoral.",
    catalogHref: "/programas",
    catalogLabel: "Ver catálogo completo",
    cardCtaLabel: "Conocer programa",
    maxSecondaryVisible: 3,
    secondaryProgramIds: [],
    minProgramsForFilters: 8,
    animation: "fade",
    filters: DEFAULT_PROGRAMS_SHOWCASE_FILTERS,
    help: {
      enabled: true,
      title: "¿No sabes qué programa es para ti?",
      description:
        "Nuestro equipo de admisiones puede orientarte según tu llamado y experiencia ministerial.",
      primaryLabel: "Hablar con admisiones",
      primaryHref: "/contacto",
      secondaryLabel: "Ver guía de programas",
      secondaryHref: "/admision",
    },
  };

  if (!programs) return defaults;

  return {
    ...defaults,
    ...programs,
    description: programs.description ?? programs.tagline ?? defaults.description,
    tagline: programs.tagline ?? defaults.tagline,
    filters: programs.filters?.length ? programs.filters : defaults.filters,
    secondaryProgramIds: programs.secondaryProgramIds ?? defaults.secondaryProgramIds,
    help: {
      ...defaults.help,
      ...programs.help,
    },
  };
}
