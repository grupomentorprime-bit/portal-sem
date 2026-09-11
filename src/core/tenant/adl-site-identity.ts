import type { SiteConfig } from "@/types/cms";
import { adlSiteBrandColors } from "@/design/tokens/colors";
import { ADL_TENANT_ID } from "@/core/tenant/constants";

/**
 * Identidad visual mínima de Academia ADL como **dato de T002/S002**.
 * Solo el bootstrap / migración T002 aplica estos valores.
 * No es fallback de runtime ni rama `if (tenant === "adl")`.
 */
export const ADL_SITE_IDENTITY = {
  institution: {
    name: "Academia ADL",
    shortName: "ADL",
    organization: "Academia ADL",
    website: "",
    tagline: "Espacio de trabajo de Academia ADL.",
  },
  branding: {
    logo: "",
    secondaryLogo: "",
    favicon: "",
    primaryColor: adlSiteBrandColors.primary,
    secondaryColor: adlSiteBrandColors.secondary,
    backgroundColor: adlSiteBrandColors.surface,
    textColor: adlSiteBrandColors.foreground,
  },
  seo: {
    title: "Academia ADL",
    description: "Portal de Academia ADL.",
  },
  contact: {
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    country: "",
  },
  social: {
    facebook: "",
    instagram: "",
    youtube: "",
  },
  topBar: {
    email: "",
    phone: "",
  },
} as const;

function fillEmpty(current: string | undefined, seed: string): string {
  const trimmed = current?.trim() ?? "";
  return trimmed || seed;
}

/**
 * Completa campos vacíos con la identidad de bootstrap T002.
 * Colores: siempre el pack (tokens de plataforma, combinación distinta de SEM).
 * No usar fuera de foundation ADL.
 */
export function applyAdlSiteIdentity(config: SiteConfig): SiteConfig {
  const seed = ADL_SITE_IDENTITY;
  return {
    ...config,
    institution: {
      ...config.institution,
      name: fillEmpty(config.institution.name, seed.institution.name),
      shortName: fillEmpty(config.institution.shortName, seed.institution.shortName),
      tenant: ADL_TENANT_ID,
      organization: fillEmpty(
        config.institution.organization,
        seed.institution.organization
      ),
      website: fillEmpty(config.institution.website, seed.institution.website),
      tagline: fillEmpty(config.institution.tagline, seed.institution.tagline),
    },
    branding: {
      ...config.branding,
      logo: fillEmpty(config.branding.logo, seed.branding.logo),
      secondaryLogo: fillEmpty(
        config.branding.secondaryLogo,
        seed.branding.secondaryLogo
      ),
      favicon: fillEmpty(config.branding.favicon, seed.branding.favicon),
      primaryColor: seed.branding.primaryColor,
      secondaryColor: seed.branding.secondaryColor,
      backgroundColor: seed.branding.backgroundColor,
      textColor: seed.branding.textColor,
    },
    seo: {
      ...config.seo,
      title: fillEmpty(config.seo.title, seed.seo.title),
      description: fillEmpty(config.seo.description, seed.seo.description),
    },
    contact: {
      ...config.contact,
      email: fillEmpty(config.contact.email, seed.contact.email),
      phone: fillEmpty(config.contact.phone, seed.contact.phone),
      whatsapp: fillEmpty(config.contact.whatsapp, seed.contact.whatsapp),
      address: fillEmpty(config.contact.address, seed.contact.address),
      city: fillEmpty(config.contact.city, seed.contact.city),
      country: fillEmpty(config.contact.country, seed.contact.country),
    },
    social: {
      ...config.social,
      facebook: fillEmpty(config.social.facebook, seed.social.facebook),
      instagram: fillEmpty(config.social.instagram, seed.social.instagram),
      youtube: fillEmpty(config.social.youtube, seed.social.youtube),
    },
    topBar: {
      ...config.topBar,
      email: fillEmpty(config.topBar.email, seed.topBar.email),
      phone: fillEmpty(config.topBar.phone, seed.topBar.phone),
    },
  };
}

export function configLooksLikeAdlIdentity(config: SiteConfig): boolean {
  return (
    config.institution.shortName.trim() === ADL_SITE_IDENTITY.institution.shortName &&
    config.institution.name.trim() === ADL_SITE_IDENTITY.institution.name &&
    config.branding.primaryColor.trim().toLowerCase() ===
      ADL_SITE_IDENTITY.branding.primaryColor.toLowerCase()
  );
}
