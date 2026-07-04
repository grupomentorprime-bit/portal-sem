/**
 * Límites de caracteres alineados con el carrusel de testimonios en Home
 * (`.testimonials-carousel__*` — testimonials-home.css).
 *
 * Referencia visual: tarjeta activa ~380px; cita 3–4 líneas; meta en una línea.
 */
export const TESTIMONIAL_FORM_LIMITS = {
  /** Cita principal — ~3–4 líneas en la tarjeta activa */
  quote: 200,
  /** Nombre sin título (P., Diácono, etc.) */
  fullName: 28,
  /** Autor completo tal como aparece en la tarjeta (título + nombre) */
  author: 35,
  /** Línea «Generación 20XX» */
  generationRole: 20,
  /** Iglesia o comunidad (sin ciudad) */
  churchSection: 24,
  /** Ciudad o comuna */
  city: 14,
  /** Campo CMS `program`: «{iglesia}, {ciudad}» */
  program: 40,
} as const;

export const TESTIMONIAL_ROLE_OPTIONS = [
  { label: "Sin rol", value: "" },
  { label: "Alumno", value: "Alumno" },
  { label: "Alumna", value: "Alumna" },
  { label: "Líder", value: "Líder" },
  { label: "Oficial", value: "Oficial" },
  { label: "Hermano", value: "Hermano" },
  { label: "Hermana", value: "Hermana" },
  { label: "Pastor u obrero", value: "Pastor u obrero" },
  { label: "Pastor en probación", value: "Pastor en probación" },
  { label: "Pastor", value: "Pastor" },
  { label: "Pastora", value: "Pastora" },
  { label: "Diácono", value: "Diácono" },
  { label: "Diaconisa", value: "Diaconisa" },
  { label: "Pastor presbítero", value: "Pastor presbítero" },
  { label: "Presbítero", value: "Presbítero" },
  { label: "Profesor tutor", value: "Profesor tutor" },
] as const;

/** @deprecated Usar TESTIMONIAL_ROLE_OPTIONS */
export const TESTIMONIAL_HONORIFIC_OPTIONS = TESTIMONIAL_ROLE_OPTIONS;

export const TESTIMONIAL_GENERATION_NONE = "none";

export const TESTIMONIAL_GENERATION_YEARS = [
  "2023",
  "2024",
  "2025",
  "2026",
] as const;

export const TESTIMONIAL_GENERATION_OPTIONS = [
  { label: "Sin generación", value: TESTIMONIAL_GENERATION_NONE },
  ...TESTIMONIAL_GENERATION_YEARS.map((year) => ({
    label: `Generación ${year}`,
    value: year,
  })),
] as const;

export function buildTestimonialAuthor(honorific: unknown, fullName: unknown): string {
  const name = String(fullName ?? "").trim();
  const prefix = String(honorific ?? "").trim();
  if (!name) return "";
  if (!prefix) return name.slice(0, TESTIMONIAL_FORM_LIMITS.author);
  return `${prefix} ${name}`.trim().slice(0, TESTIMONIAL_FORM_LIMITS.author);
}

export function buildTestimonialProgram(churchSection: unknown, city: unknown): string {
  const church = String(churchSection ?? "").trim();
  const cityValue = String(city ?? "").trim();
  if (!church && !cityValue) return "";
  if (!cityValue) return church.slice(0, TESTIMONIAL_FORM_LIMITS.program);
  if (!church) return cityValue.slice(0, TESTIMONIAL_FORM_LIMITS.program);
  return `${church}, ${cityValue}`.slice(0, TESTIMONIAL_FORM_LIMITS.program);
}

export function formatGenerationRole(generation: unknown): string {
  const raw = String(generation ?? "").trim();
  if (!raw || raw === TESTIMONIAL_GENERATION_NONE) return "";
  if (/generaci[oó]n/i.test(raw)) {
    return raw.slice(0, TESTIMONIAL_FORM_LIMITS.generationRole);
  }
  const year = raw.match(/\d{4}/)?.[0] ?? raw;
  return `Generación ${year}`.slice(0, TESTIMONIAL_FORM_LIMITS.generationRole);
}

export function testimonialFieldHelper(
  field: keyof typeof TESTIMONIAL_FORM_LIMITS,
  hint?: string
): string {
  const max = TESTIMONIAL_FORM_LIMITS[field];
  const base = `Máximo ${max} caracteres (cabecera del carrusel en Home).`;
  return hint ? `${hint} ${base}` : base;
}

export function testimonialSubmissionPreview(data: Record<string, unknown>) {
  return {
    quote: String(data.quote ?? "").trim(),
    author: buildTestimonialAuthor(data.honorific, data.fullName),
    role: formatGenerationRole(data.generation),
    program: buildTestimonialProgram(data.churchSection, data.city),
  };
}
