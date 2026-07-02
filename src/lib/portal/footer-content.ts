/**
 * OT-PORTAL-002 — Contenido institucional del Footer Premium SEM.
 * Fuente única editable; preparada para integración CMS posterior.
 */

import type { ExperienceAction } from "@/types/experience-action";
import type {
  PortalFooterBrandView,
  PortalFooterNavSection,
  PortalFooterPremiumViewModel,
  PortalFooterSocialItem,
} from "@/types/footer-premium";
import type { PortalContactHubViewModel } from "@/types/contact-hub";

export interface FooterContentLink {
  id: string;
  label: string;
  href: string;
  highlighted?: boolean;
}

export interface FooterContentColumn {
  id: string;
  title: string;
  links: FooterContentLink[];
}

export interface FooterCtaContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryAction: ExperienceAction;
  secondaryLabel: string;
  secondaryAction: ExperienceAction;
}

export interface FooterInstitutionContent {
  tagline: string;
  sealLine1: string;
  sealLine2: string;
  sealLine3: string;
}

export interface FooterContactContent {
  email: string;
  website: string;
  websiteLabel: string;
}

export interface FooterContactResolved {
  title: string;
  email: string;
  website: string;
  websiteHref: string;
}

export interface FooterLegalContent {
  copyrightSuffix: string;
  credits: string;
  adminLabel: string;
  adminHref: string;
}

export const SEM_FOOTER_CTA: FooterCtaContent = {
  eyebrow: "Formación ministerial",
  title: "¿Has sentido el llamado a servir a Dios?",
  description:
    "Da el siguiente paso en tu formación bíblica y ministerial junto a una comunidad comprometida con la excelencia académica y el servicio cristiano.",
  primaryLabel: "Iniciar Postulación",
  primaryAction: { type: "url", href: "/admision" },
  secondaryLabel: "Hablar con un asesor",
  secondaryAction: { type: "url", href: "/contacto" },
};

export const SEM_FOOTER_INSTITUTION: FooterInstitutionContent = {
  tagline: "Equipando a los santos para la obra del ministerio.",
  sealLine1: "RESPALDO",
  sealLine2: "INSTITUCIONAL",
  sealLine3: "IGLESIA PENTECOSTAL NAZARETH",
};

export const SEM_FOOTER_COLUMNS: FooterContentColumn[] = [
  {
    id: "admission",
    title: "Admisión",
    links: [
      { id: "how-to-apply", label: "Cómo postular", href: "/admision" },
      { id: "requirements", label: "Requisitos", href: "/admision#requisitos" },
      { id: "fees", label: "Aranceles", href: "/admision#aranceles" },
      { id: "faq", label: "Preguntas frecuentes", href: "/admision#faq" },
    ],
  },
  {
    id: "resources",
    title: "Recursos",
    links: [
      { id: "library", label: "Biblioteca", href: "/biblioteca" },
      { id: "news", label: "Noticias", href: "/noticias" },
      { id: "calendar", label: "Calendario Académico", href: "/agenda-academica" },
      { id: "regulations", label: "Reglamento", href: "/institucion#reglamento" },
      { id: "privacy", label: "Política de Privacidad", href: "/privacidad" },
    ],
  },
  {
    id: "institution",
    title: "Institución",
    links: [
      { id: "team", label: "Equipo Académico", href: "/equipo" },
      { id: "history", label: "Nuestra Historia", href: "/institucion" },
      { id: "contact", label: "Contacto", href: "/contacto" },
    ],
  },
];

export const SEM_FOOTER_CONTACT: FooterContactContent = {
  email: "contacto@seminarioipn.cl",
  website: "https://www.seminarioipn.cl",
  websiteLabel: "www.seminarioipn.cl",
};

export const SEM_FOOTER_SOCIAL_DEFAULTS = {
  facebook: "https://facebook.com/seminarioipn",
  instagram: "https://instagram.com/seminarioipn",
  youtube: "https://youtube.com/@seminarioipn",
  whatsapp: "https://wa.me/56912345678",
} as const;

