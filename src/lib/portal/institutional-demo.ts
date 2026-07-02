/**
 * OT-UX-002 — Contenido institucional demo / fallback para Home SEM.
 * Se usa cuando el CMS no tiene contenido publicado — el visitante nunca ve estados vacíos.
 */

import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
import type { ProgramItem, NewsItem, TestimonialItem } from "@/types/content";
import type { PersonItem } from "@/types/people-grid";
import type { PortalFeatureGridSettings, PortalFeatureItem } from "@/types/feature-grid";
import type { PortalTimelineItem } from "@/types/timeline";
import type { PortalCtaStat, PortalCTAPremiumSettings } from "@/types/cta-premium";
import type { ContactInfo, SocialLinks } from "@/types/cms";
import type { PortalProgramsSectionSettings } from "@/components/portal/programs";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import {
  PORTAL_001_AUDIENCE_PROFILES,
  PORTAL_001_FAQ_ITEMS,
} from "@/lib/cms/home-portal-001";
import type { FaqItem } from "@/lib/portal/blocks";
import type { AudienceProfileItem } from "@/components/portal/home/audience";

import { PROGRAM_DEMO_IMAGES } from "@/lib/portal/program-demo-assets";
import { TEAM_DEMO_IMAGES } from "@/lib/portal/team-demo-assets";

const IMG = {
  program1: PROGRAM_DEMO_IMAGES.onlinePastoral,
  program2: PROGRAM_DEMO_IMAGES.onlinePastors,
  program3: PROGRAM_DEMO_IMAGES.onlineBrothers,
  program4: PROGRAM_DEMO_IMAGES.onlineAdmission,
  community: PROGRAM_DEMO_IMAGES.heroOnline,
  news1: "/images/gallery-1.svg",
  news2: "/images/gallery-2.svg",
  news3: "/images/gallery-3.svg",
  person: "/images/gallery-4.svg",
  cta: PLATFORM_ASSET_FALLBACKS.hero,
} as const;

export const DEMO_ACADEMIC_PROGRAMS: ProgramItem[] = [
  {
    id: "diploma-teologia-biblica-pastoral-g2023",
    title: "Diploma en Teología Bíblica Pastoral",
    description:
      "Formación bíblica y pastoral exclusiva para pastores y pastoras que ejercen o se preparan para el ministerio.",
    duration: "3 años",
    modality: "Online 100%",
    category: "Generación 2023",
    certification: "Pastores y pastoras",
    icon: "BookOpen",
    href: "/programas/diploma-teologia-biblica-pastoral-g2023",
    image: IMG.program1,
    featured: true,
    badge: "Más elegido",
    status: "admission_open",
    startDate: "Junio 2023",
    enrollmentFee: "$20.000",
    monthlyFee: "$15.000",
    paymentNote: "4 cuotas semestrales",
    price: "Desde $120.000 / sem.",
    showPrice: false,
    ctaPrimaryLabel: "Más información",
  },
  {
    id: "diploma-teologia-biblica-pastores-g2024",
    title: "Diploma en Teología Bíblica",
    description:
      "Formación bíblica integral para pastores y líderes comprometidos con el servicio cristiano.",
    duration: "4 años",
    modality: "Online 100%",
    category: "Generación 2024",
    certification: "Pastores y Líderes",
    icon: "Users",
    href: "/programas/diploma-teologia-biblica-pastores-g2024",
    image: IMG.program2,
    featured: true,
    badge: "Generación 2024",
    status: "active",
    startDate: "Marzo 2024",
    enrollmentFee: "$20.000",
    monthlyFee: "$15.000",
    paymentNote: "4 cuotas semestrales",
    price: "Desde $100.000 / sem.",
    showPrice: false,
    ctaPrimaryLabel: "Más información",
  },
  {
    id: "diploma-teologia-biblica-hermanos-g2025",
    title: "Diploma en Teología Bíblica",
    description:
      "Formación bíblica de cuatro años orientada a hermanos(as) y líderes que desean profundizar en las Escrituras y fortalecer su servicio en la Iglesia.",
    duration: "4 años",
    modality: "Online 100%",
    category: "Generación 2025",
    certification: "Hermanos(as) y Líderes",
    icon: "GraduationCap",
    href: "/programas/diploma-teologia-biblica-hermanos-g2025",
    image: IMG.program3,
    featured: true,
    badge: "Generación 2025",
    status: "active",
    startDate: "Marzo 2025",
    enrollmentFee: "$20.000",
    monthlyFee: "$15.000",
    paymentNote: "4 cuotas semestrales",
    price: "Desde $100.000 / sem.",
    showPrice: false,
    ctaPrimaryLabel: "Más información",
  },
  {
    id: "diploma-teologia-biblica-hermanos-g2026",
    title: "Diploma en Teología Bíblica",
    description:
      "Programa académico de ingreso para hermanos(as) y líderes, con formación bíblica, teológica y ministerial desarrollada completamente en modalidad online.",
    duration: "4 años",
    modality: "Online 100%",
    category: "Generación 2026",
    certification: "Hermanos(as) y Líderes",
    icon: "Monitor",
    href: "/programas/diploma-teologia-biblica-hermanos-g2026",
    image: IMG.program4,
    featured: true,
    badge: "Generación 2026",
    status: "admission_open",
    startDate: "Marzo 2026",
    enrollmentFee: "$20.000",
    monthlyFee: "$15.000",
    paymentNote: "4 cuotas semestrales",
    price: "Desde $100.000 / sem.",
    showPrice: false,
    ctaPrimaryLabel: "Más información",
  },
];

