/**
 * OT-PORTAL-004 — Tipos del Centro de Admisión y handoff a AprendeHoy.
 * OT-PORTAL-005 — Secciones ordenables y Cierre Institucional.
 * OT-CMSV2-BUILD-001 — Motor CMS Visual 100% editable.
 */

import type { AdmissionClosingConfig } from "./admission-closing";
import type {
  ProgramsShowcaseConfig,
  ProgramsShowcaseFilter,
} from "./programs-showcase";
import type {
  CmsAnimation,
  CmsCTA,
  CmsDateItem,
  CmsFormField,
  CmsSectionLayout,
  CmsSectionSeo,
  CmsVersionSnapshot,
} from "./cms-shared";

export type AdmissionSectionId =
  | "hero"
  | "programs"
  | "why_study"
  | "profiles"
  | "requirements"
  | "dates"
  | "documents"
  | "timeline"
  | "fees"
  | "scholarships"
  | "form"
  | "faq"
  | "closing";

export interface AdmissionSectionMeta {
  id: AdmissionSectionId;
  label: string;
  enabled: boolean;
  order: number;
}

export const ADMISSION_SECTION_LABELS: Record<AdmissionSectionId, string> = {
  hero: "Hero",
  programs: "Programas",
  why_study: "¿Por qué estudiar?",
  profiles: "Perfil del postulante",
  requirements: "Requisitos",
  dates: "Fechas",
  documents: "Documentación",
  timeline: "Proceso",
  fees: "Costos",
  scholarships: "Becas",
  form: "Formulario",
  faq: "FAQ",
  closing: "Cierre institucional",
};

export interface AdmissionProfileItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  imageMediaId?: string;
  subtitle?: string;
  link?: string;
  color?: string;
  background?: string;
}

export interface AdmissionRequirementItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order?: number;
}

export interface AdmissionCalendarDates {
  applicationsOpen: string;
  applicationsClose: string;
  classesStart: string;
  note?: string;
}

export interface AdmissionFeeItem {
  id: string;
  label: string;
  value: string;
  note?: string;
  icon?: string;
  highlighted?: boolean;
  color?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface AdmissionFaqItem {
  id: string;
  question: string;
  answer: string;
  enabled?: boolean;
  order?: number;
}

export interface AdmissionDocumentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  icon?: string;
  order?: number;
}

export interface AdmissionProcessStep {
  id: string;
  step: number;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  status?: "completed" | "active" | "upcoming" | "pending";
}