export const SEM_FOOTER_LEGAL: FooterLegalContent = {
  copyrightSuffix: "Todos los derechos reservados.",
  credits: "Desarrollado por Grupo Mentor Prime · Learning OS",
  adminLabel: "Administración",
  adminHref: "/admin/config",
};

function linkToAction(href: string): ExperienceAction {
  return { type: "url", href };
}

function mapContentColumns(columns: FooterContentColumn[]): PortalFooterNavSection[] {
  return columns.map((column) => ({
    id: column.id,
    title: column.title,
    links: column.links.map((link) => ({
      id: link.id,
      label: link.label,
      action: linkToAction(link.href),
      highlighted: link.highlighted,
    })),
  }));
}

function resolveSemFooterNavigation(
  _cmsSections: PortalFooterNavSection[]
): PortalFooterNavSection[] {
  return mapContentColumns(SEM_FOOTER_COLUMNS);
}

function buildContactContent(
  contact: PortalContactHubViewModel | null,
  fallback: FooterContactContent
): FooterContactResolved {
  const channels = contact?.channels ?? [];
  const email = channels.find((c) => c.type === "email")?.value ?? fallback.email;
  const websiteLabel =
    channels.find((c) => c.type === "website")?.value ?? fallback.websiteLabel;

  return {
    title: contact?.title ?? "Contacto",
    email,
    website: websiteLabel,
    websiteHref: fallback.website,
  };
}

function mergeSocialItems(
  cmsSocial: PortalFooterSocialItem[],
  whatsapp?: string
): PortalFooterSocialItem[] {
  const defaults = SEM_FOOTER_SOCIAL_DEFAULTS;
  const phone = whatsapp?.trim() || "+56912345678";

  const catalog: PortalFooterSocialItem[] = [
    {
      id: "facebook",
      label: "Facebook",
      icon: "facebook",
      action: { type: "url", href: defaults.facebook, newTab: true },
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: "instagram",
      action: { type: "url", href: defaults.instagram, newTab: true },
    },
    {
      id: "youtube",
      label: "YouTube",
      icon: "youtube",
      action: { type: "url", href: defaults.youtube, newTab: true },
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "whatsapp",
      action: { type: "whatsapp", phone },
    },
  ];

  if (cmsSocial.length === 0) return catalog;

  const cmsById = new Map(cmsSocial.map((item) => [item.id, item]));
  return catalog.map((item) => cmsById.get(item.id) ?? item);
}

export interface ResolvedFooterContent {
  cta: FooterCtaContent;
  institution: FooterInstitutionContent;
  brand: PortalFooterBrandView;
  navigation: PortalFooterNavSection[];
  contact: FooterContactResolved;
  social: PortalFooterSocialItem[];
  legal: FooterLegalContent;
  copyright: string;
  backToTopLabel: string;
}

export function resolveFooterContent(
  viewModel: PortalFooterPremiumViewModel,
  whatsapp?: string
): ResolvedFooterContent {
  const { brand, navigation, contact, social, copyright, copyrightSuffix, credits, adminLabel, adminAction, backToTopLabel } =
    viewModel;

  const navSections = resolveSemFooterNavigation(navigation);
  const contactContent = buildContactContent(contact, SEM_FOOTER_CONTACT);

  return {
    cta: SEM_FOOTER_CTA,
    institution: {
      ...SEM_FOOTER_INSTITUTION,
      tagline: brand.tagline?.trim() || SEM_FOOTER_INSTITUTION.tagline,
    },
    brand,
    navigation: navSections,
    contact: contactContent,
    social: mergeSocialItems(social, whatsapp),
    legal: {
      copyrightSuffix: copyrightSuffix ?? SEM_FOOTER_LEGAL.copyrightSuffix,
      credits: credits ?? SEM_FOOTER_LEGAL.credits,
      adminLabel: adminLabel ?? SEM_FOOTER_LEGAL.adminLabel,
      adminHref:
        adminAction?.type === "url" ? adminAction.href : SEM_FOOTER_LEGAL.adminHref,
    },
    copyright,
    backToTopLabel,
  };
}