/** Catálogo académico demo — seed inicial y fallback cuando el CMS está vacío. */
export const SEM_CANONICAL_ACADEMIC_PROGRAMS = DEMO_ACADEMIC_PROGRAMS;

export const DEMO_ACADEMIC_OFFER_SETTINGS: PortalProgramsSectionSettings = {
  overline: "PROGRAMAS FORMATIVOS",
  title: "Nuestros programas",
  description:
    "Formación bíblica y pastoral 100% online, diseñada para equiparte y fortalecer tu llamado ministerial.",
  showButton: true,
  buttonHref: "/programas",
  buttonLabel: "Ver todos los programas formativos",
  cardCtaLabel: "Conocer programa",
  pageSize: 3,
  showPagination: true,
  showHelpCta: true,
  helpTitle: "¿No sabes qué programa es para ti?",
  helpDescription: "Nuestro equipo de admisiones puede orientarte en tu proceso.",
  helpPrimaryLabel: "Hablar con admisiones",
  helpPrimaryHref: "/contacto",
  helpSecondaryLabel: "Ver guía de programas",
  helpSecondaryHref: "/admision",
};

export const DEMO_FEATURE_GRID_SETTINGS: PortalFeatureGridSettings = {
  overline: "Vocación",
  title: "¿Por qué estudiar en el SEM?",
  description:
    "Formación integral para quienes responden al llamado ministerial, con excelencia académica y modalidad 100% online.",
};

export const DEMO_FEATURE_GRID: PortalFeatureItem[] = [
  {
    id: "fg1",
    title: "Formación Bíblica",
    description: "Estudio profundo de las Escrituras como fundamento del ministerio ordenado.",
    icon: "BookOpen",
    order: 0,
    visible: true,
  },
  {
    id: "fg2",
    title: "Excelencia Académica",
    description: "Programas rigurosos con acompañamiento docente de trayectoria ministerial.",
    icon: "GraduationCap",
    order: 1,
    visible: true,
  },
  {
    id: "fg3",
    title: "Modalidad 100% Online",
    description: "Estudia desde cualquier lugar sin sacrificar calidad ni comunidad formativa.",
    icon: "Monitor",
    order: 2,
    visible: true,
  },
  {
    id: "fg4",
    title: "Comunidad Nacional",
    description: "Red de seminaristas y egresados en todo Chile al servicio de la Iglesia.",
    icon: "Heart",
    order: 3,
    visible: true,
  },
];

export const DEMO_FORMATIVE_ROUTE: PortalTimelineItem[] = [
  {
    id: "route-1",
    step: 1,
    title: "Vocación",
    description: "Discernimiento del llamado y acompañamiento espiritual inicial.",
    icon: "Heart",
    order: 0,
    status: "completed",
    visible: true,
  },
  {
    id: "route-2",
    step: 2,
    title: "Formación Bíblica",
    description: "Base sólida en las Escrituras, teología y tradición de la Iglesia.",
    icon: "BookOpen",
    order: 1,
    status: "active",
    visible: true,
  },
  {
    id: "route-3",
    step: 3,
    title: "Práctica Ministerial",
    description: "Experiencia pastoral supervisada y desarrollo de habilidades de servicio.",
    icon: "Users",
    order: 2,
    status: "upcoming",
    visible: true,
  },
  {
    id: "route-4",
    step: 4,
    title: "Servicio Cristiano",
    description: "Preparación para el ministerio ordenado y la misión evangelizadora.",
    icon: "GraduationCap",
    order: 3,
    status: "upcoming",
    visible: true,
  },
];

