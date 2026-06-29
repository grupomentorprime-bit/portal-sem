import type { SiteConfigUpdate } from "@/types/cms";

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

  const urlFields: Array<[string, string]> = [
    ["branding.logo", config.branding.logo],
    ["branding.favicon", config.branding.favicon],
    ["branding.heroImage", config.branding.heroImage],
    ["social.facebook", config.social.facebook],
    ["social.instagram", config.social.instagram],
    ["social.youtube", config.social.youtube],
    ["social.linkedin", config.social.linkedin],
    ["social.tiktok", config.social.tiktok],
  ];

  for (const [field, value] of urlFields) {
    if (value && !URL_PATTERN.test(value) && !value.startsWith("/")) {
      errors.push({
        field,
        message: "Debe ser una URL válida o ruta relativa.",
      });
    }
  }

  return errors;
}
