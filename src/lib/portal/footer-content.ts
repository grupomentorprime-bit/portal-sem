/**
 * OT-PORTAL-002 — Contenido del Footer Premium.
 * Pack SEM (T001) + resolución genérica para otros Espacios.
 */

import {
  PLATFORM_CREDITS,
  rewriteLegacyPlatformProductName,
} from "@/core/branding/display";
import { isSemTenant } from "@/core/tenant/is-sem";
import {
  SEM_CONTACT_PENDING,
  SEM_CONTACT_PUBLISHED,
  SEM_SOCIAL_PUBLISHED,
} from "@/lib/portal/sem-identity-v7";
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
  pendingNote?: string;
}

export interface FooterLegalContent {
  copyrightSuffix: string;
  credits: string;
  adminLabel: string;
  adminHref: string;
}

/** Copy CTA / sello institucional — dato T001, no default de plataforma. */
export const SEM_FOOTER_CTA: FooterCtaContent = {
  eyebrow: "Formación bíblica",
  title: "Más que aprender, servir mejor.",
  description: "Una formación bíblica para una vida de servicio.",
  primaryLabel: "Conoce Admisión",
  primaryAction: { type: "url", href: "/admision" },
  secondaryLabel: "Cómo estudiamos",
  secondaryAction: { type: "url", href: "/como-estudiamos" },
};

export const SEM_FOOTER_INSTITUTION: FooterInstitutionContent = {
  tagline: "Formación bíblica para un servicio real.",
  sealLine1: "Somos parte de",
  sealLine2: "IPN Chile",
  sealLine3: "Iglesia Pentecostal Nazareth",
};

/** Columnas de respaldo. Si el menú footer del CMS trae enlaces, esas columnas no se usan. */
export const SEM_FOOTER_COLUMNS: FooterContentColumn[] = [
  {
    id: "sem",
    title: "El SEM",
    links: [
      { id: "about", label: "Quiénes somos", href: "/el-sem/quienes-somos" },
      { id: "study", label: "Cómo estudiamos", href: "/como-estudiamos" },
      { id: "curriculum", label: "Malla", href: "/formacion/malla" },
    ],
  },
  {
    id: "access",
    title: "Admisión",
    links: [
      { id: "admission", label: "Admisión", href: "/admision" },
      { id: "campaign", label: "Admisión 2027", href: "/admision/2027" },
    ],
  },
];

export const SEM_FOOTER_CONTACT: FooterContactContent = {
  email: "",
  website: "",
  websiteLabel: "",
};

export const SEM_FOOTER_SOCIAL_DEFAULTS = {
  facebook: "https://facebook.com/seminarioipn",
  instagram: "https://instagram.com/seminarioipn",
  youtube: "https://youtube.com/@seminarioipn",
  whatsapp: "https://wa.me/56912345678",
} as const;

export const SEM_FOOTER_LEGAL: FooterLegalContent = {
  copyrightSuffix: "Todos los derechos reservados.",
  credits: `Desarrollado por Grupo Mentor Prime · ${PLATFORM_CREDITS}`,
  adminLabel: "Administración",
  adminHref: "/admin/config",
};

/** CTA genérico — sin copy de cliente. */
export const PLATFORM_FOOTER_CTA: FooterCtaContent = {
  eyebrow: "",
  title: "",
  description: "",
  primaryLabel: "",
  primaryAction: { type: "url", href: "/" },
  secondaryLabel: "",
  secondaryAction: { type: "url", href: "/" },
};

export const PLATFORM_FOOTER_INSTITUTION: FooterInstitutionContent = {
  tagline: "",
  sealLine1: "",
  sealLine2: "",
  sealLine3: "",
};

export const PLATFORM_FOOTER_LEGAL: FooterLegalContent = {
  copyrightSuffix: "Todos los derechos reservados.",
  credits: PLATFORM_CREDITS,
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
  const items = [...cmsSocial];
  const phone = whatsapp?.trim();
  if (phone && !items.some((item) => item.id === "whatsapp")) {
    items.push({
      id: "whatsapp",
      label: "WhatsApp",
      icon: "whatsapp",
      action: { type: "whatsapp", phone },
    });
  }
  return items;
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

export interface ResolveFooterContentOptions {
  tenantId?: string;
  whatsapp?: string;
}

export function resolveFooterContent(
  viewModel: PortalFooterPremiumViewModel,
  whatsappOrOptions?: string | ResolveFooterContentOptions
): ResolvedFooterContent {
  const options: ResolveFooterContentOptions =
    typeof whatsappOrOptions === "string" || whatsappOrOptions === undefined
      ? { whatsapp: whatsappOrOptions }
      : whatsappOrOptions;

  const {
    brand,
    navigation,
    contact,
    social,
    copyright,
    copyrightSuffix,
    credits,
    adminLabel,
    adminAction,
    backToTopLabel,
  } = viewModel;

  const useSem = isSemTenant(options.tenantId);
  const cmsNav = navigation.filter((section) => section.links.length > 0);
  let navSections =
    cmsNav.length > 0 ? cmsNav : useSem ? mapContentColumns(SEM_FOOTER_COLUMNS) : [];

  if (useSem && !SEM_CONTACT_PUBLISHED) {
    navSections = navSections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => {
          if (link.action.type !== "url") return true;
          const path = link.action.href.split(/[?#]/)[0]?.replace(/\/$/, "") || "/";
          return path !== "/contacto" && !path.startsWith("/contacto/");
        }),
      }))
      .filter((section) => section.links.length > 0);
  }

  const contactFallback: FooterContactContent = useSem
    ? SEM_FOOTER_CONTACT
    : { email: "", website: "", websiteLabel: "" };
  const contactContent = buildContactContent(contact, contactFallback);
  if (useSem && !SEM_CONTACT_PUBLISHED && !contactContent.email && !contactContent.website) {
    contactContent.pendingNote = SEM_CONTACT_PENDING;
  }
  const legalBase = useSem ? SEM_FOOTER_LEGAL : PLATFORM_FOOTER_LEGAL;
  const institutionBase = useSem ? SEM_FOOTER_INSTITUTION : PLATFORM_FOOTER_INSTITUTION;

  return {
    cta: useSem ? SEM_FOOTER_CTA : PLATFORM_FOOTER_CTA,
    institution: {
      ...institutionBase,
      tagline: useSem
        ? institutionBase.tagline
        : brand.tagline?.trim() || institutionBase.tagline,
    },
    brand,
    navigation: navSections,
    contact: contactContent,
    social:
      useSem && !SEM_SOCIAL_PUBLISHED
        ? []
        : mergeSocialItems(social, options.whatsapp),
    legal: {
      copyrightSuffix: copyrightSuffix ?? legalBase.copyrightSuffix,
      credits: rewriteLegacyPlatformProductName(credits ?? legalBase.credits),
      adminLabel: adminLabel ?? legalBase.adminLabel,
      adminHref:
        adminAction?.type === "url" ? adminAction.href : legalBase.adminHref,
    },
    copyright,
    backToTopLabel,
  };
}