export const DEMO_FACULTY: PersonItem[] = [
  {
    id: "jose-gonzalez",
    name: "Pr. José González Y.",
    position: "Director Nacional",
    specialty: "Teología Pastoral",
    bio: "Más de 20 años formando líderes con rigor bíblico y corazón pastoral.",
    personRole: "authority",
    personStatus: "active",
    teamGroup: "team_leadership",
    image: TEAM_DEMO_IMAGES.joseGonzalez,
    visible: true,
    order: 1,
  },
  {
    id: "hebert-cuevas",
    name: "Pr. Hebert Cuevas B.",
    position: "Sub-Director",
    specialty: "Sagrada Escritura",
    bio: "Especialista en lectura bíblica para el ministerio contemporáneo.",
    personRole: "teacher",
    personStatus: "active",
    teamGroup: "team_leadership",
    image: TEAM_DEMO_IMAGES.hebertCuevas,
    visible: true,
    order: 2,
  },
  {
    id: "carolina-cisterna",
    name: "Pra. Carolina Cisterna M.",
    position: "Coordinadora Académica",
    specialty: "Teología Sistemática",
    bio: "Docente con experiencia académica y acompañamiento de seminaristas.",
    personRole: "teacher",
    personStatus: "active",
    teamGroup: "team_leadership",
    image: TEAM_DEMO_IMAGES.carolinaCisterna,
    visible: true,
    order: 3,
  },
  {
    id: "marco-sepulveda",
    name: "Hno. Marco Sepúlveda B.",
    position: "Gestión y Calidad",
    specialty: "Administración de contenidos",
    bio: "Responsable de la gestión operativa y la calidad de los recursos formativos del seminario.",
    personRole: "staff",
    personStatus: "active",
    teamGroup: "team_technical",
    image: TEAM_DEMO_IMAGES.marcoSepulveda,
    visible: true,
    order: 4,
  },
];

export const DEMO_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "test-1",
    quote:
      "El SEM me dio una base bíblica sólida y un acompañamiento pastoral que transformó mi ministerio.",
    author: "Diácono Juan Pérez",
    role: "Generación 2022",
    program: "Iglesia Metodista, Santiago",
    image: IMG.person,
    rating: 5,
  },
  {
    id: "test-2",
    quote:
      "Estudiar online no significó estudiar solo: la comunidad y los docentes estuvieron siempre presentes.",
    author: "P. Francisco López",
    role: "Generación 2020",
    program: "Diócesis de Valparaíso",
    image: IMG.person,
    rating: 5,
  },
  {
    id: "test-3",
    quote:
      "La formación del seminario me equipó para responder con excelencia a los desafíos de la Iglesia hoy.",
    author: "Diácono Marco Torres",
    role: "Generación 2023",
    program: "Iglesia Anglicana, Concepción",
    image: IMG.person,
    rating: 5,
  },
  {
    id: "test-4",
    quote:
      "Encontré claridad vocacional y herramientas prácticas para servir con mayor confianza.",
    author: "Hna. María Soto",
    role: "Generación 2024",
    program: "Comunidad Evangélica, La Serena",
    image: IMG.person,
    rating: 5,
  },
];

export interface SeminarioCard {
  id: string;
  title: string;
  metaLine: string;
  imageUrl?: string;
  ctaLabel: string;
  ctaHref: string;
}