export interface AdmissionScholarshipItem {
  id: string;
  kind: "scholarship" | "discount" | "agreement" | "benefit" | string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

export type AdmissionBadgeTone = "success" | "info" | "neutral";

export interface AdmissionHeroStatusBadge {
  text: string;
  icon?: string;
  tone: AdmissionBadgeTone;
  visible: boolean;
}

export type AdmissionHeroMediaPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right";

export interface AdmissionHeroMedia {
  type: "image" | "video";
  mediaId?: string;
  mobileMediaId?: string;
  videoMediaId?: string;
  imageAssetId?: string;
  mobileImageAssetId?: string;
  alt?: string;
  focalPoint?: { x: number; y: number };
  position?: AdmissionHeroMediaPosition;
  overlay?: boolean;
  overlayOpacity?: number;
  darkening?: number;
  blur?: number;
  gradient?: boolean;
  gradientOpacity?: number;
}

export interface AdmissionHeroQuote {
  visible: boolean;
  text: string;
  reference?: string;
}

/** @deprecated Usar editorialCard */
export interface AdmissionHeroClassStartCard {
  visible: boolean;
  label: string;
  date: string;
  caption?: string;
  icon?: string;
}

export interface AdmissionHeroEditorialCardRow {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  order: number;
}

export interface AdmissionHeroEditorialCardLink {
  label: string;
  href: string;
  visible: boolean;
}

export interface AdmissionHeroEditorialCard {
  visible: boolean;
  title: string;
  rows: AdmissionHeroEditorialCardRow[];
  calendarLink?: AdmissionHeroEditorialCardLink;
}

export interface AdmissionHeroAction {
  id: string;
  label: string;
  href: string;
  variant: "primary" | "secondary" | "tertiary" | "ghost";
  icon?: string;
  visible: boolean;
  order: number;
}

export interface AdmissionHeroAnimations {
  enabled: boolean;
  entrance: CmsAnimation;
  hoverElevation: boolean;
  hoverCta: boolean;
}

export interface AdmissionHeroIndicator {
  id: string;
  icon?: string;
  value: string;
  label: string;
  description?: string;
  visible: boolean;
  order: number;
  link?: string;
}

export interface AdmissionHeroMicroBenefit {
  id: string;
  icon?: string;
  text: string;
  visible: boolean;
  order: number;
}

export interface AdmissionDatesHighlightItem {
  id: string;
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
  visible: boolean;
  order: number;
}

export interface AdmissionDatesHighlight {
  enabled: boolean;
  title: string;
  statusLabel: string;
  items: AdmissionDatesHighlightItem[];
}

/** @deprecated Usar ProgramsShowcaseFilter */
export type AdmissionProgramFilterMatch = ProgramsShowcaseFilter["matchKind"];

/** @deprecated Usar ProgramsShowcaseFilter */
export type AdmissionProgramFilter = ProgramsShowcaseFilter;

/** Configuración de la sección Programas formativos */
export type AdmissionProgramsSectionConfig = ProgramsShowcaseConfig;

/** @deprecated Usar programsSection */
export type AdmissionHeroPrograms = AdmissionProgramsSectionConfig;

export interface AdmissionCalendarLabels {
  applicationsOpen: string;
  applicationsClose: string;
  classesStart: string;
}

export interface AdmissionHeroContent {
  enabled: boolean;
  eyebrow?: string;
  statusBadge: AdmissionHeroStatusBadge;
  title: string;
  highlight?: string;
  subtitle: string;
  description: string;
  media: AdmissionHeroMedia;
  /** @deprecated Sin texto sobre la imagen — mantener oculto */
  quote?: AdmissionHeroQuote;
  editorialCard?: AdmissionHeroEditorialCard;
  /** @deprecated Migrado a editorialCard */
  classStartCard?: AdmissionHeroClassStartCard;
  actions: AdmissionHeroAction[];
  indicators: AdmissionHeroIndicator[];
  microBenefits?: AdmissionHeroMicroBenefit[];
  animations?: AdmissionHeroAnimations;
  /** @deprecated Usar calendarLabels en AdmissionConfig */
  calendarDateLabels?: AdmissionCalendarLabels;
  /** @deprecated Migrado a eyebrow */
  overline?: string;
  /** @deprecated Migrado a media.imageAssetId */
  imageAssetId?: string;
  /** @deprecated Migrado a media.mediaId */
  mediaId?: string;
  /** @deprecated Migrado a media.videoMediaId */
  videoMediaId?: string;
  /** @deprecated Migrado a actions */
  primaryCta?: CmsCTA;
  /** @deprecated Migrado a actions */
  secondaryCta?: CmsCTA;
  /** @deprecated */
  seals?: import("./cms-shared").CmsSealItem[];
  /** @deprecated */
  dateLabels?: {
    applicationsLabel: string;
    classesLabel: string;
  };
  background?: import("./cms-shared").CmsBackground;
}

/** @deprecated Use sectionLayouts.why_study / profiles */
export interface AdmissionIntroContent {
  whyTitle: string;
  whyDescription: string;
  profilesTitle: string;
  profilesDescription: string;
}

export type AdmissionSectionLayouts = Partial<
  Record<AdmissionSectionId, CmsSectionLayout>
>;

export type AdmissionSectionSeo = Partial<Record<AdmissionSectionId, CmsSectionSeo>>;

export interface AdmissionSuccessContent {
  title: string;
  lead: string;
  body: string;
  invitation: string;
  links: Array<{ label: string; href: string }>;
  ctaTitle?: string;
  ctaLinks?: Array<{ label: string; href: string }>;
}

export interface AdmissionConfig {
  _id: string;
  tenant: string;
  hero: AdmissionHeroContent;
  datesHighlight: AdmissionDatesHighlight;
  programsSection: AdmissionProgramsSectionConfig;
  /** @deprecated Usar programsSection */
  heroPrograms: AdmissionProgramsSectionConfig;
  calendarLabels: AdmissionCalendarLabels;
  /** @deprecated Migrado a sectionLayouts */
  intro: AdmissionIntroContent;
  profiles: AdmissionProfileItem[];
  requirements: AdmissionRequirementItem[];
  calendar: AdmissionCalendarDates;
  calendarItems?: CmsDateItem[];
  fees: AdmissionFeeItem[];
  feesNote?: string;
  scholarships: AdmissionScholarshipItem[];
  scholarshipsDescription?: string;
  faq: AdmissionFaqItem[];
  documents: AdmissionDocumentItem[];
  processSteps: AdmissionProcessStep[];
  formTitle: string;
  formDescription: string;
  formFields: CmsFormField[];
  formSubmitLabel?: string;
  formFooterNote?: string;
  formGlobalError?: string;
  formConnectionError?: string;
  successContent?: AdmissionSuccessContent;
  sections: AdmissionSectionMeta[];
  sectionLayouts: AdmissionSectionLayouts;
  sectionSeo: AdmissionSectionSeo;
  closing: AdmissionClosingConfig;
  publishStatus?: "draft" | "published";
  versions?: CmsVersionSnapshot<Partial<AdmissionConfig>>[];
  updatedAt: string;
}

/** Registro creado por el Portal — estado terminal: interesado */
export interface PortalInteresado {
  _id?: string;
  tenant: string;
  status: "interesado";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  church: string;
  city: string;
  programId: string;
  programLabel?: string;
  message?: string;
  source: "portal-admision";
  createdAt: string;
  handoff?: {
    delivered: boolean;
    externalId?: string;
    deliveredAt?: string;
    adapter: string;
  };
}

export interface AdmissionApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  church: string;
  city: string;
  programId: string;
  message?: string;
}

export interface AdmissionHandoffPayload {
  interesadoId: string;
  tenant: string;
  portalStatus: "interesado";
  aprendeHoyTarget: "lead";
  applicant: AdmissionApplicationInput & { programLabel?: string };
  submittedAt: string;
  source: "portal-sem";
}
