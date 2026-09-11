import { semSiteBrandColors } from "@/design/tokens/colors";
import type { SiteConfig } from "@/types/cms";
import { SEM_TENANT_ID } from "@/core/tenant/constants";

/**
 * Identidad visual de SEM como **dato de T001/S001**, no como fallback de runtime.
 * Solo la migración / foundation de SEM debe aplicar estos valores.
 * Colores = pack SEM en site_config; no la paleta default Growth OS.
 */
export const SEM_SITE_IDENTITY = {
  institution: {
    name: "Seminario Eclesiástico Mayor",
    shortName: "SEM",
    organization: "IPN",
    website: "https://seminarioipn.cl",
    tagline: "Equipando a los santos para la obra del ministerio.",
  },
  branding: {
    logo: "/images/logo-sem-isotype.png",
    secondaryLogo: "/images/logo-ipn.svg",
    favicon: "/images/logo-sem-favicon.png",
    primaryColor: semSiteBrandColors.primary,
    secondaryColor: semSiteBrandColors.secondary,
    backgroundColor: semSiteBrandColors.surface,
    textColor: semSiteBrandColors.foreground,
  },
  seo: {
    title: "Seminario Eclesiástico Mayor",
    description:
      "El Seminario Eclesiástico Mayor ofrece una formación integral para quienes responden al llamado al ministerio ordenado.",
  },
  contact: {
    email: "contacto@seminarioipn.cl",
    phone: "+56 2 2345 6789",
    whatsapp: "+56912345678",
    address: "Av. Seminario 1234, Providencia",
    city: "Santiago",
    country: "Chile",
  },
  social: {
    facebook: "https://facebook.com/seminarioipn",
    instagram: "https://instagram.com/seminarioipn",
    youtube: "https://youtube.com/@seminarioipn",
  },
  topBar: {
    email: "contacto@seminarioipn.cl",
    phone: "+56 9 1234 5678",
  },
} as const;

function fillEmpty(current: string | undefined, seed: string): string {
  const trimmed = current?.trim() ?? "";
  return trimmed || seed;
}

/**
 * Completa campos vacíos de identidad visual con los valores de T001.
 * No pisa valores ya guardados. No usar fuera de foundation / migración SEM.
 */
export function applySemSiteIdentity(config: SiteConfig): SiteConfig {
  const seed = SEM_SITE_IDENTITY;
  return {
    ...config,
    institution: {
      ...config.institution,
      name: fillEmpty(config.institution.name, seed.institution.name),
      shortName: fillEmpty(config.institution.shortName, seed.institution.shortName),
      tenant: SEM_TENANT_ID,
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
      primaryColor: fillEmpty(
        config.branding.primaryColor,
        seed.branding.primaryColor
      ),
      secondaryColor: fillEmpty(
        config.branding.secondaryColor,
        seed.branding.secondaryColor
      ),
      backgroundColor: fillEmpty(
        config.branding.backgroundColor,
        seed.branding.backgroundColor
      ),
      textColor: fillEmpty(config.branding.textColor, seed.branding.textColor),
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

export function configLooksLikeSemIdentity(config: SiteConfig): boolean {
  const name = config.institution.name.trim();
  const logo = config.branding.logo.trim();
  return (
    name === SEM_SITE_IDENTITY.institution.name ||
    config.institution.shortName.trim() === SEM_SITE_IDENTITY.institution.shortName ||
    logo.includes("logo-sem") ||
    config.contact.email.includes("seminarioipn")
  );
}