export const DEMO_SEMINARIOS: SeminarioCard[] = [
  {
    id: "sem-hermeneutica",
    title: "Hermenéutica bíblica",
    metaLine: "8 semanas · Online · Certificado SEM",
    imageUrl: IMG.program1,
    ctaLabel: "Postular",
    ctaHref: "/programas/hermeneutica-biblica",
  },
  {
    id: "sem-historia",
    title: "Historia de la Iglesia",
    metaLine: "10 semanas · Online · Certificado SEM",
    imageUrl: IMG.program2,
    ctaLabel: "Postular",
    ctaHref: "/programas/historia-iglesia",
  },
  {
    id: "sem-homiletica",
    title: "Homilética práctica",
    metaLine: "6 semanas · Online · Certificado SEM",
    imageUrl: IMG.program3,
    ctaLabel: "Postular",
    ctaHref: "/programas/homiletica-practica",
  },
  {
    id: "sem-pastoral",
    title: "Cuidado pastoral",
    metaLine: "8 semanas · Online · Certificado SEM",
    imageUrl: IMG.program4,
    ctaLabel: "Postular",
    ctaHref: "/programas/cuidado-pastoral",
  },
  {
    id: "sem-liturgia",
    title: "Liturgia y sacramentos",
    metaLine: "6 semanas · Online · Certificado SEM",
    imageUrl: IMG.program1,
    ctaLabel: "Postular",
    ctaHref: "/programas/liturgia-sacramentos",
  },
];

export const DEMO_NEWS: NewsItem[] = [
  {
    id: "inicio-semestre-2026",
    title: "Inicio del semestre 2026",
    excerpt:
      "Damos la bienvenida a la nueva promoción de seminaristas con una jornada de integración y oración.",
    date: "15 Mar 2026",
    category: "Institucional",
    href: "/noticias/inicio-semestre-2026",
    image: IMG.news1,
    featured: true,
    ctaLabel: "Leer más",
  },
  {
    id: "jornada-presencial-julio",
    title: "Jornada Presencial Julio",
    excerpt:
      "Encuentro formativo presencial para toda la comunidad seminarista: clases, comunidad y eucaristía.",
    date: "10 Jul 2026",
    category: "Eventos",
    href: "/noticias/jornada-presencial-julio",
    image: IMG.news2,
    ctaLabel: "Leer más",
  },
  {
    id: "apertura-admision",
    title: "Apertura Proceso de Admisión",
    excerpt:
      "Ya puedes postular a nuestros programas formativos. Conoce requisitos y fechas importantes.",
    date: "1 Jun 2026",
    category: "Admisión",
    href: "/noticias/apertura-proceso-admision",
    image: IMG.news3,
    featured: true,
    ctaLabel: "Leer más",
  },
];

export const DEMO_CTA_STATS: PortalCtaStat[] = [
  { id: "1", value: "+150", label: "estudiantes", visible: true },
  { id: "2", value: "3", label: "años formando líderes", visible: true },
  { id: "3", value: "100%", label: "modalidad online", visible: true },
  { id: "4", value: "Docentes", label: "con experiencia ministerial", visible: true },
];

export const DEMO_CTA_PREMIUM: Partial<PortalCTAPremiumSettings> = {
  overline: "Tu próximo paso",
  title: "¿Listo para transformar tu ministerio?",
  description:
    "Únete a una comunidad de formación seria, flexible y profundamente arraigada en la fe. Postula hoy o solicita orientación personalizada.",
  variant: "highlight",
  background: "primary",
  image: IMG.cta,
  imageAlt: "Comunidad seminarista del SEM",
  showStats: true,
  stats: DEMO_CTA_STATS,
};

export const DEMO_INSTITUTIONAL_CONTACT: ContactInfo = {
  email: "contacto@seminarioipn.cl",
  phone: "+56 2 2345 6789",
  whatsapp: "+56912345678",
  address: "Av. Seminario 1234, Providencia",
  city: "Santiago",
  country: "Chile",
  hours: "Lunes a viernes, 9:00 – 18:00 hrs",
};

export const DEMO_INSTITUTIONAL_SOCIAL: SocialLinks = {
  facebook: "https://facebook.com/seminarioipn",
  instagram: "https://instagram.com/seminarioipn",
  youtube: "https://youtube.com/@seminarioipn",
  linkedin: "",
  tiktok: "",
  spotify: "",
};

export function shouldUseHomeDemoContent(pageSlug?: string): boolean {
  return isHomePageSlug(pageSlug ?? "");
}

export function withHomeDemoPrograms(
  programs: ProgramItem[],
  _pageSlug?: string
): ProgramItem[] {
  return programs.length > 0 ? programs : DEMO_ACADEMIC_PROGRAMS;
}

