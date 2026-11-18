import type { SiteConfig, SiteConfigUpdate } from "@/types/cms";

/**
 * Cuerpo de PUT /api/cms/config.
 * Un guardado completo (Growth OS) trae las secciones enteras.
 * Mi empresa y Marca envían solo los campos que cambiaron.
 */
export type SiteConfigPatch = {
  [K in keyof SiteConfigUpdate]?: SiteConfigUpdate[K] extends object
    ? Partial<SiteConfigUpdate[K]>
    : SiteConfigUpdate[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Combina el parche sobre la ficha ya guardada.
 * Una sección ausente no se toca. Dentro de una sección, solo entran las claves presentes.
 */
export function mergeSiteConfigPatch(existing: SiteConfig, patch: SiteConfigPatch): SiteConfig {
  const next: SiteConfig = {
    ...existing,
    institution: { ...existing.institution },
    branding: { ...existing.branding, homeHeroPhotos: [...existing.branding.homeHeroPhotos] },
    seo: { ...existing.seo, keywords: [...existing.seo.keywords] },
    contact: { ...existing.contact },
    social: { ...existing.social },
    features: { ...existing.features },
    portalCopy: { ...existing.portalCopy },
    topBar: { ...existing.topBar },
    portalExperience: {
      ...existing.portalExperience,
      cursor: { ...existing.portalExperience.cursor },
      footerPremium: { ...existing.portalExperience.footerPremium },
    },
  };

  if (patch.modules) {
    next.modules = {
      heroPortal: { ...existing.modules.heroPortal, ...patch.modules.heroPortal },
      branding: { ...existing.modules.branding, ...patch.modules.branding },
      menu: { ...existing.modules.menu, ...patch.modules.menu },
      footer: { ...existing.modules.footer, ...patch.modules.footer },
      content: { ...existing.modules.content, ...patch.modules.content },
    };
  }

  if (patch.institution) {
    next.institution = { ...existing.institution, ...patch.institution };
  }
  if (patch.branding) {
    next.branding = {
      ...existing.branding,
      ...patch.branding,
      homeHeroPhotos: patch.branding.homeHeroPhotos
        ? [...patch.branding.homeHeroPhotos]
        : [...existing.branding.homeHeroPhotos],
    };
  }
  if (patch.heroPortal) {
    next.heroPortal = { ...existing.heroPortal, ...patch.heroPortal };
  }
  if (patch.seo) {
    next.seo = {
      ...existing.seo,
      ...patch.seo,
      keywords: patch.seo.keywords ? [...patch.seo.keywords] : [...existing.seo.keywords],
    };
  }
  if (patch.contact) next.contact = { ...existing.contact, ...patch.contact };
  if (patch.social) next.social = { ...existing.social, ...patch.social };
  if (patch.features) next.features = { ...existing.features, ...patch.features };
  if (patch.sitePublished !== undefined) next.sitePublished = patch.sitePublished === true;
  if (patch.portalCopy) next.portalCopy = { ...existing.portalCopy, ...patch.portalCopy };
  if (patch.topBar) next.topBar = { ...existing.topBar, ...patch.topBar };
  if (patch.portalExperience && isRecord(patch.portalExperience)) {
    const experience = patch.portalExperience;
    next.portalExperience = {
      ...existing.portalExperience,
      ...experience,
      cursor: {
        ...existing.portalExperience.cursor,
        ...(isRecord(experience.cursor) ? experience.cursor : {}),
      },
      footerPremium: {
        ...existing.portalExperience.footerPremium,
        ...(isRecord(experience.footerPremium) ? experience.footerPremium : {}),
      },
    };
  }

  return next;
}

/** Completa título y descripción solo cuando siguen vacíos. No pisa un SEO ya escrito. */
export function fillBlankSeo(config: SiteConfig): SiteConfig {
  const name = config.institution.name.trim();
  const tagline = config.institution.tagline.trim();
  const title = config.seo.title.trim() || name;
  const description =
    config.seo.description.trim() || tagline || (name ? `Sitio oficial de ${name}.` : "");
  if (title === config.seo.title && description === config.seo.description) return config;
  return {
    ...config,
    seo: {
      ...config.seo,
      title,
      description,
    },
  };
}
