import type { SiteConfigUpdate } from "@/types/cms";
import { getDisplaySlides, slideHasPublishableContent } from "@/lib/cms/hero-slide-display";
import { HERO_SLIDE_MAX } from "@/types/hero-portal";

const HEX_COLOR = /^#([0-9A-Fa-f]{6})$/;
const URL_PATTERN = /^https?:\/\/.+/;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSiteConfigUpdate(
  config: SiteConfigUpdate
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.institution.name.trim()) {
    errors.push({
      field: "institution.name",
      message: "El nombre de la institución es obligatorio.",
    });
  }

  if (!config.institution.shortName.trim()) {
    errors.push({
      field: "institution.shortName",
      message: "El nombre corto es obligatorio.",
    });
  }

  if (!config.institution.tenant.trim()) {
    errors.push({
      field: "institution.tenant",
      message: "El tenant es obligatorio.",
    });
  }

  if (
    config.institution.website &&
    !URL_PATTERN.test(config.institution.website)
  ) {
    errors.push({
      field: "institution.website",
      message: "El sitio web debe ser una URL válida (http/https).",
    });
  }

  if (!["active", "maintenance", "inactive"].includes(config.institution.status)) {
    errors.push({
      field: "institution.status",
      message: "Estado de portal inválido.",
    });
  }

  for (const [key, value] of Object.entries(config.branding)) {
    if (key.endsWith("Color") && value && !HEX_COLOR.test(value)) {
      errors.push({
        field: `branding.${key}`,
        message: "El color debe estar en formato hexadecimal (#RRGGBB).",
      });
    }
  }

  const cursor = config.portalExperience?.cursor;
  if (cursor) {
    for (const [key, value] of Object.entries({
      primaryColor: cursor.primaryColor,
      secondaryColor: cursor.secondaryColor,
    })) {
      if (value && !HEX_COLOR.test(value)) {
        errors.push({
          field: `portalExperience.cursor.${key}`,
          message: "El color del cursor debe estar en formato hexadecimal (#RRGGBB).",
        });
      }
    }
  }

  if (config.contact.email && !config.contact.email.includes("@")) {
    errors.push({
      field: "contact.email",
      message: "El email no es válido.",
    });
  }

  if (!config.seo.title.trim()) {
    errors.push({
      field: "seo.title",
      message: "El título SEO es obligatorio.",
    });
  }

  if (!config.seo.description.trim()) {
    errors.push({
      field: "seo.description",
      message: "La descripción SEO es obligatoria.",
    });
  }

  const urlFields: Array<[string, string, string | undefined]> = [
    ["branding.logo", config.branding.logo, config.branding.logoMediaId],
    ["branding.favicon", config.branding.favicon, config.branding.faviconMediaId],
    ["branding.heroImage", config.branding.heroImage, config.branding.heroMediaId],
    ["social.facebook", config.social.facebook, undefined],
    ["social.instagram", config.social.instagram, undefined],
    ["social.youtube", config.social.youtube, undefined],
    ["social.linkedin", config.social.linkedin, undefined],
    ["social.tiktok", config.social.tiktok, undefined],
    ["social.spotify", config.social.spotify, undefined],
  ];

  for (const [field, value, mediaId] of urlFields) {
    if (mediaId?.startsWith("media-")) continue;
    if (value && !URL_PATTERN.test(value) && !value.startsWith("/")) {
      errors.push({
        field,
        message: "Debe ser una URL válida o ruta relativa.",
      });
    }
  }

  const heroPortal = config.heroPortal;
  if (heroPortal?.enabled) {
    if (heroPortal.slides.length === 0) {
      errors.push({
        field: "heroPortal.slides",
        message: "Agrega al menos un slide cuando el Hero está activo.",
      });
    }

    if (heroPortal.slides.length > HERO_SLIDE_MAX) {
      errors.push({
        field: "heroPortal.slides",
        message: `Máximo ${HERO_SLIDE_MAX} slides permitidos.`,
      });
    }

    const publishableSlides = heroPortal.slides.filter(slideHasPublishableContent);
    if (publishableSlides.length === 0) {
      errors.push({
        field: "heroPortal.slides",
        message: "Al menos un slide debe estar publicado o programado.",
      });
    }

    const visibleSlides = getDisplaySlides(heroPortal.slides);
    if (visibleSlides.length === 0 && publishableSlides.length > 0) {
      errors.push({
        field: "heroPortal.slides",
        message:
          "Ningún slide está visible ahora: revisa fechas de programación o estado de publicación.",
      });
    }

    for (const [index, slide] of heroPortal.slides.entries()) {
      if (!slideHasPublishableContent(slide)) continue;
      if (!slide.multimedia.desktopMediaId?.startsWith("media-")) {
        errors.push({
          field: `heroPortal.slides[${index}].multimedia.desktopMediaId`,
          message: `Slide ${index + 1}: selecciona imagen de escritorio desde la biblioteca.`,
        });
      }
    }
  }

  return errors;
}