export function mergeHomeAcademicOfferSettings(
  settings: PortalProgramsSectionSettings,
  pageSlug?: string
): PortalProgramsSectionSettings {
  if (!shouldUseHomeDemoContent(pageSlug)) return settings;

  return {
    ...settings,
    overline: DEMO_ACADEMIC_OFFER_SETTINGS.overline,
    title: DEMO_ACADEMIC_OFFER_SETTINGS.title,
    description: DEMO_ACADEMIC_OFFER_SETTINGS.description,
    showButton: settings.showButton ?? DEMO_ACADEMIC_OFFER_SETTINGS.showButton,
    buttonHref: settings.buttonHref?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.buttonHref,
    buttonLabel: DEMO_ACADEMIC_OFFER_SETTINGS.buttonLabel,
    cardCtaLabel: settings.cardCtaLabel?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.cardCtaLabel,
    pageSize: settings.pageSize ?? DEMO_ACADEMIC_OFFER_SETTINGS.pageSize,
    showPagination: settings.showPagination ?? DEMO_ACADEMIC_OFFER_SETTINGS.showPagination,
    showHelpCta: settings.showHelpCta ?? DEMO_ACADEMIC_OFFER_SETTINGS.showHelpCta,
    helpTitle: settings.helpTitle?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.helpTitle,
    helpDescription:
      settings.helpDescription?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.helpDescription,
    helpPrimaryLabel:
      settings.helpPrimaryLabel?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.helpPrimaryLabel,
    helpPrimaryHref:
      settings.helpPrimaryHref?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.helpPrimaryHref,
    helpSecondaryLabel:
      settings.helpSecondaryLabel?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.helpSecondaryLabel,
    helpSecondaryHref:
      settings.helpSecondaryHref?.trim() || DEMO_ACADEMIC_OFFER_SETTINGS.helpSecondaryHref,
  };
}

export function mergeHomeFeatureGridSettings(
  settings: PortalFeatureGridSettings,
  pageSlug?: string
): PortalFeatureGridSettings {
  if (!shouldUseHomeDemoContent(pageSlug)) return settings;

  return {
    ...settings,
    overline: DEMO_FEATURE_GRID_SETTINGS.overline,
    title: DEMO_FEATURE_GRID_SETTINGS.title,
    description: DEMO_FEATURE_GRID_SETTINGS.description,
  };
}

/** Liderazgo académico visible en home — teaser editorial */
export const HOME_FACULTY_TEASER_COUNT = 4;

export function withHomeDemoPeople(people: PersonItem[], pageSlug?: string): PersonItem[] {
  const isHome = Boolean(pageSlug && isHomePageSlug(pageSlug));
  let result = people;
  if (shouldUseHomeDemoContent(pageSlug) && people.length === 0) {
    result = DEMO_FACULTY;
  }
  return isHome ? result.slice(0, HOME_FACULTY_TEASER_COUNT) : result;
}

export function withHomeDemoNews(items: NewsItem[], pageSlug?: string): NewsItem[] {
  if (!shouldUseHomeDemoContent(pageSlug) || items.length > 0) return items;
  return DEMO_NEWS;
}

export function withHomeDemoFeatures(
  features: PortalFeatureItem[],
  pageSlug?: string
): PortalFeatureItem[] {
  if (!shouldUseHomeDemoContent(pageSlug) || features.length > 0) return features;
  return DEMO_FEATURE_GRID;
}

export function withHomeDemoTimeline(
  items: PortalTimelineItem[],
  pageSlug?: string
): PortalTimelineItem[] {
  if (!shouldUseHomeDemoContent(pageSlug) || items.length > 0) return items;
  return DEMO_FORMATIVE_ROUTE;
}

export function mergeHomeAudienceProfilesSettings(
  settings: Record<string, unknown>,
  pageSlug?: string
): Record<string, unknown> {
  if (!shouldUseHomeDemoContent(pageSlug)) return settings;
  return {
    ...settings,
    overline: settings.overline || PORTAL_001_AUDIENCE_PROFILES.overline,
    title: settings.title || PORTAL_001_AUDIENCE_PROFILES.title,
    description: settings.description || PORTAL_001_AUDIENCE_PROFILES.description,
    image: settings.image || PORTAL_001_AUDIENCE_PROFILES.image,
    imageAlt: settings.imageAlt || PORTAL_001_AUDIENCE_PROFILES.imageAlt,
    quote: settings.quote || PORTAL_001_AUDIENCE_PROFILES.quote,
    ctaLabel: settings.ctaLabel || PORTAL_001_AUDIENCE_PROFILES.ctaLabel,
    ctaHref: settings.ctaHref || PORTAL_001_AUDIENCE_PROFILES.ctaHref,
  };
}

