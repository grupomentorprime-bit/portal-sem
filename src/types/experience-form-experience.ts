/**
 * OT-FORMS-UX-005 — Configuración CMS de experiencia pública de formularios.
 * Persistida por formulario; no altera campos, respuestas ni motor de envío.
 */

import type { FormLandingTheme } from "@/lib/admin/forms-center";
import type { CmsVersionSnapshot } from "@/types/cms-shared";

export type FormExperienceInfoIcon =
  | "calendar"
  | "map-pin"
  | "users"
  | "book"
  | "heart"
  | "clock"
  | "sparkles"
  | "message"
  | "shirt"
  | "utensils"
  | "door-open"
  | "clipboard-check";

export type FormExperienceLayout =
  | "hero"
  | "minimal"
  | "institutional"
  | "landing"
  | "event";

export type FormExperienceBlockType =
  | "hero"
  | "info_cards"
  | "editorial"
  | "banners"
  | "counter"
  | "form"
  | "faq"
  | "contact"
  | "footer";

export type FormExperienceStateKey =
  | "open"
  | "closed"
  | "comingSoon"
  | "full"
  | "readonly"
  | "expired"
  | "archived"
  | "inactive"
  | "hidden"
  | "notFound";

export interface FormExperienceHero {
  enabled: boolean;
  eyebrow: string;
  headline: string;
  subheadline: string;
  motivational?: string;
  mediaId?: string;
  mediaUrl?: string;
  videoMediaId?: string;
  overlayOpacity: number;
  height: "compact" | "default" | "tall";
  heroColor?: string;
  showBreadcrumb: boolean;
  secondaryCtas: FormExperienceCta[];
}

export interface FormExperienceCta {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

export interface FormExperienceInfoCard {
  id: string;
  icon: FormExperienceInfoIcon;
  label: string;
  value: string;
  description?: string;
  href?: string;
  order: number;
  visible: boolean;
}

export interface FormExperienceEditorial {
  enabled: boolean;
  title: string;
  body: string;
}

export interface FormExperienceFormShell {
  overline?: string;
  title?: string;
  description?: string;
  helpText?: string;
  beforeSubmitText?: string;
  afterSubmitText?: string;
  submitLabel?: string;
  searchPlaceholder?: string;
  fieldPlaceholder?: string;
  successMessage?: string;
  errorMessage?: string;
  /** Mensaje al elegir "Sí, asistiré" antes de enviar. */
  attendanceYesMessage?: string;
  /** Mensaje al elegir "No podré asistir" antes de enviar. */
  attendanceNoMessage?: string;
  /** Mensaje de éxito cuando confirma asistencia (opcional). */
  attendanceYesSuccessMessage?: string;
  /** Lanzar confetti al enviar con asistencia confirmada. */
  celebrateAttendanceYes?: boolean;
}

export interface FormExperienceStateMessage {
  title: string;
  description: string;
  icon?: FormExperienceInfoIcon;
  tone?: "info" | "warning" | "neutral" | "success";
  ctaLabel?: string;
  ctaHref?: string;
}

export interface FormExperienceBanner {
  id: string;
  icon: FormExperienceInfoIcon;
  title: string;
  body?: string;
  tone: "info" | "warning" | "success" | "accent";
  priority: number;
  visible: boolean;
  order: number;
}

export interface FormExperienceCounter {
  enabled: boolean;
  label: string;
  mode: "days_until" | "slots" | "custom";
  targetDate?: string;
  /** Hora de inicio en Chile (HH:mm, 24 h). */
  targetTime?: string;
  slotsRemaining?: number;
  customText?: string;
}

export interface FormExperienceSocialLink {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

export interface FormExperienceFooter {
  enabled: boolean;
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  pastoralMessage?: string;
  verse?: string;
  copyright?: string;
  socialLinks: FormExperienceSocialLink[];
}

export interface FormExperienceSeo {
  title?: string;
  description?: string;
  openGraphImageId?: string;
  openGraphImageUrl?: string;
  keywords: string[];
}

export interface FormExperienceShare {
  whatsappText?: string;
  facebookText?: string;
  emailSubject?: string;
  emailBody?: string;
  copyLinkLabel?: string;
}

export interface FormExperienceAppearance {
  theme: FormLandingTheme;
  layout: FormExperienceLayout;
  primaryColor?: string;
  overlayOpacity: number;
  borderRadius: "soft" | "default" | "sharp";
  shadow: "none" | "soft" | "elevated";
  contentWidth: "narrow" | "default" | "wide";
  spacing: "compact" | "default" | "airy";
}

export interface FormExperienceBlock {
  id: string;
  type: FormExperienceBlockType;
  enabled: boolean;
  order: number;
}

export interface FormExperienceFaqItem {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
  order: number;
}

export interface FormExperienceFaq {
  enabled: boolean;
  title: string;
  items: FormExperienceFaqItem[];
}

export interface FormExperienceContact {
  enabled: boolean;
  title: string;
  body: string;
  email?: string;
  phone?: string;
}

export interface ExperienceFormExperience {
  _id: string;
  tenant: string;
  schemaVersion: 1;
  publishStatus: "draft" | "published";
  hero: FormExperienceHero;
  infoCards: FormExperienceInfoCard[];
  editorial: FormExperienceEditorial;
  formShell: FormExperienceFormShell;
  states: Partial<Record<FormExperienceStateKey, FormExperienceStateMessage>>;
  banners: FormExperienceBanner[];
  counter: FormExperienceCounter;
  footer: FormExperienceFooter;
  faq: FormExperienceFaq;
  contact: FormExperienceContact;
  seo: FormExperienceSeo;
  share: FormExperienceShare;
  appearance: FormExperienceAppearance;
  blocks: FormExperienceBlock[];
  templateId?: string;
  updatedAt: string;
  versions?: CmsVersionSnapshot<Partial<ExperienceFormExperience>>[];
}

export const FORM_EXPERIENCE_BLOCK_LABELS: Record<FormExperienceBlockType, string> = {
  hero: "Hero",
  info_cards: "Información",
  editorial: "Bloque editorial",
  banners: "Banners",
  counter: "Contador",
  form: "Formulario",
  faq: "Preguntas frecuentes",
  contact: "Contacto",
  footer: "Pie de página",
};

export const FORM_EXPERIENCE_TEMPLATE_IDS = [
  "convocatoria",
  "encuesta",
  "inscripcion",
  "registro",
  "postulacion",
] as const;

export type FormExperienceTemplateId = (typeof FORM_EXPERIENCE_TEMPLATE_IDS)[number];