export function withHomeDemoAudienceProfiles(
  profiles: AudienceProfileItem[],
  pageSlug?: string
): AudienceProfileItem[] {
  if (!shouldUseHomeDemoContent(pageSlug) || profiles.length > 0) return profiles;
  return PORTAL_001_AUDIENCE_PROFILES.profiles;
}

export function withHomeDemoTestimonials(
  items: TestimonialItem[],
  pageSlug?: string
): TestimonialItem[] {
  if (!shouldUseHomeDemoContent(pageSlug) || items.length > 0) return items;
  return DEMO_TESTIMONIALS;
}

export function withHomeDemoFaqItems(
  items: FaqItem[],
  pageSlug?: string
): FaqItem[] {
  if (!shouldUseHomeDemoContent(pageSlug) || items.length > 0) return items;
  return PORTAL_001_FAQ_ITEMS;
}

export function mergeHomeCtaSettings(
  settings: PortalCTAPremiumSettings,
  pageSlug?: string
): PortalCTAPremiumSettings {
  if (!shouldUseHomeDemoContent(pageSlug)) return settings;

  const hasStats =
    settings.showStats !== false &&
    Array.isArray(settings.stats) &&
    settings.stats.some((s) => s.visible !== false && s.value);

  return {
    ...DEMO_CTA_PREMIUM,
    ...settings,
    title: settings.title?.trim() || DEMO_CTA_PREMIUM.title,
    description: settings.description?.trim() || DEMO_CTA_PREMIUM.description,
    overline: settings.overline?.trim() || DEMO_CTA_PREMIUM.overline,
    image: settings.image?.trim() || DEMO_CTA_PREMIUM.image,
    imageAlt: settings.imageAlt?.trim() || DEMO_CTA_PREMIUM.imageAlt,
    showStats: settings.showStats ?? true,
    stats: hasStats ? settings.stats : DEMO_CTA_STATS,
    variant: settings.variant || "highlight",
    background: settings.background || "primary",
  };
}

function pickContactField(value: string | undefined, fallback: string): string {
  return value?.trim() ? value.trim() : fallback;
}

export function enrichInstitutionalContact(contact: ContactInfo): ContactInfo {
  return {
    email: pickContactField(contact.email, DEMO_INSTITUTIONAL_CONTACT.email),
    phone: pickContactField(contact.phone, DEMO_INSTITUTIONAL_CONTACT.phone),
    whatsapp: pickContactField(contact.whatsapp, DEMO_INSTITUTIONAL_CONTACT.whatsapp),
    address: pickContactField(contact.address, DEMO_INSTITUTIONAL_CONTACT.address),
    city: pickContactField(contact.city, DEMO_INSTITUTIONAL_CONTACT.city),
    country: pickContactField(contact.country, DEMO_INSTITUTIONAL_CONTACT.country),
    hours: pickContactField(contact.hours, DEMO_INSTITUTIONAL_CONTACT.hours),
  };
}

export function enrichInstitutionalSocial(social: SocialLinks): SocialLinks {
  return {
    facebook: pickContactField(social.facebook, DEMO_INSTITUTIONAL_SOCIAL.facebook ?? ""),
    instagram: pickContactField(social.instagram, DEMO_INSTITUTIONAL_SOCIAL.instagram ?? ""),
    youtube: pickContactField(social.youtube, DEMO_INSTITUTIONAL_SOCIAL.youtube ?? ""),
    linkedin: social.linkedin?.trim() || social.linkedin,
    tiktok: social.tiktok?.trim() || social.tiktok,
    spotify: social.spotify?.trim() || social.spotify,
  };
}

export function enrichPortalContextForHome<T extends { config: { contact: ContactInfo; social: SocialLinks } }>(
  ctx: T,
  pageSlug?: string
): T {
  if (!shouldUseHomeDemoContent(pageSlug)) return ctx;
  return {
    ...ctx,
    config: {
      ...ctx.config,
      contact: enrichInstitutionalContact(ctx.config.contact),
      social: enrichInstitutionalSocial(ctx.config.social),
    },
  };
}
